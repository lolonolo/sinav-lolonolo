import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // Gelen isteğin JSON formatında olduğundan emin oluyoruz
  if (request.headers['content-type'] !== 'application/json') {
    return response.status(400).json({ error: 'Content-Type must be application/json' });
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const chat = request.body; // Artık await request.body demeye gerek yok

    if (!chat || !chat.id || !chat.messages) {
      return response.status(400).json({ error: 'Invalid chat data provided.' });
    }

    await kv.set(chat.id, chat);

    return response.status(200).json({ status: 'success', message: `Chat ${chat.id} has been archived.` });

  } catch (error) {
    console.error('Error archiving chat:', error);
    // Hata durumunda bile JSON formatında cevap dönüyoruz
    return response.status(500).json({ error: 'Failed to archive chat.', details: error.message });
  }
}