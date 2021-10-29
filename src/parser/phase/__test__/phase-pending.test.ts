/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as helpers from "../../__test__/helpers";
import { parseFeed } from "../../index";
import { PhasePendingMedium } from "../phase-pending";

const phase = Infinity;

describe("phase pending", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("podcast:id", () => {
    const supportedName = "id";

    it("correctly identifies a basic feed", () => {
      const result = parseFeed(feed);

      expect(result).not.toHaveProperty("podcastId");
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("ignores missing platform", () => {
      const xml = helpers.spliceFeed(
        feed,
        // missing platform, not valid
        `<podcast:id id="70471" url="https://www.deezer.com/show/70471"/>`
      );
      const result = parseFeed(xml);

      expect(result).not.toHaveProperty("podcastId");
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
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
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
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
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
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
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
  });

  describe("podcast:social", () => {
    const supportedName = "social";

    it("correctly identifies a basic feed", () => {
      const result = parseFeed(feed);

      expect(result).not.toHaveProperty("podcastSocial");
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    describe("feed", () => {
      it("extracts a single social node", () => {
        const xml = helpers.spliceFeed(
          feed,
          `<podcast:social platform="mastodon" url="https://enfants-et-famille.podcasts.chat/">enfants-et-famille.podcasts.chat</podcast:social>
          `
        );
        const result = parseFeed(xml);

        expect(result.podcastSocial).toHaveLength(1);
        const [first] = result.podcastSocial;

        expect(first).toHaveProperty("platform", "mastodon");
        expect(first).toHaveProperty("url", "https://enfants-et-famille.podcasts.chat/");
        expect(first).toHaveProperty("name", "enfants-et-famille.podcasts.chat");
        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });

      it("extracts a multiple social nodes", () => {
        const xml = helpers.spliceFeed(
          feed,
          `<podcast:social platform="mastodon" url="https://enfants-et-famille.podcasts.chat/">enfants-et-famille.podcasts.chat</podcast:social>
          <podcast:social platform="peertube" url="https://video.lespoesiesdheloise.fr/">heloise</podcast:social>
          `
        );
        const result = parseFeed(xml);

        expect(result.podcastSocial).toHaveLength(2);
        const [first, second] = result.podcastSocial;

        expect(first).toHaveProperty("platform", "mastodon");
        expect(first).toHaveProperty("url", "https://enfants-et-famille.podcasts.chat/");
        expect(first).toHaveProperty("name", "enfants-et-famille.podcasts.chat");
        expect(first).not.toHaveProperty("id");
        expect(first).not.toHaveProperty("signUp");
        expect(first).not.toHaveProperty("priority");
        expect(second).toHaveProperty("platform", "peertube");
        expect(second).toHaveProperty("url", "https://video.lespoesiesdheloise.fr/");
        expect(second).toHaveProperty("name", "heloise");
        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });

      it("extracts a multiple social spec nodes", () => {
        const xml = helpers.spliceFeed(
          feed,
          `
          <podcast:social priority="1" platform="activitypub" podcastAccountId="@heloise@lespoesiesdheloise.fr" podcastAccountUrl="https://lespoesiesdheloise.fr/@heloise">
            <podcast:socialSignUp priority="1" homeUrl="https://enfants-et-famille.podcasts.chat/public" signUpUrl="https://enfants-et-famille.podcasts.chat/auth/sign_up" />
            <podcast:socialSignUp priority="2" homeUrl="https://mamot.fr/public" signUpUrl="https://mamot.fr/auth/sign_up" />
            <podcast:socialSignUp priority="3" homeUrl="https://podcastindex.social/public" signUpUrl="https://podcastindex.social/auth/sign_up" />
          </podcast:social>
          <podcast:social priority="66.6" platform="facebook" podcastAccountId="LesPoesiesDHeloise" podcastAccountUrl="https://www.facebook.com/LesPoesiesDHeloise">
            <podcast:socialSignUp homeUrl="https://www.facebook.com/" signUpUrl="https://www.facebook.com/r.php?display=page" />
          </podcast:social>
          `
        );
        const result = parseFeed(xml);

        expect(result.podcastSocial).toHaveLength(2);
        const [first, second] = result.podcastSocial;

        expect(first).toHaveProperty("platform", "activitypub");
        expect(first).toHaveProperty("priority", 1);
        expect(first).toHaveProperty("id", "@heloise@lespoesiesdheloise.fr");
        expect(first).toHaveProperty("url", "https://lespoesiesdheloise.fr/@heloise");
        expect(first).not.toHaveProperty("name");
        expect(first.signUp).toHaveLength(3);
        const [firstFirstSignUp] = first.signUp;
        expect(firstFirstSignUp).toHaveProperty("priority", 1);
        expect(firstFirstSignUp).toHaveProperty(
          "signUpUrl",
          "https://enfants-et-famille.podcasts.chat/auth/sign_up"
        );
        expect(firstFirstSignUp).toHaveProperty(
          "homeUrl",
          "https://enfants-et-famille.podcasts.chat/public"
        );

        expect(second).toHaveProperty("platform", "facebook");
        expect(second).toHaveProperty("priority", 66.6);
        expect(second).toHaveProperty("id", "LesPoesiesDHeloise");
        expect(second).toHaveProperty("url", "https://www.facebook.com/LesPoesiesDHeloise");
        expect(second).not.toHaveProperty("name");
        expect(second.signUp).toHaveLength(1);
        const [firstSecondSignUp] = second.signUp;
        expect(firstSecondSignUp).not.toHaveProperty("priority");
        expect(firstSecondSignUp).toHaveProperty(
          "signUpUrl",
          "https://www.facebook.com/r.php?display=page"
        );
        expect(firstSecondSignUp).toHaveProperty("homeUrl", "https://www.facebook.com/");
        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });
    });

    describe("item", () => {
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
        const result = parseFeed(xml);

        expect(result).not.toHaveProperty("podcastSocialInteraction");
        const [first] = result.items;

        expect(first).toHaveProperty("podcastSocialInteraction");
        expect(first.podcastSocialInteraction).toHaveLength(1);

        expect(first.podcastSocialInteraction[0]).toHaveProperty("platform", "twitter");
        expect(first.podcastSocialInteraction[0]).toHaveProperty("id", "@Podverse");
        expect(first.podcastSocialInteraction[0]).toHaveProperty("priority", 2);
        expect(first.podcastSocialInteraction[0]).toHaveProperty(
          "pubDate",
          new Date("2021-04-14T10:25:42Z")
        );
        expect(first.podcastSocialInteraction[0]).toHaveProperty(
          "url",
          "https://twitter.com/Podverse/status/1375624446296395781"
        );

        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });
    });
  });

  describe("podcast:medium", () => {
    const supportedName = "medium";
    it("correctly identifies a basic feed", () => {
      const result = parseFeed(feed);

      expect(result).not.toHaveProperty("medium");
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("extracts node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:medium>podcast</podcast:medium>
        `
      );
      const result = parseFeed(xml);

      expect(result).toHaveProperty("medium", PhasePendingMedium.Podcast);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("extracts the first populated node", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:medium></podcast:medium>
        <podcast:medium>audiobook</podcast:medium>
        <podcast:medium>podcast</podcast:medium>
        `
      );
      const result = parseFeed(xml);

      expect(result).toHaveProperty("medium", PhasePendingMedium.Audiobook);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("ignores unknown types", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:medium>asfd</podcast:medium>
        <podcast:medium>audiobook</podcast:medium>
        `
      );
      const result = parseFeed(xml);

      expect(result).toHaveProperty("medium", PhasePendingMedium.Audiobook);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
  });
});
