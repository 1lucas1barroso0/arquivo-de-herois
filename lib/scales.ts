import type { AppLanguage } from "./localization";

export type AbilityBenchmark = { rank: number; label: string; labelEn: string };

export type SizeProfile = {
  rank: number;
  label: string;
  canonical: string;
  space: string | null;
  reach: number | null;
  published: boolean;
  note: string;
};

export const sizeProfiles: SizeProfile[] = [
  { rank: -5, label: "Minúsculo", canonical: "Minuscule", space: "1/16", reach: 0, published: true, note: "Tabela de Tamanho da prévia 4E." },
  { rank: -4, label: "Ínfimo", canonical: "Fine", space: "1/8", reach: 0, published: true, note: "Tabela de Tamanho da prévia 4E." },
  { rank: -3, label: "Diminuto", canonical: "Diminutive", space: "1/4", reach: 0, published: true, note: "Tabela de Tamanho da prévia 4E." },
  { rank: -2, label: "Miúdo", canonical: "Tiny", space: "1/2", reach: 0, published: true, note: "Tabela de Tamanho da prévia 4E." },
  { rank: -1, label: "Pequeno", canonical: "Small", space: "1", reach: 1, published: true, note: "Tabela de Tamanho da prévia 4E." },
  { rank: 0, label: "Médio", canonical: "Medium", space: "1", reach: 1, published: true, note: "Tamanho padrão; a escolha do tamanho natural não custa PP." },
  { rank: 1, label: "Grande", canonical: "Large", space: "2", reach: 1, published: true, note: "Tabela de Tamanho da prévia 4E." },
  { rank: 2, label: "Enorme", canonical: "Huge", space: "3", reach: 2, published: true, note: "Tabela de Tamanho da prévia 4E." },
  { rank: 3, label: "Gigantesco", canonical: "Gargantuan", space: "4", reach: 3, published: true, note: "Tabela de Tamanho da prévia 4E." },
  { rank: 4, label: "Colossal", canonical: "Colossal", space: "6", reach: 4, published: true, note: "Tabela de Tamanho da prévia 4E." },
  { rank: 5, label: "Assombroso", canonical: "Awesome", space: "8", reach: 6, published: true, note: "Tabela de Tamanho da prévia 4E." },
];

export function getSizeProfile(rank: number): SizeProfile {
  const normalizedRank = Number.isFinite(rank) ? rank : 0;
  const published = Number.isSafeInteger(normalizedRank)
    ? sizeProfiles.find((entry) => entry.rank === normalizedRank)
    : undefined;
  if (published) return published;
  return {
    rank: normalizedRank,
    label: "Tamanho personalizado",
    canonical: "Custom size",
    space: null,
    reach: null,
    published: false,
    note: "A prévia fornecida publica a tabela de -5 a 5. Registre valores externos com a decisão do Narrador; o aplicativo não inventa espaço ou alcance.",
  };
}

export const abilityBenchmarkAnchors: AbilityBenchmark[] = [
  { rank: -5, label: "Incapacitado nesse atributo", labelEn: "Incapacitated in this ability" },
  { rank: -4, label: "Praticamente incapaz", labelEn: "Almost incapable" },
  { rank: -3, label: "Muito fraco", labelEn: "Very weak" },
  { rank: -2, label: "Prejudicado", labelEn: "Impaired" },
  { rank: -1, label: "Abaixo da média", labelEn: "Below average" },
  { rank: 0, label: "Média humana", labelEn: "Human average" },
  { rank: 1, label: "Acima da média", labelEn: "Above average" },
  { rank: 2, label: "Bem acima da média", labelEn: "Well above average" },
  { rank: 3, label: "Talentoso", labelEn: "Gifted" },
  { rank: 4, label: "Altamente talentoso", labelEn: "Highly gifted" },
  { rank: 5, label: "Entre os melhores de um país", labelEn: "Among a country's best" },
  { rank: 6, label: "Entre os melhores do mundo", labelEn: "Among the world's best" },
  { rank: 7, label: "Ápice da realização humana", labelEn: "Peak human achievement" },
  { rank: 8, label: "Super-humano baixo", labelEn: "Low superhuman" },
  { rank: 10, label: "Super-humano moderado", labelEn: "Moderate superhuman" },
  { rank: 13, label: "Super-humano alto", labelEn: "High superhuman" },
  { rank: 15, label: "Super-humano muito alto", labelEn: "Very high superhuman" },
  { rank: 20, label: "Cósmico ou divino (20+)", labelEn: "Cosmic or divine (20+)" },
];

export function getAbilityBenchmark(rank: number, language: AppLanguage = "pt") {
  const value = safeInteger(rank);
  const exact = abilityBenchmarkAnchors.find((entry) => entry.rank === value);
  if (exact) {
    const label = language === "en" ? exact.labelEn : exact.label;
    return { value, label, detail: language === "en" ? `Rank ${value}: ${label.toLocaleLowerCase("en")}.` : `Graduação ${value}: ${label.toLocaleLowerCase("pt-BR")}.`, exact: true };
  }
  if (value > 20) return {
    value,
    label: language === "en" ? "Cosmic or divine" : "Cósmico ou divino",
    detail: language === "en" ? `The table groups rank ${value} under the 20+ benchmark: cosmic or divine. Applicable PL limits still apply.` : `A tabela agrupa a graduação ${value} no marco 20+: cósmico ou divino. Não há teto de atributo, mas os limites de NP aplicáveis continuam valendo.`,
    exact: false,
  };
  const lower = [...abilityBenchmarkAnchors].reverse().find((entry) => entry.rank < value);
  const upper = abilityBenchmarkAnchors.find((entry) => entry.rank > value);
  if (!lower || !upper) return { value, label: language === "en" ? "Outside common benchmarks" : "Fora dos marcos usuais", detail: language === "en" ? "Ask the Game Master how to represent this exceptional value." : "Consulte o Narrador para representar este valor excepcional.", exact: false };
  const lowerLabel = language === "en" ? lower.labelEn : lower.label;
  const upperLabel = language === "en" ? upper.labelEn : upper.label;
  return {
    value,
    label: language === "en" ? `Between “${lowerLabel}” and “${upperLabel}”` : `Entre “${lowerLabel}” e “${upperLabel}”`,
    detail: language === "en" ? `Rank ${value} falls between benchmarks ${lower.rank} and ${upper.rank}.` : `A graduação ${value} fica entre os marcos ${lower.rank} e ${upper.rank}; a tabela usa referências, não um rótulo oficial para cada valor intermediário.`,
    exact: false,
  };
}

export const difficultyBenchmarks = [
  { dc: 0, label: "Muito fácil", labelEn: "Very easy", example: "Notar algo à vista", exampleEn: "Notice something in plain sight" },
  { dc: 5, label: "Fácil", labelEn: "Easy", example: "Subir por uma corda com nós", exampleEn: "Climb a knotted rope" },
  { dc: 10, label: "Médio", labelEn: "Average", example: "Ouvir um guarda se aproximando", exampleEn: "Hear an approaching guard" },
  { dc: 15, label: "Difícil", labelEn: "Tough", example: "Desarmar um detonador", exampleEn: "Disarm a detonator" },
  { dc: 20, label: "Desafiador", labelEn: "Challenging", example: "Nadar contra uma corrente forte", exampleEn: "Swim against a strong current" },
  { dc: 25, label: "Formidável", labelEn: "Formidable", example: "Escalar rocha molhada", exampleEn: "Climb wet rock" },
  { dc: 30, label: "Heroico", labelEn: "Heroic", example: "Superar segurança sofisticada", exampleEn: "Bypass sophisticated security" },
  { dc: 35, label: "Super-heroico", labelEn: "Super-heroic", example: "Convencer sob circunstâncias extremas", exampleEn: "Persuade under extreme circumstances" },
  { dc: 40, label: "Quase impossível", labelEn: "Nearly impossible", example: "Resolver no ato um problema inédito", exampleEn: "Solve a novel problem on the spot" },
] as const;

export const skillBenchmarkAnchors = [
  { modifier: 5, label: "Profissional", labelEn: "Professional", routineDc: 15 },
  { modifier: 10, label: "Especialista", labelEn: "Expert", routineDc: 20 },
  { modifier: 15, label: "Especialista formidável", labelEn: "Formidable expert", routineDc: 25 },
  { modifier: 30, label: "Extremo", labelEn: "Extreme", routineDc: 40 },
] as const;

export function getSkillBenchmark(modifier: number, language: AppLanguage = "pt") {
  const value = safeInteger(modifier);
  const routineResult = value + 10;
  const achieved = [...difficultyBenchmarks].reverse().find((entry) => entry.dc <= routineResult);
  const next = difficultyBenchmarks.find((entry) => entry.dc > routineResult);
  const anchor = [...skillBenchmarkAnchors].reverse().find((entry) => entry.modifier <= value);
  return {
    modifier: value,
    routineResult,
    label: anchor ? (language === "en" ? anchor.labelEn : anchor.label) : language === "en" ? "Developing" : "Em desenvolvimento",
    difficulty: achieved ? (language === "en" ? achieved.labelEn : achieved.label) : language === "en" ? "Below very easy" : "Abaixo de muito fácil",
    achievedDc: achieved?.dc,
    nextDc: next?.dc,
    detail: language === "en"
      ? achieved ? `As a routine check, ${signed(value)} produces ${routineResult} and reaches DC ${achieved.dc} (${achieved.labelEn.toLocaleLowerCase("en")}) without rolling.` : `As a routine check, ${signed(value)} produces ${routineResult}; even very easy tasks may require a roll.`
      : achieved ? `Em rotina, ${signed(value)} produz ${routineResult} e alcança a CD ${achieved.dc} (${achieved.label.toLocaleLowerCase("pt-BR")}) sem rolar.` : `Em rotina, ${signed(value)} produz ${routineResult}; até tarefas muito fáceis podem exigir rolagem.`,
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

export function getMeasurementRow(rank: number, language: AppLanguage = "pt") {
  const value = safeInteger(rank);
  const exact = measurementScale.find((entry) => entry.rank === value);
  if (exact) return { ...exact, time: localizeMeasureValue(exact.time, language), exact: true, note: language === "en" ? "Approximate value from the measurement table." : "Valor aproximado da tabela métrica." };
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
    time: localizeMeasureValue(extrapolated.time, language),
    exact: false,
    note: language === "en" ? `${value > 30 ? "Above" : "Below"} the published table: ${delta} calculated ${delta === 1 ? "step" : "steps"}.` : `${value > 30 ? "Acima" : "Abaixo"} da tabela publicada: ${delta} ${delta === 1 ? "passo calculado" : "passos calculados"} pelo mesmo padrão de duplicação.`,
  };
}

export function getTravelDistance(speedRank: number, timeRank: number, language: AppLanguage = "pt") {
  const speed = safeInteger(speedRank);
  const time = safeInteger(timeRank);
  const rank = safeInteger(speed + time);
  const measure = getMeasurementRow(rank, language);
  return {
    speedRank: speed,
    timeRank: time,
    rank,
    value: measure.distance,
    formula: `${speed} + ${time} = ${rank}`,
  };
}

export function getTravelTime(distanceRank: number, speedRank: number, language: AppLanguage = "pt") {
  const distance = safeInteger(distanceRank);
  const speed = safeInteger(speedRank);
  const rank = safeInteger(distance - speed);
  const measure = getMeasurementRow(rank, language);
  return {
    distanceRank: distance,
    speedRank: speed,
    rank,
    value: measure.time,
    formula: `${distance} − ${speed} = ${rank}`,
  };
}

export function getThrowingDistance(strengthRank: number, massRank: number, language: AppLanguage = "pt") {
  const strength = safeInteger(strengthRank);
  const mass = safeInteger(massRank);
  const rank = safeInteger(strength - mass);
  const measure = getMeasurementRow(rank, language);
  return {
    strengthRank: strength,
    massRank: mass,
    rank,
    value: measure.distance,
    formula: `${strength} − ${mass} = ${rank}`,
  };
}

export function getEffectRankBenchmark(rank: number, language: AppLanguage = "pt") {
  const value = Math.max(0, safeInteger(rank));
  const measure = getMeasurementRow(value, language);
  return {
    rank: value,
    label: language === "en" ? value >= 20 ? "Cosmic effect scale" : value >= 13 ? "High superhuman scale" : value >= 8 ? "Superhuman scale" : "Human or heroic scale" : value >= 20 ? "Escala cósmica de efeito" : value >= 13 ? "Escala super-humana alta" : value >= 8 ? "Escala super-humana" : "Escala humana ou heroica",
    detail: language === "en" ? `Rank measures mechanical potency; its exact meaning depends on the effect and descriptors. Measurement reference: mass ${measure.mass}, distance ${measure.distance}.` : `A graduação mede potência mecânica; seu significado exato depende do efeito e dos descritores. Como referência de medida: massa ${measure.mass}, distância ${measure.distance}.`,
  };
}

export function getLiftingBenchmark(strengthRank: number, language: AppLanguage = "pt") {
  const value = safeInteger(strengthRank);
  const measure = getMeasurementRow(value, language);
  return { rank: value, mass: measure.mass, note: `Capacidade de carga aproximada na graduação ${value}; vantagens e efeitos podem alterá-la.` };
}

export function getSpeedBenchmark(speedRank: number, language: AppLanguage = "pt") {
  const value = safeInteger(speedRank);
  const measure = getMeasurementRow(value, language);
  return { rank: value, distancePerRound: measure.distance, note: `Distância aproximada por ação de movimento de 6 segundos na graduação ${value}.` };
}

function safeInteger(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-Number.MAX_SAFE_INTEGER, Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(value)));
}

function localizeMeasureValue(value: string, language: AppLanguage) {
  if (language === "pt") return value;
  return value
    .replace(/\b1 dia\b/g, "1 day")
    .replace(/\b(\d+) dias\b/g, "$1 days")
    .replace(/\b1 semana\b/g, "1 week")
    .replace(/\b(\d+) semanas\b/g, "$1 weeks")
    .replace(/\b1 mês\b/g, "1 month")
    .replace(/\b(\d+) meses\b/g, "$1 months")
    .replace(/\b1 ano\b/g, "1 year")
    .replace(/\b(\d+) anos\b/g, "$1 years");
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
