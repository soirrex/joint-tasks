import request from "supertest";
import { fastify } from "../src/index";
import { inversifyContainer } from "../src/container";
import { DBConfig } from "../src/config/db.config";
import { UserModel } from "../src/models/user.model";

jest.setTimeout(20000);

describe("auth e2e test", () => {
  const db = inversifyContainer.get(DBConfig);

  const testUser = {
    name: "test user",
    email: "test@example.com",
  };

  beforeAll(async () => {
    await db.init();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
    await UserModel.destroy({
      where: {
        email: testUser.email,
        name: testUser.name,
      },
    });
    db.close();
  });

  describe("register", () => {
    it("POST /auth/register - throw error 400 if the email field is missing", async () => {
      const response = await request(fastify.server)
        .post("/auth/register")
        .send({
          name: testUser.name,
          password: "testPassword",
        })
        .expect(400);

      expect(response.body.message).toEqual("body must have required property 'email'");
    });

    it("POST /auth/register - throw error 400 if the password field is missing", async () => {
      const response = await request(fastify.server)
        .post("/auth/register")
        .send({
          name: testUser.name,
          email: testUser.email,
        })
        .expect(400);

      expect(response.body.message).toEqual("body must have required property 'password'");
    });

    it("POST /auth/register - throw error 400 if the name field is missing", async () => {
      const response = await request(fastify.server)
        .post("/auth/register")
        .send({
          password: "testPassword",
          email: testUser.email,
        })
        .expect(400);

      expect(response.body.message).toEqual("body must have required property 'name'");
    });

    it("POST /auth/register - throw error 400 if email is invalid", async () => {
      const response = await request(fastify.server)
        .post("/auth/register")
        .send({
          email: "invalidEmail",
          name: testUser.name,
          password: "testPassword",
        })
        .expect(400);

      expect(response.body.message).toEqual('body/email must match format "email"');
    });

    it("POST /auth/register - throw error 400 if the password is less than 6 characters", async () => {
      const response = await request(fastify.server)
        .post("/auth/register")
        .send({
          email: testUser.email,
          name: testUser.name,
          password: "123",
        })
        .expect(400);

      expect(response.body.message).toEqual("body/password must NOT have fewer than 6 characters");
    });

    it("POST /auth/register - throw error 400 if the password is longer than 50 characters", async () => {
      const response = await request(fastify.server)
        .post("/auth/register")
        .send({
          email: testUser.email,
          name: testUser.name,
          password: "a".repeat(51),
        })
        .expect(400);

      expect(response.body.message).toEqual("body/password must NOT have more than 50 characters");
    });

    it("POST /auth/register - throw error 400 if the name is longer than 50 characters", async () => {
      const response = await request(fastify.server)
        .post("/auth/register")
        .send({
          email: testUser.email,
          name: "a".repeat(51),
          password: "testPassword",
        })
        .expect(400);

      expect(response.body.message).toEqual("body/name must NOT have more than 50 characters");
    });

    it("POST /auth/register - should create new user", async () => {
      const response = await request(fastify.server)
        .post("/auth/register")
        .send({
          email: testUser.email,
          name: testUser.name,
          password: "testPassword",
        })
        .expect(201);

      expect(response.headers["set-cookie"][0]).toMatch(/userToken=.*/);
      expect(response.body.message).toEqual("User registered successfully");
      expect(response.body.user).toEqual({
        id: expect.any(String),
        name: testUser.name,
        email: testUser.email,
      });
    });

    it("POST /auth/register - throw error 400 if the email already exists", async () => {
      const response = await request(fastify.server)
        .post("/auth/register")
        .send({
          email: testUser.email,
          name: testUser.name,
          password: "testPassword",
        })
        .expect(409);

      expect(response.body.message).toEqual("This email already exists");
    });
  });

  describe("login", () => {
    it("POST /auth/login - throw error 400 if the email field is missing", async () => {
      const response = await request(fastify.server)
        .post("/auth/login")
        .send({
          password: "testPassword",
        })
        .expect(400);

      expect(response.body.message).toEqual("body must have required property 'email'");
    });

    it("POST /auth/login - throw error 400 if the password field is missing", async () => {
      const response = await request(fastify.server)
        .post("/auth/login")
        .send({
          email: testUser.email,
        })
        .expect(400);

      expect(response.body.message).toEqual("body must have required property 'password'");
    });

    it("POST /auth/login - throw error 400 if password is invalid", async () => {
      const response = await request(fastify.server)
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: "invalidPassword",
        })
        .expect(403);

      expect(response.body.message).toEqual("Invalid password");
    });

    it("POST /auth/login - throw error 400 if email doesn't exists", async () => {
      const response = await request(fastify.server)
        .post("/auth/login")
        .send({
          email: "invalid@example.com",
          password: "testPassword",
        })
        .expect(404);

      expect(response.body.message).toEqual("Email not found");
    });

    it("POST /auth/login - login user successfully", async () => {
      const response = await request(fastify.server)
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: "testPassword",
        })
        .expect(200);

      expect(response.headers["set-cookie"][0]).toMatch(/userToken=.*/);
      expect(response.body.message).toEqual("Login successfully");
      expect(response.body.user).toEqual({
        id: expect.any(String),
        name: testUser.name,
        email: testUser.email,
      });
    });
  });
});
