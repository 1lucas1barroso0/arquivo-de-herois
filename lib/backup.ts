import { newId, normalizeSheet, type CharacterSheet } from "./character";
import { normalizeCampaign, type Campaign } from "./workspace";

export const BACKUP_FORMAT = "arquivo-de-herois-backup" as const;
export const CURRENT_BACKUP_VERSION = 1 as const;

export type ArchiveBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof CURRENT_BACKUP_VERSION;
  application: "Arquivo de Heróis";
  exportedAt: string;
  characters: CharacterSheet[];
  campaigns: Campaign[];
};

export function createArchiveBackup(
  characters: readonly CharacterSheet[],
  campaigns: readonly Campaign[],
  now = new Date(),
): ArchiveBackup {
  const backup: ArchiveBackup = {
    format: BACKUP_FORMAT,
    version: CURRENT_BACKUP_VERSION,
    application: "Arquivo de Heróis",
    exportedAt: now.toISOString(),
    characters: characters.map(normalizeSheet),
    campaigns: campaigns.map(normalizeCampaign),
  };
  return backup;
}

export function archiveBackupToJson(backup: ArchiveBackup) {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export function parseArchiveBackup(value: string | unknown): ArchiveBackup {
  const raw = typeof value === "string" ? parseJson(value) : value;
  if (!raw || typeof raw !== "object") {
    throw new Error("O backup não contém uma estrutura reconhecível.");
  }
  const record = raw as Record<string, unknown>;
  if (record.format !== BACKUP_FORMAT) {
    throw new Error("Este arquivo não é um backup completo do Arquivo de Heróis.");
  }
  const version = Number(record.version);
  if (!Number.isFinite(version) || version < 1) {
    throw new Error("A versão do backup é inválida e nenhuma informação foi importada.");
  }
  if (version > CURRENT_BACKUP_VERSION) {
    throw new Error("Este backup foi criado por uma versão mais nova do Arquivo de Heróis.");
  }
  if (!Array.isArray(record.characters) || !Array.isArray(record.campaigns)) {
    throw new Error("O backup está incompleto e nenhuma informação foi importada.");
  }
  const backup: ArchiveBackup = {
    format: BACKUP_FORMAT,
    version: CURRENT_BACKUP_VERSION,
    application: "Arquivo de Heróis",
    exportedAt:
      typeof record.exportedAt === "string"
        ? record.exportedAt
        : new Date(0).toISOString(),
    characters: record.characters.map(normalizeSheet),
    campaigns: record.campaigns.map(normalizeCampaign),
  };
  assertStableIds(backup.characters.map((entry) => entry.id), "fichas");
  assertStableIds(backup.campaigns.map((entry) => entry.id), "campanhas");
  return backup;
}

export function duplicateBackupForImport(backup: ArchiveBackup) {
  const characterIdMap = new Map<string, string>();
  const campaignIdMap = new Map<string, string>();
  for (const entry of backup.characters) {
    if (entry.id) characterIdMap.set(entry.id, newId("character"));
  }
  for (const entry of backup.campaigns) {
    if (entry.id) campaignIdMap.set(entry.id, newId("campaign"));
  }
  const characters = backup.characters.map((entry) => {
    const id = newId("character");
    const mappedId = entry.id ? characterIdMap.get(entry.id) ?? id : id;
    return normalizeSheet({
      ...entry,
      id: mappedId,
      heroName: entry.heroName,
      campaignIds: entry.campaignIds.map(
        (campaignId) => campaignIdMap.get(campaignId) ?? campaignId,
      ),
      relationships: entry.relationships.map((relationship) => ({
        ...relationship,
        id: newId("relationship"),
        targetSheetId:
          characterIdMap.get(relationship.targetSheetId) ??
          relationship.targetSheetId,
      })),
      shareEnabled: false,
      shareToken: null,
      createdAt: undefined,
      updatedAt: undefined,
    });
  });
  const campaigns = backup.campaigns.map((entry) => {
    const memberIdMap = new Map(
      entry.members.map((member) => [member.id, newId("member")]),
    );
    return normalizeCampaign({
      ...entry,
      id: entry.id
        ? campaignIdMap.get(entry.id) ?? newId("campaign")
        : newId("campaign"),
      members: entry.members.map((member) => ({
        ...member,
        id: memberIdMap.get(member.id) ?? newId("member"),
        sheetId: characterIdMap.get(member.sheetId) ?? member.sheetId,
      })),
      teams: entry.teams.map((team) => ({
        ...team,
        id: newId("team"),
        memberIds: team.memberIds.map(
          (memberId) => memberIdMap.get(memberId) ?? memberId,
        ),
      })),
      organizations: entry.organizations.map((organization) => ({
        ...organization,
        id: newId("organization"),
        memberIds: organization.memberIds.map(
          (memberId) => memberIdMap.get(memberId) ?? memberId,
        ),
      })),
      createdAt: undefined,
      updatedAt: undefined,
    });
  });
  return { characters, campaigns };
}

export function remapImportedCharacter(
  source: CharacterSheet,
  characterIdMap: ReadonlyMap<string, string>,
  campaignIdMap: ReadonlyMap<string, string> = new Map(),
) {
  return normalizeSheet({
    ...source,
    id: characterIdMap.get(source.id) ?? source.id,
    campaignIds: source.campaignIds.map(
      (campaignId) => campaignIdMap.get(campaignId) ?? campaignId,
    ),
    relationships: source.relationships.map((relationship) => ({
      ...relationship,
      targetSheetId:
        characterIdMap.get(relationship.targetSheetId) ??
        relationship.targetSheetId,
    })),
    shareEnabled: false,
    shareToken: null,
  });
}

export function remapImportedCampaign(
  source: Campaign,
  characterIdMap: ReadonlyMap<string, string>,
) {
  const memberIdMap = new Map(
    source.members.map((member) => [member.id, newId("member")]),
  );
  return normalizeCampaign({
    ...source,
    id: "",
    members: source.members.map((member) => ({
      ...member,
      id: memberIdMap.get(member.id),
      sheetId: characterIdMap.get(member.sheetId) ?? member.sheetId,
    })),
    teams: source.teams.map((team) => ({
      ...team,
      id: newId("team"),
      memberIds: team.memberIds.map(
        (memberId) => memberIdMap.get(memberId) ?? memberId,
      ),
    })),
    organizations: source.organizations.map((organization) => ({
      ...organization,
      id: newId("organization"),
      memberIds: organization.memberIds.map(
        (memberId) => memberIdMap.get(memberId) ?? memberId,
      ),
    })),
    createdAt: undefined,
    updatedAt: undefined,
  });
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error("O backup não é um JSON válido; os dados atuais continuam seguros.");
  }
}

function assertStableIds(ids: readonly string[], label: string) {
  if (ids.some((id) => !id.trim())) {
    throw new Error(`O backup contém ${label} sem identificador e não foi importado.`);
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error(`O backup contém identificadores duplicados em ${label} e não foi importado.`);
  }
}
