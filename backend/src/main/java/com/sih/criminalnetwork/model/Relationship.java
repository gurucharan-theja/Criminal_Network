package com.sih.criminalnetwork.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

/**
 * Relationship — directed edge between two Entity nodes.
 * Types:    associate | financial | communication | family
 * Strength: strong    | medium    | weak
 */
@jakarta.persistence.Entity
@Table(name = "relationships")
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
    private Double confidence;

    @Column(columnDefinition = "TEXT")
    private String evidence;

    private String sourceFile;

    // ── Enums ──────────────────────────────────────────────────────
    public enum RelationType { associate, financial, communication, family }
    public enum Strength     { strong, medium, weak }

    // ── Constructors ───────────────────────────────────────────────
    public Relationship() {}

    // ── Getters ────────────────────────────────────────────────────
    public Long         getId()         { return id; }
    public String       getEdgeId()     { return edgeId; }
    public Entity       getSource()     { return source; }
    public Entity       getTarget()     { return target; }
    public RelationType getType()       { return type; }
    public Strength     getStrength()   { return strength; }
    public String       getLabel()      { return label; }
    public Double       getConfidence() { return confidence; }
    public String       getEvidence()   { return evidence; }
    public String       getSourceFile() { return sourceFile; }

    // ── Setters ────────────────────────────────────────────────────
    public void setId(Long id)                   { this.id = id; }
    public void setEdgeId(String edgeId)         { this.edgeId = edgeId; }
    public void setSource(Entity source)         { this.source = source; }
    public void setTarget(Entity target)         { this.target = target; }
    public void setType(RelationType type)       { this.type = type; }
    public void setStrength(Strength strength)   { this.strength = strength; }
    public void setLabel(String label)           { this.label = label; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }
    public void setEvidence(String evidence)     { this.evidence = evidence; }
    public void setSourceFile(String sourceFile) { this.sourceFile = sourceFile; }

    // ── Builder ────────────────────────────────────────────────────
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Relationship r = new Relationship();
        public Builder edgeId(String v)          { r.edgeId = v;      return this; }
        public Builder source(Entity v)          { r.source = v;      return this; }
        public Builder target(Entity v)          { r.target = v;      return this; }
        public Builder type(RelationType v)      { r.type = v;        return this; }
        public Builder strength(Strength v)      { r.strength = v;    return this; }
        public Builder label(String v)           { r.label = v;       return this; }
        public Builder confidence(Double v)      { r.confidence = v;  return this; }
        public Builder evidence(String v)        { r.evidence = v;    return this; }
        public Builder sourceFile(String v)      { r.sourceFile = v;  return this; }
        public Relationship build()              { return r; }
    }
}
