from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.generics import (
    CreateAPIView,
    ListAPIView,
    ListCreateAPIView,
    RetrieveAPIView,
    RetrieveUpdateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Address, Cart, CartItem, Category, Product
from .serializers import (
    AddressSerializer,
    CartItemCreateSerializer,
    CartItemSerializer,
    CartItemUpdateSerializer,
    CartSerializer,
    CategorySerializer,
    CheckoutSerializer,
    OrderSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProfileSerializer,
    RegisterSerializer,
)


class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class ProfileView(RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class AddressListCreateView(ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)


class CartItemCreateView(CreateAPIView):
    serializer_class = CartItemCreateSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        context['cart'] = cart
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        output_serializer = CartItemSerializer(item, context={'request': request})
        return Response(output_serializer.data, status=201)


class CartItemDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ['patch', 'delete', 'options']

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return CartItemUpdateSerializer
        return CartItemSerializer

    def get_queryset(self):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        return CartItem.objects.filter(cart=cart)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        output_serializer = CartItemSerializer(item, context={'request': request})
        return Response(output_serializer.data)


class CheckoutView(CreateAPIView):
    serializer_class = CheckoutSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        context['cart'] = cart
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        output_serializer = OrderSerializer(order, context={'request': request})
        return Response(output_serializer.data, status=201)


class OrderListView(ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            self.request.user.orders.all()
            .prefetch_related('items')
            .order_by('-created_at')
        )


class OrderDetailView(RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.orders.all().prefetch_related('items')


class CategoryListView(ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None


class ProductListView(ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = (
            Product.objects.filter(is_active=True)
            .select_related('category')
            .prefetch_related('images')
        )

        category = self.request.query_params.get('category')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        availability = self.request.query_params.get('availability')
        search = self.request.query_params.get('search')
        sort = self.request.query_params.get('sort')

        if category:
            queryset = queryset.filter(category_id=category)

        if min_price:
            queryset = queryset.filter(price__gte=min_price)

        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        if availability == 'in_stock':
            queryset = queryset.filter(stock__gt=0)
        elif availability == 'out_of_stock':
            queryset = queryset.filter(stock=0)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(category__name__icontains=search)
            )

        if sort == 'price':
            queryset = queryset.order_by('price')
        elif sort == '-price':
            queryset = queryset.order_by('-price')
        elif sort == 'newest':
            queryset = queryset.order_by('-created_at')

        return queryset


class ProductDetailView(RetrieveAPIView):
    queryset = (
        Product.objects.filter(is_active=True)
        .select_related('category')
        .prefetch_related('images')
    )
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]
