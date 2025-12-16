#!/bin/bash

# Automated Shadcn/ui Migration Script
# This script replaces HeroUI imports with Shadcn/ui equivalents

cd /home/user/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Web

echo "🚀 Starting automated migration from HeroUI to Shadcn/ui..."

# Function to replace imports in a file
replace_imports() {
    local file=$1
    echo "📝 Migrating: $file"

    # Button
    sed -i 's|from "@heroui/button"|from "@/components/ui/button"|g' "$file"
    sed -i 's|import { Button }|import { Button }|g' "$file"

    # Card
    sed -i 's|from "@heroui/card"|from "@/components/ui/card"|g' "$file"
    sed -i 's|CardBody|CardContent as CardBody|g' "$file"

    # Input
    sed -i 's|from "@heroui/input"|from "@/components/ui/input"|g' "$file"

    # Badge/Chip
    sed -i 's|from "@heroui/badge"|from "@/components/ui/badge"|g' "$file"
    sed -i 's|from "@heroui/chip"|from "@/components/ui/badge"|g' "$file"
    sed -i 's|import { Chip }|import { Chip }|g' "$file"

    # Modal/Dialog
    sed -i 's|from "@heroui/modal"|from "@/components/ui/dialog"|g' "$file"
    sed -i 's|Modal,|Dialog as Modal,|g' "$file"
    sed -i 's|ModalContent|DialogContent as ModalContent|g' "$file"
    sed -i 's|ModalHeader|DialogHeader as ModalHeader|g' "$file"
    sed -i 's|ModalBody|ModalBody|g' "$file"
    sed -i 's|ModalFooter|DialogFooter as ModalFooter|g' "$file"

    # Select
    sed -i 's|from "@heroui/select"|from "@/components/ui/select"|g' "$file"

    # Spinner
    sed -i 's|from "@heroui/spinner"|from "@/components/ui/spinner"|g' "$file"
    sed -i 's|CircularProgress|Spinner as CircularProgress|g' "$file"

    # Switch
    sed -i 's|from "@heroui/switch"|from "@/components/ui/switch"|g' "$file"

    # Progress
    sed -i 's|from "@heroui/progress"|from "@/components/ui/progress"|g' "$file"

    # Divider/Separator
    sed -i 's|from "@heroui/divider"|from "@/components/ui/separator"|g' "$file"
    sed -i 's|import { Divider }|import { Divider }|g' "$file"

    # Link
    sed -i 's|from "@heroui/link"|from "@/components/ui/link"|g' "$file"

    # Navbar (will need manual handling)
    # sed -i 's|from "@heroui/navbar"|from "@/components/ui/navbar"|g' "$file"
}

# Migrate all TypeScript/TSX files in app directory
echo "📂 Migrating app directory..."
find app -name "*.tsx" -o -name "*.ts" | while read file; do
    replace_imports "$file"
done

# Migrate all TypeScript/TSX files in components directory
echo "📂 Migrating components directory..."
find components -name "*.tsx" -o -name "*.ts" | grep -v "components/ui" | while read file; do
    replace_imports "$file"
done

echo "✅ Automated migration complete!"
echo ""
echo "⚠️  Manual steps still needed:"
echo "1. Review navbar component usage"
echo "2. Check for any custom HeroUI hooks (useDisclosure now in dialog.tsx)"
echo "3. Test all pages"
echo "4. Remove HeroUI dependencies from package.json"
echo "5. Update tailwind.config.js"
