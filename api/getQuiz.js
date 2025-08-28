export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // URL'den sınav ID'sini al
  const { searchParams } = new URL(request.url);
  const quizId = searchParams.get('id');

  if (!quizId) {
    return new Response(JSON.stringify({ error: 'Sınav ID gerekli.' }), { status: 400 });
  }

  const API_ENDPOINT = `https://staging-6eb4-lolonolocom.wpcomstaging.com.com/wp-json/lolonolo-quiz/v16/quiz/${quizId}`;
  const API_KEY = process.env.LOLONOLO_API_KEY;

  try {
    const response = await fetch(API_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress API hatası: ${response.statusText}`);
    }

    let data = await response.json();

    // --- YENİ EKLENEN KISIM: SORULARI KARIŞTIRMA ---
    if (data && data.sorular && Array.isArray(data.sorular)) {
      // Fisher-Yates (aka Knuth) Shuffle algoritması
      for (let i = data.sorular.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data.sorular[i], data.sorular[j]] = [data.sorular[j], data.sorular[i]];
      }
    }
    // --- YENİ KISIM SONU ---

    // Artık karıştırılmış veriyi tarayıcıya geri gönder
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
