import { inject, injectable } from "inversify";
import { UserRepository } from "../../repository/user.repository";
import { NotFoundError } from "../../common/classes/error.class";

@injectable()
export class UserService {
  constructor(@inject(UserRepository) private userRepository: UserRepository) {}

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      user: user,
    };
  }
}
