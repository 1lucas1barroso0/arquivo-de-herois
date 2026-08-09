import { setCharacterSharing } from "../../../../../db/characters";
import { apiError, getOwnerId } from "../../../../../lib/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ownerId = await getOwnerId(request);
    const payload = (await request.json().catch(() => ({}))) as {
      enabled?: boolean;
    };
    const character = await setCharacterSharing(id, ownerId, Boolean(payload.enabled));
    if (!character) {
      return Response.json({ error: "Ficha não encontrada." }, { status: 404 });
    }
    return Response.json({
      enabled: character.shareEnabled,
      token: character.shareToken,
      path: character.shareToken ? `/share/${character.shareToken}` : null,
    });
  } catch (error) {
    return apiError(error, "Não foi possível alterar o compartilhamento.");
  }
}

