import React, { useState } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Accueil from './pages/Accueil';
import GapM3 from './pages/GapM3';
import OrdOuv from './pages/OrdOuv';
import Detail from './pages/Detail';
import Historique from './pages/Historique';
import EvoKpi from './pages/EvoKpi';
import { uploadFile } from './api/client';

export default function App() {
  const [page, setPage] = useState('accueil');
  const [fileHash, setFileHash] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [allValues, setAllValues] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileLoad = async (file) => {
    setLoading(true);
    try {
      const data = await uploadFile(file);
      setFileHash(data.file_hash);
      setFileInfo({ filename: file.name, analyse_id: data.analyse_id });
      setAllValues(data.filters);
      setUploadedFile(file);
      showToast(`✅ Analyse sauvegardée — ${data.kpis.nb_lignes} lignes`);
    } catch (e) {
      showToast(`❌ Erreur : ${e.response?.data?.detail || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const commonProps = { fileHash, allValues, uploadedFile };

  return (
    <div className="app-layout">
      <Sidebar page={page} setPage={setPage} onFileLoad={handleFileLoad} fileInfo={fileInfo} />
      <main className="main-content">
        {loading && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
            background: '#1d4ed8', color: '#fff',
            padding: '8px', textAlign: 'center', fontSize: '0.82rem',
          }}>
            <span className="spinner" style={{ borderTopColor: '#fff', marginRight: 8 }} />
            Chargement & calcul GAP M3…
          </div>
        )}

        {page === 'accueil'    && <Accueil    {...commonProps} setPage={setPage} />}
        {page === 'gap_m3'     && <GapM3      {...commonProps} />}
        {page === 'ord_ouv'    && <OrdOuv     {...commonProps} />}
        {page === 'detail'     && <Detail     {...commonProps} />}
        {page === 'historique' && <Historique />}
        {page === 'evo_kpi'    && <EvoKpi />}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
