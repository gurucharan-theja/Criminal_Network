package com.sih.criminalnetwork.dto;

import com.sih.criminalnetwork.model.ProcessingJob;

/**
 * ProcessingJobDTO — API representation of an evidence processing job.
 */
public class ProcessingJobDTO {

    public Long id;
    public String jobId;

    public Long evidenceId;
    public String evidenceNumber;
    public String fileName;

    public String status;
    public Integer progress;
    public String currentStage;
    public String errorMessage;

    public String startedAt;
    public String completedAt;
    public String createdAt;
    public String updatedAt;

    public static ProcessingJobDTO from(ProcessingJob job) {

        ProcessingJobDTO dto = new ProcessingJobDTO();

        dto.id = job.getId();
        dto.jobId = job.getJobId();

        if (job.getEvidence() != null) {
            dto.evidenceId = job.getEvidence().getId();
            dto.evidenceNumber = job.getEvidence().getEvidenceNumber();
            dto.fileName = job.getEvidence().getFileName();
        }

        dto.status = job.getStatus() != null
                ? job.getStatus().name()
                : null;

        dto.progress = job.getProgress();
        dto.currentStage = job.getCurrentStage();
        dto.errorMessage = job.getErrorMessage();

        dto.startedAt = job.getStartedAt() != null
                ? job.getStartedAt().toString()
                : null;

        dto.completedAt = job.getCompletedAt() != null
                ? job.getCompletedAt().toString()
                : null;

        dto.createdAt = job.getCreatedAt() != null
                ? job.getCreatedAt().toString()
                : null;

        dto.updatedAt = job.getUpdatedAt() != null
                ? job.getUpdatedAt().toString()
                : null;

        return dto;
    }
}