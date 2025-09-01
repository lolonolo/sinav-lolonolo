// DOSYANIN TAMAMI - KOPYALAYIP DEĞİŞTİRİN

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
    
    // GENEL DEĞİŞKENLER
    let tumSinavlar = [];
    let mevcutSinavVerisi = {};
    let mevcutSoruIndexi = 0;
    let tekliPuan = 0;

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
            sinavOgesi.addEventListener('click', () => sinaviBaslat(sinav.id));
            sinavListesiKonteyneri.appendChild(sinavOgesi);
        });
    }

    function sinavlariFiltrele() {
        const aramaTerimi = aramaGirdisi.value.toLowerCase();
        const filtrelenmisSinavlar = tumSinavlar.filter(sinav => sinav.title.toLowerCase().includes(aramaTerimi));
        sinavListesiniOlustur(filtrelenmisSinavlar);
    }

    async function sinaviBaslat(sinavId) {
        lobiEkrani.innerHTML = `<h1>Sınav Yükleniyor...</h1>`;
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
        
        // HATA BURADAYDI: "dogruCervapIndex" -> "dogruCevapIndex" OLARAK DÜZELTİLDİ
        const dogruMu = secilenIndex == soru.dogruCevapIndex;
        
        if (dogruMu) {
            tekliPuan += 10;
            if (tekliPuanElementi) tekliPuanElementi.textContent = tekliPuan;
        }
        
        tumButonlar[secilenIndex].classList.add(dogruMu ? 'correct' : 'incorrect');
        
        // HATA BURADAYDI: "dogruCervapIndex" -> "dogruCevapIndex" OLARAK DÜZELTİLDİ
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

    function finalPuaniniGoster() {
        soruMetniElementi.textContent = 'Sınav bitti!';
        seceneklerKonteyneri.innerHTML = `<strong>Final Puanınız : ${tekliPuan}</strong><br><br><button class="next-question-btn" style="display: block;" onclick="location.reload()">Yeni Sınav Seç</button>`;
        aciklamaAlani.style.display = 'none';
        sonrakiSoruButonu.style.display = 'none';
    }

    function sonrakiSoruyaGec() {
        soruYukle(mevcutSoruIndexi + 1);
    }

    function ekranGoster(gosterilecekEkran) {
        if (lobiEkrani) lobiEkrani.style.display = 'none';
        if (yarismaEkrani) yarismaEkrani.style.display = 'none';
        if (gosterilecekEkran) gosterilecekEkran.style.display = 'flex';
    }

    if (aramaGirdisi) aramaGirdisi.addEventListener('keyup', sinavlariFiltrele);
    document.body.addEventListener('click', function (event) {
        if (event.target && event.target.id === 'next-q-btn') {
            sonrakiSoruyaGec();
        }
    });
    
    sinavlariGetirVeGoster();
});
