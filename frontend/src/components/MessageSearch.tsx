import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import api from '../services/api';

interface MessageSearchProps {
  conversationId: string;
  onSearch: (results: any[]) => void;
  onClose: () => void;
}

const MessageSearch: React.FC<MessageSearchProps> = ({ conversationId, onSearch, onClose }) => {
  const [query, setQuery] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !messageType) return;

    setLoading(true);
    try {
      const { data } = await api.get('/api/chat/search', {
        params: {
          conversationId,
          query: query || undefined,
          messageType: messageType || undefined,
        },
      });
      setResults(data);
      onSearch(data);
    } catch (error) {
      console.error('Error searching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border-b border-slate-700 p-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={messageType}
          onChange={(e) => setMessageType(e.target.value)}
          className="bg-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Filter messages by type"
        >
          <option value="">All types</option>
          <option value="text">Text</option>
          <option value="image">Images</option>
          <option value="file">Files</option>
          <option value="voice">Voice</option>
        </select>

        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg transition"
          title="Close search"
          aria-label="Close search"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-4 text-sm text-slate-400">
          Found {results.length} message{results.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default MessageSearch;
