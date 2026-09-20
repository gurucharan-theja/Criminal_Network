package com.sih.criminalnetwork.repository;

import com.sih.criminalnetwork.model.Evidence;
import com.sih.criminalnetwork.model.Evidence.EvidenceStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, Long> {

    Optional<Evidence> findByEvidenceNumber(String evidenceNumber);

    List<Evidence> findByStatus(EvidenceStatus status);

    List<Evidence> findBySourceType(String sourceType);

    List<Evidence> findByFileName(String fileName);

    List<Evidence> findAllByOrderByUploadedAtDesc();
    List<Evidence> findByInvestigationCaseId(Long caseId);
}