import dotenv from "dotenv";

dotenv.config();

const trueValues = ["t", "y", "1", "true", "yes"];
// const falseValues = ["f", "n", "0", "false", "no"];

function getBooleanValue(val: string | undefined): boolean {
  if (typeof val === "string") {
    return trueValues.includes(val.toLowerCase());
  }
  return false;
}

const isLocalDev = getBooleanValue(process.env.IS_LOCAL_DEV);
const environment = process.env.NODE_ENV ?? "development";
const defaultLevel = new Map([
  ["development", "info"],
  ["production", "warn"],
  ["test", "silent"],
]);

const localDevelopmentLogFallback = isLocalDev ? defaultLevel.get(environment) : undefined;

export default {
  logLevel: process.env.PARTYTIME_LOG ?? localDevelopmentLogFallback ?? "warn",
  environment,
};
