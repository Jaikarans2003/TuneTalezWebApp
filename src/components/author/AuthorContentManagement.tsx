'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { BookDocument, deleteBook } from '@/firebase/services';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AuthorBookForm from './AuthorBookForm';

export default function AuthorContentManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<BookDocument[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBookForm, setShowBookForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch author's books
  const fetchAuthorContent = async () => {
    if (!user) {
      console.log('❌ No user found, skipping fetch');
      return;
    }

    console.log('🔍 Fetching books for author:', user.uid);
    console.log('📧 User email:', user.email);

    try {
      setLoading(true);
      setErrorMessage(null);

      // First, try with orderBy
      try {
        const booksQuery = query(
          collection(db, 'books'),
          where('authorId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        console.log('📚 Executing query with orderBy...');
        const booksSnapshot = await getDocs(booksQuery);
        console.log('✅ Query successful. Found', booksSnapshot.size, 'books');

        const booksList = booksSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('📖 Book found:', doc.id, data.title);
          return {
            ...data,
            id: doc.id
          } as BookDocument;
        });

        setBooks(booksList);
        console.log('✅ Books set in state:', booksList.length);
      } catch (orderByError: any) {
        // If orderBy fails (missing index), try without it
        console.warn('⚠️ Query with orderBy failed, trying without orderBy:', orderByError.message);

        const booksQuery = query(
          collection(db, 'books'),
          where('authorId', '==', user.uid)
        );
        console.log('📚 Executing query without orderBy...');
        const booksSnapshot = await getDocs(booksQuery);
        console.log('✅ Query successful. Found', booksSnapshot.size, 'books');

        const booksList = booksSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('📖 Book found:', doc.id, data.title);
          return {
            ...data,
            id: doc.id
          } as BookDocument;
        });

        // Sort manually by createdAt
        booksList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setBooks(booksList);
        console.log('✅ Books set in state:', booksList.length);
        setErrorMessage('Note: Books loaded successfully but Firestore index may be missing for optimal performance.');
      }

      setLoading(false);
    } catch (error: any) {
      console.error('❌ Error fetching author content:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      setErrorMessage(`Failed to load books: ${error.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered. User:', user?.uid);
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
    // Navigate to the manage episodes page where you can edit the book
    console.log('📝 Navigating to edit book:', book.id);
    router.push(`/manage-episodes/${book.id}`);
  };

  // Handle successful book creation
  const handleBookFormSuccess = () => {
    setShowBookForm(false);
    fetchAuthorContent(); // Refresh the books list
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total episodes across all books
  const totalEpisodes = books.reduce((sum, book) => sum + (book.chapters?.length || 0), 0);



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
          <AuthorBookForm onSuccess={handleBookFormSuccess} />
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

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-yellow-900 border border-yellow-700 text-yellow-100 rounded">
              {errorMessage}
            </div>
          )}

          {/* Debug Info Panel */}
          <div className="mb-4 p-3 bg-[#2a2a2a] border border-[#444444] rounded text-xs">
            <p className="text-gray-400">
              <strong>Debug Info:</strong> User ID: {user?.uid || 'Not logged in'} |
              Books Found: {books.length} |
              Filtered Books: {filteredBooks.length}
            </p>
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
                  {filteredBooks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                        {books.length === 0 ? (
                          <div>
                            <p className="text-lg mb-2">📚 No books found</p>
                            <p className="text-sm">Click "Create New Book" to publish your first book!</p>
                          </div>
                        ) : (
                          <p>No books match your search criteria</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredBooks.map((book) => (
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
                            className="text-blue-400 hover:text-white transition-colors"
                            title="Edit book and manage episodes"
                          >
                            Edit Book
                          </button>
                          <Link
                            href={`/manage-episodes/${book.id}`}
                            className="text-green-400 hover:text-white transition-colors"
                            title="Manage episodes for this book"
                          >
                            Manage Episodes
                          </Link>
                          <button
                            onClick={() => handleDeleteBook(book)}
                            className="text-[#FF0000] hover:text-white transition-colors"
                            title="Delete this book"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}