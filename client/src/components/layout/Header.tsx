/**
 * Header Component
 * Navigation bar with logo
 */

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { settingsApi } from '../../services/api';

export default function Header() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    // Fetch custom logo
    settingsApi.getLogo()
      .then((data) => setLogoUrl(data.logoUrl))
      .catch(() => setLogoUrl(null));
  }, []);

  return (
    <header className="bg-primary shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="MortgagePros Logo" 
                className="h-20 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-white font-bold text-xl group-hover:text-gray-100 transition-colors">
                  MortgagePros
                </span>
              </div>
            )}
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${location.pathname === '/admin' 
                          ? 'bg-white/20 text-white' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/holidays"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${location.pathname === '/admin/holidays' 
                          ? 'bg-white/20 text-white' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      Holidays
                    </Link>
                    <Link
                      to="/admin/settings"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${location.pathname === '/admin/settings' 
                          ? 'bg-white/20 text-white' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      Settings
                    </Link>
                    <Link
                      to="/admin/export"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${location.pathname === '/admin/export' 
                          ? 'bg-white/20 text-white' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      Export
                    </Link>
                  </>
                )}
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
