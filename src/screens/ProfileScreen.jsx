import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🐨', '🦋', '🐬', '🦄', '🐙', '🦖', '🐧', '🐯']

export default function ProfileScreen({ user, onSelectProfile }) {
  const [profiles, setProfiles] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState('🦊')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .order('created_at')
    // profiles are per user but allow multiple named profiles under one account
    // we use a separate query for all profiles linked to this auth user
    const { data: all } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at')
    // Filter those belonging to this user — we store user_id separately
    setProfiles(all?.filter(p => p.user_id === user.id) || [])
    setLoading(false)
  }

  async function createProfile() {
    if (!newName.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('profiles')
      .insert({ username: newName.trim(), avatar: newAvatar, user_id: user.id })
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setProfiles(prev => [...prev, data])
      setShowCreate(false)
      setNewName('')
      setNewAvatar('🦊')
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">⭐</div>
          <h1 className="text-3xl font-black text-purple-700">Math Star</h1>
          <p className="text-gray-500 mt-1">Tko vježba danas?</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 text-xl">Učitavanje...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {profiles.map(profile => (
              <motion.button
                key={profile.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectProfile(profile)}
                className="bg-white rounded-3xl shadow-lg p-6 flex flex-col items-center gap-2 hover:shadow-xl transition"
              >
                <span className="text-5xl">{profile.avatar}</span>
                <span className="text-xl font-bold text-gray-800">{profile.username}</span>
              </motion.button>
            ))}

            {profiles.length < 4 && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCreate(true)}
                className="bg-purple-50 border-2 border-dashed border-purple-300 rounded-3xl p-6 flex flex-col items-center gap-2 hover:border-purple-500 transition"
              >
                <span className="text-5xl">➕</span>
                <span className="text-lg font-bold text-purple-500">Dodaj profil</span>
              </motion.button>
            )}
          </div>
        )}

        <button
          onClick={signOut}
          className="mt-8 w-full text-center text-gray-400 font-semibold hover:text-gray-600"
        >
          Odjava
        </button>

        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
              onClick={e => e.target === e.currentTarget && setShowCreate(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Novi profil</h2>

                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full border-2 border-purple-100 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-purple-400 mb-4"
                  placeholder="Ime"
                  maxLength={20}
                />

                <div className="grid grid-cols-6 gap-2 mb-6">
                  {AVATARS.map(av => (
                    <button
                      key={av}
                      onClick={() => setNewAvatar(av)}
                      className={`text-3xl p-1 rounded-xl transition ${newAvatar === av ? 'bg-purple-100 ring-2 ring-purple-400' : 'hover:bg-gray-100'}`}
                    >
                      {av}
                    </button>
                  ))}
                </div>

                <button
                  onClick={createProfile}
                  disabled={saving || !newName.trim()}
                  className="w-full py-3 rounded-2xl text-lg font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-50"
                >
                  {saving ? 'Spremanje...' : 'Stvori profil'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
