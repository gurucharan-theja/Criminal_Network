package com.sih.criminalnetwork.service;

import com.sih.criminalnetwork.model.Entity;
import com.sih.criminalnetwork.model.Entity.EntityType;
import com.sih.criminalnetwork.model.Relationship;
import com.sih.criminalnetwork.model.Relationship.RelationType;
import com.sih.criminalnetwork.model.Relationship.Strength;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class RelationshipService {

    private static final Logger log =
            LoggerFactory.getLogger(RelationshipService.class);

    private static final int PROXIMITY_WINDOW = 400;
    private static final int RELATION_CONTEXT_WINDOW = 180;

    // =========================================================
    // RELATIONSHIP KEYWORDS
    // =========================================================

    private static final List<String> FINANCIAL_KEYWORDS = List.of(
            "paid", "pay", "payment", "transferred", "transfer",
            "funded", "funding", "laundered", "hawala", "wire",
            "transaction", "account", "money", "rupee", "crore",
            "lakh", "deposit", "withdraw", "bank", "cash"
    );

    private static final List<String> COMMUNICATION_KEYWORDS = List.of(
            "called", "call", "called him", "called her",
            "messaged", "message", "contacted", "contact",
            "communicated", "communication", "signal", "whatsapp",
            "telegram", "encrypted", "phone", "spoke", "spoke to"
    );

    private static final List<String> FAMILY_KEYWORDS = List.of(
            "brother", "sister", "wife", "husband", "son", "daughter",
            "cousin", "uncle", "aunt", "relative", "kin", "family",
            "father", "mother"
    );

    private static final List<String> KNOWLEDGE_KEYWORDS = List.of(
            "knows", "known to", "knowing", "familiar with",
            "introduced", "met", "meeting"
    );

    private static final List<String> WORK_KEYWORDS = List.of(
            "works for", "worked for", "employee of", "employed by",
            "handler", "agent of", "member of", "operates for",
            "reports to"
    );

    private static final List<String> OWNERSHIP_KEYWORDS = List.of(
            "owns", "owned by", "owner of", "registered to",
            "belongs to", "property of", "account holder",
            "vehicle owner"
    );

    private static final List<String> USAGE_KEYWORDS = List.of(
            "uses", "used", "using", "utilized", "operates",
            "carried", "travels in", "drives"
    );

    private static final List<String> LOCATION_KEYWORDS = List.of(
            "located", "location", "based in", "resides in",
            "resident of", "lives in", "stays in", "operates in",
            "travelled to", "traveled to", "from", "at"
    );

    private static final List<String> STRONG_INDICATORS = List.of(
            "repeatedly", "regularly", "daily", "weekly",
            "multiple times", "consistently", "frequent",
            "frequently", "several times", "often", "routine"
    );

    private static final List<String> WEAK_INDICATORS = List.of(
            "once", "single", "briefly", "allegedly", "suspected",
            "possibly", "unconfirmed", "reportedly", "may have",
            "might have"
    );

    // =========================================================
    // TEXT RELATIONSHIP DETECTION
    // =========================================================

    public List<Relationship> detectRelationships(
            List<Entity> entities,
            String text,
            String sourceFile) {

        if (entities == null || entities.size() < 2) {
            log.info(
                    "Relationship detection skipped: fewer than 2 entities."
            );
            return new ArrayList<>();
        }

        if (text == null || text.isBlank()) {
            log.info(
                    "Relationship detection skipped: document has no text."
            );
            return new ArrayList<>();
        }

        log.info(
                "Detecting relationships among {} entities in '{}'",
                entities.size(),
                sourceFile
        );

        List<Relationship> relationships = new ArrayList<>();
        int edgeCounter = 0;

        Map<Entity, List<Integer>> mentionIndex =
                buildMentionIndex(entities, text);

        for (int i = 0; i < entities.size(); i++) {

            Entity source = entities.get(i);

            List<Integer> sourcePositions =
                    mentionIndex.getOrDefault(
                            source,
                            Collections.emptyList()
                    );

            if (sourcePositions.isEmpty()) {
                continue;
            }

            for (int j = i + 1; j < entities.size(); j++) {

                Entity target = entities.get(j);

                List<Integer> targetPositions =
                        mentionIndex.getOrDefault(
                                target,
                                Collections.emptyList()
                        );

                if (targetPositions.isEmpty()) {
                    continue;
                }

                Optional<int[]> closestPair =
                        findClosestPair(
                                sourcePositions,
                                targetPositions
                        );

                if (closestPair.isEmpty()) {
                    continue;
                }

                int sourcePosition = closestPair.get()[0];
                int targetPosition = closestPair.get()[1];

                int distance =
                        Math.abs(sourcePosition - targetPosition);

                if (distance > PROXIMITY_WINDOW) {
                    continue;
                }

                int coOccurrences =
                        countCoOccurrences(
                                sourcePositions,
                                targetPositions,
                                PROXIMITY_WINDOW
                        );

                String context =
                        extractRelationshipContext(
                                text,
                                sourcePosition,
                                targetPosition
                        );

                RelationType type =
                        classifyRelationType(
                                context,
                                source,
                                target
                        );

                Strength strength =
                        classifyStrength(
                                context,
                                coOccurrences
                        );

                double confidence =
                        computeConfidence(
                                coOccurrences,
                                distance,
                                context,
                                type
                        );

                String evidence =
                        buildEvidence(
                                source,
                                target,
                                coOccurrences,
                                distance,
                                type,
                                sourceFile
                        );

                Relationship relationship =
                        Relationship.builder()
                                .edgeId(
                                        "rel_"
                                                + (++edgeCounter)
                                                + "_"
                                                + System.currentTimeMillis()
                                )
                                .source(source)
                                .target(target)
                                .type(type)
                                .strength(strength)
                                .label(buildLabel(type))
                                .confidence(confidence)
                                .evidence(evidence)
                                .sourceFile(sourceFile)
                                .build();

                relationships.add(relationship);
            }
        }

        relationships =
                deduplicateRelationships(relationships);

        log.info(
                "Relationship detection complete. Found {} edges.",
                relationships.size()
        );

        return relationships;
    }

    // =========================================================
    // ENTITY MENTION INDEX
    // =========================================================

    private Map<Entity, List<Integer>> buildMentionIndex(
            List<Entity> entities,
            String text) {

        Map<Entity, List<Integer>> index =
                new HashMap<>();

        String lowerText =
                text.toLowerCase(Locale.ROOT);

        for (Entity entity : entities) {

            if (entity == null
                    || entity.getName() == null
                    || entity.getName().isBlank()) {
                continue;
            }

            String name =
                    entity.getName()
                            .toLowerCase(Locale.ROOT)
                            .trim();

            List<Integer> positions =
                    new ArrayList<>();

            int position = 0;

            while ((position =
                    lowerText.indexOf(name, position)) != -1) {

                positions.add(position);

                position +=
                        Math.max(1, name.length());
            }

            if (!positions.isEmpty()) {
                index.put(entity, positions);
            }
        }

        return index;
    }

    // =========================================================
    // CLOSEST MENTIONS
    // =========================================================

    private Optional<int[]> findClosestPair(
            List<Integer> sourcePositions,
            List<Integer> targetPositions) {

        int minimumDistance = Integer.MAX_VALUE;
        int[] bestPair = null;

        for (int sourcePosition : sourcePositions) {

            for (int targetPosition : targetPositions) {

                int distance =
                        Math.abs(
                                sourcePosition - targetPosition
                        );

                if (distance < minimumDistance) {

                    minimumDistance = distance;

                    bestPair =
                            new int[]{
                                    sourcePosition,
                                    targetPosition
                            };
                }
            }
        }

        return Optional.ofNullable(bestPair);
    }

    // =========================================================
    // CO-OCCURRENCES
    // =========================================================

    private int countCoOccurrences(
            List<Integer> sourcePositions,
            List<Integer> targetPositions,
            int window) {

        int count = 0;

        for (int sourcePosition : sourcePositions) {

            for (int targetPosition : targetPositions) {

                if (Math.abs(
                        sourcePosition - targetPosition
                ) <= window) {

                    count++;
                }
            }
        }

        return count;
    }

    // =========================================================
    // CONTEXT
    // =========================================================

    private String extractRelationshipContext(
            String text,
            int sourcePosition,
            int targetPosition) {

        int start =
                Math.max(
                        0,
                        Math.min(
                                sourcePosition,
                                targetPosition
                        ) - RELATION_CONTEXT_WINDOW
                );

        int end =
                Math.min(
                        text.length(),
                        Math.max(
                                sourcePosition,
                                targetPosition
                        ) + RELATION_CONTEXT_WINDOW
                );

        return text.substring(start, end);
    }

    // =========================================================
    // RELATIONSHIP TYPE
    // =========================================================

    public RelationType classifyRelationType(
            String context) {

        return classifyRelationType(
                context,
                null,
                null
        );
    }

    private RelationType classifyRelationType(
            String context,
            Entity source,
            Entity target) {

        if (context == null) {
            context = "";
        }

        String lower =
                context.toLowerCase(Locale.ROOT);

        if (matchesAny(lower, FAMILY_KEYWORDS)) {
            return RelationType.family;
        }

        if (matchesAny(lower, WORK_KEYWORDS)) {
            return RelationType.works_for;
        }

        if (matchesAny(lower, OWNERSHIP_KEYWORDS)) {
            return RelationType.owns;
        }

        if (matchesAny(lower, USAGE_KEYWORDS)) {
            return RelationType.uses;
        }

        if (matchesAny(lower, KNOWLEDGE_KEYWORDS)) {
            return RelationType.knows;
        }

        if (matchesAny(lower, COMMUNICATION_KEYWORDS)) {

            if (lower.contains("called")
                    || lower.contains("call")) {

                return RelationType.called;
            }

            return RelationType.communication;
        }

        if (matchesAny(lower, FINANCIAL_KEYWORDS)) {

            if (lower.contains("transferred")
                    || lower.contains("transfer")) {

                return RelationType.transferred;
            }

            return RelationType.financial;
        }

        if (source != null && target != null) {

            if (source.getType() == EntityType.Location
                    || target.getType() == EntityType.Location) {

                if (matchesAny(
                        lower,
                        LOCATION_KEYWORDS
                )) {

                    return RelationType.located_at;
                }
            }
        }

        return RelationType.associate;
    }

    // =========================================================
    // STRENGTH
    // =========================================================

    public Strength classifyStrength(
            String context,
            int coOccurrences) {

        if (context == null) {
            context = "";
        }

        String lower =
                context.toLowerCase(Locale.ROOT);

        if (coOccurrences >= 3
                || matchesAny(
                        lower,
                        STRONG_INDICATORS
                )) {

            return Strength.strong;
        }

        if (matchesAny(
                lower,
                WEAK_INDICATORS
        )) {

            return Strength.weak;
        }

        return Strength.medium;
    }

    // =========================================================
    // CONFIDENCE
    // =========================================================

    private double computeConfidence(
            int coOccurrences,
            int distance,
            String context,
            RelationType type) {

        double occurrenceScore =
                Math.min(
                        1.0,
                        coOccurrences / 5.0
                );

        double distanceScore =
                1.0
                        - Math.min(
                                1.0,
                                distance
                                        / (double)
                                        PROXIMITY_WINDOW
                        );

        double keywordScore =
                type == RelationType.associate
                        ? 0.45
                        : 0.85;

        double raw =
                (occurrenceScore * 0.35)
                        + (distanceScore * 0.35)
                        + (keywordScore * 0.30);

        if (context != null
                && !context.isBlank()
                && type != RelationType.associate) {

            raw += 0.03;
        }

        raw =
                Math.max(
                        0.0,
                        Math.min(1.0, raw)
                );

        return Math.round(raw * 100.0) / 100.0;
    }

    // =========================================================
    // LABEL
    // =========================================================

    private String buildLabel(
            RelationType type) {

        return switch (type) {

            case financial ->
                    "Transacts with";

            case communication ->
                    "Communicates with";

            case family ->
                    "Family of";

            case associate ->
                    "Associated with";

            case called ->
                    "Called";

            case transferred ->
                    "Transferred to";

            case knows ->
                    "Knows";

            case works_for ->
                    "Works for";

            case owns ->
                    "Owns";

            case uses ->
                    "Uses";

            case located_at ->
                    "Located at";
        };
    }

    // =========================================================
    // TEXT EVIDENCE
    // =========================================================

    private String buildEvidence(
            Entity source,
            Entity target,
            int coOccurrences,
            int distance,
            RelationType type,
            String sourceFile) {

        return String.format(
                Locale.ROOT,
                "%s relationship detected between '%s' and '%s'. "
                        + "Entities co-occurred %d time(s), "
                        + "with closest mentions %d characters apart "
                        + "in '%s'.",
                buildLabel(type),
                source.getName(),
                target.getName(),
                coOccurrences,
                distance,
                sourceFile
        );
    }

    // =========================================================
    // KEYWORD MATCHING
    // =========================================================

    private boolean matchesAny(
            String context,
            List<String> keywords) {

        for (String keyword : keywords) {

            if (context.contains(
                    keyword.toLowerCase(Locale.ROOT)
            )) {
                return true;
            }
        }

        return false;
    }

    // =========================================================
    // CDR RELATIONSHIP EXTRACTION
    // =========================================================

    /**
     * Expected CDR format:
     *
     * caller,receiver,timestamp,duration
     *
     * Example:
     *
     * 9876543210,9123456789,2026-09-15 10:30:00,125
     */
    public List<Relationship> detectCdrRelationships(
            List<Entity> entities,
            String cdrText,
            String sourceFile) {

        List<Relationship> relationships =
                new ArrayList<>();

        if (entities == null
                || entities.isEmpty()
                || cdrText == null
                || cdrText.isBlank()) {

            log.info(
                    "CDR relationship extraction skipped: "
                            + "missing entities or CDR data."
            );

            return relationships;
        }

        Map<String, Entity> entityMap =
                new HashMap<>();

        for (Entity entity : entities) {

            if (entity == null
                    || entity.getName() == null
                    || entity.getName().isBlank()) {

                continue;
            }

            entityMap.put(
                    normalizeCdrValue(entity.getName()),
                    entity
            );
        }

        String[] lines =
                cdrText.split("\\r?\\n");

        int edgeCounter = 0;

        for (int i = 0; i < lines.length; i++) {

            String line =
                    lines[i].trim();

            if (line.isBlank()) {
                continue;
            }

            // Skip header row.
            if (i == 0 && isCdrHeader(line)) {
                continue;
            }

            String[] columns =
                    line.split(",");

            if (columns.length < 2) {
                continue;
            }

            String callerValue =
                    cleanCsvValue(columns[0]);

            String receiverValue =
                    cleanCsvValue(columns[1]);

            if (callerValue.isBlank()
                    || receiverValue.isBlank()) {

                continue;
            }

            Entity caller =
                    findCdrEntity(
                            entityMap,
                            callerValue
                    );

            Entity receiver =
                    findCdrEntity(
                            entityMap,
                            receiverValue
                    );

            if (caller == null
                    || receiver == null) {

                log.debug(
                        "CDR entities not found for row {}: {} -> {}",
                        i + 1,
                        callerValue,
                        receiverValue
                );

                continue;
            }

            // Ignore self-calls.
            if (caller.getNodeId() != null
                    && caller.getNodeId()
                            .equals(receiver.getNodeId())) {

                continue;
            }

            String timestamp =
                    columns.length > 2
                            ? cleanCsvValue(columns[2])
                            : "unknown";

            String duration =
                    columns.length > 3
                            ? cleanCsvValue(columns[3])
                            : "unknown";

            String evidence =
                    String.format(
                            Locale.ROOT,
                            "CDR call detected: '%s' called '%s'. "
                                    + "Timestamp: %s. Duration: %s. "
                                    + "Source: '%s'.",
                            caller.getName(),
                            receiver.getName(),
                            timestamp,
                            duration,
                            sourceFile
                    );

            Relationship relationship =
                    Relationship.builder()
                            .edgeId(
                                    "cdr_rel_"
                                            + (++edgeCounter)
                                            + "_"
                                            + System.currentTimeMillis()
                            )
                            .source(caller)
                            .target(receiver)
                            .type(RelationType.called)
                            .strength(Strength.medium)
                            .label("Called")
                            .confidence(0.95)
                            .evidence(evidence)
                            .sourceFile(sourceFile)
                            .build();

            relationships.add(
                    relationship
            );
        }

        relationships =
                deduplicateRelationships(
                        relationships
                );

        log.info(
                "CDR relationship extraction complete. "
                        + "Found {} call edges.",
                relationships.size()
        );

        return relationships;
    }

    // =========================================================
    // CDR ENTITY LOOKUP
    // =========================================================

    private Entity findCdrEntity(
            Map<String, Entity> entityMap,
            String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized =
                normalizeCdrValue(value);

        Entity entity =
                entityMap.get(normalized);

        if (entity != null) {
            return entity;
        }

        // Compare digits only for phone numbers.
        String digits =
                normalized.replaceAll("\\D", "");

        if (!digits.isBlank()) {

            for (Map.Entry<String, Entity> entry
                    : entityMap.entrySet()) {

                String entityDigits =
                        entry.getKey()
                                .replaceAll("\\D", "");

                if (!entityDigits.isBlank()
                        && entityDigits.equals(digits)) {

                    return entry.getValue();
                }
            }
        }

        return null;
    }

    // =========================================================
    // CDR NORMALIZATION
    // =========================================================

    private String normalizeCdrValue(
            String value) {

        if (value == null) {
            return "";
        }

        return value
                .trim()
                .replace("\"", "")
                .toLowerCase(Locale.ROOT);
    }

    // =========================================================
    // CSV CLEANING
    // =========================================================

    private String cleanCsvValue(
            String value) {

        if (value == null) {
            return "";
        }

        return value
                .trim()
                .replace("\"", "");
    }

    // =========================================================
    // CDR HEADER DETECTION
    // =========================================================

    private boolean isCdrHeader(
            String line) {

        String lower =
                line.toLowerCase(Locale.ROOT);

        return lower.contains("caller")
                || lower.contains("from")
                || lower.contains("source")
                || lower.contains("receiver")
                || lower.contains("recipient")
                || lower.contains("destination");
    }

    // =========================================================
    // DEDUPLICATION
    // =========================================================

    private List<Relationship> deduplicateRelationships(
            List<Relationship> relationships) {

        Map<String, Relationship> unique =
                new LinkedHashMap<>();

        for (Relationship relationship : relationships) {

            if (relationship == null
                    || relationship.getSource() == null
                    || relationship.getTarget() == null
                    || relationship.getType() == null) {

                continue;
            }

            String sourceId =
                    relationship.getSource()
                            .getNodeId();

            String targetId =
                    relationship.getTarget()
                            .getNodeId();

            String type =
                    relationship.getType()
                            .name();

            String key =
                    sourceId
                            + "::"
                            + targetId
                            + "::"
                            + type;

            Relationship existing =
                    unique.get(key);

            if (existing == null
                    || relationship.getConfidence()
                    > existing.getConfidence()) {

                unique.put(
                        key,
                        relationship
                );
            }
        }

        return new ArrayList<>(
                unique.values()
        );
    }
}