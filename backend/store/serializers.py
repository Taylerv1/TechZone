from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Address, Cart, CartItem, Category, Product, ProductImage


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
