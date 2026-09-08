# 📡 CrimeNet API Reference Guide

Base URLs:
- **Core Backend API**: `http://localhost:8080/api/v1`
- **Swagger Documentation**: `http://localhost:8080/swagger-ui.html`
- **Python AI Microservice**: `http://localhost:8000/api/ai`
- **AI OpenAPI Docs**: `http://localhost:8000/docs`

---

## 1. Document Analysis Pipeline (Spring Boot)

### `POST /api/v1/analyse`
Upload raw FIR / CDR / Bank Statement documents for parsing and relation generation.
- **Content-Type**: `multipart/form-data`
- **Parameter**: `file` (PDF, DOCX, TXT, CSV)
- **Response**:
```json
{
  "status": "success",
  "sourceFile": "FIR_Case_102.pdf",
  "entitiesFound": 12,
  "relationsFound": 8,
  "highRiskFlagged": 3,
  "entities": [...],
  "relations": [...],
  "summary": {
    "persons": 5,
    "organizations": 2,
    "locations": 3,
    "phones": 2,
    "vehicles": 0
  }
}
```

---

## 2. Graph & Network

### `GET /api/v1/graph`
Returns complete D3-formatted force directed graph data.
```json
{
  "nodes": [
    {
      "id": "ext_p_1",
      "name": "Vikram Sethi",
      "type": "Person",
      "role": "Financier",
      "risk": "high",
      "confidence": 0.92
    }
  ],
  "links": [
    {
      "id": "rel_1",
      "source": "ext_p_1",
      "target": "ext_p_2",
      "type": "financial",
      "strength": "strong",
      "label": "Hawala transfer"
    }
  ],
  "nodeCount": 1,
  "edgeCount": 1
}
```

---

## 3. Case Management

### `GET /api/v1/cases`
Returns all investigation files ordered by creation date.

### `POST /api/v1/cases`
Creates a new investigation case.
```json
{
  "title": "Operation Coastal Storm",
  "description": "Cross-border smuggling network investigation",
  "investigator": "Insp. R. Sharma",
  "department": "Crime Branch",
  "risk": "high",
  "status": "active"
}
```

---

## 4. AI NLP Microservice (Python)

### `POST /api/ai/analyse-file`
Processes files with deep NER (Indian phone regex, license plates, role context inference).

### `POST /api/ai/analyse-text`
Direct text analysis for suspect co-occurrences, gang syndicate clustering, and risk scoring.
