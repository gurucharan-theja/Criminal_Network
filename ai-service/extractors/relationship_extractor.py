import re
from typing import List, Dict, Any

RELATION_TRIGGERS = {
    "financial": [
        "transferred", "paid", "hawala", "account", "received amount", "crore", "lakh", "cash",
        "laundered", "invested", "loan", "bribe", "transaction"
    ],
    "communication": [
        "called", "messaged", "intercepted", "call detail", "sms", "whatsapp", "signal",
        "phone", "contacted", "frequency", "cdr"
    ],
    "family": [
        "brother", "sister", "son", "father", "mother", "wife", "husband", "relative",
        "cousin", "daughter", "in-law"
    ],
    "associate": [
        "spotted with", "met", "conspired", "gang", "co-accused", "accomplice", "syndicate",
        "partner", "traveled with", "hired by", "working under"
    ]
}

def detect_relationships(entities: List[Dict[str, Any]], text: str, filename: str = "document") -> List[Dict[str, Any]]:
    """
    Infers edges between entities based on co-occurrence in sentence windows
    and context keywords (financial, communication, family, associate).
    """
    relationships: List[Dict[str, Any]] = []
    edge_counter = 1
    
    # Pre-tokenize sentences/paragraphs
    sentences = re.split(r'[\r\n.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

    for i in range(len(entities)):
        for j in range(i + 1, len(entities)):
            e1 = entities[i]
            e2 = entities[j]

            name1 = e1["name"]
            name2 = e2["name"]

            # Look for co-occurrence in sentences
            for sent in sentences:
                s_lower = sent.lower()
                has_e1 = name1.lower() in s_lower
                has_e2 = name2.lower() in s_lower

                if has_e1 and has_e2:
                    # Co-occurrence found, determine edge type
                    rel_type = "associate"
                    strength = "medium"
                    label = "Associated with"

                    for r_type, triggers in RELATION_TRIGGERS.items():
                        matched_triggers = [t for t in triggers if t in s_lower]
                        if matched_triggers:
                            rel_type = r_type
                            if r_type == "financial":
                                label = f"Funds flow ({matched_triggers[0]})"
                                strength = "strong"
                            elif r_type == "communication":
                                label = "Call/Message Link"
                                strength = "medium"
                            elif r_type == "family":
                                label = f"Family ({matched_triggers[0]})"
                                strength = "strong"
                            else:
                                label = "Co-conspirator"
                                strength = "medium"
                            break

                    relationships.append({
                        "id": f"rel_{edge_counter}",
                        "source": e1["id"],
                        "target": e2["id"],
                        "type": rel_type,
                        "strength": strength,
                        "label": label,
                        "confidence": 0.86,
                        "evidence": sent[:160],
                        "sourceFile": filename
                    })
                    edge_counter += 1
                    break

    return relationships
