import type { ReactNode } from "react";
import { PrivateWorkspace } from "@/modules/auth/components/private-workspace";
export default function PlatformTemplate({ children }: { children: ReactNode }) { return <PrivateWorkspace returnTo="/platform/admin">{children}</PrivateWorkspace>; }
