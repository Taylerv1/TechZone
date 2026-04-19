import { Link } from 'react-router-dom';

import { getProductImage } from '../utils/productImages.js';

export default function ProductCard({ product, index }) {
  const imageUrl = getProductImage(product, index);
  const isOutOfStock = product.stock <= 0;

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-image-link">
        <img src={imageUrl} alt={product.name} className="product-image" />
      </Link>
      <div className="product-card-body">
        <p className="eyebrow">{product.category_name}</p>
        <h3>
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="product-meta">
          <span className="price">${product.price}</span>
          <span className={isOutOfStock ? 'stock out' : 'stock'}>
            {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
          </span>
        </div>
      </div>
    </article>
  );
}
