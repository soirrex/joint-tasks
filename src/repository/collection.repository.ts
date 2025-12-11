import { injectable } from "inversify";
import { CollectionModel } from "../models/collection.model";

@injectable()
export class CollectionRepository {
  async createCollection(userId: string, name: string): Promise<CollectionModel> {
    const container = await CollectionModel.create({
      name: name.trim(),
      creatorId: userId,
    });

    return container.get({ plain: true });
  }

  async getCollectionById(id: number): Promise<CollectionModel | null> {
    const container = await CollectionModel.findOne({
      where: {
        id: id,
      },
      raw: true,
    });

    return container;
  }

  async deleteCollectionById(id: number): Promise<void> {
    await CollectionModel.destroy({
      where: {
        id: id,
      },
    });
  }
}
