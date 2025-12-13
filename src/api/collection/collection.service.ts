import { inject, injectable } from "inversify";
import { CollectionRepository } from "../../repository/collection.repository";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../common/classes/error.class";

@injectable()
export class CollectionService {
  constructor(@inject(CollectionRepository) private collectionRepository: CollectionRepository) {}

  async createCollection(userId: string, name: string) {
    const collection = await this.collectionRepository.createCollection(userId, name);
    return {
      message: "Collection was created successfully",
      collection: {
        id: collection.id,
      },
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
      throw new ForbiddenError("Only the creator can delete the collectiona");
    }

    await this.collectionRepository.deleteCollectionById(Number(collectionId));

    return {
      message: "Collection was deleted successfully",
    };
  }

  async addUserToCollection(
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
      throw new ConflictError("You cannot set rights for yourself");
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
    } else if (!collection.userRights) {
      throw new ForbiddenError("You don't have rights to create a new task");
    } else if (collection.userRights.rightToCreate !== true) {
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
}
