// Konfiguracja i Stan Aplikacji
const state = {
    currentScreen: 'start-screen',
    selectedClass: '',
    selectedSubject: '',
    selectedChapter: '',
    isStudyMode: false,
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    testStartTime: null,
    timerInterval: null,
    stats: {
        history: JSON.parse(localStorage.getItem('test_history')) || []
    },
    chart: null
};

const subjects = [
    "Matematyka", "Język Polski", "Historia", "Biologia", 
    "Geografia", "Chemia", "Fizyka", "Informatyka", "Inne"
];

// Elementy DOM
const screens = document.querySelectorAll('.screen');
const classSelect = document.getElementById('class-select');
const subjectSelect = document.getElementById('subject-select');
const chapterSelect = document.getElementById('chapter-select');
const studyModeCheckbox = document.getElementById('study-mode');
const startTestBtn = document.getElementById('start-test-btn');
const themeToggle = document.getElementById('theme-toggle');
const statsNavBtn = document.getElementById('stats-nav-btn');

// Inicjalizacja
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    renderHistory();
});

function initApp() {
    // Obsługa wyboru klasy
    classSelect.addEventListener('change', (e) => {
        state.selectedClass = e.target.value;
        if (state.selectedClass) {
            populateSubjects();
            subjectSelect.disabled = false;
        } else {
            resetSelections();
        }
    });

    // Obsługa wyboru przedmiotu
    subjectSelect.addEventListener('change', async (e) => {
        state.selectedSubject = e.target.value;
        if (state.selectedSubject) {
            await loadChapters();
            chapterSelect.disabled = false;
        } else {
            chapterSelect.disabled = true;
            chapterSelect.innerHTML = '<option value="">Najpierw wybierz przedmiot</option>';
            startTestBtn.disabled = true;
        }
    });

    // Obsługa wyboru działu
    chapterSelect.addEventListener('change', (e) => {
        state.selectedChapter = e.target.value;
        startTestBtn.disabled = !state.selectedChapter;
    });

    // Przyciski nawigacji
    startTestBtn.addEventListener('click', startTest);
    themeToggle.addEventListener('click', toggleTheme);
    statsNavBtn.addEventListener('click', () => showScreen('stats-screen'));
    document.getElementById('close-stats-btn').addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('back-to-start-btn').addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('retry-test-btn').addEventListener('click', startTest);
    document.getElementById('next-q-btn').addEventListener('click', nextQuestion);
    document.getElementById('finish-test-btn').addEventListener('click', finishTest);
    document.getElementById('filter-subject').addEventListener('change', renderHistory);

    // Inicjalizacja filtra przedmiotów w statystykach
    const filterSubject = document.getElementById('filter-subject');
    subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        filterSubject.appendChild(opt);
    });
}

function populateSubjects() {
    subjectSelect.innerHTML = '<option value="">Wybierz przedmiot</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });
}

function resetSelections() {
    subjectSelect.disabled = true;
    subjectSelect.innerHTML = '<option value="">Najpierw wybierz klasę</option>';
    chapterSelect.disabled = true;
    chapterSelect.innerHTML = '<option value="">Najpierw wybierz przedmiot</option>';
    startTestBtn.disabled = true;
}

async function loadChapters() {
    // Statyczna baza działów na wypadek problemów z fetch/JSON
    const staticData = {
        "matematyka_4": {
            "Liczby i działania": [
                {"question": "12 + 15?", "options": ["27", "22", "37"], "answer": "27"},
                {"question": "20 - 5?", "options": ["15", "10", "25"], "answer": "15"},
                {"question": "3 * 4?", "options": ["12", "10", "15"], "answer": "12"},
                {"question": "10 / 2?", "options": ["5", "2", "10"], "answer": "5"},
                {"question": "100 + 200?", "options": ["300", "400", "500"], "answer": "300"},
                {"question": "50 - 10?", "options": ["40", "30", "60"], "answer": "40"},
                {"question": "6 * 7?", "options": ["42", "40", "48"], "answer": "42"},
                {"question": "81 / 9?", "options": ["9", "8", "7"], "answer": "9"},
                {"question": "15 + 15?", "options": ["30", "25", "35"], "answer": "30"},
                {"question": "1000 - 1?", "options": ["999", "990", "1001"], "answer": "999"}
            ],
            "Ułamki": [
                {"question": "Połowa to:", "options": ["1/2", "1/4", "1/1"], "answer": "1/2"},
                {"question": "Ćwiartka to:", "options": ["1/4", "1/2", "1/3"], "answer": "1/4"},
                {"question": "Trzy czwarte to:", "options": ["3/4", "1/4", "1/2"], "answer": "3/4"},
                {"question": "1/2 + 1/2 = ?", "options": ["1", "1/2", "1/4"], "answer": "1"},
                {"question": "Ułamek 5/5 to:", "options": ["1", "0", "5"], "answer": "1"},
                {"question": "Licznik ułamka 2/3 to:", "options": ["2", "3", "5"], "answer": "2"},
                {"question": "Mianownik ułamka 1/4 to:", "options": ["4", "1", "3"], "answer": "4"},
                {"question": "Większy ułamek to:", "options": ["1/2", "1/4", "1/8"], "answer": "1/2"},
                {"question": "Mniejszy ułamek to:", "options": ["1/10", "1/2", "1/5"], "answer": "1/10"},
                {"question": "Ułamek dziesiętny 0.5 to:", "options": ["1/2", "1/5", "1/10"], "answer": "1/2"}
            ],
            "Geometria": [
                {"question": "Ile boków ma kwadrat?", "options": ["4", "3", "5"], "answer": "4"},
                {"question": "Ile wierzchołków ma trójkąt?", "options": ["3", "4", "2"], "answer": "3"},
                {"question": "Kąt prosty ma stopni:", "options": ["90", "180", "45"], "answer": "90"},
                {"question": "Ile przekątnych ma kwadrat?", "options": ["2", "4", "0"], "answer": "2"},
                {"question": "Obwód kwadratu o boku 2:", "options": ["8", "4", "6"], "answer": "8"},
                {"question": "Pole kwadratu o boku 3:", "options": ["9", "6", "12"], "answer": "9"},
                {"question": "Trójkąt równoboczny ma boki:", "options": ["Równe", "Różne", "Dwa równe"], "answer": "Równe"},
                {"question": "Koło ma kąt pełny:", "options": ["360", "180", "90"], "answer": "360"},
                {"question": "Okrąg to:", "options": ["Linia krzywa", "Figura płaska", "Bryła"], "answer": "Linia krzywa"},
                {"question": "Średnica to:", "options": ["2 * promień", "Promień / 2", "Obwód"], "answer": "2 * promień"}
            ]
        },
        "język_polski_4": {
            "Gramatyka": [{"question": "Rzeczownik odpowiada na:", "options": ["Kto? Co?", "Jaki?", "Co robi?"], "answer": "Kto? Co?"}],
            "Ortografia": [{"question": "Rz_ka:", "options": ["Rzeka", "Rzaka", "Żeka"], "answer": "Rzeka"}]
        },
        "biologia_5": {
            "Komórka": [{"question": "Mózg komórki to:", "options": ["Jądro", "Wakuola", "Błona"], "answer": "Jądro"}],
            "Fotosynteza": [{"question": "Co wytwarzają rośliny?", "options": ["Pokarm i tlen", "Węgiel", "Wodę"], "answer": "Pokarm i tlen"}]
        },
        "geografia_5": {
            "Układ Słoneczny": [{"question": "Planeta z pierścieniami to:", "options": ["Saturn", "Jowisz", "Mars"], "answer": "Saturn"}],
            "Kontynenty": [{"question": "Ile jest kontynentów?", "options": ["7", "5", "6"], "answer": "7"}]
        },
        "historia_5": {
            "Polska Piastów": [{"question": "Pierwszy król?", "options": ["Bolesław Chrobry", "Mieszko I", "Łokietek"], "answer": "Bolesław Chrobry"}]
        },
        "informatyka_5": {
            "Budowa komputera": [{"question": "Pamięć stała to:", "options": ["Dysk twardy", "RAM", "Zasilacz"], "answer": "Dysk twardy"}]
        }
    };

    const subjectMap = {
        "Matematyka": "matematyka",
        "Język Polski": "język_polski",
        "Historia": "historia",
        "Biologia": "biologia",
        "Geografia": "geografia",
        "Informatyka": "informatyka"
    };
    
    const baseName = subjectMap[state.selectedSubject];
    const key = `${baseName}_${state.selectedClass}`;
    
    // Najpierw próbuj z JSON, jeśli zawiedzie - użyj statycznych danych
    const fileName = `${baseName}_klasa${state.selectedClass}.json`;
    const url = `data/${fileName}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Brak pliku JSON");
        const data = await response.json();
        state.allData = data;
        
        chapterSelect.innerHTML = '<option value="">Wybierz dział</option>';
        Object.keys(data).forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = chapter;
            chapterSelect.appendChild(option);
        });
    } catch (err) {
        console.warn("Używam danych awaryjnych:", key);
        if (staticData[key]) {
            state.allData = staticData[key];
            populateChapters(state.allData);
        } else {
            chapterSelect.innerHTML = '<option value="">Brak dostępnych działów</option>';
        }
    }
}

function populateChapters(data) {
    chapterSelect.innerHTML = '<option value="">Wybierz dział</option>';
    Object.keys(data).forEach(chapter => {
        const option = document.createElement('option');
        option.value = chapter;
        option.textContent = chapter;
        chapterSelect.appendChild(option);
    });
}

function showScreen(screenId) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    state.currentScreen = screenId;
    if (screenId === 'stats-screen') {
        updateStats();
        renderChart();
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
}

function startTimer(durationSeconds) {
    let timeLeft = durationSeconds;
    const timerDisplay = document.getElementById('timer');
    
    if (state.timerInterval) clearInterval(state.timerInterval);
    
    state.timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `Czas: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        if (timeLeft <= 0) {
            clearInterval(state.timerInterval);
            finishTest();
            alert('Czas minął!');
        }
        timeLeft--;
    }, 1000);
}

// Logika Testu
function startTest() {
    state.isStudyMode = studyModeCheckbox.checked;
    const chapterData = state.allData[state.selectedChapter];
    
    // Losowanie 10 pytań
    state.questions = [...chapterData]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)
        .map(q => ({
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
        }));
    
    state.currentQuestionIndex = 0;
    state.userAnswers = [];
    state.testStartTime = new Date();
    
    if (!state.isStudyMode) {
        startTimer(600); // 10 minut
    } else {
        document.getElementById('timer').textContent = 'Tryb nauki';
        if (state.timerInterval) clearInterval(state.timerInterval);
    }
    
    document.getElementById('test-title').textContent = `${state.selectedSubject}: ${state.selectedChapter}`;
    showScreen('test-screen');
    showQuestion();
}

function showQuestion() {
    const q = state.questions[state.currentQuestionIndex];
    const container = document.getElementById('question-container');
    
    // Update progress
    const progress = ((state.currentQuestionIndex) / state.questions.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('question-counter').textContent = `Pytanie ${state.currentQuestionIndex + 1} / ${state.questions.length}`;
    
    container.innerHTML = `
        <div class="question-text">${q.question}</div>
        <div class="options-container">
            ${q.options.map((opt, i) => `
                <button class="option-btn" onclick="selectOption('${opt.replace(/'/g, "\\'")}')">${opt}</button>
            `).join('')}
        </div>
    `;

    // Tryb nauki - pokazuj od razu jeśli zaznaczono
    if (state.isStudyMode && state.userAnswers[state.currentQuestionIndex]) {
        highlightCorrectAnswer();
    }

    // Toggle buttons
    const isLast = state.currentQuestionIndex === state.questions.length - 1;
    document.getElementById('next-q-btn').classList.toggle('hidden', isLast);
    document.getElementById('finish-test-btn').classList.toggle('hidden', !isLast);
}

// Globalna funkcja dla onclick w HTML
window.selectOption = (option) => {
    state.userAnswers[state.currentQuestionIndex] = option;
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(b => {
        b.classList.remove('selected');
        if (b.textContent === option) b.classList.add('selected');
    });

    if (state.isStudyMode) {
        highlightCorrectAnswer();
    }
};

function highlightCorrectAnswer() {
    const q = state.questions[state.currentQuestionIndex];
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(b => {
        if (b.textContent === q.answer) {
            b.style.backgroundColor = 'var(--success-color)';
            b.style.color = 'white';
        } else if (state.userAnswers[state.currentQuestionIndex] === b.textContent) {
            b.style.backgroundColor = 'var(--error-color)';
            b.style.color = 'white';
        }
    });
}

function nextQuestion() {
    if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex++;
        showQuestion();
    }
}

function finishTest() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    let correct = 0;
    state.questions.forEach((q, i) => {
        if (state.userAnswers[i] === q.answer) correct++;
    });

    const percent = Math.round((correct / state.questions.length) * 100);
    const grade = calculateGrade(percent);

    // Save to history if not in study mode
    if (!state.isStudyMode) {
        const result = {
            date: new Date().toLocaleString(),
            subject: state.selectedSubject,
            chapter: state.selectedChapter,
            percent: percent,
            grade: grade,
            timestamp: Date.now()
        };
        state.stats.history.push(result);
        localStorage.setItem('test_history', JSON.stringify(state.stats.history));
        renderHistory();
    }

    // Show Results
    document.getElementById('correct-count').textContent = correct;
    document.getElementById('wrong-count').textContent = state.questions.length - correct;
    document.getElementById('percentage-result').textContent = `${percent}%`;
    document.getElementById('grade-result').textContent = state.isStudyMode ? 'Tryb nauki' : grade;
    
    renderReview();
    showScreen('result-screen');
}

function calculateGrade(percent) {
    if (percent >= 95) return 6;
    if (percent >= 85) return 5;
    if (percent >= 70) return 4;
    if (percent >= 50) return 3;
    if (percent >= 30) return 2;
    return 1;
}

function renderReview() {
    const container = document.getElementById('answers-review');
    container.innerHTML = '<h3>Przegląd pytań:</h3>';
    
    state.questions.forEach((q, i) => {
        const isCorrect = state.userAnswers[i] === q.answer;
        const div = document.createElement('div');
        div.className = `review-item ${isCorrect ? 'correct' : 'wrong'}`;
        div.innerHTML = `
            <p><strong>Pytanie ${i+1}:</strong> ${q.question}</p>
            <p>Twoja odpowiedź: ${state.userAnswers[i] || 'Brak'}</p>
            <p>Poprawna odpowiedź: ${q.answer}</p>
        `;
        container.appendChild(div);
    });
}

// Statystyki
function updateStats() {
    const history = state.stats.history;
    if (history.length === 0) return;

    const total = history.length;
    const avgPercent = Math.round(history.reduce((acc, curr) => acc + curr.percent, 0) / total);
    const best = Math.max(...history.map(h => h.percent));
    const worst = Math.min(...history.map(h => h.percent));
    
    let avgG = '-';
    if (total >= 5) {
        avgG = (history.reduce((acc, curr) => acc + curr.grade, 0) / total).toFixed(2);
    }

    document.getElementById('total-tests').textContent = total;
    document.getElementById('avg-grade').textContent = avgG;
    document.getElementById('avg-percentage').textContent = `${avgPercent}%`;
    document.getElementById('best-score').textContent = `${best}%`;
    document.getElementById('worst-score').textContent = `${worst}%`;
}

function renderHistory() {
    const filter = document.getElementById('filter-subject').value;
    const tbody = document.getElementById('history-body');
    tbody.innerHTML = '';
    
    const filteredHistory = state.stats.history
        .filter(h => filter === 'all' || h.subject === filter)
        .sort((a, b) => b.timestamp - a.timestamp);

    filteredHistory.forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${h.date}</td>
            <td>${h.subject}</td>
            <td>${h.chapter}</td>
            <td>${h.percent}%</td>
            <td>${h.grade}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    if (state.chart) state.chart.destroy();

    const history = state.stats.history.slice(-10); // Ostatnie 10
    
    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(h => h.date.split(',')[0]),
            datasets: [{
                label: 'Wynik %',
                data: history.map(h => h.percent),
                borderColor: '#4a90e2',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}
