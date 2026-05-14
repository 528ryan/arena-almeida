export type SelecaoTheme = {
  iso:   string
  cor1:  string   // fundo principal do header
  cor2:  string   // acento (badge de pontos, destaques)
  texto: 'branco' | 'escuro'  // cor do texto sobre cor2
}

/** Todas as 48 seleções da Copa 2026 com tema de cores */
export const SELECOES: Record<string, SelecaoTheme> = {
  // Grupo A
  'México':              { iso: 'mx', cor1: '#006847', cor2: '#CE1126', texto: 'branco' },
  'Coreia do Sul':       { iso: 'kr', cor1: '#003478', cor2: '#CD2E3A', texto: 'branco' },
  'África do Sul':       { iso: 'za', cor1: '#007A4D', cor2: '#FFB81C', texto: 'escuro'  },
  'Rep. Tcheca':         { iso: 'cz', cor1: '#D7141A', cor2: '#003087', texto: 'branco' },
  // Grupo B
  'Canadá':              { iso: 'ca', cor1: '#FF0000', cor2: '#FFFFFF', texto: 'escuro'  },
  'Suíça':               { iso: 'ch', cor1: '#FF0000', cor2: '#FFFFFF', texto: 'escuro'  },
  'Qatar':               { iso: 'qa', cor1: '#8D1B3D', cor2: '#FFFFFF', texto: 'escuro'  },
  'Bósnia-Herzegovina':  { iso: 'ba', cor1: '#003087', cor2: '#FFCD00', texto: 'escuro'  },
  // Grupo C
  'Brasil':              { iso: 'br', cor1: '#009C3B', cor2: '#FFDF00', texto: 'escuro'  },
  'Marrocos':            { iso: 'ma', cor1: '#C1272D', cor2: '#006233', texto: 'branco' },
  'Escócia':             { iso: 'gb-sct', cor1: '#003087', cor2: '#FFFFFF', texto: 'escuro'  },
  'Haiti':               { iso: 'ht', cor1: '#00209F', cor2: '#D21034', texto: 'branco' },
  // Grupo D
  'EUA':                 { iso: 'us', cor1: '#002868', cor2: '#BF0A30', texto: 'branco' },
  'Paraguai':            { iso: 'py', cor1: '#D52B1E', cor2: '#0038A8', texto: 'branco' },
  'Austrália':           { iso: 'au', cor1: '#00008B', cor2: '#FFCD00', texto: 'escuro'  },
  'Turquia':             { iso: 'tr', cor1: '#E30A17', cor2: '#FFFFFF', texto: 'escuro'  },
  // Grupo E
  'Alemanha':            { iso: 'de', cor1: '#000000', cor2: '#FFCE00', texto: 'escuro'  },
  'Equador':             { iso: 'ec', cor1: '#FFD100', cor2: '#003087', texto: 'branco' },
  'Costa do Marfim':     { iso: 'ci', cor1: '#F77F00', cor2: '#009A44', texto: 'branco' },
  'Curaçao':             { iso: 'cw', cor1: '#003082', cor2: '#F9E814', texto: 'escuro'  },
  // Grupo F
  'Holanda':             { iso: 'nl', cor1: '#FF4500', cor2: '#003082', texto: 'branco' },
  'Japão':               { iso: 'jp', cor1: '#BC002D', cor2: '#FFFFFF', texto: 'escuro'  },
  'Tunísia':             { iso: 'tn', cor1: '#E70013', cor2: '#FFFFFF', texto: 'escuro'  },
  'Suécia':              { iso: 'se', cor1: '#006AA7', cor2: '#FECC02', texto: 'escuro'  },
  // Grupo G
  'Bélgica':             { iso: 'be', cor1: '#1A1A1A', cor2: '#FAE042', texto: 'escuro'  },
  'Irã':                 { iso: 'ir', cor1: '#239F40', cor2: '#FFFFFF', texto: 'escuro'  },
  'Egito':               { iso: 'eg', cor1: '#CE1126', cor2: '#FFFFFF', texto: 'escuro'  },
  'Nova Zelândia':       { iso: 'nz', cor1: '#00247D', cor2: '#CC142B', texto: 'branco' },
  // Grupo H
  'Espanha':             { iso: 'es', cor1: '#AA151B', cor2: '#F1BF00', texto: 'escuro'  },
  'Uruguai':             { iso: 'uy', cor1: '#5DB8E8', cor2: '#FFFFFF', texto: 'escuro'  },
  'Arábia Saudita':      { iso: 'sa', cor1: '#006C35', cor2: '#FFFFFF', texto: 'escuro'  },
  'Cabo Verde':          { iso: 'cv', cor1: '#003893', cor2: '#CF2027', texto: 'branco' },
  // Grupo I
  'França':              { iso: 'fr', cor1: '#002395', cor2: '#ED2939', texto: 'branco' },
  'Senegal':             { iso: 'sn', cor1: '#00853F', cor2: '#FDEF42', texto: 'escuro'  },
  'Noruega':             { iso: 'no', cor1: '#EF2B2D', cor2: '#003087', texto: 'branco' },
  'Iraque':              { iso: 'iq', cor1: '#007A3D', cor2: '#CE1126', texto: 'branco' },
  // Grupo J
  'Argentina':           { iso: 'ar', cor1: '#74ACDF', cor2: '#FFFFFF', texto: 'escuro'  },
  'Áustria':             { iso: 'at', cor1: '#ED2939', cor2: '#FFFFFF', texto: 'escuro'  },
  'Argélia':             { iso: 'dz', cor1: '#006233', cor2: '#D21034', texto: 'branco' },
  'Jordânia':            { iso: 'jo', cor1: '#007A3D', cor2: '#CE1126', texto: 'branco' },
  // Grupo K
  'Portugal':            { iso: 'pt', cor1: '#006600', cor2: '#FF0000', texto: 'branco' },
  'Colômbia':            { iso: 'co', cor1: '#FCD116', cor2: '#003087', texto: 'branco' },
  'Uzbequistão':         { iso: 'uz', cor1: '#1EB53A', cor2: '#CE1126', texto: 'branco' },
  'Rep. Dem. do Congo':  { iso: 'cd', cor1: '#007FFF', cor2: '#CE1126', texto: 'branco' },
  // Grupo L
  'Inglaterra':          { iso: 'gb-eng', cor1: '#CF091D', cor2: '#FFFFFF', texto: 'escuro'  },
  'Croácia':             { iso: 'hr', cor1: '#FF0000', cor2: '#003087', texto: 'branco' },
  'Panamá':              { iso: 'pa', cor1: '#003087', cor2: '#CC002B', texto: 'branco' },
  'Gana':                { iso: 'gh', cor1: '#006B3F', cor2: '#FCD116', texto: 'escuro'  },
}

export function getFlagUrl(nome: string): string {
  const iso = SELECOES[nome]?.iso
  if (!iso) return ''
  return `https://flagcdn.com/w40/${iso}.png`
}

export const LISTA_SELECOES = Object.entries(SELECOES).map(([nome, theme]) => ({
  nome,
  ...theme,
})).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
