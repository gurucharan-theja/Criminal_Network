package com.sih.criminalnetwork.dto;

import java.util.List;

/**
 * GraphDTO — full network graph ready for D3 force simulation.
 * Response shape: { nodes: [...], links: [...], nodeCount, edgeCount }
 */
public class GraphDTO {

    public List<EntityDTO>       nodes;
    public List<RelationshipDTO> links;
    public int                   nodeCount;
    public int                   edgeCount;

    public GraphDTO(List<EntityDTO> nodes, List<RelationshipDTO> links) {
        this.nodes     = nodes;
        this.links     = links;
        this.nodeCount = nodes.size();
        this.edgeCount = links.size();
    }
}
