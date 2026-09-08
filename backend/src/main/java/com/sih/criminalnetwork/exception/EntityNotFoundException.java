package com.sih.criminalnetwork.exception;

/**
 * Thrown when an Entity is looked up by nodeId and does not exist.
 * Maps to HTTP 404 via GlobalExceptionHandler.
 */
public class EntityNotFoundException extends RuntimeException {
    public EntityNotFoundException(String nodeId) {
        super("Entity not found: " + nodeId);
    }
}
