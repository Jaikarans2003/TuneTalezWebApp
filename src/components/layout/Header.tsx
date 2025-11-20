'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Logo from './Logo';

interface HeaderProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

function HeaderContent({ isOpen, setIsOpen }: HeaderProps) {
  const { user, profile, logout, updateRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Initialize search input from URL if on homepage
  useEffect(() => {
    if (pathname === '/') {
      const q = searchParams?.get('q');
      if (q) {
        setSearchInput(q);
      }
    }
  }, [pathname, searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (pathname === '/') {
      // Update URL with search query
      const params = new URLSearchParams();
      if (searchInput.trim()) {
        params.set('q', searchInput.trim());
      }
      router.push(`/?${params.toString()}`);
    } else {
      // Navigate to home page with search query
      router.push(`/?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  // Handle real-time search as user types
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    // Only trigger real-time search on the homepage
    if (pathname === '/') {
      // Use a small delay to prevent excessive URL updates
      clearTimeout((window as any).searchTimeout);
      (window as any).searchTimeout = setTimeout(() => {
        const params = new URLSearchParams();
        if (value.trim()) {
          params.set('q', value.trim());
        }
        router.push(`/?${params.toString()}`, { scroll: false });
      }, 300);
    }
  };

  return (
    <header className="bg-[#212121] text-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Left section - Menu toggle and Logo */}
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mr-3 text-white md:hidden"
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="flex items-center">
            <Logo url="/logos/5.png" size={52} />
            {/* <span className="text-2xl font-bold text-primary ml-2 mr-1">Tune</span>
            <span className="text-2xl font-bold text-white">Talez</span> */}
          </Link>
        </div>

        {/* Middle section - Search bar */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-8">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchInputChange}
              placeholder="Search books and PDFs..."
              className="w-full bg-[#121212] border border-[#303030] rounded-full py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              suppressHydrationWarning
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white p-1 rounded-full hover:bg-red-700 transition-colors"
              suppressHydrationWarning
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </form>
        </div>

        {/* Right section - Sign in button or User profile */}
        <div className="flex items-center space-x-4">

          {/* Upload button for authors */}
          {user && profile?.role === 'author' && (
            <Link
              href="/author-dashboard"
              className="bg-primary hover:bg-primary-dark text-white py-1 px-4 rounded-full flex items-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>

            </Link>
          )}

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 text-white hover:text-primary transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium">{user.email?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden md:block">
                  <span className="block">{user.displayName || user.email?.split('@')[0]}</span>
                  {profile && (
                    <span className="text-xs text-gray-400 capitalize">{profile.role}</span>
                  )}
                </div>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1F1F1F] rounded-md shadow-lg py-1 z-50">
                  <Link
                    href="/profile"
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#303030] transition-colors"
                  >
                    View Profile
                  </Link>

                  {/* Reader and Author Toggle Button */}
                  {profile && (
                    <div className="px-4 py-2 border-b border-t border-gray-700">
                      <p className="text-sm text-white">Account Type</p>
                      {profile.role === 'author' ? (
                        <div className="mt-1">
                          <div className="flex items-center justify-between bg-primary text-white text-xs px-3 py-2 rounded">
                            <span className="font-medium">Author</span>
                            {/* <span className="text-xs opacity-75">(Permanent)</span> */}
                          </div>
                          {/* <p className="text-xs text-gray-400 mt-1">Authors cannot revert to reader role</p> */}
                        </div>
                      ) : (
                        <div className="flex mt-1 space-x-2">
                          <button
                            onClick={() => updateRole('reader')}
                            className={`text-xs px-2 py-1 rounded ${profile.role === 'reader' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}
                          >
                            Reader
                          </button>
                          <button
                            onClick={() => updateRole('author')}
                            className={`text-xs px-2 py-1 rounded ${profile.role === 'author' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}
                          >
                            Author
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Author's Suit - only visible for authors */}
                  {profile && profile.role === 'author' && (
                    <Link
                      href="/author-dashboard"
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#303030] transition-colors border-b border-gray-700"
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Author's Suit
                      </div>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#303030] transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/signin" className="bg-primary hover:bg-primary-dark text-white py-1 px-4 rounded-full flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

const Header: React.FC<HeaderProps> = (props) => {
  return (
    <Suspense fallback={
      <header className="bg-[#212121] text-white sticky top-0 z-50 shadow-md h-16 flex items-center justify-center">
        <div className="animate-pulse w-full max-w-md h-8 bg-gray-800 rounded"></div>
      </header>
    }>
      <HeaderContent {...props} />
    </Suspense>
  );
};

export default Header;