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

  describe("liveValue", () => {
    function addLiveValueToFeed(thisFeed: string, liveValue: string): string {
      return helpers.spliceFeed(
        thisFeed,
        `
        <podcast:liveItem status="pending" start="2023-10-05T24:00:00.000 -0500"
            end="2023-10-06T01:00:000 -0500">
            <title>Homegrown Hits Episode 04 LIVE</title>
            ${liveValue}
            <enclosure length="33" type="audio/mpeg"
                url="https://stream.bowlafterbowl.com/listen/bowlafterbowl/stream.mp3" />
            <guid isPermaLink="false">81884459-5474-430a-a72f-c784b59219c9</guid>
            <itunes:image
                href="https://bowlafterbowl.com/wp-content/uploads/2023/09/HomegrownHitsArt.png" />
            <itunes:subtitle>Homegrown Hits Episode 04 Live</itunes:subtitle>
            <itunes:summary>
                <![CDATA[ <p>Homegrown Hits LIVE Episode 04</p> <p>September 21st 2023</p> <p>Get a modern app at podcastapps.com to listen live and support artists directly!</p> ]]>
            </itunes:summary>
            <link>https://homegrownhits.xyz</link>
            <podcast:person href="https://bowlafterbowl.com"
                img="https://ableandthewolf.com/static/media/laurien.png" group="cast" role="host">
                DuhLaurien</podcast:person>
            <podcast:person href="" img="" group="cast" role="host">MaryKateUltra</podcast:person>
            <podcast:person group="cast" role="host">Daisy B. Cooper</podcast:person>
            <podcast:images
                srcset="https://behindthesch3m3s.com/wp-content/uploads/2023/09/homegrown-hits-smoke-dance-pink.gif 1080w" />
            <podcast:chat server="irc.zeronode.net" protocol="irc" accountId="DuhLaurien"
                space="#HomegrownHits"
                embedUrl="https://kiwiirc.com/nextclient/irc.zeronode.net/?nick=Dude?#HomegrownHits" />
            <podcast:value type="lightning" method="keysend" suggested="0.00000069420">
                <podcast:valueRecipient name="DuhLaurien"
                    address="03ba0dc26e137f7fc5406908aaf614807cde5010a56b39973d68377fb0aa77e5d5"
                    type="node" split="30" />
                <podcast:valueRecipient name="marykateultra@fountain.fm" type="node"
                    address="0332d57355d673e217238ce3e4be8491aa6b2a13f95494133ee243e57df1653ace"
                    customKey="112111100" customValue="vI2zSit4cEphEcc8ciDS" split="33" />
                <podcast:valueRecipient name="daisybcooper@fountain.fm" type="node"
                    address="0332d57355d673e217238ce3e4be8491aa6b2a13f95494133ee243e57df1653ace"
                    customKey="112111100" customValue="XZ62AStTe4Y63R54VoTf" split="33" />
                <podcast:valueRecipient name="SirVoBlitz" type="node"
                    address="030a58b8653d32b99200a2334cfe913e51dc7d155aa0116c176657a4f1722677a3"
                    customKey="696969" customValue="wTNpYiVzK1EqHwFuK4kY" split="1" />
                <podcast:valueRecipient name="cottongin" type="node"
                    address="030a58b8653d32b99200a2334cfe913e51dc7d155aa0116c176657a4f1722677a3"
                    customKey="696969" customValue="5mZYvK0KkmbXcam43VC6" split="1" />
                <podcast:valueRecipient name="BoostBot" type="node"
                    address="03d55f4d4c870577e98ac56605a54c5ed20c8897e41197a068fd61bdb580efaa67"
                    split="1" />
                <podcast:valueRecipient name="BoostAfterBoost" type="node"
                    address="03ecb3ee55ba6324d40bea174de096dc9134cb35d990235723b37ae9b5c49f4f53"
                    split="1" />
            </podcast:value>
        </podcast:liveItem>
        `
      );
    }
    it("extracts the uri", () => {
      const liveValue = `<podcast:liveValue uri="https://curiohoster.com/event?event_id=00f1a2a1-f360-4be4-a87b-967dd3a850a4" protocol="socket.io"/>`;
      const result = helpers.parseValidFeed(addLiveValueToFeed(feed, liveValue));

      expect(result.podcastLiveItems).toHaveLength(1);
      const [firstLIT] = result.podcastLiveItems ?? [];

      expect(firstLIT.liveUpdates).toHaveProperty(
        "uri",
        "https://curiohoster.com/event?event_id=00f1a2a1-f360-4be4-a87b-967dd3a850a4"
      );
    });
    it("extracts the the protocol", () => {
      const liveValue = `<podcast:liveValue uri="https://curiohoster.com/event?event_id=00f1a2a1-f360-4be4-a87b-967dd3a850a4" protocol="socket.io"/>`;
      const result = helpers.parseValidFeed(addLiveValueToFeed(feed, liveValue));

      expect(result.podcastLiveItems).toHaveLength(1);
      const [firstLIT] = result.podcastLiveItems ?? [];

      expect(firstLIT.liveUpdates).toHaveProperty("protocol", "socket.io");
    });
  });
});
