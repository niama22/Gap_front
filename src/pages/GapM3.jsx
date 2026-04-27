import React, { useState, useEffect } from 'react';
import { getGapM3 } from '../api/client';
import { KpiGrid, KpiCard } from '../components/KpiCard';
import FilterBar from '../components/FilterBar';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function gapClass(v) {
  if (typeof v !== 'number') return '';
  if (v > 1) return 'gap-pos-cell';
  if (v < -1) return 'gap-neg-cell';
  return 'gap-ok-cell';
}

function BadgeStatus({ status }) {
  const map = { Finish: 'Finish', Cancelled: 'Cancelled', RAC: 'RAC', In_progress: 'In_progress' };
  const cls = map[status] || 'na';
  return <span className={`badge badge-${cls}`}>{status}</span>;
}

export default function GapM3({ fileHash, allValues, uploadedFile }) {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  /* ── Chargement automatique dès que fileHash ou filtres changent ── */
  useEffect(() => {
    if (!fileHash) return;
    setLoading(true);
    getGapM3(fileHash, activeFilters)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fileHash, activeFilters]);

  if (!fileHash) return (
    <div className="empty-state">
      <div className="icon">📂</div>
      <div className="title">Fichier requis</div>
      Chargez votre fichier INPUT dans la barre latérale.
    </div>
  );

  return (
    <div>
      <div className="page-title">📊 GAP M3 par Expéditeur</div>
      <div className="page-sub">m3_received − m3 calculé liaison · ventilé par statut & axe</div>

      <FilterBar allValues={allValues} onApply={setActiveFilters} />

      {loading && <div className="loading-overlay"><span className="spinner" /> Calcul en cours…</div>}

      {!loading && data && (
        <>
          <KpiGrid>
            <KpiCard label="GAP M3 Total" value={`${data.kpis.gap_total > 0 ? '+' : ''}${data.kpis.gap_total.toFixed(2)} m³`} />
            <KpiCard label="M3 Plan"      value={`${data.kpis.m3_plan.toFixed(2)} m³`} />
            <KpiCard label="M3 Réel"      value={`${data.kpis.m3_reel.toFixed(2)} m³`} />
            <KpiCard label="Lignes"        value={data.kpis.nb_lignes.toLocaleString()} />
          </KpiGrid>

          <hr className="divider" />

          {Object.entries(data.tables).map(([statut, axesData]) => (
            <div key={statut}>
              <BadgeStatus status={statut} />
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(Object.keys(axesData).length, 1)}, 1fr)`, gap: 16 }}>
                {Object.entries(axesData).map(([axe, { rows, total }]) => (
                  <div key={axe}>
                    <div className="axe-header">Axe : {axe}</div>
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Expéditeur</th>
                            <th style={{ textAlign: 'right' }}>GAP M3 (m³)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r, i) => (
                            <tr key={i}>
                              <td>{r.expediteur}</td>
                              <td className={`mono ${gapClass(r.gap_m3)}`} style={{ textAlign: 'right' }}>
                                {r.gap_m3.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          <tr className="table-total">
                            <td>⎯ Total</td>
                            <td className={`mono ${gapClass(total)}`} style={{ textAlign: 'right' }}>
                              {total.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
              <hr className="divider" />
            </div>
          ))}

          {/* Exports */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn-dark"
              onClick={() => {
                if (!uploadedFile) return alert('Fichier non disponible');
                const fd = new FormData();
                fd.append('file', uploadedFile);
                const params = new URLSearchParams();
                if (activeFilters.axes?.length) params.set('axes', activeFilters.axes.join(','));
                if (activeFilters.statuts?.length) params.set('statuts', activeFilters.statuts.join(','));
                fetch(`${BASE}/download/gap_filtre?${params}`, { method: 'POST', body: fd })
                  .then(r => r.blob()).then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'gap_m3_filtre.xlsx'; a.click();
                  });
              }}
            >📥 Exporter filtré (Excel)</button>
            <button className="btn-dark"
              onClick={() => {
                if (!uploadedFile) return alert('Fichier non disponible');
                const fd = new FormData(); fd.append('file', uploadedFile);
                fetch(`${BASE}/download/rapport`, { method: 'POST', body: fd })
                  .then(r => r.blob()).then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'SYNTHESE_GAP_M3.xlsx'; a.click();
                  });
              }}
            >📊 Rapport complet (7 onglets)</button>
          </div>
        </>
      )}
    </div>
  );
}
