"use client";

import { useState } from "react";

export function RoundUploadForm({
  roundId,
  token,
}: {
  roundId: string;
  token: string;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "ok" | "err">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("roundId", roundId);
    fd.set("token", token);
    setStatus("uploading");
    setMessage("");
    try {
      const res = await fetch("/api/photos/upload", {
        method: "POST",
        body: fd,
      });
      const j = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setStatus("err");
        setMessage(j.error ?? "업로드 실패");
        return;
      }
      setStatus("ok");
      setMessage("업로드되었습니다. 관리자 승인 후 갤러리에 표시됩니다.");
      form.reset();
    } catch {
      setStatus("err");
      setMessage("네트워크 오류");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-400">사진</span>
        <input
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          required
          className="text-sm file:mr-3 file:rounded file:border-0 file:bg-emerald-700 file:px-3 file:py-1.5 file:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-400">메모 (선택)</span>
        <input
          name="caption"
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-400">이름/닉네임 (선택)</span>
        <input
          name="uploaderLabel"
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={status === "uploading"}
        className="rounded-lg bg-emerald-600 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {status === "uploading" ? "업로드 중…" : "올리기"}
      </button>
      {message && (
        <p
          className={
            status === "err" ? "text-sm text-red-400" : "text-sm text-emerald-300"
          }
        >
          {message}
        </p>
      )}
    </form>
  );
}
