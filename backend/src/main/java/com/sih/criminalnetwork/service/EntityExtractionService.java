package com.sih.criminalnetwork.service;

import com.sih.criminalnetwork.model.Entity;
import com.sih.criminalnetwork.model.Entity.EntityType;
import com.sih.criminalnetwork.model.Entity.RiskLevel;
import com.sih.criminalnetwork.model.Entity.Status;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * EntityExtractionService — Phase 2: Deep NLP & Multi-Class Entity Extraction
 *
 * Implements SIH 26189 Mandates:
 * 1. Persons: Accused, Kingpins, Handlers, Couriers, Informants
 * 2. Organizations: Shell Corporations, Syndicates, Cartels, Logistics fronts
 * 3. Locations: Smuggling ports, Transit hubs, Metro operations
 * 4. Vehicles: Indian transport asset registrations (MH, DL, GJ, KA, etc.)
 * 5. Phones: Indian +91 Telecom MSISDNs, CDR numbers, Burner devices
 * 6. Financial Accounts: Hawala tokens, Bank accounts, STR ledgers
 */
@Service
public class EntityExtractionService {

    private static final Logger log = LoggerFactory.getLogger(EntityExtractionService.class);
    private final Tika tika = new Tika();

    // Contextual Risk Triggers
    private static final List<String> HIGH_RISK_KEYWORDS = List.of(
            "cartel", "kingpin", "arms", "smuggling", "trafficking",
            "arrest", "seized", "narcotics", "hawala", "money laundering",
            "wanted", "fugitive", "terror", "mastermind", "explosive", "extortion"
    );

    private static final List<String> MEDIUM_RISK_KEYWORDS = List.of(
            "associate", "courier", "suspicious", "flagged",
            "under surveillance", "accomplice", "distributor", "transport", "logistics"
    );

    // Deep Regex Patterns for Indian Context
    private static final Pattern PERSON_PATTERN =
            Pattern.compile("\\b([A-Z][a-z]+(\\s[A-Z][a-z]+)+)\\b");

    private static final Pattern PHONE_PATTERN =
            Pattern.compile("(\\+91[\\s-]?)?[6-9]\\d{9}");

    private static final Pattern VEHICLE_PATTERN =
            Pattern.compile("\\b[A-Z]{2}[\\s-]?\\d{1,2}[\\s-]?[A-Z]{1,3}[\\s-]?\\d{4}\\b", Pattern.CASE_INSENSITIVE);

    private static final Pattern ACCOUNT_PATTERN =
            Pattern.compile("\\b(AC-\\d{4,12}|[0-9]{9,18})\\b");

    // Common Indian Metro and Transit Hubs
    private static final List<String> INDIAN_LOCATIONS = List.of(
            "Nhava Sheva", "Mumbai", "Pune", "Kandla", "Delhi", "Nagpur", "Bandra",
            "Ahmedabad", "Rajkot", "Hyderabad", "Bhopal", "Surat", "Goa", "Kolkata",
            "Chennai", "Bengaluru", "Gandhidham", "Dubai", "Mauritius"
    );

    // Shell Company and Front Suffixes
    private static final List<String> ORG_KEYWORDS = List.of(
            "Syndicate", "Logistics", "Finance Services", "Holdings", "Cartel",
            "Enterprises", "Pvt Ltd", "Corporation", "Agency", "Network", "Traders"
    );

    public List<Entity> extractEntities(MultipartFile file) throws IOException {
        log.info("Phase 2: Extracting entities from document: {}", file.getOriginalFilename());

        String text;
        try {
            text = tika.parseToString(file.getInputStream());
        } catch (TikaException e) {
            throw new IOException("Tika failed to parse document: " + e.getMessage(), e);
        }

        List<Entity> entities = new ArrayList<>();
        String sourceFile = file.getOriginalFilename();

        // 1. Extract all 5 fundamental entity classes
        entities.addAll(extractPersons(text, sourceFile));
        entities.addAll(extractOrganizations(text, sourceFile));
        entities.addAll(extractLocations(text, sourceFile));
        entities.addAll(extractPhones(text, sourceFile));
        entities.addAll(extractVehicles(text, sourceFile));
        entities.addAll(extractAccounts(text, sourceFile));

        entities = deduplicate(entities);
        log.info("Phase 2 complete. Extracted {} unique intelligence entities from '{}'", entities.size(), sourceFile);
        return entities;
    }

    // Specific Indian FIR suspect/accused line pattern
    private static final Pattern FIR_SUSPECT_PATTERN =
            Pattern.compile("(?i)(?:suspect(?:\\s+name)?|accused(?:\\s+name)?|associate|perpetrator|operator)[\\s:]+([A-Za-z][A-Za-z\\s.]{2,30}?)(?=[\\n\\r,;]|alias|s/o|w/o|d/o|age|location|contact|phone|address|vehicle|$)", Pattern.CASE_INSENSITIVE);

    private static final Pattern ALIAS_PATTERN =
            Pattern.compile("(?i)alias\\s+([A-Za-z][A-Za-z0-9\\s]{2,25}?)(?=[\\n\\r,;]|s/o|w/o|d/o|age|$)", Pattern.CASE_INSENSITIVE);

    private List<Entity> extractPersons(String text, String sourceFile) {
        List<Entity> persons = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        int count = 0;

        // 1. Direct extraction from FIR labeled suspect fields
        Matcher firM = FIR_SUSPECT_PATTERN.matcher(text);
        while (firM.find()) {
            String name = firM.group(1).trim();
            if (name.length() >= 3 && !isStopPhrase(name) && !seen.contains(name.toLowerCase())) {
                seen.add(name.toLowerCase());
                persons.add(Entity.builder()
                        .nodeId("ent_p_" + (++count) + "_" + System.currentTimeMillis())
                        .name(name)
                        .type(EntityType.Person)
                        .role("Named Suspect / Accused in Docket")
                        .risk(RiskLevel.high)
                        .status(Status.ACTIVE)
                        .avatar(buildAvatar(name))
                        .confidence(0.96)
                        .sourceFile(sourceFile)
                        .firstSeen(LocalDate.now())
                        .lastSeen(LocalDate.now())
                        .connections(0)
                        .build());
            }
        }

        // 2. Direct extraction from alias mentions
        Matcher aliasM = ALIAS_PATTERN.matcher(text);
        while (aliasM.find()) {
            String aliasName = aliasM.group(1).trim();
            if (aliasName.length() >= 3 && !isStopPhrase(aliasName) && !seen.contains(aliasName.toLowerCase())) {
                seen.add(aliasName.toLowerCase());
                persons.add(Entity.builder()
                        .nodeId("ent_p_" + (++count) + "_" + System.currentTimeMillis())
                        .name(aliasName)
                        .type(EntityType.Person)
                        .role("Known Operative Alias")
                        .risk(RiskLevel.high)
                        .status(Status.ACTIVE)
                        .avatar(buildAvatar(aliasName))
                        .confidence(0.94)
                        .sourceFile(sourceFile)
                        .firstSeen(LocalDate.now())
                        .lastSeen(LocalDate.now())
                        .connections(0)
                        .build());
            }
        }

        // 3. NLP regex pattern for capitalized full names
        Matcher m = PERSON_PATTERN.matcher(text);
        while (m.find()) {
            String name = m.group().trim();
            if (isStopPhrase(name) || seen.contains(name.toLowerCase())) continue;
            seen.add(name.toLowerCase());

            String context = extractContext(text, m.start(), 160);
            RiskLevel risk = classifyRisk(context);

            String role = "Suspect";
            if (context.toLowerCase().contains("kingpin") || context.toLowerCase().contains("mastermind")) {
                role = "Syndicate Kingpin";
                risk = RiskLevel.high;
            } else if (context.toLowerCase().contains("courier") || context.toLowerCase().contains("hawala")) {
                role = "Financial Courier";
            } else if (context.toLowerCase().contains("arms") || context.toLowerCase().contains("smuggler")) {
                role = "Arms Smuggler";
            }

            persons.add(Entity.builder()
                    .nodeId("ent_p_" + (++count) + "_" + System.currentTimeMillis())
                    .name(name)
                    .type(EntityType.Person)
                    .role(role)
                    .risk(risk)
                    .status(Status.ACTIVE)
                    .avatar(buildAvatar(name))
                    .confidence(0.92)
                    .sourceFile(sourceFile)
                    .firstSeen(LocalDate.now())
                    .lastSeen(LocalDate.now())
                    .connections(0)
                    .build());
        }
        return persons;
    }

    private List<Entity> extractOrganizations(String text, String sourceFile) {
        List<Entity> orgs = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        int count = 0;

        for (String kw : ORG_KEYWORDS) {
            Pattern p = Pattern.compile("([A-Z][A-Za-z0-9&\\s]{2,25}\\s" + Pattern.quote(kw) + ")");
            Matcher m = p.matcher(text);
            while (m.find()) {
                String name = m.group().trim();
                if (seen.contains(name.toLowerCase()) || isStopPhrase(name)) continue;
                seen.add(name.toLowerCase());

                String context = extractContext(text, m.start(), 140);
                RiskLevel risk = classifyRisk(context);

                orgs.add(Entity.builder()
                        .nodeId("ent_org_" + (++count) + "_" + System.currentTimeMillis())
                        .name(name)
                        .type(EntityType.Organization)
                        .role("Commercial Front / Syndicate")
                        .risk(risk == RiskLevel.low ? RiskLevel.medium : risk)
                        .status(Status.ACTIVE)
                        .avatar("ORG")
                        .confidence(0.88)
                        .sourceFile(sourceFile)
                        .firstSeen(LocalDate.now())
                        .lastSeen(LocalDate.now())
                        .connections(0)
                        .build());
            }
        }
        return orgs;
    }

    private List<Entity> extractLocations(String text, String sourceFile) {
        List<Entity> locations = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        int count = 0;

        for (String loc : INDIAN_LOCATIONS) {
            Pattern p = Pattern.compile("\\b" + Pattern.quote(loc) + "\\b", Pattern.CASE_INSENSITIVE);
            Matcher m = p.matcher(text);
            if (m.find()) {
                if (seen.contains(loc.toLowerCase())) continue;
                seen.add(loc.toLowerCase());

                locations.add(Entity.builder()
                        .nodeId("ent_loc_" + (++count) + "_" + System.currentTimeMillis())
                        .name(loc)
                        .type(EntityType.Location)
                        .role("Operational Transit Hub")
                        .risk(RiskLevel.medium)
                        .status(Status.ACTIVE)
                        .avatar("LOC")
                        .confidence(0.95)
                        .sourceFile(sourceFile)
                        .firstSeen(LocalDate.now())
                        .lastSeen(LocalDate.now())
                        .connections(0)
                        .build());
            }
        }
        return locations;
    }

    private List<Entity> extractPhones(String text, String sourceFile) {
        List<Entity> phones = new ArrayList<>();
        Matcher m = PHONE_PATTERN.matcher(text);
        Set<String> seen = new HashSet<>();
        int count = 0;

        while (m.find()) {
            String number = m.group().trim();
            if (seen.contains(number)) continue;
            seen.add(number);

            phones.add(Entity.builder()
                    .nodeId("ent_ph_" + (++count) + "_" + System.currentTimeMillis())
                    .name(number)
                    .type(EntityType.Phone)
                    .role("Intercepted Telecom MSISDN")
                    .risk(RiskLevel.medium)
                    .status(Status.ACTIVE)
                    .avatar("PH")
                    .confidence(0.98)
                    .sourceFile(sourceFile)
                    .firstSeen(LocalDate.now())
                    .lastSeen(LocalDate.now())
                    .connections(0)
                    .build());
        }
        return phones;
    }

    private List<Entity> extractVehicles(String text, String sourceFile) {
        List<Entity> vehicles = new ArrayList<>();
        Matcher m = VEHICLE_PATTERN.matcher(text);
        Set<String> seen = new HashSet<>();
        int count = 0;

        while (m.find()) {
            String plate = m.group().trim().toUpperCase();
            if (seen.contains(plate)) continue;
            seen.add(plate);

            vehicles.add(Entity.builder()
                    .nodeId("ent_veh_" + (++count) + "_" + System.currentTimeMillis())
                    .name(plate)
                    .type(EntityType.Vehicle)
                    .role("Identified Transport Asset")
                    .risk(RiskLevel.medium)
                    .status(Status.ACTIVE)
                    .avatar("VH")
                    .confidence(0.94)
                    .sourceFile(sourceFile)
                    .firstSeen(LocalDate.now())
                    .lastSeen(LocalDate.now())
                    .connections(0)
                    .build());
        }
        return vehicles;
    }

    private List<Entity> extractAccounts(String text, String sourceFile) {
        List<Entity> accounts = new ArrayList<>();
        Matcher m = ACCOUNT_PATTERN.matcher(text);
        Set<String> seen = new HashSet<>();
        int count = 0;

        while (m.find()) {
            String acc = m.group().trim();
            if (acc.length() < 6 || seen.contains(acc)) continue;
            seen.add(acc);

            accounts.add(Entity.builder()
                    .nodeId("ent_acc_" + (++count) + "_" + System.currentTimeMillis())
                    .name("Account " + acc)
                    .type(EntityType.Organization)
                    .role("Financial Bank / Hawala Account")
                    .risk(RiskLevel.high)
                    .status(Status.ACTIVE)
                    .avatar("AC")
                    .confidence(0.90)
                    .sourceFile(sourceFile)
                    .firstSeen(LocalDate.now())
                    .lastSeen(LocalDate.now())
                    .connections(0)
                    .build());
        }
        return accounts;
    }

    public RiskLevel classifyRisk(String context) {
        String lower = context.toLowerCase();
        for (String kw : HIGH_RISK_KEYWORDS)   if (lower.contains(kw)) return RiskLevel.high;
        for (String kw : MEDIUM_RISK_KEYWORDS) if (lower.contains(kw)) return RiskLevel.medium;
        return RiskLevel.low;
    }

    private String extractContext(String text, int position, int radius) {
        int start = Math.max(0, position - radius);
        int end   = Math.min(text.length(), position + radius);
        return text.substring(start, end);
    }

    private String buildAvatar(String name) {
        String[] parts = name.trim().split("\\s+");
        if (parts.length >= 2)
            return ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        return name.substring(0, Math.min(2, name.length())).toUpperCase();
    }

    private boolean isStopPhrase(String name) {
        Set<String> stops = Set.of(
                "First Information", "Police Station", "Indian Penal", "Section",
                "Superintendent Police", "Deputy Commissioner", "Additional Commissioner",
                "The Accused", "The Complainant", "Date Time", "State Maharashtra",
                "Under Section", "Acts Sections", "Brief Facts", "Special Cell",
                "South Delhi", "New Delhi", "Arms Act", "Information Report",
                "Contact Phone", "Associated Syndicate", "Vehicle Intercepted",
                "Toyota Fortuner", "First Information Report", "General Diary",
                "Case Diary", "Crime Branch", "Special Task", "High Court",
                "Supreme Court", "District Court", "Sub Division", "Circle Officer",
                "Station House", "Investigating Officer", "Assistant Commissioner",
                "Joint Commissioner", "North Delhi", "East Delhi", "West Delhi",
                "Central Delhi", "Outer Delhi"
        );
        return stops.stream().anyMatch(s -> name.equalsIgnoreCase(s.trim()));
    }

    private List<Entity> deduplicate(List<Entity> entities) {
        Map<String, Entity> map = new LinkedHashMap<>();
        for (Entity e : entities) map.putIfAbsent(e.getName().toLowerCase(), e);
        return new ArrayList<>(map.values());
    }
}
