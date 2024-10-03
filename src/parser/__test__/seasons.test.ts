import { parseFeed } from "..";

import * as helpers from "./helpers";

describe("seasons handling", () => {
  it("parses sample publisher feed", async () => {
    const xml = await helpers.loadFixture(`real-world/1865.xml`);
    const result = parseFeed(xml);

    expect(result).toHaveProperty("podcastSeasons");
  });
});
