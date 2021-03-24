/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import sqlite from "sqlite3";
import * as path from "path";

import { getFeedText } from "../../shared";
import { parseFeed } from "../index";
import { log } from "../../logger";

const randomInRange = (min: number, max: number): number => {
  const range = max - min;
  const random = Math.random() * range + min;
  return Math.floor(random);
};

describe("Parser", () => {
  let db: sqlite.Database;
  beforeEach((done) => {
    db = new sqlite.Database(path.resolve(__dirname, "fixtures/podcastindex_feeds.db"), done);
  });

  afterAll((done) => {
    if (db) db.close(done);
  });

  function run(sql: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (db) {
        db.all(sql, (err, rows) => {
          if (err) {
            reject(err);
          } else resolve(rows);
        });
      } else {
        resolve([]);
      }
    });
  }

  it("accesses the db", async () => {
    const statement = `SELECT * FROM podcasts LIMIT 2;`;
    const rows = await run(statement);
    expect(rows).toHaveLength(2);
  });

  it("parses feeds by hosts", async () => {
    const [maxItem] = await run("SELECT max(newestItemPubdate) as max FROM podcasts;");
    const [avgItem] = await run("SELECT avg(newestItemPubdate) as avg FROM podcasts;");

    const start = randomInRange(avgItem.avg, maxItem.max);

    const statement = `SELECT DISTINCT host FROM podcasts WHERE newestItemPubdate > ${start} LIMIT 5;`;
    const hosts = await run(statement);
    for (let i = 0; i < hosts.length; i += 1) {
      const { host } = hosts[i];
      const [feed] = await run(
        `SELECT * FROM podcasts WHERE host = "${
          host as string
        }" AND dead = 0 AND lastHttpStatus = 200 LIMIT 1;`
      );
      // eslint-disable-next-line no-await-in-loop
      const result = parseFeed(await getFeedText(feed.url));
      if (!result) {
        log.error(feed.id, feed.url);
      }
      expect(result).not.toBe(null);
    }
  });

  it("parses random feeds by newestItemPubdate", async () => {
    const [maxItem] = await run("SELECT max(newestItemPubdate) as max FROM podcasts;");
    const [avgItem] = await run("SELECT avg(newestItemPubdate) as avg FROM podcasts;");

    const start = randomInRange(avgItem.avg, maxItem.max);

    const statement = `SELECT * FROM podcasts WHERE newestItemPubdate > ${start} AND dead = 0 AND lastHttpStatus = 200 LIMIT 15;`;
    const feeds = await run(statement);
    const feedXml = await Promise.all(feeds.map((feed) => getFeedText(feed.url)));

    feedXml.forEach((xml, idx) => {
      const result = parseFeed(xml);
      if (!result) {
        log.error(feeds[idx].id, feeds[idx].url);
      }
      expect(result).not.toBe(null);
    });
  });

  it("parses random feeds by itunesId", async () => {
    const [maxItem] = await run("SELECT max(itunesId) as max FROM podcasts;");
    const [avgItem] = await run("SELECT avg(itunesId) as avg FROM podcasts;");

    const start = randomInRange(avgItem.avg, maxItem.max);

    const statement = `SELECT * FROM podcasts WHERE itunesId > ${start} AND dead = 0 AND lastHttpStatus = 200 LIMIT 15;`;
    const feeds = await run(statement);
    const feedXml = await Promise.all(feeds.map((feed) => getFeedText(feed.url)));

    feedXml.forEach((xml, idx) => {
      const result = parseFeed(xml);
      if (!result) {
        log.error(feeds[idx].id, feeds[idx].url);
      }
      expect(result).not.toBe(null);
    });
  });

  it("parses random feeds by id", async () => {
    const [maxItem] = await run("SELECT max(id) as max FROM podcasts;");
    const [minItem] = await run("SELECT min(id) as min FROM podcasts;");

    const start = randomInRange(minItem.min, maxItem.max);

    const statement = `SELECT * FROM podcasts WHERE id > ${start} AND dead = 0 AND lastHttpStatus = 200 LIMIT 15;`;
    const feeds = await run(statement);
    const feedXml = await Promise.all(feeds.map((feed) => getFeedText(feed.url)));

    feedXml.forEach((xml, idx) => {
      const result = parseFeed(xml);
      if (!result) {
        log.error(feeds[idx].id, feeds[idx].url);
      }
      expect(result).not.toBe(null);
    });
  });
});
