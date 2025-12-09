import { inject, injectable } from "inversify";
import { EnvConfig } from "../../config/env.config";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { UnauthorizedError } from "../classes/error.class";

@injectable()
export class JwtService {
  constructor(@inject(EnvConfig) private config: EnvConfig) { }

  create(userId: string): string {
    const payload: JwtPayload = { userId: userId };

    const token = jwt.sign(payload, this.config.getOrThrow("JWT_SECRET"), {
      expiresIn: "7d",
    });

    return token;
  }

  decode(token: string): JwtPayload {
    let decodeJwt: JwtPayload;
    try {
      decodeJwt = jwt.verify(token, this.config.getOrThrow("JWT_SECRET")) as JwtPayload;
    } catch {
      throw new UnauthorizedError("Unauthorized");
    }

    if (!decodeJwt.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    return decodeJwt;
  }
}
