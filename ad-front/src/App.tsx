import { Routes, Route } from 'react-router-dom';
import AuthBootstrap from './components/AuthBootstrap';
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';
import HomePage from './pages/index';
import OnboardingPage from './pages/auth/onboarding';
import JoinPage from './pages/auth/join';
import OAuthCallbackPage from './pages/auth/callback';
import AssetDetailPage from './pages/assets/detail';
import CashflowPage from './pages/more/cashflow';
import CategoriesPage from './pages/more/categories';
import ComparePage from './pages/more/compare';
import MembersPage from './pages/more/members';
import SettingsPage from './pages/more/settings';
import NotFoundPage from './pages/NotFound';

export default function App() {
  return (
    <AuthBootstrap>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/auth/onboarding" element={<OnboardingPage />} />
        <Route path="/auth/join" element={<JoinPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/more/cashflow" element={<CashflowPage />} />
        <Route path="/more/categories" element={<CategoriesPage />} />
        <Route path="/more/compare" element={<ComparePage />} />
        <Route path="/more/members" element={<MembersPage />} />
        <Route path="/more/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthBootstrap>
  );
}
