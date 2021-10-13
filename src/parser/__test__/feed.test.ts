/* eslint-disable sonarjs/no-duplicate-string */
import { parseFeed } from "../index";
import { ItunesFeedType } from "../shared";
import * as helpers from "./helpers";

describe("feed handling", () => {
  const feed = `
    <?xml version="1.0" encoding="UTF-8"?>
    <rss xmlns:podcast="https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
        <channel>
        </channel>
    </rss>
`;

  describe("title", () => {
    it("extracts title node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <title>Test 123</title>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("title", "Test 123");
    });

    it("extracts first title node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <title>Test 123</title>
          <title>Test 345</title>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("title", "Test 123");
    });

    it("extracts first title node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <title></title>
          <title>Test 345</title>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("title", "Test 345");
    });

    it("sanitizes new lines ", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <title>Test
           123</title>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("title", "Test 123");
    });
  });

  describe("link", () => {
    it("extracts link node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <link>https://some-url-here</link>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("link", "https://some-url-here");
    });

    it("extracts link href text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <link href="https://some-other-url-here" />
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("link", "https://some-other-url-here");
    });

    it("uses url node as last resort", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <link />
          <url>https://final-fallback</url>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("link", "https://final-fallback");
    });
  });

  describe("description", () => {
    it("extracts the value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <description>hey   there</description>
          <description>hello</description>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("description", "hey there");
    });

    it("falls back to itunes:summary value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <itunes:summary>
          <![CDATA[ <p>bye</p> ]]>
          </itunes:summary>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("description", "<p>bye</p>");
    });

    it("prefers description value when the fall back exists", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <description>hello</description>
          <itunes:summary>
          <![CDATA[ <p>bye</p> ]]>
          </itunes:summary>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("description", "hello");
    });
  });

  describe("language", () => {
    it("extracts language node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <language>en-US</language>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("language", "en-US");
    });
  });

  describe("explicit", () => {
    it("matches true", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <itunes:explicit>true</itunes:explicit>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("explicit", true);
    });

    it("matches Yes", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <itunes:explicit>Yes</itunes:explicit>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("explicit", true);
    });

    it("matches No", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <itunes:explicit>No</itunes:explicit>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("explicit", false);
    });
  });

  describe("itunesImage", () => {
    it("extracts the url text value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
            <itunes:image>
              <url>https://some-great-url</url>
            </itunes:image>
          `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesImage", "https://some-great-url");
    });

    it("extracts the url text value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
            <itunes:image href="https://an-href" />
          `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesImage", "https://an-href");
    });

    it("extracts the node text value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
            <itunes:image>http://here-we-go</itunes:image>
          `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesImage", "http://here-we-go");
    });
  });

  describe("itunesCategory", () => {
    it("extracts a single category", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="Technology"/>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesCategory", ["technology"]);
    });

    it("extracts a heirarchical categories", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="News">
          <itunes:category text="Tech News"/>
        </itunes:category>
        <itunes:category text="Technology"/>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesCategory", ["news", "news > tech news", "technology"]);
    });

    it("extracts multiple non-herarchical categories", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="Business"/>
        <itunes:category text="News"/>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesCategory", ["business", "news"]);
    });
  });

  describe("generator", () => {
    it("extracts the node value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <generator>NPR API RSS Generator 0.94</generator>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("generator", "NPR API RSS Generator 0.94");
    });
  });

  describe("pubDate", () => {
    it("extracts the node value and converts to a date", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <pubDate>Tue, 18 May 2021 13:49:20 -0000</pubDate>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubDate", new Date("Tue, 18 May 2021 13:49:20 -0000"));
    });

    it("ignores bad values", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <pubDate>Yesteryear</pubDate>
        `
      );

      const result = parseFeed(xml);
      expect(result).not.toHaveProperty("pubDate");
    });

    it("falls back to lastBuildDate", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <lastBuildDate>Sun, 10 Oct 2021 23:02:57 PDT</lastBuildDate>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubDate", new Date("Sun, 10 Oct 2021 23:02:57 PDT"));
    });

    // TODO
    it.skip("falls back to newest item pubdate", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <pubDate>Thu, 30 Sep 2021 21:19:00 -0000</pubDate>
          <description>hello</description>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1-13845dce07dd/d11384ea-69b5-4e33-bd0e-5d33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        <item>
          <pubDate>1 Oct 2021 21:19:00 -0000</pubDate>
          <description>hello again</description>
          <guid isPermaLink="true">https://example.com/ep0005</guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1/d11384ea-69b5-4e33-bd0e-6b33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        <item>
        <pubDate>Wed, 29 Sept 2021 21:19:00 -0000</pubDate>
        <description>hello 2</description>
        <guid isPermaLink="true">https://example.com/ep0002</guid>
        <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5.mp3" length="78034115" type="audio/mpeg"/>
      </item>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubDate", new Date("1 Oct 2021 21:19:00 -0000"));
    });
  });

  describe("lastBuildDate", () => {
    it("extracts node value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <lastBuildDate>Sun, 10 Oct 2021 23:02:57 PDT</lastBuildDate>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("lastBuildDate", new Date("Sun, 10 Oct 2021 23:02:57 PDT"));
    });
  });

  describe("itunesType", () => {
    it("extracts node value (episodic)", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:type>episodic</itunes:type>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("itunesType", ItunesFeedType.Episodic);
    });

    it("extracts node value (serial)", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:type>Serial</itunes:type>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("itunesType", ItunesFeedType.Serial);
    });

    it("extracts node text attribute", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:type text="SERIAL" />
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("itunesType", ItunesFeedType.Serial);
    });
  });

  describe("itunesNewFeedUrl", () => {
    it("extracts node value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:new-feed-url>http://some-new-feed.com</itunes:new-feed-url>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("itunesNewFeedUrl", "http://some-new-feed.com");
    });
  });

  describe("categories", () => {
    it.todo("needs to handle Tech -> Technology");
  });

  describe("pubsub", () => {
    it("extracts the self url", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <atom:link href="https://feeds.megaphone.fm/pod-save-america" rel="" type="application/rss+xml"/>
        <atom:link href="" rel="self" type="application/rss+xml"/>
        <atom:link href="https://feeds.megaphone.fm/pod-save-america" rel="self" type="application/rss+xml"/>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubsub");
      expect(result.pubsub).toHaveProperty("self", "https://feeds.megaphone.fm/pod-save-america");
    });

    it("extracts the next url", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <atom:link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206" rel="next" type="application/rss+xml"/>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubsub");
      expect(result.pubsub).toHaveProperty(
        "next",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206"
      );
    });

    it("extracts multiple types", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <atom:link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss" rel="self" type="application/rss+xml"/>
        <atom:link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206" rel="next" type="application/rss+xml"/>        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubsub");
      expect(result.pubsub).toHaveProperty(
        "next",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206"
      );
      expect(result.pubsub).toHaveProperty(
        "self",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss"
      );
    });

    it("extracts the hub url", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <atom:link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss" rel="hub" type="application/rss+xml"/>
        <atom:link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206" rel="next" type="application/rss+xml"/>        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubsub");
      expect(result.pubsub).toHaveProperty(
        "next",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206"
      );
      expect(result.pubsub).toHaveProperty(
        "hub",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss"
      );
    });

    it("handles non-atom links", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss" rel="self" type="application/rss+xml"/>
        <link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss" rel="hub" type="application/rss+xml"/>
        <link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206" rel="next" type="application/rss+xml"/>        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubsub");
      expect(result.pubsub).toHaveProperty(
        "self",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss"
      );
      expect(result.pubsub).toHaveProperty(
        "next",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206"
      );
      expect(result.pubsub).toHaveProperty(
        "hub",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss"
      );
    });

    it("handles mixed links", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss" rel="self" type="application/rss+xml"/>
        <atom:link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss" rel="hub" type="application/rss+xml"/>
        <link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206" rel="next" type="application/rss+xml"/>        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubsub");
      expect(result.pubsub).toHaveProperty(
        "self",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss"
      );
      expect(result.pubsub).toHaveProperty(
        "next",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206"
      );
      expect(result.pubsub).toHaveProperty(
        "hub",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss"
      );
    });
  });

  describe("author", () => {
    it("extracts the node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:author>Founders Fund</itunes:author>

        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("author", "Founders Fund");
    });
  });

  describe("owner", () => {
    it("extracts name and email", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:owner>
          <itunes:name>Leo Laporte</itunes:name>
          <itunes:email>distro@twit.tv</itunes:email>
        </itunes:owner>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("owner");
      expect(result.owner).toHaveProperty("name", "Leo Laporte");
      expect(result.owner).toHaveProperty("email", "distro@twit.tv");
    });
  });

  describe("image", () => {
    it("extracts all values", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <image>
        <title>This Week in Tech (Audio)</title>
        <url>https://elroy.twit.tv/sites/default/files/styles/twit_album_art_144x144/public/images/shows/this_week_in_tech/album_art/audio/twit_albumart_audio_2048.jpg?itok=qi700fO3</url>
        <link>https://twit.tv/shows/this-week-in-tech</link>
        <width>144</width>
        <height>144</height>
        </image>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("image");
      expect(result.image).toHaveProperty("title", "This Week in Tech (Audio)");
      expect(result.image).toHaveProperty(
        "url",
        "https://elroy.twit.tv/sites/default/files/styles/twit_album_art_144x144/public/images/shows/this_week_in_tech/album_art/audio/twit_albumart_audio_2048.jpg?itok=qi700fO3"
      );
      expect(result.image).toHaveProperty("link", "https://twit.tv/shows/this-week-in-tech");
      expect(result.image).toHaveProperty("height", 144);
      expect(result.image).toHaveProperty("width", 144);
    });

    it("handles a subset of values", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <image>
        <title>This Week in Tech (Audio)</title>
        <url>https://elroy.twit.tv/sites/default/files/styles/twit_album_art_144x144/public/images/shows/this_week_in_tech/album_art/audio/twit_albumart_audio_2048.jpg?itok=qi700fO3</url>
        <link>https://twit.tv/shows/this-week-in-tech</link>
        </image>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("image");
      expect(result.image).toHaveProperty("title", "This Week in Tech (Audio)");
      expect(result.image).toHaveProperty(
        "url",
        "https://elroy.twit.tv/sites/default/files/styles/twit_album_art_144x144/public/images/shows/this_week_in_tech/album_art/audio/twit_albumart_audio_2048.jpg?itok=qi700fO3"
      );
      expect(result.image).toHaveProperty("link", "https://twit.tv/shows/this-week-in-tech");
      expect(result.image).not.toHaveProperty("height");
      expect(result.image).not.toHaveProperty("width");
    });

    it("requires a url", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <image>
        <title>This Week in Tech (Audio)</title>
        <link>https://twit.tv/shows/this-week-in-tech</link>
        </image>
        `
      );

      const result = parseFeed(xml);
      expect(result).not.toHaveProperty("image");
    });

    it("falls back to the itunes:image", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:image href="https://assets.fireside.fm/file/fireside-images/podcasts/images/6/65632ad5-59b2-4e30-82d1-13845dce07dd/cover.jpg?v=1"/>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("image");
      expect(result.image).toHaveProperty(
        "url",
        "https://assets.fireside.fm/file/fireside-images/podcasts/images/6/65632ad5-59b2-4e30-82d1-13845dce07dd/cover.jpg?v=1"
      );
    });
  });
});
