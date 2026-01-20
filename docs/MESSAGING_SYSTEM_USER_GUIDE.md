# Messaging System User Guide

## Overview

The GoldenMunch POS system has a complete two-way messaging system that allows admins to communicate with customers about their custom cake requests. This guide explains how to use it.

---

## ✅ System Status

The messaging system is **FULLY FUNCTIONAL** and includes:

- ✅ **MessagingPanel Component** - Beautiful UI for viewing and sending messages
- ✅ **Real-Time Updates** - Messages appear instantly via Server-Sent Events (SSE)
- ✅ **Email Integration** - Messages are automatically sent as emails to customers
- ✅ **Inbound Email Replies** - Customer email replies automatically appear in the admin panel
- ✅ **Message History** - Full conversation thread with timestamps
- ✅ **Unread Indicators** - Visual notifications for new customer messages
- ✅ **Quick Templates** - Pre-written message templates for common responses

---

## 📍 Where to Find the MessagingPanel

### In Admin Panel

1. Navigate to **Admin → Custom Cakes**
2. Click on any custom cake request to view details
3. Scroll down to the **Message Thread** section
4. You'll see the MessagingPanel with:
   - Message Thread (top) - Shows all messages
   - Message Composer (bottom) - Send new messages

---

## 📨 How to Send Messages to Customers

### Step 1: Navigate to Request

1. Go to **Admin → Custom Cakes**
2. Click on a custom cake request (Request #123, etc.)

### Step 2: Use the Message Composer

At the bottom of the page, you'll see the **Message Composer** section:

```
┌─────────────────────────────────────────────┐
│ ✉️ Compose Message                         │
│                                             │
│ [Quick Templates]                           │
│ • Greeting                                  │
│ • Approval                                  │
│ • Clarification                             │
│ • Ready for Pickup                          │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Type your message here...           │   │
│ │                                     │   │
│ │                                     │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ [Clear]  [Send Message]                    │
└─────────────────────────────────────────────┘
```

### Step 3: Write Your Message

You have two options:

**Option A: Use Quick Templates**
- Click on any template chip (Greeting, Approval, etc.)
- The template text will be inserted
- Edit as needed

**Option B: Write Custom Message**
- Type your message directly in the text area
- Press `Ctrl+Enter` (or `Cmd+Enter` on Mac) to send quickly

### Step 4: Send

- Click **"Send Message"** button
- You'll see a success toast notification
- The message appears in the thread immediately
- Customer receives an email notification

---

## 📧 What Customers Receive

When you send a message, customers receive a beautiful HTML email with:

1. **Subject Line**: `Custom Cake Request #123 - Message from GoldenMunch`
2. **Message Body**: Your message in a formatted template
3. **Reply Instructions**: "💬 You can reply to this email!"
4. **Company Contact Info**: Phone, email, address

### Email Template Example

```
┌───────────────────────────────────────────┐
│ 💬 New Message from GoldenMunch           │
│ (Gradient background)                     │
├───────────────────────────────────────────┤
│ Dear Sarah,                               │
│                                           │
│ You have received a new message           │
│ regarding your custom cake request #123:  │
│                                           │
│ ┌────────────────────────────────────┐  │
│ │ Hi Sarah,                          │  │
│ │                                    │  │
│ │ Great news! We've reviewed your    │  │
│ │ design and can definitely make...  │  │
│ └────────────────────────────────────┘  │
│                                           │
│ ┌────────────────────────────────────┐  │
│ │ 💬 You can reply to this email!    │  │
│ │ Simply hit "Reply" and your message│  │
│ │ will be sent directly to our team. │  │
│ └────────────────────────────────────┘  │
├───────────────────────────────────────────┤
│ Best regards,                             │
│ The GoldenMunch Team                      │
│ 📧 [email protected]           │
│ 📞 Contact us                             │
└───────────────────────────────────────────┘
```

---

## 💬 How Customer Replies Work

### When Customer Replies to Email

1. **Customer hits "Reply"** in their email client
2. **Customer types their message** and sends
3. **Resend receives the email** via inbound webhook
4. **Server processes the reply**:
   - Extracts request ID from subject (#123)
   - Verifies sender matches customer email
   - Removes quoted text (previous messages)
   - Saves to database
5. **Admin sees the reply** in MessagingPanel instantly (via SSE)

### Reply Appears Like This

```
┌───────────────────────────────────────────┐
│ 👤 Sarah Thompson    [customer] [New]    │
│ 2 minutes ago                             │
├───────────────────────────────────────────┤
│ Thank you! That sounds perfect. Can I     │
│ add an extra layer for more servings?     │
│                                           │
│ ✓✓ Read 1 minute ago                     │
└───────────────────────────────────────────┘
```

---

## 🎨 Quick Templates Explained

### 1. Greeting Template
```
Hi [Customer Name],

[Your cursor here to continue...]
```
**Use When**: Starting a conversation

### 2. Approval Template
```
Great news! Your custom cake request has been approved.

We'll get started on your beautiful creation right away.
If you have any questions, please don't hesitate to ask.

Best regards,
GoldenMunch Team
```
**Use When**: Approving a request (in addition to approval button)

### 3. Clarification Template
```
Hi [Customer Name],

Thank you for your custom cake request. We'd like to
clarify a few details to ensure we create exactly what
you're envisioning:

- [Detail 1]
- [Detail 2]

Please let us know your preferences.

Best regards,
GoldenMunch Team
```
**Use When**: Need more information from customer

### 4. Ready for Pickup Template
```
Hi [Customer Name],

Your custom cake is ready for pickup! 🎉

Please bring your verification code when you arrive.

Looking forward to seeing you!

Best regards,
GoldenMunch Team
```
**Use When**: Cake is ready (in addition to status update)

---

## 📊 Message Statistics

At the bottom of the MessagingPanel, you'll see stats:

```
┌─────────────────────────────────────────┐
│  12        8         4                  │
│  Total     From      From                │
│  Messages  Customer  Admin               │
└─────────────────────────────────────────┘
```

This helps you track conversation activity.

---

## 🔔 Notifications

### Unread Message Badge

When customers send messages, you'll see:

1. **Badge on Custom Cakes menu** - Shows total unread count
2. **"New" chip on message** - Highlights unread messages
3. **Green highlight** - Unread messages have green background
4. **Auto-read** - Messages marked as read when you view them

---

## 🛠️ Technical Details

### Message Flow Diagram

```
Admin Panel                     Customer
    │                               │
    │ 1. Types message              │
    ├──────────────────────────────►│
    │ 2. Saves to DB                │
    │ 3. Sends email                │
    │                               │ 4. Receives email
    │                               │ 5. Reads message
    │                               │ 6. Hits "Reply"
    │◄──────────────────────────────┤ 7. Sends reply
    │ 8. Webhook triggered          │
    │ 9. Fetches full content       │
    │ 10. Parses reply text         │
    │ 11. Saves to DB               │
    │ 12. SSE broadcast             │
    │ 13. UI updates                │
```

### API Endpoints

**Send Admin Message**
```
POST /api/admin/custom-cakes/:requestId/messages
Authorization: Bearer <token>
Body: {
  message_body: "Your message here",
  subject: "Optional subject"
}
```

**Get Messages**
```
GET /api/admin/custom-cakes/:requestId/messages
Authorization: Bearer <token>
```

**Mark as Read**
```
PUT /api/admin/custom-cakes/:requestId/messages/mark-read
Authorization: Bearer <token>
Body: {
  notification_ids: [1, 2, 3]
}
```

**Inbound Email Webhook**
```
POST /api/webhooks/resend/inbound
Headers: svix-id, svix-timestamp, svix-signature
Body: <Resend webhook payload>
```

---

## 🔧 Troubleshooting

### "Message not sending"

**Possible Causes:**
1. Email service not configured
2. API URL incorrect
3. Authentication token expired

**Solutions:**
```bash
# Check server logs
tail -f logs/server.log | grep "email"

# Verify email service initialized
grep "Email service initialized" logs/server.log

# Check API URL in .env.production
cat client/cashieradmin/.env.production
# Should show: NEXT_PUBLIC_API_URL=https://goldenmunchserver.onrender.com
```

### "Customer replies not appearing"

**Possible Causes:**
1. Webhook not configured in Resend
2. Webhook secret missing
3. Customer email doesn't match

**Solutions:**
```bash
# Test webhook health
curl https://goldenmunchserver.onrender.com/api/webhooks/resend/health

# Check webhook logs
tail -f logs/server.log | grep "inbound email"

# Verify webhook in Resend Dashboard
# Go to: https://resend.com/webhooks
# Check endpoint: https://goldenmunchserver.onrender.com/api/webhooks/resend/inbound
```

### "No messages showing"

**Possible Causes:**
1. SSE connection failed
2. Database query issue
3. Request ID mismatch

**Solutions:**
```bash
# Check SSE connection in browser console
# Should see: "Connected to SSE: /api/sse/custom-cakes"

# Check database
mysql -u root -p GoldenMunchPOS
SELECT * FROM custom_cake_notifications WHERE request_id = 123;
```

---

## 📈 Best Practices

### 1. Respond Quickly
- Customers expect replies within 24-48 hours
- Set up notifications to alert you of new messages
- Use quick templates for faster responses

### 2. Be Clear and Professional
- Use proper grammar and spelling
- Be friendly but professional
- Include specific details (dates, prices, etc.)

### 3. Keep Conversation in System
- Encourage customers to reply to emails
- Avoid phone calls for documentation
- All messages are saved for future reference

### 4. Use Templates Wisely
- Customize templates for each customer
- Add personal touches (use their name)
- Include relevant details from their request

### 5. Follow Up
- Send updates when status changes
- Notify when cake is in progress
- Remind about pickup time

---

## 🎯 Common Use Cases

### Case 1: Customer Asks Question

```
Customer: "Can I add chocolate chips to the frosting?"

You: [Use Clarification template]
Hi Sarah,

Absolutely! We can add chocolate chips to the frosting.
This will add approximately ₱50.00 to the final price.

Would you like to proceed with this addition?

Best regards,
GoldenMunch Team
```

### Case 2: Need More Details

```
You: [Use Clarification template]
Hi Sarah,

Thank you for your custom cake request. We'd like to clarify:

- What color would you like for the frosting?
- How many servings do you need? (affects size)
- Any dietary restrictions we should know about?

Please let us know your preferences.

Best regards,
GoldenMunch Team
```

### Case 3: Cake is Ready

```
You: [Use Ready for Pickup template + custom details]
Hi Sarah,

Your beautiful 3-layer chocolate cake is ready for pickup! 🎉

Pickup Details:
📅 Date: Saturday, January 25, 2026
🕐 Time: 2:00 PM
🔑 Verification Code: ABC123

Please bring your verification code when you arrive.

Looking forward to seeing you!

Best regards,
GoldenMunch Team
```

---

## 🚀 Summary

The messaging system allows you to:

✅ **Send messages** to customers from the admin panel
✅ **Receive replies** when customers respond to emails
✅ **Track conversations** with full message history
✅ **Get notifications** for new customer messages
✅ **Use templates** for faster responses
✅ **Maintain professionalism** with beautiful email formatting

Everything is automated - you just type and send!
