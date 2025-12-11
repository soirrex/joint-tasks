import { BadRequestError, ForbiddeError, NotFoundError } from "../../common/classes/error.class";
import { CollectionModel } from "../../models/collection.model";
import { CollectionRepository } from "../../repository/collection.repository";
import { CollectionService } from "./collection.service";

describe("CollectionService", () => {
  let service: CollectionService;

  let mockCollectionRepository: jest.Mocked<CollectionRepository>;

  const mockCollectionModel = {
    id: 1,
    creatorId: "1",
    name: "name",
  } as unknown as CollectionModel;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollectionRepository = {
      createCollection: jest.fn(),
      getCollectionById: jest.fn(),
      deleteCollectionById: jest.fn(),
    } as unknown as jest.Mocked<CollectionRepository>;

    service = new CollectionService(mockCollectionRepository as CollectionRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create collection", () => {
    it("create collection", async () => {
      mockCollectionRepository.createCollection.mockResolvedValue(mockCollectionModel);

      const result = await service.createCollection("1", "name");

      expect(mockCollectionRepository.createCollection).toHaveBeenCalledWith("1", "name");
      expect(result).toEqual({
        message: "Collection was created successfully",
        collection: { id: 1 },
      });
    });
  });

  describe("delete collection", () => {
    it("should throw 400 if collectionId is not number", async () => {
      await expect(service.deleteCollectionById("1", "www")).rejects.toThrow(BadRequestError);
    });

    it("should throw 404 if collection not found", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(null);
      await expect(service.deleteCollectionById("1", "1")).rejects.toThrow(NotFoundError);
    });

    it("should throw 403 if userId doesn't match collection.creatorId", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(mockCollectionModel);
      await expect(service.deleteCollectionById("2", "1")).rejects.toThrow(ForbiddeError);
    });

    it("delete collection", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(mockCollectionModel);

      const result = await service.deleteCollectionById("1", "1");

      expect(result).toEqual({ message: "Collection was deleted successfully" });
      expect(mockCollectionRepository.deleteCollectionById).toHaveBeenCalledWith(1);
    });
  });
});
