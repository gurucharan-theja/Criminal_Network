from typing import List, Dict, Any

HIGH_RISK_TRIGGERS = [
    "extortion", "narcotics", "hawala", "murder", "arms", "terror", "smuggling",
    "counterfeit", "kidnap", "syndicate", "mafia", "kingpin", "explosive"
]

def score_risk(entity: Dict[str, Any], relationships: List[Dict[str, Any]], raw_text: str = "") -> Dict[str, Any]:
    """
    Computes a risk score (0.0 to 1.0) and assigns high/medium/low risk.
    Factors:
    - Degree centrality (number of connections)
    - Role severity (Kingpin, Financier, Mastermind)
    - High-threat crime keywords in surrounding context
    """
    node_id = entity.get("id")
    score = 0.3  # Base baseline
    
    # 1. Connection count boost
    edge_count = sum(1 for r in relationships if r.get("source") == node_id or r.get("target") == node_id)
    if edge_count >= 5:
        score += 0.35
    elif edge_count >= 2:
        score += 0.20

    # 2. Role severity boost
    role = entity.get("role", "")
    if role in ["Kingpin", "Financier"]:
        score += 0.35
    elif role in ["Operative", "Logistics"]:
        score += 0.20

    # 3. Text contextual keyword matching
    raw_lower = raw_text.lower()
    for trigger in HIGH_RISK_TRIGGERS:
        if trigger in raw_lower:
            score += 0.05

    score = min(score, 0.98)

    risk_level = "low"
    if score >= 0.70:
        risk_level = "high"
    elif score >= 0.45:
        risk_level = "medium"

    entity["risk"] = risk_level
    entity["riskScore"] = round(score, 2)
    entity["connections"] = edge_count
    return entity
