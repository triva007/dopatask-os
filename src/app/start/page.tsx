import dynamic from "next/dynamic";

const ModeChooser = dynamic(() => import("@/components/start/ModeChooser"), { ssr: false });

export default function StartPage() {
  return <ModeChooser />;
}
