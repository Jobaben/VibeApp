import { Vibe } from '../../types/vibe';

interface VibeCardProps {
  vibe: Vibe;
}

export const VibeCard: React.FC<VibeCardProps> = ({ vibe }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-800 text-lg mb-3">{vibe.content}</p>
          {vibe.media_url && (
            <img
              src={vibe.media_url}
              alt="Vibe media"
              className="rounded-lg max-w-full h-auto mb-3"
            />
          )}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {vibe.likes_count}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {vibe.comments_count}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {vibe.shares_count}
            </span>
          </div>
        </div>
        <span className="text-xs text-gray-500 ml-4">{formatDate(vibe.created_at)}</span>
      </div>
      <div className="mt-2">
        <span className={`inline-block px-2 py-1 text-xs rounded ${
          vibe.type === 'text' ? 'bg-blue-100 text-blue-800' :
          vibe.type === 'image' ? 'bg-green-100 text-green-800' :
          vibe.type === 'video' ? 'bg-purple-100 text-purple-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {vibe.type.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
