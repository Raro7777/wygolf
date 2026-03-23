/** 공개 페이지에서 Supabase 클라이언트를 만들 수 없을 때 */
export function SupabaseEnvMissing() {
  return (
    <div className="rounded-xl border border-amber-600/40 bg-amber-950/30 p-6 text-sm text-amber-100">
      <code className="text-amber-50">.env</code>에{" "}
      <code className="text-amber-50">NEXT_PUBLIC_SUPABASE_URL</code> 과 공개 키(
      <code className="text-amber-50">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code>
      또는 레거시{" "}
      <code className="text-amber-50">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>)를 넣어
      주세요. 자세한 항목은 <code className="text-amber-50">README.md</code>·
      <code className="text-amber-50">.env.example</code>를 참고하세요.
    </div>
  );
}
