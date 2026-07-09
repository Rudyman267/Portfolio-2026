import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";

/**
 * Sanity webhook → on-demand revalidation.
 *
 * Configure in sanity.io/manage with:
 *   - URL: https://<your-domain>/api/revalidate
 *   - Trigger on: create, update, delete
 *   - Secret: SANITY_REVALIDATE_SECRET
 *   - Projection: {"_type": _type, "slug": slug.current}
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get(SIGNATURE_HEADER_NAME);
    const body = await req.text();
    const secret = process.env.SANITY_REVALIDATE_SECRET;

    if (!secret) {
      return new NextResponse("Missing revalidate secret", { status: 500 });
    }
    if (!signature) {
      return new NextResponse("Missing signature", { status: 401 });
    }

    const valid = await isValidSignature(body, signature, secret);
    if (!valid) {
      return new NextResponse("Invalid signature", { status: 401 });
    }

    const payload = JSON.parse(body) as { _type?: string; slug?: string };
    const type = payload._type;

    if (!type) {
      return NextResponse.json({ revalidated: false, reason: "no _type" });
    }

    // Revalidate the document-type tag (stale-while-revalidate is fine here).
    revalidateTag(type, "max");

    return NextResponse.json({
      revalidated: true,
      type,
      slug: payload.slug ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(message, { status: 500 });
  }
}
