import { detailEmptyMessage, detailEmptyTitle, formatDate, formatMoney, statusLabel, vehicleLabel } from './format.js';
import styles from './App.module.css';
import type { ListingDetail, RankedListingSummary, ScoreFactor } from './types.js';

export function ListingDetailPanel({
  detail,
  ranking,
  status
}: {
  detail: ListingDetail | null;
  ranking: RankedListingSummary['rankedListing'] | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
}) {
  const listing = detail?.listing;

  return (
    <aside className={styles.detailPanel}>
      <div className={styles.panelHeader}>
        <h2>Listing detail</h2>
        <span className={styles.status}>{status === 'idle' ? 'None' : statusLabel(status)}</span>
      </div>
      {status === 'ready' && listing ? (
        <div className={styles.detailBody}>
          <a className={styles.detailTitle} href={listing.url} target="_blank" rel="noreferrer">
            {listing.title}
          </a>
          <div className={styles.detailGrid}>
            <DetailItem label="Vehicle" value={vehicleLabel(listing.vehicle)} />
            <DetailItem label="VIN" value={listing.vehicle.vin ?? 'Missing'} />
            <DetailItem label="Price" value={formatMoney(listing.price)} />
            <DetailItem label="Mileage" value={listing.mileage ? `${listing.mileage.toLocaleString()} mi` : 'Unknown'} />
            <DetailItem label="Title" value={listing.titleStatus ?? 'Unknown'} />
            <DetailItem label="Status" value={listing.status ?? 'Unknown'} />
            <DetailItem label="Seller" value={listing.seller?.name ?? 'Unknown'} />
            <DetailItem label="Source" value={listing.source.name} />
          </div>
          {ranking ? (
            <>
              <h3>Score factors</h3>
              <div className={styles.scoreSummary}>
                <DetailItem label="Deal score" value={String(ranking.dealScore)} />
                <DetailItem label="Vehicle score" value={String(ranking.vehicleScore)} />
              </div>
              {ranking.factors.length ? (
                <ol className={styles.factorList}>
                  {ranking.factors.map((factor) => (
                    <li key={factor.key}>
                      <span className={factor.scoreImpact < 0 ? styles.negativeImpact : styles.positiveImpact}>
                        {formatImpact(factor.scoreImpact)}
                      </span>
                      <span>{factorLabel(factor)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={styles.subtle}>No score factors stored for this listing.</p>
              )}
            </>
          ) : null}
          <h3>Recent snapshots</h3>
          {detail.snapshots.length ? (
            <ol className={styles.snapshotList}>
              {detail.snapshots.map((snapshot) => (
                <li key={snapshot.id}>
                  <time dateTime={snapshot.capturedAt}>{formatDate(snapshot.capturedAt)}</time>
                  <span>{formatMoney(snapshot.price)}</span>
                  <span>{snapshot.mileage ? `${snapshot.mileage.toLocaleString()} mi` : 'Unknown mileage'}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.subtle}>No snapshots yet.</p>
          )}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2>{detailEmptyTitle(status)}</h2>
          <p>{detailEmptyMessage(status)}</p>
        </div>
      )}
    </aside>
  );
}

function formatImpact(scoreImpact: number): string {
  return scoreImpact > 0 ? `+${scoreImpact}` : String(scoreImpact);
}

function factorLabel(factor: ScoreFactor): string {
  const labels: Record<string, string> = {
    'budget-fit': 'Budget fit',
    'clean-title': 'Clean title',
    'maintenance-evidence': 'Maintenance evidence',
    'mileage-fit': 'Mileage fit',
    'missing-maintenance-evidence': 'Missing maintenance evidence',
    'missing-vin': 'Missing VIN',
    'model-preference': 'Model preference',
    'title-status-mismatch': 'Title status mismatch'
  };

  return labels[factor.key] ?? factor.key.replaceAll('-', ' ');
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
