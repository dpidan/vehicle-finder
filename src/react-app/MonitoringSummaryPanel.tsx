import styles from './App.module.css';
import type { MonitoringSummary } from './types.js';

export function MonitoringSummaryPanel({
  summary,
  status
}: {
  summary: MonitoringSummary | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
}) {
  return (
    <section className={styles.monitoringPanel} aria-live="polite">
      <div className={styles.panelHeader}>
        <h2>Monitoring</h2>
        <span className={styles.status}>{status === 'idle' ? 'None' : status === 'loading' ? 'Loading' : status === 'error' ? 'Error' : 'Ready'}</span>
      </div>
      <div className={styles.monitoringGrid}>
        <Signal label="New" value={summary?.changes.newListings.length ?? 0} />
        <Signal label="Price drops" value={summary?.changes.priceDrops.length ?? 0} />
        <Signal label="Stale" value={summary?.staleListings.length ?? 0} />
        <Signal label="Score hits" value={summary?.thresholdMatches.length ?? 0} />
      </div>
    </section>
  );
}

function Signal({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.signal}>
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
    </div>
  );
}
