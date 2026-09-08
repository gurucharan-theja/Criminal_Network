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
import com.sih.criminalnetwork.repository.EntityRepository;
import com.sih.criminalnetwork.repository.RelationshipRepository;
import com.sih.criminalnetwork.service.EntityExtractionService;
import com.sih.criminalnetwork.service.RelationshipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * AnalysisController — REST API for Criminal Network Analysis.
 * Now uses JPA repositories for persistent storage + DTOs for clean responses.
 *
 * Base URL: /api/v1
 */
@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@Tag(name = "Criminal Network Analysis", description = "AI-powered entity extraction and network analysis")
public class AnalysisController {

    private static final Logger log = LoggerFactory.getLogger(AnalysisController.class);

    private final EntityExtractionService entityExtractionService;
    private final RelationshipService     relationshipService;
    private final EntityRepository        entityRepo;
    private final RelationshipRepository  relationshipRepo;
    private final Tika                    tika = new Tika();

    public AnalysisController(
            EntityExtractionService entityExtractionService,
            RelationshipService     relationshipService,
            EntityRepository        entityRepo,
            RelationshipRepository  relationshipRepo) {
        this.entityExtractionService = entityExtractionService;
        this.relationshipService     = relationshipService;
        this.entityRepo              = entityRepo;
        this.relationshipRepo        = relationshipRepo;
    }

    // ── POST /api/v1/analyse ─────────────────────────────────────

    @PostMapping("/analyse")
    @Operation(summary = "Upload a document for AI analysis",
               description = "Accepts PDF, DOCX, TXT, CSV. Extracts entities and relationships using Apache Tika + regex NER.")
    public ResponseEntity<AnalysisResultDTO> analyseDocument(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        log.info("Received file: {} ({} bytes)", file.getOriginalFilename(), file.getSize());

        try {
            // Step 1 — Extract raw text
            String text;
            try {
                text = tika.parseToString(file.getInputStream());
            } catch (TikaException e) {
                throw new IOException("Tika failed to parse document: " + e.getMessage(), e);
            }

            // Step 2 — Extract & persist entities
            List<Entity> entities = entityExtractionService.extractEntities(file);
            List<Entity> saved    = entityRepo.saveAll(List.copyOf(entities));

            // Step 3 — Detect & persist relationships
            List<Relationship> relationships = relationshipService
                    .detectRelationships(saved, text, file.getOriginalFilename());
            relationshipRepo.saveAll(List.copyOf(relationships));


            // Step 4 — Build response DTO
            long highRisk = saved.stream()
                    .filter(e -> RiskLevel.high.equals(e.getRisk())).count();

            AnalysisResultDTO result = AnalysisResultDTO.builder()
                    .status("success")
                    .sourceFile(file.getOriginalFilename())
                    .entitiesFound(saved.size())
                    .relationsFound(relationships.size())
                    .highRiskFlagged(highRisk)
                    .entities(saved.stream().map(EntityDTO::from).toList())
                    .relations(relationships.stream().map(RelationshipDTO::from).toList())
                    .summary(Map.of(
                            "persons",       saved.stream().filter(e -> EntityType.Person.equals(e.getType())).count(),
                            "organizations", saved.stream().filter(e -> EntityType.Organization.equals(e.getType())).count(),
                            "locations",     saved.stream().filter(e -> EntityType.Location.equals(e.getType())).count(),
                            "phones",        saved.stream().filter(e -> EntityType.Phone.equals(e.getType())).count(),
                            "vehicles",      saved.stream().filter(e -> EntityType.Vehicle.equals(e.getType())).count()
                    ))
                    .build();

            return ResponseEntity.ok(result);

        } catch (IOException e) {
            log.error("Failed to process file '{}': {}", file.getOriginalFilename(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ── GET /api/v1/entities ─────────────────────────────────────

    @GetMapping("/entities")
    @Operation(summary = "List entities", description = "Filter by ?risk=high|medium|low and/or ?type=Person|Organization|Location|Vehicle|Phone")
    public ResponseEntity<List<EntityDTO>> getAllEntities(
            @RequestParam(required = false) String risk,
            @RequestParam(required = false) String type) {

        List<Entity> result;

        if (risk != null && type != null) {
            result = entityRepo.findByRiskAndType(
                    RiskLevel.valueOf(risk),
                    EntityType.valueOf(type));
        } else if (risk != null) {
            result = entityRepo.findByRisk(RiskLevel.valueOf(risk));
        } else if (type != null) {
            result = entityRepo.findByType(EntityType.valueOf(type));
        } else {
            result = entityRepo.findAll();
        }

        return ResponseEntity.ok(result.stream().map(EntityDTO::from).toList());
    }

    // ── GET /api/v1/entities/search ──────────────────────────────

    @GetMapping("/entities/search")
    @Operation(summary = "Full-text search across entities")
    public ResponseEntity<List<EntityDTO>> searchEntities(@RequestParam String q) {
        return ResponseEntity.ok(
                entityRepo.search(q).stream().map(EntityDTO::from).toList()
        );
    }

    // ── GET /api/v1/entities/{nodeId} ────────────────────────────

    @GetMapping("/entities/{nodeId}")
    @Operation(summary = "Get a single entity by nodeId")
    public ResponseEntity<EntityDTO> getEntity(@PathVariable String nodeId) {
        Entity entity = entityRepo.findByNodeId(nodeId)
                .orElseThrow(() -> new EntityNotFoundException(nodeId));
        return ResponseEntity.ok(EntityDTO.from(entity));
    }

    // ── GET /api/v1/relationships ────────────────────────────────

    @GetMapping("/relationships")
    @Operation(summary = "List relationships", description = "Filter by ?type=associate|financial|communication|family")
    public ResponseEntity<List<RelationshipDTO>> getAllRelationships(
            @RequestParam(required = false) String type) {

        List<Relationship> result = type != null
                ? relationshipRepo.findByType(Relationship.RelationType.valueOf(type))
                : relationshipRepo.findAll();

        return ResponseEntity.ok(result.stream().map(RelationshipDTO::from).toList());
    }

    // ── GET /api/v1/graph ────────────────────────────────────────

    @GetMapping("/graph")
    @Operation(summary = "Full D3-ready graph", description = "Returns { nodes, links, nodeCount, edgeCount }")
    public ResponseEntity<GraphDTO> getGraph() {
        List<EntityDTO>       nodes = entityRepo.findAll().stream().map(EntityDTO::from).toList();
        List<RelationshipDTO> links = relationshipRepo.findAll().stream().map(RelationshipDTO::from).toList();
        return ResponseEntity.ok(new GraphDTO(nodes, links));
    }

    // ── GET /api/v1/stats ────────────────────────────────────────

    @GetMapping("/stats")
    @Operation(summary = "Dashboard statistics")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
                "totalEntities",   entityRepo.count(),
                "totalRelations",  relationshipRepo.count(),
                "highRiskNodes",   entityRepo.countByRisk(RiskLevel.high),
                "mediumRiskNodes", entityRepo.countByRisk(RiskLevel.medium),
                "lowRiskNodes",    entityRepo.countByRisk(RiskLevel.low),
                "activeThreats",   entityRepo.countByRisk(RiskLevel.high)
        ));
    }

    // ── DELETE /api/v1/entities/{nodeId} ─────────────────────────

    @DeleteMapping("/entities/{nodeId}")
    @Operation(summary = "Delete an entity and all its relationships")
    public ResponseEntity<Map<String, String>> deleteEntity(@PathVariable String nodeId) {
        if (!entityRepo.existsByNodeId(nodeId)) {
            throw new EntityNotFoundException(nodeId);
        }
        relationshipRepo.deleteByNodeId(nodeId);
        entityRepo.deleteByNodeId(nodeId);
        return ResponseEntity.ok(Map.of("message", "Entity " + nodeId + " deleted"));
    }

    // ── POST /api/v1/reset ───────────────────────────────────────

    @PostMapping("/reset")
    @Operation(summary = "Purge all entities and relationships for a completely clean slate")
    public ResponseEntity<Map<String, String>> resetAllData() {
        relationshipRepo.deleteAll();
        entityRepo.deleteAll();
        log.info("Purged all intelligence entities and relationships. Database is now clean.");
        return ResponseEntity.ok(Map.of("message", "All intelligence entities and relationships purged successfully"));
    }
}
