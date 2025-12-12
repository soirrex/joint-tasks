import { Sequelize } from "sequelize";
import { CollectionModel } from "./collection.model";
import { UserModel } from "./user.model";
import { TaskModel } from "./task.model";

export async function initDBModels(sequelize: Sequelize) {
  UserModel.initialize(sequelize);
  CollectionModel.initialize(sequelize);
  TaskModel.initialize(sequelize);

  TaskModel.belongsTo(CollectionModel, {
    foreignKey: "collectionId",
    targetKey: "id",
    onDelete: "CASCADE",
  });

  CollectionModel.hasMany(TaskModel, {
    foreignKey: "collectionId",
    sourceKey: "id",
  });

  CollectionModel.belongsTo(UserModel, {
    foreignKey: "creatorId",
    targetKey: "id",
    onDelete: "CASCADE",
  });

  UserModel.hasMany(CollectionModel, {
    foreignKey: "creatorId",
    sourceKey: "id",
  });
}
