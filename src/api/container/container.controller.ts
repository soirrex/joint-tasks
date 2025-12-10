import { FastifyInstance, FastifyReply } from "fastify";
import { inject, injectable } from "inversify";
import { ContainerService } from "./container.service";
import { OnRequestHooks } from "../../common/hooks/on-request.hooks";
import { AuthFastifyRequest } from "../../common/interfaces/auth-request.interfase";

@injectable()
export class ContainerController {
  constructor(
    @inject(ContainerService) private containerService: ContainerService,
    @inject(OnRequestHooks) private onRequestHooks: OnRequestHooks,
  ) {}

  async registerRouters(fastify: FastifyInstance) {
    fastify.post<{ Body: { name: string } }>(
      "/create",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "Create new container",
          description: "Create new container",
          tags: ["container"],
          body: {
            type: "object",
            properties: {
              name: { type: "string", maxLength: 50 },
            },
          },
          response: {
            201: {
              description: "Container was created successfully",
              type: "object",
              properties: {
                message: { type: "string" },
                container: {
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
      this.createContainer.bind(this),
    );

    fastify.delete<{ Params: { containerId: string } }>(
      "/delete/:containerId",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "Delete container by id",
          description: "Delete container by id",
          tags: ["container"],
          params: {
            type: "object",
            properties: {
              containerId: { type: "string", description: "container id" },
            },
            required: ["containerId"],
          },
          response: {
            200: {
              description: "Container was deleted successfully",
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
              description: "Only the creator can delete the containera",
              $ref: "ErrorResponseSchema",
            },
          },
        },
      },
      this.deleteContainerById.bind(this),
    );
  }

  private async createContainer(
    request: AuthFastifyRequest & { body: { name: string } },
    reply: FastifyReply,
  ) {
    const { name } = request.body;
    const userId = request.userId;

    const message = await this.containerService.createContainer(userId!, name);

    reply.code(201).send(message);
  }

  private async deleteContainerById(
    request: AuthFastifyRequest & { params: { containerId: string } },
    reply: FastifyReply,
  ) {
    const containerId = request.params.containerId;
    const userId = request.userId;

    const message = await this.containerService.deleteContainerById(userId!, containerId);

    reply.code(201).send(message);
  }
}
