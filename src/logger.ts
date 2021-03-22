import * as logger from "loglevel";

// log.trace(msg)
// log.debug(msg)
// log.info(msg)
// log.warn(msg)
// log.error(msg)
logger.setLevel((process.env.LOG ?? "warn") as logger.LogLevelDesc);

export const log = logger;
