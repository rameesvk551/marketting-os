# Meta Catalog API — Research & E-Commerce SaaS Integration

> Deep research on Meta's Catalog API — how to sync product catalogs across Instagram Shopping, WhatsApp Commerce, Facebook Marketplace, and Advantage+ Catalog Ads.

---

## Table of Contents

1. [Catalog Overview](#1-catalog-overview)
2. [Catalog Use Cases for E-Commerce](#2-catalog-use-cases-for-e-commerce)
3. [Product Data Model](#3-product-data-model)
4. [Catalog Management APIs](#4-catalog-management-apis)
5. [Product Sets & Collections](#5-product-sets--collections)
6. [Integration Strategy for Marketing-OS](#6-integration-strategy-for-marketing-os)
7. [API Quick Reference](#7-api-quick-reference)

---

## 1. Catalog Overview

A **Meta Catalog** is a structured container of product information — the **single source of truth** that powers:

| Surface | What it enables |
|---|---|
| **Instagram Shopping** | Product tags on posts, Instagram Shops |
| **WhatsApp Commerce** | Product messages, catalog browsing in WhatsApp |
| **Facebook Marketplace** | Listing products for sale |
| **Advantage+ Catalog Ads** | Dynamic personalized product ads |
| **Collection Ads** | Immersive product discovery ads |

> [!IMPORTANT]
> **One catalog powers ALL Meta commerce surfaces.** When a merchant syncs products to a Meta catalog from Marketing-OS, those products instantly become available for Instagram Shopping, WhatsApp catalogs, and dynamic ads — this is the killer feature for your SaaS!

### How Catalogs Are Managed

Catalogs live within **Meta Business Manager**. Products can be managed through:

1. **Product Feed files** — Bulk upload via CSV, TSV, RSS XML, ATOM XML, or Google Sheets
2. **Feed API** — Programmatic scheduled feed uploads
3. **Batch API** — Real-time CRUD operations on individual products
4. **Commerce Manager** — Meta's web UI

### Permissions Required

| Permission | Purpose |
|---|---|
| `catalog_management` | Create, read, update, delete catalogs the user is admin of |
| `business_management` | Required for catalog updates |

### Access Level

| Level | Scope |
|---|---|
| **Standard Access** | Only catalogs owned by app admins/developers |
| **Advanced Access** | Any business's catalogs (requires App Review) |

---

## 2. Catalog Use Cases for E-Commerce

### 🛒 Instagram Shopping (Product Tags)

When products are in a Meta Catalog connected to an Instagram professional account, merchants can:
- **Tag products** directly in Instagram posts, stories, and reels
- Create an **Instagram Shop** — a mini storefront within Instagram
- Use **localized catalogs** for multi-language/multi-country shopping

### 📱 WhatsApp Commerce

Catalogs connected to WhatsApp Business accounts enable:
- **Product catalog messages** — Send product lists in WhatsApp chats
- **Single product messages** — Highlight individual products
- **Multi-product messages** — Showcase curated collections
- Your existing WhatsApp module already uses this!

### 📢 Advantage+ Catalog Ads (Dynamic Ads)

- Automatically show **personalized product ads** based on user behavior
- Retarget users who viewed products on merchant's website
- Cross-sell related products

### 🏪 Facebook Marketplace

- List products for local discovery and purchase

---

## 3. Product Data Model

### Required Fields (for Ads AND Commerce)

| Field | Type | Max Length | Description | Example |
|---|---|---|---|---|
| `id` | string | 100 | Unique product ID (use SKU) | `PROD-12345` |
| `title` | string | 200 (65 recommended) | Product name | `Blue Cotton T-Shirt` |
| `description` | string | 9999 | Plain text description | `Comfortable organic cotton...` |
| `availability` | string | — | `in stock` or `out of stock` | `in stock` |
| `condition` | string | — | `new`, `refurbished`, `used` | `new` |
| `price` | string | — | Number + ISO 4217 currency | `9.99 USD` |
| `link` | string | — | Product page URL | `https://store.com/shirt` |
| `image_link` | string | — | Primary image URL (500x500+ px) | `https://cdn.store.com/shirt.jpg` |
| `brand` | string | 100 | Brand name | `Jasper's Market` |

### Key Optional Fields

| Field | Description | E-Commerce Use |
|---|---|---|
| `sale_price` | Discounted price | Flash sales, promotions |
| `sale_price_effective_date` | Sale start/end timestamps | Timed promotions |
| `item_group_id` | Groups variants (size/color) | Product variants |
| `status` | `active` or `archived` | Enable/disable products |
| `additional_image_link` | Up to 20 extra images | Product galleries |
| `google_product_category` | Google category taxonomy | Categorization |
| `quantity_to_sell_on_facebook` | Inventory count | Stock management |
| `rich_text_description` | HTML-formatted description | Rich product pages |
| `gtin` / `mpn` | Global Trade Item Number | Product identification |
| `color` | Color variant attribute | Filtering |
| `size` | Size variant attribute | Filtering |
| `gender` | Target gender | Filtering |
| `pattern` | Pattern variant attribute | Filtering |
| `additional_variant_attribute` | Custom variants | Custom filtering |

### Product Variants

Variants are created by assigning the **same `item_group_id`** to products that differ by size/color/pattern:

```
id,title,color,size,price,item_group_id
SHIRT-RED-S,Cool Shirt,Red,S,9.99 USD,SHIRT-001
SHIRT-RED-M,Cool Shirt,Red,M,9.99 USD,SHIRT-001
SHIRT-BLUE-S,Cool Shirt,Blue,S,9.99 USD,SHIRT-001
SHIRT-BLUE-M,Cool Shirt,Blue,M,9.99 USD,SHIRT-001
```

> [!NOTE]
> All variants sharing an `item_group_id` must populate every variant field (size, color, gender, pattern) — even out-of-stock ones.

### Supported Feed Formats

| Format | Notes |
|---|---|
| CSV | Comma-separated |
| TSV | Tab-separated |
| RSS XML | Standard RSS |
| ATOM XML | Standard ATOM |
| Google Sheets | Auto-sync from sheets |

---

## 4. Catalog Management APIs

### 4.1 Feed API — Bulk Uploads

**Best for:** Initial catalog setup, daily full sync, large inventory updates.

**Create a feed:**
```bash
POST /{CATALOG_ID}/product_feeds
```

**Schedule types:**
| Type | Use Case | Frequency |
|---|---|---|
| **Replace Schedule** | Full catalog refresh (deletes missing items) | Daily (off-hours) |
| **Update Schedule** | Incremental changes to existing items | Hourly or more |

**Best Practice:** Set up a Replace Schedule once daily + Update Schedule hourly for incremental updates.

### 4.2 Batch API — Real-Time CRUD

**Best for:** Individual product updates, near real-time inventory changes, fast-selling items.

**Endpoints:**

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/{catalog_id}/items_batch` | Create/Update/Delete products in bulk |
| `POST` | `/{catalog_id}/batch` | Legacy endpoint (commerce only) |
| `GET` | `/{catalog_id}/check_batch_request_status` | Check batch request status |

**Batch API Example — Create products:**
```json
POST /{catalog_id}/items_batch
{
  "item_type": "PRODUCT_ITEM",
  "requests": [
    {
      "method": "CREATE",
      "data": {
        "id": "PROD-001",
        "title": "Premium Perfume",
        "description": "Luxury fragrance...",
        "availability": "in stock",
        "condition": "new",
        "price": "49.99 USD",
        "link": "https://store.com/perfume",
        "image_link": "https://cdn.store.com/perfume.jpg",
        "brand": "LuxuryBrand"
      }
    },
    {
      "method": "UPDATE",
      "data": {
        "id": "PROD-002",
        "availability": "out of stock"
      }
    },
    {
      "method": "DELETE",
      "data": {
        "id": "PROD-003"
      }
    }
  ]
}
```

**Rate Limits:**
- Up to **5,000 items** per batch
- Up to **100 calls per hour**

### 4.3 Diagnostics API

Check for upload errors programmatically:
```bash
GET /{PRODUCT_FEED_ID}/uploads
GET /{UPLOAD_ID}/errors
```

---

## 5. Product Sets & Collections

Product Sets group products for specific commerce experiences (e.g., "Best Sellers", "Summer Collection").

### Create a Product Set

```bash
POST /{CATALOG_ID}/product_sets
{
  "name": "Best Sellers",
  "filter": {
    "retailer_id": {
      "is_any": ["pid1", "pid2", "pid3"]
    }
  },
  "metadata": {
    "cover_image_url": "https://cdn.store.com/collection.jpg",
    "external_url": "https://store.com/best-sellers",
    "description": "Our best selling products"
  },
  "publish_to_shops": [
    {"shop_id": "shop_id1"}
  ]
}
```

### Publish to Shops

Product Sets can be published to Instagram Shops and Facebook Shops by providing `shop_id`s. Passing an empty `publish_to_shops` array unpublishes from all shops.

---

## 6. Integration Strategy for Marketing-OS

### The Big Picture: Unified Product Sync

```
┌─────────────────────────────────────────────────────────────┐
│                    Marketing-OS SaaS                        │
│                                                             │
│   ┌──────────┐     ┌──────────────────┐                     │
│   │ Products │───▶ │  Meta Catalog    │                     │
│   │ Module   │     │  Sync Service    │                     │
│   └──────────┘     └───────┬──────────┘                     │
│                            │                                │
│              ┌─────────────┼──────────────┐                 │
│              ▼             ▼              ▼                 │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│   │  Instagram   │ │   WhatsApp   │ │   Facebook   │       │
│   │  Shopping    │ │  Commerce    │ │   Ads/Shop   │       │
│   │  (Tags +     │ │  (Catalog    │ │  (Dynamic    │       │
│   │   Shops)     │ │   Messages)  │ │   Ads)       │       │
│   └──────────────┘ └──────────────┘ └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### How It Works for Your SaaS Clients

1. **Merchant adds products** in Marketing-OS (already built in `products` module)
2. **Auto-sync to Meta Catalog** via Batch API in real-time
3. Products automatically become available on:
   - **Instagram Shopping** → tag products in posts
   - **WhatsApp Commerce** → send catalog messages
   - **Facebook Dynamic Ads** → retargeting ads
4. **Inventory updates** sync in real-time (availability, price, stock)
5. **Product Sets** auto-generate from Marketing-OS categories

### Mapping Marketing-OS Products → Meta Catalog Fields

| Marketing-OS Field | Meta Catalog Field | Notes |
|---|---|---|
| Product ID / SKU | `id` | Use existing SKU |
| Product Name | `title` | |
| Description | `description` | Strip HTML |
| Price | `price` | Format: `{amount} {currency}` |
| Stock Status | `availability` | Map to `in stock`/`out of stock` |
| Condition | `condition` | Default to `new` for e-com |
| Product URL | `link` | Generate from storefront URL |
| Primary Image | `image_link` | Must be publicly accessible |
| Additional Images | `additional_image_link` | Up to 20 |
| Category | `google_product_category` | Map to Google taxonomy |
| Brand | `brand` | |
| Sale Price | `sale_price` | |
| Variants (size/color) | `item_group_id` + variant fields | |

### Implementation Architecture

```
marketing-os-server/src/modules/catalog/
├── controllers/
│   ├── CatalogSyncController.ts      # Manual sync triggers
│   └── CatalogWebhookController.ts   # Catalog diagnostics webhooks
├── services/
│   ├── MetaCatalogService.ts         # Core catalog CRUD via Batch API
│   ├── CatalogSyncService.ts         # Product → Catalog field mapping
│   ├── CatalogFeedService.ts         # Feed generation & upload
│   ├── ProductSetService.ts          # Collections/product sets
│   └── CatalogDiagnosticsService.ts  # Error monitoring
├── models/
│   ├── CatalogMapping.ts             # Product ID ↔ Catalog ID mapping
│   └── SyncLog.ts                    # Sync history & errors
├── jobs/
│   ├── CatalogSyncJob.ts             # Scheduled full catalog sync
│   └── InventorySyncJob.ts           # Frequent inventory updates
└── catalog.routes.ts
```

### Sync Strategy

| Event | Sync Method | Latency |
|---|---|---|
| Product created/updated | Batch API (real-time) | ~1-5 seconds |
| Product deleted | Batch API (real-time) | ~1-5 seconds |
| Price/inventory change | Batch API (real-time) | ~1-5 seconds |
| Daily full reconciliation | Feed API (scheduled) | ~1 hour |
| Bulk import | Feed API (direct upload) | ~10-30 minutes |

### Feature Roadmap

| Phase | Features | Weeks |
|---|---|---|
| **Phase 1** | Catalog connection, product sync (Batch API), basic mapping | 1-2 |
| **Phase 2** | Product Sets from categories, Instagram product tagging | 2-3 |
| **Phase 3** | Scheduled feed sync, diagnostics dashboard, error handling | 3-4 |
| **Phase 4** | Dynamic Ads integration, localized catalogs | 4-6 |

---

## 7. API Quick Reference

### Catalog CRUD

| Operation | Method | Endpoint |
|---|---|---|
| Create catalog | `POST` | `/{business_id}/owned_product_catalogs` |
| Get catalog | `GET` | `/{catalog_id}` |
| Create feed | `POST` | `/{catalog_id}/product_feeds` |
| Upload products (batch) | `POST` | `/{catalog_id}/items_batch` |
| Check batch status | `GET` | `/{catalog_id}/check_batch_request_status` |
| Get products | `GET` | `/{catalog_id}/products` |
| Search products | `GET` | `/{catalog_id}/products?filter=...` |

### Product Sets

| Operation | Method | Endpoint |
|---|---|---|
| Create product set | `POST` | `/{catalog_id}/product_sets` |
| Update product set | `POST` | `/{product_set_id}` |
| Get product set | `GET` | `/{product_set_id}` |
| List product sets | `GET` | `/{catalog_id}/product_sets` |

### Feeds

| Operation | Method | Endpoint |
|---|---|---|
| Create feed | `POST` | `/{catalog_id}/product_feeds` |
| Get feed uploads | `GET` | `/{feed_id}/uploads` |
| Get upload errors | `GET` | `/{upload_id}/errors` |

### Diagnostics

| Operation | Method | Endpoint |
|---|---|---|
| Get catalog diagnostics | `GET` | `/{catalog_id}/diagnostics` |
| Get product item errors | `GET` | `/{product_item_id}/errors` |

---

> [!TIP]
> **Key synergy:** Since you already have a **Products module** and **WhatsApp Commerce integration** in Marketing-OS, the Catalog API becomes the bridge that unifies everything. When a merchant manages products in your SaaS, those products automatically appear on Instagram Shopping, WhatsApp catalogs, and Facebook ads — a single dashboard to rule all Meta commerce surfaces.
