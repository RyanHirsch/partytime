/* eslint-disable sonarjs/no-duplicate-string */
import * as helpers from "../../__test__/helpers";
import { parseFeed } from "../../index";

describe("phase 1", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("locked", () => {
    const supportedName = "locked";

    it("extracts yes value and owner", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:locked owner="email@example.com">yes</podcast:locked>`
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("podcastLocked", 1);
      expect(result).toHaveProperty("podcastOwner", "email@example.com");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("ignores multiples", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:locked owner="email@example.com">yes</podcast:locked>
        <podcast:locked owner="beep@example.com">no</podcast:locked>`
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("podcastLocked", 1);
      expect(result).toHaveProperty("podcastOwner", "email@example.com");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("extracts no value and owner", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:locked owner="email@example.com">no</podcast:locked>`
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("podcastLocked", 0);
      expect(result).toHaveProperty("podcastOwner", "email@example.com");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("skips missing owner", () => {
      const xml = helpers.spliceFeed(feed, `<podcast:locked>yes</podcast:locked>`);

      const result = parseFeed(xml);

      expect(result).not.toHaveProperty("podcastLocked");
      expect(result).not.toHaveProperty("podcastOwner");

      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });

    it("skips missing tag", () => {
      const result = parseFeed(feed);

      expect(result).not.toHaveProperty("podcastLocked");
      expect(result).not.toHaveProperty("podcastOwner");

      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });
  });

  describe("transcript", () => {
    const supportedName = "transcript";

    it("skips missing tag", () => {
      const result = parseFeed(feed);

      expect(result).not.toHaveProperty("podcastTranscripts");

      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });

    it("supports required attributes", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:transcript url="https://example.com/episode1/transcript.html" type="text/html" />`
      );

      const result = parseFeed(xml);
      const [first, second, third] = result.items;

      expect(first).toHaveProperty("podcastTranscripts");
      expect(first.podcastTranscripts).toHaveLength(1);
      expect(first.podcastTranscripts[0]).toHaveProperty(
        "url",
        "https://example.com/episode1/transcript.html"
      );
      expect(first.podcastTranscripts[0]).toHaveProperty("type", "text/html");
      expect(first.podcastTranscripts[0]).toHaveProperty("language", result.language);

      expect(second).not.toHaveProperty("podcastTranscripts");
      expect(third).not.toHaveProperty("podcastTranscripts");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("supports all attributes", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:transcript url="https://example.com/episode1/transcript.json" type="application/json" language="es" rel="captions" />`
      );

      const result = parseFeed(xml);
      const [first, second, third] = result.items;

      expect(first).toHaveProperty("podcastTranscripts");
      expect(first.podcastTranscripts).toHaveLength(1);
      expect(first.podcastTranscripts[0]).toHaveProperty(
        "url",
        "https://example.com/episode1/transcript.json"
      );
      expect(first.podcastTranscripts[0]).toHaveProperty("type", "application/json");
      expect(first.podcastTranscripts[0]).toHaveProperty("language", "es");
      expect(first.podcastTranscripts[0]).toHaveProperty("rel", "captions");

      expect(second).not.toHaveProperty("podcastTranscripts");
      expect(third).not.toHaveProperty("podcastTranscripts");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("supports multiple transcripts", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:transcript url="https://example.com/episode1/transcript.json" type="application/json" language="es" rel="captions" />
        <podcast:transcript url="https://example.com/episode1/transcript.srt" type="text/srt" rel="captions" />`
      );

      const result = parseFeed(xml);
      const [first, second, third] = result.items;

      expect(first).toHaveProperty("podcastTranscripts");
      expect(first.podcastTranscripts).toHaveLength(2);
      expect(first.podcastTranscripts[0]).toHaveProperty(
        "url",
        "https://example.com/episode1/transcript.json"
      );
      expect(first.podcastTranscripts[0]).toHaveProperty("type", "application/json");
      expect(first.podcastTranscripts[0]).toHaveProperty("language", "es");
      expect(first.podcastTranscripts[0]).toHaveProperty("rel", "captions");

      expect(first.podcastTranscripts[1]).toHaveProperty(
        "url",
        "https://example.com/episode1/transcript.srt"
      );
      expect(first.podcastTranscripts[1]).toHaveProperty("type", "text/srt");
      expect(first.podcastTranscripts[1]).toHaveProperty("rel", "captions");
      expect(first.podcastTranscripts[1]).toHaveProperty("language", result.language);

      expect(second).not.toHaveProperty("podcastTranscripts");
      expect(third).not.toHaveProperty("podcastTranscripts");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("skips when required url attribute is missing", () => {
      const xml = helpers.spliceFirstItem(feed, `<podcast:transcript type="application/json" />`);

      const result = parseFeed(xml);
      const [first, second, third] = result.items;

      expect(first).not.toHaveProperty("podcastTranscripts");
      expect(second).not.toHaveProperty("podcastTranscripts");
      expect(third).not.toHaveProperty("podcastTranscripts");

      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });

    it("skips when required type attribute is missing", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:transcript url="https://example.com/episode1/transcript.json" />`
      );

      const result = parseFeed(xml);
      const [first, second, third] = result.items;

      expect(first).not.toHaveProperty("podcastTranscripts");
      expect(second).not.toHaveProperty("podcastTranscripts");
      expect(third).not.toHaveProperty("podcastTranscripts");

      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });
  });

  describe("funding", () => {
    const supportedName = "funding";

    it("skips missing tag", () => {
      const result = parseFeed(feed);

      expect(result).not.toHaveProperty("podcastFunding");

      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });

    it("extracts message and url", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:funding url="https://www.example.com/donations">Support the show!</podcast:funding>`
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("podcastFunding");

      expect(result.podcastFunding).toHaveProperty("url", "https://www.example.com/donations");
      expect(result.podcastFunding).toHaveProperty("message", "Support the show!");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("ignores multiples", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:funding url="https://www.example.com/donations">Support the show!</podcast:funding>
        <podcast:funding url="https://www.lol.com/donations">show!</podcast:funding>
        <podcast:funding url="https://www.yep.com/donations">Support</podcast:funding>

        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("podcastFunding");

      expect(result.podcastFunding).toHaveProperty("url", "https://www.example.com/donations");
      expect(result.podcastFunding).toHaveProperty("message", "Support the show!");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("allows empty message", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:funding url="https://www.example.com/donations"></podcast:funding>`
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("podcastFunding");

      expect(result.podcastFunding).toHaveProperty("url", "https://www.example.com/donations");
      expect(result.podcastFunding).toHaveProperty("message", "");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("ignores malformed tags (missing url)", () => {
      const xml = helpers.spliceFeed(feed, `<podcast:funding>Support the show!</podcast:funding>`);

      const result = parseFeed(xml);

      expect(result).not.toHaveProperty("podcastFunding");
      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });
  });

  describe("chapters", () => {
    const supportedName = "chapters";
    it("skips missing tag", () => {
      const result = parseFeed(feed);

      expect(result.items[0]).not.toHaveProperty("podcastChapters");
      expect(result.items[1]).not.toHaveProperty("podcastChapters");
      expect(result.items[2]).not.toHaveProperty("podcastChapters");

      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });

    it("extracts url and type", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:chapters url="https://example.com/episode1/chapters.json" type="application/json+chapters" />`
      );

      const result = parseFeed(xml);

      expect(result.items[0]).toHaveProperty("podcastChapters");
      expect(result.items[1]).not.toHaveProperty("podcastChapters");
      expect(result.items[2]).not.toHaveProperty("podcastChapters");

      expect(result.items[0].podcastChapters).toHaveProperty(
        "url",
        "https://example.com/episode1/chapters.json"
      );
      expect(result.items[0].podcastChapters).toHaveProperty("type", "application/json+chapters");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("extracts only supports a single node", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `
        <podcast:chapters url="https://example.com/episode1/chapters.json" type="application/json+chapters" />
        <podcast:chapters url="https://example.com/episode2/chapters.json" type="application/json" />
        `
      );

      const result = parseFeed(xml);

      expect(result.items[0]).toHaveProperty("podcastChapters");
      expect(result.items[1]).not.toHaveProperty("podcastChapters");
      expect(result.items[2]).not.toHaveProperty("podcastChapters");

      expect(result.items[0].podcastChapters).toHaveProperty(
        "url",
        "https://example.com/episode1/chapters.json"
      );
      expect(result.items[0].podcastChapters).toHaveProperty("type", "application/json+chapters");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });
  });

  describe("soundbite", () => {
    const supportedName = "soundbite";
    it("skips missing tag", () => {
      const result = parseFeed(feed);

      expect(result.items[0]).not.toHaveProperty("podcastSoundbites");
      expect(result.items[1]).not.toHaveProperty("podcastSoundbites");
      expect(result.items[2]).not.toHaveProperty("podcastSoundbites");

      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });

    it("extracts start and duration", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:soundbite startTime="73.0" duration="60.0" />`
      );

      const result = parseFeed(xml);

      expect(result.items[0]).toHaveProperty("podcastSoundbites");
      expect(result.items[1]).not.toHaveProperty("podcastSoundbites");
      expect(result.items[2]).not.toHaveProperty("podcastSoundbites");

      expect(result.items[0].podcastSoundbites).toHaveLength(1);
      expect(result.items[0].podcastSoundbites[0]).toHaveProperty("duration", 60);
      expect(result.items[0].podcastSoundbites[0]).toHaveProperty("startTime", 73);
      expect(result.items[0].podcastSoundbites[0]).toHaveProperty("title", result.title);

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("supports multiple start and duration", () => {
      const xml = helpers.spliceLastItem(
        feed,
        `
        <podcast:soundbite startTime="73.0" duration="60.0" />
        <podcast:soundbite startTime="1234.5" duration="42.25">Why the Podcast Namespace Matters</podcast:soundbite>
        <podcast:soundbite startTime="234.5" duration="60.0" />
        `
      );

      const result = parseFeed(xml);

      expect(result.items[0]).not.toHaveProperty("podcastSoundbites");
      expect(result.items[1]).not.toHaveProperty("podcastSoundbites");
      expect(result.items[2]).toHaveProperty("podcastSoundbites");

      expect(result.items[2].podcastSoundbites).toHaveLength(3);
      expect(result.items[2].podcastSoundbites[0]).toHaveProperty("duration", 60);
      expect(result.items[2].podcastSoundbites[0]).toHaveProperty("startTime", 73);
      expect(result.items[2].podcastSoundbites[0]).toHaveProperty("title", result.title);

      expect(result.items[2].podcastSoundbites[1]).toHaveProperty("duration", 42.25);
      expect(result.items[2].podcastSoundbites[1]).toHaveProperty("startTime", 1234.5);
      expect(result.items[2].podcastSoundbites[1]).toHaveProperty(
        "title",
        "Why the Podcast Namespace Matters"
      );

      expect(result.items[2].podcastSoundbites[2]).toHaveProperty("duration", 60);
      expect(result.items[2].podcastSoundbites[2]).toHaveProperty("startTime", 234.5);
      expect(result.items[2].podcastSoundbites[2]).toHaveProperty("title", result.title);

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });
  });
});
