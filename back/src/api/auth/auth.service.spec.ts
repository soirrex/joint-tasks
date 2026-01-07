import { AuthService } from "./auth.service";
import { UserRepository } from "../../repository/user.repository";
import { JwtService } from "../../common/services/jwt.service";
import { UserModel } from "../../models/user.model";
import { FastifyReply } from "fastify";
import { ConflictError, ForbiddenError, NotFoundError } from "../../common/classes/error.class";
import bcrypt from "bcrypt";

describe("AuthService", () => {
  let service: AuthService;

  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockJwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: "1",
    email: "email@example.com",
    name: "name",
  } as unknown as UserModel;

  const mockReplay = {
    setCookie: jest.fn(),
  } as Partial<FastifyReply>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository = {
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    mockJwtService = {
      create: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    service = new AuthService(mockUserRepository as UserRepository, mockJwtService as JwtService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    it("should throw 409 (ConflictException) if email already exists", () => {
      mockUserRepository.findUserByEmail.mockResolvedValue(mockUser);

      expect(
        service.register("email@example.com", "name", "password", mockReplay as FastifyReply),
      ).rejects.toThrow(ConflictError);

      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });

    it("should create a new user", async () => {
      mockUserRepository.findUserByEmail.mockResolvedValue(null);
      mockUserRepository.createUser.mockResolvedValue(mockUser);

      const result = await service.register(
        "email@example.com",
        "name",
        "password",
        mockReplay as FastifyReply,
      );

      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        "email@example.com",
        "name",
        expect.any(String),
      );

      expect(result).toEqual({
        message: "User registered successfully",
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        },
      });
    });
  });

  describe("login", () => {
    it("should throw 404 (NotFoundException) if email doesn't exists", async () => {
      mockUserRepository.findUserByEmail.mockResolvedValue(null);

      expect(
        service.login("email@example.com", "password", mockReplay as FastifyReply),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw 403 (ForbiddeException) if password is invalid", async () => {
      mockUserRepository.findUserByEmail.mockResolvedValue(mockUser);

      // eslint-disable-next-line
      jest.spyOn(bcrypt, "compare" as any).mockResolvedValue(false);

      expect(
        service.login("email@example.com", "invalidPassword", mockReplay as FastifyReply),
      ).rejects.toThrow(ForbiddenError);
    });

    it("should login successfully", async () => {
      mockUserRepository.findUserByEmail.mockResolvedValue(mockUser);

      // eslint-disable-next-line
      jest.spyOn(bcrypt, "compare" as any).mockResolvedValue(true);

      const result = await service.login(
        "email@example.com",
        "password",
        mockReplay as FastifyReply,
      );

      expect(result).toEqual({
        message: "Login successfully",
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        },
      });
    });
  });
});
