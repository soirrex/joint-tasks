import { Sequelize } from "sequelize";
import { ContainerModel } from "./container.model";
import { UserModel } from "./user.model";

export async function initDBModels(sequelize: Sequelize) {
  UserModel.initialize(sequelize);
  ContainerModel.initialize(sequelize);

  ContainerModel.belongsTo(UserModel, {
    foreignKey: "creatorId",
    targetKey: "id",
    onDelete: "CASCADE",
  });

  UserModel.hasMany(ContainerModel, {
    foreignKey: "creatorId",
    sourceKey: "id",
  });
}
