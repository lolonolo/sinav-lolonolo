export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // WordPress API'nizin tam adresi
  const API_ENDPOINT = 'https://staging-6eb4-lolonolocom.wpcomstaging.com/wp-json/lolonolo-quiz/v16/quizzes';
  
  // Vercel'in kasasından gizli anahtarı al
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

    const data = await response.json();

    // Gelen veriyi doğrudan tarayıcıya geri gönder
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Vercel'den geldiği için güvenli
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
