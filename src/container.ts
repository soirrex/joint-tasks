import "reflect-metadata";
import { Container } from "inversify";
import { EnvConfig } from "./config/env.config";
import { UserRepository } from "./repository/user.repository";
import { AuthService } from "./api/auth/auth.service";
import { AuthController } from "./api/auth/auth.controller";
import { JwtService } from "./common/services/jwt.service";
import { TaskController } from "./api/task/task.controller";
import { TaskService } from "./api/task/task.service";
import { ContainerController } from "./api/container/container.controller";
import { ContainerService } from "./api/container/container.service";
import { OnRequestHooks } from "./common/hooks/on-request.hooks";
import { DBConfig } from "./config/db.config";
import { ContainerRepository } from "./repository/container.repository";

export const inversifyContainer = new Container();

inversifyContainer.bind(EnvConfig).toSelf();
inversifyContainer.bind(DBConfig).toSelf();

inversifyContainer.bind(AuthService).toSelf();
inversifyContainer.bind(AuthController).toSelf();

inversifyContainer.bind(TaskController).toSelf();
inversifyContainer.bind(TaskService).toSelf();

inversifyContainer.bind(ContainerController).toSelf();
inversifyContainer.bind(ContainerService).toSelf();

inversifyContainer.bind(JwtService).toSelf();

inversifyContainer.bind(OnRequestHooks).toSelf();

inversifyContainer.bind(UserRepository).toSelf();
inversifyContainer.bind(ContainerRepository).toSelf();
