/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as helpers from "../../__test__/helpers";
import { parseFeed } from "../../index";
import { PhasePendingLiveStatus } from "../phase-pending";

const phase = Infinity;

describe("phase pending", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("podcast:liveItem", () => {
    const supportedName = "liveItem";

    it("correctly identifies a basic feed", () => {
      const result = parseFeed(feed);

      expect(result).not.toHaveProperty("podcastLiveItems");
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("supports multiple liveItem", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:liveItem
          status="LIVE"
          start="2021-09-26T07:30:00.000-0600"
          end="2021-09-26T08:30:00.000-0600"
        ></podcast:liveItem>
        <podcast:liveItem
          status="pending"
          start="2021-09-27T07:30:00.000-0600"
          end="2021-09-27T08:30:00.000-0600"
        ></podcast:liveItem>
        <podcast:liveItem
          status="ended"
          start="2021-09-28T07:30:00.000-0600"
          end="2021-09-28T08:30:00.000-0600"
        ></podcast:liveItem>
        `
      );
      const result = parseFeed(xml);

      expect(result).toHaveProperty("podcastLiveItems");
      expect(result.podcastLiveItems).toHaveLength(3);

      expect(result.podcastLiveItems[0]).toHaveProperty("status", PhasePendingLiveStatus.Live);
      expect(result.podcastLiveItems[0]).toHaveProperty(
        "start",
        new Date("2021-09-26T07:30:00.000-0600")
      );
      expect(result.podcastLiveItems[0]).toHaveProperty(
        "end",
        new Date("2021-09-26T08:30:00.000-0600")
      );

      expect(result.podcastLiveItems[1]).toHaveProperty("status", PhasePendingLiveStatus.Pending);
      expect(result.podcastLiveItems[1]).toHaveProperty(
        "start",
        new Date("2021-09-27T07:30:00.000-0600")
      );
      expect(result.podcastLiveItems[1]).toHaveProperty(
        "end",
        new Date("2021-09-27T08:30:00.000-0600")
      );

      expect(result.podcastLiveItems[2]).toHaveProperty("status", PhasePendingLiveStatus.Ended);
      expect(result.podcastLiveItems[2]).toHaveProperty(
        "start",
        new Date("2021-09-28T07:30:00.000-0600")
      );
      expect(result.podcastLiveItems[2]).toHaveProperty(
        "end",
        new Date("2021-09-28T08:30:00.000-0600")
      );

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("supports a basic liveItem", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:liveItem
          status="live"
          start="2021-09-26T07:30:00.000-0600"
          end="2021-09-26T08:30:00.000-0600"
        ></podcast:liveItem>
        `
      );
      const result = parseFeed(xml);

      expect(result).toHaveProperty("podcastLiveItems");
      expect(result.podcastLiveItems).toHaveLength(1);

      expect(result.podcastLiveItems[0]).not.toHaveProperty("item");
      expect(result.podcastLiveItems[0]).toHaveProperty("status", PhasePendingLiveStatus.Live);
      expect(result.podcastLiveItems[0]).toHaveProperty(
        "start",
        new Date("2021-09-26T07:30:00.000-0600")
      );
      expect(result.podcastLiveItems[0]).toHaveProperty(
        "end",
        new Date("2021-09-26T08:30:00.000-0600")
      );

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("support a sub-set of nested item tags", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:liveItem
          status="live"
          start="2021-09-26T07:30:00.000-0600"
          end="2021-09-26T08:30:00.000-0600"
        >
            <title>Podcasting 2.0 Live Show</title>
            <description>A look into the future of podcasting and how we get to Podcasting 2.0!</description>
            <link>https://example.com/podcast/live</link>
            <guid isPermaLink="true">https://example.com/live</guid>
            <author>John Doe (john@example.com)</author>
            <podcast:images srcset="https://example.com/images/ep3/pci_avatar-massive.jpg 1500w,
                https://example.com/images/ep3/pci_avatar-middle.jpg 600w,
                https://example.com/images/ep3/pci_avatar-small.jpg 300w,
                https://example.com/images/ep3/pci_avatar-tiny.jpg 150w"
            />
            <podcast:person href="https://www.podchaser.com/creators/adam-curry-107ZzmWE5f" img="https://example.com/images/adamcurry.jpg">Adam Curry</podcast:person>
            <podcast:person role="guest" href="https://github.com/daveajones/" img="https://example.com/images/davejones.jpg">Dave Jones</podcast:person>
            <podcast:person group="visuals" role="cover art designer" href="https://example.com/artist/beckysmith">Becky Smith</podcast:person>
            <podcast:alternateEnclosure type="audio/mpeg" length="312">
                <podcast:source uri="https://example.com/pc20/livestream" />
            </podcast:alternateEnclosure>
        </podcast:liveItem>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("podcastLiveItems");
      expect(result.podcastLiveItems).toHaveLength(1);

      expect(result.podcastLiveItems[0]).toHaveProperty("status", PhasePendingLiveStatus.Live);
      expect(result.podcastLiveItems[0]).toHaveProperty(
        "start",
        new Date("2021-09-26T07:30:00.000-0600")
      );
      expect(result.podcastLiveItems[0]).toHaveProperty(
        "end",
        new Date("2021-09-26T08:30:00.000-0600")
      );
      expect(result.podcastLiveItems[0]).toHaveProperty("item");
      expect(result.podcastLiveItems[0].item).toHaveProperty("title", "Podcasting 2.0 Live Show");
      expect(result.podcastLiveItems[0].item).toHaveProperty(
        "description",
        "A look into the future of podcasting and how we get to Podcasting 2.0!"
      );
      expect(result.podcastLiveItems[0].item).toHaveProperty("guid", "https://example.com/live");
      expect(result.podcastLiveItems[0].item).toHaveProperty(
        "author",
        "John Doe (john@example.com)"
      );

      expect(result.podcastLiveItems[0].item.podcastImages).toHaveLength(4);
      expect(result.podcastLiveItems[0].item.podcastPeople).toHaveLength(3);
      expect(result.podcastLiveItems[0].item.alternativeEnclosures).toHaveLength(1);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
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

  describe("podcast:recommendations", () => {
    const supportedName = "recommendations";

    it("correctly identifies a basic feed", () => {
      const result = parseFeed(feed);

      expect(result).not.toHaveProperty("podcastRecommendations");

      result.items.forEach((item) => {
        expect(item).not.toHaveProperty("podcastRecommendations");
      });
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    describe("feed", () => {
      it("extracts the sample values", () => {
        const xml = helpers.spliceFeed(
          feed,
          `
          <podcast:recommendations url="https://domain.tld/recommendation?guid=1234" type="application/json" />
          `
        );
        const result = parseFeed(xml);

        expect(result.podcastRecommendations).toHaveLength(1);

        expect(result.podcastRecommendations[0]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=1234"
        );
        expect(result.podcastRecommendations[0]).toHaveProperty("type", "application/json");
        expect(result.podcastRecommendations[0]).not.toHaveProperty("language");
        expect(result.podcastRecommendations[0]).not.toHaveProperty("text");

        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });

      it("supports multiple values", () => {
        const xml = helpers.spliceFeed(
          feed,
          `
          <podcast:recommendations url="https://domain.tld/recommendation?guid=1234" type="application/json" />
          <podcast:recommendations url="https://domain.tld/recommendation?guid=5678" type="application/json" language="es"/>
          <podcast:recommendations url="https://domain.tld/recommendation?guid=9012" type="application/json" language="en"/>
          <podcast:recommendations url="https://domain.tld/recommendation?guid=3456" type="application/json">Content</podcast:recommendations>
          `
        );
        const result = parseFeed(xml);

        expect(result.podcastRecommendations).toHaveLength(4);

        expect(result.podcastRecommendations[0]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=1234"
        );
        expect(result.podcastRecommendations[0]).toHaveProperty("type", "application/json");
        expect(result.podcastRecommendations[0]).not.toHaveProperty("language");
        expect(result.podcastRecommendations[0]).not.toHaveProperty("text");

        expect(result.podcastRecommendations[1]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=5678"
        );
        expect(result.podcastRecommendations[1]).toHaveProperty("type", "application/json");
        expect(result.podcastRecommendations[1]).toHaveProperty("language", "es");
        expect(result.podcastRecommendations[1]).not.toHaveProperty("text");

        expect(result.podcastRecommendations[2]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=9012"
        );
        expect(result.podcastRecommendations[2]).toHaveProperty("type", "application/json");
        expect(result.podcastRecommendations[2]).toHaveProperty("language", "en");
        expect(result.podcastRecommendations[2]).not.toHaveProperty("text");

        expect(result.podcastRecommendations[3]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=3456"
        );
        expect(result.podcastRecommendations[3]).toHaveProperty("type", "application/json");
        expect(result.podcastRecommendations[3]).not.toHaveProperty("language");
        expect(result.podcastRecommendations[3]).toHaveProperty("text", "Content");

        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });

      it("ignores nodes missing required attributes", () => {
        const xml = helpers.spliceFeed(
          feed,
          `
          <podcast:recommendations url="" type="application/json" />
          <podcast:recommendations url="https://domain.tld/recommendation?guid=5678" type="" language="es"/>
          <podcast:recommendations type="application/json" language="en"/>
          <podcast:recommendations url="https://domain.tld/recommendation?guid=3456">Content</podcast:recommendations>
          `
        );
        const result = parseFeed(xml);

        expect(result).not.toHaveProperty("podcastRecommendations");

        expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
      });
    });

    describe("item", () => {
      it("extracts the sample values", () => {
        const xml = helpers.spliceFirstItem(
          feed,
          `
          <podcast:recommendations url="https://domain.tld/recommendation?guid=1234" type="application/json" />
          `
        );
        const result = parseFeed(xml);

        expect(result.items[0].podcastRecommendations).toHaveLength(1);

        expect(result.items[0].podcastRecommendations[0]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=1234"
        );
        expect(result.items[0].podcastRecommendations[0]).toHaveProperty(
          "type",
          "application/json"
        );
        expect(result.items[0].podcastRecommendations[0]).not.toHaveProperty("language");
        expect(result.items[0].podcastRecommendations[0]).not.toHaveProperty("text");

        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });

      it("supports multiple values", () => {
        const xml = helpers.spliceFirstItem(
          feed,
          `
          <podcast:recommendations url="https://domain.tld/recommendation?guid=1234" type="application/json" />
          <podcast:recommendations url="https://domain.tld/recommendation?guid=5678" type="application/json" language="es"/>
          <podcast:recommendations url="https://domain.tld/recommendation?guid=9012" type="application/json" language="en"/>
          <podcast:recommendations url="https://domain.tld/recommendation?guid=3456" type="application/json">Content</podcast:recommendations>
          `
        );
        const result = parseFeed(xml);

        expect(result.items[0].podcastRecommendations).toHaveLength(4);

        expect(result.items[0].podcastRecommendations[0]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=1234"
        );
        expect(result.items[0].podcastRecommendations[0]).toHaveProperty(
          "type",
          "application/json"
        );
        expect(result.items[0].podcastRecommendations[0]).not.toHaveProperty("language");
        expect(result.items[0].podcastRecommendations[0]).not.toHaveProperty("text");

        expect(result.items[0].podcastRecommendations[1]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=5678"
        );
        expect(result.items[0].podcastRecommendations[1]).toHaveProperty(
          "type",
          "application/json"
        );
        expect(result.items[0].podcastRecommendations[1]).toHaveProperty("language", "es");
        expect(result.items[0].podcastRecommendations[1]).not.toHaveProperty("text");

        expect(result.items[0].podcastRecommendations[2]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=9012"
        );
        expect(result.items[0].podcastRecommendations[2]).toHaveProperty(
          "type",
          "application/json"
        );
        expect(result.items[0].podcastRecommendations[2]).toHaveProperty("language", "en");
        expect(result.items[0].podcastRecommendations[2]).not.toHaveProperty("text");

        expect(result.items[0].podcastRecommendations[3]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=3456"
        );
        expect(result.items[0].podcastRecommendations[3]).toHaveProperty(
          "type",
          "application/json"
        );
        expect(result.items[0].podcastRecommendations[3]).not.toHaveProperty("language");
        expect(result.items[0].podcastRecommendations[3]).toHaveProperty("text", "Content");

        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });

      it("ignores nodes missing required attributes", () => {
        const xml = helpers.spliceFirstItem(
          feed,
          `
          <podcast:recommendations url="" type="application/json" />
          <podcast:recommendations url="https://domain.tld/recommendation?guid=5678" type="" language="es"/>
          <podcast:recommendations type="application/json" language="en"/>
          <podcast:recommendations url="https://domain.tld/recommendation?guid=3456">Content</podcast:recommendations>
          `
        );
        const result = parseFeed(xml);

        expect(result).not.toHaveProperty("podcastRecommendations");
        expect(result.items[0]).not.toHaveProperty("podcastRecommendations");

        expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
      });
    });
  });

  describe("podcast:gateway", () => {
    const supportedName = "gateway";

    it("is not marked as supported when it isn't in the feed", () => {
      const result = parseFeed(feed);

      result.items.forEach((item) => {
        expect(item).not.toHaveProperty("podcastGateway");
      });
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("is marked as supported when the first item has only a message", () => {
      const xml = helpers.spliceFirstItem(feed, `<podcast:gateway>Start here!</podcast:gateway>`);
      const result = parseFeed(xml);

      const [first, second, third] = result.items;
      expect(first).toHaveProperty("podcastGateway");
      expect(first.podcastGateway).toHaveProperty("message", "Start here!");
      expect(second).not.toHaveProperty("podcastGateway");
      expect(third).not.toHaveProperty("podcastGateway");

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("is marked as supported when the third item has a message and order", () => {
      const xml = helpers.spliceLastItem(
        feed,
        `<podcast:gateway order="2">Start </podcast:gateway>`
      );
      const result = parseFeed(xml);

      const [first, second, third] = result.items;
      expect(first).not.toHaveProperty("podcastGateway");
      expect(second).not.toHaveProperty("podcastGateway");
      expect(third).toHaveProperty("podcastGateway");
      expect(third.podcastGateway).toHaveProperty("order", 2);
      expect(third.podcastGateway).toHaveProperty("message", "Start");

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    // will revisit this later, its a cool idea, but won't actually work given how things are
    // structured today
    it.skip("episodes are listed on the feed level in descending order", () => {
      const xml = helpers.spliceLastItem(
        feed,
        `<podcast:gateway order="1">Start Here</podcast:gateway>`
      );
      const result = parseFeed(
        helpers.spliceFirstItem(xml, `<podcast:gateway order="2">Start There</podcast:gateway>`)
      );

      const [first, second, third] = result.items;
      expect(first).toHaveProperty("podcastGateway");
      expect(second).not.toHaveProperty("podcastGateway");
      expect(third).toHaveProperty("podcastGateway");

      expect(result).toHaveProperty("gatewayEpisodes", [third.guid, first.guid]);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
  });
});
