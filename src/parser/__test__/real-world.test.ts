import { parseFeed } from "..";

import * as helpers from "./helpers";
import list from "./fixtures/real-world/list.json";

describe("real-world feeds", () => {
  (list as Array<{ uri: string; file: string; title: string }>).forEach((item) => {
    it(`parses captured feed for ${item.file} - ${item.uri}`, async () => {
      const xml = await helpers.loadFixture(`real-world/${item.file}`);
      const result = parseFeed(xml);

      expect(result).toHaveProperty("title", item.title);
    });
  });
});
