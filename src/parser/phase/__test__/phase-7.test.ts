/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as helpers from "../../__test__/helpers";
import { spliceFeed, spliceFirstItem } from "../../__test__/helpers";

const phase = 7;

describe("phase 7", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("chat", () => {
    const supportedName = "chat";

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
      />`;
      const result = helpers.parseValidFeed(spliceInLiveItem(feed, chatBlock));

      expect(result.podcastLiveItems).toHaveLength(3);
      const [firstLIT] = result.podcastLiveItems ?? [];

      expect(firstLIT.chat).toHaveProperty("server", "irc.zeronode.net");
      expect(firstLIT.chat).toHaveProperty("protocol", "irc");
      expect(firstLIT.chat).toHaveProperty("accountId", "@jsmith");
      expect(firstLIT.chat).toHaveProperty("space", "#myawesomepodcast");
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
    });

    it("extracts IRC for item level", () => {
      const chatBlock = `<podcast:chat
          server="irc.zeronode.net"
          protocol="irc"
          accountId="@jsmith"
          space="#myawesomepodcast"
      />`;
      const result = helpers.parseValidFeed(spliceFirstItem(feed, chatBlock));

      const [firstItem] = result.items ?? [];

      expect(firstItem.chat).toHaveProperty("server", "irc.zeronode.net");
      expect(firstItem.chat).toHaveProperty("protocol", "irc");
      expect(firstItem.chat).toHaveProperty("accountId", "@jsmith");
      expect(firstItem.chat).toHaveProperty("space", "#myawesomepodcast");
    });

    it("extracts XMPP from the feed", () => {
      const chatBlock = `<podcast:chat
        server="jabber.example.com"
        protocol="XMPP"
        accountId="jsmith@jabber.example.org"
        space="myawesomepodcast@jabber.example.org"
    />`;
      const result = helpers.parseValidFeed(spliceFeed(feed, chatBlock));

      expect(result.chat).toHaveProperty("server", "jabber.example.com");
      expect(result.chat).toHaveProperty("protocol", "xmpp");
      expect(result.chat).toHaveProperty("accountId", "jsmith@jabber.example.org");
      expect(result.chat).toHaveProperty("space", "myawesomepodcast@jabber.example.org");
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
  });
  describe("publisher", () => {
    const supportedName = "publisher";
    it("extracts a valid publisher from the feed", () => {
      const chatBlock = `<podcast:publisher>
          <podcast:remoteItem medium="publisher" feedGuid="003af0a0-6a45-55bf-b765-68e3d349551a" feedUrl="https://agilesetmedia.com/assets/static/feeds/publisher.xml"/>
      </podcast:publisher>`;
      const result = helpers.parseValidFeed(spliceFeed(feed, chatBlock));

      expect(result.podcastPublisher).toHaveProperty(
        "feedGuid",
        "003af0a0-6a45-55bf-b765-68e3d349551a"
      );
      expect(result.podcastPublisher).toHaveProperty(
        "feedUrl",
        "https://agilesetmedia.com/assets/static/feeds/publisher.xml"
      );
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
  });
});
