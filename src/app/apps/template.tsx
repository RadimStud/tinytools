import type { ReactNode } from "react";
import { PrivateWorkspace } from "@/modules/auth/components/private-workspace";
export default function AppsTemplate({ children }: { children: ReactNode }) { return <PrivateWorkspace returnTo="/apps">{children}</PrivateWorkspace>; }
