import { createContext, useContext, useState, createElement } from 'react'

const STORAGE_KEY = 'mathstar_lang'

export const strings = {
  hr: {
    // Navbar
    navProgress:       '📊 Napredak',
    navPractice:       '🎯 Vježbaj',
    navChangeProfile:  'Promijeni profil',

    // LoginScreen
    loginSubtitle:      'Vježbaj množenje i postani zvijezda!',
    loginTitle:         'Prijava',
    registerTitle:      'Novi račun',
    emailLabel:         'Email',
    emailPlaceholder:   'tvoj@email.com',
    passwordLabel:      'Lozinka',
    loading:            'Učitavanje...',
    loginBtn:           'Prijavi se',
    registerBtn:        'Registriraj se',
    alreadyHaveAccount: 'Već imaš račun? Prijavi se',
    noAccount:          'Nemaš račun? Registriraj se',
    loginError:         'Greška pri prijavi',

    // ProfileScreen
    whoPlays:      'Tko vježba danas?',
    addProfile:    'Dodaj profil',
    signOut:       'Odjava',
    newProfile:    'Novi profil',
    namePlaceholder: 'Ime',
    saving:        'Spremanje...',
    createProfile: 'Stvori profil',

    // SetupScreen
    greeting:         (name) => `Bok, ${name}!`,
    whatToPractice:   'Što želiš vježbati?',
    opMultiplication: 'Množenje ×',
    opDivision:       'Dijeljenje ÷',
    opBoth:           'Oboje ×÷',
    problemTypes:     'Vrste zadataka',
    typeMultipleChoice: '🔤 Ponuđeni odgovori',
    typeFillIn:       '✏️ Upiši odgovor',
    whichNumber:      'S kojim brojem želiš vježbati?',
    hardModeOn:       'Napredni način 🔥 uključen — množitelji 11–99',
    hardModeOff:      'Napredni način 🔥 (uključuje množitelje 11–99)',
    selectAtLeastOne: 'Odaberi barem jedan faktor',
    numProblems:      'Broj zadataka',
    rememberSettings: 'Zapamti moje postavke',
    startBtn:         'Započni vježbanje 🚀',

    // SessionScreen
    repeatBadge:       'Vježba ponavljanja 🎯',
    streak:            (n) => `🔥 ${n} niz`,
    labelDivision:     'Dijeljenje ÷',
    labelMultiplication: 'Množenje ×',
    correctMsg:        '✅ Točno!',
    practiceTogether:  '💪 Vježbajmo zajedno!',
    nowYou:            'Sada ti:',
    correctExcellent:  '✅ Točno! Odlično!',
    continueBtn:       'Nastavi →',
    quitTitle:         'Prekini vježbanje?',
    quitBody:          'Napredak iz ove sesije neće biti spremljen.',
    continuePractice:  'Nastavi vježbati',
    quit:              'Prekini',

    // SummaryScreen
    resultsTitle:    'Rezultati 🏁',
    pctCorrect:      (pct) => `${pct}% točnih odgovora`,
    stars3msg:       'Odlično! Pravi si Math Star! 🌟',
    stars2msg:       'Super! Još malo vježbe! 💪',
    stars1msg:       'Dobro! Nastavi vježbati! 🎯',
    stars0msg:       'Vježbaj više — možeš bolje! 🚀',
    practiceTime:    '⏱️ Vrijeme vježbanja',
    avgPerProblem:   'Prosječno po zadatku',
    sec:             'sek',
    wrongFactsTitle: '💪 Nastavi vježbati ove zadatke',
    perfectNoWrong:  'Savršeno! Nema zadataka za ponavljanje 🌟',
    masteredSection: '✅ Savladano',
    tryAgainBtn:     'Pokušaj još jednom 🎯',
    changeSettings:  'Promijeni postavke',
    playAgain:       'Igraj opet 🚀',

    // DashboardScreen
    yourProgress:       'Tvoj napredak',
    dueToday:           (n) => `${n} za ponavljanje danas`,
    reviewRecommend:    'Preporučujemo ponavljanje za bolje pamćenje',
    multiplicationTab:  'Množenje ×',
    divisionTab:        'Dijeljenje ÷',
    divisionTables:     'Tablice dijeljenja',
    multiplicationTables: 'Tablice množenja',
    masteryNotSeen:     'Nije viđeno',
    masteryMastered:    'Savladano',
    masteryInProgress:  'U procesu',
    masteryNeedsPractice: 'Treba vježbe',
    divisorLabel:       'Dijelnik',
    quotientLabel:      'Količnik',
    factorLabel:        'Faktor',
    rowAxisLabel:       (label) => `↑ ${label} (redak)`,
    colAxisLabel:       (label) => `→ ${label} (stupac)`,
    last7Days:          'Zadnjih 7 dana',

    // RedemptionSummaryScreen
    redemptionExcellent:    'Izvrsno!',
    redemptionMasteredAll:  'Savladao/la si sve!',
    redemptionBravo:        'Bravo! Odlično vježbanje danas!',
    redemptionGood:         'Dobro vježbanje!',
    correctAnswers:         (c, tot) => `${c} / ${tot} točnih odgovora`,
    redemptionTomorrow:     'Sutra ćemo pokušati ponovno 😊',
    redemptionStillPractice: 'Još malo vježbe za:',
    continueArrow:          'Nastavi →',
  },

  en: {
    // Navbar
    navProgress:       '📊 Progress',
    navPractice:       '🎯 Practice',
    navChangeProfile:  'Change profile',

    // LoginScreen
    loginSubtitle:      'Practice multiplication and become a star!',
    loginTitle:         'Sign in',
    registerTitle:      'New account',
    emailLabel:         'Email',
    emailPlaceholder:   'your@email.com',
    passwordLabel:      'Password',
    loading:            'Loading...',
    loginBtn:           'Sign in',
    registerBtn:        'Register',
    alreadyHaveAccount: 'Already have an account? Sign in',
    noAccount:          "Don't have an account? Register",
    loginError:         'Login error',

    // ProfileScreen
    whoPlays:      "Who's practicing today?",
    addProfile:    'Add profile',
    signOut:       'Sign out',
    newProfile:    'New profile',
    namePlaceholder: 'Name',
    saving:        'Saving...',
    createProfile: 'Create profile',

    // SetupScreen
    greeting:         (name) => `Hi, ${name}!`,
    whatToPractice:   'What do you want to practice?',
    opMultiplication: 'Multiplication ×',
    opDivision:       'Division ÷',
    opBoth:           'Both ×÷',
    problemTypes:     'Problem type',
    typeMultipleChoice: '🔤 Multiple choice',
    typeFillIn:       '✏️ Type the answer',
    whichNumber:      'Which number do you want to practice?',
    hardModeOn:       'Advanced mode 🔥 on — multipliers 11–99',
    hardModeOff:      'Advanced mode 🔥 (includes multipliers 11–99)',
    selectAtLeastOne: 'Select at least one factor',
    numProblems:      'Number of problems',
    rememberSettings: 'Remember my settings',
    startBtn:         'Start practice 🚀',

    // SessionScreen
    repeatBadge:       'Repeat practice 🎯',
    streak:            (n) => `🔥 ${n} streak`,
    labelDivision:     'Division ÷',
    labelMultiplication: 'Multiplication ×',
    correctMsg:        '✅ Correct!',
    practiceTogether:  "💪 Let's practice together!",
    nowYou:            'Now you:',
    correctExcellent:  '✅ Correct! Excellent!',
    continueBtn:       'Continue →',
    quitTitle:         'Quit practice?',
    quitBody:          "Progress from this session won't be saved.",
    continuePractice:  'Continue practicing',
    quit:              'Quit',

    // SummaryScreen
    resultsTitle:    'Results 🏁',
    pctCorrect:      (pct) => `${pct}% correct`,
    stars3msg:       "Excellent! You're a real Math Star! 🌟",
    stars2msg:       'Great! A little more practice! 💪',
    stars1msg:       'Good! Keep practicing! 🎯',
    stars0msg:       'Practice more — you can do better! 🚀',
    practiceTime:    '⏱️ Practice time',
    avgPerProblem:   'Average per problem',
    sec:             'sec',
    wrongFactsTitle: '💪 Keep practicing these problems',
    perfectNoWrong:  'Perfect! No problems to repeat 🌟',
    masteredSection: '✅ Mastered',
    tryAgainBtn:     'Try again 🎯',
    changeSettings:  'Change settings',
    playAgain:       'Play again 🚀',

    // DashboardScreen
    yourProgress:       'Your progress',
    dueToday:           (n) => `${n} due for review today`,
    reviewRecommend:    'We recommend review for better retention',
    multiplicationTab:  'Multiplication ×',
    divisionTab:        'Division ÷',
    divisionTables:     'Division tables',
    multiplicationTables: 'Multiplication tables',
    masteryNotSeen:     'Not seen',
    masteryMastered:    'Mastered',
    masteryInProgress:  'In progress',
    masteryNeedsPractice: 'Needs practice',
    divisorLabel:       'Divisor',
    quotientLabel:      'Quotient',
    factorLabel:        'Factor',
    rowAxisLabel:       (label) => `↑ ${label} (row)`,
    colAxisLabel:       (label) => `→ ${label} (column)`,
    last7Days:          'Last 7 days',

    // RedemptionSummaryScreen
    redemptionExcellent:    'Excellent!',
    redemptionMasteredAll:  'You mastered everything!',
    redemptionBravo:        'Great work! Excellent practice today!',
    redemptionGood:         'Good practice!',
    correctAnswers:         (c, tot) => `${c} / ${tot} correct answers`,
    redemptionTomorrow:     "We'll try again tomorrow 😊",
    redemptionStillPractice: 'A little more practice for:',
    continueArrow:          'Continue →',
  },
}

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'hr')

  function setLang(l) {
    localStorage.setItem(STORAGE_KEY, l)
    setLangState(l)
  }

  return createElement(LangContext.Provider, { value: { t: strings[lang], lang, setLang } }, children)
}

export function useLang() {
  return useContext(LangContext)
}
