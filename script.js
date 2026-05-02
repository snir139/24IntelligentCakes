// Data persistence
let userData = JSON.parse(localStorage.getItem('readingQuestData')) || {
    totalPages: 0,
    books: {
        1: 0,
        2: 0,
        3: 0,
        4: 0
    },
    unlocked: false
};

const UNLOCK_GOAL = 50;
const BOOK_GOALS = {
    1: 100,
    2: 80,
    3: 120,
    4: 90
};

function saveData() {
    localStorage.setItem('readingQuestData', JSON.stringify(userData));
}

function addProgress() {
    const pageInput = document.getElementById('pageInput');
    const pages = parseInt(pageInput.value);

    if (isNaN(pages) || pages <= 0) {
        alert('Please enter a valid number of pages');
        return;
    }

    userData.totalPages += pages;
    updateProgressBar();

    if (userData.totalPages >= UNLOCK_GOAL && !userData.unlocked) {
        userData.unlocked = true;
        saveData();
        unlockTree();
    } else {
        saveData();
    }

    pageInput.value = '';
}

function updateBook(bookId) {
    const bookElement = document.querySelector(`[data-book="${bookId}"]`);
    const pageInput = bookElement.querySelector('.page-input');
    const pages = parseInt(pageInput.value);

    if (isNaN(pages) || pages < 0) {
        alert('Please enter a valid number of pages');
        return;
    }

    userData.books[bookId] = pages;
    saveData();
    updateStats();
    pageInput.value = '';
}

function updateProgressBar() {
    const percentage = Math.min((userData.totalPages / UNLOCK_GOAL) * 100, 100);
    document.getElementById('progressFill').style.width = percentage + '%';
    document.getElementById('progressText').textContent = 
        `${userData.totalPages} / ${UNLOCK_GOAL} pages read`;
}

function updateStats() {
    let totalPages = Object.values(userData.books).reduce((a, b) => a + b, 0);
    let completedBooks = Object.keys(userData.books).filter(
        bookId => userData.books[bookId] >= BOOK_GOALS[bookId]
    ).length;

    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('booksCompleted').textContent = completedBooks;
}

function unlockTree() {
    document.getElementById('lockedState').classList.remove('active');
    document.getElementById('unlockedState').classList.add('active');
}

function initialize() {
    if (userData.unlocked) {
        document.getElementById('lockedState').classList.remove('active');
        document.getElementById('unlockedState').classList.add('active');
        updateStats();
    } else {
        updateProgressBar();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initialize);
