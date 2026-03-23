"use client";

import { useState } from "react";
import { regenerateRoundUploadToken } from "@/app/admin/actions";

export function RegenerateTokenButton({
  roundId,
}: {
  roundId: string;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="text-sm">
      <button
        type="button"
        disabled={loading}
        className="text-amber-400 underline disabled:opacity-50"
        onClick={async () => {
          setErr(null);
          setToken(null);
          setLoading(true);
          try {
            const t = await regenerateRoundUploadToken(roundId);
            setToken(t);
          } catch (e) {
            setErr(e instanceof Error ? e.message : "오류");
          } finally {
            setLoading(false);
          }
        }}
      >
        업로드 토큰 재발급
      </button>
      {err && <p className="mt-1 text-red-400">{err}</p>}
      {token && (
        <p className="mt-2 break-all text-neutral-300">
          새 링크:{" "}
          {`${typeof window !== "undefined" ? window.location.origin : ""}/r/${roundId}/upload?token=${encodeURIComponent(token)}`}
        </p>
      )}
    </div>
  );
}
