import { useEffect, useState } from 'react';
import { stockApi } from '../services/api';

interface SectorFilterProps {
  selectedSector?: string;
  onSectorChange: (sector: string) => void;
}

export function SectorFilter({ selectedSector, onSectorChange }: SectorFilterProps) {
  const [sectors, setSectors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectors = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await stockApi.getSectors();
        setSectors(data);
      } catch (err) {
        console.error('Error fetching sectors:', err);
        setError('Failed to load sectors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSectors();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSectorChange(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          Sector:
        </label>
        <div className="px-4 py-2.5 bg-gray-800/50 border border-white/10 rounded-xl text-gray-500 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          Sector:
        </label>
        <div className="text-sm text-red-400 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="sector-filter" className="text-sm font-medium text-gray-400 flex items-center gap-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
        Sector:
      </label>

      <div className="relative">
        <select
          id="sector-filter"
          value={selectedSector || ''}
          onChange={handleChange}
          className="appearance-none px-4 py-2.5 pl-4 pr-10 bg-gray-800/50 border border-white/10 rounded-xl
            text-white text-sm focus:bg-gray-800/70 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
            backdrop-blur-sm transition-all duration-200 cursor-pointer"
        >
          <option value="" className="bg-gray-900 text-white">All Sectors</option>
          {sectors.map((sector) => (
            <option key={sector} value={sector} className="bg-gray-900 text-white">
              {sector}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {selectedSector && (
        <button
          onClick={() => onSectorChange('')}
          className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors
            flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-purple-500/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
}
