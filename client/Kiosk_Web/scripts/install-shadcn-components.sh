#!/bin/bash

# Install all required Shadcn/ui components for migration from HeroUI
# This script automates the installation of components

echo "🚀 Installing Shadcn/ui components..."

cd /home/user/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Web

# Core components needed based on HeroUI usage
COMPONENTS=(
  "button"
  "card"
  "input"
  "badge"
  "dialog"
  "select"
  "separator"
  "switch"
  "progress"
  "label"
  "spinner"
)

# Install each component using npx shadcn-ui add
for component in "${COMPONENTS[@]}"; do
  echo "Installing $component..."
  npx shadcn@latest add "$component" --yes --overwrite || echo "Component $component may already exist or failed"
done

echo "✅ All components installed!"
