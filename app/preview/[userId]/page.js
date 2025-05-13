// app/preview/[userId]/page.js
"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';

export default function ProductPreviewPage() {
  const params = useParams();
  const userId = params.userId;
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // For quote form
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [selectedItems, setSelectedItems] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProducts(userId);
    }
  }, [userId]);

  const fetchProducts = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/public/products/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products);
      setUser(data.user);
      
      // Initialize selected items with quantity 0
      const initialSelectedItems = {};
      data.products.forEach(product => {
        initialSelectedItems[product.id] = 0;
      });
      setSelectedItems(initialSelectedItems);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId, value) => {
    const quantity = parseInt(value, 10) || 0;
    
    setSelectedItems(prev => ({
      ...prev,
      [productId]: quantity
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openQuoteForm = () => {
    // Check if any product is selected
    const anyProductSelected = Object.values(selectedItems).some(quantity => quantity > 0);
    
    if (!anyProductSelected) {
      alert('Please select at least one product to request a quote.');
      return;
    }
    
    setShowQuoteForm(true);
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Filter out products with quantity 0
      const selectedProducts = Object.entries(selectedItems)
        .filter(([_, quantity]) => quantity > 0)
        .map(([productId, quantity]) => ({
          productId,
          quantity
        }));
      
      const response = await fetch('/api/public/quote-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          message: formData.message,
          products: selectedProducts
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit quote request');
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      
      // Reset selected items
      const resetSelectedItems = {};
      products.forEach(product => {
        resetSelectedItems[product.id] = 0;
      });
      setSelectedItems(resetSelectedItems);
      
      // Show success message
      setQuoteSuccess(true);
      setShowQuoteForm(false);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setQuoteSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error submitting quote request:', err);
      alert('Failed to submit quote request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{user ? `${user.name}'s Products` : 'Products'} | QuoteFlow</title>
        <meta name="description" content="Request quotes for products and services" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {user ? `${user.name}'s Products` : 'Products'}
            </h1>
            <p className="mt-2 text-gray-600">
              Browse products and request quotes
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {quoteSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">Your quote request has been submitted successfully! We will get back to you soon.</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center my-8">
              <div className="spinner"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
              <p className="text-gray-500">No products available.</p>
            </div>
          ) : (
            <>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <li key={product.id}>
                      <div className="px-4 py-4 sm:px-6">
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
                          <div className="min-w-0 flex-1 flex items-center justify-between">
                            <div>
                              <h3 className="text-sm leading-5 font-medium text-gray-900">
                                {product.name}
                              </h3>
                              {product.description && (
                                <p className="mt-1 text-sm text-gray-500">
                                  {product.description}
                                </p>
                              )}
                              <div className="mt-2 flex flex-wrap">
                                <span className="mr-4 text-xs text-gray-500">
                                  Price: ${product.price}
                                </span>
                                <span className="mr-4 text-xs text-gray-500">
                                  Min Quantity: {product.min_quantity}
                                </span>
                                <span className="mr-4 text-xs text-gray-500">
                                  Shipping: ${product.shipping_charges}
                                </span>
                                <span className="mr-4 text-xs text-gray-500">
                                  GST: ${product.gst_amount}
                                </span>
                                {product.delivery_time && (
                                  <span className="mr-4 text-xs text-gray-500">
                                    Delivery Time: {product.delivery_time}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <div className="w-24">
                                <label htmlFor={`quantity-${product.id}`} className="sr-only">
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  id={`quantity-${product.id}`}
                                  name={`quantity-${product.id}`}
                                  min="0"
                                  value={selectedItems[product.id] || 0}
                                  onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  placeholder="Qty"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-center">
                  <button
                    onClick={openQuoteForm}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Request a Quote
                  </button>
                </div>
              </div>

              {/* Quote Request Form Modal */}
              {showQuoteForm && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                  <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                      <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                    </div>

                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                    <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                      <div>
                        <div className="mt-3 text-center sm:mt-5">
                          <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                            Request a Quote
                          </h3>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Please fill out the form below to request a quote for the selected products.
                            </p>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleSubmitQuote} className="mt-5 sm:mt-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-3">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                              Full Name *
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                value={formData.name}
                                onChange={handleInputChange}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-3">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email Address *
                            </label>
                            <div className="mt-1">
                              <input
                                type="email"
                                name="email"
                                id="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-6">
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                              Phone Number
                            </label>
                            <div className="mt-1">
                              <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-6">
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                              Message
                            </label>
                            <div className="mt-1">
                              <textarea
                                id="message"
                                name="message"
                                rows={3}
                                value={formData.message}
                                onChange={handleInputChange}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="Additional information or questions..."
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                          >
                            {submitting ? 'Submitting...' : 'Submit Quote Request'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowQuoteForm(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} QuoteFlow. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}