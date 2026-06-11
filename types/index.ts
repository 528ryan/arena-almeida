export type Jogo = {
  id: number
  time_a: string
  time_b: string
  data_hora: string
  prazo_edicao: string | null
  placar_a: number | null
  placar_b: number | null
  status: 'pendente' | 'encerrado'
  grupo: string | null
  fase: string | null
}

export type ClassificacaoTime = {
  nome: string
  j: number
  v: number
  e: number
  d: number
  gp: number
  gc: number
  sg: number
  pts: number
}

export type Palpite = {
  id: string
  user_id: string
  jogo_id: number
  gols_a: number
  gols_b: number
  pontos: number
  travado: boolean
  criado_em: string
  atualizado_em: string
}

export type Perfil = {
  id: string
  nome: string
  foto_url: string | null
  pontos: number
  pago: boolean
  criado_em: string
  selecao_favorita: string | null
  is_admin: boolean
}
