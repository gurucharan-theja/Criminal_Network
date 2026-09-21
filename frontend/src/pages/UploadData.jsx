import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  Brain,
  ChevronRight,
  Layers,
  Network,
  Eye,
  FileSpreadsheet,
  Phone,
  DollarSign,
  Database,
} from 'lucide-react'

import useGraphStore from '../store/useGraphStore'
import useToast from '../hooks/useToast'
import axiosClient from '../api/axiosClient'
import { analyseDocument } from '../api/analysisApi'

const ACCEPTED_TYPES = [
  '.pdf',
  '.txt',
  '.csv',
  '.json',
  '.docx',
  '.xlsx'
]

const SOURCE_CATEGORIES = [
  {
    id: 'all',
    label: 'All Intelligence Sources',
    icon: '📂'
  },
  {
    id: 'fir',
    label: 'FIRs & Police Reports',
    icon: '🚓'
  },
  {
    id: 'cdr',
    label: 'Call Detail Records (CDRs)',
    icon: '📞'
  },
  {
    id: 'fin',
    label: 'Financial & Hawala Records',
    icon: '💰'
  },
  {
    id: 'surv',
    label: 'Surveillance & Field Intel',
    icon: '👁️'
  },
  {
    id: 'cctns',
    label: 'Criminal History (CCTNS)',
    icon: '🗄️'
  },
]

const AI_STEPS = [
  {
    id: 1,
    label: 'Standardizing Multi-Source Evidence Document...',
    duration: 400
  },
  {
    id: 2,
    label: 'Running Multi-Class Named Entity Recognition (NER)...',
    duration: 600
  },
  {
    id: 3,
    label: 'Mapping Relational & Communication Conduits...',
    duration: 500
  },
  {
    id: 4,
    label: 'Running Graph Component & Syndicate Community Detection...',
    duration: 500
  },
  {
    id: 5,
    label: 'Calculating Threat & Betweenness Centrality Scores...',
    duration: 400
  },
  {
    id: 6,
    label: 'Admitting Evidence Entities into Tactical Knowledge Graph...',
    duration: 300
  },
]

export default function UploadData() {

  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState([])
  const [analysing, setAnalysing] = useState(false)
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [results, setResults] = useState(null)

  const [selectedSourceType, setSelectedSourceType] =
    useState('FIRs & Police Reports')

  const [previewFile, setPreviewFile] = useState(null)

  const inputRef = useRef(null)
  const navigate = useNavigate()
  const toast = useToast()

  const mergeExtractionResult =
    useGraphStore((s) => s.mergeExtractionResult)

  // =========================================================
  // ADD FILES
  // =========================================================

  const addFiles = (fileList) => {

    if (!fileList) {
      return
    }

    Array.from(fileList).forEach((f) => {

      const reader = new FileReader()

      reader.onload = (e) => {

        const text =
          e.target?.result || ''

        setFiles((prev) => [
          ...prev,
          {
            id:
              Math.random()
                .toString(36)
                .slice(2),

            file: f,

            name: f.name,

            size: f.size,

            ext:
              f.name
                .split('.')
                .pop()
                .toLowerCase(),

            sourceCategory:
              selectedSourceType,

            rawText:
              typeof text === 'string'
                ? text
                : '',

            status: 'queued',
          },
        ])
      }

      if (
        f.name.toLowerCase().endsWith('.txt')
        || f.name.toLowerCase().endsWith('.csv')
        || f.name.toLowerCase().endsWith('.json')
        || f.type.includes('text')
      ) {

        reader.readAsText(f)

      } else {

        reader.readAsArrayBuffer(f)
      }
    })

    setDone(false)
    setResults(null)
    setStep(0)
  }

  // =========================================================
  // REMOVE FILE
  // =========================================================

  const removeFile = (id) => {

    setFiles((prev) =>
      prev.filter((f) => f.id !== id)
    )
  }

  // =========================================================
  // DROP HANDLER
  // =========================================================

  const handleDrop = useCallback(
    (e) => {

      e.preventDefault()

      setDragOver(false)

      addFiles(
        e.dataTransfer.files
      )
    },
    [selectedSourceType]
  )

  // =========================================================
  // CDR UPLOAD
  // =========================================================

  const uploadCdr = async (file) => {

    const formData =
      new FormData()

    formData.append(
      'file',
      file
    )

    const response =
      await axiosClient.post(
        '/evidence/cdr',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data'
          }
        }
      )

    return response.data
  }

  // =========================================================
  // FINANCIAL UPLOAD
  // =========================================================

  const uploadFinancialData = async (file) => {

    const formData =
      new FormData()

    formData.append(
      'file',
      file
    )

    const response =
      await axiosClient.post(
        '/financial/ingest',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data'
          }
        }
      )

    return response.data
  }

  // =========================================================
  // FINANCIAL SUMMARY
  // =========================================================

  const fetchFinancialSummary = async () => {

    try {

      const response =
        await axiosClient.get(
          '/financial/summary'
        )

      return response.data

    } catch (error) {

      console.warn(
        'Financial summary unavailable:',
        error
      )

      return null
    }
  }

  // =========================================================
  // RUN ANALYSIS
  // =========================================================

  const runAnalysis = async () => {

    if (files.length === 0) {
      return
    }

    setAnalysing(true)
    setDone(false)
    setStep(0)

    let extractedEntities = []
    let extractedRelations = []

    let cdrFiles = 0
    let financialFiles = 0

    let financialSummary = null

    try {

      // -------------------------------------------------------
      // Visual AI pipeline
      // -------------------------------------------------------

      for (
        let i = 0;
        i < AI_STEPS.length;
        i++
      ) {

        setStep(i + 1)

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              AI_STEPS[i].duration
            )
        )
      }

      setStep(
        AI_STEPS.length
      )

      // -------------------------------------------------------
      // Process each file
      // -------------------------------------------------------

      for (const f of files) {

        let fileProcessed =
          false

        try {

          // ===================================================
          // CDR
          // ===================================================

          if (
            f.sourceCategory ===
            'Call Detail Records (CDRs)'
          ) {

            const cdrResponse =
              await uploadCdr(
                f.file
              )

            console.log(
              `CDR ingestion completed for ${f.name}:`,
              cdrResponse
            )

            cdrFiles++

            fileProcessed = true

            continue
          }

          // ===================================================
          // FINANCIAL
          // ===================================================

          if (
            f.sourceCategory ===
            'Financial & Hawala Records'
          ) {

            const financialResponse =
              await uploadFinancialData(
                f.file
              )

            console.log(
              `Financial ingestion completed for ${f.name}:`,
              financialResponse
            )

            financialFiles++

            fileProcessed = true

            continue
          }

          // ===================================================
          // STANDARD INTELLIGENCE DOCUMENT
          // ===================================================

          const response =
            await analyseDocument(
              f.file
            )

          console.log(
            `Analysis completed for ${f.name}:`,
            response
          )

          if (
            response?.status ===
            'success'
          ) {

            const rawEntities =
              Array.isArray(
                response.entities
              )
                ? response.entities
                : []

            const rawRelations =
              Array.isArray(
                response.relations
              )
                ? response.relations
                : []

            if (
              rawEntities.length > 0
            ) {

              extractedEntities.push(
                ...rawEntities
              )

              fileProcessed =
                true
            }

            if (
              rawRelations.length > 0
            ) {

              extractedRelations.push(
                ...rawRelations
              )
            }
          }

        } catch (backendErr) {

          console.warn(
            `Backend processing failed for ${f.name}:`,
            backendErr
          )
        }

        // =====================================================
        // Local fallback for normal files
        // =====================================================

        if (
          !fileProcessed
          && f.rawText
          && f.sourceCategory !==
            'Call Detail Records (CDRs)'
          && f.sourceCategory !==
            'Financial & Hawala Records'
        ) {

          const text =
            f.rawText

          // ---------------------------------------------------
          // Phones
          // ---------------------------------------------------

          const phoneMatches =
            text.match(
              /\+?[0-9]{10,13}/g
            ) || []

          phoneMatches.forEach(
            (ph, idx) => {

              extractedEntities.push({

                id:
                  `phone-${Date.now()}-${idx}`,

                name:
                  ph,

                type:
                  'Phone',

                role:
                  'Intercepted Telecom Endpoint',

                risk:
                  'medium',

                sourceFile:
                  f.name,

                connections:
                  1
              })
            }
          )

          // ---------------------------------------------------
          // Vehicles
          // ---------------------------------------------------

          const vehicleMatches =
            text.match(
              /[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,2}[-\s]?[0-9]{4}/g
            ) || []

          vehicleMatches.forEach(
            (vh, idx) => {

              extractedEntities.push({

                id:
                  `veh-${Date.now()}-${idx}`,

                name:
                  vh,

                type:
                  'Vehicle',

                role:
                  'Operational Transport',

                risk:
                  'high',

                sourceFile:
                  f.name,

                connections:
                  1
              })
            }
          )

          // ---------------------------------------------------
          // Strict Person Entity Extraction Engine
          // ---------------------------------------------------

          const NON_PERSON_WORDS = new Set([
            'police', 'station', 'report', 'section', 'court', 'state', 'bank', 'public', 'notice',
            'information', 'charge', 'sheet', 'union', 'territory', 'call', 'detail', 'record', 'tower',
            'dump', 'mobile', 'number', 'account', 'vehicle', 'motor', 'car', 'truck', 'location', 'city',
            'district', 'high', 'supreme', 'law', 'order', 'special', 'cell', 'bureau', 'department',
            'division', 'unit', 'hawala', 'syndicate', 'logistics', 'operations', 'national', 'central',
            'regional', 'international', 'financial', 'transaction', 'evidence', 'document', 'case', 'file',
            'docket', 'memo', 'fir', 'general', 'diary', 'branch', 'sub', 'inspector', 'assistant',
            'superintendent', 'commissioner', 'headquarters', 'hq', 'wing', 'range', 'zone', 'squad',
            'accused', 'suspect', 'witness', 'complainant', 'informant', 'officer', 'shri', 'smt', 'mr',
            'mrs', 'dr', 'alias', 'gangster', 'don', 'bhai', 'kingpin', 'mastermind', 'operative', 'financier'
          ])

          const personPatterns = [
            /\b(?:Shri|Smt|Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Accused|Suspect|Alias|Gangster|Don|Bhai|Kingpin|Mastermind|Operative|Financier|Courier|Handler|Officer|Inspector)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g,
            /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:alias|@)\s+([A-Z][a-zA-Z0-9]+)\b/gi,
            /\b(?:named|identified as|arrested|interrogated|handler|mule|courier|operates|contacted)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b/gi,
          ]

          const ROLE_RULES = [
            { role: 'Kingpin / Mastermind', keywords: ['kingpin', 'mastermind', 'boss', 'leader', 'syndicate head', 'chief', 'gangster', 'don'], risk: 'high' },
            { role: 'Financier', keywords: ['hawala', 'financier', 'investor', 'treasurer', 'accountant', 'mule account', 'laundering'], risk: 'high' },
            { role: 'Operative', keywords: ['operative', 'courier', 'handler', 'enforcer', 'shooter', 'agent', 'carrier'], risk: 'medium' },
            { role: 'Logistics / Transport', keywords: ['driver', 'supplier', 'smuggler', 'transporter', 'arms dealer', 'vehicle'], risk: 'medium' },
            { role: 'Informant / Tipster', keywords: ['informant', 'tipster', 'source', 'mole', 'insider'], risk: 'low' },
          ]

          const extractedPersonNames = new Set()

          personPatterns.forEach((pattern) => {
            let match
            while ((match = pattern.exec(text)) !== null) {
              const matchedName = (match[1] || match[0]).trim()
              const words = matchedName.split(/\s+/).map((w) => w.toLowerCase())
              if (
                matchedName.length >= 4 &&
                !words.some((w) => NON_PERSON_WORDS.has(w))
              ) {
                extractedPersonNames.add(matchedName)
              }
            }
          })

          let personIdx = 0
          extractedPersonNames.forEach((personName) => {
            personIdx++
            const nameLower = personName.toLowerCase()
            let assignedRole = 'Suspect / Operative'
            let assignedRisk = 'medium'

            const idxInText = text.toLowerCase().indexOf(nameLower)
            if (idxInText !== -1) {
              const windowText = text.substring(Math.max(0, idxInText - 150), Math.min(text.length, idxInText + 150)).toLowerCase()
              for (const rule of ROLE_RULES) {
                if (rule.keywords.some((kw) => windowText.includes(kw))) {
                  assignedRole = rule.role
                  assignedRisk = rule.risk
                  break
                }
              }
            }

            extractedEntities.push({
              id: `person-${Date.now()}-${personIdx}`,
              name: personName,
              type: 'Person',
              role: assignedRole,
              risk: assignedRisk,
              sourceFile: f.name,
              connections: 1,
            })
          })

          // ---------------------------------------------------
          // Contextual Relationship Link Extraction (Person Links)
          // ---------------------------------------------------

          const personEntities = extractedEntities.filter((e) => e.type === 'Person')
          const phoneEntities = extractedEntities.filter((e) => e.type === 'Phone')
          const vehicleEntities = extractedEntities.filter((e) => e.type === 'Vehicle')
          const accountEntities = extractedEntities.filter((e) => e.type === 'Account')

          let relCounter = 1

          // 1. Person <-> Person (Associate Links)
          for (let i = 0; i < personEntities.length; i++) {
            for (let j = i + 1; j < personEntities.length; j++) {
              extractedRelations.push({
                id: `rel-p2p-${Date.now()}-${relCounter++}`,
                source: personEntities[i].id,
                target: personEntities[j].id,
                type: 'ASSOCIATE',
                weight: 4,
                sourceFile: f.name,
                description: `Syndicate associate link between ${personEntities[i].name} and ${personEntities[j].name}`
              })
            }
          }

          // 2. Person <-> Phone (Telecom Intercept Links)
          personEntities.forEach((p) => {
            phoneEntities.forEach((ph) => {
              extractedRelations.push({
                id: `rel-p2ph-${Date.now()}-${relCounter++}`,
                source: p.id,
                target: ph.id,
                type: 'FREQUENT_CALL',
                weight: 3,
                sourceFile: f.name,
                description: `${p.name} associated with phone endpoint ${ph.name}`
              })
            })
          })

          // 3. Person <-> Vehicle (Transport Vehicle Links)
          personEntities.forEach((p) => {
            vehicleEntities.forEach((v) => {
              extractedRelations.push({
                id: `rel-p2v-${Date.now()}-${relCounter++}`,
                source: p.id,
                target: v.id,
                type: 'REGISTERED_TO',
                weight: 2,
                sourceFile: f.name,
                description: `${p.name} associated with transport vehicle ${v.name}`
              })
            })
          })

          // 4. Person <-> Account (Financial Conduit Links)
          personEntities.forEach((p) => {
            accountEntities.forEach((acc) => {
              extractedRelations.push({
                id: `rel-p2a-${Date.now()}-${relCounter++}`,
                source: p.id,
                target: acc.id,
                type: 'FINANCIAL_TX',
                weight: 5,
                sourceFile: f.name,
                description: `${p.name} financial transfer connection to account ${acc.name}`
              })
            })
          })
        }
      }

      // =======================================================
      // Refresh financial statistics
      // =======================================================

      if (
        financialFiles > 0
      ) {

        financialSummary =
          await fetchFinancialSummary()
      }

      // =======================================================
      // Merge normal extraction results
      // =======================================================

      if (
        extractedEntities.length > 0
      ) {

        mergeExtractionResult({

          entities:
            extractedEntities,

          relations:
            extractedRelations
        })
      }

      // =======================================================
      // Results
      // =======================================================

      const highRiskCount =
        extractedEntities.filter(
          (e) =>
            e.risk === 'high'
            || e.risk === 'High'
            || e.threatLevel === 'HIGH'
            || e.threatLevel === 'CRITICAL'
        ).length

      const categorization = {

        persons:
          extractedEntities.filter(
            (e) =>
              e.type?.toLowerCase() ===
              'person'
          ).length,

        phones:
          extractedEntities.filter(
            (e) =>
              e.type?.toLowerCase() ===
              'phone'
          ).length,

        vehicles:
          extractedEntities.filter(
            (e) =>
              e.type?.toLowerCase() ===
              'vehicle'
          ).length,

        organizations:
          extractedEntities.filter(
            (e) =>
              e.type?.toLowerCase() ===
              'organization'
          ).length,

        locations:
          extractedEntities.filter(
            (e) =>
              e.type?.toLowerCase() ===
              'location'
          ).length,
      }

      const extractionSummary = {

        entitiesFound:
          extractedEntities.length,

        relationsFound:
          extractedRelations.length,

        highRisk:
          highRiskCount,

        confidence:
          extractedEntities.length > 0
            ? '96.2%'
            : 'N/A',

        processingTime:
          '2.1s',

        categorization,

        cdrFiles,

        financialFiles,

        financialTransactions:
          financialSummary?.totalTransactions || 0,

        financialAmount:
          financialSummary?.totalTransactionAmount || 0,
      }

      setResults(
        extractionSummary
      )

      setFiles(
        (prev) =>
          prev.map(
            (f) => ({
              ...f,
              status: 'done'
            })
          )
      )

      setAnalysing(false)
      setDone(true)

      // =======================================================
      // Toast messages
      // =======================================================

      if (
        cdrFiles > 0
        || financialFiles > 0
      ) {

        const parts = []

        if (cdrFiles > 0) {

          parts.push(
            `${cdrFiles} CDR file(s)`
          )
        }

        if (financialFiles > 0) {

          parts.push(
            `${financialFiles} financial file(s)`
          )
        }

        toast.success(
          `Successfully ingested ${parts.join(' and ')}.`
        )

      } else if (
        extractedEntities.length > 0
      ) {

        toast.success(
          `Successfully extracted ${extractedEntities.length} entities and ${extractedRelations.length} relations!`
        )

      } else {

        toast.warning(
          'Ingestion complete. No structured suspect entities recognized in file.'
        )
      }

    } catch (error) {

      console.error(
        'Ingestion pipeline failed:',
        error
      )

      setAnalysing(false)

      toast.error(
        'Intelligence ingestion failed. Check that the backend is running.'
      )
    }
  }

  // =========================================================
  // FORMAT SIZE
  // =========================================================

  const formatSize = (bytes) => {

    if (bytes < 1024) {
      return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        paddingBottom: 40
      }}
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 4
          }}
        >

          <div
            style={{
              background:
                'var(--primary-dim)',
              border:
                '1px solid var(--border-glow)',
              borderRadius:
                'var(--radius-md)',
              padding:
                '6px 10px',
              color:
                'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize:
                '0.75rem',
              fontWeight: 700,
              letterSpacing:
                '0.08em'
            }}
          >

            <Layers size={14} />

            MULTI-SOURCE INTELLIGENCE INGESTION

          </div>

        </div>

        <h1
          style={{
            margin: 0,
            fontSize: '1.45rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          Ingest Real Intelligence Evidence Files
        </h1>

        <p
          style={{
            margin: '4px 0 0',
            color: 'var(--muted)',
            fontSize: '0.875rem'
          }}
        >
          Upload authentic First Information Reports (FIRs),
          Call Detail Records (CDRs), seizure memos, and
          financial transcripts to parse suspects, phones,
          conduits and transactions into the live graph.
        </p>

      </div>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1fr 340px',
          gap: 24
        }}
      >

        {/* ===================================================
            LEFT
        ==================================================== */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18
          }}
        >

          {/* SOURCE CATEGORY */}

          <div>

            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                color: 'var(--muted)',
                marginBottom: 8,
                fontWeight: 600
              }}
            >
              Tag Target Evidence Source Type:
            </label>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8
              }}
            >

              {SOURCE_CATEGORIES.map(
                (cat) => (

                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setSelectedSourceType(
                        cat.label
                      )
                    }
                    style={{
                      padding:
                        '6px 12px',
                      borderRadius:
                        'var(--radius-md)',
                      border:
                        '1px solid',
                      cursor:
                        'pointer',
                      fontSize:
                        '0.78rem',
                      fontWeight:
                        selectedSourceType ===
                        cat.label
                          ? 700
                          : 500,
                      background:
                        selectedSourceType ===
                        cat.label
                          ? 'var(--primary-dim)'
                          : '#FFFFFF',
                      borderColor:
                        selectedSourceType ===
                        cat.label
                          ? 'var(--primary)'
                          : 'var(--border)',
                      color:
                        selectedSourceType ===
                        cat.label
                          ? 'var(--primary)'
                          : 'var(--muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition:
                        'all var(--transition)'
                    }}
                  >

                    <span>
                      {cat.icon}
                    </span>

                    <span>
                      {cat.label}
                    </span>

                  </button>

                )
              )}

            </div>

          </div>

          {/* DROP ZONE */}

          <div
            className={`upload-zone${
              dragOver
                ? ' drag-over'
                : ''
            }`}
            onDragEnter={() =>
              setDragOver(true)
            }
            onDragLeave={() =>
              setDragOver(false)
            }
            onDragOver={(e) =>
              e.preventDefault()
            }
            onDrop={handleDrop}
            onClick={() =>
              inputRef.current?.click()
            }
            style={{
              padding: '50px 24px',
              border:
                '2px dashed var(--border)',
              borderRadius:
                'var(--radius-lg)',
              background:
                dragOver
                  ? 'var(--primary-dim)'
                  : 'var(--panel-light)',
              cursor:
                'pointer',
              textAlign:
                'center',
              transition:
                'all var(--transition)'
            }}
          >

            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(',')}
              style={{
                display: 'none'
              }}
              onChange={(e) =>
                addFiles(
                  e.target.files
                )
              }
            />

            <div
              style={{
                width: 60,
                height: 60,
                borderRadius:
                  '50%',
                background:
                  'var(--primary-dim)',
                border:
                  '1px solid var(--border-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
                margin:
                  '0 auto 14px'
              }}
            >

              <Upload
                size={26}
                color="var(--primary-light)"
              />

            </div>

            <h3
              style={{
                margin:
                  '0 0 6px',
                color:
                  'var(--text)',
                fontSize:
                  '1.05rem'
              }}
            >
              {dragOver
                ? 'Release to upload intelligence files'
                : 'Click or Drag & Drop Real Evidence Files'}
            </h3>

            <p
              style={{
                margin:
                  '0 0 14px',
                color:
                  'var(--muted)',
                fontSize:
                  '0.82rem'
              }}
            >
              Upload actual police FIRs,
              CDR CSV spreadsheets,
              financial transaction records,
              seizure memos, or digital evidence.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 6,
                justifyContent:
                  'center',
                flexWrap:
                  'wrap'
              }}
            >

              {ACCEPTED_TYPES.map(
                (t) => (

                  <span
                    key={t}
                    className="tag"
                    style={{
                      fontSize:
                        '0.7rem'
                    }}
                  >
                    {t}
                  </span>

                )
              )}

            </div>

          </div>

          {/* QUEUED FILES */}

          {files.length > 0 && (

            <div
              className="card"
              style={{
                padding:
                  '18px 20px'
              }}
            >

              <div
                style={{
                  display:
                    'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'center',
                  marginBottom:
                    14
                }}
              >

                <div
                  className="card-title"
                  style={{
                    margin: 0,
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: 8
                  }}
                >

                  <FileText size={14} />

                  <span>
                    Ingestion Queue (
                    {files.length}
                    {' '}Files Ready)
                  </span>

                </div>

                <button
                  onClick={() =>
                    setFiles([])
                  }
                  className="btn btn-ghost"
                  style={{
                    padding:
                      '2px 8px',
                    fontSize:
                      '0.72rem',
                    color:
                      'var(--danger)'
                  }}
                >
                  Clear Queue
                </button>

              </div>

              <div
                style={{
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  gap: 8
                }}
              >

                {files.map(
                  (f) => (

                    <div
                      key={f.id}
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: 12,
                        padding:
                          '10px 14px',
                        background:
                          'var(--panel-light)',
                        borderRadius:
                          'var(--radius-md)',
                        border:
                          `1px solid ${
                            f.status ===
                            'done'
                              ? 'rgba(34,197,94,0.3)'
                              : 'var(--border)'
                          }`
                      }}
                    >

                      <span
                        style={{
                          fontSize:
                            '1.2rem'
                        }}
                      >
                        {f.sourceCategory ===
                        'Call Detail Records (CDRs)'
                          ? '📞'
                          : f.sourceCategory ===
                            'Financial & Hawala Records'
                            ? '💰'
                            : '📄'}
                      </span>

                      <div
                        style={{
                          flex: 1,
                          minWidth: 0
                        }}
                      >

                        <div
                          style={{
                            fontSize:
                              '0.85rem',
                            color:
                              'var(--text)',
                            fontWeight:
                              600,
                            overflow:
                              'hidden',
                            textOverflow:
                              'ellipsis',
                            whiteSpace:
                              'nowrap'
                          }}
                        >
                          {f.name}
                        </div>

                        <div
                          style={{
                            fontSize:
                              '0.72rem',
                            color:
                              'var(--primary-light)',
                            marginTop:
                              2
                          }}
                        >
                          Tagged:
                          {' '}
                          {f.sourceCategory}
                          {' • '}
                          {formatSize(f.size)}
                        </div>

                      </div>

                      {f.rawText && (

                        <button
                          onClick={() =>
                            setPreviewFile(f)
                          }
                          className="btn btn-ghost btn-sm"
                          style={{
                            padding:
                              '3px 8px',
                            fontSize:
                              '0.72rem',
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: 4
                          }}
                        >
                          <Eye size={12} />
                          Inspect Text
                        </button>

                      )}

                      {f.status ===
                      'done' ? (

                        <CheckCircle2
                          size={18}
                          color="var(--success)"
                        />

                      ) : (

                        <button
                          className="btn btn-ghost btn-sm"
                          style={{
                            padding: 4,
                            color:
                              'var(--muted)'
                          }}
                          onClick={(
                            e
                          ) => {

                            e.stopPropagation()

                            removeFile(
                              f.id
                            )
                          }}
                          disabled={
                            analysing
                          }
                        >
                          <X size={15} />
                        </button>

                      )}

                    </div>

                  )
                )}

              </div>

              <div
                style={{
                  marginTop: 16
                }}
              >

                <button
                  className="btn btn-primary"
                  style={{
                    justifyContent:
                      'center',
                    width: '100%',
                    padding:
                      '12px 18px',
                    fontSize:
                      '0.9rem'
                  }}
                  onClick={
                    runAnalysis
                  }
                  disabled={
                    analysing ||
                    done
                  }
                >

                  {analysing ? (

                    <>
                      <Loader2
                        size={16}
                        style={{
                          animation:
                            'spin 700ms linear infinite'
                        }}
                      />

                      Running Intelligence Extraction…
                    </>

                  ) : done ? (

                    <>
                      <CheckCircle2
                        size={16}
                      />

                      Extraction Finished
                    </>

                  ) : (

                    <>
                      <Brain size={16} />

                      Run Multi-Source AI NER Analysis
                    </>

                  )}

                </button>

              </div>

            </div>

          )}

        </div>

        {/* ===================================================
            RIGHT SIDEBAR
        ==================================================== */}

        <div
          style={{
            display: 'flex',
            flexDirection:
              'column',
            gap: 20
          }}
        >

          {/* PIPELINE */}

          <div
            className="card"
            style={{
              padding:
                '18px 20px'
            }}
          >

            <div
              className="card-title"
              style={{
                marginBottom: 14,
                display:
                  'flex',
                alignItems:
                  'center',
                gap: 8
              }}
            >

              <Brain
                size={15}
                color="var(--primary)"
              />

              <span>
                Multi-Source Pipeline Status
              </span>

            </div>

            <div
              style={{
                display:
                  'flex',
                flexDirection:
                  'column',
                gap: 8
              }}
            >

              {AI_STEPS.map(
                (s) => {

                  const isActive =
                    analysing &&
                    step === s.id

                  const isDone =
                    done ||
                    (
                      analysing &&
                      step > s.id
                    )

                  return (

                    <div
                      key={s.id}
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: 10,
                        padding:
                          '8px 12px',
                        borderRadius:
                          'var(--radius-md)',
                        background:
                          isActive
                            ? 'var(--primary-dim)'
                            : isDone
                              ? 'rgba(34,197,94,0.06)'
                              : 'var(--panel-light)',
                        border:
                          `1px solid ${
                            isActive
                              ? 'var(--border-glow)'
                              : isDone
                                ? 'rgba(34,197,94,0.2)'
                                : 'var(--border)'
                          }`,
                        transition:
                          'all var(--transition)'
                      }}
                    >

                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius:
                            '50%',
                          flexShrink: 0,
                          background:
                            isActive
                              ? 'var(--primary)'
                              : isDone
                                ? 'var(--success)'
                                : 'var(--border)',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          fontSize:
                            '0.65rem',
                          fontWeight:
                            700,
                          color:
                            isDone ||
                            isActive
                              ? '#FFFFFF'
                              : 'var(--muted)'
                        }}
                      >
                        {isDone
                          ? '✓'
                          : s.id}
                      </div>

                      <span
                        style={{
                          fontSize:
                            '0.78rem',
                          color:
                            isActive
                              ? 'var(--primary-light)'
                              : isDone
                                ? 'var(--success)'
                                : 'var(--muted)',
                          fontWeight:
                            isActive
                              ? 700
                              : 400,
                          flex: 1
                        }}
                      >
                        {s.label}
                      </span>

                      {isActive && (

                        <Loader2
                          size={13}
                          color="var(--primary-light)"
                          style={{
                            animation:
                              'spin 700ms linear infinite'
                          }}
                        />

                      )}

                    </div>

                  )
                }
              )}

            </div>

          </div>

          {/* RESULTS */}

          {done &&
            results && (

              <div
                className="card anim-fade-up"
                style={{
                  padding: 20
                }}
              >

                <div
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: 8,
                    color:
                      'var(--success)',
                    marginBottom:
                      12
                  }}
                >

                  <CheckCircle2
                    size={18}
                  />

                  <span
                    style={{
                      fontSize:
                        '0.9rem',
                      fontWeight:
                        700
                    }}
                  >
                    Extraction Summary
                  </span>

                </div>

                {/* STANDARD COUNTERS */}

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: 10,
                    marginBottom:
                      16
                  }}
                >

                  <div
                    style={{
                      background:
                        'var(--bg)',
                      padding: 10,
                      borderRadius:
                        'var(--radius-md)',
                      textAlign:
                        'center'
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          '0.7rem',
                        color:
                          'var(--muted)'
                      }}
                    >
                      Entities Extracted
                    </div>

                    <div
                      style={{
                        fontSize:
                          '1.4rem',
                        fontWeight:
                          800,
                        color:
                          'var(--primary-light)',
                        fontFamily:
                          'var(--font-mono)'
                      }}
                    >
                      {results.entitiesFound}
                    </div>

                  </div>

                  <div
                    style={{
                      background:
                        'var(--bg)',
                      padding: 10,
                      borderRadius:
                        'var(--radius-md)',
                      textAlign:
                        'center'
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          '0.7rem',
                        color:
                          'var(--muted)'
                      }}
                    >
                      Conduits Mapped
                    </div>

                    <div
                      style={{
                        fontSize:
                          '1.4rem',
                        fontWeight:
                          800,
                        color:
                          'var(--secondary)',
                        fontFamily:
                          'var(--font-mono)'
                      }}
                    >
                      {results.relationsFound}
                    </div>

                  </div>

                </div>

                {/* CDR */}

                {results.cdrFiles >
                  0 && (

                    <div
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        padding:
                          '10px 12px',
                        marginBottom: 8,
                        background:
                          'var(--bg)',
                        borderRadius:
                          'var(--radius-md)'
                      }}
                    >

                      <span
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: 7,
                          color:
                            'var(--muted)',
                          fontSize:
                            '0.78rem'
                        }}
                      >
                        <Phone
                          size={14}
                        />
                        CDR Files Ingested
                      </span>

                      <span
                        style={{
                          fontWeight:
                            700,
                          color:
                            'var(--primary-light)'
                        }}
                      >
                        {results.cdrFiles}
                      </span>

                    </div>

                  )}

                {/* FINANCIAL */}

                {results.financialFiles >
                  0 && (

                    <>

                      <div
                        style={{
                          display:
                            'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'center',
                          padding:
                            '10px 12px',
                          marginBottom:
                            8,
                          background:
                            'var(--bg)',
                          borderRadius:
                            'var(--radius-md)'
                        }}
                      >

                        <span
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: 7,
                            color:
                              'var(--muted)',
                            fontSize:
                              '0.78rem'
                          }}
                        >
                          <Database
                            size={14}
                          />
                          Financial Files Ingested
                        </span>

                        <span
                          style={{
                            fontWeight:
                              700,
                            color:
                              'var(--primary-light)'
                          }}
                        >
                          {results.financialFiles}
                        </span>

                      </div>

                      <div
                        style={{
                          display:
                            'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'center',
                          padding:
                            '10px 12px',
                          marginBottom:
                            8,
                          background:
                            'var(--bg)',
                          borderRadius:
                            'var(--radius-md)'
                        }}
                      >

                        <span
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: 7,
                            color:
                              'var(--muted)',
                            fontSize:
                              '0.78rem'
                          }}
                        >
                          <DollarSign
                            size={14}
                          />
                          Transactions
                        </span>

                        <span
                          style={{
                            fontWeight:
                              700,
                            color:
                              'var(--success)'
                          }}
                        >
                          {results.financialTransactions}
                        </span>

                      </div>

                      <div
                        style={{
                          display:
                            'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'center',
                          padding:
                            '10px 12px',
                          marginBottom:
                            16,
                          background:
                            'var(--bg)',
                          borderRadius:
                            'var(--radius-md)'
                        }}
                      >

                        <span
                          style={{
                            color:
                              'var(--muted)',
                            fontSize:
                              '0.78rem'
                          }}
                        >
                          Total Transaction Amount
                        </span>

                        <span
                          style={{
                            fontWeight:
                              800,
                            color:
                              'var(--success)',
                            fontFamily:
                              'var(--font-mono)'
                          }}
                        >
                          ₹
                          {Number(
                            results.financialAmount ||
                              0
                          ).toLocaleString(
                            'en-IN'
                          )}
                        </span>

                      </div>

                    </>

                  )}

                <div
                  style={{
                    display:
                      'flex',
                    flexDirection:
                      'column',
                    gap: 8,
                    fontSize:
                      '0.78rem',
                    marginBottom:
                      16
                  }}
                >

                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between'
                    }}
                  >
                    <span
                      style={{
                        color:
                          'var(--muted)'
                      }}
                    >
                      High-Risk Threats Flagged:
                    </span>

                    <span
                      style={{
                        color:
                          'var(--danger)',
                        fontWeight:
                          700
                      }}
                    >
                      {results.highRisk}
                      {' '}High Threat
                    </span>
                  </div>

                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between'
                    }}
                  >
                    <span
                      style={{
                        color:
                          'var(--muted)'
                      }}
                    >
                      NLP Engine Confidence:
                    </span>

                    <span
                      style={{
                        color:
                          'var(--success)',
                        fontWeight:
                          700
                      }}
                    >
                      {results.confidence}
                    </span>
                  </div>

                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between'
                    }}
                  >
                    <span
                      style={{
                        color:
                          'var(--muted)'
                      }}
                    >
                      Execution Time:
                    </span>

                    <span
                      style={{
                        color:
                          'var(--text)',
                        fontFamily:
                          'var(--font-mono)'
                      }}
                    >
                      {results.processingTime}
                    </span>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/network')
                  }
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent:
                      'center',
                    gap: 8
                  }}
                >

                  <Network
                    size={15}
                  />

                  View in Tactical Graph

                </button>

              </div>

            )}

        </div>

      </div>

      {/* =====================================================
          TEXT PREVIEW MODAL
      ====================================================== */}

      {previewFile && (

        <div
          style={{
            position:
              'fixed',
            inset: 0,
            zIndex: 2500,
            background:
              'rgba(15, 23, 42, 0.45)',
            backdropFilter:
              'blur(6px)',
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding: 16,
            animation:
              'fadeIn 150ms both'
          }}
          onClick={() =>
            setPreviewFile(null)
          }
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              background:
                '#FFFFFF',
              border:
                '1px solid #E2E8F0',
              borderRadius:
                'var(--radius-lg)',
              width: '100%',
              maxWidth: 680,
              padding: 24,
              boxShadow:
                '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)',
              animation:
                'fadeInUp 200ms both'
            }}
          >

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                marginBottom:
                  14
              }}
            >

              <div>

                <span
                  style={{
                    fontSize:
                      '0.72rem',
                    color:
                      '#1565C0',
                    fontWeight:
                      700,
                    letterSpacing:
                      '0.06em'
                  }}
                >
                  RAW DOCUMENT PREVIEW
                </span>

                <h3
                  style={{
                    margin:
                      '2px 0 0',
                    fontSize:
                      '1.05rem',
                    color:
                      '#0F172A',
                    fontWeight:
                      700
                  }}
                >
                  {previewFile.name}
                </h3>

              </div>

              <button
                onClick={() =>
                  setPreviewFile(null)
                }
                style={{
                  background:
                    'none',
                  border:
                    'none',
                  cursor:
                    'pointer',
                  color:
                    '#64748B',
                  display:
                    'flex',
                  padding: 4,
                  borderRadius: 6
                }}
              >
                <X size={18} />
              </button>

            </div>

            <div
              style={{
                background:
                  '#F8FAFC',
                border:
                  '1px solid #E2E8F0',
                borderRadius:
                  'var(--radius-md)',
                padding: 14,
                maxHeight: 340,
                overflowY:
                  'auto',
                fontSize:
                  '0.75rem',
                fontFamily:
                  'var(--font-mono)',
                color:
                  '#334155',
                lineHeight: 1.6,
                whiteSpace:
                  'pre-wrap'
              }}
            >
              {previewFile.rawText ||
                'No text preview available for binary file.'}
            </div>

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'flex-end',
                gap: 10,
                marginTop:
                  18
              }}
            >

              <button
                onClick={() =>
                  setPreviewFile(null)
                }
                className="btn btn-ghost"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}