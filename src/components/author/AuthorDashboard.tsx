'use client';

import { useState } from 'react';
import AuthorStats from './AuthorStats';
import AuthorContentManagement from './AuthorContentManagement';
import AuthorBookForm from './AuthorBookForm';


type TabType = 'stats' | 'content' | 'write';

export default function AuthorDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [bookSuccess, setBookSuccess] = useState(false);

  // Handle successful book creation
  const handleBookSuccess = () => {
    setBookSuccess(true);
    // Reset after 2 seconds
    setTimeout(() => {
      setBookSuccess(false);
      setActiveTab('content');
    }, 2000);
  };
  
 

  return (
    <div className="bg-[#1F1F1F] rounded-lg shadow-lg text-white">
      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-[#303030]">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-3 text-sm font-medium ${
            activeTab === 'stats'
              ? 'border-b-2 border-[#FF0000] text-[#FF0000]'
              : 'text-white hover:bg-[#303030] transition-colors'
          }`}
        >
          My Stats
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-6 py-3 text-sm font-medium ${
            activeTab === 'content'
              ? 'border-b-2 border-[#FF0000] text-[#FF0000]'
              : 'text-white hover:bg-[#303030] transition-colors'
          }`}
        >
          My Content
        </button>
        <button
          onClick={() => setActiveTab('write')}
          className={`px-6 py-3 text-sm font-medium ${
            activeTab === 'write'
              ? 'border-b-2 border-[#FF0000] text-[#FF0000]'
              : 'text-white hover:bg-[#303030] transition-colors'
          }`}
        >
          Write Book
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'stats' && <AuthorStats />}
        {activeTab === 'content' && <AuthorContentManagement />}
        {activeTab === 'write' && (
          bookSuccess ? (
            <div className="max-w-md mx-auto p-6 bg-[#303030] border border-[#FF0000] rounded-lg text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Book Published Successfully!</h2>
              <p className="text-gray-300">Redirecting to my content...</p>
            </div>
          ) : (
            <AuthorBookForm onSuccess={handleBookSuccess} />
          )
        )}
      </div>
    </div>
  );
}