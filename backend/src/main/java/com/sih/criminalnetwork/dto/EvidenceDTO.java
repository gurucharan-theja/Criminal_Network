package com.sih.criminalnetwork.dto;

import com.sih.criminalnetwork.model.Evidence;

/**
 * EvidenceDTO — API representation of an evidence record.
 * Keeps the database model separate from the frontend contract.
 */
public class EvidenceDTO {

    public Long id;
    public String evidenceNumber;
    public String fileName;
    public String fileType;
    public Long fileSize;
    public String description;
    public String sourceType;
    public String storagePath;
    public String fileHash;
    public String status;
    public String uploadedBy;
    public String uploadedAt;
    public String updatedAt;
    public Long caseId;
public String caseNumber;

    public static EvidenceDTO from(Evidence evidence) {

        EvidenceDTO dto = new EvidenceDTO();
        if (evidence.getInvestigationCase() != null) {
    dto.caseId = evidence.getInvestigationCase().getId();
    dto.caseNumber = evidence.getInvestigationCase().getCaseNumber();
}

        dto.id = evidence.getId();
        dto.evidenceNumber = evidence.getEvidenceNumber();
        dto.fileName = evidence.getFileName();
        dto.fileType = evidence.getFileType();
        dto.fileSize = evidence.getFileSize();
        dto.description = evidence.getDescription();
        dto.sourceType = evidence.getSourceType();
        dto.storagePath = evidence.getStoragePath();
        dto.fileHash = evidence.getFileHash();

        dto.status = evidence.getStatus() != null
                ? evidence.getStatus().name()
                : null;

        dto.uploadedBy = evidence.getUploadedBy();

        dto.uploadedAt = evidence.getUploadedAt() != null
                ? evidence.getUploadedAt().toString()
                : null;

        dto.updatedAt = evidence.getUpdatedAt() != null
                ? evidence.getUpdatedAt().toString()
                : null;

        return dto;
    }
}