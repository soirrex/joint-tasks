import { inject, injectable } from "inversify";
import { CollectionRepository } from "../../repository/collection.repository";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../../common/classes/error.class";

@injectable()
export class TaskService {
  constructor(@inject(CollectionRepository) private collectionRepository: CollectionRepository) {}

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
