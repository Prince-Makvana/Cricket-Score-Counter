import { ThemeProvider } from './components/theme/ThemeProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import MatchSetupPage from './pages/MatchSetup/MatchSetupPage';
import LiveScoringPage from './pages/LiveScoring/LiveScoringPage';
import ScorecardPage from './pages/Scorecard/ScorecardPage';
import HistoryPage from './pages/History/HistoryPage';
import TeamsPage from './pages/Teams/TeamsPage';
import PlayersPage from './pages/Players/PlayersPage';
import StatisticsPage from './pages/Statistics/StatisticsPage';
import SettingsPage from './pages/Settings/SettingsPage';

function AppInner() {
  const loadAll = useStore(s => s.loadAll);
  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/match/setup" element={<MatchSetupPage />} />
          <Route path="/live" element={<LiveScoringPage />} />
          <Route path="/scorecard" element={<ScorecardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
