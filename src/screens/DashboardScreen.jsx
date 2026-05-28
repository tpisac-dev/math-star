import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

function getMasteryColor(correct, total) {
  if (total === 0) return '#e5e7eb'
  const rate = correct / total
  if (rate >= 0.8) return '#22c55e'
  if (rate >= 0.5) return '#eab308'
  return '#ef4444'
}

function getMasteryLabel(correct, total) {
  if (total === 0) return 'Nije viđeno'
  const rate = correct / total
  if (rate >= 0.8) return 'Savladano'
  if (rate >= 0.5) return 'U procesu'
  return 'Treba vježbe'
}

const LEGEND = [
  { color: '#22c55e', label: 'Savladano' },
  { color: '#eab308', label: 'U procesu' },
  { color: '#ef4444', label: 'Treba vježbe' },
  { color: '#e5e7eb', label: 'Nije viđeno' },
]

export default function DashboardScreen({ profile, onBack }) {
  const [historyData, setHistoryData] = useState([])
  const [srData, setSrData]           = useState([])
  const [sessions, setSessions]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [activeTab, setActiveTab]     = useState('multiplication')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: hist }, { data: sr }] = await Promise.all([
      supabase.from('problem_history').select('*').eq('profile_id', profile.id).order('answered_at', { ascending: false }),
      supabase.from('spaced_repetition').select('*').eq('profile_id', profile.id),
    ])
    setHistoryData(hist || [])
    setSrData(sr || [])

    // Rough session grouping by day
    const byDay = {}
    for (const row of (hist || [])) {
      const day = row.answered_at.split('T')[0]
      if (!byDay[day]) byDay[day] = { correct: 0, total: 0 }
      byDay[day].total++
      if (row.correct) byDay[day].correct++
    }
    setSessions(
      Object.entries(byDay)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 7)
        .reverse()
    )
    setLoading(false)
  }

  // Build mastery map for the active operation (last 10 attempts per fact)
  const masteryMap = (() => {
    const attempts = {}
    const filtered = historyData.filter(r => (r.operation || 'multiplication') === activeTab)
    for (const row of filtered) {
      const key = `${row.factor_a}×${row.factor_b}`
      if (!attempts[key]) attempts[key] = []
      attempts[key].push(row.correct)
    }
    const map = {}
    for (const [key, arr] of Object.entries(attempts)) {
      const last10 = arr.slice(0, 10)
      map[key] = { correct: last10.filter(Boolean).length, total: last10.length }
    }
    return map
  })()

  const today    = new Date().toISOString().split('T')[0]
  const dueCount = srData.filter(r => r.next_review <= today).length
  const maxScore = Math.max(...sessions.map(([, s]) => s.total), 1)

  // Axis labels for heatmap:
  // Multiplication: row = factorA, col = factorB  (factorA × factorB = product)
  // Division:       row = divisor,  col = quotient (divisor × quotient = dividend)
  const rowLabel  = activeTab === 'division' ? 'Dijelnik' : 'Faktor'
  const colHeader = activeTab === 'division' ? 'Količnik' : 'Faktor'

  return (
    <div className="min-h-dvh p-4 pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-2xl hover:scale-110 transition">←</button>
          <span className="text-4xl">{profile.avatar}</span>
          <div>
            <h1 className="text-2xl font-black text-gray-800">{profile.username}</h1>
            <p className="text-gray-500">Tvoj napredak</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 text-xl py-12">Učitavanje...</div>
        ) : (
          <div className="space-y-6">
            {/* Due for review */}
            {dueCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 flex items-center gap-3"
              >
                <span className="text-3xl">🔔</span>
                <div>
                  <p className="font-black text-orange-700 text-xl">{dueCount} za ponavljanje danas</p>
                  <p className="text-orange-500 text-sm">Preporučujemo ponavljanje za bolje pamćenje</p>
                </div>
              </motion.div>
            )}

            {/* Heatmap card */}
            <div className="bg-white rounded-3xl shadow-lg p-6">
              {/* Tab switcher */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setActiveTab('multiplication')}
                  className={`flex-1 py-2 rounded-xl font-bold text-sm transition ${
                    activeTab === 'multiplication'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow'
                      : 'bg-gray-100 text-gray-500 hover:bg-purple-50'
                  }`}
                >
                  Množenje ×
                </button>
                <button
                  onClick={() => setActiveTab('division')}
                  className={`flex-1 py-2 rounded-xl font-bold text-sm transition ${
                    activeTab === 'division'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow'
                      : 'bg-gray-100 text-gray-500 hover:bg-blue-50'
                  }`}
                >
                  Dijeljenje ÷
                </button>
              </div>

              <h2 className="text-lg font-black text-gray-800 mb-4">
                {activeTab === 'division' ? 'Tablice dijeljenja' : 'Tablice množenja'}
              </h2>

              <div className="overflow-x-auto">
                <div className="inline-block">
                  {/* Column header row */}
                  <div className="flex mb-1">
                    <div className="w-7 h-7" />
                    {Array.from({ length: 12 }, (_, i) => (
                      <div key={i} className="w-9 h-7 flex items-center justify-center text-xs font-bold text-gray-400">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  {/* Grid rows */}
                  {Array.from({ length: 12 }, (_, row) => (
                    <div key={row} className="flex mb-1">
                      <div className="w-7 h-9 flex items-center justify-center text-xs font-bold text-gray-400">
                        {row + 1}
                      </div>
                      {Array.from({ length: 12 }, (_, col) => {
                        const a = row + 1, b = col + 1
                        const key = `${a}×${b}`
                        const m = masteryMap[key] || { correct: 0, total: 0 }
                        const color = getMasteryColor(m.correct, m.total)
                        const label = getMasteryLabel(m.correct, m.total)
                        const tooltip = activeTab === 'division'
                          ? `${a*b} ÷ ${a} = ${b} — ${label} (${m.correct}/${m.total})`
                          : `${a} × ${b} = ${a*b} — ${label} (${m.correct}/${m.total})`
                        return (
                          <div
                            key={col}
                            className="w-9 h-9 rounded-lg mx-0.5 cursor-pointer hover:opacity-75 transition"
                            style={{ backgroundColor: color }}
                            title={tooltip}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Axis labels */}
              <div className="flex gap-4 mt-3 text-xs text-gray-400 font-semibold">
                <span>↑ {rowLabel} (redak)</span>
                <span>→ {colHeader} (stupac)</span>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3">
                {LEGEND.map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last 7 days bar chart */}
            {sessions.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-xl font-black text-gray-800 mb-4">Zadnjih 7 dana</h2>
                <div className="flex items-end gap-2 h-32">
                  {sessions.map(([day, s]) => {
                    const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
                    const h = Math.round((s.total / maxScore) * 100)
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-gray-500">{pct}%</span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-purple-500 to-pink-400"
                          style={{ height: `${Math.max(h, 4)}%`, minHeight: 4 }}
                        />
                        <span className="text-xs text-gray-400">
                          {day.slice(5).replace('-', '/')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
