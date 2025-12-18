import { BadRequestError, ForbiddenError, NotFoundError } from "../../common/classes/error.class";
import { CollectionModel } from "../../models/collection.model";
import { TaskModel } from "../../models/task.model";
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

  const mockTaskModel = {
    id: 1,
    collectionId: 1,
    name: "task name",
    priority: "low",
    description: "description",
  } as unknown as TaskModel;

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
      createTaskInCollection: jest.fn(),
      getTasksFromCollection: jest.fn(),
      deleteTaskFromCollection: jest.fn(),
      changeTaskStatus: jest.fn(),
      editTask: jest.fn(),
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

  describe("create task", () => {
    it("should throw 400 if collectionId is not number", async () => {
      await expect(
        service.createTask("1", "invalidId", "task name", "low", "description"),
      ).rejects.toThrow(BadRequestError);
    });

    it("throw error 404 if collection not found", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(null);

      await expect(service.createTask("1", "1", "task name", "low", "description")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throw error 401 it user doesn't have necessary rights", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );

      await expect(service.createTask("1", "1", "task name", "low", "description")).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("create task", async () => {
      mockCollectionWithUserRights.userRights.rightToCreate = true;
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );

      mockCollectionRepository.createTaskInCollection.mockResolvedValue(mockTaskModel);
      const result = await service.createTask("1", "1", "task name", "low", "description");

      expect(result).toEqual({ message: "Task created successfully", task: mockTaskModel });
      expect(mockCollectionRepository.createTaskInCollection).toHaveBeenCalledWith(
        1,
        "task name",
        "low",
        "description",
      );
    });
  });

  describe("get tasks from collection", () => {
    it("should throw 400 if collectionId is not number", async () => {
      await expect(
        service.getTasksFromCollection(
          "1",
          "invalidId",
          20,
          1,
          ["in_process", "completed", "canceled"],
          "priority",
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it("throw error 404 if collection not found", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(null);

      await expect(
        service.getTasksFromCollection(
          "1",
          "1",
          20,
          1,
          ["in_process", "completed", "canceled"],
          "priority",
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it("throw error 401 if user doesn't have rights for read tasks fron collection", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );

      await expect(
        service.getTasksFromCollection(
          "3",
          "1",
          20,
          1,
          ["in_process", "completed", "canceled"],
          "priority",
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it("get tasks", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );

      mockCollectionRepository.getTasksFromCollection.mockResolvedValue({
        totalPages: 1,
        tasks: [mockTaskModel],
      });

      const result = await service.getTasksFromCollection(
        "2",
        "1",
        20,
        1,
        ["in_process", "completed", "canceled"],
        "priority",
      );

      expect(mockCollectionRepository.getTasksFromCollection).toHaveBeenCalledWith(
        1,
        20,
        1,
        ["in_process", "completed", "canceled"],
        "priority",
      );

      expect(result).toEqual({
        page: 1,
        tasks: [
          {
            collectionId: 1,
            description: "description",
            id: 1,
            name: "task name",
            priority: "low",
          },
        ],
        totalPages: 1,
      });
    });

    it("get tasks if user doesn't have rights but the user is collection creator", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );

      mockCollectionRepository.getTasksFromCollection.mockResolvedValue({
        totalPages: 1,
        tasks: [mockTaskModel],
      });

      const result = await service.getTasksFromCollection(
        "1",
        "1",
        20,
        1,
        ["in_process", "completed", "canceled"],
        "priority",
      );

      expect(mockCollectionRepository.getTasksFromCollection).toHaveBeenCalledWith(
        1,
        20,
        1,
        ["in_process", "completed", "canceled"],
        "priority",
      );

      expect(result).toEqual({
        page: 1,
        tasks: [
          {
            collectionId: 1,
            description: "description",
            id: 1,
            name: "task name",
            priority: "low",
          },
        ],
        totalPages: 1,
      });
    });
  });

  describe("delete tasks from collection", () => {
    it("should throw 400 if collectionId is not number", async () => {
      await expect(service.deleteTaskFromCollection("2", "invalidId", "1")).rejects.toThrow(
        BadRequestError,
      );
    });

    it("should throw 400 if taskId is not number", async () => {
      await expect(service.deleteTaskFromCollection("2", "1", "taskId")).rejects.toThrow(
        BadRequestError,
      );
    });

    it("throw error 404 if collection not found", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(null);
      await expect(service.deleteTaskFromCollection("2", "1", "1")).rejects.toThrow(NotFoundError);
    });

    it("throw error 401 if user doesn't have rights for delete tasks", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );

      await expect(service.deleteTaskFromCollection("2", "1", "1")).rejects.toThrow(ForbiddenError);
    });

    it("delete taks if user doesn't have rights for delete tasks but user is collection creator", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );

      const result = await service.deleteTaskFromCollection("1", "1", "1");

      expect(mockCollectionRepository.deleteTaskFromCollection).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ message: "Task deleted successfully" });
    });

    it("delete taks if user have rights", async () => {
      mockCollectionWithUserRights.userRights.rightToDelete = true;

      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );

      const result = await service.deleteTaskFromCollection("2", "1", "1");

      expect(mockCollectionRepository.deleteTaskFromCollection).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ message: "Task deleted successfully" });
    });
  });

  describe("edit task", () => {
    it("should throw 400 if collectionId is not number", async () => {
      await expect(
        service.editTask("2", "invalidId", "1", "task name", "mid", "description"),
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw 400 if taskId is not number", async () => {
      await expect(
        service.editTask("2", "1", "taskId", "task name", "mid", "description"),
      ).rejects.toThrow(BadRequestError);
    });

    it("throw error 404 if collection not found", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(null);

      await expect(
        service.editTask("2", "1", "1", "task name", "mid", "description"),
      ).rejects.toThrow(NotFoundError);
    });

    it("throw error 401 if user doesn't have rights for change task status", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );

      await expect(
        service.editTask("2", "1", "1", "task name", "mid", "description"),
      ).rejects.toThrow(ForbiddenError);
    });

    it("edit task if user is collection creator", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );

      mockCollectionRepository.editTask.mockResolvedValue(mockTaskModel);

      const result = await service.editTask("1", "1", "1", "task name", "mid", "description");
      expect(result).toEqual({ message: "task edited successfully", task: mockTaskModel });
    });

    it("edit task if user have rights", async () => {
      mockCollectionWithUserRights.userRights.rightToEdit = true;
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );

      mockCollectionRepository.editTask.mockResolvedValue(mockTaskModel);

      const result = await service.editTask("2", "1", "1", "task name", "mid", "description");
      expect(result).toEqual({ message: "task edited successfully", task: mockTaskModel });
    });
  });

  describe("change task status", () => {
    it("should throw 400 if collectionId is not number", async () => {
      await expect(service.changeTaskStatus("2", "invalidId", "1", "completed")).rejects.toThrow(
        BadRequestError,
      );
    });

    it("should throw 400 if taskId is not number", async () => {
      await expect(service.changeTaskStatus("2", "1", "taskId", "completed")).rejects.toThrow(
        BadRequestError,
      );
    });

    it("throw error 404 if collection not found", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(null);
      await expect(service.changeTaskStatus("2", "1", "1", "completed")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throw error 401 if user doesn't have rights for change task status", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );
      await expect(service.changeTaskStatus("2", "1", "1", "completed")).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("change task status if user is collection creator", async () => {
      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );

      mockCollectionRepository.changeTaskStatus.mockResolvedValue(mockTaskModel);

      const result = await service.changeTaskStatus("1", "1", "1", "completed");

      expect(mockCollectionRepository.changeTaskStatus).toHaveBeenCalledWith(1, 1, "completed");
      expect(result).toEqual({ message: "Change status sucessfully", task: mockTaskModel });
    });

    it("change task status if user have rights", async () => {
      mockCollectionWithUserRights.userRights.rightToChangeStatus = true;

      mockCollectionRepository.getCollectionAndUserRights.mockResolvedValue(
        mockCollectionWithUserRights,
      );

      mockCollectionRepository.changeTaskStatus.mockResolvedValue(mockTaskModel);

      const result = await service.changeTaskStatus("2", "1", "1", "completed");

      expect(mockCollectionRepository.changeTaskStatus).toHaveBeenCalledWith(1, 1, "completed");
      expect(result).toEqual({ message: "Change status sucessfully", task: mockTaskModel });
    });
  });
});
