import styles from '../../App.module.css';

export function EnrichmentPanel({
  canDecodeVins,
  canLookupRecalls,
  canLookupSearchRecalls,
  message,
  onDecodeVins,
  onLookupRecalls,
  onLookupSearchRecalls,
  status
}: {
  canDecodeVins: boolean;
  canLookupRecalls: boolean;
  canLookupSearchRecalls: boolean;
  message: string;
  onDecodeVins: () => void;
  onLookupRecalls: () => void;
  onLookupSearchRecalls: () => void;
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
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={!canLookupSearchRecalls || status === 'running'}
            onClick={onLookupSearchRecalls}
          >
            Lookup search recalls
          </button>
          <button className={styles.secondaryButton} type="button" disabled={!canLookupRecalls || status === 'running'} onClick={onLookupRecalls}>
            Lookup selected recalls
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
