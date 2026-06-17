// Global state
let siteData = null;
let editingVlogId = null;

// DOM Elements - Profile Form
const profName = document.getElementById('prof-name');
const profRole = document.getElementById('prof-role');
const profBio = document.getElementById('prof-bio');
const profLocation = document.getElementById('prof-location');
const profUniversity = document.getElementById('prof-university');
const profMajor = document.getElementById('prof-major');
const profEmail = document.getElementById('prof-email');
const profInstagram = document.getElementById('prof-instagram');
const profileForm = document.getElementById('profile-form');

// DOM Elements - Vlog Form
const vlogTitle = document.getElementById('vlog-title');
const vlogDate = document.getElementById('vlog-date');
const vlogCategory = document.getElementById('vlog-category');
const vlogType = document.getElementById('vlog-type');
const vlogUrl = document.getElementById('vlog-url');
const vlogCover = document.getElementById('vlog-cover');
const vlogDesc = document.getElementById('vlog-desc');
const vlogForm = document.getElementById('vlog-form');
const vlogFormTitle = document.getElementById('vlog-form-title');
const btnCancelEdit = document.getElementById('btn-cancel-edit');

// DOM Elements - List & Actions
const dbVlogList = document.getElementById('db-vlog-list');
const btnExport = document.getElementById('btn-export');
const fileImport = document.getElementById('file-import');

// Document Ready
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
});

// Load Data
async function loadData() {
  const localDataStr = localStorage.getItem('taiwan_vlog_portfolio_data');
  
  if (localDataStr) {
    try {
      siteData = JSON.parse(localDataStr);
      console.log('Dashboard: Loaded data from LocalStorage');
    } catch (e) {
      console.error('Dashboard: Error parsing local data', e);
    }
  }

  if (!siteData) {
    try {
      const response = await fetch('data.json');
      siteData = await response.json();
      localStorage.setItem('taiwan_vlog_portfolio_data', JSON.stringify(siteData));
      console.log('Dashboard: Loaded data.json fallback');
    } catch (e) {
      console.error('Dashboard: Fetch error', e);
      siteData = getFallbackData();
    }
  }

  populateProfileForm();
  renderVlogList();
}

// Populate Forms
function populateProfileForm() {
  if (!siteData) return;
  const p = siteData.profile;
  if (profName) profName.value = p.name || '';
  if (profRole) profRole.value = p.target_role || '';
  if (profBio) profBio.value = p.bio || '';
  if (profLocation) profLocation.value = p.location || '';
  if (profUniversity) profUniversity.value = p.university || '';
  if (profMajor) profMajor.value = p.major || '';
  if (profEmail) profEmail.value = p.email || '';
  if (profInstagram) profInstagram.value = p.instagram || '';
}

// Render Vlogs List
function renderVlogList() {
  if (!dbVlogList || !siteData || !siteData.vlogs) return;
  dbVlogList.innerHTML = '';

  if (siteData.vlogs.length === 0) {
    dbVlogList.innerHTML = '<p style="color:var(--text-light); text-align:center; padding: 20px;">No videos uploaded yet.</p>';
    return;
  }

  siteData.vlogs.forEach(vlog => {
    const cover = vlog.coverImage || 'images/profile.jpg';
    const item = document.createElement('div');
    item.className = 'db-vlog-item';
    item.innerHTML = `
      <img src="${cover}" alt="cover" class="db-vlog-thumb">
      <div class="db-vlog-info">
        <h4>${vlog.title}</h4>
        <span>Category: <strong>${vlog.category}</strong> | Date: ${vlog.date}</span>
      </div>
      <div class="db-vlog-actions">
        <button class="action-btn-icon btn-edit" title="Edit Video">✏️</button>
        <button class="action-btn-icon btn-delete" title="Delete Video">🗑️</button>
      </div>
    `;

    // Edit Handler
    item.querySelector('.btn-edit').addEventListener('click', () => {
      startEditVlog(vlog);
    });

    // Delete Handler
    item.querySelector('.btn-delete').addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete "${vlog.title}"?`)) {
        deleteVlog(vlog.id);
      }
    });

    dbVlogList.appendChild(item);
  });
}

// Event Listeners Setups
function setupEventListeners() {

  // Save Profile
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveProfile();
    });
  }

  // Save/Update Vlog
  if (vlogForm) {
    vlogForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveVlog();
    });
  }

  // Cancel Edit Mode
  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
      resetVlogForm();
    });
  }

  // Export JSON
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      exportData();
    });
  }

  // Import JSON
  if (fileImport) {
    fileImport.addEventListener('change', (e) => {
      importData(e);
    });
  }

  // Helper dynamic video placeholder description
  if (vlogType) {
    vlogType.addEventListener('change', () => {
      updateUrlFieldLabel();
    });
  }
}

function updateUrlFieldLabel() {
  const type = vlogType.value;
  const label = document.querySelector('label[for="vlog-url"]');
  if (!label) return;

  if (type === 'local') {
    label.innerHTML = 'Video File Path <span style="font-weight:normal;color:var(--text-light)">(e.g., <code>videos/your-vlog.mp4</code>)</span>';
    vlogUrl.placeholder = 'videos/my_daily_life.mp4';
  } else if (type === 'youtube') {
    label.innerHTML = 'YouTube Video URL <span style="font-weight:normal;color:var(--text-light)">(e.g., watch link or embed link)</span>';
    vlogUrl.placeholder = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  } else if (type === 'instagram') {
    label.innerHTML = 'Instagram Reels/Post Link';
    vlogUrl.placeholder = 'https://www.instagram.com/reel/C3b4Xpky5d9/';
  } else {
    label.innerHTML = 'Video Embed URL / File Path';
    vlogUrl.placeholder = 'https://...';
  }
}

// Save Profile handler
function saveProfile() {
  if (!siteData) return;

  siteData.profile.name = profName.value;
  siteData.profile.target_role = profRole.value;
  siteData.profile.bio = profBio.value;
  siteData.profile.location = profLocation.value;
  siteData.profile.university = profUniversity.value;
  siteData.profile.major = profMajor.value;
  siteData.profile.email = profEmail.value;
  siteData.profile.instagram = profInstagram.value;

  saveToLocalStorage();
  alert('Profile updated successfully! Check your home page to see changes.');
}

// Delete Vlog handler
function deleteVlog(id) {
  siteData.vlogs = siteData.vlogs.filter(v => v.id !== id);
  saveToLocalStorage();
  renderVlogList();
}

// Start Editing Vlog (Populate form)
function startEditVlog(vlog) {
  editingVlogId = vlog.id;
  vlogTitle.value = vlog.title || '';
  vlogDate.value = vlog.date || '';
  vlogCategory.value = vlog.category || 'daily';
  vlogType.value = vlog.videoType || 'youtube';
  vlogUrl.value = vlog.videoUrl || '';
  vlogCover.value = vlog.coverImage || '';
  vlogDesc.value = vlog.description || '';

  updateUrlFieldLabel();
  
  if (vlogFormTitle) vlogFormTitle.textContent = 'Edit Vlog Post ✏️';
  if (btnCancelEdit) btnCancelEdit.style.display = 'inline-flex';
  
  // Smooth scroll to vlog form
  vlogForm.scrollIntoView({ behavior: 'smooth' });
}

// Reset Vlog Form
function resetVlogForm() {
  editingVlogId = null;
  vlogForm.reset();
  if (vlogFormTitle) vlogFormTitle.textContent = 'Add New Vlog Post 🎥';
  if (btnCancelEdit) btnCancelEdit.style.display = 'none';
  updateUrlFieldLabel();
}

// Save or Update Vlog
function saveVlog() {
  if (!siteData) return;

  const title = vlogTitle.value;
  const date = vlogDate.value;
  const category = vlogCategory.value;
  const type = vlogType.value;
  const url = vlogUrl.value;
  // Default to profile picture if cover image is omitted
  const cover = vlogCover.value || 'images/profile.jpg'; 
  const desc = vlogDesc.value;

  if (editingVlogId) {
    // Update existing
    const index = siteData.vlogs.findIndex(v => v.id === editingVlogId);
    if (index !== -1) {
      siteData.vlogs[index] = {
        id: editingVlogId,
        title,
        date,
        category,
        videoType: type,
        videoUrl: url,
        coverImage: cover,
        description: desc
      };
    }
  } else {
    // Add new
    const newId = 'vlog-' + Date.now();
    siteData.vlogs.unshift({
      id: newId,
      title,
      date,
      category,
      videoType: type,
      videoUrl: url,
      coverImage: cover,
      description: desc
    });
  }

  saveToLocalStorage();
  renderVlogList();
  resetVlogForm();
  alert(editingVlogId ? 'Video updated successfully!' : 'New video posted successfully!');
}

// Local Storage Helper
function saveToLocalStorage() {
  localStorage.setItem('taiwan_vlog_portfolio_data', JSON.stringify(siteData));
}

// Export data.json handler
function exportData() {
  if (!siteData) return;

  const dataStr = JSON.stringify(siteData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import data.json handler
function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const imported = JSON.parse(evt.target.result);
      
      // Verify basic schema
      if (imported.profile && imported.vlogs && Array.isArray(imported.vlogs)) {
        siteData = imported;
        saveToLocalStorage();
        populateProfileForm();
        renderVlogList();
        alert('Data successfully imported and applied! Refresh your home page to see the updates.');
      } else {
        alert('Invalid data.json file format. Ensure it matches the profile and vlogs schema.');
      }
    } catch (err) {
      console.error('Import error', err);
      alert('Error parsing uploaded JSON file.');
    }
  };
  reader.readAsText(file);
}

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
      "target_role": "Marketing Specialist / Content Creator Intern",
      "adminPasscode": "1234"
    },
    "skills": [
      { "name": "Content Strategy & Copywriting", "level": "Advanced" },
      { "name": "Video Editing (Premiere, CapCut, DaVinci)", "level": "Advanced" },
      { "name": "Bilingual Communication (English, Vietnamese)", "level": "Fluent" },
      { "name": "Mandarin Chinese (TOCFL Band B / HSK 4)", "level": "Conversational" }
    ],
    "timeline": [],
    "vlogs": []
  };
}
