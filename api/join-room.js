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

    const isNameTaken = Object.values(roomState.players).some(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (isNameTaken) {
      return response.status(409).json({ error: 'Bu oyuncu adı zaten alınmış. Lütfen farklı bir isim seçin.' });
    }
    
    const newPlayerId = `player${Date.now()}`;
    const teamACount = Object.values(roomState.players).filter(p => p.team === 'A').length;
    const teamBCount = Object.values(roomState.players).filter(p => p.team === 'B').length;
    const newPlayerTeam = teamACount <= teamBCount ? 'A' : 'B';

    roomState.players[newPlayerId] = {
      name: playerName,
      team: newPlayerTeam,
      score: 0,
      isCreator: false // DÜZELTME: Katılan oyuncu kurucu değil
    };

    await kv.set(roomKey, roomState, { ex: 86400 });

    return response.status(200).json({ status: 'success', roomState: roomState, newPlayerId: newPlayerId });

  } catch (error) {
    console.error('Error joining room:', error);
    return response.status(500).json({ error: 'Odaya katılırken bir hata oluştu.' });
  }
}