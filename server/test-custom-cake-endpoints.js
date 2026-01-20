/**
 * Comprehensive Test Script for Custom Cake System
 * Tests image upload and messaging endpoints
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.production' });

// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@goldenmunch.com'; // Change to your admin email
const ADMIN_PASSWORD = 'your-password'; // Change to your admin password

let authToken = null;
let testRequestId = null;

console.log('\n========================================');
console.log('  Custom Cake System - Endpoint Tests');
console.log('========================================\n');
console.log('API URL:', API_URL);
console.log('\n');

/**
 * Step 1: Admin Login
 */
async function testAdminLogin() {
  console.log('📝 Step 1: Admin Login');
  console.log('   Attempting login...');

  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (response.data?.data?.token) {
      authToken = response.data.data.token;
      console.log('   ✅ Login successful!');
      console.log('   Token:', authToken.substring(0, 20) + '...');
      return true;
    } else {
      console.log('   ❌ Login failed - no token in response');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Login failed:', error.response?.data?.message || error.message);
    console.log('   💡 Update ADMIN_EMAIL and ADMIN_PASSWORD in this script');
    return false;
  }
}

/**
 * Step 2: Create Test Custom Cake Request
 */
async function createTestRequest() {
  console.log('\n📝 Step 2: Create Test Custom Cake Request');
  console.log('   Creating draft request...');

  try {
    const testDesign = {
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '1234567890',
      pickup_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pickup_time: '14:00',
      num_layers: 2,
      layer_1_flavor_id: 1,
      layer_1_size_id: 1,
      layer_2_flavor_id: 2,
      layer_2_size_id: 2,
      theme_id: 1,
      cake_message: 'Test Message',
      special_instructions: 'This is a test request',
      design_data: JSON.stringify({ test: true }),
    };

    const response = await axios.post(
      `${API_URL}/api/custom-cake/save-draft`,
      testDesign
    );

    if (response.data?.data?.request_id) {
      testRequestId = response.data.data.request_id;
      console.log('   ✅ Test request created!');
      console.log('   Request ID:', testRequestId);
      return true;
    } else {
      console.log('   ❌ Failed to create request');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Request creation failed:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Step 3: Test Image Upload Endpoint
 */
async function testImageUpload() {
  console.log('\n📝 Step 3: Test Image Upload Endpoint');
  console.log('   Creating test base64 image...');

  // Create a tiny test PNG (1x1 red pixel)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  const testDataUrl = `data:image/png;base64,${testImageBase64}`;

  try {
    const response = await axios.post(
      `${API_URL}/api/custom-cake/upload-images`,
      {
        request_id: testRequestId,
        images: [
          {
            url: testDataUrl,
            type: '3d_render',
            view_angle: 'front',
          },
          {
            url: testDataUrl,
            type: '3d_render',
            view_angle: 'side',
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('   ✅ Upload endpoint responded!');
    console.log('   Response:', JSON.stringify(response.data, null, 2));

    if (response.data?.data?.uploaded > 0) {
      console.log('   ✅ Images uploaded successfully!');
      console.log('   Uploaded:', response.data.data.uploaded);
      console.log('   Failed:', response.data.data.failed);
      if (response.data.data.urls) {
        console.log('   URLs:', response.data.data.urls);
      }
      return true;
    } else {
      console.log('   ⚠️  Upload succeeded but no images were uploaded');
      if (response.data.data?.errors) {
        console.log('   Errors:', response.data.data.errors);
      }
      return false;
    }
  } catch (error) {
    console.log('   ❌ Upload failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Step 4: Verify Images in Database
 */
async function verifyImagesInDatabase() {
  console.log('\n📝 Step 4: Verify Images Retrieved from API');
  console.log('   Fetching request details...');

  try {
    const response = await axios.get(
      `${API_URL}/api/admin/custom-cakes/${testRequestId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    console.log('   ✅ Request details retrieved!');

    if (response.data?.data?.images) {
      const images = response.data.data.images;
      console.log('   Images found:', images.length);

      if (images.length > 0) {
        console.log('   ✅ Images are being returned from API!');
        images.forEach((img, i) => {
          console.log(`\n   Image ${i + 1}:`);
          console.log('     ID:', img.image_id);
          console.log('     URL:', img.image_url);
          console.log('     Type:', img.image_type);
          console.log('     View:', img.view_angle);
        });
        return true;
      } else {
        console.log('   ⚠️  No images returned from API');
        return false;
      }
    } else {
      console.log('   ⚠️  Response does not contain images array');
      console.log('   Response structure:', JSON.stringify(response.data?.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('   ❌ Failed to fetch request details:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Step 5: Test Messaging Endpoint
 */
async function testMessagingEndpoint() {
  console.log('\n📝 Step 5: Test Messaging Endpoint');
  console.log('   Sending test message...');

  try {
    const response = await axios.post(
      `${API_URL}/api/admin/custom-cakes/${testRequestId}/messages`,
      {
        message_body: 'This is a test message from the diagnostic script.',
        subject: 'Test Message',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('   ✅ Message endpoint responded!');
    console.log('   Response:', JSON.stringify(response.data, null, 2));

    if (response.data?.data) {
      const message = response.data.data;
      console.log('   ✅ Message created!');
      console.log('   Notification ID:', message.notification_id);
      console.log('   Status:', message.status);
      console.log('   Sent At:', message.sent_at);

      if (message.status === 'sent') {
        console.log('   ✅ Email was sent successfully!');
        return true;
      } else if (message.status === 'pending') {
        console.log('   ⚠️  Message created but email is pending');
        return false;
      } else if (message.status === 'failed') {
        console.log('   ❌ Email send failed');
        return false;
      }
    }
  } catch (error) {
    console.log('   ❌ Message send failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.response?.status === 401) {
      console.log('   💡 Authentication error - token may be invalid');
    }
    return false;
  }
}

/**
 * Step 6: Verify Resend Configuration
 */
async function verifyEmailConfig() {
  console.log('\n📝 Step 6: Verify Email Configuration');

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;

  console.log('   RESEND_API_KEY:', apiKey ? `${apiKey.substring(0, 10)}... (configured)` : '❌ NOT SET');
  console.log('   EMAIL_FROM_ADDRESS:', fromAddress || '❌ NOT SET');

  if (!apiKey || !fromAddress) {
    console.log('   ❌ Email service not configured!');
    return false;
  }

  console.log('   ✅ Email configuration present');
  return true;
}

/**
 * Step 7: Verify Supabase Configuration
 */
async function verifySupabaseConfig() {
  console.log('\n📝 Step 7: Verify Supabase Configuration');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  console.log('   SUPABASE_URL:', supabaseUrl || '❌ NOT SET');
  console.log('   SUPABASE_SERVICE_KEY:', supabaseKey ? `${supabaseKey.substring(0, 10)}... (configured)` : '❌ NOT SET');

  if (!supabaseUrl || supabaseUrl.includes('your-project-id') || !supabaseKey || supabaseKey.includes('your_supabase')) {
    console.log('   ❌ Supabase not configured properly!');
    return false;
  }

  console.log('   ✅ Supabase configuration present');
  return true;
}

/**
 * Main Test Runner
 */
async function runTests() {
  const results = {
    adminLogin: false,
    testRequest: false,
    imageUpload: false,
    imageRetrieval: false,
    messaging: false,
    emailConfig: false,
    supabaseConfig: false,
  };

  // Run tests in sequence
  results.emailConfig = await verifyEmailConfig();
  results.supabaseConfig = await verifySupabaseConfig();
  results.adminLogin = await testAdminLogin();

  if (results.adminLogin) {
    results.testRequest = await createTestRequest();

    if (results.testRequest) {
      results.imageUpload = await testImageUpload();
      results.imageRetrieval = await verifyImagesInDatabase();
      results.messaging = await testMessagingEndpoint();
    }
  }

  // Print summary
  console.log('\n========================================');
  console.log('  Test Results Summary');
  console.log('========================================\n');

  console.log('Email Config:', results.emailConfig ? '✅ CONFIGURED' : '❌ NOT CONFIGURED');
  console.log('Supabase Config:', results.supabaseConfig ? '✅ CONFIGURED' : '❌ NOT CONFIGURED');
  console.log('Admin Login:', results.adminLogin ? '✅ PASSED' : '❌ FAILED');
  console.log('Create Request:', results.testRequest ? '✅ PASSED' : '❌ FAILED');
  console.log('Image Upload:', results.imageUpload ? '✅ PASSED' : '❌ FAILED');
  console.log('Image Retrieval:', results.imageRetrieval ? '✅ PASSED' : '❌ FAILED');
  console.log('Messaging:', results.messaging ? '✅ PASSED' : '❌ FAILED');

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('\n✅ ALL TESTS PASSED! The system is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED. Review the output above for details.\n');
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('\n💥 Test runner crashed:', error);
  process.exit(1);
});
