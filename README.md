# Partytime Podcast Parser

[![NPM version](https://img.shields.io/npm/v/podcast-partytime.svg)](https://www.npmjs.com/package/podcast-partytime)

Podcast feed parser, originally extracted from podcast index - https://github.com/Podcastindex-org/aggregator/tree/master/partytime. It is up to you, the consumer of this package, to fetch the feed which needs to be parsed. When fetching the feed YOU SHOULD INCLUDE A PROPER USER-AGENT.

This package will also identify [new namespace elements](https://github.com/Podcastindex-org/podcast-namespace) and call out the "phases" implemented by the feed in a `pc20support` element.

By default, this will produce log messages that are warnings or errors, but this can be controlled via an environment variable, `PARTYTIME_LOG` can be set to whatever log level you may want.

## Usage

```sh
npm install podcast-partytime
```

### Typescript

```ts
import fetch from "node-fetch";
import pt from "podcast-partytime";

// Check CORS support
pt.checkFeedByUri("https://www.spreaker.com/show/3128218/episodes/feed").then(console.log);

fetch("http://mp3s.nashownotes.com/pc20rss.xml", {
  headers: {
    "user-agent": "partytime/example",
  },
})
  .then((resp) => resp.text())
  .then((xml) =>
    console.log(
      pt.checkFeedByObject({
        uri: "http://mp3s.nashownotes.com/pc20rss.xml",
        feedObject: pt.parseFeed(xml),
      })
    )
  );

// Parse Feed
fetch("http://mp3s.nashownotes.com/pc20rss.xml", {
  headers: {
    "user-agent": "partytime/example",
  },
})
  .then((resp) => resp.text())
  .then((xml) => console.log(pt.parseFeed(xml)));
```

### Javascript

```js
const fetch = require("node-fetch");
const pt = require("podcast-partytime");

// Check CORS support
pt.checkFeedByUri("https://www.spreaker.com/show/3128218/episodes/feed").then(console.log);

fetch("http://mp3s.nashownotes.com/pc20rss.xml")
  .then((resp) => resp.text())
  .then((xml) =>
    console.log(
      pt.checkFeedByObject({
        uri: "http://mp3s.nashownotes.com/pc20rss.xml",
        feedObject: pt.parseFeed(xml),
      })
    )
  );

// Parse Feed
fetch("http://mp3s.nashownotes.com/pc20rss.xml")
  .then((resp) => resp.text())
  .then((xml) => console.log(pt.parseFeed(xml)));
```

## Resources

- [RSS 2.0 at Harvard Law](https://cyber.harvard.edu/rss/rss.html)
- [W3C RSS](https://validator.w3.org/feed/docs/rss2.html)
- [A Podcaster’s Guide to RSS](https://help.apple.com/itc/podcasts_connect/#/itcb54353390)
- [1.0 Namespace Spec](https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md)

### Sample Feeds

The sample feeds below were chosen for their varied nature. Including things like non-traditional titles, different publishers, and season usage.

- [Pod Save America](https://feeds.megaphone.fm/pod-save-america)
- [No Agenda](http://feed.nashownotes.com/rss.xml)
- [This Week in Tech](https://feeds.twit.tv/twit.xml)
- [Launched](https://feeds.fireside.fm/launched/rss)
- [Anatomy of Next](https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss)
- [Thomas Ferris Nicolaisen's rants](http://feeds.tfnico.com/tfnicosrants)
- [Hip Hop Hangout Podcast](https://feeds.feedburner.com/HipHopHangoutPodcast)
- [Web 2.0](https://satoshi.blogs.com/raw/web20.xml)

## Development

Update dependencies (person enum and valid license list) via `yarn deps` or `npm run deps`.

### Testing the Parser with Live Feeds

Use the dev script to quickly test the parser against live podcast feeds:

```sh
# Parse a specific feed URL
yarn dev http://mp3s.nashownotes.com/pc20rss.xml

# Parse and save the raw XML and parsed JSON to disk
yarn dev --save http://mp3s.nashownotes.com/pc20rss.xml

# Parse all feeds in the predefined list
yarn dev --all

# Fetch and parse latest feeds from Podcast Index API
# (requires PI_API_KEY and PI_API_SECRET environment variables)
yarn dev --latest
```

The dev script will output:
- The byte count of the fetched feed
- Success/failure status
- Episode count and Podcasting 2.0 namespace support summary
- Full parsed JSON output

To add more feeds to the predefined list, edit the `feeds` array in `src/dev.ts`.
