import React, { useState, useRef, useEffect } from 'react';

export default function MultiSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt));
    else onChange([...value, opt]);
  };

  const nSel = value.length, nTot = options.length;
  const placeholder = nSel === 0 || nSel === nTot ? `Tous (${nTot})` : `${nSel}/${nTot}`;

  return (
    <div className="filter-group">
      <span className="filter-label">{label}</span>
      <div className="multi-select-wrapper" ref={ref}>
        <button
          className="multi-select-trigger"
          onClick={() => setOpen(o => !o)}
          type="button"
        >
          {placeholder} {open ? '▲' : '▼'}
        </button>
        {open && (
          <div className="multi-select-dropdown">
            <div
              className="multi-select-option"
              onClick={() => onChange(nSel === nTot ? [] : [...options])}
            >
              <input type="checkbox" readOnly checked={nSel === nTot} />
              <span style={{ fontWeight: 600, color: '#374151' }}>Tout sélectionner</span>
            </div>
            {options.map(opt => (
              <div key={opt} className="multi-select-option" onClick={() => toggle(opt)}>
                <input type="checkbox" readOnly checked={value.includes(opt)} />
                <span>{opt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
