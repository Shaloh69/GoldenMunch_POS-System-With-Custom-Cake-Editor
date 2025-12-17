#!/bin/bash

# ============================================================================
# CashierAdmin Fix - Database Migrations Runner
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        CashierAdmin Dashboard - Database Migrations               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL client is not installed${NC}"
    echo "Please install MySQL client first"
    exit 1
fi

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-defaultdb}"
DB_USER="${DB_USER:-root}"

# Prompt for password if not set
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}Enter MySQL password for user '$DB_USER':${NC}"
    read -s DB_PASSWORD
    echo ""
fi

# Test database connection
echo -e "${BLUE}🔍 Testing database connection...${NC}"
if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" 2>/dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    echo "Host: $DB_HOST:$DB_PORT"
    echo "Database: $DB_NAME"
    echo "User: $DB_USER"
    exit 1
fi
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Migration files
MIGRATIONS=(
    "002_add_analytics_procedures.sql"
    "003_seed_sample_data.sql"
)

echo -e "${BLUE}📋 Migrations to run:${NC}"
for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$SCRIPT_DIR/$migration" ]; then
        echo -e "  ${GREEN}✓${NC} $migration"
    else
        echo -e "  ${RED}✗${NC} $migration (not found)"
    fi
done
echo ""

# Confirm before proceeding
echo -e "${YELLOW}⚠️  This will:${NC}"
echo "  1. Create stored procedures (GetTrendingItems, GetWasteReport, RecalculatePopularityScore)"
echo "  2. Add sample data (10 menu items, 10 customers, 25 orders)"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Migration cancelled${NC}"
    exit 0
fi
echo ""

# Run migrations
MIGRATION_COUNT=0
FAILED_COUNT=0

for migration in "${MIGRATIONS[@]}"; do
    MIGRATION_FILE="$SCRIPT_DIR/$migration"

    if [ ! -f "$MIGRATION_FILE" ]; then
        echo -e "${RED}❌ Migration file not found: $migration${NC}"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        continue
    fi

    echo -e "${BLUE}▶ Running: $migration${NC}"

    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_FILE" 2>&1 | tee /tmp/migration_output.txt; then
        echo -e "${GREEN}✅ Success: $migration${NC}"
        MIGRATION_COUNT=$((MIGRATION_COUNT + 1))
    else
        echo -e "${RED}❌ Failed: $migration${NC}"
        cat /tmp/migration_output.txt
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    echo ""
done

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    MIGRATION SUMMARY                               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Successful:${NC} $MIGRATION_COUNT"
if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "${RED}❌ Failed:${NC} $FAILED_COUNT"
fi
echo ""

# Verification
if [ $FAILED_COUNT -eq 0 ]; then
    echo -e "${BLUE}🔍 Verifying migrations...${NC}"
    echo ""

    # Check stored procedures
    echo -e "${YELLOW}Stored Procedures:${NC}"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
        SELECT ROUTINE_NAME, CREATED
        FROM information_schema.ROUTINES
        WHERE ROUTINE_SCHEMA = '$DB_NAME'
          AND ROUTINE_TYPE = 'PROCEDURE'
          AND ROUTINE_NAME IN ('GetTrendingItems', 'GetWasteReport', 'RecalculatePopularityScore')
        ORDER BY ROUTINE_NAME;
    "
    echo ""

    # Check sample data counts
    echo -e "${YELLOW}Sample Data Counts:${NC}"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
        SELECT
            CONCAT('Menu Items: ', COUNT(*)) as status FROM menu_item
        UNION ALL
        SELECT CONCAT('Customers: ', COUNT(*)) FROM customer
        UNION ALL
        SELECT CONCAT('Orders: ', COUNT(*)) FROM customer_order
        UNION ALL
        SELECT CONCAT('Order Items: ', COUNT(*)) FROM order_item
        UNION ALL
        SELECT CONCAT('Waste Records: ', COUNT(*)) FROM waste_tracking;
    "
    echo ""

    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           ✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!               ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "  1. Restart your backend server"
    echo "  2. Clear browser cache (localStorage.clear())"
    echo "  3. Visit dashboard pages to verify data displays"
    echo "  4. Check CASHIERADMIN_FIXES.md for detailed testing instructions"
    echo ""
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              ⚠️  SOME MIGRATIONS FAILED                           ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Please check the error messages above and fix any issues."
    exit 1
fi
