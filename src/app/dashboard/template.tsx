import type { ReactNode } from "react";
import { PrivateWorkspace } from "@/modules/auth/components/private-workspace";
export default function DashboardTemplate({ children }: { children: ReactNode }) { return <PrivateWorkspace returnTo="/dashboard">{children}</PrivateWorkspace>; }
