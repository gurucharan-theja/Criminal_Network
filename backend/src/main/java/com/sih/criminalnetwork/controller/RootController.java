package com.sih.criminalnetwork.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * RootController — Welcome & health check endpoints for cloud monitoring and root routing.
 */
@RestController
@Tag(name = "System Health", description = "Platform telemetry & root health checks")
public class RootController {

    @GetMapping("/")
    @Operation(summary = "Root health & API index check")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Criminal Network Analysis API",
                "version", "1.0.0",
                "docs", "/swagger-ui/index.html",
                "endpoints", Map.of(
                        "cases", "/api/v1/cases",
                        "case_stats", "/api/v1/cases/stats",
                        "analysis_graph", "/api/v1/analysis/graph",
                        "kingpins", "/api/v1/analysis/kingpins"
                ),
                "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/health")
    @Operation(summary = "Liveness probe for cloud deployments")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/favicon.ico")
    @Operation(summary = "Browser favicon handler to suppress 404/500 errors")
    public ResponseEntity<Void> favicon() {
        return ResponseEntity.noContent().build();
    }
}
