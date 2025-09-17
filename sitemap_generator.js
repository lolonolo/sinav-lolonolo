// sitemap_generator.js

const fs = require('fs');
const fetch = require('node-fetch');

// --- AYARLAR ---
const siteUrl = 'https://sinav.lolonolo.com';
const apiUrl = `${siteUrl}/api/getQuizzes`;
const outputPath = './sitemap.xml';
// --- AYARLAR SONU ---

function slugify(text) {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìıłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')
    return text.toString().toLowerCase().replace(/\s+/g, '-').replace(p, c => b.charAt(a.indexOf(c))).replace(/&/g, '-and-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '')
}

async function generateSitemap() {
    console.log('Sitemap oluşturucu başlatıldı...');
    try {
        console.log('Sınavlar API\'den çekiliyor...');
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API'den veri alınamadı. Durum Kodu: ${response.status}`);
        }
        const quizzes = await response.json();
        console.log(`${quizzes.length} adet sınav bulundu.`);

        const urls = [];
        urls.push({ loc: siteUrl, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '1.0' });

        quizzes.forEach(quiz => {
            const slug = slugify(quiz.title);
            
            // --- DEĞİŞİKLİK BURADA YAPILDI ---
            // URL'den "/sinav/" kısmı kaldırıldı.
            urls.push({ loc: `${siteUrl}/${slug}`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' });
        });

        let xmlString = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        urls.forEach(url => {
            xmlString += `  <url>\n    <loc>${url.loc}</loc>\n    <lastmod>${url.lastmod}</lastmod>\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>\n`;
        });
        xmlString += `</urlset>`;

        fs.writeFileSync(outputPath, xmlString);
        console.log(`Sitemap başarıyla oluşturuldu ve "${outputPath}" adresine kaydedildi.`);
    } catch (error) {
        console.error('Sitemap oluşturulurken bir hata oluştu:', error);
    }
}

generateSitemap();
