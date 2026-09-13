import "server-only";
import { gatewayConfig, configuredSigner } from "@/modules/platform/gateway/config";
import { OrionGateway } from "@/modules/platform/gateway/gateway";
import { PostgresGatewayPolicy } from "@/modules/platform/gateway/repository";

export async function orionGateway() {
  const config = gatewayConfig();
  const [{ services }, { sql }] = await Promise.all([import("@/server/services"), import("@/infrastructure/db/client")]);
  return new OrionGateway({ origin: config.origin, upstream: config.upstream, sign: await configuredSigner(config),
    policy: new PostgresGatewayPolicy(sql),
    session: async () => {
      const session = await services.auth.getAuthenticatedSession();
      return session?.sessionId ? { subject: session.user.id, sessionId: session.sessionId } : null;
    },
  });
}
