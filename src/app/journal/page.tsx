import dynamic from "next/dynamic";

const JournalView = dynamic(
  () => import("@/components/journal/JournalView"),
  { ssr: false }
);

export default function JournalPage() {
  return <JournalView />;
}
