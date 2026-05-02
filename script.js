// ========== CONFIGURATION ==========
const CONFIG = {
    unlockGoal: 150, // Total pages to reach before tree unlocks
    tree: [
        {
            id: 1,
            type: 'book',
            name: 'Pride and Prejudice',
            totalPages: 426,
            level: 1,
            x: 50,
            children: [2, 3]
        },
        {
            id: 2,
            type: 'gift',
            name: 'Bookmark Set',
            level: 2,
            x: 20,
            children: [4]
        },
        {
            id: 3,
            type: 'book',
            name: 'Jane Eyre',
            totalPages: 576,
            level: 2,
            x: 80,
            children: [5]
        },
        {
            id: 4,
            type: 'book',
            name: 'The Adventures of Sherlock Holmes',
            totalPages: 336,
            level: 3,
            x: 20,
            children: [6]
        },
        {
            id: 5,
            type: 'gift',
            name: 'Book Light',
            level: 3,
            x: 80,
            children: [7]
        },
        {
            id: 6,
            type: 'book',
            name: 'Dracula',
            totalPages: 464,
            level: 4,
            x: 20,
            children: [8]
        },
        {
            id: 7,
            type: 'book',
            name: 'Frankenstein',
            totalPages: 240,
            level: 4,
            x: 80,
            children: []
        },
        {
            id: 8,
            type: 'gift',
            name: 'Cozy Reading Blanket',
            level: 5,
            x: 50,
            children: []
        }
    ]
};

// Data persistence
let userData = JSON.parse(localStorage.getItem('readingQuestData')) || {
    totalPagesRead: 0,
    nodes: {}, // { nodeId: { obtained: bool, currentPage: number } }
    unlocked: false
};

// Ensure nodes object exists
if (!userData.nodes) {
    userData.nodes = {};
}

// Initialize nodes from config
if (Object.keys(userData.nodes).length === 0) {
    CONFIG.tree.forEach(node => {
        userData.nodes[node.id] = {
            obtained: node.id === 1 ? true : false, // First book starts unlocked
            currentPage: 0,
            finished: false
        };
    });
}

function saveData() {
    localStorage.setItem('readingQuestData', JSON.stringify(userData));
}

function addProgress() {
    const pageInput = document.getElementById('pageInput');
    const currentPage = parseInt(pageInput.value);

    if (isNaN(currentPage) || currentPage < 0) {
        alert('Please enter a valid page number');
        return;
    }

    // Update the first book's current page
    userData.nodes[1].currentPage = currentPage;
    userData.totalPagesRead = currentPage;
    updateProgressBar();

    // Check if we should unlock the tree
    if (userData.totalPagesRead >= CONFIG.unlockGoal && !userData.unlocked) {
        userData.unlocked = true;
        userData.nodes[1].obtained = true;
        saveData();
        unlockTree();
    } else {
        saveData();
    }

    pageInput.value = '';
}

function updateNodeProgress(nodeId) {
    const node = CONFIG.tree.find(n => n.id === nodeId);
    if (!node || node.type !== 'book') return;

    const nodeElement = document.querySelector(`[data-node="${nodeId}"]`);
    const pageInput = nodeElement.querySelector('.page-input');
    const currentPage = parseInt(pageInput.value);

    if (isNaN(currentPage) || currentPage < 0) {
        alert('Please enter a valid page number');
        return;
    }

    userData.nodes[nodeId].currentPage = currentPage;
    
    // Check if book is finished and mark it
    if (currentPage >= node.totalPages && !userData.nodes[nodeId].finished) {
        userData.nodes[nodeId].finished = true;
        
        // Unlock children
        // Unlock children only if the node is a book
        if (node.type === 'book') {
            node.children.forEach(childId => {
                userData.nodes[childId].obtained = true;
            });
        }
        
        celebrateUnlock();
        // Re-render tree BEFORE updating display
        renderSkillTree();
    }

    saveData();
    updateTreeDisplay();
    pageInput.value = '';
}

function finishBook(nodeId) {
    const confirmed = confirm('🎉 Are you sure you finished this book? This will unlock new books!');
    if (!confirmed) return;

    userData.nodes[nodeId].finished = true;
    
    // Unlock children
    const node = CONFIG.tree.find(n => n.id === nodeId);
    if (node && node.children) {
        node.children.forEach(childId => {
            userData.nodes[childId].obtained = true;
        });
    }

    saveData();
    celebrateUnlock();
    // Re-render tree to show newly unlocked children
    renderSkillTree();
    updateTreeDisplay();
}

function forceFinishBook(nodeId) {
    const node = CONFIG.tree.find(n => n.id === nodeId);
    if (!node || node.type !== 'book') return;
    
    const confirmed = confirm(`🎉 Mark "${node.name}" as finished?`);
    if (!confirmed) return;

    userData.nodes[nodeId].currentPage = node.totalPages;
    userData.nodes[nodeId].finished = true;
    
    // Unlock children
    if (node && node.children) {
        node.children.forEach(childId => {
            userData.nodes[childId].obtained = true;
        });
    }

    saveData();
    celebrateUnlock();
    renderSkillTree();
    updateTreeDisplay();
}

function openGift(nodeId) {
    if (!userData.nodes[nodeId].opened) {
        userData.nodes[nodeId].opened = true;
        
        // Unlock children
        const node = CONFIG.tree.find(n => n.id === nodeId);
        if (node && node.children) {
            node.children.forEach(childId => {
                userData.nodes[childId].obtained = true;
            });
        }
        
        saveData();
        celebrateUnlock();
        renderSkillTree();
        updateTreeDisplay();
    }
}

function celebrateUnlock() {
    // Create celebration effect
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.innerHTML = '✨🎉✨ Amazing! ✨🎉✨';
    document.body.appendChild(celebration);
    
    setTimeout(() => celebration.remove(), 2000);
}

function updateProgressBar() {
    const percentage = Math.min((userData.totalPagesRead / CONFIG.unlockGoal) * 100, 100);
    document.getElementById('progressFill').style.width = percentage + '%';
    
    let milestone = '';
    if (percentage >= 85) milestone = ' 🌟 Almost there! 85%+ 🌟';
    else if (percentage >= 50) milestone = ' 🎉 Halfway there! 50%+ 🎉';
    
    document.getElementById('progressText').textContent = 
        `${userData.totalPagesRead} / ${CONFIG.unlockGoal} pages read${milestone}`;
}

function updateTreeDisplay() {
    CONFIG.tree.forEach(node => {
        const element = document.querySelector(`[data-node="${node.id}"]`);
        if (!element) return;

        if (userData.nodes[node.id].obtained) {
            element.classList.remove('locked');
            element.classList.add('unlocked');
        }

        if (node.type === 'book') {
            const progressElement = element.querySelector('.book-progress');
            if (progressElement) {
                const currentPage = userData.nodes[node.id].currentPage;
                const progress = Math.min((currentPage / node.totalPages) * 100, 100);
                progressElement.style.width = progress + '%';
                
                const pageText = element.querySelector('.page-text');
                if (pageText) {
                    pageText.textContent = `${currentPage} / ${node.totalPages}`;
                }
            }
        }
    });

    // Update total pages
    let total = 0;
    CONFIG.tree.forEach(node => {
        if (node.type === 'book') {
            total += userData.nodes[node.id].currentPage;
        }
    });
    document.getElementById('totalPages').textContent = total;
}

function renderSkillTree() {
    const container = document.getElementById('skillTree');
    container.innerHTML = '';

    // Determine max level of obtained nodes
    let maxObtainedLevel = 1;
    CONFIG.tree.forEach(node => {
        if (userData.nodes[node.id].obtained && node.level > maxObtainedLevel) {
            maxObtainedLevel = node.level;
        }
    });

    // Group nodes by level
    const levels = {};
    CONFIG.tree.forEach(node => {
        // Only show nodes that are:
        // 1. Obtained, OR
        // 2. At the next level (teased)
        if (userData.nodes[node.id].obtained || node.level === maxObtainedLevel + 1) {
            if (!levels[node.level]) levels[node.level] = [];
            levels[node.level].push(node);
        }
    });

    // Create SVG for connections
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.className = 'tree-connections';
    svg.setAttribute('viewBox', '0 0 1000 1200');
    container.appendChild(svg);

    // Render each level
    Object.keys(levels).sort((a, b) => a - b).forEach(levelKey => {
        const level = levels[levelKey];
        const levelDiv = document.createElement('div');
        levelDiv.className = `tree-level level-${levelKey}`;

        level.forEach(node => {
            const nodeEl = createNodeElement(node);
            levelDiv.appendChild(nodeEl);
        });

        container.appendChild(levelDiv);
    });

    // Draw connections
    drawConnections(svg);
    
    // Add keypress handlers to all page inputs
    document.querySelectorAll('.page-input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const nodeId = parseInt(this.closest('[data-node]').getAttribute('data-node'));
                updateNodeProgress(nodeId);
            }
        });
    });
}

function createNodeElement(node) {
    const isObtained = userData.nodes[node.id].obtained;
    const nodeEl = document.createElement('div');
    nodeEl.className = `node ${node.type} ${isObtained ? 'unlocked' : 'locked'}`;
    nodeEl.setAttribute('data-node', node.id);
    nodeEl.setAttribute('data-level', node.level);

    if (node.type === 'book') {
        const currentPage = userData.nodes[node.id].currentPage;
        const progress = Math.min((currentPage / node.totalPages) * 100, 100);
        const isNearEnd = progress >= 90;
        const isFinished = userData.nodes[node.id].finished || currentPage >= node.totalPages;
        
        if (isNearEnd) nodeEl.classList.add('near-completion');
        if (isFinished) nodeEl.classList.add('book-finished');

        // For locked books, only show if it's the next layer (teased)
        if (!isObtained) {
            nodeEl.innerHTML = `
                <div class="node-content">
                    <div class="node-title">??? (Locked)</div>
                    <div class="locked-label">🔒 Complete previous books to unlock</div>
                </div>
            `;
        } else {
            nodeEl.innerHTML = `
                <div class="node-content">
                    <div class="node-title">${node.name}</div>
                    <div class="book-progress-container ${isNearEnd ? 'near-end' : ''} ${isFinished ? 'finished' : ''}">
                        <div class="book-progress" style="width: ${progress}%"></div>
                    </div>
                    <div class="page-text">${currentPage} / ${node.totalPages}</div>
                    ${isFinished ? `
                        <div class="finished-badge">✅ All done!</div>
                    ` : `
                        <div class="node-input-group">
                            <input type="number" class="page-input" placeholder="Current page" value="${currentPage}" min="0" max="${node.totalPages}">
                            <button class="update-btn" onclick="updateNodeProgress(${node.id})">Update</button>
                            <button class="force-finish-btn" onclick="forceFinishBook(${node.id})">I'm Done!</button>
                        </div>
                    `}
                </div>
            `;
        }
    } else if (node.type === 'gift') {
        const isOpened = userData.nodes[node.id].opened;
        nodeEl.classList.add('gift-node');
        
        if (!isObtained) {
            nodeEl.innerHTML = `
                <div class="node-content">
                    <div class="locked-label">🔒 Locked</div>
                </div>
            `;
        } else {
            nodeEl.innerHTML = `
                <div class="node-content">
                    ${!isOpened ? `
                        <button class="gift-btn" onclick="openGift(${node.id})">🎁</button>
                    ` : `
                        <div class="gift-obtained">✨ ${node.name} ✨</div>
                    `}
                </div>
            `;
        }
    }

    return nodeEl;
}

function drawConnections(svg) {
    CONFIG.tree.forEach(node => {
        if (!node.children || node.children.length === 0) return;

        node.children.forEach(childId => {
            const parentEl = document.querySelector(`[data-node="${node.id}"]`);
            const childEl = document.querySelector(`[data-node="${childId}"]`);

            if (parentEl && childEl) {
                const parentRect = parentEl.getBoundingClientRect();
                const childRect = childEl.getBoundingClientRect();
                const containerRect = document.getElementById('skillTree').getBoundingClientRect();

                const x1 = parentRect.left - containerRect.left + parentRect.width / 2;
                const y1 = parentRect.top - containerRect.top + parentRect.height;
                const x2 = childRect.left - containerRect.left + childRect.width / 2;
                const y2 = childRect.top - containerRect.top;

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                line.setAttribute('d', `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2} ${x2} ${y2}`);
                line.setAttribute('class', 'connection-line');
                svg.appendChild(line);
            }
        });
    });
}

function unlockTree() {
    document.getElementById('lockedState').classList.remove('active');
    document.getElementById('unlockedState').classList.add('active');
    
    // Render tree before celebration
    renderSkillTree();
    updateTreeDisplay();
    
    // Festive celebration
    const header = document.querySelector('header');
    header.classList.add('celebration-mode');
    
    // Play celebration effect
    celebrateUnlock();
}

function initialize() {
    if (userData.unlocked) {
        document.getElementById('lockedState').classList.remove('active');
        document.getElementById('unlockedState').classList.add('active');
        renderSkillTree();
        updateTreeDisplay();
    } else {
        updateProgressBar();
        // Add Enter key handler to first page input
        const pageInput = document.getElementById('pageInput');
        if (pageInput) {
            pageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    addProgress();
                }
            });
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initialize);
