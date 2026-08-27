import { useEffect, useState } from 'react';
import { detailEmptyMessage, detailEmptyTitle, formatDate, formatMoney, statusLabel, vehicleLabel } from './format.js';
import styles from './App.module.css';
import type { ListingDetail, ListingDisposition, NextAction, NextActionType, RankedListingSummary, ScoreFactor } from './types.js';

const nextActionOptions: Array<{ value: NextActionType; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'request-vin', label: 'Request VIN' },
  { value: 'ask-maintenance-records', label: 'Ask for records' },
  { value: 'ask-out-the-door-price', label: 'Ask OTD price' },
  { value: 'schedule-inspection', label: 'Schedule inspection' },
  { value: 'follow-up', label: 'Follow up' },
  { value: 'compare', label: 'Compare' }
];

export function ListingDetailPanel({
  detail,
  ranking,
  disposition,
  onNextActionSave,
  status
}: {
  detail: ListingDetail | null;
  ranking: RankedListingSummary['rankedListing'] | null;
  disposition: ListingDisposition | null;
  onNextActionSave: (nextAction: NextAction) => void;
  status: 'idle' | 'loading' | 'ready' | 'error';
}) {
  const listing = detail?.listing;
  const [nextActionType, setNextActionType] = useState<NextActionType>('none');
  const [nextActionDueAt, setNextActionDueAt] = useState('');
  const [nextActionNote, setNextActionNote] = useState('');

  useEffect(() => {
    setNextActionType(disposition?.nextAction?.type ?? 'none');
    setNextActionDueAt(toDateTimeInputValue(disposition?.nextAction?.dueAt));
    setNextActionNote(disposition?.nextAction?.note ?? '');
  }, [disposition?.nextAction?.dueAt, disposition?.nextAction?.note, disposition?.nextAction?.type]);

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
          <h3>Next action</h3>
          <form className={styles.nextActionForm} onSubmit={saveNextAction}>
            <label>
              <span>Action</span>
              <select value={nextActionType} onChange={(event) => setNextActionType(event.target.value as NextActionType)}>
                {nextActionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Due</span>
              <input type="datetime-local" value={nextActionDueAt} onChange={(event) => setNextActionDueAt(event.target.value)} />
            </label>
            <label className={styles.fullWidthField}>
              <span>Note</span>
              <input value={nextActionNote} onChange={(event) => setNextActionNote(event.target.value)} />
            </label>
            <button className={styles.secondaryButton} type="submit">
              Save action
            </button>
          </form>
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

  function saveNextAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onNextActionSave({
      type: nextActionType,
      ...(nextActionDueAt ? { dueAt: new Date(nextActionDueAt).toISOString() } : {}),
      ...(nextActionNote.trim() ? { note: nextActionNote.trim() } : {})
    });
  }
}

function toDateTimeInputValue(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16);
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
