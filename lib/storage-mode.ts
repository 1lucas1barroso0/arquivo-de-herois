export const STORAGE_MODE_HEADER = "x-arquivo-storage-mode";
export const LOCAL_STORAGE_MODE = "local";

export class StorageUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageUnavailableError";
  }
}

export function isLocalStorageFallbackResponse(
  response: Pick<Response, "status" | "headers">,
) {
  return (
    response.status === 503 &&
    response.headers.get(STORAGE_MODE_HEADER) === LOCAL_STORAGE_MODE
  );
}
