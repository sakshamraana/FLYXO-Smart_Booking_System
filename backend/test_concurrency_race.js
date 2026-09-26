require('dotenv').config();
const http = require('http');

const BASE_URL = 'http://127.0.0.1:5000';
const GRAPHQL_URL = `${BASE_URL}/graphql`;

async function graphqlRequest(query, variables = {}, token = null) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query, variables });
    const url = new URL(GRAPHQL_URL);

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method: 'POST',
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(new Error(`Failed to parse JSON response: ${data}`));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

async function runConcurrencyRaceTest() {
  console.log('=====================================================');
  console.log('    CONCURRENT SEAT BOOKING RACE CONDITION TEST      ');
  console.log('=====================================================\n');

  try {
    // 1. Login User A
    const loginA = await graphqlRequest(`
      mutation Login($input: LoginInput!) {
        login(input: $input) { token user { id email } }
      }
    `, { input: { email: 'user@cinebook.com', password: 'user123' } });
    const tokenA = loginA.data?.login?.token;

    // 2. Register/Login User B
    const userBEmail = `raceuser_${Date.now()}@example.com`;
    const regB = await graphqlRequest(`
      mutation Register($input: RegisterInput!) {
        register(input: $input) { token user { id email } }
      }
    `, { input: { name: 'Race User B', email: userBEmail, password: 'password123', phone: '9876500000', age: 25 } });
    const tokenB = regB.data?.register?.token;

    // 3. Get first available show ID
    const showsRes = await graphqlRequest(`
      query { shows { id availableSeats } }
    `, {}, tokenA);
    const showId = showsRes.data?.shows?.[0]?.id;

    console.log(`Targeting Show ID: ${showId} for simultaneous lock competition...`);

    const targetSeats = ['A1'];

    const { Seat, Show, ShowSeat } = require('./models');
    const show = await Show.findByPk(showId);
    const physicalSeat = await Seat.findOne({ where: { screenId: show.screenId, seatNumber: 'A1' } });
    if (physicalSeat) {
      await ShowSeat.update({ status: 'AVAILABLE', lockedBy: null, lockedAt: null }, { where: { showId, seatId: physicalSeat.id } });
    }

    console.log(`\n>>> Launching SIMULTANEOUS lock request for Seat A1 from User A and User B at exact same moment...`);

    const [resA, resB] = await Promise.all([
      graphqlRequest(`
        mutation LockSeats($showId: ID!, $seats: [String!]!) {
          lockSeats(showId: $showId, seats: $seats) {
            success
            message
          }
        }
      `, { showId, seats: targetSeats }, tokenA),

      graphqlRequest(`
        mutation LockSeats($showId: ID!, $seats: [String!]!) {
          lockSeats(showId: $showId, seats: $seats) {
            success
            message
          }
        }
      `, { showId, seats: targetSeats }, tokenB),
    ]);

    const successA = resA.data?.lockSeats?.success || false;
    const successB = resB.data?.lockSeats?.success || false;

    console.log('User A Result:', resA.data?.lockSeats || resA.errors?.[0]?.message);
    console.log('User B Result:', resB.data?.lockSeats || resB.errors?.[0]?.message);

    const isMutuallyExclusive = (successA && !successB) || (!successA && successB);
    if (isMutuallyExclusive) {
      console.log('\n[PASS] RACE CONDITION TEST PASSED: Exactly 1 user acquired the lock while the other was rejected!');
    } else {
      console.error('\n[FAIL] RACE CONDITION TEST FAILED: Concurrency violation detected!');
    }

    // Clean up
    if (successA) {
      await graphqlRequest(`
        mutation ReleaseSeats($showId: ID!, $seats: [String!]!) {
          releaseSeats(showId: $showId, seats: $seats) { success }
        }
      `, { showId, seats: targetSeats }, tokenA);
    } else if (successB) {
      await graphqlRequest(`
        mutation ReleaseSeats($showId: ID!, $seats: [String!]!) {
          releaseSeats(showId: $showId, seats: $seats) { success }
        }
      `, { showId, seats: targetSeats }, tokenB);
    }

    console.log('=====================================================\n');
    process.exit(isMutuallyExclusive ? 0 : 1);
  } catch (err) {
    console.error('Race test exception:', err);
    process.exit(1);
  }
}

runConcurrencyRaceTest();
