package com.sih.criminalnetwork.dto;

import java.util.List;
import java.util.Map;

/**
 * AnalysisResultDTO — response returned after POST /api/v1/analyse.
 * Contains extracted entities, detected relationships, and a summary.
 */
public class AnalysisResultDTO {

    public String                status;         // "success" | "error"
    public String                sourceFile;
    public int                   entitiesFound;
    public int                   relationsFound;
    public long                  highRiskFlagged;
    public List<EntityDTO>       entities;
    public List<RelationshipDTO> relations;
    public Map<String, Long>     summary;        // { persons, organizations, locations, phones, vehicles }

    // ── Builder ────────────────────────────────────────────────
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final AnalysisResultDTO dto = new AnalysisResultDTO();

        public Builder status(String v)                       { dto.status = v;          return this; }
        public Builder sourceFile(String v)                   { dto.sourceFile = v;      return this; }
        public Builder entitiesFound(int v)                   { dto.entitiesFound = v;   return this; }
        public Builder relationsFound(int v)                  { dto.relationsFound = v;  return this; }
        public Builder highRiskFlagged(long v)                { dto.highRiskFlagged = v; return this; }
        public Builder entities(List<EntityDTO> v)            { dto.entities = v;        return this; }
        public Builder relations(List<RelationshipDTO> v)     { dto.relations = v;       return this; }
        public Builder summary(Map<String, Long> v)           { dto.summary = v;         return this; }
        public AnalysisResultDTO build()                      { return dto; }
    }
}
