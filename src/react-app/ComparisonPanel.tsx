import { formatMoney, vehicleLabel } from './format.js';
import styles from './App.module.css';
import type { RankedListingSummary } from './types.js';

export function ComparisonPanel({
  listings,
  onRemove
}: {
  listings: RankedListingSummary[];
  onRemove: (listingId: string) => void;
}) {
  if (listings.length === 0) return null;

  return (
    <section className={styles.comparePanel}>
      <div className={styles.panelHeader}>
        <h2>Compare</h2>
        <span className={styles.status}>{listings.length.toLocaleString()}</span>
      </div>
      <div className={styles.compareWrap}>
        <table className={styles.compareTable}>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Deal</th>
              <th>Vehicle</th>
              <th>Price</th>
              <th>Mileage</th>
              <th>State</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((item) => (
              <tr key={item.listingId}>
                <td>
                  <a className={styles.listingTitle} href={item.rankedListing.listing.url} target="_blank" rel="noreferrer">
                    {item.rankedListing.listing.title}
                  </a>
                  <div className={styles.subtle}>{vehicleLabel(item.rankedListing.listing.vehicle)}</div>
                </td>
                <td>{item.rankedListing.dealScore}</td>
                <td>{item.rankedListing.vehicleScore}</td>
                <td>{formatMoney(item.rankedListing.listing.price)}</td>
                <td>{item.rankedListing.listing.mileage ? `${item.rankedListing.listing.mileage.toLocaleString()} mi` : 'Unknown'}</td>
                <td>{item.disposition?.state ?? 'new'}</td>
                <td>
                  <button className={styles.secondaryButton} type="button" onClick={() => onRemove(item.listingId)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
