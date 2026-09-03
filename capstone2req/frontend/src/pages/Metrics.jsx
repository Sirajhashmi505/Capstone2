import React, { useState, useEffect, useRef } from 'react'
import { Download, Upload, AlertTriangle } from 'lucide-react'
import { Panel, StatTile, Tag, Btn, DataTable } from '../components/Panel'
import { getMetrics, exportGroundTruthTemplate, compareGroundTruth } from '../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

function barColor(accuracy) {
  if (accuracy >= 80) return '#0e7a6c'
  if (accuracy >= 60) return '#d69e2e'
  return '#be123c'
}

function Metrics() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [comparisonResult, setComparisonResult] = useState(null)
  const [exportLimit, setExportLimit] = useState(100)
  const fileInputRef = useRef(null)

  useEffect(() => { fetchMetrics() }, [])

  const fetchMetrics = async () => {
    try {
      const res = await getMetrics()
      setMetrics(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleExportTemplate = async () => {
    setExporting(true)
    try {
      const response = await exportGroundTruthTemplate(exportLimit)
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ground_truth_template.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('Error exporting template')
    } finally {
      setExporting(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    setComparing(true)
    setComparisonResult(null)
    try {
      const res = await compareGroundTruth(file)
      setComparisonResult(res.data)
    } catch (e) {
      alert(e.response?.data?.detail || 'Error comparing ground truth')
    } finally {
      setComparing(false)
      event.target.value = ''
    }
  }

  const precision = metrics?.precision || 0
  const precisionTone = precision >= 80 ? 'good' : precision >= 60 ? 'warn' : 'bad'

  const comparisonChartData = comparisonResult?.label_accuracy
    ? Object.entries(comparisonResult.label_accuracy).map(([label, data]) => ({ name: label.replace(/_/g, ' '), accuracy: data.accuracy }))
    : []

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Metrics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">AI tagging accuracy vs. ground truth &amp; human review precision</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatTile label="Total Tagged" value={metrics?.total_tagged ?? '—'} />
        <StatTile label="Verified" value={metrics?.total_verified ?? '—'} tone="good" />
        <StatTile label="Corrections" value={metrics?.total_corrections ?? '—'} tone="warn" />
        <StatTile label="Precision" value={`${precision.toFixed(1)}%`} tone={precisionTone} />
      </div>

      <Panel title="Ground truth comparison" className="mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="border border-slate-300 dark:border-slate-700 p-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">1. Export template</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Download a CSV of insight IDs, label manually.</p>
            <div className="flex items-center gap-2">
              <select value={exportLimit} onChange={(e) => setExportLimit(Number(e.target.value))}
                className="px-2 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm">
                {[25, 50, 100, 150, 200, 250].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <Btn variant="secondary" size="sm" onClick={handleExportTemplate} loading={exporting}>
                <Download className="w-3.5 h-3.5" /> export
              </Btn>
            </div>
          </div>
          <div className="border border-slate-300 dark:border-slate-700 p-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">2. Upload &amp; compare</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Upload the filled CSV to score AI predictions against it.</p>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            <Btn size="sm" onClick={() => fileInputRef.current?.click()} loading={comparing}>
              <Upload className="w-3.5 h-3.5" /> upload csv
            </Btn>
          </div>
        </div>

        {comparisonResult && (
          <div className="border-t border-slate-300 dark:border-slate-700 pt-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-sm text-slate-500">{comparisonResult.total_compared} ground truth records compared</p>
              <Tag tone={comparisonResult.overall_accuracy >= 80 ? 'good' : comparisonResult.overall_accuracy >= 60 ? 'warn' : 'bad'}>
                overall {comparisonResult.overall_accuracy}%
              </Tag>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="label-caps mb-2">Accuracy per label</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={comparisonChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="2 2" stroke="#33415530" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 11 }} width={100} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 0, fontSize: 12 }} formatter={(v) => [`${v}%`, 'accuracy']} />
                    <Bar dataKey="accuracy" radius={0}>
                      {comparisonChartData.map((e, i) => <Cell key={i} fill={barColor(e.accuracy)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="label-caps mb-2">Label detail</p>
                <div className="space-y-1 max-h-[280px] overflow-y-auto">
                  {Object.entries(comparisonResult.label_accuracy).map(([label, data]) => (
                    <div key={label} className="flex items-center justify-between px-2 py-1.5 border border-slate-200 dark:border-slate-700 text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{label.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <span className="mono text-xs text-slate-500">{data.correct}/{data.total}</span>
                        <Tag tone={data.accuracy >= 80 ? 'good' : data.accuracy >= 60 ? 'warn' : 'bad'}>{data.accuracy}%</Tag>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {comparisonResult.mismatches?.length > 0 && (
              <div className="mt-5">
                <p className="label-caps mb-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> mismatches ({comparisonResult.mismatches.length})</p>
                <DataTable
                  rowKey={(r, i) => `${r.insight_id}-${r.label}`}
                  columns={[
                    { key: 'insight_id', label: 'ID', render: (r) => <span className="mono">{r.insight_id}</span> },
                    { key: 'label', label: 'Label', render: (r) => r.label.replace(/_/g, ' ') },
                    { key: 'ground_truth', label: 'Ground truth', render: (r) => <Tag tone="good">{r.ground_truth || '-'}</Tag> },
                    { key: 'ai_prediction', label: 'AI prediction', render: (r) => <Tag tone="bad">{r.ai_prediction || '-'}</Tag> },
                  ]}
                  rows={comparisonResult.mismatches.slice(0, 10)}
                />
              </div>
            )}
          </div>
        )}
      </Panel>

      <Panel title="What these mean" className="mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="border border-slate-200 dark:border-slate-700 p-3">
            <p className="font-semibold text-slate-900 dark:text-white mb-1">Human review precision</p>
            <p className="text-slate-500 dark:text-slate-400">Share of AI tags accepted without correction during review.</p>
            <p className="mono text-xs text-accent-700 dark:text-accent-400 mt-1">(verified − corrections) / verified × 100</p>
          </div>
          <div className="border border-slate-200 dark:border-slate-700 p-3">
            <p className="font-semibold text-slate-900 dark:text-white mb-1">Ground truth accuracy</p>
            <p className="text-slate-500 dark:text-slate-400">Match rate between AI predictions and manually labeled data.</p>
            <p className="mono text-xs text-accent-700 dark:text-accent-400 mt-1">matching labels / total labels × 100</p>
          </div>
        </div>
      </Panel>

      <Panel title="Analysis notes">
        <textarea
          placeholder="e.g. the model confuses SI-02 and SI-04 when insights mention both access barriers and differentiation..."
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm resize-none"
          rows={4}
        />
      </Panel>
    </div>
  )
}

export default Metrics
