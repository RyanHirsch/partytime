/* eslint-disable sonarjs/no-duplicate-string */
import * as helpers from "../../__test__/helpers";
import { Phase5Blocked, isSafeToIngest, isServiceBlocked } from "../phase-5";

const phase = 5;

describe("phase 5", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("socialInteract", () => {
    const supportedName = "socialInteract";

    it("extracts a single interact node", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `
          <podcast:socialInteract
            platform="twitter"
            podcastAccountId="@Podverse"
            priority="2"
            pubDate="2021-04-14T10:25:42Z">https://twitter.com/Podverse/status/1375624446296395781</podcast:socialInteract>
          `
      );
      const result = helpers.parseValidFeed(xml);

      expect(result).not.toHaveProperty("podcastSocialInteraction");
      const [first] = result.items;

      expect(first).toHaveProperty("podcastSocialInteraction");
      expect(first.podcastSocialInteraction).toHaveLength(1);

      expect(first.podcastSocialInteraction?.[0]).toHaveProperty("platform", "twitter");
      expect(first.podcastSocialInteraction?.[0]).toHaveProperty("id", "@Podverse");
      expect(first.podcastSocialInteraction?.[0]).toHaveProperty("priority", 2);
      expect(first.podcastSocialInteraction?.[0]).toHaveProperty(
        "pubDate",
        new Date("2021-04-14T10:25:42Z")
      );
      expect(first.podcastSocialInteraction?.[0]).toHaveProperty(
        "url",
        "https://twitter.com/Podverse/status/1375624446296395781"
      );

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
  });

  describe("block", () => {
    const supportedName = "block";

    it("defaults to false", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        `
      );
      const result = helpers.parseValidFeed(xml);
      expect(result.podcastBlocked).toEqual(Phase5Blocked.No);
      expect(result.podcastBlocked).toEqual(Phase5Blocked.No);
      expect(isSafeToIngest(result, "podverse")).toBe(true);
      expect(isSafeToIngest(result, "google")).toBe(true);
      expect(isSafeToIngest(result, "amazon")).toBe(true);

      expect(isServiceBlocked(result, "podverse")).toBe(false);
      expect(isServiceBlocked(result, "google")).toBe(false);
      expect(isServiceBlocked(result, "amazon")).toBe(false);
    });
    it("handles explicit false", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:block>no</podcast:block>
        `
      );
      const result = helpers.parseValidFeed(xml);
      expect(result.podcastBlocked).toEqual(Phase5Blocked.No);
      expect(isSafeToIngest(result, "podverse")).toBe(true);
      expect(isSafeToIngest(result, "google")).toBe(true);
      expect(isSafeToIngest(result, "amazon")).toBe(true);

      expect(isServiceBlocked(result, "podverse")).toBe(false);
      expect(isServiceBlocked(result, "google")).toBe(false);
      expect(isServiceBlocked(result, "amazon")).toBe(false);
    });
    it("handles explicit true", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:block>yes</podcast:block>
        `
      );
      const result = helpers.parseValidFeed(xml);
      expect(result.podcastBlocked).toEqual(Phase5Blocked.Yes);
      expect(isSafeToIngest(result, "podverse")).toBe(false);
      expect(isSafeToIngest(result, "google")).toBe(false);
      expect(isSafeToIngest(result, "amazon")).toBe(false);

      expect(isServiceBlocked(result, "podverse")).toBe(true);
      expect(isServiceBlocked(result, "google")).toBe(true);
      expect(isServiceBlocked(result, "amazon")).toBe(true);
    });
    it("only blocks google and amazon", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:block id="google">yes</podcast:block>
        <podcast:block id="amazon">yes</podcast:block>
        `
      );
      const result = helpers.parseValidFeed(xml);
      expect(result.podcastBlocked).toEqual(Phase5Blocked.No);
      expect(result.podcastBlockedPlatforms).toHaveProperty("google", true);
      expect(result.podcastBlockedPlatforms).toHaveProperty("amazon", true);

      expect(isSafeToIngest(result, "podverse")).toBe(true);
      expect(isSafeToIngest(result, "google")).toBe(false);
      expect(isSafeToIngest(result, "amazon")).toBe(false);

      expect(isServiceBlocked(result, "podverse")).toBe(false);
      expect(isServiceBlocked(result, "google")).toBe(true);
      expect(isServiceBlocked(result, "amazon")).toBe(true);
    });
    it("blocks everything except google and amazon", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:block>yes</podcast:block>
        <podcast:block id="google">no</podcast:block>
        <podcast:block id="amazon">no</podcast:block>
        `
      );
      const result = helpers.parseValidFeed(xml);
      expect(result.podcastBlocked).toEqual(Phase5Blocked.Yes);
      expect(result.podcastBlockedPlatforms).toHaveProperty("google", false);
      expect(result.podcastBlockedPlatforms).toHaveProperty("amazon", false);

      expect(isSafeToIngest(result, "podverse")).toBe(false);
      expect(isSafeToIngest(result, "google")).toBe(true);
      expect(isSafeToIngest(result, "amazon")).toBe(true);

      expect(isServiceBlocked(result, "podverse")).toBe(true);
      expect(isServiceBlocked(result, "google")).toBe(false);
      expect(isServiceBlocked(result, "amazon")).toBe(false);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
  });
});
