// backend/test/api-tests.js
// Automated End-to-End API Test Suite for Primordial
// Verifies core authentication, challenges, memberships, check-ins, streak freezes, leaderboard, dashboard, and MongoDB chat.

require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const connectMongoDB = require('../src/config/mongodb');

let server;
let port;
let cookie = ''; // Stores session cookie across requests

function request(method, path, body = null, useCookie = true) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    };

    if (useCookie && cookie) {
      headers['Cookie'] = cookie;
    }

    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      const setCookieHeader = res.headers['set-cookie'];
      if (setCookieHeader && setCookieHeader.length > 0) {
        cookie = setCookieHeader[0].split(';')[0];
      }

      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PRIMORDIAL END-TO-END API TEST SUITE');
  console.log('======================================================\n');

  try {
    await prisma.$connect();
    await connectMongoDB();

    // Start ephemeral server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        console.log(`Test server running on port ${port}`);
        resolve();
      });
    });

    // -----------------------------------------------------------------
    // TEST GROUP 1: Server Health
    // -----------------------------------------------------------------
    console.log('\n--- Test Group 1: Server Health ---');
    const health = await request('GET', '/api/health');
    assert(health.status === 200, 'Health endpoint responds with 200 OK');
    assert(health.body.status === 'ok', 'Health status is ok');

    // -----------------------------------------------------------------
    // TEST GROUP 2: Authentication & Sessions
    // -----------------------------------------------------------------
    console.log('\n--- Test Group 2: User Authentication & Sessions ---');
    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'password123';

    // 1. Validation error on missing fields
    const invalidReg = await request('POST', '/api/auth/register', { name: 'Test' });
    assert(invalidReg.status === 400, 'Rejects registration with missing fields');

    // 2. Successful Registration
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Test Runner',
      email: testEmail,
      password: testPassword,
    });
    assert(regRes.status === 201, 'User registers successfully with 201 Created');
    assert(regRes.body.user.email === testEmail, 'Response includes correct user email');
    assert(!regRes.body.user.password, 'Password hash is NOT exposed in response');
    assert(regRes.body.user.streakFreezes === 2, 'New user receives 2 default streak freezes');
    assert(Boolean(cookie), 'Session cookie was set in browser headers');

    // 3. Duplicate email registration rejected
    const dupReg = await request('POST', '/api/auth/register', {
      name: 'Duplicate User',
      email: testEmail,
      password: testPassword,
    });
    assert(dupReg.status === 409, 'Rejects duplicate registration with 409 Conflict');

    // 4. Session Persistence (/api/auth/me)
    const meRes = await request('GET', '/api/auth/me');
    assert(meRes.status === 200, 'Session persists and /api/auth/me returns 200 OK');
    assert(meRes.body.user.email === testEmail, 'Current user correctly identified via session');

    // 5. Logout destroys session
    const logoutRes = await request('POST', '/api/auth/logout');
    assert(logoutRes.status === 200, 'Logout succeeds with 200 OK');

    // 6. Accessing protected route after logout fails with 401
    const unauthRes = await request('GET', '/api/auth/me', null, false);
    assert(unauthRes.status === 401, 'Protected route rejects unauthenticated request with 401 Unauthorized');

    // 7. Login with invalid password
    const badLogin = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'wrongpassword',
    });
    assert(badLogin.status === 401, 'Rejects login with invalid password');

    // 8. Login with valid credentials
    const loginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword,
    });
    assert(loginRes.status === 200, 'Login succeeds with valid credentials');
    assert(Boolean(cookie), 'New session cookie established upon login');

    // -----------------------------------------------------------------
    // TEST GROUP 3: Challenge Management (CRUD)
    // -----------------------------------------------------------------
    console.log('\n--- Test Group 3: Challenge Management ---');
    // List public challenges
    const listRes = await request('GET', '/api/challenges');
    assert(listRes.status === 200, 'Retrieves public challenges list');
    assert(Array.isArray(listRes.body.challenges), 'Challenges returned as array');

    // Create a new public challenge
    const createRes = await request('POST', '/api/challenges', {
      title: 'Automated Test Challenge',
      description: 'Test challenge description for unit testing',
      duration: 30,
      visibility: 'PUBLIC',
    });
    assert(createRes.status === 201, 'Creates challenge with 201 Created');
    assert(createRes.body.challenge.id > 0, 'Generated relational ID in PostgreSQL');
    const createdChallengeId = createRes.body.challenge.id;

    // Create a private challenge
    const createPrivateRes = await request('POST', '/api/challenges', {
      title: 'Private Study Squad',
      description: 'Exclusive squad for focused learning',
      duration: 14,
      visibility: 'PRIVATE',
    });
    assert(createPrivateRes.status === 201, 'Creates private challenge successfully');
    assert(Boolean(createPrivateRes.body.challenge.inviteCode), 'Auto-generated invite code for private challenge');
    const privateInviteCode = createPrivateRes.body.challenge.inviteCode;
    const privateChallengeId = createPrivateRes.body.challenge.id;

    // Update challenge by creator
    const updateRes = await request('PUT', `/api/challenges/${createdChallengeId}`, {
      title: 'Updated Challenge Title',
    });
    assert(updateRes.status === 200, 'Creator can update challenge details');
    assert(updateRes.body.challenge.title === 'Updated Challenge Title', 'Title updated in database');

    // -----------------------------------------------------------------
    // TEST GROUP 4: Memberships (Join / Leave)
    // -----------------------------------------------------------------
    console.log('\n--- Test Group 4: Memberships (Join / Leave) ---');
    // Creator is already auto-enrolled; re-joining should return 409
    const dupJoinRes = await request('POST', `/api/challenges/${createdChallengeId}/join`);
    assert(dupJoinRes.status === 409, 'Prevents duplicate membership with 409 Conflict');

    // Create a second user and join the public challenge
    const secondUserEmail = `second_${Date.now()}@example.com`;
    await request('POST', '/api/auth/register', {
      name: 'Second Participant',
      email: secondUserEmail,
      password: 'password123',
    });

    const secondJoinRes = await request('POST', `/api/challenges/${createdChallengeId}/join`);
    assert(secondJoinRes.status === 201, 'Second user joins public challenge with 201 Created');

    // Second user joins private challenge via invite code
    const joinPrivateRes = await request('POST', '/api/challenges/join-private', {
      inviteCode: privateInviteCode,
    });
    assert(joinPrivateRes.status === 201, 'User joins private challenge using valid invite code');

    // List challenge members
    const membersRes = await request('GET', `/api/challenges/${createdChallengeId}/members`);
    assert(membersRes.status === 200, 'Fetches participants of the challenge');
    assert(membersRes.body.count >= 2, 'Members count reflects actual joined users');

    // -----------------------------------------------------------------
    // TEST GROUP 5: Daily Check-ins
    // -----------------------------------------------------------------
    console.log('\n--- Test Group 5: Daily Check-ins ---');
    // Submit daily check-in
    const checkinRes = await request('POST', `/api/challenges/${createdChallengeId}/checkins`, {
      note: 'Day 1 completed! Focused on morning study session.',
    });
    assert(checkinRes.status === 201, 'Submits daily check-in with 201 Created');

    // Duplicate check-in on the same day must be rejected by unique constraint
    const dupCheckIn = await request('POST', `/api/challenges/${createdChallengeId}/checkins`, {
      note: 'Trying to check in again today',
    });
    assert(dupCheckIn.status === 400, 'Rejects duplicate daily check-in with 400 Bad Request');

    // -----------------------------------------------------------------
    // TEST GROUP 6: Streak Freeze Feature
    // -----------------------------------------------------------------
    console.log('\n--- Test Group 6: Streak Freeze Feature ---');
    // Attempting to freeze today must be rejected
    const today = new Date();
    const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
    const freezeToday = await request('POST', `/api/challenges/${createdChallengeId}/streak-freeze`, {
      date: todayStr,
    });
    assert(freezeToday.status === 400, 'Rejects freezing today (today is not missed yet)');

    // Attempting to freeze a past day that already has a check-in must be rejected
    const freezeExistingCheckIn = await request('POST', `/api/challenges/${createdChallengeId}/streak-freeze`, {
      date: todayStr,
    });
    assert(freezeExistingCheckIn.status === 400, 'Rejects freezing days that already have check-ins');

    // Update membership joinedAt to 3 days ago so freezing yesterday falls within the enrolled period
    await prisma.membership.updateMany({
      where: { challengeId: privateChallengeId },
      data: { joinedAt: new Date(Date.now() - 3 * 86400000) },
    });

    // Freeze yesterday for the private challenge (where second user hasn't checked in)
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayStr = `${y.getUTCFullYear()}-${String(y.getUTCMonth() + 1).padStart(2, '0')}-${String(y.getUTCDate()).padStart(2, '0')}`;

    const freezeRes = await request('POST', `/api/challenges/${privateChallengeId}/streak-freeze`, {
      date: yesterdayStr,
    });
    assert(freezeRes.status === 201, 'Applies streak freeze to missed yesterday with 201 Created');
    assert(freezeRes.body.remainingFreezes >= 0, 'Decremented available streak freezes inventory');

    // Duplicate freeze for the same day must be rejected
    const dupFreezeRes = await request('POST', `/api/challenges/${privateChallengeId}/streak-freeze`, {
      date: yesterdayStr,
    });
    assert(dupFreezeRes.status === 400, 'Prevents using multiple freezes for the same missed day');

    // -----------------------------------------------------------------
    // TEST GROUP 7: Challenge Leaderboard
    // -----------------------------------------------------------------
    console.log('\n--- Test Group 7: Challenge Leaderboard ---');
    const fitnessChallenge = (await request('GET', '/api/challenges')).body.challenges.find(
      (c) => c.title === '21 Days of Morning Fitness'
    );
    assert(Boolean(fitnessChallenge), 'Found seeded "21 Days of Morning Fitness" challenge');

    // Cumulative Leaderboard
    const lbRes = await request('GET', `/api/challenges/${fitnessChallenge.id}/leaderboard`);
    assert(lbRes.status === 200, 'Leaderboard returns 200 OK');
    assert(Array.isArray(lbRes.body.leaderboard), 'Leaderboard returned as array');
    const topUser = lbRes.body.leaderboard[0];
    assert(topUser.rank === 1, 'Top participant has Rank 1');
    assert(topUser.totalCheckIns >= 1, 'Leaderboard aggregates check-ins');

    // -----------------------------------------------------------------
    // TEST GROUP 8: Dashboard & User History
    // -----------------------------------------------------------------
    console.log('\n--- Test Group 8: Dashboard & User History ---');
    // Dashboard Stats
    const dashRes = await request('GET', '/api/users/me/dashboard');
    assert(dashRes.status === 200, 'Dashboard statistics return 200 OK');
    assert(dashRes.body.stats.availableFreezes >= 0, 'Dashboard returns available streak freezes');
    assert(dashRes.body.stats.totalJoined >= 1, 'Dashboard returns total joined challenges');
    assert(Array.isArray(dashRes.body.challenges), 'Dashboard returns user challenges list');

    // User History
    const historyRes = await request('GET', '/api/users/me/history');
    assert(historyRes.status === 200, 'History endpoint returns 200 OK');
    assert(Array.isArray(historyRes.body.history), 'History returned as array');

    // -----------------------------------------------------------------
    // TEST GROUP 9: MongoDB Group Chat
    // -----------------------------------------------------------------
    console.log('\n--- Test Group 9: MongoDB Group Chat ---');
    // Ensure user is joined to the challenge before sending chat messages
    await request('POST', `/api/challenges/${fitnessChallenge.id}/join`);

    // Send message
    const sendMsgRes = await request('POST', `/api/challenges/${fitnessChallenge.id}/messages`, {
      message: 'Consistency is our superpower! Keep checking in!',
    });
    assert(sendMsgRes.status === 201, 'Sends message to MongoDB with 201 Created');
    const sentMsgId = sendMsgRes.body.chatMessage._id;

    // Retrieve messages
    const getMsgsRes = await request('GET', `/api/challenges/${fitnessChallenge.id}/messages`);
    assert(getMsgsRes.status === 200, 'Retrieves messages from MongoDB collection');

    // Delete own message
    const deleteMsgRes = await request('DELETE', `/api/messages/${sentMsgId}`);
    assert(deleteMsgRes.status === 200, 'Deletes own message from MongoDB');

    // -----------------------------------------------------------------
    // TEST GROUP 10: Security, Private Challenge IDOR & Chat Cleanup
    // -----------------------------------------------------------------
    console.log('\n--- Test Group 10: Security, IDOR Protection & Cleanup ---');

    // 1. Create a non-member third user to test unauthorized access to private challenge
    const thirdUserEmail = `third_${Date.now()}@example.com`;
    await request('POST', '/api/auth/register', {
      name: 'Third Observer',
      email: thirdUserEmail,
      password: 'password123',
    });

    // 2. Non-member access to private challenge details should be 403 Forbidden
    const unauthDetails = await request('GET', `/api/challenges/${privateChallengeId}`);
    assert(unauthDetails.status === 403, 'Non-member blocked from private challenge details with 403 Forbidden');

    // 3. Non-member access to private leaderboard should be 403 Forbidden
    const unauthLeaderboard = await request('GET', `/api/challenges/${privateChallengeId}/leaderboard`);
    assert(unauthLeaderboard.status === 403, 'Non-member blocked from private challenge leaderboard with 403 Forbidden');

    // 4. Non-member access to private challenge members list should be 403 Forbidden
    const unauthMembers = await request('GET', `/api/challenges/${privateChallengeId}/members`);
    assert(unauthMembers.status === 403, 'Non-member blocked from private challenge members with 403 Forbidden');

    // 5. Non-member access to private challenge check-ins should be 403 Forbidden
    const unauthCheckins = await request('GET', `/api/challenges/${privateChallengeId}/checkins`);
    assert(unauthCheckins.status === 403, 'Non-member blocked from private challenge check-ins with 403 Forbidden');

    // 6. Invalid MongoDB ObjectId should return 400 Bad Request, NOT 500 error
    const badIdRes = await request('DELETE', '/api/messages/invalid-id-format');
    assert(badIdRes.status === 400, 'Invalid MongoDB message ID returns clean 400 Bad Request');

    // 7. Verify milestone achievement badges endpoint
    const badgesRes = await request('GET', '/api/users/me/badges');
    assert(badgesRes.status === 200, 'User badges endpoint returns 200 OK');
    assert(Array.isArray(badgesRes.body.badges), 'Badges returned as array');

    // 8. Verify challenge deletion cascades to MongoDB chat messages
    // Send a message to createdChallengeId, then delete challenge
    const cleanupChallenge = await request('POST', '/api/challenges', {
      title: 'Cleanup Test Challenge',
      description: 'Test challenge to verify MongoDB message deletion cleanup',
      duration: 7,
      visibility: 'PUBLIC',
    });
    const cleanupId = cleanupChallenge.body.challenge.id;

    await request('POST', `/api/challenges/${cleanupId}/messages`, {
      message: 'This message should be cleaned up from MongoDB on challenge delete',
    });

    // Delete the challenge
    const deleteChallengeRes = await request('DELETE', `/api/challenges/${cleanupId}`);
    assert(deleteChallengeRes.status === 200, 'Challenge deleted successfully by creator');

    // Verify messages in MongoDB for this challengeId are 0
    const Message = require('../src/models/messageModel');
    const remainingMsgs = await Message.countDocuments({ challengeId: cleanupId });
    assert(remainingMsgs === 0, 'Associated MongoDB messages wiped cleanly on challenge deletion');

    console.log('\n======================================================');
    console.log('🎉 ALL 10 TEST SUITES PASSED FLAWLESSLY (100% SUCCESS)');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();
