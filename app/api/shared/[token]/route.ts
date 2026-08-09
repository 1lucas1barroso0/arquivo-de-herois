import { getSharedCharacter } from "../../../../db/characters";
import { apiError } from "../../../../lib/server";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const character = await getSharedCharacter(token);
    if (!character) {
      return Response.json(
        { error: "Este endereço não corresponde a uma ficha compartilhada." },
        { status: 404 },
      );
    }
    return Response.json({ character }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error, "Não foi possível abrir a ficha compartilhada.");
  }
}
