import { inject, injectable } from "inversify";
import { CollectionRepository } from "../../repository/collection.repository";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../../common/classes/error.class";

@injectable()
export class CollectionService {
  constructor(@inject(CollectionRepository) private collectionRepository: CollectionRepository) { }

  async createCollection(userId: string, name: string) {
    const collection = await this.collectionRepository.createCollection(userId, name);
    return {
      message: "Collection was created successfully",
      collection: {
        id: collection.id,
      },
    };
  }

  async getUserCollections(userId: string, limit: number, page: number) {
    const collections = await this.collectionRepository.getUserCollections(userId, limit, page);

    return {
      collections: collections.collections,
      page: page,
      totalPages: collections.totalPages,
    };
  }

  async deleteCollectionById(userId: string, collectionId: string) {
    if (isNaN(parseInt(collectionId))) {
      throw new BadRequestError("'collectionId' must be a number");
    }

    const collection = await this.collectionRepository.getCollectionById(Number(collectionId));

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    if (collection.creatorId !== userId) {
      throw new ForbiddenError("Only the creator can delete the collection");
    }

    await this.collectionRepository.deleteCollectionById(Number(collectionId));

    return {
      message: "Collection was deleted successfully",
    };
  }

  async addUserOrSetUserRightsInCollection(
    requestUserId: string,
    addUserId: string,
    collectionId: string,
    rightToCreate: boolean,
    rightToEdit: boolean,
    rightToDelete: boolean,
    rightToChangeStatus: boolean,
  ) {
    if (isNaN(parseInt(collectionId))) {
      throw new BadRequestError("'collectionId' must be a number");
    }

    const collection = await this.collectionRepository.getCollectionById(Number(collectionId));

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    if (collection.creatorId !== requestUserId) {
      throw new ForbiddenError("Only the creator can add users to this collection");
    } else if (collection.creatorId === addUserId) {
      throw new BadRequestError("You cannot set rights for yourself");
    }

    const addUser = await this.collectionRepository.setUserRightsInCollection(
      addUserId,
      Number(collectionId),
      rightToCreate,
      rightToEdit,
      rightToDelete,
      rightToChangeStatus,
    );

    return {
      message: "Set user rights successfully",
      user: {
        userId: addUser.userId,
        rights: {
          create: addUser.rightToCreate,
          edit: addUser.rightToEdit,
          delete: addUser.rightToDelete,
          changeStatus: addUser.rightToChangeStatus,
        },
      },
    };
  }

  async deleteUserFromCollection(
    requestUserId: string,
    deleteUserId: string,
    collectionId: string,
  ) {
    if (isNaN(parseInt(collectionId))) {
      throw new BadRequestError("'collectionId' must be a number");
    }

    const collection = await this.collectionRepository.getCollectionById(Number(collectionId));

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    if (collection.creatorId !== requestUserId) {
      throw new ForbiddenError("Only the creator can remove users froma this collection");
    } else if (collection.creatorId === deleteUserId) {
      throw new BadRequestError(
        "You cannot remove yourself from this collection, you are the creator of this collection",
      );
    }

    await this.collectionRepository.deleteUserFromCollection(deleteUserId, Number(collectionId));

    return {
      message: "User successfully removed from collection",
    };
  }

  async createTask(
    userId: string,
    collectionId: string,
    name: string,
    priority: string,
    description?: string,
  ) {
    if (isNaN(parseInt(collectionId))) {
      throw new BadRequestError("'collectionId' must be a number");
    }

    const collection = await this.collectionRepository.getCollectionAndUserRights(
      userId,
      Number(collectionId),
    );

    if (!collection) {
      throw new NotFoundError("Collection not found");
    } else if (collection.userRights!.rightToCreate !== true && collection.creatorId !== userId) {
      throw new ForbiddenError("You don't have rights to create a new task");
    }

    const task = await this.collectionRepository.createTaskInCollection(
      Number(collectionId),
      name,
      priority,
      description,
    );

    return {
      message: "Task created successfully",
      task: task,
    };
  }

  async getTasksFromCollection(
    userId: string,
    collectionId: string,
    limit: number,
    page: number,
    statuses: string[],
    sort: string,
  ) {
    if (isNaN(parseInt(collectionId))) {
      throw new BadRequestError("'collectionId' must be a number");
    }

    const collection = await this.collectionRepository.getCollectionAndUserRights(
      userId,
      Number(collectionId),
    );

    if (!collection) {
      throw new NotFoundError("Collection not found");
    } else if (collection.userRights!.userId !== userId && collection.creatorId !== userId) {
      throw new ForbiddenError("You don't have rights to read tasks from this container");
    }

    const tasks = await this.collectionRepository.getTasksFromCollection(
      Number(collectionId),
      limit,
      page,
      statuses,
      sort,
    );

    return {
      tasks: tasks.tasks,
      page: page,
      totalPages: tasks.totalPages,
    };
  }

  async deleteTaskFromCollection(userId: string, collectionId: string, taskId: string) {
    if (isNaN(parseInt(collectionId))) {
      throw new BadRequestError("'collectionId' must be a number");
    } else if (isNaN(parseInt(taskId))) {
      throw new BadRequestError("'taskId' must be a number");
    }

    const collection = await this.collectionRepository.getCollectionAndUserRights(
      userId,
      Number(collectionId),
    );

    if (!collection) {
      throw new NotFoundError("Collection not found");
    } else if (!collection.userRights) {
      throw new ForbiddenError("You don't have rights to delete tasks from this container");
    } else if (collection.userRights.rightToDelete !== true && collection.creatorId !== userId) {
      throw new ForbiddenError("You don't have rights to delete tasks from this container");
    }

    await this.collectionRepository.deleteTaskFromCollection(Number(collectionId), Number(taskId));

    return {
      message: "Task deleted successfully",
    };
  }

  async editTask(
    userId: string,
    collectionId: string,
    taskId: string,
    name: string,
    priority: string,
    description?: string,
  ) {
    if (isNaN(parseInt(collectionId))) {
      throw new BadRequestError("'collectionId' must be a number");
    } else if (isNaN(parseInt(taskId))) {
      throw new BadRequestError("'taskId' must be a number");
    }

    const collection = await this.collectionRepository.getCollectionAndUserRights(
      userId,
      Number(collectionId),
    );

    if (!collection) {
      throw new NotFoundError("Collection not found");
    } else if (collection.userRights!.rightToEdit !== true && collection.creatorId !== userId) {
      throw new ForbiddenError("You don't have rights to edit tasks from this container");
    }

    const task = await this.collectionRepository.editTask(
      Number(collectionId),
      Number(taskId),
      name,
      priority,
      description,
    );

    if (!task) {
      throw new InternalServerError("Failed to edit task");
    }

    return {
      message: "task edited successfully",
      task: task,
    };
  }

  async changeTaskStatus(userId: string, collectionId: string, taskId: string, newStatus: string) {
    if (isNaN(parseInt(collectionId))) {
      throw new BadRequestError("'collectionId' must be a number");
    } else if (isNaN(parseInt(taskId))) {
      throw new BadRequestError("'taskId' must be a number");
    }

    const collection = await this.collectionRepository.getCollectionAndUserRights(
      userId,
      Number(collectionId),
    );

    if (!collection) {
      throw new NotFoundError("Collection not found");
    } else if (!collection.userRights) {
      throw new ForbiddenError("You don't have rights to change status  tasks from this container");
    } else if (
      collection.userRights.rightToChangeStatus !== true &&
      collection.creatorId !== userId
    ) {
      throw new ForbiddenError("You don't have rights to change status tasks from this container");
    }

    const task = await this.collectionRepository.changeTaskStatus(
      Number(collectionId),
      Number(taskId),
      newStatus,
    );

    if (!task) {
      throw new InternalServerError("Failed to change task status");
    }

    return {
      message: "Change status sucessfully",
      task: task,
    };
  }
}
