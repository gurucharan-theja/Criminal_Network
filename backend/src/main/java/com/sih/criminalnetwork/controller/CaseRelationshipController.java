package com.sih.criminalnetwork.controller;

import com.sih.criminalnetwork.dto.RelationshipDTO;
import com.sih.criminalnetwork.model.CaseRelationship;
import com.sih.criminalnetwork.model.Relationship;
import com.sih.criminalnetwork.service.CaseRelationshipService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cases")
@CrossOrigin
public class CaseRelationshipController {

    private final CaseRelationshipService caseRelationshipService;

    public CaseRelationshipController(
            CaseRelationshipService caseRelationshipService) {
        this.caseRelationshipService = caseRelationshipService;
    }

    @GetMapping("/{caseId}/relationships")
    public ResponseEntity<List<RelationshipDTO>> getRelationshipsByCase(
            @PathVariable Long caseId) {

        List<RelationshipDTO> relationships =
                caseRelationshipService.getRelationshipsByCase(caseId)
                        .stream()
                        .map(CaseRelationship::getRelationship)
                        .map(this::toDTO)
                        .toList();

        return ResponseEntity.ok(relationships);
    }

    @PostMapping("/{caseId}/relationships/{relationshipId}")
    public ResponseEntity<RelationshipDTO> addRelationshipToCase(
            @PathVariable Long caseId,
            @PathVariable Long relationshipId,
            @RequestParam(required = false) String evidenceSource) {

        CaseRelationship caseRelationship =
                caseRelationshipService.addRelationshipToCase(
                        caseId,
                        relationshipId,
                        evidenceSource
                );

        return ResponseEntity.ok(
                toDTO(caseRelationship.getRelationship())
        );
    }

    @DeleteMapping("/{caseId}/relationships/{relationshipId}")
    public ResponseEntity<Void> removeRelationshipFromCase(
            @PathVariable Long caseId,
            @PathVariable Long relationshipId) {

        caseRelationshipService.removeRelationshipFromCase(
                caseId,
                relationshipId
        );

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{caseId}/relationships/{relationshipId}/exists")
    public ResponseEntity<Boolean> relationshipExistsInCase(
            @PathVariable Long caseId,
            @PathVariable Long relationshipId) {

        return ResponseEntity.ok(
                caseRelationshipService.isRelationshipInCase(
                        caseId,
                        relationshipId
                )
        );
    }

    @DeleteMapping("/{caseId}/relationships")
    public ResponseEntity<Void> removeAllRelationshipsFromCase(
            @PathVariable Long caseId) {

        caseRelationshipService.removeAllRelationshipsFromCase(caseId);

        return ResponseEntity.noContent().build();
    }

    private RelationshipDTO toDTO(Relationship relationship) {
        return RelationshipDTO.from(relationship);
    }
}