import styles from '../../App.module.css';
import type { MonitoringWindow } from '../../api/client.js';
import { formatDate, formatMoney } from '../../utils/format.js';
import type { ListingChangeSummary, MonitoringSummary, SearchEvaluationSummary, StaleListingSummary } from '../../api/types.js';

export function MonitoringSummaryPanel({
  summary,
  status,
  window,
  onWindowChange
}: {
  summary: MonitoringSummary | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  window: MonitoringWindow;
  onWindowChange: (window: MonitoringWindow) => void;
}) {
  return (
    <section className={styles.monitoringPanel} aria-live="polite">
      <div className={styles.panelHeader}>
        <h2>Monitoring</h2>
        <span className={styles.status}>{status === 'idle' ? 'None' : status === 'loading' ? 'Loading' : status === 'error' ? 'Error' : 'Ready'}</span>
      </div>
      <div className={styles.monitoringControls}>
        <label>
          <span>Recent hours</span>
          <input
            min="1"
            max="168"
            type="number"
            value={window.recentHours}
            onChange={(event) => onWindowChange({ ...window, recentHours: boundedNumber(event.target.value, 1, 168, 24) })}
          />
        </label>
        <label>
          <span>Stale days</span>
          <input
            min="1"
            max="60"
            type="number"
            value={window.staleDays}
            onChange={(event) => onWindowChange({ ...window, staleDays: boundedNumber(event.target.value, 1, 60, 7) })}
          />
        </label>
      </div>
      <div className={styles.monitoringGrid}>
        <Signal label="New" value={summary?.changes.newListings.length ?? 0} />
        <Signal label="Price drops" value={summary?.changes.priceDrops.length ?? 0} />
        <Signal label="Stale" value={summary?.staleListings.length ?? 0} />
        <Signal label="Score hits" value={summary?.thresholdMatches.length ?? 0} />
      </div>
      {summary ? (
        <div className={styles.monitoringDigest}>
          <DigestSection title="New listings" items={summary.changes.newListings} empty="No new listings in this window." renderItem={renderNewListing} />
          <DigestSection title="Price drops" items={summary.changes.priceDrops} empty="No price drops in this window." renderItem={renderPriceDrop} />
          <DigestSection title="Score hits" items={summary.thresholdMatches} empty="No score threshold matches." renderItem={renderThresholdMatch} />
          <DigestSection title="Stale listings" items={summary.staleListings} empty="No stale listings." renderItem={renderStaleListing} />
        </div>
      ) : null}
    </section>
  );
}

function boundedNumber(value: string, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
}

function Signal({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.signal}>
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
    </div>
  );
}

function DigestSection<T>({
  empty,
  items,
  renderItem,
  title
}: {
  empty: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  title: string;
}) {
  return (
    <section className={styles.digestSection}>
      <h3>{title}</h3>
      {items.length ? <ol>{items.slice(0, 5).map(renderItem)}</ol> : <p className={styles.subtle}>{empty}</p>}
    </section>
  );
}

function renderNewListing(listing: ListingChangeSummary) {
  return (
    <li key={listing.listingId}>
      <a href={listing.url} target="_blank" rel="noreferrer">
        {listing.title}
      </a>
      <span>{formatMoney(listing.currentPrice)}</span>
    </li>
  );
}

function renderPriceDrop(listing: ListingChangeSummary) {
  return (
    <li key={listing.listingId}>
      <a href={listing.url} target="_blank" rel="noreferrer">
        {listing.title}
      </a>
      <span>
        {formatMoney(listing.previousPrice)} to {formatMoney(listing.currentPrice)}
      </span>
    </li>
  );
}

function renderThresholdMatch(evaluation: SearchEvaluationSummary) {
  return (
    <li key={evaluation.listingId}>
      <a href={evaluation.listing.url} target="_blank" rel="noreferrer">
        {evaluation.listing.title}
      </a>
      <span>
        Deal {evaluation.dealScore} | Vehicle {evaluation.vehicleScore}
      </span>
    </li>
  );
}

function renderStaleListing(listing: StaleListingSummary) {
  return (
    <li key={listing.listingId}>
      <a href={listing.url} target="_blank" rel="noreferrer">
        {listing.title}
      </a>
      <span>
        {formatMoney(listing.price)} | last seen {formatDate(listing.lastSeenAt)}
      </span>
    </li>
  );
}
