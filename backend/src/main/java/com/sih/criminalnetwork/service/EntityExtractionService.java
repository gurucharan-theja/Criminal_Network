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
 * EntityExtractionService
 *
 * Extracts intelligence entities from uploaded investigation documents:
 * 1. Persons
 * 2. Organizations
 * 3. Locations
 * 4. Phones
 * 5. Vehicles
 * 6. Financial Accounts
 */
@Service
public class EntityExtractionService {

    private static final Logger log =
            LoggerFactory.getLogger(EntityExtractionService.class);

    private final Tika tika = new Tika();

    // ---------------------------------------------------------
    // RISK KEYWORDS
    // ---------------------------------------------------------

    private static final List<String> HIGH_RISK_KEYWORDS = List.of(
            "cartel",
            "kingpin",
            "arms",
            "smuggling",
            "trafficking",
            "arrest",
            "seized",
            "narcotics",
            "hawala",
            "money laundering",
            "wanted",
            "fugitive",
            "terror",
            "mastermind",
            "explosive",
            "extortion"
    );

    private static final List<String> MEDIUM_RISK_KEYWORDS = List.of(
            "associate",
            "courier",
            "suspicious",
            "flagged",
            "under surveillance",
            "accomplice",
            "distributor",
            "transport",
            "logistics"
    );

    // ---------------------------------------------------------
    // EXTRACTION PATTERNS
    // ---------------------------------------------------------

    private static final Pattern PERSON_PATTERN =
            Pattern.compile(
                    "\\b([A-Z][a-z]+(?:\\s[A-Z][a-z]+)+)\\b"
            );

    private static final Pattern PHONE_PATTERN =
            Pattern.compile(
                    "(?:\\+91[\\s-]?)?[6-9]\\d{9}"
            );

    private static final Pattern VEHICLE_PATTERN =
            Pattern.compile(
                    "\\b[A-Z]{2}[\\s-]?\\d{1,2}[\\s-]?[A-Z]{1,3}[\\s-]?\\d{4}\\b",
                    Pattern.CASE_INSENSITIVE
            );

    /**
     * Supports:
     * AC-123456
     * 123456789
     * 123456789012
     */
    private static final Pattern ACCOUNT_PATTERN =
            Pattern.compile(
                    "\\b(?:AC-\\d{4,12}|\\d{9,18})\\b",
                    Pattern.CASE_INSENSITIVE
            );

    /**
     * Explicit FIR / investigation suspect labels.
     */
    private static final Pattern FIR_SUSPECT_PATTERN =
            Pattern.compile(
                    "(?i)(?:suspect(?:\\s+name)?|accused(?:\\s+name)?|associate|perpetrator|operator)"
                            + "[\\s:]+"
                            + "([A-Za-z][A-Za-z\\s.]{2,30}?)"
                            + "(?=[\\n\\r,;]|alias|s/o|w/o|d/o|age|location|contact|phone|address|vehicle|$)"
            );

    private static final Pattern ALIAS_PATTERN =
            Pattern.compile(
                    "(?i)alias\\s+([A-Za-z][A-Za-z0-9\\s]{2,25}?)"
                            + "(?=[\\n\\r,;]|s/o|w/o|d/o|age|$)"
            );

    // ---------------------------------------------------------
    // KNOWN LOCATIONS
    // ---------------------------------------------------------

    private static final List<String> INDIAN_LOCATIONS = List.of(
            "Nhava Sheva",
            "Mumbai",
            "Pune",
            "Kandla",
            "Delhi",
            "Nagpur",
            "Bandra",
            "Ahmedabad",
            "Rajkot",
            "Hyderabad",
            "Bhopal",
            "Surat",
            "Goa",
            "Kolkata",
            "Chennai",
            "Bengaluru",
            "Gandhidham",
            "Dubai",
            "Mauritius"
    );

    // ---------------------------------------------------------
    // ORGANIZATION KEYWORDS
    // ---------------------------------------------------------

    private static final List<String> ORG_KEYWORDS = List.of(
            "Syndicate",
            "Logistics",
            "Finance Services",
            "Holdings",
            "Cartel",
            "Enterprises",
            "Pvt Ltd",
            "Corporation",
            "Agency",
            "Network",
            "Traders"
    );

    // ---------------------------------------------------------
    // MAIN EXTRACTION ENTRY
    // ---------------------------------------------------------

    public List<Entity> extractEntities(MultipartFile file) throws IOException {

        log.info(
                "Extracting entities from document: {}",
                file.getOriginalFilename()
        );

        String text;

        try {
            text = tika.parseToString(file.getInputStream());
        } catch (TikaException e) {
            throw new IOException(
                    "Tika failed to parse document: " + e.getMessage(),
                    e
            );
        }

        if (text == null || text.isBlank()) {
            log.warn(
                    "No extractable text found in document: {}",
                    file.getOriginalFilename()
            );
            return new ArrayList<>();
        }

        List<Entity> entities = new ArrayList<>();

        String sourceFile = file.getOriginalFilename();

        // Fundamental intelligence entity classes
        entities.addAll(extractPersons(text, sourceFile));
        entities.addAll(extractOrganizations(text, sourceFile));
        entities.addAll(extractLocations(text, sourceFile));
        entities.addAll(extractPhones(text, sourceFile));
        entities.addAll(extractVehicles(text, sourceFile));
        entities.addAll(extractAccounts(text, sourceFile));

        entities = deduplicate(entities);

        log.info(
                "Entity extraction complete. Extracted {} unique entities from '{}'",
                entities.size(),
                sourceFile
        );

        return entities;
    }

    // ---------------------------------------------------------
    // PERSON EXTRACTION
    // ---------------------------------------------------------

    private List<Entity> extractPersons(
            String text,
            String sourceFile
    ) {

        List<Entity> persons = new ArrayList<>();

        Set<String> seen = new HashSet<>();

        int count = 0;

        // -----------------------------------------------------
        // 1. Explicit suspect / accused fields
        // -----------------------------------------------------

        Matcher firMatcher = FIR_SUSPECT_PATTERN.matcher(text);

        while (firMatcher.find()) {

            String name = normalizeName(firMatcher.group(1));

            if (isValidPersonName(name)
                    && seen.add(name.toLowerCase())) {

                persons.add(
                        createPersonEntity(
                                name,
                                "Named Suspect / Accused in Docket",
                                RiskLevel.high,
                                0.96,
                                sourceFile,
                                ++count
                        )
                );
            }
        }

        // -----------------------------------------------------
        // 2. Alias extraction
        // -----------------------------------------------------

        Matcher aliasMatcher = ALIAS_PATTERN.matcher(text);

        while (aliasMatcher.find()) {

            String aliasName = normalizeName(aliasMatcher.group(1));

            if (isValidPersonName(aliasName)
                    && seen.add(aliasName.toLowerCase())) {

                persons.add(
                        createPersonEntity(
                                aliasName,
                                "Known Operative Alias",
                                RiskLevel.high,
                                0.94,
                                sourceFile,
                                ++count
                        )
                );
            }
        }

        // -----------------------------------------------------
        // 3. Capitalized full-name extraction
        // -----------------------------------------------------

        Matcher matcher = PERSON_PATTERN.matcher(text);

        while (matcher.find()) {

            String name = normalizeName(matcher.group());

            if (!isValidPersonName(name)) {
                continue;
            }

            if (!seen.add(name.toLowerCase())) {
                continue;
            }

            String context =
                    extractContext(text, matcher.start(), 160);

            RiskLevel risk =
                    classifyRisk(context);

            String role = "Suspect";

            String lowerContext =
                    context.toLowerCase(Locale.ROOT);

            if (lowerContext.contains("kingpin")
                    || lowerContext.contains("mastermind")) {

                role = "Syndicate Kingpin";
                risk = RiskLevel.high;

            } else if (lowerContext.contains("courier")
                    || lowerContext.contains("hawala")) {

                role = "Financial Courier";

            } else if (lowerContext.contains("arms")
                    || lowerContext.contains("smuggler")) {

                role = "Arms Smuggler";

            } else if (lowerContext.contains("informant")) {

                role = "Informant";

            } else if (lowerContext.contains("handler")) {

                role = "Handler";

            } else if (lowerContext.contains("associate")) {

                role = "Associate";
            }

            persons.add(
                    createPersonEntity(
                            name,
                            role,
                            risk,
                            0.92,
                            sourceFile,
                            ++count
                    )
            );
        }

        return persons;
    }

    // ---------------------------------------------------------
    // ORGANIZATION EXTRACTION
    // ---------------------------------------------------------

    private List<Entity> extractOrganizations(
            String text,
            String sourceFile
    ) {

        List<Entity> organizations = new ArrayList<>();

        Set<String> seen = new HashSet<>();

        int count = 0;

        for (String keyword : ORG_KEYWORDS) {

            Pattern pattern =
                    Pattern.compile(
                            "([A-Z][A-Za-z0-9&\\s]{2,35}\\s"
                                    + Pattern.quote(keyword)
                                    + ")"
                    );

            Matcher matcher =
                    pattern.matcher(text);

            while (matcher.find()) {

                String name =
                        normalizeOrganizationName(matcher.group());

                if (name.isBlank()) {
                    continue;
                }

                if (seen.contains(name.toLowerCase())) {
                    continue;
                }

                if (isStopPhrase(name)) {
                    continue;
                }

                seen.add(name.toLowerCase());

                String context =
                        extractContext(text, matcher.start(), 140);

                RiskLevel risk =
                        classifyRisk(context);

                if (risk == RiskLevel.low) {
                    risk = RiskLevel.medium;
                }

                organizations.add(
                        Entity.builder()
                                .nodeId(
                                        "ent_org_"
                                                + (++count)
                                                + "_"
                                                + System.currentTimeMillis()
                                )
                                .name(name)
                                .type(EntityType.Organization)
                                .role("Commercial Front / Syndicate")
                                .risk(risk)
                                .status(Status.ACTIVE)
                                .avatar("ORG")
                                .confidence(0.88)
                                .sourceFile(sourceFile)
                                .firstSeen(LocalDate.now())
                                .lastSeen(LocalDate.now())
                                .connections(0)
                                .build()
                );
            }
        }

        return organizations;
    }

    // ---------------------------------------------------------
    // LOCATION EXTRACTION
    // ---------------------------------------------------------

    private List<Entity> extractLocations(
            String text,
            String sourceFile
    ) {

        List<Entity> locations = new ArrayList<>();

        Set<String> seen = new HashSet<>();

        int count = 0;

        for (String location : INDIAN_LOCATIONS) {

            Pattern pattern =
                    Pattern.compile(
                            "\\b"
                                    + Pattern.quote(location)
                                    + "\\b",
                            Pattern.CASE_INSENSITIVE
                    );

            Matcher matcher =
                    pattern.matcher(text);

            if (!matcher.find()) {
                continue;
            }

            if (!seen.add(location.toLowerCase())) {
                continue;
            }

            String context =
                    extractContext(text, matcher.start(), 120);

            RiskLevel risk =
                    classifyRisk(context);

            if (risk == RiskLevel.low) {
                risk = RiskLevel.medium;
            }

            locations.add(
                    Entity.builder()
                            .nodeId(
                                    "ent_loc_"
                                            + (++count)
                                            + "_"
                                            + System.currentTimeMillis()
                            )
                            .name(location)
                            .type(EntityType.Location)
                            .role("Operational Transit Hub")
                            .risk(risk)
                            .status(Status.ACTIVE)
                            .avatar("LOC")
                            .confidence(0.95)
                            .sourceFile(sourceFile)
                            .firstSeen(LocalDate.now())
                            .lastSeen(LocalDate.now())
                            .connections(0)
                            .build()
            );
        }

        return locations;
    }

    // ---------------------------------------------------------
    // PHONE EXTRACTION
    // ---------------------------------------------------------

    private List<Entity> extractPhones(
            String text,
            String sourceFile
    ) {

        List<Entity> phones = new ArrayList<>();

        Matcher matcher =
                PHONE_PATTERN.matcher(text);

        Set<String> seen = new HashSet<>();

        int count = 0;

        while (matcher.find()) {

            String rawNumber =
                    matcher.group().trim();

            String number =
                    normalizePhoneNumber(rawNumber);

            if (number.length() < 10) {
                continue;
            }

            if (!seen.add(number)) {
                continue;
            }

            phones.add(
                    Entity.builder()
                            .nodeId(
                                    "ent_ph_"
                                            + (++count)
                                            + "_"
                                            + System.currentTimeMillis()
                            )
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
                            .build()
            );
        }

        return phones;
    }

    // ---------------------------------------------------------
    // VEHICLE EXTRACTION
    // ---------------------------------------------------------

    private List<Entity> extractVehicles(
            String text,
            String sourceFile
    ) {

        List<Entity> vehicles = new ArrayList<>();

        Matcher matcher =
                VEHICLE_PATTERN.matcher(text);

        Set<String> seen = new HashSet<>();

        int count = 0;

        while (matcher.find()) {

            String plate =
                    matcher.group()
                            .trim()
                            .toUpperCase(Locale.ROOT);

            plate = plate
                    .replaceAll("[\\s-]+", " ");

            if (!seen.add(plate)) {
                continue;
            }

            vehicles.add(
                    Entity.builder()
                            .nodeId(
                                    "ent_veh_"
                                            + (++count)
                                            + "_"
                                            + System.currentTimeMillis()
                            )
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
                            .build()
            );
        }

        return vehicles;
    }

    // ---------------------------------------------------------
    // FINANCIAL ACCOUNT EXTRACTION
    // ---------------------------------------------------------

    private List<Entity> extractAccounts(
            String text,
            String sourceFile
    ) {

        List<Entity> accounts = new ArrayList<>();

        Matcher matcher =
                ACCOUNT_PATTERN.matcher(text);

        Set<String> seen = new HashSet<>();

        int count = 0;

        while (matcher.find()) {

            String accountNumber =
                    matcher.group().trim();

            if (accountNumber.length() < 6) {
                continue;
            }

            String normalized =
                    accountNumber.toLowerCase(Locale.ROOT);

            if (!seen.add(normalized)) {
                continue;
            }

            String context =
                    extractContext(
                            text,
                            matcher.start(),
                            120
                    );

            RiskLevel risk =
                    classifyRisk(context);

            // Financial accounts are inherently
            // intelligence-relevant in this project.
            if (risk == RiskLevel.low) {
                risk = RiskLevel.medium;
            }

            accounts.add(
                    Entity.builder()
                            .nodeId(
                                    "ent_acc_"
                                            + (++count)
                                            + "_"
                                            + System.currentTimeMillis()
                            )
                            .name("Account " + accountNumber)
                            .type(EntityType.Account)
                            .role("Financial Bank / Hawala Account")
                            .risk(risk)
                            .status(Status.ACTIVE)
                            .avatar("AC")
                            .confidence(0.90)
                            .sourceFile(sourceFile)
                            .firstSeen(LocalDate.now())
                            .lastSeen(LocalDate.now())
                            .connections(0)
                            .build()
            );
        }

        return accounts;
    }

    // ---------------------------------------------------------
    // ENTITY BUILDERS
    // ---------------------------------------------------------

    private Entity createPersonEntity(
            String name,
            String role,
            RiskLevel risk,
            double confidence,
            String sourceFile,
            int count
    ) {

        return Entity.builder()
                .nodeId(
                        "ent_p_"
                                + count
                                + "_"
                                + System.currentTimeMillis()
                )
                .name(name)
                .type(EntityType.Person)
                .role(role)
                .risk(risk)
                .status(Status.ACTIVE)
                .avatar(buildAvatar(name))
                .confidence(confidence)
                .sourceFile(sourceFile)
                .firstSeen(LocalDate.now())
                .lastSeen(LocalDate.now())
                .connections(0)
                .build();
    }

    // ---------------------------------------------------------
    // RISK CLASSIFICATION
    // ---------------------------------------------------------

    public RiskLevel classifyRisk(String context) {

        if (context == null || context.isBlank()) {
            return RiskLevel.low;
        }

        String lower =
                context.toLowerCase(Locale.ROOT);

        for (String keyword : HIGH_RISK_KEYWORDS) {

            if (lower.contains(keyword)) {
                return RiskLevel.high;
            }
        }

        for (String keyword : MEDIUM_RISK_KEYWORDS) {

            if (lower.contains(keyword)) {
                return RiskLevel.medium;
            }
        }

        return RiskLevel.low;
    }

    // ---------------------------------------------------------
    // CONTEXT EXTRACTION
    // ---------------------------------------------------------

    private String extractContext(
            String text,
            int position,
            int radius
    ) {

        if (text == null || text.isEmpty()) {
            return "";
        }

        int start =
                Math.max(0, position - radius);

        int end =
                Math.min(
                        text.length(),
                        position + radius
                );

        return text.substring(start, end);
    }

    // ---------------------------------------------------------
    // NORMALIZATION
    // ---------------------------------------------------------

    private String normalizeName(String name) {

        if (name == null) {
            return "";
        }

        return name
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalizeOrganizationName(String name) {

        if (name == null) {
            return "";
        }

        return name
                .replaceAll("\\s+", " ")
                .replaceAll("^[,.;:]+|[,.;:]+$", "")
                .trim();
    }

    private String normalizePhoneNumber(String phone) {

        if (phone == null) {
            return "";
        }

        String digits =
                phone.replaceAll("\\D", "");

        // +91XXXXXXXXXX -> keep the full number
        if (digits.length() == 12
                && digits.startsWith("91")) {

            return "+" + digits;
        }

        // 10-digit Indian mobile
        if (digits.length() == 10) {
            return "+91" + digits;
        }

        return phone.trim();
    }

    // ---------------------------------------------------------
    // PERSON VALIDATION
    // ---------------------------------------------------------

    private boolean isValidPersonName(String name) {

        if (name == null || name.length() < 3) {
            return false;
        }

        if (isStopPhrase(name)) {
            return false;
        }

        String[] parts =
                name.split("\\s+");

        if (parts.length < 2) {
            return false;
        }

        // Avoid strings that contain obvious document labels.
        String lower =
                name.toLowerCase(Locale.ROOT);

        String[] blockedWords = {
                "first information",
                "police station",
                "investigating officer",
                "district court",
                "high court",
                "supreme court",
                "crime branch",
                "special cell",
                "section",
                "general diary",
                "case diary"
        };

        for (String blocked : blockedWords) {

            if (lower.contains(blocked)) {
                return false;
            }
        }

        return true;
    }

    // ---------------------------------------------------------
    // AVATAR
    // ---------------------------------------------------------

    private String buildAvatar(String name) {

        if (name == null || name.isBlank()) {
            return "NA";
        }

        String[] parts =
                name.trim().split("\\s+");

        if (parts.length >= 2) {

            return (
                    ""
                            + parts[0].charAt(0)
                            + parts[1].charAt(0)
            ).toUpperCase(Locale.ROOT);
        }

        return name
                .substring(
                        0,
                        Math.min(2, name.length())
                )
                .toUpperCase(Locale.ROOT);
    }

    // ---------------------------------------------------------
    // STOP PHRASES
    // ---------------------------------------------------------

    private boolean isStopPhrase(String name) {

        if (name == null || name.isBlank()) {
            return true;
        }

        Set<String> stops = Set.of(
                "First Information",
                "Police Station",
                "Indian Penal",
                "Section",
                "Superintendent Police",
                "Deputy Commissioner",
                "Additional Commissioner",
                "The Accused",
                "The Complainant",
                "Date Time",
                "State Maharashtra",
                "Under Section",
                "Acts Sections",
                "Brief Facts",
                "Special Cell",
                "South Delhi",
                "New Delhi",
                "Arms Act",
                "Information Report",
                "Contact Phone",
                "Associated Syndicate",
                "Vehicle Intercepted",
                "Toyota Fortuner",
                "First Information Report",
                "General Diary",
                "Case Diary",
                "Crime Branch",
                "Special Task",
                "High Court",
                "Supreme Court",
                "District Court",
                "Sub Division",
                "Circle Officer",
                "Station House",
                "Investigating Officer",
                "Assistant Commissioner",
                "Joint Commissioner",
                "North Delhi",
                "East Delhi",
                "West Delhi",
                "Central Delhi",
                "Outer Delhi"
        );

        return stops.stream()
                .anyMatch(
                        stop ->
                                name.trim()
                                        .equalsIgnoreCase(stop.trim())
                );
    }

    // ---------------------------------------------------------
    // DEDUPLICATION
    // ---------------------------------------------------------

    private List<Entity> deduplicate(
            List<Entity> entities
    ) {

        Map<String, Entity> map =
                new LinkedHashMap<>();

        for (Entity entity : entities) {

            if (entity == null
                    || entity.getName() == null
                    || entity.getName().isBlank()) {
                continue;
            }

            String key =
                    entity.getType()
                            + "::"
                            + entity.getName()
                                    .trim()
                                    .toLowerCase(Locale.ROOT);

            map.putIfAbsent(key, entity);
        }

        return new ArrayList<>(map.values());
    }
}