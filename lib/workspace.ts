import { newId } from "./character";
import type { EncounterDefinition } from "./encounter";

export const CURRENT_CAMPAIGN_SCHEMA_VERSION = 1 as const;

export type CampaignMemberRole =
  | "player-character"
  | "npc"
  | "villain"
  | "ally";

export type CampaignMember = {
  id: string;
  sheetId: string;
  name: string;
  role: CampaignMemberRole;
};

export type CampaignTeam = {
  id: string;
  name: string;
  memberIds: string[];
  notes: string;
};

export type CampaignOrganization = {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
};

export type CampaignLocation = {
  id: string;
  name: string;
  description: string;
};

export type CampaignResource = {
  id: string;
  name: string;
  details: string;
};

export type Campaign = {
  schemaVersion: typeof CURRENT_CAMPAIGN_SCHEMA_VERSION;
  id: string;
  name: string;
  description: string;
  gameMaster: string;
  members: CampaignMember[];
  teams: CampaignTeam[];
  organizations: CampaignOrganization[];
  locations: CampaignLocation[];
  encounters: EncounterDefinition[];
  resources: CampaignResource[];
  notes: string;
  archived: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CampaignSummary = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  encounterCount: number;
  archived: boolean;
  updatedAt?: string;
};

export function createEmptyCampaign(): Campaign {
  return {
    schemaVersion: CURRENT_CAMPAIGN_SCHEMA_VERSION,
    id: "",
    name: "Nova campanha",
    description: "",
    gameMaster: "",
    members: [],
    teams: [],
    organizations: [],
    locations: [],
    encounters: [],
    resources: [],
    notes: "",
    archived: false,
  };
}

export function normalizeCampaign(value: unknown): Campaign {
  const raw = asRecord(value);
  const base = createEmptyCampaign();
  return {
    ...base,
    id: text(raw.id),
    name: text(raw.name, base.name),
    description: text(raw.description),
    gameMaster: text(raw.gameMaster),
    members: Array.isArray(raw.members)
      ? raw.members.map(normalizeMember)
      : [],
    teams: Array.isArray(raw.teams) ? raw.teams.map(normalizeTeam) : [],
    organizations: Array.isArray(raw.organizations)
      ? raw.organizations.map(normalizeOrganization)
      : [],
    locations: Array.isArray(raw.locations)
      ? raw.locations.map(normalizeLocation)
      : [],
    encounters: Array.isArray(raw.encounters)
      ? raw.encounters.map(normalizeEncounter)
      : [],
    resources: Array.isArray(raw.resources)
      ? raw.resources.map(normalizeResource)
      : [],
    notes: text(raw.notes),
    archived: Boolean(raw.archived),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  };
}

export function createCampaignSummary(value: Campaign): CampaignSummary {
  const campaign = normalizeCampaign(value);
  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    memberCount: campaign.members.length,
    encounterCount: campaign.encounters.length,
    archived: campaign.archived,
    updatedAt: campaign.updatedAt,
  };
}

function normalizeMember(value: unknown): CampaignMember {
  const raw = asRecord(value);
  const roles: readonly CampaignMemberRole[] = [
    "player-character",
    "npc",
    "villain",
    "ally",
  ];
  return {
    id: text(raw.id, newId("member")),
    sheetId: text(raw.sheetId),
    name: text(raw.name),
    role: roles.includes(raw.role as CampaignMemberRole)
      ? (raw.role as CampaignMemberRole)
      : "npc",
  };
}

function normalizeTeam(value: unknown): CampaignTeam {
  const raw = asRecord(value);
  return {
    id: text(raw.id, newId("team")),
    name: text(raw.name, "Equipe"),
    memberIds: strings(raw.memberIds),
    notes: text(raw.notes),
  };
}

function normalizeOrganization(value: unknown): CampaignOrganization {
  const raw = asRecord(value);
  return {
    id: text(raw.id, newId("organization")),
    name: text(raw.name, "Organização"),
    description: text(raw.description),
    memberIds: strings(raw.memberIds),
  };
}

function normalizeLocation(value: unknown): CampaignLocation {
  const raw = asRecord(value);
  return {
    id: text(raw.id, newId("location")),
    name: text(raw.name, "Local"),
    description: text(raw.description),
  };
}

function normalizeResource(value: unknown): CampaignResource {
  const raw = asRecord(value);
  return {
    id: text(raw.id, newId("campaign-resource")),
    name: text(raw.name, "Recurso"),
    details: text(raw.details),
  };
}

function normalizeEncounter(value: unknown): EncounterDefinition {
  const raw = asRecord(value);
  const pressure = [
    "secondary",
    "low",
    "standard",
    "severe",
    "extreme",
  ].includes(String(raw.pressure))
    ? (raw.pressure as EncounterDefinition["pressure"])
    : "standard";
  return {
    id: text(raw.id, newId("encounter")),
    name: text(raw.name, "Encontro"),
    participants: Array.isArray(raw.participants)
      ? raw.participants.map((entry) => {
          const participant = asRecord(entry);
          return {
            id: text(participant.id, newId("participant")),
            sheetId: text(participant.sheetId),
            name: text(participant.name),
            powerLevel: number(participant.powerLevel, 10),
            quantity: Math.max(0, Math.floor(number(participant.quantity, 1))),
            side: participant.side === "ally" ? "ally" : "threat",
            role: text(participant.role),
          };
        })
      : [],
    referencePowerLevel:
      raw.referencePowerLevel === null || raw.referencePowerLevel === undefined
        ? null
        : number(raw.referencePowerLevel, 10),
    pressure,
    notes: text(raw.notes),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function strings(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((entry): entry is string => typeof entry === "string"))]
    : [];
}
