# Orkestratör kararları — Faz 2R (proje sahibi geri bildirimi, 2026-10-07)

Bu dosya Faz 2R (dikey dilimin yeniden tasarımı) için bağlayıcıdır; tur bitince içeriği `docs/DECISIONS.md`'ye taşınır.

## Proje sahibinin geri bildirimi (aynen)

> oyunun konseptini beğendim sadece productçı şu işi yapması lazım 6x8lik ilk oyun bloğunu puzzle mantığında ayarlaması
> lazım ordaki oyun alanında mesela ihtiyacımız olan blok direkt en üstte olmamalı diğer blokları kaydırmalıyız vs. ki onu
> bulalım 2x8lik kısımda bu puzzlea uygun olmalı ve bu 2 değişken olabilir ve oyun planında sürekli bu 2x8deki alan
> doldurulmalı ve bölüm sonuna tüm bloklar kullanılmış olmalı bir de oyunun görsel dili hiç yok ana sayfa yapısı yok
> oyundaki görseller çok basic bunların gerçek görseller olmasını isterim bunun için sana mcp de bağlayabilirim ama
> generative ai kullanarak üret görseller daha iyi olsun productçı hamle sayısı bölümün puzzle yapısını fln düşünsün ve
> şu öğretici ekranı tüm oyun kaplıyor bunun daha geçici işlemesi lazım oyunun genel görsel dilinin ama block ve royal
> match seviyesine çıkması lazım
>
> (ek) gemini de iyi bu konuda · en ucuz olabiliyorsa ücretsiz şekilde hallet bu işi

Konsept onaylandı. Değişen: bulmaca yapısı, alan boyutları, kazanma koşulu, görsel dil, ana sayfa, öğretici.

## Kararlar

| # | Konu | Karar | Uygulayan |
|---|---|---|---|
| R2-01 | **Tam kullanım (tam örtü)** | Her bölümde bütün partilerdeki blokların hücre toplamı = bütün dilimlerin plan hücre toplamı. Şaşırtma (decoy) blok yok. Bölüm ancak bütün dilimler tamamlanınca **ve** sahada, kuyrukta ya da elde hiç blok kalmayınca kazanılır. Plan şantiye alanını **tamamen** kaplar (`.` hücresi MVP'de yok; product-lead gerekirse ÖNERİ olarak proje sahibine sunar). Moloz (S4) gibi "hiçbir yere doğru olmayan" bloklar bu kurala aykırıysa product-lead yeniden tanımlar ya da MVP'den çıkarır. | product-lead (GDD/OBSTACLES/LEVELS), code-lead |
| R2-02 | **Değişken boyutlar** | Saha (`yard.cols × yard.rows`) ve şantiye (`site.cols × site.rows`) bölüm verisinde parametredir; 6×8 ve 2×8 yalnızca varsayılandır. Sınırlar (code-lead yerleşim kısıtı): `yard.cols + site.cols ≤ 8` (hücre 120 px korunur), satırlar 4–8, `site.cols` 1–4. Product-lead kendi aralıklarını bu sınırın içinde seçer ve bölüm bölüm gerekçelendirir. Duvar, geçit, Vinç Alanı, yerçekimi ve bütün koordinat kuralları genel (W, H) cinsinden yeniden yazılır. | product-lead, code-lead, design-lead (yerleşim) |
| R2-03 | **Bulmaca yapısı: kazı ve kaydırma** | Öğretici bölümlerden sonra (product-lead belirler, en geç Bölüm 3) ilk gereken blok bölüm başında **tutulamaz** olmalı (K-09); en az bir çözüm sahada yeniden konumlandırma (K-10, "kaydırma") hamlesi içermeli. Şantiye planının renk sırası (alttan üste, K-34) sahadaki istifle **birlikte** tasarlanır: alttaki satırların blokları sahada derinde durur. Ölçütler (solver hesaplar): en kısa çözüm hamlesi, en kısa çözümdeki kaydırma sayısı, ilk gereken bloğun derinliği, ilk 3 hamlede seçenek sayısı, çıkmaz durum oranı. Hedef aralıklar bölüm başına LEVELS.md'de. | product-lead; solver code-lead |
| R2-04 | **Hamle bütçesi** | Hamle = solver en kısa çözüm + zorluk tamponu (product-lead tablo verir). Brif tahmini değil solver sonucu esastır. | product-lead |
| R2-05 | **Tam örtüyle çelişen sistemler** | Blok yok eden (Çekiç), blok ekleyen (Kamyon Yardımı B1, Altın Mala hücre doldurma) ya da bloğu kullanılamaz bırakan her kural, güçlendirici ve engel yeniden tanımlanır ya da MVP'den çıkarılır. Para kazandıran güçlendiricilerde entrepreneur ile birlikte karar; tek değer GDD/META ve BUSINESS'a yazılır. | product-lead + entrepreneur |
| R2-06 | **Dikey dilim kapsamı** | Faz 2R dikey dilimi **Bölüm 1–10**'dur (önceki 1–5), hepsi yeni kurallarla ve solver doğrulamasıyla. 11–50 Faz 3'te. | product-lead, code-lead |
| R2-07 | **Görsel çıta** | Hedef: Royal Match ve Block Blast düzeyinde görsel dil (parlak, hacimli, "şeker" bloklar; kalın konturlu hacimli düğmeler; zengin çizilmiş arka planlar; karakter illüstrasyonları; ödül/parlama efektleri). Çocuksu değil, her yaşa hitap eden "premium casual". Rakip ekranlarından birebir kopya yok; yalnız düzey ve ilke. | design-lead |
| R2-08 | **Görsel üretim yolu (ücretsiz)** | Yapay zekâ görselleri, oturuma zaten bağlı **Canva** aracıyla (`generate-image`, `remove-background`) üretilir; ek ücret yok. Gemini görsel API'si güvenilir kaynaklara göre faturalandırma istiyor, kullanılmaz. Konteyner ağı Canva indirme alanlarını engelliyorsa proje sahibi izin verene kadar: bloklar ve arayüz yüksek kaliteli prosedürel çizimle (gradyan, parlama, iç gölge, kontur) yapılır; yapay zekâ görselleri asset listesinde istemleriyle hazır bekler. Her üretilen görsel `docs/ASSET_LIST.md`'de istemi, aracı ve lisans notuyla kayıtlıdır. | design-lead (istem, seçim), code-lead (boru hattı, atlas) |
| R2-09 | **Ana sayfa** | Royal Match örüntüsünde bir ana sayfa: üst çubuk (can, altın, yıldız), ortada büyük "Bölüm N" oyna düğmesi, arkada Renkli Tepe kasabası ve inşa ilerlemesi, alt gezinme (MVP'de kilitli sekmeler "yakında"). İçerik META'ya uyar, sunum design-lead'indir. | design-lead (UX), product-lead (META içerik), code-lead |
| R2-10 | **Öğretici: hafif ve geçici** | Tam ekran karartma ve oyunu kilitleyen adım yok. Öğretici = küçük el/eldiven animasyonu + kenarda kısa konuşma balonu; oyuncu her şeye dokunabilir; doğru eylemden sonra ya da 4 sn hareketsizlikten sonra kendiliğinden kaybolur, tekrar hareketsizlikte yeniden belirir. En fazla bölüm başına 1–2 adım. Sunum design-lead'in, adım verisi (bölüm JSON `tutorial`) product-lead'in. | design-lead, product-lead, code-lead |
| R2-11 | **Kısıtlar** | Sahiplik matrisi aynen geçerlidir. Belgeler Türkçe; kod İngilizce. Var olan K-xx kimlikleri yeniden kullanılmaz: değişen kural kendi kimliğinde güncellenir, yeni kurallar **K-47**'den, kararlar **D-073**'ten başlar. Konseptin kendisi (soldan sağa duvar üstünden taşıma, YAO ≥ %60, Alttan Üste) korunur. | herkes |

## Çalışma sırası

1. **Tasarım (bu tur):** product-lead kurallar + bulmaca yöntemi + Bölüm 1–10 taslağı; design-lead görsel dil v2 + ana sayfa +
   hafif öğretici + asset listesi (istemli). Sonra çapraz inceleme (code-lead uygulanabilirlik + TECH deltası,
   entrepreneur kapsam/monetizasyon, design ↔ product karşılıklı), sahipler kapatır.
2. **Motor + solver:** code-lead değişken boyutlar, tam örtü kazanması, solver (Faz 3'ten öne alındı), doğrulayıcı.
3. **Bölümler:** product-lead solver ile Bölüm 1–10 JSON; ölçütler hedef aralıkta olana kadar yineleme.
4. **Görsel + ana sayfa + öğretici uygulaması**, ekran görüntüsü incelemesi, düzeltme turları (en fazla 3).
5. Yayın (GitHub Pages) ve proje sahibine sunum.
