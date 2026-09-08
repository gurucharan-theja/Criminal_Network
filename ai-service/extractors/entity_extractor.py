import re
from typing import List, Dict, Any

# Regex patterns tailored for Indian law enforcement context
PHONE_PATTERN = re.compile(r'(?:(?:\+91|0)?[6-9]\d{9})')
VEHICLE_PATTERN = re.compile(r'\b[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{4}\b', re.IGNORECASE)
PAN_PATTERN = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b')
AADHAAR_PATTERN = re.compile(r'\b\d{4}\s?\d{4}\s?\d{4}\b')

# Criminal role patterns
ROLE_KEYWORDS = {
    "Kingpin": ["mastermind", "kingpin", "leader", "chief", "boss", "syndicate head", "gang leader"],
    "Operative": ["handler", "courier", "enforcer", "shooter", "operative", "associate", "agent"],
    "Financier": ["hawala", "financier", "investor", "money launderer", "accountant", "treasurer"],
    "Logistics": ["driver", "supplier", "smuggler", "transporter", "arms dealer"],
    "Informant": ["informant", "mole", "tipster", "insider", "source"],
}

LOCATION_KEYWORDS = [
    "Mumbai", "Delhi", "Kolkata", "Chennai", "Bengaluru", "Hyderabad", "Ahmedabad", "Pune",
    "Surat", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
    "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik",
    "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad",
    "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur",
    "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh",
    "Goa", "Dubai", "Kathmandu", "Dhaka", "Colombo", "Karachi", "Bangkok"
]

ORG_KEYWORDS = [
    "Pvt Ltd", "Limited", "Corporation", "Enterprise", "Syndicate", "Logistics",
    "Holdings", "Gang", "Group", "Cartel", "Agency", "Network", "Traders", "Jewellers", "Brothers"
]

def extract_entities(text: str, filename: str = "document") -> List[Dict[str, Any]]:
    """
    Extracts criminal entities:
    - Persons (with detected criminal roles)
    - Indian Phone Numbers
    - Vehicle Registration Numbers (Indian format)
    - Identity & Organizations
    - Locations
    """
    entities: List[Dict[str, Any]] = []
    seen_ids = set()
    node_counter = 1

    # 1. Extract Indian Phone Numbers
    phones = set(PHONE_PATTERN.findall(text))
    for p in phones:
        clean_phone = re.sub(r'\s+', '', p)
        if len(clean_phone) >= 10:
            nid = f"ent_phone_{node_counter}"
            node_counter += 1
            entities.append({
                "id": nid,
                "name": clean_phone,
                "type": "Phone",
                "role": "Communication Endpoint",
                "risk": "medium",
                "status": "active",
                "location": "Telecom Network",
                "confidence": 0.95,
                "sourceFile": filename
            })

    # 2. Extract Indian Vehicles
    vehicles = set(VEHICLE_PATTERN.findall(text))
    for v in vehicles:
        nid = f"ent_veh_{node_counter}"
        node_counter += 1
        entities.append({
            "id": nid,
            "name": v.upper().strip(),
            "type": "Vehicle",
            "role": "Transport Asset",
            "risk": "medium",
            "status": "active",
            "location": "Transit",
            "confidence": 0.90,
            "sourceFile": filename
        })

    # 3. Extract Locations
    for loc in LOCATION_KEYWORDS:
        if re.search(r'\b' + re.escape(loc) + r'\b', text, re.IGNORECASE):
            nid = f"ent_loc_{node_counter}"
            node_counter += 1
            entities.append({
                "id": nid,
                "name": loc,
                "type": "Location",
                "role": "Operational Hub",
                "risk": "low",
                "status": "active",
                "location": loc,
                "confidence": 0.85,
                "sourceFile": filename
            })

    # 4. Extract Persons & Suspect Names with Role Inference
    # Look for honorifics / criminal aliases / name patterns
    person_patterns = [
        re.compile(r'\b(?:Shri|Mr\.|Accused|Suspect|Alias|Gangster)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b'),
        re.compile(r'\b([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:alias|@)\s+([A-Z][a-z]+)\b', re.IGNORECASE),
        re.compile(r'\b(?:named|identified as|arrested)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b')
    ]

    suspect_names = set()
    for pat in person_patterns:
        matches = pat.findall(text)
        for m in matches:
            if isinstance(m, tuple):
                for sub in m:
                    if sub.strip():
                        suspect_names.add(sub.strip())
            else:
                suspect_names.add(m.strip())

    for name in suspect_names:
        # Determine specific role by text context around the name
        role = "Suspect"
        risk = "medium"
        lower_name = name.lower()
        
        # Check context around occurrences of the name
        for match_idx in [m.start() for m in re.finditer(re.escape(name), text, re.IGNORECASE)]:
            window = text[max(0, match_idx - 150):min(len(text), match_idx + 150)].lower()
            for r_name, kws in ROLE_KEYWORDS.items():
                if any(kw in window for kw in kws):
                    role = r_name
                    if r_name in ["Kingpin", "Financier"]:
                        risk = "high"
                    break

        nid = f"ent_person_{node_counter}"
        node_counter += 1
        entities.append({
            "id": nid,
            "name": name,
            "type": "Person",
            "role": role,
            "risk": risk,
            "status": "active",
            "location": entities[0]["location"] if entities else "Unknown",
            "confidence": 0.88,
            "sourceFile": filename
        })

    # 5. Extract Organizations / Fronts
    org_pattern = re.compile(r'\b([A-Z][A-Za-z0-9\s&]{2,30}(?:' + '|'.join(ORG_KEYWORDS) + r'))\b')
    for org in set(org_pattern.findall(text)):
        nid = f"ent_org_{node_counter}"
        node_counter += 1
        entities.append({
            "id": nid,
            "name": org.strip(),
            "type": "Organization",
            "role": "Shell Front / Commercial Entity",
            "risk": "high" if "Syndicate" in org or "Cartel" in org else "medium",
            "status": "active",
            "location": "Commercial Registry",
            "confidence": 0.82,
            "sourceFile": filename
        })

    return entities
