import React, { useEffect, useState } from 'react';
import { getHistoriqueEvolutionSemaines } from '../api/client';
import { KpiGrid, KpiCard } from '../components/KpiCard';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

/* ── Tooltip personnalisé ─────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e293b', color: '#f1f5f9', borderRadius: 8,
      padding: '10px 14px', fontSize: '0.8rem', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name} : <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
          {(p.name.includes('M³') || p.name.includes('GAP')) ? ' m³' : ''}
        </div>
      ))}
    </div>
  );
};

/* ── Badge numérique coloré ───────────────────────────────────────── */
function GapChip({ value }) {
  const v = parseFloat(value);
  const color = v > 1 ? '#ef4444' : v < -1 ? '#f59e0b' : '#10b981';
  const bg    = v > 1 ? '#fef2f2' : v < -1 ? '#fffbeb' : '#f0fdf4';
  return (
    <span style={{
      background: bg, color, borderRadius: 6,
      padding: '2px 8px', fontWeight: 700, fontFamily: 'monospace',
    }}>
      {v > 0 ? '+' : ''}{v.toFixed(2)} m³
    </span>
  );
}

export default function EvoKpi() {
  const [evo, setEvo]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    getHistoriqueEvolutionSemaines()
      .then(d => setEvo(d.evolution || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-overlay"><span className="spinner" /> Chargement évolution KPI…</div>
  );

  if (error) return (
    <div className="empty-state">
      <div className="icon">❌</div>
      <div className="title">Erreur chargement</div>
      {error}
    </div>
  );

  if (!evo.length) return (
    <div>
      <div className="page-title">📈 Évolution KPI par semaine</div>
      <div className="empty-state">
        <div className="icon">🗄️</div>
        <div className="title">Aucune donnée historique</div>
        Chargez au moins un fichier pour commencer à construire l'historique hebdomadaire.
      </div>
    </div>
  );

  /* ── KPIs synthèse ── */
  const lastRow       = evo[evo.length - 1];
  const totalAnalyses = evo.reduce((s, r) => s + r.nb_analyses, 0);
  const avgGap        = evo.reduce((s, r) => s + r.gap_total, 0) / evo.length;
  const minGap        = Math.min(...evo.map(r => r.gap_total));
  const maxGap        = Math.max(...evo.map(r => r.gap_total));

  /* ── Données graphes ── */
  const chartData = evo.map(r => ({
    label:      r.week_label,
    'M³ Plan':  r.m3_plan,
    'M³ Réel':  r.m3_reel,
    'GAP':      r.gap_total,
    'Lignes':   r.nb_lignes,
    'Analyses': r.nb_analyses,
  }));

  return (
    <div>
      <div className="page-title">📈 Évolution KPI par semaine</div>
      <div className="page-sub">
        Historique des analyses · agrégé par semaine ISO · {evo.length} semaine{evo.length > 1 ? 's' : ''} disponible{evo.length > 1 ? 's' : ''}
      </div>

      {/* ── KPI Cards ── */}
      <KpiGrid>
        <KpiCard label="📅 Dernière semaine"            value={lastRow.week_label} />
        <KpiCard label="📊 GAP moyen (toutes semaines)" value={<GapChip value={avgGap} />} />
        <KpiCard
          label="📉 GAP min / max"
          value={
            <span style={{ fontSize: '0.9rem' }}>
              <GapChip value={minGap} /> / <GapChip value={maxGap} />
            </span>
          }
        />
        <KpiCard label="🔁 Analyses chargées" value={totalAnalyses} />
      </KpiGrid>

      <hr className="divider" />

      {/* ── Graphe 1 : M³ Plan vs Réalisé ── */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div className="chart-title">📦 M³ Plan vs M³ Réalisé — évolution hebdomadaire</div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ left: 10, right: 20, top: 10 }}>
            <defs>
              <linearGradient id="gradPlan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradReel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="M³ Plan" stroke="#f59e0b" fill="url(#gradPlan)" strokeWidth={2.5} dot={{ r: 4 }} />
            <Area type="monotone" dataKey="M³ Réel" stroke="#10b981" fill="url(#gradReel)" strokeWidth={2.5} dot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Graphe 2 : GAP par semaine ── */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div className="chart-title">📊 Évolution du GAP M³ par semaine</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ left: 10, right: 20, top: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(0)} m³`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#374151" strokeWidth={1.5} strokeDasharray="4 3" />
            <Line
              type="monotone"
              dataKey="GAP"
              name="GAP M³"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <hr className="divider" />

      {/* ── Tableau récapitulatif ── */}
      <div className="chart-title" style={{ fontSize: '1rem', marginBottom: 12 }}>📄 Tableau récapitulatif</div>
      <div className="table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Semaine</th>
              <th style={{ textAlign: 'right' }}>M³ Plan (moy.)</th>
              <th style={{ textAlign: 'right' }}>M³ Réel (moy.)</th>
              <th style={{ textAlign: 'right' }}>GAP M³</th>
              <th style={{ textAlign: 'right' }}>Lignes</th>
              <th style={{ textAlign: 'right' }}>Analyses</th>
            </tr>
          </thead>
          <tbody>
            {[...evo].reverse().map((r, i) => {
              const gap    = r.gap_total;
              const gapCls = gap > 1 ? 'gap-pos-cell' : gap < -1 ? 'gap-neg-cell' : 'gap-ok-cell';
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{r.week_label}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{r.m3_plan.toFixed(2)} m³</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{r.m3_reel.toFixed(2)} m³</td>
                  <td className={`mono ${gapCls}`} style={{ textAlign: 'right' }}>
                    {gap > 0 ? '+' : ''}{gap.toFixed(2)} m³
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>{r.nb_lignes.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', color: '#6b7280' }}>{r.nb_analyses}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}