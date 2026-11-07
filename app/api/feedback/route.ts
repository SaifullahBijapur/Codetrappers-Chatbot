import { db } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { logId, feedback } = await req.json().catch(() => ({}));
  if (typeof logId !== "string" || (feedback !== 1 && feedback !== -1)) {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  await db.from("chat_logs").update({ feedback }).eq("id", logId);
  return Response.json({ ok: true });
}
