// app/(dashboard)/products/page.js
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '../../../utils/auth';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log('Products - Fetching products');
      const token = getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Products - Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      console.log('Products - Data received:', data);
      
      // Ensure products is always an array
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
      // Set to empty array on error, not null
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      // Refresh products list
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product. Please try again.');
    }
  };

  // Add safety check for products array
  const productsList = Array.isArray(products) ? products : [];

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Products</h1>
        <Link
          href="/products/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New Product
        </Link>
      </div>

      {/* Debug information - remove in production */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 my-4 rounded">
        <h2 className="text-md font-medium text-yellow-800">Debug Information</h2>
        <p className="text-sm text-yellow-700">
          Token in storage: {typeof window !== 'undefined' && getToken() ? 'Yes' : 'No'}
        </p>
        <p className="text-sm text-yellow-700">
          Products data type: {Array.isArray(products) ? 'Array' : typeof products}
        </p>
        <p className="text-sm text-yellow-700">
          Products count: {Array.isArray(products) ? products.length : 'N/A'}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="spinner"></div>
        </div>
      ) : productsList.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500 mb-4">You do not have any products yet.</p>
          <Link
            href="/products/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            Create your first product
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {productsList.map((product) => (
              <li key={product.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="h-8 w-8 mr-4 object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gray-200 mr-4 flex items-center justify-center rounded">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm leading-5 font-medium text-gray-900">
                        {product.name}
                      </h3>
                      <div className="mt-1 flex items-center">
                        <span className="text-sm text-gray-500 mr-2">
                          Price: ${product.price}
                        </span>
                        <span className="text-sm text-gray-500">
                          Min Qty: {product.min_quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/products/${product.id}`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}