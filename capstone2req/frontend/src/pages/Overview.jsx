import React, { useState, useEffect } from 'react'
import { Panel, StatTile, Tag, Btn, DataTable } from '../components/Panel'
import JobConsole from '../components/JobConsole'
import { getSummary, getInsights, runPipeline } from '../api'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const SLICE_COLORS = ['#0e7a6c', '#149984', '#2fb89e', '#5fd3bb', '#96e8d4', '#c9f5ea']

const STEP_OPTIONS = [
  { key: 'tag', label: 'Tag' },
  { key: 'persona', label: 'Persona' },
  { key: 'index', label: 'Index' },
]

function Overview() {
  const [summary, setSummary] = useState(null)
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState('')
  const [skipDone, setSkipDone] = useState(true)
  const [steps, setSteps] = useState(['tag', 'persona', 'index'])
  const [jobId, setJobId] = useState(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [summaryRes, insightsRes] = await Promise.all([getSummary(), getInsights()])
      setSummary(summaryRes.data)
      setInsights(insightsRes.data.insights || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggleStep = (key) => {
    setSteps((prev) => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key])
  }

  const handleRun = async () => {
    setStarting(true)
    try {
      const res = await runPipeline(limit ? parseInt(limit) : null, skipDone, steps)
      setJobId(res.data.job_id)
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to start pipeline')
    } finally {
      setStarting(false)
    }
  }

  const pieData = summary?.si_distribution
    ? Object.entries(summary.si_distribution).map(([name, value]) => ({ name: name.slice(0, 28), value }))
    : []

  const areaCounts = insights.reduce((acc, i) => {
    acc[i.therapeutic_area] = (acc[i.therapeutic_area] || 0) + 1
    return acc
  }, {})
  const barData = Object.entries(areaCounts).map(([name, count]) => ({ name, count }))

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Medical insight taxonomy tagging &amp; persona reasoning pipeline</p>
        </div>
      </div>

      {/* Stat readouts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatTile label="Total Insights" value={summary?.total_insights ?? '—'} />
        <StatTile label="Tagged" value={summary?.tagged_insights ?? '—'} tone="accent" />
        <StatTile label="Verified" value={summary?.verified_tags ?? '—'} tone="good" />
        <StatTile label="Pending Review" value={summary?.unverified_tags ?? '—'} tone="warn" />
      </div>

      {/* Pipeline runner */}
      <Panel title="Run Pipeline" className="mb-5">
        <div className="flex flex-wrap items-end gap-4 mb-3">
          <div>
            <label className="label-caps block mb-1">Limit</label>
            <input
              type="number" min="1" value={limit} onChange={(e) => setLimit(e.target.value)}
              placeholder="all" className="mono w-24 px-2 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
            />
          </div>
          <div>
            <label className="label-caps block mb-1">Steps</label>
            <div className="flex gap-1">
              {STEP_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleStep(key)}
                  className={`px-2.5 py-1.5 text-xs font-medium border ${
                    steps.includes(key)
                      ? 'bg-accent-700 border-accent-700 text-white'
                      : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 pb-1.5 cursor-pointer">
            <input type="checkbox" checked={skipDone} onChange={(e) => setSkipDone(e.target.checked)} className="w-3.5 h-3.5" />
            <span className="text-sm text-slate-600 dark:text-slate-400">skip already-processed</span>
          </label>
          <Btn onClick={handleRun} loading={starting} disabled={steps.length === 0}>
            Run pipeline
          </Btn>
        </div>
        {jobId && <JobConsole jobId={jobId} onSettled={fetchData} />}
      </Panel>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Panel title="Distribution by Strategic Imperative">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={0} outerRadius={95} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 0, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-16">No tags generated yet</p>}
        </Panel>

        <Panel title="Insights by Therapeutic Area">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="2 2" stroke="#33415530" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 0, fontSize: 12 }} />
                <Bar dataKey="count" fill="#149984" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-16">No insights loaded</p>}
        </Panel>
      </div>

      {/* Recent insights */}
      <Panel title={`Insights (${insights.length})`}>
        <DataTable
          rowKey={(r) => r.insight_id}
          emptyLabel="No insights loaded"
          columns={[
            { key: 'insight_id', label: 'ID', render: (r) => <span className="mono">{r.insight_id}</span> },
            { key: 'therapeutic_area', label: 'Area', render: (r) => <Tag tone="accent">{r.therapeutic_area}</Tag> },
            { key: 'disease_state', label: 'Disease' },
            { key: 'country_code', label: 'Country', render: (r) => <Tag>{r.country_code}</Tag> },
            { key: 'created_date', label: 'Date', render: (r) => r.created_date?.split(' ')[0] },
          ]}
          rows={insights.slice(0, 12)}
        />
      </Panel>
    </div>
  )
}

export default Overview
