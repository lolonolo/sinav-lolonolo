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

    // Odanın durumunu "başladı" olarak güncelle
    roomState.status = 'in_progress';
    
    // Güncellenmiş oda durumunu veritabanına geri kaydet
    await kv.set(roomKey, roomState, { ex: 86400 });

    return response.status(200).json({ status: 'success', message: 'Yarışma başlatıldı.' });

  } catch (error) {
    console.error('Error starting game:', error);
    return response.status(500).json({ error: 'Yarışma başlatılırken bir hata oluştu.' });
  }
}