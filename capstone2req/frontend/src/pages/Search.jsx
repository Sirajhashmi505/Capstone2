import React, { useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { Panel, Tag, Btn } from '../components/Panel'
import JobConsole from '../components/JobConsole'
import { runPipeline, searchInsights } from '../api'

function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [topK, setTopK] = useState(5)
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [building, setBuilding] = useState(false)
  const [jobId, setJobId] = useState(null)

  const handleBuildIndex = async () => {
    setBuilding(true)
    try {
      const res = await runPipeline(null, false, ['index'])
      setJobId(res.data.job_id)
    } catch (e) {
      alert(e.response?.data?.detail || 'Error starting index job')
    } finally {
      setBuilding(false)
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setSearched(true)
    try {
      const res = await searchInsights(query, topK)
      setResults(res.data.results || [])
    } catch (e) {
      if (e.response?.data?.detail?.includes('empty')) alert('Build the search index first')
    } finally {
      setSearching(false)
    }
  }

  const scoreTone = (score) => score > 0.7 ? 'good' : score > 0.4 ? 'warn' : 'bad'

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Search</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">TF-IDF vector search over the insight corpus</p>
      </div>

      <Panel title="Search index" className="mb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">Rebuild the index as a background job before searching.</p>
          <Btn variant="secondary" onClick={handleBuildIndex} loading={building}>rebuild index</Btn>
        </div>
        {jobId && <div className="mt-3"><JobConsole jobId={jobId} /></div>}
      </Panel>

      <Panel className="mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. pancreatic cancer treatment efficacy"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
            />
          </div>
          <select value={topK} onChange={(e) => setTopK(Number(e.target.value))}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm">
            {[3, 5, 10].map(n => <option key={n} value={n}>{n} results</option>)}
          </select>
          <Btn onClick={handleSearch} loading={searching}><SearchIcon className="w-4 h-4" /> search</Btn>
        </div>
      </Panel>

      {results.length > 0 && (
        <Panel title={`Results (${results.length})`}>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {results.map((r, idx) => (
              <div key={r.insight_id} className="py-3 flex items-start gap-3">
                <span className="mono text-xs text-slate-400 w-5 pt-0.5">{String(idx + 1).padStart(2, '0')}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="mono font-semibold text-sm text-slate-900 dark:text-white">{r.insight_id}</span>
                    <Tag tone="accent">{r.insight?.therapeutic_area}</Tag>
                    <Tag tone="warn">{r.insight?.disease_state}</Tag>
                    <Tag tone={scoreTone(r.score)}>{(r.score * 100).toFixed(1)}% match</Tag>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{r.insight?.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {results.length === 0 && searched && !searching && (
        <Panel className="text-center py-12">
          <p className="text-sm text-slate-500 dark:text-slate-400">No results. Try a different query, or rebuild the index.</p>
        </Panel>
      )}
    </div>
  )
}

export default Search
