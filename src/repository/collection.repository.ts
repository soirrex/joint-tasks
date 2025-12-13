import { injectable } from "inversify";
import { CollectionModel } from "../models/collection.model";
import { UserRightsModel } from "../models/user-rights.model";
import { BadRequestError } from "../common/classes/error.class";
import { TaskModel } from "../models/task.model";

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

  async setUserRightsInCollection(
    userId: string,
    collectionId: number,
    rightToCreate: boolean,
    rightToEdit: boolean,
    rightToDelete: boolean,
    rightToChangeStatus: boolean,
  ): Promise<UserRightsModel> {
    const [record, created] = await UserRightsModel.findOrCreate({
      where: {
        userId: userId,
        collectionId: collectionId,
      },
      defaults: {
        rightToCreate: rightToCreate,
        rightToEdit: rightToEdit,
        rightToDelete: rightToDelete,
        rightToChangeStatus: rightToChangeStatus,
      },
    });

    if (!created) {
      await record.update({
        rightToCreate: rightToCreate,
        rightToEdit: rightToEdit,
        rightToDelete: rightToDelete,
        rightToChangeStatus: rightToChangeStatus,
      });
    }

    return record.get({ plain: true });
  }

  async getCollectionAndUserRights(
    userId: string,
    collectionId: number,
  ): Promise<(CollectionModel & { userRights: UserRightsModel | null }) | null> {
    const collection = await CollectionModel.findOne({
      where: {
        id: collectionId,
      },
      include: {
        model: UserRightsModel,
        as: "userRights",
        where: {
          userId: userId,
        },
        required: false,
      },
      raw: true,
      nest: true,
    });

    return collection as CollectionModel & { userRights: UserRightsModel | null };
  }

  async createTaskInCollection(
    collectionId: number,
    name: string,
    priority: string,
    description?: string,
  ) {
    if (priority !== "low" && priority !== "mid" && priority !== "high") {
      throw new BadRequestError("priority must be one of the following values: low, mid, high");
    }

    const task = await TaskModel.create({
      collectionId: collectionId,
      name: name,
      priority: priority,
      description,
    });

    return task.get({ plain: true });
  }
}
