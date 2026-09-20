package com.sih.criminalnetwork.service;

import com.sih.criminalnetwork.model.Case;
import com.sih.criminalnetwork.model.CaseRelationship;
import com.sih.criminalnetwork.model.Relationship;
import com.sih.criminalnetwork.repository.CaseRelationshipRepository;
import com.sih.criminalnetwork.repository.CaseRepository;
import com.sih.criminalnetwork.repository.RelationshipRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CaseRelationshipService {

    private final CaseRelationshipRepository caseRelationshipRepository;
    private final CaseRepository caseRepository;
    private final RelationshipRepository relationshipRepository;

    public CaseRelationshipService(
            CaseRelationshipRepository caseRelationshipRepository,
            CaseRepository caseRepository,
            RelationshipRepository relationshipRepository
    ) {
        this.caseRelationshipRepository = caseRelationshipRepository;
        this.caseRepository = caseRepository;
        this.relationshipRepository = relationshipRepository;
    }

    public List<CaseRelationship> getRelationshipsByCase(Long caseId) {
        return caseRelationshipRepository.findByInvestigationCaseId(caseId);
    }

    public List<CaseRelationship> getCasesByRelationship(Long relationshipId) {
        return caseRelationshipRepository.findByRelationshipId(relationshipId);
    }

    @Transactional
    public CaseRelationship addRelationshipToCase(
            Long caseId,
            Long relationshipId,
            String evidenceSource
    ) {
        if (caseRelationshipRepository
                .existsByInvestigationCaseIdAndRelationshipId(caseId, relationshipId)) {
            throw new IllegalArgumentException(
                    "Relationship is already associated with this case"
            );
        }

        Case investigationCase = caseRepository.findById(caseId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Case not found: " + caseId
                        ));

        Relationship relationship = relationshipRepository.findById(relationshipId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Relationship not found: " + relationshipId
                        ));

        CaseRelationship caseRelationship = new CaseRelationship(
                investigationCase,
                relationship,
                evidenceSource
        );

        return caseRelationshipRepository.save(caseRelationship);
    }

    @Transactional
    public void removeRelationshipFromCase(
            Long caseId,
            Long relationshipId
    ) {
        CaseRelationship caseRelationship =
                caseRelationshipRepository
                        .findByInvestigationCaseIdAndRelationshipId(
                                caseId,
                                relationshipId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Relationship is not associated with this case"
                                ));

        caseRelationshipRepository.delete(caseRelationship);
    }

    public boolean isRelationshipInCase(
            Long caseId,
            Long relationshipId
    ) {
        return caseRelationshipRepository
                .existsByInvestigationCaseIdAndRelationshipId(
                        caseId,
                        relationshipId
                );
    }

    @Transactional
    public void removeAllRelationshipsFromCase(Long caseId) {
        caseRelationshipRepository.deleteByInvestigationCaseId(caseId);
    }
}