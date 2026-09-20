package com.sih.criminalnetwork.controller;

import com.sih.criminalnetwork.dto.AnalysisResultDTO;
import com.sih.criminalnetwork.dto.EntityDTO;
import com.sih.criminalnetwork.dto.GraphDTO;
import com.sih.criminalnetwork.dto.RelationshipDTO;
import com.sih.criminalnetwork.exception.EntityNotFoundException;
import com.sih.criminalnetwork.model.Entity;
import com.sih.criminalnetwork.model.Entity.EntityType;
import com.sih.criminalnetwork.model.Entity.RiskLevel;
import com.sih.criminalnetwork.model.Relationship;
import com.sih.criminalnetwork.model.Evidence;
import com.sih.criminalnetwork.model.ProcessingJob;
import com.sih.criminalnetwork.repository.EntityRepository;
import com.sih.criminalnetwork.repository.RelationshipRepository;
import com.sih.criminalnetwork.service.EntityExtractionService;
import com.sih.criminalnetwork.service.RelationshipService;
import com.sih.criminalnetwork.service.EvidenceService;
import com.sih.criminalnetwork.service.ProcessingJobService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * AnalysisController — REST API for Criminal Network Analysis.
 *
 * Handles:
 * - Document analysis
 * - Evidence persistence
 * - Evidence-to-case linking
 * - Document text extraction
 * - Entity extraction
 * - Relationship extraction
 * - Processing job tracking
 * - Graph retrieval
 * - Dashboard statistics
 */
@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:3000"
})
@Tag(
        name = "Criminal Network Analysis",
        description = "AI-powered entity extraction and network analysis"
)
public class AnalysisController {

    private static final Logger log =
            LoggerFactory.getLogger(AnalysisController.class);

    private final EntityExtractionService entityExtractionService;
    private final RelationshipService relationshipService;
    private final EntityRepository entityRepo;
    private final RelationshipRepository relationshipRepo;
    private final Tika tika = new Tika();

    private final ProcessingJobService processingJobService;
    private final EvidenceService evidenceService;

    public AnalysisController(
            EntityExtractionService entityExtractionService,
            RelationshipService relationshipService,
            EntityRepository entityRepo,
            RelationshipRepository relationshipRepo,
            EvidenceService evidenceService,
            ProcessingJobService processingJobService) {

        this.entityExtractionService = entityExtractionService;
        this.relationshipService = relationshipService;
        this.entityRepo = entityRepo;
        this.relationshipRepo = relationshipRepo;
        this.evidenceService = evidenceService;
        this.processingJobService = processingJobService;
    }

    // =========================================================================
    // POST /api/v1/analyse
    // =========================================================================

    @PostMapping("/analyse")
    @Operation(
            summary = "Upload a document for AI analysis",
            description =
                    "Accepts PDF, DOCX, TXT, CSV. "
                            + "Extracts entities and relationships using "
                            + "Apache Tika + regex NER."
    )
    public ResponseEntity<AnalysisResultDTO> analyseDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(
                    value = "caseId",
                    required = false
            ) Long caseId) {

        // ---------------------------------------------------------------------
        // Validate file
        // ---------------------------------------------------------------------

        if (file == null || file.isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .build();
        }

        log.info(
                "Received file: {} ({} bytes), caseId={}",
                file.getOriginalFilename(),
                file.getSize(),
                caseId
        );

        // ---------------------------------------------------------------------
        // 1. Create Evidence record
        // ---------------------------------------------------------------------

        Evidence evidence = new Evidence();

        evidence.setEvidenceNumber(
                "EVD-" + System.currentTimeMillis()
        );

        evidence.setFileName(
                file.getOriginalFilename()
        );

        evidence.setFileType(
                file.getContentType()
        );

        evidence.setFileSize(
                file.getSize()
        );

        evidence.setSourceType(
                "INTELLIGENCE_DOCUMENT"
        );

        evidence.setStatus(
                Evidence.EvidenceStatus.PROCESSING
        );

        evidence.setUploadedBy(
                "SYSTEM"
        );

        Evidence savedEvidence =
                evidenceService.createEvidence(evidence);

        // ---------------------------------------------------------------------
        // 1A. Link evidence to case when caseId is supplied
        // ---------------------------------------------------------------------

        if (caseId != null) {

            savedEvidence =
                    evidenceService.assignToCase(
                            savedEvidence.getId(),
                            caseId
                    );

            log.info(
                    "Evidence {} linked to case {}",
                    savedEvidence.getEvidenceNumber(),
                    caseId
            );
        }

        // ---------------------------------------------------------------------
        // 2. Create Processing Job
        // ---------------------------------------------------------------------

        ProcessingJob job =
                processingJobService.createJob(
                        savedEvidence.getId()
                );

        try {

            // -----------------------------------------------------------------
            // 3. Extract raw document text
            // -----------------------------------------------------------------

            processingJobService.updateProgress(
                    job.getId(),
                    10,
                    "Extracting document text"
            );

            String text;

            try {

                text = tika.parseToString(
                        file.getInputStream()
                );

            } catch (TikaException e) {

                throw new IOException(
                        "Tika failed to parse document: "
                                + e.getMessage(),
                        e
                );
            }

            if (text == null) {
                text = "";
            }

            // -----------------------------------------------------------------
            // Save extracted text into Evidence
            // -----------------------------------------------------------------

            evidenceService.updateExtractedText(
                    savedEvidence.getId(),
                    text
            );

            // -----------------------------------------------------------------
            // 4. Extract & persist entities
            // -----------------------------------------------------------------

            processingJobService.updateProgress(
                    job.getId(),
                    40,
                    "Extracting entities"
            );

            List<Entity> entities =
                    entityExtractionService.extractEntities(
                            file
                    );

            List<Entity> saved =
                    entityRepo.saveAll(
                            List.copyOf(entities)
                    );

            // -----------------------------------------------------------------
            // 5. Detect & persist relationships
            // -----------------------------------------------------------------

            processingJobService.updateProgress(
                    job.getId(),
                    70,
                    "Detecting relationships"
            );

            List<Relationship> relationships =
                    relationshipService.detectRelationships(
                            saved,
                            text,
                            file.getOriginalFilename()
                    );

            relationshipRepo.saveAll(
                    List.copyOf(relationships)
            );

            // -----------------------------------------------------------------
            // 6. Build analysis response
            // -----------------------------------------------------------------

            long highRisk =
                    saved.stream()
                            .filter(e ->
                                    RiskLevel.high.equals(
                                            e.getRisk()
                                    )
                            )
                            .count();

            long personCount =
                    saved.stream()
                            .filter(e ->
                                    EntityType.Person.equals(
                                            e.getType()
                                    )
                            )
                            .count();

            long organizationCount =
                    saved.stream()
                            .filter(e ->
                                    EntityType.Organization.equals(
                                            e.getType()
                                    )
                            )
                            .count();

            long locationCount =
                    saved.stream()
                            .filter(e ->
                                    EntityType.Location.equals(
                                            e.getType()
                                    )
                            )
                            .count();

            long phoneCount =
                    saved.stream()
                            .filter(e ->
                                    EntityType.Phone.equals(
                                            e.getType()
                                    )
                            )
                            .count();

            long vehicleCount =
                    saved.stream()
                            .filter(e ->
                                    EntityType.Vehicle.equals(
                                            e.getType()
                                    )
                            )
                            .count();

            long accountCount =
                    saved.stream()
                            .filter(e ->
                                    EntityType.Account.equals(
                                            e.getType()
                                    )
                            )
                            .count();

            AnalysisResultDTO result =
                    AnalysisResultDTO.builder()
                            .status("success")
                            .sourceFile(
                                    file.getOriginalFilename()
                            )
                            .entitiesFound(
                                    saved.size()
                            )
                            .relationsFound(
                                    relationships.size()
                            )
                            .highRiskFlagged(
                                    highRisk
                            )
                            .entities(
                                    saved.stream()
                                            .map(EntityDTO::from)
                                            .toList()
                            )
                            .relations(
                                    relationships.stream()
                                            .map(RelationshipDTO::from)
                                            .toList()
                            )
                            .summary(
                                    Map.of(
                                            "persons",
                                            personCount,

                                            "organizations",
                                            organizationCount,

                                            "locations",
                                            locationCount,

                                            "phones",
                                            phoneCount,

                                            "vehicles",
                                            vehicleCount,

                                            "accounts",
                                            accountCount
                                    )
                            )
                            .build();

            // -----------------------------------------------------------------
            // 7. Mark processing complete
            // -----------------------------------------------------------------

            processingJobService.completeJob(
                    job.getId()
            );

            evidenceService.updateStatus(
                    savedEvidence.getId(),
                    Evidence.EvidenceStatus.PROCESSED
            );

            log.info(
                    "Successfully processed evidence {}: "
                            + "{} entities, {} relationships",
                    savedEvidence.getEvidenceNumber(),
                    saved.size(),
                    relationships.size()
            );

            return ResponseEntity.ok(result);

        } catch (IOException e) {

            // -----------------------------------------------------------------
            // 8. Mark processing failed
            // -----------------------------------------------------------------

            processingJobService.failJob(
                    job.getId(),
                    e.getMessage()
            );

            evidenceService.updateStatus(
                    savedEvidence.getId(),
                    Evidence.EvidenceStatus.FAILED
            );

            log.error(
                    "Failed to process file '{}': {}",
                    file.getOriginalFilename(),
                    e.getMessage(),
                    e
            );

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }

        // =========================================================================
    // POST /api/v1/financial/ingest
    // =========================================================================

    @PostMapping(
            value = "/financial/ingest",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @Operation(
            summary = "Ingest financial or blockchain transaction data",
            description =
                    "Accepts CSV, TXT or JSON transaction-export files "
                            + "and stores the raw data as financial evidence."
    )
    public ResponseEntity<Map<String, Object>> ingestFinancialData(
            @RequestParam("file") MultipartFile file,
            @RequestParam(
                    value = "caseId",
                    required = false
            ) Long caseId) {

        // ---------------------------------------------------------------------
        // Validate file
        // ---------------------------------------------------------------------

        if (file == null || file.isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "status", "error",
                                    "message", "Financial data file is empty"
                            )
                    );
        }

        String originalName =
                file.getOriginalFilename();

        String lowerName =
                originalName == null
                        ? ""
                        : originalName.toLowerCase();

        String contentType =
                file.getContentType();

        boolean supported =
                lowerName.endsWith(".csv")
                        || lowerName.endsWith(".txt")
                        || lowerName.endsWith(".json")
                        || "text/csv".equalsIgnoreCase(contentType)
                        || "text/plain".equalsIgnoreCase(contentType)
                        || "application/json".equalsIgnoreCase(contentType);

        if (!supported) {

            return ResponseEntity
                    .status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                    .body(
                            Map.of(
                                    "status", "error",
                                    "message",
                                    "Supported formats: CSV, TXT, JSON"
                            )
                    );
        }

        try {

            // -----------------------------------------------------------------
            // Read transaction data
            // -----------------------------------------------------------------

            String transactionData =
                    new String(
                            file.getBytes(),
                            StandardCharsets.UTF_8
                    );

            if (transactionData.isBlank()) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                Map.of(
                                        "status", "error",
                                        "message",
                                        "Financial transaction data is empty"
                                )
                        );
            }

            // -----------------------------------------------------------------
            // Create financial evidence
            // -----------------------------------------------------------------

            Evidence evidence =
                    new Evidence();

            evidence.setEvidenceNumber(
                    "FIN-" + System.currentTimeMillis()
            );

            evidence.setFileName(
                    originalName
            );

            evidence.setFileType(
                    contentType
            );

            evidence.setFileSize(
                    file.getSize()
            );

            evidence.setSourceType(
                    "FINANCIAL_TRANSACTION"
            );

            evidence.setStatus(
                    Evidence.EvidenceStatus.PROCESSING
            );

            evidence.setUploadedBy(
                    "SYSTEM"
            );

            // Store the raw transaction export.
            evidence.setExtractedText(
                    transactionData
            );

            Evidence savedEvidence =
                    evidenceService.createEvidence(
                            evidence
                    );

            // -----------------------------------------------------------------
            // Link financial evidence to case
            // -----------------------------------------------------------------

            if (caseId != null) {

                savedEvidence =
                        evidenceService.assignToCase(
                                savedEvidence.getId(),
                                caseId
                        );
            }

            // -----------------------------------------------------------------
            // Mark ingestion complete
            // -----------------------------------------------------------------

            savedEvidence =
                    evidenceService.updateStatus(
                            savedEvidence.getId(),
                            Evidence.EvidenceStatus.PROCESSED
                    );

            log.info(
                    "Financial data ingested successfully: file={}, size={}, caseId={}",
                    originalName,
                    file.getSize(),
                    caseId
            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(
                            Map.of(
                                    "status", "success",
                                    "message",
                                    "Financial transaction data ingested successfully",
                                    "evidenceId",
                                    savedEvidence.getId(),
                                    "evidenceNumber",
                                    savedEvidence.getEvidenceNumber(),
                                    "fileName",
                                    savedEvidence.getFileName(),
                                    "sourceType",
                                    savedEvidence.getSourceType(),
                                    "caseId",
                                    caseId == null
                                            ? "unassigned"
                                            : caseId
                            )
                    );

        } catch (IOException e) {

            log.error(
                    "Failed to ingest financial data '{}': {}",
                    originalName,
                    e.getMessage(),
                    e
            );

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            Map.of(
                                    "status", "error",
                                    "message",
                                    "Failed to ingest financial transaction data"
                            )
                    );
        }
    }

    // =========================================================================
    // GET /api/v1/entities
    // =========================================================================

    @GetMapping("/entities")
    @Operation(
            summary = "List entities",
            description =
                    "Filter by ?risk=high|medium|low "
                            + "and/or ?type=Person|Organization|Location|"
                            + "Vehicle|Phone|Account"
    )
    public ResponseEntity<List<EntityDTO>> getAllEntities(
            @RequestParam(required = false) String risk,
            @RequestParam(required = false) String type) {

        List<Entity> result;

        if (risk != null && type != null) {

            result =
                    entityRepo.findByRiskAndType(
                            RiskLevel.valueOf(risk),
                            EntityType.valueOf(type)
                    );

        } else if (risk != null) {

            result =
                    entityRepo.findByRisk(
                            RiskLevel.valueOf(risk)
                    );

        } else if (type != null) {

            result =
                    entityRepo.findByType(
                            EntityType.valueOf(type)
                    );

        } else {

            result =
                    entityRepo.findAll();
        }

        return ResponseEntity.ok(
                result.stream()
                        .map(EntityDTO::from)
                        .toList()
        );
    }

    // =========================================================================
    // GET /api/v1/entities/search
    // =========================================================================

    @GetMapping("/entities/search")
    @Operation(
            summary = "Full-text search across entities"
    )
    public ResponseEntity<List<EntityDTO>> searchEntities(
            @RequestParam String q) {

        return ResponseEntity.ok(
                entityRepo.search(q)
                        .stream()
                        .map(EntityDTO::from)
                        .toList()
        );
    }

    // =========================================================================
    // GET /api/v1/entities/{nodeId}
    // =========================================================================

    @GetMapping("/entities/{nodeId}")
    @Operation(
            summary = "Get a single entity by nodeId"
    )
    public ResponseEntity<EntityDTO> getEntity(
            @PathVariable String nodeId) {

        Entity entity =
                entityRepo.findByNodeId(nodeId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                nodeId
                                        )
                        );

        return ResponseEntity.ok(
                EntityDTO.from(entity)
        );
    }

    // =========================================================================
    // GET /api/v1/relationships
    // =========================================================================

    @GetMapping("/relationships")
    @Operation(
            summary = "List relationships",
            description =
                    "Filter by "
                            + "?type=associate|financial|communication|"
                            + "family|called|transferred|knows|works_for|"
                            + "owns|uses|located_at"
    )
    public ResponseEntity<List<RelationshipDTO>> getAllRelationships(
            @RequestParam(required = false) String type) {

        List<Relationship> result =
                type != null
                        ? relationshipRepo.findByType(
                                Relationship.RelationType.valueOf(type)
                        )
                        : relationshipRepo.findAll();

        return ResponseEntity.ok(
                result.stream()
                        .map(RelationshipDTO::from)
                        .toList()
        );
    }

    // =========================================================================
    // GET /api/v1/graph
    // =========================================================================

    @GetMapping("/graph")
    @Operation(
            summary = "Full D3-ready graph",
            description =
                    "Returns { nodes, links, nodeCount, edgeCount }"
    )
    public ResponseEntity<GraphDTO> getGraph() {

        List<EntityDTO> nodes =
                entityRepo.findAll()
                        .stream()
                        .map(EntityDTO::from)
                        .toList();

        List<RelationshipDTO> links =
                relationshipRepo.findAll()
                        .stream()
                        .map(RelationshipDTO::from)
                        .toList();

        return ResponseEntity.ok(
                new GraphDTO(
                        nodes,
                        links
                )
        );
    }

    // =========================================================================
    // GET /api/v1/stats
    // =========================================================================

    @GetMapping("/stats")
    @Operation(
            summary = "Dashboard statistics"
    )
    public ResponseEntity<Map<String, Object>> getStats() {

        return ResponseEntity.ok(
                Map.of(
                        "totalEntities",
                        entityRepo.count(),

                        "totalRelations",
                        relationshipRepo.count(),

                        "highRiskNodes",
                        entityRepo.countByRisk(
                                RiskLevel.high
                        ),

                        "mediumRiskNodes",
                        entityRepo.countByRisk(
                                RiskLevel.medium
                        ),

                        "lowRiskNodes",
                        entityRepo.countByRisk(
                                RiskLevel.low
                        ),

                        "activeThreats",
                        entityRepo.countByRisk(
                                RiskLevel.high
                        )
                )
        );
    }

    // =========================================================================
    // DELETE /api/v1/entities/{nodeId}
    // =========================================================================

    @DeleteMapping("/entities/{nodeId}")
    @Operation(
            summary = "Delete an entity and all its relationships"
    )
    public ResponseEntity<Map<String, String>> deleteEntity(
            @PathVariable String nodeId) {

        if (!entityRepo.existsByNodeId(nodeId)) {
            throw new EntityNotFoundException(
                    nodeId
            );
        }

        relationshipRepo.deleteByNodeId(
                nodeId
        );

        entityRepo.deleteByNodeId(
                nodeId
        );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Entity "
                                + nodeId
                                + " deleted"
                )
        );
    }

    // =========================================================================
    // POST /api/v1/reset
    // =========================================================================

    @PostMapping("/reset")
    @Operation(
            summary =
                    "Purge all entities and relationships for a completely clean slate"
    )
    public ResponseEntity<Map<String, String>> resetAllData() {

        relationshipRepo.deleteAll();

        entityRepo.deleteAll();

        log.info(
                "Purged all intelligence entities and relationships. "
                        + "Database is now clean."
        );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "All intelligence entities and relationships "
                                + "purged successfully"
                )
        );
    }
}