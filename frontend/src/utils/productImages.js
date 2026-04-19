const fallbackImages = [
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
];

export function getProductImage(product, index = 0) {
  if (product?.primary_image) {
    return product.primary_image;
  }

  const image = product?.images?.find((item) => item.is_primary) || product?.images?.[0];
  if (image?.image) {
    return image.image;
  }

  return fallbackImages[index % fallbackImages.length];
}

export function getHeroImage(products) {
  const productWithImage = products.find((product) => product.primary_image);
  return (
    productWithImage?.primary_image ||
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1800&q=80'
  );
}
