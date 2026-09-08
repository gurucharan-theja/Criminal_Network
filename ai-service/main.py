import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from extractors.document_parser import parse_document
from extractors.entity_extractor import extract_entities
from extractors.relationship_extractor import detect_relationships
from classifiers.risk_classifier import score_risk
from classifiers.cluster_detector import detect_clusters

app = FastAPI(
    title="CrimeNet AI Intelligence Engine",
    description="NLP & Criminal Syndicate Network Detection Microservice for Indian Law Enforcement",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextAnalysisRequest(BaseModel):
    text: str
    source: Optional[str] = "direct_input"

@app.get("/")
def root():
    return {
        "service": "CrimeNet AI Microservice",
        "status": "online",
        "version": "1.0.0",
        "endpoints": ["/api/ai/analyse-file", "/api/ai/analyse-text", "/api/ai/health"]
    }

@app.get("/api/ai/health")
def health():
    return {"status": "healthy", "engine": "Python 3.14 NLP"}

@app.post("/api/ai/analyse-text")
def analyse_text(req: TextAnalysisRequest):
    raw_text = req.text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Empty text provided")

    entities = extract_entities(raw_text, req.source)
    relationships = detect_relationships(entities, raw_text, req.source)

    for ent in entities:
        score_risk(ent, relationships, raw_text)

    clusters = detect_clusters(entities, relationships)

    return {
        "status": "success",
        "entitiesFound": len(entities),
        "relationsFound": len(relationships),
        "clustersFound": len(clusters),
        "entities": entities,
        "relations": relationships,
        "clusters": clusters
    }

@app.post("/api/ai/analyse-file")
async def analyse_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        raw_text = parse_document(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse document: {str(e)}")

    if not raw_text:
        raise HTTPException(status_code=400, detail="Document contains no readable text")

    entities = extract_entities(raw_text, file.filename)
    relationships = detect_relationships(entities, raw_text, file.filename)

    for ent in entities:
        score_risk(ent, relationships, raw_text)

    clusters = detect_clusters(entities, relationships)

    return {
        "status": "success",
        "filename": file.filename,
        "textPreview": raw_text[:300] + ("..." if len(raw_text) > 300 else ""),
        "entitiesFound": len(entities),
        "relationsFound": len(relationships),
        "clustersFound": len(clusters),
        "entities": entities,
        "relations": relationships,
        "clusters": clusters
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
