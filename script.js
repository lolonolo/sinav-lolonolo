document.addEventListener('DOMContentLoaded', () => {
    // ELEMENT TANIMLAMALARI
    const lobbyScreen = document.getElementById('lobby-screen');
    const competitionScreen = document.getElementById('competition-screen');
    // ...diğer elementler...
    const quizListContainer = document.getElementById('quiz-list-container');
    const searchInput = document.getElementById('quiz-search-input');
    
    // GENEL DEĞİŞKENLER
    let allQuizzes = [];
    let currentQuizData = {};
    // ...diğer değişkenler...

    // ANA FONKSİYONLAR
    async function fetchAndDisplayQuizzes() {
        try {
            // İSTEK ARTIK GÜVENLİ VERcel API'MIZA GİDİYOR (ANAHTAR YOK)
            const response = await fetch(`/api/getQuizzes`); 
            if (!response.ok) throw new Error('Sınav listesi Vercel API üzerinden alınamadı.');
            
            allQuizzes = await response.json();
            renderQuizList(allQuizzes);
        } catch (error) {
            if (quizListContainer) quizListContainer.innerHTML = `<p style="color: red;">Hata: ${error.message}</p>`;
        }
    }

    async function startQuiz(quizId) {
        lobbyScreen.innerHTML = `<h1>Loading Exam...</h1>`;
        try {
            // İSTEK ARTIK GÜVENLİ VERcel API'MIZA GİDİYOR (ANAHTAR YOK)
            const response = await fetch(`/api/getQuiz?id=${quizId}`);
            if (!response.ok) throw new Error('Sınav verileri Vercel API üzerinden alınamadı.');

            currentQuizData = await response.json();
            // ...fonksiyonun geri kalanı aynı...
            if(!currentQuizData.sorular || currentQuizData.sorular.length === 0){ throw new Error('Bu sınavda soru bulunamadı.'); }
            // ...
        } catch (error) {
            lobbyScreen.innerHTML = `<h1 style="color: red;">Hata: ${error.message}</h1>`;
        }
    }

    // ... Geri kalan tüm fonksiyonlar (renderQuizList, loadQuestion, handleAnswer vb.) aynı kalacak ...
    // Tam script.js dosyasını aşağıya ekliyorum.
});

// --- TAM script.js DOSYASI ---
document.addEventListener('DOMContentLoaded', () => {
    const lobbyScreen = document.getElementById('lobby-screen');
    const competitionScreen = document.getElementById('competition-screen');
    const quizListContainer = document.getElementById('quiz-list-container');
    const searchInput = document.getElementById('quiz-search-input');
    const quizTitleElement = document.getElementById('quiz-title');
    const questionTextElement = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const explanationArea = document.getElementById('explanation-area');
    const nextQuestionBtn = document.getElementById('next-q-btn');
    const questionCounterElement = document.getElementById('question-counter');
    const soloScoreElement = document.getElementById('solo-score');
    let allQuizzes = [];
    let currentQuizData = {};
    let currentQuestionIndex = 0;
    let soloScore = 0;
    async function fetchAndDisplayQuizzes() {
        try {
            const response = await fetch(`/api/getQuizzes`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Sınav listesi alınamadı.');
            }
            allQuizzes = await response.json();
            renderQuizList(allQuizzes);
        } catch (error) {
            if (quizListContainer) quizListContainer.innerHTML = `<p style="color: red;">Hata: ${error.message}</p>`;
        }
    }
    function renderQuizList(quizzes) {
        if (!quizListContainer || !Array.isArray(quizzes)) {
            quizListContainer.innerHTML = '<p>Hiç sınav bulunamadı veya veri formatı yanlış.</p>';
            return;
        }
        quizListContainer.innerHTML = '';
        quizzes.forEach(quiz => {
            const quizItem = document.createElement('div');
            quizItem.className = 'quiz-list-item';
            quizItem.textContent = quiz.title;
            quizItem.dataset.quizId = quiz.id;
            quizItem.addEventListener('click', () => startQuiz(quiz.id));
            quizListContainer.appendChild(quizItem);
        });
    }
    function filterQuizzes() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredQuizzes = allQuizzes.filter(quiz => quiz.title.toLowerCase().includes(searchTerm));
        renderQuizList(filteredQuizzes);
    }
    async function startQuiz(quizId) {
        lobbyScreen.innerHTML = `<h1>Exam is Loading...</h1>`;
        try {
            const response = await fetch(`/api/getQuiz?id=${quizId}`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Sınav verileri alınamadı.');
            }
            currentQuizData = await response.json();
            if (!currentQuizData.sorular || currentQuizData.sorular.length === 0) { throw new Error('Bu sınavda soru bulunamadı.'); }
            currentQuestionIndex = 0;
            soloScore = 0;
            if (soloScoreElement) soloScoreElement.textContent = '0';
            document.body.className = 'solo-mode';
            showScreen(competitionScreen);
            loadQuestion(0);
        } catch (error) {
            lobbyScreen.innerHTML = `<h1 style="color: red;">Hata: ${error.message}</h1>`;
        }
    }
function loadQuestion(questionIndex) {
    // --- Önceki sorudan kalan promosyon/reklam div'ini temizle ---
    const existingAdContainer = document.querySelector('.ad-container-in-question');
    if (existingAdContainer) {
        existingAdContainer.remove();
    }
    // --- Temizlik kodu sonu ---

    const question = currentQuizData.sorular[questionIndex];
    currentQuestionIndex = questionIndex;
    quizTitleElement.textContent = currentQuizData.sinavAdi;
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

    questionCounterElement.textContent = `Soru ${questionIndex + 1} / ${currentQuizData.sorular.length}`;

    // --- YENİ GÜNCELLENMİŞ KISIM: Her 5 soruda bir promosyon mesajı gösterme ---
    // (questionIndex + 1) kontrolü sayesinde 5., 10., 15. sorulardan sonra çalışır.
    // (questionIndex > 0) kontrolü ilk soruda mesaj çıkmasını engeller.
    if ((questionIndex + 1) % 5 === 0 && questionIndex > 0) {
        
        // Promosyon mesajı için bir container div oluştur
        const promoContainer = document.createElement('div');
        promoContainer.className = 'ad-container-in-question'; // Aynı class ismini kullanabiliriz
        
        // Stil kodları ile görünümü güzelleştirelim
        promoContainer.style.margin = '25px 0';
        promoContainer.style.padding = '20px';
        promoContainer.style.backgroundColor = '#eaf5ff';
        promoContainer.style.border = '2px dashed #007bff';
        promoContainer.style.borderRadius = '10px';
        promoContainer.style.textAlign = 'center';
        promoContainer.style.fontFamily = "'Poppins', sans-serif";
        promoContainer.style.lineHeight = '1.6';

        // Mesaj içeriğini oluştur
        const messageText = document.createElement('p');
        messageText.textContent = 'Lolonolo\'yu desteklemek ve reklamsız bir deneyim için Premium Üyelik alın!';
        messageText.style.margin = '0 0 15px 0';
        messageText.style.fontSize = '1.1em';
        messageText.style.color = '#1a5c90';
        
        // Tıklanabilir linki (butonu) oluştur
        const shopierLink = document.createElement('a');
        shopierLink.href = 'https://www.shopier.com/lolonolo';
        shopierLink.target = '_blank'; // Linkin yeni sekmede açılması için
        shopierLink.textContent = 'Shopier\'den Üyelik Al';
        
        // Linkin stilini belirleyelim
        shopierLink.style.display = 'inline-block';
        shopierLink.style.backgroundColor = '#007bff';
        shopierLink.style.color = 'white';
        shopierLink.style.padding = '10px 20px';
        shopierLink.style.borderRadius = '8px';
        shopierLink.style.textDecoration = 'none';
        shopierLink.style.fontWeight = 'bold';

        // Oluşturulan metni ve linki ana container'a ekle
        promoContainer.appendChild(messageText);
        promoContainer.appendChild(shopierLink);

        // Hazırlanan promosyon kutusunu sayfaya, seçeneklerin altına ekle
        explanationArea.parentNode.insertBefore(promoContainer, explanationArea);
    }
    // --- GÜNCELLENMİŞ KISIM SONU ---
}
    function handleAnswer(selectedIndex) {
        const allButtons = optionsContainer.querySelectorAll('.option-btn');
        allButtons.forEach(btn => btn.disabled = true);
        const question = currentQuizData.sorular[currentQuestionIndex];
        const isCorrect = selectedIndex === question.dogruCevapIndex;
        if (isCorrect) {
            soloScore += 10;
            if (soloScoreElement) soloScoreElement.textContent = soloScore;
        }
        allButtons[selectedIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
        if (!isCorrect && question.dogruCevapIndex >= 0 && question.dogruCevapIndex < allButtons.length) {
            allButtons[question.dogruCevapIndex].classList.add('correct');
        }
        if (question.aciklama) {
            explanationArea.innerHTML = question.aciklama;
            explanationArea.style.display = 'block';
        }
        if (currentQuestionIndex < currentQuizData.sorular.length - 1) {
            nextQuestionBtn.style.display = 'block';
        } else {
            setTimeout(showFinalScore, 3000);
        }
    }
    function showFinalScore() {
        questionTextElement.textContent = 'Exam finished!';
        optionsContainer.innerHTML = `<strong>Your Final Score : ${soloScore}</strong><br><br><button class="next-question-btn" style="display: block;" onclick="location.reload()">Choose New Exam</button>`;
        explanationArea.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
    }
    function goToNextQuestion() { loadQuestion(currentQuestionIndex + 1); }
    function showScreen(screenToShow) { if (lobbyScreen) lobbyScreen.style.display = 'none'; if (competitionScreen) competitionScreen.style.display = 'none'; if (screenToShow) screenToShow.style.display = 'flex'; }
    if (searchInput) searchInput.addEventListener('keyup', filterQuizzes);
    document.body.addEventListener('click', function (event) { if (event.target && event.target.id === 'next-q-btn') { goToNextQuestion(); } });
    fetchAndDisplayQuizzes();
});
