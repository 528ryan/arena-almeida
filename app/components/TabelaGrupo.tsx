import type { Jogo } from '@/types'
import { calcularClassificacao } from '@/lib/classificacao'
import FlagImg from './FlagImg'

export default function TabelaGrupo({ jogos }: { jogos: Jogo[] }) {
  const tabela = calcularClassificacao(jogos)
  const temResultados = jogos.some(j => j.status === 'encerrado')

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 mb-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#002776] text-white">
            <th className="text-left py-2 pl-3 pr-1 font-semibold w-6">#</th>
            <th className="text-left py-2 px-2 font-semibold">Time</th>
            <th className="py-2 px-2 font-semibold text-center">J</th>
            <th className="py-2 px-2 font-semibold text-center">V</th>
            <th className="py-2 px-2 font-semibold text-center">E</th>
            <th className="py-2 px-2 font-semibold text-center">D</th>
            <th className="py-2 px-2 font-semibold text-center">SG</th>
            <th className="py-2 pr-3 pl-2 font-semibold text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {tabela.map((time, i) => (
            <tr
              key={time.nome}
              className={`border-t border-gray-100 ${i < 2 ? 'bg-green-50' : i === tabela.length - 1 ? 'bg-red-50' : 'bg-white'}`}
            >
              <td className="py-2 pl-3 pr-1 text-gray-400 font-semibold">{i + 1}</td>
              <td className="py-2 px-2 font-bold text-[#002776] truncate max-w-[130px]" title={time.nome}>
                <FlagImg nome={time.nome} size={16} className="mr-1" />{time.nome}
              </td>
              <td className="py-2 px-2 text-center text-gray-600">{time.j}</td>
              <td className="py-2 px-2 text-center text-gray-600">{time.v}</td>
              <td className="py-2 px-2 text-center text-gray-600">{time.e}</td>
              <td className="py-2 px-2 text-center text-gray-600">{time.d}</td>
              <td className="py-2 px-2 text-center text-gray-600">
                {temResultados ? (time.sg > 0 ? `+${time.sg}` : time.sg) : '—'}
              </td>
              <td className="py-2 pr-3 pl-2 text-center font-black text-[#009C3B]">{time.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-gray-400 px-3 py-1.5 flex gap-3">
        <span>🟢 Classificados para os 16 avos</span>
        <span>🔴 Eliminado</span>
      </p>
    </div>
  )
}
