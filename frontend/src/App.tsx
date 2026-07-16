import { lazy, Suspense } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { StockList } from './components/StockList';
import PageShell from './components/PageShell';
import { WatchlistProvider } from './contexts/WatchlistContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { LearningModeProvider } from './contexts/LearningModeContext';
import { LearningModeToggle, LessonSidebar, LessonContent } from './components/learning';

// Route-level code splitting keeps the initial bundle small; each page
// (and its chart dependencies) loads on first navigation.
const Screener = lazy(() => import('./pages/Screener'));
const TopPicks = lazy(() => import('./pages/TopPicks'));
const StockDetail = lazy(() => import('./pages/StockDetail'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Watchlists = lazy(() => import('./pages/Watchlists'));
const WeeklyChanges = lazy(() => import('./pages/WeeklyChanges'));
const LearningLab = lazy(() => import('./pages/LearningLab'));
const Glossary = lazy(() => import('./pages/Glossary'));
const Compare = lazy(() => import('./pages/Compare'));
const Portfolio = lazy(() => import('./pages/Portfolio'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" aria-label="Loading page" />
    </div>
  );
}

function App() {
  const location = useLocation();

  // Check if we're on a detail page (don't show header/footer)
  const isDetailPage = location.pathname.startsWith('/stock/') || location.pathname === '/leaderboard' || location.pathname === '/watchlists' || location.pathname === '/weekly-changes' || location.pathname === '/compare' || location.pathname === '/portfolio';

  if (isDetailPage) {
    return (
      <LearningModeProvider>
        <WatchlistProvider>
          <PortfolioProvider>
            <PageShell>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/stock/:ticker" element={<StockDetail />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/watchlists" element={<Watchlists />} />
                  <Route path="/weekly-changes" element={<WeeklyChanges />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                </Routes>
              </Suspense>
            </PageShell>
            {/* Learning Mode Components */}
            <LessonSidebar />
            <LessonContent />
          </PortfolioProvider>
        </WatchlistProvider>
      </LearningModeProvider>
    );
  }

  const isHomePage = location.pathname === '/';
  const isScreenerPage = location.pathname === '/screener';
  const isTopPicksPage = location.pathname === '/top-picks';
  const isLearningLabPage = location.pathname === '/learning-lab';
  const isGlossaryPage = location.pathname === '/glossary';

  return (
    <LearningModeProvider>
    <WatchlistProvider>
    <PageShell>
        {/* Modern Header */}
        <header className="header-band">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold heading-gradient">
                  Avanza Stock Finder
                </h1>
                <p className="text-gray-400 mt-2 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI-powered stock analysis platform
                </p>
              </div>

              {/* Right side controls */}
              <div className="flex items-center gap-3">
                {/* Learning Mode Toggle */}
                <LearningModeToggle />
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex gap-2">
              <Link
                to="/"
                className={`px-6 py-2.5 rounded-lg font-medium duration-200 ${
                  isHomePage
                    ? 'btn-primary'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all'
                }`}
              >
                Browse Stocks
              </Link>
              <Link
                to="/screener"
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  isScreenerPage
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Strategy Screener
              </Link>
              <Link
                to="/top-picks"
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  isTopPicksPage
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 10.1c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Top Picks
                <span className="px-2 py-0.5 text-xs bg-amber-400/20 rounded-full border border-amber-400/30">NEW</span>
              </Link>
              <Link
                to="/learning-lab"
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  isLearningLabPage
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.314 0-6 2.014-6 4.5S8.686 17 12 17s6-2.014 6-4.5S15.314 8 12 8zm0 0V4m0 13v3m8-8h-3M7 12H4" />
                </svg>
                Learning Lab
              </Link>
              <Link
                to="/glossary"
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  isGlossaryPage
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Glossary
              </Link>
              <Link
                to="/leaderboard"
                className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Leaderboard
              </Link>
              <Link
                to="/watchlists"
                className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Watchlists
              </Link>
              <Link
                to="/weekly-changes"
                className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                What Changed
                <span className="px-2 py-0.5 text-xs bg-blue-400/20 rounded-full border border-blue-400/30">NEW</span>
              </Link>
              <Link
                to="/compare"
                className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Compare
              </Link>
              <Link
                to="/portfolio"
                className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M9 17V9m4 8V5m4 12v-6" />
                </svg>
                Portfolio
                <span className="px-2 py-0.5 text-xs bg-blue-400/20 rounded-full border border-blue-400/30">NEW</span>
              </Link>
            </nav>
          </div>
        </header>

        <main>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={
                <div className="max-w-7xl mx-auto px-4 py-8">
                  {/* Modern Info Banner */}
                  <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 border border-white/10 backdrop-blur-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">Welcome to Avanza Stock Finder</h3>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            New to investing? Flip on
                            <span className="text-amber-400 font-medium"> Learning Mode</span> (top right) for a complete beginner-to-investor course, practice risk-free in the
                            <span className="text-emerald-400 font-medium"> Learning Lab</span>, and look up any term in the
                            <span className="text-cyan-400 font-medium"> Glossary</span>.
                            Then explore stocks with search and filtering, pick your investment period in
                            <span className="text-amber-400 font-medium"> Top Picks</span> to see the best candidates with buy/sell chart signals, try the
                            <span className="text-purple-400 font-medium"> Strategy Screener</span> to find opportunities with proven investment criteria, and use
                            <span className="text-green-400 font-medium"> Watchlists</span> to track your favorite stocks with
                            <span className="text-blue-400 font-medium"> score updates</span> and
                            <span className="text-purple-400 font-medium"> signal changes</span>.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"></div>
                  </div>

                  {/* Stock List Component */}
                  <StockList />
                </div>
              }
            />
            <Route path="/screener" element={<Screener />} />
            <Route path="/top-picks" element={<TopPicks />} />
            <Route path="/learning-lab" element={<LearningLab />} />
            <Route path="/glossary" element={<Glossary />} />
            {/* Unknown routes fall back to the home page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </main>

      {/* Modern Footer */}
      <footer className="border-t border-white/10 mt-16 backdrop-blur-xl bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              Avanza Stock Finder - Built with
              <span className="text-cyan-400 font-medium"> FastAPI</span>,
              <span className="text-blue-400 font-medium"> React</span> &
              <span className="text-purple-400 font-medium"> AI</span>
            </p>
          </div>
        </div>
      </footer>
    </PageShell>
    {/* Learning Mode Components */}
    <LessonSidebar />
    <LessonContent />
    </WatchlistProvider>
    </LearningModeProvider>
  );
}

export default App;
