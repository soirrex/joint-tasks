import { DataTypes, Model, Sequelize } from "sequelize";

export class UserModel extends Model {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  static initialize(sequelize: Sequelize) {
    UserModel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            len: [0, 50],
          },
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
            len: [0, 50],
          },
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "users",
        timestamps: true,
      },
    );
  }
}
