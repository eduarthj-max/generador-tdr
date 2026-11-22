// Verificación de salud para el hosting (no requiere contraseña).
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, apiKeyConfigurada: Boolean(process.env.ANTHROPIC_API_KEY) });
}
