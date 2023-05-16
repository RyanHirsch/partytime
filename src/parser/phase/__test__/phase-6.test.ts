/* eslint-disable sonarjs/no-duplicate-string */
import * as helpers from "../../__test__/helpers";

const phase = 6;

describe("phase 6", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("txt", () => {
    const supportedName = "txt";

    describe("feed", () => {
      it("extracts a single txt node on the feed", () => {
        const xml = helpers.spliceFeed(
          feed,
          `
          <podcast:txt>hello</podcast:txt>
          `
        );
        const result = helpers.parseValidFeed(xml);
        expect(result.podcastTxt).toHaveLength(1);
        expect(result.podcastTxt?.[0]).toHaveProperty("value", "hello");
        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });

      it("extracts a multiple txt node on the feed", () => {
        const xml = helpers.spliceFeed(
          feed,
          `
          <podcast:txt>hello</podcast:txt>
          <podcast:txt>goodbye</podcast:txt>
          <podcast:txt purpose="unknown">hello</podcast:txt>
          `
        );
        const result = helpers.parseValidFeed(xml);
        expect(result.podcastTxt).toHaveLength(3);
        expect(result.podcastTxt?.[0]).toHaveProperty("value", "hello");
        expect(result.podcastTxt?.[1]).toHaveProperty("value", "goodbye");
        expect(result.podcastTxt?.[2]).toHaveProperty("value", "hello");
        expect(result.podcastTxt?.[2]).toHaveProperty("purpose", "unknown");
        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });
    });

    describe("item", () => {
      it("extracts a single txt node on the item", () => {
        const xml = helpers.spliceFirstItem(
          feed,
          `
          <podcast:txt>hello</podcast:txt>
          `
        );
        const result = helpers.parseValidFeed(xml);
        expect(result.items[0].podcastTxt).toHaveLength(1);

        expect(result.items[0].podcastTxt?.[0]).toHaveProperty("value", "hello");
        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });
      it("extracts multiple txt nodes on the item", () => {
        const xml = helpers.spliceFirstItem(
          feed,
          `
          <podcast:txt>hello</podcast:txt>
          <podcast:txt purpose="verify">bye</podcast:txt>
          <podcast:txt purpose="release">bye</podcast:txt>
          `
        );
        const result = helpers.parseValidFeed(xml);
        expect(result.items[0].podcastTxt).toHaveLength(3);
        expect(result.items[0].podcastTxt?.[0]).toHaveProperty("value", "hello");
        expect(result.items[0].podcastTxt?.[1]).toHaveProperty("value", "bye");
        expect(result.items[0].podcastTxt?.[1]).toHaveProperty("purpose", "verify");
        expect(result.items[0].podcastTxt?.[2]).toHaveProperty("value", "bye");
        expect(result.items[0].podcastTxt?.[2]).toHaveProperty("purpose", "release");
        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });
    });
  });
});
