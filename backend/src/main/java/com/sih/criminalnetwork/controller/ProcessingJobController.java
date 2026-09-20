package com.sih.criminalnetwork.controller;

import com.sih.criminalnetwork.dto.ProcessingJobDTO;
import com.sih.criminalnetwork.model.ProcessingJob;
import com.sih.criminalnetwork.model.ProcessingJob.ProcessingStatus;
import com.sih.criminalnetwork.service.ProcessingJobService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/processing")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:3000"
})
@Tag(
        name = "Processing Jobs",
        description = "Evidence processing job tracking and status"
)
public class ProcessingJobController {

    private final ProcessingJobService jobService;

    public ProcessingJobController(ProcessingJobService jobService) {
        this.jobService = jobService;
    }

    // ── GET /api/v1/processing ────────────────────────────────────

    @GetMapping
    @Operation(summary = "Get all processing jobs")
    public ResponseEntity<List<ProcessingJobDTO>> getAllJobs() {

        return ResponseEntity.ok(
                jobService.getAllJobs()
                        .stream()
                        .map(ProcessingJobDTO::from)
                        .toList()
        );
    }

    // ── GET /api/v1/processing/{id} ───────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Get processing job by database ID")
    public ResponseEntity<ProcessingJobDTO> getJob(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                ProcessingJobDTO.from(
                        jobService.getJobById(id)
                )
        );
    }

    // ── GET /api/v1/processing/job/{jobId} ────────────────────────

    @GetMapping("/job/{jobId}")
    @Operation(summary = "Get processing job by public job ID")
    public ResponseEntity<ProcessingJobDTO> getJobByJobId(
            @PathVariable String jobId) {

        return ResponseEntity.ok(
                ProcessingJobDTO.from(
                        jobService.getJobByJobId(jobId)
                )
        );
    }

    // ── GET /api/v1/processing/evidence/{evidenceId} ──────────────

    @GetMapping("/evidence/{evidenceId}")
    @Operation(summary = "Get processing jobs for an evidence record")
    public ResponseEntity<List<ProcessingJobDTO>> getJobsByEvidence(
            @PathVariable Long evidenceId) {

        return ResponseEntity.ok(
                jobService.getJobsByEvidence(evidenceId)
                        .stream()
                        .map(ProcessingJobDTO::from)
                        .toList()
        );
    }

    // ── GET /api/v1/processing/status/{status} ───────────────────

    @GetMapping("/status/{status}")
    @Operation(summary = "Get jobs by processing status")
    public ResponseEntity<List<ProcessingJobDTO>> getByStatus(
            @PathVariable ProcessingStatus status) {

        return ResponseEntity.ok(
                jobService.getAllJobs()
                        .stream()
                        .filter(job -> job.getStatus() == status)
                        .map(ProcessingJobDTO::from)
                        .toList()
        );
    }

    // ── POST /api/v1/processing/evidence/{evidenceId} ─────────────

    @PostMapping("/evidence/{evidenceId}")
    @Operation(summary = "Create a processing job for evidence")
    public ResponseEntity<ProcessingJobDTO> createJob(
            @PathVariable Long evidenceId) {

        ProcessingJob job = jobService.createJob(evidenceId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ProcessingJobDTO.from(job));
    }

    // ── PATCH /api/v1/processing/{id}/progress ────────────────────

    @PatchMapping("/{id}/progress")
    @Operation(summary = "Update processing progress")
    public ResponseEntity<ProcessingJobDTO> updateProgress(
            @PathVariable Long id,
            @RequestParam int progress,
            @RequestParam(required = false, defaultValue = "Processing") String stage) {

        ProcessingJob updated =
                jobService.updateProgress(id, progress, stage);

        return ResponseEntity.ok(
                ProcessingJobDTO.from(updated)
        );
    }

    // ── PATCH /api/v1/processing/{id}/complete ────────────────────

    @PatchMapping("/{id}/complete")
    @Operation(summary = "Mark processing job as completed")
    public ResponseEntity<ProcessingJobDTO> completeJob(
            @PathVariable Long id) {

        ProcessingJob completed =
                jobService.completeJob(id);

        return ResponseEntity.ok(
                ProcessingJobDTO.from(completed)
        );
    }

    // ── PATCH /api/v1/processing/{id}/fail ────────────────────────

    @PatchMapping("/{id}/fail")
    @Operation(summary = "Mark processing job as failed")
    public ResponseEntity<ProcessingJobDTO> failJob(
            @PathVariable Long id,
            @RequestParam String errorMessage) {

        ProcessingJob failed =
                jobService.failJob(id, errorMessage);

        return ResponseEntity.ok(
                ProcessingJobDTO.from(failed)
        );
    }
}