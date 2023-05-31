/* eslint-disable sonarjs/no-duplicate-string */
import invariant from "tiny-invariant";

import * as helpers from "../../__test__/helpers";
import { Phase4Medium } from "../phase-4";
import { Phase6RemoteItem } from "../phase-6";

const phase = 6;

describe("phase 6", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("txt", () => {
    const supportedName = "txt";

    describe("feed", () => {
      it("extracts a single txt node on the feed", () => {
        const xml = helpers.spliceFeed(
          feed,
          `
          <podcast:txt>hello</podcast:txt>
          `
        );
        const result = helpers.parseValidFeed(xml);
        expect(result.podcastTxt).toHaveLength(1);
        expect(result.podcastTxt?.[0]).toHaveProperty("value", "hello");
        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });

      it("extracts a multiple txt node on the feed", () => {
        const xml = helpers.spliceFeed(
          feed,
          `
          <podcast:txt>hello</podcast:txt>
          <podcast:txt>goodbye</podcast:txt>
          <podcast:txt purpose="unknown">hello</podcast:txt>
          `
        );
        const result = helpers.parseValidFeed(xml);
        expect(result.podcastTxt).toHaveLength(3);
        expect(result.podcastTxt?.[0]).toHaveProperty("value", "hello");
        expect(result.podcastTxt?.[1]).toHaveProperty("value", "goodbye");
        expect(result.podcastTxt?.[2]).toHaveProperty("value", "hello");
        expect(result.podcastTxt?.[2]).toHaveProperty("purpose", "unknown");
        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });
    });

    describe("item", () => {
      it("extracts a single txt node on the item", () => {
        const xml = helpers.spliceFirstItem(
          feed,
          `
          <podcast:txt>hello</podcast:txt>
          `
        );
        const result = helpers.parseValidFeed(xml);
        expect(result.items[0].podcastTxt).toHaveLength(1);

        expect(result.items[0].podcastTxt?.[0]).toHaveProperty("value", "hello");
        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });
      it("extracts multiple txt nodes on the item", () => {
        const xml = helpers.spliceFirstItem(
          feed,
          `
          <podcast:txt>hello</podcast:txt>
          <podcast:txt purpose="verify">bye</podcast:txt>
          <podcast:txt purpose="release">bye</podcast:txt>
          `
        );
        const result = helpers.parseValidFeed(xml);
        expect(result.items[0].podcastTxt).toHaveLength(3);
        expect(result.items[0].podcastTxt?.[0]).toHaveProperty("value", "hello");
        expect(result.items[0].podcastTxt?.[1]).toHaveProperty("value", "bye");
        expect(result.items[0].podcastTxt?.[1]).toHaveProperty("purpose", "verify");
        expect(result.items[0].podcastTxt?.[2]).toHaveProperty("value", "bye");
        expect(result.items[0].podcastTxt?.[2]).toHaveProperty("purpose", "release");
        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });
    });
  });

  describe("valueTimeSplit", () => {
    // const supportedName = "valueTimeSplit";

    it("supports feed level single person valueTimeSplits", () => {
      const result = helpers.parseValidFeed(
        helpers.spliceFirstItem(
          feed,
          `
          <podcast:value type="lightning" method="keysend">
              <podcast:valueRecipient name="Alice (Podcaster)" type="node" address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52" split="95" />
              <podcast:valueRecipient name="Hosting Provider" type="node" address="03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a" split="5" fee="true" />

              <podcast:valueTimeSplit startTime="60" duration="237" remotePercentage="95">
                  <podcast:remoteItem itemGuid="https://podcastindex.org/podcast/4148683#1" feedGuid="a94f5cc9-8c58-55fc-91fe-a324087a655b" medium="music" />
              </podcast:valueTimeSplit>

              <podcast:valueTimeSplit startTime="330" duration="53" remoteStartTime="174" remotePercentage="95">
                  <podcast:remoteItem itemGuid="https://podcastindex.org/podcast/4148683#3" feedGuid="a94f5cc9-8c58-55fc-91fe-a324087a655b" medium="music" />
              </podcast:valueTimeSplit>
          </podcast:value>`
        )
      );
      const [firstItem] = result.items;
      expect(firstItem).toHaveProperty("value");
      invariant(firstItem.value);
      expect(firstItem.value.recipients).toHaveLength(2);
      expect(firstItem.value).toHaveProperty("valueTimeSplits");
      invariant(firstItem.value.valueTimeSplits);
      expect(firstItem.value.valueTimeSplits).toHaveLength(2);
      const [firstSplit, secondSplit] = firstItem.value.valueTimeSplits;

      expect(firstSplit).toHaveProperty("startTime", 60);
      expect(firstSplit).toHaveProperty("duration", 237);
      expect(firstSplit).toHaveProperty("remotePercentage", 95);
      expect(firstSplit).toHaveProperty("remoteStartTime", 0);
      expect(firstSplit).toHaveProperty("remoteItem");
      invariant(firstSplit.type === "remoteItem");
      expect(firstSplit.remoteItem).toHaveProperty(
        "itemGuid",
        "https://podcastindex.org/podcast/4148683#1"
      );
      expect(firstSplit.remoteItem).toHaveProperty(
        "feedGuid",
        "a94f5cc9-8c58-55fc-91fe-a324087a655b"
      );
      expect(firstSplit.remoteItem).toHaveProperty("medium", Phase4Medium.Music);
      expect(firstSplit).not.toHaveProperty("recipients");

      invariant(secondSplit.type === "remoteItem");
      expect(secondSplit).toHaveProperty("startTime", 330);
      expect(secondSplit).toHaveProperty("duration", 53);
      expect(secondSplit).toHaveProperty("remotePercentage", 95);
      expect(secondSplit).toHaveProperty("remoteStartTime", 174);
      expect(secondSplit).toHaveProperty("remoteItem");
      expect(secondSplit.remoteItem).toHaveProperty(
        "itemGuid",
        "https://podcastindex.org/podcast/4148683#3"
      );
      expect(secondSplit.remoteItem).toHaveProperty(
        "feedGuid",
        "a94f5cc9-8c58-55fc-91fe-a324087a655b"
      );
      expect(secondSplit.remoteItem).toHaveProperty("medium", Phase4Medium.Music);
      expect(secondSplit).not.toHaveProperty("recipients");

      // expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("supports feed level multiple person valueTimeSplits", () => {
      const result = helpers.parseValidFeed(
        helpers.spliceFirstItem(
          feed,
          `
          <podcast:value type="lightning" method="keysend">
              <podcast:valueRecipient name="Alice (Podcaster)" type="node" address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52" split="95" />
              <podcast:valueRecipient name="Hosting Provider" type="node" address="03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a" split="5" fee="true" />

              <podcast:valueTimeSplit startTime="60" duration="300">
                  <podcast:valueRecipient name="Alice (Podcaster)" type="node" address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52" split="85" />
                  <podcast:valueRecipient name="Jimbob (Guest)" type="node" address="02dd306e68c46681aa21d88a436fb35355a8579dd30201581cefa17cb179fc4c15" split="10" />
              </podcast:valueTimeSplit>

              <podcast:valueTimeSplit startTime="360" duration="240">
                  <podcast:valueRecipient name="Alice (Podcaster)" type="node" address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52" split="85" />
                  <podcast:valueRecipient name="Bobjim (Guest)" type="node" address="032f4ffbbafffbe51726ad3c164a3d0d37ec27bc67b29a159b0f49ae8ac21b8508" split="10" />
              </podcast:valueTimeSplit>
          </podcast:value>`
        )
      );
      const [firstItem] = result.items;
      expect(firstItem).toHaveProperty("value");
      invariant(firstItem.value);
      expect(firstItem.value.recipients).toHaveLength(2);
      expect(firstItem.value).toHaveProperty("valueTimeSplits");
      invariant(firstItem.value.valueTimeSplits);
      expect(firstItem.value.valueTimeSplits).toHaveLength(2);

      const [firstSplit, secondSplit] = firstItem.value.valueTimeSplits;

      invariant(firstSplit.type === "recipients");
      expect(firstSplit).toHaveProperty("startTime", 60);
      expect(firstSplit).toHaveProperty("duration", 300);
      expect(firstSplit).not.toHaveProperty("remotePercentage");
      expect(firstSplit).not.toHaveProperty("remoteItem");
      expect(firstSplit).toHaveProperty("recipients");
      expect(firstSplit.recipients).toHaveLength(2);

      expect(firstSplit.recipients[0]).toHaveProperty("name", "Alice (Podcaster)");
      expect(firstSplit.recipients[0]).toHaveProperty("type", "node");
      expect(firstSplit.recipients[0]).toHaveProperty(
        "address",
        "02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
      );
      expect(firstSplit.recipients[0]).toHaveProperty("split", 85);
      expect(firstSplit.recipients[0]).toHaveProperty("fee", false);
      expect(firstSplit.recipients[0]).not.toHaveProperty("customKey");
      expect(firstSplit.recipients[0]).not.toHaveProperty("customValue");

      invariant(secondSplit.type === "recipients");
      expect(secondSplit).toHaveProperty("startTime", 360);
      expect(secondSplit).toHaveProperty("duration", 240);
      expect(secondSplit).not.toHaveProperty("remotePercentage");
      expect(secondSplit).not.toHaveProperty("remoteItem");
      expect(secondSplit).toHaveProperty("recipients");
      expect(secondSplit.recipients).toHaveLength(2);
    });
  });

  describe("remoteItem", () => {
    const supportedName = "remoteItem";

    it("extracts remote item with optional fields", () => {
      const result = helpers.parseValidFeed(`<rss xmlns:podcast="https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md" version="2.0">
      <channel>
          <title>My favorite v4v music</title>
          <description>This is a playlist of some of my favorite v4v music</description>
          <link>https://example.com/rss-music-playlist.xml</link>
          <docs>http://blogs.law.harvard.edu/tech/rss</docs>
          <language>en</language>
          <generator>Alecks Gates wrote this by hand in Joplin</generator>
          <pubDate>Thu, 27 Oct 2022 22:56:54 -0500</pubDate>
          <lastBuildDate>Thu, 27 Oct 2022 22:56:54 -0500</lastBuildDate>
          <podcast:medium>musicL</podcast:medium>
          <podcast:remoteItem
          feedGuid="917393e3-1b1e-5cef-ace4-edaa54e1f810"
          feedUrl="https://feeds.example.org/917393e3-1b1e-5cef-ace4-edaa54e1f810/rss.xml"
          itemGuid="asdf089j0-ep240-20230510"
          medium="music"
      />
      </channel>
  </rss>`);

      expect(result).toHaveProperty("podcastRemoteItems");
      expect(result.podcastRemoteItems).toHaveLength(1);
      const [first]: Phase6RemoteItem[] = result.podcastRemoteItems ?? [];

      expect(first).toHaveProperty("itemGuid", "asdf089j0-ep240-20230510");
      expect(first).toHaveProperty("feedGuid", "917393e3-1b1e-5cef-ace4-edaa54e1f810");
      expect(first).toHaveProperty(
        "feedUrl",
        "https://feeds.example.org/917393e3-1b1e-5cef-ace4-edaa54e1f810/rss.xml"
      );
      expect(first).toHaveProperty("medium", Phase4Medium.Music);
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
    it("extracts remote items from a playlist feed", () => {
      const result = helpers.parseValidFeed(`<rss xmlns:podcast="https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md" version="2.0">
      <channel>
          <title>My favorite v4v music</title>
          <description>This is a playlist of some of my favorite v4v music</description>
          <link>https://example.com/rss-music-playlist.xml</link>
          <docs>http://blogs.law.harvard.edu/tech/rss</docs>
          <language>en</language>
          <generator>Alecks Gates wrote this by hand in Joplin</generator>
          <pubDate>Thu, 27 Oct 2022 22:56:54 -0500</pubDate>
          <lastBuildDate>Thu, 27 Oct 2022 22:56:54 -0500</lastBuildDate>
          <podcast:medium>musicL</podcast:medium>
          <podcast:remoteItem itemGuid="https://podcastindex.org/podcast/4148683#1" feedGuid="a94f5cc9-8c58-55fc-91fe-a324087a655b" />
          <podcast:remoteItem itemGuid="https://podcastindex.org/podcast/4148683#3" feedGuid="a94f5cc9-8c58-55fc-91fe-a324087a655b" />
          <podcast:remoteItem itemGuid="tag:soundcloud,2010:tracks/319791095" feedGuid="a5ad6f3f-a279-504c-bc6a-30054e6b50e1" />
          <podcast:remoteItem itemGuid="tag:soundcloud,2010:tracks/319789777" feedGuid="a5ad6f3f-a279-504c-bc6a-30054e6b50e1" />
      </channel>
  </rss>`);

      expect(result).toHaveProperty("podcastRemoteItems");
      expect(result.podcastRemoteItems).toHaveLength(4);
      const [first, second, third, fourth]: Phase6RemoteItem[] = result.podcastRemoteItems ?? [];

      expect(first).toHaveProperty("itemGuid", "https://podcastindex.org/podcast/4148683#1");
      expect(first).toHaveProperty("feedGuid", "a94f5cc9-8c58-55fc-91fe-a324087a655b");
      expect(first).not.toHaveProperty("feedUrl");
      expect(first).not.toHaveProperty("medium");
      expect(second).toHaveProperty("itemGuid", "https://podcastindex.org/podcast/4148683#3");
      expect(second).toHaveProperty("feedGuid", "a94f5cc9-8c58-55fc-91fe-a324087a655b");
      expect(third).toHaveProperty("itemGuid", "tag:soundcloud,2010:tracks/319791095");
      expect(third).toHaveProperty("feedGuid", "a5ad6f3f-a279-504c-bc6a-30054e6b50e1");
      expect(fourth).toHaveProperty("itemGuid", "tag:soundcloud,2010:tracks/319789777");
      expect(fourth).toHaveProperty("feedGuid", "a5ad6f3f-a279-504c-bc6a-30054e6b50e1");
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
  });
});
