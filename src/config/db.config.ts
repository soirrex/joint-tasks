import { EnvConfig } from "./env.config";
import { Sequelize } from "sequelize";
import { inject, injectable } from "inversify";
import { initDBModels } from "../models/init.modelts";

@injectable()
export class DBConfig {
  private sequelize: Sequelize;
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

  async init() {
    initDBModels(this.sequelize);

    const retries = 10;
    for (let i = 0; i < retries; i++) {
      try {
        await this.sequelize.authenticate();
        await this.sequelize.sync({ alter: true, logging: false });
        return;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
}
