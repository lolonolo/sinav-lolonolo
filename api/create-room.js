import { kv } from '@vercel/kv';

// Oda kodları için basit ve akılda kalıcı kelime listeleri
const ADJECTIVES = ["HIZLI", "AKILLI", "GIZEMLI", "PARLAK", "CESUR", "SAKIN", "GUCLU"];
const NOUNS = ["ASLAN", "KARTAL", "KEDI", "KAPI", "BULUT", "YILDIZ", "NEHIR"];

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Benzersiz ve akılda kalıcı bir oda kodu oluştur
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 90) + 10; // 10-99 arası bir sayı
    const roomCode = `${adj}${noun}${num}`;

    // Odanın başlangıç durumunu oluştur
    const roomState = {
      code: roomCode,
      players: {
        // İlk oyuncuyu (kurucuyu) varsayılan olarak ekleyelim
        player1: { name: 'Oyuncu 1 (Kurucu)', team: 'A' }
      },
      status: 'waiting', // Odanın durumu: waiting, in_progress, finished
      createdAt: Date.now()
    };

    // Odayı Vercel KV veritabanına kaydet
    // Oda verilerini 24 saat sonra otomatik olarak silmek için 'ex' (expire) parametresini kullanabiliriz
    await kv.set(`room:${roomCode}`, roomState, { ex: 86400 });

    // Başarılı bir şekilde oluşturulduğuna dair cevabı ve oda kodunu ön yüze gönder
    return response.status(200).json({ status: 'success', roomCode: roomCode });

  } catch (error) {
    console.error('Error creating room:', error);
    return response.status(500).json({ error: 'Oda oluşturulurken bir hata oluştu.' });
  }
}