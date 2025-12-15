#!/bin/bash

# Fix TypeScript errors in Kiosk_Web

echo "🔧 Fixing TypeScript errors..."

# 1. Fix ListboxItem value prop (HeroUI v2 doesn't use 'value', only 'key')
echo "📝 Removing 'value' prop from ListboxItem components..."
find . -name "*.tsx" -type f -exec sed -i 's/value="\([^"]*\)" textValue=/textValue=/g' {} \;
find . -name "*.tsx" -type f -exec sed -i 's/value="\([^"]*\)">/>/g' {} \;

# 2. Fix OrbitControls props (enablePan -> makeDefault or remove)
echo "📝 Fixing OrbitControls props..."
find ./components/cake-editor -name "*.tsx" -type f -exec sed -i 's/enablePan={false}/makeDefault/g' {} \;
find ./components/cake-editor -name "*.tsx" -type f -exec sed -i 's/enableZoom={false}/maxDistance={10}/g' {} \;

# 3. Fix custom-cake sessionId -> sessionToken
echo "📝 Fixing CustomCakeSessionResponse properties..."
sed -i 's/session\.sessionId/session.sessionToken/g' ./app/custom-cake/page.tsx

# 4. Fix idle page style jsx prop
echo "📝 Fixing style jsx prop..."
sed -i 's/<style jsx>/<style>/g' ./app/idle/page.tsx

echo "✅ Automated fixes complete!"
echo "⚠️  Manual fixes still required for:"
echo "   - cart/page.tsx (enum usage)"
echo "   - MenuItem.categories property"
echo "   - primitives.ts module type"
