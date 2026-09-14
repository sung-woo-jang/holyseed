import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CheckCircledIcon, EyeClosedIcon, EyeOpenIcon, ResetIcon } from "@radix-ui/react-icons";
import { compareTyping } from "../hooks/useTypingCompare";

function autoGrow(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function VerseLine({ line, quizMode, checkSignal, resetSignal }) {
  const [input, setInput] = useState("");
  const [checkedInput, setCheckedInput] = useState(null);
  const [revealed, setRevealed] = useState(true);
  const textareaRef = useRef(null);

  const showResult = quizMode ? checkedInput !== null : true;
  const inputForCompare = quizMode ? (checkedInput ?? "") : input;
  const { chars, accuracy, done } = compareTyping(inputForCompare, line.text);

  useEffect(() => {
    if (quizMode && checkSignal > 0) setCheckedInput(input);
  }, [checkSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (resetSignal > 0) {
      setInput("");
      setCheckedInput(null);
      setRevealed(true);
    }
  }, [resetSignal]);

  useLayoutEffect(() => {
    autoGrow(textareaRef.current);
  }, [input]);

  return (
    <div className="border-b border-line py-5 last:border-b-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {line.num && (
            <span className="rounded bg-panel px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-soft">
              {line.num}
            </span>
          )}
          {showResult && (
            <span className="font-mono text-[11px] text-ink-soft/70">정확도 {accuracy}%</span>
          )}
          {showResult && done && (
            <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-accent">
              <CheckCircledIcon width={12} height={12} /> 완료
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!quizMode && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-[12px] font-semibold text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
            >
              {revealed ? (
                <>
                  <EyeOpenIcon width={13} height={13} />
                  가리기
                </>
              ) : (
                <>
                  <EyeClosedIcon width={13} height={13} />
                  보기
                </>
              )}
            </button>
          )}
          {quizMode && (
            <button
              type="button"
              disabled={input.length === 0}
              onClick={() => setCheckedInput(input)}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-accent bg-accent-soft px-2.5 py-1 font-mono text-[12px] font-semibold text-accent transition-colors hover:bg-accent hover:text-paper disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-ink-soft/40"
            >
              <CheckCircledIcon width={13} height={13} />
              정답 확인
            </button>
          )}
          <button
            type="button"
            disabled={input.length === 0}
            onClick={() => {
              setInput("");
              setCheckedInput(null);
              textareaRef.current?.focus();
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-[12px] font-semibold text-ink-soft transition-colors hover:border-ink-soft hover:text-ink disabled:cursor-not-allowed disabled:text-ink-soft/40"
          >
            <ResetIcon width={13} height={13} />
            절 초기화
          </button>
        </div>
      </div>

      <div
        onClick={() => textareaRef.current?.focus()}
        className="relative cursor-text rounded-md bg-paper p-3 text-[18px] leading-[1.9] break-keep"
      >
        {!showResult ? (
          <span className="font-mono text-[13px] text-ink-soft/60 italic">
            입력 후 하단 &quot;정답 확인&quot;을 누르면 채점 결과가 표시됩니다.
          </span>
        ) : (
          chars.map((c, i) => (
            <span
              key={i}
              className={
                c.status === "pending"
                  ? "text-ink-soft/45"
                  : c.status === "correct"
                    ? "rounded-sm bg-correct-bg text-correct"
                    : c.status === "lenient"
                      ? "text-ink-soft/50"
                      : "rounded-sm bg-incorrect-bg font-semibold text-incorrect"
              }
            >
              {c.char}
            </span>
          ))
        )}
        {!quizMode && !revealed && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 flex cursor-default items-center justify-center rounded-md bg-panel/90 backdrop-blur-sm"
          >
            <span className="flex items-center gap-1.5 font-mono text-[12px] font-semibold text-ink-soft/70">
              <EyeClosedIcon width={13} height={13} />
              가려짐 · &quot;보기&quot;를 눌러 확인
            </span>
          </div>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          if (quizMode) setCheckedInput(null);
        }}
        placeholder="여기를 클릭하고 타이핑하세요"
        rows={1}
        className="mt-2 max-h-[50vh] w-full resize-none overflow-y-auto rounded-md border border-line bg-paper px-3 py-2 font-mono text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink-soft/40 focus:border-accent"
      />

      <div className="mt-1.5 text-right font-mono text-[11px] tabular-nums text-ink-soft/60">
        {input.length}/{line.text.length}자
      </div>
    </div>
  );
}

function VerseTyper({ verse, memorizeMode, checkSignal, resetAllSignal }) {
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    if (resetAllSignal > 0) setResetSignal((n) => n + 1);
  }, [resetAllSignal]);

  return (
    <div className="mb-5 rounded-lg border border-line bg-panel shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="font-mono text-[13px] font-bold text-accent">{verse.ref}</span>
      </div>
      <div className="px-4">
        {verse.verses.map((line, i) => (
          <VerseLine
            key={i}
            line={line}
            quizMode={memorizeMode}
            checkSignal={checkSignal}
            resetSignal={resetSignal}
          />
        ))}
      </div>
    </div>
  );
}

export default VerseTyper;
