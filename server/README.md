# GoldenMunch POS Server

A comprehensive Point of Sale (POS) system server built with Node.js, Express, TypeScript, and MySQL. Features kiosk ordering, cashless payments, custom cake orders, inventory management, and analytics.

## 🚀 Features

- **Kiosk Ordering System**: Self-service ordering with menu browsing and cart management
- **Cashless Payments**: GCash/PayMaya payment verification via reference numbers
- **Custom Cake Orders**: Full customization with flavors, sizes, themes, and capacity management
- **Inventory Management**: Real-time stock tracking with low-stock alerts
- **Admin Dashboard**: Complete POS management with analytics and reporting
- **Cashier Terminal**: Order verification and payment processing
- **Promotions & Discounts**: Flexible promotion rules engine
- **Customer Feedback**: Rating and review system
- **Analytics & Reports**: Sales, trending items, and waste tracking

## 📋 Prerequisites

- Node.js >= 16.x
- MySQL >= 8.0
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
```bash
cd server
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=GoldenMunchPOS
JWT_SECRET=your_secret_key
```

4. **Set up the database**
```bash
mysql -u root -p < databaseSchema/GoldenMunchPOSV2.sql
```

5. **Build the project**
```bash
npm run build
```

6. **Start the server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All admin and cashier endpoints require Bearer token authentication.

#### Admin Login
```http
POST /api/auth/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "System Administrator",
      "role": "super_admin"
    }
  }
}
```

#### Cashier Login
```http
POST /api/auth/cashier/login
Content-Type: application/json

{
  "cashier_code": "CASH001",
  "pin": "1234"
}
```

### Kiosk Endpoints (Public)

#### Get Menu Items
```http
GET /api/kiosk/menu?category_id=1&is_featured=true&page=1&limit=20
```

Query Parameters:
- `category_id` (optional): Filter by category
- `item_type` (optional): Filter by item type
- `is_featured` (optional): Show only featured items
- `search` (optional): Search by name or description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

#### Get Categories
```http
GET /api/kiosk/categories
```

#### Get Item Details
```http
GET /api/kiosk/menu/:id
```

Returns item details with customization options (flavors, sizes, themes) if applicable.

#### Get Active Promotions
```http
GET /api/kiosk/promotions
```

#### Check Custom Cake Capacity
```http
GET /api/kiosk/capacity/check?pickup_date=2024-01-15&complexity=simple
```

#### Create Order
```http
POST /api/kiosk/orders
Content-Type: application/json

{
  "order_type": "walk_in",
  "order_source": "kiosk",
  "payment_method": "gcash",
  "items": [
    {
      "menu_item_id": 1,
      "quantity": 2,
      "special_instructions": "Extra frosting"
    },
    {
      "menu_item_id": 5,
      "quantity": 1,
      "flavor_id": 2,
      "size_id": 3,
      "custom_cake_design": {
        "theme_id": 1,
        "frosting_type": "buttercream",
        "frosting_color": "pink",
        "cake_text": "Happy Birthday",
        "design_complexity": "simple"
      }
    }
  ]
}
```

Response includes `order_number` and `verification_code` for order pickup.

#### Get Order by Verification Code
```http
GET /api/kiosk/orders/:verification_code
```

### Cashier Endpoints

Require `Authorization: Bearer <cashier_token>` header.

#### Verify Order
```http
POST /api/cashier/orders/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "verification_code": "123456"
}
```

#### Verify Payment
```http
POST /api/cashier/payment/verify
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "order_id": 1,
  "reference_number": "GCASH123456789",
  "payment_method": "gcash",
  "qr_code": [file upload]
}
```

#### Get Orders
```http
GET /api/cashier/orders?status=pending&payment_status=pending&page=1&limit=20
```

Query Parameters:
- `status`: Order status filter
- `payment_status`: Payment status filter
- `order_type`: Order type filter
- `date_from`: Start date (YYYY-MM-DD)
- `date_to`: End date (YYYY-MM-DD)
- `page`: Page number
- `limit`: Items per page

#### Update Order Status
```http
PATCH /api/cashier/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "preparing"
}
```

### Admin Endpoints

Require `Authorization: Bearer <admin_token>` header.

#### Menu Management

**Create Menu Item**
```http
POST /api/admin/menu
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "name": "Chocolate Cake",
  "description": "Rich chocolate cake",
  "item_type": "cake",
  "can_customize": true,
  "stock_quantity": 10,
  "image": [file upload]
}
```

**Update Menu Item**
```http
PUT /api/admin/menu/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "available"
}
```

**Delete Menu Item**
```http
DELETE /api/admin/menu/:id
Authorization: Bearer <token>
```

**Add Item Price**
```http
POST /api/admin/menu/prices
Authorization: Bearer <token>
Content-Type: application/json

{
  "menu_item_id": 1,
  "price": 599.00,
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "price_type": "regular"
}
```

#### Category Management

**Create Category**
```http
POST /api/admin/categories
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "name": "Cakes",
  "description": "All types of cakes",
  "display_order": 1,
  "image": [file upload]
}
```

**Assign Item to Category**
```http
POST /api/admin/categories/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "category_id": 1,
  "menu_item_id": 5,
  "display_order": 0
}
```

#### Inventory Management

**Get Inventory Alerts**
```http
GET /api/admin/inventory/alerts?is_acknowledged=false
Authorization: Bearer <token>
```

**Acknowledge Alert**
```http
PATCH /api/admin/inventory/alerts/:id/acknowledge
Authorization: Bearer <token>
```

**Adjust Inventory**
```http
POST /api/admin/inventory/adjust
Authorization: Bearer <token>
Content-Type: application/json

{
  "menu_item_id": 1,
  "quantity": 10,
  "transaction_type": "in",
  "reason_id": 1,
  "notes": "Restock from supplier"
}
```

#### Analytics

**Get Sales Analytics**
```http
GET /api/admin/analytics/sales?date_from=2024-01-01&date_to=2024-01-31
Authorization: Bearer <token>
```

**Get Trending Items**
```http
GET /api/admin/analytics/trending?days=7&limit=10
Authorization: Bearer <token>
```

**Get Waste Report**
```http
GET /api/admin/analytics/waste?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>
```

**Recalculate Popularity Scores**
```http
POST /api/admin/analytics/popularity/recalculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "days": 30
}
```

#### Promotions

**Create Promotion**
```http
POST /api/admin/promotions
Authorization: Bearer <token>
Content-Type: application/json

{
  "promotion_name": "New Year Sale",
  "promotion_type": "percentage",
  "discount_percentage": 20,
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "display_on_kiosk": true
}
```

**Get Promotions**
```http
GET /api/admin/promotions?is_active=true
Authorization: Bearer <token>
```

#### Feedback Management

**Get Feedback**
```http
GET /api/admin/feedback?feedback_type=negative&rating_min=1
Authorization: Bearer <token>
```

**Respond to Feedback**
```http
POST /api/admin/feedback/:id/respond
Authorization: Bearer <token>
Content-Type: application/json

{
  "response_text": "Thank you for your feedback. We apologize for the inconvenience..."
}
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Admin, Cashier)
- Rate limiting
- Helmet security headers
- Input validation with Joi
- SQL injection prevention
- CORS configuration

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── database.ts       # Database connection pool
│   │   └── multer.ts         # File upload configuration
│   ├── controllers/
│   │   ├── admin.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── kiosk.controller.ts
│   │   └── order.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/
│   │   └── types.ts          # TypeScript interfaces
│   ├── routes/
│   │   └── index.ts          # API routes
│   ├── utils/
│   │   ├── helpers.ts        # Utility functions
│   │   └── logger.ts         # Winston logger
│   ├── app.ts                # Express app configuration
│   └── server.ts             # Server entry point
├── uploads/                  # Uploaded files
├── logs/                     # Application logs
├── .env                      # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Testing

Run the server:
```bash
npm run dev
```

Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

## 📝 Default Credentials

**Admin:**
- Username: `admin`
- Password: `password`

**Cashier:**
- Code: `CASH001`
- PIN: `1234`

⚠️ **IMPORTANT**: Change these credentials immediately in production!

## 🔄 Database Procedures

The system includes several MySQL stored procedures:

- `VerifyOrder(verification_code, cashier_id)`: Verify and confirm orders
- `VerifyGCashPayment(order_id, reference, cashier_id)`: Verify GCash payments
- `CheckCustomCakeCapacity(date, complexity)`: Check cake order capacity
- `GetActivePromotions(item_id, total)`: Get applicable promotions
- `RecalculatePopularityScore(days)`: Recalculate item popularity
- `GetTrendingItems(days, limit)`: Get trending menu items
- `GetWasteReport(start_date, end_date)`: Generate waste report

## 📊 Database Schema Features

- **Normalized schema** with lowercase values
- **Triggers** for automatic inventory updates
- **Stored procedures** for complex business logic
- **Indexes** for optimal query performance
- **Constraints** for data integrity
- **Soft deletes** for data preservation

## 🚨 Error Handling

All API responses follow this format:

Success:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## 📈 Performance

- Connection pooling for database
- Compression middleware
- Rate limiting
- Caching headers
- Optimized queries with indexes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

ISC

## 📞 Support

For issues and questions, please create an issue in the repository.

---

Built with ❤️ for GoldenMunch Bakery
