package com.sih.criminalnetwork.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

/**
 * Case — represents an investigation case that groups entities & documents.
 */
@jakarta.persistence.Entity
@Table(name = "cases")
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 64)
    private String caseNumber;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CaseStatus status;

    @Enumerated(EnumType.STRING)
    private RiskLevel risk;

    private String investigator;
    private String department;

    @Column(columnDefinition = "TEXT")
    private String sourceFiles;   // comma-separated uploaded file names

    private Integer entityCount   = 0;
    private Integer relationCount = 0;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime closedAt;

    // ── Enums ──────────────────────────────────────────────────────
    public enum CaseStatus { active, closed, pending }
    public enum RiskLevel  { high, medium, low }

    // ── Lifecycle ──────────────────────────────────────────────────
    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (caseNumber == null)
            caseNumber = "CASE-" + System.currentTimeMillis();
    }

    @PreUpdate
    public void onUpdate() { updatedAt = LocalDateTime.now(); }

    // ── Constructors ───────────────────────────────────────────────
    public Case() {}

    // ── Getters ────────────────────────────────────────────────────
    public Long          getId()           { return id; }
    public String        getCaseNumber()   { return caseNumber; }
    public String        getTitle()        { return title; }
    public String        getDescription()  { return description; }
    public CaseStatus    getStatus()       { return status; }
    public RiskLevel     getRisk()         { return risk; }
    public String        getInvestigator() { return investigator; }
    public String        getDepartment()   { return department; }
    public String        getSourceFiles()  { return sourceFiles; }
    public Integer       getEntityCount()  { return entityCount; }
    public Integer       getRelationCount(){ return relationCount; }
    public LocalDateTime getCreatedAt()    { return createdAt; }
    public LocalDateTime getUpdatedAt()    { return updatedAt; }
    public LocalDateTime getClosedAt()     { return closedAt; }

    // ── Setters ────────────────────────────────────────────────────
    public void setId(Long id)                       { this.id = id; }
    public void setCaseNumber(String v)              { this.caseNumber = v; }
    public void setTitle(String v)                   { this.title = v; }
    public void setDescription(String v)             { this.description = v; }
    public void setStatus(CaseStatus v)              { this.status = v; }
    public void setRisk(RiskLevel v)                 { this.risk = v; }
    public void setInvestigator(String v)            { this.investigator = v; }
    public void setDepartment(String v)              { this.department = v; }
    public void setSourceFiles(String v)             { this.sourceFiles = v; }
    public void setEntityCount(Integer v)            { this.entityCount = v; }
    public void setRelationCount(Integer v)          { this.relationCount = v; }
    public void setCreatedAt(LocalDateTime v)        { this.createdAt = v; }
    public void setUpdatedAt(LocalDateTime v)        { this.updatedAt = v; }
    public void setClosedAt(LocalDateTime v)         { this.closedAt = v; }

    // ── Builder ────────────────────────────────────────────────────
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Case c = new Case();
        public Builder caseNumber(String v)   { c.caseNumber = v;   return this; }
        public Builder title(String v)        { c.title = v;        return this; }
        public Builder description(String v)  { c.description = v;  return this; }
        public Builder status(CaseStatus v)   { c.status = v;       return this; }
        public Builder risk(RiskLevel v)      { c.risk = v;         return this; }
        public Builder investigator(String v) { c.investigator = v; return this; }
        public Builder department(String v)   { c.department = v;   return this; }
        public Builder sourceFiles(String v)  { c.sourceFiles = v;  return this; }
        public Builder entityCount(int v)     { c.entityCount = v;  return this; }
        public Builder relationCount(int v)   { c.relationCount = v;return this; }
        public Case build()                   { return c; }
    }
}
