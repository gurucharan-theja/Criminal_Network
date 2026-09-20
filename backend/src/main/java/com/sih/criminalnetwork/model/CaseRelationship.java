package com.sih.criminalnetwork.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@jakarta.persistence.Entity
@Table(
    name = "case_relationships",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_case_relationship",
            columnNames = {"case_id", "relationship_id"}
        )
    }
)
public class CaseRelationship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_id", nullable = false)
    private Case investigationCase;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "relationship_id", nullable = false)
    private Relationship relationship;

    @Column(nullable = false)
    private LocalDateTime addedAt;

    private String addedFromEvidence;

    @PrePersist
    protected void onCreate() {
        if (addedAt == null) {
            addedAt = LocalDateTime.now();
        }
    }

    public CaseRelationship() {
    }

    public CaseRelationship(
            Case investigationCase,
            Relationship relationship,
            String addedFromEvidence
    ) {
        this.investigationCase = investigationCase;
        this.relationship = relationship;
        this.addedFromEvidence = addedFromEvidence;
    }

    public Long getId() {
        return id;
    }

    public Case getInvestigationCase() {
        return investigationCase;
    }

    public void setInvestigationCase(Case investigationCase) {
        this.investigationCase = investigationCase;
    }

    public Relationship getRelationship() {
        return relationship;
    }

    public void setRelationship(Relationship relationship) {
        this.relationship = relationship;
    }

    public LocalDateTime getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(LocalDateTime addedAt) {
        this.addedAt = addedAt;
    }

    public String getAddedFromEvidence() {
        return addedFromEvidence;
    }

    public void setAddedFromEvidence(String addedFromEvidence) {
        this.addedFromEvidence = addedFromEvidence;
    }
}