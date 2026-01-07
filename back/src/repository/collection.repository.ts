import { injectable } from "inversify";
import { CollectionModel } from "../models/collection.model";
import { UserRightsModel } from "../models/user-rights.model";
import { BadRequestError } from "../common/classes/error.class";
import { TaskModel } from "../models/task.model";
import { literal, Op, Sequelize } from "sequelize";

@injectable()
export class CollectionRepository {
  async createCollection(userId: string, name: string): Promise<CollectionModel> {
    const container = await CollectionModel.create({
      name: name.trim(),
      creatorId: userId,
    });

    return container.get({ plain: true });
  }

  async getUserCollections(
    userId: string,
    limit: number,
    page: number,
  ): Promise<{
    collections: (CollectionModel & { userRights: UserRightsModel })[];
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const collections = await CollectionModel.findAndCountAll({
      attributes: [
        "id",
        "name",
        "createdAt",
        "updatedAt",
        [literal(`CASE WHEN "creatorId" = '${userId}' THEN true ELSE false END`), "isCreator"],
      ],
      include: [
        {
          model: UserRightsModel,
          as: "userRights",
          required: false,
          where: {
            userId: userId,
          },
          attributes: ["rightToCreate", "rightToEdit", "rightToDelete", "rightToChangeStatus"],
        },
      ],
      where: {
        [Op.or]: [{ creatorId: userId }, { "$userRights.userId$": userId }],
      },
      order: [
        [literal(`"creatorId" = '${userId}'`), "DESC"],
        ["createdAt", "DESC"],
      ],
      limit,
      offset,
      subQuery: false,
      nest: true,
      raw: true,
    });

    return {
      collections: collections.rows as (CollectionModel & { userRights: UserRightsModel })[],
      totalPages: Math.ceil(collections.count / limit),
    };
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

  async deleteUserFromCollection(userId: string, collectionId: number): Promise<void> {
    await UserRightsModel.destroy({
      where: {
        userId: userId,
        collectionId: collectionId,
      },
    });
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

  async getTasksFromCollection(
    collectionId: number,
    limit: number,
    page: number,
    statuses: string[],
    sort: string,
  ): Promise<{ tasks: TaskModel[]; totalPages: number }> {
    const offset = (page - 1) * limit;

    const tasks = await TaskModel.findAndCountAll({
      where: {
        collectionId: collectionId,
        status: {
          [Op.in]: statuses,
        },
      },
      order: [
        [
          Sequelize.literal(`CASE status
                            WHEN 'new' THEN 1
                            WHEN 'in_process' THEN 2
                            WHEN 'completed' THEN 3
                            WHEN 'canceled' THEN 4
                            END`),
          "DESC",
        ],
        [sort, "DESC"],
      ],
      limit: limit,
      offset: offset,
      raw: true,
    });

    return {
      tasks: tasks.rows,
      totalPages: Math.ceil(tasks.count / limit),
    };
  }

  async deleteTaskFromCollection(collectionId: number, taskId: number): Promise<void> {
    await TaskModel.destroy({
      where: {
        collectionId: collectionId,
        id: taskId,
      },
    });
  }

  async editTask(
    collectionId: number,
    taskId: number,
    name: string,
    priority: string,
    description?: string,
  ): Promise<TaskModel | null> {
    if (priority !== "low" && priority !== "mid" && priority !== "high") {
      throw new BadRequestError("priority must be one of the following values: low, mid, high");
    }

    const [count, rows] = await TaskModel.update(
      { name: name, priority: priority, description: description },
      {
        where: { id: taskId, collectionId: collectionId },
        returning: true,
      },
    );

    return count > 0 ? (rows[0] ?? null) : null;
  }

  async changeTaskStatus(
    collectionId: number,
    taskId: number,
    newStatus: string,
  ): Promise<TaskModel | null> {
    if (
      newStatus !== "new" &&
      newStatus !== "in_process" &&
      newStatus !== "completed" &&
      newStatus !== "canceled"
    ) {
      throw new BadRequestError(
        "status must be one of the following values: new, in_process, completed, canceled",
      );
    }

    const [count, rows] = await TaskModel.update(
      { status: newStatus },
      {
        where: { id: taskId, collectionId: collectionId },
        returning: true,
      },
    );

    return count > 0 ? (rows[0] ?? null) : null;
  }
}
