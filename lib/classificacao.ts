import type { Jogo, ClassificacaoTime } from '@/types'

export function calcularClassificacao(jogos: Jogo[]): ClassificacaoTime[] {
  const times = new Map<string, ClassificacaoTime>()

  const garantir = (nome: string) => {
    if (!times.has(nome))
      times.set(nome, { nome, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 })
    return times.get(nome)!
  }

  // Inicializa todos os times do grupo (mesmo sem jogos encerrados)
  jogos.forEach(j => { garantir(j.time_a); garantir(j.time_b) })

  // Computa apenas jogos encerrados
  jogos
    .filter(j => j.status === 'encerrado' && j.placar_a !== null && j.placar_b !== null)
    .forEach(j => {
      const a = garantir(j.time_a)
      const b = garantir(j.time_b)
      const pa = j.placar_a!
      const pb = j.placar_b!

      a.j++; b.j++
      a.gp += pa; a.gc += pb
      b.gp += pb; b.gc += pa

      if (pa > pb)      { a.v++; b.d++ }
      else if (pa < pb) { b.v++; a.d++ }
      else              { a.e++; b.e++ }
    })

  // Recalcula sg e pts
  times.forEach(t => {
    t.sg  = t.gp - t.gc
    t.pts = t.v * 3 + t.e
  })

  return Array.from(times.values()).sort(
    (a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp || a.nome.localeCompare(b.nome)
  )
}
