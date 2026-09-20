package com.sih.criminalnetwork.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * CaseEntity — associates an investigation case with a network entity.
 *
 * This allows the same Entity to potentially appear in multiple
 * investigations while preserving case-specific membership.
 */
@jakarta.persistence.Entity
@Table(
    name = "case_entities",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_case_entity",
            columnNames = {"case_id", "entity_id"}
        )
    }
)
public class CaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_id", nullable = false)
    private Case investigationCase;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entity_id", nullable = false)
    private Entity entity;

    @Column(nullable = false)
    private LocalDateTime addedAt;

    private String addedFromEvidence;

    public CaseEntity() {}

    @PrePersist
    public void onCreate() {
        if (addedAt == null) {
            addedAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Case getInvestigationCase() {
        return investigationCase;
    }

    public Entity getEntity() {
        return entity;
    }

    public LocalDateTime getAddedAt() {
        return addedAt;
    }

    public String getAddedFromEvidence() {
        return addedFromEvidence;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setInvestigationCase(Case investigationCase) {
        this.investigationCase = investigationCase;
    }

    public void setEntity(Entity entity) {
        this.entity = entity;
    }

    public void setAddedAt(LocalDateTime addedAt) {
        this.addedAt = addedAt;
    }

    public void setAddedFromEvidence(String addedFromEvidence) {
        this.addedFromEvidence = addedFromEvidence;
    }
}