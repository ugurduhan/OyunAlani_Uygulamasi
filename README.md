# OyunAlani_Uygulamasi
Başta Annem Olmak Üzere Çocuk Oyun Alanları İçin Tasarlanmış, Müşteri Takip Sistemi.
# Neşeli Oyun Evi - Müşteri Takip Sistemi

Oyun evleri, kreşler ve çocuk oyun alanları gibi işletmeler için geliştirilmiş, çocukların içeride kaldığı süreyi takip eden ve ücret hesaplamasını otomatikleştiren profesyonel bir yönetim panelidir.

## Proje Hakkında
Bu çalışma, bir işletmenin günlük operasyonel sürecini dijitalleştirmek amacıyla geliştirilmiştir. Manuel takibi ortadan kaldırarak hata payını minimize eder ve kullanıcıya anlık bildirimler sunar.

## Temel Özellikler
* **Anlık Süre Takibi:** Dinamik bir geri sayım sayacı sayesinde her çocuğun kalan süresini saniye saniye izleme.
* **Akıllı Ücret Hesaplama:** Belirlenen saatlik ücret üzerinden, kalınan süreye göre otomatik faturalandırma.
* **Görsel ve Sesli Uyarı Sistemi:** Süre dolduğunda kartın renginin değişmesi (pulsing animation) ve tarayıcı tabanlı sesli bildirim (Web Audio API).
* **Veri Güvenliği (LocalStorage):** Sayfa yenilense veya tarayıcı kapansa bile mevcut verilerin ve sayaçların kaldığı yerden devam etmesi.
* **Modern ve Responsive Tasarım:** CSS Grid ve Flexbox kullanılarak hazırlanan, hem tablet hem masaüstü uyumlu arayüz.

## Teknik Altyapı
* **Frontend:** HTML5, CSS3 (Custom Animations & Responsive Design)
* **Scripting:** JavaScript (ES6+), DOM Manipülasyonu
* **Storage:** LocalStorage API
* **Audio:** Web Audio API (Sentezlenmiş uyarı sesleri)

##  Dosya Yapısı
* `index.html`: Uygulamanın iskeleti ve modal yapıları.
* `style.css`: İşletmeye uygun canlı ve profesyonel tasarım öğeleri.
* `app.js`: Tüm zamanlayıcı mantığı, hesaplama formülleri ve veri yönetimi.

##  Geliştirici
**Uğur** *Yalova Üniversitesi - Bilgisayar Programcılığı 1. Sınıf Öğrencisi* 

---
*Bu proje, gerçek dünya problemlerine yazılımsal çözümler üretme yetkinliğini göstermek amacıyla geliştirilmiştir.*
