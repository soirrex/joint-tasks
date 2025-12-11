import { inject, injectable } from "inversify";
import { CollectionRepository } from "../../repository/collection.repository";
import { BadRequestError, ForbiddeError, NotFoundError } from "../../common/classes/error.class";

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
      throw new ForbiddeError("Only the creator can delete the collectiona");
    }

    await this.collectionRepository.deleteCollectionById(Number(collectionId));

    return {
      message: "Collection was deleted successfully",
    };
  }
}
