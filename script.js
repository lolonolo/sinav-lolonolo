document.addEventListener('DOMContentLoaded', () => {
    // GitHub Pages yönlendirmesini handle eden bölüm
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
        sessionStorage.removeItem('redirectPath');
        window.history.replaceState(null, null, redirectPath);
    }

    // ELEMENT TANIMLAMALARI
    let lobiEkrani = document.getElementById('lobby-screen');
    let yarismaEkrani = document.getElementById('competition-screen');
    const anaSayfaIcerigi = document.getElementById('home-content');
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
    const reklamEkrani = document.getElementById('ad-break-screen');
    const sinavaDevamButonu = document.getElementById('continue-quiz-btn');
    const premiumLinkAdBreak = document.getElementById('premium-link-ad-break');

    // GENEL DEĞİŞKENLER
    let tumSinavlar = [];
    let mevcutSinavVerisi = {};
    let mevcutSoruIndexi = 0;
    let tekliPuan = 0;

    function slugify(text) {
        const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìıłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
        const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
        const p = new RegExp(a.split('').join('|'), 'g')
        return text.toString().toLowerCase().replace(/\s+/g, '-').replace(p, c => b.charAt(a.indexOf(c))).replace(/&/g, '-and-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '')
    }

    function populerSinavlariGoster() {
        const listContainer = document.getElementById('popular-quizzes-list');
        if (!listContainer || tumSinavlar.length === 0) {
            return;
        }
        const rastgeleSinavlar = [...tumSinavlar].sort(() => 0.5 - Math.random()).slice(0, 5);
        listContainer.innerHTML = '';
        rastgeleSinavlar.forEach(sinav => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.textContent = sinav.title;
            link.href = `/${slugify(sinav.title)}`;
            link.title = sinav.title;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const slug = slugify(sinav.title);
                history.pushState({ quizId: sinav.id }, sinav.title, `/${slug}`);
                sinaviBaslat(sinav.id);
            });
            listItem.appendChild(link);
            listContainer.appendChild(listItem);
        });
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
            populerSinavlariGoster();
            yoluIsle();
        } catch (hata) {
            if (sinavListesiKonteyneri) sinavListesiKonteyneri.innerHTML = `<p style="color: red;">Hata: ${hata.message}</p>`;
        }
    }

    function sinavListesiniOlustur(sinavlar) {
        if (!sinavListesiKonteyneri || !Array.isArray(sinavlar)) {
            if (sinavListesiKonteyneri) sinavListesiKonteyneri.innerHTML = '<p>Hiç sınav bulunamadı veya veri formatı yanlış.</p>';
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
                const yeniUrl = `/${slug}`;
                history.pushState({ quizId: sinav.id }, sinav.title, yeniUrl);
                sinaviBaslat(sinav.id);
            });
            sinavListesiKonteyneri.appendChild(sinavOgesi);
        });
    }

    function sinavlariFiltrele() {
        if (!aramaGirdisi) return;
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
            ekranGoster(yarismaEkrani);
            soruYukle(0);
        } catch (hata) {
            lobiEkrani.innerHTML = `<div class="lobby-container" style="color:red;"><h1>Hata: ${hata.message}</h1><br/><button class="next-question-btn" style="display:block;" id="geri-don">Ana Sayfaya Dön</button></div>`;
            document.getElementById('geri-don').addEventListener('click', anaSayfayaDon);
            ekranGoster(lobiEkrani);
        }
    }

    function soruYukle(soruIndexi) {
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

        // --- YENİ EKLENEN KOD ---
        // Açıklama alanı göründükten sonra, ekranı yumuşakça o alana kaydır.
        // 250ms'lik gecikme, tarayıcının alanı çizmesine ve animasyonun
        // daha düzgün çalışmasına olanak tanır.
       setTimeout(() => {
    aciklamaAlani.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}, 250);
        // --- YENİ KOD SONU ---
    }
    
    if (mevcutSoruIndexi < mevcutSinavVerisi.sorular.length - 1) {
        sonrakiSoruButonu.style.display = 'block';
    } else {
        setTimeout(finalPuaniniGoster, 2000);
    }
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
    const sonrakiIndex = mevcutSoruIndexi + 1;

    if (sonrakiIndex > 0 && sonrakiIndex % 5 === 0 && sonrakiIndex < mevcutSinavVerisi.sorular.length) {
        ekranGoster(reklamEkrani);

        const textElement = document.getElementById('typewriter-text');
        const continueButton = document.getElementById('continue-quiz-btn');
        const premiumLink = document.getElementById('premium-link-ad-break');
        const textToType = "Lolonolo'nun gelişmesine katkı yapmak istiyorsan\npremium üyelik avantajlarından yararlan!";

        if (textElement && continueButton && premiumLink) {
            // Animasyonu her seferinde sıfırla
            textElement.classList.remove('typing-effect', 'finished');
            textElement.textContent = textToType;
            void textElement.offsetWidth; 
            textElement.classList.add('typing-effect');
            
            // --- DEĞİŞİKLİKLER BURADA ---
            premiumLink.classList.remove('visible');
            continueButton.style.display = 'block'; // Butonun her zaman görünür olmasını sağla
            continueButton.disabled = true; // Butonu TIKLANAMAZ (pasif) yap

            // Animasyon bittikten sonra butonları göster/aktif et
            setTimeout(() => {
                premiumLink.classList.add('visible');
                textElement.classList.add('finished');
                continueButton.disabled = false; // Butonu TIKLANABİLİR (aktif) yap
            }, 5500); 
            // --- DEĞİŞİKLİKLER SONU ---
        }

        // Ezoic reklamını çağır
        if (typeof ezstandalone !== 'undefined') {
            ezstandalone.cmd.push(function () {
                ezstandalone.showAds(851); 
            });
        }
    } else {
        // Normal şekilde sonraki soruya geç
        soruYukle(sonrakiIndex);
        
        const quizPanel = document.querySelector('.competition-container');
        if (quizPanel) {
            quizPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
    
    function ekranGoster(gosterilecekEkran, yukleniyor = false) {
        if (lobiEkrani) lobiEkrani.style.display = 'none';
        if (yarismaEkrani) yarismaEkrani.style.display = 'none';
        if (reklamEkrani) reklamEkrani.style.display = 'none';
        if (anaSayfaIcerigi) anaSayfaIcerigi.style.display = 'none';
        if (yukleniyor) {
            lobiEkrani.style.display = 'flex';
            lobiEkrani.innerHTML = `<div class="lobby-container"><h1>Sınav Yükleniyor...</h1></div>`;
        } else if (gosterilecekEkran) {
            gosterilecekEkran.style.display = 'flex';
            if (gosterilecekEkran === lobiEkrani) {
                if (anaSayfaIcerigi) anaSayfaIcerigi.style.display = 'block';
            }
        }
    }

    function anaSayfayaDon(event) {
        if(event) event.preventDefault();
        if(window.location.pathname !== "/") {
            history.pushState(null, 'Ana Sayfa', '/');
        }
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
        sinavListesiKonteyneri = document.getElementById('quiz-list-container');
        aramaGirdisi = document.getElementById('quiz-search-input');
        if (aramaGirdisi) aramaGirdisi.addEventListener('keyup', sinavlariFiltrele);
        ekranGoster(lobiEkrani);
        sinavListesiniOlustur(tumSinavlar);
        populerSinavlariGoster();
    }

    function yoluIsle() {
        const path = window.location.pathname;
        if (path.length > 1) { 
            if (tumSinavlar.length === 0) { return; }
            const slug = path.substring(1); 
            const bulunanSinav = tumSinavlar.find(s => slugify(s.title) === slug);
            if (bulunanSinav) {
                sinaviBaslat(bulunanSinav.id);
            } else {
                console.warn('Bu URL ile eşleşen sınav bulunamadı:', slug);
                anaSayfayaDon();
            }
        } else {
            anaSayfayaDon();
        }
    }

    if (aramaGirdisi) aramaGirdisi.addEventListener('keyup', sinavlariFiltrele);
    if (sonrakiSoruButonu) sonrakiSoruButonu.addEventListener('click', sonrakiSoruyaGec);
    
    window.addEventListener('popstate', yoluIsle);

    if (hamburgerButonu && mobilNavPanel) {
        hamburgerButonu.addEventListener('click', () => {
            hamburgerButonu.classList.toggle('active');
            mobilNavPanel.classList.toggle('open');
        });
        mobilNavPanel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburgerButonu.classList.remove('active');
                mobilNavPanel.classList.remove('open');
            });
        });
    }

    document.querySelector('.desktop-menu a[href*="sinav.lolonolo.com"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        anaSayfayaDon(e);
    });

    if (sinavaDevamButonu) {
        sinavaDevamButonu.addEventListener('click', () => {
            ekranGoster(yarismaEkrani);
            soruYukle(mevcutSoruIndexi + 1);
            const quizPanel = document.querySelector('.competition-container');
            if (quizPanel) {
                quizPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    sinavlariGetirVeGoster();
});
