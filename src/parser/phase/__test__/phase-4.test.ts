import * as helpers from "../../__test__/helpers";
import { parseFeed } from "../../index";
import { Episode, FeedObject } from "../../shared";

describe("phase 4", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("value", () => {
    const supportedName = "value";

    const assertAlice = (alice) => {
      expect(alice).toHaveProperty("name", "Alice (Podcaster)");
      expect(alice).toHaveProperty("type", "node");
      expect(alice).toHaveProperty(
        "address",
        "02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
      );
      expect(alice).toHaveProperty("split", 40);
      expect(alice).toHaveProperty("fee", false);
    };
    const assertBob = (bob) => {
      expect(bob).toHaveProperty("name", "Bob (Podcaster)");
      expect(bob).toHaveProperty("type", "node");
      expect(bob).toHaveProperty(
        "address",
        "032f4ffbbafffbe51726ad3c164a3d0d37ec27bc67b29a159b0f49ae8ac21b8508"
      );
      expect(bob).toHaveProperty("split", 40);
      expect(bob).toHaveProperty("fee", false);
    };
    const assertCarol = (carol) => {
      expect(carol).toHaveProperty("name", "Carol (Producer)");
      expect(carol).toHaveProperty("type", "node");
      expect(carol).toHaveProperty(
        "address",
        "02dd306e68c46681aa21d88a436fb35355a8579dd30201581cefa17cb179fc4c15"
      );
      expect(carol).toHaveProperty("split", 15);
      expect(carol).toHaveProperty("fee", false);
    };
    const assertHost = (host) => {
      expect(host).toHaveProperty("name", "Hosting Provider");
      expect(host).toHaveProperty("type", "node");
      expect(host).toHaveProperty(
        "address",
        "03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a"
      );
      expect(host).toHaveProperty("split", 5);
      expect(host).toHaveProperty("fee", true);
    };

    it("correctly identifies a basic feed", () => {
      const result = parseFeed(feed);

      expect(helpers.getPhaseSupport(result, 4)).not.toContain(supportedName);
    });

    it("allows for a feed level block", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="40"
        />
        <podcast:valueRecipient
            name="Bob (Podcaster)"
            type="node"
            address="032f4ffbbafffbe51726ad3c164a3d0d37ec27bc67b29a159b0f49ae8ac21b8508"
            split="40"
        />
        <podcast:valueRecipient
            name="Carol (Producer)"
            type="node"
            address="02dd306e68c46681aa21d88a436fb35355a8579dd30201581cefa17cb179fc4c15"
            split="15"
        />
        <podcast:valueRecipient
            name="Hosting Provider"
            type="node"
            address="03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a"
            split="5"
            fee="true"
        />
      </podcast:value>
      `
      );

      const assertBlockProperties = (block: FeedObject | Episode): void => {
        expect(block.value).toHaveProperty("type", "lightning");
        expect(block.value).toHaveProperty("method", "keysend");
        expect(block.value).toHaveProperty("suggested", 0.00000015);

        expect(block.value.recipients).toHaveLength(4);

        const [r1, r2, r3, r4] = block.value.recipients;
        assertAlice(r1);
        assertBob(r2);
        assertCarol(r3);
        assertHost(r4);
      };

      const result = parseFeed(xml);
      expect(result).toHaveProperty("value");
      assertBlockProperties(result);

      expect(helpers.getPhaseSupport(result, 4)).toContain(supportedName);
    });

    it("prioritizes item level blocks", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="40"
        />
      </podcast:value>
      `
      );

      const result = parseFeed(
        helpers.spliceFirstItem(
          xml,
          `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="40"
        />
        <podcast:valueRecipient
        name="Bob (Podcaster)"
        type="node"
        address="032f4ffbbafffbe51726ad3c164a3d0d37ec27bc67b29a159b0f49ae8ac21b8508"
        split="40"
    />
      </podcast:value>
      `
        )
      );

      const assertBlockProperties = (block: FeedObject | Episode): void => {
        expect(block.value).toHaveProperty("type", "lightning");
        expect(block.value).toHaveProperty("method", "keysend");
        expect(block.value).toHaveProperty("suggested", 0.00000015);
      };

      expect(result).toHaveProperty("value");
      assertBlockProperties(result);
      expect(result.value.recipients).toHaveLength(1);
      assertAlice(result.value.recipients[0]);

      const [first, second, third] = result.items;
      expect(first).toHaveProperty("value");
      assertBlockProperties(first);
      expect(first.value.recipients).toHaveLength(2);
      assertAlice(first.value.recipients[0]);
      assertBob(first.value.recipients[1]);

      expect(second).toHaveProperty("value");
      assertBlockProperties(second);
      expect(second.value.recipients).toHaveLength(1);
      assertAlice(second.value.recipients[0]);

      expect(third).toHaveProperty("value");
      assertBlockProperties(third);
      expect(third.value.recipients).toHaveLength(1);
      assertAlice(third.value.recipients[0]);

      expect(helpers.getPhaseSupport(result, 4)).toContain(supportedName);
    });

    it("allows for only item level blocks", () => {
      const result = parseFeed(
        helpers.spliceFirstItem(
          feed,
          `<podcast:value type="lightning" method="keysend" suggested="0.1">
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="40"
        />
        <podcast:valueRecipient
        name="Bob (Podcaster)"
        type="node"
        address="032f4ffbbafffbe51726ad3c164a3d0d37ec27bc67b29a159b0f49ae8ac21b8508"
        split="40"
    />
      </podcast:value>
      `
        )
      );

      const assertBlockProperties = (block: FeedObject | Episode): void => {
        expect(block.value).toHaveProperty("type", "lightning");
        expect(block.value).toHaveProperty("method", "keysend");
        expect(block.value).toHaveProperty("suggested", 0.1);
      };

      expect(result).not.toHaveProperty("value");

      const [first, second, third] = result.items;
      expect(first).toHaveProperty("value");
      assertBlockProperties(first);
      expect(first.value.recipients).toHaveLength(2);
      assertAlice(first.value.recipients[0]);
      assertBob(first.value.recipients[1]);

      expect(second).not.toHaveProperty("value");

      expect(third).not.toHaveProperty("value");

      expect(helpers.getPhaseSupport(result, 4)).toContain(supportedName);
    });

    it("falls back to feed block", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="40"
        />
        <podcast:valueRecipient
            name="Bob (Podcaster)"
            type="node"
            address="032f4ffbbafffbe51726ad3c164a3d0d37ec27bc67b29a159b0f49ae8ac21b8508"
            split="40"
        />
        <podcast:valueRecipient
            name="Carol (Producer)"
            type="node"
            address="02dd306e68c46681aa21d88a436fb35355a8579dd30201581cefa17cb179fc4c15"
            split="15"
        />
      </podcast:value>
      `
      );

      const assertBlockProperties = (block: FeedObject | Episode): void => {
        expect(block.value).toHaveProperty("type", "lightning");
        expect(block.value).toHaveProperty("method", "keysend");
        expect(block.value).toHaveProperty("suggested", 0.00000015);

        expect(block.value.recipients).toHaveLength(3);

        const [r1, r2, r3] = block.value.recipients;
        assertAlice(r1);
        assertBob(r2);
        assertCarol(r3);
      };

      const result = parseFeed(xml);
      expect(result).toHaveProperty("value");

      const [first, second, third] = result.items;
      expect(first).toHaveProperty("value");
      assertBlockProperties(first);
      expect(second).toHaveProperty("value");
      assertBlockProperties(second);
      expect(third).toHaveProperty("value");
      assertBlockProperties(third);

      expect(helpers.getPhaseSupport(result, 4)).toContain(supportedName);
    });
  });
});
