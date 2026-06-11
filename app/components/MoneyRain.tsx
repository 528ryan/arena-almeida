'use client'

const BILLS = ['💵', '💴', '💶', '💵', '💵', '💴', '💵', '💶']

const POSITIONS = [5, 14, 23, 35, 47, 58, 69, 80, 91]
const DELAYS    = [0, 0.6, 1.2, 0.3, 0.9, 1.5, 0.1, 0.7, 1.1]
const DURATIONS = [2.8, 3.2, 2.5, 3.5, 2.9, 3.1, 2.6, 3.3, 2.7]

export default function MoneyRain() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {BILLS.map((bill, i) => (
        <span
          key={i}
          className="absolute top-0 text-lg select-none"
          style={{
            left: `${POSITIONS[i]}%`,
            animationName: 'moneyFall',
            animationDuration: `${DURATIONS[i]}s`,
            animationDelay: `${DELAYS[i]}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            opacity: 0.55,
          }}
        >
          {bill}
        </span>
      ))}
      <style>{`
        @keyframes moneyFall {
          0%   { transform: translateY(-24px) rotate(-15deg); opacity: 0; }
          10%  { opacity: 0.55; }
          85%  { opacity: 0.55; }
          100% { transform: translateY(180px) rotate(20deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
