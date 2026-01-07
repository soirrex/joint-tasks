import "reflect-metadata";
import { Container } from "inversify";
import { EnvConfig } from "./config/env.config";
import { UserRepository } from "./repository/user.repository";
import { AuthService } from "./api/auth/auth.service";
import { AuthController } from "./api/auth/auth.controller";
import { JwtService } from "./common/services/jwt.service";
import { CollectionController } from "./api/collection/collection.controller";
import { CollectionService } from "./api/collection/collection.service";
import { OnRequestHooks } from "./common/hooks/on-request.hooks";
import { DBConfig } from "./config/db.config";
import { CollectionRepository } from "./repository/collection.repository";
import { TaskController } from "./api/task/task.controller";
import { TaskService } from "./api/task/task.service";
import { UserController } from "./api/user/user.controller";
import { UserService } from "./api/user/user.service";

export const inversifyContainer = new Container();

inversifyContainer.bind(EnvConfig).toSelf();
inversifyContainer.bind(DBConfig).toSelf();

inversifyContainer.bind(AuthService).toSelf();
inversifyContainer.bind(AuthController).toSelf();

inversifyContainer.bind(CollectionController).toSelf();
inversifyContainer.bind(CollectionService).toSelf();

inversifyContainer.bind(TaskController).toSelf();
inversifyContainer.bind(TaskService).toSelf();

inversifyContainer.bind(UserController).toSelf();
inversifyContainer.bind(UserService).toSelf();

inversifyContainer.bind(JwtService).toSelf();

inversifyContainer.bind(OnRequestHooks).toSelf();

inversifyContainer.bind(UserRepository).toSelf();
inversifyContainer.bind(CollectionRepository).toSelf();
