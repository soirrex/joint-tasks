import { CollectionRepository } from "../../repository/collection.repository";
import { CollectionService } from "./collection.service";

describe("CollectionService", () => {
  let service: CollectionService;

  let mockCollectionRepository: jest.Mocked<CollectionRepository>;

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

  describe("create collection", () => {});

  describe("delete collection", () => {});
});
