import React, { useEffect, useState, useCallback } from 'react';
import { getAccueil, getWeeks, getAccueilEvolution } from '../api/client';
import { KpiGrid, KpiCard } from '../components/KpiCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, LineChart, Line, Area, AreaChart, ReferenceLine,
} from 'recharts';

// ─── Sélecteur de semaines ───────────────────────────────────────────────────
function WeekSelector({ weeks, selected, onChange }) {
  const allSelected = selected.length === 0 || selected.length === weeks.length;

  const toggle = (w) => {
    if (selected.includes(w)) {
      const next = selected.filter(x => x !== w);
      onChange(next);
    } else {
      onChange([...selected, w].sort((a, b) => a - b));
    }
  };

  const selectAll = () => onChange([]);

  return (
    <div style={{
      background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
      padding: '12px 16px', marginBottom: 24,
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8,
    }}>
      <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151', marginRight: 4 }}>
        📅 Semaines :
      </span>
      <button
        onClick={selectAll}
        style={{
          padding: '4px 12px', borderRadius: 20, border: '1.5px solid',
          cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
          background: allSelected ? '#1d4ed8' : '#fff',
          borderColor: allSelected ? '#1d4ed8' : '#d1d5db',
          color: allSelected ? '#fff' : '#6b7280',
          transition: 'all 0.15s',
        }}
      >
        Toutes
      </button>
      {weeks.map(w => {
        const active = selected.includes(w);
        return (
          <button
            key={w}
            onClick={() => toggle(w)}
            style={{
              padding: '4px 12px', borderRadius: 20, border: '1.5px solid',
              cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
              background: active ? '#1d4ed8' : '#fff',
              borderColor: active ? '#1d4ed8' : '#d1d5db',
              color: active ? '#fff' : '#6b7280',
              transition: 'all 0.15s',
            }}
          >
            W{w}
          </button>
        );
      })}
      {selected.length > 0 && selected.length < weeks.length && (
        <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: 4 }}>
          ({selected.length} semaine{selected.length > 1 ? 's' : ''} sélectionnée{selected.length > 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
}

// ─── Tooltip personnalisé ─────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e293b', color: '#f1f5f9', borderRadius: 8,
      padding: '10px 14px', fontSize: '0.8rem', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Semaine {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name} : <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
          {p.name.includes('M³') ? ' m³' : ''}
        </div>
      ))}
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Accueil({ fileHash, setPage }) {
  const [data, setData]             = useState(null);
  const [evo, setEvo]               = useState(null);
  const [weeks, setWeeks]           = useState([]);
  const [selWeeks, setSelWeeks]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [evoLoading, setEvoLoading] = useState(false);
  const [error, setError]           = useState(null);
  const [axeFilter, setAxeFilter]   = useState('Tous');

  useEffect(() => {
    if (!fileHash) return;
    getWeeks(fileHash)
      .then(r => setWeeks(r.weeks || []))
      .catch(() => {});
  }, [fileHash]);

  const loadAccueil = useCallback((wks) => {
    if (!fileHash) return;
    setLoading(true);
    getAccueil(fileHash, wks)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [fileHash]);

  useEffect(() => { loadAccueil(selWeeks); }, [loadAccueil, selWeeks]);

  useEffect(() => {
    if (!fileHash) return;
    setEvoLoading(true);
    getAccueilEvolution(fileHash)
      .then(setEvo)
      .catch(() => {})
      .finally(() => setEvoLoading(false));
  }, [fileHash]);

  if (!fileHash) return (
    <div className="empty-state">
      <div className="icon">📂</div>
      <div className="title">Fichier requis</div>
      Chargez votre fichier <strong>INPUT_syntes_suivi_DL.xlsx</strong> dans la barre latérale.
    </div>
  );

  if (loading) return <div className="loading-overlay"><span className="spinner" /> Chargement…</div>;
  if (error)   return <div className="empty-state"><div className="title">❌ {error}</div></div>;
  if (!data)   return null;

  const { kpis, gap_by_expediteur, gap_by_expediteur_by_axe = {}, gap_by_status, ord_ouv_compare } = data;
  const gapClass = v => v > 1 ? 'gap-pos' : v < -1 ? 'gap-neg' : 'gap-ok';

  const evoData   = evo?.evolution       || [];
  const evoByAxe  = evo?.by_axe         || [];
  const evoByOT   = evo?.by_order_type  || [];

  const evoCombo = evoData.map(row => ({
    week: `W${row.week}`,
    'M³ Prévu':   row.m3_order,
    'M³ Réalisé': row.m3_received,
    'GAP':        row.gap,
    'Lignes':     row.nb_lignes,
  }));

  const axeColors = { International: '#6366f1', Local: '#f59e0b' };
  const otColors  = { ORD: '#10b981', OUV: '#3b82f6' };

  const axeCombo = (() => {
    const ws = [...new Set(evoByAxe.flatMap(a => a.data.map(d => d.week)))].sort((a,b)=>a-b);
    return ws.map(w => {
      const row = { week: `W${w}` };
      evoByAxe.forEach(a => { const f = a.data.find(d => d.week === w); row[a.axe] = f ? f.m3_received : 0; });
      return row;
    });
  })();

  const otCombo = (() => {
    const ws = [...new Set(evoByOT.flatMap(a => a.data.map(d => d.week)))].sort((a,b)=>a-b);
    return ws.map(w => {
      const row = { week: `W${w}` };
      evoByOT.forEach(ot => { const f = ot.data.find(d => d.week === w); row[ot.order_type] = f ? f.nb : 0; });
      return row;
    });
  })();

  return (
    <div>
      <div className="page-title">📦 Suivi DL — GAP M3</div>
      <div className="page-sub">Analyse du GAP M3 · Synthèse ORD/OUV · Prévu vs Réalisé</div>

      {weeks.length > 0 && (
        <WeekSelector weeks={weeks} selected={selWeeks} onChange={setSelWeeks} />
      )}

      <KpiGrid>
        <KpiCard label="📊 GAP Total"
          value={<span className={`gap-chip ${gapClass(kpis.gap_total)}`}>{kpis.gap_total > 0 ? '+' : ''}{kpis.gap_total.toFixed(2)} m³</span>} />
        <KpiCard label="📦 Volume Plan"        value={`${kpis.m3_plan.toFixed(2)} m³`} />
        <KpiCard label="✅ Volume Réel"         value={`${kpis.m3_reel.toFixed(2)} m³`} />
        <KpiCard label="📋 Lignes analysées"   value={kpis.nb_lignes.toLocaleString()} />
      </KpiGrid>

      <hr className="divider" />

      {/* ══ ÉVOLUTION HISTORIQUE ══ */}
      <div className="chart-title" style={{ fontSize: '1.05rem', marginBottom: 6 }}>
        📈 Évolution historique par semaine
      </div>
      <div className="page-sub" style={{ marginBottom: 16 }}>
        Historique sur toutes les semaines disponibles (W{weeks[0]}–W{weeks[weeks.length - 1]})
      </div>

      {evoLoading ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: 24 }}>Chargement évolution…</div>
      ) : evoCombo.length > 0 ? (
        <>
          {/* Graphe 1 : Volume M³ Prévu vs Réalisé */}
          <div className="charts-grid">
            <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
              <div className="chart-title">M³ Prévu vs Réalisé — Évolution hebdomadaire</div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={evoCombo} margin={{ left: 10, right: 20, top: 10 }}>
                  <defs>
                    <linearGradient id="colorPlan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorReel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="M³ Prévu"   stroke="#f59e0b" fill="url(#colorPlan)" strokeWidth={2} dot={{ r: 4 }} />
                  <Area type="monotone" dataKey="M³ Réalisé" stroke="#10b981" fill="url(#colorReel)" strokeWidth={2} dot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphe 2 : GAP + Lignes */}
          <div className="charts-grid" style={{ marginTop: 16 }}>
            <div className="chart-card">
              <div className="chart-title">GAP M³ par semaine</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={evoCombo} margin={{ left: 10, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#374151" strokeWidth={1.5} />
                  <Bar dataKey="GAP" radius={[4, 4, 0, 0]}>
                    {evoCombo.map((entry, i) => (
                      <Cell key={i} fill={entry.GAP > 1 ? '#ef4444' : entry.GAP < -1 ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-title">Nombre de lignes par semaine</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={evoCombo} margin={{ left: 10, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="Lignes" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 5, fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphe 3 : Axe + Order type */}
          {axeCombo.length > 0 && (
            <div className="charts-grid" style={{ marginTop: 16 }}>
              <div className="chart-card">
                <div className="chart-title">M³ Réalisé par Axe — Évolution</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={axeCombo} margin={{ left: 10, right: 10, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {evoByAxe.map(a => (
                      <Line key={a.axe} type="monotone" dataKey={a.axe}
                        stroke={axeColors[a.axe] || '#94a3b8'} strokeWidth={2.5}
                        dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {otCombo.length > 0 && (
                <div className="chart-card">
                  <div className="chart-title">Lignes ORD / OUV — Évolution</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={otCombo} margin={{ left: 10, right: 10, top: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {evoByOT.map(ot => (
                        <Bar key={ot.order_type} dataKey={ot.order_type}
                          fill={otColors[ot.order_type] || '#94a3b8'} radius={[4,4,0,0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ color: '#6b7280', padding: '16px 0' }}>Données évolutives non disponibles.</div>
      )}

      <hr className="divider" />

      {/* ── GAP par expéditeur & statut ── */}
      <div className="chart-title" style={{ fontSize: '1.05rem', marginBottom: 16 }}>📊 Analyse du GAP M3</div>
      <div className="charts-grid">
 <div className="chart-card">
  {/* Filtre par Axe */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
    <div className="chart-title" style={{ marginBottom: 0 }}>Top 10 Expéditeurs par GAP</div>
    <div style={{ display: 'flex', gap: 5, marginLeft: 'auto' }}>
      {['Tous', ...Object.keys(gap_by_expediteur_by_axe)].map(axe => (
        <button
          key={axe}
          onClick={() => setAxeFilter(axe)}
          style={{
            padding: '3px 10px', borderRadius: 16, border: '1px solid',
            cursor: 'pointer', fontSize: '0.74rem', fontWeight: 600,
            background: axeFilter === axe ? '#1d4ed8' : '#fff',
            borderColor: axeFilter === axe ? '#1d4ed8' : '#d1d5db',
            color: axeFilter === axe ? '#fff' : '#6b7280',
            transition: 'all 0.15s',
          }}
        >
          {axe === 'International' ? '✈️' : axe === 'Local' ? '🏠' : '🌍'} {axe}
        </button>
      ))}
    </div>
  </div>
  <ResponsiveContainer width="100%" height={400}>
    <BarChart
      data={axeFilter === 'Tous' ? gap_by_expediteur : (gap_by_expediteur_by_axe[axeFilter] || [])}
      layout="vertical"
      margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" tick={{ fontSize: 11 }} />
      <YAxis 
        type="category" 
        dataKey="expediteur" 
        width={180} 
        tick={{ fontSize: 10 }}
        interval={0}
      />
      <Tooltip 
        formatter={(v) => [`${v.toFixed(3)} m³`, 'GAP']}
        labelFormatter={(label) => `Expéditeur : ${label}`}
      />
      <Bar dataKey="gap" radius={[0, 4, 4, 0]}>
        {(axeFilter === 'Tous' ? gap_by_expediteur : (gap_by_expediteur_by_axe[axeFilter] || [])).map((entry, i) => (
          <Cell key={i} fill={entry.gap > 1 ? '#ef4444' : entry.gap < -1 ? '#f59e0b' : '#10b981'} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</div>

        <div className="chart-card">
          <div className="chart-title">Répartition du GAP par Statut</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={gap_by_status} margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="statut" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v.toFixed(3)} m³`, 'GAP']} />
              <Bar dataKey="gap" radius={[4, 4, 0, 0]}>
                {gap_by_status.map((entry, i) => (
                  <Cell key={i} fill={entry.gap > 1 ? '#ef4444' : entry.gap < -1 ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <hr className="divider" />

      <div className="chart-title" style={{ fontSize: '1.05rem', marginBottom: 16 }}>⚖️ Comparaison ORD / OUV</div>
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Prévu vs Réalisé</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ord_ouv_compare} margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="prevu"   name="Prévu (IT)"       fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="realise" name="Réalisé (ship.)"  fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Indicateurs ORD</div>
          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 16 }}>
              <div className="kpi-label">🎯 Taux ORD Réalisé</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.4rem', fontWeight: 500 }}>
                {kpis.pct_ord_real}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>
                {kpis.pct_ord_real > kpis.pct_ord_prev ? '▲' : '▼'} {Math.abs(kpis.pct_ord_real - kpis.pct_ord_prev).toFixed(1)}% vs prévu ({kpis.pct_ord_prev}%)
              </div>
              <div style={{ background: '#e5e7eb', borderRadius: 4, height: 8, marginTop: 8 }}>
                <div style={{ background: '#1d4ed8', borderRadius: 4, height: 8, width: `${Math.min(kpis.pct_ord_real, 100)}%` }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="kpi-card"><div className="kpi-label">ORD Prévus</div><div className="kpi-value">{kpis.ord_prev.toLocaleString()} IT</div></div>
              <div className="kpi-card"><div className="kpi-label">OUV Prévus</div><div className="kpi-value">{kpis.ouv_prev.toLocaleString()} IT</div></div>
              <div className="kpi-card"><div className="kpi-label">ORD Réalisés</div><div className="kpi-value">{kpis.ord_real.toLocaleString()} ship.</div></div>
              <div className="kpi-card"><div className="kpi-label">OUV Réalisés</div><div className="kpi-value">{kpis.ouv_real.toLocaleString()} ship.</div></div>
            </div>
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div className="chart-title" style={{ fontSize: '1.05rem', marginBottom: 16 }}>🎯 Indicateurs clés</div>
      <KpiGrid>
        <KpiCard label="🎯 Taux conversion ORD" value={`${kpis.pct_ord_real}%`} />
        <KpiCard label="⚠️ Écart relatif"        value={`${kpis.gap_pct}%`} />
        <KpiCard label="📦 Volume moyen / IT"    value={`${kpis.vol_moyen_it} m³`} />
        <KpiCard label="🚛 Shipments réalisés"   value={kpis.total_real.toLocaleString()} />
      </KpiGrid>

      <hr className="divider" />

      <div className="chart-title" style={{ fontSize: '1.05rem', marginBottom: 12 }}>🚀 Accès rapide</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn-primary" onClick={() => setPage('gap_m3')}>📊 Voir détail GAP M3</button>
        <button className="btn-primary" onClick={() => setPage('ord_ouv')}>⚖️ Analyser ORD/OUV</button>
        <button className="btn-primary" onClick={() => setPage('detail')}>🔍 Explorer le détail</button>
      </div>
    </div>
  );
}
