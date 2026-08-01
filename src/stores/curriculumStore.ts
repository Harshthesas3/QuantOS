import { create } from 'zustand'

export type NodeStatus =
  | 'LOCKED'
  | 'UNLOCKED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'MASTERED'

export interface CurriculumResource {
  id: string
  title: string
  type: string
  url?: string
  rating?: number
  status: string
}

export interface CurriculumNode {
  id: string
  title: string
  phaseId: string
  estimatedHours: number
  actualHours: number
  status: NodeStatus
  description: string
  masteryCriteria: string[]
  prerequisites: string[]
  resources: CurriculumResource[]
  notes: string
}

interface CurriculumState {
  nodes: Record<string, CurriculumNode>
  updateNodeStatus: (id: string, status: NodeStatus) => void
  updateNodeNotes: (id: string, notes: string) => void
  addActualHours: (id: string, hours: number) => void
  toggleMasteryCriterion: (nodeId: string, index: number) => void
  addResource: (
    nodeId: string,
    resource: { title: string; type: string; url?: string },
  ) => void
  removeResource: (nodeId: string, resourceId: string) => void
  updateResourceStatus: (
    nodeId: string,
    resourceId: string,
    status: string,
  ) => void
  updateResourceRating: (
    nodeId: string,
    resourceId: string,
    rating: number,
  ) => void
  getCriticalPath: () => string[]
  _hydrate: (state: { nodes: Record<string, CurriculumNode> }) => void
}

const PHASES = [
  { id: 'PHASE_0', title: 'JEE Mathematics Review', domain: 'Calculus, Matrices, Vectors, Probability, ODEs', nodesCount: 8, baseHours: 15 },
  { id: 'PHASE_1', title: 'Advanced Mathematics', domain: 'Real Analysis, Linear Algebra, Measure Theory, Convex Optimization', nodesCount: 10, baseHours: 25 },
  { id: 'PHASE_2', title: 'Computational Python', domain: 'NumPy Vectorization, Pandas, Concurrency, Cython/PyBIND11', nodesCount: 6, baseHours: 16.6 },
  { id: 'PHASE_3', title: 'Machine Learning', domain: 'Statistical Learning, Regression, Trees, PyTorch, Model Validation', nodesCount: 8, baseHours: 22.5 },
  { id: 'PHASE_4', title: 'Time Series Analysis', domain: 'ARMA/ARIMA, GARCH, Cointegration, Kalman Filters', nodesCount: 7, baseHours: 20 },
  { id: 'PHASE_5', title: 'Financial Economics', domain: 'MPT, CAPM, Fama-French, Market Microstructure, Fixed Income', nodesCount: 6, baseHours: 20 },
  { id: 'PHASE_6', title: 'Quantitative Finance', domain: 'Stochastic Calculus, BSM PDE, Volatility Surface, Monte Carlo', nodesCount: 8, baseHours: 25 },
  { id: 'PHASE_7', title: 'Alpha Research', domain: 'Signal Extraction, Orthogonalization, Backtesting, Risk Models', nodesCount: 8, baseHours: 22.5 },
  { id: 'PHASE_8', title: 'Research Engineering', domain: 'Modern C++20, Low Latency, Lock-Free SPSC, L3 Order Book', nodesCount: 6, baseHours: 26.6 },
  { id: 'PHASE_9', title: 'Research Papers', domain: 'Canonical Paper Replications (Fama, Black-Scholes, Avellaneda, etc.)', nodesCount: 10, baseHours: 12 },
  { id: 'PHASE_10', title: 'Portfolio Projects', domain: 'Production Alpha Framework, C++ Engine, Volatility Arbitrage', nodesCount: 4, baseHours: 50 },
]

const SPECIFIC_NODES: Record<
  string,
  {
    title: string
    description: string
    masteryCriteria: string[]
    prerequisites: string[]
  }
> = {
  'P0-1': {
    title: 'Limits, Continuity & Differentiation',
    description: 'Review of fundamental calculus limits, continuity rules, and derivatives.',
    masteryCriteria: [
      'Solve 20 advanced analytical limits without symbolic solvers.',
      "Derive chain rule from first principles.",
    ],
    prerequisites: [],
  },
  'P1-4': {
    title: 'Linear Algebra: Decompositions',
    description:
      'Matrix factorizations including SVD, Spectral decomposition, and QR decompositions.',
    masteryCriteria: [
      'Manually derive and compute SVD, Spectral, and QR decompositions.',
      'Write a Python implementation of QR factorization.',
    ],
    prerequisites: ['P1-3'],
  },
  'P4-4': {
    title: 'Cointegration & Statistical Arbitrage',
    description:
      'Engle-Granger and Johansen cointegration tests and their application to pairs trading.',
    masteryCriteria: [
      'Implement Engle-Granger and Johansen cointegration tests for pairs trading.',
      'Backtest a basic pairs trading strategy.',
    ],
    prerequisites: ['P4-2'],
  },
  'P6-2': {
    title: "Ito's Lemma & SDEs",
    description:
      'Stochastic calculus, Ito integrals, and analytical solutions for Geometric Brownian Motion.',
    masteryCriteria: [
      "Apply Ito's Lemma to derive analytical solutions for Geometric Brownian Motion.",
      'Solve the Black-Scholes SDE analytically.',
    ],
    prerequisites: ['P6-1'],
  },
  'P8-4': {
    title: 'Order Book Engine Architecture',
    description:
      'Building ultra-low latency L3 order books with efficient price-level operations.',
    masteryCriteria: [
      'Write C++ L3 Order Book maintaining O(1) price-level insertions and cancels.',
      'Implement lock-free queue for order events.',
    ],
    prerequisites: ['P8-2'],
  },
}

function generateInitialNodes(): Record<string, CurriculumNode> {
  const nodes: Record<string, CurriculumNode> = {}

  PHASES.forEach((phase) => {
    for (let i = 1; i <= phase.nodesCount; i++) {
      const nodeId = `P${phase.id.split('_')[1]}-${i}`
      const isSpecific = SPECIFIC_NODES[nodeId]

      const title = isSpecific
        ? isSpecific.title
        : `${phase.title} Topic ${i}`
      const description = isSpecific
        ? isSpecific.description
        : `Study module for ${title} under ${phase.title}.`
      const masteryCriteria = isSpecific
        ? isSpecific.masteryCriteria
        : [
            `Complete all reading modules for ${title}.`,
            `Pass the self-assessment check for ${title}.`,
          ]

      let prerequisites: string[] = []
      if (isSpecific) {
        prerequisites = isSpecific.prerequisites
      } else if (i > 1) {
        prerequisites = [`P${phase.id.split('_')[1]}-${i - 1}`]
      } else {
        const phaseNum = parseInt(phase.id.split('_')[1])
        if (phaseNum > 0) {
          const prevPhase = PHASES[phaseNum - 1]
          prerequisites = [`P${phaseNum - 1}-${prevPhase.nodesCount}`]
        }
      }

      nodes[nodeId] = {
        id: nodeId,
        title,
        phaseId: phase.id,
        estimatedHours: phase.baseHours,
        actualHours: 0,
        status: nodeId === 'P0-1' ? 'UNLOCKED' : 'LOCKED',
        description,
        masteryCriteria,
        prerequisites,
        resources: [
          {
            id: 'res-1',
            title: 'Introduction Textbook Chapter',
            type: 'Book',
            status: 'Not Started',
          },
          {
            id: 'res-2',
            title: 'Video Lecture Series',
            type: 'Video',
            status: 'Not Started',
          },
        ],
        notes: '',
      }
    }
  })

  return nodes
}

export const generateCurriculumNodes = generateInitialNodes

// Critical-path memo lives at module scope and is invalidated on every
// status-changing action. Fixes the prior bug where the memo was module
// level and never cleared.
let criticalPathMemo: {
  key: string
  result: string[]
} | null = null

function memoKey(nodes: Record<string, CurriculumNode>): string {
  // Cheap-ish signature: ids joined with their statuses.
  return Object.keys(nodes)
    .sort()
    .map((id) => `${id}:${nodes[id].status}`)
    .join('|')
}

export const useCurriculumStore = create<CurriculumState>()((set, get) => ({
  nodes: generateInitialNodes(),

  updateNodeStatus: (id, status) =>
    set((state) => {
      const newNodes = { ...state.nodes }
      if (!newNodes[id]) return state
      newNodes[id] = { ...newNodes[id], status }

      Object.keys(newNodes).forEach((key) => {
        const node = newNodes[key]
        if (node.status === 'LOCKED') {
          const allPrereqsMet = node.prerequisites.every(
            (prereqId) =>
              newNodes[prereqId]?.status === 'COMPLETED' ||
              newNodes[prereqId]?.status === 'MASTERED',
          )
          if (allPrereqsMet) node.status = 'UNLOCKED'
        } else if (node.status === 'UNLOCKED') {
          const anyPrereqNotMet = node.prerequisites.some(
            (prereqId) =>
              newNodes[prereqId]?.status !== 'COMPLETED' &&
              newNodes[prereqId]?.status !== 'MASTERED',
          )
          if (anyPrereqNotMet) node.status = 'LOCKED'
        }
      })

      criticalPathMemo = null
      return { nodes: newNodes }
    }),

  updateNodeNotes: (id, notes) =>
    set((state) => {
      const node = state.nodes[id]
      if (!node) return state
      return {
        nodes: { ...state.nodes, [id]: { ...node, notes } },
      }
    }),

  addActualHours: (id, hours) =>
    set((state) => {
      const node = state.nodes[id]
      if (!node) return state
      return {
        nodes: {
          ...state.nodes,
          [id]: { ...node, actualHours: node.actualHours + hours },
        },
      }
    }),

  toggleMasteryCriterion: (nodeId, index) =>
    set((state) => {
      const node = state.nodes[nodeId]
      if (!node) return state
      const criteria = [...node.masteryCriteria]
      const current = criteria[index]
      if (current.startsWith('[x] ')) {
        criteria[index] = current.replace('[x] ', '')
      } else {
        criteria[index] = '[x] ' + current
      }
      return {
        nodes: {
          ...state.nodes,
          [nodeId]: { ...node, masteryCriteria: criteria },
        },
      }
    }),

  addResource: (nodeId, resource) =>
    set((state) => {
      const node = state.nodes[nodeId]
      if (!node) return state
      const newResource: CurriculumResource = {
        id: `res-${Date.now()}`,
        title: resource.title,
        type: resource.type,
        url: resource.url,
        status: 'Not Started',
        rating: 0,
      }
      return {
        nodes: {
          ...state.nodes,
          [nodeId]: {
            ...node,
            resources: [...node.resources, newResource],
          },
        },
      }
    }),

  removeResource: (nodeId, resourceId) =>
    set((state) => {
      const node = state.nodes[nodeId]
      if (!node) return state
      return {
        nodes: {
          ...state.nodes,
          [nodeId]: {
            ...node,
            resources: node.resources.filter((r) => r.id !== resourceId),
          },
        },
      }
    }),

  updateResourceStatus: (nodeId, resourceId, status) =>
    set((state) => {
      const node = state.nodes[nodeId]
      if (!node) return state
      const resources = node.resources.map((r) =>
        r.id === resourceId ? { ...r, status } : r,
      )
      return {
        nodes: { ...state.nodes, [nodeId]: { ...node, resources } },
      }
    }),

  updateResourceRating: (nodeId, resourceId, rating) =>
    set((state) => {
      const node = state.nodes[nodeId]
      if (!node) return state
      const resources = node.resources.map((r) =>
        r.id === resourceId ? { ...r, rating } : r,
      )
      return {
        nodes: { ...state.nodes, [nodeId]: { ...node, resources } },
      }
    }),

  getCriticalPath: () => {
    const nodes = get().nodes
    const key = memoKey(nodes)
    if (criticalPathMemo && criticalPathMemo.key === key) {
      return criticalPathMemo.result
    }

    const memo: Record<string, { dist: number; path: string[] }> = {}

    const longestFrom = (id: string): { dist: number; path: string[] } => {
      if (memo[id]) return memo[id]
      const node = nodes[id]
      if (!node || node.status === 'COMPLETED' || node.status === 'MASTERED') {
        return { dist: 0, path: [] }
      }
      const dependents = Object.values(nodes).filter((n) =>
        n.prerequisites.includes(id),
      )

      let maxSubDist = 0
      let bestSubPath: string[] = []
      dependents.forEach((dep) => {
        const { dist, path } = longestFrom(dep.id)
        if (dist > maxSubDist) {
          maxSubDist = dist
          bestSubPath = path
        }
      })

      memo[id] = {
        dist: node.estimatedHours + maxSubDist,
        path: [id, ...bestSubPath],
      }
      return memo[id]
    }

    let maxDist = 0
    let bestPath: string[] = []
    Object.keys(nodes).forEach((id) => {
      const node = nodes[id]
      if (node.status !== 'COMPLETED' && node.status !== 'MASTERED') {
        const { dist, path } = longestFrom(id)
        if (dist > maxDist) {
          maxDist = dist
          bestPath = path
        }
      }
    })

    criticalPathMemo = { key, result: bestPath }
    return bestPath
  },

  _hydrate: (slice) => {
    criticalPathMemo = null
    set({ nodes: slice.nodes })
  },
}))
