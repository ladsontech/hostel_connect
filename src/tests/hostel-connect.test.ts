import { 
  normalizeHostelName, 
  trigramSimilarity, 
  calculateGpsDistanceMeters, 
  checkForDuplicates 
} from '../lib/duplicate-detector';
import { recordLead, studentHasLoggedLead, getHostelAnalytics } from '../lib/lead-logger';
import { getDatabase } from '../lib/data-store';
import { formatUGX } from '../lib/utils';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('\n--- Running Hostel Connect Test Suite ---\n');

  // Test 1: Currency Formatting (NFR-12)
  console.log('1. Currency Formatting (UGX):');
  assert(formatUGX(1800000) === 'UGX 1,800,000', 'Formats 1,800,000 UGX correctly');
  assert(formatUGX(0) === 'UGX 0', 'Formats 0 UGX correctly');

  // Test 2: Name Normalization & Trigram Similarity (Section 5)
  console.log('\n2. Name Normalization & Trigram Similarity:');
  const norm1 = normalizeHostelName('Olympia Hostel Kikoni');
  const norm2 = normalizeHostelName('Olympia Residence');
  assert(norm1 === 'olympia' && norm2 === 'olympia', 'Strips stop words "hostel", "kikoni", "residence"');

  const sim = trigramSimilarity('Olympia Hostel Kikoni', 'Olympia Hostels');
  assert(sim >= 0.6, `High trigram similarity score (${sim.toFixed(2)} >= 0.6)`);

  // Test 3: GPS Proximity Calculation (Section 5: 75m threshold)
  console.log('\n3. GPS Proximity Calculation (Haversine Formula):');
  // Two points 50 meters apart
  const d1 = calculateGpsDistanceMeters(0.3345, 32.5621, 0.3348, 32.5623);
  assert(d1 <= 75, `Correctly identifies location within 75m threshold (${d1}m)`);

  // Two points 2 kilometers apart
  const d2 = calculateGpsDistanceMeters(0.3345, 32.5621, 0.3512, 32.6321);
  assert(d2 > 75, `Distinguishes locations far apart (${d2}m > 75m)`);

  // Test 4: Section 5 Complete Duplicate Check Engine
  console.log('\n4. Section 5 Duplicate Detection Engine:');
  const db = getDatabase();
  const dupCheck1 = checkForDuplicates(
    {
      name: 'Olympia Villa',
      lat: 0.3345,
      lng: 32.5621,
      custodianPhone: '+256772111222'
    },
    db.hostels,
    db.offers
  );
  assert(dupCheck1.isPotentialDuplicate === true, 'Correctly flags potential duplicate hostel');
  assert(dupCheck1.matchReasons.length > 0, 'Returns reasons for duplicate match');

  const dupCheck2 = checkForDuplicates(
    {
      name: 'Completely New Mbarara Campus Villa',
      lat: -0.6072,
      lng: 30.6545,
      custodianPhone: '+256799000111'
    },
    db.hostels,
    db.offers
  );
  assert(dupCheck2.isPotentialDuplicate === false, 'Passes brand new unique hostel without false positive');

  // Test 5: Lead Capture & Review Gating (FR-3.3 & BR-7)
  console.log('\n5. Lead Logging & Review Gating:');
  recordLead({
    studentId: 'test_student_123',
    hostelId: 'hst_olympia',
    type: 'whatsapp'
  });
  const hasLead = studentHasLoggedLead('test_student_123', 'hst_olympia');
  assert(hasLead === true, 'BR-7: Logs lead and qualifies student to leave review');

  const noLead = studentHasLoggedLead('unlogged_student_456', 'hst_olympia');
  assert(noLead === false, 'BR-7: Blocks review from student without logged lead');

  // Test 6: Seller Analytics (FR-9.1 & FR-9.3)
  console.log('\n6. Seller Analytics (FR-9.1 & FR-9.3):');
  const analytics = getHostelAnalytics('hst_olympia', 'semester');
  assert(analytics.totalLeads > 0, 'Aggregates contact taps, calls and WhatsApp leads');
  assert(Array.isArray(analytics.brokerBreakdown), 'Includes broker enquiry contribution breakdown');

  console.log('\nAll tests passed successfully!\n');
}

runTests().catch(err => {
  console.error('\nTest failed with error:', err);
  process.exit(1);
});
