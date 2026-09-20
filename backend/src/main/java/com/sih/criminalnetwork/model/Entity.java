package com.sih.criminalnetwork.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity — represents a node in the criminal network graph.
 *
 * Supported types:
 * Person | Organization | Location | Vehicle |
 * Phone | Wallet | Account
 */
@jakarta.persistence.Entity
@Table(
    name = "entities",
    indexes = {
        @Index(name = "idx_entity_node_id", columnList = "nodeId"),
        @Index(name = "idx_entity_name", columnList = "name"),
        @Index(name = "idx_entity_type", columnList = "type"),
        @Index(name = "idx_entity_risk", columnList = "risk"),
        @Index(name = "idx_entity_source_file", columnList = "sourceFile")
    }
)
public class Entity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 64)
    private String nodeId;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntityType type;

    private String role;

    /**
     * Risk belongs to an Entity, not to a Case.
     * Keep this because the existing analysis layer uses it.
     */
    @Enumerated(EnumType.STRING)
    private RiskLevel risk;

    @Enumerated(EnumType.STRING)
    private Status status;

    private String location;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String tags;
    private String avatar;

    private Integer connections = 0;
    private Integer financialLinks = 0;

    private LocalDate firstSeen;
    private LocalDate lastSeen;

    /**
     * Confidence of the extracted/identified entity.
     * Example: 0.94 = 94% confidence.
     */
    private Double confidence = 0.0;

    private String sourceFile;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── Enums ──────────────────────────────────────────────────────

    public enum EntityType {
        Person,
        Organization,
        Location,
        Vehicle,
        Phone,
        Wallet,
        Account
    }

    public enum RiskLevel {
        high,
        medium,
        low
    }

    public enum Status {
        ACTIVE,
        ARRESTED,
        DECEASED,
        UNKNOWN
    }

    // ── Lifecycle ──────────────────────────────────────────────────

    @PrePersist
    public void onCreate() {

        LocalDateTime now = LocalDateTime.now();

        if (risk == null) {
            risk = RiskLevel.medium;
        }

        if (status == null) {
            status = Status.UNKNOWN;
        }

        if (connections == null) {
            connections = 0;
        }

        if (financialLinks == null) {
            financialLinks = 0;
        }

        if (confidence == null) {
            confidence = 0.0;
        }

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Constructors ───────────────────────────────────────────────

    public Entity() {}

    // ── Getters ────────────────────────────────────────────────────

    public Long getId() {
        return id;
    }

    public String getNodeId() {
        return nodeId;
    }

    public String getName() {
        return name;
    }

    public EntityType getType() {
        return type;
    }

    public String getRole() {
        return role;
    }

    public RiskLevel getRisk() {
        return risk;
    }

    public Status getStatus() {
        return status;
    }

    public String getLocation() {
        return location;
    }

    public String getBio() {
        return bio;
    }

    public String getTags() {
        return tags;
    }

    public String getAvatar() {
        return avatar;
    }

    public Integer getConnections() {
        return connections;
    }

    public Integer getFinancialLinks() {
        return financialLinks;
    }

    public LocalDate getFirstSeen() {
        return firstSeen;
    }

    public LocalDate getLastSeen() {
        return lastSeen;
    }

    public Double getConfidence() {
        return confidence;
    }

    public String getSourceFile() {
        return sourceFile;
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

    public void setNodeId(String nodeId) {
        this.nodeId = nodeId;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setType(EntityType type) {
        this.type = type;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public void setRisk(RiskLevel risk) {
        this.risk = risk;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public void setConnections(Integer connections) {
        this.connections = connections;
    }

    public void setFinancialLinks(Integer financialLinks) {
        this.financialLinks = financialLinks;
    }

    public void setFirstSeen(LocalDate firstSeen) {
        this.firstSeen = firstSeen;
    }

    public void setLastSeen(LocalDate lastSeen) {
        this.lastSeen = lastSeen;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public void setSourceFile(String sourceFile) {
        this.sourceFile = sourceFile;
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

        private final Entity e = new Entity();

        public Builder nodeId(String v) {
            e.nodeId = v;
            return this;
        }

        public Builder name(String v) {
            e.name = v;
            return this;
        }

        public Builder type(EntityType v) {
            e.type = v;
            return this;
        }

        public Builder role(String v) {
            e.role = v;
            return this;
        }

        public Builder risk(RiskLevel v) {
            e.risk = v;
            return this;
        }

        public Builder status(Status v) {
            e.status = v;
            return this;
        }

        public Builder location(String v) {
            e.location = v;
            return this;
        }

        public Builder bio(String v) {
            e.bio = v;
            return this;
        }

        public Builder tags(String v) {
            e.tags = v;
            return this;
        }

        public Builder avatar(String v) {
            e.avatar = v;
            return this;
        }

        public Builder connections(Integer v) {
            e.connections = v;
            return this;
        }

        public Builder financialLinks(Integer v) {
            e.financialLinks = v;
            return this;
        }

        public Builder firstSeen(LocalDate v) {
            e.firstSeen = v;
            return this;
        }

        public Builder lastSeen(LocalDate v) {
            e.lastSeen = v;
            return this;
        }

        public Builder confidence(Double v) {
            e.confidence = v;
            return this;
        }

        public Builder sourceFile(String v) {
            e.sourceFile = v;
            return this;
        }

        public Entity build() {
            return e;
        }
    }
}