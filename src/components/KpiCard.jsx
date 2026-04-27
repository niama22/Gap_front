import React from 'react';

export function KpiGrid({ children }) {
  return <div className="kpi-grid">{children}</div>;
}

export function KpiCard({ label, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}
