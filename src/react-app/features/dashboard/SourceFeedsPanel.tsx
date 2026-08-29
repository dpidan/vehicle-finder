import styles from '../../App.module.css';
import type { SourceFeedCollectResult, SourceFeedSummary } from '../../api/types.js';

type SourceFeedAction = 'preview' | 'import' | 'activate' | 'pause';

interface SourceFeedsPanelProps {
  feeds: SourceFeedSummary[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  activeAction: { feedId: string; action: SourceFeedAction } | null;
  lastResult: SourceFeedCollectResult | null;
  onLoad: () => void;
  onPreview: (feedId: string) => void;
  onImport: (feedId: string) => void;
  onActivate: (feedId: string) => void;
  onPause: (feedId: string) => void;
}

export function SourceFeedsPanel({ feeds, status, activeAction, lastResult, onLoad, onPreview, onImport, onActivate, onPause }: SourceFeedsPanelProps) {
  const activeCount = feeds.filter((feed) => feed.status === 'active').length;
  const blockedCount = feeds.filter((feed) => feed.status === 'blocked').length;
  const healthyCount = feeds.filter((feed) => feed.lastStatus === 'ok').length;
  const adapterCount = new Set(feeds.map((feed) => feed.adapterKey)).size;
  const activeFeed = activeAction ? feeds.find((feed) => feed.id === activeAction.feedId) : null;

  return (
    <section className={styles.sourceFeedsPanel}>
      <div className={styles.panelHeader}>
        <h2>Source feeds</h2>
        <button className={styles.secondaryButton} type="button" onClick={onLoad} disabled={status === 'loading'}>
          {status === 'loading' ? 'Loading' : 'Load'}
        </button>
      </div>
      {feeds.length > 0 ? (
        <div className={styles.feedQualityGrid}>
          <div>
            <span>Total</span>
            <strong>{feeds.length.toLocaleString()}</strong>
          </div>
          <div>
            <span>Active</span>
            <strong>{activeCount.toLocaleString()}</strong>
          </div>
          <div>
            <span>Healthy last run</span>
            <strong>{healthyCount.toLocaleString()}</strong>
          </div>
          <div>
            <span>Blocked</span>
            <strong>{blockedCount.toLocaleString()}</strong>
          </div>
          <div>
            <span>Adapters</span>
            <strong>{adapterCount.toLocaleString()}</strong>
          </div>
        </div>
      ) : null}
      {activeAction ? (
        <div className={styles.sourcePreviewSummary} role="status">
          <div>
            <span>Source action</span>
            <strong>{activeFeed?.name ?? 'Source feed'}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{actionLabel(activeAction.action)}</strong>
          </div>
        </div>
      ) : lastResult ? (
        <div className={styles.sourcePreviewSummary} role="status">
          <div>
            <span>{lastResult.import ? 'Last import' : 'Last preview'}</span>
            <strong>{lastResult.feed.name}</strong>
          </div>
          <div>
            <span>Candidates</span>
            <strong>{lastResult.collectedCount.toLocaleString()}</strong>
          </div>
          <div>
            <span>VIN-backed</span>
            <strong>{lastResult.vinOverlap.candidatesWithVin.toLocaleString()}</strong>
          </div>
          <div>
            <span>New VINs</span>
            <strong>{lastResult.vinOverlap.newVinCount.toLocaleString()}</strong>
          </div>
          {lastResult.import ? (
            <div>
              <span>Imported</span>
              <strong>
                {lastResult.import.insertedListings.toLocaleString()} new / {lastResult.import.updatedListings.toLocaleString()} updated
              </strong>
            </div>
          ) : null}
        </div>
      ) : null}
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
                const isActivating = activeAction?.feedId === feed.id && activeAction.action === 'activate';
                const isPausing = activeAction?.feedId === feed.id && activeAction.action === 'pause';
                const isBusy = activeAction !== null;
                const feedResult = lastResult?.feed.id === feed.id ? lastResult : null;

                return (
                  <tr key={feed.id}>
                    <td>
                      <a className={styles.listingTitle} href={feed.inventoryUrl} target="_blank" rel="noreferrer">
                        {feed.name}
                      </a>
                      {feed.notes ? <span className={styles.feedNote}>{feed.notes}</span> : null}
                      {feedResult ? (
                        <span className={styles.feedResult}>
                          {feedResult.import ? 'Last import' : 'Last preview'}: {feedResult.collectedCount.toLocaleString()} candidates,{' '}
                          {feedResult.vinOverlap.candidatesWithVin.toLocaleString()} VIN-backed, {feedResult.vinOverlap.newVinCount.toLocaleString()} new VINs
                        </span>
                      ) : null}
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
                        {feed.status === 'active' ? (
                          <button className={styles.secondaryButton} type="button" onClick={() => onPause(feed.id)} disabled={isBusy}>
                            {isPausing ? 'Pausing' : 'Pause'}
                          </button>
                        ) : (
                          <button className={styles.secondaryButton} type="button" onClick={() => onActivate(feed.id)} disabled={isBusy}>
                            {isActivating ? 'Activating' : 'Activate'}
                          </button>
                        )}
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
    </section>
  );
}

function actionLabel(action: SourceFeedAction): string {
  if (action === 'preview') return 'Previewing';
  if (action === 'import') return 'Importing';
  if (action === 'activate') return 'Activating';
  return 'Pausing';
}
