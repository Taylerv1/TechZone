from decimal import Decimal

from django.contrib import admin
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.template.response import TemplateResponse

from .models import Order, OrderItem, Product


def store_reports_view(request):
    total_sales = Order.objects.aggregate(total=Sum('total_price'))['total'] or Decimal('0.00')
    orders_count = Order.objects.count()
    items_sold = OrderItem.objects.aggregate(total=Sum('quantity'))['total'] or 0
    average_order_value = total_sales / orders_count if orders_count else Decimal('0.00')

    revenue_by_day = (
        Order.objects.annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(
            orders_count=Count('id'),
            total_sales=Sum('total_price'),
        )
        .order_by('-day')[:30]
    )

    top_products = (
        OrderItem.objects.values('product_name')
        .annotate(
            quantity_sold=Sum('quantity'),
            revenue=Sum('total_price'),
        )
        .order_by('-quantity_sold', '-revenue')[:10]
    )
    low_stock_products = Product.objects.filter(stock__lte=5).order_by('stock', 'name')[:10]

    context = {
        **admin.site.each_context(request),
        'title': 'Store Reports',
        'total_sales': total_sales,
        'orders_count': orders_count,
        'items_sold': items_sold,
        'average_order_value': average_order_value,
        'revenue_by_day': revenue_by_day,
        'top_products': top_products,
        'low_stock_products': low_stock_products,
    }
    return TemplateResponse(request, 'admin/store/reports.html', context)
