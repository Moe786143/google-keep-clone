// ===== STATE =====
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let archivedNotes = JSON.parse(localStorage.getItem('archivedNotes')) || [];
let selectedColor = '#ffffff';
let isPinned = false;
let currentReminderNoteId = null;
let isListView = false;
let searchQuery = '';
let currentView = 'notes';
let draggedNoteId = null;

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
const archiveGrid = document.getElementById('archiveGrid');
const archiveEmptyState = document.getElementById('archiveEmptyState');
const remindersGrid = document.getElementById('remindersGrid');
const remindersEmptyState = document.getElementById('remindersEmptyState');
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
const notesView = document.getElementById('notesView');
const archiveView = document.getElementById('archiveView');
const remindersView = document.getElementById('remindersView');
const pageTitle = document.getElementById('pageTitle');

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
  archiveGrid.classList.toggle('list-view', isListView);
  remindersGrid.classList.toggle('list-view', isListView);
  layoutBtn.innerHTML = isListView
    ? '<i class="fa-solid fa-table-cells-large"></i>'
    : '<i class="fa-solid fa-list"></i>';
});

// ===== VIEW SWITCHING =====
document.querySelectorAll('[data-view]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const view = item.dataset.view;
    switchView(view);
  });
});

function switchView(view) {
  currentView = view;

  // Update sidebar active state
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  const activeItem = document.querySelector(`[data-view="${view}"]`);
  if (activeItem) activeItem.classList.add('active');

  // Show/hide views
  notesView.hidden = view !== 'notes';
  archiveView.hidden = view !== 'archive';
  remindersView.hidden = view !== 'reminders';

  // Update page title
  const titles = { notes: 'Keep', archive: 'Archive', reminders: 'Reminders' };
  pageTitle.textContent = titles[view] || 'Keep';

  renderNotes();
}

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
  document.getElementById('createNote').style.backgroundColor = '';
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

function deleteArchivedNote(id) {
  archivedNotes = archivedNotes.filter(n => n.id !== id);
  saveArchivedNotes();
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

// ===== ARCHIVE NOTE =====
function archiveNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  archivedNotes.unshift({ ...note, pinned: false });
  notes = notes.filter(n => n.id !== id);
  saveNotes();
  saveArchivedNotes();
  renderNotes();
}

// ===== UNARCHIVE NOTE =====
function unarchiveNote(id) {
  const note = archivedNotes.find(n => n.id === id);
  if (!note) return;
  notes.unshift({ ...note });
  archivedNotes = archivedNotes.filter(n => n.id !== id);
  saveNotes();
  saveArchivedNotes();
  renderNotes();
}

// ===== SAVE TO LOCALSTORAGE =====
function saveNotes() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

function saveArchivedNotes() {
  localStorage.setItem('archivedNotes', JSON.stringify(archivedNotes));
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
  if (currentView === 'notes') {
    renderMainNotes();
  } else if (currentView === 'archive') {
    renderArchiveNotes();
  } else if (currentView === 'reminders') {
    renderReminderNotes();
  }
}

function renderMainNotes() {
  const filtered = notes.filter(n => {
    if (!searchQuery) return true;
    return (
      n.title.toLowerCase().includes(searchQuery) ||
      n.content.toLowerCase().includes(searchQuery)
    );
  });

  const pinned = filtered.filter(n => n.pinned);
  const others = filtered.filter(n => !n.pinned);

  pinnedSection.hidden = pinned.length === 0;
  pinnedGrid.innerHTML = '';
  pinned.forEach(note => pinnedGrid.appendChild(createNoteCard(note, false)));

  othersLabel.hidden = pinned.length === 0 || others.length === 0;
  notesGrid.innerHTML = '';
  others.forEach(note => notesGrid.appendChild(createNoteCard(note, false)));

  emptyState.style.display = filtered.length === 0 ? 'flex' : 'none';

  // Setup drag and drop on grids
  setupGridDrop(notesGrid, false);
  setupGridDrop(pinnedGrid, false);
}

function renderArchiveNotes() {
  const filtered = archivedNotes.filter(n => {
    if (!searchQuery) return true;
    return (
      n.title.toLowerCase().includes(searchQuery) ||
      n.content.toLowerCase().includes(searchQuery)
    );
  });

  archiveGrid.innerHTML = '';
  filtered.forEach(note => archiveGrid.appendChild(createNoteCard(note, true)));
  archiveEmptyState.style.display = filtered.length === 0 ? 'flex' : 'none';
}

function renderReminderNotes() {
  const withReminders = notes.filter(n => n.reminder);
  remindersGrid.innerHTML = '';
  withReminders.forEach(note => remindersGrid.appendChild(createNoteCard(note, false)));
  remindersEmptyState.style.display = withReminders.length === 0 ? 'flex' : 'none';
}

// ===== CREATE NOTE CARD =====
function createNoteCard(note, isArchived) {
  const card = document.createElement('div');
  card.className = `note-card ${note.pinned ? 'pinned' : ''}`;
  card.style.backgroundColor = note.color || '#ffffff';
  card.setAttribute('data-id', note.id);

  // Only make draggable for main notes view
  if (!isArchived) {
    card.setAttribute('draggable', 'true');
    setupDragEvents(card, note);
  }

  const reminderHTML = note.reminder
    ? `<div class="note-reminder">
        <i class="fa-regular fa-bell"></i>
        ${formatReminder(note.reminder)}
       </div>`
    : '';

  const archiveBtn = isArchived
    ? `<button class="note-action-btn" title="Unarchive" onclick="unarchiveNote(${note.id})">
        <i class="fa-solid fa-box-archive"></i>
       </button>
       <button class="note-action-btn" title="Delete forever" onclick="deleteArchivedNote(${note.id})">
        <i class="fa-regular fa-trash-can"></i>
       </button>`
    : `<button class="note-action-btn" title="${note.pinned ? 'Unpin' : 'Pin'}" onclick="togglePin(${note.id})">
        <i class="fa-${note.pinned ? 'solid' : 'regular'} fa-thumbtack"></i>
       </button>
       <button class="note-action-btn" title="Add reminder" onclick="openReminderModal(${note.id})">
        <i class="fa-regular fa-bell"></i>
       </button>
       <button class="note-action-btn" title="Archive" onclick="archiveNote(${note.id})">
        <i class="fa-solid fa-box-archive"></i>
       </button>
       <button class="note-action-btn" title="Delete note" onclick="deleteNote(${note.id})">
        <i class="fa-regular fa-trash-can"></i>
       </button>`;

  card.innerHTML = `
    <i class="fa-solid fa-thumbtack pin-indicator"></i>
    ${note.title ? `<div class="note-card-title">${escapeHTML(note.title)}</div>` : ''}
    ${note.content ? `<div class="note-card-content">${escapeHTML(note.content)}</div>` : ''}
    ${reminderHTML}
    <div class="note-actions">
      ${archiveBtn}
    </div>
  `;

  return card;
}

// ===== DRAG AND DROP =====
function setupDragEvents(card, note) {
  card.addEventListener('dragstart', (e) => {
    draggedNoteId = note.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', note.id);
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    document.querySelectorAll('.note-card').forEach(c => c.classList.remove('drag-over'));
    draggedNoteId = null;
  });

  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.note-card').forEach(c => c.classList.remove('drag-over'));
    if (draggedNoteId !== note.id) {
      card.classList.add('drag-over');
    }
  });

  card.addEventListener('drop', (e) => {
    e.preventDefault();
    const fromId = parseInt(e.dataTransfer.getData('text/plain'));
    const toId = note.id;

    if (fromId === toId) return;

    const fromIndex = notes.findIndex(n => n.id === fromId);
    const toIndex = notes.findIndex(n => n.id === toId);

    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = notes.splice(fromIndex, 1);
    notes.splice(toIndex, 0, moved);

    saveNotes();
    renderNotes();
  });
}

function setupGridDrop(grid, isArchived) {
  grid.addEventListener('dragover', (e) => e.preventDefault());
}

// ===== REMINDER MODAL =====
function openReminderModal(noteId) {
  currentReminderNoteId = noteId;
  reminderModal.hidden = false;
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