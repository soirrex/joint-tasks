import "reflect-metadata";
import Fastify, { type FastifyReply, FastifyRequest } from "fastify";
import { AuthController } from "./api/auth/auth.controller";
import { BaseHttpError } from "./common/classes/error.class";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyCookie from "@fastify/cookie";
import { inversifyContainer } from "./container";
import { TaskController } from "./api/task/task.controller";
import { DBConfig } from "./config/db.config";
import { CollectionController } from "./api/collection/collection.controller";

const fastify = Fastify({
  logger: true,
});

const db = inversifyContainer.get(DBConfig);
db.init();

fastify.addHook("onError", (request: FastifyRequest, reply: FastifyReply, err) => {
  if (err instanceof BaseHttpError) {
    reply.code(err.statusCode).send({
      error: err.error,
      message: err.message,
    });
  } else {
    reply.code(500).send({
      name: "InternalServerError",
      message: "InternalServerError",
    });
  }
});

fastify.register(fastifyCookie);
fastify.register(fastifySwagger, {
  openapi: {
    info: {
      title: "API documents",
      description: "API documents",
      version: "1.0.0",
    },
  },
});
fastify.addSchema({
  $id: "ErrorResponseSchema",
  type: "object",
  properties: {
    statusCode: { type: "number" },
    error: { type: "string" },
    message: { type: "string" },
  },
});
fastify.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});

const authController = inversifyContainer.get(AuthController);
fastify.register(authController.registerRouters.bind(authController), {
  prefix: "/auth",
});

const taskController = inversifyContainer.get(TaskController);
fastify.register(taskController.registerRouters.bind(taskController), {
  prefix: "/tasks",
});

const collectionController = inversifyContainer.get(CollectionController);
fastify.register(collectionController.registerRouters.bind(collectionController), {
  prefix: "/collections",
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
  }
});

export { fastify };
