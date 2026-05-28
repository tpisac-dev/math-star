import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabase'
import {
  buildQueue,
  insertWrongRepeat,
  insertRelatedDivisionPairs,
  generateWrongOptions,
  getProblemAnswer,
  getEquationParts,
} from '../lib/queueBuilder'
import ArrayGrid from '../components/ArrayGrid'
import NumberPad from '../components/NumberPad'

const STREAK_MILESTONES = [5, 10, 20]

// Phases:
// 'answering'   — awaiting first answer
// 'celebrating' — correct first try, auto-advances in 1.5 s
// 'teaching'    — wrong answer; array grid + re-ask
// 'confirmed'   — re-answered correctly; show "Nastavi →"

// Props:
//   prebuiltQueue  — optional pre-built queue (skips SR fetch + buildQueue)
//   noTracking     — skip Supabase history/SM-2 writes (redemption mode)
//   noRepeat       — skip wrong-answer re-insertions (redemption mode)
//   onFinish(results, { durationMs })
//   onQuit()       — called when user abandons session (no SR saves)

export default function SessionScreen({
  profile,
  settings,
  prebuiltQueue,
  noTracking = false,
  noRepeat = false,
  onFinish,
  onQuit,
}) {
  const [queue, setQueue]               = useState(null)
  const [index, setIndex]               = useState(0)
  const [phase, setPhase]               = useState('answering')
  const [fillValue, setFillValue]       = useState('')
  const [reFillValue, setReFillValue]   = useState('')
  const [reShakeTarget, setReShakeTarget] = useState(null)
  const [streak, setStreak]             = useState(0)
  const [results, setResults]           = useState([])
  const [floatStar, setFloatStar]       = useState(false)
  const [loading, setLoading]           = useState(true)
  const [showQuitDialog, setShowQuitDialog] = useState(false)
  const [answered, setAnswered]         = useState(0)

  const timerRef           = useRef(null)
  const startTimeRef       = useRef(null)
  const queueRef           = useRef(null)
  const indexRef           = useRef(0)
  const totalRef           = useRef(0)
  const sessionLengthRef   = useRef(0)
  const resultsRef         = useRef([])
  const totalCorrectRef    = useRef(0)
  const sm2Pending         = useRef(new Map())
  const historyBatch       = useRef([])

  useEffect(() => {
    initSession()
    return () => clearTimeout(timerRef.current)
  }, [])

  async function initSession() {
    setLoading(true)

    // Redemption / custom queue path — skip Supabase entirely
    if (prebuiltQueue) {
      queueRef.current = prebuiltQueue
      totalRef.current = prebuiltQueue.length
      sessionLengthRef.current = prebuiltQueue.length
      startTimeRef.current = Date.now()
      setQueue(prebuiltQueue)
      setLoading(false)
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    const [{ data: srData }, { data: historyData }, { data: srAll }] = await Promise.all([
      supabase.from('spaced_repetition').select('*').eq('profile_id', profile.id).lte('next_review', today),
      supabase.from('problem_history').select('*').eq('profile_id', profile.id).gte('answered_at', thirtyDaysAgo),
      supabase.from('spaced_repetition').select('*').eq('profile_id', profile.id),
    ])

    for (const r of srAll || []) {
      const op = r.operation || 'multiplication'
      sm2Pending.current.set(`${op}|${r.factor_a}×${r.factor_b}`, { existing: r, correct: true })
    }

    const q = buildQueue({
      factors: settings.factors,
      sessionLength: settings.sessionLength,
      type: settings.type || 'multiple-choice',
      operation: settings.operation || 'multiplication',
      hardMode: settings.hardMode || false,
      srData: srData || [],
      historyData: historyData || [],
    })
    queueRef.current = q
    totalRef.current = q.length
    sessionLengthRef.current = settings.sessionLength
    startTimeRef.current = Date.now()
    setQueue(q)
    setLoading(false)
  }

  const current       = queue?.[index]
  const correctAnswer = current ? getProblemAnswer(current) : 0
  const eqParts       = current ? getEquationParts(current) : null

  const options = useMemo(
    () => current?.type === 'multiple-choice' ? generateWrongOptions(correctAnswer) : [],
    [current?.id]
  )

  // ── Record answer attempt ─────────────────────────────────────────────────
  // Handles Supabase tracking and per-fact breakdown (resultsRef).
  // Score counting (totalCorrectRef) happens in handleAnswer.
  function recordAttempt(prob, isCorrect) {
    const op = prob.operation || 'multiplication'
    if (!noTracking) {
      historyBatch.current.push({
        profile_id: profile.id,
        factor_a: prob.a, factor_b: prob.b, operation: op,
        correct: isCorrect,
        answered_at: new Date().toISOString(),
      })
      const key = `${op}|${prob.a}×${prob.b}`
      const prev = sm2Pending.current.get(key)
      sm2Pending.current.set(key, { existing: prev?.existing || null, correct: isCorrect })
    }
    // Per-fact breakdown: original session problems only (not repeats or auto-inserted division pairs)
    if (!prob.isRepeat && !prob.isRelated) {
      const entry = { a: prob.a, b: prob.b, operation: op, correct: isCorrect }
      resultsRef.current = [...resultsRef.current, entry]
      setResults(prev => [...prev, entry])
    }
  }

  // ── First answer ───────────────────────────────────────────────────────────
  function handleAnswer(chosen) {
    if (phase !== 'answering') return
    const prob = queueRef.current[indexRef.current]
    const isCorrect = chosen === getProblemAnswer(prob)

    // Score: one simple counter, incremented here and nowhere else
    if (isCorrect) totalCorrectRef.current++

    recordAttempt(prob, isCorrect)

    if (isCorrect) {
      const newStreak = streak + 1
      setStreak(newStreak)
      setPhase('celebrating')
      setFillValue(String(chosen))
      setFloatStar(true)
      setTimeout(() => setFloatStar(false), 1100)

      if (STREAK_MILESTONES.includes(newStreak)) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.45 } })
        setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { y: 0.55 } }), 300)
      } else {
        confetti({ particleCount: 45, spread: 55, origin: { y: 0.4 }, ticks: 70 })
      }

      if (!noRepeat && settings.operation === 'both' && prob.operation === 'multiplication') {
        const updated = insertRelatedDivisionPairs(queueRef.current, indexRef.current, prob, true, settings.type || 'multiple-choice', totalRef.current)
        queueRef.current = updated
        setQueue(updated)
      }

      timerRef.current = setTimeout(() => advance(true), 1500)
    } else {
      setStreak(0)
      setPhase('teaching')
      setFillValue('')
      setReFillValue('')
      setReShakeTarget(null)

      if (!noRepeat && settings.operation === 'both' && prob.operation === 'multiplication') {
        const updated = insertRelatedDivisionPairs(queueRef.current, indexRef.current, prob, false, settings.type || 'multiple-choice', totalRef.current)
        queueRef.current = updated
        setQueue(updated)
      }
    }
  }

  // ── Re-answer in teaching phase ────────────────────────────────────────────
  function handleReAnswer(chosen) {
    if (phase !== 'teaching') return
    const prob = queueRef.current[indexRef.current]
    if (chosen === getProblemAnswer(prob)) {
      setPhase('confirmed')
      setReFillValue('')
      setReShakeTarget(null)
    } else {
      setReShakeTarget(chosen)
      setReFillValue('')
      setTimeout(() => setReShakeTarget(null), 450)
    }
  }

  // ── Advance ────────────────────────────────────────────────────────────────
  function advance(wasCorrect) {
    const currentQueue   = queueRef.current
    const currentIndex   = indexRef.current
    const currentProblem = currentQueue[currentIndex]
    const cap            = totalRef.current
    let newQueue = currentQueue

    if (!wasCorrect && !noRepeat) {
      newQueue = insertWrongRepeat(currentQueue, currentIndex, currentProblem, settings.type || 'multiple-choice', cap)
      queueRef.current = newQueue
      setQueue(newQueue)
    }

    setPhase('answering')
    setFillValue('')
    setReFillValue('')
    setReShakeTarget(null)
    setAnswered(prev => prev + 1)

    const next = currentIndex + 1
    if (next >= cap || next >= queueRef.current.length) {
      finishSession()
    } else {
      indexRef.current = next
      setIndex(next)
    }
  }

  // ── Flush to Supabase ──────────────────────────────────────────────────────
  async function finishSession() {
    const durationMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0

    if (!noTracking) {
      if (historyBatch.current.length > 0) {
        await supabase.from('problem_history').insert(historyBatch.current)
      }
      for (const [key, { existing, correct: wasCorrect }] of sm2Pending.current) {
        const [op, factPart] = key.split('|')
        const [a, b] = factPart.split('×').map(Number)
        const base = existing || { ease_factor: 2.5, interval_days: 1, times_failed: 0 }
        const newInterval = wasCorrect ? Math.min(Math.round(base.interval_days * base.ease_factor), 21) : 1
        const newEase = wasCorrect
          ? Math.min(parseFloat((base.ease_factor + 0.1).toFixed(2)), 3.0)
          : Math.max(parseFloat((base.ease_factor - 0.2).toFixed(2)), 1.3)
        const nextDate = new Date()
        nextDate.setDate(nextDate.getDate() + newInterval)
        const payload = {
          profile_id: profile.id, factor_a: a, factor_b: b, operation: op,
          ease_factor: newEase, interval_days: newInterval,
          next_review: nextDate.toISOString().split('T')[0],
          times_failed: wasCorrect ? (base.times_failed || 0) : (base.times_failed || 0) + 1,
          updated_at: new Date().toISOString(),
        }
        if (existing) {
          await supabase.from('spaced_repetition').update(payload).eq('id', existing.id)
        } else {
          await supabase.from('spaced_repetition').insert(payload)
        }
      }
    }

    const sessionTotal = sessionLengthRef.current
    const correctCount = Math.min(totalCorrectRef.current, sessionTotal)
    onFinish(resultsRef.current, { durationMs, sessionTotal, correctCount })
  }

  // ── Quit (no SR saves) ─────────────────────────────────────────────────────
  function handleQuit() {
    clearTimeout(timerRef.current)
    onQuit?.()
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading || !queue) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-5xl animate-pulse">⭐</div>
      </div>
    )
  }

  const total    = totalRef.current
  const progress = total > 0 ? Math.min(answered / total, 1) : 0
  const isTeaching = phase === 'teaching' || phase === 'confirmed'

  return (
    <div className="flex flex-col items-center p-4 pt-5 pb-8">
      {/* Quit confirmation dialog */}
      <AnimatePresence>
        {showQuitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-5 sm:p-8 w-full max-w-xs sm:max-w-sm text-center"
            >
              <div className="text-4xl sm:text-5xl mb-3">🤔</div>
              <h2 className="text-base sm:text-xl font-black text-gray-800 mb-2">Prekini vježbanje?</h2>
              <p className="text-sm text-gray-500 mb-5">Napredak iz ove sesije neće biti spremljen.</p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => setShowQuitDialog(false)}
                  className="w-full py-3 rounded-2xl text-sm sm:text-base font-black text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow"
                >
                  Nastavi vježbati
                </button>
                <button
                  onClick={handleQuit}
                  className="w-full py-3 rounded-2xl text-sm sm:text-base font-bold text-gray-500 border-2 border-gray-200 hover:bg-gray-50 transition"
                >
                  Prekini
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="w-full max-w-lg mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuitDialog(true)}
            className="text-gray-300 hover:text-gray-500 transition text-xl font-black w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            title="Prekini sesiju"
          >
            ✕
          </button>
          <span className="text-2xl">{profile.avatar}</span>
          <span className="font-bold text-gray-500">Bok, {profile.username}!</span>
          {noTracking && (
            <span className="text-xs bg-amber-100 text-amber-600 font-bold px-2 py-0.5 rounded-full">
              Vježba ponavljanja 🎯
            </span>
          )}
        </div>
        {streak > 0 && (
          <motion.div
            key={streak}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            className="bg-orange-100 text-orange-600 font-black px-3 py-1 rounded-full text-base"
          >
            🔥 {streak} niz
          </motion.div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-lg h-2.5 bg-gray-200 rounded-full mb-5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${noTracking ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 90 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* ── Normal question ─────────────────────────────────── */}
        {!isTeaching && eqParts && (
          <motion.div
            key={current.id + '-q'}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg"
          >
            <div className="bg-white rounded-3xl shadow-xl p-7 text-center mb-4 relative overflow-hidden">
              <p className="text-gray-300 font-semibold mb-2">{answered + 1} / {total}</p>

              <span className={`text-xs font-black px-2 py-0.5 rounded-full mb-3 inline-block ${
                current.operation === 'division'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-purple-100 text-purple-600'
              }`}>
                {current.operation === 'division' ? 'Dijeljenje ÷' : 'Množenje ×'}
              </span>

              <div className={`text-5xl font-black mb-1 transition-colors duration-300 ${
                phase === 'celebrating' ? 'text-green-600' : 'text-gray-800'
              }`}>
                {eqParts.left} {eqParts.op}{' '}
                {current.type === 'fill-in' ? (
                  <>
                    {eqParts.right} ={' '}
                    <span className={phase === 'celebrating' ? 'text-green-600' : 'text-purple-500'}>
                      {fillValue || '___'}
                    </span>
                  </>
                ) : (
                  <>{eqParts.right} = ?</>
                )}
              </div>

              {phase === 'celebrating' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-green-500 font-black text-xl mt-1"
                >
                  ✅ Točno!
                </motion.div>
              )}

              <AnimatePresence>
                {floatStar && (
                  <motion.div
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -60, opacity: 0 }}
                    className="absolute top-5 right-8 text-2xl font-black text-yellow-500 pointer-events-none"
                  >
                    +1 ⭐
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {current.type === 'multiple-choice' && (
              <div className="flex flex-col gap-3">
                {options.map(opt => {
                  let cls = 'bg-white border-2 border-gray-200 text-gray-800 hover:border-purple-400 hover:bg-purple-50'
                  if (phase === 'celebrating') {
                    cls = opt === correctAnswer
                      ? 'bg-green-100 border-2 border-green-500 text-green-800'
                      : 'bg-gray-50 border-2 border-gray-100 text-gray-300'
                  }
                  return (
                    <motion.button
                      key={opt}
                      whileTap={phase === 'answering' ? { scale: 0.97 } : {}}
                      onClick={() => phase === 'answering' && handleAnswer(opt)}
                      className={`w-full py-5 rounded-2xl text-3xl font-black transition shadow-sm ${cls}`}
                    >
                      {opt}
                    </motion.button>
                  )
                })}
              </div>
            )}

            {current.type === 'fill-in' && phase === 'answering' && (
              <NumberPad
                value={fillValue}
                onChange={setFillValue}
                onConfirm={() => fillValue.length > 0 && handleAnswer(parseInt(fillValue, 10))}
              />
            )}
          </motion.div>
        )}

        {/* ── Teaching view ────────────────────────────────────── */}
        {isTeaching && (
          <motion.div
            key={current.id + '-teach'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-lg"
          >
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">💪</span>
                <span className="font-black text-lg text-amber-600">Vježbajmo zajedno!</span>
              </div>

              <div className="flex justify-center mb-5">
                <ArrayGrid a={current.a} b={current.b} operation={current.operation} showLabel />
              </div>

              <hr className="border-gray-100 mb-5" />

              <p className="text-gray-400 font-bold text-center mb-2 text-sm">Sada ti:</p>
              {eqParts && (
                <div className="text-4xl font-black text-gray-800 text-center mb-5">
                  {eqParts.left} {eqParts.op} {eqParts.right} = ?
                </div>
              )}

              {phase === 'confirmed' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="bg-green-50 rounded-2xl p-4 text-center">
                    <div className="text-4xl font-black text-green-600">
                      {eqParts && `${eqParts.left} ${eqParts.op} ${eqParts.right} = ${correctAnswer}`}
                    </div>
                    <div className="text-green-500 font-bold mt-1">✅ Točno! Odlično!</div>
                  </div>
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => advance(false)}
                    className="w-full py-4 rounded-2xl text-xl font-black text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg"
                  >
                    Nastavi →
                  </motion.button>
                </motion.div>
              ) : (
                <>
                  {current.type === 'fill-in' && (
                    <div className="space-y-3">
                      <motion.div
                        key={reShakeTarget ?? 'idle'}
                        animate={reShakeTarget !== null ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                        transition={{ duration: 0.35 }}
                        className="text-center text-3xl font-black text-purple-600 h-10"
                      >
                        {reFillValue || <span className="text-gray-300">___</span>}
                      </motion.div>
                      <NumberPad
                        value={reFillValue}
                        onChange={setReFillValue}
                        onConfirm={() =>
                          reFillValue.length > 0 && handleReAnswer(parseInt(reFillValue, 10))
                        }
                      />
                    </div>
                  )}

                  {current.type === 'multiple-choice' && (
                    <div className="flex flex-col gap-3">
                      {options.map(opt => (
                        <motion.button
                          key={opt}
                          animate={
                            reShakeTarget === opt
                              ? { x: [0, -8, 8, -8, 8, 0], backgroundColor: ['#fff', '#fee2e2', '#fff'] }
                              : {}
                          }
                          transition={{ duration: 0.35 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleReAnswer(opt)}
                          className="w-full py-4 rounded-2xl text-2xl font-black bg-white border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition shadow-sm"
                        >
                          {opt}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
