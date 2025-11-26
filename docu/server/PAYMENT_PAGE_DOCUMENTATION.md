# Payment Page Documentation
## Cashier Payment Management System

**Location:** `/cashier/payment`
**Date Created:** November 26, 2025
**File:** `client/cashieradmin/app/cashier/payment/page.tsx`

---

## Overview

The Payment Management page provides cashiers with a comprehensive interface for verifying and managing customer payments. It includes real-time statistics, quick search functionality, and streamlined payment verification workflows.

---

## Features

### 1. **Real-Time Payment Statistics**

Four key metrics displayed at the top of the page:

#### Pending Payments
- Shows count of orders awaiting payment verification
- Displays total amount pending
- Updates in real-time every 30 seconds
- Color: Warning (Yellow)

#### Verified Today
- Count of payments verified today
- Total amount verified
- Resets daily
- Color: Success (Green)

#### Verification Rate
- Percentage of payments verified vs pending
- Calculated as: `(Verified Today / (Pending + Verified Today)) × 100`
- Color: Primary (Blue)

#### Average Payment
- Average payment amount per verified order
- Calculated as: `Total Verified Amount / Verified Count`
- Color: Secondary (Purple)

---

### 2. **Quick Payment Verification**

Fast search and verify workflow:

**How to Use:**
1. Enter order number or verification code in search box
2. Click "Search & Verify" or press Enter
3. System finds the order and opens verification modal
4. Enter reference number (if applicable)
5. Click "Verify Payment"

**Supported Search:**
- Order Number (e.g., "ORD-20251126-001")
- Verification Code (e.g., "ABC123")

---

### 3. **Pending Payments Tab**

Displays all orders waiting for payment verification:

**Columns:**
- **Order #** - Order number and verification code
- **Time** - When order was created
- **Payment Method** - Cash, GCash, PayMaya, Card, or Bank Transfer
- **Amount** - Total amount to be verified
- **Reference** - Payment reference number (if provided)
- **Action** - "Verify" button

**Features:**
- Real-time auto-refresh every 30 seconds
- Shows payment method icons
- Color-coded by payment status
- Direct verify action

---

### 4. **Verified Today Tab**

Shows recently verified payments (last 10):

**Columns:**
- Same as Pending Payments tab
- **Status** - Always shows "Paid" (green chip)

**Features:**
- Filters to show only today's verified payments
- Sorted by most recent first
- Maximum 10 displayed
- Provides audit trail

---

### 5. **Payment Verification Modal**

Comprehensive verification interface:

**Order Information:**
- Order Number
- Verification Code
- Amount to Verify (large, prominent)
- Payment Method

**For Cashless Payments (GCash, PayMaya, Card):**
- Reference Number input field (required)
- Validation before submission
- Integration with payment gateway

**For Cash Payments:**
- Confirmation message
- Amount confirmation
- No reference number needed

**Error Handling:**
- Display API errors
- Validation errors
- Network failures
- User-friendly messages

---

## Payment Method Support

### Cash
- **Icon:** 💵 BanknotesIcon
- **Reference Required:** No
- **Verification:** Confirm cash received
- **Special:** Shows confirmation message

### GCash
- **Icon:** 📱 DevicePhoneMobileIcon
- **Reference Required:** Yes
- **Verification:** GCash API integration
- **Field:** `gcash_reference_number`

### PayMaya
- **Icon:** 📱 DevicePhoneMobileIcon
- **Reference Required:** Yes
- **Verification:** PayMaya API integration
- **Field:** `paymaya_reference_number`

### Card
- **Icon:** 💳 CreditCardIcon
- **Reference Required:** Yes
- **Verification:** Card terminal confirmation
- **Field:** `card_transaction_ref`

### Bank Transfer
- **Icon:** 💵 BanknotesIcon
- **Reference Required:** Optional
- **Verification:** Manual confirmation

---

## API Integration

### Endpoints Used

**Get Orders**
```typescript
GET /cashier/orders
Response: CustomerOrder[]
```

**Verify Payment**
```typescript
POST /cashier/payment/verify
Body: {
  order_id: number;
  payment_method: PaymentMethod;
  reference_number?: string;
}
Response: { success: boolean; message: string; }
```

---

## Data Structures

### CustomerOrder
```typescript
interface CustomerOrder {
  order_id: number;
  order_number: string;
  verification_code: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  final_amount: number;
  gcash_reference_number?: string;
  paymaya_reference_number?: string;
  card_transaction_ref?: string;
  order_datetime: string;
  // ... other fields
}
```

### VerifyPaymentRequest
```typescript
interface VerifyPaymentRequest {
  order_id: number;
  payment_method: PaymentMethod;
  reference_number?: string;
}
```

---

## Auto-Refresh Behavior

The page automatically refreshes data every 30 seconds:

```typescript
useEffect(() => {
  loadPaymentData();
  const interval = setInterval(loadPaymentData, 30000);
  return () => clearInterval(interval);
}, []);
```

**What Refreshes:**
- Pending payments count and list
- Verified payments count and list
- All statistics
- Payment amounts

**Manual Refresh:**
- Click "Refresh" button in top right
- Triggered after successful payment verification

---

## User Workflow Examples

### Example 1: Quick Cash Payment
1. Customer pays ₱500 in cash
2. Cashier enters order number "ORD-001" in search
3. Clicks "Search & Verify"
4. Modal opens showing order details
5. Confirms cash amount matches (₱500)
6. Clicks "Verify Payment"
7. Payment marked as paid
8. Order moves to "Verified Today" tab

### Example 2: GCash Payment with Reference
1. Customer shows GCash payment screenshot
2. Cashier sees reference number "1234567890"
3. Searches for order by verification code "ABC123"
4. Modal opens
5. Enters reference number "1234567890"
6. Clicks "Verify Payment"
7. System validates with GCash API
8. Payment verified and recorded

### Example 3: Batch Verification from Pending Tab
1. Cashier navigates to "Pending" tab
2. Sees 5 pending payments
3. Clicks "Verify" on first order
4. Enters reference number
5. Verifies payment
6. Modal closes, data refreshes
7. Pending count decreases to 4
8. Repeat for remaining orders

---

## Error Handling

### Common Errors

**1. Reference Number Missing**
- **Error:** "Please enter the payment reference number"
- **Cause:** Cashless payment submitted without reference
- **Solution:** Enter valid reference number

**2. Order Not Found**
- **Error:** "Order not found"
- **Cause:** Invalid order number or verification code
- **Solution:** Verify search query with customer

**3. Payment Verification Failed**
- **Error:** "Payment verification failed"
- **Cause:** Invalid reference or API error
- **Solution:** Check reference number with customer or retry

**4. Network Error**
- **Error:** "Failed to verify payment"
- **Cause:** Network connectivity issue
- **Solution:** Check internet connection and retry

---

## Color Scheme

### Payment Status Colors
- **Pending:** Warning (Yellow/Orange)
- **Paid:** Success (Green)
- **Failed:** Danger (Red)
- **Refunded:** Default (Gray)
- **Partial Paid:** Primary (Blue)

### Stat Card Colors
- **Pending Payments:** Warning border (left-4)
- **Verified Today:** Success border
- **Verification Rate:** Primary border
- **Average Payment:** Secondary border

---

## Keyboard Shortcuts

- **Enter** in search box → Trigger search
- **Esc** in modal → Close modal
- **Tab** → Navigate between inputs

---

## Accessibility Features

1. **ARIA Labels** - All interactive elements labeled
2. **Color Contrast** - WCAG AA compliant
3. **Keyboard Navigation** - Full keyboard support
4. **Screen Reader** - Semantic HTML structure
5. **Focus Indicators** - Clear focus states

---

## Performance Optimization

### Data Loading
- Debounced search (prevents excessive API calls)
- Conditional rendering (only load visible data)
- Pagination ready (currently showing top 10)

### Auto-Refresh
- 30-second interval (balance between real-time and performance)
- Automatic cleanup on unmount
- Prevents memory leaks

### State Management
- React hooks (useState, useEffect, useCallback)
- Minimal re-renders
- Efficient update patterns

---

## Future Enhancements

### High Priority
1. **Barcode Scanner Support** - Scan order barcodes
2. **QR Code Scanner** - Scan payment QR codes
3. **Receipt Printing** - Print payment receipts
4. **Bulk Verification** - Verify multiple payments at once

### Medium Priority
5. **Export to CSV** - Export payment history
6. **Advanced Filters** - Filter by date range, payment method
7. **Payment Analytics** - Charts and graphs
8. **Email Notifications** - Send payment confirmations

### Low Priority
9. **Multi-language Support** - i18n integration
10. **Dark Mode** - Theme switching
11. **Custom Reports** - Generate custom payment reports
12. **Audit Logs** - Detailed verification history

---

## Troubleshooting

### Page Not Loading
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check network tab for failed requests
4. Ensure authentication token is valid

### Auto-Refresh Not Working
1. Check if interval was cleared prematurely
2. Look for memory leaks
3. Verify component is mounted
4. Check browser console for errors

### Payment Verification Fails
1. Verify order exists in database
2. Check payment reference number format
3. Test API endpoint directly
4. Check payment gateway status

### Stats Not Updating
1. Force refresh with button
2. Clear browser cache
3. Check API response data
4. Verify calculation logic

---

## Testing Checklist

### Manual Testing
- [ ] Load page - stats appear correctly
- [ ] Search by order number - finds order
- [ ] Search by verification code - finds order
- [ ] Verify cash payment - succeeds
- [ ] Verify GCash payment with ref - succeeds
- [ ] Verify PayMaya payment with ref - succeeds
- [ ] Verify Card payment with ref - succeeds
- [ ] Test without reference (cashless) - shows error
- [ ] Auto-refresh after 30 seconds - updates data
- [ ] Manual refresh button - updates data
- [ ] Switch between tabs - displays correctly
- [ ] Empty states - show proper messages
- [ ] Error states - display error messages

### Edge Cases
- [ ] Very long order numbers
- [ ] Special characters in reference numbers
- [ ] Network timeout during verification
- [ ] Simultaneous verifications
- [ ] Payment already verified
- [ ] Order doesn't exist
- [ ] Invalid payment method

---

## Integration Points

### With Orders Page
- Shares `OrderService` API client
- Same data types (`CustomerOrder`)
- Consistent UI patterns
- Complementary workflows

### With Backend
- `/cashier/orders` endpoint
- `/cashier/payment/verify` endpoint
- Same authentication middleware
- Consistent error format

### With Payment Gateways
- GCash API integration
- PayMaya API integration
- Card terminal integration
- Future: Bank transfer validation

---

## Security Considerations

1. **Authentication Required** - Only authenticated cashiers
2. **Authorization** - Only cashier role can verify
3. **Audit Trail** - All verifications logged
4. **Reference Validation** - Server-side validation
5. **HTTPS Only** - Encrypted transmission
6. **No Sensitive Data Storage** - Reference numbers encrypted

---

## Support

For issues or questions:

1. Check this documentation
2. Review API documentation
3. Check error logs
4. Contact development team

---

**Document Version:** 1.0
**Last Updated:** November 26, 2025
**Page URL:** `/cashier/payment`
**Component:** `client/cashieradmin/app/cashier/payment/page.tsx`
