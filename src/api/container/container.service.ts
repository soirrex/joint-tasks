import { inject, injectable } from "inversify";
import { ContainerRepository } from "../../repository/container.repository";
import { BadRequestError, ForbiddeError, NotFoundError } from "../../common/classes/error.class";

@injectable()
export class ContainerService {
  constructor(@inject(ContainerRepository) private containerRepository: ContainerRepository) {}

  async createContainer(userId: string, name: string) {
    const container = await this.containerRepository.createContainer(userId, name);
    return {
      message: "Container was created successfully",
      container: {
        id: container.id,
      },
    };
  }

  async deleteContainerById(userId: string, containerId: string) {
    if (isNaN(parseInt(containerId))) {
      throw new BadRequestError("'containerId' must be a number");
    }

    const container = await this.containerRepository.getContainerById(Number(containerId));

    if (!container) {
      throw new NotFoundError("Container not found");
    }

    if (container.creatorId !== userId) {
      throw new ForbiddeError("Only the creator can delete the containera");
    }

    await this.containerRepository.deleteContainerById(Number(containerId));

    return {
      message: "Container was deleted successfully",
    };
  }
}
