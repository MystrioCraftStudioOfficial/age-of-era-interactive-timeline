(() => {
  'use strict';

  const STORAGE_KEY = 'mystriocraft-timeline-v1';
  const DEFAULT_CONFIG = {
    siteName: 'MystrioCraft Studio',
    headline: 'Every moment has a place.',
    intro: 'Build a timeline of events, discoveries, and milestones. Add a point, give it a number, and explore its story.',
    welcomeText: 'Welcome to MystrioCraft Studio',
    startAge: 18000000000,
    endAge: 5007,
    startLabel: 'Origin',
    endLabel: 'Present'
  };

  const $ = (selector) => document.querySelector(selector);
  const els = {
    welcomeBanner: $('#welcomeBanner'), welcomeText: $('#welcomeText'), closeWelcome: $('#closeWelcome'),
    brandName: $('#brandName'), pageTitle: $('#pageTitle'), pageIntro: $('#pageIntro'), footerBrand: $('#footerBrand'), footerYear: $('#footerYear'),
    addEventBtn: $('#addEventBtn'), emptyAddBtn: $('#emptyAddBtn'), settingsBtn: $('#settingsBtn'),
    eventEditorPanel: $('#eventEditorPanel'), eventEditorTitle: $('#eventEditorTitle'), eventForm: $('#eventForm'), eventId: $('#eventId'), eventTitle: $('#eventTitle'), eventAge: $('#eventAge'), eventLabel: $('#eventLabel'), eventDescription: $('#eventDescription'), eventError: $('#eventError'), saveEventBtn: $('#saveEventBtn'),
    settingsPanel: $('#settingsPanel'), settingsForm: $('#settingsForm'), settingSiteName: $('#settingSiteName'), settingHeadline: $('#settingHeadline'), settingIntro: $('#settingIntro'), settingWelcome: $('#settingWelcome'), settingStartAge: $('#settingStartAge'), settingEndAge: $('#settingEndAge'), settingStartLabel: $('#settingStartLabel'), settingEndLabel: $('#settingEndLabel'), settingsError: $('#settingsError'),
    startEndpointLabel: $('#startEndpointLabel'), endEndpointLabel: $('#endEndpointLabel'), startEndpointAge: $('#startEndpointAge'), endEndpointAge: $('#endEndpointAge'), timelineStage: $('#timelineStage'), timelineMarkers: $('#timelineMarkers'), eventCount: $('#eventCount'), eventCountLabel: $('#eventCountLabel'), rangeSummary: $('#rangeSummary'),
    eventList: $('#eventList'), emptyState: $('#emptyState'), detailCard: $('#detailCard'), searchEvents: $('#searchEvents'), exportBtn: $('#exportBtn'), importBtn: $('#importBtn'), importFile: $('#importFile'), toast: $('#toast')
  };

  let state = { config: { ...DEFAULT_CONFIG }, events: [] };
  let selectedEventId = null;
  let toastTimer = null;
  let welcomeTimer = null;

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && parsed.config && Array.isArray(parsed.events)) {
        state.config = { ...DEFAULT_CONFIG, ...parsed.config };
        state.events = parsed.events.filter(isValidEvent).map(normalizeEvent);
      }
    } catch (error) {
      console.warn('Could not load the saved timeline.', error);
      showToast('Saved data could not be loaded. Starting with a fresh timeline.');
    }
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error('Could not save timeline data.', error);
      showToast('Browser storage is unavailable or full. Export a backup of your data.');
      return false;
    }
  }

  function isValidEvent(event) {
    return event && typeof event.id === 'string' && typeof event.title === 'string' && Number.isFinite(Number(event.age)) && typeof event.description === 'string';
  }

  function normalizeEvent(event) {
    return {
      id: String(event.id),
      title: String(event.title || 'Untitled event').slice(0, 100),
      age: Number(event.age),
      label: String(event.label || '').slice(0, 40),
      description: String(event.description || '').slice(0, 5000),
      createdAt: Number(event.createdAt) || Date.now()
    };
  }

  function makeId() {
    return `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function sortedEvents() {
    return [...state.events].sort((a, b) => b.age - a.age || a.createdAt - b.createdAt);
  }

  function formatExactAge(age) {
    return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(age)} years ago`;
  }

  function formatCompactAge(age) {
    const n = Number(age);
    if (!Number.isFinite(n)) return '—';
    return `${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(n)} years ago`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => els.toast.classList.remove('is-visible'), 2800);
  }

  function openPanel(panel) {
    [els.eventEditorPanel, els.settingsPanel].forEach((item) => item.classList.add('is-hidden'));
    panel.classList.remove('is-hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closePanel(panel) {
    panel.classList.add('is-hidden');
  }

  function updatePageText() {
    const c = state.config;
    document.title = `${c.siteName} — Timeline`;
    els.brandName.textContent = c.siteName;
    els.footerBrand.textContent = c.siteName;
    els.pageTitle.textContent = c.headline;
    els.pageIntro.textContent = c.intro;
    els.welcomeText.textContent = c.welcomeText;
    els.startEndpointLabel.textContent = c.startLabel;
    els.endEndpointLabel.textContent = c.endLabel;
    els.startEndpointAge.textContent = formatCompactAge(c.startAge);
    els.endEndpointAge.textContent = formatCompactAge(c.endAge);
    els.rangeSummary.textContent = `${formatCompactAge(c.startAge)} → ${formatCompactAge(c.endAge)}`;
    els.footerYear.textContent = new Date().getFullYear();
  }

  function eventPosition(age) {
    const start = Number(state.config.startAge);
    const end = Number(state.config.endAge);
    const range = start - end;
    if (range <= 0) return 50;
    return Math.min(100, Math.max(0, ((start - Number(age)) / range) * 100));
  }

  function assignMarkerLanes(events) {
    const width = Math.max(760, els.timelineStage.clientWidth || 760);
    const occupiedUntil = [-Infinity, -Infinity, -Infinity, -Infinity];
    return events.map((event) => {
      const x = eventPosition(event.age) / 100 * width;
      let lane = occupiedUntil.findIndex((rightEdge) => x - rightEdge >= 39);
      if (lane === -1) {
        lane = occupiedUntil.indexOf(Math.min(...occupiedUntil));
      }
      occupiedUntil[lane] = x + 18;
      return { ...event, _position: eventPosition(event.age), _lane: lane };
    });
  }

  function renderMarkers() {
    const events = sortedEvents();
    const markers = assignMarkerLanes(events);
    els.timelineMarkers.innerHTML = '';
    markers.forEach((event, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `timeline-marker${event.id === selectedEventId ? ' is-selected' : ''}`;
      button.style.left = `${event._position}%`;
      button.style.setProperty('--lane', event._lane);
      button.style.setProperty('--stem-top', `${105 - event._lane * 26}px`);
      button.style.setProperty('--stem-height', `${13 + event._lane * 26}px`);
      button.dataset.eventId = event.id;
      const displayName = event.label || event.title;
      button.title = `${String(index + 1).padStart(2, '0')} · ${displayName} · ${formatExactAge(event.age)}`;
      button.setAttribute('aria-label', `View event ${index + 1}: ${displayName}, ${formatExactAge(event.age)}`);
      button.setAttribute('aria-pressed', String(event.id === selectedEventId));
      button.innerHTML = `<span class="marker-label">${String(index + 1).padStart(2, '0')}</span><span class="marker-stem" aria-hidden="true"></span><span class="marker-pin" aria-hidden="true"></span>`;
      button.addEventListener('click', () => selectEvent(event.id, true));
      els.timelineMarkers.appendChild(button);
    });
  }

  function renderEventList() {
    const allEvents = sortedEvents();
    const query = els.searchEvents.value.trim().toLowerCase();
    const filtered = allEvents.filter((event) => `${event.title} ${event.label} ${event.description} ${event.age}`.toLowerCase().includes(query));
    els.eventCount.textContent = String(state.events.length);
    els.eventCountLabel.textContent = state.events.length === 1 ? 'event added' : 'events added';
    els.eventList.innerHTML = '';

    if (allEvents.length === 0) {
      els.eventList.appendChild(els.emptyState);
      els.emptyState.classList.remove('is-hidden');
      return;
    }

    if (filtered.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'empty-state';
      noResults.innerHTML = '<span class="empty-icon" aria-hidden="true">⌕</span><h3>No matching events</h3><p>Try another search term, or clear the search to see every event.</p>';
      els.eventList.appendChild(noResults);
      return;
    }

    filtered.forEach((event) => {
      const index = allEvents.findIndex((item) => item.id === event.id) + 1;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `event-card${event.id === selectedEventId ? ' is-selected' : ''}`;
      card.dataset.eventId = event.id;
      card.setAttribute('aria-pressed', String(event.id === selectedEventId));
      const snippet = event.description.length > 125 ? `${event.description.slice(0, 122)}…` : event.description;
      card.innerHTML = `
        <span class="event-number">${String(index).padStart(2, '0')}</span>
        <span class="event-card-body">
          <span class="event-age">${escapeHtml(formatExactAge(event.age))}</span>
          <h3>${escapeHtml(event.title)}</h3>
          <p class="event-snippet">${escapeHtml(snippet)}</p>
        </span>
        <span class="event-card-arrow" aria-hidden="true">↗</span>`;
      card.addEventListener('click', () => selectEvent(event.id, false));
      els.eventList.appendChild(card);
    });
  }

  function renderDetails() {
    const event = state.events.find((item) => item.id === selectedEventId);
    if (!event) {
      els.detailCard.innerHTML = `<div class="detail-empty"><span class="detail-symbol" aria-hidden="true">↖</span><h3>Choose a point</h3><p>Select a numbered marker or an event card to read its description.</p></div>`;
      return;
    }
    const index = sortedEvents().findIndex((item) => item.id === event.id) + 1;
    els.detailCard.innerHTML = `
      <div class="detail-kicker"><span class="detail-index">${String(index).padStart(2, '0')}</span> Selected event</div>
      <h3 class="detail-title">${escapeHtml(event.title)}</h3>
      <p class="detail-age">${escapeHtml(formatExactAge(event.age))}</p>
      ${event.label ? `<p class="detail-description" style="font-weight:700;margin-bottom:10px">${escapeHtml(event.label)}</p>` : ''}
      <p class="detail-description">${escapeHtml(event.description)}</p>
      <div class="detail-actions">
        <button class="button button-secondary" type="button" id="editSelectedBtn">Edit event</button>
        <button class="button button-danger" type="button" id="deleteSelectedBtn">Delete</button>
      </div>`;
    $('#editSelectedBtn').addEventListener('click', () => beginEditEvent(event.id));
    $('#deleteSelectedBtn').addEventListener('click', () => deleteEvent(event.id));
  }

  function render() {
    updatePageText();
    renderMarkers();
    renderEventList();
    renderDetails();
  }

  function selectEvent(id, scrollToList) {
    selectedEventId = id;
    renderMarkers();
    renderEventList();
    renderDetails();
    if (scrollToList && window.matchMedia('(max-width: 900px)').matches) {
      els.detailCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function resetEventForm() {
    els.eventForm.reset();
    els.eventId.value = '';
    els.eventEditorTitle.textContent = 'Add an event';
    els.saveEventBtn.textContent = 'Save event';
    els.eventError.textContent = '';
  }

  function beginAddEvent() {
    resetEventForm();
    const c = state.config;
    els.eventAge.min = String(c.endAge);
    els.eventAge.max = String(c.startAge);
    openPanel(els.eventEditorPanel);
    els.eventTitle.focus({ preventScroll: true });
  }

  function beginEditEvent(id) {
    const event = state.events.find((item) => item.id === id);
    if (!event) return;
    resetEventForm();
    els.eventId.value = event.id;
    els.eventTitle.value = event.title;
    els.eventAge.value = event.age;
    els.eventLabel.value = event.label;
    els.eventDescription.value = event.description;
    els.eventEditorTitle.textContent = 'Edit event';
    els.saveEventBtn.textContent = 'Update event';
    els.eventAge.min = String(state.config.endAge);
    els.eventAge.max = String(state.config.startAge);
    openPanel(els.eventEditorPanel);
    els.eventTitle.focus({ preventScroll: true });
  }

  function validateEvent(title, age, description) {
    if (!title.trim()) return 'Please enter an event title.';
    if (!Number.isFinite(age)) return 'Please enter a valid number for the event age.';
    if (age < Number(state.config.endAge) || age > Number(state.config.startAge)) {
      return `The event age must be between ${formatExactAge(state.config.endAge)} and ${formatExactAge(state.config.startAge)}.`;
    }
    if (!description.trim()) return 'Please add a description for this event.';
    return '';
  }

  function saveEvent(formEvent) {
    formEvent.preventDefault();
    const id = els.eventId.value;
    const title = els.eventTitle.value.trim();
    const age = Number(els.eventAge.value);
    const label = els.eventLabel.value.trim();
    const description = els.eventDescription.value.trim();
    const error = validateEvent(title, age, description);
    if (error) {
      els.eventError.textContent = error;
      return;
    }

    if (id) {
      const index = state.events.findIndex((item) => item.id === id);
      if (index !== -1) state.events[index] = { ...state.events[index], title, age, label, description };
      showToast('Event updated.');
    } else {
      const event = { id: makeId(), title, age, label, description, createdAt: Date.now() };
      state.events.push(event);
      selectedEventId = event.id;
      showToast('Event added to your timeline.');
    }
    persistState();
    closePanel(els.eventEditorPanel);
    render();
  }

  function deleteEvent(id) {
    const event = state.events.find((item) => item.id === id);
    if (!event) return;
    const confirmed = window.confirm(`Delete “${event.title}” from your timeline? This cannot be undone unless you have a backup.`);
    if (!confirmed) return;
    state.events = state.events.filter((item) => item.id !== id);
    if (selectedEventId === id) selectedEventId = null;
    persistState();
    render();
    showToast('Event deleted.');
  }

  function fillSettingsForm() {
    const c = state.config;
    els.settingSiteName.value = c.siteName;
    els.settingHeadline.value = c.headline;
    els.settingIntro.value = c.intro;
    els.settingWelcome.value = c.welcomeText;
    els.settingStartAge.value = c.startAge;
    els.settingEndAge.value = c.endAge;
    els.settingStartLabel.value = c.startLabel;
    els.settingEndLabel.value = c.endLabel;
    els.settingsError.textContent = '';
  }

  function saveSettings(formEvent) {
    formEvent.preventDefault();
    const next = {
      siteName: els.settingSiteName.value.trim(),
      headline: els.settingHeadline.value.trim(),
      intro: els.settingIntro.value.trim(),
      welcomeText: els.settingWelcome.value.trim(),
      startAge: Number(els.settingStartAge.value),
      endAge: Number(els.settingEndAge.value),
      startLabel: els.settingStartLabel.value.trim(),
      endLabel: els.settingEndLabel.value.trim()
    };
    if (!next.siteName || !next.headline || !next.intro || !next.welcomeText || !next.startLabel || !next.endLabel) {
      els.settingsError.textContent = 'Please fill in all settings fields.';
      return;
    }
    if (!Number.isFinite(next.startAge) || !Number.isFinite(next.endAge) || next.startAge <= next.endAge || next.endAge < 0) {
      els.settingsError.textContent = 'The starting value must be a non-negative number larger than the ending value.';
      return;
    }
    const outsideEvents = state.events.filter((event) => event.age < next.endAge || event.age > next.startAge);
    if (outsideEvents.length) {
      els.settingsError.textContent = `${outsideEvents.length} existing event(s) would fall outside the new range. Widen the range or edit those event ages first.`;
      return;
    }
    state.config = next;
    persistState();
    closePanel(els.settingsPanel);
    render();
    showToast('Timeline settings saved.');
  }

  function exportBackup() {
    const backup = { app: 'MystrioCraft Studio Timeline', version: 1, exportedAt: new Date().toISOString(), config: state.config, events: state.events };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mystriocraft-timeline-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Backup exported as a JSON file.');
  }

  async function importBackup(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !parsed.config || !Array.isArray(parsed.events)) throw new Error('This file does not look like a MystrioCraft timeline backup.');
      const importedConfig = { ...DEFAULT_CONFIG, ...parsed.config };
      if (!Number.isFinite(Number(importedConfig.startAge)) || !Number.isFinite(Number(importedConfig.endAge)) || Number(importedConfig.startAge) <= Number(importedConfig.endAge)) {
        throw new Error('The backup has an invalid timeline range.');
      }
      const importedEvents = parsed.events.filter(isValidEvent).map(normalizeEvent);
      const outOfRange = importedEvents.some((event) => event.age < importedConfig.endAge || event.age > importedConfig.startAge);
      if (outOfRange) throw new Error('One or more imported events fall outside the timeline range in this backup.');
      const accepted = window.confirm(`Import ${importedEvents.length} event(s)? This will replace the timeline currently saved in this browser.`);
      if (!accepted) return;
      state = { config: importedConfig, events: importedEvents };
      selectedEventId = null;
      persistState();
      render();
      fillSettingsForm();
      showToast('Backup imported successfully.');
    } catch (error) {
      showToast(error.message || 'Could not import that backup.');
    } finally {
      els.importFile.value = '';
    }
  }

  function showWelcome() {
    els.welcomeBanner.classList.remove('is-dismissed');
    window.clearTimeout(welcomeTimer);
    welcomeTimer = window.setTimeout(() => els.welcomeBanner.classList.add('is-dismissed'), 4200);
  }

  function bindEvents() {
    els.addEventBtn.addEventListener('click', beginAddEvent);
    els.emptyAddBtn.addEventListener('click', beginAddEvent);
    els.settingsBtn.addEventListener('click', () => {
      fillSettingsForm();
      openPanel(els.settingsPanel);
    });
    els.eventForm.addEventListener('submit', saveEvent);
    els.settingsForm.addEventListener('submit', saveSettings);
    document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closePanel(document.getElementById(button.dataset.close))));
    els.closeWelcome.addEventListener('click', () => {
      window.clearTimeout(welcomeTimer);
      els.welcomeBanner.classList.add('is-dismissed');
    });
    els.searchEvents.addEventListener('input', renderEventList);
    els.exportBtn.addEventListener('click', exportBackup);
    els.importBtn.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', () => importBackup(els.importFile.files && els.importFile.files[0]));
    window.addEventListener('resize', () => renderMarkers());
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closePanel(els.eventEditorPanel);
        closePanel(els.settingsPanel);
      }
    });
  }

  loadState();
  bindEvents();
  render();
  showWelcome();
})();
