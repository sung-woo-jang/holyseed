// 순서 고정 prefix 비교. 타이핑은 문장을 처음부터 순서대로 치므로
// 같은 위치(index)의 글자끼리만 비교한다.
// LCS(자유 정렬)는 "네"처럼 문장에 여러 번 나오는 글자를 뒤쪽 위치와
// 잘못 매칭시켜 엉뚱한 자리를 correct로 표시하는 문제가 있어 사용하지 않는다.

// 문장부호(마침표 등)는 다르게 입력해도 오답으로 보지 않고 "lenient"로만 표시한다.
// 띄어쓰기는 엄격하게 채점하므로 여기 포함하지 않는다.
const LENIENT_CHAR = /[.,!?;:'"()[\]{}…·~\-‘’“”]/;

export function compareTyping(input, target) {
  const chars = target.split("").map((ch, i) => {
    if (i >= input.length) return { char: ch, status: "pending" };
    if (input[i] === ch) return { char: ch, status: "correct" };
    if (LENIENT_CHAR.test(ch)) return { char: ch, status: "lenient" };
    return { char: ch, status: "incorrect" };
  });

  const typedCorrect = chars.filter(
    (c, i) => i < input.length && (c.status === "correct" || c.status === "lenient")
  ).length;
  const accuracy =
    input.length === 0 ? 100 : Math.round((typedCorrect / target.length) * 100);
  const done =
    input.length >= target.length &&
    chars.every((c) => c.status === "correct" || c.status === "lenient");

  return { chars, accuracy, done };
}
