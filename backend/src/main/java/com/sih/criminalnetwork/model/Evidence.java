package com.sih.criminalnetwork.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

@jakarta.persistence.Entity
@Table(
    name = "evidence",
    indexes = {
        @Index(name = "idx_evidence_number", columnList = "evidenceNumber"),
        @Index(name = "idx_evidence_status", columnList = "status"),
        @Index(name = "idx_evidence_source_type", columnList = "sourceType"),
        @Index(name = "idx_evidence_case", columnList = "case_id")
    }
)
public class Evidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id")
    private Case investigationCase;

    @NotBlank
    @Column(nullable = false, length = 128)
    private String evidenceNumber;

    @NotBlank
    @Column(nullable = false, length = 255)
    private String fileName;

    @Column(length = 100)
    private String fileType;

    private Long fileSize;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String extractedText;

    @Column(length = 100)
    private String sourceType;

    @Column(columnDefinition = "TEXT")
    private String storagePath;

    @Column(length = 128)
    private String fileHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EvidenceStatus status;

    private String uploadedBy;

    private LocalDateTime uploadedAt;
    private LocalDateTime updatedAt;

    // ── Enums ──────────────────────────────────────────────────────

    public enum EvidenceStatus {
        UPLOADED,
        PROCESSING,
        PROCESSED,
        FAILED,
        ARCHIVED
    }

    // ── Lifecycle ──────────────────────────────────────────────────

    @PrePersist
    public void onCreate() {

        LocalDateTime now = LocalDateTime.now();

        if (evidenceNumber == null || evidenceNumber.isBlank()) {
            evidenceNumber = "EV-" + System.currentTimeMillis();
        }

        if (status == null) {
            status = EvidenceStatus.UPLOADED;
        }

        uploadedAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Constructor ────────────────────────────────────────────────

    public Evidence() {
    }

    // ── Getters ────────────────────────────────────────────────────

    public Long getId() {
        return id;
    }

    public String getEvidenceNumber() {
        return evidenceNumber;
    }

    public String getFileName() {
        return fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public String getDescription() {
        return description;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public String getSourceType() {
        return sourceType;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public String getFileHash() {
        return fileHash;
    }

    public EvidenceStatus getStatus() {
        return status;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public Case getInvestigationCase() {
        return investigationCase;
    }

    // ── Setters ────────────────────────────────────────────────────

    public void setId(Long id) {
        this.id = id;
    }

    public void setEvidenceNumber(String evidenceNumber) {
        this.evidenceNumber = evidenceNumber;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }

    public void setSourceType(String sourceType) {
        this.sourceType = sourceType;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public void setFileHash(String fileHash) {
        this.fileHash = fileHash;
    }

    public void setStatus(EvidenceStatus status) {
        this.status = status;
    }

    public void setUploadedBy(String uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setInvestigationCase(Case investigationCase) {
        this.investigationCase = investigationCase;
    }
}