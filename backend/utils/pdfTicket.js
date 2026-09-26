const PDFDocument = require('pdfkit');

const generatePDFTicket = (booking, show, movie, user, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Stream PDF response directly to HTTP client
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=FLYXO_Ticket_${booking.bookingReference}.pdf`);
  doc.pipe(res);

  // Background Header Bar
  doc
    .rect(0, 0, doc.page.width, 90)
    .fill('#0f172a'); // Dark slate cinema color

  // Logo & Title
  doc
    .fillColor('#e11d48') // Crimson neon
    .fontSize(28)
    .font('Helvetica-Bold')
    .text('FLYXO', 40, 25);

  doc
    .fillColor('#94a3b8')
    .fontSize(12)
    .font('Helvetica')
    .text('Official E-Ticket & Entry Pass', 40, 58);

  doc
    .fillColor('#ffffff')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(`REF: ${booking.bookingReference}`, doc.page.width - 200, 35, { align: 'right' });

  doc.moveDown(4);

  // Card Outline
  const startY = 110;
  doc
    .roundedRect(40, startY, doc.page.width - 80, 420, 10)
    .lineWidth(1)
    .strokeColor('#cbd5e1')
    .stroke();

  // Movie Details Header Section
  doc
    .fillColor('#0f172a')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(movie.title, 60, startY + 20);

  doc
    .fillColor('#64748b')
    .fontSize(11)
    .font('Helvetica')
    .text(`${movie.genre} | ${movie.language} | ${movie.duration} Mins | Rating: ${movie.rating}`, 60, startY + 50);

  doc
    .moveTo(60, startY + 75)
    .lineTo(doc.page.width - 60, startY + 75)
    .strokeColor('#e2e8f0')
    .stroke();

  // Booking Breakdown Grid
  const detailsY = startY + 95;

  // Column 1
  doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold').text('SHOW DATE', 60, detailsY);
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica').text(show.showDate, 60, detailsY + 15);

  doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold').text('SHOW TIME', 60, detailsY + 50);
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica').text(show.showTime, 60, detailsY + 65);

  doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold').text('SCREEN / THEATER', 60, detailsY + 100);
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica').text(show.screen, 60, detailsY + 115);

  // Column 2
  const col2X = 300;
  doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold').text('PASSENGER / BOOKED BY', col2X, detailsY);
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica').text(`${user.name} (${user.phone})`, col2X, detailsY + 15);

  doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold').text('ID PROOF VERIFIED', col2X, detailsY + 50);
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica').text(`${booking.idProofType}: ${booking.idProofNumber}`, col2X, detailsY + 65);

  doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold').text('TOTAL AMOUNT PAID', col2X, detailsY + 100);
  doc.fillColor('#10b981').fontSize(14).font('Helvetica-Bold').text(`₹ ${booking.totalAmount.toFixed(2)}`, col2X, detailsY + 115);

  // Seats Highlight Box
  const seatBoxY = detailsY + 160;
  doc
    .roundedRect(60, seatBoxY, doc.page.width - 120, 60, 8)
    .fill('#f8fafc');

  const seatList = Array.isArray(booking.seats)
    ? booking.seats.join(', ')
    : typeof booking.seats === 'string'
    ? JSON.parse(booking.seats).join(', ')
    : booking.seats;

  doc.fillColor('#475569').fontSize(11).font('Helvetica-Bold').text('SEATS RESERVED:', 80, seatBoxY + 15);
  doc.fillColor('#e11d48').fontSize(18).font('Helvetica-Bold').text(seatList, 80, seatBoxY + 32);

  // Security Note & Instructions
  const footerNoteY = seatBoxY + 80;
  doc
    .fillColor('#64748b')
    .fontSize(9)
    .font('Helvetica-Oblique')
    .text('* Please present this ticket along with your original ID proof at the cinema entrance.', 60, footerNoteY);

  doc
    .text('* Entry is subject to minimum age verification requirements as mandated by government ratings.', 60, footerNoteY + 15);

  // Bottom Footer Bar
  doc
    .rect(0, doc.page.height - 40, doc.page.width, 40)
    .fill('#0f172a');

  doc
    .fillColor('#94a3b8')
    .fontSize(9)
    .font('Helvetica')
    .text('FLYXO Cinema Management System • Real-Time Automated Ticketing System', 40, doc.page.height - 25, {
      align: 'center',
    });

  doc.end();
};

module.exports = {
  generatePDFTicket,
};
