package com.sih.criminalnetwork.service;

import com.sih.criminalnetwork.exception.EntityNotFoundException;
import com.sih.criminalnetwork.model.Case;
import com.sih.criminalnetwork.model.Evidence;
import com.sih.criminalnetwork.model.Evidence.EvidenceStatus;
import com.sih.criminalnetwork.repository.CaseRepository;
import com.sih.criminalnetwork.repository.EvidenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EvidenceService {

    private final EvidenceRepository evidenceRepo;
    private final CaseRepository caseRepo;

    public EvidenceService(
            EvidenceRepository evidenceRepo,
            CaseRepository caseRepo) {

        this.evidenceRepo = evidenceRepo;
        this.caseRepo = caseRepo;
    }

    // -------------------------------------------------------------------------
    // Assign evidence to a case
    // -------------------------------------------------------------------------

    @Transactional
    public Evidence assignToCase(Long evidenceId, Long caseId) {

        Evidence evidence = getEvidenceById(evidenceId);

        Case investigationCase = caseRepo.findById(caseId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Case#" + caseId));

        evidence.setInvestigationCase(investigationCase);

        return evidenceRepo.save(evidence);
    }

    // -------------------------------------------------------------------------
    // Remove evidence from its current case
    // -------------------------------------------------------------------------

    @Transactional
    public Evidence removeFromCase(Long evidenceId) {

        Evidence evidence = getEvidenceById(evidenceId);

        evidence.setInvestigationCase(null);

        return evidenceRepo.save(evidence);
    }

    // -------------------------------------------------------------------------
    // Get evidence by case
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<Evidence> getEvidenceByCase(Long caseId) {

        if (!caseRepo.existsById(caseId)) {
            throw new EntityNotFoundException("Case#" + caseId);
        }

        return evidenceRepo.findByInvestigationCaseId(caseId);
    }

    // -------------------------------------------------------------------------
    // Get all evidence
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<Evidence> getAllEvidence() {
        return evidenceRepo.findAllByOrderByUploadedAtDesc();
    }

    // -------------------------------------------------------------------------
    // Get evidence by ID
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Evidence getEvidenceById(Long id) {

        return evidenceRepo.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException("Evidence#" + id));
    }

    // -------------------------------------------------------------------------
    // Get evidence by evidence number
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Evidence getEvidenceByNumber(String evidenceNumber) {

        return evidenceRepo.findByEvidenceNumber(evidenceNumber)
                .orElseThrow(() ->
                        new EntityNotFoundException(evidenceNumber));
    }

    // -------------------------------------------------------------------------
    // Create evidence
    // -------------------------------------------------------------------------

    @Transactional
    public Evidence createEvidence(Evidence evidence) {

        if (evidence == null) {
            throw new IllegalArgumentException(
                    "Evidence cannot be null"
            );
        }

        if (evidence.getStatus() == null) {
            evidence.setStatus(EvidenceStatus.UPLOADED);
        }

        /*
         * If evidence is created with a case already attached,
         * make sure that the referenced case actually exists.
         */
        if (evidence.getInvestigationCase() != null
                && evidence.getInvestigationCase().getId() != null) {

            Long caseId =
                    evidence.getInvestigationCase().getId();

            Case investigationCase = caseRepo.findById(caseId)
                    .orElseThrow(() ->
                            new EntityNotFoundException(
                                    "Case#" + caseId
                            )
                    );

            evidence.setInvestigationCase(investigationCase);
        }

        return evidenceRepo.save(evidence);
    }

    // -------------------------------------------------------------------------
    // Update processing status
    // -------------------------------------------------------------------------

    @Transactional
    public Evidence updateStatus(
            Long id,
            EvidenceStatus status) {

        if (status == null) {
            throw new IllegalArgumentException(
                    "Evidence status cannot be null"
            );
        }

        Evidence evidence = getEvidenceById(id);

        evidence.setStatus(status);

        return evidenceRepo.save(evidence);
    }

    // -------------------------------------------------------------------------
    // Save extracted document text
    // -------------------------------------------------------------------------

    @Transactional
    public Evidence updateExtractedText(
            Long id,
            String extractedText) {

        Evidence evidence = getEvidenceById(id);

        evidence.setExtractedText(extractedText);

        return evidenceRepo.save(evidence);
    }

    // -------------------------------------------------------------------------
    // Get evidence by processing status
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<Evidence> getByStatus(
            EvidenceStatus status) {

        return evidenceRepo.findByStatus(status);
    }

    // -------------------------------------------------------------------------
    // Get evidence by source type
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<Evidence> getBySourceType(
            String sourceType) {

        return evidenceRepo.findBySourceType(sourceType);
    }

    // -------------------------------------------------------------------------
    // Delete evidence
    // -------------------------------------------------------------------------

    @Transactional
    public void deleteEvidence(Long id) {

        if (!evidenceRepo.existsById(id)) {
            throw new EntityNotFoundException(
                    "Evidence#" + id
            );
        }

        evidenceRepo.deleteById(id);
    }
}