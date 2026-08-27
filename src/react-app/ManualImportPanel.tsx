import { useState } from 'react';
import { previewManualImport } from './api.js';
import { formatMoney, vehicleLabel } from './format.js';
import styles from './App.module.css';
import type { ManualImportPreview } from './types.js';

export function ManualImportPanel({ searchId }: { searchId: string }) {
  const [preview, setPreview] = useState<ManualImportPreview | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  return (
    <section className={styles.manualImportPanel}>
      <div className={styles.panelHeader}>
        <h2>Manual import</h2>
        <span className={styles.status}>{status === 'loading' ? 'Loading' : status === 'error' ? 'Error' : status === 'ready' ? 'Ready' : 'Preview'}</span>
      </div>
      <form className={styles.manualImportForm} onSubmit={submitPreview}>
        <label className={styles.fullWidthField}>
          <span>URL</span>
          <input name="url" required type="url" />
        </label>
        <label className={styles.fullWidthField}>
          <span>Title</span>
          <input name="title" required />
        </label>
        <label>
          <span>Year</span>
          <input name="year" inputMode="numeric" />
        </label>
        <label>
          <span>Make</span>
          <input name="make" />
        </label>
        <label>
          <span>Model</span>
          <input name="model" />
        </label>
        <label>
          <span>Trim</span>
          <input name="trim" />
        </label>
        <label>
          <span>Price</span>
          <input name="price" inputMode="numeric" />
        </label>
        <label>
          <span>Mileage</span>
          <input name="mileage" inputMode="numeric" />
        </label>
        <label>
          <span>Title</span>
          <select name="titleStatus" defaultValue="">
            <option value="">Unknown</option>
            <option value="clean">clean</option>
            <option value="salvage">salvage</option>
            <option value="rebuilt">rebuilt</option>
            <option value="flood">flood</option>
            <option value="lemon-buyback">lemon-buyback</option>
          </select>
        </label>
        <label>
          <span>Seller</span>
          <input name="sellerName" />
        </label>
        <label className={styles.fullWidthField}>
          <span>Description</span>
          <textarea name="description" rows={3} />
        </label>
        <button className={styles.secondaryButton} type="submit" disabled={!searchId || status === 'loading'}>
          Preview listing
        </button>
      </form>
      {status === 'error' ? <p className={styles.formError}>Could not preview this listing.</p> : null}
      {preview ? (
        <div className={styles.manualPreview}>
          <div>
            <strong>{preview.candidate.title}</strong>
            <span>{vehicleLabel(preview.candidate.vehicle)}</span>
          </div>
          <div>
            <strong>{preview.rankedListing.dealScore}</strong>
            <span>Deal score</span>
          </div>
          <div>
            <strong>{preview.rankedListing.vehicleScore}</strong>
            <span>Vehicle score</span>
          </div>
          <div>
            <strong>{formatMoney(preview.candidate.price)}</strong>
            <span>{preview.candidate.mileage ? `${preview.candidate.mileage.toLocaleString()} mi` : 'Unknown mileage'}</span>
          </div>
        </div>
      ) : null}
    </section>
  );

  async function submitPreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');

    try {
      setPreview(await previewManualImport(searchId, formPayload(new FormData(event.currentTarget))));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }
}

function formPayload(formData: FormData): Record<string, string | number> {
  return Object.fromEntries(
    Array.from(formData.entries())
      .map(([key, value]) => [key, String(value).trim()] as const)
      .filter(([, value]) => value.length > 0)
      .map(([key, value]) => [key, ['year', 'price', 'mileage'].includes(key) ? Number(value) : value])
  );
}
