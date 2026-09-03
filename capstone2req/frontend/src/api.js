import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Insights
export const getInsights = () => api.get('/insights')
export const getInsight = (id) => api.get(`/insights/${id}`)

// Taxonomy
export const getTaxonomySI = () => api.get('/taxonomy/si')
export const getTaxonomyCSF = (area) => api.get('/taxonomy/csf', { params: { therapeutic_area: area } })
export const getLabelOptions = () => api.get('/label-options')

// Tags (read + human review — unchanged data layer)
export const getTags = () => api.get('/tags')
export const getTag = (id) => api.get(`/tags/${id}`)
export const verifyTag = (insightId, verifiedBy) => api.post('/tags/verify', { insight_id: insightId, verified_by: verifiedBy })
export const correctTag = (insightId, corrections, reason, correctedBy) => api.post('/tags/correct', {
  insight_id: insightId,
  corrections,
  reason,
  corrected_by: correctedBy
})

// Summary & Metrics
export const getSummary = () => api.get('/summary')
export const getMetrics = () => api.get('/metrics')
export const getDistributions = () => api.get('/distributions')

// ---- Unified pipeline (tag -> persona -> index), replaces the old
// separate "batch tag" / "generate all personas" / "build index" actions.
export const analyzeInsight = (insightId) => api.post(`/pipeline/analyze/${insightId}`)
export const runPipeline = (limit = null, skipDone = true, steps = ['tag', 'persona', 'index']) =>
  api.post('/pipeline/run', { limit, skip_done: skipDone, steps })
export const getJob = (jobId) => api.get(`/pipeline/jobs/${jobId}`)
export const listJobs = () => api.get('/pipeline/jobs')

// Search (query only — indexing now runs inside the pipeline)
export const searchInsights = (query, topK = 5) => api.post('/search', { query, top_k: topK })

// Personas (reads — generation now runs inside the pipeline)
export const getPersonaSummaries = (insightId) => api.get(`/personas/${insightId}`)

// Ground Truth
export const exportGroundTruthTemplate = (limit = 100) => api.get(`/ground-truth/export-template?limit=${limit}`, { responseType: 'blob' })
export const compareGroundTruth = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/ground-truth/compare', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export const getSampleGroundTruth = () => api.get('/ground-truth/sample')

export default api
