import { DataTypes, Model, Sequelize } from "sequelize";

export class TaskModel extends Model {
  public id!: number;
  public collectionId!: number;
  public name!: string;
  public description!: string;
  public deadline!: number;
  public priority!: "low" | "mid" | "high";
  public type!: "created" | "in process" | "completed";

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
        deadline: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        priority: {
          type: DataTypes.ENUM({
            values: ["low", "mid", "high"],
          }),
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM({
            values: ["created", "in process", "completed"],
          }),
          defaultValue: "created",
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
            fields: ["deadline"],
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
