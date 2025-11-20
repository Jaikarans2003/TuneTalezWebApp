'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import AuthorBookMetricsGraph from './AuthorBookMetricsGraph';

interface AuthorStatsData {
  totalBooks: number;
  totalEpisodes: number;
  totalLikes: number;
  totalSaves: number;
  recentBooks: number;
  recentEpisodes: number;
  recentLikes: number;
  recentSaves: number;
}

export default function AuthorStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AuthorStatsData>({
    totalBooks: 0,
    totalEpisodes: 0,
    totalLikes: 0,
    totalSaves: 0,
    recentBooks: 0,
    recentEpisodes: 0,
    recentLikes: 0,
    recentSaves: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuthorStats() {
      if (!user) return;
      
      try {
        // Get total books by this author
        const booksQuery = query(collection(db, 'books'), where('authorId', '==', user.uid));
        const booksSnapshot = await getDocs(booksQuery);
        const bookIds = booksSnapshot.docs.map(doc => doc.id);
        
        // Count total episodes across all books
        let totalEpisodes = 0;
        booksSnapshot.forEach(doc => {
          const book = doc.data();
          totalEpisodes += book.chapters?.length || 0;
        });

        // Get total likes for author's books
        let totalLikes = 0;
        if (bookIds.length > 0) {
          const likesQuery = query(collection(db, 'likes'), where('bookId', 'in', bookIds));
          const likesSnapshot = await getDocs(likesQuery);
          totalLikes = likesSnapshot.size;
        }

        // Get total saves/bookmarks for author's books
        let totalSaves = 0;
        if (bookIds.length > 0) {
          const bookmarksQuery = query(collection(db, 'bookmarks'), where('bookId', 'in', bookIds));
          const bookmarksSnapshot = await getDocs(bookmarksQuery);
          totalSaves = bookmarksSnapshot.size;
        }

        // Get recent counts (last 7 days)
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        
        const recentBooksQuery = query(
          collection(db, 'books'),
          where('authorId', '==', user.uid),
          where('createdAt', '>=', oneWeekAgo)
        );
        const recentBooksSnapshot = await getDocs(recentBooksQuery);
        
        // Count recent episodes
        let recentEpisodes = 0;
        recentBooksSnapshot.forEach(doc => {
          const book = doc.data();
          recentEpisodes += book.chapters?.length || 0;
        });

        // Get recent likes (last 7 days)
        let recentLikes = 0;
        if (bookIds.length > 0) {
          const recentLikesQuery = query(
            collection(db, 'likes'), 
            where('bookId', 'in', bookIds),
            where('createdAt', '>=', oneWeekAgo)
          );
          const recentLikesSnapshot = await getDocs(recentLikesQuery);
          recentLikes = recentLikesSnapshot.size;
        }

        // Get recent saves (last 7 days)
        let recentSaves = 0;
        if (bookIds.length > 0) {
          const recentBookmarksQuery = query(
            collection(db, 'bookmarks'), 
            where('bookId', 'in', bookIds),
            where('createdAt', '>=', oneWeekAgo)
          );
          const recentBookmarksSnapshot = await getDocs(recentBookmarksQuery);
          recentSaves = recentBookmarksSnapshot.size;
        }

        setStats({
          totalBooks: booksSnapshot.size,
          totalEpisodes: totalEpisodes,
          totalLikes: totalLikes,
          totalSaves: totalSaves,
          recentBooks: recentBooksSnapshot.size,
          recentEpisodes: recentEpisodes,
          recentLikes: recentLikes,
          recentSaves: recentSaves
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching author stats:', error);
        setLoading(false);
      }
    }

    fetchAuthorStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF0000]"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-[#FF0000]">My Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Books" value={stats.totalBooks} />
        <StatCard title="Total Episodes" value={stats.totalEpisodes} />
        <StatCard title="Total Likes" value={stats.totalLikes} />
        <StatCard title="Total Saves" value={stats.totalSaves} />
      </div>
      
      <h3 className="text-lg font-medium mb-3 text-[#FF0000]">Last 7 Days</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="New Books" value={stats.recentBooks} />
        <StatCard title="New Episodes" value={stats.recentEpisodes} />
        <StatCard title="New Likes" value={stats.recentLikes} />
        <StatCard title="New Saves" value={stats.recentSaves} />
      </div>
      
      <div className="mt-8">
        <AuthorBookMetricsGraph />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-[#1F1F1F] p-4 rounded-lg shadow border border-[#333333]">
      <h3 className="text-sm font-medium text-[#FF0000]">{title}</h3>
      <p className="text-2xl font-bold mt-1 text-white">{value}</p>
    </div>
  );
}