export type AbilityBenchmark = { rank: number; label: string };

export const abilityBenchmarkAnchors: AbilityBenchmark[] = [
  { rank: -5, label: "Incapacitado nesse atributo" },
  { rank: -4, label: "Praticamente incapaz" },
  { rank: -3, label: "Muito fraco" },
  { rank: -2, label: "Prejudicado" },
  { rank: -1, label: "Abaixo da média" },
  { rank: 0, label: "Média humana" },
  { rank: 1, label: "Acima da média" },
  { rank: 2, label: "Bem acima da média" },
  { rank: 3, label: "Talentoso" },
  { rank: 4, label: "Altamente talentoso" },
  { rank: 5, label: "Entre os melhores de um país" },
  { rank: 6, label: "Entre os melhores do mundo" },
  { rank: 7, label: "Ápice da realização humana" },
  { rank: 8, label: "Super-humano baixo" },
  { rank: 10, label: "Super-humano moderado" },
  { rank: 13, label: "Super-humano alto" },
  { rank: 15, label: "Super-humano muito alto" },
  { rank: 20, label: "Cósmico ou divino (20+)" },
];

export function getAbilityBenchmark(rank: number) {
  const value = safeInteger(rank);
  const exact = abilityBenchmarkAnchors.find((entry) => entry.rank === value);
  if (exact) return { value, label: exact.label, detail: `Graduação ${value}: ${exact.label.toLocaleLowerCase("pt-BR")}.`, exact: true };
  if (value > 20) return {
    value,
    label: "Cósmico ou divino",
    detail: `A tabela agrupa a graduação ${value} no marco 20+: cósmico ou divino. Não há teto de atributo, mas os limites de NP aplicáveis continuam valendo.`,
    exact: false,
  };
  const lower = [...abilityBenchmarkAnchors].reverse().find((entry) => entry.rank < value);
  const upper = abilityBenchmarkAnchors.find((entry) => entry.rank > value);
  if (!lower || !upper) return { value, label: "Fora dos marcos usuais", detail: "Consulte o Narrador para representar este valor excepcional.", exact: false };
  return {
    value,
    label: `Entre “${lower.label}” e “${upper.label}”`,
    detail: `A graduação ${value} fica entre os marcos ${lower.rank} e ${upper.rank}; a tabela usa referências, não um rótulo oficial para cada valor intermediário.`,
    exact: false,
  };
}

export const difficultyBenchmarks = [
  { dc: 0, label: "Muito fácil", example: "Notar algo à vista" },
  { dc: 5, label: "Fácil", example: "Subir por uma corda com nós" },
  { dc: 10, label: "Médio", example: "Ouvir um guarda se aproximando" },
  { dc: 15, label: "Difícil", example: "Desarmar um detonador" },
  { dc: 20, label: "Desafiador", example: "Nadar contra uma corrente forte" },
  { dc: 25, label: "Formidável", example: "Escalar rocha molhada" },
  { dc: 30, label: "Heroico", example: "Superar segurança sofisticada" },
  { dc: 35, label: "Super-heroico", example: "Convencer sob circunstâncias extremas" },
  { dc: 40, label: "Quase impossível", example: "Resolver no ato um problema inédito" },
] as const;

export const skillBenchmarkAnchors = [
  { modifier: 5, label: "Profissional", routineDc: 15 },
  { modifier: 10, label: "Especialista", routineDc: 20 },
  { modifier: 15, label: "Especialista formidável", routineDc: 25 },
  { modifier: 30, label: "Extremo", routineDc: 40 },
] as const;

export function getSkillBenchmark(modifier: number) {
  const value = safeInteger(modifier);
  const routineResult = value + 10;
  const achieved = [...difficultyBenchmarks].reverse().find((entry) => entry.dc <= routineResult);
  const next = difficultyBenchmarks.find((entry) => entry.dc > routineResult);
  const anchor = [...skillBenchmarkAnchors].reverse().find((entry) => entry.modifier <= value);
  return {
    modifier: value,
    routineResult,
    label: anchor?.label ?? "Em desenvolvimento",
    difficulty: achieved?.label ?? "Abaixo de muito fácil",
    achievedDc: achieved?.dc,
    nextDc: next?.dc,
    detail: achieved
      ? `Em rotina, ${signed(value)} produz ${routineResult} e alcança a CD ${achieved.dc} (${achieved.label.toLocaleLowerCase("pt-BR")}) sem rolar.`
      : `Em rotina, ${signed(value)} produz ${routineResult}; até tarefas muito fáceis podem exigir rolagem.`,
  };
}

export function getPowerLevelMetrics(powerLevel: number) {
  const value = Math.max(0, safeInteger(powerLevel));
  return {
    powerLevel: value,
    recommendedPoints: value * 15,
    pairedLimit: value * 2,
    skillLimit: value + 10,
    initiativeLimit: value * 2,
    heroicUses: Math.floor(value / 2),
  };
}

export type MeasurementRow = { rank: number; mass: string; time: string; distance: string; volume: string };

export const measurementScale: MeasurementRow[] = [
  { rank: -5, mass: "750 g", time: "1/8 s", distance: "6 cm", volume: "0,001 m³" },
  { rank: -4, mass: "1,5 kg", time: "1/4 s", distance: "12 cm", volume: "0,002 m³" },
  { rank: -3, mass: "3 kg", time: "1/2 s", distance: "25 cm", volume: "0,004 m³" },
  { rank: -2, mass: "6 kg", time: "1 s", distance: "50 cm", volume: "0,008 m³" },
  { rank: -1, mass: "12 kg", time: "3 s", distance: "1 m", volume: "0,015 m³" },
  { rank: 0, mass: "25 kg", time: "6 s", distance: "2 m", volume: "0,03 m³" },
  { rank: 1, mass: "50 kg", time: "12 s", distance: "4 m", volume: "0,06 m³" },
  { rank: 2, mass: "100 kg", time: "30 s", distance: "8 m", volume: "0,125 m³" },
  { rank: 3, mass: "200 kg", time: "1 min", distance: "16 m", volume: "0,25 m³" },
  { rank: 4, mass: "400 kg", time: "2 min", distance: "32 m", volume: "0,5 m³" },
  { rank: 5, mass: "800 kg", time: "4 min", distance: "64 m", volume: "1 m³" },
  { rank: 6, mass: "1.600 kg", time: "8 min", distance: "125 m", volume: "2 m³" },
  { rank: 7, mass: "3 t", time: "15 min", distance: "250 m", volume: "4 m³" },
  { rank: 8, mass: "6 t", time: "30 min", distance: "500 m", volume: "8 m³" },
  { rank: 9, mass: "12 t", time: "1 h", distance: "1 km", volume: "15 m³" },
  { rank: 10, mass: "25 t", time: "2 h", distance: "2 km", volume: "30 m³" },
  { rank: 11, mass: "50 t", time: "4 h", distance: "4 km", volume: "60 m³" },
  { rank: 12, mass: "100 t", time: "8 h", distance: "8 km", volume: "120 m³" },
  { rank: 13, mass: "200 t", time: "16 h", distance: "16 km", volume: "250 m³" },
  { rank: 14, mass: "400 t", time: "1 dia", distance: "32 km", volume: "500 m³" },
  { rank: 15, mass: "800 t", time: "2 dias", distance: "64 km", volume: "1.000 m³" },
  { rank: 16, mass: "1.600 t", time: "4 dias", distance: "125 km", volume: "2.000 m³" },
  { rank: 17, mass: "3.000 t", time: "1 semana", distance: "250 km", volume: "4.000 m³" },
  { rank: 18, mass: "6.000 t", time: "2 semanas", distance: "500 km", volume: "8.000 m³" },
  { rank: 19, mass: "12.000 t", time: "1 mês", distance: "1.000 km", volume: "15.000 m³" },
  { rank: 20, mass: "25.000 t", time: "3 meses", distance: "2.000 km", volume: "30.000 m³" },
  { rank: 21, mass: "50.000 t", time: "6 meses", distance: "4.000 km", volume: "60.000 m³" },
  { rank: 22, mass: "100.000 t", time: "1 ano", distance: "8.000 km", volume: "125.000 m³" },
  { rank: 23, mass: "200.000 t", time: "2 anos", distance: "16.000 km", volume: "500.000 m³" },
  { rank: 24, mass: "400.000 t", time: "5 anos", distance: "32.000 km", volume: "1 milhão m³" },
  { rank: 25, mass: "800.000 t", time: "10 anos", distance: "64.000 km", volume: "2 milhões m³" },
  { rank: 26, mass: "1,6 milhão t", time: "20 anos", distance: "124.000 km", volume: "4 milhões m³" },
  { rank: 27, mass: "3,2 milhões t", time: "50 anos", distance: "250.000 km", volume: "8 milhões m³" },
  { rank: 28, mass: "6,4 milhões t", time: "100 anos", distance: "500.000 km", volume: "16 milhões m³" },
  { rank: 29, mass: "12,5 milhões t", time: "200 anos", distance: "1 milhão km", volume: "32 milhões m³" },
  { rank: 30, mass: "25 milhões t", time: "500 anos", distance: "2 milhões km", volume: "64 milhões m³" },
];

export function getMeasurementRow(rank: number) {
  const value = safeInteger(rank);
  const exact = measurementScale.find((entry) => entry.rank === value);
  if (exact) return { ...exact, exact: true, note: "Valor aproximado da tabela métrica." };
  const edge = value > 30 ? measurementScale[measurementScale.length - 1] : measurementScale[0];
  const delta = Math.abs(value - edge.rank);
  const extrapolated = value > 30
    ? {
        mass: formatExtrapolated(25_000_000, delta, "t"),
        time: formatExtrapolated(500, delta, "anos"),
        distance: formatExtrapolated(2_000_000, delta, "km"),
        volume: formatExtrapolated(64_000_000, delta, "m³"),
      }
    : {
        mass: formatExtrapolated(750, -delta, "g"),
        time: formatExtrapolated(0.125, -delta, "s"),
        distance: formatExtrapolated(6, -delta, "cm"),
        volume: formatExtrapolated(0.001, -delta, "m³"),
      };
  return {
    rank: value,
    ...extrapolated,
    exact: false,
    note: `${value > 30 ? "Acima" : "Abaixo"} da tabela publicada: ${delta} ${delta === 1 ? "passo calculado" : "passos calculados"} pelo mesmo padrão de duplicação.`,
  };
}

export function getTravelDistance(speedRank: number, timeRank: number) {
  const speed = safeInteger(speedRank);
  const time = safeInteger(timeRank);
  const rank = safeInteger(speed + time);
  const measure = getMeasurementRow(rank);
  return {
    speedRank: speed,
    timeRank: time,
    rank,
    value: measure.distance,
    formula: `${speed} + ${time} = ${rank}`,
  };
}

export function getTravelTime(distanceRank: number, speedRank: number) {
  const distance = safeInteger(distanceRank);
  const speed = safeInteger(speedRank);
  const rank = safeInteger(distance - speed);
  const measure = getMeasurementRow(rank);
  return {
    distanceRank: distance,
    speedRank: speed,
    rank,
    value: measure.time,
    formula: `${distance} − ${speed} = ${rank}`,
  };
}

export function getThrowingDistance(strengthRank: number, massRank: number) {
  const strength = safeInteger(strengthRank);
  const mass = safeInteger(massRank);
  const rank = safeInteger(strength - mass);
  const measure = getMeasurementRow(rank);
  return {
    strengthRank: strength,
    massRank: mass,
    rank,
    value: measure.distance,
    formula: `${strength} − ${mass} = ${rank}`,
  };
}

export function getEffectRankBenchmark(rank: number) {
  const value = Math.max(0, safeInteger(rank));
  const measure = getMeasurementRow(value);
  return {
    rank: value,
    label: value >= 20 ? "Escala cósmica de efeito" : value >= 13 ? "Escala super-humana alta" : value >= 8 ? "Escala super-humana" : "Escala humana ou heroica",
    detail: `A graduação mede potência mecânica; seu significado exato depende do efeito e dos descritores. Como referência de medida: massa ${measure.mass}, distância ${measure.distance}.`,
  };
}

export function getLiftingBenchmark(strengthRank: number) {
  const value = safeInteger(strengthRank);
  const measure = getMeasurementRow(value);
  return { rank: value, mass: measure.mass, note: `Capacidade de carga aproximada na graduação ${value}; vantagens e efeitos podem alterá-la.` };
}

export function getSpeedBenchmark(speedRank: number) {
  const value = safeInteger(speedRank);
  const measure = getMeasurementRow(value);
  return { rank: value, distancePerRound: measure.distance, note: `Distância aproximada por ação de movimento de 6 segundos na graduação ${value}.` };
}

function safeInteger(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-Number.MAX_SAFE_INTEGER, Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(value)));
}

function signed(value: number) { return value > 0 ? `+${value}` : String(value); }

function formatExtrapolated(base: number, exponent: number, unit: string) {
  const logarithm = Math.log10(base) + exponent * Math.log10(2);
  if (logarithm > 15 || logarithm < -6) {
    const order = Math.floor(logarithm);
    const coefficient = 10 ** (logarithm - order);
    return `≈ ${formatDecimal(coefficient)} × 10^${order} ${unit}`;
  }
  return `≈ ${formatDecimal(base * 2 ** exponent)} ${unit}`;
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 6,
    maximumSignificantDigits: 6,
  }).format(value);
}
