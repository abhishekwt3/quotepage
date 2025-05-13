// app/(dashboard)/requests/page.js
"use client"

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '../../../utils/auth';

export default function RequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStatus, setCurrentStatus] = useState(statusParam || 'all');

  useEffect(() => {
    if (statusParam) {
      setCurrentStatus(statusParam);
    }
    
    fetchRequests(statusParam || 'all');
  }, [statusParam]);

  const fetchRequests = async (statusFilter = 'all') => {
    setLoading(true);
    try {
      console.log(`Requests - Fetching requests with status: ${statusFilter}`);
      const token = getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      let url = '/api/quote-requests';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Requests - Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch quote requests');
      }

      const data = await response.json();
      console.log('Requests - Data received:', data);
      
      // Ensure requests is always an array
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      console.error('Error fetching quote requests:', err);
      setError(err.message);
      // Set to empty array on error, not null
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setCurrentStatus(newStatus);
    
    // Update URL query parameter
    const params = new URLSearchParams();
    if (newStatus !== 'all') {
      params.set('status', newStatus);
    }
    
    router.push(`/requests${newStatus !== 'all' ? `?status=${newStatus}` : ''}`);
    
    fetchRequests(newStatus);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(`/api/quote-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update request status');
      }

      // Refresh the requests list
      fetchRequests(currentStatus);
    } catch (err) {
      console.error('Error updating request status:', err);
      alert('Failed to update request status. Please try again.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Add safety check for requests array
  const requestsList = Array.isArray(requests) ? requests : [];

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Quote Requests</h1>
      </div>

      {/* Debug information - remove in production */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 my-4 rounded">
        <h2 className="text-md font-medium text-yellow-800">Debug Information</h2>
        <p className="text-sm text-yellow-700">
          Token in storage: {typeof window !== 'undefined' && getToken() ? 'Yes' : 'No'}
        </p>
        <p className="text-sm text-yellow-700">
          Requests data type: {Array.isArray(requests) ? 'Array' : typeof requests}
        </p>
        <p className="text-sm text-yellow-700">
          Requests count: {Array.isArray(requests) ? requests.length : 'N/A'}
        </p>
        <p className="text-sm text-yellow-700">
          Current status filter: {currentStatus}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => handleStatusChange('all')}
              className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                currentStatus === 'all'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleStatusChange('pending')}
              className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                currentStatus === 'pending'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => handleStatusChange('processed')}
              className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                currentStatus === 'processed'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Processed
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                currentStatus === 'rejected'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rejected
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="flex justify-center my-8">
            <div className="spinner"></div>
          </div>
        ) : requestsList.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No quote requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requestsList.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.customer_email}
                          </div>
                          {request.customer_phone && (
                            <div className="text-sm text-gray-500">
                              {request.customer_phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/requests/${request.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        View Details
                      </Link>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'processed')}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Mark as Processed
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {request.status === 'processed' && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'pending')}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Mark as Pending
                        </button>
                      )}
                      {request.status === 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'pending')}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Mark as Pending
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}