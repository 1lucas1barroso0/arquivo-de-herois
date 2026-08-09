"use client";

import {
  Activity,
  BookOpen,
  BookOpenCheck,
  Gauge,
  LibraryBig,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  getCheckResult,
  getDamageResistanceResult,
  getRoutineCheckResult,
  type DamageResistanceDegree,
} from "../lib/calculators";
import {
  catalogSearchMatches,
  getCatalogCategory,
  getCatalogName,
  getCatalogSummary,
} from "../lib/catalog";
import {
  referenceCatalogGroups,
  referenceCatalogTotal,
} from "../lib/reference-catalog";
import {
  ruleReferenceEntries,
  localizeRuleReference,
  searchRuleReference,
  type RuleReferenceCoverage,
  type RuleReferenceKind,
} from "../lib/rule-reference";
import {
  abilityBenchmarkAnchors,
  difficultyBenchmarks,
  getAbilityBenchmark,
  getEffectRankBenchmark,
  getLiftingBenchmark,
  getMeasurementRow,
  getPowerLevelMetrics,
  getSkillBenchmark,
  getSpeedBenchmark,
  getThrowingDistance,
  getTravelDistance,
  getTravelTime,
  measurementScale,
  sizeProfiles,
  skillBenchmarkAnchors,
} from "../lib/scales";
import { useLocale } from "./locale-provider";

type GuideTab =
  | "rules"
  | "catalog"
  | "abilities"
  | "skills"
  | "power-level"
  | "effects"
  | "measures";

const tabs = [
  { id: "rules", label: "Regras", icon: BookOpen },
  { id: "catalog", label: "Catálogo", icon: LibraryBig },
  { id: "abilities", label: "Atributos", icon: Activity },
  { id: "skills", label: "Perícias", icon: BookOpenCheck },
  { id: "power-level", label: "Nível de Poder", icon: ShieldCheck },
  { id: "effects", label: "Efeitos", icon: Sparkles },
  { id: "measures", label: "Medidas", icon: Ruler },
] as const;

const damageResistanceOptions = [
  { value: "normal", label: "Normal" },
  { value: "immunity", label: "Imunidade" },
  { value: "impervious", label: "Impenetrável" },
  { value: "reduction", label: "Redução" },
  { value: "improved", label: "Aprimorada" },
  { value: "susceptible", label: "Suscetível" },
  { value: "weakness", label: "Fraqueza" },
] as const;

export function ScaleGuide({
  open,
  onClose,
  initialPowerLevel = 10,
}: {
  open: boolean;
  onClose: () => void;
  initialPowerLevel?: number;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const { language: displayLanguage, setLanguage, t } = useLocale();
  const [tab, setTab] = useState<GuideTab>("rules");
  const [query, setQuery] = useState("");
  const [catalogGroup, setCatalogGroup] = useState("all");
  const [ruleKind, setRuleKind] = useState<"all" | RuleReferenceKind>("all");
  const [catalogLimit, setCatalogLimit] = useState(48);
  const [abilityRank, setAbilityRank] = useState(0);
  const [skillModifier, setSkillModifier] = useState(5);
  const [powerLevel, setPowerLevel] = useState(initialPowerLevel);
  const [effectRank, setEffectRank] = useState(8);
  const [measureRank, setMeasureRank] = useState(0);
  const [checkDie, setCheckDie] = useState(10);
  const [checkCircumstance, setCheckCircumstance] = useState(0);
  const [checkDifficulty, setCheckDifficulty] = useState(15);
  const [damageDie, setDamageDie] = useState(10);
  const [damageResistance, setDamageResistance] = useState(10);
  const [damageHits, setDamageHits] = useState(0);
  const [damageResistanceDegree, setDamageResistanceDegree] = useState<DamageResistanceDegree>("normal");
  const [damageSpecialRank, setDamageSpecialRank] = useState(10);
  const [damageBonusDie, setDamageBonusDie] = useState(10);
  const [movementSpeedRank, setMovementSpeedRank] = useState(2);
  const [travelTimeRank, setTravelTimeRank] = useState(9);
  const [travelDistanceRank, setTravelDistanceRank] = useState(11);
  const [throwStrengthRank, setThrowStrengthRank] = useState(12);
  const [throwMassRank, setThrowMassRank] = useState(7);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  const normalizedQuery = normalize(query);
  const ability = getAbilityBenchmark(abilityRank);
  const skill = getSkillBenchmark(skillModifier);
  const pl = getPowerLevelMetrics(powerLevel);
  const effect = getEffectRankBenchmark(effectRank);
  const measure = getMeasurementRow(measureRank);
  const check = getCheckResult({
    die: checkDie,
    modifier: skillModifier,
    circumstance: checkCircumstance,
    difficultyClass: checkDifficulty,
  });
  const routine = getRoutineCheckResult(skillModifier, checkCircumstance);
  const damage = getDamageResistanceResult({
    die: damageDie,
    resistance: damageResistance,
    effectRank,
    hits: damageHits,
    resistanceDegree: damageResistanceDegree,
    specialRank: damageSpecialRank,
    bonusDie: damageBonusDie,
  });
  const travelDistance = getTravelDistance(movementSpeedRank, travelTimeRank);
  const travelTime = getTravelTime(travelDistanceRank, movementSpeedRank);
  const throwingDistance = getThrowingDistance(throwStrengthRank, throwMassRank);
  const damageUnaffected = !damage.checkRequired ||
    (damage.success && damage.degrees >= 2);
  const damageResultClass = damageUnaffected
    ? "is-success"
    : damage.success
      ? "is-attention"
      : "is-failure";
  const matches = (text: string) => !normalizedQuery || normalize(text).includes(normalizedQuery);
  const visibleRules = useMemo(
    () => ruleReferenceEntries.filter(
      (entry) =>
        (ruleKind === "all" || entry.kind === ruleKind) &&
        searchRuleReference(entry, deferredQuery),
    ),
    [deferredQuery, ruleKind],
  );
  const visibleCatalog = useMemo(
    () =>
      referenceCatalogGroups.flatMap((group) =>
        catalogGroup === "all" || catalogGroup === group.id
          ? group.items
              .filter((entry) => !deferredQuery || catalogSearchMatches(entry, deferredQuery))
              .map((entry) => ({ entry, group }))
          : [],
      ),
    [catalogGroup, deferredQuery],
  );
  if (!open) return null;
  return (
    <div
      className="scale-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="reference-guide-title"
        aria-modal="true"
        className="scale-dialog reference-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <header className="scale-dialog-header">
          <span className="scale-dialog-mark" aria-hidden="true"><Gauge /></span>
          <div>
            <p className="eyebrow">{t("Referências")}</p>
            <h2 id="reference-guide-title">{t("Regras, opções e escalas")}</h2>
            <p>{t("Consulte regras, compare valores e resolva cálculos sem sobrecarregar a ficha.")}</p>
          </div>
          <button aria-label={t("Fechar Referências")} className="icon-button scale-close modal-close" onClick={onClose} type="button"><X /></button>
        </header>

        <div className="scale-tools reference-tools">
          <label>
            <Search aria-hidden="true" />
            <span className="sr-only">{t("Pesquisar nas Referências")}</span>
            <input
              autoFocus
              placeholder={t("Pesquisar regra, opção, termo em PT ou EN…")}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (tab === "catalog") setCatalogLimit(48);
              }}
            />
          </label>
          {(tab === "catalog" || tab === "rules") && (
            <span aria-label={t("Idioma do site")} className="catalog-language-toggle">
              <button aria-pressed={displayLanguage === "pt"} onClick={() => setLanguage("pt")} type="button">PT</button>
              <button aria-pressed={displayLanguage === "en"} onClick={() => setLanguage("en")} type="button">EN</button>
            </span>
          )}
        </div>

        <nav aria-label={t("Conteúdo das Referências")} className="scale-tabs reference-tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              aria-pressed={tab === id}
              className={tab === id ? "is-active" : ""}
              key={id}
              onClick={() => {
                setTab(id);
                setQuery("");
                setCatalogLimit(48);
              }}
              type="button"
            >
              <Icon aria-hidden="true" /><span>{t(label)}</span>
            </button>
          ))}
        </nav>

        <div className="scale-content">
          {tab === "rules" && (
            <section aria-labelledby="rules-reference-title">
              <ScaleHeading
                id="rules-reference-title"
                title="Regras da ficha"
                text={`${ruleReferenceEntries.length} tópicos consultáveis. Cada um informa o nível de automação e sua fonte no material fornecido.`}
              />
              <div className="reference-catalog-toolbar">
                <label>
                  <span>{t("Tipo de tópico")}</span>
                  <select
                    value={ruleKind}
                    onChange={(event) => setRuleKind(event.target.value as "all" | RuleReferenceKind)}
                  >
                    <option value="all">{t("Todos os tópicos")} ({ruleReferenceEntries.length})</option>
                    <option value="rule">{t("Regras gerais")}</option>
                    <option value="condition">{t("Condições")}</option>
                    <option value="action">{t("Ações")}</option>
                    <option value="scene">{t("Tipos de cena")}</option>
                    <option value="hazard">{t("Perigos ambientais")}</option>
                  </select>
                </label>
                <strong>{visibleRules.length} {t(visibleRules.length === 1 ? "resultado" : "resultados")}</strong>
              </div>
              <div className="reference-rule-grid">
                {visibleRules.map((entry) => {
                  const localized = localizeRuleReference(
                    entry,
                    displayLanguage,
                  );
                  return <article key={entry.id}>
                    <header>
                      <small>{localized.category}</small>
                      <CoverageBadge coverage={entry.coverage} />
                    </header>
                    <h3>{localized.title}</h3>
                    <p>{localized.summary}</p>
                    {localized.formula && <code>{localized.formula}</code>}
                    <footer className="reference-source">
                      <BookOpen aria-hidden="true" />
                      <span>
                        {displayLanguage === "en" ? "Provided 4E compilation" : entry.source.document} · {displayLanguage === "en" ? entry.source.chapterEn : entry.source.chapter} · PDF pp. {entry.source.pages}
                      </span>
                    </footer>
                  </article>;
                })}
              </div>
              {!visibleRules.length && <ReferenceEmpty />}
            </section>
          )}

          {tab === "catalog" && (
            <section aria-labelledby="catalog-reference-title">
              <ScaleHeading
                id="catalog-reference-title"
                title="Opções para criação"
                text={displayLanguage === "en"
                  ? `${referenceCatalogTotal} searchable options in Portuguese and English. Your choices remain free and editable.`
                  : `${referenceCatalogTotal} opções pesquisáveis em português e inglês. Suas escolhas continuam livres e editáveis.`}
              />
              <div className="reference-catalog-toolbar">
                <label>
                  <span>{t("Grupo")}</span>
                  <select
                    value={catalogGroup}
                    onChange={(event) => {
                      setCatalogGroup(event.target.value);
                      setCatalogLimit(48);
                    }}
                  >
                    <option value="all">{t("Todos os grupos")} ({referenceCatalogTotal})</option>
                    {referenceCatalogGroups.map((group) => (
                      <option key={group.id} value={group.id}>{t(group.label)} ({group.items.length})</option>
                    ))}
                  </select>
                </label>
                <strong>{visibleCatalog.length} {t(visibleCatalog.length === 1 ? "resultado" : "resultados")}</strong>
              </div>
              <div className="reference-catalog-grid">
                {visibleCatalog.slice(0, catalogLimit).map(({ entry, group }) => {
                  const primary = getCatalogName(entry, displayLanguage);
                  const secondary = displayLanguage === "pt" ? entry.canonical : entry.label;
                  return (
                    <article key={`${group.id}:${entry.id}`}>
                      <small>{t(group.label)} · {getCatalogCategory(entry.category, displayLanguage)}</small>
                      <h3>{primary}</h3>
                      {normalize(primary) !== normalize(secondary) && <em>{secondary}</em>}
                      <p>{getCatalogSummary(entry, displayLanguage)}</p>
                      <footer className="reference-source">
                        <BookOpen aria-hidden="true" />
                        <span>
                          {displayLanguage === "en" ? "Provided 4E compilation" : group.source.document} · {displayLanguage === "en" ? group.source.chapterEn : group.source.chapter} · PDF pp. {group.source.pages}
                        </span>
                      </footer>
                    </article>
                  );
                })}
              </div>
              {visibleCatalog.length > catalogLimit && (
                <button
                  className="reference-load-more"
                  onClick={() => setCatalogLimit((current) => current + 48)}
                  type="button"
                >
                  {t("Mostrar mais")} · {visibleCatalog.length - catalogLimit} {t(visibleCatalog.length - catalogLimit === 1 ? "resultado restante" : "resultados restantes")}
                </button>
              )}
              {!visibleCatalog.length && <ReferenceEmpty />}
            </section>
          )}

          {tab === "abilities" && (
            <section aria-labelledby="ability-scale-title">
              <ScaleHeading id="ability-scale-title" title="Escala de atributos" text="A graduação 0 representa a média humana e −5 é o mínimo normal. Os marcos ajudam a interpretar cada valor, sem impor um teto." />
              <ScaleCalculator label="Graduação do atributo" value={abilityRank} min={-5} onChange={setAbilityRank}>
                <strong>{ability.label}</strong><p>{ability.detail}</p>
              </ScaleCalculator>
              <div className="scale-anchor-grid">
                {abilityBenchmarkAnchors.filter((entry) => matches(`${entry.rank} ${entry.label}`)).map((entry) => (
                  <button className={abilityRank === entry.rank ? "is-current" : ""} key={entry.rank} onClick={() => setAbilityRank(entry.rank)} type="button"><b>{signed(entry.rank)}</b><span>{entry.label}</span></button>
                ))}
              </div>
              <p className="scale-footnote">Valores entre os marcos recebem uma descrição de intervalo; 20+ continua sendo cósmico ou divino.</p>
            </section>
          )}

          {tab === "skills" && (
            <section aria-labelledby="skill-scale-title">
              <ScaleHeading id="skill-scale-title" title="Perícias e testes" text="O modificador reúne atributo, graduações, especialização e outros ajustes. Em um teste de rotina, o dado vale 10." />
              <ScaleCalculator label="Modificador total" value={skillModifier} onChange={setSkillModifier}>
                <strong>{skill.label} · rotina {skill.routineResult}</strong><p>{skill.detail}</p>
              </ScaleCalculator>
              <ReferenceCalculator
                title="Resolver um teste graduado"
                text="Informe o resultado escolhido do d20, os ajustes da situação e a CD. Com dados extras, use o maior resultado para bônus ou o menor para penalidade. Um 20 acrescenta +5; um 1 aplica −5."
                resultClass={check.success ? "is-success" : "is-failure"}
                result={
                  <>
                    <strong>Total {check.total} · {check.label}</strong>
                    <span>
                      Rotina {routine.total}
                      {check.addedAdjustment !== 0 && ` · ajuste de ${signed(check.addedAdjustment)} pelo resultado do dado`}
                    </span>
                  </>
                }
              >
                <CompactNumberField label="d20" value={checkDie} min={1} max={20} onChange={setCheckDie} />
                <CompactNumberField label="Modificador" value={skillModifier} onChange={setSkillModifier} />
                <CompactNumberField label="Circunstância" value={checkCircumstance} onChange={setCheckCircumstance} />
                <CompactNumberField label="CD" value={checkDifficulty} onChange={setCheckDifficulty} />
              </ReferenceCalculator>
              <div className="skill-benchmark-strip">
                {skillBenchmarkAnchors.filter((entry) => matches(`${entry.modifier} ${entry.label} ${entry.routineDc}`)).map((entry) => (
                  <button key={entry.modifier} onClick={() => setSkillModifier(entry.modifier)} type="button"><b>+{entry.modifier}</b><span>{entry.label}</span><small>Rotina CD {entry.routineDc}</small></button>
                ))}
              </div>
              <div className="difficulty-grid" aria-label="Classes de Dificuldade">
                {difficultyBenchmarks.filter((entry) => matches(`${entry.dc} ${entry.label} ${entry.example}`)).map((entry) => (
                  <article key={entry.dc}><b>CD {entry.dc}</b><strong>{entry.label}</strong><span>{entry.example}</span></article>
                ))}
              </div>
            </section>
          )}

          {tab === "power-level" && (
            <section aria-labelledby="pl-scale-title">
              <ScaleHeading id="pl-scale-title" title="Níveis de Poder" text="Os marcos mais comuns vão do NP 5 ao NP 20 ou mais. As fórmulas funcionam em qualquer NP não negativo." />
              <ScaleCalculator label="Nível de Poder" value={powerLevel} min={0} onChange={setPowerLevel}>
                <strong>NP {pl.powerLevel}</strong><p>{pl.recommendedPoints} PP iniciais sugeridos. Limites pareados {pl.pairedLimit}, perícia {pl.skillLimit}, iniciativa {pl.initiativeLimit} e {pl.heroicUses} {pl.heroicUses === 1 ? "uso heroico" : "usos heroicos"} por aventura.</p>
              </ScaleCalculator>
              <div className="pl-metric-grid">
                <ScaleMetric label="PP sugeridos" value={pl.recommendedPoints} />
                <ScaleMetric label="Ataque + efeito" value={pl.pairedLimit} />
                <ScaleMetric label="Defesa + Robustez" value={pl.pairedLimit} />
                <ScaleMetric label="Fortitude + Vontade" value={pl.pairedLimit} />
                <ScaleMetric label="Máximo de perícia" value={pl.skillLimit} />
                <ScaleMetric label="Máximo de iniciativa" value={pl.initiativeLimit} />
                <ScaleMetric label="Usos heroicos por aventura" value={pl.heroicUses} />
              </div>
              <div className="pl-level-grid">
                {Array.from({ length: 16 }, (_, index) => index + 5).filter((level) => matches(`NP ${level} ${level * 15} PP`)).map((level) => {
                  const metrics = getPowerLevelMetrics(level);
                  return <button className={powerLevel === level ? "is-current" : ""} key={level} onClick={() => setPowerLevel(level)} type="button"><strong>NP {level}</strong><span>{metrics.recommendedPoints} PP</span><small>limites pareados {metrics.pairedLimit} · perícia {metrics.skillLimit}</small></button>;
                })}
              </div>
            </section>
          )}

          {tab === "effects" && (
            <section aria-labelledby="effect-scale-title">
              <ScaleHeading id="effect-scale-title" title="Efeitos e resistência" text="A graduação define a potência mecânica. O efeito, os descritores e a resistência determinam o resultado na cena." />
              <ScaleCalculator label="Graduação do efeito" value={effectRank} min={0} onChange={setEffectRank}>
                <strong>{effect.label}</strong><p>{effect.detail}</p>
              </ScaleCalculator>
              <div className="pl-metric-grid">
                <ScaleMetric label="Carga por Força igual" value={getLiftingBenchmark(effectRank).mass} />
                <ScaleMetric label="Movimento por rodada" value={getSpeedBenchmark(effectRank).distancePerRound} />
                <ScaleMetric label="CD básica do efeito" value={10 + effectRank} />
              </div>
              <ReferenceCalculator
                title="Resolver resistência a dano"
                text="Cada condição Ferido reduz a próxima resistência em 1. O resultado já inclui os graus e as condições cumulativas."
                resultClass={damageResultClass}
                result={
                  <>
                    <strong>{damage.checkRequired ? `Total ${damage.total} contra CD ${damage.difficultyClass}` : "Efeito resistido sem teste"}</strong>
                    <span>{damage.label} · {damage.summary}{damage.specialRule && ` · ${damage.specialRule}`}</span>
                  </>
                }
              >
                <CompactSelectField
                  label="Grau de resistência"
                  value={damageResistanceDegree}
                  onChange={(value) => setDamageResistanceDegree(value as DamageResistanceDegree)}
                  options={damageResistanceOptions}
                />
                <CompactNumberField label="d20" value={damageDie} min={1} max={20} onChange={setDamageDie} />
                <CompactNumberField label="Resistência" value={damageResistance} onChange={setDamageResistance} />
                <CompactNumberField label="Graduação do dano" value={effectRank} min={0} onChange={setEffectRank} />
                <CompactNumberField label="Feridos acumulados" value={damageHits} min={0} onChange={setDamageHits} />
                {(damageResistanceDegree === "impervious" || damageResistanceDegree === "improved") && (
                  <CompactNumberField label={`Graduação ${damageResistanceDegree === "impervious" ? "Impenetrável" : "Aprimorada"}`} value={damageSpecialRank} min={0} onChange={setDamageSpecialRank} />
                )}
                {damageResistanceDegree === "improved" && effectRank <= damageSpecialRank && (
                  <CompactNumberField label="Dado bônus" value={damageBonusDie} min={1} max={20} onChange={setDamageBonusDie} />
                )}
              </ReferenceCalculator>
              <p className="scale-footnote">Ataques, áreas, extras, falhas e descritores podem alterar a resolução. A auditoria aplica os limites à configuração salva na ficha.</p>
            </section>
          )}

          {tab === "measures" && (
            <section aria-labelledby="measure-scale-title">
              <ScaleHeading id="measure-scale-title" title="Graduações e medidas" text="Massa, tempo, distância e volume são aproximações. Cada +1 dobra o valor e cada −1 o reduz pela metade." />
              <ScaleCalculator label="Graduação de medida" value={measureRank} onChange={setMeasureRank}>
                <strong>Graduação {signed(measure.rank)}</strong><p>Massa {measure.mass} · tempo {measure.time} · distância {measure.distance} · volume {measure.volume}. {measure.note}</p>
              </ScaleCalculator>
              <div className="measurement-relations" aria-label="Cálculos entre medidas">
                <header>
                  <h4>Relações entre medidas</h4>
                  <p>Use graduações para estimar percurso, duração de viagem e distância de arremesso.</p>
                </header>
                <article>
                  <div className="compact-number-grid">
                    <CompactNumberField label="Velocidade" value={movementSpeedRank} onChange={setMovementSpeedRank} />
                    <CompactNumberField label="Tempo" value={travelTimeRank} onChange={setTravelTimeRank} />
                  </div>
                  <p>Distância <strong>{signed(travelDistance.rank)} · {travelDistance.value}</strong></p>
                  <code>{travelDistance.formula}</code>
                </article>
                <article>
                  <div className="compact-number-grid">
                    <CompactNumberField label="Distância" value={travelDistanceRank} onChange={setTravelDistanceRank} />
                    <CompactNumberField label="Velocidade" value={movementSpeedRank} onChange={setMovementSpeedRank} />
                  </div>
                  <p>Tempo <strong>{signed(travelTime.rank)} · {travelTime.value}</strong></p>
                  <code>{travelTime.formula}</code>
                </article>
                <article>
                  <div className="compact-number-grid">
                    <CompactNumberField label="Força" value={throwStrengthRank} onChange={setThrowStrengthRank} />
                    <CompactNumberField label="Massa" value={throwMassRank} onChange={setThrowMassRank} />
                  </div>
                  <p>Distância <strong>{signed(throwingDistance.rank)} · {throwingDistance.value}</strong></p>
                  <code>{throwingDistance.formula}</code>
                </article>
              </div>
              <div className="measurement-table" aria-label="Tabela métrica de medidas">
                <div className="measurement-head" aria-hidden="true"><b>Grad.</b><b>Massa</b><b>Tempo</b><b>Distância</b><b>Volume</b></div>
                {measurementScale.filter((entry) => matches(`${entry.rank} ${entry.mass} ${entry.time} ${entry.distance} ${entry.volume}`)).map((entry) => (
                  <button className={measureRank === entry.rank ? "is-current" : ""} key={entry.rank} onClick={() => setMeasureRank(entry.rank)} type="button"><strong>{signed(entry.rank)}</strong><span data-label="Massa">{entry.mass}</span><span data-label="Tempo">{entry.time}</span><span data-label="Distância">{entry.distance}</span><span data-label="Volume">{entry.volume}</span></button>
                ))}
              </div>
              <section className="size-reference" aria-labelledby="size-reference-title">
                <header>
                  <h4 id="size-reference-title">
                    {displayLanguage === "en" ? "Natural size" : "Tamanho natural"}
                  </h4>
                  <p>
                    {displayLanguage === "en"
                      ? "The published table is exact from −5 to 5. Choosing natural size costs no PP and is permanent."
                      : "A tabela publicada é exata de −5 a 5. Escolher o tamanho natural não custa PP e é permanente."}
                  </p>
                </header>
                <div className="size-profile-grid">
                  {sizeProfiles
                    .filter((entry) => matches(`${entry.rank} ${entry.label} ${entry.canonical} ${entry.space} ${entry.reach}`))
                    .map((entry) => (
                      <article key={entry.rank}>
                        <strong>{signed(entry.rank)}</strong>
                        <span>{displayLanguage === "en" ? entry.canonical : entry.label}</span>
                        <small>
                          {displayLanguage === "en" ? "space" : "espaço"} {entry.space} · {displayLanguage === "en" ? "reach" : "alcance"} {entry.reach}
                        </small>
                      </article>
                    ))}
                </div>
                <footer className="reference-source">
                  <BookOpen aria-hidden="true" />
                  <span>
                    {displayLanguage === "en" ? "Provided 4E compilation" : "Compilação fornecida da 4E"} · {displayLanguage === "en" ? "Chapter 3 · Abilities" : "Capítulo 3 · Atributos"} · PDF pp. 116–117
                  </span>
                </footer>
              </section>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

function CoverageBadge({ coverage }: { coverage: RuleReferenceCoverage }) {
  const { t } = useLocale();
  const labels: Record<RuleReferenceCoverage, string> = {
    automatic: "Calculado",
    assisted: "Assistido",
    reference: "Na mesa",
  };
  return <span className={`reference-coverage coverage-${coverage}`}>{t(labels[coverage])}</span>;
}

function ReferenceEmpty() {
  const { t } = useLocale();
  return <div className="reference-empty"><Search aria-hidden="true" /><strong>{t("Nenhum resultado")}</strong><span>{t("Tente outro termo ou limpe a pesquisa.")}</span></div>;
}

function ScaleHeading({ id, title, text }: { id: string; title: string; text: string }) {
  const { t } = useLocale();
  return <header className="scale-heading"><h3 id={id}>{t(title)}</h3><p>{t(text)}</p></header>;
}

function ScaleCalculator({
  label,
  value,
  min,
  onChange,
  children,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
  children: React.ReactNode;
}) {
  const { t } = useLocale();
  return (
    <div className="scale-calculator">
      <label>
        <span>{t(label)}</span>
        <input
          inputMode="numeric"
          min={min}
          onChange={(event) => {
            const numeric = Number(event.target.value);
            if (Number.isFinite(numeric)) {
              onChange(Math.max(min ?? -Number.MAX_SAFE_INTEGER, Math.trunc(numeric)));
            }
          }}
          step={1}
          type="number"
          value={value}
        />
      </label>
      <div>{children}</div>
    </div>
  );
}

function ScaleMetric({ label, value }: { label: string; value: React.ReactNode }) {
  const { t } = useLocale();
  return <div><span>{t(label)}</span><strong>{value}</strong></div>;
}

function ReferenceCalculator({
  title,
  text,
  result,
  resultClass,
  children,
}: {
  title: string;
  text: string;
  result: React.ReactNode;
  resultClass: string;
  children: React.ReactNode;
}) {
  const { t } = useLocale();
  return (
    <section className="reference-calculator">
      <header><h4>{t(title)}</h4><p>{t(text)}</p></header>
      <div className="compact-number-grid">{children}</div>
      <div aria-live="polite" className={`reference-calculator-result ${resultClass}`}>{result}</div>
    </section>
  );
}

function CompactNumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  const { t } = useLocale();
  return (
    <label className="compact-number-field">
      <span>{t(label)}</span>
      <input
        inputMode="numeric"
        max={max}
        min={min}
        onChange={(event) => {
          const numeric = Number(event.target.value);
          if (!Number.isFinite(numeric)) return;
          onChange(Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min ?? -Number.MAX_SAFE_INTEGER, Math.trunc(numeric))));
        }}
        step={1}
        type="number"
        value={value}
      />
    </label>
  );
}

function CompactSelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const { t } = useLocale();
  return (
    <label className="compact-number-field">
      <span>{t(label)}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
      </select>
    </label>
  );
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
