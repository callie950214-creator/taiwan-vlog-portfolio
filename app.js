// Global variables
let siteData = null;
let activeCategory = 'all';

// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const avatarEl = document.getElementById('avatar');
const nameEl = document.getElementById('profile-name');
const roleEl = document.getElementById('profile-role');
const bioEl = document.getElementById('profile-bio');
const locationEl = document.getElementById('profile-location');
const majorEl = document.getElementById('profile-major');
const universityEl = document.getElementById('profile-university');
const emailLink = document.getElementById('email-link');
const instagramLink = document.getElementById('instagram-link');
const footerBio = document.getElementById('footer-bio');
const timelineContainer = document.getElementById('timeline-container');
const skillsContainer = document.getElementById('skills-container');
const vlogGrid = document.getElementById('vlog-grid');
const filterBar = document.getElementById('filter-bar');

// Modal Elements
const modalOverlay = document.getElementById('modal-overlay');
const modalContainer = document.getElementById('modal-container');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalVideoWrapper = document.getElementById('modal-video-wrapper');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalMeta = document.getElementById('modal-meta');

// Document Ready
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await loadData();
  setupFilterBar();
  setupModalListeners();
});

// Theme Logic
function initTheme() {
  const savedTheme = localStorage.getItem('portfolio_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('portfolio_theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  themeToggleBtn.innerHTML = theme === 'dark' 
    ? '☀️' // Sun icon
    : '🌙'; // Moon icon
}

// Load Data (Local Storage override -> Fallback to data.json)
async function loadData() {
  const localDataStr = localStorage.getItem('taiwan_vlog_portfolio_data');
  
  if (localDataStr) {
    try {
      siteData = JSON.parse(localDataStr);
      console.log('Loaded data from LocalStorage');
    } catch (e) {
      console.error('Error parsing local storage data', e);
    }
  }

  if (!siteData) {
    try {
      const response = await fetch('data.json');
      siteData = await response.json();
      console.log('Loaded default data.json');
      // Save it to local storage to initialize
      localStorage.setItem('taiwan_vlog_portfolio_data', JSON.stringify(siteData));
    } catch (e) {
      console.error('Error fetching data.json', e);
      // Fallback fallback in case of CORS or local file loading constraints
      siteData = getFallbackData();
    }
  }

  renderPage();
}

// Rendering UI Parts
function renderPage() {
  if (!siteData) return;

  // Render Profile
  const profile = siteData.profile;
  if (avatarEl) avatarEl.src = profile.avatar || 'images/profile.jpg';
  if (nameEl) nameEl.textContent = profile.name;
  if (roleEl) roleEl.textContent = profile.target_role;
  if (bioEl) bioEl.textContent = profile.bio;
  if (locationEl) locationEl.innerHTML = `📍 ${profile.location}`;
  if (majorEl) majorEl.textContent = profile.major;
  if (universityEl) universityEl.textContent = profile.university;
  
  if (emailLink) {
    emailLink.href = `mailto:${profile.email}`;
    emailLink.textContent = profile.email;
  }
  if (instagramLink) {
    instagramLink.href = `https://instagram.com/${profile.instagram}`;
    instagramLink.textContent = `@${profile.instagram}`;
  }
  if (footerBio) footerBio.textContent = profile.bio;

  // Render Skills
  renderSkills();

  // Render Timeline
  renderTimeline();

  // Render Vlogs
  renderVlogs();
}

function renderSkills() {
  if (!skillsContainer || !siteData.skills) return;
  skillsContainer.innerHTML = '';
  
  // Custom design matching technical levels
  const badges = [];
  const progressItems = [];

  siteData.skills.forEach(skill => {
    // Determine if rendering as badge or progress bar (e.g. languages/tools)
    if (skill.level === 'Advanced' || skill.level === 'Fluent') {
      progressItems.push(skill);
    } else {
      badges.push(skill);
    }
  });

  // Render primary progress skills
  let html = '<div class="skills-grid">';
  siteData.skills.forEach(skill => {
    const percentage = getPercentageFromLevel(skill.level);
    html += `
      <div class="skill-item">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <h4>${skill.name}</h4>
          <span style="font-size:0.85rem; font-weight:700; color:var(--primary-color)">${skill.level}</span>
        </div>
        <div class="skill-bar-wrapper">
          <div class="skill-bar-fill" data-width="${percentage}%"></div>
        </div>
      </div>
    `;
  });
  html += '</div>';

  skillsContainer.innerHTML = html;

  // Trigger animation for skill bars
  setTimeout(() => {
    document.querySelectorAll('.skill-bar-fill').forEach(bar => {
      bar.style.width = bar.getAttribute('data-width');
    });
  }, 100);
}

function getPercentageFromLevel(level) {
  switch (level.toLowerCase()) {
    case 'fluent':
    case 'native':
    case 'expert':
      return 100;
    case 'advanced':
    case 'professional':
      return 85;
    case 'intermediate':
    case 'conversational':
      return 70;
    case 'beginner':
    case 'basic':
      return 45;
    default:
      return 75;
  }
}

function renderTimeline() {
  if (!timelineContainer || !siteData.timeline) return;
  timelineContainer.innerHTML = '';

  let html = '';
  siteData.timeline.forEach((item, index) => {
    const isLeft = index % 2 === 0;
    html += `
      <div class="timeline-item ${isLeft ? 'timeline-left' : 'timeline-right'}">
        <div class="timeline-content">
          <span class="timeline-time">${item.time}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
      </div>
    `;
  });

  timelineContainer.innerHTML = html;
}

function renderVlogs() {
  if (!vlogGrid || !siteData.vlogs) return;
  vlogGrid.innerHTML = '';

  const filteredVlogs = activeCategory === 'all'
    ? siteData.vlogs
    : siteData.vlogs.filter(vlog => vlog.category.toLowerCase() === activeCategory.toLowerCase());

  if (filteredVlogs.length === 0) {
    vlogGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-light);">
        <p>No vlogs posted in this category yet. Check back soon!</p>
      </div>
    `;
    return;
  }

  filteredVlogs.forEach(vlog => {
    const cover = vlog.coverImage || 'images/profile.jpg';
    const card = document.createElement('div');
    card.className = 'vlog-card';
    card.innerHTML = `
      <div class="vlog-thumbnail">
        <img src="${cover}" alt="${vlog.title}">
        <div class="play-overlay">
          <div class="play-btn-circle">▶</div>
        </div>
      </div>
      <div class="vlog-card-content">
        <div class="vlog-meta">
          <span class="vlog-category">${vlog.category}</span>
          <span class="vlog-date">${formatDate(vlog.date)}</span>
        </div>
        <h3>${vlog.title}</h3>
        <p>${vlog.description}</p>
        <div class="vlog-card-footer">
          <a href="#" class="watch-link">Watch Video ↗</a>
        </div>
      </div>
    `;

    // Click trigger to open modal player
    card.addEventListener('click', (e) => {
      e.preventDefault();
      openVideoPlayer(vlog);
    });

    vlogGrid.appendChild(card);
  });
}

function setupFilterBar() {
  if (!filterBar) return;
  
  filterBar.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      // Toggle active states
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');

      activeCategory = e.target.getAttribute('data-filter');
      renderVlogs();
    }
  });
}

// Custom Modal Video Player
function openVideoPlayer(vlog) {
  modalTitle.textContent = vlog.title;
  modalDesc.textContent = vlog.description;
  modalMeta.innerHTML = `
    <span class="vlog-category">${vlog.category}</span>
    <span class="vlog-date" style="margin-left: 10px;">Published: ${formatDate(vlog.date)}</span>
  `;

  // Render appropriate player based on type
  modalVideoWrapper.innerHTML = '';
  
  if (vlog.videoType === 'youtube') {
    // Convert watch link to embed format if not already
    let embedUrl = vlog.videoUrl;
    if (embedUrl.includes('watch?v=')) {
      embedUrl = embedUrl.replace('watch?v=', 'embed/');
    } else if (embedUrl.includes('youtu.be/')) {
      embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
    }
    
    // Add autoplay parameter
    if (!embedUrl.includes('?')) {
      embedUrl += '?autoplay=1';
    } else {
      embedUrl += '&autoplay=1';
    }

    modalVideoWrapper.innerHTML = `
      <iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    `;
  } else if (vlog.videoType === 'instagram') {
    // Embed Instagram URL
    let embedUrl = vlog.videoUrl;
    if (!embedUrl.endsWith('/embed')) {
      embedUrl = embedUrl.split('?')[0] + '/embed';
    }
    modalVideoWrapper.innerHTML = `
      <iframe src="${embedUrl}" class="instagram-media" allowtransparency="true" frameborder="0" scrolling="no"></iframe>
    `;
  } else if (vlog.videoType === 'embed') {
    // Normal embed url
    modalVideoWrapper.innerHTML = `
      <iframe src="${vlog.videoUrl}" allowfullscreen></iframe>
    `;
  } else {
    // Local Video file (MP4)
    modalVideoWrapper.innerHTML = `
      <video src="${vlog.videoUrl}" controls autoplay style="width:100%; height:100%; object-fit:contain;"></video>
    `;
  }

  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden'; // stop page scrolling
}

function closeVideoPlayer() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = ''; // restore scrolling
  
  // Clear HTML inside player wrapper to stop playing audio/video in background
  setTimeout(() => {
    modalVideoWrapper.innerHTML = '';
  }, 300);
}

function setupModalListeners() {
  modalCloseBtn.addEventListener('click', closeVideoPlayer);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeVideoPlayer();
    }
  });

  // Handle escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeVideoPlayer();
    }
  });
}

// Helper Date Formatter
function formatDate(dateStr) {
  if (!dateStr) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', options);
}

// Fallback database object in case of direct file opening issues (CORS on fetch data.json)
function getFallbackData() {
  return {
    "profile": {
      "name": "Phuong Le",
      "instagram": "phuongle439",
      "email": "phuongle.tw@gmail.com",
      "location": "Taipei, Taiwan",
      "university": "National Taiwan University",
      "major": "International Business & Content Marketing",
      "bio": "Hi there! I am a Vietnamese international student documenting my daily rhythm of study, creative work, and content creation in Taiwan. I love sharing positive vibes, learning Mandarin, and preparing for my upcoming internship at a tech company in Taipei. Let's connect!",
      "avatar": "images/profile.jpg",
      "target_role": "Marketing Specialist / Content Creator Intern"
    },
    "skills": [
      { "name": "Content Strategy & Copywriting", "level": "Advanced" },
      { "name": "Video Editing (Premiere, CapCut, DaVinci)", "level": "Advanced" },
      { "name": "Bilingual Communication (English, Vietnamese)", "level": "Fluent" },
      { "name": "Mandarin Chinese (TOCFL Band B / HSK 4)", "level": "Conversational" }
    ],
    "timeline": [
      { "time": "08:30 AM", "title": "Morning Lectures", "description": "Attending University courses in Taipei, learning business strategy and discussing cases with global peers." },
      { "time": "01:00 PM", "title": "Work & Collaboration", "description": "Working on part-time content strategy projects or collaborating on internship preparation tasks." },
      { "time": "04:30 PM", "title": "Vlog Shooting & Editing", "description": "Capturing beautiful spots in Taipei, recording voiceovers, and editing short-form content for social media." },
      { "time": "07:30 PM", "title": "Exploring Taiwan", "description": "Grabbing street food at Shilin or Raohe Night Market, learning local culture, and networking with friends." }
    ],
    "vlogs": [
      {
        "id": "vlog-1",
        "title": "A Day in my Life as a Vietnamese Student in Taipei",
        "description": "Come along with me for a busy Tuesday! Attending class, grabing a refreshing bubble tea, studying at a gorgeous cafe, and exploring the Taipei 101 area.",
        "category": "daily",
        "videoType": "youtube",
        "videoUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "coverImage": "images/profile.jpg",
        "date": "2026-06-15"
      }
    ]
  };
}
