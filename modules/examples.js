// modules/examples.js - Exemplos de dados para carregar

// Exemplo sem roteiro (formato markdown)
const withoutRoteiro = `# MAPA DE B-ROLL PARA DOCUMENTÁRIO "TECNOLOGIA VERDE"

## ABERTURA

| TIMECODE | O QUE BUSCAR | FONTE | TERMOS DE BUSCA |
|----------|--------------|-------|----------------|
| 00:00-00:15 | Painéis solares em prédios modernos | YT | "solar panels buildings", "edifícios com painéis solares" |
| 00:15-00:30 | Turbinas eólicas em paisagem aberta | BV | "wind turbines landscape", "parque eólico vista aérea" |
| 00:30-00:45 | Carros elétricos em rodovias | YT | "electric cars highway", "veículos elétricos rodovia" |
| 00:45-01:00 | Fazendas verticais urbanas | GI | "vertical farming city", "agricultura vertical urbana" |

## CAPÍTULO 1: ENERGIA RENOVÁVEL

| TIMECODE | O QUE BUSCAR | FONTE | TERMOS DE BUSCA |
|----------|--------------|-------|----------------|
| 01:00-01:15 | Instalação de painéis solares | YT | "installing solar panels", "montagem painéis solares" |
| 01:15-01:30 | Gráficos de eficiência energética | MOT | "renewable energy growth", "crescimento energia renovável" |
| 01:30-01:45 | Usina de energia solar | BV | "solar power plant aerial", "usina solar vista aérea" |
| 01:45-02:00 | Pessoas usando dispositivos com energia solar | GI | "devices solar power", "gadgets energia solar" |`;

// Exemplo com roteiro (formato markdown)
const withRoteiro = `# CAPÍTULO 1: BUENOS AIRES EUROPEIA

| **TIMECODE** | **ROTEIRO** | **O QUE BUSCAR** | **FONTE** | **TERMOS DE BUSCA** |
| --- | --- | --- | --- | --- |
| 03:00-03:20 | Parece París, ¿verdad? Pero estás a más de 10.000 kilómetros de Europa. | Mapa comparativo: París x Buenos Aires | GI | "mapa París vs Buenos Aires", "distancia París Buenos Aires" |
| 03:20-03:40 | Bienvenidos a Buenos Aires, la ciudad que intentó borrar su pasado para convertirse en una "París sudamericana". | Panorâmica aérea de Buenos Aires moderna | YT | "Buenos Aires aerial view", "Buenos Aires skyline 4K" |
| 03:40-04:00 | En barrios como Recoleta, el 75% de los edificios imitan directamente el estilo francés. Un proyecto tan ambicioso como radical. | Fachadas de Recoleta com estilo francês | YT | "Recoleta Buenos Aires arquitectura", "edificios franceses Recoleta" |
| 04:00-04:20 | Pero aquí viene lo fascinante: este experimento de trasplante cultural tuvo un desenlace que nadie podía prever. | Imagens de imigrantes europeus chegando | GI | "inmigración europea Argentina siglo XIX", "puerto Buenos Aires 1900" |
| 04:20-04:40 | Lo que comenzó como un intento de crear una "Nueva Europa" en América del Sur terminó produciendo algo completamente inesperado. | Mistura cultural: tango e arquitetura | YT | "tango Buenos Aires calles", "arquitetura europeia tango" |`;

// Exemplo JSON completo
const json = {
  "sections": [
    {
      "title": "INTRODUÇÃO: CIDADES SUSTENTÁVEIS",
      "items": [
        {
          "id": 1,
          "timecode": "00:00-00:15",
          "roteiro": "As cidades do futuro já começaram a ser construídas hoje.",
          "element": "Vista aérea de cidade com tecnologias verdes",
          "source": "BV",
          "searchTermsText": "smart city aerial view, sustainable city technology",
          "searchTerms": ["smart city aerial view", "sustainable city technology"],
          "links": {
            "https://elements.envato.com/aerial-view-of-modern-eco-city-ABCDE12345": "Envato - Eco City",
            "https://www.storyblocks.com/video/stock/smart-city-concept-XYZW98765": "Storyblocks - Smart City"
          },
          "notes": "Preferir imagens com luz do dia. Cores vibrantes funcionam melhor com a trilha.",
          "expanded": true,
          "isTranslated": true,
          "originalRoteiro": "As cidades do futuro já começaram a ser construídas hoje.",
          "translatedRoteiro": "The cities of the future have already begun to be built today."
        },
        {
          "id": 2,
          "timecode": "00:15-00:30",
          "roteiro": "Em Copenhague, 62% da população usa bicicletas diariamente.",
          "element": "Ciclovias movimentadas em Copenhague",
          "source": "YT",
          "searchTermsText": "Copenhagen bicycle lanes, Copenhagen cycling culture",
          "searchTerms": ["Copenhagen bicycle lanes", "Copenhagen cycling culture"],
          "links": {
            "https://www.youtube.com/watch?v=ABCDEFG12345": "YouTube - Copenhagen Cycling"
          },
          "notes": "Buscar cenas com movimento de pessoas, evitar tomadas estáticas.",
          "expanded": true,
          "isTranslated": false,
          "originalRoteiro": "Em Copenhague, 62% da população usa bicicletas diariamente.",
          "translatedRoteiro": null
        }
      ]
    },
    {
      "title": "CAPÍTULO 1: INFRAESTRUTURA VERDE",
      "items": [
        {
          "id": 1,
          "timecode": "00:45-01:00",
          "roteiro": "Desde 2015, Singapura transformou 90% de seus telhados em jardins urbanos.",
          "element": "Telhados verdes de Singapura",
          "source": "GI",
          "searchTermsText": "Singapore green roofs, Singapore rooftop gardens",
          "searchTerms": ["Singapore green roofs", "Singapore rooftop gardens"],
          "links": {
            "https://unsplash.com/photos/singapore-green-roofs-ABC123": "Unsplash - Telhados",
            "https://flickr.com/photos/singapore-gardens-XYZ789": "Flickr CC - Jardins"
          },
          "notes": "Buscar imagens com pessoas utilizando os espaços, não apenas arquitetura.",
          "expanded": false,
          "isTranslated": false,
          "originalRoteiro": "Desde 2015, Singapura transformou 90% de seus telhados em jardins urbanos.",
          "translatedRoteiro": null
        },
        {
          "id": 2,
          "timecode": "01:00-01:15",
          "roteiro": "Os dados mostram que cada árvore urbana economiza até $500 por ano em custos de energia.",
          "element": "Infográfico sobre economia com árvores",
          "source": "MOT",
          "searchTermsText": "tree energy savings infographic, urban trees benefits data",
          "searchTerms": ["tree energy savings infographic", "urban trees benefits data"],
          "links": {},
          "notes": "Criar gráfico personalizado baseado nos dados da pesquisa da UC Davis.",
          "expanded": true,
          "isTranslated": true,
          "originalRoteiro": "Os dados mostram que cada árvore urbana economiza até $500 por ano em custos de energia.",
          "translatedRoteiro": "Data shows that each urban tree saves up to $500 per year in energy costs."
        }
      ]
    }
  ]
};

// Exportar exemplos
export const examples = {
    withoutRoteiro,
    withRoteiro,
    json
};