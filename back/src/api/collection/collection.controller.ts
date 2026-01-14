import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { inject, injectable } from "inversify";
import { CollectionService } from "./collection.service";
import { OnRequestHooks } from "../../common/hooks/on-request.hooks";

type CreateCollectionDto = {
  Body: {
    name: string;
  };
};

type GetUserCollectionsDto = {
  Querystring: {
    limit: number;
    page: number;
  };
};

type SetUserRightsInCollectionDto = {
  Params: { collectionId: string; userId: string };
  Body: {
    rightToCreate: boolean;
    rightToEdit: boolean;
    rightToDelete: boolean;
    rightToChangeStatus: boolean;
  };
};

type DeleteUserFromCollectionDto = {
  Params: { collectionId: string; userId: string };
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

    fastify.get<GetUserCollectionsDto>(
      "/",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "get user collections",
          description: "get user collections in which he is creator and have rights",
          tags: ["collection"],
          querystring: {
            type: "object",
            properties: {
              page: { type: "integer", minimum: 1, default: 1 },
              limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            },
          },
          response: {
            200: {
              description: "get user collections",
              type: "object",
              properties: {
                page: { type: "number" },
                totalPages: { type: "number" },
                collections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", description: "collection id" },
                      creatorId: { type: "string" },
                      isCreator: {
                        type: "boolean",
                        description: "if the user is creator of this collection",
                      },
                      name: { type: "string" },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                      userRights: {
                        type: "object",
                        properties: {
                          rightToCreate: {
                            type: "boolean",
                            description: "rights to create new tasks",
                          },
                          rightToEdit: {
                            type: "boolean",
                            description: "rights to edit tasks",
                          },
                          rightToDelete: {
                            type: "boolean",
                            description: "rights to delete tasks",
                          },
                          rightToChangeStatus: {
                            type: "boolean",
                            description: "rights to change task status",
                          },
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
      },
      this.getUserCollections.bind(this),
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

    fastify.get<{ Params: { collectionId: string } }>(
      "/:collectionId/users",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "get users who have rights in this collection",
          description: "get users who have rights in this collection",
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
              description: "the length of the userRights array is always 1",
              type: "object",
              properties: {
                users: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      email: { type: "string" },
                      name: { type: "string" },
                      userRights: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            rightToCreate: { type: "boolean" },
                            rightToEdit: { type: "boolean" },
                            rightToDelete: { type: "boolean" },
                            rightToChangeStatus: { type: "boolean" },
                          },
                          required: [
                            "rightToCreate",
                            "rightToEdit",
                            "rightToDelete",
                            "rightToChangeStatus",
                          ],
                        },
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
      this.getUsersFromCollection.bind(this),
    );

    fastify.patch<SetUserRightsInCollectionDto>(
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
      this.addUserOrSetUserRightsInCollection.bind(this),
    );

    fastify.delete<DeleteUserFromCollectionDto>(
      "/:collectionId/users/:userId",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "remove user from collection",
          description: "remove user from collection",
          tags: ["collection"],
          params: {
            type: "object",
            properties: {
              collectionId: { type: "string", description: "collection id" },
              userId: { type: "string", description: "user id" },
            },
            required: ["collectionId", "userId"],
          },
          response: {
            200: {
              description: "User successfully removed from collection",
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
      this.deleteUserFromCollection.bind(this),
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

  private async getUserCollections(
    request: FastifyRequest<GetUserCollectionsDto>,
    reply: FastifyReply,
  ) {
    const userId = request.userId;
    const { limit, page } = request.query;

    const message = await this.collectionService.getUserCollections(userId!, limit, page);

    reply.code(200).send(message);
  }

  private async getUsersFromCollection(
    request: FastifyRequest & { params: { collectionId: string } },
    reply: FastifyReply,
  ) {
    const collectionId = request.params.collectionId;
    const userId = request.userId;

    const message = await this.collectionService.getUserFromCollection(userId!, collectionId);

    reply.code(200).send(message);
  }

  private async deleteCollectionById(
    request: FastifyRequest & { params: { collectionId: string } },
    reply: FastifyReply,
  ) {
    const collectionId = request.params.collectionId;
    const userId = request.userId;

    const message = await this.collectionService.deleteCollectionById(userId!, collectionId);

    reply.code(200).send(message);
  }

  private async addUserOrSetUserRightsInCollection(
    request: FastifyRequest<SetUserRightsInCollectionDto>,
    reply: FastifyReply,
  ) {
    const collectionId = request.params.collectionId;
    const userId = request.params.userId;
    const requestUserId = request.userId;
    const { rightToCreate, rightToEdit, rightToDelete, rightToChangeStatus } = request.body;

    const message = await this.collectionService.addUserOrSetUserRightsInCollection(
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

  private async deleteUserFromCollection(
    request: FastifyRequest<DeleteUserFromCollectionDto>,
    reply: FastifyReply,
  ) {
    const collectionId = request.params.collectionId;
    const userId = request.params.userId;
    const requestUserId = request.userId;

    const message = await this.collectionService.deleteUserFromCollection(
      requestUserId!,
      userId!,
      collectionId,
    );

    reply.code(200).send(message);
  }
}
