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

async function runAuditTests() {
  console.log('=====================================================');
  console.log('       CINEBOOK BACKEND FULL AUDIT TEST SUITE        ');
  console.log('=====================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failCount++;
    }
  }

  try {
    // 1. Existing Register Mutation Test
    const userEmail = `user_audit_${Date.now()}@cinebook.com`;
    const regRes = await graphqlRequest(`
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          user { id email role age }
        }
      }
    `, { input: { name: 'Audit User', email: userEmail, password: 'user123', phone: '9988776655', age: 24 } });

    assert(regRes.data?.register?.token && regRes.data?.register?.user?.email === userEmail, '1. Existing Register Mutation');
    const userToken = regRes.data?.register?.token;

    // 2. Existing Login Mutation Test
    const loginRes = await graphqlRequest(`
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
          user { id email role theatreId }
        }
      }
    `, { input: { email: 'superadmin@cinebook.com', password: 'admin123' } });

    assert(loginRes.data?.login?.user?.role === 'SUPER_ADMIN', '2. Existing Login Mutation for Super Admin');
    const superAdminToken = loginRes.data?.login?.token;

    // 3. Login Admin 1 & Admin 2
    const admin1Login = await graphqlRequest(`
      mutation Login($input: LoginInput!) {
        login(input: $input) { token user { id role theatreId } }
      }
    `, { input: { email: 'admin1@cinebook.com', password: 'admin123' } });
    const admin1Token = admin1Login.data?.login?.token;
    const admin1TheatreId = admin1Login.data?.login?.user?.theatreId;

    const admin2Login = await graphqlRequest(`
      mutation Login($input: LoginInput!) {
        login(input: $input) { token user { id role theatreId } }
      }
    `, { input: { email: 'admin2@cinebook.com', password: 'admin123' } });
    const admin2Token = admin2Login.data?.login?.token;

    assert(admin1Token && admin2Token, '3. Multi-Admin Login');

    // 4. Multi-Admin Backend Isolation Test: Admin 1 attempts to create screen for Admin 2 Theatre
    const isolationRes = await graphqlRequest(`
      mutation CreateScreen($input: ScreenInput!) {
        createScreen(input: $input) { id name }
      }
    `, { input: { theatreId: 2, name: 'Hacked Screen', screenNumber: 99, screenType: 'STANDARD' } }, admin1Token);

    assert(isolationRes.errors && isolationRes.errors[0].message.includes('Access denied'), '4. Multi-Admin Scoping Backend Protection');

    // 5. Super Admin Platform Stats & Theatre Creation
    const platformStatsRes = await graphqlRequest(`
      query { platformStats { totalTheatres totalScreens totalAdmins totalRevenue } }
    `, {}, superAdminToken);

    assert(platformStatsRes.data?.platformStats?.totalTheatres >= 5, '5. Super Admin Platform Statistics Query');

    // 6. Admin Custom Seat Layout Generation Test on a New Screen
    const createNewScreenRes = await graphqlRequest(`
      mutation CreateScreen($input: ScreenInput!) {
        createScreen(input: $input) { id name }
      }
    `, { input: { theatreId: String(admin1TheatreId), name: 'Custom Screen Test', screenNumber: 10, screenType: 'STANDARD' } }, admin1Token);

    if (createNewScreenRes.errors) console.log('CreateNewScreen Errors:', createNewScreenRes.errors);
    const screenId = createNewScreenRes.data?.createScreen?.id;

    const generateLayoutRes = await graphqlRequest(`
      mutation GenerateSeatLayout($input: SeatLayoutInput!) {
        generateSeatLayout(input: $input) { id seatNumber row seatType price }
      }
    `, {
      input: {
        screenId: String(screenId),
        rows: [
          { row: 'A', seatCount: 10, seatType: 'REGULAR', price: 200 },
          { row: 'B', seatCount: 10, seatType: 'PREMIUM', price: 300 },
          { row: 'C', seatCount: 6, seatType: 'RECLINER', price: 450 },
        ],
      },
    }, admin1Token);

    if (generateLayoutRes.errors) {
      console.log('GenerateLayout Error:', generateLayoutRes.errors);
    }

    assert(generateLayoutRes.data?.generateSeatLayout?.length === 26, '6. Admin Custom Seat Layout Generation (26 seats)');

    // 7. Discovery Navigation Queries: Theatres by City & Movies by Theatre
    const cityTheatresRes = await graphqlRequest(`
      query { theatres(city: "Chandigarh") { id name city } cities }
    `);

    assert(cityTheatresRes.data?.theatres?.length >= 3 && cityTheatresRes.data?.cities?.includes('Chandigarh'), '7. Discovery Navigation (Theatres by City & City list)');

    // 8. Create Show with Automatic ShowSeat Generation
    const createShowRes = await graphqlRequest(`
      mutation CreateShow($input: ShowInput!) {
        createShow(input: $input) { id showDate showTime screen totalSeats availableSeats }
      }
    `, {
      input: {
        movieId: "1",
        theatreId: String(admin1TheatreId),
        screenId: String(screenId),
        showDate: '2026-09-01',
        showTime: '19:30 PM',
        language: 'English',
        format: 'IMAX 3D',
        price: 250,
      },
    }, admin1Token);

    if (createShowRes.errors) console.log('CreateShow Errors:', createShowRes.errors);
    assert(createShowRes.data?.createShow?.id && createShowRes.data?.createShow?.totalSeats === 26, '8. Show Creation & Automatic ShowSeat Generation');

    const createdShowId = createShowRes.data?.createShow?.id;

    // 9. Real-Time Seat Lock Test
    const lockRes = await graphqlRequest(`
      mutation LockSeats($showId: ID!, $seats: [String!]!) {
        lockSeats(showId: $showId, seats: $seats) { success message expiresAt }
      }
    `, { showId: createdShowId, seats: ['A1', 'C1'] }, userToken);

    if (lockRes.errors) console.log('LockRes Errors:', lockRes.errors);
    assert(lockRes.data?.lockSeats?.success === true, '9. Real-Time Seat Lock (A1, C1)');

    // 10. Booking Creation & Backend Price Calculation
    const bookingRes = await graphqlRequest(`
      mutation CreateBooking($input: BookingInput!) {
        createBooking(input: $input) {
          id bookingReference totalAmount seats status
        }
      }
    `, {
      input: {
        showId: createdShowId,
        seats: ['A1', 'C1'],
        idProofType: 'AADHAR',
        idProofNumber: '123456789012',
      },
    }, userToken);

    if (bookingRes.errors) console.log('BookingRes Errors:', bookingRes.errors);
    // A1 = 200, C1 = 450 => Total = 650
    assert(bookingRes.data?.createBooking?.id && bookingRes.data?.createBooking?.totalAmount === 650, '10. Create Booking with Backend Price Calculation (650)');

    console.log('\n=====================================================');
    console.log(` AUDIT SUMMARY: Passed: ${passCount} | Failed: ${failCount}`);
    console.log('=====================================================\n');

    process.exit(failCount === 0 ? 0 : 1);
  } catch (err) {
    console.error('Audit exception:', err);
    process.exit(1);
  }
}

runAuditTests();
