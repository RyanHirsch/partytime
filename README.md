# Partytime Podcast Parser

[![NPM version](https://img.shields.io/npm/v/podcast-partytime.svg)](https://www.npmjs.com/package/podcast-partytime)

Podcast feed parser, originally extracted from podcast index - https://github.com/Podcastindex-org/aggregator/tree/master/partytime. It is up to you, the consumer of this package, to fetch the feed which needs to be parsed. When fetching the feed YOU SHOULD INCLUDE A PROPER USER-AGENT. You can test by fetching and checking the description of `https://podnews.net/rss`.

This package will also identify [new namespace elements](https://github.com/Podcastindex-org/podcast-namespace) and call out the "phases" implemented by the feed in a `pc20support` element.

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
    }
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
    }
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
