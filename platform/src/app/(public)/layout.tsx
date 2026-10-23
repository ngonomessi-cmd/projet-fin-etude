import { EnTetePublic } from "@/components/site-public/EnTetePublic";
import { PiedDePagePublic } from "@/components/site-public/PiedDePagePublic";

export default function LayoutPublic({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1c2029]">
      <EnTetePublic />
      <main className="flex-1">{children}</main>
      <PiedDePagePublic />
    </div>
  );
}
