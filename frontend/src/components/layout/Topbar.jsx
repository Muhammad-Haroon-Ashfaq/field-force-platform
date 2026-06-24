import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, HelpCircle, Search, Loader2, Store, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [usersRes, shopsRes] = await Promise.allSettled([
          API.get('/users', { params: { search: query, limit: 4 } }),
          API.get('/shops', { params: { search: query, limit: 4 } }),
        ]);
        setResults({
          users: usersRes.status === 'fulfilled'
            ? (usersRes.value.data?.users || usersRes.value.data || []).slice(0, 4)
            : [],
          shops: shopsRes.status === 'fulfilled'
            ? (shopsRes.value.data?.shops || shopsRes.value.data || []).slice(0, 4)
            : [],
        });
        setOpen(true);
      } catch {
        setResults({ users: [], shops: [] });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const hasResults = results && (results.users?.length > 0 || results.shops?.length > 0);

  const handleNavigate = (path) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={ref} className="relative flex-1 max-w-md">
      {/* Input */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => hasResults && setOpen(true)}
          placeholder="Global search..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
        {!loading && query && (
          <button onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">

          {/* No results */}
          {!hasResults && !loading && (
            <div className="py-8 text-center text-sm text-gray-400">
              No results found for "<span className="font-medium text-gray-600">{query}</span>"
            </div>
          )}

          {/* Users section */}
          {results?.users?.length > 0 && (
            <div>
              <div className="px-3 pt-3 pb-1.5 flex items-center gap-2">
                <Users size={12} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Users</span>
              </div>
              {results.users.map(u => (
                <button key={u._id}
                  onClick={() => handleNavigate('/users')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors">
                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{u.name}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {u.email} · <span className="capitalize">{u.role?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Shops section */}
          {results?.shops?.length > 0 && (
            <div className={results?.users?.length > 0 ? 'border-t border-gray-100' : ''}>
              <div className="px-3 pt-3 pb-1.5 flex items-center gap-2">
                <Store size={12} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Shops</span>
              </div>
              {results.shops.map(s => (
                <button key={s._id}
                  onClick={() => handleNavigate('/shops')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Store size={14} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{s.name}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {s.shopkeeper || s.owner || 'No owner'} · {s.area || s.city || 'No location'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          {hasResults && (
            <div className="border-t border-gray-100 px-4 py-2.5 flex justify-between items-center bg-gray-50">
              <span className="text-xs text-gray-400">
                {(results.users?.length || 0) + (results.shops?.length || 0)} results
              </span>
              <button onClick={() => handleNavigate('/users')}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                View all →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Topbar = ({ setMobileOpen }) => {
  const { user } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 sticky top-0 z-20">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        <Menu size={20} />
      </button>

      {/* Global Search */}
      <GlobalSearch />

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Help */}
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <HelpCircle size={18} />
        </button>

        {/* User info */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-gray-700 leading-tight">
              {user?.company?.name || 'FieldOps'}
            </div>
            <div className="text-xs text-gray-400 capitalize">
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
