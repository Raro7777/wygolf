import { hashUploadToken } from "@/lib/tokens";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { CLUB_ID } from "@/lib/constants";
import { NextResponse } from "next/server";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export async function POST(req: Request) {
  const pepper = process.env.UPLOAD_TOKEN_PEPPER;
  if (!pepper) {
    return NextResponse.json(
      { error: "서버 설정 오류(UPLOAD_TOKEN_PEPPER)" },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const roundId = String(form.get("roundId") ?? "");
  const token = String(form.get("token") ?? "");
  const caption = String(form.get("caption") ?? "").trim() || null;
  const uploaderLabel = String(form.get("uploaderLabel") ?? "").trim() || null;
  const file = form.get("file");

  if (!roundId || !token || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "roundId, token, file이 필요합니다." },
      { status: 400 }
    );
  }

  const hash = hashUploadToken(token, pepper);
  const sb = createServiceSupabase();

  const { data: round, error: re } = await sb
    .from("rounds")
    .select("id, upload_token_hash, club_id")
    .eq("id", roundId)
    .single();

  if (re || !round || round.club_id !== CLUB_ID) {
    return NextResponse.json({ error: "라운드를 찾을 수 없습니다." }, { status: 404 });
  }
  if (!round.upload_token_hash || round.upload_token_hash !== hash) {
    return NextResponse.json({ error: "업로드 링크가 올바르지 않습니다." }, { status: 403 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "파일이 너무 큽니다. (최대 8MB)" }, { status: 400 });
  }
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED.has(mime)) {
    return NextResponse.json(
      { error: "허용되지 않는 형식입니다. (JPEG, PNG, WebP, HEIC)" },
      { status: 400 }
    );
  }

  const ext =
    mime === "image/png"
      ? "png"
      : mime === "image/webp"
        ? "webp"
        : mime === "image/heic"
          ? "heic"
          : "jpg";

  const photoId = crypto.randomUUID();
  const path = `${CLUB_ID}/${roundId}/${photoId}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await sb.storage
    .from("round-photos")
    .upload(path, buf, { contentType: mime, upsert: false });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { error: insErr } = await sb.from("round_photos").insert({
    round_id: roundId,
    storage_path: path,
    caption,
    uploader_label: uploaderLabel,
    status: "pending",
  });
  if (insErr) {
    await sb.storage.from("round-photos").remove([path]);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
