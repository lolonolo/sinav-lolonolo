document.addEventListener('DOMContentLoaded', () => {
    // ELEMENT TANIMLAMALARI
    const lobiEkrani = document.getElementById('lobby-screen');
    const yarismaEkrani = document.getElementById('competition-screen');
    const sinavListesiKonteyneri = document.getElementById('quiz-list-container');
    const aramaGirdisi = document.getElementById('quiz-search-input');
    const sinavBasligiElementi = document.getElementById('quiz-title');
    const soruMetniElementi = document.getElementById('question-text');
    const seceneklerKonteyneri = document.getElementById('options-container');
    const aciklamaAlani = document.getElementById('explanation-area');
    const sonrakiSoruButonu = document.getElementById('next-q-btn');
    const soruSayaciElementi = document.getElementById('question-counter');
    const tekliPuanElementi = document.getElementById('solo-score');
    // YENİ: Menü elementleri
    const hamburgerButonu = document.getElementById('hamburger-menu');
    const mobilNavPanel = document.getElementById('mobile-nav');

    // GENEL DEĞİŞKENLER
    let tumSinavlar = [];
    let mevcutSinavVerisi = {};
    let mevcutSoruIndexi = 0;
    let tekliPuan = 0;

    // YENİ: URL için "slug" oluşturma fonksiyonu (Örn: "AUZEF - Çocuk Gelişimi" -> "auzef-cocuk-gelisimi")
    function slugify(text) {
        const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
        const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
        const p = new RegExp(a.split('').join('|'), 'g')
      
        return text.toString().toLowerCase()
          .replace(/\s+/g, '-') 
          .replace(p, c => b.charAt(a.indexOf(c))) 
          .replace(/&/g, '-and-') 
          .replace(/[^\w\-]+/g, '') 
          .replace(/\-\-+/g, '-') 
          .replace(/^-+/, '') 
          .replace(/-+$/, '') 
    }

    // ANA FONKSİYONLAR
    async function sinavlariGetirVeGoster() {
        try {
            const yanit = await fetch(`/api/getQuizzes`);
            if (!yanit.ok) {
                const hataVerisi = await yanit.json();
                throw new Error(hataVerisi.error || 'Sınav listesi alınamadı.');
            }
            tumSinavlar = await yanit.json();
            sinavListesiniOlustur(tumSinavlar);
            // YENİ: Sınavlar yüklendikten sonra URL'i kontrol et
            urlDenSinavBaslat();
        } catch (hata) {
            if (sinavListesiKonteyneri) sinavListesiKonteyneri.innerHTML = `<p style="color: red;">Hata: ${hata.message}</p>`;
        }
    }

    function sinavListesiniOlustur(sinavlar) {
        if (!sinavListesiKonteyneri || !Array.isArray(sinavlar)) {
            sinavListesiKonteyneri.innerHTML = '<p>Hiç sınav bulunamadı veya veri formatı yanlış.</p>';
            return;
        }
        sinavListesiKonteyneri.innerHTML = '';
        sinavlar.forEach(sinav => {
            const sinavOgesi = document.createElement('div');
            sinavOgesi.className = 'quiz-list-item';
            sinavOgesi.textContent = sinav.title;
            sinavOgesi.dataset.quizId = sinav.id;
            // DEĞİŞTİRİLDİ: Tıklama olayı artık URL'i güncelliyor
            sinavOgesi.addEventListener('click', () => {
                const slug = slugify(sinav.title);
                const yeniUrl = `/sinav/${slug}`;
                history.pushState({ quizId: sinav.id }, sinav.title, yeniUrl); // URL'i değiştir
                sinaviBaslat(sinav.id); // Sınavı başlat
            });
            sinavListesiKonteyneri.appendChild(sinavOgesi);
        });
    }

    function sinavlariFiltrele() {
        const aramaTerimi = aramaGirdisi.value.toLowerCase();
        const filtrelenmisSinavlar = tumSinavlar.filter(sinav => sinav.title.toLowerCase().includes(aramaTerimi));
        sinavListesiniOlustur(filtrelenmisSinavlar);
    }

    async function sinaviBaslat(sinavId) {
        ekranGoster(null, true); // Önce yükleniyor ekranı göster
        try {
            const yanit = await fetch(`/api/getQuiz?id=${sinavId}`);
            if (!yanit.ok) {
                const hataVerisi = await yanit.json();
                throw new Error(hataVerisi.error || 'Sınav verileri alınamadı.');
            }
            mevcutSinavVerisi = await yanit.json();
            if (!mevcutSinavVerisi.sorular || mevcutSinavVerisi.sorular.length === 0) { throw new Error('Bu sınavda soru bulunamadı.'); }
            mevcutSoruIndexi = 0;
            tekliPuan = 0;
            if (tekliPuanElementi) tekliPuanElementi.textContent = '0';
            document.body.className = 'solo-mode';
            ekranGoster(yarismaEkrani);
            soruYukle(0);
        } catch (hata) {
            lobiEkrani.innerHTML = `<h1 style="color: red;">Hata: ${hata.message}</h1>`;
            ekranGoster(lobiEkrani);
        }
    }

    function soruYukle(soruIndexi) {
        const mevcutReklamKonteyneri = document.querySelector('.ad-container-in-question');
        if (mevcutReklamKonteyneri) {
            mevcutReklamKonteyneri.remove();
        }

        const soru = mevcutSinavVerisi.sorular[soruIndexi];
        mevcutSoruIndexi = soruIndexi;
        sinavBasligiElementi.textContent = mevcutSinavVerisi.sinavAdi;
        soruMetniElementi.innerHTML = soru.soruMetni;
        seceneklerKonteyneri.innerHTML = '';
        aciklamaAlani.style.display = 'none';
        sonrakiSoruButonu.style.display = 'none';

        soru.secenekler.forEach((secenek, index) => {
            const buton = document.createElement('button');
            buton.className = 'option-btn';
            buton.innerHTML = secenek;
            buton.addEventListener('click', () => cevabiIsle(index));
            seceneklerKonteyneri.appendChild(buton);
        });

        soruSayaciElementi.textContent = `Soru ${soruIndexi + 1} / ${mevcutSinavVerisi.sorular.length}`;

        if ((soruIndexi + 1) % 5 === 0 && soruIndexi > 0) {
            const promoKonteyneri = document.createElement('div');
            promoKonteyneri.className = 'ad-container-in-question';
            promoKonteyneri.style.margin = '25px 0';
            promoKonteyneri.style.padding = '20px';
            promoKonteyneri.style.backgroundColor = '#eaf5ff';
            promoKonteyneri.style.border = '2px dashed #007bff';
            promoKonteyneri.style.borderRadius = '10px';
            promoKonteyneri.style.textAlign = 'center';
            promoKonteyneri.style.fontFamily = "'Poppins', sans-serif";
            promoKonteyneri.style.lineHeight = '1.6';

            const mesajMetni = document.createElement('p');
            mesajMetni.textContent = 'Lolonolo\'yu desteklemek ve reklamsız bir deneyim için Premium Üyelik alın!';
            mesajMetni.style.margin = '0 0 15px 0';
            mesajMetni.style.fontSize = '1.1em';
            mesajMetni.style.color = '#1a5c90';

            const shopierLinki = document.createElement('a');
            shopierLinki.href = 'https://www.shopier.com/lolonolo';
            shopierLinki.target = '_blank';
            shopierLinki.textContent = 'Shopier\'den Üyelik Al';
            shopierLinki.style.display = 'inline-block';
            shopierLinki.style.backgroundColor = '#007bff';
            shopierLinki.style.color = 'white';
            shopierLinki.style.padding = '10px 20px';
            shopierLinki.style.borderRadius = '8px';
            shopierLinki.style.textDecoration = 'none';
            shopierLinki.style.fontWeight = 'bold';

            promoKonteyneri.appendChild(mesajMetni);
            promoKonteyneri.appendChild(shopierLinki);

            aciklamaAlani.parentNode.insertBefore(promoKonteyneri, aciklamaAlani);
        }
    }

    function cevabiIsle(secilenIndex) {
        const tumButonlar = seceneklerKonteyneri.querySelectorAll('.option-btn');
        tumButonlar.forEach(btn => btn.disabled = true);
        const soru = mevcutSinavVerisi.sorular[mevcutSoruIndexi];
        
        const dogruMu = secilenIndex == soru.dogruCevapIndex;
        
        if (dogruMu) {
            tekliPuan += 10;
            if (tekliPuanElementi) tekliPuanElementi.textContent = tekliPuan;
        }
        
        tumButonlar[secilenIndex].classList.add(dogruMu ? 'correct' : 'incorrect');
        
        if (!dogruMu && soru.dogruCevapIndex >= 0 && soru.dogruCevapIndex < tumButonlar.length) {
            tumButonlar[soru.dogruCevapIndex].classList.add('correct');
        }
        
        if (soru.aciklama) {
            aciklamaAlani.innerHTML = soru.aciklama;
            aciklamaAlani.style.display = 'block';
        }
        
        if (mevcutSoruIndexi < mevcutSinavVerisi.sorular.length - 1) {
            sonrakiSoruButonu.style.display = 'block';
        } else {
            setTimeout(finalPuaniniGoster, 3000);
        }
    }

    // DEĞİŞTİRİLDİ: Sınav sonu fonksiyonu artık sayfayı yenilemiyor, ana menüye yönlendiriyor.
    function finalPuaniniGoster() {
        soruMetniElementi.textContent = 'Sınav bitti!';
        const yeniSinavBtn = document.createElement('button');
        yeniSinavBtn.className = 'next-question-btn';
        yeniSinavBtn.style.display = 'block';
        yeniSinavBtn.textContent = 'Yeni Sınav Seç';
        yeniSinavBtn.addEventListener('click', anaSayfayaDon);

        seceneklerKonteyneri.innerHTML = `<strong>Final Puanınız : ${tekliPuan}</strong><br><br>`;
        seceneklerKonteyneri.appendChild(yeniSinavBtn);
        aciklamaAlani.style.display = 'none';
        sonrakiSoruButonu.style.display = 'none';
    }

    function sonrakiSoruyaGec() {
        soruYukle(mevcutSoruIndexi + 1);
    }
    
    // DEĞİŞTİRİLDİ: Ekran gösterme fonksiyonu, yükleniyor durumu için güncellendi.
    function ekranGoster(gosterilecekEkran, yukleniyor = false) {
        if (lobiEkrani) lobiEkrani.style.display = 'none';
        if (yarismaEkrani) yarismaEkrani.style.display = 'none';

        if (yukleniyor) {
            lobiEkrani.style.display = 'flex';
            lobiEkrani.innerHTML = `<h1>Sınav Yükleniyor...</h1>`;
        } else if (gosterilecekEkran) {
            gosterilecekEkran.style.display = 'flex';
        }
    }

    // YENİ: Ana sayfaya (lobiye) dönme fonksiyonu
    function anaSayfayaDon() {
        history.pushState(null, 'Ana Sayfa', '/');
        // Orijinal lobi içeriğini geri yükle
        lobiEkrani.innerHTML = `
            <div class="lobby-container">
                <h2>SINAVINI SEÇ VE BAŞLA!</h2>
                <p>Aşağıdaki listeden bir sınav seçin veya aramayı kullanın.</p>
                <div class="quiz-selection-area">
                    <input type="text" id="quiz-search-input" placeholder="Sınav ara...">
                    <div id="quiz-list-container">
                        </div>
                </div>
            </div>`;
        ekranGoster(lobiEkrani);
        sinavlariGetirVeGoster(); // Listeyi yeniden doldur
    }

    // YENİ: URL'e göre doğru içeriği gösterme fonksiyonu
    function yoluIsle() {
        const path = window.location.pathname;
        if (path.startsWith('/sinav/')) {
            urlDenSinavBaslat();
        } else {
            anaSayfayaDon();
        }
    }

    // YENİ: URL'den slug'ı alıp sınavı bulan ve başlatan fonksiyon
    function urlDenSinavBaslat() {
        if (tumSinavlar.length === 0) return; // Henüz sınavlar yüklenmediyse bekle
        
        const path = window.location.pathname;
        if (path.startsWith('/sinav/')) {
            const slug = path.substring(7); // "/sinav/" kısmını at
            const bulunanSinav = tumSinavlar.find(s => slugify(s.title) === slug);
            if (bulunanSinav) {
                sinaviBaslat(bulunanSinav.id);
            } else {
                console.warn('Bu URL ile eşleşen sınav bulunamadı:', slug);
                anaSayfayaDon(); // Bulamazsa ana sayfaya dön
            }
        } else {
             ekranGoster(lobiEkrani); // Ana sayfadaysa lobiyi göster
        }
    }

    // EVENT LISTENERS
    if (aramaGirdisi) aramaGirdisi.addEventListener('keyup', sinavlariFiltrele);
    sonrakiSoruButonu.addEventListener('click', sonrakiSoruyaGec);

    // YENİ: Geri/İleri butonları için event listener
    window.addEventListener('popstate', yoluIsle);

    // YENİ: Mobil menü için event listener'lar
    if (hamburgerButonu && mobilNavPanel) {
        hamburgerButonu.addEventListener('click', () => {
            hamburgerButonu.classList.toggle('active');
            mobilNavPanel.classList.toggle('open');
        });
        // Menüdeki linke tıklanınca menüyü kapat
        mobilNavPanel.querySelectorAll('a.close-menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                anaSayfayaDon();
                hamburgerButonu.classList.remove('active');
                mobilNavPanel.classList.remove('open');
            });
        });
    }

    // YENİ: Masaüstü menüsündeki "Tüm Sınavlar" linki için
    document.querySelector('.desktop-menu a.home-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        anaSayfayaDon();
    });

    // BAŞLANGIÇ
    sinavlariGetirVeGoster(); // Uygulamayı başlat
});
