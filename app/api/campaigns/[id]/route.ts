import {
  deleteCampaign,
  getCampaign,
  updateCampaign,
} from "../../../../db/workspace";
import { normalizeCampaign } from "../../../../lib/workspace";
import { apiError, getOwnerId } from "../../../../lib/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const campaign = await getCampaign(id, await getOwnerId(request));
    return campaign
      ? Response.json({ campaign })
      : Response.json({ error: "Campanha não encontrada." }, { status: 404 });
  } catch (error) {
    return apiError(error, "Não foi possível carregar a campanha.");
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ownerId = await getOwnerId(request);
    const payload = (await request.json()) as { campaign?: unknown };
    const campaign = await updateCampaign(
      id,
      normalizeCampaign(payload.campaign),
      ownerId,
    );
    return campaign
      ? Response.json({ campaign })
      : Response.json({ error: "Campanha não encontrada." }, { status: 404 });
  } catch (error) {
    return apiError(error, "Não foi possível salvar a campanha.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await deleteCampaign(id, await getOwnerId(request));
    return deleted
      ? new Response(null, { status: 204 })
      : Response.json({ error: "Campanha não encontrada." }, { status: 404 });
  } catch (error) {
    return apiError(error, "Não foi possível excluir a campanha.");
  }
}
