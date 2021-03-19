# Partytime Podcast Parser

Extracted from podcast index - https://github.com/Podcastindex-org/aggregator/tree/master/partytime

Identified Namespace elements - https://github.com/Podcastindex-org/podcast-namespace

Example RSS Feed - https://github.com/Podcastindex-org/podcast-namespace/blob/main/example.xml

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
