// Sayfa yüklendiğinde olayları ve verileri yükle
document.addEventListener('DOMContentLoaded', () => {
    
    // Tarayıcının ses üretme motorunu (Web Audio API) hazırla
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Gerekli DOM elemanlarını seçme
    const form = document.getElementById('add-child-form');
    const childNameInput = document.getElementById('child-name');
    const durationInput = document.getElementById('duration');
    const hourlyRateInput = document.getElementById('hourly-rate');
    const childrenListDiv = document.getElementById('children-list');
    
    // Modal Elemanları
    const modal = document.getElementById('bill-modal');
    const billDetailsDiv = document.getElementById('bill-details');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const closeModalIcon = document.querySelector('.close-modal'); // Hata 1'in HTML'ini düzelttiğinizde bu satır çalışacak

    // Aktif çocukların listesini tutan dizi (Lokal hafızadan yüklenir)
    let activeChildren = JSON.parse(localStorage.getItem('activeChildren')) || [];

    // Form gönderildiğinde (Girişi Başlat)
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Sayfanın yenilenmesini engelle

        const name = childNameInput.value;
        const durationHours = parseFloat(durationInput.value);
        const hourlyRate = parseFloat(hourlyRateInput.value);
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

        // Yeni çocuk objesi oluştur
        const child = {
            id: Date.now(), // Benzersiz ID
            name: name,
            startTime: startTime.toISOString(), // String olarak sakla
            endTime: endTime.toISOString(),     // String olarak sakla
            hourlyRate: hourlyRate,
            extras: [], // Yiyecek/içecekler için boş dizi
            alerted: false // Uyarı durumu
        };

        // Listeye ekle
        activeChildren.push(child);
        
        // Formu temizle
        form.reset();
        
        // Listeyi güncelle ve veriyi kaydet
        renderChildrenList();
        saveToLocalStorage();
    });

    // Çocuk listesini ekrana çizen fonksiyon
    function renderChildrenList() {
        // Listeyi temizle
        childrenListDiv.innerHTML = '';

        if (activeChildren.length === 0) {
            childrenListDiv.innerHTML = '<p>Şu anda aktif çocuk bulunmuyor.</p>';
            return;
        }

        // Her çocuk için bir kart oluştur
        activeChildren.forEach(child => {
            const card = document.createElement('div');
            card.className = 'child-card';
            card.dataset.id = child.id; // ID'yi karta işle

            const now = new Date();
            const endTime = new Date(child.endTime);
            const remainingMs = endTime - now;
            
            // Kalan süreyi hesapla
            const { isTimeUp, remainingString } = formatRemainingTime(remainingMs);

            // Süre dolduysa kartı kırmızı yap
            if (isTimeUp) {
                card.classList.add('time-up');
                // Süresi dolan ve henüz uyarılmamışsa uyar
                if (!child.alerted) {
                    playAlertSound();
                    child.alerted = true; // Sadece bir kez uyar
                    saveToLocalStorage(); // Uyarı durumunu kaydet
                }
            }
            
            // Ekstraların toplam tutarını hesapla
            const extrasTotal = child.extras.reduce((sum, item) => sum + item.price, 0);

            // Kartın HTML içeriği
            card.innerHTML = `
                <h3>${child.name}</h3>
                <p><strong>Bitiş Saati:</strong> ${endTime.toLocaleTimeString('tr-TR')}</p>
                <span class="timer">${remainingString}</span>
                
                <div class="extras-list">
                    <strong>Ekstralar (Toplam: ${extrasTotal.toFixed(2)} TL):</strong>
                    <ul>
                        ${child.extras.length === 0 ? '<li>Ekstra alınmadı</li>' : 
                            child.extras.map(item => `<li>${item.name} - ${item.price.toFixed(2)} TL</li>`).join('')
                        }
                    </ul>
                </div>
                
                <div class="card-buttons">
                    <button class="btn btn-extra" data-id="${child.id}">Ekstra Ekle</button>
                    <button class="btn btn-finish" data-id="${child.id}">Süreyi Bitir & Hesapla</button>
                </div>
            `;
            
            childrenListDiv.appendChild(card);
        });

        // Butonlara event listener ekle
        addCardButtonListeners();
    }

    // Kartlardaki butonlara (Ekstra Ekle, Bitir) tıklama olaylarını ekle
    function addCardButtonListeners() {
        childrenListDiv.querySelectorAll('.btn-extra').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = Number(e.target.dataset.id);
                addExtra(id);
            });
        });

        childrenListDiv.querySelectorAll('.btn-finish').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = Number(e.target.dataset.id);
                finishSession(id);
            });
        });
    }

    // Ekstra Ekle fonksiyonu
    function addExtra(id) {
        const itemName = prompt("Ekstra ürünün adını girin (Örn: Meyve Suyu):");
        if (!itemName) return; // İptale basarsa

        const itemPrice = parseFloat(prompt("Ürünün fiyatını girin (Örn: 15):"));
        if (isNaN(itemPrice) || itemPrice <= 0) {
            alert("Geçersiz fiyat!");
            return;
        }

        // İlgili çocuğu bul ve ekstrayı ekle
        const child = activeChildren.find(c => c.id === id);
        if (child) {
            child.extras.push({ name: itemName, price: itemPrice });
            saveToLocalStorage();
            renderChildrenList(); // Listeyi güncelle
        }
    }

    // Süreyi Bitir ve Hesapla fonksiyonu
    function finishSession(id) {
        const child = activeChildren.find(c => c.id === id);
        if (!child) return;

        const now = new Date();
        const startTime = new Date(child.startTime);
        
        // Gerçekte ne kadar kaldığını hesapla
        const durationMs = now - startTime;
        const durationHours = durationMs / (1000 * 60 * 60);

        // Ücretleri hesapla
        const timeCost = durationHours * child.hourlyRate;
        const extrasCost = child.extras.reduce((sum, item) => sum + item.price, 0);
        const totalBill = timeCost + extrasCost;

        // Hesap özetini modal'a yaz
        billDetailsDiv.innerHTML = `
            <p><strong>Müşteri:</strong> ${child.name}</p>
            <p><strong>Giriş Saati:</strong> ${startTime.toLocaleTimeString('tr-TR')}</p>
            <p><strong>Çıkış Saati:</strong> ${now.toLocaleTimeString('tr-TR')}</p>
            <p><strong>Toplam Süre:</strong> ${durationHours.toFixed(2)} saat</p>
            <hr>
            <p><strong>Süre Ücreti:</strong> ${timeCost.toFixed(2)} TL</p>
            <p><strong>Ekstralar Toplamı:</strong> ${extrasCost.toFixed(2)} TL</p>
            <p id="bill-total">GENEL TOPLAM: ${totalBill.toFixed(2)} TL</p>
        `;

        // Modalı göster
        modal.style.display = 'flex';

        // Müşteriyi aktif listeden çıkar
        activeChildren = activeChildren.filter(c => c.id !== id);
        saveToLocalStorage();
        renderChildrenList(); // Liste güncellenir
    }

    // Kalan süreyi formatlayan fonksiyon
    function formatRemainingTime(ms) {
        if (ms <= 0) {
            return { isTimeUp: true, remainingString: "SÜRE DOLDU!" };
        }

        let seconds = Math.floor(ms / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);

        seconds = seconds % 60;
        minutes = minutes % 60;

        return {
            isTimeUp: false,
            remainingString: `Kalan Süre: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        };
    }

    // Uyarı sesi çal (Web Audio API kullanarak)
    function playAlertSound() {
        try {
            // Birinci bip sesi
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.type = 'triangle'; // 'bip' sesi için iyi bir tip
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // Sesin inceliği (Hz)
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Ses seviyesi (düşük tuttuk)
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2); // Sesi 0.2 saniye sonra durdur

            // İkinci bip sesi (daha dikkat çekici olması için)
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            oscillator2.type = 'triangle';
            oscillator2.frequency.setValueAtTime(880, audioContext.currentTime + 0.3); // 0.3 saniye sonra başla
            gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.3);
            oscillator2.start(audioContext.currentTime + 0.3);
            oscillator2.stop(audioContext.currentTime + 0.5); // Sesi durdur
        } catch (e) {
            console.error("Uyarı sesi çalınamadı:", e);
        }
    }

    // Veriyi lokal hafızaya kaydet
    function saveToLocalStorage() {
        localStorage.setItem('activeChildren', JSON.stringify(activeChildren));
    }
    
    // Modal kapatma butonları
    closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    closeModalIcon.addEventListener('click', () => modal.style.display = 'none'); // Bu satır artık çalışmalı
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Zamanlayıcıyı her saniye çalıştır
    setInterval(() => {
        // Sadece ekranda aktif çocuk varsa listeyi güncelle
        if(activeChildren.length > 0) {
            renderChildrenList();
        }
    }, 1000);

    // Sayfa ilk yüklendiğinde listeyi çiz
    renderChildrenList();
});