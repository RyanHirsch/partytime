# Partytime Podcast Parser

Podcast feed parser extracted from podcast index - https://github.com/Podcastindex-org/aggregator/tree/master/partytime

This package will also identify [new namespace elements](https://github.com/Podcastindex-org/podcast-namespace) and call out the "phases" implemented by the feed in a `__phase` element.


## Usage

```sh
npm install podcast-partytime
```

### Typescript

```ts
import fetch from 'node-fetch';
import * as partytime from 'podcast-partytime';

const url = "http://mp3s.nashownotes.com/pc20rss.xml";


fetch(url).then(resp => resp.text())
  .then(xml => console.log(partytime(xml)));
```

### Javascript

```js
const fetch = require('node-fetch');
const pt = require('podcast-partytime');

const url = "http://mp3s.nashownotes.com/pc20rss.xml";


fetch(url).then(resp => resp.text())
  .then(xml => console.log(pt(xml)));
```
