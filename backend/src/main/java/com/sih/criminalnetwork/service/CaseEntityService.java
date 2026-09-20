package com.sih.criminalnetwork.service;

import com.sih.criminalnetwork.exception.EntityNotFoundException;
import com.sih.criminalnetwork.model.Case;
import com.sih.criminalnetwork.model.CaseEntity;
import com.sih.criminalnetwork.model.Entity;
import com.sih.criminalnetwork.repository.CaseEntityRepository;
import com.sih.criminalnetwork.repository.CaseRepository;
import com.sih.criminalnetwork.repository.EntityRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CaseEntityService {

    private final CaseEntityRepository caseEntityRepo;
    private final CaseRepository caseRepo;
    private final EntityRepository entityRepo;

    public CaseEntityService(
            CaseEntityRepository caseEntityRepo,
            CaseRepository caseRepo,
            EntityRepository entityRepo) {

        this.caseEntityRepo = caseEntityRepo;
        this.caseRepo = caseRepo;
        this.entityRepo = entityRepo;
    }

    /**
     * Get all entities associated with a case.
     */
    public List<Entity> getEntitiesByCase(Long caseId) {

        if (!caseRepo.existsById(caseId)) {
            throw new EntityNotFoundException("Case#" + caseId);
        }

        return caseEntityRepo.findByInvestigationCaseId(caseId)
                .stream()
                .map(CaseEntity::getEntity)
                .toList();
    }

    /**
     * Get all case memberships for an entity.
     */
    public List<CaseEntity> getCasesByEntity(Long entityId) {

        if (!entityRepo.existsById(entityId)) {
            throw new EntityNotFoundException("Entity#" + entityId);
        }

        return caseEntityRepo.findByEntityId(entityId);
    }

    /**
     * Add an entity to a case.
     */
    @Transactional
    public CaseEntity addEntityToCase(
            Long caseId,
            Long entityId,
            String evidenceSource) {

        Case investigationCase = caseRepo.findById(caseId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Case#" + caseId));

        Entity entity = entityRepo.findById(entityId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Entity#" + entityId));

        if (caseEntityRepo.existsByInvestigationCaseIdAndEntityId(
                caseId, entityId)) {

            return caseEntityRepo
                    .findByInvestigationCaseIdAndEntityId(
                            caseId, entityId)
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "Case-Entity association exists but could not be loaded."
                            ));
        }

        CaseEntity association = new CaseEntity();

        association.setInvestigationCase(investigationCase);
        association.setEntity(entity);
        association.setAddedFromEvidence(evidenceSource);

        return caseEntityRepo.save(association);
    }

    /**
     * Remove an entity from a case.
     */
    @Transactional
    public void removeEntityFromCase(
            Long caseId,
            Long entityId) {

        CaseEntity association =
                caseEntityRepo
                        .findByInvestigationCaseIdAndEntityId(
                                caseId, entityId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "CaseEntity association not found"
                                ));

        caseEntityRepo.delete(association);
    }

    /**
     * Check whether an entity belongs to a case.
     */
    public boolean isEntityInCase(
            Long caseId,
            Long entityId) {

        return caseEntityRepo
                .existsByInvestigationCaseIdAndEntityId(
                        caseId, entityId);
    }

    /**
     * Remove all entity associations from a case.
     */
    @Transactional
    public void removeAllEntitiesFromCase(Long caseId) {

        if (!caseRepo.existsById(caseId)) {
            throw new EntityNotFoundException("Case#" + caseId);
        }

        caseEntityRepo.deleteByInvestigationCaseId(caseId);
    }
}