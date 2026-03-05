# Instagram Platform Integration — Research & E-Commerce SaaS Plan

> Comprehensive research on Meta's Instagram Platform APIs and a strategic plan for integrating Instagram capabilities into the Marketing-OS SaaS platform for e-commerce businesses.

---

## Table of Contents

1. [Instagram Platform Overview](#1-instagram-platform-overview)
2. [Available APIs & Capabilities](#2-available-apis--capabilities)
3. [Webhooks & Real-Time Events](#3-webhooks--real-time-events)
4. [Permissions & App Review](#4-permissions--app-review)
5. [E-Commerce SaaS Integration Strategy](#5-e-commerce-saas-integration-strategy)
6. [Implementation Architecture](#6-implementation-architecture)
7. [Feature Roadmap](#7-feature-roadmap)

---

## 1. Instagram Platform Overview

The Instagram Platform from Meta provides **two main API tracks**, a **messaging API**, and several **sharing/embedding** tools:

| API Track | Login Method | Requires FB Page? | Key Difference |
|---|---|---|---|
| **Instagram API with Business Login** | Instagram OAuth | ❌ No | Simpler setup, no FB Page needed |
| **Instagram API with Facebook Login** | Facebook OAuth | ✅ Yes | Hashtag search, business discovery |
| **Instagram Messaging (via Messenger)** | Either | Depends on login | Unified inbox with FB Messenger |

> [!IMPORTANT]
> For a SaaS platform serving multiple e-commerce businesses, the **Instagram API with Business Login** is the recommended primary track — it removes the Facebook Page dependency, making client onboarding easier.

---

## 2. Available APIs & Capabilities

### 2.1 Content Publishing API

Allows publishing single images, videos, reels, stories, and **carousels** (up to 10 items) to Instagram.

**How It Works (Container-based flow):**

```
Step 1: POST /<IG_ID>/media        → Create media container (upload image/video URL)
Step 2: POST /<IG_ID>/media_publish → Publish the container
Step 3: GET /<IG_CONTAINER_ID>?fields=status_code → Check status
```

**Carousel Publishing:**
```
Step 1: Create individual containers for each image/video (up to 10)
Step 2: POST /<IG_ID>/media with media_type=CAROUSEL, children=<container_ids>
Step 3: POST /<IG_ID>/media_publish with the carousel container
```

| Feature | Supported | Notes |
|---|---|---|
| Single image posts | ✅ | `image_url` must be publicly accessible |
| Single video posts | ✅ | `media_type=VIDEO` |
| Reels | ✅ | `media_type=REELS` |
| Stories | ✅ | Business accounts only (not Creator) |
| Carousels | ✅ | Up to 10 items |
| Alt text | ✅ | `alt_text` field (images only) |
| Captions | ✅ | Including hashtags and mentions |
| Resumable upload | ✅ | For large videos (FB Login only) |

**Limits:** 50 published posts per 24 hours. Media must be hosted publicly for Meta to cURL.

**Permissions Required:**
- `instagram_business_basic`
- `instagram_business_content_publish`

---

### 2.2 Comment Moderation API

Full CRUD operations on comments for published media.

| Endpoint | Action |
|---|---|
| `GET /<IG_MEDIA_ID>/comments` | Get comments on media |
| `GET /<IG_COMMENT_ID>/replies` | Get replies on a comment |
| `POST /<IG_COMMENT_ID>/replies` | Reply to a comment |
| `POST /<IG_COMMENT_ID>` | Hide/unhide a comment |
| `POST /<IG_MEDIA_ID>` | Disable/enable comments on media |
| `DELETE /<IG_COMMENT_ID>` | Delete a comment |

**Permissions Required:**
- `instagram_business_basic`
- `instagram_business_manage_comments`

> [!TIP]
> Meta **strongly recommends using webhooks** over polling for comments to avoid rate limiting.

---

### 2.3 Instagram Messaging API (via Messenger Platform)

Allows sending & receiving DMs with Instagram users who message the business account.

**Key Capabilities:**
- Receive messages from customers
- Reply with text, media, stories
- **Private replies** to public comments
- **Private replies** to users who post on business's IG

**24-Hour Messaging Window:** Business must respond within 24 hours. After that, a human agent tag is needed.

**Automated Experiences:**
- Single app with custom inbox
- **Handover Protocol** — pass conversation between automated bot → human agent

**Permissions Required:**
- `instagram_business_basic`
- `instagram_business_manage_messages`

---

### 2.4 Insights API

Get analytics for both **individual media** and **account-level** metrics.

| Level | Endpoint | Metrics |
|---|---|---|
| **Media** | `GET /<MEDIA_ID>/insights` | Impressions, reach, engagement, saves, video views |
| **Account** | `GET /<ACCOUNT_ID>/insights` | Follower demographics, reach, impressions, profile views |

**Limitations:**
- Account insights require **100+ followers**
- Data retained for **90 days**
- Ads-driven data is NOT included
- One user at a time

**Permissions Required:**
- `instagram_business_basic`
- `instagram_business_manage_insights`

---

### 2.5 Hashtag Search API (Facebook Login Only)

Discover content by hashtag — useful for UGC (User Generated Content) campaigns and market research.

| Endpoint | Purpose |
|---|---|
| `GET /ig_hashtag_search` | Get hashtag node ID |
| `GET /{ig-hashtag-id}/top_media` | Most popular media with hashtag |
| `GET /{ig-hashtag-id}/recent_media` | Most recent media with hashtag |

**Limits:** Max **30 unique hashtags** per 7-day rolling window per account.

**Requires:** `Instagram Public Content Access` feature + `instagram_basic` permission.

> [!NOTE]
> This is **only available via Facebook Login** track, not Business Login. Useful for competitor research and UGC discovery.

---

### 2.6 Business Discovery API (Facebook Login Only)

Get public data about **other** Instagram Business/Creator accounts — without needing their permission.

**Use cases:** Competitor analysis, influencer discovery.

---

### 2.7 Mentions API

Detect when the business account is **@mentioned** in other users' posts/comments.

**Permissions Required:**
- `instagram_business_basic` (Business Login)
- `instagram_basic` + `instagram_manage_comments` (Facebook Login)

---

### 2.8 oEmbed API

Embed Instagram posts (photos and videos) directly in websites.

**Use cases:**
- Embed posts in blogs/product pages
- Render posts in CMS
- Create social proof galleries
- Display user-generated content

**Rate Limits:** Subject to standard Graph API rate limiting.

---

### 2.9 Sharing to Stories & Feed

Allow app users to share content directly to Instagram Stories or Feed from your app.

| Feature | Platform | Method |
|---|---|---|
| Share to Stories | Android/iOS | Deep link / Intent |
| Share to Feed | Android/iOS | Deep link / Intent |

> [!NOTE]
> These are **mobile-only** deep linking features, not server-side APIs. Relevant if/when building a companion mobile app.

---

## 3. Webhooks & Real-Time Events

Instagram webhooks push events to your server in real-time. The following fields are subscribable:

| Webhook Field | Description | Login Track |
|---|---|---|
| `comments` | New comments on media | Both |
| `live_comments` | Comments on live videos | Both |
| `mentions` | @mentions (included in comments webhook) | FB Login only |
| `messages` | New DMs received | Both |
| `message_echoes` | Echo of messages sent by business | Both |
| `message_reactions` | Reactions on messages | Both |
| `messaging_handover` | Handover protocol events | Both |
| `messaging_optins` | User opt-in events | Business Login only |
| `messaging_postbacks` | Button/quick reply postbacks | Both |
| `messaging_referral` | Referral tracking | Both |
| `messaging_seen` | Message read receipts | Both |
| `story_insights` | Story analytics | FB Login only |

**Setup:** Same webhook architecture as WhatsApp — verification challenge + HMAC signature validation.

---

## 4. Permissions & App Review

### Required Permissions by Feature

| Feature | Permissions (Business Login) | Permissions (FB Login) |
|---|---|---|
| Basic access | `instagram_business_basic` | `instagram_basic`, `pages_read_engagement` |
| Content publish | `instagram_business_content_publish` | `instagram_content_publish` |
| Comment moderation | `instagram_business_manage_comments` | `instagram_manage_comments` |
| Messaging | `instagram_business_manage_messages` | `instagram_manage_messages` |
| Insights | `instagram_business_manage_insights` | `instagram_manage_insights` |
| Hashtag search | N/A | `instagram_basic` + Public Content Access feature |

### Access Levels

| Level | Who Can Use |
|---|---|
| **Standard Access** | Only accounts you own/manage and added to App Dashboard |
| **Advanced Access** | Any Instagram professional account (requires App Review) |

> [!CAUTION]
> For a SaaS product, you **MUST** obtain **Advanced Access** through Meta App Review. Standard Access only allows your own accounts. App Review can take 2-4 weeks.

---

## 5. E-Commerce SaaS Integration Strategy

Here's how each Instagram capability maps to **e-commerce business value** within Marketing-OS:

### 🛍️ Product Showcase & Catalog Sync

| Capability | E-Commerce Use Case | Business Value |
|---|---|---|
| **Content Publishing** | Auto-publish product images/videos to IG | Zero-effort social media presence |
| **Carousel Publishing** | Showcase product collections (up to 10 items) | Higher engagement than single posts |
| **Reels Publishing** | Auto-create short product videos | Reach algorithm-boosted content |
| **Story Publishing** | Flash sales, limited offers, new arrivals | Urgency-driven sales |

**Implementation:** When a merchant adds/updates products in Marketing-OS, automatically generate and schedule Instagram posts with product images, descriptions, pricing, and CTAs.

---

### 💬 Social Commerce & Customer Engagement

| Capability | E-Commerce Use Case | Business Value |
|---|---|---|
| **Instagram DM Messaging** | Customer inquiries about products | Direct sales conversion |
| **Comment Moderation** | Reply to purchase questions on posts | Public social proof |
| **Private Replies** | Convert public commenters to private sale conversations | Lead capture |
| **Automated Messaging** | Order status updates, product recommendations | 24/7 customer service |

**Implementation:** Integrate Instagram DMs into the existing Marketing-OS unified inbox (alongside WhatsApp). Auto-respond with product catalog, order tracking, etc.

---

### 📊 Analytics & Performance Tracking

| Capability | E-Commerce Use Case | Business Value |
|---|---|---|
| **Media Insights** | Track engagement per product post | Identify best-selling showcases |
| **Account Insights** | Follower demographics, reach trends | Audience understanding |
| **Hashtag Search** | Discover trending topics in niche | Content strategy optimization |
| **Business Discovery** | Competitor analysis | Market positioning |

**Implementation:** Instagram analytics dashboard within Marketing-OS showing post performance, engagement rates, best posting times, and ROI per product showcase.

---

### 🔄 User-Generated Content (UGC)

| Capability | E-Commerce Use Case | Business Value |
|---|---|---|
| **Mentions Detection** | Find customers posting about products | Social proof collection |
| **Hashtag Search** | Discover branded hashtag content | Campaign measurement |
| **oEmbed** | Embed customer reviews/unboxings on product pages | Trust & conversion boost |

**Implementation:** Auto-detect @mentions and branded hashtags → curate UGC → embed on e-commerce product pages as social proof.

---

### 📢 Marketing Automation Flows

| Trigger | Action | Channel |
|---|---|---|
| New product added | Auto-publish product post to IG | Content Publishing |
| Customer comments "price?" | Auto-reply with pricing + DM link | Comment Moderation + Messaging |
| Order completed | Send review request via IG DM | Messaging |
| @mention detected | Thank customer + repost | Mentions + Publishing |
| Flash sale scheduled | Auto-post Stories + send DM blast | Stories + Messaging |
| Cart abandonment | Send reminder via IG DM | Messaging |

---

## 6. Implementation Architecture

### How it fits into existing Marketing-OS

The integration follows the **same architectural pattern as the existing WhatsApp module**:

```
marketing-os-server/src/modules/instagram/
├── controllers/
│   ├── WebhookController.ts        # Handle IG webhooks
│   ├── ContentPublishController.ts # Publishing endpoints
│   ├── CommentController.ts        # Comment moderation
│   ├── MessagingController.ts      # DM management
│   ├── InsightsController.ts       # Analytics endpoints
│   └── AccountController.ts        # IG account connection
├── services/
│   ├── InstagramAuthService.ts     # OAuth / token management
│   ├── ContentPublishService.ts    # Container → publish flow
│   ├── CommentService.ts           # Comment CRUD
│   ├── InstagramMessagingService.ts# DM send/receive
│   ├── InsightsService.ts          # Fetch & cache analytics
│   └── WebhookService.ts          # Process webhook events
├── models/
│   ├── InstagramAccount.ts         # Connected IG accounts
│   ├── InstagramMedia.ts           # Published media tracking
│   ├── InstagramConversation.ts    # DM conversations
│   └── InstagramComment.ts         # Comment threads
├── repositories/
│   ├── InstagramAccountRepo.ts
│   ├── InstagramMediaRepo.ts
│   └── InstagramConversationRepo.ts
├── interfaces/
│   └── IInstagramService.ts
├── providers/
│   └── MetaGraphApiProvider.ts     # Shared with WhatsApp
├── instagram.routes.ts
└── container.ts                    # DI container
```

### Frontend (Marketing-OS UI)

```
marketing-os-ui/src/features/instagram/
├── pages/
│   ├── InstagramDashboard.tsx       # Overview with analytics
│   ├── ContentPublisher.tsx         # Create/schedule posts
│   ├── CommentManager.tsx           # Moderate comments
│   ├── InstagramInbox.tsx           # DM inbox (unified)
│   └── InstagramInsights.tsx        # Analytics dashboard
├── components/
│   ├── PostComposer.tsx             # Rich post editor
│   ├── CarouselBuilder.tsx          # Multi-image carousel UI
│   ├── MediaPreview.tsx             # Post preview
│   ├── CommentThread.tsx            # Comment display
│   ├── InstagramAccountCard.tsx     # Account connection UI
│   └── InsightCharts.tsx            # Analytics visualizations
└── hooks/
    ├── useInstagramAuth.ts
    ├── useContentPublish.ts
    └── useInsights.ts
```

### Key Technical Considerations

| Consideration | Detail |
|---|---|
| **Token Management** | Instagram User tokens expire; implement refresh flow |
| **Media Hosting** | Products images must be publicly accessible for Meta to cURL |
| **Rate Limiting** | 200 calls/user/hour for Graph API; implement queuing |
| **Webhook Dedup** | Same webhook may fire multiple times; use event IDs |
| **Multi-tenant** | Each SaaS client connects their own IG account |
| **Shared Meta App** | Reuse existing Meta App from WhatsApp integration |

---

## 7. Feature Roadmap

### Phase 1 — Foundation (Weeks 1-3)
- [ ] Instagram account connection (OAuth flow via Business Login)
- [ ] Webhook setup (comments, messages, mentions)
- [ ] Basic content publishing (single image posts)
- [ ] Instagram account settings in Marketing-OS

### Phase 2 — Content Publishing (Weeks 3-5)
- [ ] Carousel publishing from product catalog
- [ ] Reels publishing
- [ ] Story publishing
- [ ] Post scheduling & queue
- [ ] Product → Instagram post automation

### Phase 3 — Social Commerce (Weeks 5-7)
- [ ] Instagram DM inbox (unified with WhatsApp)
- [ ] Comment moderation dashboard
- [ ] Private replies from comments
- [ ] Automated responses (product info, pricing)
- [ ] Cart/order links in DMs

### Phase 4 — Analytics & UGC (Weeks 7-9)
- [ ] Media insights dashboard
- [ ] Account insights & demographics
- [ ] Hashtag tracking (requires FB Login track)
- [ ] @mention detection & alerts
- [ ] UGC curation & embedding (oEmbed)

### Phase 5 — Advanced Automation (Weeks 9-12)
- [ ] Comment-triggered automation flows
- [ ] Order status notifications via DM
- [ ] Review request flows
- [ ] Competitor analysis (Business Discovery)
- [ ] AI-powered caption & hashtag generation

---

## API Quick Reference

### Host URLs
| API | Host |
|---|---|
| Graph API | `graph.instagram.com` or `graph.facebook.com` |
| Resumable Upload | `rupload.facebook.com` |

### Key Endpoints Summary

| Operation | Method | Endpoint |
|---|---|---|
| Create media container | `POST` | `/<IG_ID>/media` |
| Publish media | `POST` | `/<IG_ID>/media_publish` |
| Check container status | `GET` | `/<CONTAINER_ID>?fields=status_code` |
| Check publish limits | `GET` | `/<IG_ID>/content_publishing_limit` |
| Get comments | `GET` | `/<MEDIA_ID>/comments` |
| Reply to comment | `POST` | `/<COMMENT_ID>/replies` |
| Hide/unhide comment | `POST` | `/<COMMENT_ID>` |
| Delete comment | `DELETE` | `/<COMMENT_ID>` |
| Get media insights | `GET` | `/<MEDIA_ID>/insights` |
| Get account insights | `GET` | `/<ACCOUNT_ID>/insights` |
| Search hashtag | `GET` | `/ig_hashtag_search` |
| Get hashtag media | `GET` | `/{hashtag-id}/top_media` |
| Send message | `POST` | `/me/messages` (Messenger API) |

---

> [!TIP]
> **Synergy with existing WhatsApp module:** The Meta Graph API provider, webhook infrastructure, and multi-tenant architecture can be **shared** between WhatsApp and Instagram modules. The Instagram integration can leverage the existing `MetaController`, `EmbeddedSignupController`, and token management from the WhatsApp module.
