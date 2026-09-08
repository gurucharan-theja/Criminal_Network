package com.sih.criminalnetwork.repository;

import com.sih.criminalnetwork.model.Case;
import com.sih.criminalnetwork.model.Case.CaseStatus;
import com.sih.criminalnetwork.model.Case.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseRepository extends JpaRepository<Case, Long> {

    Optional<Case> findByCaseNumber(String caseNumber);

    List<Case> findByStatus(CaseStatus status);

    List<Case> findByRisk(RiskLevel risk);

    List<Case> findByInvestigator(String investigator);

    long countByStatus(CaseStatus status);

    @Query("""
        SELECT c FROM Case c
        WHERE LOWER(c.title)        LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(c.caseNumber)   LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(c.investigator) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(c.description)  LIKE LOWER(CONCAT('%', :q, '%'))
    """)
    List<Case> search(String q);

    List<Case> findAllByOrderByCreatedAtDesc();
}
