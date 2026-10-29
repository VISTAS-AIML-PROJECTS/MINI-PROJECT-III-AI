# AI CAD House Builder — Single-Floor Edition

This edition intentionally supports **one ground floor only**. Multi-floor generation and floor switching have been removed to keep the geometry model reliable.

## Run

### Backend
```powershell
cd backend
# 1. Create Python virtual environment (if not already created)
python -m venv .venv

# 2. Activate virtual environment
.venv\Scripts\activate

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Start backend server
uvicorn main:app --reload --port 8000
```

### Frontend
```powershell
cd frontend
# 1. Install frontend packages (Vite & React Three Fiber)
npm install --legacy-peer-deps

# 2. Start frontend dev server
npm run dev
```

### Ollama
Install/start Ollama and make sure this model exists:
```text
qwen2.5:7b-instruct
```

Check:
```powershell
curl http://127.0.0.1:11434/api/tags
```

Open `http://localhost:5173/`.

## Single-floor test prompt

`Create a simple single-floor 2BHK house with a living room, kitchen, 2 bedrooms, 1 bathroom, 1 main door and 4 windows.`

## Main improvements
- AI output is normalized into one Ground Floor.
- Extra floor data from the model is ignored.
- More tolerant JSON extraction handles fenced/prefixed JSON.
- Ollama timeout is reported separately as HTTP 504.
- `/health` reports whether the configured model is actually installed.
- Frontend no longer exposes multi-floor controls.
- Existing 3D, 2D, electrical, plumbing, cost, save/load and export tools remain.

The electrical/plumbing modules are layout planners, not engineering calculation systems. Cost output is indicative. DXF is a basic geometry export.
