package com.sih.criminalnetwork.service;

import com.sih.criminalnetwork.exception.EntityNotFoundException;
import com.sih.criminalnetwork.model.Case;
import com.sih.criminalnetwork.model.Case.CaseStatus;
import com.sih.criminalnetwork.repository.CaseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class CaseService {

    private static final Logger log = LoggerFactory.getLogger(CaseService.class);

    private final CaseRepository caseRepo;

    public CaseService(CaseRepository caseRepo) {
        this.caseRepo = caseRepo;
    }

    /** Get all cases — newest first */
    public List<Case> getAllCases() {
        return caseRepo.findAllByOrderByCreatedAtDesc();
    }

    /** Get single case by caseNumber */
    public Case getCaseByNumber(String caseNumber) {
        return caseRepo.findByCaseNumber(caseNumber)
                .orElseThrow(() -> new EntityNotFoundException(caseNumber));
    }

    /** Get single case by DB id */
    public Case getCaseById(Long id) {
        return caseRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Case#" + id));
    }

    /** Create a new case */
    @Transactional
    public Case createCase(Case c) {
        if (c.getStatus() == null) c.setStatus(CaseStatus.active);
        Case saved = caseRepo.save(c);
        log.info("Created case: {} — {}", saved.getCaseNumber(), saved.getTitle());
        return saved;
    }

    /** Update an existing case */
    @Transactional
    public Case updateCase(Long id, Map<String, Object> updates) {
        Case existing = getCaseById(id);

        if (updates.containsKey("title"))
            existing.setTitle((String) updates.get("title"));
        if (updates.containsKey("description"))
            existing.setDescription((String) updates.get("description"));
        if (updates.containsKey("status")) {
            CaseStatus status = CaseStatus.valueOf((String) updates.get("status"));
            existing.setStatus(status);
            if (status == CaseStatus.closed && existing.getClosedAt() == null)
                existing.setClosedAt(LocalDateTime.now());
        }
        if (updates.containsKey("risk"))
            existing.setRisk(Case.RiskLevel.valueOf((String) updates.get("risk")));
        if (updates.containsKey("investigator"))
            existing.setInvestigator((String) updates.get("investigator"));
        if (updates.containsKey("department"))
            existing.setDepartment((String) updates.get("department"));

        Case updated = caseRepo.save(existing);
        log.info("Updated case: {}", updated.getCaseNumber());
        return updated;
    }

    /** Delete a case */
    @Transactional
    public void deleteCase(Long id) {
        if (!caseRepo.existsById(id))
            throw new EntityNotFoundException("Case#" + id);
        caseRepo.deleteById(id);
        log.info("Deleted case id: {}", id);
    }

    /** Search cases */
    public List<Case> searchCases(String q) {
        return caseRepo.search(q);
    }

    /** Summary stats for dashboard */
    public Map<String, Long> getStats() {
        return Map.of(
                "total",   caseRepo.count(),
                "active",  caseRepo.countByStatus(CaseStatus.active),
                "closed",  caseRepo.countByStatus(CaseStatus.closed),
                "pending", caseRepo.countByStatus(CaseStatus.pending)
        );
    }

    /** Delete all cases */
    @Transactional
    public void deleteAllCases() {
        caseRepo.deleteAll();
        log.info("Purged all cases from repository.");
    }
}
