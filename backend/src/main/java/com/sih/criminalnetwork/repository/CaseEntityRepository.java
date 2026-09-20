package com.sih.criminalnetwork.repository;

import com.sih.criminalnetwork.model.CaseEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseEntityRepository
        extends JpaRepository<CaseEntity, Long> {

    List<CaseEntity> findByInvestigationCaseId(Long caseId);

    List<CaseEntity> findByEntityId(Long entityId);

    Optional<CaseEntity> findByInvestigationCaseIdAndEntityId(
            Long caseId,
            Long entityId
    );

    boolean existsByInvestigationCaseIdAndEntityId(
            Long caseId,
            Long entityId
    );

    void deleteByInvestigationCaseId(Long caseId);

    void deleteByEntityId(Long entityId);
}