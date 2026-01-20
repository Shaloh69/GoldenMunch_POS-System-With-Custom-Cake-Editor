/**
 * Test Script for Email and Supabase Configuration
 *
 * This script tests:
 * 1. Resend email service configuration
 * 2. Supabase storage configuration
 * 3. Bucket creation and access
 *
 * Run with: node test-email-and-supabase.js
 */

const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

async function testEmailService() {
  console.log('\n📧 Testing Resend Email Service...\n');

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;

  console.log('RESEND_API_KEY:', apiKey ? `${apiKey.substring(0, 10)}...` : '❌ NOT SET');
  console.log('EMAIL_FROM_ADDRESS:', fromAddress || '❌ NOT SET');

  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    console.log('\n❌ RESEND_API_KEY is not configured!\n');
    return false;
  }

  if (!fromAddress) {
    console.log('\n❌ EMAIL_FROM_ADDRESS is not configured!\n');
    return false;
  }

  try {
    const resend = new Resend(apiKey);

    // Test sending an email
    console.log('\n📤 Attempting to send test email...');
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [fromAddress], // Send to self for testing
      subject: '✅ Test Email - GoldenMunch POS',
      html: '<h1>Success!</h1><p>Your Resend email service is working correctly.</p>',
    });

    if (error) {
      console.error('\n❌ Email send failed:', error);

      if (error.message?.includes('Domain')) {
        console.log('\n💡 TIP: Your domain "goldenmunch.dpdns.org" needs to be verified in Resend dashboard');
        console.log('   Go to: https://resend.com/domains');
        console.log('   Add domain: goldenmunch.dpdns.org');
        console.log('   Add DNS records as instructed');
      }

      return false;
    }

    console.log('\n✅ Email sent successfully!');
    console.log('   Email ID:', data.id);
    return true;
  } catch (error) {
    console.error('\n❌ Email service test failed:', error.message);
    return false;
  }
}

async function testSupabaseService() {
  console.log('\n☁️  Testing Supabase Storage Service...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  console.log('SUPABASE_URL:', supabaseUrl || '❌ NOT SET');
  console.log('SUPABASE_SERVICE_KEY:', supabaseKey ? `${supabaseKey.substring(0, 10)}...` : '❌ NOT SET');

  if (!supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co') {
    console.log('\n❌ SUPABASE_URL is not configured!');
    console.log('💡 Get your Supabase URL from: https://supabase.com/dashboard/project/_/settings/api');
    console.log('   Format: https://xxxxxxxxxxxxx.supabase.co\n');
    return false;
  }

  if (!supabaseKey || supabaseKey === 'your_supabase_service_role_key_here') {
    console.log('\n❌ SUPABASE_SERVICE_KEY is not configured!');
    console.log('💡 Get your service_role key from: https://supabase.com/dashboard/project/_/settings/api');
    console.log('   Use the "service_role" key (secret), NOT the anon key\n');
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test bucket list
    console.log('\n📂 Checking storage buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('\n❌ Failed to list buckets:', listError);
      return false;
    }

    console.log(`\n✅ Found ${buckets.length} bucket(s):`);
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    // Check if custom-cakes bucket exists
    const customCakesBucket = buckets.find(b => b.name === 'custom-cakes');

    if (!customCakesBucket) {
      console.log('\n⚠️  "custom-cakes" bucket does not exist!');
      console.log('   Creating bucket...');

      const { data: newBucket, error: createError } = await supabase.storage.createBucket('custom-cakes', {
        public: true,
        fileSizeLimit: 15 * 1024 * 1024, // 15MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      });

      if (createError) {
        console.error('\n❌ Failed to create bucket:', createError);
        return false;
      }

      console.log('   ✅ Bucket created successfully!');
    } else {
      console.log('\n✅ "custom-cakes" bucket exists and is', customCakesBucket.public ? 'public' : 'private');
    }

    // Test upload
    console.log('\n📤 Testing image upload...');
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const testBuffer = Buffer.from(testImageBase64, 'base64');
    const testFilePath = `test/test-${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('custom-cakes')
      .upload(testFilePath, testBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('\n❌ Upload test failed:', uploadError);
      return false;
    }

    console.log('   ✅ Test upload successful!');
    console.log('   File path:', uploadData.path);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('custom-cakes')
      .getPublicUrl(uploadData.path);

    console.log('   Public URL:', publicUrlData.publicUrl);

    // Clean up test file
    await supabase.storage.from('custom-cakes').remove([testFilePath]);
    console.log('   🧹 Test file cleaned up');

    return true;
  } catch (error) {
    console.error('\n❌ Supabase service test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('  GoldenMunch POS - Service Tests');
  console.log('========================================');

  const emailOk = await testEmailService();
  const supabaseOk = await testSupabaseService();

  console.log('\n========================================');
  console.log('  Test Results Summary');
  console.log('========================================\n');

  console.log('Email Service:', emailOk ? '✅ WORKING' : '❌ FAILED');
  console.log('Supabase Storage:', supabaseOk ? '✅ WORKING' : '❌ FAILED');

  if (!emailOk || !supabaseOk) {
    console.log('\n⚠️  Some services are not configured correctly.');
    console.log('   Please fix the issues above before deploying.\n');
    process.exit(1);
  }

  console.log('\n✅ All services are configured correctly!\n');
  process.exit(0);
}

main();
