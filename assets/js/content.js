/*
  Your content lives here. Change these and the whole site updates.

  PROJECTS: one entry per video.
    category  podcast | conference | promo | studio | brand
    youtube   the ID after "watch?v=" in a YouTube link (e.g. "dQw4w9WgXcQ")
    vimeo     the number at the end of a Vimeo link (e.g. "76979871")
    file      or a short local mp4 in assets/video/ (keep it small, GitHub is not a video host)
    preview   a short silent loop that plays when someone hovers the tile (assets/video/...)
    poster    a still frame for the tile (assets/img/...)
  Leave any of them as '' and the site shows a clean placeholder instead.
*/

window.SITE = {
  name: 'Kutt',
  role: 'Video producer',
  email: 'damian16465@gmail.com',
  // Still frame shown on phones and while the reel loads
  heroPoster: 'assets/img/hero-poster.jpg',
  // Background reel: plays muted and looping behind the logo at the top of the home page
  heroReel: 'assets/video/hero-reel.mp4',
  socials: [
    { label: 'Instagram', url: 'https://www.instagram.com/damo.productions/' },
    { label: 'YouTube', url: 'https://www.youtube.com/@kuttmediaau' }
  ]
};

window.PROJECTS = [
  { title: 'The Weekly Sit-Down', client: 'Podcast series', category: 'podcast', year: '2026', duration: '00:58:12', youtube: '', vimeo: '', file: '', preview: '', poster: '' },
  { title: 'Main Stage Highlights', client: 'Annual conference', category: 'conference', year: '2026', duration: '00:02:40', youtube: '', vimeo: '', file: '', preview: '', poster: '' },
  { title: 'Spring Launch', client: 'Social promo', category: 'promo', year: '2026', duration: '00:00:30', youtube: '', vimeo: '', file: '', preview: '', poster: '' },
  { title: 'Founder Story', client: 'Talking head', category: 'studio', year: '2025', duration: '00:03:05', youtube: '', vimeo: '', file: '', preview: '', poster: '' },
  { title: 'Behind the Brand', client: 'Brand film', category: 'brand', year: '2025', duration: '00:01:45', youtube: '', vimeo: '', file: '', preview: '', poster: '' },
  { title: 'Clips That Travel', client: 'Podcast cut-downs', category: 'podcast', year: '2025', duration: '00:00:45', youtube: '', vimeo: '', file: '', preview: '', poster: '' },
  { title: 'Keynote Recap', client: 'Conference', category: 'conference', year: '2025', duration: '00:04:10', youtube: '', vimeo: '', file: '', preview: '', poster: '' }
];

window.CATEGORIES = {
  podcast: 'Podcasts',
  conference: 'Conferences',
  promo: 'Promos',
  studio: 'Studio',
  brand: 'Brand'
};
