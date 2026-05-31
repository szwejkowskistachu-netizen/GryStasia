// Initial Example Projects
const defaultProjects = [
    {
        name: "Brawl Stars AI",
        description: "Moja wersja Brawl Stars.",
        status: "gotowe",
        url: "brawlstars/index.html"
    },
    {
        name: "Cursed Realm",
        description: "Mroczna przygoda w przeklętym świecie.",
        status: "gotowe",
        url: "cursed realm/index.html"
    },
    {
        name: "Flappy Bird AI",
        description: "Klasyczna gra flappy bird z elementami AI.",
        status: "gotowe",
        url: "flappy bird/index.html"
    },
    {
        name: "Geny i Ewolucja",
        description: "Symulacja genetyczna i ewolucja organizmów.",
        status: "gotowe",
        url: "geny/index.html"
    },
    {
        name: "Wojny AI",
        description: "Wielkie bitwy sztucznej inteligencji.",
        status: "gotowe",
        url: "WOJNY/index.html"
    },
    {
        name: "Malpa Dwa",
        description: "Kontynuacja przygód małpy.",
        status: "gotowe",
        url: "malpaDwa/index.html"
    },
    {
        name: "Robale",
        description: "Symulacja życia robaków.",
        status: "gotowe",
        url: "Robale/index.html"
    },
    {
        name: "Wykrywacz Kłamstw",
        description: "Zaawansowany system wykrywania prawdy.",
        status: "gotowe",
        url: "WYKRYWACZ KLAMSTW/index.html"
    },
    {
        name: "Horror",
        description: "Przerażająca gra typu horror.",
        status: "gotowe",
        url: "hoorror/index.html"
    },
    {
        name: "Super RPG",
        description: "Epicka przygoda w świecie fantasy.",
        status: "gotowe",
        url: "super rpg/index.html"
    },
    {
        name: "Geometry Dash",
        description: "Dynamiczna gra rytmiczna.",
        status: "gotowe",
        url: "geometry dash/index.html"
    },
    {
        name: "Taktyczna wojna AI",
        description: "AI walczą same, ustawiasz strategie i obserwujesz wyniki.",
        status: "plan"
    },
    {
        name: "Kolonia Marsjańska",
        description: "Zarządzanie bazą i przetrwanie kolonistów.",
        status: "plan"
    }
];

// State Management
let projects = JSON.parse(localStorage.getItem('myAIProjects')) || [...defaultProjects];
let isAdmin = sessionStorage.getItem('isAdmin') === 'true';

// DOM Elements
const projectsContainer = document.getElementById('projects-container');
const projectForm = document.getElementById('project-form');
const gameModal = document.getElementById('game-modal');
const gameFrame = document.getElementById('game-frame');
const resetBtn = document.getElementById('reset-projects');
const adminLogin = document.getElementById('admin-login');
const btnCreatePlan = document.getElementById('btn-create-plan');
const addProjectSection = document.getElementById('add-project');
const planSection = document.getElementById('creator-plan-section');
const loginStatusBar = document.getElementById('login-status-bar');

// Functions
function saveToLocalStorage() {
    localStorage.setItem('myAIProjects', JSON.stringify(projects));
}

function getStatusLabel(status) {
    switch (status) {
        case 'plan': return '🟡 plan';
        case 'w trakcie': return '🟠 w trakcie';
        case 'gotowe': return '🟢 gotowe';
        default: return status;
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'plan': return 'status-plan';
        case 'w trakcie': return 'status-w-trakcie';
        case 'gotowe': return 'status-gotowe';
        default: return '';
    }
}

function deleteProject(index) {
    if (!isAdmin) {
        alert('Tylko Twórca może usuwać projekty.');
        return;
    }
    if (confirm('Czy na pewno chcesz usunąć ten projekt?')) {
        projects.splice(index, 1);
        saveToLocalStorage();
        renderProjects();
    }
}

function openGame(url) {
    // Prevent double scrollbars and scrolling background
    document.body.style.overflow = 'hidden';
    
    // Clear and set src to reload the game properly
    gameFrame.src = "about:blank";
    
    setTimeout(() => {
        gameFrame.src = url;
        gameModal.style.display = 'block';
        
        // Wait for iframe to load, then inject responsive CSS
        gameFrame.onload = () => {
            try {
                const style = document.createElement('style');
                style.textContent = `
                    body, html { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: #000; }
                    canvas { max-width: 100vw !important; max-height: 100vh !important; width: auto !important; height: auto !important; object-fit: contain !important; }
                `;
                gameFrame.contentDocument.head.appendChild(style);
            } catch (e) {
                console.log("Cross-origin game detected, standard CSS scaling applied via style.css");
            }
        };
    }, 10);
}

function closeGame() {
    gameModal.style.display = 'none';
    gameFrame.src = '';
    document.body.style.overflow = 'auto';
}

// Drag/Pan functionality for the game frame
let isDragging = false;
let startX, startY;
let scrollLeft, scrollTop;

const startDragging = (e) => {
    isDragging = true;
    
    // Handle touch or mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    startX = clientX;
    startY = clientY;
    
    const content = document.querySelector('.modal-content');
    scrollLeft = content.scrollLeft;
    scrollTop = content.scrollTop;
    content.style.cursor = 'grabbing';
};

const stopDragging = () => {
    isDragging = false;
    const content = document.querySelector('.modal-content');
    if (content) content.style.cursor = 'grab';
};

const move = (e) => {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - startX;
    const dy = clientY - startY;
    
    const content = document.querySelector('.modal-content');
    content.scrollLeft = scrollLeft - dx;
    content.scrollTop = scrollTop - dy;
};

// Modal interaction for panning
const modalContent = document.querySelector('.modal-content');
if (modalContent) {
    modalContent.style.cursor = 'grab';
    modalContent.style.overflow = 'auto'; 
    
    modalContent.addEventListener('mousedown', startDragging);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('mousemove', move);
    
    modalContent.addEventListener('touchstart', startDragging, { passive: true });
    window.addEventListener('touchend', stopDragging);
    window.addEventListener('touchmove', move, { passive: true });
}

// Zamknij modal po kliknięciu poza zawartość
window.onclick = function(event) {
    if (event.target == gameModal) {
        closeGame();
    }
}

function renderProjects() {
    if (!projectsContainer) return;
    projectsContainer.innerHTML = '';
    
    projects.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        let actionButton = `<button onclick="alert('Szczegóły projektu: ${project.name}')">Szczegóły</button>`;
        if (project.url) {
            actionButton = `<button onclick="openGame('${project.url}')">Graj / Zobacz</button>`;
        }
        
        let deleteBtn = isAdmin ? `<button onclick="deleteProject(${index})" style="border: none; background: transparent; color: #ef4444; font-size: 1.2rem; cursor: pointer; padding: 0 5px;">&times;</button>` : '';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <h3>${project.name}</h3>
                ${deleteBtn}
            </div>
            <span class="project-status ${getStatusClass(project.status)}">${getStatusLabel(project.status)}</span>
            <p>${project.description}</p>
            ${actionButton}
        `;
        
        projectsContainer.appendChild(card);
    });
}

function updateUI() {
    if (isAdmin) {
        if (addProjectSection) addProjectSection.style.display = 'block';
        if (planSection) planSection.style.display = 'none';
        if (loginStatusBar) loginStatusBar.style.display = 'block';
        if (adminLogin) {
            adminLogin.style.color = '#4ade80';
            adminLogin.innerText = 'Panel Aktywny';
        }
    } else {
        if (addProjectSection) addProjectSection.style.display = 'none';
        if (planSection) planSection.style.display = 'block';
        if (loginStatusBar) loginStatusBar.style.display = 'none';
        if (adminLogin) {
            adminLogin.style.color = '';
            adminLogin.innerText = 'Panel Twórcy';
        }
    }
    renderProjects();
}

function handleLogin() {
    const password = prompt('Podaj hasło Twórcy:');
    if (password === 'Stasiu2015!') {
        isAdmin = true;
        sessionStorage.setItem('isAdmin', 'true');
        alert('Witaj Stasiu! Możesz teraz dodawać nowe projekty.');
        updateUI();
    } else {
        alert('Błędne hasło. Tylko Twórca może zarządzać projektami.');
    }
}

// Event Listeners
if (btnCreatePlan) {
    btnCreatePlan.addEventListener('click', handleLogin);
}

if (adminLogin) {
    adminLogin.addEventListener('click', handleLogin);
}

if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (!isAdmin) {
            alert('Tylko Twórca może resetować listę.');
            return;
        }
        if (confirm('Czy na pewno chcesz zresetować listę projektów do domyślnych gier? Twoje dodane projekty znikną.')) {
            projects = [...defaultProjects];
            saveToLocalStorage();
            renderProjects();
        }
    });
}

if (projectForm) {
    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newProject = {
            name: document.getElementById('projectName').value,
            description: document.getElementById('projectDesc').value,
            status: document.getElementById('projectStatus').value,
            url: ""
        };
        
        projects.push(newProject);
        saveToLocalStorage();
        renderProjects();
        
        projectForm.reset();
        alert('Projekt dodany pomyślnie!');
    });
}

// Automatyczna aktualizacja listy, jeśli dodano nowe domyślne projekty w kodzie
const storedProjects = JSON.parse(localStorage.getItem('myAIProjects'));
if (storedProjects) {
    let updated = false;
    defaultProjects.forEach(defProj => {
        if (!storedProjects.some(p => p.name === defProj.name)) {
            projects.push(defProj);
            updated = true;
        }
    });
    if (updated) {
        saveToLocalStorage();
    }
} else {
    saveToLocalStorage();
}

// Initial UI Setup
updateUI();
