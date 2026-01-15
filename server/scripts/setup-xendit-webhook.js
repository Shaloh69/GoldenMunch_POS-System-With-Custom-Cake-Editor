/**
 * Xendit Webhook Setup Script
 *
 * This script programmatically configures the Xendit webhook for QR code payments.
 * Run this once to register the webhook endpoint with Xendit.
 *
 * Usage:
 *   node scripts/setup-xendit-webhook.js
 *
 * Requirements:
 *   - XENDIT_SECRET_KEY in environment variables or .env file
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });
const axios = require('axios');

const WEBHOOK_URL = 'https://goldenmunch-server.onrender.com/api/webhooks/xendit/qr-payment';

// Xendit callback URLs API endpoint
// Docs: https://docs.xendit.co/apidocs/set-webhook-url
const XENDIT_API_URL = 'https://api.xendit.co/callback_urls/qr_code';

// Get API key from environment
const API_KEY = process.env.XENDIT_SECRET_KEY;

if (!API_KEY) {
  console.error('❌ Error: XENDIT_SECRET_KEY not found in environment variables');
  console.error('Please set XENDIT_SECRET_KEY in server/.env.production file');
  process.exit(1);
}

// Determine environment based on API key
const isProduction = API_KEY.startsWith('xnd_production_');
const environment = isProduction ? 'PRODUCTION' : 'TEST';

console.log('\n🚀 Xendit Webhook Setup Script');
console.log('================================\n');
console.log(`Environment: ${environment}`);
console.log(`Webhook URL: ${WEBHOOK_URL}\n`);

async function setupWebhook() {
  try {
    // Step 1: Get existing webhook URL
    console.log('📋 Step 1: Checking existing webhook URL...');

    try {
      const getResponse = await axios.get(XENDIT_API_URL, {
        auth: {
          username: API_KEY,
          password: ''
        },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GoldenMunch-POS/1.0',
          'Host': 'api.xendit.co'
        }
      });

      const currentUrl = getResponse.data?.url;
      console.log(`✓ Current webhook URL: ${currentUrl || 'Not set'}\n`);

      if (currentUrl === WEBHOOK_URL) {
        console.log('ℹ️  Webhook is already configured correctly!');
        console.log(`   URL: ${currentUrl}`);
        console.log('   Status: ACTIVE\n');
        console.log('✓ No changes needed\n');
      } else {
        // Step 2: Update webhook URL
        console.log('📝 Step 2: Setting webhook URL...');

        const createResponse = await axios.post(XENDIT_API_URL, {
          url: WEBHOOK_URL
        }, {
          auth: {
            username: API_KEY,
            password: ''
          },
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'GoldenMunch-POS/1.0',
            'Host': 'api.xendit.co'
          }
        });

        console.log('✓ Webhook URL set successfully!');
        console.log(`   Status: ${createResponse.data.status}`);
        console.log(`   URL: ${WEBHOOK_URL}\n`);
      }
    } catch (checkError) {
      // If GET fails, try to set the URL directly
      console.log('⚠️  Could not check existing webhook, attempting to set URL...\n');

      console.log('📝 Step 2: Setting webhook URL...');

      const createResponse = await axios.post(XENDIT_API_URL, {
        url: WEBHOOK_URL
      }, {
        auth: {
          username: API_KEY,
          password: ''
        },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GoldenMunch-POS/1.0',
          'Host': 'api.xendit.co'
        }
      });

      console.log('✓ Webhook URL set successfully!');
      console.log(`   Status: ${createResponse.data.status}`);
      console.log(`   URL: ${WEBHOOK_URL}\n`);
    }

    // Step 3: Test the webhook
    console.log('🧪 Step 3: Testing webhook endpoint...');

    try {
      const testResponse = await axios.post(WEBHOOK_URL, {
        event: 'qr_code.payment',
        data: {
          id: 'test-qr-code-id',
          reference_id: 'test-order-123',
          type: 'DYNAMIC',
          currency: 'PHP',
          amount: 100,
          status: 'COMPLETED',
          channel_code: 'GCASH',
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        }
      }, {
        timeout: 10000
      });

      if (testResponse.status === 200) {
        console.log('✓ Webhook endpoint is responding correctly!\n');
      }
    } catch (testError) {
      if (testError.response && testError.response.status === 200) {
        console.log('✓ Webhook endpoint is responding correctly!\n');
      } else {
        console.log('⚠️  Warning: Could not test webhook endpoint');
        console.log('   The webhook is registered but endpoint test failed');
        console.log(`   Error: ${testError.message}\n`);
      }
    }

    // Success message
    console.log('✅ Webhook setup complete!\n');
    console.log('📌 Next Steps:');
    console.log('   1. Webhook is now registered with Xendit');
    console.log('   2. Test by creating a QR code payment in your app');
    console.log('   3. Complete payment using GCash/PayMaya test accounts');
    console.log('   4. Check if payment status updates automatically\n');

  } catch (error) {
    console.error('\n❌ Error setting up webhook:\n');

    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${JSON.stringify(error.response.data, null, 2)}\n`);

      if (error.response.status === 401) {
        console.error('💡 Tip: Check if your XENDIT_SECRET_KEY is correct');
      } else if (error.response.status === 400) {
        console.error('💡 Tip: The webhook URL might already be registered');
      }
    } else {
      console.error(error.message);
    }

    console.error('\n📖 For more info, visit: https://developers.xendit.co/api-reference/#callbacks\n');
    process.exit(1);
  }
}

// Helper function to ask questions in terminal
function askQuestion(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, answer => {
      readline.close();
      resolve(answer);
    });
  });
}

// Run the setup
setupWebhook();
