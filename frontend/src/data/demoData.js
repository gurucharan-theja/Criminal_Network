/**
 * demoData.js — Master Intelligence Data Store
 * All mock suspect data has been purged. 
 * Data starts clean and populates dynamically from real uploaded FIRs, CDRs, and backend entities.
 */

export const entities = []
export const relations = []
export const cases = []
export const events = []

export const stats = {
  totalEntities: 0,
  activeThreats: 0,
  casesOpen: 0,
  seizuresThisMonth: 0,
  connectionsTotal: 0,
  highRiskNodes: 0,
  newEntities7d: 0,
  analysisRuns: 0,
}

export const clusters = []

export const entityById = {}

export const graphData = {
  nodes: [],
  links: [],
}
