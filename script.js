// Sayfanın tamamen yüklenmesini bekleyen olay dinleyicisi
document.addEventListener('DOMContentLoaded', () => {

    // --- BÖLÜM 1: ELEMENT TANIMLAMALARI VE GENEL DEĞİŞKENLER ---
    
    const lobbyScreen = document.getElementById('lobby-screen');
    const waitingRoomScreen = document.getElementById('waiting-room-screen');
    const competitionScreen = document.getElementById('competition-screen');
    const createRoomBtn = document.getElementById('create-room-btn');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const startCompetitionBtn = document.getElementById('start-competition-btn');
    const nextQuestionBtn = document.getElementById('next-q-btn');
    const soloTestBtn = document.getElementById('solo-test-btn');
    const roomCodeElement = document.getElementById('room-code');
    const waitingTeamAElement = document.getElementById('waiting-team-a');
    const waitingTeamBElement = document.getElementById('waiting-team-b');
    const quizTitleElement = document.getElementById('quiz-title');
    const questionTextElement = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const explanationArea = document.getElementById('explanation-area');
    const questionCounterElement = document.getElementById('question-counter');
    const teamAScoreElement = document.getElementById('team-a-score');
    const teamBScoreElement = document.getElementById('team-b-score');
    const competitionTeamAElement = document.getElementById('team-a-list');
    const competitionTeamBElement = document.getElementById('team-b-list');
    const soloScoreElement = document.getElementById('solo-score');
    let roomState = {};
    let pollingInterval = null;
    let currentPlayerId = null;
    let currentQuestionIndex = 0;
    let gameMode = 'multiplayer';
    let soloScore = 0;

    // --- BÖLÜM 2: YARDIMCI VE YÖNETİM FONKSİYONLARI ---

    function showScreen(screenToShow) {
        [lobbyScreen, waitingRoomScreen, competitionScreen].forEach(s => s.style.display = 'none');
        if (screenToShow) screenToShow.style.display = 'flex';
    }

function updatePlayerLists(players) {
        const lists = {
            A: [waitingTeamAElement, competitionTeamAElement],
            B: [waitingTeamBElement, competitionTeamBElement]
        };

        // Tüm listeleri temizle
        Object.values(lists).flat().forEach(list => {
            if (list) list.innerHTML = '';
        });

        if (!players) return;

        // Oyuncuları bir diziye dönüştür
        const allPlayers = Object.entries(players).map(([id, data]) => ({ id, ...data }));

        // Her takım için oyuncuları filtrele, puana göre sırala ve listeyi oluştur
        ['A', 'B'].forEach(team => {
            const teamPlayers = allPlayers
                .filter(p => p.team === team)
                .sort((a, b) => (b.score || 0) - (a.score || 0)); // YÜKSEK PUANLILAR ÜSTE GELECEK ŞEKİLDE SIRALA

            teamPlayers.forEach(player => {
                const li = document.createElement('li');
                
                // Oyuncu adını içeren bir span oluştur
                const nameSpan = document.createElement('span');
                nameSpan.textContent = player.name;

                // Oyuncu puanını içeren bir span oluştur
                const scoreSpan = document.createElement('span');
                scoreSpan.className = 'player-score'; // CSS ile stil vermek için
                scoreSpan.textContent = player.score || 0; // Puanını göster

                li.appendChild(nameSpan);
                li.appendChild(scoreSpan);

                if (player.id === currentPlayerId) {
                    li.classList.add('current-player');
                    nameSpan.textContent += ' (Siz)';
                }

                // Bu oyuncuyu ilgili tüm takım listelerine ekle (bekleme ve yarışma ekranı)
                lists[team].forEach(list => {
                    if (list) list.appendChild(li.cloneNode(true));
                });
            });
        });
    }

 // script.js dosyasındaki updateScores fonksiyonu
    function updateScores() {
        let scoreA = 0, scoreB = 0;
        if (roomState && roomState.players) {
            Object.values(roomState.players).forEach(player => {
                const playerScore = player.score || 0;
                if (player.team === 'A') scoreA += playerScore;
                else if (player.team === 'B') scoreB += playerScore;
            });
        }
        // Masaüstü skorlarını güncelle
        if (teamAScoreElement) teamAScoreElement.textContent = scoreA;
        if (teamBScoreElement) teamBScoreElement.textContent = scoreB;

        // YENİ: Mobil skorlarını da güncelle
        const mobileTeamAScore = document.getElementById('mobile-team-a-score');
        const mobileTeamBScore = document.getElementById('mobile-team-b-score');
        if(mobileTeamAScore) mobileTeamAScore.textContent = scoreA;
        if(mobileTeamBScore) mobileTeamBScore.textContent = scoreB;
    }

    async function pollRoomStatus() {
        if (!roomState.code) return;
        try {
            const response = await fetch(`/api/get-room?code=${roomState.code}`);
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                const oldStatus = roomState.status;
                roomState = data.roomState;

                if (oldStatus === 'waiting' && roomState.status === 'in_progress') {
                    stopPolling();
                    updatePlayerLists(roomState.players);
                    showScreen(competitionScreen);
                    initializeApp();
                    return;
                }
                
                updatePlayerLists(roomState.players);
                updateScores();

                // --- BURASI DÜZELTİLDİ ---
                // Artık kurucuyu isme göre değil, doğrudan veriye göre kontrol ediyoruz.
                const amICreator = roomState.players[currentPlayerId]?.isCreator === true;
                
                // Kurucu değilseniz, butonu gösterme/gizleme mantığına hiç girmeyin.
                // Kurucuysanız, B takımında oyuncu var mı diye kontrol edin.
                if (amICreator) {
                    const teamBCount = Object.values(roomState.players).filter(p => p.team === 'B').length;
                    if (teamBCount > 0) {
                        startCompetitionBtn.disabled = false;
                        startCompetitionBtn.textContent = 'Yarışmayı Başlat';
                    } else {
                        startCompetitionBtn.disabled = true;
                        startCompetitionBtn.textContent = 'Rakip Bekleniyor...';
                    }
                }
            }
        } catch (error) { console.error('Oda durumu çekilirken hata:', error); }
    }

    function startPolling() {
        stopPolling(); // Önceki interval'ı temizle
        pollingInterval = setInterval(pollRoomStatus, 3000);
    }

    function stopPolling() {
        if (pollingInterval) clearInterval(pollingInterval);
    }

    // --- BÖLÜM 3: YARIŞMA MOTORU FONKSİYONLARI ---

    function initializeApp() {
        currentQuestionIndex = 0;
        quizTitleElement.textContent = sinavVerisi.sinavAdi;
        updateScores();
        loadQuestion(0);
    }

    function startSoloTest() {
        gameMode = 'solo';
        document.body.classList.add('solo-mode');
        showScreen(competitionScreen);
        currentQuestionIndex = 0;
        soloScore = 0;
        soloScoreElement.textContent = '0';
        quizTitleElement.textContent = sinavVerisi.sinavAdi;
        loadQuestion(0);
    }
    
    function loadQuestion(questionIndex) {
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

        const question = sinavVerisi.sorular[currentQuestionIndex];
        const isCorrect = selectedIndex === question.dogruCevapIndex;

        if (gameMode === 'solo') {
            if (isCorrect) {
                soloScore += 10;
                soloScoreElement.textContent = soloScore;
            }
        } else {
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
                if (response.ok) {
                    roomState = data.roomState;
                    updateScores();
                    updatePlayerLists(roomState.players);
                }
            } catch (error) { console.error("Cevap gönderilirken hata:", error); }
        }

        allButtons[selectedIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
        if (!isCorrect) {
            allButtons[question.dogruCevapIndex].classList.add('correct');
        }
        if (question.aciklama) {
            explanationArea.innerHTML = question.aciklama;
            explanationArea.style.display = 'block';
        }
        if (currentQuestionIndex < sinavVerisi.sorular.length - 1) {
            nextQuestionBtn.style.display = 'block';
        } else {
            setTimeout(showFinalScore, 3000);
        }
    }
    
    function showFinalScore() {
        optionsContainer.innerHTML = '';
        explanationArea.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
        questionTextElement.textContent = gameMode === 'solo' ? 'Test Bitti!' : 'Yarışma Bitti!';
        optionsContainer.innerHTML = gameMode === 'solo' 
            ? `<strong>Final Puanınız: ${soloScore}</strong>`
            : `<strong>Final Skor:</strong> A Takımı ${teamAScoreElement.textContent} - B Takımı ${teamBScoreElement.textContent}`;
    }

    function goToNextQuestion() {
        loadQuestion(currentQuestionIndex + 1);
    }

    // --- BÖLÜM 4: OLAY DİNLEYİCİLERİ (EVENT LISTENERS) ---
    
    createRoomBtn.addEventListener('click', async () => {
        gameMode = 'multiplayer';
        const playerName = prompt("Lütfen oyuncu adınızı girin:", "Oyuncu1");
        if (!playerName) return;
        
        createRoomBtn.disabled = true;
        try {
            const response = await fetch('/api/create-room', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName: `${playerName} (Kurucu)` })
            });
            const data = await response.json();
            if (response.ok) {
                roomState = data.roomState;
                currentPlayerId = data.newPlayerId; 
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
        }
    });

    joinRoomBtn.addEventListener('click', async () => {
        gameMode = 'multiplayer';
        const roomCode = prompt("Oda kodunu girin:");
        if (!roomCode) return;
        const playerName = prompt("Oyuncu adınızı girin:");
        if (!playerName) return;

        try {
            const response = await fetch('/api/join-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode: roomCode.toUpperCase(), playerName }),
            });
            const data = await response.json();
            if (response.ok) {
                roomState = data.roomState;
                currentPlayerId = data.newPlayerId;
                roomCodeElement.textContent = roomState.code;
                updatePlayerLists(roomState.players);
                showScreen(waitingRoomScreen);
                startPolling();
            } else {
                alert(data.error || 'Odaya katılırken bir hata oluştu.');
            }
        } catch (error) { alert('Sunucuya bağlanırken bir hata oluştu.'); }
    });
    
    startCompetitionBtn.addEventListener('click', async () => {
        startCompetitionBtn.disabled = true;
        try {
            await fetch('/api/start-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode: roomState.code })
            });
        } catch (error) { alert(`Bir hata oluştu: ${error.message}`); }
    });

    nextQuestionBtn.addEventListener('click', goToNextQuestion);
    soloTestBtn.addEventListener('click', startSoloTest);
});
