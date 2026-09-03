import React, { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Panel, Tag, Btn, DataTable } from '../components/Panel'
import JobConsole from '../components/JobConsole'
import { getInsights, getTags, analyzeInsight, runPipeline } from '../api'

const LABELS = [
  'asset', 'sentiment', 'insight_type', 'topic', 'stakeholder',
  'si_id', 'csf_id', 'source_channel', 'evidence_gap', 'action_required',
]

function Tagging() {
  const [insights, setInsights] = useState([])
  const [tags, setTags] = useState([])
  const [selectedInsight, setSelectedInsight] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [insightsRes, tagsRes] = await Promise.all([getInsights(), getTags()])
      const insightsList = insightsRes.data.insights || []
      setInsights(insightsList)
      setTags(tagsRes.data.tags || [])
      if (insightsList.length > 0 && !selectedInsight) setSelectedInsight(insightsList[0].insight_id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedInsight) return
    setAnalyzing(true)
    setResult(null)
    try {
      const res = await analyzeInsight(selectedInsight)
      setResult(res.data.result)
      const tagsRes = await getTags()
      setTags(tagsRes.data.tags || [])
    } catch (e) {
      alert(e.response?.data?.detail || 'Analyze failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleRunTagOnly = async () => {
    setStarting(true)
    try {
      const res = await runPipeline(null, true, ['tag'])
      setJobId(res.data.job_id)
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to start')
    } finally {
      setStarting(false)
    }
  }

  const sentimentTone = (s) => ({ Positive: 'good', Negative: 'bad', Neutral: 'default', Mixed: 'warn' }[s] || 'default')

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Tag</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Extracts 10 taxonomy labels per insight via the LLM classifier</p>
        </div>
        <Btn variant="secondary" size="sm" onClick={() => { setRefreshing(true); fetchData() }} loading={refreshing}>
          <RefreshCw className="w-3.5 h-3.5" /> refresh
        </Btn>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {LABELS.map((l) => <Tag key={l}>{l}</Tag>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Panel title="Analyze one insight">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Runs tag + persona generation together, in one pipeline call.</p>
          <select
            value={selectedInsight}
            onChange={(e) => setSelectedInsight(e.target.value)}
            className="w-full mb-3 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          >
            {insights.length === 0 ? <option value="">No insights loaded</option> : insights.map((i) => (
              <option key={i.insight_id} value={i.insight_id}>{i.insight_id} — {i.disease_state || i.therapeutic_area || 'n/a'}</option>
            ))}
          </select>
          <Btn onClick={handleAnalyze} loading={analyzing} disabled={!selectedInsight} className="w-full">
            Analyze insight
          </Btn>

          {result && (
            <div className="mt-3 border border-slate-300 dark:border-slate-700 p-3">
              <p className="label-caps mb-2">Tags</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                {LABELS.map((k) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-slate-500">{k}</span>
                    <span className="mono text-slate-900 dark:text-white">{result.tags?.[k] || '—'}</span>
                  </div>
                ))}
              </div>
              <p className="label-caps mb-2">Persona summaries</p>
              <div className="space-y-2 text-sm">
                {Object.entries(result.personas || {}).map(([key, val]) => (
                  <p key={key}><span className="font-semibold">{key}:</span> {val.summary}</p>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Batch tag">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Tags every un-tagged insight in one background job. For the full pipeline (tag + persona + index), use <span className="mono">Overview → Run Pipeline</span>.
          </p>
          <Btn onClick={handleRunTagOnly} loading={starting} className="w-full mb-3">Run tag-only job</Btn>
          {jobId && <JobConsole jobId={jobId} onSettled={fetchData} />}
        </Panel>
      </div>

      <Panel title={`Tagged insights (${tags.length})`}>
        <DataTable
          rowKey={(r) => r.insight_id}
          emptyLabel="No tags generated yet — analyze an insight or run a batch job."
          columns={[
            { key: 'insight_id', label: 'ID', render: (r) => <span className="mono">{r.insight_id}</span> },
            { key: 'asset', label: 'Asset', render: (r) => <span className="mono text-accent-700 dark:text-accent-400">{r.asset || '-'}</span> },
            { key: 'sentiment', label: 'Sentiment', render: (r) => <Tag tone={sentimentTone(r.sentiment)}>{r.sentiment || '-'}</Tag> },
            { key: 'insight_type', label: 'Type' },
            { key: 'topic', label: 'Topic', render: (r) => <Tag tone="accent">{r.topic || '-'}</Tag> },
            { key: 'stakeholder', label: 'Stakeholder' },
            { key: 'si_id', label: 'SI' },
            { key: 'is_verified', label: 'Status', render: (r) => r.is_verified ? <Tag tone="good">verified</Tag> : <Tag tone="warn">pending</Tag> },
          ]}
          rows={tags.slice(0, 50)}
        />
        {tags.length > 50 && <p className="text-xs text-slate-500 text-center pt-2">showing first 50 of {tags.length}</p>}
      </Panel>
    </div>
  )
}

export default Tagging
