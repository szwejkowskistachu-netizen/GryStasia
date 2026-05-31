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
        name: "Snake Jungle",
        description: "Klasyczny wąż w dżungli.",
        status: "gotowe",
        url: "snake-jungle/index.html"
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
        name: "Labirynt",
        description: "Znajdź wyjście z trudnego labiryntu.",
        status: "gotowe",
        url: "labirynt/index.html"
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

// DOM Elements
const projectsContainer = document.getElementById('projects-container');
const projectForm = document.getElementById('project-form');
const gameModal = document.getElementById('game-modal');
const gameFrame = document.getElementById('game-frame');
const resetBtn = document.getElementById('reset-projects');
const adminLogin = document.getElementById('admin-login');
const addProjectSection = document.getElementById('add-project');

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
    if (confirm('Czy na pewno chcesz usunąć ten projekt?')) {
        projects.splice(index, 1);
        saveToLocalStorage();
        renderProjects();
    }
}

function openGame(url) {
    gameFrame.src = url;
    gameModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; 
}

function closeGame() {
    gameModal.style.display = 'none';
    gameFrame.src = '';
    document.body.style.overflow = 'auto';
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
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <h3>${project.name}</h3>
                <button onclick="deleteProject(${index})" style="border: none; background: transparent; color: #ef4444; font-size: 1.2rem; cursor: pointer; padding: 0 5px;">&times;</button>
            </div>
            <span class="project-status ${getStatusClass(project.status)}">${getStatusLabel(project.status)}</span>
            <p>${project.description}</p>
            ${actionButton}
        `;
        
        projectsContainer.appendChild(card);
    });
}

// Event Listeners
if (adminLogin) {
    adminLogin.addEventListener('click', () => {
        const password = prompt('Podaj hasło Twórcy:');
        if (password === 'admin') {
            addProjectSection.style.display = 'block';
            adminLogin.style.color = '#4ade80';
            adminLogin.innerText = 'Panel Aktywny';
            alert('Witaj Twórco! Formularz dodawania jest teraz widoczny.');
        } else {
            alert('Błędne hasło. Tylko Twórca może dodawać projekty.');
        }
    });
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
    });
}

// Initial Render
renderProjects();

// Automatyczna aktualizacja listy, jeśli dodano nowe domyślne projekty
if (localStorage.getItem('myAIProjects')) {
    const storedProjects = JSON.parse(localStorage.getItem('myAIProjects'));
    let updated = false;
    defaultProjects.forEach(defProj => {
        if (!storedProjects.some(p => p.name === defProj.name)) {
            projects.push(defProj);
            updated = true;
        }
    });
    if (updated) {
        saveToLocalStorage();
        renderProjects();
    }
} else {
    saveToLocalStorage();
}
