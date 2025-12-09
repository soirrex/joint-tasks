import { FastifyInstance } from "fastify";
import { inject, injectable } from "inversify";
import { TaskService } from "./task.service";

@injectable()
export class TaskController {
  constructor(@inject(TaskService) private authService: TaskService) {}

  async registerRouters(fastify: FastifyInstance) {}
}
