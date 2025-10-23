function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Avanza Stock Finder</h1>
          <p className="text-gray-600 mt-1">AI-powered stock analysis platform</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Coming Soon
          </h2>
          <p className="text-gray-600 mb-4">
            We're building an intelligent stock discovery platform for Avanza Bank.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-left">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Smart Screening</h3>
              <p className="text-gray-600 text-sm">
                Filter stocks by fundamentals, technicals, and custom criteria
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">AI Analysis</h3>
              <p className="text-gray-600 text-sm">
                Get AI-powered insights and recommendations
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Multi-Factor Scoring</h3>
              <p className="text-gray-600 text-sm">
                Value, Quality, Momentum, and Health scores for every stock
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>Avanza Stock Finder - Built with FastAPI, React & AI</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
