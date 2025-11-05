import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { StockList } from './components/StockList';
import Screener from './pages/Screener';
import StockDetail from './pages/StockDetail';
import Leaderboard from './pages/Leaderboard';
import Watchlists from './pages/Watchlists';
import { WatchlistProvider } from './contexts/WatchlistContext';

function App() {
  const location = useLocation();

  // Check if we're on a detail page (don't show header/footer)
  const isDetailPage = location.pathname.startsWith('/stock/') || location.pathname === '/leaderboard' || location.pathname === '/watchlists';

  if (isDetailPage) {
    return (
      <WatchlistProvider>
        <Routes>
          <Route path="/stock/:ticker" element={<StockDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/watchlists" element={<Watchlists />} />
        </Routes>
      </WatchlistProvider>
    );
  }

  const isHomePage = location.pathname === '/';
  const isScreenerPage = location.pathname === '/screener';

  return (
    <WatchlistProvider>
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Modern Header */}
        <header className="border-b border-white/10 backdrop-blur-xl bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Avanza Stock Finder
                </h1>
                <p className="text-gray-400 mt-2 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI-powered stock analysis platform
                </p>
              </div>

              {/* Status Indicator */}
              <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm text-green-400 font-medium">Phase 5 Live</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex gap-2">
              <Link
                to="/"
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  isHomePage
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
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
                to="/leaderboard"
                className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Leaderboard
                <span className="px-2 py-0.5 text-xs bg-cyan-400/20 rounded-full border border-cyan-400/30">Phase 4</span>
              </Link>
              <Link
                to="/watchlists"
                className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Watchlists
                <span className="px-2 py-0.5 text-xs bg-green-400/20 rounded-full border border-green-400/30">Phase 5</span>
              </Link>
            </nav>
          </div>
        </header>

        <main>
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
                          <h3 className="text-lg font-semibold text-white mb-2">Welcome to Phase 5</h3>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            Explore stocks with advanced search and filtering, or try the
                            <span className="text-purple-400 font-medium"> Strategy Screener</span> to find opportunities with proven investment criteria.
                            Check out the
                            <span className="text-cyan-400 font-medium"> Leaderboard</span> for top-performing stocks, and use
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
          </Routes>
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
              <div className="flex items-center gap-4 text-gray-500 text-xs">
                <span>Phase 5/6</span>
                <span>•</span>
                <span>v1.5.0</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </WatchlistProvider>
  );
}

export default App;
