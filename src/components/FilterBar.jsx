import React, { useState, useEffect, useRef } from 'react';
import MultiSelect from './MultiSelect';

export default function FilterBar({ allValues = {}, showExped = false, showCarrier = false, showOt = false, onApply }) {
  const [axes, setAxes]             = useState(allValues.axes || []);
  const [statuts, setStatuts]       = useState(allValues.statuts || []);
  const [expediteurs, setExped]     = useState(allValues.expediteurs || []);
  const [carriers, setCarriers]     = useState(allValues.carriers || []);
  const [orderTypes, setOrderTypes] = useState(allValues.order_types || []);
  const autoApplied                 = useRef(false);

  /* ── Sync interne si allValues change (nouveau fichier) ── */
  useEffect(() => {
    setAxes(allValues.axes || []);
    setStatuts(allValues.statuts || []);
    setExped(allValues.expediteurs || []);
    setCarriers(allValues.carriers || []);
    setOrderTypes(allValues.order_types || []);
  }, [allValues]);

  /* ── Auto-apply dès que allValues est disponible (1 seule fois) ── */
  useEffect(() => {
    if (autoApplied.current) return;
    if (!allValues || !Object.keys(allValues).length) return;
    autoApplied.current = true;
    onApply({});           // {} = aucun filtre actif = toutes les données
  }, [allValues, onApply]);

  const handleApply = () => {
    onApply({
      axes:        axes.length        === (allValues.axes        || []).length ? [] : axes,
      statuts:     statuts.length     === (allValues.statuts     || []).length ? [] : statuts,
      expediteurs: expediteurs.length === (allValues.expediteurs || []).length ? [] : expediteurs,
      carriers:    carriers.length    === (allValues.carriers    || []).length ? [] : carriers,
      order_types: orderTypes.length  === (allValues.order_types || []).length ? [] : orderTypes,
    });
  };

  const handleReset = () => {
    setAxes(allValues.axes || []);
    setStatuts(allValues.statuts || []);
    setExped(allValues.expediteurs || []);
    setCarriers(allValues.carriers || []);
    setOrderTypes(allValues.order_types || []);
    onApply({});
  };

  return (
    <div className="filter-bar">
      <div className="filter-grid">
        <MultiSelect label="Axe"           options={allValues.axes        || []} value={axes}        onChange={setAxes} />
        <MultiSelect label="Statut"         options={allValues.statuts     || []} value={statuts}     onChange={setStatuts} />
        {showOt && (
          <MultiSelect label="Type d'ordre" options={allValues.order_types || []} value={orderTypes}  onChange={setOrderTypes} />
        )}
        {showExped && (
          <MultiSelect label="Expéditeur"   options={allValues.expediteurs || []} value={expediteurs} onChange={setExped} />
        )}
        {showCarrier && allValues.carriers?.length > 0 && (
          <MultiSelect label="Transporteur" options={allValues.carriers}           value={carriers}    onChange={setCarriers} />
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <button className="btn-primary" onClick={handleApply}>🔍 Appliquer</button>
          <button className="btn-reset"   onClick={handleReset}>↺</button>
        </div>
      </div>
    </div>
  );
}
