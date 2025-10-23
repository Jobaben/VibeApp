import { useState, useEffect } from 'react';
import { VibeCard } from './features/vibes/VibeCard';
import { vibeService } from './services/vibeService';
import { Vibe } from './types/vibe';

function App() {
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrendingVibes();
  }, []);

  const loadTrendingVibes = async () => {
    try {
      setLoading(true);
      const data = await vibeService.getTrendingVibes(20);
      setVibes(data);
      setError(null);
    } catch (err) {
      setError('Failed to load vibes. Please try again later.');
      console.error('Error loading vibes:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">VibeApp</h1>
          <p className="text-gray-600 mt-1">Share your vibes with the world</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Trending Vibes</h2>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading vibes...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!loading && !error && vibes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No vibes yet. Be the first to create one!</p>
          </div>
        )}

        {!loading && !error && vibes.length > 0 && (
          <div className="space-y-4">
            {vibes.map((vibe) => (
              <VibeCard key={vibe.id} vibe={vibe} />
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>VibeApp v1.0.0 - Built with Python FastAPI & React</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
