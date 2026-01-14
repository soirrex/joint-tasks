import { inject, injectable } from "inversify";
import { CollectionRepository } from "../../repository/collection.repository";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../common/classes/error.class";

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

  async getUserFromCollection(userId: string, collectionId: string) {
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
      throw new ForbiddenError("You don't have rights");
    }

    const users = await this.collectionRepository.getUsersFromCollection(Number(collectionId));

    return {
      users,
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
}
