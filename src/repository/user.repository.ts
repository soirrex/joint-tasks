import { injectable } from "inversify";
import { UserModel } from "../models/user.model";

@injectable()
export class UserRepository {
  async findUserByEmail(email: string): Promise<UserModel | null> {
    const user = await UserModel.findOne({
      where: {
        email: email,
      },
      raw: true,
    });

    return user;
  }

  async createUser(email: string, name: string, hashPassword: string): Promise<UserModel> {
    const user = await UserModel.create(
      {
        email: email,
        password: hashPassword,
        name: name,
      },
      { raw: true },
    );

    return user;
  }
}
