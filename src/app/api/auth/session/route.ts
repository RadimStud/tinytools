export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };
export async function GET() {
  if (process.env.MINIKIT_PLATFORM_ENABLED !== "1") return Response.json({ error: "platform_disabled" }, { status: 404, headers });
  try {
    const { services } = await import("@/server/services");
    const user = await services.auth.getAuthenticatedUser();
    if (!user) return Response.json({ error: "unauthenticated" }, { status: 401, headers });
    return Response.json({ data: { subject: user.id } }, { headers });
  } catch {
    return Response.json({ error: "session_unavailable" }, { status: 503, headers });
  }
}
