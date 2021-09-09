/* eslint-disable sonarjs/no-duplicate-string */
import * as helpers from "../../__test__/helpers";
import { parseFeed } from "../../index";

describe("phase 2", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("person", () => {
    const supportedName = "person";

    it("correctly identifies non-supporting feeds", () => {
      const result = parseFeed(feed);

      expect(result).not.toHaveProperty("podcastPeople");

      result.items.forEach((item) => expect(item).not.toHaveProperty("podcastPeople"));

      expect(helpers.getPhaseSupport(result, 2)).not.toContain(supportedName);
    });

    it("supports multiple people on the feed", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:person href="https://example.com/johnsmith/blog" img="http://example.com/images/johnsmith.jpg">John Smith</podcast:person>
        <podcast:person role="co-host">Jane Smith</podcast:person>`
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("podcastPeople");
      expect(result.podcastPeople).toHaveLength(2);

      const [john, jane] = result.podcastPeople;

      expect(john).toHaveProperty("name", "John Smith");
      expect(john).toHaveProperty("href", "https://example.com/johnsmith/blog");
      expect(john).toHaveProperty("img", "http://example.com/images/johnsmith.jpg");
      expect(john).toHaveProperty("role", "Host");
      expect(john).toHaveProperty("group", "Cast");

      expect(jane).toHaveProperty("name", "Jane Smith");
      expect(jane).toHaveProperty("role", "Co-Host");
      expect(jane).toHaveProperty("group", "Cast");

      expect(helpers.getPhaseSupport(result, 2)).toContain(supportedName);
    });

    it("supports a single person on a feed item", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:person role="guest">Jack</podcast:person>`
      );

      const result = parseFeed(xml);

      expect(result.items[0].podcastPeople).toHaveLength(1);
      const [jack] = result.items[0].podcastPeople;

      expect(jack).toHaveProperty("name", "Jack");
      expect(jack).toHaveProperty("role", "Guest");
      expect(jack).toHaveProperty("group", "Cast");

      expect(helpers.getPhaseSupport(result, 2)).toContain(supportedName);
    });

    it("correctly mitigates garbage roles and groups on the feed", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:person role="talking head" group="human">Jane Smith</podcast:person>`
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("podcastPeople");

      const [jane] = result.podcastPeople;

      expect(jane).toHaveProperty("name", "Jane Smith");
      expect(jane).toHaveProperty("role", "Host");
      expect(jane).toHaveProperty("group", "Cast");

      expect(helpers.getPhaseSupport(result, 2)).toContain(supportedName);
    });
  });

  describe("location", () => {
    const supportedName = "location";

    it("correctly identifies non-supporting feeds", () => {
      const result = parseFeed(feed);

      expect(result).not.toHaveProperty("podcastLocation");

      result.items.forEach((item) => expect(item).not.toHaveProperty("podcastLocation"));

      expect(helpers.getPhaseSupport(result, 2)).not.toContain(supportedName);
    });

    it("requires a name (node text)", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:location geo="geo:30.2672,97.7431" osm="R113314"></podcast:location>`
      );

      const result = parseFeed(xml);

      expect(result).not.toHaveProperty("podcastLocation");

      expect(helpers.getPhaseSupport(result, 2)).not.toContain(supportedName);
    });

    it("requires only a name (node text)", () => {
      const xml = helpers.spliceFeed(feed, `<podcast:location>Austin, TX</podcast:location>`);

      const result = parseFeed(xml);

      expect(result).toHaveProperty("podcastLocation");
      expect(result.podcastLocation).toHaveProperty("name", "Austin, TX");
      expect(result.podcastLocation).not.toHaveProperty("osm");
      expect(result.podcastLocation).not.toHaveProperty("geo");

      expect(helpers.getPhaseSupport(result, 2)).toContain(supportedName);
    });

    it("supports only takes the first location on the feed", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:location geo="geo:30.2672,97.7431" osm="R113314">Austin, TX</podcast:location>
        <podcast:location geo="geo:-27.86159,153.3169" osm="W43678282">Dreamworld (Queensland)</podcast:location>`
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("podcastLocation");
      expect(result.podcastLocation).toHaveProperty("name", "Austin, TX");
      expect(result.podcastLocation).toHaveProperty("osm", "R113314");
      expect(result.podcastLocation).toHaveProperty("geo", "geo:30.2672,97.7431");

      expect(helpers.getPhaseSupport(result, 2)).toContain(supportedName);
    });

    it("supports item level location name", () => {
      const xml = helpers.spliceFirstItem(feed, `<podcast:location>Austin, TX</podcast:location>`);

      const result = parseFeed(xml);

      expect(result).not.toHaveProperty("podcastLocation");
      const [first] = result.items;
      expect(first).toHaveProperty("podcastLocation");
      expect(first.podcastLocation).toHaveProperty("name", "Austin, TX");
      expect(first.podcastLocation).not.toHaveProperty("osm");
      expect(first.podcastLocation).not.toHaveProperty("geo");

      expect(helpers.getPhaseSupport(result, 2)).toContain(supportedName);
    });

    it("supports item level location (full)", () => {
      const xml = helpers.spliceAllItems(
        feed,
        `<podcast:location geo="geo:-27.86159,153.3169" osm="W43678282">Dreamworld (Queensland)</podcast:location>`
      );

      const result = parseFeed(xml);

      expect(result).not.toHaveProperty("podcastLocation");

      result.items.forEach((item) => {
        expect(item).toHaveProperty("podcastLocation");
        expect(item.podcastLocation).toHaveProperty("name", "Dreamworld (Queensland)");
        expect(item.podcastLocation).toHaveProperty("osm", "W43678282");
        expect(item.podcastLocation).toHaveProperty("geo", "geo:-27.86159,153.3169");
      });

      expect(helpers.getPhaseSupport(result, 2)).toContain(supportedName);
    });
  });

  describe("season", () => {
    const supportedName = "season";

    it("correctly identifies non-supporting feeds", () => {
      const result = parseFeed(feed);

      result.items.forEach((item) => expect(item).not.toHaveProperty("podcastSeason"));

      expect(helpers.getPhaseSupport(result, 2)).not.toContain(supportedName);
    });

    it("only supports item level", () => {
      const xml = helpers.spliceFeed(feed, `<podcast:season>5</podcast:season>`);

      const result = parseFeed(xml);

      expect(helpers.getPhaseSupport(result, 2)).not.toContain(supportedName);
    });

    it("requires a number (node text)", () => {
      const xml = helpers.spliceFirstItem(feed, `<podcast:season></podcast:season>`);

      const result = parseFeed(xml);

      const [first] = result.items;
      expect(first).not.toHaveProperty("podcastSeason");

      expect(helpers.getPhaseSupport(result, 2)).not.toContain(supportedName);
    });

    it("requires only a number (node text)", () => {
      const xml = helpers.spliceFirstItem(feed, `<podcast:season>5</podcast:season>`);

      const result = parseFeed(xml);

      const [first] = result.items;
      expect(first).toHaveProperty("podcastSeason");
      expect(first.podcastSeason).toHaveProperty("number", 5);

      expect(helpers.getPhaseSupport(result, 2)).toContain(supportedName);
    });

    it("supports only integers", () => {
      const xml = helpers.spliceFirstItem(feed, `<podcast:season>5.1</podcast:season>`);

      const result = parseFeed(xml);

      const [first] = result.items;
      expect(first).toHaveProperty("podcastSeason");
      expect(first.podcastSeason).toHaveProperty("number", 5);

      expect(helpers.getPhaseSupport(result, 2)).toContain(supportedName);
    });

    it("supports named seasons", () => {
      const xml = helpers.spliceAllItems(
        feed,
        `<podcast:season name="Race for the Whitehouse 2020">3</podcast:season>`
      );

      const result = parseFeed(xml);

      result.items.forEach((item) => {
        expect(item).toHaveProperty("podcastSeason");
        expect(item.podcastSeason).toHaveProperty("number", 3);
        expect(item.podcastSeason).toHaveProperty("name", "Race for the Whitehouse 2020");
      });
      expect(helpers.getPhaseSupport(result, 2)).toContain(supportedName);
    });
  });

  describe("episode", () => {
    const supportedName = "episode";

    it("correctly identifies non-supporting feeds", () => {
      const result = parseFeed(feed);

      result.items.forEach((item) => expect(item).not.toHaveProperty("podcastEpisode"));

      expect(helpers.getPhaseSupport(result, 2)).not.toContain(supportedName);
    });

    it("only supports item level", () => {
      const xml = helpers.spliceFeed(feed, `<podcast:episode>3</podcast:episode>`);

      const result = parseFeed(xml);

      expect(helpers.getPhaseSupport(result, 2)).not.toContain(supportedName);
    });

    it("requires a number (node text)", () => {
      const xml = helpers.spliceFirstItem(feed, `<podcast:episode></podcast:episode>`);

      const result = parseFeed(xml);

      const [first] = result.items;
      expect(first).not.toHaveProperty("podcastEpisode");

      expect(helpers.getPhaseSupport(result, 2)).not.toContain(supportedName);
    });

    it("requires only a number (node text)", () => {
      const xml = helpers.spliceFirstItem(feed, `<podcast:episode>5</podcast:episode>`);

      const result = parseFeed(xml);

      const [first] = result.items;
      expect(first).toHaveProperty("podcastEpisode");
      expect(first.podcastEpisode).toHaveProperty("number", 5);

      expect(helpers.getPhaseSupport(result, 2)).toContain(supportedName);
    });

    it("supports decimals", () => {
      const xml = helpers.spliceFirstItem(feed, `<podcast:episode>5.1</podcast:episode>`);

      const result = parseFeed(xml);

      const [first] = result.items;
      expect(first).toHaveProperty("podcastEpisode");
      expect(first.podcastEpisode).toHaveProperty("number", 5.1);

      expect(helpers.getPhaseSupport(result, 2)).toContain(supportedName);
    });

    it("supports named seasons", () => {
      const xml = helpers.spliceAllItems(
        feed,
        `<podcast:episode display="Ch.3">204</podcast:episode>`
      );

      const result = parseFeed(xml);

      result.items.forEach((item) => {
        expect(item).toHaveProperty("podcastEpisode");
        expect(item.podcastEpisode).toHaveProperty("number", 204);
        expect(item.podcastEpisode).toHaveProperty("display", "Ch.3");
      });
      expect(helpers.getPhaseSupport(result, 2)).toContain(supportedName);
    });
  });
});
