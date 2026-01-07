import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { inject, injectable } from "inversify";
import { OnRequestHooks } from "../../common/hooks/on-request.hooks";
import { TaskService } from "./task.service";

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

type DeleteTaskDto = {
  Params: { collectionId: string; taskId: string };
};

type EditTaskDto = {
  Params: { collectionId: string; taskId: string };
  Body: {
    name: string;
    description?: string;
    priority: string;
  };
};

type ChangeTaskStatusDto = {
  Params: { collectionId: string; taskId: string };
  Body: {
    status: "new" | "in_process" | "completed" | "canceled";
  };
};

@injectable()
export class TaskController {
  constructor(
    @inject(OnRequestHooks) private onRequestHooks: OnRequestHooks,
    @inject(TaskService) private taskService: TaskService,
  ) {}

  async registerRouters(fastify: FastifyInstance) {
    fastify.post<CreateTaskDto>(
      "/",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "create a new task in the collection",
          description:
            'create a new task in the collection, priority field must be only "low", "mid" or "high"',
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
      "/",
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
      this.getTasksFromCollection.bind(this),
    );

    fastify.delete<DeleteTaskDto>(
      "/:taskId",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "delete task from collection",
          description: "delete task from collection",
          tags: ["task"],
          params: {
            type: "object",
            properties: {
              collectionId: { type: "string", description: "collection id" },
              taskId: { type: "string", description: "task id" },
            },
            required: ["collectionId", "taskId"],
          },
          response: {
            200: {
              description: "Task deleted successfully",
              type: "object",
              properties: {
                message: { type: "string" },
              },
            },
            401: {
              description: "Unauthorized",
              $ref: "ErrorResponseSchema",
            },
          },
        },
      },
      this.deleteTaskFromCollection.bind(this),
    );

    fastify.put<EditTaskDto>(
      "/:taskId",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "edit task from",
          description: "edit task from collection",
          tags: ["task"],
          params: {
            type: "object",
            properties: {
              collectionId: { type: "string", description: "collection id" },
              taskId: { type: "string", description: "task id" },
            },
            required: ["collectionId", "taskId"],
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
            200: {
              description: "Task edited successfully",
              type: "object",
              properties: {
                message: { type: "string" },
                task: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    name: { type: "string" },
                    priority: { type: "string" },
                    status: { type: "string" },
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
      this.editTask.bind(this),
    );

    fastify.patch<ChangeTaskStatusDto>(
      "/:taskId/status",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "change task status",
          description: "change task status",
          tags: ["task"],
          params: {
            type: "object",
            properties: {
              collectionId: { type: "string", description: "collection id" },
              taskId: { type: "string", description: "task id" },
            },
            required: ["collectionId", "taskId"],
          },
          body: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["new", "in_process", "completed", "canceled"] },
            },
            required: ["status"],
          },
          response: {
            200: {
              description: "Task status changed successfully",
              type: "object",
              properties: {
                message: { type: "string" },
                task: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    name: { type: "string" },
                    priority: { type: "string" },
                    status: { type: "string" },
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
      this.changeTaskStatus.bind(this),
    );
  }

  async createTask(request: FastifyRequest<CreateTaskDto>, reply: FastifyReply) {
    const userId = request.userId;
    const collectionId = request.params.collectionId;
    const { name, priority, description } = request.body;

    const message = await this.taskService.createTask(
      userId!,
      collectionId,
      name,
      priority,
      description,
    );

    reply.code(201).send(message);
  }

  async getTasksFromCollection(request: FastifyRequest<GetTasksDto>, reply: FastifyReply) {
    const userId = request.userId;
    const collectionId = request.params.collectionId;
    const { limit, page, statuses, sort } = request.query;

    const message = await this.taskService.getTasksFromCollection(
      userId!,
      collectionId,
      limit,
      page,
      statuses,
      sort,
    );

    reply.code(200).send(message);
  }

  async deleteTaskFromCollection(request: FastifyRequest<DeleteTaskDto>, reply: FastifyReply) {
    const userId = request.userId;
    const collectionId = request.params.collectionId;
    const taskId = request.params.taskId;

    const message = await this.taskService.deleteTaskFromCollection(userId!, collectionId, taskId);

    reply.code(200).send(message);
  }

  async editTask(request: FastifyRequest<EditTaskDto>, reply: FastifyReply) {
    const userId = request.userId;
    const collectionId = request.params.collectionId;
    const taskId = request.params.taskId;

    const { name, priority, description } = request.body;

    const message = await this.taskService.editTask(
      userId!,
      collectionId,
      taskId,
      name,
      priority,
      description,
    );

    reply.code(200).send(message);
  }

  async changeTaskStatus(request: FastifyRequest<ChangeTaskStatusDto>, reply: FastifyReply) {
    const userId = request.userId;
    const collectionId = request.params.collectionId;
    const taskId = request.params.taskId;
    const { status } = request.body;

    const message = await this.taskService.changeTaskStatus(userId!, collectionId, taskId, status);

    reply.code(200).send(message);
  }
}
