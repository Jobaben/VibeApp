import { useState, useEffect } from 'react';
import { stockApi } from '../services/api';
import type { Stock, StockListResponse } from '../types/stock';
import { StockCard } from './StockCard';
import { StockSearch } from './StockSearch';
import { SectorFilter } from './SectorFilter';

export function StockList() {
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

  // Handle stock click (for future detail page navigation)
  const handleStockClick = (stock: Stock) => {
    console.log('Stock clicked:', stock);
    // TODO: Navigate to stock detail page in Phase 4
    alert(`Stock detail page for ${stock.ticker} - Coming in Phase 4!`);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div>
            <StockSearch onSearch={handleSearch} />
          </div>

          {/* Sector Filter */}
          <div className="flex items-center justify-between">
            <SectorFilter selectedSector={selectedSector} onSectorChange={handleSectorChange} />

            {/* Results count */}
            {!isLoading && (
              <div className="text-sm text-gray-600">
                {searchQuery ? (
                  <span>Search results for "{searchQuery}"</span>
                ) : (
                  <span>
                    Showing {stocks.length} of {total} stocks
                    {selectedSector && ` in ${selectedSector}`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">{error}</p>
          <button
            onClick={fetchStocks}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && stocks.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-4 text-lg font-medium text-gray-900">No stocks found</h3>
          <p className="mt-2 text-gray-600">
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
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
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
                          <span key={page} className="px-2 text-gray-400">
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
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
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
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
