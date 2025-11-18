'use client';

import { useState } from 'react';

interface DescriptionDropdownProps {
  title: string;
  description: string;
  className?: string;
}

export default function DescriptionDropdown({ title, description, className = '' }: DescriptionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`bg-[#2a2a2a] rounded-lg p-4 mb-4 ${className}`}>
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold text-white flex items-center">
          {title}
        </h3>
        <span className="text-primary">
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </span>
      </button>
      
      {isOpen && (
        <div className="mt-3 text-gray-300 prose prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      )}
    </div>
  );
}