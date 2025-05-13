// app/api/[...path]/route.js - Fixed version
import { NextResponse } from 'next/server';

// Helper function to log requests for debugging
const logRequest = (method, path, status, duration) => {
  console.log(`${method} ${path} ${status} in ${duration}ms`);
};

export async function GET(req) {
  const start = Date.now();
  const { pathname, search } = new URL(req.url);
  const path = pathname.replace('/api/', '');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const url = `${apiUrl}/api/${path}${search}`;

  console.log(`Proxying GET request to: ${url}`);

  const headers = {};
  // Copy authorization header if present
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const responseContentType = response.headers.get('content-type');
    const duration = Date.now() - start;
    logRequest('GET', path, response.status, duration);

    // For store requests, we want to properly handle them
    if (path.startsWith('stores/')) {
      console.log(`Processing store request for ${path}`);

      // Check if response is ok
      if (!response.ok) {
        // Try to parse error message
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `Error: ${response.status}`;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        
        return NextResponse.json(
          { error: errorMessage }, 
          { status: response.status }
        );
      }
    }

    if (responseContentType && responseContentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const data = await response.text();
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': responseContentType || 'text/plain',
        },
      });
    }
  } catch (error) {
    console.error(`Error proxying GET to ${url}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const start = Date.now();
  const { pathname } = new URL(req.url);
  const path = pathname.replace('/api/', '');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const url = `${apiUrl}/api/${path}`;

  console.log(`Proxying POST request to: ${url}`);

  const headers = {};
  // Copy authorization header if present
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    // Check if content type is multipart/form-data for file uploads
    const requestContentType = req.headers.get('content-type');
    let response;

    if (requestContentType && requestContentType.includes('multipart/form-data')) {
      // Forward the request as-is for multipart form data
      const formData = await req.formData();
      
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
    } else {
      // For JSON or other content types
      const body = await req.json();
      
      response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }

    const responseContentType = response.headers.get('content-type');
    const duration = Date.now() - start;
    logRequest('POST', path, response.status, duration);

    if (responseContentType && responseContentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const data = await response.text();
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': responseContentType || 'text/plain',
        },
      });
    }
  } catch (error) {
    console.error(`Error proxying POST to ${url}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const start = Date.now();
  const { pathname } = new URL(req.url);
  const path = pathname.replace('/api/', '');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const url = `${apiUrl}/api/${path}`;

  console.log(`Proxying PUT request to: ${url}`);

  const headers = {};
  // Copy authorization header if present
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    // Check if content type is multipart/form-data for file uploads
    const requestContentType = req.headers.get('content-type');
    let response;

    if (requestContentType && requestContentType.includes('multipart/form-data')) {
      // Forward the request as-is for multipart form data
      const formData = await req.formData();
      
      response = await fetch(url, {
        method: 'PUT',
        headers,
        body: formData,
      });
    } else {
      // For JSON or other content types
      const body = await req.json();
      
      response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }

    const responseContentType = response.headers.get('content-type');
    const duration = Date.now() - start;
    logRequest('PUT', path, response.status, duration);

    if (responseContentType && responseContentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const data = await response.text();
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': responseContentType || 'text/plain',
        },
      });
    }
  } catch (error) {
    console.error(`Error proxying PUT to ${url}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const start = Date.now();
  const { pathname } = new URL(req.url);
  const path = pathname.replace('/api/', '');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const url = `${apiUrl}/api/${path}`;

  console.log(`Proxying DELETE request to: ${url}`);

  const headers = {};
  // Copy authorization header if present
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    const responseContentType = response.headers.get('content-type');
    const duration = Date.now() - start;
    logRequest('DELETE', path, response.status, duration);

    if (responseContentType && responseContentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const data = await response.text();
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': responseContentType || 'text/plain',
        },
      });
    }
  } catch (error) {
    console.error(`Error proxying DELETE to ${url}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}