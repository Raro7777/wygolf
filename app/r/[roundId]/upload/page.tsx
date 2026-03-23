import { RoundUploadForm } from "@/components/RoundUploadForm";
import Link from "next/link";

export default async function RoundUploadPage({
  params,
  searchParams,
}: {
  params: Promise<{ roundId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { roundId } = await params;
  const sp = await searchParams;
  const token = sp.token ?? "";

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-xl font-semibold text-white">업로드</h1>
        <p className="mt-4 text-neutral-400">
          동호회에서 받은 업로드 링크 전체(URL에 <code className="text-amber-200">token=</code>
          포함)로 접속해 주세요.
        </p>
        <Link href="/" className="mt-8 inline-block text-emerald-400 underline">
          홈으로
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-semibold text-white">라운드 사진 올리기</h1>
      <p className="mt-2 text-sm text-neutral-500">
        승인 전까지 갤러리에는 보이지 않을 수 있습니다.
      </p>
      <div className="mt-8">
        <RoundUploadForm roundId={roundId} token={token} />
      </div>
    </main>
  );
}
