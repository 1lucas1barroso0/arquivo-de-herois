import { getCharacterRevision } from "../../../../../../db/workspace";
import { apiError, getOwnerId } from "../../../../../../lib/server";

type RouteContext = {
  params: Promise<{ id: string; revisionId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id, revisionId } = await context.params;
    const revision = await getCharacterRevision(
      id,
      revisionId,
      await getOwnerId(request),
    );
    return revision
      ? Response.json({ revision })
      : Response.json({ error: "Versão não encontrada." }, { status: 404 });
  } catch (error) {
    return apiError(error, "Não foi possível abrir esta versão.");
  }
}
