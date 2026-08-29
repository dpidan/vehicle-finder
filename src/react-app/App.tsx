import { useEffect, useState } from 'react';
import {
  collectSourceFeed,
  decodeSavedSearchVins,
  defaultMonitoringWindow,
  fetchListingDetail,
  fetchMonitoringSummary,
  fetchRankedListings,
  fetchSavedSearches,
  fetchSourceFeeds,
  lookupRecallsForSavedSearch,
  lookupRecallsForVehicle,
  refreshSearch,
  saveListingDisposition,
  writeSearchEvaluations,
  type MonitoringWindow
} from './api.js';
import { bestScore, emptyMessage, emptyTitle, filterAndSortListings, statusLabel } from './format.js';
import { ComparisonPanel } from './ComparisonPanel.js';
import { EnrichmentPanel } from './EnrichmentPanel.js';
import { ListingDetailPanel } from './ListingDetailPanel.js';
import { ListingTable } from './ListingTable.js';
import { ManualImportPanel } from './ManualImportPanel.js';
import { Metric } from './Metric.js';
import { MonitoringSummaryPanel } from './MonitoringSummaryPanel.js';
import { PublicHome } from './PublicHome.js';
import { SourceFeedsPanel } from './SourceFeedsPanel.js';
import styles from './App.module.css';
import type {
  ListingDetail,
  ListingDispositionState,
  MonitoringSummary,
  NextAction,
  RankedListingSummary,
  SavedSearchSummary,
  SortMode,
  SourceFeedCollectResult,
  SourceFeedSummary
} from './types.js';

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
  const [monitoringWindow, setMonitoringWindow] = useState<MonitoringWindow>(() => defaultMonitoringWindow());
  const [workflowStatus, setWorkflowStatus] = useState('');
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'refreshing' | 'error'>('idle');
  const [enrichmentStatus, setEnrichmentStatus] = useState<'idle' | 'running' | 'ready' | 'error'>('idle');
  const [enrichmentMessage, setEnrichmentMessage] = useState('');
  const [sourceFeeds, setSourceFeeds] = useState<SourceFeedSummary[]>([]);
  const [sourceFeedStatus, setSourceFeedStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [sourceFeedAction, setSourceFeedAction] = useState<{ feedId: string; action: 'preview' | 'import' } | null>(null);
  const [sourceFeedActionResult, setSourceFeedActionResult] = useState<SourceFeedCollectResult | null>(null);
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

    refreshMonitoring(selectedSearchId, monitoringWindow, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [monitoringWindow, selectedSearchId]);

  const selectedSearch = searches.find((search) => search.id === selectedSearchId);
  const selectedRanking = rankedListings.find((item) => item.listingId === selectedListingId) ?? null;
  const selectedVehicle = listingDetail?.listing.vehicle;
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
        <div className={styles.toolbarActions}>
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
          <button className={styles.secondaryButton} type="button" disabled={!selectedSearchId || refreshStatus === 'refreshing'} onClick={runRefresh}>
            {refreshStatus === 'refreshing' ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </header>

      <section className={styles.summaryBand} aria-live="polite">
        <Metric label="Listings" value={rankedListings.length.toLocaleString()} />
        <Metric label="Shown" value={visibleListings.length.toLocaleString()} />
        <Metric label="Best deal" value={bestScore(rankedListings, 'dealScore')} />
      </section>

      <MonitoringSummaryPanel
        summary={monitoringSummary}
        status={monitoringStatus}
        window={monitoringWindow}
        onWindowChange={setMonitoringWindow}
      />
      <EnrichmentPanel
        canDecodeVins={Boolean(selectedSearchId)}
        canLookupSearchRecalls={Boolean(selectedSearchId)}
        canLookupRecalls={Boolean(selectedVehicle?.year && selectedVehicle.make && selectedVehicle.model)}
        message={enrichmentMessage}
        status={enrichmentStatus}
        onDecodeVins={runVinDecode}
        onLookupSearchRecalls={runSearchRecallLookup}
        onLookupRecalls={runRecallLookup}
      />
      <SourceFeedsPanel
        feeds={sourceFeeds}
        status={sourceFeedStatus}
        activeAction={sourceFeedAction}
        lastResult={sourceFeedActionResult}
        onLoad={loadSourceFeeds}
        onPreview={(feedId) => runSourceFeedAction(feedId, false)}
        onImport={(feedId) => runSourceFeedAction(feedId, true)}
      />
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

  async function runRefresh() {
    const adminToken = window.prompt('Admin token')?.trim();

    if (!adminToken) {
      setRefreshStatus('error');
      return;
    }

    setRefreshStatus('refreshing');
    setWorkflowStatus('Refreshing search.');

    try {
      await refreshSearch(selectedSearchId, adminToken);
      await refreshListings(selectedSearchId);
      await refreshMonitoring(selectedSearchId, monitoringWindow);
      await loadSourceFeedsWithToken(adminToken);
      setRefreshStatus('idle');
      setWorkflowStatus('Search refreshed.');
    } catch {
      setRefreshStatus('error');
      setWorkflowStatus('Could not refresh search.');
    }
  }

  async function loadSourceFeeds() {
    const adminToken = window.prompt('Admin token')?.trim();

    if (!adminToken) {
      setSourceFeedStatus('error');
      return;
    }

    await loadSourceFeedsWithToken(adminToken);
  }

  async function loadSourceFeedsWithToken(adminToken: string) {
    setSourceFeedStatus('loading');

    try {
      setSourceFeeds(await fetchSourceFeeds(adminToken));
      setSourceFeedStatus('ready');
    } catch {
      setSourceFeedStatus('error');
    }
  }

  async function runSourceFeedAction(feedId: string, shouldImport: boolean) {
    const adminToken = window.prompt('Admin token')?.trim();

    if (!adminToken) {
      setSourceFeedStatus('error');
      return;
    }

    const action = shouldImport ? 'import' : 'preview';
    setSourceFeedAction({ feedId, action });
    setWorkflowStatus(shouldImport ? 'Importing source feed.' : 'Previewing source feed.');

    try {
      const result = await collectSourceFeed(feedId, adminToken, shouldImport);
      setSourceFeedActionResult(result);
      await loadSourceFeedsWithToken(adminToken);

      if (shouldImport && selectedSearchId) {
        await writeSearchEvaluations(selectedSearchId, adminToken);
        await refreshListings(selectedSearchId);
        await refreshMonitoring(selectedSearchId, monitoringWindow);
      }

      setWorkflowStatus(
        shouldImport
          ? `Source feed imported ${result.import?.insertedListings ?? 0} new and ${result.import?.updatedListings ?? 0} updated listings.`
          : `Source feed preview found ${result.collectedCount} candidates.`
      );
    } catch {
      setSourceFeedStatus('error');
      setWorkflowStatus(shouldImport ? 'Could not import source feed.' : 'Could not preview source feed.');
    } finally {
      setSourceFeedAction(null);
    }
  }

  async function runVinDecode() {
    const adminToken = window.prompt('Admin token')?.trim();

    if (!adminToken) {
      setEnrichmentStatus('error');
      return;
    }

    setEnrichmentStatus('running');
    setEnrichmentMessage('');
    setWorkflowStatus('Decoding VINs.');

    try {
      const result = await decodeSavedSearchVins(selectedSearchId, adminToken);
      setEnrichmentStatus('ready');
      setEnrichmentMessage(
        `${result.decodedCount.toLocaleString()} decoded, ${result.cachedCount.toLocaleString()} cached, ${result.failed.length.toLocaleString()} failed.`
      );
      setWorkflowStatus('VIN enrichment complete.');
    } catch {
      setEnrichmentStatus('error');
      setEnrichmentMessage('Could not decode VINs.');
      setWorkflowStatus('Could not decode VINs.');
    }
  }

  async function runRecallLookup() {
    const vehicle = listingDetail?.listing.vehicle;

    if (!vehicle?.year || !vehicle.make || !vehicle.model) {
      setEnrichmentStatus('error');
      setEnrichmentMessage('Selected listing needs year, make, and model.');
      return;
    }

    const adminToken = window.prompt('Admin token')?.trim();

    if (!adminToken) {
      setEnrichmentStatus('error');
      return;
    }

    setEnrichmentStatus('running');
    setEnrichmentMessage('');
    setWorkflowStatus('Looking up recalls.');

    try {
      const result = await lookupRecallsForVehicle(
        { modelYear: vehicle.year, make: vehicle.make, model: vehicle.model },
        adminToken
      );
      setEnrichmentStatus('ready');
      setEnrichmentMessage(`${result.lookup.recalls.length.toLocaleString()} recall notes from ${result.source}.`);
      if (selectedListingId) {
        setListingDetail(await fetchListingDetail(selectedListingId));
        setDetailStatus('ready');
      }
      setWorkflowStatus('Recall enrichment complete.');
    } catch {
      setEnrichmentStatus('error');
      setEnrichmentMessage('Could not lookup recalls.');
      setWorkflowStatus('Could not lookup recalls.');
    }
  }

  async function runSearchRecallLookup() {
    const adminToken = window.prompt('Admin token')?.trim();

    if (!adminToken) {
      setEnrichmentStatus('error');
      return;
    }

    setEnrichmentStatus('running');
    setEnrichmentMessage('');
    setWorkflowStatus('Looking up search recalls.');

    try {
      const result = await lookupRecallsForSavedSearch(selectedSearchId, adminToken);
      setEnrichmentStatus('ready');
      setEnrichmentMessage(
        `${result.liveCount.toLocaleString()} live, ${result.cachedCount.toLocaleString()} cached, ${result.failed.length.toLocaleString()} failed recall lookups.`
      );
      if (selectedListingId) {
        setListingDetail(await fetchListingDetail(selectedListingId));
        setDetailStatus('ready');
      }
      setWorkflowStatus('Search recall enrichment complete.');
    } catch {
      setEnrichmentStatus('error');
      setEnrichmentMessage('Could not lookup search recalls.');
      setWorkflowStatus('Could not lookup search recalls.');
    }
  }

  async function refreshMonitoring(searchId: string, window: MonitoringWindow, cancelled = () => false) {
    setMonitoringStatus('loading');

    try {
      const summary = await fetchMonitoringSummary(searchId, window);
      if (cancelled()) return;
      setMonitoringSummary(summary);
      setMonitoringStatus('ready');
    } catch {
      if (!cancelled()) setMonitoringStatus('error');
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
