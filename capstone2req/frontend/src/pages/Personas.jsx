import React, { useState, useEffect } from 'react'
import { Panel, Btn } from '../components/Panel'
import JobConsole from '../components/JobConsole'
import { getInsights, getPersonaSummaries, runPipeline } from '../api'

const PERSONAS = [
  { key: 'clinician', label: 'Clinician', desc: 'patient care & treatment decisions' },
  { key: 'medical_scientist', label: 'Medical Scientist', desc: 'evidence, mechanisms, data gaps' },
  { key: 'commercial', label: 'Commercial', desc: 'market positioning & competitive value' },
]

function Personas() {
  const [insights, setInsights] = useState([])
  const [selectedInsight, setSelectedInsight] = useState('')
  const [summaries, setSummaries] = useState(null)
  const [originalText, setOriginalText] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => { fetchInsights() }, [])

  const fetchInsights = async () => {
    try {
      const res = await getInsights()
      setInsights(res.data.insights || [])
      if (res.data.insights?.length > 0) setSelectedInsight(res.data.insights[0].insight_id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // GET /api/personas/{id} generates on the fly if summaries don't exist yet —
  // there's no separate "generate" call to make from here.
  const handleView = async () => {
    setViewing(true)
    setSummaries(null)
    try {
      const res = await getPersonaSummaries(selectedInsight)
      setSummaries(res.data.summaries || {})
      setOriginalText(res.data.original_text || '')
    } catch (e) {
      alert(e.response?.data?.detail || 'Could not load summaries')
    } finally {
      setViewing(false)
    }
  }

  const handleRunPersonaOnly = async () => {
    setStarting(true)
    try {
      const res = await runPipeline(null, true, ['persona'])
      setJobId(res.data.job_id)
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to start')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Personas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Same insight, re-explained for three different audiences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {PERSONAS.map((p) => (
          <Panel key={p.key}>
            <p className="font-semibold text-sm text-slate-900 dark:text-white">{p.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{p.desc}</p>
          </Panel>
        ))}
      </div>

      <Panel title="Batch generate" className="mb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate summaries for every insight missing them, as a background job.</p>
          <Btn variant="secondary" onClick={handleRunPersonaOnly} loading={starting}>run persona job</Btn>
        </div>
        {jobId && <div className="mt-3"><JobConsole jobId={jobId} /></div>}
      </Panel>

      <Panel title="View one insight" className="mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={selectedInsight} onChange={(e) => setSelectedInsight(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          >
            {insights.map((i) => <option key={i.insight_id} value={i.insight_id}>{i.insight_id} — {i.disease_state}</option>)}
          </select>
          <Btn onClick={handleView} loading={viewing}>view summaries</Btn>
        </div>
      </Panel>

      {summaries && (
        <div className="space-y-4">
          <Panel title="Original insight">
            <p className="text-sm text-slate-600 dark:text-slate-300 border-l-2 border-slate-300 dark:border-slate-600 pl-3">{originalText}</p>
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {PERSONAS.map(({ key, label }) => (
              <Panel key={key} title={label}>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {summaries[key]?.summary || 'No summary generated yet'}
                </p>
              </Panel>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Personas
