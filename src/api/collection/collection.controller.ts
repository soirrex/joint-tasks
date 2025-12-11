import { FastifyInstance, FastifyReply } from "fastify";
import { inject, injectable } from "inversify";
import { CollectionService } from "./collection.service";
import { OnRequestHooks } from "../../common/hooks/on-request.hooks";
import { AuthFastifyRequest } from "../../common/interfaces/auth-request.interfase";

@injectable()
export class CollectionController {
  constructor(
    @inject(CollectionService) private collectionService: CollectionService,
    @inject(OnRequestHooks) private onRequestHooks: OnRequestHooks,
  ) {}

  async registerRouters(fastify: FastifyInstance) {
    fastify.post<{ Body: { name: string } }>(
      "/create",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "Create new collection",
          description: "Create new collection",
          tags: ["collection"],
          body: {
            type: "object",
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
      "/delete/:collectionId",
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
  }

  private async createCollection(
    request: AuthFastifyRequest & { body: { name: string } },
    reply: FastifyReply,
  ) {
    const { name } = request.body;
    const userId = request.userId;

    const message = await this.collectionService.createCollection(userId!, name);

    reply.code(201).send(message);
  }

  private async deleteCollectionById(
    request: AuthFastifyRequest & { params: { collectionId: string } },
    reply: FastifyReply,
  ) {
    const collectionId = request.params.collectionId;
    const userId = request.userId;

    const message = await this.collectionService.deleteCollectionById(userId!, collectionId);

    reply.code(201).send(message);
  }
}
