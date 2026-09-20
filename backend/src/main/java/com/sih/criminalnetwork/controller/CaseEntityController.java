package com.sih.criminalnetwork.controller;

import com.sih.criminalnetwork.dto.EntityDTO;
import com.sih.criminalnetwork.model.CaseEntity;
import com.sih.criminalnetwork.service.CaseEntityService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cases")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:3000"
})
@Tag(
        name = "Case Network",
        description = "Manage entities associated with investigation cases"
)
public class CaseEntityController {

    private final CaseEntityService caseEntityService;

    public CaseEntityController(CaseEntityService caseEntityService) {
        this.caseEntityService = caseEntityService;
    }

    // ── GET /api/v1/cases/{caseId}/entities ───────────────────────

    @GetMapping("/{caseId}/entities")
    @Operation(summary = "Get all entities associated with a case")
    public ResponseEntity<List<EntityDTO>> getEntitiesByCase(
            @PathVariable Long caseId) {

        return ResponseEntity.ok(
                caseEntityService.getEntitiesByCase(caseId)
                        .stream()
                        .map(EntityDTO::from)
                        .toList()
        );
    }

    // ── POST /api/v1/cases/{caseId}/entities/{entityId} ───────────

    @PostMapping("/{caseId}/entities/{entityId}")
    @Operation(summary = "Add an entity to a case")
    public ResponseEntity<EntityDTO> addEntityToCase(
            @PathVariable Long caseId,
            @PathVariable Long entityId,
            @RequestParam(required = false) String evidenceSource) {

        CaseEntity association =
                caseEntityService.addEntityToCase(
                        caseId,
                        entityId,
                        evidenceSource
                );

        return ResponseEntity.ok(
                EntityDTO.from(association.getEntity())
        );
    }

    // ── DELETE /api/v1/cases/{caseId}/entities/{entityId} ─────────

    @DeleteMapping("/{caseId}/entities/{entityId}")
    @Operation(summary = "Remove an entity from a case")
    public ResponseEntity<Void> removeEntityFromCase(
            @PathVariable Long caseId,
            @PathVariable Long entityId) {

        caseEntityService.removeEntityFromCase(
                caseId,
                entityId
        );

        return ResponseEntity.noContent().build();
    }

    // ── GET /api/v1/cases/{caseId}/entities/{entityId}/exists ────

    @GetMapping("/{caseId}/entities/{entityId}/exists")
    @Operation(summary = "Check whether an entity belongs to a case")
    public ResponseEntity<Boolean> isEntityInCase(
            @PathVariable Long caseId,
            @PathVariable Long entityId) {

        return ResponseEntity.ok(
                caseEntityService.isEntityInCase(
                        caseId,
                        entityId
                )
        );
    }

    // ── DELETE /api/v1/cases/{caseId}/entities ────────────────────

    @DeleteMapping("/{caseId}/entities")
    @Operation(summary = "Remove all entities from a case")
    public ResponseEntity<Void> removeAllEntitiesFromCase(
            @PathVariable Long caseId) {

        caseEntityService.removeAllEntitiesFromCase(caseId);

        return ResponseEntity.noContent().build();
    }
}