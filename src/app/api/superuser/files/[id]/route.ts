import { services } from "@/server/services";
import { requireSameOrigin, vaultResponse, vaultFailure } from "@/modules/superuser/http";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    await services.vault.complete((await context.params).id);
    return vaultResponse({ ok: true });
  } catch (error) { return vaultFailure(error); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    await services.vault.remove((await context.params).id);
    return vaultResponse({ ok: true });
  } catch (error) { return vaultFailure(error); }
}
