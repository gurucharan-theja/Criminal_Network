package com.sih.criminalnetwork.controller;

import com.sih.criminalnetwork.model.Case;
import com.sih.criminalnetwork.service.CaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * CaseController — REST API for investigation case management.
 *
 * GET    /api/v1/cases              — All cases (newest first)
 * POST   /api/v1/cases              — Create new case
 * GET    /api/v1/cases/{id}         — Single case by ID
 * PUT    /api/v1/cases/{id}         — Update case fields
 * DELETE /api/v1/cases/{id}         — Delete case
 * GET    /api/v1/cases/search?q=... — Full-text search
 * GET    /api/v1/cases/stats        — Case count breakdown
 */
@RestController
@RequestMapping("/api/v1/cases")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@Tag(name = "Case Management", description = "Investigation case CRUD operations")
public class CaseController {

    private final CaseService caseService;

    public CaseController(CaseService caseService) {
        this.caseService = caseService;
    }

    // ── GET /api/v1/cases ────────────────────────────────────────
    @GetMapping
    @Operation(summary = "Get all cases, newest first")
    public ResponseEntity<List<Case>> getAllCases() {
        return ResponseEntity.ok(caseService.getAllCases());
    }

    // ── POST /api/v1/cases ───────────────────────────────────────
    @PostMapping
    @Operation(summary = "Create a new investigation case")
    public ResponseEntity<Case> createCase(@RequestBody Case newCase) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(caseService.createCase(newCase));
    }

    // ── GET /api/v1/cases/stats ──────────────────────────────────
    @GetMapping("/stats")
    @Operation(summary = "Get case count stats (total, active, closed, pending)")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(caseService.getStats());
    }

    // ── GET /api/v1/cases/search ─────────────────────────────────
    @GetMapping("/search")
    @Operation(summary = "Full-text search across cases")
    public ResponseEntity<List<Case>> searchCases(@RequestParam String q) {
        return ResponseEntity.ok(caseService.searchCases(q));
    }

    // ── GET /api/v1/cases/{id} ───────────────────────────────────
    @GetMapping("/{id}")
    @Operation(summary = "Get a single case by ID")
    public ResponseEntity<Case> getCase(@PathVariable Long id) {
        return ResponseEntity.ok(caseService.getCaseById(id));
    }

    // ── PUT /api/v1/cases/{id} ───────────────────────────────────
    @PutMapping("/{id}")
    @Operation(summary = "Update case fields (partial update supported)")
    public ResponseEntity<Case> updateCase(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(caseService.updateCase(id, updates));
    }

    // ── DELETE /api/v1/cases/{id} ────────────────────────────────
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a case")
    public ResponseEntity<Map<String, String>> deleteCase(@PathVariable Long id) {
        caseService.deleteCase(id);
        return ResponseEntity.ok(Map.of("message", "Case " + id + " deleted"));
    }

    // ── POST /api/v1/cases/reset ─────────────────────────────────
    @PostMapping("/reset")
    @Operation(summary = "Purge all cases for a clean slate")
    public ResponseEntity<Map<String, String>> resetAllCases() {
        caseService.deleteAllCases();
        return ResponseEntity.ok(Map.of("message", "All cases purged successfully"));
    }
}
