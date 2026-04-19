const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function buildErrorMessage(data) {
  if (!data) {
    return 'Request failed. Please try again.';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  if (data.non_field_errors) {
    return data.non_field_errors.join(' ');
  }

  const firstField = Object.keys(data)[0];
  const firstError = data[firstField];

  if (Array.isArray(firstError)) {
    return `${firstField}: ${firstError.join(' ')}`;
  }

  return 'Request failed. Please check the form and try again.';
}

async function request(path, options = {}) {
  const { token, ...fetchOptions } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(buildErrorMessage(data));
  }

  return data;
}

export function getCategories() {
  return request('/categories/');
}

export function getProducts(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/products/${suffix}`);
}

export function getProduct(id) {
  return request(`/products/${id}/`);
}

export function registerUser(payload) {
  return request('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getProfile(token) {
  return request('/profile/', { token });
}

export function updateProfile(token, payload) {
  return request('/profile/', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function getAddresses(token) {
  return request('/addresses/', { token });
}

export function createAddress(token, payload) {
  return request('/addresses/', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function updateAddress(token, id, payload) {
  return request(`/addresses/${id}/`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteAddress(token, id) {
  return request(`/addresses/${id}/`, {
    method: 'DELETE',
    token,
  });
}

export function getOrders(token) {
  return request('/orders/', { token });
}

export function getCart(token) {
  return request('/cart/', { token });
}

export function addCartItem(token, payload) {
  return request('/cart/items/', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function updateCartItem(token, id, payload) {
  return request(`/cart/items/${id}/`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteCartItem(token, id) {
  return request(`/cart/items/${id}/`, {
    method: 'DELETE',
    token,
  });
}

export function checkoutOrder(token, payload) {
  return request('/orders/checkout/', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
