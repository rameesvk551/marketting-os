import type { CatalogProduct } from './types';

export const SUGGESTED_KEYWORDS = ['link', 'shop', 'order', 'buy', 'price', 'discount', 'details'] as const;

export const INSTAGRAM_AUTOMATION_NAV = [
  { id: 'home', label: 'Home' },
  { id: 'automations', label: 'Automations' },
  { id: 'templates', label: 'Templates' },
  { id: 'content', label: 'My Content' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'support', label: 'Help & Support' },
] as const;

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: 'prod-1',
    name: 'Noir Scent Eau De Parfum',
    price: 1499,
    ctaLabel: 'Buy Now',
    image:
      'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=700&q=80',
    description: 'Best seller',
  },
  {
    id: 'prod-2',
    name: 'Silk Matte Lip Kit',
    price: 899,
    ctaLabel: 'Shop Now',
    image:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=80',
    description: 'Limited stock',
  },
  {
    id: 'prod-3',
    name: 'Daily Glow Serum',
    price: 1199,
    ctaLabel: 'Add to Cart',
    image:
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=80',
    description: 'Top rated',
  },
  {
    id: 'prod-4',
    name: 'Minimalist Tote Bag',
    price: 1899,
    ctaLabel: 'Buy Now',
    image:
      'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?auto=format&fit=crop&w=700&q=80',
    description: 'New drop',
  },
  {
    id: 'prod-5',
    name: 'Classic Oversized Tee',
    price: 999,
    ctaLabel: 'Shop Tee',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80',
    description: 'Premium cotton',
  },
  {
    id: 'prod-6',
    name: 'Cloud Runner Sneakers',
    price: 2999,
    ctaLabel: 'View Product',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80',
    description: 'Fast moving',
  },
];

export const SIMULATION_STEPS = [
  'User comments on post',
  'System detects keyword',
  'User receives DM message',
  'DM includes button or catalog',
] as const;

export const COMMENT_EXAMPLES = [
  { id: 'c-1', user: 'ananya.mehta', text: 'Can I get the link please?', time: '2m' },
  { id: 'c-2', user: 'rahul.shop', text: 'price details?', time: '4m' },
  { id: 'c-3', user: 'nina.creates', text: 'Looks great!', time: '8m' },
];
