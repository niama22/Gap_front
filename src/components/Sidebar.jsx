import React, { useRef } from 'react';

const PAGES = [
  { key: 'accueil',    icon: '', label: 'Accueil' },
  { key: 'gap_m3',     icon: '', label: 'GAP M3' },
  { key: 'ord_ouv',    icon: '',  label: 'ORD / OUV' },
  { key: 'detail',     icon: '', label: 'Détail' },
  { key: 'evo_kpi',    icon: '', label: 'Évolution KPI' },
  { key: 'historique', icon: '', label: 'Historique' },
];

export default function Sidebar({ page, setPage, onFileLoad, fileInfo }) {
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) onFileLoad(f);
  };

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-title">📦 Suivi DL</div>
        <div className="sb-logo-sub">GAP M3 · Prévu vs Réalisé</div>
      </div>

      <div className="sb-upload">
        <label>Fichier INPUT (.xlsx)</label>
        {fileInfo ? (
          <div className="sb-file-loaded" title={fileInfo.filename}>
            ✅ {fileInfo.filename}
          </div>
        ) : (
          <label className="sb-upload-btn">
            📂 Charger un fichier…
            <input ref={inputRef} type="file" accept=".xlsx" onChange={handleFile} />
          </label>
        )}
        {fileInfo && (
          <label className="sb-upload-btn" style={{ marginTop: 6 }}>
            🔄 Changer de fichier
            <input type="file" accept=".xlsx" onChange={handleFile} />
          </label>
        )}
      </div>

      <div className="sb-section">Navigation</div>

      <div style={{ padding: '0 10px' }}>
        {PAGES.map(({ key, icon, label }) => (
          <button
            key={key}
            className={`nav-btn${page === key ? ' active' : ''}`}
            onClick={() => setPage(key)}
          >
            {icon}&nbsp;&nbsp;{label}
          </button>
        ))}
      </div>

      <div className="sb-active-label">
        Page active : <span>{PAGES.find(p => p.page === page)?.label || PAGES.find(p => p.key === page)?.label}</span>
      </div>
    </aside>
  );
}
