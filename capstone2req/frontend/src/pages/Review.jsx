import React, { useState, useEffect } from 'react'
import { CheckCircle2, Pencil, RefreshCw } from 'lucide-react'
import { Panel, Tag, Btn } from '../components/Panel'
import { getTags, getInsights, getLabelOptions, getTaxonomySI, getTaxonomyCSF, verifyTag, correctTag } from '../api'

const LABEL_CONFIG = [
  { key: 'asset', label: 'Asset' },
  { key: 'sentiment', label: 'Sentiment' },
  { key: 'insight_type', label: 'Insight Type' },
  { key: 'topic', label: 'Topic' },
  { key: 'stakeholder', label: 'Stakeholder' },
  { key: 'si_id', label: 'Strategic Imperative' },
  { key: 'csf_id', label: 'CSF' },
  { key: 'source_channel', label: 'Source Channel' },
  { key: 'evidence_gap', label: 'Evidence Gap' },
  { key: 'action_required', label: 'Action Required' },
]

function Review() {
  const [allTags, setAllTags] = useState([])
  const [tags, setTags] = useState([])
  const [insights, setInsights] = useState({})
  const [labelOptions, setLabelOptions] = useState({})
  const [taxonomySI, setTaxonomySI] = useState([])
  const [taxonomyCSF, setTaxonomyCSF] = useState([])
  const [reviewer, setReviewer] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [corrections, setCorrections] = useState({})
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => { fetchData() }, [])
  useEffect(() => {
    setTags(showAll ? allTags : allTags.filter(t => !t.is_verified))
  }, [showAll, allTags])

  const fetchData = async () => {
    try {
      const [tagsRes, insightsRes, optionsRes, siRes, csfRes] = await Promise.all([
        getTags(), getInsights(), getLabelOptions(), getTaxonomySI(), getTaxonomyCSF()
      ])
      setAllTags(tagsRes.data.tags || [])
      const insightsMap = {}
      ;(insightsRes.data.insights || []).forEach(i => { insightsMap[i.insight_id] = i })
      setInsights(insightsMap)
      setLabelOptions(optionsRes.data || {})
      setTaxonomySI(siRes.data.taxonomy_si || [])
      setTaxonomyCSF(csfRes.data.taxonomy_csf || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleVerify = async (insightId) => {
    if (!reviewer) { alert('Enter reviewer name first'); return }
    await verifyTag(insightId, reviewer)
    await fetchData()
  }

  const handleStartEdit = (tag) => {
    setEditingId(tag.insight_id)
    setCorrections(Object.fromEntries(LABEL_CONFIG.map(({ key }) => [key, tag[key] || ''])))
    setReason('')
  }

  const handleSaveCorrection = async (insightId) => {
    if (!reviewer) { alert('Enter reviewer name first'); return }
    if (!reason) { alert('Enter a reason for the correction'); return }
    await correctTag(insightId, corrections, reason, reviewer)
    setEditingId(null)
    setCorrections({})
    setReason('')
    await fetchData()
  }

  const sentimentTone = (s) => ({ Positive: 'good', Negative: 'bad', Neutral: 'default', Mixed: 'warn' }[s] || 'default')

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Review</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Verify or correct AI output · <span className="mono text-accent-700 dark:text-accent-400">{tags.length}</span> {showAll ? 'total' : 'pending'} of {allTags.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-400">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="w-3.5 h-3.5" />
            show all
          </label>
          <Btn variant="secondary" size="sm" onClick={() => { setRefreshing(true); fetchData() }} loading={refreshing}>
            <RefreshCw className="w-3.5 h-3.5" /> refresh
          </Btn>
        </div>
      </div>

      <Panel className="mb-5">
        <div className="flex items-center gap-4">
          <label className="label-caps shrink-0">Reviewer</label>
          <input
            type="text" value={reviewer} onChange={(e) => setReviewer(e.target.value)}
            placeholder="name" className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm max-w-xs"
          />
          {reviewer && <Tag tone="good">signed in as {reviewer}</Tag>}
        </div>
      </Panel>

      {tags.length === 0 ? (
        <Panel className="text-center py-14">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-600" />
          <p className="font-semibold text-slate-900 dark:text-white">Queue clear</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">No unverified tags waiting on review.</p>
        </Panel>
      ) : (
        <div className="space-y-4">
          {tags.map((tag) => {
            const insight = insights[tag.insight_id] || {}
            const isEditing = editingId === tag.insight_id
            return (
              <Panel key={tag.insight_id}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="mono font-semibold text-slate-900 dark:text-white">{tag.insight_id}</span>
                    <Tag tone="accent">{insight.therapeutic_area}</Tag>
                    <Tag tone="warn">{insight.disease_state}</Tag>
                  </div>
                  <div className="flex gap-2">
                    <Btn size="sm" onClick={() => handleVerify(tag.insight_id)}>approve</Btn>
                    <Btn size="sm" variant="secondary" onClick={() => isEditing ? setEditingId(null) : handleStartEdit(tag)}>
                      <Pencil className="w-3.5 h-3.5" /> {isEditing ? 'cancel' : 'edit'}
                    </Btn>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 border-l-2 border-slate-300 dark:border-slate-600 pl-3 mb-3">
                  {insight.description}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                  {LABEL_CONFIG.map(({ key, label }) => (
                    <div key={key} className="border border-slate-200 dark:border-slate-700 p-2">
                      <p className="label-caps mb-1">{label}</p>
                      {isEditing ? (
                        key === 'asset' ? (
                          <input type="text" value={corrections[key] || ''} onChange={(e) => setCorrections({ ...corrections, [key]: e.target.value })}
                            className="w-full px-1.5 py-1 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" placeholder="BI-XXXXXX" />
                        ) : key === 'si_id' ? (
                          <select value={corrections[key] || ''} onChange={(e) => setCorrections({ ...corrections, [key]: e.target.value })}
                            className="w-full px-1.5 py-1 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                            <option value="">—</option>
                            {taxonomySI.map(si => <option key={si.si_id} value={si.si_id}>{si.si_id}</option>)}
                          </select>
                        ) : key === 'csf_id' ? (
                          <select value={corrections[key] || ''} onChange={(e) => setCorrections({ ...corrections, [key]: e.target.value })}
                            className="w-full px-1.5 py-1 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                            <option value="">—</option>
                            {taxonomyCSF.filter(c => c.therapeutic_area === insight.therapeutic_area).map(c => <option key={c.csf_id} value={c.csf_id}>{c.csf_id}</option>)}
                          </select>
                        ) : (
                          <select value={corrections[key] || ''} onChange={(e) => setCorrections({ ...corrections, [key]: e.target.value })}
                            className="w-full px-1.5 py-1 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                            <option value="">—</option>
                            {(labelOptions[key] || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        )
                      ) : (
                        key === 'sentiment'
                          ? <Tag tone={sentimentTone(tag[key])}>{tag[key] || '-'}</Tag>
                          : <p className="text-sm mono text-slate-900 dark:text-white">{tag[key] || '-'}</p>
                      )}
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                    <label className="label-caps block mb-1">Reason for correction</label>
                    <textarea
                      value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="why is this being changed?" rows={2}
                      className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm resize-none"
                    />
                    <Btn size="sm" className="mt-2" onClick={() => handleSaveCorrection(tag.insight_id)}>save correction</Btn>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-500">confidence <span className="mono text-accent-700 dark:text-accent-400">{((tag.confidence_score || 0) * 100).toFixed(0)}%</span></span>
                  {tag.reasoning && <span className="text-slate-500 italic">"{tag.reasoning}"</span>}
                </div>
              </Panel>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Review
