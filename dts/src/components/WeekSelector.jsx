import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { weeks } from "../data/verses";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.02 },
  },
};

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

export default function WeekSelector() {
  const navigate = useNavigate();
  const books = [...new Set(weeks.map((w) => w.book))];

  return (
    <div className="min-h-[100dvh] bg-panel">
      <header className="border-b border-panel-line bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-8 md:px-10">
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-accent uppercase">
            DTS Discipleship Training
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink">
            성경 암송 타이핑 연습
          </h1>
          <p className="mt-2 text-[14px] text-ink-soft">
            단계를 선택해 이번 주 암송 구절을 타이핑하세요.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
        {books.map((book) => (
          <section key={book} className="mb-10 last:mb-0">
            <h2 className="mb-3 flex items-center gap-2 font-mono text-[13px] font-bold text-ink-soft">
              <span className="h-2 w-2 rounded-full bg-accent" />
              {book}
            </h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            >
              {weeks
                .filter((w) => w.book === book)
                .map((w) => (
                  <motion.button
                    key={w.week}
                    variants={item}
                    onClick={() => navigate(`/week/${w.week}`)}
                    className="group flex cursor-pointer flex-col items-start gap-2 rounded-lg border border-line bg-paper p-4 text-left shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_4px_12px_rgba(28,95,214,0.15)] active:translate-y-0"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-panel font-mono text-xs font-bold text-ink-soft group-hover:bg-accent-soft group-hover:text-accent">
                      {String(w.week).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] leading-snug font-semibold text-ink">
                      {w.title}
                    </span>
                  </motion.button>
                ))}
            </motion.div>
          </section>
        ))}
      </div>
    </div>
  );
}
