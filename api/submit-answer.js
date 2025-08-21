import { kv } from '@vercel/kv';

const correctAnswers = {
    "Segem 2025 Sınav Soruları": [
        1, 0, 1, 2, 0, 1, 2, 1, 2, 2, 1, 1, 1, 2, 0, 3, 0, 1, 1, 0, 
        1, 1, 1, 2, 0, 3, 0, 1, 1, 0, 1, 3, 2, 2, 0, 0, 1, 2, 2, 1, 
        2, 1, 1, 1, 0, 0, 0, 3, 1, 3, 1, 2
    ]
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

    if (player) {
        if (!player.score) player.score = 0;
        if (answerIndex === correctAnswerIndex) {
            player.score += 10;
        }
    }
    
    if(!roomState.answers) roomState.answers = {};
    if(!roomState.answers[questionIndex]) roomState.answers[questionIndex] = {};
    roomState.answers[questionIndex][playerId] = answerIndex;

    await kv.set(roomKey, roomState, { ex: 86400 });

    return response.status(200).json({ status: 'success', roomState });

  } catch (error) { // DÜZELTME: Eksik olan '{' parantezi eklendi.
    console.error('Error submitting answer:', error);
    return response.status(500).json({ error: 'Cevap gönderilirken bir hata oluştu.' });
  }
}