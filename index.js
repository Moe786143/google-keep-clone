// ===== STATE =====
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let selectedColor = '#ffffff';
let isPinned = false;
let currentReminderNoteId = null;
let isListView = false;
let searchQuery = '';

// ===== DOM ELEMENTS =====
const createNoteCollapsed = document.getElementById('createNoteCollapsed');
const createNoteExpanded = document.getElementById('createNoteExpanded');
const quickNoteInput = document.getElementById('quickNoteInput');
const noteTitleInput = document.getElementById('noteTitleInput');
const noteContentInput = document.getElementById('noteContentInput');
const charCounter = document.getElementById('charCounter');
const addNoteBtn = document.getElementById('addNoteBtn');
const closeNoteBtn = document.getElementById('closeNoteBtn');
const pinNoteBtn = document.getElementById('pinNoteBtn');
const notesGrid = document.getElementById('notesGrid');
const pinnedGrid = document.getElementById('pinnedGrid');
const pinnedSection = document.getElementById('pinnedSection');
const othersLabel = document.getElementById('othersLabel');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const darkModeBtn = document.getElementById('darkModeBtn');
const layoutBtn = document.getElementById('layoutBtn');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.querySelector('.main-content');
const reminderModal = document.getElementById('reminderModal');
const closeReminderModal = document.getElementById('closeReminderModal');
const cancelReminder = document.getElementById('cancelReminder');
const saveReminder = document.getElementById('saveReminder');
const reminderDateTime = document.getElementById('reminderDateTime');

// ===== DARK MODE =====
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  darkModeBtn.innerHTML = '<i class="fa-regular fa-sun"></i>';
}

darkModeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  darkModeBtn.innerHTML = isDark
    ? '<i class="fa-regular fa-sun"></i>'
    : '<i class="fa-regular fa-moon"></i>';
});

// ===== SIDEBAR TOGGLE =====
menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  mainContent.classList.toggle('expanded');
});

// ===== LAYOUT TOGGLE =====
layoutBtn.addEventListener('click', () => {
  isListView = !isListView;
  notesGrid.classList.toggle('list-view', isListView);
  pinnedGrid.classList.toggle('list-view', isListView);
  layoutBtn.innerHTML = isListView
    ? '<i class="fa-solid fa-table-cells-large"></i>'
    : '<i class="fa-solid fa-list"></i>';
});

// ===== EXPAND / COLLAPSE CREATE NOTE =====
createNoteCollapsed.addEventListener('click', () => {
  createNoteCollapsed.style.display = 'none';
  createNoteExpanded.hidden = false;
  noteContentInput.focus();
});

quickNoteInput.addEventListener('focus', () => {
  createNoteCollapsed.style.display = 'none';
  createNoteExpanded.hidden = false;
  noteContentInput.focus();
});

closeNoteBtn.addEventListener('click', () => {
  collapseNoteForm();
});

// Close when clicking outside
document.addEventListener('click', (e) => {
  const createNote = document.getElementById('createNote');
  if (!createNote.contains(e.target) && !createNoteExpanded.hidden) {
    if (noteContentInput.value.trim() || noteTitleInput.value.trim()) {
      addNote();
    } else {
      collapseNoteForm();
    }
  }
});

function collapseNoteForm() {
  createNoteExpanded.hidden = true;
  createNoteCollapsed.style.display = 'flex';
  noteTitleInput.value = '';
  noteContentInput.value = '';
  charCounter.textContent = '0 / 500';
  charCounter.classList.remove('warning');
  selectedColor = '#ffffff';
  isPinned = false;
  pinNoteBtn.classList.remove('pinned');
  pinNoteBtn.innerHTML = '<i class="fa-regular fa-thumbtack"></i>';
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
}

// ===== CHARACTER COUNTER =====
noteContentInput.addEventListener('input', () => {
  const len = noteContentInput.value.length;
  const max = 500;
  charCounter.textContent = `${len} / ${max}`;
  charCounter.classList.toggle('warning', len >= max * 0.8);
  if (len >= max) {
    noteContentInput.value = noteContentInput.value.substring(0, max);
  }
});

// ===== COLOR PICKER =====
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedColor = dot.dataset.color;
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
    dot.classList.add('selected');
    document.getElementById('createNote').style.backgroundColor = selectedColor;
  });
});

// ===== PIN TOGGLE =====
pinNoteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  isPinned = !isPinned;
  pinNoteBtn.classList.toggle('pinned', isPinned);
  pinNoteBtn.innerHTML = isPinned
    ? '<i class="fa-solid fa-thumbtack"></i>'
    : '<i class="fa-regular fa-thumbtack"></i>';
});

// ===== ADD NOTE =====
addNoteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  addNote();
});

function addNote() {
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();

  if (!title && !content) {
    collapseNoteForm();
    return;
  }

  const note = {
    id: Date.now(),
    title,
    content,
    color: selectedColor,
    pinned: isPinned,
    reminder: null,
    createdAt: new Date().toISOString(),
  };

  notes.unshift(note);
  saveNotes();
  renderNotes();
  collapseNoteForm();
}

// ===== DELETE NOTE =====
function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  saveNotes();
  renderNotes();
}

// ===== PIN NOTE =====
function togglePin(id) {
  notes = notes.map(n =>
    n.id === id ? { ...n, pinned: !n.pinned } : n
  );
  saveNotes();
  renderNotes();
}

// ===== SAVE TO LOCALSTORAGE =====
function saveNotes() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

// ===== SEARCH =====
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.toLowerCase();
  searchClear.classList.toggle('visible', searchQuery.length > 0);
  renderNotes();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  searchClear.classList.remove('visible');
  renderNotes();
});

// ===== RENDER NOTES =====
function renderNotes() {
  const filtered = notes.filter(n => {
    if (!searchQuery) return true;
    return (
      n.title.toLowerCase().includes(searchQuery) ||
      n.content.toLowerCase().includes(searchQuery)
    );
  });

  const pinned = filtered.filter(n => n.pinned);
  const others = filtered.filter(n => !n.pinned);

  // Pinned section
  pinnedSection.hidden = pinned.length === 0;
  pinnedGrid.innerHTML = '';
  pinned.forEach(note => pinnedGrid.appendChild(createNoteCard(note)));

  // Others section
  othersLabel.hidden = pinned.length === 0 || others.length === 0;
  notesGrid.innerHTML = '';
  others.forEach(note => notesGrid.appendChild(createNoteCard(note)));

  // Empty state
  emptyState.style.display = filtered.length === 0 ? 'flex' : 'none';
}

// ===== CREATE NOTE CARD =====
function createNoteCard(note) {
  const card = document.createElement('div');
  card.className = `note-card ${note.pinned ? 'pinned' : ''}`;
  card.style.backgroundColor = note.color || '#ffffff';

  const reminderHTML = note.reminder
    ? `<div class="note-reminder">
        <i class="fa-regular fa-bell"></i>
        ${formatReminder(note.reminder)}
       </div>`
    : '';

  card.innerHTML = `
    <i class="fa-solid fa-thumbtack pin-indicator"></i>
    ${note.title ? `<div class="note-card-title">${escapeHTML(note.title)}</div>` : ''}
    ${note.content ? `<div class="note-card-content">${escapeHTML(note.content)}</div>` : ''}
    ${reminderHTML}
    <div class="note-actions">
      <button class="note-action-btn" title="${note.pinned ? 'Unpin' : 'Pin'}" onclick="togglePin(${note.id})">
        <i class="fa-${note.pinned ? 'solid' : 'regular'} fa-thumbtack"></i>
      </button>
      <button class="note-action-btn" title="Add reminder" onclick="openReminderModal(${note.id})">
        <i class="fa-regular fa-bell"></i>
      </button>
      <button class="note-action-btn" title="Delete note" onclick="deleteNote(${note.id})">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    </div>
  `;

  return card;
}

// ===== REMINDER MODAL =====
function openReminderModal(noteId) {
  currentReminderNoteId = noteId;
  reminderModal.hidden = false;
  // Set min to now
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  reminderDateTime.min = now.toISOString().slice(0, 16);
  reminderDateTime.value = '';
}

closeReminderModal.addEventListener('click', () => {
  reminderModal.hidden = true;
});

cancelReminder.addEventListener('click', () => {
  reminderModal.hidden = true;
});

saveReminder.addEventListener('click', () => {
  const dateVal = reminderDateTime.value;
  if (!dateVal) return;

  notes = notes.map(n =>
    n.id === currentReminderNoteId ? { ...n, reminder: dateVal } : n
  );
  saveNotes();
  renderNotes();
  reminderModal.hidden = true;
});

reminderModal.addEventListener('click', (e) => {
  if (e.target === reminderModal) reminderModal.hidden = true;
});

// ===== HELPERS =====
function formatReminder(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== INIT =====
renderNotes();