package com.sih.criminalnetwork.service;

import com.sih.criminalnetwork.model.Entity;
import com.sih.criminalnetwork.model.Relationship;
import com.sih.criminalnetwork.model.Relationship.RelationType;
import com.sih.criminalnetwork.model.Relationship.Strength;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * RelationshipService
 * Detects relationships between entities via co-occurrence proximity analysis.
 */
@Service
public class RelationshipService {

    private static final Logger log = LoggerFactory.getLogger(RelationshipService.class);

    private static final int PROXIMITY_WINDOW = 400;

    private static final List<String> FINANCIAL_KEYWORDS = List.of(
            "paid", "transferred", "funded", "laundered", "hawala",
            "wire", "transaction", "account", "money", "rupee", "crore"
    );

    private static final List<String> COMMUNICATION_KEYWORDS = List.of(
            "called", "messaged", "contacted", "communicated",
            "signal", "whatsapp", "telegram", "encrypted", "phone"
    );

    private static final List<String> FAMILY_KEYWORDS = List.of(
            "brother", "sister", "wife", "husband", "son",
            "daughter", "cousin", "uncle", "relative", "kin"
    );

    private static final List<String> STRONG_INDICATORS = List.of(
            "repeatedly", "regularly", "daily", "weekly",
            "multiple times", "consistently", "frequent"
    );

    private static final List<String> WEAK_INDICATORS = List.of(
            "once", "single", "briefly", "allegedly",
            "suspected", "possibly", "unconfirmed"
    );

    public List<Relationship> detectRelationships(
            List<Entity> entities, String text, String sourceFile) {

        log.info("Detecting relationships among {} entities in '{}'", entities.size(), sourceFile);

        List<Relationship> relationships = new ArrayList<>();
        int edgeCounter = 0;

        Map<Entity, List<Integer>> mentionIndex = buildMentionIndex(entities, text);

        for (int i = 0; i < entities.size(); i++) {
            for (int j = i + 1; j < entities.size(); j++) {
                Entity source = entities.get(i);
                Entity target = entities.get(j);

                List<Integer> srcPositions = mentionIndex.getOrDefault(source, List.of());
                List<Integer> tgtPositions = mentionIndex.getOrDefault(target, List.of());

                Optional<int[]> closest = findClosestPair(srcPositions, tgtPositions);
                if (closest.isEmpty()) continue;

                int[] pair = closest.get();
                int distance = Math.abs(pair[0] - pair[1]);
                if (distance > PROXIMITY_WINDOW) continue;

                int coOccurrences = countCoOccurrences(srcPositions, tgtPositions, PROXIMITY_WINDOW);

                int contextStart = Math.max(0, Math.min(pair[0], pair[1]) - 100);
                int contextEnd   = Math.min(text.length(), Math.max(pair[0], pair[1]) + 100);
                String context   = text.substring(contextStart, contextEnd);

                RelationType type     = classifyRelationType(context);
                Strength     strength = classifyStrength(context, coOccurrences);
                String       label    = buildLabel(type);
                double       confidence = computeConfidence(coOccurrences, distance);

                Relationship rel = Relationship.builder()
                        .edgeId("rel_" + (++edgeCounter) + "_" + System.currentTimeMillis())
                        .source(source)
                        .target(target)
                        .type(type)
                        .strength(strength)
                        .label(label)
                        .confidence(confidence)
                        .evidence("Co-occurred " + coOccurrences + " time(s) within "
                                + distance + " characters in '" + sourceFile + "'.")
                        .sourceFile(sourceFile)
                        .build();

                relationships.add(rel);
            }
        }

        log.info("Relationship detection complete. Found {} edges.", relationships.size());
        return relationships;
    }

    private Map<Entity, List<Integer>> buildMentionIndex(List<Entity> entities, String text) {
        Map<Entity, List<Integer>> index = new HashMap<>();
        for (Entity entity : entities) {
            List<Integer> positions = new ArrayList<>();
            String name = entity.getName();
            int pos = 0;
            while ((pos = text.toLowerCase().indexOf(name.toLowerCase(), pos)) != -1) {
                positions.add(pos);
                pos += name.length();
            }
            if (!positions.isEmpty()) index.put(entity, positions);
        }
        return index;
    }

    private Optional<int[]> findClosestPair(List<Integer> srcPos, List<Integer> tgtPos) {
        int minDist = Integer.MAX_VALUE;
        int[] best  = null;
        for (int s : srcPos) {
            for (int t : tgtPos) {
                int dist = Math.abs(s - t);
                if (dist < minDist) { minDist = dist; best = new int[]{s, t}; }
            }
        }
        return Optional.ofNullable(best);
    }

    private int countCoOccurrences(List<Integer> srcPos, List<Integer> tgtPos, int window) {
        int count = 0;
        for (int s : srcPos) for (int t : tgtPos) if (Math.abs(s - t) <= window) count++;
        return count;
    }

    public RelationType classifyRelationType(String context) {
        String lower = context.toLowerCase();
        if (FINANCIAL_KEYWORDS.stream().anyMatch(lower::contains))     return RelationType.financial;
        if (COMMUNICATION_KEYWORDS.stream().anyMatch(lower::contains)) return RelationType.communication;
        if (FAMILY_KEYWORDS.stream().anyMatch(lower::contains))        return RelationType.family;
        return RelationType.associate;
    }

    public Strength classifyStrength(String context, int coOccurrences) {
        String lower = context.toLowerCase();
        if (coOccurrences >= 3 || STRONG_INDICATORS.stream().anyMatch(lower::contains)) return Strength.strong;
        if (WEAK_INDICATORS.stream().anyMatch(lower::contains)) return Strength.weak;
        return Strength.medium;
    }

    private String buildLabel(RelationType type) {
        return switch (type) {
            case financial     -> "Transacts with";
            case communication -> "Communicates with";
            case family        -> "Family of";
            case associate     -> "Associated with";
        };
    }

    private double computeConfidence(int coOccurrences, int distance) {
        double occScore  = Math.min(1.0, coOccurrences / 5.0);
        double distScore = 1.0 - Math.min(1.0, distance / (double) PROXIMITY_WINDOW);
        return Math.round(((occScore + distScore) / 2.0) * 100.0) / 100.0;
    }
}
