document.addEventListener('DOMContentLoaded', () => {
    // ELEMENT TANIMLAMALARI (Değişken tanımlamaları let olarak değiştirildi)
    let lobiEkrani = document.getElementById('lobby-screen');
    let yarismaEkrani = document.getElementById('competition-screen');
    let sinavListesiKonteyneri = document.getElementById('quiz-list-container');
    let aramaGirdisi = document.getElementById('quiz-search-input');
    const sinavBasligiElementi = document.getElementById('quiz-title');
    const soruMetniElementi = document.getElementById('question-text');
    const seceneklerKonteyneri = document.getElementById('options-container');
    const aciklamaAlani = document.getElementById('explanation-area');
    const sonrakiSoruButonu = document.getElementById('next-q-btn');
    const soruSayaciElementi = document.getElementById('question-counter');
    const tekliPuanElementi = document.getElementById('solo-score');
    const hamburgerButonu = document.getElementById('hamburger-menu');
    const mobilNavPanel = document.getElementById('mobile-nav');

    // GENEL DEĞİŞKENLER
    let tumSinavlar = [];
    let mevcutSinavVerisi = {};
    let mevcutSoruIndexi = 0;
    let tekliPuan = 0;

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

    async function sinavlariGetirVeGoster() {
        try {
            const yanit = await fetch(`/api/getQuizzes`);
            if (!yanit.ok) {
                const hataVerisi = await yanit.json();
                throw new Error(hataVerisi.error || 'Sınav listesi alınamadı.');
            }
            tumSinavlar = await yanit.json();
            sinavListesiniOlustur(tumSinavlar);
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
            sinavOgesi.addEventListener('click', () => {
                const slug = slugify(sinav.title);
                const yeniUrl = `/sinav/${slug}`;
                history.pushState({ quizId: sinav.id }, sinav.title, yeniUrl);
                sinaviBaslat(sinav.id);
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
        ekranGoster(null, true);
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
            lobiEkrani.innerHTML = `<h1 style="color: red;">Hata: ${hata.message}</h1><button id="geri-don">Geri Dön</button>`;
            document.getElementById('geri-don').addEventListener('click', anaSayfayaDon);
            ekranGoster(lobiEkrani);
        }
    }

    function soruYukle(soruIndexi) {
        // ... Bu fonksiyonun içeriği aynı kalacak ...
    }

    function cevabiIsle(secilenIndex) {
        // ... Bu fonksiyonun içeriği aynı kalacak ...
    }

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

    // DEĞİŞTİRİLDİ: Bu fonksiyon hatayı çözmek için güncellendi
    function anaSayfayaDon() {
        if(window.location.pathname !== "/") {
            history.pushState(null, 'Ana Sayfa', '/');
        }
        
        // Orijinal lobi HTML'ini tekrar oluştur
        lobiEkrani.innerHTML = `
            <div class="lobby-container">
                <h2>SINAVINI SEÇ VE BAŞLA!</h2>
                <p>Aşağıdaki listeden bir sınav seçin veya aramayı kullanın.</p>
                <div class="quiz-selection-area">
                    <input type="text" id="quiz-search-input" placeholder="Sınav ara...">
                    <div id="quiz-list-container">
                        <p>Sınavlar Yükleniyor...</p>
                    </div>
                </div>
            </div>`;
        
        // **ÖNEMLİ DÜZELTME:**
        // HTML yeniden yazıldığı için kaybolan element referanslarını ve olay dinleyicilerini yenile
        sinavListesiKonteyneri = document.getElementById('quiz-list-container');
        aramaGirdisi = document.getElementById('quiz-search-input');
        aramaGirdisi.addEventListener('keyup', sinavlariFiltrele);

        ekranGoster(lobiEkrani);
        sinavListesiniOlustur(tumSinavlar); // Mevcut listeyi kullanarak sınavları hemen göster
    }

    function yoluIsle() {
        const path = window.location.pathname;
        if (path.startsWith('/sinav/')) {
            // Eğer sınav listesi henüz yüklenmediyse, yüklenmesini bekle.
            if(tumSinavlar.length === 0) {
                // Bu durum, sayfa doğrudan sınav URL'i ile açıldığında olur.
                // sinavlariGetirVeGoster() zaten çağrıldı ve bitince urlDenSinavBaslat()'ı tetikleyecek.
                return;
            }
            urlDenSinavBaslat();
        } else {
            anaSayfayaDon();
        }
    }

    function urlDenSinavBaslat() {
        if (tumSinavlar.length === 0) return; 
        
        const path = window.location.pathname;
        if (path.startsWith('/sinav/')) {
            const slug = path.substring(7);
            const bulunanSinav = tumSinavlar.find(s => slugify(s.title) === slug);
            if (bulunanSinav) {
                sinaviBaslat(bulunanSinav.id);
            } else {
                console.warn('Bu URL ile eşleşen sınav bulunamadı:', slug);
                anaSayfayaDon();
            }
        } else {
            // Eğer ana sayfadaysak ve lobi görünmüyorsa göster
            if(lobiEkrani.style.display === 'none') {
                 anaSayfayaDon();
            }
        }
    }

    // EVENT LISTENERS
    aramaGirdisi.addEventListener('keyup', sinavlariFiltrele);
    sonrakiSoruButonu.addEventListener('click', sonrakiSoruyaGec);

    window.addEventListener('popstate', yoluIsle);

    if (hamburgerButonu && mobilNavPanel) {
        hamburgerButonu.addEventListener('click', () => {
            hamburgerButonu.classList.toggle('active');
            mobilNavPanel.classList.toggle('open');
        });
        mobilNavPanel.querySelectorAll('a.close-menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                anaSayfayaDon();
                hamburgerButonu.classList.remove('active');
                mobilNavPanel.classList.remove('open');
            });
        });
    }

    document.querySelector('.desktop-menu a.home-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        anaSayfayaDon();
    });

    // BAŞLANGIÇ
    sinavlariGetirVeGoster();
});
