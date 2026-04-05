import dynamic from "next/dynamic";

const InboxCapture = dynamic(
  () => import("@/components/inbox/InboxCapture"),
  { ssr: false }
);

export default function InboxPage() {
  return <InboxCapture />;
}