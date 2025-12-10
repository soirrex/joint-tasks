import { FastifyRequest } from "fastify";

export interface AuthFastifyRequest extends FastifyRequest {
  userId?: string;
}
