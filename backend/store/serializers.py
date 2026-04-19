from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import (
    Address,
    Cart,
    CartItem,
    Category,
    Order,
    OrderItem,
    Product,
    ProductImage,
)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']
        read_only_fields = ['id']

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


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
            'created_at',
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


class ProductDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

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
            'created_at',
            'updated_at',
        ]


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
            'payment_method',
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

    def validate_payment_method(self, value):
        if value != 'mock':
            raise serializers.ValidationError('Only mock payment is supported.')
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

        total_price = sum(
            products[item.product_id].price * item.quantity
            for item in items
        )

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
