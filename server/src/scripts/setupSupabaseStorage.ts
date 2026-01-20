import { supabase, STORAGE_BUCKETS, isSupabaseConfigured } from '../config/supabase';

/**
 * Setup script to create Supabase storage buckets
 * Run this once when setting up Supabase storage
 *
 * Usage: npx ts-node src/scripts/setupSupabaseStorage.ts
 */

async function setupStorageBuckets() {
  console.log('🚀 Setting up Supabase Storage Buckets...\n');

  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase is not configured!');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file');
    console.error('\nYou can get these from:');
    console.error('https://app.supabase.com/project/_/settings/api');
    process.exit(1);
  }

  const buckets = [
    {
      name: STORAGE_BUCKETS.PRODUCTS,
      description: 'Menu items, categories, cake flavors, and themes',
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    },
    {
      name: STORAGE_BUCKETS.PAYMENT_QR,
      description: 'Payment QR codes (GCash, PayMaya)',
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    },
    {
      name: STORAGE_BUCKETS.SESSION_QR,
      description: 'Custom cake session QR codes',
      public: true,
      fileSizeLimit: 2 * 1024 * 1024, // 2MB
      allowedMimeTypes: ['image/png'],
    },
    {
      name: STORAGE_BUCKETS.CUSTOM_CAKES,
      description: 'Custom cake 3D renders and reference images',
      public: true,
      fileSizeLimit: 15 * 1024 * 1024, // 15MB (supports multiple high-quality images)
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    },
  ];

  for (const bucket of buckets) {
    console.log(`📦 Creating bucket: ${bucket.name}`);
    console.log(`   Description: ${bucket.description}`);

    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error(`❌ Error listing buckets: ${listError.message}`);
      continue;
    }

    const bucketExists = existingBuckets?.some(b => b.name === bucket.name);

    if (bucketExists) {
      console.log(`   ✅ Bucket already exists\n`);
      continue;
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes,
    });

    if (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    } else {
      console.log(`   ✅ Created successfully\n`);
    }
  }

  console.log('✨ Storage bucket setup complete!\n');
  console.log('Next steps:');
  console.log('1. Verify buckets in Supabase Dashboard: https://app.supabase.com/project/_/storage/buckets');
  console.log('2. Make sure buckets are set to PUBLIC in the dashboard');
  console.log('3. Test uploading an image through your POS system\n');
}

// Run the setup
setupStorageBuckets()
  .then(() => {
    console.log('✅ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
