'use client';

import BookForm from '@/components/book/BookForm';

interface AuthorBookFormProps {
  onSuccess: () => void;
}

export default function AuthorBookForm({ onSuccess }: AuthorBookFormProps) {
  return (
    <div className="container mx-auto py-8">
      <BookForm onSuccess={onSuccess} />
    </div>
  );
}