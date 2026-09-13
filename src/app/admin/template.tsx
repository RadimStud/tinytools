import type { ReactNode } from "react";
import { PrivateWorkspace } from "@/modules/auth/components/private-workspace";
export default function AdminTemplate({ children }: { children: ReactNode }) { return <PrivateWorkspace returnTo="/admin">{children}</PrivateWorkspace>; }
