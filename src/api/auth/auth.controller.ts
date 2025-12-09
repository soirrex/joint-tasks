import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";
import { inject, injectable } from "inversify";

interface AuthBody {
  email: string;
  password: string;
}

@injectable()
export class AuthController {
  constructor(@inject(AuthService) private authService: AuthService) {}

  async registerRouters(fastify: FastifyInstance) {
    fastify.post(
      "/register",
      {
        schema: {
          description: "Register",
          summary: "Register",
          tags: ["auth"],
          body: {
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email", maxLength: 50 },
              password: { type: "string", minLength: 6, maxLength: 50 },
            },
          },
          response: {
            201: {
              description: "User registered successfully",
              type: "object",
              properties: {
                message: { type: "string" },
              },
            },
            409: {
              description: "if this email alredy exists",
              $ref: "ErrorResponseSchema",
            },
          },
        },
      },
      this.register.bind(this),
    );

    fastify.post(
      "/login",
      {
        schema: {
          description: "Login",
          summary: "Login",
          tags: ["auth"],
          body: {
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email", maxLength: 50 },
              password: { type: "string", minLength: 6, maxLength: 50 },
            },
          },
          response: {
            200: {
              description: "Login successfully",
              type: "object",
              properties: {
                message: { type: "string" },
              },
            },
            403: {
              description: "if password is invalid",
              $ref: "ErrorResponseSchema",
            },
            404: {
              description: "if this email not found",
              $ref: "ErrorResponseSchema",
            },
          },
        },
      },
      this.login.bind(this),
    );

    fastify.post(
      "/logout",
      {
        schema: {
          description: "Logout",
          summary: "Logout",
          tags: ["auth"],
          response: {
            200: {
              description: "Logout successfully",
              type: "object",
              properties: {
                message: { type: "string" },
              },
            },
          },
        },
      },
      this.logout.bind(this),
    );
  }

  private async register(request: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) {
    const { email, password } = request.body;

    const message = await this.authService.register(email, password, reply);
    reply.code(201).send(message);
  }

  private async login(request: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) {
    const { email, password } = request.body;

    const message = await this.authService.login(email, password, reply);

    reply.code(200).send(message);
  }

  private async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie("userToken");
    reply.code(200).send({
      message: "Logout successfully",
    });
  }
}
