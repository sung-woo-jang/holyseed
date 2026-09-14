import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, HomeIcon, ResetIcon } from "@radix-ui/react-icons";
import { weeks } from "../data/verses";
import VerseTyper from "./VerseTyper";

export default function MemorizePractice() {
  const { weekNum } = useParams();
  const navigate = useNavigate();
  const week = weeks.find((w) => w.week === Number(weekNum));
  const [checkSignal, setCheckSignal] = useState(0);
  const [resetAllSignal, setResetAllSignal] = useState(0);

  if (!week) return <Navigate to="/" replace />;

  return (
    <div className="min-h-[100dvh] bg-panel pb-20">
      <div className="border-b border-panel-line bg-paper">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <button
            onClick={() => navigate(`/week/${week.week}`)}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-xs font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            <ArrowLeftIcon width={14} height={14} />
            연습 모드로
          </button>

          <div className="text-center">
            <p className="font-mono text-[11px] font-bold tracking-[0.15em] text-accent uppercase">
              {String(week.week).padStart(2, "0")}주차 · {week.book} · 암송 모드
            </p>
            <h1 className="text-lg font-bold text-ink">{week.title}</h1>
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-xs font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            <HomeIcon width={14} height={14} />
            홈으로
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pt-6">
        <p className="mb-4 rounded-md border border-accent-soft bg-accent-soft px-3 py-2 font-mono text-[12px] font-medium text-accent">
          원문이 숨겨집니다. 입력 후 하단 &quot;정답 확인&quot;으로 채점하세요.
        </p>

        {week.verses.map((verse, i) => (
          <VerseTyper
            key={i}
            verse={verse}
            memorizeMode={true}
            checkSignal={checkSignal}
            resetAllSignal={resetAllSignal}
          />
        ))}

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setCheckSignal((n) => n + 1)}
            className="block w-fit cursor-pointer rounded-full bg-accent px-7 py-3 font-mono text-sm font-semibold text-paper shadow-[0_8px_24px_-8px_rgba(28,95,214,0.5)] transition-transform active:scale-[0.97]"
          >
            정답 확인
          </button>
          <button
            type="button"
            onClick={() => setResetAllSignal((n) => n + 1)}
            className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-line bg-paper px-7 py-3 font-mono text-sm font-semibold text-ink-soft transition-colors hover:border-ink-soft hover:text-ink active:scale-[0.97]"
          >
            <ResetIcon width={16} height={16} />
            전체 초기화
          </button>
        </div>
      </div>
    </div>
  );
}
