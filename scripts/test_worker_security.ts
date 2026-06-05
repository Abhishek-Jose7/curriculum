import assert from "assert";

const BASE_URL = "http://127.0.0.1:8787";

async function runTests() {
  console.log("=== Starting Worker Security Integration Tests ===");

  // 1. Verify Dynamic CORS matching
  console.log("\n--- Test 1: Dynamic CORS Matching ---");
  {
    // Allowed Origin (from wrangler.json vars: http://localhost:3000)
    const res = await fetch(`${BASE_URL}/auth/token/`, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type"
      }
    });
    assert.strictEqual(res.headers.get("access-control-allow-origin"), "http://localhost:3000");
    assert.strictEqual(res.headers.get("access-control-allow-credentials"), "true");
    
    // Disallowed Origin (should default to first allowed origin or not reflect origin)
    const resDisallowed = await fetch(`${BASE_URL}/auth/token/`, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://malicious.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type"
      }
    });
    const allowOrigin = resDisallowed.headers.get("access-control-allow-origin");
    // Should NOT be http://malicious.com
    assert.notStrictEqual(allowOrigin, "http://malicious.com");
    console.log("CORS validation passed!");
  }

  // 2. Verify login and JIT Password migration
  console.log("\n--- Test 2: Login and JIT Password Hashing Migration ---");
  let facultyTokens: { access: string; refresh: string };
  let adminTokens: { access: string; refresh: string };
  {
    // Log in as Faculty (initially plaintext password)
    const res = await fetch(`${BASE_URL}/api/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "faculty@example.edu",
        password: "ChangeMe123!"
      })
    });
    assert.strictEqual(res.status, 200, "Initial login should succeed");
    facultyTokens = await res.json() as any;
    assert.ok(facultyTokens.access, "Should receive access token");
    assert.ok(facultyTokens.refresh, "Should receive refresh token");

    // Perform a second login with the same credentials.
    // The JIT migration should have kicked in, meaning the DB stored a PBKDF2 hash,
    // and this second login will successfully verify against the hash.
    const res2 = await fetch(`${BASE_URL}/api/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "faculty@example.edu",
        password: "ChangeMe123!"
      })
    });
    assert.strictEqual(res2.status, 200, "Second login (after migration) should succeed");
    console.log("Login and JIT migration verified successfully!");

    // Also log in as admin for later tests
    const resAdmin = await fetch(`${BASE_URL}/api/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.edu",
        password: "ChangeMe123!"
      })
    });
    assert.strictEqual(resAdmin.status, 200);
    adminTokens = await resAdmin.json() as any;
  }

  // 3. Verify Access & Refresh Token Lifetimes
  console.log("\n--- Test 3: Token Lifetimes ---");
  {
    const parseJwt = (token: string) => {
      const parts = token.split(".");
      return JSON.parse(Buffer.from(parts[1], "base64").toString());
    };

    const accessPayload = parseJwt(facultyTokens.access);
    const refreshPayload = parseJwt(facultyTokens.refresh);

    const accessDuration = accessPayload.exp - accessPayload.iat;
    const refreshDuration = refreshPayload.exp - refreshPayload.iat;

    console.log(`Access token duration: ${accessDuration} seconds (Expected: 900 / 15m)`);
    console.log(`Refresh token duration: ${refreshDuration} seconds (Expected: 604800 / 7d)`);

    assert.ok(accessDuration <= 900, "Access token lifetime must be <= 15 minutes");
    assert.ok(refreshDuration >= 600000 && refreshDuration <= 604800, "Refresh token lifetime must be 7 days");
    console.log("Token lifetimes verified successfully!");
  }

  // 4. Verify Token Rotation & Reuse Protection
  console.log("\n--- Test 4: Token Rotation and Reuse Protection ---");
  {
    // Refresh the token
    const res = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: facultyTokens.refresh })
    });
    assert.strictEqual(res.status, 200, "Token refresh should succeed");
    const newTokens = await res.json() as any;
    assert.ok(newTokens.access, "Should receive new access token");
    assert.ok(newTokens.refresh, "Should receive new refresh token");
    assert.notStrictEqual(newTokens.refresh, facultyTokens.refresh, "Refresh token should be rotated");

    // Try reusing the old refresh token (reuse attack detection)
    const resReuse = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: facultyTokens.refresh })
    });
    assert.strictEqual(resReuse.status, 401, "Token reuse should fail with 401");

    // Because reuse was detected, the active rotated refresh token should ALSO have been invalidated.
    // Let's test that the rotated refresh token is now rejected.
    const resNewBlocked = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: newTokens.refresh })
    });
    assert.strictEqual(resNewBlocked.status, 401, "Rotated token should be invalidated after reuse detection");
    console.log("Token rotation and reuse protection verified successfully!");
  }

  // 5. Verify Token Revocation
  console.log("\n--- Test 5: Token Revocation ---");
  {
    // Obtain a new pair of tokens
    const loginRes = await fetch(`${BASE_URL}/api/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "faculty@example.edu",
        password: "ChangeMe123!"
      })
    });
    const freshTokens = await loginRes.json() as any;

    // Revoke the refresh token
    const revokeRes = await fetch(`${BASE_URL}/api/auth/token/revoke/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: freshTokens.refresh })
    });
    assert.strictEqual(revokeRes.status, 200, "Revocation endpoint should return 200");
    assert.deepStrictEqual(await revokeRes.json(), { status: "revoked" });

    // Verify it is no longer usable
    const refreshRes = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: freshTokens.refresh })
    });
    assert.strictEqual(refreshRes.status, 401, "Revoked token should not be refreshable");
    console.log("Token revocation verified successfully!");
  }

  // 6. Verify Notification Ownership and Authorization Checks
  console.log("\n--- Test 6: Notification Ownership Authorization ---");
  {
    // Generate fresh tokens for Faculty (user ID 2) and Admin (user ID 1)
    const facultyLogin = await fetch(`${BASE_URL}/api/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "faculty@example.edu", password: "ChangeMe123!" })
    });
    const facTokens = await facultyLogin.json() as any;

    const adminLogin = await fetch(`${BASE_URL}/api/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.edu", password: "ChangeMe123!" })
    });
    const admTokens = await adminLogin.json() as any;

    // Create a notification for Admin (user_id = 1) using Admin account
    const createRes = await fetch(`${BASE_URL}/api/notifications/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${admTokens.access}`
      },
      body: JSON.stringify({
        user_id: "1",
        title: "Admin Notification",
        body: "Hello Admin"
      })
    });
    assert.strictEqual(createRes.status, 201);
    const adminNotif = await createRes.json() as any;

    // Create a notification for Faculty (user_id = 2) using Faculty account
    const createFacRes = await fetch(`${BASE_URL}/api/notifications/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${facTokens.access}`
      },
      body: JSON.stringify({
        title: "Faculty Notification",
        body: "Hello Faculty"
      })
    });
    assert.strictEqual(createFacRes.status, 201);
    const facultyNotif = await createFacRes.json() as any;

    // 6a. Access own notifications (should work)
    const facListRes = await fetch(`${BASE_URL}/api/notifications/`, {
      headers: { "Authorization": `Bearer ${facTokens.access}` }
    });
    assert.strictEqual(facListRes.status, 200);
    const facNotifs = await facListRes.json() as any[];
    assert.ok(facNotifs.some(n => n.id === facultyNotif.id), "Should list own notification");
    assert.ok(!facNotifs.some(n => n.id === adminNotif.id), "Should not list other's notification");

    // 6b. Retrieve someone else's notification detail (should fail with 403)
    const readOtherRes = await fetch(`${BASE_URL}/api/notifications/${adminNotif.id}/`, {
      headers: { "Authorization": `Bearer ${facTokens.access}` }
    });
    assert.strictEqual(readOtherRes.status, 403, "Reading other's notification should be forbidden");

    // 6c. Attempt to update someone else's notification (should fail with 403)
    const updateOtherRes = await fetch(`${BASE_URL}/api/notifications/${adminNotif.id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${facTokens.access}`
      },
      body: JSON.stringify({ is_read: true })
    });
    assert.strictEqual(updateOtherRes.status, 403, "Updating other's notification should be forbidden");

    // 6d. Attempt to delete someone else's notification (should fail with 403)
    const deleteOtherRes = await fetch(`${BASE_URL}/api/notifications/${adminNotif.id}/`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${facTokens.access}` }
    });
    assert.strictEqual(deleteOtherRes.status, 403, "Deleting other's notification should be forbidden");

    // 6e. Try to create notification for other user as Faculty (should fail with 403)
    const createIllegalRes = await fetch(`${BASE_URL}/api/notifications/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${facTokens.access}`
      },
      body: JSON.stringify({
        user_id: "1",
        title: "Malicious Notification",
        body: "Spam"
      })
    });
    assert.strictEqual(createIllegalRes.status, 403, "Faculty creating notification for admin should be forbidden");

    console.log("Notification ownership and authorization checks verified successfully!");
  }

  console.log("\n=== All Worker Security Integration Tests Passed! ===");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
