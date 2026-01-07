import { DataTypes, Model, Sequelize } from "sequelize";

export class UserRightsModel extends Model {
  public id!: number;
  public userId!: string;
  public collectionId!: number;

  public rightToCreate!: boolean;
  public rightToEdit!: boolean;
  public rightToDelete!: boolean;
  public rightToChangeStatus!: boolean;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  static initialize(sequelize: Sequelize) {
    UserRightsModel.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        collectionId: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        rightToCreate: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        rightToEdit: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        rightToDelete: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        rightToChangeStatus: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
      },
      {
        indexes: [
          {
            fields: ["userId"],
            using: "BTREE",
          },
          {
            fields: ["collectionId"],
            using: "BTREE",
          },
        ],
        sequelize,
        tableName: "user_rights",
        timestamps: true,
      },
    );
  }
}
