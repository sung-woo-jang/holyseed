import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, PlayIcon, ResetIcon } from "@radix-ui/react-icons";
import { weeks } from "../data/verses";
import VerseTyper from "./VerseTyper";

export default function TypingPractice() {
  const { weekNum } = useParams();
  const navigate = useNavigate();
  const week = weeks.find((w) => w.week === Number(weekNum));
  const [resetAllSignal, setResetAllSignal] = useState(0);

  if (!week) return <Navigate to="/" replace />;

  return (
    <div className="min-h-[100dvh] bg-panel pb-20">
      <div className="border-b border-panel-line bg-paper">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-xs font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            <ArrowLeftIcon width={14} height={14} />
            목록으로
          </button>

          <div className="text-center">
            <p className="font-mono text-[11px] font-bold tracking-[0.15em] text-accent uppercase">
              {String(week.week).padStart(2, "0")}주차 · {week.book}
            </p>
            <h1 className="text-lg font-bold text-ink">{week.title}</h1>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/week/${week.week}/memorize`)}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-accent bg-accent-soft px-3 py-1.5 font-mono text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-paper"
          >
            <PlayIcon width={14} height={14} />
            암송 모드
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pt-6">
        {week.verses.map((verse, i) => (
          <VerseTyper
            key={i}
            verse={verse}
            memorizeMode={false}
            resetAllSignal={resetAllSignal}
          />
        ))}

        <div className="mt-6 flex justify-center gap-3">
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
