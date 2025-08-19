const sinavVerisi = {
    sinavAdi: "Karar Teorisi ve Analizi 2024-2025 Bütünleme Soruları",
    sorular: [
        {
            soruMetni: "Yukarıda verilen oyunun Nash dengesi aşağıdakilerden hangisidir?",
            secenekler: ["A) 6,6", "B) 7,2", "C) 5,3", "D) Nash dengesi yoktur", "E) 6,7"],
            dogruCevapIndex: 4, // E şıkkı
            aciklama: "Cevap : E) 6,7<br>Açıklama : "
        },
        {
            soruMetni: "Yukarıdaki oyun tablosunda Ayşe ve Ali için sırasıyla güçlü baskın stratejiler hangileridir?",
            secenekler: ["A) B,B", "B) A,B", "C) C,A", "D) A,C", "E) C,B"],
            dogruCevapIndex: 2, // C şıkkı
            aciklama: "Cevap : C) C,A<br>Açıklama : Ayşe için C stratejisi, Ali'nin tüm stratejilerine (A,B,C) karşı en iyi getiriyi sağlar (6>5, 4>3, 4>2). Bu nedenle Ayşe için güçlü baskın strateji C'dir. Ali için ise A stratejisi, Ayşe'nin tüm stratejilerine (A,B,C) karşı en iyi getiriyi sağlar (2>1>0, 5>2>3, 4>1>3). Bu nedenle Ali için güçlü baskın strateji A'dır. Doğru cevap sırasıyla C, A'dır."
        },
        {
            soruMetni: "\"Oyun teorisi analizinde, ........ ortamda oyuncuların kararlarının birbirlerini etkileme durumu vardır.\"<br>Yukarıdaki ifadede boş bırakılan yere aşağıdakilerden hangisi gelmelidir?",
            secenekler: ["A) riskli", "B) dinamik", "C) belirsiz", "D) alternatif", "E) interaktif"],
            dogruCevapIndex: 4, // E şıkkı
            aciklama: "Cevap : E) interaktif<br>Açıklama : Oyun teorisinin temelini oluşturan, oyuncuların kararlarının birbirlerini etkileme durumu \"interaktif\" bir ortamda gerçekleşir. Oyuncular, rakiplerinin olası hamlelerini göz önünde bulundurarak kendi stratejilerini belirlerler."
        },
        {
            soruMetni: "A ve B olaylarının birbirinden bağımsız olması durumunda, aşağıdaki olasılık formüllerinden hangisi doğru ifade edilmiştir?",
            secenekler: ["A) P(A/B)= P(A)+P(B)", "B) P(A ve B)= P(A)+P(B)", "C) P(A ve B)= P(A)-P(B)", "D) P(A ve B)= P(A)×P(B)", "E) P(A ve B)= P(A)/P(B)"],
            dogruCevapIndex: 3,
            aciklama: "Cevap : D) P(A ve B)= P(A)×P(B)<br>Açıklama : İki olayın (A ve B) birbirinden bağımsız olması durumunda, her iki olayın da gerçekleşme olasılığı, bu olayların tekil olasılıklarının çarpımıdır: P(A ve B) = P(A) × P(B)."
        }
    ]
};