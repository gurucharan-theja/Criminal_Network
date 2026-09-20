package com.sih.criminalnetwork.dto;

import com.sih.criminalnetwork.model.Relationship;

/**
 * RelationshipDTO — clean API response shape for a network edge.
 * Uses 'source' and 'target' as node IDs so D3 can wire links directly.
 */
public class RelationshipDTO {

    public String id;          // edgeId
    public String source;      // source entity nodeId
    public String target;      // target entity nodeId
    public String type;        // associate | financial | communication | family
    public String strength;    // strong | medium | weak
    public String label;
    public Double confidence;
    public String evidence;
    public String sourceFile;
    public String firstSeen;
public String lastSeen;
public String createdAt;
public String updatedAt;

    /** Convert JPA Relationship → RelationshipDTO */
    public static RelationshipDTO from(Relationship r) {
        RelationshipDTO dto = new RelationshipDTO();
        dto.id         = r.getEdgeId();
        dto.source     = r.getSource() != null ? r.getSource().getNodeId() : null;
        dto.target     = r.getTarget() != null ? r.getTarget().getNodeId() : null;
        dto.type       = r.getType()     != null ? r.getType().name()     : null;
        dto.strength   = r.getStrength() != null ? r.getStrength().name() : null;
        dto.label      = r.getLabel();
        dto.confidence = r.getConfidence();
        dto.evidence   = r.getEvidence();
        dto.sourceFile = r.getSourceFile();
dto.sourceFile = r.getSourceFile();
dto.firstSeen = r.getFirstSeen() != null
        ? r.getFirstSeen().toString()
        : null;

dto.lastSeen = r.getLastSeen() != null
        ? r.getLastSeen().toString()
        : null;

dto.createdAt = r.getCreatedAt() != null
        ? r.getCreatedAt().toString()
        : null;

dto.updatedAt = r.getUpdatedAt() != null
        ? r.getUpdatedAt().toString()
        : null;

return dto;
        
    }
}
