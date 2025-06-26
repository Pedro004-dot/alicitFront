export interface Estado {
  sigla: string;
  nome: string;
  cidades: string[];
}

export const estadosBrasil: Estado[] = [
  {
    sigla: 'AC',
    nome: 'Acre',
    cidades: [
      'Rio Branco', 'Cruzeiro do Sul', 'Feijó', 'Sena Madureira', 'Tarauacá',
      'Brasileia', 'Plácido de Castro', 'Xapuri', 'Epitaciolândia', 'Capixaba'
    ]
  },
  {
    sigla: 'AL',
    nome: 'Alagoas',
    cidades: [
      'Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'União dos Palmares',
      'Penedo', 'Coruripe', 'São Miguel dos Campos', 'Santana do Ipanema', 'Delmiro Gouveia'
    ]
  },
  {
    sigla: 'AP',
    nome: 'Amapá',
    cidades: [
      'Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Porto Grande',
      'Mazagão', 'Tartarugalzinho', 'Vitória do Jari', 'Calçoene', 'Amapá'
    ]
  },
  {
    sigla: 'AM',
    nome: 'Amazonas',
    cidades: [
      'Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari',
      'Tefé', 'Tabatinga', 'Maués', 'São Gabriel da Cachoeira', 'Humaitá'
    ]
  },
  {
    sigla: 'BA',
    nome: 'Bahia',
    cidades: [
      'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro',
      'Itabuna', 'Lauro de Freitas', 'Ilhéus', 'Jequié', 'Teixeira de Freitas',
      'Alagoinhas', 'Porto Seguro', 'Simões Filho', 'Paulo Afonso', 'Eunápolis'
    ]
  },
  {
    sigla: 'CE',
    nome: 'Ceará',
    cidades: [
      'Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral',
      'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá',
      'Canindé', 'Aquiraz', 'Pacatuba', 'Crateús', 'Russas'
    ]
  },
  {
    sigla: 'DF',
    nome: 'Distrito Federal',
    cidades: [
      'Brasília', 'Taguatinga', 'Ceilândia', 'Samambaia', 'Planaltina',
      'Águas Claras', 'Gama', 'Santa Maria', 'Sobradinho', 'São Sebastião'
    ]
  },
  {
    sigla: 'ES',
    nome: 'Espírito Santo',
    cidades: [
      'Vitória', 'Vila Velha', 'Cariacica', 'Serra', 'Cachoeiro de Itapemirim',
      'Linhares', 'São Mateus', 'Colatina', 'Guarapari', 'Aracruz',
      'Viana', 'Nova Venécia', 'Barra de São Francisco', 'Santa Teresa', 'Itapemirim'
    ]
  },
  {
    sigla: 'GO',
    nome: 'Goiás',
    cidades: [
      'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia',
      'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Novo Gama',
      'Itumbiara', 'Senador Canedo', 'Catalão', 'Jataí', 'Planaltina'
    ]
  },
  {
    sigla: 'MA',
    nome: 'Maranhão',
    cidades: [
      'São Luís', 'Imperatriz', 'Timon', 'Caxias', 'Codó',
      'Paço do Lumiar', 'Açailândia', 'Bacabal', 'Balsas', 'Santa Inês',
      'Pinheiro', 'Pedreiras', 'São José de Ribamar', 'Chapadinha', 'Barra do Corda'
    ]
  },
  {
    sigla: 'MT',
    nome: 'Mato Grosso',
    cidades: [
      'Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra',
      'Cáceres', 'Sorriso', 'Lucas do Rio Verde', 'Barra do Garças', 'Primavera do Leste',
      'Alta Floresta', 'Poxoréu', 'Nova Mutum', 'Mirassol d\'Oeste', 'Diamantino'
    ]
  },
  {
    sigla: 'MS',
    nome: 'Mato Grosso do Sul',
    cidades: [
      'Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã',
      'Naviraí', 'Nova Andradina', 'Sidrolândia', 'Maracaju', 'São Gabriel do Oeste',
      'Coxim', 'Aquidauana', 'Paranaíba', 'Amambai', 'Chapadão do Sul'
    ]
  },
  {
    sigla: 'MG',
    nome: 'Minas Gerais',
    cidades: [
      'Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim',
      'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga',
      'Santa Luzia', 'Sete Lagoas', 'Divinópolis', 'Ibirité', 'Poços de Caldas',
      'Patos de Minas', 'Pouso Alegre', 'Teófilo Otoni', 'Barbacena', 'Sabará',
      'Varginha', 'Conselheiro Lafaiete', 'Vespasiano', 'Itabira', 'Araguari'
    ]
  },
  {
    sigla: 'PA',
    nome: 'Pará',
    cidades: [
      'Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Castanhal',
      'Parauapebas', 'Abaetetuba', 'Cametá', 'Marituba', 'Altamira',
      'Bragança', 'Tucuruí', 'Paragominas', 'Redenção', 'Itaituba'
    ]
  },
  {
    sigla: 'PB',
    nome: 'Paraíba',
    cidades: [
      'João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux',
      'Sousa', 'Cajazeiras', 'Cabedelo', 'Guarabira', 'Mamanguape',
      'Sapé', 'Desterro', 'Conde', 'Monteiro', 'Esperança'
    ]
  },
  {
    sigla: 'PR',
    nome: 'Paraná',
    cidades: [
      'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel',
      'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá',
      'Araucária', 'Toledo', 'Apucarana', 'Pinhais', 'Campo Largo',
      'Arapongas', 'Almirante Tamandaré', 'Umuarama', 'Piraquara', 'Cambé'
    ]
  },
  {
    sigla: 'PE',
    nome: 'Pernambuco',
    cidades: [
      'Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Bandeira', 'Caruaru',
      'Petrolina', 'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns',
      'Vitória de Santo Antão', 'Igarassu', 'São Lourenço da Mata', 'Santa Cruz do Capibaribe', 'Abreu e Lima'
    ]
  },
  {
    sigla: 'PI',
    nome: 'Piauí',
    cidades: [
      'Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano',
      'Campo Maior', 'Barras', 'União', 'Altos', 'Pedro II',
      'Valença', 'José de Freitas', 'Oeiras', 'São Raimundo Nonato', 'Esperantina'
    ]
  },
  {
    sigla: 'RJ',
    nome: 'Rio de Janeiro',
    cidades: [
      'Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói',
      'Belford Roxo', 'Campos dos Goytacazes', 'São João de Meriti', 'Petrópolis', 'Volta Redonda',
      'Magé', 'Macaé', 'Itaboraí', 'Cabo Frio', 'Angra dos Reis',
      'Nova Friburgo', 'Barra Mansa', 'Teresópolis', 'Mesquita', 'Nilópolis'
    ]
  },
  {
    sigla: 'RN',
    nome: 'Rio Grande do Norte',
    cidades: [
      'Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba',
      'Ceará-Mirim', 'Caicó', 'Assu', 'Currais Novos', 'São José de Mipibu',
      'Santa Cruz', 'João Câmara', 'Extremoz', 'Touros', 'Apodi'
    ]
  },
  {
    sigla: 'RS',
    nome: 'Rio Grande do Sul',
    cidades: [
      'Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria',
      'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande',
      'Alvorada', 'Passo Fundo', 'Sapucaia do Sul', 'Uruguaiana', 'Santa Cruz do Sul',
      'Cachoeirinha', 'Bagé', 'Bento Gonçalves', 'Erechim', 'Guaíba'
    ]
  },
  {
    sigla: 'RO',
    nome: 'Rondônia',
    cidades: [
      'Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal',
      'Rolim de Moura', 'Jaru', 'Guajará-Mirim', 'Buritis', 'Ouro Preto do Oeste',
      'Machadinho d\'Oeste', 'Presidente Médici', 'Espigão d\'Oeste', 'Colorado do Oeste', 'Cerejeiras'
    ]
  },
  {
    sigla: 'RR',
    nome: 'Roraima',
    cidades: [
      'Boa Vista', 'Rorainópolis', 'Caracaraí', 'Alto Alegre', 'Mucajaí',
      'Bonfim', 'Cantá', 'Normandia', 'São João da Baliza', 'São Luiz',
      'Caroebe', 'Iracema', 'Amajari', 'Pacaraima', 'Uiramutã'
    ]
  },
  {
    sigla: 'SC',
    nome: 'Santa Catarina',
    cidades: [
      'Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma',
      'Chapecó', 'Itajaí', 'Lages', 'Jaraguá do Sul', 'Palhoça',
      'Balneário Camboriú', 'Brusque', 'Tubarão', 'São Bento do Sul', 'Caçador',
      'Camboriú', 'Navegantes', 'Concórdia', 'Rio do Sul', 'Araranguá'
    ]
  },
  {
    sigla: 'SP',
    nome: 'São Paulo',
    cidades: [
      'São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'São José dos Campos',
      'Santo André', 'Ribeirão Preto', 'Osasco', 'Sorocaba', 'Mauá',
      'São José do Rio Preto', 'Mogi das Cruzes', 'Santos', 'Diadema', 'Jundiaí',
      'Carapicuíba', 'Piracicaba', 'Bauru', 'São Vicente', 'Itaquaquecetuba',
      'Franca', 'Guarujá', 'Taubaté', 'Praia Grande', 'Limeira',
      'Suzano', 'Taboão da Serra', 'Sumaré', 'Barueri', 'Embu das Artes'
    ]
  },
  {
    sigla: 'SE',
    nome: 'Sergipe',
    cidades: [
      'Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão',
      'Estância', 'Tobias Barreto', 'Simão Dias', 'Propriá', 'Barra dos Coqueiros',
      'Laranjeiras', 'Canindé de São Francisco', 'Ribeirópolis', 'Neópolis', 'Glória'
    ]
  },
  {
    sigla: 'TO',
    nome: 'Tocantins',
    cidades: [
      'Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins',
      'Colinas do Tocantins', 'Guaraí', 'Tocantinópolis', 'Miracema do Tocantins', 'Dianópolis',
      'Araguatins', 'Pedro Afonso', 'Xambioá', 'Taguatinga', 'Augustinópolis'
    ]
  }
];

export const getEstadoBySigna = (sigla: string): Estado | undefined => {
  return estadosBrasil.find(estado => estado.sigla === sigla);
};

export const getCidadesByEstado = (sigla: string): string[] => {
  const estado = getEstadoBySigna(sigla);
  return estado ? estado.cidades : [];
}; 