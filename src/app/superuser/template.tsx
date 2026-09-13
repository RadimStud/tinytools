import type { ReactNode } from "react";
import { PrivateWorkspace } from "@/modules/auth/components/private-workspace";
export default function SuperuserTemplate({ children }: { children: ReactNode }) { return <PrivateWorkspace returnTo="/superuser">{children}</PrivateWorkspace>; }
