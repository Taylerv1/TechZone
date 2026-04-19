from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView

from .views import (
    AddressDetailView,
    AddressListCreateView,
    CartItemCreateView,
    CartItemDetailView,
    CartView,
    CategoryListView,
    CheckoutView,
    OrderDetailView,
    OrderListView,
    ProductDetailView,
    ProductListView,
    ProfileView,
    RegisterView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='auth-login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('addresses/', AddressListCreateView.as_view(), name='address-list'),
    path('addresses/<int:pk>/', AddressDetailView.as_view(), name='address-detail'),
    path('cart/', CartView.as_view(), name='cart-detail'),
    path('cart/items/', CartItemCreateView.as_view(), name='cart-item-create'),
    path('cart/items/<int:pk>/', CartItemDetailView.as_view(), name='cart-item-detail'),
    path('orders/checkout/', CheckoutView.as_view(), name='order-checkout'),
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
]
