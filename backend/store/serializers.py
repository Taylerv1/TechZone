from decimal import Decimal

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Avg
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    Address,
    Cart,
    CartItem,
    Category,
    ContactMessage,
    Coupon,
    Order,
    OrderItem,
    Product,
    ProductImage,
    Review,
    WishlistItem,
)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']
        read_only_fields = ['id']
        extra_kwargs = {'email': {'required': True, 'allow_blank': False}}

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        user.is_active = False
        user.save(update_fields=['is_active'])
        return user


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        login_value = attrs.get(self.username_field, '').strip()

        if '@' in login_value:
            user_model = get_user_model()
            user = user_model.objects.filter(email__iexact=login_value).first()
            if user:
                attrs[self.username_field] = getattr(user, self.username_field)

        return super().validate(attrs)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate_refresh(self, value):
        try:
            token = RefreshToken(value)
        except TokenError as exc:
            raise serializers.ValidationError('Invalid refresh token.') from exc

        self.context['refresh_token'] = token
        return value

    def save(self, **kwargs):
        self.context['refresh_token'].blacklist()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError) as exc:
            raise serializers.ValidationError({'uid': 'Invalid reset link.'}) from exc

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({'token': 'Reset link is invalid or expired.'})

        self.context['user'] = user
        return attrs

    def save(self, **kwargs):
        user = self.context['user']
        user.set_password(self.validated_data['password'])
        user.save(update_fields=['password'])
        return user


class EmailConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError) as exc:
            raise serializers.ValidationError({'uid': 'Invalid confirmation link.'}) from exc

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError(
                {'token': 'Confirmation link is invalid or expired.'}
            )

        self.context['user'] = user
        return attrs

    def save(self, **kwargs):
        user = self.context['user']
        if not user.is_active:
            user.is_active = True
            user.save(update_fields=['is_active'])
        return user


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'username']

    def validate_email(self, value):
        user = self.instance
        if value and User.objects.exclude(id=user.id).filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id',
            'full_name',
            'phone',
            'address_line',
            'city',
            'state',
            'postal_code',
            'country',
            'is_default',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'products_count']

    def get_products_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary']


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'category',
            'category_name',
            'name',
            'price',
            'stock',
            'is_featured',
            'primary_image',
            'average_rating',
            'reviews_count',
            'created_at',
            'updated_at',
        ]

    def get_primary_image(self, obj):
        image = obj.images.first()
        if not image:
            return None

        request = self.context.get('request')
        image_url = image.image.url
        if request:
            return request.build_absolute_uri(image_url)
        return image_url

    def get_average_rating(self, obj):
        average = obj.reviews.aggregate(value=Avg('rating'))['value']
        return round(average, 1) if average else None

    def get_reviews_count(self, obj):
        return obj.reviews.count()


class ProductDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'category',
            'category_name',
            'name',
            'description',
            'price',
            'stock',
            'is_featured',
            'images',
            'average_rating',
            'reviews_count',
            'created_at',
            'updated_at',
        ]

    def get_average_rating(self, obj):
        average = obj.reviews.aggregate(value=Avg('rating'))['value']
        return round(average, 1) if average else None

    def get_reviews_count(self, obj):
        return obj.reviews.count()


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'created_at']
        read_only_fields = fields


class WishlistItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, is_active=True)
        except Product.DoesNotExist as exc:
            raise serializers.ValidationError('Product not found.') from exc

        self.context['product'] = product
        return value

    def save(self, **kwargs):
        return WishlistItem.objects.get_or_create(
            user=self.context['request'].user,
            product=self.context['product'],
        )[0]


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user_name', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user_name', 'created_at', 'updated_at']

    def validate(self, attrs):
        request = self.context['request']
        product = self.context['product']

        if self.instance is None and Review.objects.filter(
            user=request.user,
            product=product,
        ).exists():
            raise serializers.ValidationError('You already reviewed this product.')

        return attrs

    def create(self, validated_data):
        return Review.objects.create(
            user=self.context['request'].user,
            product=self.context['product'],
            **validated_data,
        )


def calculate_coupon_discount(coupon, subtotal):
    if coupon.discount_type == Coupon.DiscountType.PERCENTAGE:
        discount = subtotal * coupon.value / Decimal('100')
    else:
        discount = coupon.value

    return min(discount, subtotal).quantize(Decimal('0.01'))


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=30)

    def validate_code(self, value):
        try:
            coupon = Coupon.objects.get(code__iexact=value.strip(), is_active=True)
        except Coupon.DoesNotExist as exc:
            raise serializers.ValidationError('Coupon is invalid or inactive.') from exc

        self.context['coupon'] = coupon
        return coupon.code

    def validate(self, attrs):
        cart = self.context['cart']
        items = list(cart.items.select_related('product'))

        if not items:
            raise serializers.ValidationError('Cart is empty.')

        subtotal = sum(item.product.price * item.quantity for item in items)
        coupon = self.context['coupon']
        discount_amount = calculate_coupon_discount(coupon, subtotal)

        attrs['subtotal_price'] = subtotal
        attrs['discount_amount'] = discount_amount
        attrs['total_price'] = subtotal - discount_amount
        return attrs


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    item_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'item_total', 'created_at', 'updated_at']

    def get_item_total(self, obj):
        return obj.product.price * obj.quantity


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price', 'created_at', 'updated_at']

    def get_total_price(self, obj):
        return sum(item.product.price * item.quantity for item in obj.items.all())


class CartItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, is_active=True)
        except Product.DoesNotExist as exc:
            raise serializers.ValidationError('Product not found.') from exc

        self.context['product'] = product
        return value

    def validate(self, attrs):
        product = self.context['product']
        cart = self.context['cart']
        quantity = attrs.get('quantity', 1)
        existing_item = CartItem.objects.filter(cart=cart, product=product).first()
        current_quantity = existing_item.quantity if existing_item else 0
        requested_quantity = current_quantity + quantity

        if requested_quantity > product.stock:
            raise serializers.ValidationError(
                {'quantity': 'Requested quantity is greater than available stock.'}
            )

        return attrs

    def save(self, **kwargs):
        product = self.context['product']
        cart = self.context['cart']
        quantity = self.validated_data.get('quantity', 1)
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity},
        )

        if not created:
            item.quantity += quantity
            item.save(update_fields=['quantity', 'updated_at'])

        return item


class CartItemUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ['quantity']

    def validate_quantity(self, value):
        if value > self.instance.product.stock:
            raise serializers.ValidationError(
                'Requested quantity is greater than available stock.'
            )
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'total_price']
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'status',
            'full_name',
            'phone',
            'address_line',
            'city',
            'state',
            'postal_code',
            'country',
            'coupon_code',
            'discount_amount',
            'total_price',
            'items',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class CheckoutSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30)
    address_line = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    postal_code = serializers.CharField(max_length=30)
    country = serializers.CharField(max_length=100)
    payment_method = serializers.CharField(max_length=50, required=False, default='mock')
    coupon_code = serializers.CharField(max_length=30, required=False, allow_blank=True)

    def validate_payment_method(self, value):
        if value != 'mock':
            raise serializers.ValidationError('Selected payment method is not available.')
        return value

    def validate(self, attrs):
        cart = self.context['cart']
        items = list(cart.items.select_related('product'))

        if not items:
            raise serializers.ValidationError('Cart is empty.')

        for item in items:
            if item.quantity > item.product.stock:
                raise serializers.ValidationError(
                    {
                        'cart': (
                            f'Only {item.product.stock} item(s) available for '
                            f'{item.product.name}.'
                        )
                    }
                )

        coupon_code = attrs.get('coupon_code', '').strip()
        if coupon_code:
            try:
                attrs['coupon'] = Coupon.objects.get(
                    code__iexact=coupon_code,
                    is_active=True,
                )
            except Coupon.DoesNotExist as exc:
                raise serializers.ValidationError(
                    {'coupon_code': 'Coupon is invalid or inactive.'}
                ) from exc

        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        cart = self.context['cart']
        user = self.context['request'].user
        items = list(cart.items.select_related('product'))

        if not items:
            raise serializers.ValidationError('Cart is empty.')

        product_ids = [item.product_id for item in items]
        products = {
            product.id: product
            for product in Product.objects.select_for_update().filter(id__in=product_ids)
        }

        for item in items:
            product = products[item.product_id]
            if item.quantity > product.stock:
                raise serializers.ValidationError(
                    {
                        'cart': (
                            f'Only {product.stock} item(s) available for '
                            f'{product.name}.'
                        )
                    }
                )

        subtotal_price = sum(
            products[item.product_id].price * item.quantity
            for item in items
        )
        coupon = self.validated_data.get('coupon')
        discount_amount = (
            calculate_coupon_discount(coupon, subtotal_price)
            if coupon else Decimal('0.00')
        )
        total_price = subtotal_price - discount_amount

        order = Order.objects.create(
            user=user,
            status=Order.Status.PENDING,
            full_name=self.validated_data['full_name'],
            phone=self.validated_data['phone'],
            address_line=self.validated_data['address_line'],
            city=self.validated_data['city'],
            state=self.validated_data.get('state', ''),
            postal_code=self.validated_data['postal_code'],
            country=self.validated_data['country'],
            payment_method=self.validated_data.get('payment_method', 'mock'),
            coupon_code=coupon.code if coupon else '',
            discount_amount=discount_amount,
            total_price=total_price,
        )

        order_items = []
        for item in items:
            product = products[item.product_id]
            unit_price = product.price
            quantity = item.quantity
            order_items.append(
                OrderItem(
                    order=order,
                    product=product,
                    product_name=product.name,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=unit_price * quantity,
                )
            )
            product.stock -= quantity
            product.save(update_fields=['stock', 'updated_at'])

        OrderItem.objects.bulk_create(order_items)
        cart.items.all().delete()
        return order


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']
