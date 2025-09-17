// sitemap_generator.js

// Gerekli modülleri import et
const fs = require('fs');
const fetch = require('node-fetch'); // Bu paketi sunucunuza kurmanız gerekir: npm install node-fetch@2

// --- AYARLAR ---
const siteUrl = 'https://sinav.lolonolo.com'; // Sitenizin tam adresi
const apiUrl = `${siteUrl}/api/getQuizzes`; // Sınavları çeken API adresi
const outputPath = './sitemap.xml'; // Sitemap dosyasının kaydedileceği yer (sitenizin ana dizini olmalı)
// --- AYARLAR SONU ---

// URL slug oluşturma fonksiyonu (sitedeki ile birebir aynı)
function slugify(text) {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
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
            urls.push({ loc: `${siteUrl}/sinav/${slug}`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' });
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
