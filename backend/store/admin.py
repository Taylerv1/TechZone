from django.contrib import admin

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


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class LowStockFilter(admin.SimpleListFilter):
    title = 'stock level'
    parameter_name = 'stock_level'

    def lookups(self, request, model_admin):
        return [
            ('low', 'Low stock (5 or less)'),
            ('out', 'Out of stock'),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'low':
            return queryset.filter(stock__lte=5)
        if self.value() == 'out':
            return queryset.filter(stock=0)
        return queryset


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'category',
        'price',
        'stock',
        'stock_status',
        'is_active',
        'is_featured',
    ]
    list_filter = ['category', LowStockFilter, 'is_active', 'is_featured']
    search_fields = ['name', 'description']
    inlines = [ProductImageInline]

    @admin.display(description='Stock status')
    def stock_status(self, obj):
        if obj.stock == 0:
            return 'Out of stock'
        if obj.stock <= 5:
            return 'Low stock'
        return 'Available'


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'alt_text', 'is_primary', 'created_at']
    list_filter = ['is_primary', 'created_at']
    search_fields = ['product__name', 'alt_text']


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'product', 'quantity', 'updated_at']
    search_fields = ['cart__user__username', 'product__name']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'updated_at']
    search_fields = ['user__username', 'user__email']
    inlines = [CartItemInline]


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user', 'city', 'country', 'is_default']
    list_filter = ['country', 'is_default']
    search_fields = ['full_name', 'phone', 'user__username', 'city']


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_type', 'value', 'is_active', 'created_at']
    list_filter = ['discount_type', 'is_active', 'created_at']
    search_fields = ['code']


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__email', 'product__name']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['product__name', 'user__username', 'comment']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'quantity', 'unit_price', 'total_price']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    change_list_template = 'admin/store/order/change_list.html'
    list_display = ['id', 'user', 'status', 'coupon_code', 'discount_amount', 'total_price', 'created_at']
    list_filter = ['status', 'coupon_code', 'created_at']
    search_fields = ['user__username', 'full_name', 'phone']
    exclude = ['payment_method']
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product_name', 'quantity', 'unit_price', 'total_price']
    search_fields = ['order__user__username', 'product_name']


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['subject', 'name', 'email', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['name', 'email', 'subject', 'message']
