package com.sih.criminalnetwork.repository;

import com.sih.criminalnetwork.model.Entity;
import com.sih.criminalnetwork.model.Entity.EntityType;
import com.sih.criminalnetwork.model.Entity.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * EntityRepository — JPA data access for criminal network nodes.
 * Spring Data generates all SQL automatically.
 */
@Repository
public interface EntityRepository extends JpaRepository<Entity, Long> {

    /** Find by unique nodeId (e.g. "ext_p_1_...") */
    Optional<Entity> findByNodeId(String nodeId);

    /** Check existence by nodeId */
    boolean existsByNodeId(String nodeId);

    /** Delete by nodeId */
    void deleteByNodeId(String nodeId);

    /** Filter by risk level */
    List<Entity> findByRisk(RiskLevel risk);

    /** Filter by entity type */
    List<Entity> findByType(EntityType type);

    /** Filter by both risk and type */
    List<Entity> findByRiskAndType(RiskLevel risk, EntityType type);

    /** Filter by source document */
    List<Entity> findBySourceFile(String sourceFile);

    /** Count entities by risk level */
    long countByRisk(RiskLevel risk);

    /** Count entities by type */
    long countByType(EntityType type);

    /** Full-text search across name, role, location */
    @Query("""
        SELECT e FROM Entity e
        WHERE LOWER(e.name)     LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(e.role)     LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(e.location) LIKE LOWER(CONCAT('%', :q, '%'))
    """)
    List<Entity> search(String q);
}
