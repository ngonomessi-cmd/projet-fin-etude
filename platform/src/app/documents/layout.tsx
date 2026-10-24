import { CoqueLangue } from "@/components/i18n/CoqueLangue";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CoqueLangue>{children}</CoqueLangue>;
}
