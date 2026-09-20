package com.sih.criminalnetwork.repository;

import com.sih.criminalnetwork.model.Relationship;
import com.sih.criminalnetwork.model.Relationship.RelationType;
import com.sih.criminalnetwork.model.Relationship.Strength;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * RelationshipRepository
 *
 * JPA data access for criminal network graph edges.
 *
 * Supports:
 * - Relationship lookup
 * - Node neighborhood lookup
 * - Source/target traversal
 * - Relationship type filtering
 * - Confidence/strength ordering
 * - Graph degree calculations
 * - Source document filtering
 * - Safe deletion of node relationships
 */
@Repository
public interface RelationshipRepository
        extends JpaRepository<Relationship, Long> {

    // -------------------------------------------------------------------------
    // LOOKUP BY UNIQUE EDGE ID
    // -------------------------------------------------------------------------

    /**
     * Find a relationship by its unique graph edge ID.
     */
    Optional<Relationship> findByEdgeId(String edgeId);

    // -------------------------------------------------------------------------
    // RELATIONSHIP TYPE
    // -------------------------------------------------------------------------

    /**
     * Find all relationships of a specific type.
     */
    List<Relationship> findByType(RelationType type);

    /**
     * Find relationships of a type ordered by confidence.
     *
     * Useful for graph analysis where the strongest evidence
     * should appear first.
     */
    List<Relationship> findByTypeOrderByConfidenceDesc(
            RelationType type
    );

    /**
     * Count relationships by type.
     */
    long countByType(RelationType type);

    /**
     * Count relationships by strength.
     */
    long countByStrength(Strength strength);

    // -------------------------------------------------------------------------
    // NODE NEIGHBORHOOD
    // -------------------------------------------------------------------------

    /**
     * Find every relationship involving a node as either source or target.
     *
     * This represents the node's direct (1st-degree) neighborhood.
     */
    @Query("""
        SELECT r
        FROM Relationship r
        WHERE r.source.nodeId = :nodeId
           OR r.target.nodeId = :nodeId
        ORDER BY r.confidence DESC
    """)
    List<Relationship> findByNodeId(
            @Param("nodeId") String nodeId
    );

    /**
     * Find all outgoing relationships from a node.
     */
    @Query("""
        SELECT r
        FROM Relationship r
        WHERE r.source.nodeId = :nodeId
        ORDER BY r.confidence DESC
    """)
    List<Relationship> findBySourceNodeId(
            @Param("nodeId") String nodeId
    );

    /**
     * Find all incoming relationships to a node.
     */
    @Query("""
        SELECT r
        FROM Relationship r
        WHERE r.target.nodeId = :nodeId
        ORDER BY r.confidence DESC
    """)
    List<Relationship> findByTargetNodeId(
            @Param("nodeId") String nodeId
    );

    /**
     * Count all direct relationships involving a node.
     *
     * This is the node's direct graph degree.
     */
    @Query("""
        SELECT COUNT(r)
        FROM Relationship r
        WHERE r.source.nodeId = :nodeId
           OR r.target.nodeId = :nodeId
    """)
    long countByNodeId(
            @Param("nodeId") String nodeId
    );

    /**
     * Count outgoing relationships.
     */
    @Query("""
        SELECT COUNT(r)
        FROM Relationship r
        WHERE r.source.nodeId = :nodeId
    """)
    long countBySourceNodeId(
            @Param("nodeId") String nodeId
    );

    /**
     * Count incoming relationships.
     */
    @Query("""
        SELECT COUNT(r)
        FROM Relationship r
        WHERE r.target.nodeId = :nodeId
    """)
    long countByTargetNodeId(
            @Param("nodeId") String nodeId
    );

    // -------------------------------------------------------------------------
    // CONFIDENCE
    // -------------------------------------------------------------------------

    /**
     * Find all relationships ordered from highest to lowest confidence.
     */
    List<Relationship> findAllByOrderByConfidenceDesc();

    /**
     * Find relationships above a confidence threshold.
     *
     * Useful later for filtering weak graph edges.
     */
    @Query("""
        SELECT r
        FROM Relationship r
        WHERE r.confidence >= :minimumConfidence
        ORDER BY r.confidence DESC
    """)
    List<Relationship> findByMinimumConfidence(
            @Param("minimumConfidence") double minimumConfidence
    );

    // -------------------------------------------------------------------------
    // SOURCE DOCUMENT
    // -------------------------------------------------------------------------

    /**
     * Find all relationships extracted from a specific source document.
     */
    List<Relationship> findBySourceFile(String sourceFile);

    /**
     * Find source-document relationships ordered by confidence.
     */
    List<Relationship> findBySourceFileOrderByConfidenceDesc(
            String sourceFile
    );

    // -------------------------------------------------------------------------
    // DELETE RELATIONSHIPS FOR A NODE
    // -------------------------------------------------------------------------

    /**
     * Delete every relationship involving a specific node.
     *
     * Used when an entity is deleted from the graph.
     */
    @Modifying
    @Transactional
    @Query("""
        DELETE FROM Relationship r
        WHERE r.source.nodeId = :nodeId
           OR r.target.nodeId = :nodeId
    """)
    void deleteByNodeId(
            @Param("nodeId") String nodeId
    );
}