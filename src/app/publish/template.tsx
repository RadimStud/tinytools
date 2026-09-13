import type { ReactNode } from "react";
import { PrivateWorkspace } from "@/modules/auth/components/private-workspace";
export default function PublishTemplate({ children }: { children: ReactNode }) { return <PrivateWorkspace returnTo="/publish">{children}</PrivateWorkspace>; }
