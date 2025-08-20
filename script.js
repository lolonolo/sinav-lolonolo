// Ekranlar
const lobbyScreen = document.getElementById('lobby-screen');
const waitingRoomScreen = document.getElementById('waiting-room-screen');
const competitionScreen = document.getElementById('competition-screen');

// Butonlar
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const startCompetitionBtn = document.getElementById('start-competition-btn');

// Bekleme Odası Elementleri
const roomCodeElement = document.getElementById('room-code');
const waitingTeamAElement = document.getElementById('waiting-team-a');
const waitingTeamBElement = document.getElementById('waiting-team-b');

// Yarışma Ekranı Elementleri
const quizTitleElement = document.getElementById('quiz-title');
const questionTextElement = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const explanationArea = document.getElementById('explanation-area');
const questionCounterElement = document.getElementById('question-counter');
const teamAScoreElement = document.getElementById('team-a-score');
const teamBScoreElement = document.getElementById('team-b-score');
const nextQuestionBtn = document.getElementById('next-q-btn');
const competitionTeamAElement = document.getElementById('team-a-list');
const competitionTeamBElement = document.getElementById('team-b-list');

// Oyun Değişkenleri
let currentQuestionIndex = 0;
let scoreA = 0;
let scoreB = 0;
let roomState = {};
let pollingInterval = null;

// --- YARDIMCI VE YÖNETİM FONKSİYONLARI ---

function updatePlayerLists(players, listAElement, listBElement) {
    listAElement.innerHTML = '';
    listBElement.innerHTML = '';
    Object.values(players).forEach(player => {
        const li = document.createElement('li');
        li.textContent = player.name;
        if (player.team === 'A') {
            listAElement.appendChild(li);
        } else {
            listBElement.appendChild(li);
        }
    });
}

async function pollRoomStatus() {
    if (!roomState.code) return;
    try {
        const response = await fetch(`/api/get-room?code=${roomState.code}`);
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            roomState = data.roomState;
            updatePlayerLists(roomState.players, waitingTeamAElement, waitingTeamBElement);
        }
    } catch (error) {
        console.error('Oda durumu çekilirken hata:', error);
    }
}

function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(pollRoomStatus, 3000);
}

function stopPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
}

// --- YARIŞMA MOTORU FONKSİYONLARI ---

function loadQuestion(questionIndex) {
    const question = sinavVerisi.sorular[questionIndex];
    questionTextElement.innerHTML = question.soruMetni;
    optionsContainer.innerHTML = '';
    explanationArea.style.display = 'none';
    nextQuestionBtn.style.display = 'none';
    question.secenekler.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.innerHTML = option;
        button.addEventListener('click', () => handleAnswer(index, 'A'));
        optionsContainer.appendChild(button);
    });
    questionCounterElement.textContent = `Soru ${questionIndex + 1} / ${sinavVerisi.sorular.length}`;
}

function handleAnswer(selectedIndex, team) {
    const question = sinavVerisi.sorular[currentQuestionIndex];
    const isCorrect = selectedIndex === question.dogruCevapIndex;
    const allButtons = optionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(btn => btn.disabled = true);
    if (isCorrect) {
        allButtons[selectedIndex].classList.add('correct');
        if (team === 'A') {
            scoreA += 10;
            teamAScoreElement.textContent = `A: ${scoreA}`;
        } else {
            scoreB += 10;
            teamBScoreElement.textContent = `B: ${scoreB}`;
        }
    } else {
        allButtons[selectedIndex].classList.add('incorrect');
        if (question.dogruCevapIndex < allButtons.length) {
            allButtons[question.dogruCevapIndex].classList.add('correct');
        }
    }
    if (question.aciklama) {
        explanationArea.innerHTML = `${question.aciklama}`;
        explanationArea.style.display = 'block';
    }
    if (currentQuestionIndex < sinavVerisi.sorular.length - 1) {
        nextQuestionBtn.style.display = 'block';
    } else {
        questionTextElement.textContent = 'Yarışma Bitti!';
        optionsContainer.innerHTML = `<strong>Final Skor:</strong> A Takımı ${scoreA} - B Takımı ${scoreB}`;
    }
}

function goToNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < sinavVerisi.sorular.length) {
        loadQuestion(currentQuestionIndex);
    }
}

function initializeApp() {
    quizTitleElement.textContent = sinavVerisi.sinavAdi;
    loadQuestion(currentQuestionIndex);
}

// --- OLAY DİNLEYİCİLERİ (EVENT LISTENERS) ---
document.addEventListener('DOMContentLoaded', (event) => {
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', async () => {
            // YENİ: Oyuncu adını sor
            const playerName = prompt("Lütfen oyuncu adınızı girin:", "Kurucu");
            if (!playerName) return; // Kullanıcı iptal ederse işlemi durdur

            createRoomBtn.disabled = true;
            createRoomBtn.textContent = 'Oluşturuluyor...';
            try {
                // YENİ: Oyuncu adını arka plana gönder
                const response = await fetch('/api/create-room', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerName: `${playerName} (Kurucu)` })
                });
                const data = await response.json();
                if (response.ok && data.status === 'success') {
                    roomState = data.roomState; // Arka plandan gelen güncel durumu al
                    roomCodeElement.textContent = roomState.code;
                    updatePlayerLists(roomState.players, waitingTeamAElement, waitingTeamBElement);
                    lobbyScreen.style.display = 'none';
                    waitingRoomScreen.style.display = 'flex';
                    startPolling();
                } else {
                    alert('Oda oluşturulurken bir hata oluştu: ' + (data.error || 'Bilinmeyen hata'));
                }
            } catch (error) {
                console.error('Oda oluşturma isteği başarısız:', error);
                alert('Sunucuya bağlanırken bir hata oluştu.');
            } finally {
                createRoomBtn.disabled = false;
                createRoomBtn.textContent = 'Yeni Yarışma Kur';
            }
        });
    }

    if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', async () => {
            const roomCode = prompt("Lütfen katılmak istediğiniz odanın kodunu girin:");
            if (!roomCode) return;
            const playerName = prompt("Lütfen oyuncu adınızı girin:", `Oyuncu${Math.floor(Math.random() * 100)}`);
            if (!playerName) return;

            try {
                const response = await fetch('/api/join-room', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomCode, playerName }),
                });
                const data = await response.json();
                if (response.ok && data.status === 'success') {
                    roomState = data.roomState;
                    roomCodeElement.textContent = roomState.code;
                    updatePlayerLists(roomState.players, waitingTeamAElement, waitingTeamBElement);
                    lobbyScreen.style.display = 'none';
                    waitingRoomScreen.style.display = 'flex';
                    startPolling();
                } else {
                    alert('Odaya katılırken bir hata oluştu: ' + (data.error || 'Bilinmeyen hata'));
                }
            } catch (error) {
                console.error('Odaya katılma isteği başarısız:', error);
                alert('Sunucuya bağlanırken bir hata oluştu.');
            }
        });
    }
    
    if (startCompetitionBtn) {
        startCompetitionBtn.addEventListener('click', () => {
            stopPolling();
            updatePlayerLists(roomState.players, competitionTeamAElement, competitionTeamBElement);
            waitingRoomScreen.style.display = 'none';
            competitionScreen.style.display = 'flex';
            initializeApp();
        });
    }

    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', goToNextQuestion);
    }
});