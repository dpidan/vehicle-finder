import { useEffect, useState } from 'react';
import { fetchListingDetail, fetchRankedListings, fetchSavedSearches, saveListingDisposition } from './api.js';
import { bestScore, emptyMessage, emptyTitle, filterAndSortListings, statusLabel } from './format.js';
import { ListingDetailPanel } from './ListingDetailPanel.js';
import { ListingTable } from './ListingTable.js';
import { Metric } from './Metric.js';
import { PublicHome } from './PublicHome.js';
import styles from './App.module.css';
import type { ListingDetail, ListingDispositionState, RankedListingSummary, SavedSearchSummary, SortMode } from './types.js';

export function App() {
  const isDashboard = window.location.pathname.startsWith('/app');

  return isDashboard ? <DashboardShell /> : <PublicHome />;
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
  const [stateFilter, setStateFilter] = useState<ListingDispositionState | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('deal');

  useEffect(() => {
    let cancelled = false;

    fetchSavedSearches()
      .then((searches) => {
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

    fetchRankedListings(selectedSearchId)
      .then((rankedListings) => {
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

    fetchListingDetail(selectedListingId)
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
  const visibleListings = filterAndSortListings(rankedListings, stateFilter, sortMode);

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
        <Metric label="Shown" value={visibleListings.length.toLocaleString()} />
        <Metric label="Best deal" value={bestScore(rankedListings, 'dealScore')} />
      </section>

      <div className={styles.workspace}>
        <section className={styles.listPanel}>
          <div className={styles.panelHeader}>
            <h2>Ranked listings</h2>
            <span className={styles.status}>{statusLabel(status)}</span>
          </div>
          {status === 'ready' && rankedListings.length > 0 ? (
            <ListingTable
              listings={visibleListings}
              selectedListingId={selectedListingId}
              stateFilter={stateFilter}
              sortMode={sortMode}
              onStateFilterChange={setStateFilter}
              onSortModeChange={setSortMode}
              onSelect={setSelectedListingId}
              onStateChange={(listingId, state) => updateDisposition(selectedSearchId, listingId, state)}
            />
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
    const rejectionReason = state === 'rejected' ? window.prompt('Why reject this listing?')?.trim() : undefined;

    if (state === 'rejected' && !rejectionReason) {
      setWorkflowStatus('Rejected listings need a reason.');
      return;
    }

    setWorkflowStatus('Saving workflow state.');

    try {
      const disposition = await saveListingDisposition(searchId, listingId, state, rejectionReason);
      setRankedListings((items) =>
        items.map((item) => (item.listingId === listingId ? { ...item, disposition } : item))
      );
      setWorkflowStatus('Workflow state saved.');
    } catch {
      setWorkflowStatus('Could not save workflow state.');
    }
  }
}
