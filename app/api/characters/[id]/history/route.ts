import { listCharacterRevisions } from "../../../../../db/workspace";
import { apiError, getOwnerId } from "../../../../../lib/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const revisions = await listCharacterRevisions(id, await getOwnerId(request));
    return Response.json({ revisions });
  } catch (error) {
    return apiError(error, "Não foi possível carregar o histórico da ficha.");
  }
}
