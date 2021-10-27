/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as helpers from "../../__test__/helpers";
import { parseFeed } from "../../index";

describe("phase pending", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("podcast id", () => {
    const supportedName = "id";

    it("correctly identifies a basic feed", () => {
      const result = parseFeed(feed);

      expect(result).not.toHaveProperty("podcastId");
      expect(helpers.getPhaseSupport(result, Infinity)).not.toContain(supportedName);
    });

    it("ignores missing platform", () => {
      const xml = helpers.spliceFeed(
        feed,
        // missing platform, not valid
        `<podcast:id id="70471" url="https://www.deezer.com/show/70471"/>`
      );
      const result = parseFeed(xml);

      expect(result).not.toHaveProperty("podcastId");
      expect(helpers.getPhaseSupport(result, Infinity)).not.toContain(supportedName);
    });

    it("extracts a single id", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:id platform="deezer" id="70471" url="https://www.deezer.com/show/70471"/>`
      );
      const result = parseFeed(xml);

      expect(result.podcastId).toHaveLength(1);
      const [first] = result.podcastId;

      expect(first).toHaveProperty("platform", "deezer");
      expect(first).toHaveProperty("id", "70471");
      expect(first).toHaveProperty("url", "https://www.deezer.com/show/70471");
      expect(helpers.getPhaseSupport(result, Infinity)).toContain(supportedName);
    });

    it("extracts a multiple ids", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:id platform="deezer" id="70471" url="https://www.deezer.com/show/70471"/>
        <podcast:id platform="overcast" id="1448151585" url="https://overcast.fm/itunes1448151585"/>
        `
      );
      const result = parseFeed(xml);

      expect(result.podcastId).toHaveLength(2);
      const [first, second] = result.podcastId;

      expect(first).toHaveProperty("platform", "deezer");
      expect(first).toHaveProperty("id", "70471");
      expect(first).toHaveProperty("url", "https://www.deezer.com/show/70471");

      expect(second).toHaveProperty("platform", "overcast");
      expect(second).toHaveProperty("id", "1448151585");
      expect(second).toHaveProperty("url", "https://overcast.fm/itunes1448151585");
      expect(helpers.getPhaseSupport(result, Infinity)).toContain(supportedName);
    });

    it("allows for optional id attribute", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:id platform="deezer" url="https://www.deezer.com/show/70471"/>`
      );
      const result = parseFeed(xml);

      expect(result.podcastId).toHaveLength(1);
      const [first] = result.podcastId;

      expect(first).toHaveProperty("platform", "deezer");
      expect(first).toHaveProperty("url", "https://www.deezer.com/show/70471");
      expect(first).not.toHaveProperty("id");
      expect(helpers.getPhaseSupport(result, Infinity)).toContain(supportedName);
    });
  });
});
