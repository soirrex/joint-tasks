import { inject, injectable } from "inversify";
import { EnvConfig } from "./env.config";
import { Sequelize } from "sequelize";

@injectable()
export class DBConfig {
  sequelize: Sequelize;

  constructor(@inject(EnvConfig) private config: EnvConfig) {
    this.sequelize = new Sequelize(
      this.config.getOrThrow("DB_NAME"),
      this.config.getOrThrow("DB_USER"),
      this.config.getOrThrow("DB_PASSWORD"),
      {
        host: this.config.getOrThrow("DB_HOST"),
        port: Number(this.config.getOrThrow("DB_PORT")),
        dialect: "postgres",
        logging: false,
      },
    );
  }
}
