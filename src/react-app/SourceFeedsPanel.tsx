import styles from './App.module.css';
import type { SourceFeedSummary } from './types.js';

interface SourceFeedsPanelProps {
  feeds: SourceFeedSummary[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  onLoad: () => void;
}

export function SourceFeedsPanel({ feeds, status, onLoad }: SourceFeedsPanelProps) {
  return (
    <section className={styles.sourceFeedsPanel}>
      <div className={styles.panelHeader}>
        <h2>Source feeds</h2>
        <button className={styles.secondaryButton} type="button" onClick={onLoad} disabled={status === 'loading'}>
          {status === 'loading' ? 'Loading' : 'Load'}
        </button>
      </div>
      {status === 'ready' && feeds.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.sourceFeedsTable}>
            <thead>
              <tr>
                <th>Feed</th>
                <th>Adapter</th>
                <th>Status</th>
                <th>Last count</th>
                <th>Last run</th>
              </tr>
            </thead>
            <tbody>
              {feeds.map((feed) => (
                <tr key={feed.id}>
                  <td>
                    <a className={styles.listingTitle} href={feed.inventoryUrl} target="_blank" rel="noreferrer">
                      {feed.name}
                    </a>
                    {feed.lastError ? <span className={styles.feedError}>{feed.lastError}</span> : null}
                  </td>
                  <td>{feed.adapterKey}</td>
                  <td>
                    <span className={feed.status === 'active' ? styles.feedActive : styles.feedMuted}>
                      {feed.status}
                      {feed.lastStatus ? ` / ${feed.lastStatus}` : ''}
                    </span>
                  </td>
                  <td>{feed.lastCandidateCount ?? '-'}</td>
                  <td>{feed.lastCollectedAt ? new Date(feed.lastCollectedAt).toLocaleString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2>{status === 'error' ? 'Could not load feeds' : 'No source feeds loaded'}</h2>
          <p>Use the admin token to inspect collector status.</p>
        </div>
      )}
    </section>
  );
}
