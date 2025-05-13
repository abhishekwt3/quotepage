// app/(dashboard)/dashboard/page.js
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getToken } from '../../../utils/auth';

// Dashboard stats component
const DashboardStats = ({ stats }) => {
  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                {stat.icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </div>
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Link
                href={stat.href}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState('Checking authentication...');

  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      console.log('Dashboard - Token exists:', !!token);
      setAuthStatus(token ? 'Authenticated' : 'Not authenticated');
      
      if (!token) {
        // If we're on the dashboard page without a token, something went wrong
        console.error('No token found on dashboard page - auth flow may be broken');
      }
    };
    
    checkAuth();
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log('Dashboard - Fetching dashboard data');
      const token = getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Fetch stats
      console.log('Dashboard - Fetching stats');
      const statsResponse = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Dashboard - Stats response status:', statsResponse.status);
      
      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch stats: ${statsResponse.status}`);
      }
      
      // Fetch recent requests
      console.log('Dashboard - Fetching requests');
      const requestsResponse = await fetch('/api/quote-requests?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Dashboard - Requests response status:', requestsResponse.status);
      
      if (!requestsResponse.ok) {
        throw new Error(`Failed to fetch requests: ${requestsResponse.status}`);
      }

      const statsData = await statsResponse.json();
      const requestsData = await requestsResponse.json();
      
      console.log('Dashboard - Data loaded successfully');

      setStats([
        {
          name: 'Total Products',
          value: statsData.totalProducts || 0,
          href: '/products',
          icon: (
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m-8-4l8 4m8 4l-8 4m8-4l-8-4m8-4v12" />
            </svg>
          ),
        },
        {
          name: 'Quote Requests',
          value: statsData.totalRequests || 0,
          href: '/requests',
          icon: (
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
        },
        {
          name: 'Pending Requests',
          value: statsData.pendingRequests || 0,
          href: '/requests?status=pending',
          icon: (
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ]);

      setRecentRequests(requestsData.requests || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setStats([
        {
          name: 'Total Products',
          value: 0,
          href: '/products',
          icon: (
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m-8-4l8 4m8 4l-8 4m8-4l-8-4m8-4v12" />
            </svg>
          ),
        },
        {
          name: 'Quote Requests',
          value: 0,
          href: '/requests',
          icon: (
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
        },
        {
          name: 'Pending Requests',
          value: 0,
          href: '/requests?status=pending',
          icon: (
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      {/* Debug information - remove in production */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 my-4 rounded">
        <h2 className="text-md font-medium text-yellow-800">Debug Information</h2>
        <p className="text-sm text-yellow-700">Auth Status: {authStatus}</p>
        <p className="text-sm text-yellow-700">
          Token in storage: {typeof window !== 'undefined' && localStorage.getItem('token') ? 'Yes' : 'No'}
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center mt-8">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <DashboardStats stats={stats} />
          
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Quote Requests</h2>
              <Link
                href="/requests"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                View all
              </Link>
            </div>
            
            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
              {recentRequests.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {recentRequests.map((request) => (
                    <li key={request.id}>
                      <Link href={`/requests/${request.id}`} className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-indigo-600 truncate">
                              {request.customer_name}
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  request.status === 'processed' ? 'bg-green-100 text-green-800' : 
                                  'bg-gray-100 text-gray-800'}`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-between">
                            <div className="sm:flex">
                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {request.customer_email}
                              </div>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>
                                {new Date(request.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  No quote requests yet.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}