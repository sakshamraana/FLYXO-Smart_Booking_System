const { buildSchema } = require('graphql');

const schema = buildSchema(`
  enum Role {
    USER
    ADMIN
    SUPER_ADMIN
  }

  enum SeatStatus {
    AVAILABLE
    LOCKED
    BOOKED
  }

  enum SeatType {
    REGULAR
    PREMIUM
    RECLINER
  }

  enum ScreenType {
    STANDARD
    IMAX
    FOUR_DX
    PREMIUM
  }

  enum BookingStatus {
    PENDING
    CONFIRMED
    CANCELLED
  }

  enum PaymentStatus {
    PENDING
    COMPLETED
    REFUNDED
    FAILED
  }

  type CheckoutSession {
    sessionId: String!
    checkoutUrl: String!
    bookingId: ID!
  }

  type Payment {
    id: ID!
    bookingId: ID!
    stripeSessionId: String
    stripePaymentIntentId: String
    amount: Float!
    currency: String!
    status: PaymentStatus!
    createdAt: String
    updatedAt: String
  }

  type Theatre {
    id: ID!
    name: String!
    description: String!
    address: String!
    city: String!
    state: String!
    pincode: String!
    phone: String!
    email: String!
    image: String!
    isActive: Boolean!
    createdAt: String
    updatedAt: String
    screens: [Screen!]
    shows: [Show!]
    admins: [User!]
  }

  type Screen {
    id: ID!
    theatreId: ID!
    name: String!
    screenNumber: Int!
    screenType: ScreenType!
    totalSeats: Int!
    isActive: Boolean!
    createdAt: String
    updatedAt: String
    theatre: Theatre
    seats: [Seat!]
  }

  type User {
    id: ID!
    name: String!
    email: String!
    phone: String!
    age: Int!
    role: Role!
    theatreId: ID
    theatre: Theatre
    isActive: Boolean!
    createdAt: String
    updatedAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Movie {
    id: ID!
    title: String!
    description: String!
    genre: String!
    duration: Int!
    language: String!
    rating: String!
    minimumAge: Int!
    thumbnail: String!
    releaseDate: String!
    isActive: Boolean!
    createdAt: String
    updatedAt: String
    shows: [Show]
  }

  type Show {
    id: ID!
    movieId: ID!
    theatreId: ID!
    screenId: ID!
    showDate: String!
    showTime: String!
    screen: String!
    language: String
    format: String
    totalSeats: Int!
    availableSeats: Int!
    price: Float!
    isActive: Boolean!
    createdAt: String
    updatedAt: String
    movie: Movie
    theatre: Theatre
    screenRef: Screen
  }

  type Seat {
    id: ID!
    screenId: ID!
    seatNumber: String!
    row: String!
    seatType: SeatType!
    price: Float!
    isActive: Boolean!
  }

  type ShowSeat {
    id: ID!
    showId: ID!
    seatId: ID!
    seatNumber: String!
    row: String!
    seatType: SeatType!
    price: Float!
    status: SeatStatus!
    lockedBy: Int
    lockedAt: String
  }

  type Booking {
    id: ID!
    userId: ID!
    showId: ID!
    seats: [String!]!
    totalAmount: Float!
    bookingReference: String!
    idProofType: String!
    idProofNumber: String!
    status: BookingStatus!
    paymentStatus: PaymentStatus!
    stripeSessionId: String
    stripePaymentIntentId: String
    createdAt: String
    updatedAt: String
    show: Show
    user: User
  }

  type DashboardStats {
    totalUsers: Int!
    totalMovies: Int!
    activeShows: Int!
    totalBookings: Int!
    totalRevenue: Float!
    recentBookings: [Booking!]!
  }

  type PlatformStats {
    totalTheatres: Int!
    totalScreens: Int!
    totalAdmins: Int!
    totalUsers: Int!
    totalMovies: Int!
    totalShows: Int!
    totalBookings: Int!
    totalRevenue: Float!
  }

  type LockResult {
    success: Boolean!
    message: String!
    expiresAt: String
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    phone: String!
    age: Int!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input TheatreInput {
    name: String!
    description: String!
    address: String!
    city: String!
    state: String!
    pincode: String!
    phone: String!
    email: String!
    image: String!
  }

  input ScreenInput {
    theatreId: ID!
    name: String!
    screenNumber: Int!
    screenType: ScreenType!
  }

  input MovieInput {
    title: String!
    description: String!
    genre: String!
    duration: Int!
    language: String!
    rating: String!
    minimumAge: Int!
    thumbnail: String!
    releaseDate: String!
  }

  input ShowInput {
    movieId: ID!
    theatreId: ID!
    screenId: ID!
    showDate: String!
    showTime: String!
    language: String
    format: String
    price: Float
  }

  input BookingInput {
    showId: ID!
    seats: [String!]!
    idProofType: String!
    idProofNumber: String!
  }

  input RowConfigInput {
    row: String!
    seatCount: Int!
    seatType: SeatType!
    price: Float!
  }

  input SeatLayoutInput {
    screenId: ID!
    rows: [RowConfigInput!]!
  }

  type Query {
    me: User
    users: [User!]!
    admins: [User!]!
    
    theatres(city: String): [Theatre!]!
    theatre(id: ID!): Theatre
    cities: [String!]!

    screens(theatreId: ID!): [Screen!]!
    screen(id: ID!): Screen
    seatsByScreen(screenId: ID!): [Seat!]!

    movies(includeInactive: Boolean): [Movie!]!
    movie(id: ID!): Movie
    moviesByTheatre(theatreId: ID!): [Movie!]!
    theatresByMovie(movieId: ID!): [Theatre!]!

    shows(movieId: ID, theatreId: ID, showDate: String): [Show!]!
    show(id: ID!): Show
    showsByTheatre(theatreId: ID!, showDate: String): [Show!]!
    showsByMovie(movieId: ID!, city: String, showDate: String): [Show!]!

    seats(showId: ID!): [ShowSeat!]!
    availableSeats(showId: ID!): Int!

    myBookings: [Booking!]!
    booking(id: ID!): Booking
    bookingBySession(sessionId: String!): Booking
    verifyPaymentSession(sessionId: String!): Booking
    allBookings(theatreId: ID): [Booking!]!
    
    dashboardStats(theatreId: ID): DashboardStats!
    platformStats: PlatformStats!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    createTheatre(input: TheatreInput!): Theatre!
    updateTheatre(id: ID!, input: TheatreInput!): Theatre!
    deactivateTheatre(id: ID!): Theatre!

    createAdmin(name: String!, email: String!, password: String!, phone: String!, age: Int!, theatreId: ID!): User!
    assignAdminToTheatre(userId: ID!, theatreId: ID!): User!
    updateAdmin(id: ID!, name: String!, phone: String!, theatreId: ID): User!

    createScreen(input: ScreenInput!): Screen!
    updateScreen(id: ID!, input: ScreenInput!): Screen!
    deleteScreen(id: ID!): Boolean!

    generateSeatLayout(input: SeatLayoutInput!): [Seat!]!

    createMovie(input: MovieInput!): Movie!
    updateMovie(id: ID!, input: MovieInput!): Movie!
    deleteMovie(id: ID!): Boolean!
    toggleMovieStatus(id: ID!): Movie!

    createShow(input: ShowInput!): Show!
    updateShow(id: ID!, input: ShowInput!): Show!
    deleteShow(id: ID!): Boolean!

    lockSeats(showId: ID!, seats: [String!]!): LockResult!
    releaseSeats(showId: ID!, seats: [String!]!): LockResult!

    createCheckoutSession(input: BookingInput!): CheckoutSession!
    createBooking(input: BookingInput!): Booking!
    cancelBooking(id: ID!): Booking!

    updateUserStatus(id: ID!, isActive: Boolean!): User!
    deleteUser(id: ID!): Boolean!
  }
`);

module.exports = schema;
