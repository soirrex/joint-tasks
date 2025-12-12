import { DataTypes, Model, Sequelize } from "sequelize";

export class TaskModel extends Model {
  public id!: number;
  public collectionId!: number;
  public name!: string;
  public description!: string;
  public priority!: "low" | "mid" | "high";
  public type!: "new" | "in process" | "completed" | "canceled";

  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  static initialize(sequelize: Sequelize) {
    TaskModel.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        collectionId: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            len: [0, 50],
          },
        },
        description: {
          type: DataTypes.STRING,
          validate: {
            len: [0, 500],
          },
        },
        priority: {
          type: DataTypes.ENUM("low", "mid", "high"),
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM("now", "in process", "completed", "canceled"),
          defaultValue: "now",
          allowNull: false,
        },
      },
      {
        indexes: [
          {
            fields: ["collectionId"],
            using: "BTREE",
          },
          {
            fields: ["priority"],
            using: "BTREE",
          },
          {
            fields: ["type"],
            using: "BTREE",
          },
        ],
        sequelize,
        timestamps: true,
        tableName: "tasks",
      },
    );
  }
}
