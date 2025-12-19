import { BadRequestError, ForbiddenError, NotFoundError } from "../../common/classes/error.class";
import { CollectionModel } from "../../models/collection.model";
import { UserRightsModel } from "../../models/user-rights.model";
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

  const mockCollectionWithUserRights = {
    id: 1,
    name: "colelction",
    isCreator: true,
    creatorId: "1",
    createdAt: "2025-12-15T13:07:48.718Z",
    updatedAt: "2025-12-15T13:07:48.718Z",
    userRights: {
      userId: "2",
      rightToCreate: false,
      rightToEdit: false,
      rightToDelete: false,
      rightToChangeStatus: false,
    },
  } as unknown as CollectionModel & { userRights: UserRightsModel };

  const mockUserRightsModel = {
    userId: "1",
    collectionId: "1",
    rightToCreate: false,
    rightToEdit: false,
    rightToDelete: false,
    rightToChangeStatus: false,
  } as unknown as UserRightsModel;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollectionRepository = {
      createCollection: jest.fn(),
      getCollectionById: jest.fn(),
      deleteCollectionById: jest.fn(),
      getUserCollections: jest.fn(),
      setUserRightsInCollection: jest.fn(),
      deleteUserFromCollection: jest.fn(),
      getCollectionAndUserRights: jest.fn(),
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

  describe("get user collections", () => {
    it("get user collections", async () => {
      mockCollectionRepository.getUserCollections.mockResolvedValue({
        totalPages: 1,
        collections: [mockCollectionWithUserRights],
      });

      const result = await service.getUserCollections("1", 20, 1);

      expect(result).toEqual({
        page: 1,
        totalPages: 1,
        collections: [mockCollectionWithUserRights],
      });
    });
  });

  describe("delete collection", () => {
    it("should throw 400 if collectionId is not number", async () => {
      await expect(service.deleteCollectionById("1", "invalidId")).rejects.toThrow(BadRequestError);
    });

    it("should throw 404 if collection not found", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(null);
      await expect(service.deleteCollectionById("1", "1")).rejects.toThrow(NotFoundError);
    });

    it("should throw 403 if userId doesn't match collection.creatorId", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(mockCollectionModel);
      await expect(service.deleteCollectionById("2", "1")).rejects.toThrow(ForbiddenError);
    });

    it("delete collection", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(mockCollectionModel);

      const result = await service.deleteCollectionById("1", "1");

      expect(result).toEqual({ message: "Collection was deleted successfully" });
      expect(mockCollectionRepository.deleteCollectionById).toHaveBeenCalledWith(1);
    });
  });

  describe("add user or set user rights in collections", () => {
    it("should throw 400 if collectionId is not number", async () => {
      await expect(
        service.addUserOrSetUserRightsInCollection(
          "1",
          "2",
          "invalidId",
          false,
          false,
          false,
          false,
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw 404 if collection not found", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(null);
      await expect(
        service.addUserOrSetUserRightsInCollection("1", "2", "1", false, false, false, false),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw 401 if a new user is added by someone other than the creator of the collection", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(mockCollectionModel);

      await expect(
        service.addUserOrSetUserRightsInCollection("2", "2", "1", false, false, false, false),
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw 400 if the user tries to add themselves", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(mockCollectionModel);

      await expect(
        service.addUserOrSetUserRightsInCollection("1", "1", "1", false, false, false, false),
      ).rejects.toThrow(BadRequestError);
    });

    it("add user to collection", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(mockCollectionModel);
      mockCollectionRepository.setUserRightsInCollection.mockResolvedValue(mockUserRightsModel);

      const result = await service.addUserOrSetUserRightsInCollection(
        "1",
        "2",
        "1",
        false,
        false,
        false,
        false,
      );

      expect(result).toEqual({
        message: "Set user rights successfully",
        user: {
          userId: "1",
          rights: {
            changeStatus: false,
            create: false,
            delete: false,
            edit: false,
          },
        },
      });
    });
  });

  describe("remove user from collections", () => {
    it("should throw 400 if collectionId is not number", async () => {
      await expect(service.deleteUserFromCollection("1", "2", "invalidId")).rejects.toThrow(
        BadRequestError,
      );
    });

    it("should throw 404 if collection not found", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(null);
      await expect(service.deleteUserFromCollection("1", "2", "1")).rejects.toThrow(NotFoundError);
    });

    it("should throw 401 if the user is deleted by someone other than the creator of the collection", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(mockCollectionModel);
      await expect(service.deleteUserFromCollection("2", "2", "1")).rejects.toThrow(ForbiddenError);
    });

    it("should throw 400 if the user tries to delete themselves", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(mockCollectionModel);
      await expect(service.deleteUserFromCollection("1", "1", "1")).rejects.toThrow(
        BadRequestError,
      );
    });

    it("remove user", async () => {
      mockCollectionRepository.getCollectionById.mockResolvedValue(mockCollectionModel);
      const result = await service.deleteUserFromCollection("1", "2", "1");

      expect(mockCollectionRepository.deleteUserFromCollection).toHaveBeenCalledWith("2", 1);
      expect(result).toEqual({ message: "User successfully removed from collection" });
    });
  });
});
