import { createServerClient } from "@supabase/ssr";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { getSupabaseBrowserKey } from "@/lib/supabase/publishable-key";
import { getSupabaseUrl } from "@/lib/supabase/supabase-url";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  const url = getSupabaseUrl();
  const key = getSupabaseBrowserKey();
  if (!url || !key) return false;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return prof?.role === "admin";
}

/** 승인된 사진 또는 관리자: 302 signed URL */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const sb = createServiceSupabase();
  const { data: photo, error } = await sb
    .from("round_photos")
    .select("storage_path, status")
    .eq("id", id)
    .single();
  if (error || !photo) {
    return NextResponse.json({ error: "없음" }, { status: 404 });
  }

  const admin = await isAdminRequest();
  if (photo.status !== "approved" && !admin) {
    return NextResponse.json({ error: "접근 불가" }, { status: 403 });
  }

  const { data: signed, error: se } = await sb.storage
    .from("round-photos")
    .createSignedUrl(photo.storage_path, 3600);
  if (se || !signed?.signedUrl) {
    return NextResponse.json({ error: "URL 생성 실패" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
