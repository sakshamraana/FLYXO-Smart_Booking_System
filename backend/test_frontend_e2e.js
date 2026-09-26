require('dotenv').config();
const http = require('http');
const { io: ioClient } = require('socket.io-client');

const BASE_URL = 'http://localhost:5000';
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

function httpGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve({ statusCode: res.statusCode, headers: res.headers, body: buffer });
      });
    }).on('error', reject);
  });
}

async function runFrontendE2ETest() {
  console.log('=====================================================');
  console.log('      CINEBOOK FRONTEND END-TO-END FLOW TESTS        ');
  console.log('=====================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition, stepName, details = '') {
    if (condition) {
      console.log(`[PASS] ${stepName}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${stepName} - ${details}`);
      failCount++;
    }
  }

  let userToken = '';
  let adminToken = '';
  let selectedMovieId = null;
  let selectedShowId = null;
  let createdBookingId = null;
  let bookingRef = null;

  try {
    // -----------------------------------------------------------------
    // USER END-TO-END FLOW
    // -----------------------------------------------------------------
    console.log('--- TESTING USER FLOW ---');

    // 1. Login user
    const userLoginRes = await graphqlRequest(`
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
          user { id name email role }
        }
      }
    `, {
      input: { email: 'user@cinebook.com', password: 'user123' }
    });

    const isUserLoginOK = userLoginRes.data && userLoginRes.data.login && userLoginRes.data.login.token;
    assert(isUserLoginOK, 'User Flow 1: User Login', JSON.stringify(userLoginRes.errors || {}));
    userToken = userLoginRes.data?.login?.token;

    // 2. Fetch Movies list (Home page)
    const moviesRes = await graphqlRequest(`
      query GetMovies {
        movies {
          id
          title
          rating
          genre
        }
      }
    `, {}, userToken);

    const hasMovies = moviesRes.data && Array.isArray(moviesRes.data.movies) && moviesRes.data.movies.length > 0;
    assert(hasMovies, 'User Flow 2: Movies List Fetch', `Found ${moviesRes.data?.movies?.length} movies`);
    selectedMovieId = moviesRes.data?.movies?.[0]?.id;

    // 3. Movie Details Query
    const movieDetailRes = await graphqlRequest(`
      query GetMovie($id: ID!) {
        movie(id: $id) {
          id
          title
          shows {
            id
            showDate
            showTime
            screen
            price
            availableSeats
          }
        }
      }
    `, { id: selectedMovieId }, userToken);

    const hasShows = movieDetailRes.data && movieDetailRes.data.movie && movieDetailRes.data.movie.shows.length > 0;
    assert(hasShows, 'User Flow 3: Movie Details & Shows', `Found ${movieDetailRes.data?.movie?.shows?.length} shows`);
    selectedShowId = movieDetailRes.data?.movie?.shows?.[0]?.id;

    // 4. Seats Query (Show Selection -> Seat Selection Page)
    const seatsRes = await graphqlRequest(`
      query GetShowAndSeats($showId: ID!) {
        show(id: $showId) {
          id
          price
          screen
        }
        seats(showId: $showId) {
          id
          seatNumber
          status
        }
      }
    `, { showId: selectedShowId }, userToken);

    const hasSeats = seatsRes.data && Array.isArray(seatsRes.data.seats) && seatsRes.data.seats.length > 0;
    assert(hasSeats, 'User Flow 4: Seat Map Layout', `Seats count: ${seatsRes.data?.seats?.length}`);

    // 5. Temporary Seat Locking
    const lockRes = await graphqlRequest(`
      mutation LockSeats($showId: ID!, $seats: [String!]!) {
        lockSeats(showId: $showId, seats: $seats) {
          success
          message
          expiresAt
        }
      }
    `, { showId: selectedShowId, seats: ['B3', 'B4'] }, userToken);

    const isLocked = lockRes.data && lockRes.data.lockSeats && lockRes.data.lockSeats.success;
    assert(isLocked, 'User Flow 5: Real-time Seat Locking', JSON.stringify(lockRes.errors || {}));

    // 6. ID Proof Entry & Booking Confirmation
    const bookingRes = await graphqlRequest(`
      mutation CreateBooking($input: BookingInput!) {
        createBooking(input: $input) {
          id
          bookingReference
          totalAmount
          seats
          status
        }
      }
    `, {
      input: {
        showId: selectedShowId,
        seats: ['B3', 'B4'],
        idProofType: 'AADHAR',
        idProofNumber: '999988887777',
      }
    }, userToken);

    const isBooked = bookingRes.data && bookingRes.data.createBooking && bookingRes.data.createBooking.id;
    assert(isBooked, 'User Flow 6 & 7: Booking Creation & Confirmation', JSON.stringify(bookingRes.errors || {}));
    createdBookingId = bookingRes.data?.createBooking?.id;
    bookingRef = bookingRes.data?.createBooking?.bookingReference;

    // 7. My Bookings Query
    const myBookingsRes = await graphqlRequest(`
      query GetMyBookings {
        myBookings {
          id
          bookingReference
          status
          seats
        }
      }
    `, {}, userToken);

    const hasMyBookings = myBookingsRes.data && Array.isArray(myBookingsRes.data.myBookings) && myBookingsRes.data.myBookings.some(b => b.id == createdBookingId);
    assert(hasMyBookings, 'User Flow 8: My Bookings Page View');

    // 8. PDF Ticket Stream Download
    const pdfRes = await httpGet(`/api/tickets/${bookingRef}/pdf`);
    const isPdfValid = pdfRes.statusCode === 200 && pdfRes.headers['content-type'] === 'application/pdf';
    assert(isPdfValid, 'User Flow 9: Download PDF Ticket Stream');

    // 9. Booking Cancellation
    const cancelRes = await graphqlRequest(`
      mutation CancelBooking($id: ID!) {
        cancelBooking(id: $id) {
          id
          status
        }
      }
    `, { id: createdBookingId }, userToken);

    const isCancelled = cancelRes.data && cancelRes.data.cancelBooking && cancelRes.data.cancelBooking.status === 'CANCELLED';
    assert(isCancelled, 'User Flow 10: Ticket Cancellation');

    // -----------------------------------------------------------------
    // ADMIN END-TO-END FLOW
    // -----------------------------------------------------------------
    console.log('\n--- TESTING ADMIN FLOW ---');

    // 1. Admin Login
    const adminLoginRes = await graphqlRequest(`
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
          user { id role }
        }
      }
    `, {
      input: { email: 'admin@cinebook.com', password: 'admin123' }
    });

    const isAdminLoginOK = adminLoginRes.data && adminLoginRes.data.login && adminLoginRes.data.login.user.role === 'ADMIN';
    assert(isAdminLoginOK, 'Admin Flow 1: Admin Login', JSON.stringify(adminLoginRes.errors || {}));
    adminToken = adminLoginRes.data?.login?.token;

    // 2. Admin Dashboard Stats Query
    const statsRes = await graphqlRequest(`
      query GetDashboardStats {
        dashboardStats {
          totalUsers
          totalMovies
          activeShows
          totalBookings
          totalRevenue
        }
      }
    `, {}, adminToken);

    const hasStats = statsRes.data && statsRes.data.dashboardStats && statsRes.data.dashboardStats.totalMovies >= 0;
    assert(hasStats, 'Admin Flow 2: Dashboard Metrics');

    // 3. Manage Movies Query
    const adminMoviesRes = await graphqlRequest(`
      query GetAdminMovies {
        movies(includeInactive: true) {
          id
          title
          isActive
        }
      }
    `, {}, adminToken);

    const hasAdminMovies = adminMoviesRes.data && Array.isArray(adminMoviesRes.data.movies);
    assert(hasAdminMovies, 'Admin Flow 3: Manage Movies Page');

    // 4. Manage Shows Query
    const adminShowsRes = await graphqlRequest(`
      query GetAdminShows {
        shows {
          id
          showDate
          showTime
          screen
        }
      }
    `, {}, adminToken);

    const hasAdminShows = adminShowsRes.data && Array.isArray(adminShowsRes.data.shows);
    assert(hasAdminShows, 'Admin Flow 4: Manage Shows Page');

    // 5. Manage Users Query
    const adminUsersRes = await graphqlRequest(`
      query GetUsers {
        users {
          id
          name
          email
          role
        }
      }
    `, {}, adminToken);

    const hasAdminUsers = adminUsersRes.data && Array.isArray(adminUsersRes.data.users);
    assert(hasAdminUsers, 'Admin Flow 5: Manage Users Page');

    // 6. Manage Bookings Query
    const adminBookingsRes = await graphqlRequest(`
      query GetAllBookings {
        allBookings {
          id
          bookingReference
          status
        }
      }
    `, {}, adminToken);

    const hasAdminBookings = adminBookingsRes.data && Array.isArray(adminBookingsRes.data.allBookings);
    assert(hasAdminBookings, 'Admin Flow 6: Master Bookings Page');

  } catch (err) {
    console.error('E2E Test Execution error:', err);
  }

  console.log('\n=====================================================');
  console.log(`TOTAL E2E STEPS PASSED: ${passCount} / ${passCount + failCount}`);
  console.log(`TOTAL E2E STEPS FAILED: ${failCount} / ${passCount + failCount}`);
  console.log('=====================================================\n');

  process.exit(failCount > 0 ? 1 : 0);
}

runFrontendE2ETest();
