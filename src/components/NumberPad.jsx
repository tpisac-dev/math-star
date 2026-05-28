import { motion } from 'framer-motion'

const KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['⌫', '0', '✓'],
]

export default function NumberPad({ value, onChange, onConfirm }) {
  function press(key) {
    if (key === '⌫') {
      onChange(value.slice(0, -1))
    } else if (key === '✓') {
      if (value.length > 0) onConfirm()
    } else {
      if (value.length < 3) onChange(value + key)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
      {KEYS.flat().map(key => (
        <motion.button
          key={key}
          whileTap={{ scale: 0.88 }}
          onClick={() => press(key)}
          className={`h-16 rounded-2xl text-2xl font-black transition shadow-sm ${
            key === '✓'
              ? 'bg-gradient-to-br from-green-400 to-teal-500 text-white shadow-md'
              : key === '⌫'
              ? 'bg-red-100 text-red-500 hover:bg-red-200'
              : 'bg-white text-gray-800 hover:bg-purple-50 border-2 border-gray-100'
          }`}
        >
          {key}
        </motion.button>
      ))}
    </div>
  )
}
