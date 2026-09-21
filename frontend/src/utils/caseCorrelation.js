import useCaseStore from '../store/useCaseStore'
import useGraphStore from '../store/useGraphStore'

/**
 * getRelatedCasesForEntity
 * Cross-references an entity (Person, Phone, Vehicle, Account) against all
 * historical and active cases in the repository.
 *
 * @param {Object} entity - The entity node object
 * @returns {Array} Array of matched Case objects
 */
export function getRelatedCasesForEntity(entity) {
  if (!entity) return []

  const cases = useCaseStore.getState().cases || []
  if (cases.length === 0) return []

  const entityName = String(entity.name || '').toLowerCase().trim()
  const entityId = String(entity.id || '')
  const entityPhone = (entity.type === 'Phone' || /\+?[0-9]{10,13}/.test(entityName))
    ? entityName.replace(/\D/g, '')
    : ''

  const matched = cases.filter((c) => {
    if (!c) return false

    // 1. Direct caseId or caseNumber match stored on entity
    if (entity.caseId && (String(c.id) === String(entity.caseId) || c.caseNumber === entity.caseId)) {
      return true
    }
    if (Array.isArray(entity.caseIds) && entity.caseIds.some((id) => String(id) === String(c.id) || id === c.caseNumber)) {
      return true
    }

    // 2. Match within case's associated entities list
    if (Array.isArray(c.entities) && c.entities.some((e) => {
      const eName = String(e.name || e).toLowerCase()
      const eId = String(e.id || e)
      return (entityName && eName.includes(entityName)) || (entityId && eId === entityId)
    })) {
      return true
    }

    // 3. Search in case title or description text for suspect name / phone
    const text = (String(c.title || '') + ' ' + String(c.description || '')).toLowerCase()

    if (entityName && entityName.length >= 3 && text.includes(entityName)) {
      return true
    }

    if (entityPhone && entityPhone.length >= 8 && text.replace(/\D/g, '').includes(entityPhone)) {
      return true
    }

    return false
  })

  return matched
}

/**
 * checkCrossCaseMatches
 * Given an array of extracted entities from a new document/FIR,
 * returns all entities that match existing previous cases.
 */
export function checkCrossCaseMatches(extractedEntities = []) {
  const matches = []

  extractedEntities.forEach((entity) => {
    const relatedCases = getRelatedCasesForEntity(entity)
    if (relatedCases.length > 0) {
      matches.push({
        entity,
        relatedCases,
        caseCount: relatedCases.length,
        caseNumbers: relatedCases.map((c) => c.caseNumber || `CASE-${c.id}`),
        caseTitles: relatedCases.map((c) => c.title || 'Investigation Docket'),
      })
    }
  })

  return matches
}
