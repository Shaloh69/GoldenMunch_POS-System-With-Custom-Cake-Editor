# Thermal Printer Setup Guide

## Overview

The GoldenMunch Kiosk Electron app now includes thermal receipt printer support using the ESC/POS protocol, compatible with most thermal printers used in POS systems.

## Supported Printers

### Connection Types
- ✅ **USB** - Most common, plug-and-play
- ✅ **Network/Ethernet** - For networked printers
- ✅ **Serial/RS232** - For older printers

### Compatible Brands
- Epson (TM-T20, TM-T88 series)
- Star Micronics (TSP100, TSP650 series)
- XPrinter (XP-58, XP-80 series)
- Bixolon (SRP-350, SRP-275 series)
- Citizen (CT-S310, CT-S601 series)
- Most ESC/POS compatible printers

## Installation

### 1. Install Dependencies

The printer packages are already added to `package.json`:

```bash
cd client/Kiosk
npm install
```

This installs:
- `escpos` - ESC/POS printer library
- `serialport` - For serial/USB communication

### 2. Find Your Printer's USB IDs

#### On Linux/macOS:
```bash
lsusb
```

Look for your printer in the output:
```
Bus 002 Device 003: ID 0416:5011 XPrinter
```
- VID (Vendor ID): `0x0416`
- PID (Product ID): `0x5011`

#### On Windows:
1. Open Device Manager
2. Find your printer under "USB devices" or "Printers"
3. Right-click → Properties → Details → Hardware IDs
4. Note the VID and PID values

### 3. Configure Printer

Edit `client/Kiosk/electron/printer-config.json`:

```json
{
  "printerType": "usb",
  "usb": {
    "vid": "0x0416",
    "pid": "0x5011"
  },
  "settings": {
    "width": 48,
    "encoding": "GB18030"
  }
}
```

**Settings:**
- `width`: 48 for 80mm paper, 32 for 58mm paper
- `encoding`: Character encoding (GB18030, EUC-KR, etc.)

## Usage

### From TypeScript/React Components

```typescript
import { printerService } from '@/services/printer.service';

// Check if printer is available
const isAvailable = printerService.isAvailable();

// Print order receipt
const order = {
  orderNumber: 'ORD-12345',
  orderDate: '2025-11-17',
  items: [
    { name: 'Chocolate Cake', quantity: 1, price: 450.00 },
    { name: 'Coffee', quantity: 2, price: 120.00 }
  ],
  subtotal: 690.00,
  tax: 82.80,
  discount: 0,
  total: 772.80,
  paymentMethod: 'Cash',
  verificationCode: '123456'
};

const result = await printerService.printReceipt(order);
if (result.success) {
  console.log('Receipt printed!');
} else {
  console.error('Print failed:', result.error);
}

// Print test receipt
await printerService.printTest();

// Get printer status
const status = await printerService.getStatus();
console.log('Printer connected:', status.connected);
```

### Example: Print After Order Creation

```typescript
// In your order completion handler
async function handleOrderComplete(orderData: any) {
  try {
    // Create order via API
    const order = await OrderService.createOrder(orderData);

    // Format and print receipt
    const receiptData = printerService.formatOrderForPrint(order);
    const printResult = await printerService.printReceipt(receiptData);

    if (!printResult.success) {
      // Show error to user but don't block order
      toast.error(`Order created but print failed: ${printResult.error}`);
    }

    // Show success message
    showOrderConfirmation(order);
  } catch (error) {
    console.error('Order error:', error);
  }
}
```

### Add Print Button to UI

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { printerService } from '@/services/printer.service';

export function PrintReceiptButton({ orderData }: { orderData: any }) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    setPrinting(true);

    const receiptData = printerService.formatOrderForPrint(orderData);
    const result = await printerService.printReceipt(receiptData);

    if (result.success) {
      alert('Receipt printed successfully!');
    } else {
      alert(`Print failed: ${result.error}\n${result.suggestion || ''}`);
    }

    setPrinting(false);
  };

  // Only show button in Electron environment
  if (!printerService.isAvailable()) {
    return null;
  }

  return (
    <Button
      onClick={handlePrint}
      isLoading={printing}
      color="primary"
    >
      🖨️ Print Receipt
    </Button>
  );
}
```

## Configuration Options

### USB Printer

```json
{
  "printerType": "usb",
  "usb": {
    "vid": "0x0416",
    "pid": "0x5011"
  }
}
```

### Network Printer

```json
{
  "printerType": "network",
  "network": {
    "address": "192.168.1.100",
    "port": 9100
  }
}
```

### Serial Printer

```json
{
  "printerType": "serial",
  "serial": {
    "path": "/dev/ttyUSB0",
    "baudRate": 9600
  }
}
```

## Testing

### Test Print

From the Electron app, you can trigger a test print:

```typescript
import { printerService } from '@/services/printer.service';

const testPrint = async () => {
  const result = await printerService.printTest();
  if (result.success) {
    console.log('Test successful!');
  } else {
    console.error('Test failed:', result.error);
  }
};
```

Or from the Electron developer console (F12):

```javascript
window.electron.printer.printTest()
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

## Troubleshooting

### Printer Not Found

**Linux:**
```bash
# Check USB devices
lsusb

# Check permissions (may need to add user to lp group)
sudo usermod -a -G lp $USER
sudo chmod 666 /dev/usb/lp0
```

**Windows:**
- Install printer drivers from manufacturer
- Check Device Manager for any warnings
- Try different USB port

**macOS:**
- System Preferences → Printers & Scanners
- Ensure printer is added
- Check USB permissions

### Print Quality Issues

1. **Faded Print**: Replace thermal paper roll
2. **Garbled Text**: Check encoding setting in config
3. **Cut Off Text**: Adjust width setting (48 or 32)
4. **Wrong Characters**: Try different encoding (GB18030, EUC-KR)

### Connection Errors

```typescript
// Error: "Printer service not available"
// Solution: Check printer-config.json has correct VID/PID

// Error: "Failed to open device"
// Solution: Printer may be in use by another application

// Error: "Device not found"
// Solution: Check USB cable, try different port
```

### Verify Configuration

Check printer status from app:

```typescript
const status = await printerService.getStatus();
console.log('Available:', status.available);
console.log('Connected:', status.connected);
console.log('Config:', status.config);
```

## Receipt Customization

### Modify Receipt Format

Edit `client/Kiosk/electron/printer.js`:

```javascript
async printReceipt(orderData) {
  // ... existing code ...

  // Add your custom sections
  this.printer
    .align('ct')
    .text('*** SPECIAL OFFER ***')
    .text('Buy 5 cakes, get 1 free!')
    .text('');

  // ... rest of receipt ...
}
```

### Add Logo/Image

```javascript
// In printer.js, add before header
const logo = escpos.Image.load('./path/to/logo.png');
this.printer.image(logo);
```

### Add Barcode

```javascript
// Add barcode to receipt
this.printer.barcode(orderNumber, 'CODE39');
```

## Daily Sales Report

Print daily sales report:

```typescript
const reportData = {
  date: '2025-11-17',
  totalOrders: 45,
  totalSales: 32500.00,
  paymentBreakdown: {
    'Cash': 15000.00,
    'GCash': 12000.00,
    'Card': 5500.00
  },
  topItems: [
    { name: 'Chocolate Cake', quantity: 25 },
    { name: 'Coffee', quantity: 38 },
    { name: 'Croissant', quantity: 15 }
  ]
};

await printerService.printDailyReport(reportData);
```

## Common Printer IDs

| Brand | Model | VID | PID |
|-------|-------|-----|-----|
| Epson | TM-T20 | 0x04b8 | 0x0e03 |
| Epson | TM-T88V | 0x04b8 | 0x0202 |
| Star | TSP100 | 0x0519 | 0x0001 |
| XPrinter | XP-58 | 0x0416 | 0x5011 |
| Bixolon | SRP-350 | 0x1504 | 0x0006 |

## Performance Tips

1. **Pre-connect**: Initialize printer when app starts (already done in main.js)
2. **Error Handling**: Always check print results, don't block user flow
3. **Fallback**: Provide option to email receipt if print fails
4. **Testing**: Test with real printer before deploying to kiosk

## Security Notes

- Printer functions only available in Electron (not web browser)
- Secure IPC communication via preload script
- No sensitive data stored in print queue
- Receipts printed immediately, not cached

## Support

For printer-specific issues:
1. Check manufacturer documentation
2. Verify ESC/POS compatibility
3. Test with manufacturer's software first
4. Check USB cable and connections

---

**Printer Support Added**: 2025-11-17
**Library**: escpos v3.0.0-alpha.6
**Compatibility**: ESC/POS protocol
