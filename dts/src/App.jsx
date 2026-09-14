import { Navigate, Route, Routes } from "react-router-dom";
import WeekSelector from "./components/WeekSelector";
import TypingPractice from "./components/TypingPractice";
import MemorizePractice from "./components/MemorizePractice";

function App() {
  return (
    <div className="min-h-[100dvh] bg-panel">
      <Routes>
        <Route path="/" element={<WeekSelector />} />
        <Route path="/week/:weekNum" element={<TypingPractice />} />
        <Route path="/week/:weekNum/memorize" element={<MemorizePractice />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
