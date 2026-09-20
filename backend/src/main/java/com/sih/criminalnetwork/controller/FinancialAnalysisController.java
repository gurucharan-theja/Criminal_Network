package com.sih.criminalnetwork.controller;

import com.sih.criminalnetwork.model.Evidence;
import com.sih.criminalnetwork.repository.EvidenceRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/financial")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:3000"
})
@Tag(
        name = "Financial Network Analysis",
        description = "Financial transaction analysis and network statistics"
)
public class FinancialAnalysisController {

    private final EvidenceRepository evidenceRepository;

    public FinancialAnalysisController(
            EvidenceRepository evidenceRepository) {

        this.evidenceRepository =
                evidenceRepository;
    }

    // =========================================================================
    // GET /api/v1/financial/transactions
    // =========================================================================

    @GetMapping("/transactions")
    @Operation(
            summary = "Get stored financial transaction evidence"
    )
    public ResponseEntity<List<Map<String, Object>>> getFinancialTransactions() {

        List<Evidence> evidenceList =
                evidenceRepository.findBySourceType(
                        "FINANCIAL_TRANSACTION"
                );

        List<Map<String, Object>> transactions =
                new ArrayList<>();

        for (Evidence evidence : evidenceList) {

            Map<String, Object> item =
                    new LinkedHashMap<>();

            item.put(
                    "id",
                    evidence.getId()
            );

            item.put(
                    "evidenceNumber",
                    evidence.getEvidenceNumber()
            );

            item.put(
                    "fileName",
                    evidence.getFileName()
            );

            item.put(
                    "sourceType",
                    evidence.getSourceType()
            );

            item.put(
                    "status",
                    evidence.getStatus()
            );

            item.put(
                    "fileSize",
                    evidence.getFileSize()
            );

            item.put(
                    "caseId",
                    evidence.getInvestigationCase() != null
                            ? evidence.getInvestigationCase().getId()
                            : null
            );

            transactions.add(item);
        }

        return ResponseEntity.ok(
                transactions
        );
    }

    // =========================================================================
    // GET /api/v1/financial/stats
    // =========================================================================

    @GetMapping("/stats")
    @Operation(
            summary = "Get financial network statistics"
    )
    public ResponseEntity<Map<String, Object>> getFinancialStats() {

        List<Evidence> evidenceList =
                evidenceRepository.findBySourceType(
                        "FINANCIAL_TRANSACTION"
                );

        long totalEvidence =
                evidenceList.size();

        long processedEvidence =
                evidenceList.stream()
                        .filter(e ->
                                e.getStatus() != null
                                        && "PROCESSED".equals(
                                                e.getStatus().name()
                                        )
                        )
                        .count();

        long failedEvidence =
                evidenceList.stream()
                        .filter(e ->
                                e.getStatus() != null
                                        && "FAILED".equals(
                                                e.getStatus().name()
                                        )
                        )
                        .count();

        long totalRecords = 0;

        double totalAmount = 0.0;

        for (Evidence evidence : evidenceList) {

            String data =
                    evidence.getExtractedText();

            if (data == null || data.isBlank()) {
                continue;
            }

            String[] lines =
                    data.split("\\r?\\n");

            for (int i = 0; i < lines.length; i++) {

                String line =
                        lines[i].trim();

                if (line.isBlank()) {
                    continue;
                }

                // Skip common CSV headers.
                if (i == 0 && isTransactionHeader(line)) {
                    continue;
                }

                String[] columns =
                        line.split(",");

                if (columns.length < 2) {
                    continue;
                }

                totalRecords++;

                // Common structure:
                //
                // sender,receiver,amount,...
                //
                // Amount is usually column 3.
                if (columns.length >= 3) {

                    String amountValue =
                            cleanValue(columns[2]);

                    totalAmount +=
                            parseAmount(amountValue);
                }
            }
        }

        Map<String, Object> stats =
                new LinkedHashMap<>();

        stats.put(
                "totalEvidenceFiles",
                totalEvidence
        );

        stats.put(
                "processedEvidenceFiles",
                processedEvidence
        );

        stats.put(
                "failedEvidenceFiles",
                failedEvidence
        );

        stats.put(
                "totalTransactions",
                totalRecords
        );

        stats.put(
                "totalTransactionAmount",
                Math.round(totalAmount * 100.0) / 100.0
        );

        return ResponseEntity.ok(
                stats
        );
    }

    // =========================================================================
    // GET /api/v1/financial/summary
    // =========================================================================

    @GetMapping("/summary")
    @Operation(
            summary = "Get financial network summary"
    )
    public ResponseEntity<Map<String, Object>> getFinancialSummary() {

        List<Evidence> evidenceList =
                evidenceRepository.findBySourceType(
                        "FINANCIAL_TRANSACTION"
                );

        int fileCount =
                evidenceList.size();

        long transactionCount = 0;

        double totalAmount = 0.0;

        List<Map<String, Object>> files =
                new ArrayList<>();

        for (Evidence evidence : evidenceList) {

            long fileTransactions = 0;

            double fileAmount = 0.0;

            String data =
                    evidence.getExtractedText();

            if (data != null && !data.isBlank()) {

                String[] lines =
                        data.split("\\r?\\n");

                for (int i = 0; i < lines.length; i++) {

                    String line =
                            lines[i].trim();

                    if (line.isBlank()) {
                        continue;
                    }

                    if (i == 0
                            && isTransactionHeader(line)) {

                        continue;
                    }

                    String[] columns =
                            line.split(",");

                    if (columns.length < 2) {
                        continue;
                    }

                    fileTransactions++;
                    transactionCount++;

                    if (columns.length >= 3) {

                        double amount =
                                parseAmount(
                                        cleanValue(columns[2])
                                );

                        fileAmount += amount;
                        totalAmount += amount;
                    }
                }
            }

            Map<String, Object> fileSummary =
                    new LinkedHashMap<>();

            fileSummary.put(
                    "evidenceId",
                    evidence.getId()
            );

            fileSummary.put(
                    "fileName",
                    evidence.getFileName()
            );

            fileSummary.put(
                    "transactions",
                    fileTransactions
            );

            fileSummary.put(
                    "amount",
                    Math.round(fileAmount * 100.0) / 100.0
            );

            fileSummary.put(
                    "status",
                    evidence.getStatus()
            );

            files.add(fileSummary);
        }

        Map<String, Object> summary =
                new LinkedHashMap<>();

        summary.put(
                "financialEvidenceFiles",
                fileCount
        );

        summary.put(
                "totalTransactions",
                transactionCount
        );

        summary.put(
                "totalTransactionAmount",
                Math.round(totalAmount * 100.0) / 100.0
        );

        summary.put(
                "files",
                files
        );

        return ResponseEntity.ok(
                summary
        );
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private boolean isTransactionHeader(
            String line) {

        String lower =
                line.toLowerCase(Locale.ROOT);

        return lower.contains("sender")
                || lower.contains("receiver")
                || lower.contains("source")
                || lower.contains("destination")
                || lower.contains("amount")
                || lower.contains("account");
    }

    private String cleanValue(
            String value) {

        if (value == null) {
            return "";
        }

        return value
                .trim()
                .replace("\"", "")
                .replace("₹", "")
                .replace(",", "");
    }

    private double parseAmount(
            String value) {

        if (value == null || value.isBlank()) {
            return 0.0;
        }

        String cleaned =
                value
                        .trim()
                        .replace("\"", "")
                        .replace("₹", "")
                        .replace("$", "")
                        .replace("€", "")
                        .replace(",", "");

        try {

            return Double.parseDouble(
                    cleaned
            );

        } catch (NumberFormatException e) {

            return 0.0;
        }
    }
}