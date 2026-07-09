import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const dm = await draftMode();
  dm.disable();
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/", url.origin));
}
