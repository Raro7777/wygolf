import { createServerSupabase } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }
  const { data: prof } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!prof || prof.role !== "admin") {
    throw new Error("관리자만 접근할 수 있습니다.");
  }
  return { supabase, user, adminProfileId: prof.id as string };
}
