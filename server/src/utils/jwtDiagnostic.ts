import crypto from 'crypto';

/**
 * JWT Configuration Diagnostic Tool
 * Helps identify JWT secret configuration issues
 */

export interface JWTDiagnostic {
  hasJwtSecret: boolean;
  hasAdminJwtSecret: boolean;
  hasCashierJwtSecret: boolean;
  jwtSecretHash: string;
  adminJwtSecretHash: string;
  cashierJwtSecretHash: string;
  usingDefaultSecret: boolean;
  allSecretsMatch: boolean;
  recommendation: string;
}

/**
 * Get hash of a secret (first 8 chars) for comparison without exposing the actual secret
 */
function getSecretHash(secret: string): string {
  return crypto.createHash('md5').update(secret).digest('hex').substring(0, 8);
}

/**
 * Diagnose JWT configuration
 */
export function diagnoseJWTConfig(): JWTDiagnostic {
  const jwtSecret = process.env.JWT_SECRET || 'secret';
  const adminJwtSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'secret';
  const cashierJwtSecret = process.env.CASHIER_JWT_SECRET || process.env.JWT_SECRET || 'secret';

  const hasJwtSecret = !!process.env.JWT_SECRET;
  const hasAdminJwtSecret = !!process.env.ADMIN_JWT_SECRET;
  const hasCashierJwtSecret = !!process.env.CASHIER_JWT_SECRET;

  const jwtSecretHash = getSecretHash(jwtSecret);
  const adminJwtSecretHash = getSecretHash(adminJwtSecret);
  const cashierJwtSecretHash = getSecretHash(cashierJwtSecret);

  const usingDefaultSecret = jwtSecret === 'secret';
  const allSecretsMatch = jwtSecretHash === adminJwtSecretHash && adminJwtSecretHash === cashierJwtSecretHash;

  let recommendation = '';
  if (usingDefaultSecret) {
    recommendation = 'CRITICAL: Using default secret "secret". Create a .env file with secure JWT secrets!';
  } else if (!allSecretsMatch) {
    recommendation = 'WARNING: JWT secrets are different. This will cause "invalid signature" errors. Ensure ADMIN_JWT_SECRET and CASHIER_JWT_SECRET match JWT_SECRET or use the same value.';
  } else if (!hasAdminJwtSecret || !hasCashierJwtSecret) {
    recommendation = 'INFO: Using fallback secrets. Consider setting ADMIN_JWT_SECRET and CASHIER_JWT_SECRET explicitly.';
  } else {
    recommendation = 'OK: JWT configuration looks good.';
  }

  return {
    hasJwtSecret,
    hasAdminJwtSecret,
    hasCashierJwtSecret,
    jwtSecretHash,
    adminJwtSecretHash,
    cashierJwtSecretHash,
    usingDefaultSecret,
    allSecretsMatch,
    recommendation,
  };
}

/**
 * Log JWT diagnostic information to console
 */
export function logJWTDiagnostic(): void {
  const diagnostic = diagnoseJWTConfig();

  console.log('\n' + '='.repeat(60));
  console.log('JWT CONFIGURATION DIAGNOSTIC');
  console.log('='.repeat(60));
  console.log('Environment Variables:');
  console.log(`  JWT_SECRET:          ${diagnostic.hasJwtSecret ? '✓ Set' : '✗ Missing'} (hash: ${diagnostic.jwtSecretHash})`);
  console.log(`  ADMIN_JWT_SECRET:    ${diagnostic.hasAdminJwtSecret ? '✓ Set' : '✗ Missing'} (hash: ${diagnostic.adminJwtSecretHash})`);
  console.log(`  CASHIER_JWT_SECRET:  ${diagnostic.hasCashierJwtSecret ? '✓ Set' : '✗ Missing'} (hash: ${diagnostic.cashierJwtSecretHash})`);
  console.log('\nStatus:');
  console.log(`  Using default:       ${diagnostic.usingDefaultSecret ? '⚠ YES' : '✓ NO'}`);
  console.log(`  All secrets match:   ${diagnostic.allSecretsMatch ? '✓ YES' : '✗ NO'}`);
  console.log('\nRecommendation:');
  console.log(`  ${diagnostic.recommendation}`);
  console.log('='.repeat(60) + '\n');
}
