# Partytime Podcast Parser

Podcast feed parser extracted from podcast index - https://github.com/Podcastindex-org/aggregator/tree/master/partytime

This package will also identify [new namespace elements](https://github.com/Podcastindex-org/podcast-namespace) and call out the "phases" implemented by the feed in a `__phase` element.


## Usage

```sh
npm install podcast-partytime
```

### Typescript

```ts
import fetch from "node-fetch";
import * as pt from "podcast-partytime";

// Check CORS support
pt.checkFeedByUri("https://www.spreaker.com/show/3128218/episodes/feed").then(
  console.log
);

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

### Javascript

```js
const fetch = require("node-fetch");
const pt = require("podcast-partytime");

// Check CORS support
pt.checkFeedByUri("https://www.spreaker.com/show/3128218/episodes/feed").then(
  console.log
);

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
