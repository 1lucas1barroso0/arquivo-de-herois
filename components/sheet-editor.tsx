"use client";

import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  Calculator,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleGauge,
  Crosshair,
  Info,
  LibraryBig,
  Link2,
  LockKeyhole,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
  Wrench,
  WandSparkles,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  abilityAbbreviations,
  abilityLabels,
  advantageCategories,
  combatLabels,
  conditions,
  coreAbilityKeys,
  createPower,
  createPowerEffect,
  getEffectiveAbsentTraits,
  isResistanceAbsent,
  newId,
  requiresSpecializedSkillCost,
  resistanceKeys,
  resistanceLabels,
  traitLabels,
  type AbsentTraitKey,
  type AdvantageCategory,
  type CharacterSheet,
  type CoreAbilityKey,
  type FlatModifierEntry,
  type PowerEffectEntry,
  type PowerEntry,
  type RankedModifierEntry,
  type ResistanceKey,
  type TraitLinkEntry,
} from "../lib/character";
import {
  CUSTOM_CATALOG_KEY,
  catalogSearchMatches,
  advantageCatalog,
  archetypeCatalog,
  attackSpecializationSuggestions,
  complicationCatalog,
  descriptorCatalog,
  drawbackCatalog,
  equipmentCatalog,
  extraCatalog,
  featureCatalog,
  findAdvantagePreset,
  findComplicationPreset,
  findEquipmentPreset,
  findPowerConfigurationPreset,
  findPowerEffectPreset,
  findSkillPreset,
  flawCatalog,
  getCatalogCategory,
  getCatalogName,
  getCatalogSummary,
  heroOriginCatalog,
  localizeCatalogSelection,
  motivationCatalog,
  normalizeCatalogText,
  powerConfigurationCatalog,
  powerEffectCatalog,
  resistanceSuggestions,
  skillCatalog,
  type AdvantagePreset,
  type CatalogEntry,
  type EquipmentPreset,
  type FlatModifierPreset,
  type PowerEffectPreset,
  type PowerConfigurationPreset,
  type RankedModifierPreset,
} from "../lib/catalog";
import {
  getAttackCalculation,
  getDerivedTraits,
  getEffectCostBreakdown,
  getEquipmentTotals,
  getHeroicAdvantageCapacity,
  getLuckCapacity,
  getMotivationState,
  getPointBreakdown,
  getPointBudget,
  getPowerEffectOptions,
  getPowerEntryCost,
  getRuleAudit,
  getSkillTotal,
  type RuleCheck,
  type RuleStatus,
} from "../lib/rules";
import type { EditingMode } from "../lib/guided";
import {
  applyPowerConfigurationPreset,
  applyPowerEffectPreset,
} from "../lib/power-configurations";
import {
  getAbilityBenchmark,
  getPowerLevelMetrics,
  getSizeProfile,
  getSkillBenchmark,
} from "../lib/scales";
import { useLocale } from "./locale-provider";
import { translateRuleText } from "../lib/localization";

type SheetEditorProps = {
  sheet: CharacterSheet;
  onChange: (sheet: CharacterSheet) => void;
  onImageUpload: (file: File) => Promise<void>;
  imageUploading: boolean;
  editingMode: EditingMode;
  onEditingMode: (mode: EditingMode) => void;
};

const sections = [
  { id: "identity", label: "Identidade", icon: UserRound },
  { id: "traits", label: "Atributos", icon: Activity },
  { id: "skills", label: "Perícias", icon: BookOpen },
  { id: "advantages", label: "Vantagens", icon: BadgeCheck },
  { id: "powers", label: "Poderes", icon: Sparkles },
  { id: "combat", label: "Combate", icon: Crosshair },
  { id: "equipment", label: "Equipamento", icon: Wrench },
  { id: "complications", label: "Complicações", icon: Shield },
  { id: "resources", label: "Recursos atuais", icon: CircleGauge },
  { id: "points", label: "Auditoria", icon: Calculator },
] as const;

type SectionId = (typeof sections)[number]["id"];
type EditorChildProps = {
  sheet: CharacterSheet;
  patch: (value: Partial<CharacterSheet>) => void;
};

export function SheetEditor({
  sheet,
  onChange,
  onImageUpload,
  imageUploading,
  editingMode,
  onEditingMode,
}: SheetEditorProps) {
  const { t } = useLocale();
  const [activeSection, setActiveSection] =
    useState<SectionId>("identity");
  const audit = useMemo(() => getRuleAudit(sheet), [sheet]);
  const breakdown = useMemo(() => getPointBreakdown(sheet), [sheet]);
  const budget = getPointBudget(sheet);
  const patch = (value: Partial<CharacterSheet>) =>
    onChange({ ...sheet, ...value });

  useEffect(() => {
    const openAudit = () => setActiveSection("points");
    window.addEventListener("arquivo-de-herois:abrir-auditoria", openAudit);
    return () =>
      window.removeEventListener("arquivo-de-herois:abrir-auditoria", openAudit);
  }, []);

  return (
    <div className="editor-shell">
      <nav className="editor-nav" aria-label={t("Seções da ficha")}>
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            className={activeSection === id ? "is-active" : ""}
            key={id}
            onClick={() => setActiveSection(id)}
            type="button"
          >
            <Icon size={16} aria-hidden="true" />
            <span>{t(label)}</span>
          </button>
        ))}
      </nav>

      <div className="editor-section">
        <EditingModePanel
          mode={editingMode}
          onMode={onEditingMode}
        />
        <LiveCalculationBar
          audit={audit.status}
          spent={breakdown.total}
          budget={budget}
          powerLevel={sheet.powerLevel}
          onOpenAudit={() => setActiveSection("points")}
        />
        <CreationAssistant
          sheet={sheet}
          audit={audit}
          editingMode={editingMode}
          activeSection={activeSection}
          onNavigate={setActiveSection}
        />

        {activeSection === "identity" && (
          <IdentityEditor
            sheet={sheet}
            patch={patch}
            onImageUpload={onImageUpload}
            imageUploading={imageUploading}
          />
        )}
        {activeSection === "traits" && (
          <TraitsEditor sheet={sheet} patch={patch} />
        )}
        {activeSection === "skills" && (
          <SkillsEditor sheet={sheet} patch={patch} />
        )}
        {activeSection === "advantages" && (
          <AdvantagesEditor sheet={sheet} patch={patch} />
        )}
        {activeSection === "powers" && (
          <PowersEditor sheet={sheet} patch={patch} />
        )}
        {activeSection === "combat" && (
          <CombatEditor sheet={sheet} patch={patch} />
        )}
        {activeSection === "equipment" && (
          <EquipmentEditor
            sheet={sheet}
            patch={patch}
            editingMode={editingMode}
          />
        )}
        {activeSection === "complications" && (
          <ComplicationsEditor sheet={sheet} patch={patch} />
        )}
        {activeSection === "resources" && (
          <ResourcesEditor
            sheet={sheet}
            patch={patch}
            editingMode={editingMode}
          />
        )}
        {activeSection === "points" && (
          <AuditEditor
            sheet={sheet}
            patch={patch}
            editingMode={editingMode}
            onEditingMode={onEditingMode}
          />
        )}
      </div>
    </div>
  );
}

function EditingModePanel({
  mode,
  onMode,
}: {
  mode: EditingMode;
  onMode: (mode: EditingMode) => void;
}) {
  const { t } = useLocale();
  return (
    <section className={`editing-mode-panel mode-${mode}`}>
      <div className="editing-mode-copy">
        <strong>
          {t(mode === "guided" ? "Criação assistida" : "Criação livre")}
        </strong>
        <small>
          {mode === "guided"
            ? t("Dependências seguras são mantidas automaticamente.")
            : t("Divergências permanecem visíveis, sem bloqueios.")}
        </small>
      </div>
      <div className="editing-mode-options" role="group" aria-label={t("Modo de edição")}>
        <button
          aria-pressed={mode === "guided"}
          className={mode === "guided" ? "is-active" : ""}
          onClick={() => onMode("guided")}
          type="button"
        >
          <LockKeyhole aria-hidden="true" /> {t("Assistido")}
        </button>
        <button
          aria-pressed={mode === "free"}
          className={mode === "free" ? "is-active" : ""}
          onClick={() => onMode("free")}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" /> {t("Livre")}
        </button>
      </div>
    </section>
  );
}

function CreationAssistant({
  sheet,
  audit,
  editingMode,
  activeSection,
  onNavigate,
}: {
  sheet: CharacterSheet;
  audit: ReturnType<typeof getRuleAudit>;
  editingMode: EditingMode;
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
}) {
  const { language, t } = useLocale();
  const motivation = getMotivationState(sheet);
  const firstProblem = audit.checks.find(
    (check) => check.status === "fail",
  ) ?? audit.checks.find((check) => check.status === "attention");
  const next: { id: SectionId; label: string; detail: string } | null =
    !sheet.concept.trim() || !sheet.origin.trim() || !sheet.archetype.trim()
      ? {
          id: "identity",
          label: "Completar identidade",
          detail: "Defina conceito, origem e arquétipo para orientar as escolhas.",
        }
      : !motivation.complete
        ? {
            id: "complications",
            label: motivation.present
              ? "Detalhar motivação"
              : "Escolher motivação",
            detail: motivation.present
              ? "A motivação já foi reconhecida; falta apenas explicar como ela orienta o personagem."
              : "Registre a motivação aqui ou no campo Personalidade e motivação.",
          }
        : firstProblem
          ? {
              id: sectionForRuleGroup(firstProblem.group),
              label: "Corrigir agora",
              detail: translateRuleText(
                `${firstProblem.label}: ${firstProblem.detail}`,
                language,
              ),
            }
          : null;

  if (!next) return null;

  return (
    <aside className="creation-assistant" aria-label={t("Assistente de criação")}>
      <div>
        <strong>
          {editingMode === "guided"
            ? "Orientação passo a passo"
            : "Orientação disponível no modo livre"}
        </strong>
        <p>{t(next.detail)}</p>
      </div>
      {activeSection !== next.id && (
        <button type="button" onClick={() => onNavigate(next.id)}>
          {t(next.label)}
        </button>
      )}
    </aside>
  );
}

function sectionForRuleGroup(
  group: RuleCheck["group"],
): SectionId {
  if (group === "equipment") return "equipment";
  if (group === "powers") return "powers";
  return "points";
}

function LiveCalculationBar({
  audit,
  spent,
  budget,
  powerLevel,
  onOpenAudit,
}: {
  audit: RuleStatus;
  spent: number;
  budget: number;
  powerLevel: number;
  onOpenAudit: () => void;
}) {
  const { t } = useLocale();
  const copy = statusCopy(audit);
  return (
    <button
      className={`live-calculation-bar status-${audit}`}
      onClick={onOpenAudit}
      type="button"
    >
      <span className="live-status">
        <StatusIcon status={audit} />
        <strong title={t(copy.detail)}>{t(copy.title)}</strong>
      </span>
      <span className="live-metric">
        <small>NP</small>
        <strong>{powerLevel}</strong>
      </span>
      <span className="live-metric">
        <small>PP</small>
        <strong>
          {spent}/{budget}
        </strong>
      </span>
      <span className="live-metric">
        <small>{t("Saldo")}</small>
        <strong>{budget - spent}</strong>
      </span>
    </button>
  );
}

function IdentityEditor({
  sheet,
  patch,
  onImageUpload,
  imageUploading,
}: EditorChildProps & {
  onImageUpload: (file: File) => Promise<void>;
  imageUploading: boolean;
}) {
  const { language, t } = useLocale();
  const recommendedBudget = sheet.powerLevel * 15;
  const size = getSizeProfile(sheet.sizeRank);
  const sizeSpace = size.space ?? (language === "en" ? "to define" : "a definir");
  const sizeReach = size.reach ?? (language === "en" ? "to define" : "a definir");
  return (
    <>
      <EditorHeading
        eyebrow="01 · Identidade"
        title="Quem é este personagem?"
        text="Conceito, campanha e parâmetros que controlam todos os cálculos."
      />

      <div className="image-uploader">
        <div className="image-uploader-preview">
          {sheet.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sheet.imageUrl} alt="" />
          ) : (
            <Camera size={30} aria-hidden="true" />
          )}
        </div>
        <div>
          <strong>{t("Retrato do personagem")}</strong>
          <p>{t("PNG, JPG, WEBP ou GIF · máximo de 5 MB")}</p>
          <label className="button button-secondary compact">
            <Camera size={15} aria-hidden="true" />
            {t(imageUploading ? "Enviando…" : "Anexar imagem")}
            <input
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={imageUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onImageUpload(file);
                event.currentTarget.value = "";
              }}
              type="file"
            />
          </label>
        </div>
      </div>

      <div className="form-grid">
        <Field label="Nome do personagem" required>
          <input
            value={sheet.heroName}
            onChange={(event) => patch({ heroName: event.target.value })}
          />
        </Field>
        <Field label="Identidade civil">
          <input
            value={sheet.civilName}
            onChange={(event) => patch({ civilName: event.target.value })}
          />
        </Field>
        <Field label="Codinome / alcunha">
          <input
            value={sheet.codename}
            onChange={(event) => patch({ codename: event.target.value })}
          />
        </Field>
        <Field label="Jogador">
          <input
            value={sheet.player}
            onChange={(event) => patch({ player: event.target.value })}
          />
        </Field>
        <Field label="Campanha">
          <input
            value={sheet.campaign}
            onChange={(event) => patch({ campaign: event.target.value })}
          />
        </Field>
        <Field label="Arquétipo">
          <input
            list="arquivo-de-herois-arquetipos"
            value={sheet.archetype}
            onChange={(event) => patch({ archetype: event.target.value })}
          />
          <datalist id="arquivo-de-herois-arquetipos">
            {archetypeCatalog.flatMap((entry) => [
              <option key={entry.id} value={getCatalogName(entry, language)}>
                {language === "pt" ? entry.canonical : entry.label}
              </option>,
              ...entry.variants.map((variant) => (
                <option key={`${entry.id}-${variant}`} value={variant}>
                  {entry.label}
                </option>
              )),
            ])}
          </datalist>
        </Field>
        <Field label="Tipo de construção">
          <Select
            value={sheet.buildType}
            onChange={(buildType) =>
              patch({ buildType: buildType as CharacterSheet["buildType"] })
            }
            options={[
              { value: "hero", label: "Personagem do Jogador" },
              { value: "npc", label: "NPC" },
            ]}
          />
        </Field>
        <Field label="Nível de Poder">
          <NumberInput
            value={sheet.powerLevel}
            min={0}
            onChange={(powerLevel) => patch({ powerLevel })}
          />
          <small className="field-guidance">
            {language === "en"
              ? `${getPowerLevelMetrics(sheet.powerLevel).recommendedPoints} suggested PP · paired limit ${getPowerLevelMetrics(sheet.powerLevel).pairedLimit} · no artificial cap.`
              : `${getPowerLevelMetrics(sheet.powerLevel).recommendedPoints} PP recomendados · limite pareado ${getPowerLevelMetrics(sheet.powerLevel).pairedLimit} · sem teto artificial.`}
          </small>
        </Field>
        <Field label="Tamanho natural">
          <NumberInput
            value={sheet.sizeRank}
            onChange={(sizeRank) => patch({ sizeRank })}
          />
          <small className="field-guidance">
            {language === "en"
              ? `${size.canonical} · space ${sizeSpace} · reach ${sizeReach}${size.published ? "" : " · Narrator-defined outside the published table"}`
              : `${size.label} · espaço ${sizeSpace} · alcance ${sizeReach}${size.published ? "" : " · definido pelo Narrador fora da tabela publicada"}`}
          </small>
        </Field>
        <Field label="Orçamento de PP">
          <Select
            value={sheet.budgetMode}
            onChange={(budgetMode) =>
              patch({
                budgetMode: budgetMode as CharacterSheet["budgetMode"],
              })
            }
            options={[
              {
                value: "recommended",
                label: language === "en"
                  ? `Recommended: ${recommendedBudget} PP (15 × PL)`
                  : `Recomendado: ${recommendedBudget} PP (15 × NP)`,
              },
              { value: "custom", label: "Personalizado pelo Narrador" },
            ]}
          />
        </Field>
        {sheet.budgetMode === "custom" && (
          <Field label="Orçamento personalizado">
            <NumberInput
              value={sheet.customPointBudget}
              min={0}
              onChange={(customPointBudget) =>
                patch({ customPointBudget })
              }
            />
          </Field>
        )}
        <Field label="Cor de identificação">
          <div className="color-field">
            <input
              aria-label="Cor de identificação"
              type="color"
              value={sheet.accent}
              onChange={(event) => patch({ accent: event.target.value })}
            />
            <input
              value={sheet.accent}
              onChange={(event) => patch({ accent: event.target.value })}
              pattern="^#[0-9a-fA-F]{6}$"
            />
          </div>
        </Field>
        <Field label="Conceito" wide>
          <textarea
            rows={3}
            value={sheet.concept}
            onChange={(event) => patch({ concept: event.target.value })}
          />
        </Field>
        <Field label="Origem" wide>
          <textarea
            rows={3}
            value={sheet.origin}
            onChange={(event) => patch({ origin: event.target.value })}
          />
          <SuggestionChips
            label="Sugestões do capítulo de criação"
            items={heroOriginCatalog.map((entry) =>
              getCatalogName(entry, language),
            )}
            onSelect={(value) =>
              patch({ origin: appendSuggestion(sheet.origin, value) })
            }
          />
        </Field>
        <Field
          label="Descritores: origem, fonte, meio e resultado"
          wide
        >
          <textarea
            rows={3}
            value={sheet.descriptors}
            onChange={(event) =>
              patch({ descriptors: event.target.value })
            }
          />
          <div className="descriptor-suggestions">
            {(
              [
                ["Origem", descriptorCatalog.origin],
                ["Fonte", descriptorCatalog.source],
                ["Meio", descriptorCatalog.medium],
                ["Resultado", descriptorCatalog.result],
              ] as const
            ).map(([label, values]) => (
              <SuggestionChips
                key={label}
                label={label}
                items={[...values]}
                onSelect={(value) =>
                  patch({
                    descriptors: appendDescriptor(
                      sheet.descriptors,
                      label,
                      value,
                    ),
                  })
                }
              />
            ))}
          </div>
        </Field>
        <Field label="Aparência" wide>
          <textarea
            rows={3}
            value={sheet.appearance}
            onChange={(event) => patch({ appearance: event.target.value })}
          />
        </Field>
        <Field label="Personalidade e motivação" wide>
          <textarea
            rows={4}
            value={sheet.personality}
            onChange={(event) =>
              patch({ personality: event.target.value })
            }
          />
          <SuggestionChips
            label="Motivações comuns"
            items={motivationCatalog.map((entry) =>
              getCatalogName(entry, language),
            )}
            onSelect={(value) =>
              patch({
                personality: appendSuggestion(sheet.personality, value),
              })
            }
          />
        </Field>
      </div>
    </>
  );
}

function TraitsEditor({ sheet, patch }: EditorChildProps) {
  const { t } = useLocale();
  const derived = getDerivedTraits(sheet);
  const absentTraits = getEffectiveAbsentTraits(sheet);
  const setAbsent = (key: AbsentTraitKey, absent: boolean) => {
    const next = absent
      ? [...new Set([...sheet.absentTraits, key])]
      : sheet.absentTraits.filter((entry) => entry !== key);
    patch({ absentTraits: next });
  };
  return (
    <>
      <EditorHeading
        eyebrow="02 · Atributos e defesas"
        title="Atributos e valores derivados"
        text="Alterar um atributo recalcula imediatamente as perícias, a iniciativa e as resistências associadas."
      />

      <FormulaNotice>
        {t("Atributos custam 2 PP por graduação. Valores abaixo de 0 devolvem 2 PP por graduação, até o mínimo de -5. Um traço ausente vale -10 PP e aplica consequências próprias; para Personagens do Jogador, exige permissão do Narrador.")}
      </FormulaNotice>

      <h3 className="form-subheading">Atributos</h3>
      <div className="number-card-grid">
        {coreAbilityKeys.map((key) => (
          <NumberCard
            key={key}
            label={abilityLabels[key]}
            abbreviation={abilityAbbreviations[key]}
            value={sheet.abilities[key]}
            derived={derived.abilities[key]}
            cost={absentTraits.has(key) ? -10 : sheet.abilities[key] * 2}
            benchmark={
              absentTraits.has(key)
                ? "Traço ausente"
                : getAbilityBenchmark(derived.abilities[key]).label
            }
            min={-5}
            absent={absentTraits.has(key)}
            absentLocked={
              key === "presence" &&
              absentTraits.has("awareness") &&
              !sheet.absentTraits.includes("presence")
            }
            onAbsentChange={(absent) => setAbsent(key, absent)}
            onChange={(value) =>
              patch({
                abilities: { ...sheet.abilities, [key]: value },
              })
            }
          />
        ))}
      </div>

      <h3 className="form-subheading">Atributos de combate</h3>
      <div className="number-card-grid">
        {(["attack", "defense"] as const).map((key) => (
          <NumberCard
            key={key}
            label={combatLabels[key]}
            value={sheet.combat[key]}
            derived={
              key === "attack" ? derived.attack : derived.defense
            }
            cost={absentTraits.has(key) ? -10 : sheet.combat[key] * 2}
            min={-5}
            absent={absentTraits.has(key)}
            onAbsentChange={(absent) => setAbsent(key, absent)}
            onChange={(value) =>
              patch({ combat: { ...sheet.combat, [key]: value } })
            }
          />
        ))}
        {(
          [
            ["closeAttack", derived.closeAttack],
            ["rangedAttack", derived.rangedAttack],
            ["closeDefense", derived.closeDefense],
            ["rangedDefense", derived.rangedDefense],
          ] as const
        ).map(([key, total]) => (
          <NumberCard
            key={key}
            label={combatLabels[key]}
            value={sheet.combat[key]}
            derived={total}
            cost={sheet.combat[key]}
            min={0}
            onChange={(value) =>
              patch({ combat: { ...sheet.combat, [key]: value } })
            }
          />
        ))}
        <NumberCard
          label="Aumento de Iniciativa"
          value={sheet.combat.initiativeBonus}
          derived={derived.initiative}
          cost={Math.ceil(
            Math.max(0, sheet.combat.initiativeBonus) / 4,
          )}
          min={0}
          onChange={(initiativeBonus) =>
            patch({
              combat: { ...sheet.combat, initiativeBonus },
            })
          }
          formula={`Iniciativa total = AGL ${signed(derived.abilities.agility)} + aumento ${signed(sheet.combat.initiativeBonus)} + poder ${signed(derived.powerBonuses.initiative)}`}
        />
      </div>

      <h3 className="form-subheading">Resistências</h3>
      <div className="derived-resistance-grid">
        {resistanceKeys.map((key) => {
          const baseAbility = resistanceBaseAbility(key);
          const baseValue = derived.abilities[baseAbility];
          const powerDirect = derived.powerBonuses[key];
          const advantageDirect = derived.advantageBonuses[key];
          const equipmentDirect = derived.equipmentBonuses[key];
          const adjustment = sheet.resistanceAdjustments[key];
          const absent = isResistanceAbsent(sheet, key);
          return (
            <label
              className={`derived-resistance-card ${absent ? "is-absent" : ""}`}
              key={key}
            >
              <span>{resistanceLabels[key]}</span>
              <div className="derived-equation">
                <small>
                  {abilityAbbreviations[baseAbility]}{" "}
                  {absent ? "—" : signed(baseValue)}
                </small>
                <b>+</b>
                <NumberInput
                  ariaLabel={`Ajuste comprado de ${resistanceLabels[key]}`}
                  value={adjustment}
                  disabled={absent}
                  onChange={(value) =>
                    patch({
                      resistanceAdjustments: {
                        ...sheet.resistanceAdjustments,
                        [key]: value,
                      },
                    })
                  }
                />
                <b>+</b>
                <small>
                  Fontes {signed(
                    powerDirect + advantageDirect + equipmentDirect,
                  )}
                </small>
                <b>=</b>
                <strong>
                  {absent ? "—" : signed(derived.resistances[key])}
                </strong>
              </div>
              <em>
                {absent ? (
                  key === "will"
                    ? t("Sem resistência numérica · Imunidade a Vontade decorre da ausência")
                    : t("Sem resistência numérica · registre Imunidade quando aplicável")
                ) : (
                  <>
                    {signed(adjustment)} PP comprados · poder{" "}
                    {signed(powerDirect)}
                    {advantageDirect
                      ? ` · vantagem ${signed(advantageDirect)}`
                      : ""}
                    {equipmentDirect
                      ? ` · equipamento ${signed(equipmentDirect)}`
                      : ""}
                  </>
                )}
              </em>
            </label>
          );
        })}
      </div>
    </>
  );
}

function SkillsEditor({ sheet, patch }: EditorChildProps) {
  const { t } = useLocale();
  const derived = getDerivedTraits(sheet);
  const absentTraits = getEffectiveAbsentTraits(sheet);
  const limit = sheet.powerLevel + 10;
  const breakdown = getPointBreakdown(sheet);
  const missingSkills = skillCatalog.filter(
    (preset) =>
      !sheet.skills.some(
        (entry) =>
          findSkillPreset(entry.name, entry.catalogKey)?.id === preset.id,
      ),
  );
  return (
    <>
      <EditorHeading
        eyebrow="03 · Perícias"
        title="Perícias e especializações"
        text="O modificador usa atributo + graduações + especialização + outros bônus."
      />
      <div className="formula-summary">
        <span>
          Normais <strong>{breakdown.regularSkillRanks}</strong> grad.
          → <b>{Math.ceil(breakdown.regularSkillRanks / 2)} PP</b>
        </span>
        <span>
          Especializadas <strong>{breakdown.specializedSkillRanks}</strong>{" "}
          grad. → <b>{Math.ceil(breakdown.specializedSkillRanks / 4)} PP</b>
        </span>
        <span>
          Limite por perícia <strong>{limit}</strong>
        </span>
        {missingSkills.length > 0 && (
          <button
            className="formula-action"
            type="button"
            onClick={() =>
              patch({
                skills: [
                  ...sheet.skills,
                  ...missingSkills.map((preset) => ({
                    id: newId("skill"),
                    catalogKey: preset.id,
                    name: preset.label,
                    ability: preset.ability,
                    rank: 0,
                    specialization: "",
                    specializationRank: 0,
                    miscellaneousModifier: 0,
                    miscellaneousModifierSource: "",
                    costClass: preset.costClass,
                    trainedOnly: preset.trainedOnly,
                  })),
                ],
              })
            }
          >
            <WandSparkles size={14} /> Completar {missingSkills.length}{" "}
            {missingSkills.length === 1 ? "perícia" : "perícias"}
          </button>
        )}
      </div>

      <div className="table-editor skill-table">
        <div className="table-editor-head skill-row-v2">
          <span>Perícia</span>
          <span>Hab.</span>
          <span>Custo</span>
          <span>Grad.</span>
          <span>Especialização</span>
          <span>Grad. esp.</span>
          <span>Outros + origem</span>
          <span>Total</span>
        </div>
        {sheet.skills.map((skill, index) => {
          const total = getSkillTotal(skill, derived);
          const unavailable = absentTraits.has(skill.ability);
          const preset = findSkillPreset(skill.name, skill.catalogKey);
          const specializedCostRequired =
            requiresSpecializedSkillCost(skill.name);
          const structurallyValid =
            total <= limit &&
            Number.isInteger(skill.rank) &&
            skill.rank >= 0 &&
            Number.isInteger(skill.specializationRank) &&
            skill.specializationRank >= 0 &&
            Number.isInteger(skill.miscellaneousModifier) &&
            (skill.miscellaneousModifier === 0 ||
              Boolean(skill.miscellaneousModifierSource.trim())) &&
            (!specializedCostRequired ||
              (skill.costClass === "specialized" &&
                skill.trainedOnly));
          const verified =
            structurallyValid &&
            !unavailable &&
            Boolean(preset) &&
            skill.ability === preset?.ability &&
            skill.costClass === preset?.costClass &&
            skill.trainedOnly === preset?.trainedOnly;
          const rowStatus = verified
            ? "row-valid"
            : structurallyValid
              ? "row-attention"
              : "row-invalid";
          return (
            <div
              className={`table-editor-row skill-row-v2 ${rowStatus}`}
              key={skill.id}
            >
              <div className="skill-name-field" data-label="Perícia">
                <input
                  aria-label={`Nome da perícia ${index + 1}`}
                  list="arquivo-de-herois-pericias"
                  value={skill.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    const selected = findSkillPreset(name);
                    patch({
                      skills: updateAt(sheet.skills, index, {
                        ...skill,
                        name,
                        catalogKey: selected?.id ?? "",
                        ability: selected?.ability ?? skill.ability,
                        costClass:
                          selected?.costClass ??
                          (requiresSpecializedSkillCost(name)
                            ? "specialized"
                            : skill.costClass),
                        trainedOnly:
                          selected?.trainedOnly ??
                          (requiresSpecializedSkillCost(name) ||
                            skill.trainedOnly),
                      }),
                    });
                  }}
                />
                {skill.trainedOnly && <small>Somente treinada</small>}
              </div>
              <div className="skill-mobile-cell" data-label="Atributo"><Select
                value={skill.ability}
                ariaLabel={`Atributo-base de ${skill.name}`}
                onChange={(ability) =>
                  patch({
                    skills: updateAt(sheet.skills, index, {
                      ...skill,
                      ability: ability as CoreAbilityKey,
                    }),
                  })
                }
                options={coreAbilityKeys.map((key) => ({
                  value: key,
                  label: abilityAbbreviations[key],
                }))}
              /></div>
              <div className="skill-mobile-cell" data-label="Custo"><Select
                value={skill.costClass}
                ariaLabel={`Custo de ${skill.name}`}
                onChange={(costClass) =>
                  patch({
                    skills: updateAt(sheet.skills, index, {
                      ...skill,
                      costClass: specializedCostRequired
                        ? "specialized"
                        : (costClass as typeof skill.costClass),
                    }),
                  })
                }
                options={
                  specializedCostRequired
                    ? [{ value: "specialized", label: "4/PP · obrigatório" }]
                    : [
                        { value: "regular", label: "2/PP" },
                        { value: "specialized", label: "4/PP" },
                      ]
                }
              /></div>
              <div className="skill-mobile-cell" data-label="Graduações"><NumberInput
                ariaLabel={`Graduação de ${skill.name}`}
                value={skill.rank}
                min={0}
                onChange={(rank) =>
                  patch({
                    skills: updateAt(sheet.skills, index, {
                      ...skill,
                      rank,
                    }),
                  })
                }
              /></div>
              <div className="skill-mobile-cell" data-label="Especialização"><input
                aria-label={`Especialização de ${skill.name}`}
                list={`skill-specializations-${skill.id}`}
                placeholder="Área estreita"
                value={skill.specialization}
                onChange={(event) =>
                  patch({
                    skills: updateAt(sheet.skills, index, {
                      ...skill,
                      specialization: event.target.value,
                    }),
                  })
                }
              /></div>
              {preset && (
                <datalist id={`skill-specializations-${skill.id}`}>
                  {preset.specializations.map((specialization) => (
                    <option key={specialization} value={specialization} />
                  ))}
                </datalist>
              )}
              <div className="skill-mobile-cell" data-label="Grad. esp."><NumberInput
                ariaLabel={`Graduação especializada de ${skill.name}`}
                value={skill.specializationRank}
                min={0}
                onChange={(specializationRank) =>
                  patch({
                    skills: updateAt(sheet.skills, index, {
                      ...skill,
                      specializationRank,
                    }),
                  })
                }
              /></div>
              <div className="skill-misc-field" data-label="Outros + origem">
                <NumberInput
                  ariaLabel={`Outros modificadores de ${skill.name}`}
                  value={skill.miscellaneousModifier}
                  onChange={(miscellaneousModifier) =>
                    patch({
                      skills: updateAt(sheet.skills, index, {
                        ...skill,
                        miscellaneousModifier,
                      }),
                    })
                  }
                />
                <input
                  aria-label={`Origem do modificador de ${skill.name}`}
                  placeholder="Origem do bônus"
                  value={skill.miscellaneousModifierSource}
                  onChange={(event) =>
                    patch({
                      skills: updateAt(sheet.skills, index, {
                        ...skill,
                        miscellaneousModifierSource: event.target.value,
                      }),
                    })
                  }
                />
              </div>
              <span className="calculated-total" data-label="Total">
                {verified ? (
                  <CheckCircle2 />
                ) : structurallyValid ? (
                  <AlertTriangle />
                ) : (
                  <XCircle />
                )}
                <strong>{unavailable ? "—" : signed(total)}</strong>
                <small>
                  {unavailable ? t("atributo ausente") : `/ ${limit}`}
                </small>
                <em>
                  {unavailable
                    ? t("Falha automática")
                    : getSkillBenchmark(total).difficulty}
                </em>
              </span>
            </div>
          );
        })}
      </div>
      <datalist id="arquivo-de-herois-pericias">
        {skillCatalog.map((preset) => (
          <option key={preset.id} value={preset.label}>
            {preset.canonical}
          </option>
        ))}
      </datalist>
      <button
        className="add-row-button"
        type="button"
        onClick={() =>
          patch({
            skills: [
              ...sheet.skills,
              {
                id: newId("skill"),
                catalogKey: CUSTOM_CATALOG_KEY,
                name: "Nova perícia",
                ability: "intellect",
                rank: 0,
                specialization: "",
                specializationRank: 0,
                miscellaneousModifier: 0,
                miscellaneousModifierSource: "",
                costClass: "regular",
                trainedOnly: false,
              },
            ],
          })
        }
      >
        <Plus size={16} /> Adicionar perícia
      </button>
    </>
  );
}

function AdvantagesEditor({ sheet, patch }: EditorChildProps) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const capacity = getHeroicAdvantageCapacity(sheet);
  const luckCapacity = getLuckCapacity(sheet);
  const equipment = getEquipmentTotals(sheet);
  const cost = sheet.advantages.reduce(
    (total, advantage) => total + Math.max(0, advantage.rank),
    0,
  );
  const updateAdvantages = (advantages: CharacterSheet["advantages"]) => {
    const luckMax = advantages.reduce((total, advantage) => {
      const preset = findAdvantagePreset(
        advantage.name,
        advantage.catalogKey,
      );
      return total +
        (preset?.id === "luck" ? Math.max(0, advantage.rank) : 0);
    }, 0);
    patch({
      advantages,
      resources: { ...sheet.resources, luckMax },
    });
  };
  const addFromCatalog = (preset: AdvantagePreset) => {
    const existingIndex = sheet.advantages.findIndex(
      (entry) =>
        findAdvantagePreset(entry.name, entry.catalogKey)?.id === preset.id,
    );
    if (existingIndex >= 0 && !preset.focused) {
      const existing = sheet.advantages[existingIndex];
      if (preset.ranked) {
        const rank = Math.min(
          existing.rank + 1,
          preset.maxRank ?? 60,
        );
        updateAdvantages(
          updateAt(sheet.advantages, existingIndex, {
            ...existing,
            rank,
          }),
        );
      }
      setCatalogOpen(false);
      return;
    }
    updateAdvantages([
      ...sheet.advantages,
      {
        id: newId("advantage"),
        catalogKey: preset.id,
        name: preset.label,
        rank: 1,
        categories: preset.categories,
        kind: preset.kind,
        notes: "",
      },
    ]);
    setCatalogOpen(false);
  };
  return (
    <>
      <EditorHeading
        eyebrow="04 · Vantagens"
        title="Vantagens e recursos"
        text="Cada vantagem ou graduação custa 1 PP. Vantagens heroicas e Equipamento também atualizam seus controles próprios."
      />
      <div className="formula-summary">
        <span>
          Custo <strong>{cost} PP</strong>
        </span>
        <span>
          Graduações heroicas <strong>{capacity}</strong>
        </span>
        <span>
          Equipamento <strong>{equipment.used}/{equipment.allowance} PE</strong>
        </span>
        <span>
          Sorte <strong>{luckCapacity} {luckCapacity === 1 ? "uso" : "usos"}</strong>
        </span>
      </div>
      <CatalogCallout
        title="Adicionar vantagem com regras prontas"
        text={`${advantageCatalog.length} opções com categorias, limite de graduação e custo já vinculados.`}
        onOpen={() => setCatalogOpen(true)}
      />
      <Repeater
        empty="Nenhuma vantagem registrada."
        onAdd={() =>
          patch({
            advantages: [
              ...sheet.advantages,
              {
                id: newId("advantage"),
                catalogKey: "",
                name: "",
                rank: 1,
                categories: ["Geral"],
                kind: "standard",
                notes: "",
              },
            ],
          })
        }
        addLabel="Adicionar vantagem"
      >
        {sheet.advantages.map((item, index) => (
          <RepeaterCard
            key={item.id}
            title={item.name || `Vantagem ${index + 1}`}
            badge={`${item.rank} PP`}
            onDelete={() =>
              updateAdvantages(removeAt(sheet.advantages, index))
            }
          >
            <div className="form-grid">
              <Field label="Nome">
                <input
                  value={item.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    const selected = findAdvantagePreset(name);
                    updateAdvantages(
                      updateAt(sheet.advantages, index, {
                        ...item,
                        name,
                        catalogKey: selected?.id ?? "",
                        categories:
                          selected?.categories ?? item.categories,
                        kind: selected?.kind ?? item.kind,
                      }),
                    );
                  }}
                />
                {findAdvantagePreset(item.name, item.catalogKey) && (
                  <div className="catalog-field-meta">
                    <CatalogBadge />
                    <button
                      type="button"
                      onClick={() =>
                        updateAdvantages(
                          updateAt(sheet.advantages, index, {
                            ...item,
                            catalogKey: CUSTOM_CATALOG_KEY,
                          }),
                        )
                      }
                    >
                      Converter em personalizada
                    </button>
                  </div>
                )}
              </Field>
              <Field label="Graduação">
                <NumberInput
                  value={item.rank}
                  min={1}
                  max={
                    findAdvantagePreset(item.name, item.catalogKey)
                      ?.maxRank
                  }
                  onChange={(rank) =>
                    updateAdvantages(
                      updateAt(sheet.advantages, index, {
                        ...item,
                        rank,
                      }),
                    )
                  }
                />
              </Field>
              {!findAdvantagePreset(item.name, item.catalogKey) && (
                <Field label="Regra especial">
                  <Select
                    value={item.kind}
                    onChange={(kind) =>
                      updateAdvantages(
                        updateAt(sheet.advantages, index, {
                          ...item,
                          kind: kind as typeof item.kind,
                        }),
                      )
                    }
                    options={[
                      { value: "standard", label: "Padrão" },
                      {
                        value: "equipment",
                        label: "Equipamento: 5 PE por graduação",
                      },
                    ]}
                  />
                </Field>
              )}
              <Field label="Categorias" wide>
                {findAdvantagePreset(item.name, item.catalogKey) ? (
                  <div className="category-picker is-readonly">
                    {item.categories.map((category) => (
                      <span key={category}>{category}</span>
                    ))}
                  </div>
                ) : (
                  <div className="category-picker">
                    {advantageCategories.map((category) => {
                      const active = item.categories.includes(category);
                      return (
                        <button
                          className={active ? "is-active" : ""}
                          key={category}
                          onClick={() => {
                            const categories = active
                              ? item.categories.filter(
                                  (entry) => entry !== category,
                                )
                              : [...item.categories, category];
                            updateAdvantages(
                              updateAt(sheet.advantages, index, {
                                ...item,
                                categories: categories.length
                                  ? categories
                                  : (["Geral"] as AdvantageCategory[]),
                              }),
                            );
                          }}
                          type="button"
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Field>
              <Field label="Notas" wide>
                <textarea
                  rows={2}
                  value={item.notes}
                  onChange={(event) =>
                    updateAdvantages(
                      updateAt(sheet.advantages, index, {
                        ...item,
                        notes: event.target.value,
                      }),
                    )
                  }
                />
              </Field>
            </div>
          </RepeaterCard>
        ))}
      </Repeater>
      {catalogOpen && (
        <CatalogDialog
          title="Catálogo de vantagens"
          description="Pesquise em português ou pelo nome original em inglês. Ao escolher, custo e categorias são preenchidos automaticamente."
          items={advantageCatalog}
          onClose={() => setCatalogOpen(false)}
          onSelect={(entry) => addFromCatalog(entry as AdvantagePreset)}
        />
      )}
    </>
  );
}

function PowersEditor({ sheet, patch }: EditorChildProps) {
  const [catalogTarget, setCatalogTarget] = useState<
    "new" | number | null
  >(null);
  const [configurationTarget, setConfigurationTarget] = useState<
    "new" | number | null
  >(null);
  const updatePower = (index: number, power: PowerEntry) =>
    patch({ powers: updateAt(sheet.powers, index, power) });

  const removePower = (index: number, power: PowerEntry) => {
    const effectIds = new Set(power.effects.map((effect) => effect.id));
    patch({
      powers: removeAt(sheet.powers, index),
      attacks: sheet.attacks.filter(
        (attack) => !effectIds.has(attack.sourceEffectId),
      ),
    });
  };

  const removeEffect = (
    powerIndex: number,
    effectIndex: number,
    effectId: string,
  ) => {
    const power = sheet.powers[powerIndex];
    patch({
      powers: updateAt(sheet.powers, powerIndex, {
        ...power,
        effects: removeAt(power.effects, effectIndex),
      }),
      attacks: sheet.attacks.filter(
        (attack) => attack.sourceEffectId !== effectId,
      ),
    });
  };

  const updateEffect = (
    powerIndex: number,
    effectIndex: number,
    effect: PowerEffectEntry,
  ) => {
    const power = sheet.powers[powerIndex];
    const powers = updateAt(sheet.powers, powerIndex, {
      ...power,
      effects: updateAt(power.effects, effectIndex, effect),
    });
    let attacks = sheet.attacks.filter(
      (attack) =>
        effect.isAttack || attack.sourceEffectId !== effect.id,
    );
    if (
      effect.isAttack &&
      !attacks.some((attack) => attack.sourceEffectId === effect.id)
    ) {
      attacks = [
        ...attacks,
        attackFromEffect(effect, power.name || effect.name),
      ];
    }
    patch({ powers, attacks });
  };

  const addEffectFromCatalog = (preset: PowerEffectPreset) => {
    const effect = applyPowerEffectPreset(createPowerEffect(), preset);
    let powers = sheet.powers;
    if (catalogTarget === "new") {
      const power = createPower();
      power.name = preset.label;
      power.effects = [effect];
      powers = [...powers, power];
    } else if (typeof catalogTarget === "number") {
      const power = powers[catalogTarget];
      powers = updateAt(powers, catalogTarget, {
        ...power,
        effects: [...power.effects, effect],
      });
    }
    patch({
      powers,
      attacks: effect.isAttack
        ? [...sheet.attacks, attackFromEffect(effect, preset.label)]
        : sheet.attacks,
    });
    setCatalogTarget(null);
  };

  const addConfigurationFromCatalog = (
    preset: PowerConfigurationPreset,
  ) => {
    const effect = applyPowerConfigurationPreset(preset);
    let powers = sheet.powers;
    if (configurationTarget === "new") {
      const power = createPower();
      power.name = preset.label;
      power.effects = [effect];
      power.removable = preset.containerRemovable ?? "none";
      powers = [...powers, power];
    } else if (typeof configurationTarget === "number") {
      const power = powers[configurationTarget];
      powers = updateAt(powers, configurationTarget, {
        ...power,
        removable:
          power.removable === "none" && preset.containerRemovable
            ? preset.containerRemovable
            : power.removable,
        effects: [...power.effects, effect],
      });
    }
    patch({
      powers,
      attacks: effect.isAttack
        ? [...sheet.attacks, attackFromEffect(effect, preset.label)]
        : sheet.attacks,
    });
    setConfigurationTarget(null);
  };

  const setActive = (
    index: number,
    power: PowerEntry,
    active: boolean,
  ) => {
    let powers = [...sheet.powers];
    const arrayKey = normalizeName(power.arrayName);
    const targetDynamic =
      power.arrayRole === "dynamic" ||
      (power.arrayRole === "base" && power.baseDynamic);
    if (active && arrayKey) {
      powers = powers.map((entry, entryIndex) => {
        if (
          entryIndex === index ||
          normalizeName(entry.arrayName) !== arrayKey
        ) {
          return entry;
        }
        const entryDynamic =
          entry.arrayRole === "dynamic" ||
          (entry.arrayRole === "base" && entry.baseDynamic);
        return !targetDynamic || !entryDynamic
          ? { ...entry, active: false }
          : entry;
      });
    }
    powers[index] = { ...power, active };
    patch({ powers });
  };

  return (
    <>
      <EditorHeading
        eyebrow="05 · Poderes"
        title="Poderes, efeitos e matrizes"
        text="Cada efeito calcula custo-base, modificadores, recursos, desvantagens e vínculos com outros valores da ficha."
      />
      <FormulaNotice>
        Custo final = custo por graduação + recursos - desvantagens.
        Custos abaixo de 1 PP por graduação viram razões 1:2, 1:3 e assim por
        diante. O mínimo final de um efeito é 1 PP.
      </FormulaNotice>

      <CatalogCallout
        title="Começar por um efeito do catálogo"
        text={`${powerEffectCatalog.length} efeitos com custo-base, ação, alcance, duração, teste e resistência preenchidos.`}
        onOpen={() => setCatalogTarget("new")}
      />
      <CatalogCallout
        title="Usar uma configuração pronta"
        text={`${powerConfigurationCatalog.length} configurações prontas — de Rajada e Campo de Força a Invisibilidade, Invocação e Mimetismo — com custo calculado.`}
        onOpen={() => setConfigurationTarget("new")}
      />

      <Repeater
        empty="Nenhum poder registrado."
        onAdd={() =>
          patch({ powers: [...sheet.powers, createPower()] })
        }
        addLabel="Adicionar poder / configuração"
      >
        {sheet.powers.map((power, powerIndex) => {
          const entryCost = getPowerEntryCost(sheet, power.id);
          return (
            <RepeaterCard
              key={power.id}
              title={power.name || `Poder ${powerIndex + 1}`}
              badge={
                power.arrayRole === "alternate" ||
                power.arrayRole === "dynamic"
                  ? `Configuração ${entryCost?.configurationCost ?? 0} PP · custo na matriz ${entryCost?.chargedCost ?? 0} PP`
                  : `${entryCost?.chargedCost ?? 0} PP`
              }
              onDelete={() => removePower(powerIndex, power)}
            >
              <div className="power-container-controls">
                <label className="switch-field">
                  <input
                    checked={power.active}
                    type="checkbox"
                    onChange={(event) =>
                      setActive(powerIndex, power, event.target.checked)
                    }
                  />
                  <span>Aplicar vínculos agora</span>
                </label>
                <small>
                  Liga/desliga apenas os bônus derivados; o custo continua na
                  ficha.
                </small>
              </div>
              <div className="form-grid">
                <Field label="Nome do poder / configuração">
                  <input
                    value={power.name}
                    onChange={(event) =>
                      updatePower(powerIndex, {
                        ...power,
                        name: event.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Descritores">
                  <input
                    value={power.descriptors}
                    onChange={(event) =>
                      updatePower(powerIndex, {
                        ...power,
                        descriptors: event.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Função na matriz">
                  <Select
                    value={power.arrayRole}
                    onChange={(arrayRole) =>
                      updatePower(powerIndex, {
                        ...power,
                        arrayRole:
                          arrayRole as PowerEntry["arrayRole"],
                        arrayName:
                          arrayRole === "none" ? "" : power.arrayName,
                      })
                    }
                    options={[
                      { value: "none", label: "Poder independente" },
                      { value: "base", label: "Configuração-base" },
                      { value: "alternate", label: "Efeito alternativo" },
                      {
                        value: "dynamic",
                        label: "Efeito alternativo dinâmico",
                      },
                    ]}
                  />
                </Field>
                {power.arrayRole !== "none" && (
                  <Field label="Nome da matriz">
                    <input
                      placeholder="Ex.: Arsenal de energia"
                      value={power.arrayName}
                      onChange={(event) =>
                        updatePower(powerIndex, {
                          ...power,
                          arrayName: event.target.value,
                        })
                      }
                    />
                  </Field>
                )}
                {power.arrayRole === "base" && (
                  <>
                    <Field label="Base dinâmica">
                      <Toggle
                        checked={power.baseDynamic}
                        label="Permitir alocação dinâmica"
                        onChange={(baseDynamic) =>
                          updatePower(powerIndex, {
                            ...power,
                            baseDynamic,
                          })
                        }
                      />
                    </Field>
                    <Field label="Matriz Ampla (grad.)">
                      <NumberInput
                        value={power.wideRanks}
                        min={0}
                        onChange={(wideRanks) =>
                          updatePower(powerIndex, {
                            ...power,
                            wideRanks,
                          })
                        }
                      />
                    </Field>
                  </>
                )}
                <Field label="Removível">
                  <Select
                    value={power.removable}
                    onChange={(removable) =>
                      updatePower(powerIndex, {
                        ...power,
                        removable:
                          removable as PowerEntry["removable"],
                      })
                    }
                    options={[
                      { value: "none", label: "Não" },
                      {
                        value: "removable",
                        label: "Removível: -1/5 PP",
                      },
                      {
                        value: "easily-removable",
                        label: "Facilmente Removível: -2/5 PP",
                      },
                      {
                        value: "equipment",
                        label: "Grau Equipamento: -4/5 PP",
                      },
                    ]}
                  />
                </Field>
                <Field label="Notas do poder" wide>
                  <textarea
                    rows={2}
                    value={power.notes}
                    onChange={(event) =>
                      updatePower(powerIndex, {
                        ...power,
                        notes: event.target.value,
                      })
                    }
                  />
                </Field>
              </div>

              <div className="effect-stack">
                {power.effects.map((effect, effectIndex) => (
                  <EffectEditor
                    effect={effect}
                    key={effect.id}
                    powerName={power.name}
                    onChange={(nextEffect) =>
                      updateEffect(powerIndex, effectIndex, nextEffect)
                    }
                    onDelete={() =>
                      removeEffect(
                        powerIndex,
                        effectIndex,
                        effect.id,
                      )
                    }
                  />
                ))}
                <button
                  className="add-row-button subtle"
                  onClick={() =>
                    updatePower(powerIndex, {
                      ...power,
                      effects: [
                        ...power.effects,
                        createPowerEffect(),
                      ],
                    })
                  }
                  type="button"
                >
                  <Plus size={15} /> Adicionar efeito ao poder
                </button>
                <button
                  className="add-row-button catalog-add"
                  onClick={() => setCatalogTarget(powerIndex)}
                  type="button"
                >
                  <LibraryBig size={15} /> Escolher efeito do catálogo
                </button>
                <button
                  className="add-row-button catalog-add"
                  onClick={() => setConfigurationTarget(powerIndex)}
                  type="button"
                >
                  <WandSparkles size={15} /> Aplicar configuração pronta
                </button>
              </div>
            </RepeaterCard>
          );
        })}
      </Repeater>
      {catalogTarget !== null && (
        <CatalogDialog
          title="Catálogo de efeitos"
          description="A seleção preenche os parâmetros-base e continua totalmente editável. Modificadores podem alterar esses parâmetros depois."
          items={powerEffectCatalog}
          onClose={() => setCatalogTarget(null)}
          onSelect={(entry) =>
            addEffectFromCatalog(entry as PowerEffectPreset)
          }
        />
      )}
      {configurationTarget !== null && (
        <CatalogDialog
          title="Configurações prontas de poderes"
          description="Configurações com fórmula de custo e parâmetros dependentes já preenchidos. Escolhas em aberto ficam destacadas para revisão, sem bloquear a edição."
          items={powerConfigurationCatalog}
          onClose={() => setConfigurationTarget(null)}
          onSelect={(entry) =>
            addConfigurationFromCatalog(
              entry as PowerConfigurationPreset,
            )
          }
        />
      )}
    </>
  );
}

function EffectEditor({
  effect,
  powerName,
  onChange,
  onDelete,
}: {
  effect: PowerEffectEntry;
  powerName: string;
  onChange: (effect: PowerEffectEntry) => void;
  onDelete: () => void;
}) {
  const cost = getEffectCostBreakdown(effect);
  const linkedConfiguration = effect.configurationKey
    ? findPowerConfigurationPreset(
        effect.name,
        effect.configurationKey,
      )
    : undefined;
  const linkedEffect = findPowerEffectPreset(
    effect.name,
    effect.catalogKey,
  );
  return (
    <details className="effect-card" open>
      <summary>
        <span>{effect.name || "Efeito sem nome"}</span>
        <b className={effect.costMode === "legacy" ? "badge-attention" : ""}>
          {cost.total} PP
          {effect.costMode === "legacy" ? " · legado" : ""}
        </b>
        <ChevronDown size={15} />
      </summary>
      <div className="effect-card-body">
        {effect.costMode === "legacy" ? (
          <div className="legacy-cost-warning">
            <AlertTriangle />
            <div>
              <strong>Custo preservado, ainda não auditável</strong>
              <p>
                O total antigo de {effect.legacyCost} PP continua valendo.
                Preencha os modificadores para liberar a conferência completa.
              </p>
              <div className="legacy-lines">
                {effect.legacyText.extras && (
                  <span>Extras: {effect.legacyText.extras}</span>
                )}
                {effect.legacyText.features && (
                  <span>Recursos: {effect.legacyText.features}</span>
                )}
                {effect.legacyText.flaws && (
                  <span>Falhas: {effect.legacyText.flaws}</span>
                )}
                {effect.legacyText.drawbacks && (
                  <span>
                    Desvantagens: {effect.legacyText.drawbacks}
                  </span>
                )}
              </div>
              <button
                className="button button-secondary compact"
                onClick={() =>
                  onChange({
                    ...effect,
                    costMode: "structured",
                    baseCost: 1,
                  })
                }
                type="button"
              >
                <Calculator size={14} /> Estruturar cálculo
              </button>
            </div>
          </div>
        ) : (
          <div className="effect-cost-formula">
            {cost.segments.length ? (
              cost.segments.map((segment) => (
                <span key={`${segment.ratio}-${segment.ranks}`}>
                  {segment.ranks} grad. a {segment.ratio} ={" "}
                  <strong>{segment.cost} PP</strong>
                </span>
              ))
            ) : (
              <span>Sem graduações: apenas modificadores fixos.</span>
            )}
            <span>
              Recursos +{cost.featureCost} · Desvantagens -
              {cost.drawbackDiscount}
            </span>
            {cost.minimumApplied && (
              <span>Mínimo final aplicado: 1 PP</span>
            )}
          </div>
        )}

        <div className="form-grid">
          <Field label="Nome do efeito">
            <input
              list={`power-effects-${effect.id}`}
              value={effect.name}
              onChange={(event) => {
                const name = event.target.value;
                const preset = findPowerEffectPreset(name);
                onChange(
                  preset
                    ? applyPowerEffectPreset(effect, preset)
                    : {
                        ...effect,
                        name,
                        catalogKey: CUSTOM_CATALOG_KEY,
                        configurationKey: "",
                      },
                );
              }}
            />
            <datalist id={`power-effects-${effect.id}`}>
              {powerEffectCatalog.map((preset) => (
                <option key={preset.id} value={preset.label}>
                  {preset.canonical}
                </option>
              ))}
            </datalist>
            {(linkedEffect || linkedConfiguration) && (
              <div className="catalog-field-meta">
                <CatalogBadge
                  label={
                    linkedConfiguration
                      ? "Configuração pronta"
                      : "Do catálogo"
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...effect,
                      catalogKey: CUSTOM_CATALOG_KEY,
                      configurationKey: "",
                    })
                  }
                >
                  Converter em personalizado
                </button>
              </div>
            )}
          </Field>
          <Field label="Modo de custo">
            <Select
              value={effect.costMode}
              onChange={(costMode) =>
                onChange({
                  ...effect,
                  costMode: costMode as PowerEffectEntry["costMode"],
                })
              }
              options={[
                { value: "structured", label: "Estruturado" },
                { value: "legacy", label: "Total legado" },
              ]}
            />
          </Field>
          <Field label="Graduação">
            <NumberInput
              value={effect.rank}
              min={0}
              onChange={(rank) => onChange({ ...effect, rank })}
            />
          </Field>
          {effect.costMode === "structured" ? (
            <Field label="Custo-base por graduação">
              <NumberInput
                value={effect.baseCost}
                min={0}
                onChange={(baseCost) =>
                  onChange({ ...effect, baseCost })
                }
              />
            </Field>
          ) : (
            <Field label="Custo legado total">
              <NumberInput
                value={effect.legacyCost}
                min={0}
                onChange={(legacyCost) =>
                  onChange({ ...effect, legacyCost })
                }
              />
            </Field>
          )}
          <Field label="Ação">
            <Select
              value={effect.action}
              onChange={(action) => onChange({ ...effect, action })}
              options={[
                { value: "Nenhuma", label: "Nenhuma ação" },
                { value: "Livre", label: "Ação livre" },
                { value: "Reação", label: "Reação" },
                { value: "Simples", label: "Ação simples" },
                { value: "Padrão", label: "Ação padrão" },
                { value: "Completa", label: "Ação completa" },
              ]}
            />
          </Field>
          <Field label="Alcance descritivo">
            <Select
              value={effect.range}
              onChange={(range) => onChange({ ...effect, range })}
              options={[
                { value: "Pessoal", label: "Pessoal" },
                { value: "Perto", label: "Corpo a corpo / toque" },
                { value: "À distância", label: "À distância" },
                { value: "Percepção", label: "Percepção" },
                { value: "Graduação", label: "Definido pela graduação" },
              ]}
            />
          </Field>
          <Field label="Duração">
            <Select
              value={effect.duration}
              onChange={(duration) =>
                onChange({ ...effect, duration })
              }
              options={[
                "Instantânea",
                "Concentração",
                "Sustentada",
                "Contínua",
                "Permanente",
              ]}
            />
          </Field>
          <Field label="Resistência">
            <input
              list={`resistances-${effect.id}`}
              value={effect.resistance}
              onChange={(event) =>
                onChange({
                  ...effect,
                  resistance: event.target.value,
                })
              }
            />
            <datalist id={`resistances-${effect.id}`}>
              {resistanceSuggestions.map((resistance) => (
                <option key={resistance} value={resistance} />
              ))}
            </datalist>
          </Field>
          <Field label="Teste">
            <input
              value={effect.check}
              onChange={(event) =>
                onChange({ ...effect, check: event.target.value })
              }
            />
          </Field>
          <Field label="Efeito ofensivo">
            <Toggle
              checked={effect.isAttack}
              label="Aplicar limite Ataque + Efeito"
              onChange={(isAttack) =>
                onChange({ ...effect, isAttack })
              }
            />
          </Field>
          {effect.isAttack && (
            <>
              <Field label="Exige teste de ataque">
                <Toggle
                  checked={effect.requiresAttackCheck}
                  label={
                    effect.requiresAttackCheck
                      ? "Sim"
                      : "Não: efeito limitado ao NP"
                  }
                  onChange={(requiresAttackCheck) =>
                    onChange({
                      ...effect,
                      requiresAttackCheck,
                    })
                  }
                />
              </Field>
              {effect.requiresAttackCheck && (
                <Field label="Tipo de ataque">
                  <Select
                    value={effect.attackRange}
                    onChange={(attackRange) =>
                      onChange({
                        ...effect,
                        attackRange:
                          attackRange as PowerEffectEntry["attackRange"],
                      })
                    }
                    options={[
                      { value: "close", label: "Corpo a corpo" },
                      { value: "ranged", label: "À distância" },
                    ]}
                  />
                </Field>
              )}
              <Field label="Baseado em Força">
                <Toggle
                  checked={effect.strengthBased}
                  label="Somar Força à graduação"
                  onChange={(strengthBased) =>
                    onChange({ ...effect, strengthBased })
                  }
                />
              </Field>
            </>
          )}
          <Field label="Notas do efeito" wide>
            <textarea
              rows={2}
              value={effect.notes}
              onChange={(event) =>
                onChange({ ...effect, notes: event.target.value })
              }
            />
          </Field>
        </div>

        {effect.costMode === "structured" && (
          <div className="modifier-columns">
            <RankedModifierEditor
              title="Extras por graduação"
              items={effect.extras}
              presets={extraCatalog}
              onChange={(extras) => onChange({ ...effect, extras })}
              onPresetSelect={(preset) =>
                onChange(
                  applyRankedModifierPreset(effect, preset, "extra"),
                )
              }
            />
            <RankedModifierEditor
              title="Falhas por graduação"
              items={effect.flaws}
              presets={flawCatalog}
              onChange={(flaws) => onChange({ ...effect, flaws })}
              onPresetSelect={(preset) =>
                onChange(
                  applyRankedModifierPreset(effect, preset, "flaw"),
                )
              }
            />
            <FlatModifierEditor
              title="Recursos fixos"
              items={effect.features}
              type="feature"
              presets={featureCatalog}
              onChange={(features) =>
                onChange({ ...effect, features })
              }
              onPresetSelect={(preset) =>
                onChange(
                  applyFlatModifierPreset(effect, preset, "feature"),
                )
              }
            />
            <FlatModifierEditor
              title="Desvantagens fixas"
              items={effect.drawbacks}
              type="drawback"
              presets={drawbackCatalog}
              onChange={(drawbacks) =>
                onChange({ ...effect, drawbacks })
              }
              onPresetSelect={(preset) =>
                onChange(
                  applyFlatModifierPreset(effect, preset, "drawback"),
                )
              }
            />
          </div>
        )}

        <TraitLinksEditor
          items={effect.traitLinks}
          effectRank={effect.rank}
          onChange={(traitLinks) => {
            const preset = findPowerEffectPreset(
              effect.name,
              effect.catalogKey,
            );
            const referencesExisting = traitLinks.some(
              (link) => link.mode === "reference",
            );
            const baseCost =
              preset?.id === "enhanced-resistance"
                ? referencesExisting
                  ? 0
                  : effect.baseCost === 0
                    ? preset.baseCost
                    : effect.baseCost
                : effect.baseCost;
            onChange({ ...effect, traitLinks, baseCost });
          }}
        />

        <button className="danger-link" type="button" onClick={onDelete}>
          <Trash2 size={15} /> Remover efeito de {powerName || "poder"}
        </button>
      </div>
    </details>
  );
}

function RankedModifierEditor({
  title,
  items,
  presets,
  onChange,
  onPresetSelect,
}: {
  title: string;
  items: RankedModifierEntry[];
  presets: RankedModifierPreset[];
  onChange: (items: RankedModifierEntry[]) => void;
  onPresetSelect: (preset: RankedModifierPreset) => void;
}) {
  return (
    <div className="modifier-editor">
      <h4>{title}</h4>
      {items.map((item, index) => (
        <div className="modifier-row" key={item.id}>
          <input
            aria-label={`Nome: ${title}`}
            placeholder="Nome"
            value={item.name}
            onChange={(event) =>
              onChange(
                updateAt(items, index, {
                  ...item,
                  name: event.target.value,
                }),
              )
            }
          />
          <label>
            <span>Valor por graduação</span>
            <NumberInput
              value={item.value}
              min={0}
              onChange={(value) =>
                onChange(updateAt(items, index, { ...item, value }))
              }
            />
          </label>
          <label>
            <span>Grad. afetadas</span>
            <NumberInput
              value={item.ranksApplied}
              min={0}
              onChange={(ranksApplied) =>
                onChange(
                  updateAt(items, index, {
                    ...item,
                    ranksApplied,
                  }),
                )
              }
            />
          </label>
          <button
            aria-label={`Remover ${item.name || "modificador"}`}
            className="icon-danger"
            onClick={() => onChange(removeAt(items, index))}
            type="button"
          >
            <Trash2 />
          </button>
        </div>
      ))}
      <button
        className="mini-add"
        onClick={() =>
          onChange([
            ...items,
            {
              id: newId("modifier"),
              name: "",
              value: 1,
              ranksApplied: 0,
            },
          ])
        }
        type="button"
      >
        <Plus /> Adicionar
      </button>
      <MiniCatalogSelect
        label={`Escolher em ${title.toLocaleLowerCase("pt-BR")}`}
        items={presets}
        onSelect={(entry) =>
          onPresetSelect(entry as RankedModifierPreset)
        }
      />
      <small>0 graduações afetadas = todas as graduações.</small>
    </div>
  );
}

function FlatModifierEditor({
  title,
  items,
  type,
  presets,
  onChange,
  onPresetSelect,
}: {
  title: string;
  items: FlatModifierEntry[];
  type: "feature" | "drawback";
  presets: FlatModifierPreset[];
  onChange: (items: FlatModifierEntry[]) => void;
  onPresetSelect: (preset: FlatModifierPreset) => void;
}) {
  return (
    <div className="modifier-editor">
      <h4>{title}</h4>
      {items.map((item, index) => (
        <div className="modifier-row flat-row" key={item.id}>
          <input
            placeholder="Nome"
            value={item.name}
            onChange={(event) =>
              onChange(
                updateAt(items, index, {
                  ...item,
                  name: event.target.value,
                }),
              )
            }
          />
          <label>
            <span>Grad.</span>
            <NumberInput
              value={item.rank}
              min={0}
              onChange={(rank) =>
                onChange(updateAt(items, index, { ...item, rank }))
              }
            />
          </label>
          <Select
            value={item.rule}
            ariaLabel={`Regra automática de ${item.name}`}
            onChange={(rule) =>
              onChange(
                updateAt(items, index, {
                  ...item,
                  rule: rule as FlatModifierEntry["rule"],
                }),
              )
            }
            options={
              type === "feature"
                ? [
                    { value: "generic", label: "Genérico" },
                    {
                      value: "accurate",
                      label: "Preciso: +2 em ataque por graduação",
                    },
                  ]
                : [
                    { value: "generic", label: "Genérico" },
                    {
                      value: "inaccurate",
                      label: "Impreciso: −2 em ataque por graduação",
                    },
                  ]
            }
          />
          <button
            aria-label={`Remover ${item.name || "modificador"}`}
            className="icon-danger"
            onClick={() => onChange(removeAt(items, index))}
            type="button"
          >
            <Trash2 />
          </button>
        </div>
      ))}
      <button
        className="mini-add"
        onClick={() =>
          onChange([
            ...items,
            {
              id: newId("modifier"),
              name: "",
              rank: 1,
              rule: "generic",
            },
          ])
        }
        type="button"
      >
        <Plus /> Adicionar
      </button>
      <MiniCatalogSelect
        label={`Escolher em ${title.toLocaleLowerCase("pt-BR")}`}
        items={presets}
        onSelect={(entry) =>
          onPresetSelect(entry as FlatModifierPreset)
        }
      />
    </div>
  );
}

function TraitLinksEditor({
  items,
  effectRank,
  onChange,
}: {
  items: TraitLinkEntry[];
  effectRank: number;
  onChange: (items: TraitLinkEntry[]) => void;
}) {
  return (
    <div className="trait-links-editor">
      <header>
        <div>
          <h4>
            <Link2 /> Vínculos derivados
          </h4>
          <p>
            Registre os traços alterados pelo efeito ou referencie uma
            resistência existente para aplicar apenas seus modificadores.
          </p>
        </div>
        <button
          className="mini-add"
          onClick={() =>
            onChange([
              ...items,
              {
                id: newId("trait"),
                trait: "strength",
                mode: "per-rank",
                value: 1,
              },
            ])
          }
          type="button"
        >
          <Plus /> Vincular traço
        </button>
      </header>
      {items.map((item, index) => {
        const isReference = item.mode === "reference";
        const contribution =
          item.mode === "per-rank"
            ? effectRank * item.value
            : item.mode === "fixed"
              ? item.value
              : 0;
        return (
          <div className="trait-link-row" key={item.id}>
            <Select
              value={item.trait}
              onChange={(trait) =>
                onChange(
                  updateAt(items, index, {
                    ...item,
                    trait: trait as TraitLinkEntry["trait"],
                  }),
                )
              }
              options={(isReference
                ? resistanceKeys.map((value) => [
                    value,
                    resistanceLabels[value],
                  ])
                : Object.entries(traitLabels)
              ).map(([value, label]) => ({ value, label }))}
            />
            <Select
              value={item.mode}
              onChange={(mode) => {
                const nextMode = mode as TraitLinkEntry["mode"];
                const referencesResistance = resistanceKeys.includes(
                  item.trait as (typeof resistanceKeys)[number],
                );
                onChange(
                  updateAt(items, index, {
                    ...item,
                    mode: nextMode,
                    trait:
                      nextMode === "reference" && !referencesResistance
                        ? "toughness"
                        : item.trait,
                    value:
                      nextMode === "reference"
                        ? 0
                        : item.value || 1,
                  }),
                );
              }}
              options={[
                { value: "per-rank", label: "Por graduação" },
                { value: "fixed", label: "Valor fixo" },
                {
                  value: "reference",
                  label: "Modificar graduações existentes",
                },
              ]}
            />
            {isReference ? (
              <span className="reference-value">Sem bônus adicional</span>
            ) : (
              <NumberInput
                value={item.value}
                onChange={(value) =>
                  onChange(updateAt(items, index, { ...item, value }))
                }
              />
            )}
            <strong>
              {isReference ? "Alvo do extra" : `= ${signed(contribution)}`}
            </strong>
            <button
              aria-label="Remover vínculo"
              className="icon-danger"
              onClick={() => onChange(removeAt(items, index))}
              type="button"
            >
              <Trash2 />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function CombatEditor({ sheet, patch }: EditorChildProps) {
  const effectOptions = getPowerEffectOptions(sheet);
  const equipmentAttackOptions = sheet.equipment.filter((item) =>
    Boolean(findEquipmentPreset(item.name, item.catalogKey)?.attack),
  );
  return (
    <>
      <EditorHeading
        eyebrow="06 · Combate"
        title="Precisão, efeito e resistência"
        text="Bônus, graduação e CD são calculados a partir das fontes registradas na ficha."
      />

      <h3 className="form-subheading">Especializações de ataque</h3>
      <FormulaNotice>
        Cada especialização custa 1 PP por até 2 graduações e pode ser
        reutilizada por todos os ataques compatíveis.
      </FormulaNotice>
      <div className="compact-repeater">
        {sheet.attackSpecializations.map((specialization, index) => (
          <div className="compact-repeater-row" key={specialization.id}>
            <input
              list="attack-specializations"
              placeholder="Ex.: Espadas"
              value={specialization.name}
              onChange={(event) =>
                patch({
                  attackSpecializations: updateAt(
                    sheet.attackSpecializations,
                    index,
                    {
                      ...specialization,
                      name: event.target.value,
                    },
                  ),
                })
              }
            />
            <Select
              value={specialization.range}
              onChange={(range) =>
                patch({
                  attackSpecializations: updateAt(
                    sheet.attackSpecializations,
                    index,
                    {
                      ...specialization,
                      range: range as typeof specialization.range,
                    },
                  ),
                })
              }
              options={[
                { value: "close", label: "Corpo a corpo" },
                { value: "ranged", label: "À distância" },
                { value: "either", label: "Qualquer alcance" },
              ]}
            />
            <NumberInput
              value={specialization.rank}
              min={0}
              onChange={(rank) =>
                patch({
                  attackSpecializations: updateAt(
                    sheet.attackSpecializations,
                    index,
                    { ...specialization, rank },
                  ),
                })
              }
            />
            <span className="calculated-chip">
              {Math.ceil(Math.max(0, specialization.rank) / 2)} PP
            </span>
            <button
              aria-label="Remover especialização"
              className="icon-danger"
              onClick={() =>
                patch({
                  attackSpecializations: removeAt(
                    sheet.attackSpecializations,
                    index,
                  ),
                })
              }
              type="button"
            >
              <Trash2 />
            </button>
          </div>
        ))}
        <button
          className="add-row-button subtle"
          onClick={() =>
            patch({
              attackSpecializations: [
                ...sheet.attackSpecializations,
                {
                  id: newId("specialization"),
                  name: "",
                  rank: 2,
                  range: "close",
                },
              ],
            })
          }
          type="button"
        >
          <Plus /> Adicionar especialização
        </button>
      </div>
      <datalist id="attack-specializations">
        {attackSpecializationSuggestions.map((entry) => (
          <option key={entry} value={entry} />
        ))}
      </datalist>

      <h3 className="form-subheading">Ataques configurados</h3>
      <Repeater
        empty="Nenhum ataque registrado."
        onAdd={() =>
          patch({
            attacks: [
              ...sheet.attacks,
              {
                id: newId("attack"),
                name: "",
                sourceEffectId: "",
                sourceEquipmentId: "",
                range: "close",
                effectRank: 0,
                strengthBased: true,
                manualEffectSource: "strength",
                manualEffectSourceNote: "Dano de Força",
                specializationId: "",
                miscellaneousAttackBonus: 0,
                miscellaneousAttackSource: "",
                resistance: "Robustez",
                notes: "",
              },
            ],
          })
        }
        addLabel="Adicionar ataque"
      >
        {sheet.attacks.map((attack, index) => {
          const calculation = getAttackCalculation(sheet, attack);
          const valid =
            calculation.complete &&
            calculation.limitValue <= calculation.limit;
          return (
            <RepeaterCard
              key={attack.id}
              title={attack.name || `Ataque ${index + 1}`}
              badge={`${calculation.limitValue}/${calculation.limit} · CD ${calculation.effectDc}`}
              status={valid ? "pass" : "fail"}
              onDelete={() =>
                patch({ attacks: removeAt(sheet.attacks, index) })
              }
            >
              <div className="attack-formula-card">
                <span>
                  Bônus <strong>{signed(calculation.attackBonus)}</strong>
                </span>
                <b>+</b>
                <span>
                  Efeito <strong>{calculation.effectRank}</strong>
                </span>
                <b>=</b>
                <span className={valid ? "is-valid" : "is-invalid"}>
                  Limite{" "}
                  <strong>
                    {calculation.limitValue}/{calculation.limit}
                  </strong>
                </span>
                <span>
                  CD do efeito{" "}
                  <strong>{calculation.effectDc}</strong>
                </span>
              </div>
              <div className="form-grid">
                <Field label="Nome do ataque">
                  <input
                    value={attack.name}
                    onChange={(event) =>
                      patch({
                        attacks: updateAt(sheet.attacks, index, {
                          ...attack,
                          name: event.target.value,
                        }),
                      })
                    }
                  />
                </Field>
                <Field label="Origem do efeito">
                  <Select
                    value={
                      attack.sourceEffectId
                        ? `power:${attack.sourceEffectId}`
                        : attack.sourceEquipmentId
                          ? `equipment:${attack.sourceEquipmentId}`
                          : ""
                    }
                    onChange={(source) =>
                      patch({
                        attacks: updateAt(sheet.attacks, index, {
                          ...attack,
                          sourceEffectId: source.startsWith("power:")
                            ? source.slice("power:".length)
                            : "",
                          sourceEquipmentId: source.startsWith(
                            "equipment:",
                          )
                            ? source.slice("equipment:".length)
                            : "",
                        }),
                      })
                    }
                    options={[
                      {
                        value: "",
                        label: "Manual / Força / equipamento",
                      },
                      ...effectOptions.map((option) => ({
                        value: `power:${option.id}`,
                        label: `Poder · ${option.label}`,
                      })),
                      ...equipmentAttackOptions.map((item) => ({
                        value: `equipment:${item.id}`,
                        label: `Equipamento · ${item.name}`,
                      })),
                    ]}
                  />
                </Field>
                {!attack.sourceEffectId && !attack.sourceEquipmentId && (
                  <>
                    <Field label="Tipo">
                      <Select
                        value={attack.range}
                        onChange={(range) =>
                          patch({
                            attacks: updateAt(sheet.attacks, index, {
                              ...attack,
                              range: range as typeof attack.range,
                            }),
                          })
                        }
                        options={[
                          { value: "close", label: "Corpo a corpo" },
                          {
                            value: "ranged",
                            label: "À distância",
                          },
                          {
                            value: "no-check",
                            label: "Sem teste de ataque",
                          },
                        ]}
                      />
                    </Field>
                    <Field label="Graduação própria do efeito">
                      <NumberInput
                        value={attack.effectRank}
                        min={0}
                        onChange={(effectRank) =>
                          patch({
                            attacks: updateAt(sheet.attacks, index, {
                              ...attack,
                              effectRank,
                            }),
                          })
                        }
                      />
                    </Field>
                    <Field label="Baseado em Força">
                      <Toggle
                        checked={attack.strengthBased}
                        label="Somar Força"
                        onChange={(strengthBased) =>
                          patch({
                            attacks: updateAt(sheet.attacks, index, {
                              ...attack,
                              strengthBased,
                            }),
                          })
                        }
                      />
                    </Field>
                    {attack.effectRank > 0 && (
                      <>
                        <Field label="Onde o efeito foi pago">
                          <Select
                            value={attack.manualEffectSource}
                            onChange={(manualEffectSource) =>
                              patch({
                                attacks: updateAt(
                                  sheet.attacks,
                                  index,
                                  {
                                    ...attack,
                                    manualEffectSource:
                                      manualEffectSource as typeof attack.manualEffectSource,
                                  },
                                ),
                              })
                            }
                            options={[
                              {
                                value: "strength",
                                label: "Dano de Força",
                              },
                              {
                                value: "equipment",
                                label: "Equipamento",
                              },
                              {
                                value: "other",
                                label: "Outra fonte",
                              },
                            ]}
                          />
                        </Field>
                        <Field label="Fonte / justificativa">
                          <input
                            value={attack.manualEffectSourceNote}
                            onChange={(event) =>
                              patch({
                                attacks: updateAt(
                                  sheet.attacks,
                                  index,
                                  {
                                    ...attack,
                                    manualEffectSourceNote:
                                      event.target.value,
                                  },
                                ),
                              })
                            }
                          />
                        </Field>
                      </>
                    )}
                  </>
                )}
                <Field label="Especialização">
                  <Select
                    value={attack.specializationId}
                    onChange={(specializationId) =>
                      patch({
                        attacks: updateAt(sheet.attacks, index, {
                          ...attack,
                          specializationId,
                        }),
                      })
                    }
                    options={[
                      { value: "", label: "Nenhuma" },
                      ...sheet.attackSpecializations.map((entry) => ({
                        value: entry.id,
                        label: `${entry.name || "Sem nome"} +${entry.rank}`,
                      })),
                    ]}
                  />
                </Field>
                <Field label="Outro bônus de ataque">
                  <NumberInput
                    value={attack.miscellaneousAttackBonus}
                    onChange={(miscellaneousAttackBonus) =>
                      patch({
                        attacks: updateAt(sheet.attacks, index, {
                          ...attack,
                          miscellaneousAttackBonus,
                        }),
                      })
                    }
                  />
                </Field>
                {attack.miscellaneousAttackBonus !== 0 && (
                  <Field label="Origem do outro bônus">
                    <input
                      value={attack.miscellaneousAttackSource}
                      onChange={(event) =>
                        patch({
                          attacks: updateAt(sheet.attacks, index, {
                            ...attack,
                            miscellaneousAttackSource:
                              event.target.value,
                          }),
                        })
                      }
                    />
                  </Field>
                )}
                <Field label="Resistência">
                  <input
                    value={attack.resistance}
                    onChange={(event) =>
                      patch({
                        attacks: updateAt(sheet.attacks, index, {
                          ...attack,
                          resistance: event.target.value,
                        }),
                      })
                    }
                  />
                </Field>
                <Field label="Notas" wide>
                  <textarea
                    rows={2}
                    value={attack.notes}
                    onChange={(event) =>
                      patch({
                        attacks: updateAt(sheet.attacks, index, {
                          ...attack,
                          notes: event.target.value,
                        }),
                      })
                    }
                  />
                </Field>
              </div>
            </RepeaterCard>
          );
        })}
      </Repeater>
    </>
  );
}

function EquipmentEditor({
  sheet,
  patch,
  editingMode,
}: EditorChildProps & { editingMode: EditingMode }) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [autoCover, setAutoCover] = useState(true);
  const coverEquipment = editingMode === "guided" || autoCover;
  const totals = getEquipmentTotals(sheet);
  const valid = totals.remaining >= 0;
  const commitEquipment = (
    equipment: CharacterSheet["equipment"],
    attacks = sheet.attacks,
  ) => {
    if (!coverEquipment) {
      patch({ equipment, attacks });
      return;
    }
    const requiredRanks = Math.ceil(
      equipment.reduce(
        (total, item) => total + Math.max(0, item.cost),
        0,
      ) / 5,
    );
    const advantages = setEquipmentAdvantageRank(
      sheet.advantages,
      requiredRanks,
    );
    patch({
      equipment,
      attacks,
      advantages,
      resources: {
        ...sheet.resources,
        luckMax: luckCapacityFromAdvantages(advantages),
      },
    });
  };
  const addFromCatalog = (preset: EquipmentPreset) => {
    const item: CharacterSheet["equipment"][number] = {
      id: newId("equipment"),
      catalogKey: preset.id,
      name: preset.label,
      type: preset.type,
      cost: preset.cost,
      active: true,
      details: preset.details,
    };
    const attacks = preset.attack
      ? [...sheet.attacks, attackFromEquipment(item, preset)]
      : sheet.attacks;
    commitEquipment([...sheet.equipment, item], attacks);
    setCatalogOpen(false);
  };
  const convertToCustom = (index: number, name: string) => {
    const item = sheet.equipment[index];
    const preset = findEquipmentPreset(item.name, item.catalogKey);
    const equipment = updateAt(sheet.equipment, index, {
      ...item,
      catalogKey: CUSTOM_CATALOG_KEY,
      name,
    });
    const attacks = sheet.attacks.map((attack) =>
      attack.sourceEquipmentId === item.id
        ? {
            ...attack,
            sourceEquipmentId: "",
            range: preset?.attack?.range ?? attack.range,
            effectRank:
              preset?.attack?.effectRank ?? attack.effectRank,
            strengthBased:
              preset?.attack?.strengthBased ?? attack.strengthBased,
            manualEffectSource: "equipment" as const,
            manualEffectSourceNote: name || item.name,
            resistance:
              preset?.attack?.resistance ?? attack.resistance,
          }
        : attack,
    );
    commitEquipment(equipment, attacks);
  };
  return (
    <>
      <EditorHeading
        eyebrow="07 · Equipamento"
        title="Equipamento e Pontos de Equipamento"
        text="A vantagem Equipamento custa PP. Os itens usam apenas os PE concedidos por ela, sem cobrança duplicada."
      />
      <div className={`equipment-budget ${valid ? "is-valid" : "is-invalid"}`}>
        {valid ? <CheckCircle2 /> : <XCircle />}
        <div>
          <span>PE configurados</span>
          <strong>
            {totals.used}/{totals.allowance}
          </strong>
        </div>
        <div>
          <span>Saldo</span>
          <strong>{totals.remaining}</strong>
        </div>
        <Toggle
          checked={coverEquipment}
          disabled={editingMode === "guided"}
          label={
            editingMode === "guided"
              ? "Cobertura automática obrigatória no modo assistido"
              : "Cobrir PE automaticamente"
          }
          onChange={setAutoCover}
        />
      </div>
      <CatalogCallout
        title="Adicionar item com custo e efeitos prontos"
        text={`${equipmentCatalog.length} utilidades, armas, armaduras, veículos e recursos de instalações pesquisáveis.`}
        onOpen={() => setCatalogOpen(true)}
      />
      <Repeater
        empty="Nenhum equipamento registrado."
        onAdd={() =>
          patch({
            equipment: [
              ...sheet.equipment,
              {
                id: newId("equipment"),
                catalogKey: "",
                name: "",
                type: "Equipamento",
                cost: 0,
                active: true,
                details: "",
              },
            ],
          })
        }
        addLabel="Adicionar equipamento"
      >
        {sheet.equipment.map((item, index) => (
          <RepeaterCard
            key={item.id}
            title={item.name || `Item ${index + 1}`}
            badge={`${item.cost} PE`}
            onDelete={() =>
              commitEquipment(
                removeAt(sheet.equipment, index),
                sheet.attacks.filter(
                  (attack) => attack.sourceEquipmentId !== item.id,
                ),
              )
            }
          >
            <div className="form-grid">
              <Field label="Nome">
                <input
                  value={item.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    if (findEquipmentPreset(item.name, item.catalogKey)) {
                      convertToCustom(index, name);
                    } else {
                      patch({
                        equipment: updateAt(sheet.equipment, index, {
                          ...item,
                          name,
                        }),
                      });
                    }
                  }}
                />
                {findEquipmentPreset(item.name, item.catalogKey) && (
                  <div className="catalog-field-meta">
                    <CatalogBadge />
                    <button
                      type="button"
                      onClick={() => convertToCustom(index, item.name)}
                    >
                      Converter em personalizado
                    </button>
                  </div>
                )}
              </Field>
              <Field label="Tipo">
                <Select
                  value={item.type}
                  onChange={(type) =>
                    patch({
                      equipment: updateAt(sheet.equipment, index, {
                        ...item,
                        type,
                      }),
                    })
                  }
                  options={[
                    "Equipamento",
                    "Arma",
                    "Armadura",
                    "Veículo",
                    "Recurso de veículo",
                    "Instalação",
                    "Recurso de instalação",
                    "Construto",
                  ]}
                />
              </Field>
              <Field label="Custo (PE)">
                <NumberInput
                  value={item.cost}
                  min={0}
                  onChange={(cost) =>
                    commitEquipment(
                      updateAt(sheet.equipment, index, {
                        ...item,
                        cost,
                      }),
                    )
                  }
                />
              </Field>
              <Field label="Efeitos ativos">
                <Toggle
                  checked={item.active}
                  label={
                    item.active
                      ? "Aplicar bônus derivados"
                      : "Ignorar bônus por enquanto"
                  }
                  onChange={(active) =>
                    patch({
                      equipment: updateAt(sheet.equipment, index, {
                        ...item,
                        active,
                      }),
                    })
                  }
                />
              </Field>
              <Field label="Detalhes" wide>
                <textarea
                  rows={3}
                  value={item.details}
                  onChange={(event) =>
                    patch({
                      equipment: updateAt(sheet.equipment, index, {
                        ...item,
                        details: event.target.value,
                      }),
                    })
                  }
                />
              </Field>
            </div>
          </RepeaterCard>
        ))}
      </Repeater>
      {catalogOpen && (
        <CatalogDialog
          title="Catálogo de equipamento"
          description="Custos e estatísticas são preenchidos pelas tabelas. Itens variáveis continuam livres para você completar a configuração."
          items={equipmentCatalog}
          onClose={() => setCatalogOpen(false)}
          onSelect={(entry) => addFromCatalog(entry as EquipmentPreset)}
        />
      )}
    </>
  );
}

function ComplicationsEditor({ sheet, patch }: EditorChildProps) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const complicationTypes = [
    "Motivação",
    ...complicationCatalog
      .filter((entry) => entry.category === "Complicação")
      .map((entry) => entry.label),
    "Outro",
  ].filter((entry, index, values) => values.indexOf(entry) === index);
  const addFromCatalog = (entry: CatalogEntry) => {
    const complication = {
      id: newId("complication"),
      catalogKey: entry.id,
      name: entry.label,
      type: entry.category,
      description: entry.summary,
    };
    const placeholderIndex = sheet.complications.findIndex(
      (item) =>
        item.name === "Motivação" && !item.description.trim(),
    );
    const complications =
      entry.category === "Motivação" && placeholderIndex >= 0
        ? updateAt(sheet.complications, placeholderIndex, complication)
        : [...sheet.complications, complication];
    patch({ complications });
    setCatalogOpen(false);
  };
  return (
    <>
      <EditorHeading
        eyebrow="08 · Complicações"
        title="Motivações e complicações"
        text="Motivações, responsabilidades, relacionamentos, inimigos e fraquezas."
      />
      <CatalogCallout
        title="Escolher motivação ou complicação"
        text="A lista reúne todas as motivações e complicações apresentadas no capítulo de criação."
        onOpen={() => setCatalogOpen(true)}
      />
      <Repeater
        empty="Nenhuma complicação registrada."
        onAdd={() =>
          patch({
            complications: [
              ...sheet.complications,
              {
                id: newId("complication"),
                catalogKey: "",
                name: "",
                type: "Responsabilidade",
                description: "",
              },
            ],
          })
        }
        addLabel="Adicionar complicação"
      >
        {sheet.complications.map((item, index) => (
          <RepeaterCard
            key={item.id}
            title={item.name || `Complicação ${index + 1}`}
            onDelete={() =>
              patch({
                complications: removeAt(sheet.complications, index),
              })
            }
          >
            <div className="form-grid">
              <Field label="Nome">
                <input
                  value={item.name}
                  onChange={(event) =>
                    patch({
                      complications: updateAt(
                        sheet.complications,
                        index,
                        {
                          ...item,
                          name: event.target.value,
                          catalogKey: CUSTOM_CATALOG_KEY,
                        },
                      ),
                    })
                  }
                />
                {findComplicationPreset(
                  item.name,
                  item.catalogKey,
                  item.type,
                ) && (
                  <div className="catalog-field-meta">
                    <CatalogBadge />
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          complications: updateAt(
                            sheet.complications,
                            index,
                            {
                              ...item,
                              catalogKey: CUSTOM_CATALOG_KEY,
                            },
                          ),
                        })
                      }
                    >
                      Converter em personalizada
                    </button>
                  </div>
                )}
              </Field>
              <Field label="Tipo">
                <Select
                  value={item.type}
                  onChange={(type) =>
                    patch({
                      complications: updateAt(
                        sheet.complications,
                        index,
                        {
                          ...item,
                          type,
                          catalogKey: CUSTOM_CATALOG_KEY,
                        },
                      ),
                    })
                  }
                  options={complicationTypes}
                />
              </Field>
              <Field label="Descrição" wide>
                <textarea
                  rows={4}
                  value={item.description}
                  onChange={(event) =>
                    patch({
                      complications: updateAt(
                        sheet.complications,
                        index,
                        {
                          ...item,
                          description: event.target.value,
                        },
                      ),
                    })
                  }
                />
              </Field>
            </div>
          </RepeaterCard>
        ))}
      </Repeater>
      {catalogOpen && (
        <CatalogDialog
          title="Motivações e complicações"
          description="A ficha exige ao menos uma Motivação descrita. Você pode editar qualquer texto depois de selecionar."
          items={complicationCatalog}
          onClose={() => setCatalogOpen(false)}
          onSelect={addFromCatalog}
        />
      )}
    </>
  );
}

function ResourcesEditor({
  sheet,
  patch,
  editingMode,
}: EditorChildProps & { editingMode: EditingMode }) {
  const [conditionQuery, setConditionQuery] = useState("");
  const resources = sheet.resources;
  const heroicLimit = Math.floor(sheet.powerLevel / 2);
  const heroicCapacity = getHeroicAdvantageCapacity(sheet);
  const guidedHeroicLimit = Math.min(heroicLimit, heroicCapacity);
  const luckCapacity = getLuckCapacity(sheet);
  const heroicValid =
    resources.heroicAdvantageUses <= guidedHeroicLimit;
  const normalizedConditionQuery = normalizeCatalogText(conditionQuery);
  const visibleConditions = [...conditions]
    .sort((left, right) => {
      const leftActive = resources.conditions.includes(left) ? 1 : 0;
      const rightActive = resources.conditions.includes(right) ? 1 : 0;
      return (
        rightActive - leftActive || left.localeCompare(right, "pt-BR")
      );
    })
    .filter((condition) =>
      normalizeCatalogText(condition).includes(normalizedConditionQuery),
    );
  return (
    <>
      <EditorHeading
        eyebrow="09 · Recursos"
        title="Estado atual da sessão"
        text="Usos de vantagens heroicas são rastreados por aventura e não limitam quantas vantagens podem ser compradas."
      />
      <div className="form-grid">
        <Field label="Pontos Heroicos">
          <NumberInput
            value={resources.heroPoints}
            min={0}
            onChange={(heroPoints) =>
              patch({ resources: { ...resources, heroPoints } })
            }
          />
        </Field>
        <Field label="Usos heroicos nesta aventura">
          <div
            className={`input-with-status ${heroicValid ? "is-valid" : "is-invalid"}`}
          >
            <NumberInput
              value={resources.heroicAdvantageUses}
              min={0}
              max={editingMode === "guided" ? guidedHeroicLimit : undefined}
              onChange={(heroicAdvantageUses) =>
                patch({
                  resources: {
                    ...resources,
                    heroicAdvantageUses,
                  },
                })
              }
            />
            <span>
              / {heroicLimit} por aventura · {heroicCapacity} {heroicCapacity === 1 ? "graduação heroica comprada" : "graduações heroicas compradas"}
            </span>
          </div>
        </Field>
        <Field label="Usos de Sorte disponíveis">
          <div
            className={`input-with-status ${resources.luckCurrent <= luckCapacity ? "is-valid" : "is-invalid"}`}
          >
            <NumberInput
              value={resources.luckCurrent}
              min={0}
              max={editingMode === "guided" ? luckCapacity : undefined}
              onChange={(luckCurrent) =>
                patch({
                  resources: {
                    ...resources,
                    luckCurrent,
                    luckMax: luckCapacity,
                  },
                })
              }
            />
            <span>
              / {luckCapacity} calculado pela vantagem Sorte
            </span>
          </div>
        </Field>
        <Field label="Fadiga">
          <Select
            value={resources.fatigue}
            onChange={(fatigue) =>
              patch({
                resources: {
                  ...resources,
                  fatigue: fatigue as typeof resources.fatigue,
                },
              })
            }
            options={[
              "Nenhuma",
              "Fatigado",
              "Exausto",
              "Incapacitado",
            ]}
          />
        </Field>
      </div>
      <div className="condition-heading">
        <div>
          <h3 className="form-subheading">Condições atuais</h3>
          <small>
            {resources.conditions.length
              ? `${resources.conditions.length} ${resources.conditions.length === 1 ? "condição ativa" : "condições ativas"}`
              : "Nenhuma condição ativa"}
          </small>
        </div>
        <label className="condition-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Pesquisar condição</span>
          <input
            placeholder="Pesquisar condição…"
            value={conditionQuery}
            onChange={(event) => setConditionQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="condition-grid">
        {visibleConditions.map((condition) => {
          const active = resources.conditions.includes(condition);
          return (
            <label className={active ? "is-active" : ""} key={condition}>
              <input
                checked={active}
                type="checkbox"
                onChange={() =>
                  patch({
                    resources: {
                      ...resources,
                      conditions: active
                        ? resources.conditions.filter(
                            (value) => value !== condition,
                          )
                        : [...resources.conditions, condition],
                    },
                  })
                }
              />
              {condition}
            </label>
          );
        })}
        {!visibleConditions.length && (
          <p className="condition-empty">
            Nenhuma condição corresponde à pesquisa.
          </p>
        )}
      </div>
      <Field label="Histórico e notas" wide>
        <textarea
          rows={8}
          value={sheet.notes}
          onChange={(event) => patch({ notes: event.target.value })}
        />
      </Field>
    </>
  );
}

function AuditEditor({
  sheet,
  patch,
  editingMode,
  onEditingMode,
}: EditorChildProps & {
  editingMode: EditingMode;
  onEditingMode: (mode: EditingMode) => void;
}) {
  const { t } = useLocale();
  const breakdown = getPointBreakdown(sheet);
  const budget = getPointBudget(sheet);
  const audit = getRuleAudit(sheet);
  const setAuditDecision = (
    check: RuleCheck,
    decision: "pending" | "approved" | "rejected",
  ) => {
    const auditDecisions = { ...sheet.auditDecisions };
    if (decision === "pending") {
      delete auditDecisions[check.key];
    } else if (check.reviewFingerprint) {
      auditDecisions[check.key] = {
        decision,
        fingerprint: check.reviewFingerprint,
        decidedAt: new Date().toISOString(),
      };
    }
    patch({ auditDecisions });
  };
  const labels: Record<
    Exclude<keyof typeof breakdown, "total" | "regularSkillRanks" | "specializedSkillRanks">,
    string
  > = {
    abilities: "Atributos",
    combat: "Combate e iniciativa",
    resistances: "Resistências",
    skills: "Perícias",
    advantages: "Vantagens",
    powers: "Poderes",
    adjustments: "Ajuste documentado",
  };
  const pointKeys = Object.keys(labels) as (keyof typeof labels)[];
  const groups: { id: RuleCheck["group"]; label: string }[] = [
    { id: "pl", label: "Limites de Nível de Poder (NP)" },
    { id: "points", label: "Orçamento de PP" },
    { id: "equipment", label: "Equipamento" },
    { id: "powers", label: "Estrutura de poderes" },
    { id: "data", label: "Integridade dos dados" },
  ];
  return (
    <>
      <EditorHeading
        eyebrow="10 · Auditoria"
        title="Custos, limites e decisões"
        text="As cores têm funções claras. Apenas avisos amarelos aceitam decisão manual; verificações objetivas permanecem protegidas."
      />

      <div className="audit-color-legend" aria-label="Legenda da auditoria">
        <span className="status-pass"><i />Verde · correto ou aprovado</span>
        <span className="status-attention"><i />Amarelo · aviso pendente</span>
        <span className="status-fail"><i />Vermelho · erro ou reprovação</span>
        <span className="status-info"><i />Azul · regras liberais para o Narrador e seus NPCs</span>
      </div>

      <div className="points-summary">
        <div>
          <span>Gastos</span>
          <strong>{breakdown.total}</strong>
        </div>
        <div>
          <span>Disponíveis</span>
          <strong>{budget}</strong>
        </div>
        <div className={breakdown.total > budget ? "is-over" : ""}>
          <span>Saldo</span>
          <strong>{budget - breakdown.total}</strong>
        </div>
      </div>

      <div className="calculated-ledger">
        {pointKeys.map((key) => (
          <div key={key}>
            <span>{labels[key]}</span>
            <strong>{breakdown[key]} PP</strong>
          </div>
        ))}
        <div className="ledger-emphasis">
          <span>Total calculado</span>
          <strong>{breakdown.total} PP</strong>
        </div>
      </div>

      {editingMode === "free" ? (
        <div className="manual-adjustment">
          <header>
            <div>
              <h3>Ajuste excepcional</h3>
              <p>
                Use apenas quando uma regra específica ou decisão do Narrador
                não estiver representada pelos campos da ficha.
              </p>
            </div>
          </header>
          <div className="form-grid">
            <Field label="PP adicionados ou devolvidos">
              <NumberInput
                value={sheet.otherPointAdjustment.value}
                onChange={(value) =>
                  patch({
                    otherPointAdjustment: {
                      ...sheet.otherPointAdjustment,
                      value,
                    },
                  })
                }
              />
            </Field>
            <Field label="Regra / justificativa">
              <input
                value={sheet.otherPointAdjustment.reason}
                onChange={(event) =>
                  patch({
                    otherPointAdjustment: {
                      ...sheet.otherPointAdjustment,
                      reason: event.target.value,
                    },
                  })
                }
              />
            </Field>
          </div>
        </div>
      ) : (
        <div className="manual-adjustment locked-adjustment">
          <LockKeyhole aria-hidden="true" />
          <div>
            <h3>Ajuste excepcional protegido</h3>
            <p>
              {sheet.otherPointAdjustment.value
                ? `Esta ficha contém um ajuste de ${signed(sheet.otherPointAdjustment.value)} PP${sheet.otherPointAdjustment.reason.trim() ? ` (${sheet.otherPointAdjustment.reason.trim()})` : " sem justificativa"}. O valor foi preservado, mas exige o modo livre e a confirmação do Narrador.`
                : "No modo assistido, os totais acompanham os campos da ficha. Para aplicar uma regra própria do Narrador, escolha o modo livre."}
            </p>
          </div>
          <button
            className="button button-secondary compact"
            onClick={() => onEditingMode("free")}
            type="button"
          >
            Usar modo livre
          </button>
        </div>
      )}

      <div className={`audit-overview status-${audit.status}`}>
        <StatusIcon status={audit.status} />
        <div>
          <h3>{statusCopy(audit.status).title}</h3>
          <p>
            {formatCount(audit.failures, "erro", "erros")} e {formatCount(audit.attentions, "aviso pendente", "avisos pendentes")}.
            {audit.approvals > 0 && ` ${formatCount(audit.approvals, "aviso aprovado", "avisos aprovados")}.`}
          </p>
        </div>
      </div>

      <div className="audit-groups">
        {groups.map((group) => {
          const checks = audit.checks.filter(
            (check) => check.group === group.id,
          );
          if (!checks.length) return null;
          return (
            <section key={group.id}>
              <h3>{t(group.label)}</h3>
              <div className="audit-check-list">
                {checks.map((check) => (
                  <AuditCheck
                    key={check.key}
                    check={check}
                    onDecision={setAuditDecision}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function AuditCheck({
  check,
  onDecision,
}: {
  check: RuleCheck;
  onDecision: (
    check: RuleCheck,
    decision: "pending" | "approved" | "rejected",
  ) => void;
}) {
  const { language, t } = useLocale();
  const reviewDecision = check.reviewDecision ?? "pending";
  return (
    <div className={`audit-check status-${check.status}`}>
      <StatusIcon status={check.status} />
      <div className="audit-check-copy">
        <strong>{translateRuleText(check.label, language)}</strong>
        <p>{translateRuleText(check.detail, language)}</p>
        {check.baseStatus === "attention" && reviewDecision !== "pending" && (
          <small className="audit-review-result">
            {reviewDecision === "approved"
              ? t("Aviso aprovado e retirado das pendências.")
              : t("Aviso reprovado e tratado como erro.")}
          </small>
        )}
      </div>
      {typeof check.value === "number" && (
        <span className="audit-check-value">
          {formatNumber(check.value)}
          {typeof check.limit === "number"
            ? ` / ${formatNumber(check.limit)}`
            : ""}
        </span>
      )}
      {check.baseStatus === "attention" && (
        <div
          className="audit-review-controls"
          role="group"
          aria-label={`${t("Decisão sobre")} ${translateRuleText(check.label, language)}`}
        >
          <button
            aria-pressed={reviewDecision === "pending"}
            className="review-pending"
            onClick={() => onDecision(check, "pending")}
            title={t("Manter como aviso amarelo")}
            type="button"
          >
            <AlertTriangle aria-hidden="true" /> {t("Manter aviso")}
          </button>
          <button
            aria-pressed={reviewDecision === "approved"}
            className="review-approved"
            onClick={() => onDecision(check, "approved")}
            title={t("Aprovar e marcar em verde")}
            type="button"
          >
            <Check aria-hidden="true" /> {t("Aprovar")}
          </button>
          <button
            aria-pressed={reviewDecision === "rejected"}
            className="review-rejected"
            onClick={() => onDecision(check, "rejected")}
            title={t("Reprovar e tratar como erro vermelho")}
            type="button"
          >
            <XCircle aria-hidden="true" /> {t("Reprovar")}
          </button>
        </div>
      )}
    </div>
  );
}

function CatalogCallout({
  title,
  text,
  onOpen,
}: {
  title: string;
  text: string;
  onOpen: () => void;
}) {
  return (
    <div className="catalog-callout">
      <span aria-hidden="true">
        <LibraryBig />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
      <button className="button button-secondary compact" onClick={onOpen} type="button">
        Abrir catálogo
      </button>
    </div>
  );
}

function CatalogBadge({ label = "Do catálogo" }: { label?: string }) {
  return (
    <span className="catalog-badge" title="Vinculado ao catálogo">
      <Check size={12} aria-hidden="true" /> {label}
    </span>
  );
}

function CatalogDialog({
  title,
  description,
  items,
  onClose,
  onSelect,
}: {
  title: string;
  description: string;
  items: CatalogEntry[];
  onClose: () => void;
  onSelect: (item: CatalogEntry) => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const { language: displayLanguage, setLanguage, t } = useLocale();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const categories = useMemo(
    () => [
      "Todas",
      ...[...new Set(items.map((item) => item.category))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    ],
    [items],
  );
  const visible = useMemo(() => {
    const normalized = normalizeCatalogText(query);
    return items.filter((item) => {
      if (category !== "Todas" && item.category !== category) return false;
      if (!normalized) return true;
      return catalogSearchMatches(item, normalized);
    });
  }, [category, items, query]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
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
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="catalog-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-describedby="catalog-description"
        aria-labelledby="catalog-title"
        aria-modal="true"
        className="catalog-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <header>
          <div>
            <span className="eyebrow">{t("BIBLIOTECA DE CRIAÇÃO")}</span>
            <h2 id="catalog-title">{t(title)}</h2>
            <p id="catalog-description">{t(description)}</p>
          </div>
          <button aria-label={t("Fechar catálogo")} className="icon-button modal-close" onClick={onClose} type="button">
            <X />
          </button>
        </header>
        <div className="catalog-search-row">
          <label className="catalog-search">
            <Search aria-hidden="true" />
            <span className="sr-only">{t("Pesquisar no catálogo")}</span>
            <input
              autoFocus
              placeholder={t("Pesquisar em português ou inglês…")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="catalog-search-meta">
            <span aria-label={t("Idioma do site")} className="catalog-language-toggle">
              <button aria-pressed={displayLanguage === "pt"} onClick={() => setLanguage("pt")} type="button">PT</button>
              <button aria-pressed={displayLanguage === "en"} onClick={() => setLanguage("en")} type="button">EN</button>
            </span>
            <strong>{visible.length} {t(visible.length === 1 ? "resultado" : "resultados")}</strong>
          </div>
        </div>
        <div className="catalog-category-strip" aria-label={t("Filtrar por categoria")}>
          {categories.map((entry) => (
            <button
              className={entry === category ? "is-active" : ""}
              key={entry}
              onClick={() => setCategory(entry)}
              type="button"
            >
              {entry === "Todas"
                ? t(entry)
                : getCatalogCategory(entry, displayLanguage)}
            </button>
          ))}
        </div>
        <div className="catalog-results">
          {visible.map((item) => (
            <button
              className="catalog-result"
              key={item.id}
              onClick={() =>
                onSelect(localizeCatalogSelection(item, displayLanguage))
              }
              type="button"
            >
              <span>
                <small>{getCatalogCategory(item.category, displayLanguage)}</small>
                <strong>{getCatalogName(item, displayLanguage)}</strong>
                {normalizeCatalogText(item.canonical) !==
                  normalizeCatalogText(item.label) && (
                  <em>{displayLanguage === "pt" ? item.canonical : item.label}</em>
                )}
              </span>
              <p>{getCatalogSummary(item, displayLanguage)}</p>
              <b>{t("Adicionar")}</b>
            </button>
          ))}
          {!visible.length && (
            <div className="catalog-empty">
              <Search />
              <strong>{t("Nenhuma opção encontrada")}</strong>
              <p>{t("Limpe o filtro ou use a entrada personalizada da seção.")}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MiniCatalogSelect({
  label,
  items,
  onSelect,
}: {
  label: string;
  items: CatalogEntry[];
  onSelect: (item: CatalogEntry) => void;
}) {
  const { language, t } = useLocale();
  return (
    <label className="mini-catalog-select">
      <LibraryBig aria-hidden="true" />
      <span className="sr-only">{t(label)}</span>
      <select
        aria-label={t(label)}
        value=""
        onChange={(event) => {
          const item = items.find((entry) => entry.id === event.target.value);
          if (item) onSelect(localizeCatalogSelection(item, language));
        }}
      >
        <option value="">{t(label)}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {getCatalogName(item, language)}
            {getCatalogName(item, language) !== (language === "pt" ? item.canonical : item.label)
              ? ` (${language === "pt" ? item.canonical : item.label})`
              : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function SuggestionChips({
  label,
  items,
  onSelect,
}: {
  label: string;
  items: string[];
  onSelect: (item: string) => void;
}) {
  const { t } = useLocale();
  return (
    <details className="suggestion-chips">
      <summary>{t(label)}<span>{items.length}</span></summary>
      <div>
        {items.map((item) => (
          <button key={item} onClick={() => onSelect(item)} type="button">
            <Plus aria-hidden="true" /> {item}
          </button>
        ))}
      </div>
    </details>
  );
}

function FormulaNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="formula-notice">
      <Calculator />
      <p>{children}</p>
    </div>
  );
}

function EditorHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  const { t } = useLocale();
  return (
    <header className="editor-heading">
      <p>{t(eyebrow)}</p>
      <h2>{t(title)}</h2>
      <span>{t(text)}</span>
    </header>
  );
}

function Field({
  label,
  children,
  wide = false,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
  required?: boolean;
}) {
  const { t } = useLocale();
  return (
    <label className={`field ${wide ? "is-wide" : ""}`}>
      <span>
        {t(label)}
        {required && <b aria-hidden="true"> *</b>}
      </span>
      {children}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  ariaLabel,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const normalizedValue = Number.isFinite(value) ? value : 0;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = String(normalizedValue);
    }
  }, [normalizedValue]);

  const commit = (raw: string, restoreInvalid = false) => {
    const numeric = Number(raw);
    if (!raw.trim() || raw === "-" || raw === "+" || !Number.isFinite(numeric)) {
      if (restoreInvalid && inputRef.current) inputRef.current.value = String(normalizedValue);
      return;
    }
    const lowerBounded = min === undefined ? numeric : Math.max(min, numeric);
    const bounded = max === undefined ? lowerBounded : Math.min(max, lowerBounded);
    const origin = min ?? 0;
    const snapped = origin + Math.round((bounded - origin) / step) * step;
    const precision = String(step).split(".")[1]?.length ?? 0;
    const rounded = Number(snapped.toFixed(precision));
    const finalValue = Math.min(max ?? Number.MAX_VALUE, Math.max(min ?? -Number.MAX_VALUE, rounded));
    if (inputRef.current) inputRef.current.value = String(finalValue);
    onChange(finalValue);
  };

  return (
    <input
      aria-label={ariaLabel}
      defaultValue={normalizedValue}
      disabled={disabled}
      inputMode={Number.isInteger(step) ? "numeric" : "decimal"}
      ref={inputRef}
      type="number"
      min={min}
      max={max}
      step={step}
      onBlur={(event) => commit(event.currentTarget.value, true)}
      onChange={(event) => commit(event.currentTarget.value)}
    />
  );
}

type SelectOption = string | { value: string; label: string };

function Select({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel?: string;
}) {
  const { t } = useLocale();
  return (
    <span className="select-wrap">
      <select
        aria-label={ariaLabel ? t(ariaLabel) : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => {
          const item =
            typeof option === "string"
              ? { value: option, label: option }
              : option;
          return (
            <option key={item.value} value={item.value}>
              {t(item.label)}
            </option>
          );
        })}
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </span>
  );
}

function Toggle({
  checked,
  label,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const { t } = useLocale();
  return (
    <label className={`toggle-control ${disabled ? "is-disabled" : ""}`}>
      <input
        checked={checked}
        disabled={disabled}
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      <i />
      <span>{t(label)}</span>
    </label>
  );
}

function NumberCard({
  label,
  abbreviation,
  value,
  derived,
  cost,
  benchmark,
  formula,
  min,
  absent = false,
  absentLocked = false,
  onAbsentChange,
  onChange,
}: {
  label: string;
  abbreviation?: string;
  value: number;
  derived: number;
  cost: number;
  benchmark?: string;
  formula?: string;
  min: number;
  absent?: boolean;
  absentLocked?: boolean;
  onAbsentChange?: (absent: boolean) => void;
  onChange: (value: number) => void;
}) {
  const { t } = useLocale();
  return (
    <div
      className={`number-card calculated-number-card ${absent ? "is-absent" : ""}`}
    >
      <span>
        {t(label)}
        {abbreviation && <small>{abbreviation}</small>}
      </span>
      <NumberInput
        ariaLabel={t(label)}
        value={value}
        min={min}
        disabled={absent}
        onChange={onChange}
      />
      <div>
        <small>{t("Total")}</small>
        <strong>{absent ? "—" : signed(derived)}</strong>
      </div>
      <em>{signed(cost)} PP</em>
      {onAbsentChange && (
        <label className="absent-trait-control">
          <input
            aria-label={`${t(label)} ${t("ausente")}`}
            checked={absent}
            disabled={absentLocked}
            onChange={(event) => onAbsentChange(event.target.checked)}
            type="checkbox"
          />
          {absentLocked ? t("Ausente por Consciência") : t("Ausente")}
        </label>
      )}
      {benchmark && <small className="number-benchmark">{t(benchmark)}</small>}
      {formula && <p>{formula}</p>}
    </div>
  );
}

function Repeater({
  children,
  empty,
  onAdd,
  addLabel,
}: {
  children: React.ReactNode;
  empty: string;
  onAdd: () => void;
  addLabel: string;
}) {
  const { t } = useLocale();
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <div className="repeater">
      {!hasChildren && <p className="editor-empty">{t(empty)}</p>}
      {children}
      <button className="add-row-button" type="button" onClick={onAdd}>
        <Plus size={16} /> {t(addLabel)}
      </button>
    </div>
  );
}

function RepeaterCard({
  title,
  badge,
  children,
  onDelete,
  status,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  onDelete: () => void;
  status?: "pass" | "fail";
}) {
  const { t } = useLocale();
  return (
    <details
      className={`repeater-card ${status ? `status-${status}` : ""}`}
      open
    >
      <summary>
        <span>{t(title)}</span>
        {badge && <b>{badge}</b>}
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <div className="repeater-card-content">
        {children}
        <button className="danger-link" type="button" onClick={onDelete}>
          <Trash2 size={15} /> {t("Remover")}
        </button>
      </div>
    </details>
  );
}

function resistanceBaseAbility(key: ResistanceKey): CoreAbilityKey {
  if (key === "dodge") return "agility";
  if (key === "will") return "awareness";
  return "stamina";
}

function StatusIcon({ status }: { status: RuleStatus }) {
  if (status === "pass") return <CheckCircle2 aria-hidden="true" />;
  if (status === "fail") return <XCircle aria-hidden="true" />;
  if (status === "attention")
    return <AlertTriangle aria-hidden="true" />;
  return <Info aria-hidden="true" />;
}

function statusCopy(status: RuleStatus) {
  if (status === "pass") {
    return {
      title: "Cálculos validados",
      detail: "Nenhum erro objetivo nem aviso aguardando decisão.",
    };
  }
  if (status === "fail") {
    return {
      title: "Erros objetivos encontrados",
      detail: "Abra a auditoria para ver cada regra violada.",
    };
  }
  if (status === "attention") {
    return {
      title: "Avisos aguardando decisão",
      detail: "Mantenha em amarelo, aprove em verde ou reprove em vermelho.",
    };
  }
  return {
    title: "Liberdades do Narrador",
    detail: "O azul identifica regras mais liberais disponíveis ao Narrador e aos seus NPCs.",
  };
}

function signed(value: number) {
  const numeric = Number(value) || 0;
  return numeric > 0 ? `+${formatNumber(numeric)}` : formatNumber(numeric);
}

function formatCount(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function appendSuggestion(current: string, value: string) {
  const normalized = normalizeCatalogText(current);
  if (normalized.includes(normalizeCatalogText(value))) return current;
  return current.trim() ? `${current.trim()} · ${value}` : value;
}

function appendDescriptor(current: string, group: string, value: string) {
  const token = `${group}: ${value}`;
  if (normalizeCatalogText(current).includes(normalizeCatalogText(token))) {
    return current;
  }
  return current.trim() ? `${current.trim()} · ${token}` : token;
}

function applyRankedModifierPreset(
  effect: PowerEffectEntry,
  preset: RankedModifierPreset,
  type: "extra" | "flaw",
): PowerEffectEntry {
  const key = type === "extra" ? "extras" : "flaws";
  if (
    effect[key].some(
      (entry) =>
        normalizeCatalogText(entry.name) ===
        normalizeCatalogText(preset.label),
    )
  ) {
    return effect;
  }
  let next: PowerEffectEntry = {
    ...effect,
    [key]: [
      ...effect[key],
      {
        id: newId("modifier"),
        name: preset.label,
        value: preset.value,
        ranksApplied: 0,
      },
    ],
  };
  if (type === "extra") {
    if (preset.id === "increased-range") {
      next = { ...next, range: stepRange(next.range, 1) };
      if (next.range === "À distância") next.attackRange = "ranged";
      if (next.range === "Percepção") next.requiresAttackCheck = false;
    } else if (preset.id === "increased-duration") {
      next = { ...next, duration: stepDuration(next.duration, 1) };
    } else if (preset.id === "area-effect") {
      next = { ...next, requiresAttackCheck: false };
    } else if (preset.id === "permanent") {
      next = { ...next, duration: "Permanente" };
    } else if (preset.id === "sustained") {
      next = { ...next, duration: "Sustentada" };
    } else if (preset.id === "throw") {
      next = {
        ...next,
        range: "À distância",
        attackRange: "ranged",
        requiresAttackCheck: true,
      };
    } else if (preset.id === "affects-others" && next.range === "Pessoal") {
      next = { ...next, range: "Perto" };
    }
  } else if (preset.id === "decreased-range") {
    next = { ...next, range: stepRange(next.range, -1) };
    if (next.range === "Perto") next.attackRange = "close";
    if (next.isAttack && next.range !== "Percepção") {
      next.requiresAttackCheck = true;
    }
  } else if (preset.id === "decreased-duration") {
    next = { ...next, duration: stepDuration(next.duration, -1) };
  } else if (preset.id === "increased-action") {
    next = { ...next, action: stepAction(next.action, 1) };
  } else if (preset.id === "grab-based") {
    next = {
      ...next,
      range: "Perto",
      attackRange: "close",
      requiresAttackCheck: true,
    };
  }
  return next;
}

function applyFlatModifierPreset(
  effect: PowerEffectEntry,
  preset: FlatModifierPreset,
  type: "feature" | "drawback",
): PowerEffectEntry {
  const key = type === "feature" ? "features" : "drawbacks";
  if (
    effect[key].some(
      (entry) =>
        normalizeCatalogText(entry.name) ===
        normalizeCatalogText(preset.label),
    )
  ) {
    return effect;
  }
  const next: PowerEffectEntry = {
    ...effect,
    [key]: [
      ...effect[key],
      {
        id: newId("modifier"),
        name: preset.label,
        rank: preset.rank,
        rule: preset.rule,
      },
    ],
  };
  return preset.id === "reaction"
    ? { ...next, action: "Reação" }
    : next;
}

function stepRange(value: string, direction: 1 | -1) {
  const steps = ["Pessoal", "Perto", "À distância", "Percepção"];
  return stepOption(value, steps, direction);
}

function stepDuration(value: string, direction: 1 | -1) {
  const steps = [
    "Instantânea",
    "Concentração",
    "Sustentada",
    "Contínua",
    "Permanente",
  ];
  return stepOption(value, steps, direction);
}

function stepAction(value: string, direction: 1 | -1) {
  const steps = ["Livre", "Simples", "Padrão", "Completa"];
  return stepOption(value, steps, direction);
}

function stepOption(value: string, steps: string[], direction: 1 | -1) {
  const index = steps.indexOf(value);
  if (index < 0) return value;
  return steps[Math.max(0, Math.min(steps.length - 1, index + direction))];
}

function attackFromEffect(
  effect: PowerEffectEntry,
  fallbackName: string,
): CharacterSheet["attacks"][number] {
  return {
    id: newId("attack"),
    name: effect.name || fallbackName,
    sourceEffectId: effect.id,
    sourceEquipmentId: "",
    range: effect.requiresAttackCheck ? effect.attackRange : "no-check",
    effectRank: effect.rank,
    strengthBased: effect.strengthBased,
    manualEffectSource: "other",
    manualEffectSourceNote: "",
    specializationId: "",
    miscellaneousAttackBonus: 0,
    miscellaneousAttackSource: "",
    resistance: effect.resistance,
    notes: "Gerado automaticamente a partir do efeito vinculado.",
  };
}

function attackFromEquipment(
  item: CharacterSheet["equipment"][number],
  preset: EquipmentPreset,
): CharacterSheet["attacks"][number] {
  const attack = preset.attack!;
  return {
    id: newId("attack"),
    name: item.name,
    sourceEffectId: "",
    sourceEquipmentId: item.id,
    range: attack.range,
    effectRank: attack.effectRank,
    strengthBased: attack.strengthBased,
    manualEffectSource: "equipment",
    manualEffectSourceNote: item.name,
    specializationId: "",
    miscellaneousAttackBonus: 0,
    miscellaneousAttackSource: "",
    resistance: attack.resistance,
    notes: "Gerado automaticamente a partir do equipamento vinculado.",
  };
}

function setEquipmentAdvantageRank(
  advantages: CharacterSheet["advantages"],
  rank: number,
): CharacterSheet["advantages"] {
  const indices = advantages
    .map((advantage, index) =>
      findAdvantagePreset(advantage.name, advantage.catalogKey)?.id ===
      "equipment"
        ? index
        : -1,
    )
    .filter((index) => index >= 0);
  const withoutDuplicates = advantages.filter(
    (_, index) => !indices.slice(1).includes(index),
  );
  const first = indices[0];
  if (rank <= 0) {
    return first === undefined
      ? withoutDuplicates
      : withoutDuplicates.filter(
          (advantage) =>
            findAdvantagePreset(
              advantage.name,
              advantage.catalogKey,
            )?.id !== "equipment",
        );
  }
  if (first !== undefined) {
    const adjustedIndex = withoutDuplicates.findIndex(
      (advantage) =>
        findAdvantagePreset(advantage.name, advantage.catalogKey)?.id ===
        "equipment",
    );
    const current = withoutDuplicates[adjustedIndex];
    return updateAt(withoutDuplicates, adjustedIndex, {
      ...current,
      catalogKey: "equipment",
      name: "Equipamento",
      rank,
      categories: ["Geral"],
      kind: "equipment",
    });
  }
  return [
    ...withoutDuplicates,
    {
      id: newId("advantage"),
      catalogKey: "equipment",
      name: "Equipamento",
      rank,
      categories: ["Geral"],
      kind: "equipment",
      notes: "Ajustada automaticamente pelos itens configurados.",
    },
  ];
}

function luckCapacityFromAdvantages(
  advantages: CharacterSheet["advantages"],
) {
  return advantages.reduce((total, advantage) => {
    const preset = findAdvantagePreset(
      advantage.name,
      advantage.catalogKey,
    );
    return total +
      (preset?.id === "luck" ? Math.max(0, advantage.rank) : 0);
  }, 0);
}

function updateAt<T>(items: T[], index: number, value: T) {
  return items.map((item, itemIndex) =>
    itemIndex === index ? value : item,
  );
}

function removeAt<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index);
}
