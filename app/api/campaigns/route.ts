import { createCampaign, listCampaigns } from "../../../db/workspace";
import { createEmptyCampaign, normalizeCampaign } from "../../../lib/workspace";
import { apiError, getOwnerId } from "../../../lib/server";

export async function GET(request: Request) {
  try {
    const ownerId = await getOwnerId(request);
    return Response.json({ campaigns: await listCampaigns(ownerId) });
  } catch (error) {
    return apiError(error, "Não foi possível carregar as campanhas.");
  }
}

export async function POST(request: Request) {
  try {
    const ownerId = await getOwnerId(request);
    const payload = (await request.json().catch(() => ({}))) as {
      campaign?: unknown;
    };
    const campaign = normalizeCampaign(payload.campaign ?? createEmptyCampaign());
    campaign.id = "";
    return Response.json(
      { campaign: await createCampaign(campaign, ownerId) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error, "Não foi possível criar a campanha.");
  }
}
