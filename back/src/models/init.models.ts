import { Sequelize } from "sequelize";
import { CollectionModel } from "./collection.model";
import { UserModel } from "./user.model";
import { TaskModel } from "./task.model";
import { UserRightsModel } from "./user-rights.model";

export async function initDBModels(sequelize: Sequelize) {
  UserModel.initialize(sequelize);
  CollectionModel.initialize(sequelize);
  TaskModel.initialize(sequelize);
  UserRightsModel.initialize(sequelize);

  CollectionModel.belongsTo(UserModel, {
    foreignKey: "creatorId",
    targetKey: "id",
    onDelete: "CASCADE",
  });
  UserModel.hasMany(CollectionModel, {
    foreignKey: "creatorId",
    sourceKey: "id",
  });

  TaskModel.belongsTo(CollectionModel, {
    foreignKey: "collectionId",
    targetKey: "id",
    onDelete: "CASCADE",
  });
  CollectionModel.hasMany(TaskModel, {
    foreignKey: "collectionId",
    sourceKey: "id",
  });

  UserRightsModel.belongsTo(CollectionModel, {
    foreignKey: "collectionId",
    targetKey: "id",
    onDelete: "CASCADE",
  });
  UserRightsModel.belongsTo(UserModel, {
    foreignKey: "userId",
    targetKey: "id",
    onDelete: "CASCADE",
  });
  UserModel.hasMany(UserRightsModel, {
    foreignKey: "userId",
    sourceKey: "id",
    as: "userRights",
  });
  CollectionModel.hasMany(UserRightsModel, {
    foreignKey: "collectionId",
    sourceKey: "id",
    as: "userRights",
  });
}
