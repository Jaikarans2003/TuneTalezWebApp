'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AuthorDashboard from '@/components/author/AuthorDashboard';

export default function AuthorDashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !profile || profile.role !== 'author')) {
      router.push('/');
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF0000]"></div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'author') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#FF0000]">Author's Suit</h1>
          <p className="text-gray-400 mt-2">Manage your books, PDFs, and track your performance</p>
        </div>
        
        <AuthorDashboard />
      </div>
    </div>
  );
}