// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCFoLdL8GczI9OAzpy4fJZvCTk7EcmOFvo",
  authDomain: "ibrahim-diary-6031f.firebaseapp.com",
  projectId: "ibrahim-diary-6031f",
  storageBucket: "ibrahim-diary-6031f.firebasestorage.app",
  messagingSenderId: "693904501239",
  appId: "1:693904501239:web:7d9d7e400d68fad12ca6f2",
  measurementId: "G-H9X2WDZTJ9",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM Elements
const loginSection = document.getElementById("login-section");
const diarySection = document.getElementById("diary-section");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("login-message");
const entriesContainer = document.getElementById("entries-container");
const emptyState = document.getElementById("empty-state");
const newEntryBtn = document.getElementById("new-entry-btn");
const emptyNewEntryBtn = document.getElementById("empty-new-entry-btn");
const entryModal = document.getElementById("entry-modal");
const closeModalBtn = document.querySelector(".close-modal");
const modalTitle = document.getElementById("modal-title");
const entryIdInput = document.getElementById("entry-id");
const entryTitleInput = document.getElementById("entry-title");
const entryContentInput = document.getElementById("entry-content");
const saveEntryBtn = document.getElementById("save-entry-btn");
const deleteEntryBtn = document.getElementById("delete-entry-btn");
const searchInput = document.getElementById("search-input");
const paginationControls = document.getElementById("pagination-controls");
const paginationButtons = document.getElementById("pagination-buttons");
const paginationInfo = document.getElementById("pagination-info");
const calendarDays = document.getElementById("calendar-days");
const calendarTitle = document.getElementById("calendar-title");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const todayBtn = document.getElementById("today-btn");
const calendarViewBtn = document.getElementById("calendar-view-btn");
const listViewBtn = document.getElementById("list-view-btn");
const filterYear = document.getElementById("filter-year");
const filterMonth = document.getElementById("filter-month");
const filterDay = document.getElementById("filter-day");
const activeFilters = document.getElementById("active-filters");
const filterTags = document.getElementById("filter-tags");
const clearFiltersBtn = document.getElementById("clear-filters");

// Global Variables
let currentUser = null;
let allEntries = [];
let filteredEntries = [];
let currentPage = 1;
const entriesPerPage = 5;
let currentDate = new Date();
let currentView = "calendar"; // 'calendar' or 'list'
let activeFiltersMap = new Map();

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  setupYearFilter();
  setCurrentMonthInFilter();
  updateCalendarTitle();
  renderCalendar();
});

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

// Window click event to close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === entryModal) {
    closeModal();
  }
});

// Authentication Functions
async function handleLogin() {
  const password = passwordInput.value.trim();

  if (!password) {
    showMessage(loginMessage, "Please enter your password.", "error");
    return;
  }

  try {
    // Using email/password auth with a fixed email for simplicity
    // In a real app, you might want to use a more secure approach
    await auth.signInWithEmailAndPassword(
      "ibrahimmustafa787898@gmail.com",
      password
    );

    // Clear the form and any messages
    passwordInput.value = "";
    loginMessage.style.display = "none";

    // Display the diary section
    loginSection.style.display = "none";
    diarySection.style.display = "block";
    logoutBtn.style.display = "block";

    // Load entries
    loadEntries();
  } catch (error) {
    showMessage(loginMessage, "Invalid password. Please try again.", "error");
  }
}

function handleLogout() {
  auth
    .signOut()
    .then(() => {
      // Switch back to login view
      diarySection.style.display = "none";
      loginSection.style.display = "block";
      logoutBtn.style.display = "none";

      // Clear any loaded data
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
    // If we have entries but none on this page (e.g., after filtering),
    // go back to first page
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
      // Update existing entry
      await db.collection("entries").doc(id).update({
        title,
        content,
        updatedAt: timestamp,
      });
    } else {
      // Create new entry
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

// Function to populate days in the day filter dropdown
function populateDayFilter() {
  const year =
    filterYear.value !== "all"
      ? parseInt(filterYear.value)
      : currentDate.getFullYear();
  const month =
    filterMonth.value !== "all"
      ? parseInt(filterMonth.value)
      : currentDate.getMonth();

  // Clear existing options except "All Days"
  while (filterDay.options.length > 1) {
    filterDay.remove(1);
  }

  // If both year and month are selected, populate days
  if (filterYear.value !== "all" && filterMonth.value !== "all") {
    // Get number of days in the selected month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add day options
    for (let i = 1; i <= daysInMonth; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      filterDay.appendChild(option);
    }
  }
}

// Function to set up the year filter with appropriate years
function setupYearFilter() {
  // Clear existing options
  filterYear.innerHTML = '<option value="all">All Years</option>';

  // Get current year
  const currentYear = new Date().getFullYear();

  // Add 5 years before and after current year
  for (let year = currentYear - 5; year <= currentYear + 5; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;

    // Set current year as selected
    if (year === currentYear) {
      option.selected = true;
    }

    filterYear.appendChild(option);
  }
}

// Function to set current month in filter
function setCurrentMonthInFilter() {
  filterMonth.value = currentDate.getMonth();
  populateDayFilter(); // Populate days after setting month
}

// Update the existing event listeners section to include these changes
filterYear.addEventListener("change", function () {
  handleFilterChange();
  populateDayFilter(); // Repopulate days when year changes
});

filterMonth.addEventListener("change", function () {
  handleFilterChange();
  populateDayFilter(); // Repopulate days when month changes
});

// Function to switch between calendar and list views
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

// Function to clear the calendar
function clearCalendar() {
  calendarDays.innerHTML = "";
}

// Function to highlight days with entries
function highlightDaysWithEntries() {
  // Only apply if calendar view is active
  if (currentView !== "calendar") return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get all day cells
  const dayCells = document.querySelectorAll(".calendar-day:not(.empty)");

  // Remove any existing has-entries classes
  dayCells.forEach((cell) => {
    cell.classList.remove("has-entries");
  });

  // Create a set of days that have entries
  const daysWithEntries = new Set();

  filteredEntries.forEach((entry) => {
    const entryDate = entry.timestamp;

    // Check if the entry is in the current month and year
    if (entryDate.getFullYear() === year && entryDate.getMonth() === month) {
      daysWithEntries.add(entryDate.getDate());
    }
  });

  // Highlight days with entries
  dayCells.forEach((cell) => {
    const day = parseInt(cell.textContent);
    if (daysWithEntries.has(day)) {
      cell.classList.add("has-entries");
    }
  });
}

// Function to update calendar title
function updateCalendarTitle() {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  calendarTitle.textContent = `${
    monthNames[currentDate.getMonth()]
  } ${currentDate.getFullYear()}`;
}

// Navigation functions
function goToPreviousMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateCalendarTitle();
  renderCalendar();

  // Update month in filter to match calendar
  filterMonth.value = currentDate.getMonth();
  populateDayFilter();
}

function goToNextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateCalendarTitle();
  renderCalendar();

  // Update month in filter to match calendar
  filterMonth.value = currentDate.getMonth();
  populateDayFilter();
}

function goToToday() {
  currentDate = new Date();
  updateCalendarTitle();
  renderCalendar();

  // Update filters to match today's date
  filterYear.value = currentDate.getFullYear();
  filterMonth.value = currentDate.getMonth();
  populateDayFilter();
}

// Helper function to format date
function formatDate(date) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

// Helper function to escape HTML
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper functions for UI
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

  // Auto-hide after 5 seconds
  setTimeout(() => {
    element.style.display = "none";
  }, 5000);
}

// Initialize calendar when entries are loaded
document.addEventListener("DOMContentLoaded", () => {
  setupYearFilter();
  setCurrentMonthInFilter();
  updateCalendarTitle();
  renderCalendar();

  // Check for user auth state
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

  // Clear previous filters
  activeFiltersMap.clear();

  // Set new filters
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

  // Update filter tags UI
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

  // Reset the corresponding filter select
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

  // Reset filters and search
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

    // Apply year filter
    if (yearFilter && parseInt(yearFilter.value) !== entryDate.getFullYear()) {
      return false;
    }

    // Apply month filter
    if (monthFilter && parseInt(monthFilter.value) !== entryDate.getMonth()) {
      return false;
    }

    // Apply day filter
    if (dayFilter && parseInt(dayFilter.value) !== entryDate.getDate()) {
      return false;
    }

    return true;
  });

  // Apply any active search term
  const searchTerm = searchInput.value.trim().toLowerCase();
  if (searchTerm) {
    filteredEntries = filteredEntries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(searchTerm) ||
        entry.content.toLowerCase().includes(searchTerm)
    );
  }
}

// Pagination Functions
function updatePagination() {
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

  if (totalPages <= 1) {
    paginationControls.style.display = "none";
    return;
  }

  paginationControls.style.display = "block";
  paginationButtons.innerHTML = "";

  // Previous button
  const prevButton = document.createElement("button");
  prevButton.className = `pagination-button ${
    currentPage === 1 ? "disabled" : ""
  }`;
  prevButton.textContent = "Previous";

  if (currentPage > 1) {
    prevButton.addEventListener("click", () => {
      currentPage--;
      renderEntries();
    });
  }

  paginationButtons.appendChild(prevButton);

  // Page number buttons
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Adjust startPage if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // First page
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

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.className = `pagination-button ${
      i === currentPage ? "active" : ""
    }`;
    pageButton.textContent = i;

    if (i !== currentPage) {
      pageButton.addEventListener("click", () => {
        currentPage = i;
        renderEntries();
      });
    }

    paginationButtons.appendChild(pageButton);
  }

  // Last page
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

  // Next button
  const nextButton = document.createElement("button");
  nextButton.className = `pagination-button ${
    currentPage === totalPages ? "disabled" : ""
  }`;
  nextButton.textContent = "Next";

  if (currentPage < totalPages) {
    nextButton.addEventListener("click", () => {
      currentPage++;
      renderEntries();
    });
  }

  paginationButtons.appendChild(nextButton);

  // Update pagination info
  paginationInfo.textContent = `Showing ${Math.min(
    filteredEntries.length,
    1 + (currentPage - 1) * entriesPerPage
  )}–${Math.min(filteredEntries.length, currentPage * entriesPerPage)} of ${
    filteredEntries.length
  } entries`;
}

// Calendar Functions
function renderCalendar() {
  clearCalendar();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Update calendar title
  updateCalendarTitle();

  // Update filter month to match calendar
  filterMonth.value = month;

  // Get the first day of the month
  const firstDay = new Date(year, month, 1);
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Get the number of days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day empty";
    calendarDays.appendChild(dayCell);
  }

  // Create cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day";
    dayCell.textContent = day;

    // Check if this is today
    const today = new Date();
    if (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    ) {
      dayCell.classList.add("today");
    }

    // Add click event to filter by day
    dayCell.addEventListener("click", () => {
      // Set day filter
      filterDay.value = day;
      updateActiveFilters();
      applyDateFilters();

      // Remove selected class from all days
      document.querySelectorAll(".calendar-day").forEach((cell) => {
        cell.classList.remove("selected");
      });

      // Add selected class to clicked day
      dayCell.classList.add("selected");

      // Switch

      // Add this at the end of your current JavaScript code
      // Switch to list view to see the filtered entries
      switchView("list");
    });

    calendarDays.appendChild(dayCell);
  }

  // Check for entries on each day and highlight
  highlightDaysWithEntries();
}

function clearCalendar() {
  calendarDays.innerHTML = "";
}

function updateCalendarTitle() {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  calendarTitle.textContent = `${
    monthNames[currentDate.getMonth()]
  } ${currentDate.getFullYear()}`;
}

function highlightDaysWithEntries() {
  // Get all day cells
  const dayCells = document.querySelectorAll(".calendar-day:not(.empty)");

  // Reset has-entries class
  dayCells.forEach((cell) => {
    cell.classList.remove("has-entries");
  });

  // Get the current year and month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Check each day for entries
  filteredEntries.forEach((entry) => {
    const entryDate = entry.timestamp;

    // If the entry is from the current month and year
    if (entryDate.getFullYear() === year && entryDate.getMonth() === month) {
      const day = entryDate.getDate();
      const dayIndex = day - 1 + new Date(year, month, 1).getDay();

      // Find the corresponding day cell
      if (dayCells[dayIndex]) {
        dayCells[dayIndex].classList.add("has-entries");
      }
    }
  });
}

function goToPreviousMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function goToNextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

function goToToday() {
  currentDate = new Date();
  renderCalendar();

  // Update filters to match today
  filterYear.value = currentDate.getFullYear();
  filterMonth.value = currentDate.getMonth();
  updateActiveFilters();
}

function switchView(view) {
  currentView = view;

  if (view === "calendar") {
    calendarViewBtn.classList.add("active");
    listViewBtn.classList.remove("active");
    document.querySelector(".calendar-navigation").style.display = "block";
    paginationControls.style.display = "none";
  } else {
    // list view
    calendarViewBtn.classList.remove("active");
    listViewBtn.classList.add("active");
    document.querySelector(".calendar-navigation").style.display = "block";
    renderEntries();
  }
}

// Utility Functions
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

  // Hide the message after 5 seconds
  setTimeout(() => {
    element.style.display = "none";
  }, 5000);
}

function formatDate(date) {
  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function setupYearFilter() {
  // Get current year
  const currentYear = new Date().getFullYear();

  // Create options for the last 10 years
  filterYear.innerHTML = '<option value="all">All Years</option>';

  for (let year = currentYear; year >= currentYear - 9; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    filterYear.appendChild(option);
  }
}

function setCurrentMonthInFilter() {
  filterMonth.value = new Date().getMonth();
}

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
