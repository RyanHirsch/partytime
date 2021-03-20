/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { loadFixture } from "./helpers";
import { parse } from "../xml-parser";

import * as phase from "../phase";
import type { FeedUpdate } from "../phase";
import type { RSSFeed } from "../shared";

describe("RSS Parser", () => {
  let parsedFeed: any;
  let legacyFeed: any;

  function testFeedFunction(theFeed: RSSFeed, test: FeedUpdate) {
    const node = (test.nodeTransform ?? phase.defaultNodeTransform)(
      theFeed.rss.channel[`podcast:${test.tag}`]
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if ((test.supportCheck ?? phase.defaultSupportCheck)(node)) {
      return {
        feedUpdate: test.fn(node),
        phaseUpdate: { [test.phase]: { [test.tag]: true } },
      };
    }
    return {
      feedUpdate: {},
      phaseUpdate: {},
    };
  }

  beforeEach(async () => {
    parsedFeed = parse(await loadFixture());
    legacyFeed = parse(await loadFixture("legacy"));
  });
  describe("phase 1 supported tags", () => {
    describe("locked feed", () => {
      it("sets locked flag", () => {
        const result = testFeedFunction(parsedFeed, phase.locked);
        expect(result.feedUpdate).toHaveProperty("podcastLocked", 1);
      });

      it("sets phase flag", () => {
        const result = testFeedFunction(parsedFeed, phase.locked);
        expect(result.phaseUpdate[1]).toHaveProperty("locked", true);
      });
    });
    describe("unlocked feed", () => {
      beforeEach(async () => {
        const xml = await loadFixture("unlocked");
        parsedFeed = parse(xml);
      });
      it("sets locked flag", () => {
        const result = testFeedFunction(parsedFeed, phase.locked);
        expect(result.feedUpdate).toHaveProperty("podcastOwner", "podcastowner@example.com");
      });

      it("sets phase flag", () => {
        const result = testFeedFunction(parsedFeed, phase.locked);
        expect(result.phaseUpdate[1]).toHaveProperty("locked", true);
      });
    });
    describe("legacy feed", () => {
      it("sets locked flag", () => {
        const result = testFeedFunction(legacyFeed, phase.locked);
        expect(result).toHaveProperty("feedUpdate", {});
      });

      it("sets phase flag", () => {
        const result = testFeedFunction(legacyFeed, phase.locked);
        expect(result).toHaveProperty("phaseUpdate", {});
      });
    });
  });
});
