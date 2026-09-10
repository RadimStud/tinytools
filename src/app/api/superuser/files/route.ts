import { services } from "@/server/services";
import { requireSameOrigin, vaultResponse, vaultFailure } from "@/modules/superuser/http";
import { VaultError } from "@/modules/superuser/domain/vault";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return vaultResponse({ files: await services.vault.list() }); }
  catch (error) { return vaultFailure(error); }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await services.vault.requireUser();
    const text = await request.text();
    if (text.length > 4096) throw new VaultError("Upload metadata is too large.", 400);
    let data;
    try { data = JSON.parse(text); } catch { throw new VaultError("Invalid upload metadata.", 400); }
    return vaultResponse(await services.vault.prepare(data?.name, data?.size));
  } catch (error) { return vaultFailure(error); }
}
