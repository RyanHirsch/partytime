/* eslint-disable sonarjs/no-duplicate-string */
import invariant from "tiny-invariant";

import * as helpers from "../../__test__/helpers";
import { TranscriptType } from "../phase-1";

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

      const result = helpers.parseValidFeed(xml);
      expect(result).toHaveProperty("locked", true);
      expect(result).toHaveProperty("podcastOwner", "email@example.com");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("ignores multiples", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:locked owner="email@example.com">yes</podcast:locked>
        <podcast:locked owner="beep@example.com">no</podcast:locked>`
      );

      const result = helpers.parseValidFeed(xml);

      expect(result).toHaveProperty("locked", true);
      expect(result).toHaveProperty("podcastOwner", "email@example.com");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("extracts no value and owner", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:locked owner="email@example.com">no</podcast:locked>`
      );

      const result = helpers.parseValidFeed(xml);

      expect(result).toHaveProperty("locked", false);
      expect(result).toHaveProperty("podcastOwner", "email@example.com");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("skips missing owner", () => {
      const xml = helpers.spliceFeed(feed, `<podcast:locked>yes</podcast:locked>`);

      const result = helpers.parseValidFeed(xml);

      expect(result).not.toHaveProperty("locked");
      expect(result).not.toHaveProperty("podcastOwner");

      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });

    it("skips missing tag", () => {
      const result = helpers.parseValidFeed(feed);

      expect(result).not.toHaveProperty("locked");
      expect(result).not.toHaveProperty("podcastOwner");

      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });
  });

  describe("transcript", () => {
    const supportedName = "transcript";

    it("skips missing tag", () => {
      const result = helpers.parseValidFeed(feed);

      expect(result).not.toHaveProperty("podcastTranscripts");

      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });

    it("supports required attributes", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:transcript url="https://example.com/episode1/transcript.html" type="text/html" />`
      );

      const result = helpers.parseValidFeed(xml);
      const [first, second, third] = result.items;

      expect(first).toHaveProperty("podcastTranscripts");
      expect(first.podcastTranscripts).toHaveLength(1);

      const [transcript] = first.podcastTranscripts ?? [];
      invariant(transcript);
      expect(transcript).toHaveProperty("url", "https://example.com/episode1/transcript.html");
      expect(transcript).toHaveProperty("type", "text/html");
      expect(transcript).toHaveProperty("language", result.language);

      expect(second).not.toHaveProperty("podcastTranscripts");
      expect(third).not.toHaveProperty("podcastTranscripts");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("supports all attributes", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:transcript url="https://example.com/episode1/transcript.json" type="application/json" language="es" rel="captions" />`
      );

      const result = helpers.parseValidFeed(xml);
      const [first, second, third] = result.items;

      expect(first).toHaveProperty("podcastTranscripts");
      expect(first.podcastTranscripts).toHaveLength(1);
      const [transcript] = first.podcastTranscripts ?? [];
      invariant(transcript);
      expect(transcript).toHaveProperty("url", "https://example.com/episode1/transcript.json");
      expect(transcript).toHaveProperty("type", "application/json");
      expect(transcript).toHaveProperty("language", "es");
      expect(transcript).toHaveProperty("rel", "captions");

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

      const result = helpers.parseValidFeed(xml);
      const [first, second, third] = result.items;

      expect(first).toHaveProperty("podcastTranscripts");
      expect(first.podcastTranscripts).toHaveLength(2);
      const [firstTranscript, secondTranscript] = first.podcastTranscripts ?? [];
      invariant(firstTranscript);
      invariant(secondTranscript);
      expect(firstTranscript).toHaveProperty("url", "https://example.com/episode1/transcript.json");
      expect(firstTranscript).toHaveProperty("type", "application/json");
      expect(firstTranscript).toHaveProperty("language", "es");
      expect(firstTranscript).toHaveProperty("rel", "captions");

      expect(secondTranscript).toHaveProperty("url", "https://example.com/episode1/transcript.srt");
      expect(secondTranscript).toHaveProperty("type", TranscriptType.SRT);
      expect(secondTranscript).toHaveProperty("rel", "captions");
      expect(secondTranscript).toHaveProperty("language", result.language);

      expect(second).not.toHaveProperty("podcastTranscripts");
      expect(third).not.toHaveProperty("podcastTranscripts");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("supports multiple transcripts (alternative SRT extension)", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:transcript url="https://example.com/episode1/transcript.json" type="application/json" language="es" rel="captions" />
        <podcast:transcript url="https://podnews.net/audio/podnews230126.mp3.srt" type="application/x-subrip" rel="captions" />`
      );

      const result = helpers.parseValidFeed(xml);
      const [first, second, third] = result.items;

      expect(first).toHaveProperty("podcastTranscripts");
      expect(first.podcastTranscripts).toHaveLength(2);
      const [firstTranscript, secondTranscript] = first.podcastTranscripts ?? [];
      invariant(firstTranscript);
      invariant(secondTranscript);
      expect(firstTranscript).toHaveProperty("url", "https://example.com/episode1/transcript.json");
      expect(firstTranscript).toHaveProperty("type", "application/json");
      expect(firstTranscript).toHaveProperty("language", "es");
      expect(firstTranscript).toHaveProperty("rel", "captions");

      expect(secondTranscript).toHaveProperty(
        "url",
        "https://podnews.net/audio/podnews230126.mp3.srt"
      );
      expect(secondTranscript).toHaveProperty("type", "application/srt");
      expect(secondTranscript).toHaveProperty("rel", "captions");
      expect(secondTranscript).toHaveProperty("language", result.language);

      expect(second).not.toHaveProperty("podcastTranscripts");
      expect(third).not.toHaveProperty("podcastTranscripts");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("skips when required url attribute is missing", () => {
      const xml = helpers.spliceFirstItem(feed, `<podcast:transcript type="application/json" />`);

      const result = helpers.parseValidFeed(xml);
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

      const result = helpers.parseValidFeed(xml);
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
      const result = helpers.parseValidFeed(feed);

      expect(result).not.toHaveProperty("podcastFunding");

      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });

    it("extracts message and url", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:funding url="https://www.example.com/donations">Support the show!</podcast:funding>`
      );

      const result = helpers.parseValidFeed(xml);

      expect(result).toHaveProperty("podcastFunding");
      expect(result.podcastFunding).toHaveLength(1);
      const [first] = result.podcastFunding ?? [];

      expect(first).toHaveProperty("url", "https://www.example.com/donations");
      expect(first).toHaveProperty("message", "Support the show!");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("supports multiples", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:funding url="https://www.example.com/donations">Support the show!</podcast:funding>
        <podcast:funding url="https://www.lol.com/donations">show!</podcast:funding>
        <podcast:funding url="https://www.yep.com/donations">Support</podcast:funding>

        `
      );

      const result = helpers.parseValidFeed(xml);

      expect(result).toHaveProperty("podcastFunding");
      expect(result.podcastFunding).toHaveLength(3);

      const [first, second, third] = result.podcastFunding ?? [];
      expect(first).toHaveProperty("url", "https://www.example.com/donations");
      expect(first).toHaveProperty("message", "Support the show!");

      expect(second).toHaveProperty("url", "https://www.lol.com/donations");
      expect(second).toHaveProperty("message", "show!");

      expect(third).toHaveProperty("url", "https://www.yep.com/donations");
      expect(third).toHaveProperty("message", "Support");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("allows empty message", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:funding url="https://www.example.com/donations"></podcast:funding>`
      );

      const result = helpers.parseValidFeed(xml);

      expect(result).toHaveProperty("podcastFunding");
      expect(result.podcastFunding).toHaveLength(1);
      const [first] = result.podcastFunding ?? [];

      expect(first).toHaveProperty("url", "https://www.example.com/donations");
      expect(first).toHaveProperty("message", "");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });

    it("ignores malformed tags (missing url)", () => {
      const xml = helpers.spliceFeed(feed, `<podcast:funding>Support the show!</podcast:funding>`);

      const result = helpers.parseValidFeed(xml);

      expect(result).not.toHaveProperty("podcastFunding");
      expect(helpers.getPhaseSupport(result, 1)).not.toContain(supportedName);
    });
  });

  describe("chapters", () => {
    const supportedName = "chapters";
    it("skips missing tag", () => {
      const result = helpers.parseValidFeed(feed);

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

      const result = helpers.parseValidFeed(xml);

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

      const result = helpers.parseValidFeed(xml);

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

    it("defaults to application json", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `
        <podcast:chapters url="https://example.com/episode1/chapters.json" />
        `
      );

      const result = helpers.parseValidFeed(xml);

      expect(result.items[0]).toHaveProperty("podcastChapters");
      expect(result.items[1]).not.toHaveProperty("podcastChapters");
      expect(result.items[2]).not.toHaveProperty("podcastChapters");

      expect(result.items[0].podcastChapters).toHaveProperty(
        "url",
        "https://example.com/episode1/chapters.json"
      );
      expect(result.items[0].podcastChapters).toHaveProperty("type", "application/json");

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });
  });

  describe("soundbite", () => {
    const supportedName = "soundbite";
    it("skips missing tag", () => {
      const result = helpers.parseValidFeed(feed);

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

      const result = helpers.parseValidFeed(xml);

      expect(result.items[0]).toHaveProperty("podcastSoundbites");
      expect(result.items[1]).not.toHaveProperty("podcastSoundbites");
      expect(result.items[2]).not.toHaveProperty("podcastSoundbites");

      expect(result.items[0].podcastSoundbites).toHaveLength(1);
      const [firstSoundbite] = result.items[0].podcastSoundbites ?? [];
      expect(firstSoundbite).toHaveProperty("duration", 60);
      expect(firstSoundbite).toHaveProperty("startTime", 73);
      expect(firstSoundbite).toHaveProperty("title", result.title);

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

      const result = helpers.parseValidFeed(xml);

      expect(result.items[0]).not.toHaveProperty("podcastSoundbites");
      expect(result.items[1]).not.toHaveProperty("podcastSoundbites");
      expect(result.items[2]).toHaveProperty("podcastSoundbites");

      expect(result.items[2].podcastSoundbites).toHaveLength(3);
      const [firstSoundbite, secondSoundbite, thirdSoundbite] =
        result.items[2].podcastSoundbites ?? [];

      expect(firstSoundbite).toHaveProperty("duration", 60);
      expect(firstSoundbite).toHaveProperty("startTime", 73);
      expect(firstSoundbite).toHaveProperty("title", result.title);

      expect(secondSoundbite).toHaveProperty("duration", 42.25);
      expect(secondSoundbite).toHaveProperty("startTime", 1234.5);
      expect(secondSoundbite).toHaveProperty("title", "Why the Podcast Namespace Matters");

      expect(thirdSoundbite).toHaveProperty("duration", 60);
      expect(thirdSoundbite).toHaveProperty("startTime", 234.5);
      expect(thirdSoundbite).toHaveProperty("title", result.title);

      expect(helpers.getPhaseSupport(result, 1)).toContain(supportedName);
    });
  });
});
