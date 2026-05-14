'use client'

type ScoreSelectorProps = {
  value: number
  onChange: (v: number) => void
  min?: number
  disabled?: boolean
}

export default function ScoreSelector({
  value,
  onChange,
  min = 0,
  disabled = false,
}: ScoreSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className="w-12 h-12 rounded-full bg-[#002776] text-white text-2xl font-bold flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform shadow"
        aria-label="Diminuir gols"
      >
        −
      </button>

      <span className="w-10 text-center text-3xl font-black text-[#002776] tabular-nums">
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        className="w-12 h-12 rounded-full bg-[#009C3B] text-white text-2xl font-bold flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform shadow"
        aria-label="Aumentar gols"
      >
        +
      </button>
    </div>
  )
}
