from typing import List, Dict, Any
from collections import defaultdict

def detect_clusters(entities: List[Dict[str, Any]], relationships: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Groups entities into criminal syndicates / sub-networks using
    Connected Components / BFS clustering.
    """
    adj = defaultdict(list)
    for r in relationships:
        src = r.get("source")
        tgt = r.get("target")
        if src and tgt:
            adj[src].append(tgt)
            adj[tgt].append(src)

    visited = set()
    clusters = []
    cluster_id = 1

    for ent in entities:
        nid = ent["id"]
        if nid not in visited:
            # Run BFS for this cluster
            queue = [nid]
            visited.add(nid)
            component_nodes = []

            while queue:
                curr = queue.pop(0)
                component_nodes.append(curr)
                for neighbor in adj[curr]:
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)

            # Map back to entities
            cluster_entities = [e for e in entities if e["id"] in component_nodes]
            high_risk_count = sum(1 for e in cluster_entities if e.get("risk") == "high")

            clusters.append({
                "clusterId": f"syndicate_{cluster_id}",
                "name": f"Syndicate Cell {cluster_id}",
                "size": len(cluster_entities),
                "highRiskCount": high_risk_count,
                "threatLevel": "CRITICAL" if high_risk_count > 0 else "ELEVATED",
                "memberIds": component_nodes
            })
            cluster_id += 1

    return clusters
