import { formatMoney, vehicleLabel } from '../../utils/format.js';
import styles from '../../App.module.css';
import { listingDispositionStates, type ListingDispositionState, type RankedListingSummary, type SortMode } from '../../api/types.js';

export function ListingTable({
  listings,
  selectedListingId,
  stateFilter,
  sortMode,
  onStateFilterChange,
  onSortModeChange,
  onSelect,
  compareListingIds,
  onCompareChange,
  onStateChange
}: {
  listings: RankedListingSummary[];
  selectedListingId: string;
  stateFilter: ListingDispositionState | 'all';
  sortMode: SortMode;
  onStateFilterChange: (state: ListingDispositionState | 'all') => void;
  onSortModeChange: (sortMode: SortMode) => void;
  onSelect: (listingId: string) => void;
  compareListingIds: string[];
  onCompareChange: (listingId: string, compared: boolean) => void;
  onStateChange: (listingId: string, state: ListingDispositionState) => void;
}) {
  return (
    <>
      <div className={styles.tableControls}>
        <label>
          <span>State</span>
          <select value={stateFilter} onChange={(event) => onStateFilterChange(event.target.value as ListingDispositionState | 'all')}>
            <option value="all">All</option>
            {listingDispositionStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select value={sortMode} onChange={(event) => onSortModeChange(event.target.value as SortMode)}>
            <option value="deal">Deal score</option>
            <option value="vehicle">Vehicle score</option>
            <option value="price">Lowest price</option>
            <option value="mileage">Lowest mileage</option>
          </select>
        </label>
      </div>
      {listings.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.listingTable}>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Scores</th>
                <th>Price</th>
                <th>Mileage</th>
                <th>Seller</th>
                <th>Compare</th>
                <th>State</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((item) => (
                <ListingRow
                  key={item.listingId}
                  item={item}
                  selected={item.listingId === selectedListingId}
                  compared={compareListingIds.includes(item.listingId)}
                  onSelect={() => onSelect(item.listingId)}
                  onCompareChange={(compared) => onCompareChange(item.listingId, compared)}
                  onStateChange={(state) => onStateChange(item.listingId, state)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2>No listings match this filter.</h2>
          <p>Change the workflow-state filter to see more candidates.</p>
        </div>
      )}
    </>
  );
}

function ListingRow({
  item,
  selected,
  compared,
  onSelect,
  onCompareChange,
  onStateChange
}: {
  item: RankedListingSummary;
  selected: boolean;
  compared: boolean;
  onSelect: () => void;
  onCompareChange: (compared: boolean) => void;
  onStateChange: (state: ListingDispositionState) => void;
}) {
  const listing = item.rankedListing.listing;
  const state = item.disposition?.state ?? 'new';

  return (
    <tr className={selected ? styles.selectedRow : undefined}>
      <td>
        <a className={styles.listingTitle} href={listing.url} target="_blank" rel="noreferrer">
          {listing.title}
        </a>
        <div className={styles.subtle}>{vehicleLabel(listing.vehicle)}</div>
      </td>
      <td>
        <span className={styles.score}>{item.rankedListing.dealScore}</span>
        <span className={styles.subtle}> deal</span>
        <br />
        <span className={styles.score}>{item.rankedListing.vehicleScore}</span>
        <span className={styles.subtle}> vehicle</span>
      </td>
      <td>{formatMoney(listing.price)}</td>
      <td>{listing.mileage ? `${listing.mileage.toLocaleString()} mi` : 'Unknown'}</td>
      <td>{listing.seller?.name ?? 'Unknown'}</td>
      <td>
        <label className={styles.compareToggle}>
          <input type="checkbox" checked={compared} onChange={(event) => onCompareChange(event.target.checked)} />
          <span>Compare</span>
        </label>
      </td>
      <td>
        <select
          className={styles.stateSelect}
          value={state}
          onChange={(event) => onStateChange(event.target.value as ListingDispositionState)}
        >
          {listingDispositionStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </td>
      <td>
        <button className={styles.secondaryButton} type="button" onClick={onSelect}>
          View
        </button>
      </td>
    </tr>
  );
}
