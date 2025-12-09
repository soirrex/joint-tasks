import { inject, injectable } from "inversify";
import { UnauthorizedError } from "../classes/error.class";
import { JwtService } from "../services/jwt.service";
import { AuthFastifyRequest } from "../interfaces/auth-request.interfase";
import { FastifyReply } from "fastify";

@injectable()
export class OnRequestHooks {
  constructor(@inject(JwtService) private jwtService: JwtService) {}

  isAuthHook(request: AuthFastifyRequest, reply: FastifyReply, done: () => void) {
    const userToken = request.cookies?.userToken;

    if (!userToken) {
      throw new UnauthorizedError("Unauthorized");
    }

    const decode = this.jwtService.decode(userToken);
    request.userId = decode.userId;

    done();
  }
}
