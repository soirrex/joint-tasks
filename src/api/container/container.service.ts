import { injectable } from "inversify";

@injectable()
export class ContainerService {
  async createContainer(userId: string, name: string) {
    return {
      message: "Container was created successfully",
      container: {
        id: 1,
      },
    };
  }
}
