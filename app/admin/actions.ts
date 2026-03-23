"use server";

import { requireAdmin } from "@/lib/auth";
import { CLUB_ID } from "@/lib/constants";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { generateUploadToken, hashUploadToken } from "@/lib/tokens";
import { revalidatePath } from "next/cache";

export async function addMember(formData: FormData) {
  const { supabase } = await requireAdmin();
  const display_name = String(formData.get("display_name") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim() || null;
  const league_id = String(formData.get("league_id") ?? "");
  const sort_no = Number(formData.get("sort_no") ?? 0) || 0;
  const base_scoreRaw = formData.get("base_score");
  const handicapRaw = formData.get("handicap");
  const base_score =
    base_scoreRaw != null && String(base_scoreRaw) !== ""
      ? Number(base_scoreRaw)
      : null;
  const handicap =
    handicapRaw != null && String(handicapRaw) !== ""
      ? Number(handicapRaw)
      : null;
  const remarks = String(formData.get("remarks") ?? "").trim() || null;
  const pointsRaw = formData.get("points");
  const points =
    pointsRaw != null && String(pointsRaw) !== ""
      ? Number(pointsRaw)
      : 0;

  if (!display_name || !league_id) {
    throw new Error("이름과 리그는 필수입니다.");
  }

  const { data: profile, error: pe } = await supabase
    .from("profiles")
    .insert({
      club_id: CLUB_ID,
      display_name,
      gender,
      role: "member",
    })
    .select("id")
    .single();
  if (pe) throw new Error(pe.message);

  const { error: le } = await supabase.from("league_members").insert({
    league_id,
    profile_id: profile.id,
    sort_no,
    base_score,
    handicap,
    points: Number.isFinite(points) ? points : 0,
    remarks,
  });
  if (le) throw new Error(le.message);

  revalidatePath("/");
  revalidatePath("/handicap");
  revalidatePath("/rank");
  revalidatePath("/admin/members");
  revalidatePath("/admin/handicap");
}

export async function updateLeagueMember(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const sort_no = Number(formData.get("sort_no") ?? 0) || 0;
  const base_scoreRaw = formData.get("base_score");
  const handicapRaw = formData.get("handicap");
  const base_score =
    base_scoreRaw != null && String(base_scoreRaw) !== ""
      ? Number(base_scoreRaw)
      : null;
  const handicap =
    handicapRaw != null && String(handicapRaw) !== ""
      ? Number(handicapRaw)
      : null;
  const remarks = String(formData.get("remarks") ?? "").trim() || null;
  const pointsRaw = formData.get("points");
  const points =
    pointsRaw != null && String(pointsRaw) !== ""
      ? Number(pointsRaw)
      : 0;

  if (!id) throw new Error("잘못된 요청입니다.");

  const { error } = await supabase
    .from("league_members")
    .update({
      sort_no,
      base_score,
      handicap,
      points: Number.isFinite(points) ? points : 0,
      remarks,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/handicap");
  revalidatePath("/rank");
  revalidatePath("/admin/handicap");
}

export async function createNotice(formData: FormData) {
  const { supabase } = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) throw new Error("제목과 본문을 입력해 주세요.");
  const { error } = await supabase.from("notices").insert({
    club_id: CLUB_ID,
    title,
    body,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/notices");
  revalidatePath("/admin/notices");
}

export async function deleteNotice(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("잘못된 요청입니다.");
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/notices");
  revalidatePath("/admin/notices");
}

export type CreateRoundState =
  | { ok: false; error: string }
  | { ok: true; roundId: string; uploadToken: string }
  | null;

export async function createRound(
  _prev: CreateRoundState,
  formData: FormData
): Promise<CreateRoundState> {
  try {
    const { supabase } = await requireAdmin();
    const date = String(formData.get("date") ?? "");
    const course_name =
      String(formData.get("course_name") ?? "").trim() || null;
    const pepper = process.env.UPLOAD_TOKEN_PEPPER;
    if (!pepper) {
      return { ok: false, error: "UPLOAD_TOKEN_PEPPER 환경 변수를 설정하세요." };
    }
    if (!date) {
      return { ok: false, error: "라운드 날짜를 입력하세요." };
    }

    const token = generateUploadToken();
    const hash = hashUploadToken(token, pepper);

    const { data, error } = await supabase
      .from("rounds")
      .insert({
        club_id: CLUB_ID,
        date: new Date(date).toISOString(),
        course_name,
        status: "scheduled",
        upload_token_hash: hash,
      })
      .select("id")
      .single();
    if (error) {
      return { ok: false, error: error.message };
    }
    revalidatePath("/rounds");
    revalidatePath("/admin/rounds");
    return {
      ok: true,
      roundId: data.id as string,
      uploadToken: token,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "오류가 발생했습니다.";
    return { ok: false, error: msg };
  }
}

export async function regenerateRoundUploadToken(roundId: string) {
  const { supabase } = await requireAdmin();
  const pepper = process.env.UPLOAD_TOKEN_PEPPER;
  if (!pepper) throw new Error("UPLOAD_TOKEN_PEPPER 환경 변수를 설정하세요.");
  const token = generateUploadToken();
  const hash = hashUploadToken(token, pepper);
  const { error } = await supabase
    .from("rounds")
    .update({ upload_token_hash: hash })
    .eq("id", roundId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/rounds");
  revalidatePath(`/rounds/${roundId}`);
  return token;
}

export async function setRoundParticipants(roundId: string, profileIds: string[]) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("round_participants")
    .delete()
    .eq("round_id", roundId);
  if (profileIds.length === 0) {
    revalidatePath(`/rounds/${roundId}`);
    revalidatePath("/admin/rounds");
    return;
  }
  const rows = profileIds.map((profile_id) => ({ round_id: roundId, profile_id }));
  const { error } = await supabase.from("round_participants").insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath(`/rounds/${roundId}`);
  revalidatePath("/admin/rounds");
}

export async function setRoundParticipantsForm(formData: FormData) {
  const roundId = String(formData.get("round_id") ?? "");
  const ids = formData.getAll("profile_id").map(String);
  if (!roundId) throw new Error("라운드가 없습니다.");
  await setRoundParticipants(roundId, ids);
}

export async function upsertScore(formData: FormData) {
  const { supabase } = await requireAdmin();
  const round_id = String(formData.get("round_id") ?? "");
  const profile_id = String(formData.get("profile_id") ?? "");
  const gross = Number(formData.get("gross") ?? "");
  if (!round_id || !profile_id || Number.isNaN(gross)) {
    throw new Error("라운드, 회원, 타수를 확인하세요.");
  }
  await supabase.from("scores").delete().eq("round_id", round_id).eq("profile_id", profile_id);
  const { error } = await supabase.from("scores").insert({
    round_id,
    profile_id,
    gross,
    net_optional: null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/rounds/${round_id}`);
  revalidatePath("/admin/rounds");
}

export async function approvePhoto(photoId: string) {
  const { supabase, adminProfileId } = await requireAdmin();
  const { error } = await supabase
    .from("round_photos")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: adminProfileId,
    })
    .eq("id", photoId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/photos");
  revalidatePath("/rounds");
}

export async function rejectPhoto(photoId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("round_photos")
    .update({ status: "rejected" })
    .eq("id", photoId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/photos");
  revalidatePath("/rounds");
}

export async function deletePhoto(photoId: string) {
  const { supabase } = await requireAdmin();
  const { data: row } = await supabase
    .from("round_photos")
    .select("storage_path")
    .eq("id", photoId)
    .single();
  if (row?.storage_path) {
    const service = createServiceSupabase();
    await service.storage.from("round-photos").remove([row.storage_path]);
  }
  const { error } = await supabase.from("round_photos").delete().eq("id", photoId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/photos");
  revalidatePath("/rounds");
}

export async function approvePhotoForm(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) await approvePhoto(id);
}

export async function rejectPhotoForm(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) await rejectPhoto(id);
}

export async function deletePhotoForm(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) await deletePhoto(id);
}
