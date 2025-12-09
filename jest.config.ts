import type { Config } from "jest";

const config: Config = {
  clearMocks: true,
  coverageProvider: "v8",
  testEnvironment: "node",
  preset: "ts-jest",
  rootDir: ".",
};

export default config;
