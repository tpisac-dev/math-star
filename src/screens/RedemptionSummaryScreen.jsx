import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useLang } from '../lib/i18n'

function factLabel(f) {
  if (f.operation === 'division') return `${f.a * f.b} ÷ ${f.a} = ${f.b}`
  return `${f.a} × ${f.b} = ${f.a * f.b}`
}

export default function RedemptionSummaryScreen({ results, onDone }) {
  const { t } = useLang()
  const total      = results.length
  const correct    = results.filter(r => r.correct).length
  const allCorrect = correct === total && total > 0

  const factMap = {}
  for (const r of results) {
    const op  = r.operation || 'multiplication'
    const key = `${op}|${r.a}×${r.b}`
    if (!factMap[key]) factMap[key] = { a: r.a, b: r.b, operation: op, correct: 0, total: 0 }
    factMap[key].total++
    if (r.correct) factMap[key].correct++
  }
  const stillWrong = Object.values(factMap).filter(f => f.correct < f.total)

  useEffect(() => {
    if (allCorrect) {
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.35 } })
      setTimeout(() => confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 } }), 400)
      setTimeout(() => confetti({ particleCount: 80,  spread: 55, origin: { y: 0.45 } }), 800)
    }
  }, [])

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {allCorrect ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 150, delay: 0.1 }}
                className="text-6xl mb-4"
              >
                🌟🌟🌟
              </motion.div>
              <h1 className="text-3xl font-black text-green-600 mb-3">{t.redemptionExcellent}</h1>
              <p className="text-xl font-bold text-green-500 mb-2">{t.redemptionMasteredAll}</p>
              <p className="text-gray-400 mb-8">{t.redemptionBravo}</p>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 150, delay: 0.1 }}
                className="text-6xl mb-4"
              >
                💪
              </motion.div>
              <h1 className="text-3xl font-black text-gray-800 mb-3">{t.redemptionGood}</h1>
              <p className="text-lg text-gray-500 mb-1">
                {t.correctAnswers(correct, total)}
              </p>
              <p className="text-gray-400 mb-4">{t.redemptionTomorrow}</p>

              {stillWrong.length > 0 && (
                <div className="bg-amber-50 rounded-2xl p-4 mb-6 text-left">
                  <p className="text-amber-600 font-bold text-sm mb-2">{t.redemptionStillPractice}</p>
                  <div className="space-y-1">
                    {stillWrong.map(f => (
                      <p key={`${f.operation}|${f.a}×${f.b}`} className="font-bold text-gray-600 text-sm">
                        {factLabel(f)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onDone}
            className="w-full py-4 rounded-2xl text-xl font-black text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg"
          >
            {t.continueArrow}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
