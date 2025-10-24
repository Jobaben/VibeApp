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
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Sector:</label>
        <select
          disabled
          className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
        >
          <option>Loading...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Sector:</label>
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sector-filter" className="text-sm font-medium text-gray-700">
        Sector:
      </label>
      <select
        id="sector-filter"
        value={selectedSector || ''}
        onChange={handleChange}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
      >
        <option value="">All Sectors</option>
        {sectors.map((sector) => (
          <option key={sector} value={sector}>
            {sector}
          </option>
        ))}
      </select>

      {selectedSector && (
        <button
          onClick={() => onSectorChange('')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Clear
        </button>
      )}
    </div>
  );
}
