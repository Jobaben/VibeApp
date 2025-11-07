import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stockApi } from '../services/api';
import type { Stock, StockListResponse } from '../types/stock';
import { StockCard } from './StockCard';
import { StockSearch } from './StockSearch';
import { SectorFilter } from './SectorFilter';

export function StockList() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  // Filter state
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch stocks based on current filters and pagination
  const fetchStocks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
        ...(selectedSector && { sector: selectedSector }),
      };

      const response: StockListResponse = await stockApi.getStocks(params);
      setStocks(response.items);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError('Failed to load stocks. Please try again.');
      setStocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stocks when filters or pagination changes
  useEffect(() => {
    if (!searchQuery) {
      fetchStocks();
    }
  }, [currentPage, selectedSector, searchQuery]);

  // Handle sector filter change
  const handleSectorChange = (sector: string) => {
    setSelectedSector(sector);
    setCurrentPage(1); // Reset to first page when filter changes
    setSearchQuery(''); // Clear search when filtering by sector
  };

  // Handle search query change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
    if (query) {
      setSelectedSector(''); // Clear sector filter when searching
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle stock click - navigate to detail page
  const handleStockClick = (stock: Stock) => {
    navigate(`/stock/${encodeURIComponent(stock.ticker)}`);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="rounded-2xl bg-gray-800/30 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20">
        <div className="space-y-4">
          {/* Search Bar */}
          <div>
            <StockSearch onSearch={handleSearch} />
          </div>

          {/* Sector Filter & Results Count */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <SectorFilter selectedSector={selectedSector} onSectorChange={handleSectorChange} />

            {/* Results count */}
            {!isLoading && (
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                {searchQuery ? (
                  <span>Search results for <span className="text-cyan-400 font-medium">"{searchQuery}"</span></span>
                ) : (
                  <span>
                    Showing <span className="text-white font-medium">{stocks.length}</span> of <span className="text-white font-medium">{total}</span> stocks
                    {selectedSector && <span className="text-purple-400 font-medium"> in {selectedSector}</span>}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="relative">
            <div className="animate-spin h-16 w-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"></div>
            <div className="absolute inset-0 animate-ping h-16 w-16 border-4 border-cyan-500/20 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-8 text-center backdrop-blur-sm">
          <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 font-medium text-lg mb-4">{error}</p>
          <button
            onClick={fetchStocks}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl
              hover:from-red-600 hover:to-red-700 transition-all duration-200
              shadow-lg shadow-red-500/30 hover:shadow-red-500/50 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && stocks.length === 0 && (
        <div className="rounded-2xl bg-gray-800/30 backdrop-blur-xl border border-white/10 p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-white">No stocks found</h3>
          <p className="mt-2 text-gray-400">
            {searchQuery
              ? 'Try adjusting your search query'
              : selectedSector
              ? 'Try selecting a different sector or clear the filter'
              : 'No stocks available at the moment'}
          </p>
        </div>
      )}

      {/* Stock Grid */}
      {!isLoading && !error && stocks.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stocks.map((stock) => (
              <StockCard key={stock.id} stock={stock} onClick={handleStockClick} />
            ))}
          </div>

          {/* Pagination */}
          {!searchQuery && totalPages > 1 && (
            <div className="rounded-2xl bg-gray-800/30 backdrop-blur-xl border border-white/10 p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-5 py-2.5 bg-gray-700/50 border border-white/10 rounded-xl text-white
                    disabled:opacity-30 disabled:cursor-not-allowed
                    hover:bg-gray-600/50 hover:border-white/20 transition-all duration-200
                    flex items-center gap-2 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {/* Show page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    if (!showPage) {
                      // Show ellipsis
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 text-gray-600">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[2.5rem] h-10 rounded-xl transition-all duration-200 font-medium ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                            : 'bg-gray-700/30 border border-white/10 text-gray-300 hover:bg-gray-600/50 hover:border-white/20'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-5 py-2.5 bg-gray-700/50 border border-white/10 rounded-xl text-white
                    disabled:opacity-30 disabled:cursor-not-allowed
                    hover:bg-gray-600/50 hover:border-white/20 transition-all duration-200
                    flex items-center gap-2 font-medium"
                >
                  Next
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Page info */}
              <div className="mt-4 text-center text-sm text-gray-500">
                Page <span className="text-cyan-400 font-medium">{currentPage}</span> of <span className="text-white font-medium">{totalPages}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
