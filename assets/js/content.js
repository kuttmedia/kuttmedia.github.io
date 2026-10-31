/*
  Your content lives here. Change these and the whole site updates.

  PROJECTS: one entry per video.
    category  talking | montage | podcast | conference | promo | brand
    youtube   the ID after "watch?v=" in a YouTube link (e.g. "dQw4w9WgXcQ")
    vimeo     the number at the end of a Vimeo link (e.g. "76979871")
    file      or a short local mp4 in assets/video/ (keep it small, GitHub is not a video host)
    preview   a short silent loop that plays when someone hovers the tile (assets/video/...)
    poster    a still frame for the tile (assets/img/... or the video's YouTube thumbnail)
    page      the project's own page in work/ (copy an existing one to make a new one)
  Leave any of them as '' and the site does without it.
  The filter buttons above the grid appear once there are 4 or more projects.
*/

window.SITE = {
  name: 'Kutt',
  role: 'Video Production',
  email: 'damian16465@gmail.com',
  // Still frame shown on phones and while the reel loads
  heroPoster: 'assets/img/hero-poster.jpg',
  // Background reel: plays muted and looping behind the logo at the top of the home page
  heroReel: 'assets/video/hero-reel.mp4',
  socials: [
    { label: 'Instagram', url: 'https://www.instagram.com/kutt.media/' },
    { label: 'YouTube', url: 'https://www.youtube.com/@kuttmediaau' }
  ],
  // Contact page enquiry form: the access key Web3Forms emailed you (it's meant to be public)
  formKey: '6a4be9f6-a04b-4d49-8f3d-59bc5848cfaa'
};

window.PROJECTS = [
  { title: 'Summernats 2026 has begun!', client: 'Event montage', category: 'montage', year: '2026', duration: '00:00:55', youtube: 'uzzW4Rr6o3g', vimeo: '', file: '', preview: '', poster: 'https://i.ytimg.com/vi/uzzW4Rr6o3g/maxresdefault.jpg', page: '/work/summernats-2026' },
  { title: 'Why I swapped to this Sony camera', client: 'YouTube video', category: 'talking', year: '2024', duration: '00:09:01', youtube: 'FWd09-X1tzw', vimeo: '', file: '', preview: '', poster: 'https://i.ytimg.com/vi/FWd09-X1tzw/maxresdefault.jpg', page: '/work/sony-camera-swap' }
];

window.CATEGORIES = {
  talking: 'Talking heads',
  montage: 'Montages',
  podcast: 'Podcasts',
  conference: 'Conferences',
  promo: 'Promos',
  brand: 'Brand'
};
