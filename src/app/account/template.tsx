import type { ReactNode } from "react";
import { PrivateWorkspace } from "@/modules/auth/components/private-workspace";
export default function AccountTemplate({ children }: { children: ReactNode }) { return <PrivateWorkspace returnTo="/account">{children}</PrivateWorkspace>; }
