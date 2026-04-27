import React, { useState, useEffect } from 'react';
import { getOrdOuv } from '../api/client';
import { KpiGrid, KpiCard } from '../components/KpiCard';
import FilterBar from '../components/FilterBar';

function SiteBlock({ block, color, unit }) {
  const { label, total, rows } = block;
  return (
    <div className="site-block">
      <div className="site-title" style={{ background: color }}>{label}</div>
      <div className="oo-row total">
        <span className="tag tag-tot">TOTAL</span>
        <span className="oo-label" />
        <span className="oo-val">{total.toLocaleString()} {unit}</span>
        <span className="oo-pct" />
      </div>
      {rows.map((r, i) => {
        const isOrd = r.order_type === 'ORD';
        return (
          <div key={i} className={`oo-row ${isOrd ? 'ord-r' : 'ouv-r'}`}>
            <span className={`tag ${isOrd ? 'tag-ord' : 'tag-ouv'}`}>{r.order_type}</span>
            <span className="oo-label">{unit}</span>
            <span className="oo-val">{r.nb.toLocaleString()}</span>
            <span className="oo-pct">{r.pct != null ? `${r.pct}%` : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function OrdOuv({ fileHash, allValues }) {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  /* ── Chargement automatique ── */
  useEffect(() => {
    if (!fileHash) return;
    setLoading(true);
    getOrdOuv(fileHash, activeFilters)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fileHash, activeFilters]);

  if (!fileHash) return (
    <div className="empty-state">
      <div className="icon">📂</div>
      <div className="title">Fichier requis</div>
    </div>
  );

  return (
    <div>
      <div className="page-title">⚖️ ORD / OUV — Prévu vs Réalisé</div>
      <div className="page-sub">OPTIM-3D (Prévu) · BOS-TFR (Réalisé) · ventilé par type d'ordre</div>

      <FilterBar allValues={allValues} showOt onApply={setActiveFilters} />

      {loading && <div className="loading-overlay"><span className="spinner" /> Chargement…</div>}

      {!loading && data && (
        <>
          <KpiGrid>
            <KpiCard label="IT Prévus"        value={data.kpis.it_prevus.toLocaleString()} />
            <KpiCard label="Shipments Réels"  value={data.kpis.shipments_reels.toLocaleString()} />
            <KpiCard label="% ORD Prévu"       value={`${data.kpis.pct_ord_prevu}%`} />
            <KpiCard label="% ORD Réalisé"     value={`${data.kpis.pct_ord_realise}%`} />
          </KpiGrid>

          <hr className="divider" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* PRÉVU */}
            <div>
              <div className="panel-header" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
                📋 PRÉVU <span style={{ fontWeight: 400, fontSize: '0.7rem', marginLeft: 6, color: '#b45309' }}>OPTIM-3D · IT</span>
              </div>
              {data.prevu.map((block, i) => (
                <SiteBlock key={i} block={block} color="#b45309" unit="IT" />
              ))}
              <div className="grand-total">
                <span className="gt-label">Total général</span>
                <span className="gt-val">
                  {data.prevu.reduce((s, b) => s + b.total, 0).toLocaleString()} IT
                </span>
              </div>
            </div>

            {/* RÉALISÉ */}
            <div>
              <div className="panel-header" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#065f46' }}>
                ✅ RÉALISÉ <span style={{ fontWeight: 400, fontSize: '0.7rem', marginLeft: 6, color: '#059669' }}>BOS-TFR · shipments</span>
              </div>
              {data.realise.map((block, i) => (
                <SiteBlock key={i} block={block} color="#059669" unit="ship." />
              ))}
              <div className="grand-total">
                <span className="gt-label">Total général</span>
                <span className="gt-val">
                  {data.realise.reduce((s, b) => s + b.total, 0).toLocaleString()} ship.
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
