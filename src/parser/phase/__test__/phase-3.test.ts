import * as helpers from "../../__test__/helpers";
import { parseFeed } from "../../index";

describe("phase 3", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("trailer", () => {
    const url = "https://example.org/trailers/teaser";
    const pubdate = "Thu, 01 Apr 2021 08:00:00 EST";
    const mimeType = "audio/mp3";
    const length = 12345678;
    const title = "Coming April 1st, 2021";

    it("extracts generic single trailer", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:trailer pubdate="${pubdate}" url="${url}" length="${length}" type="${mimeType}">${title}</podcast:trailer>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("trailers");
      expect(result.trailers).toHaveLength(1);

      const [trailer] = result.trailers;

      expect(trailer).toHaveProperty("url", url);
      expect(trailer).toHaveProperty("pubdate", new Date(pubdate));
      expect(trailer).toHaveProperty("length", length);
      expect(trailer).toHaveProperty("type", mimeType);
      expect(trailer).toHaveProperty("title", title);

      expect(helpers.getPhaseSupport(result, 3)).toContain("trailer");
    });

    it("extracts single season trailer", () => {
      const season = 1;

      const xml = helpers.spliceFeed(
        feed,
        `<podcast:trailer season="${season}" pubdate="${pubdate}" url="${url}" length="${length}" type="${mimeType}">${title}</podcast:trailer>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("trailers");
      expect(result.trailers).toHaveLength(1);

      const [trailer] = result.trailers;

      expect(trailer).toHaveProperty("url", url);
      expect(trailer).toHaveProperty("pubdate", new Date(pubdate));
      expect(trailer).toHaveProperty("length", length);
      expect(trailer).toHaveProperty("type", mimeType);
      expect(trailer).toHaveProperty("title", title);
      expect(trailer).toHaveProperty("season", season);

      expect(helpers.getPhaseSupport(result, 3)).toContain("trailer");
    });

    it("extracts multiple season trailers", () => {
      const season = 1;

      const xml = helpers.spliceFeed(
        feed,
        `<podcast:trailer season="${season}" pubdate="${pubdate}" url="${url}" length="${length}" type="${mimeType}">${title}</podcast:trailer>
         <podcast:trailer season="${
           season + 1
         }" pubdate="${pubdate}" url="${url}" length="${length}" type="${mimeType}">${title}</podcast:trailer>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("trailers");
      expect(result.trailers).toHaveLength(2);

      const [firstTrailer, secondTrailer] = result.trailers;

      expect(firstTrailer).toHaveProperty("url", url);
      expect(firstTrailer).toHaveProperty("pubdate", new Date(pubdate));
      expect(firstTrailer).toHaveProperty("length", length);
      expect(firstTrailer).toHaveProperty("type", mimeType);
      expect(firstTrailer).toHaveProperty("title", title);
      expect(firstTrailer).toHaveProperty("season", season);

      expect(secondTrailer).toHaveProperty("url", url);
      expect(secondTrailer).toHaveProperty("pubdate", new Date(pubdate));
      expect(secondTrailer).toHaveProperty("length", length);
      expect(secondTrailer).toHaveProperty("type", mimeType);
      expect(secondTrailer).toHaveProperty("title", title);
      expect(secondTrailer).toHaveProperty("season", season + 1);

      expect(helpers.getPhaseSupport(result, 3)).toContain("trailer");
    });

    it("skips missing url trailers", () => {
      const season = 1;

      const xml = helpers.spliceFeed(
        feed,
        `<podcast:trailer season="${season}" pubdate="${pubdate}" length="${length}" type="${mimeType}">${title}</podcast:trailer>`
      );

      const result = parseFeed(xml);

      expect(result).not.toHaveProperty("trailers");

      expect(helpers.getPhaseSupport(result, 3)).not.toContain("trailer");
    });
  });

  describe("feed license", () => {
    const customLicense = "my-podcast-license-v1";
    it("extracts custom license", () => {
      const url = "https://example.org/mypodcastlicense/full.pdf";
      const name = customLicense;
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:license url="${url}">${name}</podcast:license>`
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("license");
      expect(result.license).toHaveProperty("identifier", name);
      expect(result.license).toHaveProperty("url", url);

      expect(helpers.getPhaseSupport(result, 3)).toContain("license");
    });

    it("extracts a known license", () => {
      const name = "cc-by-4.0";
      const url = "https://spdx.org/licenses/CC-BY-4.0.html";
      const xml = helpers.spliceFeed(feed, `<podcast:license>${name}</podcast:license>`);

      const result = parseFeed(xml);

      expect(result).toHaveProperty("license");
      expect(result.license).toHaveProperty("identifier", name);
      expect(result.license).toHaveProperty("url", url);

      expect(helpers.getPhaseSupport(result, 3)).toContain("license");
    });

    it("skips bad custom license", () => {
      const name = customLicense;
      const xml = helpers.spliceFeed(feed, `<podcast:license>${name}</podcast:license>`);

      const result = parseFeed(xml);

      expect(result).not.toHaveProperty("license");

      expect(helpers.getPhaseSupport(result, 3)).not.toContain("license");
    });
  });

  describe("item license", () => {
    const customLicense = "my-podcast-license-v1";

    it("extracts custom license", () => {
      const url = "https://example.org/mypodcastlicense/full.pdf";
      const name = customLicense;
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:license url="${url}">${name}</podcast:license>`
      );

      const result = parseFeed(xml);

      const [first, second, third] = result.items;

      expect(first).toHaveProperty("license");
      expect(first.license).toHaveProperty("identifier", name);
      expect(first.license).toHaveProperty("url", url);

      expect(second).not.toHaveProperty("license");
      expect(third).not.toHaveProperty("license");

      expect(helpers.getPhaseSupport(result, 3)).toContain("license");
    });

    it("extracts a known license", () => {
      const name = "cc-by-4.0";
      const url = "https://spdx.org/licenses/CC-BY-4.0.html";
      const xml = helpers.spliceFirstItem(feed, `<podcast:license>${name}</podcast:license>`);

      const result = parseFeed(xml);

      const [first, second, third] = result.items;

      expect(first).toHaveProperty("license");
      expect(first.license).toHaveProperty("identifier", name);
      expect(first.license).toHaveProperty("url", url);

      expect(second).not.toHaveProperty("license");
      expect(third).not.toHaveProperty("license");

      expect(helpers.getPhaseSupport(result, 3)).toContain("license");
    });

    it("skips bad custom license", () => {
      const name = customLicense;
      const xml = helpers.spliceFirstItem(feed, `<podcast:license>${name}</podcast:license>`);

      const result = parseFeed(xml);

      const [first, second, third] = result.items;

      expect(first).not.toHaveProperty("license");
      expect(second).not.toHaveProperty("license");
      expect(third).not.toHaveProperty("license");

      expect(helpers.getPhaseSupport(result, 3)).not.toContain("license");
    });
  });

  describe("item alternative enclosure", () => {
    it("extracts single enclosure with multiple sources", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:alternateEnclosure type="audio/mpeg" length="43200000" bitrate="128000" default="true" title="Standard">
        <podcast:source uri="https://example.com/file-720.torrent" contentType="application/x-bittorrent" />
        <podcast:source uri="http://example.onion/file-720.mp4" />
    </podcast:alternateEnclosure>`
      );

      const result = parseFeed(xml);

      const [first] = result.items;

      expect(first).toHaveProperty("alternativeEnclosures");
      expect(first.alternativeEnclosures).toHaveLength(1);

      const [altEnclosure] = first.alternativeEnclosures;
      expect(altEnclosure).not.toHaveProperty("integrity");
      expect(altEnclosure).toHaveProperty("default", true);
      expect(altEnclosure).toHaveProperty("length", 43200000);
      expect(altEnclosure).toHaveProperty("bitrate", 128000);
      expect(altEnclosure).toHaveProperty("title", "Standard");

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(altEnclosure.source).toHaveLength(2);
      const [s1, s2] = first.alternativeEnclosures[0].source;
      expect(s1).toHaveProperty("uri", "https://example.com/file-720.torrent");
      expect(s1).toHaveProperty("contentType", "application/x-bittorrent");

      expect(s2).toHaveProperty("uri", "http://example.onion/file-720.mp4");
      expect(s2).toHaveProperty("contentType", "video/mp4");

      expect(helpers.getPhaseSupport(result, 3)).toContain("alternateEnclosure");
    });

    it("falls back to enclosure type when source type can't be determined", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:alternateEnclosure type="audio/mpeg" length="43200000" bitrate="128000" title="Standard">
        <podcast:source uri="http://example.onion/file-720" />
    </podcast:alternateEnclosure>`
      );

      const result = parseFeed(xml);

      const [first] = result.items;

      expect(first).toHaveProperty("alternativeEnclosures");
      expect(first.alternativeEnclosures).toHaveLength(1);
      expect(first.alternativeEnclosures[0]).not.toHaveProperty("integrity");
      expect(first.alternativeEnclosures[0]).toHaveProperty("default", false);

      const [s1] = first.alternativeEnclosures[0].source;

      expect(s1).toHaveProperty("uri", "http://example.onion/file-720");
      expect(s1).toHaveProperty("contentType", "audio/mpeg");

      expect(helpers.getPhaseSupport(result, 3)).toContain("alternateEnclosure");
    });

    it("extracts an enclosure with integrity value", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:alternateEnclosure type="audio/mpeg" length="43200000" bitrate="128000" default="true" title="Standard">
        <podcast:source uri="https://example.com/file-0.mp3" />
        <podcast:source uri="ipfs://someRandomMpegFile" />
        <podcast:integrity type="sri" value="sha384-ExVqijgYHm15PqQqdXfW95x+Rs6C+d6E/ICxyQOeFevnxNLR/wtJNrNYTjIysUBo" />
        </podcast:alternateEnclosure>`
      );

      const result = parseFeed(xml);

      const [first] = result.items;

      expect(first).toHaveProperty("alternativeEnclosures");
      expect(first.alternativeEnclosures).toHaveLength(1);
      expect(first.alternativeEnclosures[0].integrity).toHaveProperty(
        "value",
        "sha384-ExVqijgYHm15PqQqdXfW95x+Rs6C+d6E/ICxyQOeFevnxNLR/wtJNrNYTjIysUBo"
      );
      expect(first.alternativeEnclosures[0].integrity).toHaveProperty("type", "sri");

      expect(helpers.getPhaseSupport(result, 3)).toContain("alternateEnclosure");
    });

    it("ignores missing source uri enclosure", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:alternateEnclosure type="audio/mpeg" length="43200000" bitrate="128000" default="true" title="Standard">
        <podcast:source />
    </podcast:alternateEnclosure>`
      );

      const result = parseFeed(xml);

      const [first] = result.items;

      expect(first).not.toHaveProperty("alternateEnclosures");
      expect(helpers.getPhaseSupport(result, 3)).not.toContain("alternateEnclosure");
    });

    it("ignores malformed source enclosure", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:alternateEnclosure type="audio/mpeg" length="43200000" bitrate="128000" default="true" title="Standard">
    </podcast:alternateEnclosure>`
      );

      const result = parseFeed(xml);

      const [first] = result.items;

      expect(first).not.toHaveProperty("alternateEnclosures");
      expect(helpers.getPhaseSupport(result, 3)).not.toContain("alternateEnclosure");
    });
  });

  describe("feed guid", () => {
    it("extracts the feed guid", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:guid>917393e3-1b1e-5cef-ace4-edaa54e1f810</podcast:guid>`
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("guid", "917393e3-1b1e-5cef-ace4-edaa54e1f810");

      expect(helpers.getPhaseSupport(result, 3)).toContain("guid");
    });

    it("ignores missing feed guid value", () => {
      const xml = helpers.spliceFeed(feed, `<podcast:guid></podcast:guid>`);

      const result = parseFeed(xml);

      expect(result).not.toHaveProperty("guid");

      expect(helpers.getPhaseSupport(result, 3)).not.toContain("guid");
    });
  });
});
