export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // DEĞİŞİKLİK: API adresini staging siteniz olarak güncelleyin.
  const API_ENDPOINT = 'https://staging-6eb4-lolonolocom.wpcomstaging.com/wp-json/lolonolo-quiz/v21/quizzes';
  
  const API_KEY = process.env.LOLONOLO_API_KEY;

  try {
    const response = await fetch(API_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      // Hata detayını görmek için loglama ekleyebiliriz.
      const errorBody = await response.text();
      console.error("WordPress API Hatası:", response.status, response.statusText, errorBody);
      throw new Error(`WordPress API hatası: ${response.statusText}`);
    }

    const data = await response.json();

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
