// app/(dashboard)/settings/page.js
"use client"

import { useState, useEffect } from 'react';
import { getToken } from '../../../utils/auth';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [storeNameAvailable, setStoreNameAvailable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!storeName || storeName === user?.store_name) {
        setStoreNameAvailable(null);
        return;
      }

      // Ensure store name is valid
      const regex = /^[a-zA-Z0-9\-_]+$/;
      if (!regex.test(storeName)) {
        setStoreNameAvailable(false);
        return;
      }

      try {
        const response = await fetch(`/api/stores/check-availability?name=${encodeURIComponent(storeName)}`);
        const data = await response.json();
        setStoreNameAvailable(data.available);
      } catch (err) {
        console.error('Error checking store name availability:', err);
        setStoreNameAvailable(null);
      }
    };

    if (inputFocused) {
      const timeoutId = setTimeout(checkAvailability, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [storeName, user, inputFocused]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUser(data.user);
      setStoreName(data.user.store_name || '');
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStoreName = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    const regex = /^[a-zA-Z0-9\-_]+$/;
    if (!regex.test(storeName)) {
      setError('Store name can only contain letters, numbers, dashes, and underscores');
      setUpdating(false);
      return;
    }

    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/stores/update-name', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_name: storeName
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update store name');
      }

      const data = await response.json();
      setUser(data.user);
      setStoreName(data.user.store_name);
      setSuccess('Store name updated successfully');
    } catch (err) {
      console.error('Error updating store name:', err);
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex justify-center my-8">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Store Settings</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Store URL</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Set a unique name for your store. This will be used as your store URL.</p>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}
          
          <form onSubmit={handleUpdateStoreName} className="mt-5">
            <div className="flex items-end">
              <div className="flex-grow">
                <label htmlFor="store-name" className="block text-sm font-medium text-gray-700">
                  Store Name
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    {typeof window !== 'undefined' 
                      ? `${window.location.protocol}//${window.location.host}/stores/`
                      : 'https://example.com/stores/'}
                  </span>
                  <input
                    type="text"
                    name="store-name"
                    id="store-name"
                    autoComplete="off"
                    className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 ${
                      storeNameAvailable === false ? 'border-red-300' : 
                      storeNameAvailable === true ? 'border-green-300' : ''
                    }`}
                    placeholder="myawesomestore"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value.toLowerCase())}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                  />
                </div>
                {storeNameAvailable === false && (
                  <p className="mt-2 text-sm text-red-600">
                    This store name is either unavailable or contains invalid characters.
                  </p>
                )}
                {storeNameAvailable === true && (
                  <p className="mt-2 text-sm text-green-600">
                    This store name is available!
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Only letters, numbers, dashes, and underscores are allowed.
                </p>
              </div>
              <div className="ml-3">
                <button
                  type="submit"
                  disabled={updating || storeNameAvailable === false || !storeName}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
          
          {user?.store_name && (
            <div className="mt-5">
              <p className="text-sm font-medium text-gray-700">Your store page:</p>
              <a
                href={`/stores/${user.store_name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-500"
              >
                {typeof window !== 'undefined' 
                  ? `${window.location.protocol}//${window.location.host}/stores/${user.store_name}`
                  : `https://example.com/stores/${user.store_name}`}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}