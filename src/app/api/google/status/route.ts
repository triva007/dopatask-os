import { NextResponse } from "next/server";
import { getValidAccessToken, getStoredEmail } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await getValidAccessToken();
  const email = await getStoredEmail();
  return NextResponse.json({
    connected: Boolean(token),
    email: email ?? null,
  });
}
