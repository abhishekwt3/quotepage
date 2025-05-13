// app/(dashboard)/layout.js - Modified version with settings link
"use client"

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken, logout } from '../../utils/auth';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists
    const token = getToken();
    
    if (!token) {
      console.log('No token found in dashboard layout, redirecting to auth');
      router.push('/auth');
      return;
    }

    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Not authorized');
        }

        const data = await response.json();
        setUser(data.user);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user:', err);
        // Clear invalid token
        logout();
        router.push('/auth');
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-white font-bold text-xl">QuoteFlow</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link 
                    href="/dashboard" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/dashboard' 
                        ? 'bg-indigo-700 text-white' 
                        : 'text-indigo-200 hover:bg-indigo-500'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/products" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname.startsWith('/products') 
                        ? 'bg-indigo-700 text-white' 
                        : 'text-indigo-200 hover:bg-indigo-500'
                    }`}
                  >
                    My Products
                  </Link>
                  <Link 
                    href="/requests" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname.startsWith('/requests') 
                        ? 'bg-indigo-700 text-white' 
                        : 'text-indigo-200 hover:bg-indigo-500'
                    }`}
                  >
                    Quote Requests
                  </Link>
                  <Link 
                    href="/settings" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname.startsWith('/settings') 
                        ? 'bg-indigo-700 text-white' 
                        : 'text-indigo-200 hover:bg-indigo-500'
                    }`}
                  >
                    Store Settings
                  </Link>
                  {user?.store_name ? (
                    <Link 
                      href={`/stores/${user.store_name}`} 
                      className="px-3 py-2 rounded-md text-sm font-medium text-indigo-200 hover:bg-indigo-500"
                      target="_blank"
                    >
                      View Store
                    </Link>
                  ) : (
                    <Link 
                      href={`/preview/${user?.id}`} 
                      className="px-3 py-2 rounded-md text-sm font-medium text-indigo-200 hover:bg-indigo-500"
                      target="_blank"
                    >
                      Preview Page
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="text-white mr-4">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-indigo-200 hover:bg-indigo-500"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}