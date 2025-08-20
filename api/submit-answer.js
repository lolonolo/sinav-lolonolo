import { kv } from '@vercel/kv';

// Gerçek bir veritabanı olana kadar, test sınavımızın doğru cevaplarını burada tutuyoruz.
// Bu, quiz-data.js'deki sıralamayla aynı olmalı.
const correctAnswers = {
    "Karar Teorisi ve Analizi 2024-2025 Bütünleme Soruları": [4, 2, 4, 3]
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { roomCode, playerId, questionIndex, answerIndex, quizName } = request.body;
    if (!roomCode || !playerId || questionIndex === undefined || answerIndex === undefined || !quizName) {
      return response.status(400).json({ error: 'Eksik bilgi gönderildi.' });
    }

    const roomKey = `room:${roomCode.toUpperCase()}`;
    const roomState = await kv.get(roomKey);

    if (!roomState) {
      return response.status(404).json({ error: 'Oda bulunamadı.' });
    }

    const player = roomState.players[playerId];
    const correctAnswerIndex = correctAnswers[quizName] ? correctAnswers[quizName][questionIndex] : -1;

    if (player && answerIndex === correctAnswerIndex) {
        if (!player.score) player.score = 0;
        player.score += 10;
    }
    
    if(!roomState.answers) roomState.answers = {};
    if(!roomState.answers[questionIndex]) roomState.answers[questionIndex] = {};
    roomState.answers[questionIndex][playerId] = answerIndex;

    await kv.set(roomKey, roomState, { ex: 86400 });

    // YENİ: Sadece başarı mesajı değil, güncellenmiş oda durumunu da geri gönderiyoruz
    return response.status(200).json({ status: 'success', roomState });

  } catch (error) {
    console.error('Error submitting answer:', error);
    return response.status(500).json({ error: 'Cevap gönderilirken bir hata oluştu.' });
  }
}