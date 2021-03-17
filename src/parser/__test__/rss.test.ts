/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { loadFixture } from "./helpers";
import { parse } from "../xml-parser";
import * as rss from "../rss";

describe("RSS Parser", () => {
  let parsedFeed: any;
  let legacyFeed: any;

  beforeEach(async () => {
    parsedFeed = parse(await loadFixture());
    legacyFeed = parse(await loadFixture("legacy"));
  });
  describe("phase 1 supported tags", () => {
    describe("locked feed", () => {
      it("sets locked flag", () => {
        const result = rss.phase1.locked(parsedFeed);
        expect(result.feedUpdate).toHaveProperty("podcastLocked", 1);
      });

      it("sets phase flag", () => {
        const result = rss.phase1.locked(parsedFeed);
        expect(result.phaseUpdate[1]).toHaveProperty("locked", true);
      });
    });
    describe("unlocked feed", () => {
      beforeEach(async () => {
        const xml = await loadFixture("unlocked");
        parsedFeed = parse(xml);
      });
      it("sets locked flag", () => {
        const result = rss.phase1.locked(parsedFeed);
        expect(result.feedUpdate).toHaveProperty("podcastLocked", 0);
      });

      it("sets phase flag", () => {
        const result = rss.phase1.locked(parsedFeed);
        expect(result.phaseUpdate[1]).toHaveProperty("locked", true);
      });
    });
    describe("legacy feed", () => {
      it("sets locked flag", () => {
        const result = rss.phase1.locked(legacyFeed);
        expect(result.feedUpdate).toHaveProperty("podcastLocked", 0);
      });

      it("sets phase flag", () => {
        const result = rss.phase1.locked(legacyFeed);
        expect(result.phaseUpdate[1]).not.toHaveProperty("locked");
      });
    });
  });
});
