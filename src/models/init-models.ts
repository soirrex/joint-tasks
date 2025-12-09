import { UserModel } from "./user.model";
import { ContainerModel } from "./container.model";
import { inversifyContainer } from "../container";
import { DBConfig } from "../config/db.config";

export function initDBModels() {
  const db = inversifyContainer.get(DBConfig);
  ContainerModel.initialize(db.sequelize);
  UserModel.initialize(db.sequelize);

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
