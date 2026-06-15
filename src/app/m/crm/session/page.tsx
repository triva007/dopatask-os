import dynamic from "next/dynamic";

const MobileColdCallSession = dynamic(
  () => import("@/components/mobile/crm/MobileColdCallSession"),
  { ssr: false }
);

export default function MobileColdCallSessionPage() {
  return <MobileColdCallSession />;
}
