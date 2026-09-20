package com.sih.criminalnetwork.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Relationship — directed edge between two Entity nodes.
 *
 * Existing relationship types are preserved for compatibility.
 * Additional types support communication, financial and graph analysis.
 */
@jakarta.persistence.Entity
@Table(
    name = "relationships",
    indexes = {
        @Index(name = "idx_relationship_edge_id", columnList = "edgeId"),
        @Index(name = "idx_relationship_type", columnList = "type"),
        @Index(name = "idx_relationship_source", columnList = "source_id"),
        @Index(name = "idx_relationship_target", columnList = "target_id")
    }
)
public class Relationship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 64)
    private String edgeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id", nullable = false)
    @NotNull
    private Entity source;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false)
    @NotNull
    private Entity target;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RelationType type;

    @Enumerated(EnumType.STRING)
    private Strength strength;

    private String label;

    /**
     * Confidence of the detected relationship.
     * Example: 0.94 = 94% confidence.
     */
    private Double confidence = 0.0;

    /**
     * Existing evidence text retained for compatibility.
     * Later this can be replaced/enhanced by Evidence references.
     */
    @Column(columnDefinition = "TEXT")
    private String evidence;

    private String sourceFile;

    private LocalDate firstSeen;
    private LocalDate lastSeen;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── Enums ──────────────────────────────────────────────────────

    /**
     * Existing values are preserved so current APIs and data continue
     * to work.
     */
    public enum RelationType {
        associate,
        financial,
        communication,
        family,

        // Additional network relationship types
        called,
        transferred,
        knows,
        works_for,
        owns,
        uses,
        located_at
    }

    public enum Strength {
        strong,
        medium,
        weak
    }

    // ── Lifecycle ──────────────────────────────────────────────────

    @PrePersist
    public void onCreate() {

        LocalDateTime now = LocalDateTime.now();

        if (confidence == null) {
            confidence = 0.0;
        }

        if (strength == null) {
            strength = Strength.medium;
        }

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Constructors ───────────────────────────────────────────────

    public Relationship() {}

    // ── Getters ────────────────────────────────────────────────────

    public Long getId() {
        return id;
    }

    public String getEdgeId() {
        return edgeId;
    }

    public Entity getSource() {
        return source;
    }

    public Entity getTarget() {
        return target;
    }

    public RelationType getType() {
        return type;
    }

    public Strength getStrength() {
        return strength;
    }

    public String getLabel() {
        return label;
    }

    public Double getConfidence() {
        return confidence;
    }

    public String getEvidence() {
        return evidence;
    }

    public String getSourceFile() {
        return sourceFile;
    }

    public LocalDate getFirstSeen() {
        return firstSeen;
    }

    public LocalDate getLastSeen() {
        return lastSeen;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // ── Setters ────────────────────────────────────────────────────

    public void setId(Long id) {
        this.id = id;
    }

    public void setEdgeId(String edgeId) {
        this.edgeId = edgeId;
    }

    public void setSource(Entity source) {
        this.source = source;
    }

    public void setTarget(Entity target) {
        this.target = target;
    }

    public void setType(RelationType type) {
        this.type = type;
    }

    public void setStrength(Strength strength) {
        this.strength = strength;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public void setEvidence(String evidence) {
        this.evidence = evidence;
    }

    public void setSourceFile(String sourceFile) {
        this.sourceFile = sourceFile;
    }

    public void setFirstSeen(LocalDate firstSeen) {
        this.firstSeen = firstSeen;
    }

    public void setLastSeen(LocalDate lastSeen) {
        this.lastSeen = lastSeen;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // ── Builder ────────────────────────────────────────────────────

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {

        private final Relationship r = new Relationship();

        public Builder edgeId(String v) {
            r.edgeId = v;
            return this;
        }

        public Builder source(Entity v) {
            r.source = v;
            return this;
        }

        public Builder target(Entity v) {
            r.target = v;
            return this;
        }

        public Builder type(RelationType v) {
            r.type = v;
            return this;
        }

        public Builder strength(Strength v) {
            r.strength = v;
            return this;
        }

        public Builder label(String v) {
            r.label = v;
            return this;
        }

        public Builder confidence(Double v) {
            r.confidence = v;
            return this;
        }

        public Builder evidence(String v) {
            r.evidence = v;
            return this;
        }

        public Builder sourceFile(String v) {
            r.sourceFile = v;
            return this;
        }

        public Builder firstSeen(LocalDate v) {
            r.firstSeen = v;
            return this;
        }

        public Builder lastSeen(LocalDate v) {
            r.lastSeen = v;
            return this;
        }

        public Relationship build() {
            return r;
        }
    }
}