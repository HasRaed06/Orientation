import type { SearchItem, AdItem, FeedItem } from "./types";

const PLACEMENT_INDEX = 3;

const AD_PLACEHOLDER: AdItem = {
  type: "ad",
  id: "ad-placeholder",
  headline: "إعلان ممول",
  body: "هذا المساحة مخصصة للإعلانات",
  advertiser: "SPONSORED",
  clickUrl: "#",
};

export function injectAd(results: SearchItem[]): FeedItem[] {
  if (results.length <= PLACEMENT_INDEX) {
    return results;
  }

  const feed: FeedItem[] = [...results];
  feed.splice(PLACEMENT_INDEX, 0, AD_PLACEHOLDER);
  return feed;
}
