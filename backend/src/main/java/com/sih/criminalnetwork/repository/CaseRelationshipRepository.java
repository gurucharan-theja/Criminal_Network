package com.sih.criminalnetwork.repository;

import com.sih.criminalnetwork.model.CaseRelationship;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CaseRelationshipRepository
        extends JpaRepository<CaseRelationship, Long> {

    List<CaseRelationship> findByInvestigationCaseId(Long caseId);

    List<CaseRelationship> findByRelationshipId(Long relationshipId);

    Optional<CaseRelationship> findByInvestigationCaseIdAndRelationshipId(
            Long caseId,
            Long relationshipId
    );

    boolean existsByInvestigationCaseIdAndRelationshipId(
            Long caseId,
            Long relationshipId
    );

    void deleteByInvestigationCaseId(Long caseId);

    void deleteByRelationshipId(Long relationshipId);
}