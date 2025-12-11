import { DataTypes, Model, Sequelize } from "sequelize";

export class CollectionModel extends Model {
  public id!: number;
  public name!: string;
  public creatorId!: string;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  static initialize(sequelize: Sequelize) {
    CollectionModel.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            len: [0, 50],
          },
        },
        creatorId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
      },
      {
        indexes: [
          {
            fields: ["creatorId"],
            using: "BTREE",
          },
        ],
        sequelize,
        tableName: "containers",
        timestamps: true,
      },
    );
  }
}
