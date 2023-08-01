/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as helpers from "../../__test__/helpers";

const phase = Infinity;

describe("phase pending", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("podcast:id", () => {
    const supportedName = "id";

    it("correctly identifies a basic feed", () => {
      const result = helpers.parseValidFeed(feed);

      expect(result).not.toHaveProperty("podcastId");
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("ignores missing platform", () => {
      const xml = helpers.spliceFeed(
        feed,
        // missing platform, not valid
        `<podcast:id id="70471" url="https://www.deezer.com/show/70471"/>`
      );
      const result = helpers.parseValidFeed(xml);

      expect(result).not.toHaveProperty("podcastId");
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("extracts a single id", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:id platform="deezer" id="70471" url="https://www.deezer.com/show/70471"/>`
      );
      const result = helpers.parseValidFeed(xml);

      expect(result.podcastId).toHaveLength(1);
      const [first] = result.podcastId ?? [];

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
      const result = helpers.parseValidFeed(xml);

      expect(result.podcastId).toHaveLength(2);
      const [first, second] = result.podcastId ?? [];

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
      const result = helpers.parseValidFeed(xml);

      expect(result.podcastId).toHaveLength(1);
      const [first] = result.podcastId ?? [];

      expect(first).toHaveProperty("platform", "deezer");
      expect(first).toHaveProperty("url", "https://www.deezer.com/show/70471");
      expect(first).not.toHaveProperty("id");
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
  });

  describe("podcast:social", () => {
    const supportedName = "social";

    it("correctly identifies a basic feed", () => {
      const result = helpers.parseValidFeed(feed);

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
        const result = helpers.parseValidFeed(xml);

        expect(result.podcastSocial).toHaveLength(1);
        const [first] = result.podcastSocial ?? [];

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
        const result = helpers.parseValidFeed(xml);

        expect(result.podcastSocial).toHaveLength(2);
        const [first, second] = result.podcastSocial ?? [];

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
        const result = helpers.parseValidFeed(xml);

        expect(result.podcastSocial).toHaveLength(2);
        const [first, second] = result.podcastSocial ?? [];

        expect(first).toHaveProperty("platform", "activitypub");
        expect(first).toHaveProperty("priority", 1);
        expect(first).toHaveProperty("id", "@heloise@lespoesiesdheloise.fr");
        expect(first).toHaveProperty("url", "https://lespoesiesdheloise.fr/@heloise");
        expect(first).not.toHaveProperty("name");
        expect(first.signUp).toHaveLength(3);
        const [firstFirstSignUp] = first.signUp ?? [];
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
        const [firstSecondSignUp] = second.signUp ?? [];
        expect(firstSecondSignUp).not.toHaveProperty("priority");
        expect(firstSecondSignUp).toHaveProperty(
          "signUpUrl",
          "https://www.facebook.com/r.php?display=page"
        );
        expect(firstSecondSignUp).toHaveProperty("homeUrl", "https://www.facebook.com/");
        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });
    });
  });

  describe("podcast:recommendations", () => {
    const supportedName = "recommendations";

    it("correctly identifies a basic feed", () => {
      const result = helpers.parseValidFeed(feed);

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
        const result = helpers.parseValidFeed(xml);

        expect(result.podcastRecommendations).toHaveLength(1);

        expect(result.podcastRecommendations?.[0]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=1234"
        );
        expect(result.podcastRecommendations?.[0]).toHaveProperty("type", "application/json");
        expect(result.podcastRecommendations?.[0]).not.toHaveProperty("language");
        expect(result.podcastRecommendations?.[0]).not.toHaveProperty("text");

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
        const result = helpers.parseValidFeed(xml);

        expect(result.podcastRecommendations).toHaveLength(4);

        expect(result.podcastRecommendations?.[0]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=1234"
        );
        expect(result.podcastRecommendations?.[0]).toHaveProperty("type", "application/json");
        expect(result.podcastRecommendations?.[0]).not.toHaveProperty("language");
        expect(result.podcastRecommendations?.[0]).not.toHaveProperty("text");

        expect(result.podcastRecommendations?.[1]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=5678"
        );
        expect(result.podcastRecommendations?.[1]).toHaveProperty("type", "application/json");
        expect(result.podcastRecommendations?.[1]).toHaveProperty("language", "es");
        expect(result.podcastRecommendations?.[1]).not.toHaveProperty("text");

        expect(result.podcastRecommendations?.[2]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=9012"
        );
        expect(result.podcastRecommendations?.[2]).toHaveProperty("type", "application/json");
        expect(result.podcastRecommendations?.[2]).toHaveProperty("language", "en");
        expect(result.podcastRecommendations?.[2]).not.toHaveProperty("text");

        expect(result.podcastRecommendations?.[3]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=3456"
        );
        expect(result.podcastRecommendations?.[3]).toHaveProperty("type", "application/json");
        expect(result.podcastRecommendations?.[3]).not.toHaveProperty("language");
        expect(result.podcastRecommendations?.[3]).toHaveProperty("text", "Content");

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
        const result = helpers.parseValidFeed(xml);

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
        const result = helpers.parseValidFeed(xml);

        expect(result.items[0].podcastRecommendations).toHaveLength(1);

        expect(result.items[0].podcastRecommendations?.[0]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=1234"
        );
        expect(result.items[0].podcastRecommendations?.[0]).toHaveProperty(
          "type",
          "application/json"
        );
        expect(result.items[0].podcastRecommendations?.[0]).not.toHaveProperty("language");
        expect(result.items[0].podcastRecommendations?.[0]).not.toHaveProperty("text");

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
        const result = helpers.parseValidFeed(xml);

        expect(result.items[0].podcastRecommendations).toHaveLength(4);

        expect(result.items[0].podcastRecommendations?.[0]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=1234"
        );
        expect(result.items[0].podcastRecommendations?.[0]).toHaveProperty(
          "type",
          "application/json"
        );
        expect(result.items[0].podcastRecommendations?.[0]).not.toHaveProperty("language");
        expect(result.items[0].podcastRecommendations?.[0]).not.toHaveProperty("text");

        expect(result.items[0].podcastRecommendations?.[1]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=5678"
        );
        expect(result.items[0].podcastRecommendations?.[1]).toHaveProperty(
          "type",
          "application/json"
        );
        expect(result.items[0].podcastRecommendations?.[1]).toHaveProperty("language", "es");
        expect(result.items[0].podcastRecommendations?.[1]).not.toHaveProperty("text");

        expect(result.items[0].podcastRecommendations?.[2]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=9012"
        );
        expect(result.items[0].podcastRecommendations?.[2]).toHaveProperty(
          "type",
          "application/json"
        );
        expect(result.items[0].podcastRecommendations?.[2]).toHaveProperty("language", "en");
        expect(result.items[0].podcastRecommendations?.[2]).not.toHaveProperty("text");

        expect(result.items[0].podcastRecommendations?.[3]).toHaveProperty(
          "url",
          "https://domain.tld/recommendation?guid=3456"
        );
        expect(result.items[0].podcastRecommendations?.[3]).toHaveProperty(
          "type",
          "application/json"
        );
        expect(result.items[0].podcastRecommendations?.[3]).not.toHaveProperty("language");
        expect(result.items[0].podcastRecommendations?.[3]).toHaveProperty("text", "Content");

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
        const result = helpers.parseValidFeed(xml);

        expect(result).not.toHaveProperty("podcastRecommendations");
        expect(result.items[0]).not.toHaveProperty("podcastRecommendations");

        expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
      });
    });
  });

  describe("podcast:gateway", () => {
    const supportedName = "gateway";

    it("is not marked as supported when it isn't in the feed", () => {
      const result = helpers.parseValidFeed(feed);

      result.items.forEach((item) => {
        expect(item).not.toHaveProperty("podcastGateway");
      });
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("is marked as supported when the first item has only a message", () => {
      const xml = helpers.spliceFirstItem(feed, `<podcast:gateway>Start here!</podcast:gateway>`);
      const result = helpers.parseValidFeed(xml);

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
      const result = helpers.parseValidFeed(xml);

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
      const result = helpers.parseValidFeed(
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

  describe("chat", () => {
    function spliceInLiveItem(thisFeed: string, chatBlock: string, item = 0): string {
      if (item > 2) {
        throw new Error("Only three items eligible, zero based index");
      }
      return helpers.spliceFeed(
        thisFeed,
        `
        <podcast:liveItem status="LIVE" start="2021-09-26T07:30:00.000-0600"
        end="2021-09-26T08:30:00.000-0600">
          <title>Podcasting 2.0 Live Stream</title>
          <guid>e32b4890-983b-4ce5-8b46-f2d6bc1d8819</guid>
          <enclosure url="https://example.com/pc20/livestream?format=.mp3" type="audio/mpeg" length="312" />
          <podcast:contentLink href="https://example.com/html/livestream">Listen Live!</podcast:contentLink>
          ${item === 0 ? chatBlock : ""}
        </podcast:liveItem>
        <podcast:liveItem status="pending" start="2021-09-27T07:30:00.000-0600"
        end="2021-09-27T08:30:00.000-0600">
          <title>Podcasting 2.0 Live Stream</title>
          <guid>e32b4890-983b-4ce5-8b46-f2d6bc1d8819</guid>
          <enclosure url="https://example.com/pc20/livestream?format=.mp3" type="audio/mpeg" length="312" />
          <podcast:contentLink href="https://example.com/html/livestream">Listen Live!</podcast:contentLink>
          ${item === 1 ? chatBlock : ""}
        </podcast:liveItem>
        <podcast:liveItem status="ENded" start="2021-09-28T07:30:00.000-0600"
        end="2021-09-28T08:30:00.000-0600">
          <title>Podcasting 2.0 Live Stream</title>
          <guid>e32b4890-983b-4ce5-8b46-f2d6bc1d8819</guid>
          <enclosure url="https://example.com/pc20/livestream?format=.mp3" type="audio/mpeg" length="312" />
          <podcast:contentLink href="https://example.com/html/livestream">Listen Live!</podcast:contentLink>
          ${item === 2 ? chatBlock : ""}
        </podcast:liveItem>
        `
      );
    }
    // parent is liveItem - https://github.com/Podcastindex-org/podcast-namespace/discussions/502
    it("extracts IRC", () => {
      const chatBlock = `<podcast:chat
          server="irc.zeronode.net"
          protocol="irc"
          accountId="@jsmith"
          space="#myawesomepodcast"
          embedUrl="https://map.example.org/chat/iframe.html"
      />`;
      const result = helpers.parseValidFeed(spliceInLiveItem(feed, chatBlock));

      expect(result.podcastLiveItems).toHaveLength(3);
      const [firstLIT] = result.podcastLiveItems ?? [];

      expect(firstLIT.chat).toHaveProperty("server", "irc.zeronode.net");
      expect(firstLIT.chat).toHaveProperty("protocol", "irc");
      expect(firstLIT.chat).toHaveProperty("accountId", "@jsmith");
      expect(firstLIT.chat).toHaveProperty("space", "#myawesomepodcast");
      expect(firstLIT.chat).toHaveProperty("embedUrl", "https://map.example.org/chat/iframe.html");
    });

    it("extracts XMPP", () => {
      const chatBlock = `<podcast:chat
        server="jabber.example.com"
        protocol="XMPP"
        accountId="jsmith@jabber.example.org"
        space="myawesomepodcast@jabber.example.org"
    />`;
      const result = helpers.parseValidFeed(spliceInLiveItem(feed, chatBlock));

      expect(result.podcastLiveItems).toHaveLength(3);
      const [firstLIT] = result.podcastLiveItems ?? [];

      expect(firstLIT.chat).toHaveProperty("server", "jabber.example.com");
      expect(firstLIT.chat).toHaveProperty("protocol", "xmpp");
      expect(firstLIT.chat).toHaveProperty("accountId", "jsmith@jabber.example.org");
      expect(firstLIT.chat).toHaveProperty("space", "myawesomepodcast@jabber.example.org");
      expect(firstLIT.chat).not.toHaveProperty("embedUrl");
    });

    it("extracts nostril", () => {
      const chatBlock = `<podcast:chat
        server="relay.example.com"
        protocol="NoSTr"
        accountId="npub1pvdw7mm7k20t9dn9gful8n5xua5yv8rmgd9wul88qq5dxj80lpxqd39r3u"
        space="#myawesomepodcast_episode129"
    />`;

      const result = helpers.parseValidFeed(spliceInLiveItem(feed, chatBlock, 2));

      expect(result.podcastLiveItems).toHaveLength(3);
      const [, , thirdLIT] = result.podcastLiveItems ?? [];

      expect(thirdLIT.chat).toHaveProperty("server", "relay.example.com");
      expect(thirdLIT.chat).toHaveProperty("protocol", "nostr");
      expect(thirdLIT.chat).toHaveProperty(
        "accountId",
        "npub1pvdw7mm7k20t9dn9gful8n5xua5yv8rmgd9wul88qq5dxj80lpxqd39r3u"
      );
      expect(thirdLIT.chat).toHaveProperty("space", "#myawesomepodcast_episode129");
      expect(thirdLIT.chat).not.toHaveProperty("embedUrl");
    });

    it("extracts matrix", () => {
      const chatBlock = `<podcast:chat
        server="jupiterbroadcasting.com"
        protocol="matrix"
        accountId="@chrislas:jupiterbroadcasting.com"
        space="#general:jupiterbroadcasting.com"
    />`;
      const result = helpers.parseValidFeed(spliceInLiveItem(feed, chatBlock));

      expect(result.podcastLiveItems).toHaveLength(3);
      const [firstLIT] = result.podcastLiveItems ?? [];

      expect(firstLIT.chat).toHaveProperty("server", "jupiterbroadcasting.com");
      expect(firstLIT.chat).toHaveProperty("protocol", "matrix");
      expect(firstLIT.chat).toHaveProperty("accountId", "@chrislas:jupiterbroadcasting.com");
      expect(firstLIT.chat).toHaveProperty("space", "#general:jupiterbroadcasting.com");
      expect(firstLIT.chat).not.toHaveProperty("embedUrl");
    });
  });
});
