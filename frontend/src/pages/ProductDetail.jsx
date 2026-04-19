import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { addCartItem, getProduct } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getProductImage } from '../utils/productImages.js';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getProduct(id);
        if (isMounted) {
          setProduct(data);
          setSelectedImage(getProductImage(data, Number(id)));
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return <p className="page-message">Loading product...</p>;
  }

  if (error) {
    return <p className="page-message error-message">{error}</p>;
  }

  if (!product) {
    return <p className="page-message">Product not found.</p>;
  }

  const images = product.images?.length ? product.images : [];
  const isOutOfStock = product.stock <= 0;

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }

    setIsAdding(true);
    setError('');
    setMessage('');

    try {
      await addCartItem(accessToken, {
        product_id: product.id,
        quantity,
      });
      setMessage('Product added to cart.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <section className="product-detail-page">
      <Link to="/products" className="text-link">Back to products</Link>

      <div className="product-detail">
        <div className="detail-gallery">
          <img src={selectedImage} alt={product.name} className="detail-image" />
          {images.length > 1 && (
            <div className="thumbnail-row">
              {images.map((image) => (
                <button
                  type="button"
                  key={image.id}
                  className={selectedImage === image.image ? 'thumbnail active' : 'thumbnail'}
                  onClick={() => setSelectedImage(image.image)}
                >
                  <img src={image.image} alt={image.alt_text || product.name} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-content">
          <p className="eyebrow">{product.category_name}</p>
          <h1>{product.name}</h1>
          <p className="detail-description">{product.description}</p>

          <div className="detail-price-row">
            <span className="price large">${product.price}</span>
            <span className={isOutOfStock ? 'stock out' : 'stock'}>
              {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
            </span>
          </div>

          <div className="purchase-panel">
            <label>
              Quantity
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                disabled={isOutOfStock || isAdding}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              className="primary-button"
              disabled={isOutOfStock || isAdding}
              onClick={handleAddToCart}
            >
              {isAdding ? 'Adding...' : 'Add to cart'}
            </button>
            <Link to="/cart" className="secondary-button">View cart</Link>
          </div>

          {message && <p className="success-message">{message}</p>}
        </div>
      </div>
    </section>
  );
}
