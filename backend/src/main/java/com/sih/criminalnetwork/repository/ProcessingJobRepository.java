package com.sih.criminalnetwork.repository;

import com.sih.criminalnetwork.model.ProcessingJob;
import com.sih.criminalnetwork.model.ProcessingJob.ProcessingStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcessingJobRepository
        extends JpaRepository<ProcessingJob, Long> {

    Optional<ProcessingJob> findByJobId(String jobId);

    List<ProcessingJob> findByStatus(ProcessingStatus status);

    List<ProcessingJob> findByEvidenceId(Long evidenceId);

    List<ProcessingJob> findAllByOrderByCreatedAtDesc();
}