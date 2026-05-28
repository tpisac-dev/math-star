import { useState } from 'react'
import { motion } from 'framer-motion'

const BASE_FACTORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const OPERATIONS = [
  { value: 'multiplication', label: 'Množenje ×' },
  { value: 'division',       label: 'Dijeljenje ÷' },
  { value: 'both',           label: 'Oboje ×÷' },
]

function getStorageKey(profileId) {
  return `mathstar_setup_${profileId}`
}

function loadSaved(profileId) {
  try {
    const raw = localStorage.getItem(getStorageKey(profileId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function SetupScreen({ profile, onStart }) {
  const saved = loadSaved(profile.id)

  const [operation, setOperation]             = useState(saved?.operation || 'multiplication')
  const [selectedFactors, setSelectedFactors] = useState(saved?.selectedFactors || [2, 3, 4, 5])
  const [hardMode, setHardMode]               = useState(saved?.hardMode || false)
  const [sessionLength, setSessionLength]     = useState(saved?.sessionLength || 20)
  const [useMultipleChoice, setUseMultipleChoice] = useState(saved?.useMultipleChoice ?? true)
  const [useFillIn, setUseFillIn]             = useState(saved?.useFillIn ?? true)
  const [remember, setRemember]               = useState(saved !== null)

  function toggleFactor(f) {
    setSelectedFactors(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    )
  }

  function handleStart() {
    if (selectedFactors.length === 0 || (!useMultipleChoice && !useFillIn)) return
    const types = [
      ...(useMultipleChoice ? ['multiple-choice'] : []),
      ...(useFillIn ? ['fill-in'] : []),
    ]
    const settings = { operation, selectedFactors, hardMode, sessionLength, useMultipleChoice, useFillIn }
    if (remember) localStorage.setItem(getStorageKey(profile.id), JSON.stringify(settings))
    else localStorage.removeItem(getStorageKey(profile.id))
    onStart({ factors: selectedFactors, sessionLength, types, operation, hardMode })
  }

  const canStart = selectedFactors.length > 0 && (useMultipleChoice || useFillIn)

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-6">
          <span className="text-5xl">{profile.avatar}</span>
          <h1 className="text-2xl font-black text-purple-700 mt-1">{profile.username}</h1>
          <p className="text-gray-500">Postavi vježbu</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-6">

          {/* Operation selector */}
          <div>
            <h2 className="text-lg font-bold text-gray-700 mb-3">Što želiš vježbati?</h2>
            <div className="flex gap-2">
              {OPERATIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setOperation(opt.value)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${
                    operation === opt.value
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Factor selector — always 1–10 */}
          <div>
            <h2 className="text-lg font-bold text-gray-700 mb-3">S kojim brojem želiš vježbati?</h2>
            <div className="grid grid-cols-5 gap-2">
              {BASE_FACTORS.map(f => (
                <button
                  key={f}
                  onClick={() => toggleFactor(f)}
                  className={`py-3 rounded-xl text-lg font-bold transition ${
                    selectedFactors.includes(f)
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={() => setHardMode(!hardMode)}
              className={`mt-3 w-full py-3 rounded-xl text-sm font-bold transition ${
                hardMode
                  ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white'
                  : 'bg-orange-50 text-orange-500 border-2 border-orange-200 hover:border-orange-400'
              }`}
            >
              {hardMode
                ? 'Teški način 🔥 uključen — množitelji 11–99'
                : 'Teški način 🔥 (uključuje množitelje 11–99)'}
            </button>

            {selectedFactors.length === 0 && (
              <p className="text-red-400 text-sm mt-1 text-center">Odaberi barem jedan faktor</p>
            )}
          </div>

          {/* Session length */}
          <div>
            <h2 className="text-lg font-bold text-gray-700 mb-3">Broj zadataka</h2>
            <div className="flex gap-3">
              {[10, 20, 30].map(n => (
                <button
                  key={n}
                  onClick={() => setSessionLength(n)}
                  className={`flex-1 py-3 rounded-xl text-lg font-bold transition ${
                    sessionLength === n
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Problem types */}
          <div>
            <h2 className="text-lg font-bold text-gray-700 mb-3">Vrste zadataka</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setUseMultipleChoice(!useMultipleChoice)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${
                  useMultipleChoice
                    ? 'bg-gradient-to-br from-green-400 to-teal-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-500 hover:bg-green-50'
                }`}
              >
                🔤 Ponuđeni odgovori
              </button>
              <button
                onClick={() => setUseFillIn(!useFillIn)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${
                  useFillIn
                    ? 'bg-gradient-to-br from-green-400 to-teal-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-500 hover:bg-green-50'
                }`}
              >
                ✏️ Upiši odgovor
              </button>
            </div>
            {!useMultipleChoice && !useFillIn && (
              <p className="text-red-400 text-sm mt-1 text-center">Odaberi barem jednu vrstu</p>
            )}
          </div>

          {/* Remember */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="w-5 h-5 accent-purple-500"
            />
            <span className="text-gray-600 font-semibold">Zapamti moje postavke</span>
          </label>

          <motion.button
            whileHover={{ scale: canStart ? 1.02 : 1 }}
            whileTap={{ scale: canStart ? 0.97 : 1 }}
            onClick={handleStart}
            disabled={!canStart}
            className="w-full py-4 rounded-2xl text-xl font-black text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg disabled:opacity-40 transition"
          >
            Započni vježbanje 🚀
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
