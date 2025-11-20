'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, signUp, signInWithGoogle } from '@/firebase/auth';
import { createUserProfile, getUserProfile } from '@/firebase/services';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignUp) {
        // Sign up the user
        const userCredential = await signUp(email, password);
        
        // Check if profile already exists (shouldn't happen for new sign-ups, but good to check)
        const existingProfile = await getUserProfile(userCredential.user.uid);
        if (!existingProfile) {
          // Create a user profile with default role 'reader' only if no profile exists
          await createUserProfile({
            uid: userCredential.user.uid,
            email: userCredential.user.email || '',
            displayName: displayName || userCredential.user.displayName || '', // Use provided display name or empty string
            photoURL: userCredential.user.photoURL || '',       // Use empty string instead of undefined
            role: 'reader'
          });
          console.log('Created new user profile with reader role for new user:', userCredential.user.uid);
        } else {
          console.log('User profile already exists for new user:', userCredential.user.uid, 'with role:', existingProfile.role);
        }
      } else {
        // For sign-in, just sign in - don't create/modify profile
        await signIn(email, password);
        console.log('User signed in with email/password');
      }
      setLoading(false);
      
      router.push('/profile');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in or use a different email.');
      } else {
        setError(err.message || 'Authentication failed');
      }
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      // Sign in with Google
      const userCredential = await signInWithGoogle();
      
      // Check if profile already exists
      const existingProfile = await getUserProfile(userCredential.user.uid);
      if (!existingProfile) {
        // Create a user profile with default role 'reader' only if no profile exists
        await createUserProfile({
          uid: userCredential.user.uid,
          email: userCredential.user.email || '',
          displayName: userCredential.user.displayName || undefined,
          photoURL: userCredential.user.photoURL || undefined,
          role: 'reader'
        });
        console.log('Created new user profile with reader role for Google user:', userCredential.user.uid);
      } else {
        console.log('User profile already exists for Google user:', userCredential.user.uid, 'with role:', existingProfile.role);
      }
      
      setLoading(false);
      
      router.push('/profile');
    } catch (err: any) {
      console.error('Google sign in error:', err);
      
      // Provide more specific error messages
      if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for authentication. Please try again later or contact support.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked by your browser. Please enable popups for this site.');
      } else{
        setError(err.message || 'Google authentication failed');
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-[#1F1F1F] p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold">
              <span className="text-primary">Tune</span>
              <span className="text-white">Talez</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">
            {isSignUp ? 'Create an Account' : 'Sign In to Your Account'}
          </h1>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your display name"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#3a3a3a]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1F1F1F] text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center bg-white hover:bg-gray-100 text-gray-800 py-2 px-4 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.798-1.677-4.198-2.701-6.735-2.701-5.539 0-10.032 4.493-10.032 10.032s4.493 10.032 10.032 10.032c8.445 0 10.452-7.888 9.629-11.732h-9.629z"
                  fill="currentColor"
                />
              </svg>
              <span>Sign {isSignUp ? 'up' : 'in'} with Google</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:text-primary-light transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}