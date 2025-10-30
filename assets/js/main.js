// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFGnQiw_DzZbmCTgSc09L4a8MvzaG5W_Q",
  authDomain: "diary-webapp-9afb0.firebaseapp.com",
  projectId: "diary-webapp-9afb0",
  storageBucket: "diary-webapp-9afb0.firebasestorage.app",
  messagingSenderId: "582463596946",
  appId: "1:582463596946:web:ff9874ba3d9e8a5430f94b",
  measurementId: "G-HC17Q3BGSL",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM Elements
let loginSection, diarySection, loginBtn, logoutBtn, passwordInput, loginMessage;
let entriesContainer, emptyState, newEntryBtn, emptyNewEntryBtn, entryModal;
let closeModalBtn, modalTitle, entryIdInput, entryTitleInput, entryContentInput;
let saveEntryBtn, deleteEntryBtn, searchInput, paginationControls;
let paginationButtons, paginationInfo, calendarDays, calendarTitle;
let prevMonthBtn, nextMonthBtn, todayBtn, calendarViewBtn, listViewBtn;
let filterYear, filterMonth, filterDay, activeFilters, filterTags, clearFiltersBtn;

// Global Variables
let currentUser = null;
let allEntries = [];
let filteredEntries = [];
let currentPage = 1;
const entriesPerPage = 5;
let currentDate = new Date();
let currentView = "calendar";
let activeFiltersMap = new Map();

// Initialize DOM Elements
function initializeDOMElements() {
  loginSection = document.getElementById("login-section");
  diarySection = document.getElementById("diary-section");
  loginBtn = document.getElementById("login-btn");
  logoutBtn = document.getElementById("logout-btn");
  passwordInput = document.getElementById("password");
  loginMessage = document.getElementById("login-message");
  entriesContainer = document.getElementById("entries-container");
  emptyState = document.getElementById("empty-state");
  newEntryBtn = document.getElementById("new-entry-btn");
  emptyNewEntryBtn = document.getElementById("empty-new-entry-btn");
  entryModal = document.getElementById("entry-modal");
  closeModalBtn = document.querySelector(".close-modal");
  modalTitle = document.getElementById("modal-title");
  entryIdInput = document.getElementById("entry-id");
  entryTitleInput = document.getElementById("entry-title");
  entryContentInput = document.getElementById("entry-content");
  saveEntryBtn = document.getElementById("save-entry-btn");
  deleteEntryBtn = document.getElementById("delete-entry-btn");
  searchInput = document.getElementById("search-input");
  paginationControls = document.getElementById("pagination-controls");
  paginationButtons = document.getElementById("pagination-buttons");
  paginationInfo = document.getElementById("pagination-info");
  calendarDays = document.getElementById("calendar-days");
  calendarTitle = document.getElementById("calendar-title");
  prevMonthBtn = document.getElementById("prev-month");
  nextMonthBtn = document.getElementById("next-month");
  todayBtn = document.getElementById("today-btn");
  calendarViewBtn = document.getElementById("calendar-view-btn");
  listViewBtn = document.getElementById("list-view-btn");
  filterYear = document.getElementById("filter-year");
  filterMonth = document.getElementById("filter-month");
  filterDay = document.getElementById("filter-day");
  activeFilters = document.getElementById("active-filters");
  filterTags = document.getElementById("filter-tags");
  clearFiltersBtn = document.getElementById("clear-filters");
}

// Setup Event Listeners
function setupEventListeners() {
  loginBtn.addEventListener("click", handleLogin);
  passwordInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  logoutBtn.addEventListener("click", handleLogout);
  newEntryBtn.addEventListener("click", openNewEntryModal);
  emptyNewEntryBtn.addEventListener("click", openNewEntryModal);
  closeModalBtn.addEventListener("click", closeModal);
  saveEntryBtn.addEventListener("click", saveEntry);
  deleteEntryBtn.addEventListener("click", deleteEntry);
  searchInput.addEventListener("input", handleSearch);
  prevMonthBtn.addEventListener("click", goToPreviousMonth);
  nextMonthBtn.addEventListener("click", goToNextMonth);
  todayBtn.addEventListener("click", goToToday);
  calendarViewBtn.addEventListener("click", () => switchView("calendar"));
  listViewBtn.addEventListener("click", () => switchView("list"));
  filterYear.addEventListener("change", handleFilterChange);
  filterMonth.addEventListener("change", handleFilterChange);
  filterDay.addEventListener("change", handleFilterChange);
  clearFiltersBtn.addEventListener("click", clearAllFilters);

  window.addEventListener("click", (e) => {
    if (e.target === entryModal) {
      closeModal();
    }
  });

  filterYear.addEventListener("change", function () {
    handleFilterChange();
    populateDayFilter();
  });

  filterMonth.addEventListener("change", function () {
    handleFilterChange();
    populateDayFilter();
  });
}

// Authentication Functions
async function handleLogin() {
  const password = passwordInput.value.trim();

  if (!password) {
    showMessage(loginMessage, "Please enter your password.", "error");
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(
      "ibrahimmustafa787898@gmail.com",
      password
    );

    passwordInput.value = "";
    loginMessage.style.display = "none";

    loginSection.style.display = "none";
    diarySection.style.display = "block";
    logoutBtn.style.display = "block";

    loadEntries();
  } catch (error) {
    showMessage(loginMessage, "Invalid password. Please try again.", "error");
  }
}

function handleLogout() {
  auth
    .signOut()
    .then(() => {
      diarySection.style.display = "none";
      loginSection.style.display = "block";
      logoutBtn.style.display = "none";

      allEntries = [];
      entriesContainer.innerHTML = "";
    })
    .catch((error) => {
      console.error("Error signing out:", error);
    });
}

// Entry Management Functions
async function loadEntries() {
  try {
    const snapshot = await db
      .collection("entries")
      .orderBy("timestamp", "desc")
      .get();

    allEntries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        timestamp: data.timestamp.toDate(),
        date: data.timestamp.toDate(),
      };
    });

    filteredEntries = [...allEntries];

    if (allEntries.length === 0) {
      showEmptyState();
    } else {
      hideEmptyState();
      if (currentView === "list") {
        renderEntries();
      } else {
        renderCalendar();
      }
    }
  } catch (error) {
    console.error("Error loading entries:", error);
  }
}

function renderEntries() {
  entriesContainer.innerHTML = "";

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const entriesToShow = filteredEntries.slice(startIndex, endIndex);

  if (entriesToShow.length === 0 && filteredEntries.length > 0) {
    currentPage = 1;
    renderEntries();
    return;
  }

  entriesToShow.forEach((entry) => {
    const entryCard = document.createElement("div");
    entryCard.className = "entry-card";
    entryCard.innerHTML = `
      <div class="entry-header">
          <div class="entry-title">${escapeHTML(entry.title)}</div>
          <div class="entry-date">${formatDate(entry.timestamp)}</div>
      </div>
      <div class="entry-preview">${escapeHTML(
        entry.content.substring(0, 150)
      )}${entry.content.length > 150 ? "..." : ""}</div>
    `;

    entryCard.addEventListener("click", () => openEditEntryModal(entry));
    entriesContainer.appendChild(entryCard);
  });

  updatePagination();
}

function openNewEntryModal() {
  modalTitle.textContent = "New Diary Entry";
  entryIdInput.value = "";
  entryTitleInput.value = "";
  entryContentInput.value = "";
  deleteEntryBtn.style.display = "none";
  entryModal.style.display = "flex";
  entryTitleInput.focus();
}

function openEditEntryModal(entry) {
  modalTitle.textContent = "Edit Diary Entry";
  entryIdInput.value = entry.id;
  entryTitleInput.value = entry.title;
  entryContentInput.value = entry.content;
  deleteEntryBtn.style.display = "block";
  entryModal.style.display = "flex";
  entryTitleInput.focus();
}

function closeModal() {
  entryModal.style.display = "none";
}

async function saveEntry() {
  const id = entryIdInput.value;
  const title = entryTitleInput.value.trim() || "Untitled Entry";
  const content = entryContentInput.value.trim();

  if (!content) {
    alert("Please write something in your diary entry.");
    return;
  }

  try {
    const timestamp = new Date();

    if (id) {
      await db.collection("entries").doc(id).update({
        title,
        content,
        updatedAt: timestamp,
      });
    } else {
      await db.collection("entries").add({
        title,
        content,
        timestamp,
        updatedAt: timestamp,
      });
    }

    closeModal();
    loadEntries();
  } catch (error) {
    console.error("Error saving entry:", error);
    alert("Error saving your entry. Please try again.");
  }
}

async function deleteEntry() {
  const id = entryIdInput.value;

  if (!id) return;

  if (
    confirm(
      "Are you sure you want to delete this entry? This action cannot be undone."
    )
  ) {
    try {
      await db.collection("entries").doc(id).delete();
      closeModal();
      loadEntries();
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Error deleting your entry. Please try again.");
    }
  }
}

// Search and Filter Functions
function populateDayFilter() {
  const year =
    filterYear.value !== "all"
      ? parseInt(filterYear.value)
      : currentDate.getFullYear();
  const month =
    filterMonth.value !== "all"
      ? parseInt(filterMonth.value)
      : currentDate.getMonth();

  while (filterDay.options.length > 1) {
    filterDay.remove(1);
  }

  if (filterYear.value !== "all" && filterMonth.value !== "all") {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      filterDay.appendChild(option);
    }
  }
}

function setupYearFilter() {
  filterYear.innerHTML = '<option value="all">All Years</option>';

  const currentYear = new Date().getFullYear();

  for (let year = currentYear - 5; year <= currentYear + 5; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;

    if (year === currentYear) {
      option.selected = true;
    }

    filterYear.appendChild(option);
  }
}

function setCurrentMonthInFilter() {
  filterMonth.value = currentDate.getMonth();
  populateDayFilter();
}

function switchView(view) {
  currentView = view;

  if (view === "calendar") {
    calendarViewBtn.classList.add("active");
    listViewBtn.classList.remove("active");
    document.querySelector(".calendar-navigation").style.display = "block";
    renderCalendar();
  } else {
    calendarViewBtn.classList.remove("active");
    listViewBtn.classList.add("active");
    document.querySelector(".calendar-navigation").style.display = "block";
    renderEntries();
  }
}

function clearCalendar() {
  calendarDays.innerHTML = "";
}

function highlightDaysWithEntries() {
  if (currentView !== "calendar") return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const dayCells = document.querySelectorAll(".calendar-day:not(.empty)");

  dayCells.forEach((cell) => {
    cell.classList.remove("has-entries");
  });

  const daysWithEntries = new Set();

  filteredEntries.forEach((entry) => {
    const entryDate = entry.timestamp;

    if (
      entryDate.getFullYear() === year &&
      entryDate.getMonth() === month
    ) {
      daysWithEntries.add(entryDate.getDate());
    }
  });

  dayCells.forEach((cell) => {
    const day = parseInt(cell.textContent);
    if (daysWithEntries.has(day)) {
      cell.classList.add("has-entries");
    }
  });
}

function updateCalendarTitle() {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  calendarTitle.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
}

function goToPreviousMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateCalendarTitle();
  renderCalendar();

  filterMonth.value = currentDate.getMonth();
  populateDayFilter();
}

function goToNextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateCalendarTitle();
  renderCalendar();

  filterMonth.value = currentDate.getMonth();
  populateDayFilter();
}

function goToToday() {
  currentDate = new Date();
  updateCalendarTitle();
  renderCalendar();

  filterYear.value = currentDate.getFullYear();
  filterMonth.value = currentDate.getMonth();
  populateDayFilter();
}

function formatDate(date) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showEmptyState() {
  entriesContainer.style.display = "none";
  paginationControls.style.display = "none";
  emptyState.style.display = "block";
}

function hideEmptyState() {
  entriesContainer.style.display = "grid";
  emptyState.style.display = "none";
}

function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `message ${type}`;
  element.style.display = "block";

  setTimeout(() => {
    element.style.display = "none";
  }, 5000);
}

function handleSearch() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  if (searchTerm) {
    filteredEntries = allEntries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(searchTerm) ||
        entry.content.toLowerCase().includes(searchTerm)
    );
  } else {
    filteredEntries = [...allEntries];
    applyDateFilters();
  }

  currentPage = 1;

  if (currentView === "list") {
    renderEntries();
  } else {
    highlightDaysWithEntries();
  }
}

function handleFilterChange() {
  updateActiveFilters();
  applyDateFilters();

  if (currentView === "list") {
    currentPage = 1;
    renderEntries();
  } else {
    highlightDaysWithEntries();
  }
}

function updateActiveFilters() {
  const yearValue = filterYear.value;
  const monthValue = filterMonth.value;
  const dayValue = filterDay.value;

  activeFiltersMap.clear();

  if (yearValue !== "all") {
    activeFiltersMap.set("year", {
      value: yearValue,
      label: `Year: ${yearValue}`,
    });
  }

  if (monthValue !== "all") {
    const monthName = filterMonth.options[filterMonth.selectedIndex].text;
    activeFiltersMap.set("month", {
      value: monthValue,
      label: `Month: ${monthName}`,
    });
  }

  if (dayValue !== "all") {
    activeFiltersMap.set("day", {
      value: dayValue,
      label: `Day: ${dayValue}`,
    });
  }

  renderFilterTags();
}

function renderFilterTags() {
  filterTags.innerHTML = "";

  if (activeFiltersMap.size > 0) {
    activeFilters.style.display = "flex";

    activeFiltersMap.forEach((filter, key) => {
      const tag = document.createElement("div");
      tag.className = "active-filter-tag";
      tag.innerHTML = `${filter.label} <button data-filter="${key}">×</button>`;

      tag.querySelector("button").addEventListener("click", () => {
        removeFilter(key);
      });

      filterTags.appendChild(tag);
    });
  } else {
    activeFilters.style.display = "none";
  }
}

function removeFilter(filterKey) {
  activeFiltersMap.delete(filterKey);

  if (filterKey === "year") {
    filterYear.value = "all";
  } else if (filterKey === "month") {
    filterMonth.value = "all";
  } else if (filterKey === "day") {
    filterDay.value = "all";
  }

  renderFilterTags();
  applyDateFilters();

  if (currentView === "list") {
    currentPage = 1;
    renderEntries();
  } else {
    highlightDaysWithEntries();
  }
}

function clearAllFilters() {
  activeFiltersMap.clear();
  filterYear.value = "all";
  filterMonth.value = "all";
  filterDay.value = "all";
  searchInput.value = "";

  renderFilterTags();

  filteredEntries = [...allEntries];

  if (currentView === "list") {
    currentPage = 1;
    renderEntries();
  } else {
    highlightDaysWithEntries();
  }
}

function applyDateFilters() {
  const yearFilter = activeFiltersMap.get("year");
  const monthFilter = activeFiltersMap.get("month");
  const dayFilter = activeFiltersMap.get("day");

  filteredEntries = allEntries.filter((entry) => {
    const entryDate = entry.timestamp;

    if (
      yearFilter &&
      parseInt(yearFilter.value) !== entryDate.getFullYear()
    ) {
      return false;
    }

    if (
      monthFilter &&
      parseInt(monthFilter.value) !== entryDate.getMonth()
    ) {
      return false;
    }

    if (dayFilter && parseInt(dayFilter.value) !== entryDate.getDate()) {
      return false;
    }

    return true;
  });

  const searchTerm = searchInput.value.trim().toLowerCase();
  if (searchTerm) {
    filteredEntries = filteredEntries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(searchTerm) ||
        entry.content.toLowerCase().includes(searchTerm)
    );
  }
}

function updatePagination() {
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

  if (totalPages <= 1) {
    paginationControls.style.display = "none";
    return;
  }

  paginationControls.style.display = "block";
  paginationButtons.innerHTML = "";

  const prevButton = document.createElement("button");
  prevButton.className = `pagination-button ${currentPage === 1 ? "disabled" : ""}`;
  prevButton.textContent = "Previous";

  if (currentPage > 1) {
    prevButton.addEventListener("click", () => {
      currentPage--;
      renderEntries();
    });
  }

  paginationButtons.appendChild(prevButton);

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    const firstButton = document.createElement("button");
    firstButton.className = "pagination-button";
    firstButton.textContent = "1";
    firstButton.addEventListener("click", () => {
      currentPage = 1;
      renderEntries();
    });
    paginationButtons.appendChild(firstButton);

    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "...";
      paginationButtons.appendChild(ellipsis);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.className = `pagination-button ${i === currentPage ? "active" : ""}`;
    pageButton.textContent = i;

    if (i !== currentPage) {
      pageButton.addEventListener("click", () => {
        currentPage = i;
        renderEntries();
      });
    }

    paginationButtons.appendChild(pageButton);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "...";
      paginationButtons.appendChild(ellipsis);
    }

    const lastButton = document.createElement("button");
    lastButton.className = "pagination-button";
    lastButton.textContent = totalPages;
    lastButton.addEventListener("click", () => {
      currentPage = totalPages;
      renderEntries();
    });
    paginationButtons.appendChild(lastButton);
  }

  const nextButton = document.createElement("button");
  nextButton.className = `pagination-button ${currentPage === totalPages ? "disabled" : ""}`;
  nextButton.textContent = "Next";

  if (currentPage < totalPages) {
    nextButton.addEventListener("click", () => {
      currentPage++;
      renderEntries();
    });
  }

  paginationButtons.appendChild(nextButton);

  paginationInfo.textContent = `Showing ${Math.min(
    filteredEntries.length,
    1 + (currentPage - 1) * entriesPerPage
  )}–${Math.min(
    filteredEntries.length,
    currentPage * entriesPerPage
  )} of ${filteredEntries.length} entries`;
}

function renderCalendar() {
  clearCalendar();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  updateCalendarTitle();

  filterMonth.value = month;

  const firstDay = new Date(year, month, 1);
  const startingDayOfWeek = firstDay.getDay();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startingDayOfWeek; i++) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day empty";
    calendarDays.appendChild(dayCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day";
    dayCell.textContent = day;

    const today = new Date();
    if (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    ) {
      dayCell.classList.add("today");
    }

    dayCell.addEventListener("click", () => {
      filterDay.value = day;
      updateActiveFilters();
      applyDateFilters();

      document.querySelectorAll(".calendar-day").forEach((cell) => {
        cell.classList.remove("selected");
      });

      dayCell.classList.add("selected");

      switchView("list");
    });

    calendarDays.appendChild(dayCell);
  }

  highlightDaysWithEntries();
}

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initializeDOMElements();
  setupEventListeners();
  setupYearFilter();
  setCurrentMonthInFilter();
  updateCalendarTitle();
  renderCalendar();

  // Check Authentication State
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      loginSection.style.display = "none";
      diarySection.style.display = "block";
      logoutBtn.style.display = "block";
      loadEntries();
    } else {
      currentUser = null;
      loginSection.style.display = "block";
      diarySection.style.display = "none";
      logoutBtn.style.display = "none";
    }
  });
});