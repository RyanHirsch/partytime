import fetch from "node-fetch";
import * as fs from "fs";
import { log } from "./logger";

export async function getFeedText(uri: string): Promise<string> {
  log.info(uri);
  if (uri.startsWith(`http`)) {
    const response = await fetch(uri);
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
