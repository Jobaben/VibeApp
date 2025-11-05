import React, { useState } from 'react';
import { useWatchlist, Watchlist } from '../contexts/WatchlistContext';

interface WatchlistManagerProps {
  watchlist: Watchlist;
  onSelect?: () => void;
  isSelected?: boolean;
}

export default function WatchlistManager({
  watchlist,
  onSelect,
  isSelected = false
}: WatchlistManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(watchlist.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { renameWatchlist, deleteWatchlist } = useWatchlist();

  const handleRename = () => {
    if (newName.trim() && newName.trim() !== watchlist.name) {
      renameWatchlist(watchlist.id, newName.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteWatchlist(watchlist.id);
    setShowDeleteConfirm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(watchlist.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-lg font-semibold border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <div
              onClick={onSelect}
              className={`${onSelect ? 'cursor-pointer' : ''}`}
            >
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {watchlist.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {watchlist.tickers.length} {watchlist.tickers.length === 1 ? 'stock' : 'stocks'}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Rename watchlist"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete watchlist"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Watchlist?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{watchlist.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
