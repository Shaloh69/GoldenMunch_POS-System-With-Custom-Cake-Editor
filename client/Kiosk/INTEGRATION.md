# Kiosk App - Server Integration Guide

## Overview

The Kiosk app has been fully integrated with the Node.js/Express backend server. All menu items, categories, and orders are now fetched from and synced with the server API.

## Architecture

### Frontend Stack
- **Framework**: Next.js 15 with React 18
- **UI Library**: HeroUI Components
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Context API

### Backend Integration
- **API Base URL**: Configurable via environment variables
- **Default**: `http://localhost:3001/api`
- **Endpoints**: RESTful API endpoints from the Express server

## Project Structure

```
client/Kiosk/
├── app/                      # Next.js pages
│   ├── page.tsx             # Home/Menu page (API connected)
│   ├── menu/page.tsx        # Menu browsing (API connected)
│   ├── cart/page.tsx        # Shopping cart & checkout (API connected)
│   ├── categories/page.tsx  # Category browser (API connected)
│   └── providers.tsx        # App-level providers (includes CartProvider)
├── config/
│   └── api.ts               # Axios configuration & interceptors
├── contexts/
│   └── CartContext.tsx      # Cart state management
├── services/
│   ├── menu.service.ts      # Menu API calls
│   └── order.service.ts     # Order API calls
├── types/
│   ├── index.ts             # Main type exports
│   └── api.ts               # API types matching server schema
├── .env.local               # Environment configuration
└── package.json
```

## Key Features Implemented

### 1. API Configuration
- **File**: `config/api.ts`
- Axios instance with base URL configuration
- Request/response interceptors for error handling
- Configurable timeout settings

### 2. Type Safety
- **File**: `types/api.ts`
- Complete TypeScript types matching server schema
- Enums for all database enum types
- Request/Response DTOs

### 3. API Services

#### MenuService (`services/menu.service.ts`)
- `getMenuItems(params?)` - Fetch menu items with filters
- `getItemDetails(id)` - Get item with customization options
- `getCategories()` - Fetch all categories
- `getActivePromotions()` - Get active promotions
- `checkCapacity(params)` - Check custom cake capacity

#### OrderService (`services/order.service.ts`)
- `createOrder(data)` - Create new order
- `getOrderByCode(code)` - Retrieve order by verification code

### 4. Cart Management
- **File**: `contexts/CartContext.tsx`
- Persistent cart using localStorage
- Add/remove/update items
- Calculate subtotal, tax, and total
- Convert cart to order items for API

### 5. Page Integrations

#### Menu Page (`app/menu/page.tsx`)
- Fetches real menu items from server
- Category filtering
- Real-time stock status
- Integration with cart context

#### Cart Page (`app/cart/page.tsx`)
- Complete checkout flow
- Order creation via API
- Payment method selection
- Order confirmation with verification code

#### Categories Page (`app/categories/page.tsx`)
- Dynamic category loading from server
- Category-based navigation

## Environment Setup

### 1. Configure Environment Variables

Create or update `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

### 2. Install Dependencies

```bash
cd client/Kiosk
npm install
```

### 3. Start the Server

Ensure the backend server is running:

```bash
cd server
npm run dev
```

Server should be running on `http://localhost:3001`

### 4. Start the Kiosk App

```bash
cd client/Kiosk
npm run dev
```

App will be available at `http://localhost:3000`

## API Endpoints Used

### Kiosk Routes (Public)
- `GET /api/kiosk/menu` - Get menu items
- `GET /api/kiosk/categories` - Get categories
- `GET /api/kiosk/menu/:id` - Get item details
- `GET /api/kiosk/promotions` - Get active promotions
- `GET /api/kiosk/capacity/check` - Check custom cake capacity
- `POST /api/kiosk/orders` - Create order
- `GET /api/kiosk/orders/:code` - Get order by verification code

## Data Flow

### Menu Browsing
1. User opens app
2. `MenuService.getMenuItems()` fetches items from server
3. `MenuService.getCategories()` fetches categories
4. Items displayed with real-time availability
5. User adds items to cart (stored in CartContext + localStorage)

### Checkout Process
1. User navigates to cart
2. Reviews items and fills out order information
3. Clicks "Place Order"
4. `OrderService.createOrder()` sends order to server
5. Server creates order and returns verification code
6. User sees success modal with order number and verification code
7. Cart is cleared and user can start new order

## Key Considerations

### Tax Calculation
- Current VAT: 12% (Philippines standard)
- Configured in `CartContext.tsx`

### Order Types
- Walk-in
- Pickup
- Pre-order
- Custom order

### Payment Methods
- Cash
- GCash
- PayMaya
- Card
- Bank Transfer

### Error Handling
- Network errors caught and displayed to user
- Fallback error messages
- Retry mechanisms for failed requests

## Testing

### Manual Testing Checklist
- [ ] Menu items load from server
- [ ] Categories display correctly
- [ ] Can filter by category
- [ ] Can add items to cart
- [ ] Cart persists on page refresh
- [ ] Can update quantities in cart
- [ ] Can remove items from cart
- [ ] Checkout creates order successfully
- [ ] Verification code displayed after order
- [ ] Stock levels update appropriately

### API Health Check
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T..."
}
```

## Troubleshooting

### Issue: "Network Error" or API not responding
- **Solution**: Verify server is running on port 3001
- Check `.env.local` has correct API URL
- Verify no CORS issues in server configuration

### Issue: Items not loading
- **Solution**: Check database has menu items
- Verify items have `status = 'available'`
- Check items have valid prices in `menu_item_price` table

### Issue: Order creation fails
- **Solution**: Check required order fields
- Verify payment method is valid enum value
- Check server logs for validation errors

### Issue: Cart not persisting
- **Solution**: Check browser localStorage is enabled
- Clear localStorage and try again: `localStorage.clear()`

## Next Steps / Enhancements

### Recommended Improvements
1. **Image Upload**: Integrate real image URLs for menu items
2. **Custom Cake Designer**: Add UI for custom cake design options
3. **Real-time Updates**: WebSocket for order status updates
4. **Promotions Display**: Show active promotions on menu
5. **Search Functionality**: Add menu item search
6. **Favorites**: Let users save favorite items
7. **Order History**: View past orders (requires customer auth)
8. **Payment Gateway**: Integrate GCash/PayMaya payment APIs

### Performance Optimizations
1. Image lazy loading
2. Menu item pagination
3. API response caching
4. Optimistic UI updates

## Support

For issues or questions:
- Check server logs: `server/logs/`
- Review browser console for client errors
- Verify API responses in Network tab

## Version Info

- **Kiosk App**: v1.0.0
- **Server API**: v1.0.0
- **Last Updated**: 2025-11-16
