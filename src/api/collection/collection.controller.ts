import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { inject, injectable } from "inversify";
import { CollectionService } from "./collection.service";
import { OnRequestHooks } from "../../common/hooks/on-request.hooks";

type CreateCollectionDto = {
  Body: {
    name: string;
  };
};

type AddUserToCollectionDto = {
  Params: { collectionId: string; userId: string };
  Body: {
    rightToCreate: boolean;
    rightToEdit: boolean;
    rightToDelete: boolean;
    rightToChangeStatus: boolean;
  };
};

type CreateTaskDto = {
  Params: { collectionId: string };
  Body: {
    name: string;
    description?: string;
    priority: string;
  };
};

type GetTasksDto = {
  Params: { collectionId: string };
  Querystring: {
    limit: number;
    page: number;
    sort: "createdAt" | "updatedAt" | "priority";
    statuses: ("new" | "in_process" | "completed" | "canceled")[];
  };
};

@injectable()
export class CollectionController {
  constructor(
    @inject(CollectionService) private collectionService: CollectionService,
    @inject(OnRequestHooks) private onRequestHooks: OnRequestHooks,
  ) {}

  async registerRouters(fastify: FastifyInstance) {
    fastify.post<CreateCollectionDto>(
      "/",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "Create new collection",
          description: "Create new collection",
          tags: ["collection"],
          body: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", maxLength: 50 },
            },
          },
          response: {
            201: {
              description: "Collection was created successfully",
              type: "object",
              properties: {
                message: { type: "string" },
                collection: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              $ref: "ErrorResponseSchema",
            },
          },
        },
      },
      this.createCollection.bind(this),
    );

    fastify.delete<{ Params: { collectionId: string } }>(
      "/:collectionId",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "Delete collection by id",
          description: "Delete collection by id",
          tags: ["collection"],
          params: {
            type: "object",
            properties: {
              collectionId: { type: "string", description: "collection id" },
            },
            required: ["collectionId"],
          },
          response: {
            200: {
              description: "Collection was deleted successfully",
              type: "object",
              properties: {
                message: { type: "string" },
              },
            },
            401: {
              description: "Unauthorized",
              $ref: "ErrorResponseSchema",
            },
            403: {
              description: "Only the creator can delete the collectiona",
              $ref: "ErrorResponseSchema",
            },
          },
        },
      },
      this.deleteCollectionById.bind(this),
    );

    fastify.patch<AddUserToCollectionDto>(
      "/:collectionId/users/:userId",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "set user rights in the collection",
          description:
            "set user rights in the collection. You can change user rights in the collection. If the user does not exist in the collection, they will be added",
          tags: ["collection"],
          params: {
            type: "object",
            properties: {
              collectionId: { type: "string", description: "collection id" },
              userId: { type: "string", description: "user id" },
            },
            required: ["collectionId", "userId"],
          },
          body: {
            type: "object",
            properties: {
              rightToCreate: {
                type: "boolean",
                description: "rights to create new tasks",
                default: false,
              },
              rightToEdit: {
                type: "boolean",
                description: "rights to edit tasks",
                default: false,
              },
              rightToDelete: {
                type: "boolean",
                description: "rights to delete tasks",
                default: false,
              },
              rightToChangeStatus: {
                type: "boolean",
                description: "rights to change task status",
                default: false,
              },
            },
          },
          response: {
            200: {
              description: "Set user rights successfully",
              type: "object",
              properties: {
                message: { type: "string" },
                user: {
                  type: "object",
                  properties: {
                    userId: { type: "string" },
                    rights: {
                      type: "object",
                      properties: {
                        create: { type: "boolean" },
                        edit: { type: "boolean" },
                        delete: { type: "boolean" },
                        changeStatus: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              $ref: "ErrorResponseSchema",
            },
          },
        },
      },
      this.addUserToCollection.bind(this),
    );

    fastify.post<CreateTaskDto>(
      "/:collectionId/tasks",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "create a new task in the collection",
          description:
            "create a new task in the collection. The deadline field must be in the unixtime seconds forma",
          tags: ["task"],
          params: {
            type: "object",
            properties: {
              collectionId: { type: "string", description: "collection id" },
            },
            required: ["collectionId"],
          },
          body: {
            type: "object",
            properties: {
              name: { type: "string", maxLength: 50 },
              priority: {
                type: "string",
                enum: ["low", "mid", "high"],
              },
              description: { type: "string", maxLength: 500 },
            },
            required: ["name", "priority"],
          },
          response: {
            201: {
              description: "Task created successfully",
              type: "object",
              properties: {
                message: { type: "string" },
                task: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    name: { type: "string" },
                    priority: { type: "string" },
                    description: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              $ref: "ErrorResponseSchema",
            },
          },
        },
      },
      this.createTask.bind(this),
    );

    fastify.get<GetTasksDto>(
      "/:collectionId/tasks",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "get tasks from collection",
          description: "get tasks from collections",
          tags: ["task"],
          params: {
            type: "object",
            properties: {
              collectionId: { type: "string", description: "collection id" },
            },
            required: ["collectionId"],
          },
          querystring: {
            type: "object",
            properties: {
              page: { type: "integer", minimum: 1, default: 1 },
              limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
              sort: {
                type: "string",
                enum: ["createdAt", "updatedAt", "priority"],
                default: "priority",
              },
              statuses: {
                description: "get tasks with this status",
                type: "array",
                items: {
                  type: "string",
                  enum: ["new", "in_process", "completed", "canceled"],
                },
                default: ["new", "in_process", "completed", "canceled"],
              },
            },
          },
          response: {
            200: {
              description: "Get tasks",
              type: "object",
              properties: {
                page: { type: "number" },
                totalPages: { type: "number" },
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      collectionId: { type: "string" },
                      name: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "string" },
                      status: { type: "string" },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              $ref: "ErrorResponseSchema",
            },
          },
        },
      },
      this.getTasksFromContainer.bind(this),
    );
  }

  private async createCollection(
    request: FastifyRequest<CreateCollectionDto>,
    reply: FastifyReply,
  ) {
    const { name } = request.body;
    const userId = request.userId;

    const message = await this.collectionService.createCollection(userId!, name);

    reply.code(201).send(message);
  }

  private async deleteCollectionById(
    request: FastifyRequest & { params: { collectionId: string } },
    reply: FastifyReply,
  ) {
    const collectionId = request.params.collectionId;
    const userId = request.userId;

    const message = await this.collectionService.deleteCollectionById(userId!, collectionId);

    reply.code(201).send(message);
  }

  private async addUserToCollection(
    request: FastifyRequest<AddUserToCollectionDto>,
    reply: FastifyReply,
  ) {
    const collectionId = request.params.collectionId;
    const userId = request.params.userId;
    const requestUserId = request.userId;
    const { rightToCreate, rightToEdit, rightToDelete, rightToChangeStatus } = request.body;

    const message = await this.collectionService.addUserToCollection(
      requestUserId!,
      userId!,
      collectionId,
      rightToCreate,
      rightToEdit,
      rightToDelete,
      rightToChangeStatus,
    );

    reply.code(200).send(message);
  }

  async createTask(request: FastifyRequest<CreateTaskDto>, reply: FastifyReply) {
    const userId = request.userId;
    const collectionId = request.params.collectionId;
    const { name, priority, description } = request.body;

    const message = await this.collectionService.createTask(
      userId!,
      collectionId,
      name,
      priority,
      description,
    );

    reply.code(201).send(message);
  }

  async getTasksFromContainer(request: FastifyRequest<GetTasksDto>, reply: FastifyReply) {
    const userId = request.userId;
    const collectionId = request.params.collectionId;
    const { limit, page, statuses, sort } = request.query;

    const message = await this.collectionService.getTasksFromContainer(
      userId!,
      collectionId,
      limit,
      page,
      statuses,
      sort,
    );

    reply.code(200).send(message);
  }
}
