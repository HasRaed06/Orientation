import { useMemo, useState, useEffect } from "react";
import { AdMob, BannerAdSize, BannerAdPosition } from "@capacitor-community/admob";
import type { SearchItem, FeedItem } from "./types";
import { injectAd } from "./injectAd";
import "./SearchFeed.css";

const BANNER_AD_ID = "ca-app-pub-3940256099942544/6300978111";

interface SearchFeedProps {
  results: SearchItem[];
}

function ResultCard({ item }: { item: SearchItem }) {
  return (
    <article className="feed-card feed-card--result">
      {item.thumbnail && (
        <img
          className="feed-card__thumb"
          src={item.thumbnail}
          alt=""
          loading="lazy"
        />
      )}
      <div className="feed-card__body">
        <a className="feed-card__title" href={item.url}>
          {item.title}
        </a>
        <p className="feed-card__desc">{item.description}</p>
      </div>
    </article>
  );
}

function AdCard() {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    AdMob.showBanner({
      adId: BANNER_AD_ID,
      isTesting: true,
      position: BannerAdPosition.CENTER,
      adSize: BannerAdSize.BANNER,
    })
      .then(() => {
        if (!cancelled) setAdLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setAdFailed(true);
      });

    return () => {
      cancelled = true;
      AdMob.removeBanner();
    };
  }, []);

  if (adFailed) return null;

  return (
    <div className="feed-card feed-card--ad" aria-label="Sponsored content">
      <span className="feed-card__badge">SPONSORED</span>
      <div className="feed-card__body">
        <p className="feed-card__title">إعلان ممول</p>
        {adLoaded ? (
          <p className="feed-card__desc">محتويات الإعلان ستظهر هنا.</p>
        ) : (
          <p className="feed-card__desc feed-card__desc--loading">
            جاري تحميل الإعلان...
          </p>
        )}
      </div>
    </div>
  );
}

export default function SearchFeed({ results }: SearchFeedProps) {
  const feed = useMemo<FeedItem[]>(() => injectAd(results), [results]);

  if (feed.length === 0) {
    return <p className="feed-empty">لا توجد نتائج.</p>;
  }

  return (
    <section className="feed">
      <ul className="feed__list">
        {feed.map((item) => (
          <li key={item.id} className="feed__item">
            {item.type === "search" ? (
              <ResultCard item={item} />
            ) : (
              <AdCard />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
