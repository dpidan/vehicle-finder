import { useEffect, useState } from 'react';
import { fetchListingDetail, fetchMonitoringSummary, fetchRankedListings, fetchSavedSearches, saveListingDisposition } from './api.js';
import { bestScore, emptyMessage, emptyTitle, filterAndSortListings, statusLabel } from './format.js';
import { ComparisonPanel } from './ComparisonPanel.js';
import { ListingDetailPanel } from './ListingDetailPanel.js';
import { ListingTable } from './ListingTable.js';
import { ManualImportPanel } from './ManualImportPanel.js';
import { Metric } from './Metric.js';
import { MonitoringSummaryPanel } from './MonitoringSummaryPanel.js';
import { PublicHome } from './PublicHome.js';
import styles from './App.module.css';
import type { ListingDetail, ListingDispositionState, MonitoringSummary, NextAction, RankedListingSummary, SavedSearchSummary, SortMode } from './types.js';

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
  const [monitoringSummary, setMonitoringSummary] = useState<MonitoringSummary | null>(null);
  const [monitoringStatus, setMonitoringStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [workflowStatus, setWorkflowStatus] = useState('');
  const [stateFilter, setStateFilter] = useState<ListingDispositionState | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('deal');
  const [compareListingIds, setCompareListingIds] = useState<string[]>([]);

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
        setCompareListingIds([]);
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

  useEffect(() => {
    if (!selectedSearchId) {
      setMonitoringSummary(null);
      setMonitoringStatus('idle');
      return;
    }

    let cancelled = false;
    setMonitoringStatus('loading');

    fetchMonitoringSummary(selectedSearchId)
      .then((summary) => {
        if (cancelled) return;
        setMonitoringSummary(summary);
        setMonitoringStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setMonitoringStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSearchId]);

  const selectedSearch = searches.find((search) => search.id === selectedSearchId);
  const selectedRanking = rankedListings.find((item) => item.listingId === selectedListingId) ?? null;
  const visibleListings = filterAndSortListings(rankedListings, stateFilter, sortMode);
  const comparedListings = compareListingIds
    .map((listingId) => rankedListings.find((item) => item.listingId === listingId))
    .filter((item): item is RankedListingSummary => Boolean(item));

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

      <MonitoringSummaryPanel summary={monitoringSummary} status={monitoringStatus} />
      <ComparisonPanel
        listings={comparedListings}
        onRemove={(listingId) => setCompareListingIds((ids) => ids.filter((id) => id !== listingId))}
      />
      <ManualImportPanel searchId={selectedSearchId} onSaved={() => refreshListings(selectedSearchId)} />

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
              compareListingIds={compareListingIds}
              onCompareChange={toggleCompareListing}
              onStateChange={(listingId, state) => updateDisposition(selectedSearchId, listingId, state)}
            />
          ) : (
            <div className={styles.emptyState}>
              <h2>{emptyTitle(status)}</h2>
              <p>{emptyMessage(status)}</p>
            </div>
          )}
        </section>

        <ListingDetailPanel
          detail={listingDetail}
          ranking={selectedRanking?.rankedListing ?? null}
          disposition={selectedRanking?.disposition ?? null}
          status={detailStatus}
          onNextActionSave={(nextAction) => updateNextAction(selectedSearchId, selectedListingId, nextAction)}
        />
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
      const currentDisposition = rankedListings.find((item) => item.listingId === listingId)?.disposition;
      const disposition = await saveListingDisposition(searchId, listingId, state, rejectionReason, currentDisposition?.nextAction);
      setRankedListings((items) =>
        items.map((item) => (item.listingId === listingId ? { ...item, disposition } : item))
      );
      setWorkflowStatus('Workflow state saved.');
    } catch {
      setWorkflowStatus('Could not save workflow state.');
    }
  }

  async function refreshListings(searchId: string) {
    setStatus('loading');

    try {
      const rankedListings = await fetchRankedListings(searchId);
      setRankedListings(rankedListings);
      setSelectedListingId((current) => (rankedListings.some((item) => item.listingId === current) ? current : (rankedListings[0]?.listingId ?? '')));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  function toggleCompareListing(listingId: string, compared: boolean) {
    setCompareListingIds((ids) => {
      if (!compared) return ids.filter((id) => id !== listingId);
      return ids.includes(listingId) ? ids : [...ids, listingId].slice(-4);
    });
  }

  async function updateNextAction(searchId: string, listingId: string, nextAction: NextAction) {
    const currentDisposition = rankedListings.find((item) => item.listingId === listingId)?.disposition;
    const state = currentDisposition?.state ?? 'interested';
    const rejectionReason = state === 'rejected' ? currentDisposition?.rejectionReason : undefined;

    if (state === 'rejected' && !rejectionReason) {
      setWorkflowStatus('Rejected listings need a reason.');
      return;
    }

    setWorkflowStatus('Saving next action.');

    try {
      const disposition = await saveListingDisposition(searchId, listingId, state, rejectionReason, nextAction);
      setRankedListings((items) =>
        items.map((item) => (item.listingId === listingId ? { ...item, disposition } : item))
      );
      setWorkflowStatus('Next action saved.');
    } catch {
      setWorkflowStatus('Could not save next action.');
    }
  }
}
