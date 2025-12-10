import { injectable } from "inversify";
import { ContainerModel } from "../models/container.model";

@injectable()
export class ContainerRepository {
  async createContainer(userId: string, name: string): Promise<ContainerModel> {
    const container = await ContainerModel.create({
      name: name.trim(),
      creatorId: userId,
    });

    return container.get({ plain: true });
  }

  async getContainerById(id: number): Promise<ContainerModel | null> {
    const container = await ContainerModel.findOne({
      where: {
        id: id,
      },
      raw: true,
    });

    return container;
  }

  async deleteContainerById(id: number): Promise<void> {
    await ContainerModel.destroy({
      where: {
        id: id,
      },
    });
  }
}
