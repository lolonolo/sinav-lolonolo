export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const quizId = searchParams.get('id');

  if (!quizId) {
    return new Response(JSON.stringify({ error: 'Sınav ID gerekli.' }), { status: 400 });
  }

  // DEĞİŞİKLİK: API adresini staging siteniz olarak güncelleyin.
  const API_ENDPOINT = `https://staging-6eb4-lolonolocom.wpcomstaging.com/wp-json/lolonolo-quiz/v16/quiz/${quizId}`;
  const API_KEY = process.env.LOLONOLO_API_KEY;

  try {
    const response = await fetch(API_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("WordPress API Hatası:", response.status, response.statusText, errorBody);
      throw new Error(`WordPress API hatası: ${response.statusText}`);
    }

    let data = await response.json();

    // Soruları karıştırma
    if (data && data.sorular && Array.isArray(data.sorular)) {
      for (let i = data.sorular.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data.sorular[i], data.sorular[j]] = [data.sorular[j], data.sorular[i]];
      }
    }

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
