import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from './lib/supabase'
import { buildRedemptionQueue } from './lib/queueBuilder'
import LoginScreen from './screens/LoginScreen'
import ProfileScreen from './screens/ProfileScreen'
import SetupScreen from './screens/SetupScreen'
import SessionScreen from './screens/SessionScreen'
import SummaryScreen from './screens/SummaryScreen'
import RedemptionSummaryScreen from './screens/RedemptionSummaryScreen'
import DashboardScreen from './screens/DashboardScreen'

const SCREENS = {
  LOGIN:               'login',
  PROFILES:            'profiles',
  SETUP:               'setup',
  SESSION:             'session',
  SUMMARY:             'summary',
  REDEMPTION:          'redemption',
  REDEMPTION_SUMMARY:  'redemption_summary',
  DASHBOARD:           'dashboard',
}

const SESSION_SCREENS = new Set([SCREENS.SESSION, SCREENS.REDEMPTION])

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-1"
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const [screen, setScreen]               = useState(SCREENS.LOGIN)
  const [user, setUser]                   = useState(null)
  const [profile, setProfile]             = useState(null)
  const [sessionSettings, setSessionSettings] = useState(null)
  const [sessionData, setSessionData]     = useState(null)  // { results, durationMs, sessionTotal }
  const [redemptionQueue, setRedemptionQueue] = useState(null)
  const [redemptionResults, setRedemptionResults] = useState(null)
  const [checkingAuth, setCheckingAuth]   = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setScreen(SCREENS.PROFILES)
      }
      setCheckingAuth(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setScreen(SCREENS.LOGIN)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  function startRedemption(wrongFacts) {
    const q = buildRedemptionQueue(wrongFacts)
    setRedemptionQueue(q)
    setScreen(SCREENS.REDEMPTION)
  }

  if (checkingAuth) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-6xl animate-bounce">⭐</div>
      </div>
    )
  }

  const showNav = profile && !SESSION_SCREENS.has(screen)

  return (
    <div className="flex-1 flex flex-col">
      {showNav && (
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="font-black text-purple-700 text-lg">Math Star</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScreen(SCREENS.DASHBOARD)}
                className={`px-3 py-1 rounded-xl font-bold transition ${screen === SCREENS.DASHBOARD ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-purple-600'}`}
              >
                📊 Napredak
              </button>
              <button
                onClick={() => setScreen(SCREENS.SETUP)}
                className={`px-3 py-1 rounded-xl font-bold transition ${screen === SCREENS.SETUP ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-purple-600'}`}
              >
                🎯 Vježbaj
              </button>
              <button
                onClick={() => setScreen(SCREENS.PROFILES)}
                className="text-gray-400 hover:text-gray-600 font-bold px-2"
                title="Promijeni profil"
              >
                {profile.avatar}
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {screen === SCREENS.LOGIN && (
          <PageWrapper key="login">
            <LoginScreen onLogin={u => { setUser(u); setScreen(SCREENS.PROFILES) }} />
          </PageWrapper>
        )}

        {screen === SCREENS.PROFILES && (
          <PageWrapper key="profiles">
            <ProfileScreen
              user={user}
              onSelectProfile={p => { setProfile(p); setScreen(SCREENS.SETUP) }}
            />
          </PageWrapper>
        )}

        {screen === SCREENS.SETUP && profile && (
          <PageWrapper key="setup">
            <SetupScreen
              profile={profile}
              onStart={settings => { setSessionSettings(settings); setScreen(SCREENS.SESSION) }}
            />
          </PageWrapper>
        )}

        {screen === SCREENS.SESSION && profile && sessionSettings && (
          <PageWrapper key="session">
            <SessionScreen
              profile={profile}
              settings={sessionSettings}
              onFinish={(results, meta) => {
                setSessionData({ results, durationMs: meta?.durationMs || 0, sessionTotal: meta?.sessionTotal || 0 })
                setScreen(SCREENS.SUMMARY)
              }}
              onQuit={() => setScreen(SCREENS.SETUP)}
            />
          </PageWrapper>
        )}

        {screen === SCREENS.SUMMARY && sessionData && (
          <PageWrapper key="summary">
            <SummaryScreen
              results={sessionData.results || []}
              durationMs={sessionData.durationMs || 0}
              sessionTotal={sessionData.sessionTotal || 0}
              onPlayAgain={() => setScreen(SCREENS.SESSION)}
              onChangeSettings={() => setScreen(SCREENS.SETUP)}
              onRedemption={startRedemption}
            />
          </PageWrapper>
        )}

        {screen === SCREENS.REDEMPTION && profile && redemptionQueue && (
          <PageWrapper key="redemption">
            <SessionScreen
              profile={profile}
              settings={{ types: ['fill-in', 'multiple-choice'], operation: 'multiplication', factors: [], hardMode: false }}
              prebuiltQueue={redemptionQueue}
              noTracking
              noRepeat
              onFinish={(results) => {
                setRedemptionResults(results)
                setScreen(SCREENS.REDEMPTION_SUMMARY)
              }}
              onQuit={() => setScreen(SCREENS.SETUP)}
            />
          </PageWrapper>
        )}

        {screen === SCREENS.REDEMPTION_SUMMARY && (
          <PageWrapper key="redemption-summary">
            <RedemptionSummaryScreen
              results={redemptionResults || []}
              onDone={() => setScreen(SCREENS.SETUP)}
            />
          </PageWrapper>
        )}

        {screen === SCREENS.DASHBOARD && profile && (
          <PageWrapper key="dashboard">
            <DashboardScreen
              profile={profile}
              onBack={() => setScreen(SCREENS.SETUP)}
            />
          </PageWrapper>
        )}
      </AnimatePresence>
    </div>
  )
}
