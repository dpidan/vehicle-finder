import styles from './App.module.css';
import type { MonitoringWindow } from './api.js';
import type { MonitoringSummary } from './types.js';

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
