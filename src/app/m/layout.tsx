import dynamic from "next/dynamic";

const MobileLayout = dynamic(() => import("@/components/mobile/MobileLayout"), {
  ssr: false,
});

export default function MobileRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileLayout>{children}</MobileLayout>;
}
