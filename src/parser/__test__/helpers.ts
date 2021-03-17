import * as fs from "fs";
import * as path from "path";

export async function loadFixture(name = "example"): Promise<string> {
  return new Promise((resolve, reject) =>
    fs.readFile(path.resolve(__dirname, `fixtures/${name}.xml`), "utf-8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    })
  );
}
