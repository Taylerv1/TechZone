from django.conf import settings
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Q
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.generics import (
    CreateAPIView,
    ListAPIView,
    ListCreateAPIView,
    RetrieveAPIView,
    RetrieveUpdateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Address, Cart, CartItem, Category, Product, Review, WishlistItem
from .serializers import (
    AddressSerializer,
    CartItemCreateSerializer,
    CartItemSerializer,
    CartItemUpdateSerializer,
    CartSerializer,
    CategorySerializer,
    CheckoutSerializer,
    CouponValidateSerializer,
    ContactMessageSerializer,
    EmailConfirmSerializer,
    LogoutSerializer,
    OrderSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    EmailOrUsernameTokenObtainPairSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProfileSerializer,
    RegisterSerializer,
    ReviewSerializer,
    WishlistItemCreateSerializer,
    WishlistItemSerializer,
)


class ProductPagination(PageNumberPagination):
    page_size = 8
    page_size_query_param = 'page_size'
    max_page_size = 40


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'ok', 'service': 'techzone-api'})


class EmailOrUsernameTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenObtainPairSerializer


class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        confirmation_link = f"{settings.FRONTEND_URL}/confirm-email/{uid}/{token}"
        send_mail(
            subject='Confirm your TechZone account',
            message=(
                'Welcome to TechZone.\n\n'
                f'Open this link to confirm your account:\n{confirmation_link}\n\n'
                'After confirmation, you can sign in and start shopping.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )

        output = RegisterSerializer(user, context=self.get_serializer_context())
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)


class LogoutView(CreateAPIView):
    serializer_class = LogoutSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Logged out successfully.'}, status=200)


class PasswordResetRequestView(CreateAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        user = User.objects.filter(email__iexact=email).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            send_mail(
                subject='Reset your TechZone password',
                message=(
                    'We received a request to reset your password.\n\n'
                    f'Open this link to choose a new password:\n{reset_link}\n\n'
                    'If you did not request this, you can ignore this email.'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

        return Response(
            {
                'detail': (
                    'If an account with that email exists, a password reset link '
                    'has been sent.'
                )
            },
            status=200,
        )


class PasswordResetConfirmView(CreateAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password updated successfully.'}, status=200)


class EmailConfirmView(CreateAPIView):
    serializer_class = EmailConfirmSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Email confirmed successfully.'}, status=200)


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
        item_lines = '\n'.join(
            f'- {item.product_name} x {item.quantity}: ${item.total_price}'
            for item in order.items.all()
        )
        send_mail(
            subject=f'TechZone order #{order.id} confirmation',
            message=(
                f'Thank you for your order, {order.full_name}.\n\n'
                f'Order #{order.id}\n'
                f'Status: {order.get_status_display()}\n\n'
                f'{item_lines}\n\n'
                f'Discount: ${order.discount_amount}\n'
                f'Total: ${order.total_price}\n\n'
                'You can track your order from your dashboard.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[request.user.email],
            fail_silently=True,
        )
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


class ContactMessageCreateView(CreateAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]


class CategoryListView(ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None


class ProductListView(ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    pagination_class = ProductPagination

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
        featured = self.request.query_params.get('featured')
        sort = self.request.query_params.get('sort')

        if category:
            queryset = queryset.filter(category_id=category)

        if featured in ['1', 'true', 'yes']:
            queryset = queryset.filter(is_featured=True)

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


class WishlistListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            WishlistItem.objects.filter(user=self.request.user)
            .select_related('product', 'product__category')
            .prefetch_related('product__images')
        )

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return WishlistItemCreateSerializer
        return WishlistItemSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        output_serializer = WishlistItemSerializer(item, context={'request': request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class WishlistDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['delete', 'options']

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user)


class ReviewListCreateView(ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_product(self):
        return get_object_or_404(Product, id=self.kwargs['product_id'], is_active=True)

    def get_queryset(self):
        return (
            Review.objects.filter(product=self.get_product())
            .select_related('user')
            .order_by('-created_at')
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['product'] = self.get_product()
        return context


class CouponValidateView(CreateAPIView):
    serializer_class = CouponValidateSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        context['cart'] = cart
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {
                'code': serializer.validated_data['code'],
                'subtotal_price': serializer.validated_data['subtotal_price'],
                'discount_amount': serializer.validated_data['discount_amount'],
                'total_price': serializer.validated_data['total_price'],
            },
            status=200,
        )


class ProductDetailView(RetrieveAPIView):
    queryset = (
        Product.objects.filter(is_active=True)
        .select_related('category')
        .prefetch_related('images')
    )
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]
