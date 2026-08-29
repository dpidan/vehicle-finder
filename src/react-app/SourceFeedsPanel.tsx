import styles from './App.module.css';
import type { SourceFeedCollectResult, SourceFeedSummary } from './types.js';

type SourceFeedAction = 'preview' | 'import';

interface SourceFeedsPanelProps {
  feeds: SourceFeedSummary[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  activeAction: { feedId: string; action: SourceFeedAction } | null;
  lastResult: SourceFeedCollectResult | null;
  onLoad: () => void;
  onPreview: (feedId: string) => void;
  onImport: (feedId: string) => void;
}

export function SourceFeedsPanel({ feeds, status, activeAction, lastResult, onLoad, onPreview, onImport }: SourceFeedsPanelProps) {
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeds.map((feed) => {
                const isPreviewing = activeAction?.feedId === feed.id && activeAction.action === 'preview';
                const isImporting = activeAction?.feedId === feed.id && activeAction.action === 'import';
                const isBusy = activeAction !== null;

                return (
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
                    <td>
                      <div className={styles.feedActions}>
                        <button className={styles.secondaryButton} type="button" onClick={() => onPreview(feed.id)} disabled={isBusy}>
                          {isPreviewing ? 'Previewing' : 'Preview'}
                        </button>
                        <button
                          className={styles.secondaryButton}
                          type="button"
                          onClick={() => onImport(feed.id)}
                          disabled={isBusy || feed.status !== 'active'}
                        >
                          {isImporting ? 'Importing' : 'Import'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2>{status === 'error' ? 'Could not load feeds' : 'No source feeds loaded'}</h2>
          <p>Use the admin token to inspect collector status.</p>
        </div>
      )}
      {lastResult ? (
        <p className={styles.panelNote}>
          Last source action: {lastResult.feed.name} collected {lastResult.collectedCount.toLocaleString()} candidates;
          {` ${lastResult.vinOverlap.matchingExistingVehicles.toLocaleString()} matched existing VINs`}
          {lastResult.import
            ? `, imported ${lastResult.import.insertedListings.toLocaleString()} new and ${lastResult.import.updatedListings.toLocaleString()} updated listings.`
            : '.'}
        </p>
      ) : null}
    </section>
  );
}
