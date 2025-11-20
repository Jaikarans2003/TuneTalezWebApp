'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { BookDocument, deleteBook } from '@/firebase/services';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AuthorContentManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<BookDocument[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBookForm, setShowBookForm] = useState(false);

  useEffect(() => {
    async function fetchAuthorContent() {
      if (!user) return;
      
      try {
        // Fetch books by this author
        const booksQuery = query(
          collection(db, 'books'), 
          where('authorId', '==', user.uid), 
          orderBy('createdAt', 'desc')
        );
        const booksSnapshot = await getDocs(booksQuery);
        const booksList = booksSnapshot.docs.map(doc => ({ 
          ...doc.data(), 
          id: doc.id 
        } as BookDocument));
        
        setBooks(booksList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching author content:', error);
        setLoading(false);
      }
    }

    fetchAuthorContent();
  }, [user]);

  const handleDeleteBook = async (book: BookDocument) => {
    if (window.confirm(`Are you sure you want to delete the book "${book.title}"?`)) {
      try {
        await deleteBook(book);
        setBooks(prevBooks => prevBooks.filter(b => b.id !== book.id));
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  };
  
  const handleEditBook = (book: BookDocument) => {
    // Navigate to the dedicated edit page for this book
    router.push(`/author/edit/${book.id}`);
  };



  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total episodes across all books
  const totalEpisodes = books.reduce((sum, book) => sum + (book.chapters?.length || 0), 0);

  // Add new episode functionality
  const handleAddEpisode = (bookId: string) => {
    router.push(`/author/add-episode/${bookId}`);
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF0000]"></div>
      </div>
    );
  }

  return (
    <div>
      {showBookForm ? (
        <div>
          <button 
            onClick={() => setShowBookForm(false)}
            className="mb-4 px-3 py-1 bg-black text-white border border-[#FF0000] rounded-md hover:bg-[#1F1F1F] transition-colors"
          >
            ← Back to My Content
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#FF0000]">My Content</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setShowBookForm(true);
                }}
                className="px-4 py-2 bg-[#FF0000] text-white rounded hover:bg-[#CC0000] transition-colors"
              >
                Create New Book
              </button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search my content..."
                  className="px-4 py-2 border border-[#333333] rounded-lg bg-[#1F1F1F] text-white focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#1F1F1F] border border-[#333333] rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400">Total Books</h4>
                <p className="text-2xl font-bold text-[#FF0000]">{books.length}</p>
              </div>
              <div className="bg-[#1F1F1F] border border-[#333333] rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400">Total Episodes</h4>
                <p className="text-2xl font-bold text-[#FF0000]">{totalEpisodes}</p>
              </div>
              <div className="bg-[#1F1F1F] border border-[#333333] rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400">Avg Episodes/Book</h4>
                <p className="text-2xl font-bold text-[#FF0000]">{books.length > 0 ? Math.round(totalEpisodes / books.length) : 0}</p>
              </div>
            </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-[#1F1F1F] rounded-lg overflow-hidden border border-[#333333]">
                    <thead className="bg-black">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#FF0000] uppercase tracking-wider">Book</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#FF0000] uppercase tracking-wider">Episodes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#FF0000] uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#FF0000] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredBooks.map((book) => (
                        <tr key={book.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {book.thumbnailUrl ? (
                                <Image 
                                  className="h-10 w-10 object-cover rounded mr-3" 
                                  src={book.thumbnailUrl} 
                                  alt=""
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-black flex items-center justify-center mr-3">
                                  <span className="text-[#FF0000] text-sm">📚</span>
                                </div>
                              )}
                              <div className="font-medium text-white">{book.title}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-black text-[#FF0000] border border-[#FF0000] rounded-full text-xs">
                              {book.chapters?.length || 0} episodes
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white">
                            {new Date(book.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-3">
                            <button
                              onClick={() => handleEditBook(book)}
                              className="text-[#FF0000] hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleAddEpisode(book.id || '')}
                              className="text-green-400 hover:text-white"
                            >
                              Add Episode
                            </button>
                            <Link
                              href={`/author/manage-episodes/${book.id}`}
                              className="text-[#FF0000] hover:text-white"
                            >
                              Manage Episodes
                            </Link>
                            <button
                              onClick={() => handleDeleteBook(book)}
                              className="text-[#FF0000] hover:text-white"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
          </div>
        </>
      )}
    </div>
  );
}