
// Simple client-side app — stores posts in localStorage as 'wandernotes_posts'
const postBtn = document.getElementById('postBtn');
const titleEl = document.getElementById('title');
const locationEl = document.getElementById('location');
const contentEl = document.getElementById('content');
const photoEl = document.getElementById('photo');
const preview = document.getElementById('preview');
const feed = document.getElementById('feed');
const q = document.getElementById('q');
const filterMood = document.getElementById('filterMood');
const status = document.getElementById('status');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');

const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalLoc = document.getElementById('modalLoc');
const modalContent = document.getElementById('modalContent');
const modalMood = document.getElementById('modalMood');

let posts = [];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }

// load
function load() {
    try {
        const raw = localStorage.getItem('wandernotes_posts');
        posts = raw ? JSON.parse(raw) : samplePosts();
    } catch (e) { posts = samplePosts() }
    render();
}

function samplePosts() {
    // a couple of example posts to make it look alive
    return [
        { id: uid(), title: 'Sunrise at Tiger Hill', location: 'Darjeeling, India', mood: 'relax', content: 'Woke up at 4:30am and watched the clouds roll under the hills. Tea shops open early nearby — a must!', photo: '', date: new Date().toISOString() },
        { id: uid(), title: 'Street Food Crawl', location: 'Kolkata, India', mood: 'food', content: 'Try the kathi rolls at Park Street and phuchka at Vivekananda Park. Cash-only stalls are the best.', photo: '', date: new Date().toISOString() }
    ]
}

function save() {
    localStorage.setItem('wandernotes_posts', JSON.stringify(posts));
    status.textContent = 'Saved locally in your browser.';
}

function render() {
    const term = q.value.trim().toLowerCase();
    const mood = filterMood.value;
    feed.innerHTML = '';
    const filtered = posts.filter(p => {
        if (mood !== 'all' && p.mood !== mood) return false;
        if (!term) return true;
        return (p.title + ' ' + p.location + ' ' + p.content).toLowerCase().includes(term);
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        feed.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--muted)">No posts yet — add your first story above!</div>';
        return;
    }

    filtered.forEach(p => {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
          <img src="${p.photo || placeholder(p.title)}" class="photo" loading="lazy" alt="${escapeHtml(p.title)}" />
          <div style="margin-top:8px">
            <div class="meta"><div class="small">${new Date(p.date).toLocaleDateString()}</div><div class="tag">${p.mood}</div></div>
            <div class="title">${escapeHtml(p.title)}</div>
            <div class="small" style="color:var(--muted)">${escapeHtml(p.location)}</div>
            <p class="excerpt">${escapeHtml(p.content.slice(0, 120))}${p.content.length > 120 ? '...' : ''}</p>
            <div class="actions">
              <button class="btn" data-id="${p.id}" data-action="open">Open</button>
              <button class="btn" data-id="${p.id}" data-action="delete">Delete</button>
            </div>
          </div>
        `;
        feed.appendChild(card);
    })
}

function placeholder(seed) {
    // small SVG placeholder encoded as data URI — keeps things self-contained
    const txt = encodeURIComponent(seed || 'photo');
    return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='480'><rect width='100%' height='100%' fill='%23072e3d'/><text x='50%' y='50%' fill='%23a8c0cf' font-size='28' dominant-baseline='middle' text-anchor='middle'>${txt}</text></svg>`
}

function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// photo preview and read as dataURL
photoEl.addEventListener('change', () => {
    const f = photoEl.files && photoEl.files[0];
    if (!f) { preview.style.display = 'none'; preview.src = ''; return }
    const r = new FileReader();
    r.onload = e => { preview.src = e.target.result; preview.style.display = 'block' };
    r.readAsDataURL(f);
})

postBtn.addEventListener('click', () => {
    const t = titleEl.value.trim();
    const loc = locationEl.value.trim();
    const c = contentEl.value.trim();
    const mood = document.getElementById('mood').value;
    if (!t || !loc || !c) {
        status.textContent = 'Please add a title, location and some content.'; return
    }
    // if photo chosen, read it synchronously via FileReader; otherwise empty string
    const f = photoEl.files && photoEl.files[0];
    if (f) {
        const r = new FileReader();
        r.onload = e => { createPost(t, loc, c, mood, e.target.result) }
        r.readAsDataURL(f);
    } else {
        createPost(t, loc, c, mood, '');
    }
})

function createPost(title, location, content, mood, photo) {
    const p = { id: uid(), title, location, content, mood, photo, date: new Date().toISOString() };
    posts.unshift(p);
    save();
    clearForm();
    render();
}

function clearForm() {
    titleEl.value = ''; locationEl.value = ''; contentEl.value = ''; photoEl.value = ''; preview.style.display = 'none'; preview.src = '';
}

// feed action delegation
feed.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const id = b.dataset.id; const act = b.dataset.action;
    if (act === 'open') { openPost(id) }
    if (act === 'delete') { if (confirm('Delete this post?')) { posts = posts.filter(p => p.id !== id); save(); render(); } }
})

function openPost(id) {
    const p = posts.find(x => x.id === id); if (!p) return;
    modalImg.src = p.photo || placeholder(p.title);
    modalTitle.textContent = p.title;
    modalLoc.textContent = p.location + ' • ' + new Date(p.date).toLocaleString();
    modalContent.textContent = p.content;
    modalMood.textContent = p.mood;
    modal.classList.add('open');
}

modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('open');
})

// search & filter
q.addEventListener('input', render);
filterMood.addEventListener('change', render);

// export JSON
exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'wandernotes_posts.json'; a.click(); URL.revokeObjectURL(url);
})

clearBtn.addEventListener('click', () => {
    if (confirm('This will remove all posts from your browser. Continue?')) {
        posts = []; save(); render();
    }
})

// basic keyboard shortcut: Ctrl+K focuses search
window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); q.focus(); }
})

// init
load();

// expose a tiny helper for dev
window.__wandernotes = { posts, save, render };
