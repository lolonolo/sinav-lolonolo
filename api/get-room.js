import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // Bu fonksiyon sadece GET isteklerini kabul etmeli
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Oda kodunu URL'den alıyoruz (örn: /api/get-room?code=KEDI5)
    const roomCode = request.query.code;

    if (!roomCode) {
      return response.status(400).json({ error: 'Oda kodu gerekli.' });
    }

    const roomKey = `room:${roomCode.toUpperCase()}`;
    const roomState = await kv.get(roomKey);

    if (!roomState) {
      return response.status(404).json({ error: 'Oda bulunamadı.' });
    }

    // Odanın en güncel durumunu cevap olarak gönder
    return response.status(200).json({ status: 'success', roomState: roomState });

  } catch (error) {
    console.error('Error getting room state:', error);
    return response.status(500).json({ error: 'Oda bilgileri alınırken bir hata oluştu.' });
  }
}