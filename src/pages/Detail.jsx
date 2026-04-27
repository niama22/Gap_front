import React, { useState, useEffect, useCallback } from 'react';
import { getDetail } from '../api/client';
import { KpiGrid, KpiCard } from '../components/KpiCard';
import FilterBar from '../components/FilterBar';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function gapClass(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return '';
  if (n > 1) return 'gap-pos-cell';
  if (n < -1) return 'gap-neg-cell';
  return 'gap-ok-cell';
}

const NUM_COLS = ['m3_plan', 'm3_reel', 'gap_m3', 'm3 calculé liaison', 'm3_received', 'GAP M3'];

function fmtVal(col, val) {
  if (NUM_COLS.includes(col)) {
    const n = parseFloat(val);
    return isNaN(n) ? val : n.toFixed(3);
  }
  return val;
}

export default function Detail({ fileHash, allValues, uploadedFile }) {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]               = useState(1);

  const loadData = useCallback(() => {
    if (!fileHash) return;
    setLoading(true);
    getDetail(fileHash, { ...activeFilters, search, page, page_size: 100 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fileHash, activeFilters, search, page]);

  /* ── Chargement automatique ── */
  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const totalPages = data ? Math.ceil(data.total / 100) : 1;

  if (!fileHash) return (
    <div className="empty-state">
      <div className="icon">📂</div>
      <div className="title">Fichier requis</div>
      Chargez votre fichier INPUT dans la barre latérale.
    </div>
  );

  return (
    <div>
      <div className="page-title">🔍 Détail complet</div>
      <div className="page-sub">Toutes les lignes · recherche & filtrage libres</div>

      <FilterBar allValues={allValues} onApply={(f) => { setActiveFilters(f); setPage(1); }} />

      {/* Barre de recherche libre */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          className="search-input"
          style={{ flex: 1, marginBottom: 0 }}
          placeholder="🔎 Recherche libre — expéditeur, destinataire, IT, statut…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn-primary" onClick={handleSearch}>Rechercher</button>
        {search && (
          <button className="btn-reset" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>✕ Effacer</button>
        )}
      </div>

      {loading && <div className="loading-overlay"><span className="spinner" /> Chargement…</div>}

      {!loading && data && (
        <>
          <KpiGrid>
            <KpiCard label="GAP M3 Total" value={`${data.kpis.gap_total > 0 ? '+' : ''}${data.kpis.gap_total.toFixed(2)} m³`} />
            <KpiCard label="M3 Plan"       value={`${data.kpis.m3_plan.toFixed(2)} m³`} />
            <KpiCard label="M3 Réel"       value={`${data.kpis.m3_reel.toFixed(2)} m³`} />
            <KpiCard label="Lignes"         value={data.kpis.nb_lignes.toLocaleString()} />
          </KpiGrid>

          <hr className="divider" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
              {data.total.toLocaleString()} lignes — page {page}/{totalPages}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-dark" onClick={() => {
                if (!uploadedFile) return;
                const fd = new FormData(); fd.append('file', uploadedFile);
                const p = new URLSearchParams();
                if (activeFilters.axes?.length) p.set('axes', activeFilters.axes.join(','));
                if (activeFilters.statuts?.length) p.set('statuts', activeFilters.statuts.join(','));
                fetch(`${BASE}/download/gap_filtre?${p}`, { method: 'POST', body: fd })
                  .then(r => r.blob()).then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'detail_gap_m3.xlsx'; a.click();
                  });
              }}>📥 Exporter (Excel)</button>
              <button className="btn-dark" onClick={() => {
                if (!uploadedFile) return;
                const fd = new FormData(); fd.append('file', uploadedFile);
                window.fetch(`${BASE}/download/rapport`, { method: 'POST', body: fd })
                  .then(r => r.blob()).then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'SYNTHESE_GAP_M3.xlsx'; a.click();
                  });
              }}>📊 Rapport complet</button>
            </div>
          </div>

          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {data.columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i}>
                    {data.columns.map(col => {
                      const val = row[col] ?? '';
                      const isGap = col === 'GAP M3' || col === 'gap_m3';
                      const cellClass = isGap ? gapClass(val) : '';
                      return (
                        <td key={col} className={`${NUM_COLS.includes(col) ? 'mono' : ''} ${cellClass}`}>
                          {fmtVal(col, val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button className="btn-page" onClick={() => setPage(1)}              disabled={page === 1}>«</button>
            <button className="btn-page" onClick={() => setPage(p => p - 1)}    disabled={page === 1}>‹</button>
            <span className="page-info">Page {page} / {totalPages} ({data.total.toLocaleString()} lignes)</span>
            <button className="btn-page" onClick={() => setPage(p => p + 1)}    disabled={page >= totalPages}>›</button>
            <button className="btn-page" onClick={() => setPage(totalPages)}     disabled={page >= totalPages}>»</button>
          </div>
        </>
      )}
    </div>
  );
}
