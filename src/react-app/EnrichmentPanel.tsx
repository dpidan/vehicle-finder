import styles from './App.module.css';

export function EnrichmentPanel({
  canDecodeVins,
  canLookupRecalls,
  message,
  onDecodeVins,
  onLookupRecalls,
  status
}: {
  canDecodeVins: boolean;
  canLookupRecalls: boolean;
  message: string;
  onDecodeVins: () => void;
  onLookupRecalls: () => void;
  status: 'idle' | 'running' | 'ready' | 'error';
}) {
  return (
    <section className={styles.enrichmentPanel}>
      <div className={styles.panelHeader}>
        <h2>Enrichment</h2>
        <span className={styles.status}>{statusLabel(status)}</span>
      </div>
      <div className={styles.enrichmentBody}>
        <div className={styles.enrichmentActions}>
          <button className={styles.secondaryButton} type="button" disabled={!canDecodeVins || status === 'running'} onClick={onDecodeVins}>
            Decode VINs
          </button>
          <button className={styles.secondaryButton} type="button" disabled={!canLookupRecalls || status === 'running'} onClick={onLookupRecalls}>
            Lookup recalls
          </button>
        </div>
        {message ? <p className={styles.subtle}>{message}</p> : null}
      </div>
    </section>
  );
}

function statusLabel(status: 'idle' | 'running' | 'ready' | 'error'): string {
  const labels = {
    idle: 'Idle',
    running: 'Running',
    ready: 'Ready',
    error: 'Error'
  };
  return labels[status];
}
