import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useLang } from '../lib/i18n'

function starCount(pct) {
  if (pct >= 0.9) return 3
  if (pct >= 0.7) return 2
  if (pct >= 0.5) return 1
  return 0
}

function factLabel(f) {
  if (f.operation === 'division') return `${f.a * f.b} ÷ ${f.a} = ${f.b}`
  return `${f.a} × ${f.b} = ${f.a * f.b}`
}

function factShortLabel(f) {
  if (f.operation === 'division') return `${f.a * f.b} ÷ ${f.a}`
  return `${f.a} × ${f.b}`
}

function formatTime(ms, sec) {
  const total = Math.round(ms / 1000)
  const min = Math.floor(total / 60)
  const s = total % 60
  if (min === 0) return `${s} ${sec}`
  if (s === 0) return `${min} min`
  return `${min} min ${s} ${sec}`
}

export default function SummaryScreen({ results, durationMs = 0, sessionTotal = 0, correctCount = 0, onPlayAgain, onChangeSettings, onRedemption }) {
  const { t } = useLang()
  const total   = sessionTotal
  const correct = Math.min(correctCount, total)
  const pct     = total > 0 ? correct / total : 0
  const stars   = starCount(pct)

  const avgSec  = total > 0 ? Math.round((durationMs / 1000) / total) : 0

  // Aggregate per (operation, a, b)
  const factMap = {}
  for (const r of results) {
    const op  = r.operation || 'multiplication'
    const key = `${op}|${r.a}×${r.b}`
    if (!factMap[key]) factMap[key] = { a: r.a, b: r.b, operation: op, correct: 0, total: 0 }
    factMap[key].total++
    if (r.correct) factMap[key].correct++
  }

  const facts = Object.values(factMap)

  const wrongFacts = facts
    .filter(f => f.correct < f.total)
    .sort((a, b) => (b.total - b.correct) - (a.total - a.correct))

  const crushed = facts.filter(f => f.correct === f.total && f.total > 0)

  useEffect(() => {
    if (stars === 3) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.4 } })
      setTimeout(() => confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } }), 600)
    }
  }, [])

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <h1 className="text-3xl font-black text-gray-800 mb-4">{t.resultsTitle}</h1>

          {/* Stars */}
          <div className="flex justify-center gap-2 text-5xl mb-4">
            {[1, 2, 3].map(n => (
              <motion.span
                key={n}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: n * 0.15, type: 'spring', stiffness: 200 }}
              >
                {n <= stars ? '⭐' : '☆'}
              </motion.span>
            ))}
          </div>

          {/* Score */}
          <div className="text-5xl font-black text-purple-600 mb-1">
            {correct} / {total}
          </div>
          <p className="text-gray-500 text-lg mb-4">
            {t.pctCorrect(Math.round(pct * 100))}
          </p>

          {stars === 3 && <p className="text-xl font-bold text-green-600 mb-4">{t.stars3msg}</p>}
          {stars === 2 && <p className="text-xl font-bold text-blue-600 mb-4">{t.stars2msg}</p>}
          {stars === 1 && <p className="text-xl font-bold text-orange-500 mb-4">{t.stars1msg}</p>}
          {stars === 0 && <p className="text-xl font-bold text-red-500 mb-4">{t.stars0msg}</p>}

          {/* Timer stats */}
          {durationMs > 0 && (
            <div className="bg-blue-50 rounded-2xl p-4 mb-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-semibold text-sm">{t.practiceTime}</span>
                <span className="font-black text-blue-600">{formatTime(durationMs, t.sec)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-400 text-sm">{t.avgPerProblem}</span>
                <span className="font-bold text-blue-500 text-sm">{avgSec} {t.sec}</span>
              </div>
            </div>
          )}

          {/* Wrong facts */}
          {wrongFacts.length === 0 ? (
            <div className="bg-green-50 rounded-2xl p-4 mb-4 text-center">
              <p className="text-green-600 font-bold text-lg">{t.perfectNoWrong}</p>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-2xl p-4 mb-4 text-left">
              <h3 className="font-bold text-amber-700 mb-3">{t.wrongFactsTitle}</h3>
              <div className="space-y-2">
                {wrongFacts.map(f => {
                  const key = `${f.operation}|${f.a}×${f.b}`
                  const wrongCount = f.total - f.correct
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="font-bold text-gray-700">{factLabel(f)}</span>
                      <span className="text-amber-600 font-black text-sm ml-3 whitespace-nowrap">
                        ✗ {wrongCount}×
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Crushed */}
          {crushed.length > 0 && (
            <div className="bg-green-50 rounded-2xl p-4 mb-4 text-left">
              <h3 className="font-bold text-green-600 mb-2">{t.masteredSection}</h3>
              <div className="flex flex-wrap gap-2">
                {crushed.map(f => (
                  <span key={`${f.operation}|${f.a}×${f.b}`}
                    className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-lg text-sm">
                    {factShortLabel(f)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Redemption button */}
          {wrongFacts.length > 0 && onRedemption && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onRedemption(wrongFacts)}
              className="w-full py-4 rounded-2xl text-lg font-black text-white bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg mb-3"
            >
              {t.tryAgainBtn}
            </motion.button>
          )}

          <div className="flex gap-3">
            <button
              onClick={onChangeSettings}
              className="flex-1 py-4 rounded-2xl text-base font-bold border-2 border-purple-300 text-purple-600 hover:bg-purple-50 transition"
            >
              {t.changeSettings}
            </button>
            <button
              onClick={onPlayAgain}
              className="flex-1 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg hover:opacity-90 transition"
            >
              {t.playAgain}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
