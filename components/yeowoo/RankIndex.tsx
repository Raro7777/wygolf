/** 포인트 순위 행의 순번 (1~3 메달 / 그 외) */
export function RankIndex({ index }: { index: number }) {
  const i = index + 1;
  if (i <= 3) {
    return (
      <span className={`yw-rank-num yw-rank-num--${i}`} aria-label={`${i}위`}>
        {i}
      </span>
    );
  }
  return <span className="yw-rank-num">{i}</span>;
}
