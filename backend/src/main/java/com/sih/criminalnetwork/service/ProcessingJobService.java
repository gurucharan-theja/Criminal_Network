package com.sih.criminalnetwork.service;

import com.sih.criminalnetwork.exception.EntityNotFoundException;
import com.sih.criminalnetwork.model.Evidence;
import com.sih.criminalnetwork.model.ProcessingJob;
import com.sih.criminalnetwork.model.ProcessingJob.ProcessingStatus;
import com.sih.criminalnetwork.repository.EvidenceRepository;
import com.sih.criminalnetwork.repository.ProcessingJobRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProcessingJobService {

    private final ProcessingJobRepository jobRepo;
    private final EvidenceRepository evidenceRepo;

    public ProcessingJobService(
            ProcessingJobRepository jobRepo,
            EvidenceRepository evidenceRepo) {

        this.jobRepo = jobRepo;
        this.evidenceRepo = evidenceRepo;
    }

    /**
     * Get all processing jobs, newest first.
     */
    public List<ProcessingJob> getAllJobs() {
        return jobRepo.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Get a processing job by database ID.
     */
    public ProcessingJob getJobById(Long id) {
        return jobRepo.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException("ProcessingJob#" + id));
    }

    /**
     * Get a processing job by public job ID.
     */
    public ProcessingJob getJobByJobId(String jobId) {
        return jobRepo.findByJobId(jobId)
                .orElseThrow(() ->
                        new EntityNotFoundException(jobId));
    }

    /**
     * Get all jobs belonging to one evidence record.
     */
    public List<ProcessingJob> getJobsByEvidence(Long evidenceId) {

        if (!evidenceRepo.existsById(evidenceId)) {
            throw new EntityNotFoundException("Evidence#" + evidenceId);
        }

        return jobRepo.findByEvidenceId(evidenceId);
    }

    /**
     * Create a new processing job for an evidence record.
     */
    @Transactional
public ProcessingJob createJob(Long evidenceId) {

    Evidence evidence = evidenceRepo.findById(evidenceId)
            .orElseThrow(() ->
                    new EntityNotFoundException("Evidence#" + evidenceId));

    evidence.setStatus(Evidence.EvidenceStatus.PROCESSING);
    evidenceRepo.save(evidence);

    ProcessingJob job = new ProcessingJob();
    job.setEvidence(evidence);
    job.setStatus(ProcessingStatus.QUEUED);
    job.setProgress(0);
    job.setCurrentStage("Queued");

    return jobRepo.save(job);
}
    /**
     * Update the processing progress and current stage.
     */
  @Transactional
public ProcessingJob updateProgress(
        Long id,
        int progress,
        String stage) {

    ProcessingJob job = getJobById(id);

    if (progress < 0) {
        progress = 0;
    }

    if (progress > 100) {
        progress = 100;
    }

    job.setProgress(progress);
    job.setCurrentStage(stage);

    if (job.getStatus() == ProcessingStatus.QUEUED) {
        job.setStatus(ProcessingStatus.PROCESSING);
        job.setStartedAt(LocalDateTime.now());
    }

    Evidence evidence = job.getEvidence();

    if (evidence != null
            && evidence.getStatus() != Evidence.EvidenceStatus.PROCESSING) {

        evidence.setStatus(Evidence.EvidenceStatus.PROCESSING);
        evidenceRepo.save(evidence);
    }

    return jobRepo.save(job);
}
    /**
     * Mark a processing job as completed.
     */
    @Transactional
public ProcessingJob completeJob(Long id) {

    ProcessingJob job = getJobById(id);

    job.setStatus(ProcessingStatus.COMPLETED);
    job.setProgress(100);
    job.setCurrentStage("Completed");

    if (job.getStartedAt() == null) {
        job.setStartedAt(LocalDateTime.now());
    }

    job.setCompletedAt(LocalDateTime.now());

    Evidence evidence = job.getEvidence();

    if (evidence != null) {
        evidence.setStatus(Evidence.EvidenceStatus.PROCESSED);
        evidenceRepo.save(evidence);
    }

    return jobRepo.save(job);
}

    /**
     * Mark a processing job as failed.
     */
    @Transactional
public ProcessingJob failJob(Long id, String errorMessage) {

    ProcessingJob job = getJobById(id);

    job.setStatus(ProcessingStatus.FAILED);
    job.setCurrentStage("Failed");
    job.setErrorMessage(errorMessage);
    job.setCompletedAt(LocalDateTime.now());

    Evidence evidence = job.getEvidence();

    if (evidence != null) {
        evidence.setStatus(Evidence.EvidenceStatus.FAILED);
        evidenceRepo.save(evidence);
    }

    return jobRepo.save(job);
}
}