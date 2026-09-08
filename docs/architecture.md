# 🏛️ CrimeNet System Architecture

```mermaid
graph TD
    A[Investigator / User] -->|Interacts with UI| B[Frontend - React 18 + D3.js + Vite]
    
    B -->|SPA Static Pages| C[Nginx Reverse Proxy :80]
    C -->|REST /api/v1/*| D[Spring Boot Backend :8080]
    C -->|AI Analysis /api/ai/*| E[Python FastAPI Microservice :8000]

    subgraph Backend Engine [Spring Boot 3.2 + Java 21]
        D --> D1[AnalysisController]
        D --> D2[CaseController]
        D --> D3[Entity & Relationship Repositories]
        D3 --> DB[(H2 In-Memory / MySQL)]
        D1 --> D4[Apache Tika Parser]
    end

    subgraph AI Intelligence Engine [Python 3.14]
        E --> E1[Document Parser - PyPDF / docx]
        E --> E2[Indian Context NER Extractor]
        E --> E3[Relationship & Co-occurrence Detector]
        E --> E4[Risk Classifier & Centrality Engine]
        E --> E5[Syndicate Cluster Detector]
    end

    D -.->|Delegates Deep NLP| E
```

---

## 🛠️ Technology Stack Breakdown

| Layer | Technologies | Role |
|---|---|---|
| **Presentation** | React 18, Vite, D3.js v7, Zustand, Lucide Icons | Responsive Dark-Mode Intelligence Workstation |
| **Application Layer** | Spring Boot 3.2, Java 21, Spring Data JPA, Springdoc OpenAPI | Persistent case management, transactional data integrity |
| **AI NLP Service** | Python 3.14, FastAPI, Uvicorn, PyPDF, python-docx, Regex | Indian phone formats, vehicle registration NER, syndicate clustering |
| **Persistence** | H2 in-memory (dev) / MySQL compatible (prod) | Entity, relationship, and case storage |
| **Containerization** | Docker, Docker Compose, Nginx Alpine | One-click production deployment across servers |
