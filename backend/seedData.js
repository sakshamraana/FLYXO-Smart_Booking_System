const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Movie,
  Theatre,
  Screen,
  Seat,
  Show,
  ShowSeat,
  Booking,
} = require('./models');

const seed = async () => {
  try {
    console.log('Syncing database for seeding...');

    // Disable foreign key checks to safely recreate tables without ER_FK_CANNOT_DROP_PARENT errors
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await sequelize.sync({ force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('Seeding Theatres...');
    const theatresData = [
      {
        name: 'PVR Chandigarh',
        description: 'Multiplex cinema featuring state-of-the-art Dolby Atmos sound and IMAX screens.',
        address: 'Elante Mall, Industrial Area Phase I',
        city: 'Chandigarh',
        state: 'Punjab',
        pincode: '160002',
        phone: '0172-5000111',
        email: 'pvr.chd@cinebook.com',
        image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: 'INOX Chandigarh',
        description: 'Premium luxury movie theatre experience with recliner seats and gourmet dining.',
        address: 'Nexus Elante, Plot No 178-178A',
        city: 'Chandigarh',
        state: 'Punjab',
        pincode: '160002',
        phone: '0172-5000222',
        email: 'inox.chd@cinebook.com',
        image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: 'Cinepolis Chandigarh',
        description: 'Immersive 4DX experience cinema with dynamic motion seats and ambient weather effects.',
        address: 'JTP Mall, Sector 17',
        city: 'Chandigarh',
        state: 'Punjab',
        pincode: '160017',
        phone: '0172-5000333',
        email: 'cinepolis.chd@cinebook.com',
        image: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: 'PVR Shimla',
        description: 'Scenic hill station cinema offering classic and modern cinematic masterpieces.',
        address: 'Mall Road, Near Town Hall',
        city: 'Shimla',
        state: 'Himachal Pradesh',
        pincode: '171001',
        phone: '0177-2800111',
        email: 'pvr.shimla@cinebook.com',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: 'INOX Delhi',
        description: 'Flagship multiplex cinema in Central Delhi featuring giant screen Laser projection.',
        address: 'Connaught Place, Inner Circle',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        phone: '011-40001111',
        email: 'inox.delhi@cinebook.com',
        image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
    ];

    const createdTheatres = await Theatre.bulkCreate(theatresData);

    console.log('Seeding Users & Admins...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedUserPassword = await bcrypt.hash('user123', 10);

    // Super Admin
    await User.create({
      name: 'Super Administrator',
      email: 'superadmin@cinebook.com',
      password: hashedAdminPassword,
      phone: '9999999999',
      age: 40,
      role: 'SUPER_ADMIN',
      theatreId: null,
      isActive: true,
    });

    // Default Legacy Admin (PVR Chandigarh)
    await User.create({
      name: 'Cinema Admin',
      email: 'admin@cinebook.com',
      password: hashedAdminPassword,
      phone: '9876543210',
      age: 35,
      role: 'ADMIN',
      theatreId: createdTheatres[0].id,
      isActive: true,
    });

    // Theatre Admins
    for (let i = 0; i < createdTheatres.length; i++) {
      const th = createdTheatres[i];
      await User.create({
        name: `${th.name} Manager`,
        email: `admin${i + 1}@cinebook.com`,
        password: hashedAdminPassword,
        phone: `987654320${i + 1}`,
        age: 32 + i,
        role: 'ADMIN',
        theatreId: th.id,
        isActive: true,
      });
    }

    // Regular Users
    await User.create({
      name: 'John Doe',
      email: 'user@cinebook.com',
      password: hashedUserPassword,
      phone: '9123456789',
      age: 22,
      role: 'USER',
      theatreId: null,
      isActive: true,
    });

    await User.create({
      name: 'Alex Smith',
      email: 'minor@cinebook.com',
      password: hashedUserPassword,
      phone: '9988776655',
      age: 15,
      role: 'USER',
      theatreId: null,
      isActive: true,
    });

    console.log('Seeding Screens & Physical Custom Seat Layouts...');

    // Helper to generate seat layout for a screen
    const generateLayout = async (screenId, rowConfigs) => {
      const seatsToCreate = [];
      let total = 0;
      for (const cfg of rowConfigs) {
        for (let num = 1; num <= cfg.count; num++) {
          seatsToCreate.push({
            screenId,
            seatNumber: `${cfg.row}${num}`,
            row: cfg.row,
            seatType: cfg.type,
            price: cfg.price,
            isActive: true,
          });
          total++;
        }
      }
      await Seat.bulkCreate(seatsToCreate);
      await Screen.update({ totalSeats: total }, { where: { id: screenId } });
    };

    // Theatre 1 (PVR Chandigarh) Screens
    const t1s1 = await Screen.create({
      theatreId: createdTheatres[0].id,
      name: 'Screen 1',
      screenNumber: 1,
      screenType: 'STANDARD',
      totalSeats: 0,
      isActive: true,
    });
    // 10 rows x 12 seats = 120 seats
    const rowsT1S1 = [
      ...['A', 'B', 'C', 'D'].map((r) => ({ row: r, count: 12, type: 'REGULAR', price: 200 })),
      ...['E', 'F', 'G', 'H'].map((r) => ({ row: r, count: 12, type: 'PREMIUM', price: 300 })),
      ...['I', 'J'].map((r) => ({ row: r, count: 12, type: 'RECLINER', price: 450 })),
    ];
    await generateLayout(t1s1.id, rowsT1S1);

    const t1s2 = await Screen.create({
      theatreId: createdTheatres[0].id,
      name: 'Screen 2 (IMAX)',
      screenNumber: 2,
      screenType: 'IMAX',
      totalSeats: 0,
      isActive: true,
    });
    // 8 rows x 10 seats = 80 seats
    const rowsT1S2 = [
      ...['A', 'B', 'C'].map((r) => ({ row: r, count: 10, type: 'REGULAR', price: 300 })),
      ...['D', 'E', 'F'].map((r) => ({ row: r, count: 10, type: 'PREMIUM', price: 450 })),
      ...['G', 'H'].map((r) => ({ row: r, count: 10, type: 'RECLINER', price: 600 })),
    ];
    await generateLayout(t1s2.id, rowsT1S2);

    // Theatre 2 (INOX Chandigarh) Screens
    const t2s1 = await Screen.create({
      theatreId: createdTheatres[1].id,
      name: 'Screen 1 (Custom Layout)',
      screenNumber: 1,
      screenType: 'PREMIUM',
      totalSeats: 0,
      isActive: true,
    });
    // Custom seating: A=12, B=12, C=10, D=10, E=8 (52 seats total)
    const rowsT2S1 = [
      { row: 'A', count: 12, type: 'REGULAR', price: 220 },
      { row: 'B', count: 12, type: 'REGULAR', price: 220 },
      { row: 'C', count: 10, type: 'PREMIUM', price: 320 },
      { row: 'D', count: 10, type: 'PREMIUM', price: 320 },
      { row: 'E', count: 8, type: 'RECLINER', price: 480 },
    ];
    await generateLayout(t2s1.id, rowsT2S1);

    // Theatre 3 (Cinepolis Chandigarh) Screen
    const t3s1 = await Screen.create({
      theatreId: createdTheatres[2].id,
      name: 'Screen 1 (4DX)',
      screenNumber: 1,
      screenType: 'FOUR_DX',
      totalSeats: 0,
      isActive: true,
    });
    const rowsT3S1 = [
      ...['A', 'B', 'C'].map((r) => ({ row: r, count: 10, type: 'PREMIUM', price: 350 })),
      ...['D', 'E', 'F'].map((r) => ({ row: r, count: 10, type: 'RECLINER', price: 500 })),
    ];
    await generateLayout(t3s1.id, rowsT3S1);

    // Theatre 4 (PVR Shimla) Screen
    const t4s1 = await Screen.create({
      theatreId: createdTheatres[3].id,
      name: 'Main Screen',
      screenNumber: 1,
      screenType: 'STANDARD',
      totalSeats: 0,
      isActive: true,
    });
    const rowsT4S1 = [
      ...['A', 'B', 'C', 'D'].map((r) => ({ row: r, count: 10, type: 'REGULAR', price: 180 })),
      ...['E', 'F'].map((r) => ({ row: r, count: 10, type: 'PREMIUM', price: 260 })),
    ];
    await generateLayout(t4s1.id, rowsT4S1);

    // Theatre 5 (INOX Delhi) Screen
    const t5s1 = await Screen.create({
      theatreId: createdTheatres[4].id,
      name: 'IMAX Laser Screen',
      screenNumber: 1,
      screenType: 'IMAX',
      totalSeats: 0,
      isActive: true,
    });
    const rowsT5S1 = [
      ...['A', 'B', 'C', 'D'].map((r) => ({ row: r, count: 12, type: 'REGULAR', price: 250 })),
      ...['E', 'F', 'G', 'H'].map((r) => ({ row: r, count: 12, type: 'PREMIUM', price: 380 })),
      ...['I', 'J'].map((r) => ({ row: r, count: 12, type: 'RECLINER', price: 550 })),
    ];
    await generateLayout(t5s1.id, rowsT5S1);

    console.log('Seeding Movies...');
    const moviesData = [
      {
        title: 'Cyberpulse 2099',
        description: 'In a futuristic cyberpunk metropolis, a rogue hacker uncovers a conspiracy that threatens to rewrite human consciousness.',
        genre: 'Sci-Fi / Action',
        duration: 148,
        language: 'English',
        rating: 'A',
        minimumAge: 18,
        thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
        releaseDate: '2026-06-15',
        isActive: true,
      },
      {
        title: 'Shadows of the Realm',
        description: 'An epic fantasy saga following a band of unlikely heroes as they journey into forgotten lands to seal an ancient demon portal.',
        genre: 'Fantasy / Adventure',
        duration: 165,
        language: 'English',
        rating: 'UA',
        minimumAge: 13,
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        releaseDate: '2026-07-01',
        isActive: true,
      },
      {
        title: 'The Great Starlight Express',
        description: 'A heartwarming animated musical journey about a young astronomer who discovers a train that travels between star constellations.',
        genre: 'Animation / Family',
        duration: 102,
        language: 'Hindi',
        rating: 'U',
        minimumAge: 0,
        thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        releaseDate: '2026-05-20',
        isActive: true,
      },
      {
        title: 'Midnight Heist',
        description: 'A high-octane thrill ride featuring a team of master thieves attempting to pull off the biggest vault raid in Monaco.',
        genre: 'Crime / Thriller',
        duration: 130,
        language: 'English',
        rating: 'UA',
        minimumAge: 13,
        thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
        releaseDate: '2026-08-01',
        isActive: true,
      },
    ];

    const createdMovies = await Movie.bulkCreate(moviesData);

    console.log('Seeding Shows & Automatic ShowSeats...');

    const today = new Date();
    const screensList = [t1s1, t1s2, t2s1, t3s1, t4s1, t5s1];

    for (let i = 0; i < createdMovies.length; i++) {
      const movie = createdMovies[i];

      // Schedule shows across multiple screens/theatres
      for (const scr of screensList) {
        // Find physical seats for this screen
        const physicalSeats = await Seat.findAll({ where: { screenId: scr.id } });
        if (physicalSeats.length === 0) continue;

        for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
          const showDate = new Date(today);
          showDate.setDate(today.getDate() + dayOffset);
          const dateStr = showDate.toISOString().split('T')[0];

          const showTimes = ['11:00 AM', '02:30 PM', '06:15 PM', '09:45 PM'];
          const selectedTime = showTimes[(i + dayOffset) % showTimes.length];

          const show = await Show.create({
            movieId: movie.id,
            theatreId: scr.theatreId,
            screenId: scr.id,
            showDate: dateStr,
            showTime: selectedTime,
            screen: scr.name,
            language: movie.language,
            format: scr.screenType === 'IMAX' ? 'IMAX 3D' : scr.screenType === '4DX' ? '4DX 3D' : '2D',
            totalSeats: physicalSeats.length,
            availableSeats: physicalSeats.length,
            price: 200,
            isActive: true,
          });

          // Generate ShowSeat records for each physical seat
          const showSeatsToCreate = physicalSeats.map((s) => ({
            showId: show.id,
            seatId: s.id,
            status: 'AVAILABLE',
          }));

          await ShowSeat.bulkCreate(showSeatsToCreate);
        }
      }
    }

    console.log('====================================================');
    console.log('Database Seeding Complete!');
    console.log('----------------------------------------------------');
    console.log('Credentials:');
    console.log('Super Admin: superadmin@cinebook.com / admin123');
    console.log('Admin (PVR Chandigarh): admin1@cinebook.com / admin123 (or admin@cinebook.com)');
    console.log('Admin (INOX Chandigarh): admin2@cinebook.com / admin123');
    console.log('Admin (Cinepolis Chandigarh): admin3@cinebook.com / admin123');
    console.log('Admin (PVR Shimla): admin4@cinebook.com / admin123');
    console.log('Admin (INOX Delhi): admin5@cinebook.com / admin123');
    console.log('Regular User: user@cinebook.com / user123');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seed();
