/* eslint-disable sonarjs/no-duplicate-string */
import { parseFeed } from "../index";
import { ItunesFeedType } from "../types";

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

    it("falls back to subtitle (atom support)", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <subtitle>hello subtitle</subtitle>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("description", "hello subtitle");
    });
  });

  describe("summary", () => {
    it("extracts the value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <itunes:summary>hi</itunes:summary>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("summary", "hi");
    });
  });

  describe("subtitle", () => {
    it("extracts the value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <itunes:subtitle>hey   there</itunes:subtitle>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("subtitle", "hey there");
    });

    it("prefers the non-itunes value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <subtitle>buddy</subtitle>
          <itunes:subtitle>hey   there</itunes:subtitle>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("subtitle", "buddy");
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
    it("is not present when none are in the feed", () => {
      const xml = helpers.spliceFeed(feed, ``);

      const result = parseFeed(xml);

      expect(result).not.toHaveProperty("itunesCategory");
    });

    it("extracts a single category", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="Technology"/>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesCategory", ["Technology"]);
    });

    it("extracts a hierarchical categories", () => {
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

      expect(result).toHaveProperty("itunesCategory", ["News > Tech News", "Technology"]);
    });

    // while we technically support the traversal, it results in a non-existent category
    it.skip("extracts a deep hierarchical category", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="News">
          <itunes:category text="Tech News">
            <itunes:category text="Apple" />
          </itunes:category>
        </itunes:category>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesCategory", ["news > tech news > apple"]);
    });

    it("extracts multiple non-hierarchical categories", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="Business"/>
        <itunes:category text="News"/>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesCategory", ["Business", "News"]);
    });

    it("deals with ampersands", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="Arts">
          <itunes:category text="Books"/>
        </itunes:category>
        <itunes:category text="TV &amp; Film"/>
        <itunes:category text="Society & Culture"/>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesCategory", [
        "Arts > Books",
        "TV & Film",
        "Society & Culture",
      ]);
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

    it("falls back to updated for atom support", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <updated>Sun, 10 Oct 2021 23:02:57 PDT</updated>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubDate", new Date("Sun, 10 Oct 2021 23:02:57 PDT"));
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
    it("are de-duped and handle nesting", () => {
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

      expect(result).toHaveProperty("categories", ["news", "technology"]);
    });

    it("deals with ampersands", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="Arts">
          <itunes:category text="Books"/>
        </itunes:category>
        <itunes:category text="TV &amp; Film"/>
        <itunes:category text="Society & Culture"/>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("categories", [
        "arts",
        "books",
        "tv",
        "film",
        "society",
        "culture",
      ]);
    });

    it("extracts multiple non-hierarchical categories", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="Business"/>
        <itunes:category text="News"/>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("categories", ["business", "news"]);
    });

    it("allows for compound categories", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="Education">
          <itunes:category text="How To"/>
        </itunes:category>
        <itunes:category text="Business">
          <itunes:category text="Entrepreneurship"/>
        </itunes:category>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("categories", [
        "education",
        "howto",
        "business",
        "entrepreneurship",
      ]);
    });

    it("ignores partial compound category matches", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="Education">
          <itunes:category text="How"/>
        </itunes:category>
        <itunes:category text="Business">
          <itunes:category text="Entrepreneurship"/>
        </itunes:category>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("categories", ["education", "business", "entrepreneurship"]);
    });
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

    it("falls back to the logo for atom support", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <logo>https://assets.fireside.fm/file/fireside-images/podcasts/images/6/65632ad5-59b2-4e30-82d1-13845dce07dd/cover.jpg?v=1</logo>
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

  describe("misc item based tests", () => {
    let exampleFeed: string;
    beforeAll(async () => {
      exampleFeed = await helpers.loadFixture();
    });

    it("extracts the newestItemPubDate", () => {
      const result = parseFeed(exampleFeed);
      expect(result).toHaveProperty("newestItemPubDate", new Date("Fri, 09 Oct 2020 04:30:38 GMT"));
    });

    it("extracts the oldestItemPubDate", () => {
      const result = parseFeed(exampleFeed);
      expect(result).toHaveProperty("oldestItemPubDate", new Date("Wed, 07 Oct 2020 04:30:38 GMT"));
    });

    it("missing pubDate falls back to newestItemPubDate", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <title>Podcasting 2.0</title>
        <description>The Podcast Index presents Podcasting 2.0 - Upgrading Podcasting</description>
        <link>http://podcastindex.org</link>
        <item>
          <title>Episode 56: Rocket in your Pocket</title>
          <link>http://adam.curry.com/html/PC205420210917Podcas-bxSsTNn1z0KbP5KMMBxT8rtNZBHpXW.html#,5</link>
          <guid isPermaLink="false">PC2056</guid>
          <pubDate>Fri, 01 Oct 2021 18:58:23 +0000</pubDate>
          <enclosure url="https://mp3s.nashownotes.com/PC20-56-2021-10-01-Final.mp3" length="70881847" type="audio/mpeg"/>
        </item>
        `
      );
      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubDate", new Date("Fri, 01 Oct 2021 18:58:23 +0000"));
    });
  });

  describe("itunesComplete", () => {
    it("is set to true for yes", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:complete>
          Yes
        </itunes:complete>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("itunesComplete", true);
    });

    it("is set to false for any non-yes", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:complete>
          true
        </itunes:complete>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("itunesComplete", false);
    });
  });

  describe("itunesBlock", () => {
    it("is set to true for yes", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:block>
          Yes
        </itunes:block>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("itunesBlock", true);
    });

    it("is set to false for any non-yes", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:block>
          true
        </itunes:block>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("itunesBlock", false);
    });
  });

  describe("copyright", () => {
    it("extracts the value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <copyright>Copyright 2002, Spartanburg Herald-Journal</copyright>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("copyright", "Copyright 2002, Spartanburg Herald-Journal");
    });
  });

  describe("webmaster", () => {
    it("extracts the value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <webMaster>betty@herald.com (Betty Guernsey)</webMaster>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("webmaster", "betty@herald.com (Betty Guernsey)");
    });
  });

  describe("managingEditor", () => {
    it("extracts the value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <managingEditor>geo@herald.com (George Matesky)</managingEditor>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("managingEditor", "geo@herald.com (George Matesky)");
    });
  });

  describe("ttl", () => {
    it("extracts the value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <ttl>23</ttl>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("ttl", 23);
    });

    it("is correctly returned as 0", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <ttl>0</ttl>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("ttl", 0);
    });

    it("is missing from the feed object when not in the xml", () => {
      const xml = helpers.spliceFeed(feed, ``);

      const result = parseFeed(xml);

      expect(result).not.toHaveProperty("ttl");
    });
  });
});
