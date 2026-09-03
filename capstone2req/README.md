# AI-Driven Medical Insights Engine

Capstone Project - Track 1: Taxonomy Mapping & Persona Reasoning

A modern web application using **React + FastAPI** for AI-powered medical insights analysis with 10-label extraction.

## Features

- **10-Label Extraction**: AI extracts 10 structured labels from unstructured medical insights
- **Taxonomy Tagging**: Classification against Strategic Imperatives & Critical Success Factors
- **Semantic Search**: Natural language search using a local TF-IDF vector index
- **Human Review**: Verify and correct AI-generated labels with accuracy tracking
- **Persona Summaries**: Generate audience-specific summaries (Clinician, Medical Scientist, Commercial)
- **Unified Pipeline**: Tag → persona → index run as one orchestrated background job with a live status log, instead of three separate manual steps
- **Dark/Light Mode**: Console-style React UI with theme switching
- **Real-time Metrics**: Track AI accuracy and precision

---

## AI-Extracted Labels

The system extracts **10 labels** from each medical insight using Azure OpenAI:

| # | Label | Description | Example Values |
|---|-------|-------------|----------------|
| 1 | `asset` | BI compound code | BI-291984, BI-334219, BI-671290 |
| 2 | `sentiment` | Overall tone of insight | Positive, Negative, Neutral, Mixed |
| 3 | `insight_type` | Nature of the insight | Data Request, Feedback, Concern, Question, Recommendation, Objection |
| 4 | `topic` | Main discussion subject | Efficacy, Safety, Tolerability, Dosing, Access, Differentiation, Evidence, Biomarker |
| 5 | `stakeholder` | Who provided the insight | KOL, Investigator, Site Coordinator, MSL, Payer, HCP, Medical Director, Regulatory |
| 6 | `si_id` | Strategic Imperative | SI-01 to SI-05 |
| 7 | `csf_id` | Critical Success Factor | ONC-CSF-01, OL-CSF-02, etc. |
| 8 | `source_channel` | How insight was collected | Field Visit, Advisory Board, Conference, Email, Call, Meeting |
| 9 | `evidence_gap` | What data/evidence is missing | RWE, Head-to-head, Long-term, Subgroup, Biomarker, Comparative, None |
| 10 | `action_required` | Next step needed | Follow-up, Data Generation, Internal Review, Escalate, None |

### Strategic Imperatives (SI)

| ID | Name |
|----|------|
| SI-01 | Establish Scientific Leadership & Evidence Generation |
| SI-02 | Accelerate Access & Address Unmet Patient Need |
| SI-03 | Strengthen HCP & KOL Engagement Ecosystem |
| SI-04 | Drive Differentiated Value Proposition vs. Competition |
| SI-05 | Enable Sustainable Patient Access & Affordability |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | FastAPI + Python |
| Database | SQLite |
| Vector Store | TF-IDF (scikit-learn, local) |
| LLM | Azure OpenAI (GPT-4) |
| Charts | Recharts |
| Icons | Lucide React |

---

## Project Structure

```
capstone2req/
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Panel.jsx          # Panel / StatTile / Tag / Btn / DataTable
│   │   │   ├── TopNav.jsx         # Top tab bar (replaces the old sidebar)
│   │   │   └── JobConsole.jsx     # Live log for a background pipeline job
│   │   ├── pages/             # Page components
│   │   │   ├── Overview.jsx
│   │   │   ├── Tagging.jsx
│   │   │   ├── Review.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── Personas.jsx
│   │   │   └── Metrics.jsx
│   │   ├── api.js             # API client
│   │   ├── App.jsx            # Main app with routing
│   │   └── index.css          # Tailwind styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/
│   └── main.py                # FastAPI server
├── data/
│   ├── insights_data.csv      # Medical insights (input)
│   ├── taxonomy_si.csv        # Strategic Imperatives
│   ├── taxonomy_csf.csv       # Critical Success Factors
│   ├── data_dictionary.csv    # Field definitions
│   ├── medical_insights.db    # SQLite database (auto-created)
│   └── chroma_store/          # TF-IDF search index (auto-created)
├── config.py                  # Configuration settings
├── database.py                # SQLite operations
├── llm_service.py             # Azure OpenAI integration
├── vector_store.py            # TF-IDF vector store
├── taxonomy_tagger.py         # 10-label extraction logic
├── persona_generator.py       # Persona summary generation
├── pipeline.py                # Unified tag→persona→index job orchestrator
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables
└── .env.example               # Example environment file
```

---

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn
- Azure OpenAI API access

### 1. Clone and Setup

```bash
cd capstone2req
```

### 2. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt
```

### 3. Configure Azure OpenAI

Edit `.env` file with your credentials:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-ada-002

# Database Configuration
DATABASE_PATH=data/medical_insights.db

# ChromaDB Vector Store
CHROMA_PERSIST_DIR=data/chroma_store
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

### 5. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
python main.py
```
Backend runs at: http://localhost:8000

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs at: http://localhost:5173

---

## Workflow

Tagging, persona generation and search indexing are no longer three separate
manual actions — `pipeline.py` orchestrates them as one background job that
the UI kicks off and then polls for live progress (`GET /api/pipeline/jobs/{id}`),
rendered as a scrolling console log rather than a plain progress bar.

```
┌───────────────────────────────────────────────────────────────────────┐
│                    POST /api/pipeline/run  { limit, steps }           │
│                                   │                                    │
│                                   ▼  (background thread, job_id)      │
│   ┌────────┐      ┌──────────┐      ┌───────┐                        │
│   │  tag   │ ───► │ persona  │ ───► │ index │  ──► job status: done   │
│   └────────┘      └──────────┘      └───────┘                        │
│        │                │                │                            │
│        ▼                ▼                ▼                            │
│  insight_tags    persona_summaries   TF-IDF store                     │
└───────────────────────────────────────────────────────────────────────┘

  UI polls GET /api/pipeline/jobs/{job_id} every ~1.2s and streams the
  `log` array into JobConsole until status is "done" or "failed".
```

### Step-by-Step:

1. **Load Data**: CSV files loaded into SQLite on app startup
2. **Run Pipeline** (Overview page): kicks off tag → persona → index as one background job; watch it complete in the live job console
3. **Analyze one insight** (Tagging page): tag + persona generation for a single insight in one synchronous call
4. **Review Labels**: human reviewers verify or correct AI-generated labels
5. **Track Accuracy**: precision calculated from corrections; compare against an uploaded ground-truth CSV
6. **Search**: query the TF-IDF index once it's been built by the pipeline
7. **Personas**: view the three audience-specific summaries per insight (generated on first request if missing)

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/insights` | GET | Get all insights |
| `/api/tags` | GET | Get all tags with 10 labels |
| `/api/tags/verify` | POST | Mark tag as verified |
| `/api/tags/correct` | POST | Save label corrections |
| `/api/label-options` | GET | Get valid values for each label |
| `/api/pipeline/analyze/{id}` | POST | Tag + generate personas for one insight, synchronously |
| `/api/pipeline/run` | POST | Start the tag→persona→index background job, returns `job_id` |
| `/api/pipeline/jobs/{job_id}` | GET | Poll status/progress/log for a job |
| `/api/pipeline/jobs` | GET | List recent jobs |
| `/api/summary` | GET | Get tagging statistics |
| `/api/metrics` | GET | Get accuracy metrics |
| `/api/distributions` | GET | Get label distributions |
| `/api/search` | POST | Semantic search over the TF-IDF index |
| `/api/personas/{id}` | GET | Get persona summaries (generated on demand if missing) |
| `/api/ground-truth/export-template` | GET | Download a CSV template for manual labeling |
| `/api/ground-truth/compare` | POST | Upload filled ground truth, score AI predictions against it |

---

## UI Pages

| Page | Description |
|------|-------------|
| **Overview** | Stat readouts, pipeline runner + live job console, charts, recent insights |
| **Tag** | Analyze a single insight (tag + persona together), or run a tag-only batch job |
| **Review** | Verify labels, make corrections with reasons |
| **Search** | Rebuild the TF-IDF index, then search using natural language |
| **Personas** | Run a persona-only batch job, or view Clinician/Scientist/Commercial summaries per insight |
| **Metrics** | Track AI accuracy, compare against ground truth, view correction history |

---

## Input Data Format

### insights_data.csv

| Column | Description |
|--------|-------------|
| insight_id | Unique identifier (CDO-100001) |
| persona | Role type (Clinical, Medical) |
| created_date | Timestamp |
| therapeutic_area | Oncology, O&L |
| disease_state | Pancreatic cancer, NAFLD, etc. |
| region_ro | MEA, NAR, EUCAN |
| country_code | AE, CA, NL, FR, US |
| description | Unstructured insight text |

### taxonomy_si.csv

| Column | Description |
|--------|-------------|
| si_id | SI-01 to SI-05 |
| si_name | Strategic Imperative name |
| si_description | Full description |

### taxonomy_csf.csv

| Column | Description |
|--------|-------------|
| csf_id | ONC-CSF-01, OL-CSF-01, etc. |
| therapeutic_area | Oncology, O&L |
| csf_name | Critical Success Factor name |
| parent_si_id | Links to SI |
| parent_si_name | Parent SI name |

---

## Deliverables Checklist

- [x] Console-style React UI with dark/light mode
- [x] 10-label AI extraction from insights
- [x] Taxonomy tagging (SI + CSF)
- [x] Accuracy/precision metrics with formula
- [x] Searchable TF-IDF vector store
- [x] Human review/correction workflow
- [x] Three persona-specific summaries
- [x] Label distribution analytics
- [x] Unified background pipeline (tag → persona → index) with live job status

---

## Development

```bash
# Run backend in development (auto-reload)
cd backend && uvicorn main:app --reload --port 8000

# Run frontend in development (hot reload)
cd frontend && npm run dev
```

---

## License

MIT License - Capstone Project 2024
