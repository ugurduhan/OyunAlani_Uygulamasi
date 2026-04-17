document.addEventListener('DOMContentLoaded', () => {
    
    // Tarayıcıdan ses çalmak için
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const form = document.getElementById('add-child-form');
    const childNameInput = document.getElementById('child-name');
    const durationInput = document.getElementById('duration');
    const hourlyRateInput = document.getElementById('hourly-rate');
    const childrenListDiv = document.getElementById('children-list');
    
    const modal = document.getElementById('bill-modal');
    const billDetailsDiv = document.getElementById('bill-details');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const closeModalIcon = document.querySelector('.close-modal');

    // Sayfa yenilenince verilerin devamı
    let activeChildren = JSON.parse(localStorage.getItem('activeChildren')) || [];

    // Yeni çocuk 
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 

        const name = childNameInput.value;
        const durationHours = parseFloat(durationInput.value);
        const hourlyRate = parseFloat(hourlyRateInput.value);
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

        const child = {
            id: Date.now(), 
            name: name,
            startTime: startTime.toISOString(), 
            endTime: endTime.toISOString(),    
            hourlyRate: hourlyRate,
            extras: [], 
            alerted: false 
        };

        activeChildren.push(child);
        form.reset();
        
        renderChildrenList();
        saveToLocalStorage();
    });

    // Çocukları ekrana yazdır
    function renderChildrenList() {
        childrenListDiv.innerHTML = '';

        if (activeChildren.length === 0) {
            childrenListDiv.innerHTML = '<p>Şu anda aktif çocuk bulunmuyor.</p>';
            return;
        }

        activeChildren.forEach(child => {
            const card = document.createElement('div');
            card.className = 'child-card';
            card.dataset.id = child.id; 

            const now = new Date();
            const endTime = new Date(child.endTime);
            const remainingMs = endTime - now;
            
            const { isTimeUp, remainingString } = formatRemainingTime(remainingMs);

            // Süre dolduysa ses çal
            if (isTimeUp) {
                card.classList.add('time-up');
                if (!child.alerted) {
                    playAlertSound();
                    child.alerted = true; 
                    saveToLocalStorage(); 
                }
            }
            
            const extrasTotal = child.extras.reduce((sum, item) => sum + item.price, 0);

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

        addCardButtonListeners();
    }

    // Sonradan eklenen butonlar
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

    function addExtra(id) {
        const itemName = prompt("Ekstra ürünün adını girin (Örn: Meyve Suyu):");
        if (!itemName) return; 

        const itemPrice = parseFloat(prompt("Ürünün fiyatını girin (Örn: 15):"));
        if (isNaN(itemPrice) || itemPrice <= 0) {
            alert("Geçersiz fiyat!");
            return;
        }

        const child = activeChildren.find(c => c.id === id);
        if (child) {
            child.extras.push({ name: itemName, price: itemPrice });
            saveToLocalStorage();
            renderChildrenList(); 
        }
    }

    /
    function finishSession(id) {
        const child = activeChildren.find(c => c.id === id);
        if (!child) return;

        const now = new Date();
        const startTime = new Date(child.startTime);
        
        const durationMs = now - startTime;
        const durationHours = durationMs / (1000 * 60 * 60);

        const timeCost = durationHours * child.hourlyRate;
        const extrasCost = child.extras.reduce((sum, item) => sum + item.price, 0);
        const totalBill = timeCost + extrasCost;

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

        modal.style.display = 'flex';

        // Hesabı kesilen çocuğu listeden sil
        activeChildren = activeChildren.filter(c => c.id !== id);
        saveToLocalStorage();
        renderChildrenList(); 
    }

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

    // Süre bitince çıkacak uyarı sesi
    function playAlertSound() {
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.type = 'triangle'; 
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); 
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); 
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2); 

            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            oscillator2.type = 'triangle';
            oscillator2.frequency.setValueAtTime(880, audioContext.currentTime + 0.3); 
            gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.3);
            oscillator2.start(audioContext.currentTime + 0.3);
            oscillator2.stop(audioContext.currentTime + 0.5); 
        } catch (e) {
            console.error("Audio Context Error:", e);
        }
    }

    function saveToLocalStorage() {
        localStorage.setItem('activeChildren', JSON.stringify(activeChildren));
    }
    
    // Ekranı kapatma butonları
    closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    closeModalIcon.addEventListener('click', () => modal.style.display = 'none'); 
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Her saniye süreleri güncelle
    setInterval(() => {
        if(activeChildren.length > 0) renderChildrenList();
    }, 1000);

    renderChildrenList();
});
