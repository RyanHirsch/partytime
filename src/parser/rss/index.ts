import { TODO } from "../types";

import * as handlers from "./handlers";

export const config = {
  namespace: "",
  items: {},
  feed: Object.values(handlers)
    .filter((v) => Boolean(v.tag))
    .reduce(
      (acc, curr) =>
        Object.assign(acc, {
          [curr.tag]: curr,
        }),
      {} as Record<string, TODO>
    ),
};
