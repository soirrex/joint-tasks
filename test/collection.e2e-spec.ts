import request from "supertest";
import { fastify } from "../src/index";
import { inversifyContainer } from "../src/container";
import { DBConfig } from "../src/config/db.config";
import { UserModel } from "../src/models/user.model";
import { Op } from "sequelize";
import { CollectionModel } from "../src/models/collection.model";
import { UserRightsModel } from "../src/models/user-rights.model";
import { TaskModel } from "../src/models/task.model";

jest.setTimeout(25000);

describe("collection e2e tests", () => {
  const db = inversifyContainer.get(DBConfig);

  // will often change in these tests
  let taskId = "";

  const mainTestUser = {
    name: "main test user",
    email: "test1@example.com",
    id: "",
    token: "",
    createdCollectionId: "",
  };

  const subTestUser = {
    name: "sub test user",
    email: "test2@example.com",
    id: "",
    token: "",
    createdCollectionId: "",
  };

  beforeAll(async () => {
    await db.init();
    await fastify.ready();

    const response1 = await request(fastify.server)
      .post("/auth/register")
      .send({
        email: mainTestUser.email,
        name: mainTestUser.name,
        password: "password",
      })
      .expect(201);

    expect(response1.headers["set-cookie"][0]).toMatch(/userToken=*/);
    mainTestUser.id = response1.body.user.id;
    mainTestUser.token = response1.header["set-cookie"][0];

    const response2 = await request(fastify.server)
      .post("/auth/register")
      .send({
        email: subTestUser.email,
        name: subTestUser.name,
        password: "password",
      })
      .expect(201);

    expect(response2.headers["set-cookie"][0]).toMatch(/userToken=*/);
    subTestUser.id = response2.body.user.id;
    subTestUser.token = response2.header["set-cookie"][0];
  });

  afterAll(async () => {
    await fastify.close();
    await UserModel.destroy({
      where: {
        email: { [Op.in]: [mainTestUser.email, subTestUser.email] },
        name: { [Op.in]: [mainTestUser.name, subTestUser.name] },
      },
    });

    db.close();
  });

  describe("POST /collections - create new collection", () => {
    it("throw error 401 if user is unauthorized", async () => {
      const response = await request(fastify.server)
        .post("/collections")
        .send({
          name: "name",
        })
        .expect(401);

      expect(response.body).toEqual({
        error: "Unauthorized",
        statusCode: 401,
        message: "Unauthorized",
      });
    });

    it("throw error 400 if some fields are missing in the body", async () => {
      const response = await request(fastify.server)
        .post("/collections")
        .send({
          n: "name",
        })
        .set("Cookie", mainTestUser.token)
        .expect(400);

      expect(response.body.error).toEqual("Bad Request");
      expect(response.body.message).toEqual("body must have required property 'name'");
    });

    it('throw error 400 if "name" is too long', async () => {
      const response = await request(fastify.server)
        .post("/collections")
        .send({
          name: "n".repeat(51),
        })
        .set("Cookie", mainTestUser.token)
        .expect(400);

      expect(response.body.error).toEqual("Bad Request");
      expect(response.body.message).toEqual("body/name must NOT have more than 50 characters");
    });

    it("create collection", async () => {
      const response = await request(fastify.server)
        .post("/collections")
        .send({
          name: "test container where mainTestUser is creator",
        })
        .set("Cookie", mainTestUser.token)
        .expect(201);

      expect(response.body.message).toEqual("Collection was created successfully");
      expect(response.body.collection).toHaveProperty("id");

      mainTestUser.createdCollectionId = response.body.collection.id;

      // create collection for sub test user
      const response2 = await request(fastify.server)
        .post("/collections")
        .send({
          name: "test container where subTestUser is creator",
        })
        .set("Cookie", subTestUser.token)
        .expect(201);

      expect(response2.body.message).toEqual("Collection was created successfully");
      subTestUser.createdCollectionId = response2.body.collection.id;
    });
  });

  describe("PATCH /collections/:collectionId/users/:userId - add user to collection or ser user rights", () => {
    it("throw error 401 if user is unauthorized", async () => {
      const response = await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/users/${subTestUser.id}`)
        .send({
          rightToCreate: false,
        })
        .expect(401);

      expect(response.body).toEqual({
        error: "Unauthorized",
        statusCode: 401,
        message: "Unauthorized",
      });
    });

    it("throw error 400 if 'collectionId' is not number", async () => {
      const response = await request(fastify.server)
        .patch(`/collections/notNumberId/users/${subTestUser.id}`)
        .send({
          rightToCreate: false,
        })
        .set("Cookie", mainTestUser.token)
        .expect(400);

      expect(response.body).toEqual({
        error: "Bad Request",
        statusCode: 400,
        message: "'collectionId' must be a number",
      });
    });

    it("throw error 404 if collection not found", async () => {
      const response = await request(fastify.server)
        .patch(`/collections/4343234267842378/users/${subTestUser.id}`)
        .send({
          rightToCreate: false,
        })
        .set("Cookie", mainTestUser.token)
        .expect(404);

      expect(response.body).toEqual({
        error: "Not Found",
        statusCode: 404,
        message: "Collection not found",
      });
    });

    it("throw error 403 if the user is not creator of the collection", async () => {
      const response = await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/users/${subTestUser.id}`)
        .send({
          rightToCreate: false,
        })
        .set("Cookie", subTestUser.token)
        .expect(403);

      expect(response.body).toEqual({
        error: "Forbidden",
        message: "Only the creator can add users to this collection",
        statusCode: 403,
      });
    });

    it("throw error 400 if the user try to set rights for yourself", async () => {
      const response = await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/users/${mainTestUser.id}`)
        .send({
          rightToCreate: false,
        })
        .set("Cookie", mainTestUser.token)
        .expect(400);

      expect(response.body).toEqual({
        error: "Bad Request",
        message: "You cannot set rights for yourself",
        statusCode: 400,
      });
    });

    it("add user to collection", async () => {
      const response = await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/users/${subTestUser.id}`)
        .send({
          rightToCreate: false,
        })
        .set("Cookie", mainTestUser.token)
        .expect(200);

      expect(response.body).toEqual({
        message: "Set user rights successfully",
        user: {
          rights: {
            changeStatus: false,
            create: false,
            delete: false,
            edit: false,
          },
          userId: expect.any(String),
        },
      });
    });
  });

  describe("GET /collections - get user collections", () => {
    it("throw error 401 if user is unauthorized", async () => {
      const response = await request(fastify.server).get(`/collections`).expect(401);

      expect(response.body).toEqual({
        error: "Unauthorized",
        statusCode: 401,
        message: "Unauthorized",
      });
    });

    it("get user collections", async () => {
      const response = await request(fastify.server)
        .get(`/collections`)
        .set("Cookie", subTestUser.token)
        .expect(200);

      expect(response.body).toEqual({
        collections: [
          {
            createdAt: expect.any(String),
            id: expect.any(String),
            isCreator: true,
            name: "test container where subTestUser is creator",
            updatedAt: expect.any(String),
            userRights: {
              rightToChangeStatus: false,
              rightToCreate: false,
              rightToDelete: false,
              rightToEdit: false,
            },
          },
          {
            createdAt: expect.any(String),
            id: expect.any(String),
            isCreator: false,
            name: "test container where mainTestUser is creator",
            updatedAt: expect.any(String),
            userRights: {
              rightToChangeStatus: false,
              rightToCreate: false,
              rightToDelete: false,
              rightToEdit: false,
            },
          },
        ],
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe("DELETE /collections/:collectionId - delete collection", () => {
    it("throw error 401 if user is unauthorized", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/${subTestUser.createdCollectionId}`)
        .expect(401);

      expect(response.body).toEqual({
        error: "Unauthorized",
        statusCode: 401,
        message: "Unauthorized",
      });
    });

    it("throw error 400 if 'collectionId' is not number", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/notNumberId`)
        .set("Cookie", subTestUser.token)
        .expect(400);

      expect(response.body).toEqual({
        error: "Bad Request",
        statusCode: 400,
        message: "'collectionId' must be a number",
      });
    });

    it("throw error 404 if collection not found", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/1323223583453492`)
        .set("Cookie", subTestUser.token)
        .expect(404);

      expect(response.body).toEqual({
        error: "Not Found",
        statusCode: 404,
        message: "Collection not found",
      });
    });

    it("throw error 401 if someone other than the creator try to delete the collection", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/${subTestUser.createdCollectionId}`)
        .set("Cookie", mainTestUser.token)
        .expect(403);

      expect(response.body).toEqual({
        statusCode: 403,
        error: "Forbidden",
        message: "Only the creator can delete the collection",
      });
    });

    it("delete collection", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/${subTestUser.createdCollectionId}`)
        .set("Cookie", subTestUser.token)
        .expect(200);

      expect(response.body).toEqual({
        message: "Collection was deleted successfully",
      });

      const collection = await CollectionModel.findOne({
        where: {
          id: subTestUser.createdCollectionId,
        },
      });

      expect(collection).toBeNull();
    });
  });

  describe("DELETE /collections/:collectionId/users/:userId - remove user from collection", () => {
    it("throw error 401 if user is unauthorized", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/${mainTestUser.createdCollectionId}/users/${subTestUser.id}`)
        .expect(401);

      expect(response.body).toEqual({
        error: "Unauthorized",
        statusCode: 401,
        message: "Unauthorized",
      });
    });

    it("throw error 400 if 'collectionId' is not number", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/notNumberId/users/${subTestUser.id}`)
        .set("Cookie", mainTestUser.token)
        .expect(400);

      expect(response.body).toEqual({
        error: "Bad Request",
        statusCode: 400,
        message: "'collectionId' must be a number",
      });
    });

    it("throw error 404 if collection not found", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/893417893421789012347908/users/${subTestUser.id}`)
        .set("Cookie", subTestUser.token)
        .expect(404);

      expect(response.body).toEqual({
        error: "Not Found",
        statusCode: 404,
        message: "Collection not found",
      });
    });

    it("throw error 403 if the user is not creator of the collection", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/${mainTestUser.createdCollectionId}/users/${subTestUser.id}`)
        .set("Cookie", subTestUser.token)
        .expect(403);

      expect(response.body).toEqual({
        error: "Forbidden",
        message: "Only the creator can remove users froma this collection",
        statusCode: 403,
      });
    });

    it("throw error 400 if the collection creator try to remove yourself", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/${mainTestUser.createdCollectionId}/users/${mainTestUser.id}`)
        .set("Cookie", mainTestUser.token)
        .expect(400);

      expect(response.body).toEqual({
        error: "Bad Request",
        message:
          "You cannot remove yourself from this collection, you are the creator of this collection",
        statusCode: 400,
      });
    });

    it("remove user from collection", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/${mainTestUser.createdCollectionId}/users/${subTestUser.id}`)
        .set("Cookie", mainTestUser.token)
        .expect(200);

      expect(response.body).toEqual({
        message: "User successfully removed from collection",
      });

      const userRights = await UserRightsModel.findOne({
        where: {
          userId: subTestUser.id,
          collectionId: mainTestUser.createdCollectionId,
        },
      });

      expect(userRights).toBeNull();

      // add user to collection again
      await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/users/${subTestUser.id}`)
        .send({
          rightToCreate: false,
        })
        .set("Cookie", mainTestUser.token)
        .expect(200);
    });
  });

  describe("POST /colelction/:collectionId/tasks - create task", () => {
    it("throw error 401 if user is unauthorized", async () => {
      const response = await request(fastify.server)
        .post(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .expect(401);

      expect(response.body).toEqual({
        error: "Unauthorized",
        statusCode: 401,
        message: "Unauthorized",
      });
    });

    it("throw error 400 if 'collectionId' is not number", async () => {
      const response = await request(fastify.server)
        .post(`/collections/notNumberId/tasks`)
        .send({
          name: "name",
          priority: "low",
        })
        .set("Cookie", subTestUser.token)
        .expect(400);

      expect(response.body).toEqual({
        error: "Bad Request",
        statusCode: 400,
        message: "'collectionId' must be a number",
      });
    });

    it("throw error 404 if collection not found", async () => {
      const response = await request(fastify.server)
        .post(`/collections/4123342134211423/tasks`)
        .send({
          name: "name",
          priority: "low",
        })
        .set("Cookie", subTestUser.token)
        .expect(404);

      expect(response.body).toEqual({
        error: "Not Found",
        statusCode: 404,
        message: "Collection not found",
      });
    });

    it("throw error 400 if required fields are missing in the body", async () => {
      const response = await request(fastify.server)
        .post(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .send({
          name: "name",
        })
        .set("Cookie", subTestUser.token)
        .expect(400);

      expect(response.body.error).toEqual("Bad Request");
      expect(response.body.message).toEqual("body must have required property 'priority'");

      const response2 = await request(fastify.server)
        .post(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .send({
          priority: "low",
        })
        .set("Cookie", subTestUser.token)
        .expect(400);

      expect(response2.body.error).toEqual("Bad Request");
      expect(response2.body.message).toEqual("body must have required property 'name'");
    });

    it('throw error 400 if "name" is too long', async () => {
      const response = await request(fastify.server)
        .post(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .send({
          name: "n".repeat(51),
          priority: "low",
        })
        .set("Cookie", subTestUser.token)
        .expect(400);

      expect(response.body.error).toEqual("Bad Request");
      expect(response.body.message).toEqual("body/name must NOT have more than 50 characters");
    });

    it('throw error 400 if "priority" is invalid', async () => {
      const response = await request(fastify.server)
        .post(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .send({
          name: "name",
          priority: "leqwqweweq",
        })
        .set("Cookie", subTestUser.token)
        .expect(400);

      expect(response.body.error).toEqual("Bad Request");
      expect(response.body.message).toEqual(
        "body/priority must be equal to one of the allowed values",
      );
    });

    it("throw erro 403 if user doesn't have rights for create tasks", async () => {
      const response = await request(fastify.server)
        .post(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .send({
          name: "name",
          priority: "low",
        })
        .set("Cookie", subTestUser.token)
        .expect(403);

      expect(response.body).toEqual({
        statusCode: 403,
        error: "Forbidden",
        message: "You don't have rights to create a new task",
      });
    });

    it("create task if the user is creator of the collectin", async () => {
      const response = await request(fastify.server)
        .post(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .send({
          name: "name",
          priority: "low",
        })
        .set("Cookie", mainTestUser.token)
        .expect(201);

      expect(response.body).toEqual({
        message: "Task created successfully",
        task: {
          createdAt: expect.any(String),
          description: "",
          id: expect.any(Number),
          name: "name",
          priority: "low",
          updatedAt: expect.any(String),
        },
      });
    });

    it("create task if user have rights", async () => {
      // change user rights
      await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/users/${subTestUser.id}`)
        .send({
          rightToCreate: true,
        })
        .set("Cookie", mainTestUser.token)
        .expect(200);

      const response = await request(fastify.server)
        .post(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .send({
          name: "two name",
          priority: "mid",
          description: "description 123",
        })
        .set("Cookie", mainTestUser.token)
        .expect(201);

      expect(response.body).toEqual({
        message: "Task created successfully",
        task: {
          createdAt: expect.any(String),
          description: "description 123",
          id: expect.any(Number),
          name: "two name",
          priority: "mid",
          updatedAt: expect.any(String),
        },
      });

      // create another task
      const task = await request(fastify.server)
        .post(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .send({
          name: "high name",
          priority: "high",
        })
        .set("Cookie", mainTestUser.token)
        .expect(201);

      taskId = task.body.task.id;

      // remove user from collection
      await request(fastify.server)
        .delete(`/collections/${mainTestUser.createdCollectionId}/users/${subTestUser.id}`)
        .set("Cookie", mainTestUser.token)
        .expect(200);
    });
  });

  describe("GET /colelction/:collectionId/tasks - get tasks from collection", () => {
    it("throw error 401 if user is unauthorized", async () => {
      const response = await request(fastify.server)
        .get(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .expect(401);

      expect(response.body).toEqual({
        error: "Unauthorized",
        statusCode: 401,
        message: "Unauthorized",
      });
    });

    it("throw error 400 if 'collectionId' is not number", async () => {
      const response = await request(fastify.server)
        .get(`/collections/notNumberId/tasks`)
        .set("Cookie", subTestUser.token)
        .expect(400);

      expect(response.body).toEqual({
        error: "Bad Request",
        statusCode: 400,
        message: "'collectionId' must be a number",
      });
    });

    it("throw error 404 if collection not found", async () => {
      const response = await request(fastify.server)
        .get(`/collections/4123342134211423/tasks`)
        .set("Cookie", subTestUser.token)
        .expect(404);

      expect(response.body).toEqual({
        error: "Not Found",
        statusCode: 404,
        message: "Collection not found",
      });
    });

    it("throw errur 403 if user doesn't have rights for read tasks", async () => {
      const response = await request(fastify.server)
        .get(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .set("Cookie", subTestUser.token)
        .expect(403);

      expect(response.body).toEqual({
        error: "Forbidden",
        message: "You don't have rights to read tasks from this container",
        statusCode: 403,
      });
    });

    it("read tasks if the user is creator of this collection", async () => {
      const response = await request(fastify.server)
        .get(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .set("Cookie", mainTestUser.token)
        .expect(200);

      expect(response.body).toEqual({
        page: 1,
        totalPages: 1,
        tasks: [
          {
            collectionId: expect.any(String),
            createdAt: expect.any(String),
            description: "",
            id: expect.any(String),
            name: "high name",
            priority: "high",
            status: "new",
            updatedAt: expect.any(String),
          },
          {
            collectionId: expect.any(String),
            createdAt: expect.any(String),
            description: "description 123",
            id: expect.any(String),
            name: "two name",
            priority: "mid",
            status: "new",
            updatedAt: expect.any(String),
          },
          {
            collectionId: expect.any(String),
            createdAt: expect.any(String),
            description: "",
            id: expect.any(String),
            name: "name",
            priority: "low",
            status: "new",
            updatedAt: expect.any(String),
          },
        ],
      });
    });

    it("get tasks if user have rights", async () => {
      // add user rights
      await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/users/${subTestUser.id}`)
        .send({
          rightToCreate: true,
        })
        .set("Cookie", mainTestUser.token)
        .expect(200);

      const response = await request(fastify.server)
        .get(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .set("Cookie", subTestUser.token)
        .expect(200);

      expect(response.body).toEqual({
        page: 1,
        totalPages: 1,
        tasks: [
          {
            collectionId: expect.any(String),
            createdAt: expect.any(String),
            description: "",
            id: expect.any(String),
            name: "high name",
            priority: "high",
            status: "new",
            updatedAt: expect.any(String),
          },
          {
            collectionId: expect.any(String),
            createdAt: expect.any(String),
            description: "description 123",
            id: expect.any(String),
            name: "two name",
            priority: "mid",
            status: "new",
            updatedAt: expect.any(String),
          },
          {
            collectionId: expect.any(String),
            createdAt: expect.any(String),
            description: "",
            id: expect.any(String),
            name: "name",
            priority: "low",
            status: "new",
            updatedAt: expect.any(String),
          },
        ],
      });
    });
  });

  describe("DELETE /colelction/:collectionId/tasks/:taskId - delete task", () => {
    it("throw error 401 if user is unauthorized", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/${mainTestUser.createdCollectionId}/tasks/${taskId}`)
        .expect(401);

      expect(response.body).toEqual({
        error: "Unauthorized",
        statusCode: 401,
        message: "Unauthorized",
      });
    });

    it("throw error 400 if 'collectionId' is not number", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/notNumberId/tasks/${taskId}`)
        .set("Cookie", subTestUser.token)
        .expect(400);

      expect(response.body).toEqual({
        error: "Bad Request",
        statusCode: 400,
        message: "'collectionId' must be a number",
      });
    });

    it("throw error 400 if 'taskId' is not number", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/${mainTestUser.createdCollectionId}/tasks/notNumberId`)
        .set("Cookie", subTestUser.token)
        .expect(400);

      expect(response.body).toEqual({
        error: "Bad Request",
        statusCode: 400,
        message: "'taskId' must be a number",
      });
    });

    it("throw error 404 if collection not found", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/1242342344231/tasks/${taskId}`)
        .set("Cookie", subTestUser.token)
        .expect(404);

      expect(response.body).toEqual({
        error: "Not Found",
        statusCode: 404,
        message: "Collection not found",
      });
    });

    it("throw error 403 if user doesn't have rights", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/${mainTestUser.createdCollectionId}/tasks/${taskId}`)
        .set("Cookie", subTestUser.token)
        .expect(403);

      expect(response.body).toEqual({
        error: "Forbidden",
        message: "You don't have rights to delete tasks from this container",
        statusCode: 403,
      });
    });

    it("delete task if the user is creator of this collection", async () => {
      const response = await request(fastify.server)
        .delete(`/collections/${mainTestUser.createdCollectionId}/tasks/${taskId}`)
        .set("Cookie", mainTestUser.token)
        .expect(200);

      expect(response.body).toEqual({
        message: "Task deleted successfully",
      });

      const task = await TaskModel.findOne({
        where: {
          id: taskId,
        },
      });

      expect(task).toBeNull();

      // create new task
      const createTask = await request(fastify.server)
        .post(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .send({
          name: "new task",
          priority: "low",
        })
        .set("Cookie", mainTestUser.token)
        .expect(201);

      taskId = createTask.body.task.id;
    });

    it("delete task if user have rights", async () => {
      // add user rights
      await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/users/${subTestUser.id}`)
        .send({
          rightToDelete: true,
        })
        .set("Cookie", mainTestUser.token)
        .expect(200);

      const response = await request(fastify.server)
        .delete(`/collections/${mainTestUser.createdCollectionId}/tasks/${taskId}`)
        .set("Cookie", subTestUser.token)
        .expect(200);

      expect(response.body).toEqual({
        message: "Task deleted successfully",
      });

      const task = await TaskModel.findOne({
        where: {
          id: taskId,
        },
      });

      expect(task).toBeNull();

      // create new task
      const createTask = await request(fastify.server)
        .post(`/collections/${mainTestUser.createdCollectionId}/tasks`)
        .send({
          name: "new task",
          priority: "low",
        })
        .set("Cookie", mainTestUser.token)
        .expect(201);

      taskId = createTask.body.task.id;
    });
  });

  describe("PUT /colelction/:collectionId/tasks/:taskId - edit task", () => {
    it("throw error 401 if user is unauthorized", async () => {
      const response = await request(fastify.server)
        .put(`/collections/${mainTestUser.createdCollectionId}/tasks/${taskId}`)
        .send({
          name: "name",
          priority: "low",
        })
        .expect(401);

      expect(response.body).toEqual({
        error: "Unauthorized",
        message: "Unauthorized",
        statusCode: 401,
      });
    });

    it("throw error 400 if 'collectionId' is not number", async () => {
      const response = await request(fastify.server)
        .put(`/collections/notNumberId/tasks/${taskId}`)
        .send({
          name: "name",
          priority: "low",
        })
        .set("Cookie", subTestUser.token)
        .expect(400);

      expect(response.body).toEqual({
        error: "Bad Request",
        statusCode: 400,
        message: "'collectionId' must be a number",
      });
    });

    it("throw error 400 if 'taskId' is not number", async () => {
      const response = await request(fastify.server)
        .put(`/collections/${mainTestUser.createdCollectionId}/tasks/notNumberId`)
        .send({
          name: "name",
          priority: "low",
        })
        .set("Cookie", subTestUser.token)
        .expect(400);

      expect(response.body).toEqual({
        error: "Bad Request",
        statusCode: 400,
        message: "'taskId' must be a number",
      });
    });

    it("throw error 404 if collection not found", async () => {
      const response = await request(fastify.server)
        .put(`/collections/253423455234/tasks/${taskId}`)
        .send({
          name: "name",
          priority: "low",
        })
        .set("Cookie", mainTestUser.token)
        .expect(404);

      expect(response.body).toEqual({
        error: "Not Found",
        statusCode: 404,
        message: "Collection not found",
      });
    });

    it("edit task if the user is creator of this collection", async () => {
      const response = await request(fastify.server)
        .put(`/collections/${mainTestUser.createdCollectionId}/tasks/${taskId}`)
        .send({
          name: "new name",
          priority: "low",
          description: "new description",
        })
        .set("Cookie", mainTestUser.token)
        .expect(200);

      expect(response.body).toEqual({
        message: "task edited successfully",
        task: {
          createdAt: expect.any(String),
          description: "new description",
          id: expect.any(Number),
          name: "new name",
          priority: "low",
          status: "new",
          updatedAt: expect.any(String),
        },
      });
    });

    it("edit task if user have rights", async () => {
      // add user rights
      await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/users/${subTestUser.id}`)
        .send({
          rightToEdit: true,
        })
        .set("Cookie", mainTestUser.token)
        .expect(200);

      const response = await request(fastify.server)
        .put(`/collections/${mainTestUser.createdCollectionId}/tasks/${taskId}`)
        .send({
          name: "new name",
          priority: "low",
          description: "description",
        })
        .set("Cookie", subTestUser.token)
        .expect(200);

      expect(response.body).toEqual({
        message: "task edited successfully",
        task: {
          createdAt: expect.any(String),
          description: "description",
          id: expect.any(Number),
          name: "new name",
          priority: "low",
          status: "new",
          updatedAt: expect.any(String),
        },
      });
    });
  });

  describe("PATCH /colelction/:collectionId/tasks/:taskId/status - change task status", () => {
    it("throw error 401 if user is unauthorized", async () => {
      const response = await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/tasks/${taskId}/status`)
        .send({
          status: "in_process",
        })
        .expect(401);

      expect(response.body).toEqual({
        error: "Unauthorized",
        message: "Unauthorized",
        statusCode: 401,
      });
    });

    it("throw error 400 if 'collectionId' is not number", async () => {
      const response = await request(fastify.server)
        .patch(`/collections/notNumberId/tasks/${taskId}/status`)
        .send({
          status: "in_process",
        })
        .set("Cookie", subTestUser.token)
        .expect(400);

      expect(response.body).toEqual({
        error: "Bad Request",
        statusCode: 400,
        message: "'collectionId' must be a number",
      });
    });

    it("throw error 400 if 'taskId' is not number", async () => {
      const response = await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/tasks/notNumberId/status`)
        .send({
          status: "in_process",
        })
        .set("Cookie", subTestUser.token)
        .expect(400);

      expect(response.body).toEqual({
        error: "Bad Request",
        statusCode: 400,
        message: "'taskId' must be a number",
      });
    });

    it("throw error 404 if collection not found", async () => {
      const response = await request(fastify.server)
        .patch(`/collections/1242342344231/tasks/${taskId}/status`)
        .set("Cookie", subTestUser.token)
        .send({
          status: "in_process",
        })
        .expect(404);

      expect(response.body).toEqual({
        error: "Not Found",
        statusCode: 404,
        message: "Collection not found",
      });
    });

    it('throw error 400 if "status" is invalid', async () => {
      const response = await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/tasks/${taskId}/status`)
        .set("Cookie", subTestUser.token)
        .send({
          status: "iqweqwe",
        })
        .expect(400);

      expect(response.body.message).toEqual(
        "body/status must be equal to one of the allowed values",
      );
      expect(response.body.statusCode).toEqual(400);
    });

    it("throw error 403 is user doesn't have rights", async () => {
      const response = await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/tasks/${taskId}/status`)
        .set("Cookie", subTestUser.token)
        .send({
          status: "in_process",
        })
        .expect(403);

      expect(response.body).toEqual({
        error: "Forbidden",
        message: "You don't have rights to change status tasks from this container",
        statusCode: 403,
      });
    });

    it("edit task if the user is creator of this collection", async () => {
      const response = await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/tasks/${taskId}/status`)
        .set("Cookie", mainTestUser.token)
        .send({
          status: "in_process",
        })
        .expect(200);

      expect(response.body).toEqual({
        message: "Change status sucessfully",
        task: {
          createdAt: expect.any(String),
          description: "description",
          id: taskId,
          name: "new name",
          priority: "low",
          status: "in_process",
          updatedAt: expect.any(String),
        },
      });
    });

    it("edit task if user have rights", async () => {
      // add user rights
      await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/users/${subTestUser.id}`)
        .send({
          rightToChangeStatus: true,
        })
        .set("Cookie", mainTestUser.token)
        .expect(200);

      const response = await request(fastify.server)
        .patch(`/collections/${mainTestUser.createdCollectionId}/tasks/${taskId}/status`)
        .set("Cookie", subTestUser.token)
        .send({
          status: "completed",
        })
        .expect(200);

      expect(response.body).toEqual({
        message: "Change status sucessfully",
        task: {
          createdAt: expect.any(String),
          description: "description",
          id: taskId,
          name: "new name",
          priority: "low",
          status: "completed",
          updatedAt: expect.any(String),
        },
      });
    });
  });
});
