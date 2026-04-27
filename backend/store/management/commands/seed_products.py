from decimal import Decimal
from io import BytesIO
import json
from pathlib import Path
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify
from PIL import Image, ImageChops, ImageOps, UnidentifiedImageError

from store.models import Category, Coupon, Product, ProductImage


USER_AGENT = 'AcademicEcommerceSeeder/1.0 (local academic ecommerce project; support@example.com)'
IMAGE_USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
    'AppleWebKit/537.36 (KHTML, like Gecko) '
    'Chrome/120.0 Safari/537.36'
)


CATEGORIES = {
    'laptops': 'Portable computers for work, study, and entertainment.',
    'phones': 'Smartphones and mobile devices for everyday use.',
    'speakers': 'Speakers for home audio, parties, and portable sound.',
    'headphones': 'Headphones and earbuds for music, calls, and gaming.',
    'lighting': 'Smart lights and desk lighting for modern spaces.',
    'smartwatches': 'Smartwatches and wearables for health and daily tasks.',
}


COUPONS = [
    {
        'code': 'WELCOME10',
        'discount_type': 'percentage',
        'value': '10.00',
        'is_active': True,
    },
    {
        'code': 'SAVE25',
        'discount_type': 'fixed',
        'value': '25.00',
        'is_active': True,
    },
]


PRODUCTS = [
    # Laptops
    {
        'category': 'laptops',
        'name': 'MacBook Air',
        'description': 'Apple thin and light laptop designed for everyday work, study, and travel.',
        'price': '999.00',
        'stock': 12,
        'image_page': 'MacBook Air',
    },
    {
        'category': 'laptops',
        'name': 'MacBook Pro',
        'description': 'Apple professional laptop line for development, creative work, and productivity.',
        'price': '1299.00',
        'stock': 8,
        'image_page': 'MacBook Pro',
    },
    {
        'category': 'laptops',
        'name': 'Dell XPS',
        'description': 'Premium Dell laptop line known for compact design and high-resolution displays.',
        'price': '1199.00',
        'stock': 10,
        'image_page': 'Dell XPS',
    },
    {
        'category': 'laptops',
        'name': 'ThinkPad X1 Carbon',
        'description': 'Lenovo business ultrabook from the ThinkPad X1 series.',
        'price': '1399.00',
        'stock': 7,
        'image_page': 'ThinkPad X1 series',
    },
    {
        'category': 'laptops',
        'name': 'Surface Book',
        'description': 'Microsoft detachable performance laptop with a touchscreen display.',
        'price': '1499.00',
        'stock': 6,
        'image_page': 'Microsoft Surface Book',
    },
    {
        'category': 'laptops',
        'name': 'Chromebook Pixel',
        'description': 'Google premium Chromebook laptop with a high-density display.',
        'price': '899.00',
        'stock': 9,
        'image_page': 'Chromebook Pixel',
    },
    {
        'category': 'laptops',
        'name': 'Asus Eee PC',
        'description': 'Compact Asus netbook line made for portable everyday computing.',
        'price': '399.00',
        'stock': 15,
        'image_page': 'Asus Eee PC',
    },
    # Phones
    {
        'category': 'phones',
        'name': 'iPhone 13',
        'description': 'Apple smartphone with dual cameras, OLED display, and A15 Bionic chip.',
        'price': '599.00',
        'stock': 20,
        'image_page': 'iPhone 13',
    },
    {
        'category': 'phones',
        'name': 'iPhone 14',
        'description': 'Apple smartphone with improved cameras and safety features.',
        'price': '699.00',
        'stock': 16,
        'image_page': 'iPhone 14',
    },
    {
        'category': 'phones',
        'name': 'Samsung Galaxy S23',
        'description': 'Samsung flagship Android phone with AMOLED display and triple-camera system.',
        'price': '799.00',
        'stock': 14,
        'image_page': 'Samsung Galaxy S23',
    },
    {
        'category': 'phones',
        'name': 'Samsung Galaxy Z Flip 5',
        'description': 'Foldable Samsung smartphone with a compact clamshell design.',
        'price': '999.00',
        'stock': 8,
        'image_page': 'Samsung Galaxy Z Flip 5',
    },
    {
        'category': 'phones',
        'name': 'Google Pixel 7a',
        'description': 'Google Android phone with Pixel camera software and clean Android experience.',
        'price': '499.00',
        'stock': 13,
        'image_page': 'Google Pixel 7a',
    },
    {
        'category': 'phones',
        'name': 'Xiaomi 13',
        'description': 'Xiaomi Android smartphone with Leica-branded camera hardware.',
        'price': '649.00',
        'stock': 11,
        'image_page': 'Xiaomi 13',
    },
    {
        'category': 'phones',
        'name': 'Nothing Phone 1',
        'description': 'Android smartphone known for its transparent-style back and Glyph Interface.',
        'price': '449.00',
        'stock': 17,
        'image_page': 'Nothing Phone 1',
    },
    # Speakers
    {
        'category': 'speakers',
        'name': 'HomePod mini',
        'description': 'Apple compact smart speaker with Siri support.',
        'price': '99.00',
        'stock': 22,
        'image_page': 'HomePod Mini',
    },
    {
        'category': 'speakers',
        'name': 'HomePod',
        'description': 'Apple smart speaker designed for home audio and Siri voice control.',
        'price': '299.00',
        'stock': 9,
        'image_page': 'HomePod',
    },
    {
        'category': 'speakers',
        'name': 'Sonos One',
        'description': 'Sonos smart speaker for compact home audio.',
        'price': '179.00',
        'stock': 12,
        'image_page': 'Sonos One',
    },
    {
        'category': 'speakers',
        'name': 'Sonos Five',
        'description': 'High-fidelity Sonos speaker for larger rooms and stereo listening.',
        'price': '549.00',
        'stock': 6,
        'image_page': 'Sonos Five',
    },
    {
        'category': 'speakers',
        'name': 'Sonos Play:1',
        'description': 'Compact Sonos wireless speaker made for multi-room audio.',
        'price': '149.00',
        'stock': 14,
        'image_page': 'Play:1',
    },
    {
        'category': 'speakers',
        'name': 'UE Boom',
        'description': 'Portable Bluetooth speaker from Ultimate Ears with 360-degree sound.',
        'price': '129.00',
        'stock': 18,
        'image_page': 'UE Boom',
    },
    {
        'category': 'speakers',
        'name': 'Google Nest Smart Speaker',
        'description': 'Google Nest smart speaker family for Assistant-powered home audio.',
        'price': '99.00',
        'stock': 19,
        'image_page': 'Google Nest (smart speakers)',
    },
    # Headphones
    {
        'category': 'headphones',
        'name': 'AirPods Pro',
        'description': 'Apple wireless earbuds with active noise cancellation.',
        'price': '249.00',
        'stock': 21,
        'image_page': 'AirPods Pro',
    },
    {
        'category': 'headphones',
        'name': 'AirPods Max',
        'description': 'Apple over-ear headphones with active noise cancellation.',
        'price': '549.00',
        'stock': 10,
        'image_page': 'AirPods Max',
    },
    {
        'category': 'headphones',
        'name': 'Pixel Buds',
        'description': 'Google wireless earbuds for Android devices and calls.',
        'price': '179.00',
        'stock': 16,
        'image_page': 'Pixel Buds',
    },
    {
        'category': 'headphones',
        'name': 'Samsung Galaxy Buds',
        'description': 'Samsung wireless earbuds designed for Galaxy devices.',
        'price': '149.00',
        'stock': 18,
        'image_page': 'Samsung Galaxy Buds',
    },
    {
        'category': 'headphones',
        'name': 'Sony MDR-V6',
        'description': 'Sony closed-back monitoring headphones used for studio listening.',
        'price': '99.00',
        'stock': 13,
        'image_page': 'Sony MDR-V6',
    },
    {
        'category': 'headphones',
        'name': 'EarPods',
        'description': 'Apple wired earbuds with an ergonomic in-ear shape.',
        'price': '19.00',
        'stock': 30,
        'image_page': 'EarPods',
    },
    {
        'category': 'headphones',
        'name': 'AirPods',
        'description': 'Apple wireless earbuds with a compact charging case.',
        'price': '129.00',
        'stock': 24,
        'image_page': 'AirPods',
    },
    # Lighting
    {
        'category': 'lighting',
        'name': 'Philips Hue',
        'description': 'Smart lighting system with app-controlled bulbs and scenes.',
        'price': '59.00',
        'stock': 25,
        'image_page': 'Philips Hue',
    },
    {
        'category': 'lighting',
        'name': 'Anglepoise Lamp',
        'description': 'Adjustable balanced-arm lamp design used for desks and workspaces.',
        'price': '199.00',
        'stock': 8,
        'image_page': 'Anglepoise lamp',
    },
    {
        'category': 'lighting',
        'name': "Banker's Lamp",
        'description': 'Classic desk lamp style with a green glass shade.',
        'price': '79.00',
        'stock': 14,
        'image_page': "Banker's lamp",
    },
    {
        'category': 'lighting',
        'name': 'Lava Lamp',
        'description': 'Decorative lamp with moving wax inside a glass vessel.',
        'price': '39.00',
        'stock': 20,
        'image_page': 'Lava lamp',
    },
    {
        'category': 'lighting',
        'name': 'PH Lamp',
        'description': 'Poul Henningsen layered lamp design made to reduce glare.',
        'price': '249.00',
        'stock': 6,
        'image_page': 'PH-lamp',
    },
    {
        'category': 'lighting',
        'name': 'Tolomeo Desk Lamp',
        'description': 'Artemide adjustable desk lamp designed for practical task lighting.',
        'price': '299.00',
        'stock': 7,
        'image_page': 'Tolomeo desk lamp',
    },
    # Smartwatches
    {
        'category': 'smartwatches',
        'name': 'Apple Watch',
        'description': 'Apple smartwatch for fitness tracking, notifications, and apps.',
        'price': '399.00',
        'stock': 17,
        'image_page': 'Apple Watch',
    },
    {
        'category': 'smartwatches',
        'name': 'Samsung Galaxy Watch',
        'description': 'Samsung smartwatch line for fitness, notifications, and Android pairing.',
        'price': '299.00',
        'stock': 15,
        'image_page': 'Samsung Galaxy Watch',
    },
    {
        'category': 'smartwatches',
        'name': 'Pebble Watch',
        'description': 'Early smartwatch known for its e-paper display and long battery life.',
        'price': '99.00',
        'stock': 11,
        'image_page': 'Pebble (watch)',
    },
    {
        'category': 'smartwatches',
        'name': 'Garmin Forerunner',
        'description': 'Garmin GPS running watch line for sports and fitness tracking.',
        'price': '249.00',
        'stock': 12,
        'image_page': 'Garmin Forerunner',
    },
    {
        'category': 'smartwatches',
        'name': 'Moto 360',
        'description': 'Motorola round-display smartwatch powered by Wear OS.',
        'price': '199.00',
        'stock': 9,
        'image_page': 'Moto 360',
    },
    {
        'category': 'smartwatches',
        'name': 'LG G Watch',
        'description': 'LG Android Wear smartwatch with a rectangular display.',
        'price': '149.00',
        'stock': 10,
        'image_page': 'LG G Watch',
    },
]


OLD_SEEDED_PRODUCT_NAMES = {
    'AeroBook 14 Laptop',
    'AeroBook Pro 15',
    'StudyMate 13',
    'CreatorPad 16',
    'GameForge 15',
    'OfficeBook 14',
    'UltraBook Air 13',
    'Nova X Phone',
    'PixelWave 7',
    'Iphone 13',
    'Galaxy Core S',
    'MiniPhone SE',
    'PowerMax 5G',
    'PhotoPro Mobile',
    'HomeBeat Speaker',
    'BassCube Mini',
    'PartyBoom 360',
    'DeskSound Bar',
    'OutdoorPod Speaker',
    'StudioShelf Pair',
    'SmartVoice Speaker',
    'QuietWave Headphones',
    'AirBuds Lite',
    'StudioPro Monitor',
    'GameChat Headset',
    'Travel ANC Headphones',
    'SportFit Earbuds',
    'KidsSafe Headphones',
    'GlowDesk Lamp',
    'SmartBulb Color',
    'Ambient Light Strip',
    'NightGlow Lamp',
    'Studio Ring Light',
    'Motion Hall Light',
    'FitTrack Watch',
    'PulsePro Watch',
    'ActiveBand 2',
    'StyleWatch Classic',
    'KidsTrack Watch',
    'Outdoor GPS Watch',
}


def fetch_wikipedia_image_url(page_title):
    url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + quote(page_title, safe='')
    request = Request(url, headers={'User-Agent': USER_AGENT})

    for attempt in range(1, 5):
        try:
            with urlopen(request, timeout=30) as response:
                data = json.loads(response.read().decode('utf-8'))
            break
        except HTTPError as exc:
            if exc.code == 429 and attempt < 4:
                time.sleep(attempt * 15)
                continue
            raise CommandError(f'Could not read Wikipedia page "{page_title}": {exc}') from exc
        except (URLError, TimeoutError) as exc:
            if attempt < 4:
                time.sleep(attempt * 2)
                continue
            raise CommandError(f'Could not read Wikipedia page "{page_title}": {exc}') from exc

    image_url = (
        (data.get('thumbnail') or {}).get('source')
        or (data.get('originalimage') or {}).get('source')
    )
    if not image_url:
        raise CommandError(f'Wikipedia page "{page_title}" does not provide a product image.')

    return image_url


def download_photo(image_url):
    request = Request(image_url, headers={'User-Agent': IMAGE_USER_AGENT, 'Accept': 'image/*,*/*'})

    for attempt in range(1, 5):
        try:
            with urlopen(request, timeout=45) as response:
                data = response.read()
            break
        except HTTPError as exc:
            if exc.code == 429 and attempt < 4:
                time.sleep(attempt * 20)
                continue
            raise CommandError(f'Could not download image from {image_url}: {exc}') from exc
        except (URLError, TimeoutError) as exc:
            if attempt < 4:
                time.sleep(attempt * 2)
                continue
            raise CommandError(f'Could not download image from {image_url}: {exc}') from exc

    try:
        with Image.open(BytesIO(data)) as image:
            canvas = prepare_product_photo(image)

            buffer = BytesIO()
            canvas.save(buffer, format='JPEG', quality=88, optimize=True)
            buffer.seek(0)
            return buffer
    except UnidentifiedImageError as exc:
        raise CommandError(f'Downloaded file is not a valid image: {image_url}') from exc


def prepare_product_photo(image):
    image = image.convert('RGB')
    background = Image.new('RGB', image.size, image.getpixel((0, 0)))
    diff = ImageChops.difference(image, background).convert('L')
    diff = diff.point(lambda value: 255 if value > 18 else 0)
    bbox = diff.getbbox()

    if bbox:
        image = image.crop(bbox)

    return ImageOps.fit(
        image,
        (900, 700),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )


def delete_existing_product_images(product):
    for product_image in product.images.all():
        product_image.image.delete(save=False)
        product_image.delete()


def delete_old_seed_products():
    current_names = {product['name'] for product in PRODUCTS}
    old_products = Product.objects.filter(name__in=OLD_SEEDED_PRODUCT_NAMES).exclude(name__in=current_names)
    deleted_count = old_products.count()
    old_products.delete()
    return deleted_count


def clean_unused_product_files():
    products_dir = Path(settings.MEDIA_ROOT) / 'products'
    if not products_dir.exists():
        return 0

    referenced_files = set(
        ProductImage.objects.exclude(image='')
        .values_list('image', flat=True)
    )
    deleted_count = 0

    for file_path in products_dir.iterdir():
        if not file_path.is_file():
            continue

        relative_name = f'products/{file_path.name}'
        if relative_name not in referenced_files:
            file_path.unlink()
            deleted_count += 1

    return deleted_count


class Command(BaseCommand):
    help = 'Seed the database with 40 real electronics products and matching product photos.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--replace-images',
            action='store_true',
            help='Replace existing seeded product images with freshly downloaded photos.',
        )
        parser.add_argument(
            '--clean-empty-categories',
            action='store_true',
            help='Delete empty categories that are not part of this seed set.',
        )

    def handle(self, *args, **options):
        categories = {}

        for name, description in CATEGORIES.items():
            category, _ = Category.objects.update_or_create(
                name=name,
                defaults={'description': description},
            )
            categories[name] = category

        deleted_old_products = delete_old_seed_products()
        created_count = 0
        updated_count = 0
        image_count = 0
        coupon_count = 0

        for index, product_data in enumerate(PRODUCTS):
            product, created = Product.objects.update_or_create(
                name=product_data['name'],
                defaults={
                    'category': categories[product_data['category']],
                    'description': product_data['description'],
                    'price': Decimal(product_data['price']),
                    'stock': product_data['stock'],
                    'is_active': True,
                    'is_featured': index % 5 == 0,
                },
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

            if options['replace_images'] or not product.images.exists():
                image_url = fetch_wikipedia_image_url(product_data['image_page'])
                image_buffer = download_photo(image_url)
                delete_existing_product_images(product)

                filename = f'{slugify(product_data["name"])}.jpg'
                product_image = ProductImage(
                    product=product,
                    alt_text=product_data['name'],
                    is_primary=True,
                )
                product_image.image.save(filename, ContentFile(image_buffer.read()), save=True)
                image_count += 1
                time.sleep(5)
            elif not product.images.filter(is_primary=True).exists():
                primary_image = product.images.first()
                primary_image.is_primary = True
                primary_image.save(update_fields=['is_primary'])

        for coupon_data in COUPONS:
            Coupon.objects.update_or_create(
                code=coupon_data['code'],
                defaults={
                    'discount_type': coupon_data['discount_type'],
                    'value': Decimal(coupon_data['value']),
                    'is_active': coupon_data['is_active'],
                },
            )
            coupon_count += 1

        deleted_categories = 0
        if options['clean_empty_categories']:
            deleted_categories, _ = (
                Category.objects.exclude(name__in=CATEGORIES.keys())
                .filter(products__isnull=True)
                .delete()
            )

        deleted_files = clean_unused_product_files()

        self.stdout.write(self.style.SUCCESS('Seed completed.'))
        self.stdout.write(f'Categories: {len(categories)}')
        self.stdout.write(f'Products created: {created_count}')
        self.stdout.write(f'Products updated: {updated_count}')
        self.stdout.write(f'Images created: {image_count}')
        self.stdout.write(f'Coupons ready: {coupon_count}')
        self.stdout.write(f'Old fictional seed products deleted: {deleted_old_products}')
        self.stdout.write(f'Empty extra categories deleted: {deleted_categories}')
        self.stdout.write(f'Unused product image files deleted: {deleted_files}')
