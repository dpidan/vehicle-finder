import { useState } from 'react';
import { previewBulkListingImport, saveBulkListingImport } from '../../api/client.js';
import { formatMoney, vehicleLabel } from '../../utils/format.js';
import styles from '../../App.module.css';
import type { BulkListingImportPreview } from '../../api/types.js';

export function BulkImportPanel({ searchId, onSaved }: { searchId: string; onSaved: () => void }) {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<BulkListingImportPreview | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'saving' | 'saved' | 'error'>('idle');

  return (
    <section className={styles.manualImportPanel}>
      <div className={styles.panelHeader}>
        <h2>Bulk import</h2>
        <span className={styles.status}>{status === 'idle' ? 'Preview' : status}</span>
      </div>
      <form className={styles.manualImportForm} onSubmit={submitPreview}>
        <label>
          <span>Format</span>
          <select value={format} onChange={(event) => setFormat(event.target.value as 'json' | 'csv')}>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </label>
        <label className={styles.fullWidthField}>
          <span>Listings</span>
          <textarea required rows={8} value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <button className={styles.secondaryButton} type="submit" disabled={!searchId || status === 'loading'}>
          Preview import
        </button>
      </form>
      {status === 'error' ? <p className={styles.formError}>Could not parse this import.</p> : null}
      {preview ? (
        <div className={styles.manualPreview}>
          <div>
            <strong>{preview.candidateCount.toLocaleString()}</strong>
            <span>Parsed listings</span>
          </div>
          {preview.candidates.slice(0, 3).map((candidate) => (
            <div key={`${candidate.url}:${candidate.title}`}>
              <strong>{candidate.title}</strong>
              <span>
                {vehicleLabel(candidate.vehicle)} · {formatMoney(candidate.price)}
              </span>
            </div>
          ))}
          <button className={styles.secondaryButton} type="button" disabled={status === 'saving'} onClick={submitSave}>
            Save import
          </button>
        </div>
      ) : null}
      {status === 'saved' ? <p className={styles.formSuccess}>Bulk import saved.</p> : null}
    </section>
  );

  async function submitPreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');

    try {
      setPreview(await previewBulkListingImport(searchId, format, text));
      setStatus('ready');
    } catch {
      setPreview(null);
      setStatus('error');
    }
  }

  async function submitSave() {
    const adminToken = window.prompt('Admin token')?.trim();

    if (!adminToken) {
      setStatus('error');
      return;
    }

    setStatus('saving');

    try {
      await saveBulkListingImport(searchId, format, text, adminToken);
      setStatus('saved');
      onSaved();
    } catch {
      setStatus('error');
    }
  }
}
