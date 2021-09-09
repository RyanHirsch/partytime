import * as fs from "fs";
import * as path from "path";
import * as Handlebars from "handlebars";
import * as prettier from "prettier";

const input = path.resolve(__dirname, process.argv[2]);
const output = path.resolve(__dirname, "..", process.argv[3]);

const json = fs.readFileSync(input, "utf-8");

const source = fs.readFileSync(path.resolve(__dirname, "generic-json.hbs"), "utf-8");

prettier.resolveConfig(input).then((options) => {
  fs.writeFileSync(
    output,
    prettier.format(Handlebars.compile(source)({ json }), { parser: "typescript", ...options })
  );
});
