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

  describe("Changing the Tide", () => {
    let xml = "";
    beforeEach(async () => {
      xml = await helpers.loadFixture(`real-world/changing-the-tide.xml`);
    });

    it(`parses all items`, () => {
      const result = parseFeed(xml);

      expect(result.items).toHaveLength(15);
    });

    it(`handles querystring enclosure urls`, () => {
      const expectedUrl =
        "https://t.subsplash.com/r/aHR0cHM6Ly9jZG4uc3Vic3BsYXNoLmNvbS9hdWRpb3MvR0JNOTlTLzBhYTU3OTYxLWZhM2QtNGM1Yi04ZmVjLTllOGRmNDM4OTVjZC9hdWRpby5tcDM.mp3?k=GBM99S&s=3&sapid=67bxc3f";
      const result = parseFeed(xml);
      const exampleEpisode = result.items.find((ep) => ep.title === "0.00000014: 8₿it, BTC.email");
      expect(exampleEpisode).toHaveProperty("enclosure");
      expect(exampleEpisode.enclosure).toHaveProperty("url", expectedUrl);
    });
  });

  // This feed has missing GUIDs while I don't think this should be encouraged, it can be allowed via options
  describe("DK Podcast", () => {
    let xml = "";
    beforeEach(async () => {
      xml = await helpers.loadFixture(`real-world/dk-podcast.xml`);
    });

    it(`parses all items with GUID missing flag allowed`, () => {
      const result = parseFeed(xml, { allowMissingGuid: true });

      expect(result.items).toHaveLength(59);
    });

    it(`parses no items with GUID missing flag disabled`, () => {
      const result = parseFeed(xml, { allowMissingGuid: false });

      // 59 total times, 58 have numbers as guids, one is legit blank
      expect(result.items).toHaveLength(58);
    });
  });

  describe("Podverse Test Feed", () => {
    let xml = "";
    beforeEach(async () => {
      xml = await helpers.loadFixture(`podverse-test-feed.xml`);
    });

    it(`parses all live-items`, () => {
      const result = parseFeed(xml, { allowMissingGuid: true });
      expect(result.podcastLiveItems).toHaveLength(4);
    });
    it(`extracts both enclosure and alt-enclosure for the last live-item`, () => {
      const result = parseFeed(xml, { allowMissingGuid: true });
      const lastLiveItem = result.podcastLiveItems[3];

      expect(lastLiveItem.alternativeEnclosures).toHaveLength(1);
    });
  });

  describe("1865 Feed", () => {
    let xml = "";
    beforeEach(async () => {
      xml = await helpers.loadFixture(`real-world/1865.xml`);
    });

    it("allows for numeric titles", () => {
      const result = parseFeed(xml, { allowMissingGuid: true });
      expect(result?.title).toEqual("1865");
    });
  });

  describe("Sentimental Garbage Feed", () => {
    let xml = "";
    beforeEach(async () => {
      xml = await helpers.loadFixture(`real-world/sentimental-garbage.xml`);
    });

    it("parses the season", () => {
      const result = parseFeed(xml, { allowMissingGuid: true });
      expect(result?.items).toHaveLength(138);
      expect(result?.items[0].itunesSeason).toEqual(10);
      expect(result?.items[0].itunesEpisode).toEqual(29);

      expect(result?.items[1].itunesSeason).toEqual(10);
      expect(result?.items[1].itunesEpisode).toEqual(28);
    });
  });
  describe("Homegrown Hits Feed", () => {
    it("parses the items", async () => {
      const xml = await helpers.loadFixture(`real-world/homegrown-hits-og.xml`);
      const result = parseFeed(xml, { allowMissingGuid: true });
      expect(result?.items).toHaveLength(4);
    });
    it("extracts the live items with questionable dates", async () => {
      const xml = await helpers.loadFixture(`real-world/homegrown-hits.xml`);

      const result = parseFeed(xml, { allowMissingGuid: true });
      expect(result?.podcastLiveItems).toHaveLength(1);
      const [liveItem] = result?.podcastLiveItems || [];
      expect(liveItem).toHaveProperty("status", "live");
      const startTime = new Date("2023-12-08T00:59:59.000Z");
      expect(liveItem).toHaveProperty("start", startTime);
    });
  });
});
