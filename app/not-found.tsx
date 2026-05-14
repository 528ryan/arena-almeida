import Link from 'next/link'
import { Trophy, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#f0fdf4]">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-[#002776] flex items-center justify-center mb-4 shadow-lg">
          <Trophy className="w-10 h-10 text-[#FFDF00]" />
        </div>
        <h1 className="text-3xl font-black text-[#002776] tracking-tight">Arena Almeida</h1>
      </div>

      {/* Mensagem */}
      <div className="bg-white rounded-3xl shadow-md px-8 py-10 flex flex-col items-center gap-4 max-w-sm w-full text-center">
        <span className="text-6xl font-black text-[#FFDF00] drop-shadow"
          style={{ WebkitTextStroke: '2px #002776' }}>
          404
        </span>
        <h2 className="text-xl font-black text-[#002776]">Página não encontrada</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Essa rota não existe. Verifique o endereço ou volte para a página inicial.
        </p>

        <Link
          href="/"
          className="mt-2 w-full py-4 rounded-xl bg-[#002776] text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Home className="w-4 h-4" />
          Ir para o início
        </Link>
      </div>
    </div>
  )
}
