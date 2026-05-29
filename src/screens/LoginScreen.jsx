import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n'

export default function LoginScreen({ onLogin }) {
  const { t, lang, setLang } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        onLogin(data.user)
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onLogin(data.user)
      }
    } catch (err) {
      setError(err.message || t.loginError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center text-sm font-bold gap-0.5">
        <button
          onClick={() => setLang('hr')}
          className={`px-1 transition ${lang === 'hr' ? 'text-purple-700' : 'text-gray-300 hover:text-gray-500'}`}
        >
          HR
        </button>
        <span className="text-gray-200">/</span>
        <button
          onClick={() => setLang('en')}
          className={`px-1 transition ${lang === 'en' ? 'text-purple-700' : 'text-gray-300 hover:text-gray-500'}`}
        >
          EN
        </button>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-7xl mb-3">⭐</div>
          <h1 className="text-4xl font-black text-purple-700">Math Star</h1>
          <p className="text-gray-500 text-lg mt-1">{t.loginSubtitle}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {isRegister ? t.registerTitle : t.loginTitle}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">{t.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border-2 border-purple-100 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-purple-400 transition"
                placeholder={t.emailPlaceholder}
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">{t.passwordLabel}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border-2 border-purple-100 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-purple-400 transition pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition text-xl"
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 font-semibold text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition shadow-lg disabled:opacity-50"
            >
              {loading ? t.loading : isRegister ? t.registerBtn : t.loginBtn}
            </button>
          </form>

          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            className="mt-4 w-full text-center text-purple-500 font-semibold hover:underline text-lg"
          >
            {isRegister ? t.alreadyHaveAccount : t.noAccount}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
