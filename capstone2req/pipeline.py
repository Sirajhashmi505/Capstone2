"""
Unified pipeline orchestrator for the Medical Insights Engine.

The original workflow exposed three separate, blocking actions that a user
had to trigger one at a time from the UI: "tag all", "generate all persona
summaries", and "build search index". This module replaces that with a
single orchestrated pipeline (tag -> persona -> index) that runs in a
background thread. Callers get a job_id back immediately from
`run_pipeline_async` and poll `get_job(job_id)` for live progress instead of
blocking on one long HTTP request.

For a single insight, `analyze_insight` runs tag + persona generation
together as one synchronous call, since that's fast enough not to need a
background job.
"""
import threading
import time
import uuid

import database
import taxonomy_tagger
import persona_generator
import vector_store

_JOBS = {}
_LOCK = threading.Lock()
_MAX_JOBS = 50  # keep the in-memory job log bounded


def _create_job(kind: str, total: int) -> str:
    job_id = uuid.uuid4().hex[:10]
    with _LOCK:
        _JOBS[job_id] = {
            'job_id': job_id,
            'kind': kind,
            'status': 'queued',
            'total': total,
            'completed': 0,
            'log': [],
            'error': None,
            'started_at': time.time(),
            'finished_at': None,
        }
        if len(_JOBS) > _MAX_JOBS:
            oldest_id = min(_JOBS, key=lambda k: _JOBS[k]['started_at'])
            if oldest_id != job_id:
                del _JOBS[oldest_id]
    return job_id


def _log(job_id: str, line: str):
    with _LOCK:
        job = _JOBS.get(job_id)
        if job is not None:
            job['log'].append(line)


def _set(job_id: str, **fields):
    with _LOCK:
        job = _JOBS.get(job_id)
        if job is not None:
            job.update(fields)


def get_job(job_id: str):
    return _JOBS.get(job_id)


def list_jobs(limit: int = 20):
    with _LOCK:
        jobs = sorted(_JOBS.values(), key=lambda j: j['started_at'], reverse=True)
    return jobs[:limit]


def analyze_insight(insight_id: str) -> dict:
    """Tag one insight and generate its persona summaries in a single call."""
    insight = database.get_insight_by_id(insight_id)
    if insight is None:
        raise ValueError(f"Insight not found: {insight_id}")

    tags = taxonomy_tagger.tag_single_insight(insight_id)
    personas = persona_generator.generate_summaries_for_insight(insight_id)
    return {'insight_id': insight_id, 'tags': tags, 'personas': personas}


VALID_STEPS = ('tag', 'persona', 'index')


def run_pipeline_async(limit=None, skip_done: bool = True, steps=None) -> str:
    """Kick off the tag -> persona -> index pipeline in the background."""
    steps = [s for s in (steps or list(VALID_STEPS)) if s in VALID_STEPS]
    if not steps:
        steps = list(VALID_STEPS)

    job_id = _create_job('pipeline', total=len(steps))
    thread = threading.Thread(target=_run_job, args=(job_id, limit, skip_done, steps), daemon=True)
    thread.start()
    return job_id


def _run_job(job_id: str, limit, skip_done: bool, steps: list):
    _set(job_id, status='running')
    try:
        for step in steps:
            if step == 'tag':
                _log(job_id, f"tag: scanning insights (limit={limit or 'all'}, skip_tagged={skip_done})...")
                result = taxonomy_tagger.tag_all_insights(limit=limit, skip_tagged=skip_done)
                _log(job_id, f"tag: {result['success']} tagged, {result['failed']} failed, {result['total']} scanned")

            elif step == 'persona':
                _log(job_id, f"persona: generating summaries (limit={limit or 'all'}, skip_generated={skip_done})...")
                result = persona_generator.generate_all_summaries(limit=limit, skip_generated=skip_done)
                _log(job_id, f"persona: {result['success']} generated, {result['failed']} failed, {result['total']} scanned")

            elif step == 'index':
                _log(job_id, "index: rebuilding search index...")
                store = vector_store.build_vector_store()
                _log(job_id, f"index: {store.get_index_size()} documents indexed")

            with _LOCK:
                _JOBS[job_id]['completed'] += 1

        _set(job_id, status='done', finished_at=time.time())
        _log(job_id, "pipeline complete.")
    except Exception as e:
        _set(job_id, status='failed', error=str(e), finished_at=time.time())
        _log(job_id, f"pipeline failed: {e}")
