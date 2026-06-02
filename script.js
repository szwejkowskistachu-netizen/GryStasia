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
        name: "Programowanie robotów",
        description: "Programuj roboty i pokonaj AI.",
        status: "gotowe",
        url: "gra/index.html"
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
    document.body.style.overflow = 'hidden';
    gameFrame.src = url;
    gameModal.style.display = 'block';
    setupMobileControls();
}

function closeGame() {
    gameModal.style.display = 'none';
    gameFrame.src = '';
    document.body.style.overflow = 'auto';
}

function setupMobileControls() {
    const controls = {
        'ctrl-up': 'ArrowUp',
        'ctrl-down': 'ArrowDown',
        'ctrl-left': 'ArrowLeft',
        'ctrl-right': 'ArrowRight',
        'ctrl-a': ' ', // Spacja
        'ctrl-b': 'Enter'
    };

    Object.keys(controls).forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;

        const key = controls[id];
        
        const handlePress = (e) => {
            e.preventDefault();
            const event = new KeyboardEvent('keydown', { key: key, bubbles: true });
            gameFrame.contentWindow.dispatchEvent(event);
            // Also dispatch to main window in case game listens there
            window.dispatchEvent(event);
        };

        const handleRelease = (e) => {
            e.preventDefault();
            const event = new KeyboardEvent('keyup', { key: key, bubbles: true });
            gameFrame.contentWindow.dispatchEvent(event);
            window.dispatchEvent(event);
        };

        btn.ontouchstart = handlePress;
        btn.ontouchend = handleRelease;
        btn.onmousedown = handlePress;
        btn.onmouseup = handleRelease;
    });
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
    console.log("Updating UI. isAdmin:", isAdmin);
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

// Automatyczna aktualizacja listy
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

updateUI();
