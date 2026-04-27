import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'https://gapbackend-production.up.railway.app';

const api = axios.create({ baseURL: BASE });

export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/upload', fd);
  return data;
}

export async function getAccueil(fileHash, weeks = []) {
  const params = { file_hash: fileHash };
  if (weeks.length) params.weeks = weeks.join(',');
  const { data } = await api.get('/accueil', { params });
  return data;
}

export async function getWeeks(fileHash) {
  const { data } = await api.get('/weeks', { params: { file_hash: fileHash } });
  return data;
}

export async function getAccueilEvolution(fileHash, weeks = []) {
  const params = { file_hash: fileHash };
  if (weeks.length) params.weeks = weeks.join(',');
  const { data } = await api.get('/accueil/evolution', { params });
  return data;
}

export async function getGapM3(fileHash, filters = {}) {
  const params = { file_hash: fileHash };
  if (filters.axes?.length) params.axes = filters.axes.join(',');
  if (filters.statuts?.length) params.statuts = filters.statuts.join(',');
  if (filters.expediteurs?.length) params.expediteurs = filters.expediteurs.join(',');
  const { data } = await api.get('/gap_m3', { params });
  return data;
}

export async function getOrdOuv(fileHash, filters = {}) {
  const params = { file_hash: fileHash };
  if (filters.axes?.length) params.axes = filters.axes.join(',');
  if (filters.statuts?.length) params.statuts = filters.statuts.join(',');
  if (filters.order_types?.length) params.order_types = filters.order_types.join(',');
  const { data } = await api.get('/ord_ouv', { params });
  return data;
}

export async function getDetail(fileHash, filters = {}) {
  const params = {
    file_hash: fileHash,
    page: filters.page || 1,
    page_size: filters.page_size || 100,
  };
  if (filters.axes?.length) params.axes = filters.axes.join(',');
  if (filters.statuts?.length) params.statuts = filters.statuts.join(',');
  if (filters.search) params.search = filters.search;
  const { data } = await api.get('/detail', { params });
  return data;
}

export async function getHistoriqueEvolutionSemaines() {
  const { data } = await api.get('/historique/evolution_semaines');
  return data;
}

export async function getHistorique() {
  const { data } = await api.get('/historique');
  return data;
}

export async function getHistoriqueDetail(analyseId, search = '') {
  const { data } = await api.get(`/historique/${analyseId}`, { params: { search } });
  return data;
}

export function downloadExcel(analyseId) {
  window.open(`${BASE}/download/excel/${analyseId}`, '_blank');
}

export function downloadCsv(analyseId) {
  window.open(`${BASE}/download/csv/${analyseId}`, '_blank');
}
