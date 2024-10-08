import { parseFeed } from "..";

import * as helpers from "./helpers";

describe("seasons handling", () => {
  it("parses sample publisher feed", async () => {
    const xml = await helpers.loadFixture(`real-world/themnshow.xml`);
    const result = parseFeed(xml);

    expect(result).toHaveProperty("podcastSeasons");
  });

  it("produces a sorted keyed seaons object", async () => {
    const xml = await helpers.loadFixture(`real-world/themnshow.xml`);
    const result = parseFeed(xml);

    expect(result).toHaveProperty("podcastSeasons", {
      1: {
        name: "Breakfasts with Dr. Tim",
        number: 1,
      },
      2: {
        name: "Supper with Dr. Tim",
        number: 2,
      },
    });
  });
});
