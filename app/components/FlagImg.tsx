import { getFlagUrl } from '@/lib/selecoes'

interface FlagImgProps {
  nome: string
  size?: number
  className?: string
}

export default function FlagImg({ nome, size = 20, className = '' }: FlagImgProps) {
  const url = getFlagUrl(nome)
  if (!url) return null
  return (
    <img
      src={url}
      alt={nome}
      width={size}
      height={Math.round(size * 0.75)}
      className={`inline-block rounded-sm object-cover align-middle ${className}`}
    />
  )
}
