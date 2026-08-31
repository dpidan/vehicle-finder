import { formatMoney, vehicleLabel } from '../../utils/format.js';
import styles from '../../App.module.css';
import type { RankedListingSummary } from '../../api/types.js';

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
            {listings.map((item) => {
              const listing = item.rankedListing.listing;
              const vehicle = vehicleLabel(listing.vehicle);

              return (
                <tr key={item.listingId}>
                  <td>
                    <a className={styles.listingTitle} href={listing.url} target="_blank" rel="noreferrer">
                      {listing.title}
                    </a>
                    {vehicle !== listing.title ? <div className={styles.subtle}>{vehicle}</div> : null}
                  </td>
                  <td>{item.rankedListing.dealScore}</td>
                  <td>{item.rankedListing.vehicleScore}</td>
                  <td>{formatMoney(listing.price)}</td>
                  <td>{listing.mileage ? `${listing.mileage.toLocaleString()} mi` : 'Unknown'}</td>
                  <td>{item.disposition?.state ?? 'new'}</td>
                  <td>
                    <button className={styles.secondaryButton} type="button" onClick={() => onRemove(item.listingId)}>
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
