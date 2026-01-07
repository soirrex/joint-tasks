import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { inject, injectable } from "inversify";
import { OnRequestHooks } from "../../common/hooks/on-request.hooks";
import { UserService } from "./user.service";

@injectable()
export class UserController {
  constructor(
    @inject(OnRequestHooks) private onRequestHooks: OnRequestHooks,
    @inject(UserService) private userService: UserService,
  ) {}

  async registerRouters(fastify: FastifyInstance) {
    fastify.get(
      "/",
      {
        onRequest: this.onRequestHooks.isAuthHook.bind(this.onRequestHooks),
        schema: {
          summary: "get user profile",
          description: "get user profile",
          tags: ["user"],
          response: {
            200: {
              description: "get user profile",
              type: "object",
              properties: {
                user: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string" },
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
      this.getUserProfile.bind(this),
    );
  }

  private async getUserProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.userId;
    const message = await this.userService.getUserProfile(userId!);
    reply.code(200).send(message);
  }
}
