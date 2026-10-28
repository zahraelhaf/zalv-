import { runFullAuditSuite } from './src/tests/auditRunner.ts';

async function main() {
  console.log('===============================================================');
  console.log('   PATTERN JOURNAL STUDIO - COMPREHENSIVE AUDIT TEST SUITE   ');
  console.log('===============================================================\n');

  // Provide mock localStorage for Node.js environment if running under tsx
  if (typeof globalThis.localStorage === 'undefined') {
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => { store[key] = String(val); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    };
  }

  const suite = await runFullAuditSuite();

  console.log(`Execution Time: ${suite.timestamp}`);
  console.log(`Total Checks: ${suite.totalChecks}`);
  console.log(`PASS:       ${suite.passedCount}`);
  console.log(`FAIL:       ${suite.failedCount}`);
  console.log(`NOT TESTED: ${suite.notTestedCount}\n`);

  console.log('---------------------------------------------------------------');
  console.log('DETAILED AUDIT RESULTS:');
  console.log('---------------------------------------------------------------');

  suite.items.forEach((item, index) => {
    const statusLabel = item.status === 'PASS' ? '[PASS]' : item.status === 'FAIL' ? '[FAIL]' : '[NOT TESTED]';
    console.log(`\n${index + 1}. ${statusLabel} [${item.category.toUpperCase()}] ${item.title}`);
    console.log(`   Requirement: ${item.requirement}`);
    console.log(`   Finding:     ${item.finding}`);
    if (item.resolution) {
      console.log(`   Resolution:  ${item.resolution}`);
    }
  });

  console.log('\n===============================================================');
  if (suite.failedCount === 0) {
    console.log('  ALL AUDIT REQUIREMENTS PASSED VERIFICATION WITH 0 ERRORS!    ');
  } else {
    console.log(`  ATTENTION: ${suite.failedCount} AUDIT ITEMS REQUIRE RESOLUTION!`);
    process.exit(1);
  }
  console.log('===============================================================\n');
}

main().catch((err) => {
  console.error('Fatal Audit Test Error:', err);
  process.exit(1);
});
