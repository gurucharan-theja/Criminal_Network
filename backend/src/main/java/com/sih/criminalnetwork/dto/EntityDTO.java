package com.sih.criminalnetwork.dto;

import com.sih.criminalnetwork.model.Entity;

/**
 * EntityDTO — clean API response shape for a single entity/node.
 * Decouples the JPA model from what the frontend receives.
 */
public class EntityDTO {

    public String  id;           // nodeId (used as D3 node id)
    public String  name;
    public String  type;
    public String  role;
    public String  risk;
    public String  status;
    public String  location;
    public String  bio;
    public String  avatar;
    public Integer connections;
    public Integer financialLinks;
    public Double  confidence;
    public String  sourceFile;
    public String  firstSeen;
    public String  lastSeen;

    /** Convert JPA Entity → EntityDTO */
    public static EntityDTO from(Entity e) {
        EntityDTO dto = new EntityDTO();
        dto.id            = e.getNodeId();
        dto.name          = e.getName();
        dto.type          = e.getType()   != null ? e.getType().name()   : null;
        dto.role          = e.getRole();
        dto.risk          = e.getRisk()   != null ? e.getRisk().name()   : null;
        dto.status        = e.getStatus() != null ? e.getStatus().name() : null;
        dto.location      = e.getLocation();
        dto.bio           = e.getBio();
        dto.avatar        = e.getAvatar();
        dto.connections   = e.getConnections();
        dto.financialLinks= e.getFinancialLinks();
        dto.confidence    = e.getConfidence();
        dto.sourceFile    = e.getSourceFile();
        dto.firstSeen     = e.getFirstSeen() != null ? e.getFirstSeen().toString() : null;
        dto.lastSeen      = e.getLastSeen()  != null ? e.getLastSeen().toString()  : null;
        return dto;
    }
}
