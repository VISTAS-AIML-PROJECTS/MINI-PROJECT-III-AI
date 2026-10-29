import json
import os
from typing import Any, Dict

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct")

app = FastAPI(title="AI CAD House Builder PRO")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HouseRequest(BaseModel):
    prompt: str
    current_house: Dict[str, Any] | None = None

def _extract_json(raw: str) -> Any:
    """Parse JSON even if the local model adds a markdown fence or short prefix/suffix."""
    text = (raw or "").strip()
    if text.startswith("```"):
        text = text.replace("```json", "", 1).replace("```", "", 1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(text[start:end + 1])
        raise

def _single_floor_house(data: Any) -> Dict[str, Any]:
    if not isinstance(data, dict):
        raise ValueError("Model response was not a JSON object")
    floor_id = "f1"
    walls = []
    for i, w in enumerate(data.get("walls") or []):
        if not isinstance(w, dict):
            continue
        walls.append({
            "id": str(w.get("id") or f"wall{i+1}"),
            "x1": float(w.get("x1", 0)), "z1": float(w.get("z1", 0)),
            "x2": float(w.get("x2", 0)), "z2": float(w.get("z2", 0)),
            "height": float(w.get("height", 3)), "thickness": float(w.get("thickness", 0.14)),
            "floorId": floor_id,
        })
    wall_ids = {w["id"] for w in walls}
    def openings(key, default_width, default_height):
        out=[]
        for i,o in enumerate(data.get(key) or []):
            if not isinstance(o, dict) or str(o.get("wallId")) not in wall_ids:
                continue
            out.append({"id":str(o.get("id") or f"{key[:-1]}{i+1}"),"wallId":str(o["wallId"]),"position":max(0,min(1,float(o.get("position",.5)))),"width":float(o.get("width",default_width)),"height":float(o.get("height",default_height)),"floorId":floor_id})
        return out
    rooms=[]
    for i,r in enumerate(data.get("rooms") or []):
        if isinstance(r,dict):
            rooms.append({"id":str(r.get("id") or f"room{i+1}"),"name":str(r.get("name") or "Room"),"x":float(r.get("x",0)),"z":float(r.get("z",0)),"width":float(r.get("width",3)),"depth":float(r.get("depth",3)),"floorId":floor_id})
    return {
        "width": max(1,float(data.get("width",10))),
        "depth": max(1,float(data.get("depth",8))),
        "walls": walls,
        "doors": openings("doors",.9,2.1),
        "windows": openings("windows",1.2,1.2),
        "rooms": rooms,
        "floors":[{"id":floor_id,"name":"Ground Floor","height":3,"elevation":0}],
        "electrical":[], "plumbing":[]
    }

def ask_ollama(prompt: str, tokens: int = 1200) -> Any:
    payload = {
        "model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "format": "json",
        "keep_alive": "10m", "options": {"temperature": 0.1, "num_predict": tokens, "num_ctx": 4096},
    }
    try:
        r = requests.post(OLLAMA_URL, json=payload, timeout=180)
        r.raise_for_status()
        raw = r.json().get("response", "")
        return _extract_json(raw)
    except requests.Timeout as e:
        raise HTTPException(504, "Ollama timed out after 180 seconds. The model is installed but took too long to answer.") from e
    except requests.RequestException as e:
        raise HTTPException(502, f"Ollama connection error: {e}") from e
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(502, f"Ollama returned unusable JSON: {e}") from e

@app.get("/")
def root():
    return {"name":"AI CAD House Builder PRO","status":"running","mode":"single-floor"}

@app.get("/health")
def health():
    try:
        r=requests.get("http://127.0.0.1:11434/api/tags",timeout=5)
        models=[m.get("name") for m in r.json().get("models",[])] if r.ok else []
        return {"backend":"ok","ollama":r.ok,"model":OLLAMA_MODEL,"model_installed":OLLAMA_MODEL in models}
    except Exception as e:
        return {"backend":"ok","ollama":False,"model":OLLAMA_MODEL,"model_installed":False,"error":str(e)}

@app.post("/generate")
def generate(req: HouseRequest):
    prompt=f"""You are a single-floor residential architectural CAD assistant.
Create ONLY ONE GROUND FLOOR. Never create a second floor, staircase, elevation, or multi-storey structure.
Return ONLY valid JSON matching this schema:
{{
 "width": number, "depth": number,
 "walls":[{{"id":string,"x1":number,"z1":number,"x2":number,"z2":number,"height":number,"thickness":number}}],
 "doors":[{{"id":string,"wallId":string,"position":number,"width":number,"height":number}}],
 "windows":[{{"id":string,"wallId":string,"position":number,"width":number,"height":number,"sill":number}}],
 "rooms":[{{"id":string,"name":string,"x":number,"z":number,"width":number,"depth":number}}]
}}
Rules: use meters; create a closed outer rectangle; every consecutive outer wall endpoint must exactly match; interior walls must connect to existing wall endpoints or other walls; all opening wallIds must exist; positions are 0..1; keep openings inside their wall lengths; keep rooms inside the footprint.
User request: {req.prompt}"""
    return _single_floor_house(ask_ollama(prompt, 1000))

@app.post("/modify")
def modify(req: HouseRequest):
    if not req.current_house: raise HTTPException(400,"current_house is required")
    prompt=f"""Modify this SINGLE-FLOOR house according to the instruction. Never add another floor. Return the COMPLETE JSON in the same schema as the current house. Preserve valid geometry unless requested otherwise.
Instruction: {req.prompt}
Current house:
{json.dumps(req.current_house)}"""
    return _single_floor_house(ask_ollama(prompt, 1200))

@app.post("/analyze")
def analyze(req: HouseRequest):
    if not req.current_house: raise HTTPException(400,"current_house is required")
    prompt=f"""Analyze this single-floor house. Return JSON only: {{"summary":"...","issues":["..."],"suggestions":["..."]}}. Do not invent dimensions. House:
{json.dumps(req.current_house)}"""
    return ask_ollama(prompt, 700)
