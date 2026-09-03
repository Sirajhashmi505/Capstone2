import React, { useEffect, useRef, useState } from 'react'
import { getJob } from '../api'

/**
 * Polls /api/pipeline/jobs/{jobId} and renders the run as a live console log.
 * This is the primary feedback surface for the unified pipeline — replaces
 * the old spinner + percentage bar pattern.
 */
function JobConsole({ jobId, onSettled }) {
  const [job, setJob] = useState(null)
  const settledRef = useRef(false)
  const logEndRef = useRef(null)

  useEffect(() => {
    if (!jobId) return
    settledRef.current = false
    let cancelled = false

    const poll = async () => {
      try {
        const res = await getJob(jobId)
        if (cancelled) return
        setJob(res.data)
        if (res.data.status === 'done' || res.data.status === 'failed') {
          if (!settledRef.current) {
            settledRef.current = true
            onSettled?.(res.data)
          }
          return
        }
        setTimeout(poll, 1200)
      } catch (e) {
        if (!cancelled) setTimeout(poll, 2000)
      }
    }
    poll()
    return () => { cancelled = true }
  }, [jobId])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'nearest' })
  }, [job?.log?.length])

  if (!jobId) return null

  const status = job?.status || 'queued'
  const pct = job && job.total > 0 ? Math.round((job.completed / job.total) * 100) : 0

  const statusTone = {
    queued: 'text-slate-400',
    running: 'text-accent-500',
    done: 'text-emerald-500',
    failed: 'text-rose-500',
  }[status]

  return (
    <div className="mono bg-slate-950 border border-slate-700 text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 text-slate-400">
        <span>job {jobId}</span>
        <span className={`flex items-center gap-1.5 ${statusTone}`}>
          <span className={`w-1.5 h-1.5 rounded-full bg-current ${status === 'running' ? 'live-dot' : ''}`} />
          {status.toUpperCase()} {job ? `· ${job.completed}/${job.total} (${pct}%)` : ''}
        </span>
      </div>
      <div className="max-h-56 overflow-y-auto px-3 py-2 space-y-0.5">
        {(job?.log || []).length === 0 && (
          <p className="text-slate-500">waiting for pipeline output…</p>
        )}
        {(job?.log || []).map((line, i) => (
          <p key={i} className="text-slate-300 whitespace-pre-wrap">
            <span className="text-slate-600">$ </span>{line}
          </p>
        ))}
        {job?.error && <p className="text-rose-400">error: {job.error}</p>}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}

export default JobConsole
