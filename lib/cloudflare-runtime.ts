export async function getWorkerEnv() {
  try {
    const moduleName = "cloudflare:workers";
    const runtime = await import(/* webpackIgnore: true */ moduleName);
    return runtime.env;
  } catch {
    return {} as Record<string, unknown>;
  }
}
