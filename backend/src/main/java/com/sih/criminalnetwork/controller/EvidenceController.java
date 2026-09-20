package com.sih.criminalnetwork.controller;

import com.sih.criminalnetwork.dto.EvidenceDTO;
import com.sih.criminalnetwork.model.Entity;
import com.sih.criminalnetwork.model.Evidence;
import com.sih.criminalnetwork.model.Evidence.EvidenceStatus;
import com.sih.criminalnetwork.model.Relationship;
import com.sih.criminalnetwork.repository.EntityRepository;
import com.sih.criminalnetwork.repository.RelationshipRepository;
import com.sih.criminalnetwork.service.EvidenceService;
import com.sih.criminalnetwork.service.RelationshipService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/v1/evidence")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:3000"
})
@Tag(
        name = "Evidence Management",
        description = "Evidence records, CDR ingestion and processing status"
)
public class EvidenceController {

    private final EvidenceService evidenceService;
    private final RelationshipService relationshipService;
    private final EntityRepository entityRepository;
    private final RelationshipRepository relationshipRepository;

    public EvidenceController(
            EvidenceService evidenceService,
            RelationshipService relationshipService,
            EntityRepository entityRepository,
            RelationshipRepository relationshipRepository) {

        this.evidenceService = evidenceService;
        this.relationshipService = relationshipService;
        this.entityRepository = entityRepository;
        this.relationshipRepository = relationshipRepository;
    }

    // =========================================================================
    // GET /api/v1/evidence
    // =========================================================================

    @GetMapping
    @Operation(
            summary = "Get all evidence, newest first"
    )
    public ResponseEntity<List<EvidenceDTO>> getAllEvidence() {

        return ResponseEntity.ok(
                evidenceService.getAllEvidence()
                        .stream()
                        .map(EvidenceDTO::from)
                        .toList()
        );
    }

    // =========================================================================
    // GET /api/v1/evidence/{id}
    // =========================================================================

    @GetMapping("/{id}")
    @Operation(
            summary = "Get evidence by database ID"
    )
    public ResponseEntity<EvidenceDTO> getEvidence(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                EvidenceDTO.from(
                        evidenceService.getEvidenceById(id)
                )
        );
    }

    // =========================================================================
    // GET /api/v1/evidence/number/{evidenceNumber}
    // =========================================================================

    @GetMapping("/number/{evidenceNumber}")
    @Operation(
            summary = "Get evidence by evidence number"
    )
    public ResponseEntity<EvidenceDTO> getEvidenceByNumber(
            @PathVariable String evidenceNumber) {

        return ResponseEntity.ok(
                EvidenceDTO.from(
                        evidenceService.getEvidenceByNumber(
                                evidenceNumber
                        )
                )
        );
    }

    // =========================================================================
    // GET /api/v1/evidence/status/{status}
    // =========================================================================

    @GetMapping("/status/{status}")
    @Operation(
            summary = "Get evidence by processing status"
    )
    public ResponseEntity<List<EvidenceDTO>> getByStatus(
            @PathVariable EvidenceStatus status) {

        return ResponseEntity.ok(
                evidenceService.getByStatus(status)
                        .stream()
                        .map(EvidenceDTO::from)
                        .toList()
        );
    }

    // =========================================================================
    // GET /api/v1/evidence/source/{sourceType}
    // =========================================================================

    @GetMapping("/source/{sourceType}")
    @Operation(
            summary = "Get evidence by source type"
    )
    public ResponseEntity<List<EvidenceDTO>> getBySourceType(
            @PathVariable String sourceType) {

        return ResponseEntity.ok(
                evidenceService.getBySourceType(sourceType)
                        .stream()
                        .map(EvidenceDTO::from)
                        .toList()
        );
    }

    // =========================================================================
    // POST /api/v1/evidence
    // =========================================================================

    @PostMapping
    @Operation(
            summary = "Create an evidence record"
    )
    public ResponseEntity<EvidenceDTO> createEvidence(
            @RequestBody Evidence evidence) {

        Evidence saved =
                evidenceService.createEvidence(evidence);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        EvidenceDTO.from(saved)
                );
    }

    // =========================================================================
    // POST /api/v1/evidence/cdr
    // =========================================================================

    @PostMapping(
            value = "/cdr",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @Operation(
            summary = "Upload and process a CDR file",
            description =
                    "Uploads a CSV/TXT Call Detail Record file, stores it "
                            + "as evidence, extracts caller-to-receiver "
                            + "relationships and persists the resulting edges."
    )
    public ResponseEntity<EvidenceDTO> uploadCdr(
            @RequestParam("file") MultipartFile file,
            @RequestParam(
                    value = "caseId",
                    required = false
            ) Long caseId) {

        if (file == null || file.isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .build();
        }

        String originalName =
                file.getOriginalFilename();

        String lowerName =
                originalName == null
                        ? ""
                        : originalName.toLowerCase();

        boolean supported =
                lowerName.endsWith(".csv")
                        || lowerName.endsWith(".txt")
                        || "text/csv".equalsIgnoreCase(
                                file.getContentType()
                        )
                        || "text/plain".equalsIgnoreCase(
                                file.getContentType()
                        );

        if (!supported) {

            return ResponseEntity
                    .status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                    .build();
        }

        try {

            String cdrContent =
                    new String(
                            file.getBytes(),
                            StandardCharsets.UTF_8
                    );

            if (cdrContent.isBlank()) {

                return ResponseEntity
                        .badRequest()
                        .build();
            }

            // -------------------------------------------------------------
            // 1. Create evidence record
            // -------------------------------------------------------------

            Evidence evidence =
                    new Evidence();

            evidence.setEvidenceNumber(
                    "CDR-" + System.currentTimeMillis()
            );

            evidence.setFileName(
                    originalName
            );

            evidence.setFileType(
                    file.getContentType()
            );

            evidence.setFileSize(
                    file.getSize()
            );

            evidence.setSourceType(
                    "CDR"
            );

            evidence.setStatus(
                    EvidenceStatus.PROCESSING
            );

            evidence.setUploadedBy(
                    "SYSTEM"
            );

            // Keep raw CDR data for evidence/audit purposes.
            evidence.setExtractedText(
                    cdrContent
            );

            Evidence saved =
                    evidenceService.createEvidence(
                            evidence
                    );

            // -------------------------------------------------------------
            // 2. Assign evidence to case when supplied
            // -------------------------------------------------------------

            if (caseId != null) {

                saved =
                        evidenceService.assignToCase(
                                saved.getId(),
                                caseId
                        );
            }

            // -------------------------------------------------------------
            // 3. Load existing entities
            // -------------------------------------------------------------

            List<Entity> entities =
                    entityRepository.findAll();

            // -------------------------------------------------------------
            // 4. Extract caller -> receiver relationships
            // -------------------------------------------------------------

            List<Relationship> relationships =
                    relationshipService.detectCdrRelationships(
                            entities,
                            cdrContent,
                            originalName == null
                                    ? "CDR"
                                    : originalName
                    );

            // -------------------------------------------------------------
            // 5. Save relationships
            // -------------------------------------------------------------

            if (!relationships.isEmpty()) {

                relationshipRepository.saveAll(
                        relationships
                );
            }

            // -------------------------------------------------------------
            // 6. Mark evidence as processed
            // -------------------------------------------------------------

            saved =
                    evidenceService.updateStatus(
                            saved.getId(),
                            EvidenceStatus.PROCESSED
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(
                            EvidenceDTO.from(saved)
                    );

        } catch (IOException e) {

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }

    // =========================================================================
    // PATCH /api/v1/evidence/{id}/status
    // =========================================================================

    @PatchMapping("/{id}/status")
    @Operation(
            summary = "Update evidence processing status"
    )
    public ResponseEntity<EvidenceDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam EvidenceStatus status) {

        Evidence updated =
                evidenceService.updateStatus(
                        id,
                        status
                );

        return ResponseEntity.ok(
                EvidenceDTO.from(updated)
        );
    }

    // =========================================================================
    // GET /api/v1/evidence/case/{caseId}
    // =========================================================================

    @GetMapping("/case/{caseId}")
    @Operation(
            summary = "Get evidence belonging to a case"
    )
    public ResponseEntity<List<EvidenceDTO>> getEvidenceByCase(
            @PathVariable Long caseId) {

        return ResponseEntity.ok(
                evidenceService
                        .getEvidenceByCase(caseId)
                        .stream()
                        .map(EvidenceDTO::from)
                        .toList()
        );
    }

    // =========================================================================
    // PATCH /api/v1/evidence/{evidenceId}/case/{caseId}
    // =========================================================================

    @PatchMapping("/{evidenceId}/case/{caseId}")
    @Operation(
            summary = "Assign evidence to an investigation case"
    )
    public ResponseEntity<EvidenceDTO> assignToCase(
            @PathVariable Long evidenceId,
            @PathVariable Long caseId) {

        return ResponseEntity.ok(
                EvidenceDTO.from(
                        evidenceService.assignToCase(
                                evidenceId,
                                caseId
                        )
                )
        );
    }

    // =========================================================================
    // DELETE /api/v1/evidence/{id}
    // =========================================================================

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete an evidence record"
    )
    public ResponseEntity<Void> deleteEvidence(
            @PathVariable Long id) {

        evidenceService.deleteEvidence(id);

        return ResponseEntity
                .noContent()
                .build();
    }
}