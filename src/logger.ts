import pino from "pino";

import config from "./config";

export const logger = pino({ level: config.logLevel });
logger.debug(config);
