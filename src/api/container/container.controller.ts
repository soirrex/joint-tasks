import { FastifyInstance } from "fastify";
import { inject, injectable } from "inversify";
import { ContainerService } from "./container.service";
import { OnRequestHooks } from "../../common/hooks/on-request.hooks";

@injectable()
export class ContainerController {
  constructor(
    @inject(ContainerService) private containerService: ContainerService,
    @inject(OnRequestHooks) private onRequestHooks: OnRequestHooks,
  ) {}

  async registerRouters(fastify: FastifyInstance) {}
}
