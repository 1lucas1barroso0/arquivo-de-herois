import { createCharacter, listCharacters } from "../../../db/characters";
import { createEmptySheet } from "../../../lib/character";
import { apiError, getOwnerId, parseSheetPayload } from "../../../lib/server";

export async function GET(request: Request) {
  try {
    const ownerId = await getOwnerId(request);
    const characters = await listCharacters(ownerId);
    return Response.json({ characters });
  } catch (error) {
    return apiError(error, "Não foi possível carregar as fichas.");
  }
}

export async function POST(request: Request) {
  try {
    const ownerId = await getOwnerId(request);
    const payload = await request.json().catch(() => ({}));
    const sheet = parseSheetPayload(
      payload && typeof payload === "object" && "sheet" in payload
        ? (payload as { sheet: unknown }).sheet
        : createEmptySheet(),
    );
    sheet.id = "";
    const character = await createCharacter(sheet, ownerId);
    return Response.json({ character }, { status: 201 });
  } catch (error) {
    return apiError(error, "Não foi possível criar a ficha.");
  }
}

