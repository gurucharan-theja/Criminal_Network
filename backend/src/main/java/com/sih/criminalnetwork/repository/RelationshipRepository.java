package com.sih.criminalnetwork.repository;

import com.sih.criminalnetwork.model.Relationship;
import com.sih.criminalnetwork.model.Relationship.RelationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * RelationshipRepository — JPA data access for criminal network edges.
 */
@Repository
public interface RelationshipRepository extends JpaRepository<Relationship, Long> {

    /** Find by unique edgeId */
    Optional<Relationship> findByEdgeId(String edgeId);

    /** All edges of a specific type (associate, financial, communication, family) */
    List<Relationship> findByType(RelationType type);

    /** All edges where a specific node is source OR target */
    @Query("""
        SELECT r FROM Relationship r
        WHERE r.source.nodeId = :nodeId OR r.target.nodeId = :nodeId
    """)
    List<Relationship> findByNodeId(String nodeId);

    /** All edges from source → (any target) */
    @Query("SELECT r FROM Relationship r WHERE r.source.nodeId = :nodeId")
    List<Relationship> findBySourceNodeId(String nodeId);

    /** All edges (any source) → target */
    @Query("SELECT r FROM Relationship r WHERE r.target.nodeId = :nodeId")
    List<Relationship> findByTargetNodeId(String nodeId);

    /** Delete all edges involving a specific node (when node is deleted) */
    @Modifying
    @Transactional
    @Query("""
        DELETE FROM Relationship r
        WHERE r.source.nodeId = :nodeId OR r.target.nodeId = :nodeId
    """)
    void deleteByNodeId(String nodeId);

    /** Count edges by type */
    long countByType(RelationType type);

    /** All edges from a specific source document */
    List<Relationship> findBySourceFile(String sourceFile);
}
