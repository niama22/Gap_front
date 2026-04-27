import React, { useEffect, useState } from 'react';
import { getHistorique, getHistoriqueDetail, downloadExcel, downloadCsv } from '../api/client';
import { KpiGrid, KpiCard } from '../components/KpiCard';

function gapClass(v) {
  if (typeof v !== 'number') return 'gap-ok';
  if (v > 1) return 'gap-pos';
  if (v < -1) return 'gap-neg';
  return 'gap-ok';
}

const NUM_COLS = ['m3_plan', 'm3_reel', 'gap_m3'];

function fmtNum(col, val) {
  if (NUM_COLS.includes(col)) {
    const n = parseFloat(val);
    return isNaN(n) ? val : n.toFixed(3);
  }
  return val;
}

export default function Historique() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chosen, setChosen] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState('Global');
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    getHistorique().then(d => {
      setData(d);
      if (d.analyses?.length) setChosen(d.analyses[0]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!chosen) return;
    setDetailLoading(true);
    setDetail(null);
    getHistoriqueDetail(chosen.analyse_id, search)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setDetailLoading(false));
  }, [chosen, search]);

  if (loading) return <div className="loading-overlay"><span className="spinner" /> Chargement historique…</div>;

  if (!data?.analyses?.length) return (
    <div>
      <div className="page-title">🕓 Historique des analyses</div>
      <div className="empty-state">
        <div className="icon">🗄️</div>
        <div className="title">Aucune analyse sauvegardée</div>
        Chargez un fichier INPUT pour créer votre première analyse.
      </div>
    </div>
  );

  const { analyses, stats } = data;

  return (
    <div>
      <div className="page-title">🕓 Historique des analyses</div>
      <div className="page-sub">Toutes les analyses sauvegardées en base SQLite · visualiser · télécharger</div>

      {/* KPIs globaux */}
      <KpiGrid>
        <KpiCard label="Analyses totales"  value={stats.total} />
        <KpiCard label="Lignes cumulées"   value={stats.lignes_cumulees.toLocaleString()} />
        <KpiCard label="GAP moyen"          value={`${stats.gap_moyen > 0 ? '+' : ''}${stats.gap_moyen.toFixed(3)} m³`} />
        <KpiCard label="Dernière analyse"   value={stats.derniere_analyse} />
      </KpiGrid>

      <hr className="divider" />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* Liste des analyses */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 10, color: '#374151' }}>
            Sélectionner une analyse
          </div>
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {analyses.map((h) => {
              const gap = h.gap_total;
              const isChosen = chosen?.analyse_id === h.analyse_id;
              return (
                <div
                  key={h.analyse_id}
                  className={`hist-card${isChosen ? ' selected' : ''}`}
                  onClick={() => { setChosen(h); setSearch(''); setSearchInput(''); setShowDetail(false); }}
                >
                  <div>
                    <div className="hist-title" style={{ fontSize: '0.82rem' }}>
                      {h.filename?.replace(/\.xlsx$/i, '').slice(0, 28)}
                    </div>
                    <div className="hist-meta">{h.uploaded_at?.slice(0, 16).replace('T', ' ')}</div>
                    <div className="hist-meta">{h.nb_lignes} lignes</div>
                  </div>
                  <span className={`gap-chip ${gapClass(gap)}`}>
                    {gap > 0 ? '+' : ''}{gap?.toFixed(3)} m³
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Détail de l'analyse choisie */}
        <div>
          {chosen && (
            <>
              {/* En-tête */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', marginBottom: 12 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{chosen.filename}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 8px' }}>
                  {chosen.uploaded_at?.slice(0, 19).replace('T', ' ')} · {chosen.nb_lignes} lignes · ID : <code style={{ fontSize: '0.68rem' }}>{chosen.analyse_id}</code>
                </div>
                <span className={`gap-chip ${gapClass(chosen.gap_total)}`}>
                  GAP {chosen.gap_total > 0 ? '+' : ''}{chosen.gap_total?.toFixed(3)} m³
                </span>
                &nbsp;
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Plan : {chosen.m3_plan?.toFixed(3)} m³ · Réel : {chosen.m3_reel?.toFixed(3)} m³
                </span>
              </div>

              {detailLoading && <div className="loading-overlay"><span className="spinner" /> Chargement…</div>}

              {!detailLoading && detail && (
                <>
                  {/* Synthèse par périmètre */}
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>Synthèse GAP par statut</div>
                  <div className="tabs">
                    {['Global', 'International', 'Local'].map(t => (
                      <button key={t} className={`tab-btn${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
                        {t === 'Global' ? '🌍' : t === 'International' ? '✈️' : '🏠'} {t}
                      </button>
                    ))}
                  </div>

                  {(['Global', 'International', 'Local']).map(perim => {
                    if (activeTab !== perim) return null;
                    const rows = detail.syntheses?.[perim] || [];
                    if (!rows.length) return <div key={perim} style={{ color: '#9ca3af', fontSize: '0.82rem' }}>Pas de données</div>;
                    const cols = Object.keys(rows[0]);
                    return (
                      <div key={perim} className="table-wrapper" style={{ marginBottom: 16 }}>
                        <table className="data-table">
                          <thead>
                            <tr>{cols.map(c => <th key={c}>{c}</th>)}</tr>
                          </thead>
                          <tbody>
                            {rows.map((r, i) => (
                              <tr key={i}>
                                {cols.map(c => {
                                  const isGap = c === 'gap_m3';
                                  const n = parseFloat(r[c]);
                                  return (
                                    <td key={c} className={`${['m3_calcule','m3_received','gap_m3','gap_pct'].includes(c) ? 'mono' : ''} ${isGap ? gapClass(n) + '-cell' : ''}`}>
                                      {['m3_calcule','m3_received','gap_m3'].includes(c) && !isNaN(n) ? n.toFixed(3) : r[c]}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}

                  <hr className="divider" />

                  {/* Détail complet (expandable) */}
                  <div>
                    <button
                      className="btn-reset"
                      style={{ marginBottom: 12 }}
                      onClick={() => setShowDetail(v => !v)}
                    >
                      {showDetail ? '▲' : '▼'} 🔍 Détail complet des lignes ({detail.detail.total.toLocaleString()} lignes)
                    </button>

                    {showDetail && (
                      <>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                          <input
                            className="search-input"
                            style={{ flex: 1, marginBottom: 0 }}
                            placeholder="Recherche libre — IT, expéditeur, statut…"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
                          />
                          <button className="btn-primary" onClick={() => setSearch(searchInput)}>🔎</button>
                          {search && <button className="btn-reset" onClick={() => { setSearch(''); setSearchInput(''); }}>✕</button>}
                        </div>

                        <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>
                          {detail.detail.total.toLocaleString()} lignes
                        </div>
                        <div className="table-wrapper" style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
                          <table className="data-table">
                            <thead>
                              <tr>{detail.detail.columns.map(c => <th key={c}>{c}</th>)}</tr>
                            </thead>
                            <tbody>
                              {detail.detail.rows.map((row, i) => (
                                <tr key={i}>
                                  {detail.detail.columns.map(c => {
                                    const isGap = c === 'gap_m3';
                                    const n = parseFloat(row[c]);
                                    return (
                                      <td key={c} className={`${NUM_COLS.includes(c) ? 'mono' : ''} ${isGap && !isNaN(n) ? gapClass(n) + '-cell' : ''}`}>
                                        {fmtNum(c, row[c])}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>

                  <hr className="divider" />

                  {/* Téléchargements */}
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 10 }}>Télécharger</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-dark" onClick={() => downloadExcel(chosen.analyse_id)}>
                      📥 Excel (synthèse + détail)
                    </button>
                    <button className="btn-dark" onClick={() => downloadCsv(chosen.analyse_id)}>
                      📄 CSV (détail brut)
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
