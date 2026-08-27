import { useEffect, useState } from 'react';
import styles from './App.module.css';

export function App() {
  const isDashboard = window.location.pathname.startsWith('/app');

  return isDashboard ? <DashboardShell /> : <PublicHome />;
}

function PublicHome() {
  return (
    <main className={styles.publicPage}>
      <section className={styles.publicIntro}>
        <p className={styles.eyebrow}>Vehicle Finder</p>
        <h1>Find the right used vehicle faster.</h1>
        <p>
          A small family search tool for collecting listings, ranking candidates,
          tracking workflow state, and watching price changes.
        </p>
        <a className={styles.primaryLink} href="/app">
          Open dashboard
        </a>
      </section>
    </main>
  );
}

function DashboardShell() {
  const [searches, setSearches] = useState<SavedSearchSummary[]>([]);
  const [selectedSearchId, setSelectedSearchId] = useState('');
  const [rankedListings, setRankedListings] = useState<RankedListingSummary[]>([]);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [listingDetail, setListingDetail] = useState<ListingDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [detailStatus, setDetailStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [workflowStatus, setWorkflowStatus] = useState('');

  useEffect(() => {
    let cancelled = false;

    fetchJson<{ searches: SavedSearchSummary[] }>('/api/searches')
      .then(({ searches }) => {
        if (cancelled) return;
        setSearches(searches);
        setSelectedSearchId(searches[0]?.id ?? '');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedSearchId) {
      if (searches.length === 0) setStatus('empty');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    fetchJson<{ rankedListings: RankedListingSummary[] }>(`/api/searches/${selectedSearchId}/ranked-listings`)
      .then(({ rankedListings }) => {
        if (cancelled) return;
        setRankedListings(rankedListings);
        setSelectedListingId(rankedListings[0]?.listingId ?? '');
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [searches.length, selectedSearchId]);

  useEffect(() => {
    if (!selectedListingId) {
      setListingDetail(null);
      setDetailStatus('idle');
      return;
    }

    let cancelled = false;
    setDetailStatus('loading');

    fetchJson<ListingDetail>(`/api/listings/${selectedListingId}`)
      .then((detail) => {
        if (cancelled) return;
        setListingDetail(detail);
        setDetailStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setDetailStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [selectedListingId]);

  const selectedSearch = searches.find((search) => search.id === selectedSearchId);

  return (
    <main className={styles.appShell}>
      <header className={styles.toolbar}>
        <div>
          <p className={styles.eyebrow}>Dashboard</p>
          <h1>{selectedSearch?.name ?? 'Vehicle searches'}</h1>
        </div>
        <label className={styles.searchPicker}>
          <span>Search</span>
          <select value={selectedSearchId} onChange={(event) => setSelectedSearchId(event.target.value)}>
            {searches.map((search) => (
              <option key={search.id} value={search.id}>
                {search.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className={styles.summaryBand} aria-live="polite">
        <Metric label="Listings" value={rankedListings.length.toLocaleString()} />
        <Metric label="Best deal" value={bestScore(rankedListings, 'dealScore')} />
        <Metric label="Best vehicle" value={bestScore(rankedListings, 'vehicleScore')} />
      </section>

      <div className={styles.workspace}>
        <section className={styles.listPanel}>
          <div className={styles.panelHeader}>
            <h2>Ranked listings</h2>
            <span className={styles.status}>{statusLabel(status)}</span>
          </div>
          {status === 'ready' && rankedListings.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.listingTable}>
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Scores</th>
                    <th>Price</th>
                    <th>Mileage</th>
                    <th>Seller</th>
                    <th>State</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedListings.map((item) => (
                    <ListingRow
                      key={item.listingId}
                      item={item}
                      selected={item.listingId === selectedListingId}
                      onSelect={() => setSelectedListingId(item.listingId)}
                      onStateChange={(state) => updateDisposition(selectedSearchId, item.listingId, state)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h2>{emptyTitle(status)}</h2>
              <p>{emptyMessage(status)}</p>
            </div>
          )}
        </section>

        <ListingDetailPanel detail={listingDetail} status={detailStatus} />
      </div>
      <p className={styles.srStatus} aria-live="polite">
        {workflowStatus}
      </p>
    </main>
  );

  async function updateDisposition(searchId: string, listingId: string, state: ListingDispositionState) {
    const rejectionReason =
      state === 'rejected' ? window.prompt('Why reject this listing?')?.trim() : undefined;

    if (state === 'rejected' && !rejectionReason) {
      setWorkflowStatus('Rejected listings need a reason.');
      return;
    }

    setWorkflowStatus('Saving workflow state.');

    try {
      const { disposition } = await fetchJson<{ disposition: ListingDisposition }>(
        `/api/searches/${searchId}/listings/${listingId}/disposition`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ state, ...(rejectionReason ? { rejectionReason } : {}) })
        }
      );
      setRankedListings((items) =>
        items.map((item) => (item.listingId === listingId ? { ...item, disposition } : item))
      );
      setWorkflowStatus('Workflow state saved.');
    } catch {
      setWorkflowStatus('Could not save workflow state.');
    }
  }
}

function ListingRow({
  item,
  selected,
  onSelect,
  onStateChange
}: {
  item: RankedListingSummary;
  selected: boolean;
  onSelect: () => void;
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

function ListingDetailPanel({
  detail,
  status
}: {
  detail: ListingDetail | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
}) {
  const listing = detail?.listing;

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
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function bestScore(listings: RankedListingSummary[], key: 'dealScore' | 'vehicleScore'): string {
  return listings.length ? Math.max(...listings.map((listing) => listing.rankedListing[key])).toString() : '0';
}

function statusLabel(status: 'loading' | 'ready' | 'empty' | 'error'): string {
  return status === 'loading' ? 'Loading' : status === 'error' ? 'Error' : status === 'empty' ? 'No searches' : 'Ready';
}

function emptyTitle(status: 'loading' | 'ready' | 'empty' | 'error'): string {
  return status === 'loading' ? 'Loading listings.' : status === 'error' ? 'Could not load dashboard data.' : 'No ranked listings yet.';
}

function emptyMessage(status: 'loading' | 'ready' | 'empty' | 'error'): string {
  return status === 'loading'
    ? 'Fetching saved searches and rankings from the Worker API.'
    : status === 'error'
      ? 'Check that the local database is migrated and seeded, then refresh.'
      : 'Collect or import listings, then run a search refresh to create ranked results.';
}

function vehicleLabel(vehicle: ListingCandidate['vehicle']): string {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ') || 'Unknown vehicle';
}

function formatMoney(price: ListingCandidate['price']): string {
  return price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency, maximumFractionDigits: 0 }).format(price.amount) : 'Unknown';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function detailEmptyTitle(status: 'idle' | 'loading' | 'ready' | 'error'): string {
  return status === 'loading' ? 'Loading detail.' : status === 'error' ? 'Could not load listing.' : 'Select a listing.';
}

function detailEmptyMessage(status: 'idle' | 'loading' | 'ready' | 'error'): string {
  return status === 'loading'
    ? 'Fetching detail and snapshots from the Worker API.'
    : status === 'error'
      ? 'The listing may no longer exist in the local database.'
      : 'Choose a row from ranked listings to inspect source and history details.';
}

interface SavedSearchSummary {
  id: string;
  name: string;
}

const listingDispositionStates = ['new', 'interested', 'favorite', 'contacted', 'inspection', 'rejected', 'sold'] as const;

type ListingDispositionState = (typeof listingDispositionStates)[number];

interface RankedListingSummary {
  listingId: string;
  rankedListing: {
    listing: ListingCandidate;
    vehicleScore: number;
    dealScore: number;
  };
  disposition: ListingDisposition | null;
}

interface ListingDisposition {
  id: string;
  savedSearchId: string;
  listingId: string;
  state: ListingDispositionState;
  rejectionReason?: string;
  updatedAt: string;
}

interface ListingCandidate {
  source: {
    name: string;
  };
  url: string;
  title: string;
  status?: string;
  vehicle: {
    vin?: string;
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
  };
  price?: {
    amount: number;
    currency: 'USD';
  };
  mileage?: number;
  titleStatus?: string;
  seller?: {
    name: string;
  };
}

interface ListingDetail {
  listing: ListingCandidate;
  snapshots: Array<{
    id: string;
    capturedAt: string;
    price?: ListingCandidate['price'];
    mileage?: number;
  }>;
}
