import { FastifyReply } from "fastify";
import { inject, injectable } from "inversify";
import { UserRepository } from "../../repository/user.repository";
import { ConflictError, ForbiddeError, NotFoundError } from "../../common/classes/error.class";
import bcrypt from "bcrypt";
import { JwtService } from "../../common/services/jwt.service";

@injectable()
export class AuthService {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(JwtService) private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, reply: FastifyReply) {
    const user = await this.userRepository.findUserByEmail(email);

    if (user) {
      throw new ConflictError("This email already exists");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const createUser = await this.userRepository.createUser(email, hashPassword);

    const token = this.jwtService.create(createUser.id);

    reply.setCookie("userToken", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });
    return {
      message: "User registered successfully",
    };
  }

  async login(email: string, password: string, reply: FastifyReply) {
    const user = await this.userRepository.findUserByEmail(email);

    if (!user) {
      throw new NotFoundError("Email not found");
    }

    const validatePassword = await bcrypt.compare(password, user.password);

    if (!validatePassword) {
      throw new ForbiddeError("Invalid password");
    }

    const token = this.jwtService.create(user.id);

    reply.setCookie("userToken", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      message: "Login successfully",
    };
  }
}
