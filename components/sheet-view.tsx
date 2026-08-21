"use client";

import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  Brain,
  CheckCircle2,
  Dumbbell,
  Gauge,
  Gamepad2,
  HeartPulse,
  Info,
  Link2,
  Move,
  Shield,
  Sparkles,
  Swords,
  UserRound,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";
import {
  abilityAbbreviations,
  abilityLabels,
  coreAbilityKeys,
  getEffectiveAbsentTraits,
  isResistanceAbsent,
  resistanceKeys,
  resistanceLabels,
  type CharacterSheet,
  type CoreAbilityKey,
} from "../lib/character";
import {
  getAttackCalculation,
  getDerivedTraits,
  getEffectCostBreakdown,
  getEquipmentTotals,
  getHeroicAdvantageCapacity,
  getLuckCapacity,
  getPointBreakdown,
  getPointBudget,
  getPowerEntryCost,
  getRuleAudit,
  getSkillTotal,
  type RuleStatus,
} from "../lib/rules";
import { useLocale } from "./locale-provider";
import {
  buildTypeLabel,
  relationshipKindLabel,
  translateRuleText,
} from "../lib/localization";
import type { MessageKey } from "../lib/messages";
import { getSizeProfile } from "../lib/scales";

type SheetViewProps = {
  sheet: CharacterSheet;
  shared?: boolean;
  showAudit?: boolean;
};

type SheetSectionKey =
  | "identity"
  | "traits"
  | "audit"
  | "skills"
  | "advantages"
  | "movement"
  | "relations"
  | "powers"
  | "attacks"
  | "equipment"
  | "session"
  | "complications"
  | "resources"
  | "points"
  | "notes";

type MessageLookup = (key: MessageKey) => string;

const abilityIcons: Record<CoreAbilityKey, typeof Dumbbell> = {
  strength: Dumbbell,
  stamina: HeartPulse,
  agility: Zap,
  intellect: Brain,
  awareness: Activity,
  presence: UserRound,
};

export function SheetView({
  sheet,
  shared = false,
  showAudit = false,
}: SheetViewProps) {
  const { language, t, m } = useLocale();
  const derived = getDerivedTraits(sheet);
  const absentTraits = getEffectiveAbsentTraits(sheet);
  const size = getSizeProfile(sheet.sizeRank);
  const sizeSpace = size.space ?? (language === "en" ? "to define" : "a definir");
  const sizeReach = size.reach ?? (language === "en" ? "to define" : "a definir");
  const breakdown = getPointBreakdown(sheet);
  const budget = getPointBudget(sheet);
  const audit = showAudit ? getRuleAudit(sheet) : null;
  const remaining = budget - breakdown.total;
  const equipment = getEquipmentTotals(sheet);
  const heroicAdvantageCapacity = getHeroicAdvantageCapacity(sheet);
  const sectionOrder: SheetSectionKey[] = ["identity", "traits"];
  if (audit) sectionOrder.push("audit");
  sectionOrder.push("skills", "advantages");
  if (sheet.movement.length > 0 || sheet.senses.length > 0) {
    sectionOrder.push("movement");
  }
  if (sheet.relationships.length > 0 || sheet.organizations.length > 0) {
    sectionOrder.push("relations");
  }
  sectionOrder.push("powers", "attacks", "equipment");
  if (sheet.session.active) sectionOrder.push("session");
  sectionOrder.push("complications", "resources", "points");
  if (sheet.notes) sectionOrder.push("notes");
  const sectionNumber = (key: SheetSectionKey) =>
    String(sectionOrder.indexOf(key) + 1).padStart(2, "0");

  return (
    <article
      className={`sheet-document ${showAudit ? "with-audit" : "is-clean"}`}
      aria-label={
        showAudit
          ? t("Ficha do personagem com auditoria")
          : t("Ficha limpa do personagem")
      }
      style={{ "--sheet-accent": sheet.accent } as React.CSSProperties}
    >
      <header className="sheet-cover">
        <div className="sheet-cover-image">
          {sheet.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sheet.imageUrl}
              alt={`Retrato de ${sheet.heroName}`}
            />
          ) : (
            <div className="portrait-fallback" aria-hidden="true">
              <Sparkles />
            </div>
          )}
        </div>

        <div className="sheet-cover-copy">
          <p className="eyebrow">
            {shared
              ? t("Ficha compartilhada")
              : sheet.buildType === "npc"
                ? t("Ficha de NPC")
                : t("Ficha ativa")}
          </p>
          <h1>{sheet.heroName || t("Personagem sem nome")}</h1>
          <p className="sheet-concept">
            {sheet.concept || t("Conceito ainda não registrado.")}
          </p>
          <div className="sheet-cover-meta">
            <span>
              <strong>{m("common.powerLevelShort")} {sheet.powerLevel}</strong>
              {t("Nível de Poder")}
            </span>
            <span>
              <strong>
                {breakdown.total}/{budget}
              </strong>
              {t("Pontos de Poder")}
            </span>
            <span>
              <strong>{remaining}</strong>
              {t("Saldo")}
            </span>
          </div>
          {audit && <AuditPill status={audit.status} />}
        </div>
      </header>

      <section className="sheet-section identity-grid">
        <SectionHeading
          icon={UserRound}
          index={sectionNumber("identity")}
          title="Identidade"
        />
        <DataCell label="Identidade civil" value={sheet.civilName} />
        <DataCell label="Codinome" value={sheet.codename} />
        <DataCell label="Jogador" value={sheet.player} />
        <DataCell label="Campanha" value={sheet.campaign} />
        <DataCell label="Arquétipo" value={sheet.archetype} />
        <DataCell
          label="Tamanho"
          value={`${sheet.sizeRank >= 0 ? "+" : ""}${sheet.sizeRank} · ${language === "en" ? size.canonical : size.label} · ${language === "en" ? "space" : "espaço"} ${sizeSpace} · ${language === "en" ? "reach" : "alcance"} ${sizeReach}`}
        />
        <DataCell
          label="Tipo"
          value={
            buildTypeLabel(sheet.buildType, language)
          }
        />
        <DataCell label="Origem" value={sheet.origin} />
        <DataCell label="Descritores" value={sheet.descriptors} wide />
        <DataCell
          label="Personalidade e motivação"
          value={sheet.personality}
          wide
        />
        <DataCell label="Aparência" value={sheet.appearance} wide />
      </section>

      <section className="sheet-section">
        <SectionHeading
          icon={Activity}
          index={sectionNumber("traits")}
          title="Atributos e derivados"
        />
        <div className="stat-grid">
          {coreAbilityKeys.map((key) => {
            const Icon = abilityIcons[key];
            const base = sheet.abilities[key];
            const total = derived.abilities[key];
            const absent = absentTraits.has(key);
            return (
              <div className="stat-cell" key={key}>
                <Icon size={17} aria-hidden="true" />
                <span>
                  {t(abilityLabels[key])}{" "}
                  <small>{abilityAbbreviations[key]}</small>
                </span>
                <strong>{absent ? "—" : signed(total)}</strong>
                {absent ? (
                  <em>{t("Ausente")}</em>
                ) : (
                  base !== total && <em>base {signed(base)}</em>
                )}
              </div>
            );
          })}
        </div>

        <div className="combat-stat-grid">
          <Stat label="Ataque base" value={absentTraits.has("attack") ? null : derived.attack} />
          <Stat label="Ataque corpo a corpo" value={absentTraits.has("attack") ? null : derived.closeAttack} />
          <Stat label="Ataque à distância" value={absentTraits.has("attack") ? null : derived.rangedAttack} />
          <Stat label="Defesa base" value={absentTraits.has("defense") ? null : derived.defense} />
          <Stat label="Defesa corpo a corpo" value={absentTraits.has("defense") ? null : derived.closeDefense} />
          <Stat label="Defesa à distância" value={absentTraits.has("defense") ? null : derived.rangedDefense} />
          <Stat label="Iniciativa" value={absentTraits.has("agility") ? null : derived.initiative} />
          <Stat label="CD de Defesa base" value={absentTraits.has("defense") ? null : derived.defense + 10} />
        </div>

        <div className="resistance-grid">
          {resistanceKeys.map((key) => (
            <Stat
              key={key}
              label={resistanceLabels[key]}
              value={isResistanceAbsent(sheet, key) ? null : derived.resistances[key]}
            />
          ))}
        </div>
      </section>

      {audit && (
        <section className="sheet-section">
          <SectionHeading
            icon={BadgeCheck}
            index={sectionNumber("audit")}
            title="Auditoria das regras"
          />
          <div className={`audit-summary-view status-${audit.status}`}>
            <AuditIcon status={audit.status} />
            <div>
              <strong>{auditTitle(audit.status)}</strong>
              <span>
                {formatCount(audit.failures, "erro", "erros")} ·{" "}
                {formatCount(
                  audit.attentions,
                  "aviso pendente",
                  "avisos pendentes",
                )}
                {audit.approvals > 0 &&
                  ` · ${formatCount(audit.approvals, "aprovado", "aprovados")}`}
              </span>
            </div>
          </div>
          <div className="pl-checks">
            {audit.checks.map((check) => (
              <div
                className={`pl-check status-${check.status}`}
                key={check.key}
              >
                <AuditIcon status={check.status} />
                <span>{translateRuleText(check.label, language)}</span>
                {typeof check.value === "number" && (
                  <strong>
                    {formatNumber(check.value)}
                    {typeof check.limit === "number" && (
                      <small> / {formatNumber(check.limit)}</small>
                    )}
                  </strong>
                )}
                <p>{translateRuleText(check.detail, language)}</p>
                {check.reviewDecision &&
                  check.reviewDecision !== "pending" && (
                    <small className="audit-decision-note">
                      {check.reviewDecision === "approved"
                        ? "Aviso aprovado pela mesa."
                        : "Aviso reprovado e registrado como erro."}
                    </small>
                  )}
              </div>
            ))}
          </div>
        </section>
      )}

      <TwoColumnSection>
        <section className="sheet-section">
          <SectionHeading
            icon={BookOpen}
            index={sectionNumber("skills")}
            title="Perícias"
          />
          <DataTable
            empty="Nenhuma perícia graduada."
            rows={sheet.skills
              .filter(
                (skill) =>
                  skill.rank ||
                  skill.specializationRank ||
                  skill.miscellaneousModifier,
              )
              .map((skill) => {
                const total = getSkillTotal(skill, derived);
                const unavailable = absentTraits.has(skill.ability);
                const cells = [
                  skill.specialization
                    ? `${skill.name}: ${skill.specialization}`
                    : skill.name,
                  abilityAbbreviations[skill.ability],
                  `${skill.rank}+${skill.specializationRank}`,
                  unavailable ? "—" : signed(total),
                ];
                if (showAudit) {
                  cells.push(
                    unavailable
                      ? t("Ausente")
                      : total <= sheet.powerLevel + 10
                        ? "✓"
                        : "✕",
                  );
                }
                return cells;
              })}
            headers={
              showAudit
                ? ["Perícia", "Hab.", "Grad.", "Total", m("common.powerLevelShort")]
                : ["Perícia", "Hab.", "Grad.", "Total"]
            }
          />
        </section>

        <section className="sheet-section">
          <SectionHeading
            icon={BadgeCheck}
            index={sectionNumber("advantages")}
            title="Vantagens"
          />
          <EntryList
            empty="Nenhuma vantagem registrada."
            entries={sheet.advantages.map((item) => ({
              title: `${item.name}${item.rank > 1 ? ` ${item.rank}` : ""}`,
              meta: `${item.categories.join(" · ")}${item.kind === "equipment" ? " · 5 PE por graduação" : ""}`,
              body: item.notes,
            }))}
          />
          <div className="inline-rule-note">
            <strong>
              {heroicAdvantageCapacity}
            </strong>{" "}
            {heroicAdvantageCapacity === 1
              ? " graduação heroica comprada; "
              : " graduações heroicas compradas; "}
            <strong>{sheet.resources.heroicAdvantageUses}</strong>{" "}
            {sheet.resources.heroicAdvantageUses === 1
              ? "uso registrado"
              : "usos registrados"}{" "}
            nesta aventura.
          </div>
        </section>
      </TwoColumnSection>

      {(sheet.movement.length > 0 || sheet.senses.length > 0) && (
        <section className="sheet-section sheet-extended-section">
          <SectionHeading
            icon={Move}
            index={sectionNumber("movement")}
            title={m("sheet.movementSenses")}
          />
          <div className="linked-view-grid">
            {sheet.movement.map((entry) => (
              <article key={entry.id}>
                <strong>{entry.name}</strong>
                <span>{m("sheet.rank")} {entry.rank}</span>
                {entry.notes ? <p>{entry.notes}</p> : null}
              </article>
            ))}
            {sheet.senses.map((entry) => (
              <article key={entry.id}>
                <strong>{entry.name}</strong>
                <span>{m("sheet.rank")} {entry.rank}</span>
                {entry.details ? <p>{entry.details}</p> : null}
              </article>
            ))}
          </div>
        </section>
      )}

      {(sheet.relationships.length > 0 || sheet.organizations.length > 0) && (
        <section className="sheet-section sheet-extended-section">
          <SectionHeading
            icon={Link2}
            index={sectionNumber("relations")}
            title={m("sheet.relationshipsOrganizations")}
          />
          <EntryList
            empty={m("sheet.noLink")}
            entries={[
              ...sheet.relationships.map((entry) => ({
                title: entry.targetName || m("sheet.linkedSheet"),
                meta: relationshipKindLabel(entry.kind, language),
                body: entry.notes,
              })),
              ...sheet.organizations.map((entry) => ({
                title: entry.name,
                meta: entry.role || m("sheet.organization"),
                body: entry.notes,
              })),
            ]}
            columns
          />
        </section>
      )}

      <section className="sheet-section">
        <SectionHeading
          icon={Sparkles}
          index={sectionNumber("powers")}
          title="Poderes"
        />
        <div className="power-grid">
          {sheet.powers.length ? (
            sheet.powers.map((power) => {
              const entryCost = getPowerEntryCost(sheet, power.id);
              return (
                <article className="power-card power-card-v2" key={power.id}>
                  <div className="power-card-head">
                    <div>
                      <p>
                        {power.arrayRole === "none"
                          ? m("sheet.independentPower")
                          : `${arrayRoleLabel(power.arrayRole, m)} · ${power.arrayName || m("sheet.unnamedArray")}`}
                      </p>
                      <h3>{power.name || m("sheet.unnamedPower")}</h3>
                    </div>
                    <span>{entryCost?.chargedCost ?? 0} PP</span>
                  </div>
                  <div className="power-container-meta">
                    <small>
                      {power.active
                        ? m("sheet.activeLinks")
                        : m("sheet.inactiveLinks")}
                    </small>
                    {power.removable !== "none" && (
                      <small>{removableLabel(power.removable, m)}</small>
                    )}
                    {power.descriptors && (
                      <small>{power.descriptors}</small>
                    )}
                  </div>
                  <div className="power-effect-list">
                    {power.effects.map((effect) => {
                      const cost = getEffectCostBreakdown(effect);
                      return (
                        <section key={effect.id}>
                          <header>
                            <div>
                              <h4>{effect.name || "Efeito"}</h4>
                              <span>{m("sheet.rank")} {effect.rank}</span>
                            </div>
                            <strong>
                              {cost.total} PP
                              {!cost.complete && " · legado"}
                            </strong>
                          </header>
                          <div className="power-parameters">
                            <small>
                              {t("Ação")} <strong>{effect.action || "—"}</strong>
                            </small>
                            <small>
                              {t("Alcance")} <strong>{effect.range || "—"}</strong>
                            </small>
                            <small>
                              {t("Duração")}{" "}
                              <strong>{effect.duration || "—"}</strong>
                            </small>
                            <small>
                              {t("Resistência")}{" "}
                              <strong>{effect.resistance || "—"}</strong>
                            </small>
                          </div>
                          {cost.complete && cost.segments.length > 0 && (
                            <p>
                              <b>Custo:</b>{" "}
                              {cost.segments
                                .map(
                                  (segment) =>
                                    `${segment.ranks} grad. a ${segment.ratio}`,
                                )
                                .join(" + ")}
                              ; recursos +{cost.featureCost};
                              desvantagens -{cost.drawbackDiscount}.
                            </p>
                          )}
                          {effect.extras.length > 0 && (
                            <p>
                              <b>Extras:</b>{" "}
                              {effect.extras
                                .map(
                                  (item) =>
                                    `${item.name || "Extra"} +${item.value} por graduação${item.ranksApplied ? ` (${formatCount(item.ranksApplied, "graduação", "graduações")})` : ""}`,
                                )
                                .join("; ")}
                            </p>
                          )}
                          {effect.flaws.length > 0 && (
                            <p>
                              <b>Falhas:</b>{" "}
                              {effect.flaws
                                .map(
                                  (item) =>
                                    `${item.name || "Falha"} −${item.value} por graduação${item.ranksApplied ? ` (${formatCount(item.ranksApplied, "graduação", "graduações")})` : ""}`,
                                )
                                .join("; ")}
                            </p>
                          )}
                          {effect.features.length > 0 && (
                            <p>
                              <b>Recursos:</b>{" "}
                              {effect.features
                                .map(
                                  (item) =>
                                    `${item.name || "Recurso"} ${item.rank}`,
                                )
                                .join("; ")}
                            </p>
                          )}
                          {effect.drawbacks.length > 0 && (
                            <p>
                              <b>Desvantagens:</b>{" "}
                              {effect.drawbacks
                                .map(
                                  (item) =>
                                    `${item.name || "Desvantagem"} ${item.rank}`,
                                )
                                .join("; ")}
                            </p>
                          )}
                          {effect.traitLinks.length > 0 && (
                            <p>
                              <b>Vínculos:</b>{" "}
                              {effect.traitLinks
                                .map((link) => {
                                  const amount =
                                    link.mode === "per-rank"
                                      ? effect.rank * link.value
                                      : link.value;
                                  return link.mode === "reference"
                                    ? `${traitLabelsSafe(link.trait)} (graduações existentes)`
                                    : `${traitLabelsSafe(link.trait)} ${signed(amount)}`;
                                })
                                .join("; ")}
                            </p>
                          )}
                          {effect.notes && <p>{effect.notes}</p>}
                        </section>
                      );
                    })}
                  </div>
                  {power.notes && <p>{power.notes}</p>}
                </article>
              );
            })
          ) : (
            <EmptyState text="Nenhum poder registrado." />
          )}
        </div>
      </section>

      <TwoColumnSection>
        <section className="sheet-section">
          <SectionHeading
            icon={Swords}
            index={sectionNumber("attacks")}
            title="Ataques"
          />
          <DataTable
            empty="Nenhum ataque registrado."
            rows={sheet.attacks.map((attack) => {
              const calculation = getAttackCalculation(sheet, attack);
              const cells = [
                calculation.name,
                calculation.range === "no-check"
                  ? "Automático"
                  : signed(calculation.attackBonus),
                String(calculation.effectRank),
                String(calculation.effectDc),
              ];
              if (showAudit) {
                cells.push(
                  `${calculation.limitValue}/${calculation.limit}`,
                );
              }
              return cells;
            })}
            headers={
              showAudit
                ? ["Ataque", "Bônus", "Efeito", "CD", "Limite"]
                : ["Ataque", "Bônus", "Efeito", "CD"]
            }
          />
        </section>

        <section className="sheet-section">
          <SectionHeading
            icon={Wrench}
            index={sectionNumber("equipment")}
            title="Equipamento"
          />
          <div
            className={`inline-budget ${equipment.remaining >= 0 ? "is-valid" : "is-invalid"}`}
          >
            {equipment.used}/{equipment.allowance} PE · saldo{" "}
            {equipment.remaining}
          </div>
          <EntryList
            empty="Nenhum equipamento registrado."
            entries={sheet.equipment.map((item) => ({
              title: item.name,
              meta: `${item.type} · ${item.cost} PE${item.active ? " · ativo" : " · guardado"}`,
              body: item.details,
            }))}
          />
        </section>
      </TwoColumnSection>

      {sheet.session.active && (
        <section className="sheet-section sheet-session-section">
          <SectionHeading
            icon={Gamepad2}
            index={sectionNumber("session")}
            title={m("sheet.sessionState")}
          />
          <div className="resource-view-grid">
            <Stat label="Dano" value={sheet.session.damage} />
            <Stat label="Pontos Heroicos" value={sheet.session.heroPointsCurrent} />
            <Stat label="Sorte" value={sheet.session.luckCurrent} />
            <Stat label="Efeitos ativos" value={sheet.session.activeEffects.length} />
          </div>
          {sheet.session.conditions.length ? (
            <div className="condition-view-list">
              {sheet.session.conditions.map((condition) => (
                <span key={condition}>{condition}</span>
              ))}
            </div>
          ) : null}
          {sheet.session.notes ? <p className="long-copy">{sheet.session.notes}</p> : null}
        </section>
      )}

      <section className="sheet-section">
        <SectionHeading
          icon={Shield}
          index={sectionNumber("complications")}
          title="Complicações"
        />
        <EntryList
          empty="Nenhuma complicação registrada."
          entries={sheet.complications.map((item) => ({
            title: item.name,
            meta: item.type,
            body: item.description,
          }))}
          columns
        />
      </section>

      <TwoColumnSection>
        <section className="sheet-section">
          <SectionHeading
            icon={Gauge}
            index={sectionNumber("resources")}
            title="Recursos atuais"
          />
          <div className="resource-view-grid">
            <Stat label="Pontos Heroicos" value={sheet.resources.heroPoints} />
            <Stat
              label="Usos heroicos"
              value={sheet.resources.heroicAdvantageUses}
            />
            <Stat label="Sorte disponível" value={sheet.resources.luckCurrent} />
            <Stat label="Sorte calculada" value={getLuckCapacity(sheet)} />
          </div>
          <p className="inline-rule-note">
            Fadiga: <strong>{sheet.resources.fatigue}</strong>
          </p>
          {sheet.resources.conditions.length > 0 && (
            <div className="condition-view-list">
              {sheet.resources.conditions.map((condition) => (
                <span key={condition}>{condition}</span>
              ))}
            </div>
          )}
        </section>

        <section className="sheet-section">
          <SectionHeading
            icon={Gauge}
            index={sectionNumber("points")}
            title="Contabilidade calculada"
          />
          <div className="points-ledger">
            {(
              [
                ["Atributos", breakdown.abilities],
                ["Combate e iniciativa", breakdown.combat],
                ["Resistências", breakdown.resistances],
                ["Perícias", breakdown.skills],
                ["Vantagens", breakdown.advantages],
                ["Poderes", breakdown.powers],
                ["Ajuste documentado", breakdown.adjustments],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
            <div className="ledger-total">
              <span>Total gasto</span>
              <strong>{breakdown.total} PP</strong>
            </div>
          </div>
        </section>
      </TwoColumnSection>

      {sheet.notes && (
        <section className="sheet-section">
          <SectionHeading
            icon={BookOpen}
            index={sectionNumber("notes")}
            title="Histórico e notas"
          />
          <p className="long-copy">{sheet.notes}</p>
        </section>
      )}

      <footer className="sheet-footer">
        <span>Arquivo de Heróis</span>
        <span>{m("sheet.updated")} {formatDate(sheet.updatedAt, language)}</span>
      </footer>
    </article>
  );
}

function AuditPill({ status }: { status: RuleStatus }) {
  return (
    <span className={`sheet-audit-pill status-${status}`}>
      <AuditIcon status={status} />
      {auditTitle(status)}
    </span>
  );
}

function AuditIcon({ status }: { status: RuleStatus }) {
  if (status === "pass") return <CheckCircle2 aria-hidden="true" />;
  if (status === "fail") return <XCircle aria-hidden="true" />;
  if (status === "attention")
    return <AlertTriangle aria-hidden="true" />;
  return <Info aria-hidden="true" />;
}

function SectionHeading({
  icon: Icon,
  index,
  title,
}: {
  icon: typeof Activity;
  index: string;
  title: string;
}) {
  const { t } = useLocale();
  return (
    <header className="section-heading">
      <span>{index}</span>
      <Icon size={18} aria-hidden="true" />
      <h2>{t(title)}</h2>
    </header>
  );
}

function DataCell({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string;
  wide?: boolean;
}) {
  const { t } = useLocale();
  return (
    <div className={`data-cell ${wide ? "is-wide" : ""}`}>
      <span>{t(label)}</span>
      <p>{value || "—"}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  const { t } = useLocale();
  return (
    <div>
      <span>{t(label)}</span>
      <strong>{value === null ? "—" : signed(value)}</strong>
    </div>
  );
}

function TwoColumnSection({ children }: { children: React.ReactNode }) {
  return <div className="sheet-columns">{children}</div>;
}

function EntryList({
  entries,
  empty,
  columns = false,
}: {
  entries: { title: string; meta: string; body: string }[];
  empty: string;
  columns?: boolean;
}) {
  const { t } = useLocale();
  if (!entries.length) return <EmptyState text={t(empty)} />;
  return (
    <div className={`entry-list ${columns ? "has-columns" : ""}`}>
      {entries.map((entry, index) => (
        <article key={`${entry.title}-${index}`}>
          <p>{entry.meta}</p>
          <h3>{entry.title || t("Sem nome")}</h3>
          {entry.body && <span>{entry.body}</span>}
        </article>
      ))}
    </div>
  );
}

function DataTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  const { t } = useLocale();
  if (!rows.length) return <EmptyState text={t(empty)} />;
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{t(header)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, index) => (
                <td key={`${rowIndex}-${index}`}>{cell || "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="sheet-empty">{text}</p>;
}

function auditTitle(status: RuleStatus) {
  if (status === "pass") return "Ficha validada";
  if (status === "fail") return "Erros encontrados";
  if (status === "attention") return "Revisão pendente";
  return "Regras liberais · Narrador e NPCs";
}

function formatCount(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function arrayRoleLabel(role: string, m: MessageLookup) {
  if (role === "base") return m("array.base");
  if (role === "alternate") return m("array.alternate");
  if (role === "dynamic") return m("array.dynamic");
  return m("array.power");
}

function removableLabel(value: string, m: MessageLookup) {
  if (value === "removable") return m("power.removable");
  if (value === "easily-removable") return m("power.easilyRemovable");
  if (value === "equipment") return m("power.equipmentRank");
  return "";
}

function traitLabelsSafe(key: string) {
  const labels: Record<string, string> = {
    strength: "Força",
    stamina: "Vigor",
    agility: "Agilidade",
    intellect: "Intelecto",
    awareness: "Consciência",
    presence: "Presença",
    attack: "Ataque",
    closeAttack: "Ataque corpo a corpo",
    rangedAttack: "Ataque à distância",
    defense: "Defesa",
    closeDefense: "Defesa corpo a corpo",
    rangedDefense: "Defesa à distância",
    initiative: "Iniciativa",
    dodge: "Esquiva",
    fortitude: "Fortitude",
    toughness: "Robustez",
    will: "Vontade",
  };
  return labels[key] ?? key;
}

function signed(value: number) {
  const numeric = Number(value) || 0;
  return numeric > 0 ? `+${formatNumber(numeric)}` : formatNumber(numeric);
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatDate(value: string | undefined, language: "pt" | "en") {
  if (!value) return language === "en" ? "now" : "agora";
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}
