import { kv } from '@vercel/kv';

const ADJECTIVES = ["HIZLI", "AKILLI", "GIZEMLI", "PARLAK", "CESUR", "SAKIN", "GUCLU"];
const NOUNS = ["ASLAN", "KARTAL", "KEDI", "KAPI", "BULUT", "YILDIZ", "NEHIR"];

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { playerName } = request.body;
    if (!playerName) {
        return response.status(400).json({ error: 'Oyuncu adı gerekli.' });
    }
    
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 90) + 10;
    const roomCode = `${adj}${noun}${num}`;
    const roomKey = `room:${roomCode}`;
    const newPlayerId = `player${Date.now()}`; // Benzersiz bir ID oluştur

    const roomState = {
      code: roomCode,
      players: {
        [newPlayerId]: { name: playerName, team: 'A', score: 0 }
      },
      status: 'waiting',
      createdAt: Date.now()
    };

    await kv.set(roomKey, roomState, { ex: 86400 });

    // YENİ: Kurucunun kendi ID'sini de cevap olarak gönderiyoruz
    return response.status(200).json({ status: 'success', roomState: roomState, newPlayerId: newPlayerId });

  } catch (error) {
    console.error('Error creating room:', error);
    return response.status(500).json({ error: 'Oda oluşturulurken bir hata oluştu.' });
  }
}