import { categoryLookup } from "../itunes-categories";

describe("iTunes Category Lookup", () => {
  it("returns top-level items", () => {
    const result = categoryLookup("true crime");
    expect(result).toEqual("True Crime");
  });

  it("finds nested child categories", () => {
    const result = categoryLookup("REligion & Spirituality > BuDDhism");
    expect(result).toEqual("Religion & Spirituality > Buddhism");
  });
});
