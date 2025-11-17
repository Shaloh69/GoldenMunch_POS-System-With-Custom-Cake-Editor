# GoldenMunch Kiosk Client

This is the kiosk client for the GoldenMunch POS System, built with Next.js 15 and HeroUI (v2).

## Quick Start

**Having installation issues?** See [INSTALL.md](./INSTALL.md) for detailed troubleshooting steps.

## Technologies Used

- [Next.js 15](https://nextjs.org/docs/getting-started)
- [React 18](https://react.dev/)
- [HeroUI v2](https://heroui.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [Axios](https://axios-http.com/)

## Prerequisites

- Node.js >= 18.17.0
- npm >= 9.0.0

## Installation

### Fresh Install (Recommended)

**Windows:**
```bash
npm run fresh-install:win
```

**Linux/Mac:**
```bash
npm run fresh-install
```

This will clean up any existing `node_modules` and `package-lock.json` files and perform a fresh installation.

### Standard Install

```bash
npm install
```

**Note:** If you encounter errors with deprecated packages or Electron installation failures, use the fresh install method above.

### Troubleshooting

If you experience installation issues such as:
- Deprecated package warnings
- Electron installation errors (ETIMEDOUT)
- Network timeout errors
- Peer dependency conflicts

Please see [INSTALL.md](./INSTALL.md) for comprehensive troubleshooting steps.

## Development

### Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm run start
```

## Configuration

Create a `.env.local` file in this directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Adjust the API URL to match your backend server configuration.

## License

Licensed under the [MIT license](https://github.com/heroui-inc/next-app-template/blob/main/LICENSE).
