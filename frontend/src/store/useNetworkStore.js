import { create } from "zustand";
import { getEntities } from "../services/entityApi";
import { getRelationships } from "../services/relationshipApi";
import { getGraph } from "../services/graphApi";

const getNodeId = (value) => {
  if (value == null) {
    return null;
  }

  if (typeof value === "object") {
    return value.id ?? value.nodeId ?? null;
  }

  return value;
};

const buildAdjacencyMap = (entities, relationships) => {
  const adjacency = new Map();

  (entities || []).forEach((entity) => {
    const id = getNodeId(entity);

    if (id != null) {
      adjacency.set(id, new Set());
    }
  });

  (relationships || []).forEach((relationship) => {
    const sourceId = getNodeId(relationship.source);
    const targetId = getNodeId(relationship.target);

    if (sourceId == null || targetId == null) {
      return;
    }

    if (!adjacency.has(sourceId)) {
      adjacency.set(sourceId, new Set());
    }

    if (!adjacency.has(targetId)) {
      adjacency.set(targetId, new Set());
    }

    adjacency.get(sourceId).add(targetId);
    adjacency.get(targetId).add(sourceId);
  });

  return adjacency;
};

const calculateDegreeNetwork = (
  selectedNodeId,
  entities,
  relationships,
  maxDepth = 1
) => {
  if (selectedNodeId == null) {
    return {
      nodeIds: new Set(),
      relationshipIds: new Set(),
      distances: new Map(),
    };
  }

  const adjacency = buildAdjacencyMap(
    entities,
    relationships
  );

  const distances = new Map();

  distances.set(selectedNodeId, 0);

  const queue = [selectedNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const currentDistance = distances.get(currentId);

    if (currentDistance >= maxDepth) {
      continue;
    }

    const neighbors =
      adjacency.get(currentId) || new Set();

    neighbors.forEach((neighborId) => {
      if (!distances.has(neighborId)) {
        distances.set(
          neighborId,
          currentDistance + 1
        );

        queue.push(neighborId);
      }
    });
  }

  const nodeIds = new Set(distances.keys());

  const relationshipIds = new Set();

  relationships.forEach((relationship, index) => {
    const sourceId = getNodeId(relationship.source);
    const targetId = getNodeId(relationship.target);

    if (
      sourceId == null ||
      targetId == null
    ) {
      return;
    }

    if (
      nodeIds.has(sourceId) &&
      nodeIds.has(targetId)
    ) {
      const relationshipId =
        relationship.id ??
        relationship.edgeId ??
        `${sourceId}-${targetId}-${index}`;

      relationshipIds.add(relationshipId);
    }
  });

  return {
    nodeIds,
    relationshipIds,
    distances,
  };
};

const useNetworkStore = create((set, get) => ({
  // ---------------------------------------------------------------------------
  // GRAPH STATE
  // ---------------------------------------------------------------------------

  entities: [],
  relationships: [],

  loading: false,
  error: null,

  // ---------------------------------------------------------------------------
  // DEGREE ANALYSIS STATE
  // ---------------------------------------------------------------------------

  selectedNodeId: null,

  degreeMode: "all",

  degreeAnalysis: {
    nodeIds: new Set(),
    relationshipIds: new Set(),
    distances: new Map(),
  },

  // ---------------------------------------------------------------------------
  // FETCH COMPLETE NETWORK
  // ---------------------------------------------------------------------------

  fetchNetwork: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('cni_graph_cleared') === 'true') {
        set({ entities: [], relationships: [], loading: false, error: null });
        return;
      }
    } catch (e) {}

    try {
      const graph = await getGraph();
      let entities = Array.isArray(graph?.nodes) ? graph.nodes : [];
      let relationships = Array.isArray(graph?.links) ? graph.links : [];

      // Merge with cached graph nodes from localStorage if any
      try {
        const rawN = localStorage.getItem('cni_graph_nodes');
        const rawL = localStorage.getItem('cni_graph_links');
        if (rawN) {
          const cachedN = JSON.parse(rawN);
          if (Array.isArray(cachedN)) {
            const mapN = new Map();
            [...entities, ...cachedN].forEach(n => { if (n && n.id) mapN.set(String(n.id), n); });
            entities = Array.from(mapN.values());
          }
        }
        if (rawL) {
          const cachedL = JSON.parse(rawL);
          if (Array.isArray(cachedL)) {
            const mapL = new Map();
            [...relationships, ...cachedL].forEach(l => {
              if (l) {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                mapL.set(`${s}->${t}:${l.type || ''}`, l);
              }
            });
            relationships = Array.from(mapL.values());
          }
        }
      } catch (e) {}

      set({
        entities,
        relationships,
        loading: false,
        error: null,
      });

      const { selectedNodeId, degreeMode } = get();
      if (selectedNodeId != null && degreeMode !== "all") {
        get().analyzeDegrees(selectedNodeId, degreeMode);
      }
    } catch (error) {
      console.warn("Backend graph API unavailable, using local storage cache:", error?.message);
      try {
        const rawN = localStorage.getItem('cni_graph_nodes');
        const rawL = localStorage.getItem('cni_graph_links');
        const entities = rawN ? JSON.parse(rawN) : [];
        const relationships = rawL ? JSON.parse(rawL) : [];
        set({ entities, relationships, loading: false, error: null });
      } catch (e) {
        set({ entities: [], relationships: [], loading: false, error: null });
      }
    }
  },

  // ---------------------------------------------------------------------------
  // FETCH ENTITIES
  // ---------------------------------------------------------------------------

  fetchEntities: async (params = {}) => {
    try {
      const data =
        await getEntities(params);

      set({
        entities: Array.isArray(data)
          ? data
          : [],
      });
    } catch (error) {
      console.error(
        "Failed to fetch entities:",
        error
      );

      set({
        error:
          error?.message ||
          "Failed to fetch entities",
      });
    }
  },

  // ---------------------------------------------------------------------------
  // FETCH RELATIONSHIPS
  // ---------------------------------------------------------------------------

  fetchRelationships: async (
    params = {}
  ) => {
    try {
      const data =
        await getRelationships(params);

      set({
        relationships:
          Array.isArray(data)
            ? data
            : [],
      });
    } catch (error) {
      console.error(
        "Failed to fetch relationships:",
        error
      );

      set({
        error:
          error?.message ||
          "Failed to fetch relationships",
      });
    }
  },

  // ---------------------------------------------------------------------------
  // SELECT ENTITY
  // ---------------------------------------------------------------------------

  selectNode: (nodeId) => {
    set({
      selectedNodeId:
        nodeId ?? null,
    });
  },

  // ---------------------------------------------------------------------------
  // CLEAR ENTITY SELECTION
  // ---------------------------------------------------------------------------

  clearSelectedNode: () => {
    set({
      selectedNodeId: null,
      degreeMode: "all",

      degreeAnalysis: {
        nodeIds: new Set(),
        relationshipIds: new Set(),
        distances: new Map(),
      },
    });
  },

  // ---------------------------------------------------------------------------
  // DEGREE ANALYSIS
  // ---------------------------------------------------------------------------

  analyzeDegrees: (
    nodeId,
    mode = "1-hop"
  ) => {
    const {
      entities,
      relationships,
    } = get();

    const selectedId =
      getNodeId(nodeId);

    if (selectedId == null) {
      get().clearSelectedNode();
      return;
    }

    let depth = 1;

    if (mode === "2-hop") {
      depth = 2;
    }

    if (mode === "all") {
      const allNodeIds = new Set(
        entities
          .map(getNodeId)
          .filter(
            (id) => id != null
          )
      );

      const allRelationshipIds =
        new Set();

      relationships.forEach(
        (relationship, index) => {
          const id =
            relationship.id ??
            relationship.edgeId ??
            `${index}`;

          allRelationshipIds.add(id);
        }
      );

      set({
        selectedNodeId:
          selectedId,
        degreeMode: "all",

        degreeAnalysis: {
          nodeIds: allNodeIds,
          relationshipIds:
            allRelationshipIds,
          distances: new Map(),
        },
      });

      return;
    }

    const analysis =
      calculateDegreeNetwork(
        selectedId,
        entities,
        relationships,
        depth
      );

    set({
      selectedNodeId:
        selectedId,

      degreeMode: mode,

      degreeAnalysis:
        analysis,
    });
  },

  // ---------------------------------------------------------------------------
  // 1ST DEGREE
  // ---------------------------------------------------------------------------

  analyzeFirstDegree: (
    nodeId
  ) => {
    get().analyzeDegrees(
      nodeId,
      "1-hop"
    );
  },

  // ---------------------------------------------------------------------------
  // 2ND DEGREE
  // ---------------------------------------------------------------------------

  analyzeSecondDegree: (
    nodeId
  ) => {
    get().analyzeDegrees(
      nodeId,
      "2-hop"
    );
  },

  // ---------------------------------------------------------------------------
  // SHOW COMPLETE NETWORK
  // ---------------------------------------------------------------------------

  showAllDegrees: () => {
    const {
      selectedNodeId,
    } = get();

    if (selectedNodeId == null) {
      set({
        degreeMode: "all",
      });

      return;
    }

    get().analyzeDegrees(
      selectedNodeId,
      "all"
    );
  },

  // ---------------------------------------------------------------------------
  // GET CURRENT ANALYSIS
  // ---------------------------------------------------------------------------

  getDegreeAnalysis: () => {
    return get().degreeAnalysis;
  },

  // ---------------------------------------------------------------------------
  // CHECK NODE DEGREE
  // ---------------------------------------------------------------------------

  getNodeDegree: (
    nodeId
  ) => {
    const {
      relationships,
    } = get();

    const id =
      getNodeId(nodeId);

    if (id == null) {
      return 0;
    }

    let degree = 0;

    relationships.forEach(
      (relationship) => {
        const sourceId =
          getNodeId(
            relationship.source
          );

        const targetId =
          getNodeId(
            relationship.target
          );

        if (
          sourceId === id ||
          targetId === id
        ) {
          degree += 1;
        }
      }
    );

    return degree;
  },

  // ---------------------------------------------------------------------------
  // GET DIRECT CONNECTIONS
  // ---------------------------------------------------------------------------

  getDirectConnections: (
    nodeId
  ) => {
    const {
      entities,
      relationships,
    } = get();

    const id =
      getNodeId(nodeId);

    if (id == null) {
      return [];
    }

    const connectedIds =
      new Set();

    relationships.forEach(
      (relationship) => {
        const sourceId =
          getNodeId(
            relationship.source
          );

        const targetId =
          getNodeId(
            relationship.target
          );

        if (sourceId === id) {
          connectedIds.add(
            targetId
          );
        }

        if (targetId === id) {
          connectedIds.add(
            sourceId
          );
        }
      }
    );

    return entities.filter(
      (entity) =>
        connectedIds.has(
          getNodeId(entity)
        )
    );
  },

  // ---------------------------------------------------------------------------
  // GET 2ND DEGREE CONNECTIONS
  // ---------------------------------------------------------------------------

  getSecondDegreeConnections: (
    nodeId
  ) => {
    const {
      entities,
      relationships,
    } = get();

    const id =
      getNodeId(nodeId);

    if (id == null) {
      return [];
    }

    const analysis =
      calculateDegreeNetwork(
        id,
        entities,
        relationships,
        2
      );

    return entities.filter(
      (entity) => {
        const entityId =
          getNodeId(entity);

        return (
          entityId !== id &&
          analysis.nodeIds.has(
            entityId
          )
        );
      }
    );
  },

  // ---------------------------------------------------------------------------
  // FILTER ENTITIES USING DEGREE ANALYSIS
  // ---------------------------------------------------------------------------

  getDegreeFilteredEntities: () => {
    const {
      entities,
      degreeMode,
      degreeAnalysis,
      selectedNodeId,
    } = get();

    if (
      degreeMode === "all" ||
      selectedNodeId == null
    ) {
      return entities;
    }

    return entities.filter(
      (entity) =>
        degreeAnalysis.nodeIds.has(
          getNodeId(entity)
        )
    );
  },

  // ---------------------------------------------------------------------------
  // FILTER RELATIONSHIPS USING DEGREE ANALYSIS
  // ---------------------------------------------------------------------------

  getDegreeFilteredRelationships:
    () => {
      const {
        relationships,
        degreeMode,
        degreeAnalysis,
        selectedNodeId,
      } = get();

      if (
        degreeMode === "all" ||
        selectedNodeId == null
      ) {
        return relationships;
      }

      return relationships.filter(
        (relationship, index) => {
          const sourceId =
            getNodeId(
              relationship.source
            );

          const targetId =
            getNodeId(
              relationship.target
            );

          const relationshipId =
            relationship.id ??
            relationship.edgeId ??
            `${sourceId}-${targetId}-${index}`;

          return (
            degreeAnalysis.relationshipIds.has(
              relationshipId
            )
          );
        }
      );
    },

  // ---------------------------------------------------------------------------
  // CLEAR ERROR
  // ---------------------------------------------------------------------------

  clearError: () =>
    set({
      error: null,
    }),
}));

export default useNetworkStore;