# Golden Munch Admin Dashboard

A beautiful, modern admin dashboard for the Golden Munch POS System built with Next.js 15, React 18, and HeroUI.

## Features

- 🎨 Beautiful UI with Golden Munch brand colors
- 📱 Fully responsive design
- 🌓 Dark mode support
- 📊 Comprehensive analytics and reporting
- 🛒 Order management
- 🍰 Product catalog management
- 👥 User management
- 🎂 Custom cake order management
- 📦 Inventory tracking
- 🎁 Promotions management
- 💬 Customer feedback
- ⚙️ System settings

## Tech Stack

- **Framework**: Next.js 15.3.1
- **UI Library**: HeroUI (24 components)
- **Styling**: Tailwind CSS 4.1.11
- **Language**: TypeScript 5.6.3
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js >= 18.17.0
- npm >= 9.0.0

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Update the `.env` file with your API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Development

Run the development server:

```bash
npm run dev
```

The admin dashboard will be available at [http://localhost:3002](http://localhost:3002)

### Production Build

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

## Project Structure

```
client/Cashier&Admin/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Dashboard home
│   ├── login/             # Authentication
│   ├── orders/            # Order management
│   ├── products/          # Product management
│   ├── analytics/         # Analytics & reports
│   ├── layout.tsx         # Root layout with sidebar
│   └── providers.tsx      # Theme & UI providers
├── components/            # Reusable components
│   ├── admin-sidebar.tsx  # Sidebar navigation
│   ├── admin-header.tsx   # Top header
│   ├── stats-card.tsx     # Statistics card
│   ├── theme-switch.tsx   # Dark mode toggle
│   └── icons.tsx          # Icon components
├── config/                # Configuration files
│   ├── api.ts            # API client setup
│   ├── site.ts           # Site configuration
│   └── fonts.ts          # Font configuration
├── services/              # API services
│   ├── auth.service.ts   # Authentication
│   ├── order.service.ts  # Orders
│   └── product.service.ts # Products
├── styles/               # Global styles
│   └── globals.css       # Tailwind & custom CSS
└── public/               # Static assets
```

## Color Scheme

The dashboard follows the Golden Munch brand colors:

- **Golden Orange**: `#F9A03F` - Primary brand color
- **Deep Amber**: `#D97706` - Secondary accent
- **Cream White**: `#FFF8F0` - Background
- **Chocolate Brown**: `#4B2E2E` - Text & accents
- **Caramel Beige**: `#E6C89C` - Tertiary
- **Mint Green**: `#A8D5BA` - Success states

## Available Scripts

- `npm run dev` - Start development server on port 3002
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run clean` - Remove node_modules and lock file
- `npm run fresh-install` - Clean and reinstall dependencies

## Authentication

The dashboard supports two types of users:

1. **Admin**: Full access to all features
2. **Cashier**: Limited access (orders, products view only)

Default login endpoint:
- Admin: `POST /api/admin/login`
- Cashier: `POST /api/cashier/login`

## API Integration

All API calls are configured through `config/api.ts` which includes:

- Automatic token injection
- Global error handling
- Request/response interceptors
- Configurable timeout and base URL

## Features Overview

### Dashboard
- Real-time statistics
- Recent orders
- Top products
- Quick actions

### Orders Management
- View all orders
- Filter by status
- Order details modal
- Status updates
- Print receipts

### Products Management
- Product catalog
- Add/Edit/Delete products
- Inventory tracking
- Category filtering
- Availability toggle

### Analytics
- Sales reports
- Category breakdown
- Daily sales trends
- Performance metrics

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Copyright © 2024 Golden Munch. All rights reserved.