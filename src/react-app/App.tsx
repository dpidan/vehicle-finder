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
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

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
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [searches.length, selectedSearchId]);

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
                </tr>
              </thead>
              <tbody>
                {rankedListings.map((item) => (
                  <ListingRow key={item.listingId} item={item} />
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
    </main>
  );
}

function ListingRow({ item }: { item: RankedListingSummary }) {
  const listing = item.rankedListing.listing;

  return (
    <tr>
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
        <span className={styles.status}>{item.disposition?.state ?? 'new'}</span>
      </td>
    </tr>
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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

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

interface SavedSearchSummary {
  id: string;
  name: string;
}

interface RankedListingSummary {
  listingId: string;
  rankedListing: {
    listing: ListingCandidate;
    vehicleScore: number;
    dealScore: number;
  };
  disposition: { state: string } | null;
}

interface ListingCandidate {
  url: string;
  title: string;
  vehicle: {
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
  seller?: {
    name: string;
  };
}
