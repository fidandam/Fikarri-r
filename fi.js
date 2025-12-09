// ----- Small helpers
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Smooth scroll for same-page anchors
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    }
  });
});

// Footer year
$('#year').textContent = new Date().getFullYear();

// ----- State
let role = 'Student';
let selectedTags = new Set(['Startups']); // default
const TAGS = [
  'Product', 'Software', 'Data', 'Cybersecurity', 'Marketing', 'UX/UI',
  'Finance', 'Sales', 'Sustainability', 'Startups', 'Project Mgmt', 'Career switch'
];

// ----- Role toggle
const roleStudent = $('#roleStudent');
const rolePro = $('#rolePro');

function setRole(next) {
  role = next;
  roleStudent.setAttribute('aria-pressed', String(role === 'Student'));
  rolePro.setAttribute('aria-pressed', String(role === 'Professional'));
}
roleStudent.addEventListener('click', () => setRole('Student'));
rolePro.addEventListener('click', () => setRole('Professional'));

// ----- Tags UI
const tagsWrap = $('#tags');

function renderTags() {
  tagsWrap.innerHTML = '';
  TAGS.forEach(t => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tag';
    const on = selectedTags.has(t);
    b.setAttribute('aria-pressed', String(on));
    b.textContent = t;
    b.addEventListener('click', () => {
      const currentlyOn = selectedTags.has(t);
      if (currentlyOn) {
        selectedTags.delete(t);
      } else {
        if (selectedTags.size >= 5) {
          toast('Pick up to 5 interests');
          return;
        }
        selectedTags.add(t);
      }
      renderTags();
    });
    tagsWrap.appendChild(b);
  });
}
renderTags();

// ----- Toast
const toastEl = $('#toast');
let toastTimer = null;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.style.display = 'none';
  }, 2200);
}

// ----- Simple curated "match" generator (client-side MVP)
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function makeMatch(payload) {
  const professionals = [
    { name: 'Sara', title: 'Product Manager', org: 'FinTech (Stockholm)', topic: 'Breaking into Product in Sweden' },
    { name: 'Jonas', title: 'Data Analyst', org: 'Retail (Göteborg)', topic: 'Portfolios that get interviews' },
    { name: 'Amina', title: 'Security Engineer', org: 'SaaS (Malmö)', topic: 'Cybersecurity: a 90-day roadmap' },
    { name: 'Erik', title: 'Software Engineer', org: 'Startup (Uppsala)', topic: 'How to land your first SWE role' },
  ];
  const students = [
    { name: 'Elin', title: 'CS Student', org: 'KTH', topic: 'Internships + learning strategy' },
    { name: 'Omar', title: 'Business Student', org: 'Stockholm University', topic: 'Networking without awkwardness' },
    { name: 'Maja', title: 'Design Student', org: 'Konstfack', topic: 'Portfolio feedback over fika' },
    { name: 'Noah', title: 'Data Student', org: 'Chalmers', topic: 'Getting real projects early' },
  ];

  const isStudent = payload.role === 'Student';
  const counterpart = isStudent ? pick(professionals) : pick(students);
  const primaryTag = payload.tags[0] || 'Career';
  const topic = payload.about.length > 20 ? `${primaryTag}: ${counterpart.topic}` : counterpart.topic;

  return {
    personName: counterpart.name,
    personTitle: counterpart.title,
    personOrg: counterpart.org,
    meeting: payload.meeting,
    topic,
    nextStep: "You’re in! We’ll email you suggested matches and an intro message."
  };
}

// ----- Form handling
const form = $('#waitlistForm');
const errorBox = $('#errorBox');
const submitBtn = $('#submitBtn');
const resultArea = $('#resultArea');

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
}
function clearError() {
  errorBox.textContent = '';
  errorBox.style.display = 'none';
}
function validEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email.trim());
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const payload = {
    role,
    name: $('#name').value.trim(),
    email: $('#email').value.trim(),
    meeting: $('#meeting').value,
    city: $('#city').value.trim(),
    about: $('#about').value.trim(),
    tags: Array.from(selectedTags)
  };

  // Validate
  if (payload.name.length < 2) return showError('Please enter your name.');
  if (!validEmail(payload.email)) return showError('Please enter a valid email.');
  if (payload.tags.length < 1) return showError('Please pick at least 1 interest tag.');
  if (payload.about.length < 10) return showError('Please tell us a bit more (10+ characters).');

  // "Submit" (client-side MVP)
  submitBtn.disabled = true;
  const oldText = submitBtn.textContent;
  submitBtn.textContent = 'Matching…';

  await new Promise(r => setTimeout(r, 650)); // tiny delay for realism
  const match = makeMatch(payload);

  // Render success
  resultArea.innerHTML = `
    <div class="success">
      <div class="top">
        <div>
          <h4>Match found ☕</h4>
          <p><strong>${escapeHtml(match.personName)}</strong> — ${escapeHtml(match.personTitle)} · <span style="color:rgba(255,255,255,.60)">${escapeHtml(match.personOrg)}</span></p>
        </div>
        <span class="badge2">${escapeHtml(match.meeting)}</span>
      </div>

      <div class="topic">
        <div class="k">Suggested topic</div>
        <div class="v">${escapeHtml(match.topic)}</div>
      </div>

      <p style="margin-top:12px">${escapeHtml(match.nextStep)}</p>

      <div class="inline-actions">
        <button class="btn btn-ghost" type="button" id="tryAgain">Try another match</button>
        <button class="btn btn-primary" type="button" id="copyIntro">Copy intro message</button>
      </div>
      <div class="muteline">We’ll contact you at <strong>${escapeHtml(payload.email)}</strong>.</div>
    </div>
  `;

  $('#tryAgain').addEventListener('click', () => {
    resultArea.innerHTML = `
      <div class="card">
        <div class="icon" aria-hidden="true">⏳</div>
        <h4>Ready when you are…</h4>
        <p>Update the form and submit again for a new match.</p>
      </div>
    `;
    toast('Try again anytime');
  });

  $('#copyIntro').addEventListener('click', async () => {
    const msg = `Hi ${match.personName}! I’m ${payload.name}. Would you be open to a short fika chat? Suggested topic: ${match.topic}`;
    try {
      await navigator.clipboard.writeText(msg);
      toast('Intro copied to clipboard');
    } catch {
      toast('Copy failed — please copy manually');
    }
  });

  toast('You’re in! 🎉');

  // Reset submit button
  submitBtn.disabled = false;
  submitBtn.textContent = oldText;
});

// Prevent XSS in rendered strings
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
