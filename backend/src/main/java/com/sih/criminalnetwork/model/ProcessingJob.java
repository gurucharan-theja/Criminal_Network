package com.sih.criminalnetwork.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@jakarta.persistence.Entity
@Table(name = "processing_jobs")
public class ProcessingJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 64)
    private String jobId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id", nullable = false)
    private Evidence evidence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProcessingStatus status;

    private Integer progress;

    @Column(length = 100)
    private String currentStage;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── Enum ───────────────────────────────────────────────────────

    public enum ProcessingStatus {
        QUEUED,
        PROCESSING,
        COMPLETED,
        FAILED
    }

    // ── Lifecycle ──────────────────────────────────────────────────

    @PrePersist
    public void onCreate() {

        LocalDateTime now = LocalDateTime.now();

        if (jobId == null || jobId.isBlank()) {
            jobId = "JOB-" + System.currentTimeMillis();
        }

        if (status == null) {
            status = ProcessingStatus.QUEUED;
        }

        if (progress == null) {
            progress = 0;
        }

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Constructor ────────────────────────────────────────────────

    public ProcessingJob() {}

    // ── Getters ────────────────────────────────────────────────────

    public Long getId() {
        return id;
    }

    public String getJobId() {
        return jobId;
    }

    public Evidence getEvidence() {
        return evidence;
    }

    public ProcessingStatus getStatus() {
        return status;
    }

    public Integer getProgress() {
        return progress;
    }

    public String getCurrentStage() {
        return currentStage;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
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

    public void setJobId(String jobId) {
        this.jobId = jobId;
    }

    public void setEvidence(Evidence evidence) {
        this.evidence = evidence;
    }

    public void setStatus(ProcessingStatus status) {
        this.status = status;
    }

    public void setProgress(Integer progress) {
        this.progress = progress;
    }

    public void setCurrentStage(String currentStage) {
        this.currentStage = currentStage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}