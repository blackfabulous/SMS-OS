# Task 8 - API Routes for CMS, School Shop, and SEO

## Summary
Created 4 API route files for the ZimSchool Pro project covering CMS, School Shop, and SEO functionality.

## Files Created

### 1. `/src/app/api/website-cms/route.ts` (156 lines)
- **GET**: Returns CMS data with `?section=pages|news|gallery|all` filter. Includes branding from School model.
- **POST**: Create page (`createPage`), news article (`createNews`), gallery image (`uploadGalleryImage`)
- **PUT**: Update page (`updatePage`), news (`updateNews`), branding (`updateBranding`)
- **DELETE**: Delete page (`deletePage`), news (`deleteNews`), gallery image (`deleteGalleryImage`)

### 2. `/src/app/api/school-shop/route.ts` (156 lines)
- **GET**: Returns shop data with `?section=products|orders|stats|all` filter, supports `?category=`, `?search=`, `?isActive=` filters
- **POST**: Create product (`createProduct`), create order (`createOrder` with auto-generated order number)
- **PUT**: Update product (`updateProduct`), update order status (`updateOrderStatus` with validation)
- **DELETE**: Delete product (`deleteProduct`), delete order (`deleteOrder`)

### 3. `/src/app/api/seo/route.ts` (114 lines)
- **GET**: Returns all SEO settings + sitemap data. Supports `?pageSlug=` for specific page SEO.
- **POST**: Create SEO setting with pageSlug validation and 409 conflict on duplicates
- **PUT**: Update SEO setting by id
- **DELETE**: Delete SEO setting by id

### 4. `/src/app/api/seo/sitemap/route.ts` (71 lines)
- **GET**: Returns XML sitemap with `Content-Type: application/xml`
- Includes homepage, published pages, news articles, and events
- Each URL has `loc`, `lastmod`, `changefreq`, `priority`

## Additional Changes
- Fixed `/src/lib/db.ts` to invalidate cached PrismaClient when models are missing (handles schema migrations in dev)

## Testing Results
- All 4 API routes tested and returning correct responses
- CMS API: `GET /api/website-cms?section=pages` → `{"success":true,"data":{"pages":[]}}`
- Shop API: `GET /api/school-shop?section=products` → `{"success":true,"data":{"products":[]}}`
- SEO API: `GET /api/seo` → returns seoSettings and sitemapData with events
- Sitemap API: `GET /api/seo/sitemap` → returns valid XML with school events
- Lint check: 0 errors
