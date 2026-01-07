import { injectable } from "inversify";
import "dotenv/config";

@injectable()
export class EnvConfig {
  getOrThrow(key: string): string {
    if (!process.env[key]) {
      throw new Error(`Missing ${key} .in env`);
    }

    return process.env[key];
  }

  get(key: string): string | undefined {
    return process.env[key];
  }
}
