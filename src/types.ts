export interface SearchItem {
  type: "search";
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
}

export interface AdItem {
  type: "ad";
  id: string;
  headline: string;
  body: string;
  advertiser: string;
  clickUrl: string;
  imageUrl?: string;
}

export type FeedItem = SearchItem | AdItem;

export interface SearchFeedProps {
  results: SearchItem[];
}
