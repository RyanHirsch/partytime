import * as fs from "fs";

import fetch from "node-fetch";

import { logger } from "./logger";

export async function getFeedText(uri: string): Promise<string> {
  logger.info(uri);
  if (uri.startsWith(`http`)) {
    const response = await fetch(uri, {
      headers: {
        "user-agent": "partytime/dev-testing",
      },
    });
    return response.text();
  }
  if (uri.startsWith("file")) {
    return new Promise((resolve, reject) => {
      fs.readFile(uri.replace("file://", ""), (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data.toString());
      });
    });
  }
  return "";
}
