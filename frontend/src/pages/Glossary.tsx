import { useMemo, useState } from 'react';
import glossaryData from '../content/glossary.json';

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
  example?: string;
}

const CATEGORIES = [
  'All',
  'Basics',
  'Trading & Orders',
  'Fundamental Analysis',
  'Technical Analysis',
  'Portfolio & Risk',
  'Funds & Dividends',
  'Strategy & Psychology',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Basics': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Trading & Orders': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Fundamental Analysis': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Technical Analysis': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Portfolio & Risk': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Funds & Dividends': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Strategy & Psychology': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

export function Glossary() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const allTerms = (glossaryData as { terms: GlossaryTerm[] }).terms;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTerms.filter(t => {
      if (category !== 'All' && t.category !== category) return false;
      if (!q) return true;
      return (
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
      );
    });
  }, [allTerms, search, category]);

  // Group filtered terms by first letter for A–Z section headers
  const grouped = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {};
    for (const t of filtered) {
      const letter = t.term.charAt(0).toUpperCase();
      (groups[letter] ??= []).push(t);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Investing Glossary</h2>
        <p className="text-gray-400">
          Every investing term in plain language. Search or browse by category — {allTerms.length} terms and growing.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search terms or definitions…"
          className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              category === cat
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-gray-800/50 text-gray-400 border-white/10 hover:text-white hover:border-white/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-1">No terms match your search.</p>
          <p className="text-sm">Try a different word or clear the category filter.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([letter, terms]) => (
            <section key={letter}>
              <h3 className="text-lg font-bold text-cyan-400 mb-3 border-b border-white/10 pb-1">
                {letter}
              </h3>
              <div className="space-y-3">
                {terms.map(t => (
                  <div
                    key={t.term}
                    className="p-4 bg-gray-800/40 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h4 className="text-white font-semibold">{t.term}</h4>
                      <span
                        className={`flex-shrink-0 px-2.5 py-0.5 text-xs rounded-full border ${
                          CATEGORY_COLORS[t.category] ?? 'bg-gray-700 text-gray-300 border-gray-600'
                        }`}
                      >
                        {t.category}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{t.definition}</p>
                    {t.example && (
                      <p className="mt-2 text-sm text-gray-400 italic border-l-2 border-cyan-500/40 pl-3">
                        Example: {t.example}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default Glossary;
