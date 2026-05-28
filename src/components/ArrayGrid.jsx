import { motion } from 'framer-motion'

// Gradient: purple-500 (#a855f7) → pink-500 (#ec4899) across rows
function rowColor(rowIdx, totalRows) {
  const t = totalRows > 1 ? rowIdx / (totalRows - 1) : 0
  const r = Math.round(168 + (236 - 168) * t)
  const g = Math.round(85  + (72  - 85)  * t)
  const bl = Math.round(247 + (153 - 247) * t)
  return `rgb(${r},${g},${bl})`
}

function getLayout(rows, cols) {
  const product = rows * cols
  const maxDim = Math.max(rows, cols)
  if (product > 100) return { dotSize: 9,  dotGap: 2, rowGap: 2, sepEvery: 5, sepExtra: 4 }
  if (maxDim <= 4)   return { dotSize: 20, dotGap: 4, rowGap: 4, sepEvery: 0, sepExtra: 0 }
  if (maxDim <= 6)   return { dotSize: 17, dotGap: 3, rowGap: 3, sepEvery: 0, sepExtra: 0 }
  if (maxDim <= 8)   return { dotSize: 14, dotGap: 3, rowGap: 3, sepEvery: 0, sepExtra: 0 }
  return               { dotSize: 11, dotGap: 2, rowGap: 2, sepEvery: 5, sepExtra: 3 }
}

function rowsLabel(n) {
  if (n === 1) return '1 redak'
  if (n <= 4)  return `${n} retka`
  return `${n} redaka`
}

function groupsLabel(n) {
  if (n === 1) return 'grupu'
  if (n <= 4)  return 'grupe'
  return 'grupa'
}

export default function ArrayGrid({ a, b, operation = 'multiplication', showLabel = true }) {
  // For both operations: a = rows (divisor/factorA), b = cols (quotient/factorB)
  const { dotSize, dotGap, rowGap, sepEvery, sepExtra } = getLayout(a, b)
  const product = a * b

  const titleText = operation === 'division'
    ? `${product} ÷ ${a} = ${b}`
    : `${a} × ${b} = ${product}`

  const subtitleText = operation === 'division'
    ? `${product} podijelimo u ${a} ${groupsLabel(a)} po ${b}`
    : `${rowsLabel(a)} po ${b}`

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Dot grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: rowGap }}>
        {Array.from({ length: a }, (_, rowIdx) => (
          <motion.div
            key={rowIdx}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: rowIdx * 0.07, duration: 0.22, ease: 'easeOut' }}
            style={{ display: 'flex', alignItems: 'center', gap: dotGap }}
          >
            {Array.from({ length: b }, (_, colIdx) => (
              <div
                key={colIdx}
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: '50%',
                  backgroundColor: rowColor(rowIdx, a),
                  boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                  flexShrink: 0,
                  marginLeft: sepEvery > 0 && colIdx > 0 && colIdx % sepEvery === 0 ? sepExtra : 0,
                }}
              />
            ))}
          </motion.div>
        ))}
      </div>

      {/* Label */}
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: a * 0.07 + 0.1 }}
          className="text-center"
        >
          <div className="text-2xl font-black text-gray-800">
            {titleText.split('=')[0]}={' '}
            <span className="text-purple-600">{titleText.split('=')[1]}</span>
          </div>
          <div className="text-sm text-gray-400 font-semibold mt-0.5">{subtitleText}</div>
        </motion.div>
      )}
    </div>
  )
}
