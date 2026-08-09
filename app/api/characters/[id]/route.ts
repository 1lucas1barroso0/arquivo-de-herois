import {
  deleteCharacter,
  getCharacter,
  updateCharacter,
} from "../../../../db/characters";
import { apiError, getOwnerId, parseSheetPayload } from "../../../../lib/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ownerId = await getOwnerId(request);
    const character = await getCharacter(id, ownerId);
    if (!character) {
      return Response.json({ error: "Ficha não encontrada." }, { status: 404 });
    }
    return Response.json({ character });
  } catch (error) {
    return apiError(error, "Não foi possível carregar a ficha.");
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ownerId = await getOwnerId(request);
    const payload = (await request.json()) as { sheet?: unknown };
    const sheet = parseSheetPayload(payload.sheet);
    const character = await updateCharacter(id, sheet, ownerId);
    if (!character) {
      return Response.json({ error: "Ficha não encontrada." }, { status: 404 });
    }
    return Response.json({ character });
  } catch (error) {
    return apiError(error, "Não foi possível salvar a ficha.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ownerId = await getOwnerId(request);
    const deleted = await deleteCharacter(id, ownerId);
    if (!deleted) {
      return Response.json({ error: "Ficha não encontrada." }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error, "Não foi possível excluir a ficha.");
  }
}

