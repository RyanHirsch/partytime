import * as fs from "fs";
import * as path from "path";
import * as Handlebars from "handlebars";
import * as prettier from "prettier";

type Tax = {
  group: string;
  role: string;
  description: string;
  example: string;
};

interface ReducedResults {
  grouped: Record<string, Array<{ sanitizedRole: string; role: string; description: string }>>;
  roles: Array<{ sanitizedRole: string; role: string }>;
  groups: Array<{ sanitizedGroup: string; group: string }>;
}

const taxonomy = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "taxonomy.json"), "utf-8")
) as Tax[];

function sanitize(word: string): string {
  return word.replace(/\W+/g, "");
}

const source = fs.readFileSync(path.resolve(__dirname, "person-enum.hbs"), "utf-8");
const data = taxonomy.reduce<ReducedResults>(
  (results, { group, role, description }) => {
    const sanitizedGroup = sanitize(group);
    const sanitizedRole = sanitize(role);
    const isExistingRole = Boolean(results.roles.find((x) => x.sanitizedRole === sanitizedRole));

    if (results.grouped[sanitizedGroup]) {
      results.grouped[sanitizedGroup].push({
        sanitizedRole,
        role,
        description,
      });

      if (!isExistingRole) {
        results.roles.push({ sanitizedRole, role });
      }

      return results;
    }
    return {
      grouped: {
        ...results.grouped,
        [sanitizedGroup]: [{ sanitizedRole, role, description }],
      },
      groups: [...results.groups, { sanitizedGroup, group }],
      roles: !isExistingRole
        ? [...results.roles, { sanitizedRole, role, description }]
        : results.roles,
    };
  },
  { grouped: {}, roles: [], groups: [] }
);

prettier.resolveConfig(path.resolve(__dirname, "..")).then((options) => {
  fs.writeFileSync(
    path.resolve(__dirname, "..", "src/parser/person-enum.ts"),
    prettier.format(Handlebars.compile(source)(data), { parser: "typescript", ...options })
  );
});
