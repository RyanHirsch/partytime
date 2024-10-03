import { parseFeed } from "..";

import * as helpers from "./helpers";

describe("publisher feed", () => {
  it("parses sample publisher feed", async () => {
    const xml = await helpers.loadFixture(`publisher.xml`);
    const result = parseFeed(xml);

    expect(result).toHaveProperty("title", "AgileSet Media");
    expect(result).toHaveProperty("medium", "publisher");
    expect(result).toHaveProperty("podcastRemoteItems");
    expect(result?.podcastRemoteItems).toHaveLength(3);
  });
});
