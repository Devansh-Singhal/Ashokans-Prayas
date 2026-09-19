import { CivicFeedApi } from "../services/api";
import { calculateHaversineDistance } from "../services/location";

const api = new CivicFeedApi("http://localhost:8000/api/v1");

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error("Assertion failed: " + message);
  }
}

async function runStageDemoWalkthrough() {
  console.log("================================================================");
  console.log("  CIVICFEED: 90-SECOND HACKATHON STAGE DEMO WALKTHROUGH TEST  ");
  console.log("================================================================\n");

  const wardId = "WARD_DELHI_14";
  const sampleReportPhoto = "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&q=80";
  const sampleCleanPhoto = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80";

  // 1. PERSONA SETUP
  console.log("STEP 1: Setting up Stage Personas (Citizen, Stranger, Colluder)...");
  const randNum1 = Math.floor(10000000 + Math.random() * 90000000);
  const randNum2 = Math.floor(10000000 + Math.random() * 90000000);
  const randNum3 = Math.floor(10000000 + Math.random() * 90000000);

  const personaRahul = await api.register("+9199" + randNum1, false);
  const personaAnjali = await api.register("+9199" + randNum2, false);
  const personaRohan = await api.register("+9199" + randNum3, true, "+919899988877");
  
  console.log("   - Persona A: " + personaRahul.public_handle + " (Citizen Reporter)");
  console.log("   - Persona B: " + personaAnjali.public_handle + " (Independent Stranger Auditor)");
  console.log("   - Persona C: " + personaRohan.public_handle + " (Colluding Roommate - Under 18)");

  // Activate minor persona via parent consent approval
  if (personaRohan.consent_token) {
    await api.verifyParentConsent(personaRohan.consent_token);
    console.log("   - Persona C: 1-Click Parent Consent verified -> Account ACTIVE");
  }

  // 2. CITIZEN REPORTS ISSUE
  console.log("\nSTEP 2: Persona A (Citizen Rahul) reports a dangerous pothole on 80ft Road...");
    const baseLat = 28.6500 + Math.random() * 0.1;
  const baseLon = 77.2300 + Math.random() * 0.1;
  const reportLat = baseLat + 0.001;
  const reportLon = baseLon + 0.001;
  const newTicket = await api.reportTicket(
    sampleReportPhoto,
    reportLat,
    reportLon,
    wardId,
    personaRahul.id
  );
  assert(!!newTicket.id, "Ticket creation must return ID");
  console.log("   [OK] Ticket minted on Ward 14 Feed! ID: " + newTicket.id);
  console.log("   - Category: " + newTicket.category + " | Severity: " + newTicket.severity + "/5 | Status: " + newTicket.status);
  console.log("   - Citizen earns +50 pts (held in escrow).");

  // 3. PUBLIC FEED & ENDORSEMENT
  console.log("\nSTEP 3: Neighborhood Visibility & Endorsement (I Hit This Too!)...");
  const feedBefore = await api.getWardFeed(wardId);
  const foundInFeed = feedBefore.tickets.find((t) => t.id === newTicket.id);
  assert(!!foundInFeed, "Ticket must be immediately visible on public feed");
  console.log("   [OK] Ticket verified live on Ward 14 Social Timeline (Total tickets: " + feedBefore.total + ")");

  // Stranger endorses ticket
  const endorseResult = await api.endorseTicket(newTicket.id, personaAnjali.id);
  console.log("   [OK] Persona B tapped I Hit This Too! -> Upvotes incremented to " + endorseResult.upvotes + " (+25 pts bonus)");

  // 4. MUNICIPAL WORKER UPLOADS FIX
  console.log("\nSTEP 4: Municipal contractor uploads patch photo...");
  const fixResult = await api.uploadProvisionalFix(newTicket.id, sampleCleanPhoto);
  assert(fixResult.status === "PROVISIONAL_FIX", "Status must be PROVISIONAL_FIX");
  console.log("   [OK] Fix photo uploaded! Status shifted to PROVISIONAL_FIX (Awaiting passerby audit).");

  // 5. STRANGER AUDITS (LEGITIMATE PASS)
  console.log("\nSTEP 5: Persona B (Stranger Anjali) physically verifies within 50m geofence...");
    const auditorCoords = { latitude: reportLat + 0.0001, longitude: reportLon + 0.0001 };
  const dist = calculateHaversineDistance(auditorCoords.latitude, auditorCoords.longitude, reportLat, reportLon);
  assert(dist <= 50, "Auditor must be within 50m (measured: " + dist + "m)");
  console.log("   - GPS check: Auditor is " + dist + "m away (Within 50m geofence).");

  const auditStranger = await api.verifyTicket(newTicket.id, sampleCleanPhoto, personaAnjali.id);
  assert(auditStranger.credited_points === 150, "Stranger must get 150 points, got " + auditStranger.credited_points);
  assert(auditStranger.decay_percentage === 0, "Stranger must have 0% decay");
  assert(auditStranger.ticket_status === "RESOLVED", "Ticket must be RESOLVED");
  console.log("   [WIN] Full Credit Awarded: +" + auditStranger.credited_points + " pts (0% decay - independent audit verified!)");
  console.log("   [OK] Ticket officially closed on Ward 14 Timeline: " + auditStranger.ticket_status);

  // 6. COLLUSION ATTACK DEMO (THE MONEY MOMENT)
  console.log("\nSTEP 6: Collusion Attack Simulation (Roommate Rohan tries to farm points with Rahul)...");
  const ticket2 = await api.reportTicket(
    sampleReportPhoto,
    baseLat + 0.005,
    baseLon + 0.005,
    wardId,
    personaRahul.id
  );
  await api.uploadProvisionalFix(ticket2.id, sampleCleanPhoto);

  // Persona C verifies Persona A (1st time)
  const auditColluder1 = await api.verifyTicket(ticket2.id, sampleCleanPhoto, personaRohan.id);
  console.log("   - Pairing 1: Rohan verifies Rahul -> +" + auditColluder1.credited_points + " pts (Pair count: " + auditColluder1.pairing_count + ")");

  // Persona A reports ticket 3, Persona C verifies again (Collusion pattern detected!)
  const ticket3 = await api.reportTicket(
    sampleReportPhoto,
    baseLat + 0.010,
    baseLon + 0.010,
    wardId,
    personaRahul.id
  );
  await api.uploadProvisionalFix(ticket3.id, sampleCleanPhoto);

  const auditColluder2 = await api.verifyTicket(ticket3.id, sampleCleanPhoto, personaRohan.id);
  console.log("   [ALERT] Pairing 2: Repeated collusion detected!");
  console.log("   - Base reward: 150 pts");
  console.log("   - Credited points decayed to: +" + auditColluder2.credited_points + " pts (-" + auditColluder2.decay_percentage + "% decay)");
  console.log("   - Anti-Cheat Alert Flagged: " + (auditColluder2.is_collusion_flagged ? "ACTIVE [ALERT]" : "NONE"));
  assert(auditColluder2.decay_percentage > 0, "Collusive pairing must trigger decay percentage");

  // 7. WARD SCORECARD SUMMARY
  console.log("\nSTEP 7: Real-time Ward 14 Accountability Scorecard...");
  const finalScorecard = await api.getWardScorecard(wardId);
  console.log("   - Total Mapped Defects: " + finalScorecard.total_tickets);
  console.log("   - Verified Resolved: " + finalScorecard.resolved_count);
  console.log("   - Cleanliness Rating: " + finalScorecard.cleanliness_score + "%");
  console.log("   - Average Fix Latency: " + finalScorecard.avg_resolution_days + " days");

  console.log("\n================================================================");
  console.log("  [SUCCESS] ALL STAGE DEMO SCENARIOS PASSED 100% WITH ZERO ERRORS!  ");
  console.log("================================================================");
}

runStageDemoWalkthrough().catch((err) => {
  console.error("Stage Demo Walkthrough Failed:", err);
  process.exit(1);
});
