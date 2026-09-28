/* ==========================================================================
   D TOUCH BARBER STUDIO — business information
   --------------------------------------------------------------------------
   Everything the site says about the business lives here. Anything left as
   null / '' / [] shows an elegant "coming soon" placeholder instead of
   invented details. Fill these in with real information only.
   ========================================================================== */
window.DTOUCH = {
  name: 'D Touch Barber Studio',
  tagline: 'Precision. Style. Every time.',

  // Link for every BOOK button (Booksy, Square, Fresha, StyleSeat, Vagaro…).
  // Leave as '#book' to scroll to the booking section instead.
  bookingUrl: '#book',

  // Contact / location — shown in the booking + footer sections.
  address: null,          // e.g. '123 Main St, City, ST 00000'
  mapsUrl: null,          // Google Maps link to the studio
  phone: null,            // e.g. '(555) 555-0123'
  email: null,
  instagram: null,        // e.g. 'https://instagram.com/dtouchbarberstudio'
  googleReviewsUrl: null, // link to the Google reviews page
  hours: [],              // e.g. [['Mon – Fri', '10am – 8pm'], ['Sat', '9am – 6pm'], ['Sun', 'Closed']]

  // Service menu. Set price / duration / description to real values;
  // null shows "—". Remove any service the studio doesn't offer.
  services: [
    { name: 'Haircut',          description: null, duration: null, price: null, image: 'studio', focus: '30% 70%' },
    { name: 'Haircut + Beard',  description: null, duration: null, price: null, image: 'clipper', focus: '50% 8%' },
    { name: 'Beard Service',    description: null, duration: null, price: null, image: 'clipper', focus: '50% 62%' },
    { name: 'Kids Haircut',     description: null, duration: null, price: null, image: 'studio', focus: '62% 72%' },
    { name: 'Line Up',          description: null, duration: null, price: null, image: 'clipper', focus: '50% 30%' },
  ],

  // Barbers. Add real names, specialties and portrait paths (e.g. 'assets/img/barbers/name.jpg').
  barbers: [
    { name: null, specialty: null, photo: null },
    { name: null, specialty: null, photo: null },
    { name: null, specialty: null, photo: null },
  ],

  // Before / after photos for "The D Touch Difference" (same framing works best).
  beforeImage: null,
  afterImage: null,

  // Real client reviews only: { name: 'Client name', text: '…', rating: 5 }
  reviews: [],
};
