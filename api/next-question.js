import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { roomCode } = request.body;
    if (!roomCode) {
      return response.status(400).json({ error: 'Oda kodu gerekli.' });
    }

    const roomKey = `room:${roomCode.toUpperCase()}`;
    const roomState = await kv.get(roomKey);

    if (!roomState) {
      return response.status(404).json({ error: 'Oda bulunamadı.' });
    }

    // Odanın mevcut soru indeksini bir artır
    if (roomState.currentQuestionIndex === undefined) {
      roomState.currentQuestionIndex = 0;
    } else {
      roomState.currentQuestionIndex += 1;
    }
    
    // Herkesin cevaplarını sıfırla ki yeni soruda cevap verebilsinler
    roomState.answers = {};

    await kv.set(roomKey, roomState, { ex: 86400 });

    return response.status(200).json({ status: 'success', message: 'Sonraki soruya geçildi.' });

  } catch (error) {
    console.error('Error advancing to next question:', error);
    return response.status(500).json({ error: 'Sonraki soruya geçilirken bir hata oluştu.' });
  }
}