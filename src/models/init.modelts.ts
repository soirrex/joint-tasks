import { Sequelize } from "sequelize";
import { CollectionModel } from "./collection.model";
import { UserModel } from "./user.model";

export async function initDBModels(sequelize: Sequelize) {
  UserModel.initialize(sequelize);
  CollectionModel.initialize(sequelize);

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
