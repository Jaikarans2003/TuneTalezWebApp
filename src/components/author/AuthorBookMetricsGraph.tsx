'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface BookMetric {
  id: string;
  title: string;
  likes: number;
  saves: number;
}

export default function AuthorBookMetricsGraph() {
  const { user } = useAuth();
  const [bookMetrics, setBookMetrics] = useState<BookMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookMetrics() {
      if (!user) return;
      
      try {
        // Get all books by this author
        const booksQuery = query(collection(db, 'books'), where('authorId', '==', user.uid));
        const booksSnapshot = await getDocs(booksQuery);
        
        const metrics: BookMetric[] = [];
        
        for (const bookDoc of booksSnapshot.docs) {
          const bookData = bookDoc.data();
          const bookId = bookDoc.id;
          
          // Get likes for this book
          const likesQuery = query(collection(db, 'likes'), where('bookId', '==', bookId));
          const likesSnapshot = await getDocs(likesQuery);
          const likes = likesSnapshot.size;
          
          // Get saves/bookmarks for this book
          const bookmarksQuery = query(collection(db, 'bookmarks'), where('bookId', '==', bookId));
          const bookmarksSnapshot = await getDocs(bookmarksQuery);
          const saves = bookmarksSnapshot.size;
          
          metrics.push({
            id: bookId,
            title: bookData.title || 'Untitled',
            likes,
            saves
          });
        }
        
        // Sort by likes (descending) for better visualization
        metrics.sort((a, b) => b.likes - a.likes);
        setBookMetrics(metrics);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching book metrics:', error);
        setLoading(false);
      }
    }

    fetchBookMetrics();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF0000]"></div>
      </div>
    );
  }

  if (bookMetrics.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>No books found to display metrics.</p>
      </div>
    );
  }

  const maxValue = Math.max(
    ...bookMetrics.map(m => Math.max(m.likes, m.saves)),
    1
  );

  return (
    <div className="bg-[#1F1F1F] p-6 rounded-lg shadow border border-[#333333]">
      <h3 className="text-lg font-semibold mb-4 text-[#FF0000]">Books by Likes and Saves</h3>
      
      <div className="space-y-4">
        {bookMetrics.map((book) => (
          <div key={book.id} className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-white font-medium truncate flex-1 mr-4">
                {book.title}
              </span>
              <div className="flex space-x-4 text-xs">
                <span className="text-blue-400">❤️ {book.likes}</span>
                <span className="text-green-400">💾 {book.saves}</span>
              </div>
            </div>
            
            <div className="relative h-8 bg-[#2A2A2A] rounded overflow-hidden">
              {/* Likes bar */}
              <div 
                className="absolute left-0 top-0 h-full bg-blue-500 opacity-80 transition-all duration-300"
                style={{ width: `${(book.likes / maxValue) * 100}%` }}
              />
              {/* Saves bar */}
              <div 
                className="absolute left-0 top-0 h-full bg-green-500 opacity-60 transition-all duration-300"
                style={{ width: `${(book.saves / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center space-x-6 mt-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 opacity-80 rounded mr-2"></div>
          <span className="text-gray-300">Likes</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 opacity-60 rounded mr-2"></div>
          <span className="text-gray-300">Saves</span>
        </div>
      </div>
    </div>
  );
}