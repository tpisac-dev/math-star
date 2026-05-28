// Queue builder — supports multiplication, division, and mixed ("both") mode

function weightedSample(pool) {
  const total = pool.reduce((s, p) => s + p.weight, 0)
  let r = Math.random() * total
  for (const p of pool) {
    r -= p.weight
    if (r <= 0) return p
  }
  return pool[pool.length - 1]
}

function randomType(types) {
  return types[Math.floor(Math.random() * types.length)]
}

// ── Problem helpers ─────────────────────────────────────────────────────────

// The canonical representation:
//   Multiplication { a, b, operation:'multiplication' } → a × b = ?, answer = a*b
//   Division       { a, b, operation:'division'       } → (a×b) ÷ a = ?, answer = b
//   So 'a' is always the divisor for division (divisor=a, quotient=b).

export function getProblemAnswer(prob) {
  return prob.operation === 'division' ? prob.b : prob.a * prob.b
}

// Returns the three display parts of the equation
export function getEquationParts(prob) {
  if (prob.operation === 'division') {
    return { left: prob.a * prob.b, op: '÷', right: prob.a }
  }
  return { left: prob.a, op: '×', right: prob.b }
}

// ── Hard-mode queue ─────────────────────────────────────────────────────────
// One factor from selected (1-10), the other random 11-99.

function buildHardModeQueue({ factors, sessionLength, types, operation }) {
  const queue = []
  for (let i = 0; i < sessionLength; i++) {
    const small = factors[Math.floor(Math.random() * factors.length)]
    const large = 11 + Math.floor(Math.random() * 89) // 11–99
    let op = operation
    if (operation === 'both') op = Math.random() < 0.5 ? 'multiplication' : 'division'
    queue.push({
      id: `hm-${i}-${small}x${large}-${op}`,
      a: small,   // for mult: factorA; for div: divisor (small), quotient=large
      b: large,
      operation: op,
      type: randomType(types),
      hardMode: true,
    })
  }
  return queue
}

// ── Normal queue (factors 1-10 × 1-12) ─────────────────────────────────────

function buildWeightedPool({ factors, operation, srData, historyData }) {
  const today = new Date().toISOString().split('T')[0]

  // SR maps per operation
  const srMap = {}
  for (const r of srData || []) {
    const op = r.operation || 'multiplication'
    const key = `${op}|${r.factor_a}×${r.factor_b}`
    srMap[key] = r
  }

  // Error rate maps per operation
  const errorMap = {}
  for (const r of historyData || []) {
    const op = r.operation || 'multiplication'
    const key = `${op}|${r.factor_a}×${r.factor_b}`
    if (!errorMap[key]) errorMap[key] = { correct: 0, total: 0 }
    errorMap[key].total++
    if (r.correct) errorMap[key].correct++
  }

  function makePool(op) {
    const pool = []
    for (const a of factors) {
      for (let b = 1; b <= 10; b++) {
        const key = `${op}|${a}×${b}`
        const sr = srMap[key]
        const err = errorMap[key]
        let weight = 1
        if (sr && sr.next_review <= today) weight = 4
        else if (err && err.total > 0 && (err.total - err.correct) / err.total > 0.5) weight = 3
        else if (!err || err.total === 0) weight = 2
        pool.push({ a, b, operation: op, weight })
      }
    }
    return pool
  }

  if (operation === 'multiplication') return makePool('multiplication')
  if (operation === 'division') return makePool('division')
  // both: merge pools
  return [...makePool('multiplication'), ...makePool('division')]
}

// ── Main queue builder ──────────────────────────────────────────────────────

export function buildQueue({ factors, sessionLength, types, operation = 'multiplication', hardMode = false, srData, historyData }) {
  if (hardMode) {
    return buildHardModeQueue({ factors, sessionLength, types, operation })
  }

  const pool = buildWeightedPool({ factors, operation, srData, historyData })
  const queue = []

  for (let i = 0; i < sessionLength; i++) {
    const fact = weightedSample(pool)
    queue.push({
      id: `${i}-${fact.a}x${fact.b}-${fact.operation}`,
      a: fact.a,
      b: fact.b,
      operation: fact.operation,
      type: randomType(types),
    })
  }

  return queue
}

// ── Related division pair injection (for "both" mode) ───────────────────────
// Called from the session engine after a multiplication problem is answered.
// wasCorrect=true → insert each division pair once
// wasCorrect=false → insert each division pair 3× (more practice)

export function insertRelatedDivisionPairs(queue, currentIndex, multProblem, wasCorrect, types, cap) {
  const { a, b } = multProblem
  if (!a || !b) return queue

  const effectiveCap = cap ?? queue.length

  // Unique division pairs derived from this multiplication fact
  const pairs = []
  const seen = new Set()
  function addPair(divisor, quotient) {
    if (!divisor || !quotient) return
    const key = `${divisor}×${quotient}`
    if (seen.has(key)) return
    seen.add(key)
    pairs.push({ a: divisor, b: quotient })
  }
  addPair(a, b)  // (a×b) ÷ a = b
  addPair(b, a)  // (a×b) ÷ b = a

  const insertCount = wasCorrect ? 1 : 3
  let newQueue = [...queue]

  for (const { a: divisor, b: quotient } of pairs) {
    const remaining = newQueue.slice(currentIndex + 1)
    const existing = remaining.filter(p =>
      p.operation === 'division' && p.a === divisor && p.b === quotient
    ).length
    const toInsert = Math.max(0, insertCount - existing)

    for (let i = 0; i < toInsert; i++) {
      const pos = Math.min(currentIndex + 5 + i * 4, newQueue.length)
      if (pos >= effectiveCap) continue
      newQueue.splice(pos, 0, {
        id: `div-pair-${Date.now()}-${i}-${divisor}x${quotient}`,
        a: divisor,
        b: quotient,
        operation: 'division',
        type: randomType(types),
        isRelated: true,
      })
    }
  }

  return newQueue.slice(0, effectiveCap)
}

// ── Wrong-answer repetition ─────────────────────────────────────────────────
// Operation-aware: { a, b, operation } is the full identity of a fact.

export function insertWrongRepeat(queue, currentIndex, problem, cap) {
  const effectiveCap = cap ?? queue.length
  const factKey = `${problem.a}×${problem.b}-${problem.operation}`
  const remaining = queue.slice(currentIndex + 1, effectiveCap)
  const existingCount = remaining.filter(p =>
    `${p.a}×${p.b}-${p.operation}` === factKey
  ).length

  const toInsert = Math.max(0, Math.min(5, 5 - existingCount))
  if (toInsert === 0) return queue

  const minSpacing = effectiveCap <= 10 ? 3 : effectiveCap <= 20 ? 5 : 7

  const typePool = ['multiple-choice', 'fill-in']
  let lastTypeIdx = typePool.indexOf(problem.type)

  const newQueue = [...queue]
  const positions = []

  for (let i = 0; i < toInsert; i++) {
    const minPos = (positions[positions.length - 1] ?? currentIndex) + minSpacing
    const pos = Math.min(minPos, effectiveCap - 1)
    if (pos <= currentIndex) break
    positions.push(pos)
  }

  for (let i = positions.length - 1; i >= 0; i--) {
    lastTypeIdx = (lastTypeIdx + 1) % 2
    newQueue.splice(positions[i], 0, {
      id: `repeat-${Date.now()}-${i}-${factKey}`,
      a: problem.a,
      b: problem.b,
      operation: problem.operation,
      type: typePool[lastTypeIdx],
      isRepeat: true,
    })
  }

  return newQueue.slice(0, effectiveCap)
}

// ── Redemption round queue ──────────────────────────────────────────────────
// Each wrong fact appears once as fill-in + once as multiple-choice, shuffled.

export function buildRedemptionQueue(wrongFacts) {
  // Deduplicate input facts by (operation, a, b)
  const seen = new Set()
  const unique = []
  for (const f of wrongFacts) {
    const key = `${f.operation}|${f.a}×${f.b}`
    if (!seen.has(key)) { seen.add(key); unique.push(f) }
  }

  // One entry per fact, alternating type
  const queue = []
  for (let i = 0; i < unique.length; i++) {
    const f = unique[i]
    const type = i % 2 === 0 ? 'fill-in' : 'multiple-choice'
    queue.push({ a: f.a, b: f.b, operation: f.operation, type, id: `r-${f.a}x${f.b}-${f.operation}` })
  }

  // Fisher-Yates shuffle
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]]
  }

  return queue
}

// ── Multiple-choice option generator ────────────────────────────────────────

export function generateWrongOptions(correct) {
  const options = new Set([correct])
  const candidates = []
  for (let delta = 1; delta <= 20; delta++) {
    if (correct + delta > 0) candidates.push(correct + delta)
    if (correct - delta > 0) candidates.push(correct - delta)
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  for (const c of candidates) {
    if (!options.has(c) && c > 0) {
      options.add(c)
      if (options.size === 3) break
    }
  }
  const arr = [...options]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
