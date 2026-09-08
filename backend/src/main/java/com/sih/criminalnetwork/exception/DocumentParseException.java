package com.sih.criminalnetwork.exception;

/**
 * Thrown when Apache Tika fails to parse an uploaded document.
 * Maps to HTTP 422 via GlobalExceptionHandler.
 */
public class DocumentParseException extends RuntimeException {
    public DocumentParseException(String filename, Throwable cause) {
        super("Failed to parse document '" + filename + "': " + cause.getMessage(), cause);
    }
}
