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
  const inspectionItems = detail && listing ? inspectionChecklist(detail, ranking) : [];
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
          {listing.photoUrls?.length ? (
            <div className={styles.photoStrip}>
              {listing.photoUrls.slice(0, 6).map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={listing.title} loading="lazy" />
                </a>
              ))}
            </div>
          ) : null}
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
                {ranking.effectiveCost ? (
                  <DetailItem label="Effective cost" value={formatMoney({ amount: ranking.effectiveCost.total, currency: 'USD' })} />
                ) : null}
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
              {ranking.effectiveCost?.maintenanceItems.length ? (
                <>
                  <h3>Estimated immediate maintenance</h3>
                  <ol className={styles.factorList}>
                    {ranking.effectiveCost.maintenanceItems.map((item) => (
                      <li key={item.key}>
                        <span className={styles.negativeImpact}>{formatMoney({ amount: item.estimatedCost, currency: 'USD' })}</span>
                        <span>
                          {item.label} ({item.matchedText})
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : null}
            </>
          ) : null}
          {detail.risks.length ? (
            <>
              <h3>Model-year notes</h3>
              <ol className={styles.riskList}>
                {detail.risks.map((risk) => (
                  <li key={risk.id}>
                    <strong>{risk.rating}</strong>
                    <span>{risk.issue}</span>
                    {risk.inspectFor.length ? (
                      <ul>
                        {risk.inspectFor.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            </>
          ) : null}
          {detail.recallLookup ? (
            <>
              <h3>Recall notes</h3>
              {detail.recallLookup.recalls.length ? (
                <ol className={styles.riskList}>
                  {detail.recallLookup.recalls.slice(0, 5).map((recall) => (
                    <li key={recall.campaignNumber ?? recall.summary ?? recall.component}>
                      <strong>{recall.campaignNumber ?? 'Recall'}</strong>
                      <span>{[recall.component, recall.summary].filter(Boolean).join(': ')}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={styles.subtle}>No cached recalls for this year, make, and model.</p>
              )}
            </>
          ) : null}
          {inspectionItems.length ? (
            <>
              <h3>Inspection checklist</h3>
              <ul className={styles.checklist}>
                {inspectionItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
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
    'effective-purchase-cost': 'Effective purchase cost',
    'immediate-maintenance-over-reserve': 'Immediate maintenance over reserve',
    'maintenance-evidence': 'Maintenance evidence',
    'mileage-fit': 'Mileage fit',
    'missing-maintenance-evidence': 'Missing maintenance evidence',
    'missing-vin': 'Missing VIN',
    'model-year-risk': 'Model-year risk',
    'model-preference': 'Model preference',
    'title-status-mismatch': 'Title status mismatch'
  };

  return labels[factor.key] ?? factor.key.replaceAll('-', ' ');
}

function inspectionChecklist(detail: ListingDetail, ranking: RankedListingSummary['rankedListing'] | null): string[] {
  const items = [
    ...detail.risks.flatMap((risk) => risk.inspectFor),
    ...(detail.recallLookup?.recalls.length ? ['Check recall applicability and remedy status by VIN before purchase.'] : []),
    ...(!detail.listing.vehicle.vin ? ['Request and verify the VIN before committing time or money.'] : []),
    ...(ranking?.flags.includes('missing-maintenance-evidence') ? ['Ask for maintenance records or service history documentation.'] : []),
    ...(ranking?.flags.includes('suspiciously-low-price')
      ? ['Verify why the price is unusually low before treating it as a bargain.']
      : []),
    ...(ranking?.flags.includes('immediate-maintenance-over-reserve')
      ? ['Get a written repair estimate for listed immediate maintenance items.']
      : []),
    ...(ranking?.flags.includes('title-status-mismatch') ? ['Verify title status against the seller paperwork and listing details.'] : []),
    ...(detail.listing.price ? ['Confirm out-the-door price and required fees in writing.'] : ['Ask for current asking price in writing.']),
    'Arrange an independent pre-purchase inspection before purchase.'
  ];

  return Array.from(new Set(items));
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
