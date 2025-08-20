// DÜZELTME: Tüm script kodunu, sayfanın tamamen yüklenmesini bekleyen
// bir olay dinleyicisinin içine alıyoruz. Bu, butonların "null" olmasını engeller.
document.addEventListener('DOMContentLoaded', () => {

    // --- BÖLÜM 1: ELEMENT TANIMLAMALARI VE GENEL DEĞİŞKENLER ---
    
    // Ekranlar
    const lobbyScreen = document.getElementById('lobby-screen');
    const waitingRoomScreen = document.getElementById('waiting-room-screen');
    const competitionScreen = document.getElementById('competition-screen');

    // Butonlar
    const createRoomBtn = document.getElementById('create-room-btn');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const startCompetitionBtn = document.getElementById('start-competition-btn');
    const nextQuestionBtn = document.getElementById('next-q-btn');

    // Diğer Elementler
    const roomCodeElement = document.getElementById('room-code');
    const waitingTeamAElement = document.getElementById('waiting-team-a');
    const waitingTeamBElement = document.getElementById('waiting-team-b');
    const quizTitleElement = document.getElementById('quiz-title');
    const timerElement = document.getElementById('timer');
    const questionTextElement = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const explanationArea = document.getElementById('explanation-area');
    const questionCounterElement = document.getElementById('question-counter');
    const teamAScoreElement = document.getElementById('team-a-score');
    const teamBScoreElement = document.getElementById('team-b-score');
    const competitionTeamAElement = document.getElementById('team-a-list');
    const competitionTeamBElement = document.getElementById('team-b-list');

    // Oyun Değişkenleri
    let roomState = {};
    let pollingInterval = null;
    let currentPlayerId = null;
    let currentQuestionIndex = 0;

    // --- BÖLÜM 1 SONU ---


    // --- BÖLÜM 2: YARDIMCI VE YÖNETİM FONKSİYONLARI ---

    function showScreen(screenToShow) {
        if(lobbyScreen) lobbyScreen.style.display = 'none';
        if(waitingRoomScreen) waitingRoomScreen.style.display = 'none';
        if(competitionScreen) competitionScreen.style.display = 'none';
        if(screenToShow) screenToShow.style.display = 'flex';
    }

    function updatePlayerLists(players) {
        const listElements = [
            { list: waitingTeamAElement, team: 'A' },
            { list: waitingTeamBElement, team: 'B' },
            { list: competitionTeamAElement, team: 'A' },
            { list: competitionTeamBElement, team: 'B' }
        ];

        listElements.forEach(({ list }) => { if(list) list.innerHTML = ''; });
        
        if(!players) return;

        Object.entries(players).forEach(([playerId, player]) => {
            const li = document.createElement('li');
            li.textContent = player.name;
            if (playerId === currentPlayerId) {
                li.classList.add('current-player');
                li.textContent += ' (Siz)';
            }
            
            const listA = [waitingTeamAElement, competitionTeamAElement];
            const listB = [waitingTeamBElement, competitionTeamBElement];

            if (player.team === 'A') {
                listA.forEach(list => { if (list) list.appendChild(li.cloneNode(true)) });
            } else {
                listB.forEach(list => { if (list) list.appendChild(li.cloneNode(true)) });
            }
        });
    }

    function updateScores() {
        let scoreA = 0;
        let scoreB = 0;
        if (roomState && roomState.players) {
            Object.values(roomState.players).forEach(player => {
                if(player.score) {
                    if (player.team === 'A') scoreA += player.score;
                    else scoreB += player.score;
                }
            });
        }
        if(teamAScoreElement) teamAScoreElement.textContent = scoreA;
        if(teamBScoreElement) teamBScoreElement.textContent = scoreB;
    }
async function pollRoomStatus() {
    if (!roomState.code) return; // Oda kodu yoksa devam etme

    try {
        const response = await fetch(`/api/get-room?code=${roomState.code}`);
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            // Yarışma başlama anını yakala
            if (roomState.status === 'waiting' && data.roomState.status === 'in_progress') {
                stopPolling(); // Kontrolü durdur
                roomState = data.roomState; // Son durumu al
                updatePlayerLists(roomState.players);
                showScreen(competitionScreen);
                initializeApp();
                return; // Fonksiyonu burada bitir, aşağısı çalışmasın
            }
            
            // Diğer tüm durumlarda, sunucudan gelen veriyi KABUL ET ve EKRANI YENİLE
            roomState = data.roomState;
            updatePlayerLists(roomState.players);
            updateScores(); // Skorları her seferinde koşulsuz güncelle

            // "Yarışmayı Başlat" butonunun durumunu ayarla
            const teamBCount = Object.values(roomState.players).filter(p => p.team === 'B').length;
            const isCreator = roomState.players[currentPlayerId]?.name.includes('(Kurucu)');
            
            if (isCreator && teamBCount > 0) {
                startCompetitionBtn.disabled = false;
                startCompetitionBtn.textContent = 'Yarışmayı Başlat';
            } else if (isCreator) {
                startCompetitionBtn.disabled = true;
                startCompetitionBtn.textContent = 'Rakip Bekleniyor...';
            }
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

    // --- BÖLÜM 2 SONU ---


    // --- BÖLÜM 3: YARIŞMA MOTORU FONKSİYONLARI ---

    function loadQuestion(questionIndex) {
        if(typeof sinavVerisi === 'undefined' || !sinavVerisi.sorular[questionIndex]) return;

        const question = sinavVerisi.sorular[questionIndex];
        currentQuestionIndex = questionIndex;
        
        questionTextElement.innerHTML = question.soruMetni;
        optionsContainer.innerHTML = '';
        explanationArea.style.display = 'none';
        nextQuestionBtn.style.display = 'none';

        question.secenekler.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.innerHTML = option;
            button.addEventListener('click', () => handleAnswer(index));
            optionsContainer.appendChild(button);
        });
        
        questionCounterElement.textContent = `Soru ${questionIndex + 1} / ${sinavVerisi.sorular.length}`;
    }

    async function handleAnswer(selectedIndex) {
        const allButtons = optionsContainer.querySelectorAll('.option-btn');
        allButtons.forEach(btn => btn.disabled = true);
        
        try {
            const response = await fetch('/api/submit-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    roomCode: roomState.code, 
                    playerId: currentPlayerId, 
                    questionIndex: currentQuestionIndex,
                    answerIndex: selectedIndex,
                    quizName: sinavVerisi.sinavAdi
                }),
            });
            const data = await response.json();

            if (response.ok && data.status === 'success') {
                roomState = data.roomState;
                updateScores();
                updatePlayerLists(roomState.players);
            } else {
                throw new Error(data.error || 'Cevap gönderilemedi.');
            }

        } catch (error) {
            console.error("Cevap gönderilirken hata:", error);
            alert("Cevabınız sunucuya iletilirken bir sorun oluştu.");
        }

        const question = sinavVerisi.sorular[currentQuestionIndex];
        const isCorrect = selectedIndex === question.dogruCevapIndex;

        if (isCorrect) {
            allButtons[selectedIndex].classList.add('correct');
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
            setTimeout(() => {
                showFinalScore();
            }, 3000);
        }
    }
    
    function showFinalScore() {
        questionTextElement.textContent = 'Yarışma Bitti!';
        optionsContainer.innerHTML = `<strong>Final Skor:</strong> A Takımı ${teamAScoreElement.textContent} - B Takımı ${teamBScoreElement.textContent}`;
        explanationArea.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
    }

    function goToNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < sinavVerisi.sorular.length) {
            loadQuestion(currentQuestionIndex);
        }
    }

    function initializeApp() {
        currentQuestionIndex = 0;
        if(roomState && roomState.players){
            Object.values(roomState.players).forEach(player => player.score = 0);
        }
        
        quizTitleElement.textContent = sinavVerisi.sinavAdi;
        updateScores();
        loadQuestion(0);
    }

    // --- BÖLÜM 3 SONU ---


    // --- BÖLÜM 4: OLAY DİNLEYİCİLERİ (EVENT LISTENERS) ---
    
    createRoomBtn.addEventListener('click', async () => {
        const playerName = prompt("Lütfen oyuncu adınızı girin:", "Kurucu");
        if (!playerName) return;
        
        createRoomBtn.disabled = true;
        createRoomBtn.textContent = 'Oluşturuluyor...';
        
        try {
            const response = await fetch('/api/create-room', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName: `${playerName} (Kurucu)` })
            });
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                roomState = data.roomState;
                currentPlayerId = data.newPlayerId; 
                sessionStorage.setItem(`player-${roomState.code}`, currentPlayerId);
                
                roomCodeElement.textContent = roomState.code;
                updatePlayerLists(roomState.players);
                showScreen(waitingRoomScreen);
                startPolling();
            } else {
                alert('Hata: ' + (data.error || 'Bilinmeyen hata'));
            }
        } catch (error) {
            alert('Sunucuya bağlanırken bir hata oluştu.');
        } finally {
            createRoomBtn.disabled = false;
            createRoomBtn.textContent = 'Yeni Yarışma Kur';
        }
    });

    joinRoomBtn.addEventListener('click', async () => {
        let roomCode = prompt("Lütfen katılmak istediğiniz odanın kodunu girin:");
        if (!roomCode) return;
        roomCode = roomCode.toUpperCase(); // Kodu büyük harfe çevir

        let playerName = "";
        let isNameValid = false;
        
        while(!isNameValid) {
            playerName = prompt("Lütfen oyuncu adınızı girin:", `Oyuncu${Math.floor(Math.random() * 100)}`);
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
                    currentPlayerId = data.newPlayerId;
                    sessionStorage.setItem(`player-${roomState.code}`, currentPlayerId);
                    
                    roomCodeElement.textContent = roomState.code;
                    updatePlayerLists(roomState.players);
                    showScreen(waitingRoomScreen);
                    startPolling();
                    isNameValid = true;
                } else {
                    if(response.status === 409) {
                        alert(data.error);
                    } else {
                        alert('Odaya katılırken bir hata oluştu: ' + (data.error || 'Bilinmeyen hata'));
                        isNameValid = true;
                    }
                }
            } catch (error) {
                alert('Sunucuya bağlanırken bir hata oluştu.');
                isNameValid = true;
            }
        }
    });
    
    startCompetitionBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/start-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode: roomState.code })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Yarışma başlatılamadı.');
            }
            startCompetitionBtn.disabled = true;
            startCompetitionBtn.textContent = 'Başlatılıyor...';
            
        } catch (error) {
            alert(`Bir hata oluştu: ${error.message}`);
        }
    });

    nextQuestionBtn.addEventListener('click', goToNextQuestion);

    // --- BÖLÜM 4 SONU ---
});