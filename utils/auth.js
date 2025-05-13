// utils/auth.js
"use client"

import { parseCookies, setCookie, destroyCookie } from 'nookies';

// Token storage and management
export const setToken = (token) => {
  if (!token) return;
  
  // Store in localStorage for easy access
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
  
  // Also store in cookies for SSR and middleware
  setCookie(null, 'token', token, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
};

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
  destroyCookie(null, 'token');
};

export const getToken = (ctx = null) => {
  // For client-side
  if (typeof window !== 'undefined' && !ctx) {
    return localStorage.getItem('token');
  }
  
  // For server-side
  const cookies = parseCookies(ctx);
  return cookies.token;
};

// Login function
export const login = async (email, password) => {
  return ensureToken('/api/auth/login', { email, password });
};

// Signup function
export const signup = async (name, email, password) => {
  return ensureToken('/api/auth/signup', { name, email, password });
};

// Helper function to get authenticated fetch
export const authFetch = async (url, options = {}) => {
  const token = getToken();
  
  const headers = {
    ...options.headers,
    'Authorization': token ? `Bearer ${token}` : '',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle authentication errors
    if (response.status === 401) {
      // Token might be expired or invalid
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
      throw new Error('Authentication required');
    }

    return response;
  } catch (error) {
    console.error('Auth fetch error:', error);
    throw error;
  }
};

// Logout function
export const logout = () => {
  removeToken();
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/auth';
  }
};

// Function to ensure token is properly extracted and saved
const ensureToken = async (endpoint, data) => {
  try {
    console.log(`Sending request to ${endpoint}`, data);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log(`Response status: ${response.status}`);
    
    // Always try to parse JSON, even if response is not OK
    let responseData;
    try {
      responseData = await response.json();
      console.log(`Response data:`, responseData);
    } catch (e) {
      console.error(`Error parsing JSON:`, e);
      const textResponse = await response.text();
      console.log(`Raw response:`, textResponse);
      throw new Error('Invalid response format');
    }
    
    if (!response.ok) {
      throw new Error(responseData.error || `${endpoint} failed with status ${response.status}`);
    }

    // Double check token exists
    if (!responseData.token) {
      console.warn(`No token in response from ${endpoint}`);
      throw new Error('No authentication token received');
    }

    // Explicitly save token in storage
    setToken(responseData.token);
    console.log(`Token saved from ${endpoint}`);
    
    return {
      success: true,
      user: responseData.user,
      token: responseData.token
    };
  } catch (error) {
    console.error(`${endpoint} error:`, error);
    return { success: false, error: error.message };
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};