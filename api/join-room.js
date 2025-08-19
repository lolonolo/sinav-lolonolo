import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { roomCode, playerName } = request.body;

    if (!roomCode || !playerName) {
      return response.status(400).json({ error: 'Oda kodu ve oyuncu adı gerekli.' });
    }

    const roomKey = `room:${roomCode.toUpperCase()}`;
    const roomState = await kv.get(roomKey);

    if (!roomState) {
      return response.status(404).json({ error: 'Oda bulunamadı.' });
    }

    // Oyuncu zaten odada mı diye kontrol et (opsiyonel ama iyi bir pratik)
    if (Object.values(roomState.players).some(p => p.name === playerName)) {
        // Bu senaryoda, oyuncuyu tekrar odaya yönlendirebiliriz.
        return response.status(200).json({ status: 'success', roomState });
    }

    // Yeni oyuncu için bir ID oluştur
    const newPlayerId = `player${Object.keys(roomState.players).length + 1}`;

    // Takımlardaki oyuncu sayılarını hesapla
    const teamACount = Object.values(roomState.players).filter(p => p.team === 'A').length;
    const teamBCount = Object.values(roomState.players).filter(p => p.team === 'B').length;

    // Oyuncuyu en boş takıma ata
    const newPlayerTeam = teamACount <= teamBCount ? 'A' : 'B';

    // Odanın oyuncu listesini güncelle
    roomState.players[newPlayerId] = {
      name: playerName,
      team: newPlayerTeam,
    };

    // Güncellenmiş oda durumunu veritabanına geri kaydet
    await kv.set(roomKey, roomState, { ex: 86400 });

    // Başarılı cevabı ve güncel oda durumunu ön yüze gönder
    return response.status(200).json({ status: 'success', roomState: roomState });

  } catch (error) {
    console.error('Error joining room:', error);
    return response.status(500).json({ error: 'Odaya katılırken bir hata oluştu.' });
  }
}