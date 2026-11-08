# Bölümler v3 — design-lead bağımsız incelemesi (G1 paketi, 015d715)

Sahip: design-lead · 2026-11-08 · İncelenen: LEVELS §8 (v3), GDD §16 (ÖNERİ K-56…K-63), OBSTACLES "Bölümler v3 blok
özellikleri" (Y9–Y13), `docs/review_inbox/levels-v3-playtest.md`. Kod ve bölüm verisi değiştirilmedi.

**Yöntem (stüdyo şablonu, orkestrasyonlu koşu istisnası):** `design-review` lean (bütünlük, iç tutarlılık,
uygulanabilirlik), `balance-check` (aykırı değer, bozuk ilerleme, bozuk strateji; verisi olmayan bölüm "NOT ASSESSED"),
creative-director (oyunun sütunlarına uyum: imza hareket "yukarı–aşağı", okunurluk, abartısız zorluk, özgünlük),
qa-lead (önem derecesi, test edilebilirlik, kapı). Önem: **Engel** (iş geri döner) / **Önemli** (aynı turda kapanır) /
**Öneri** (birikim).

**Karar: DEĞİŞİKLİK GEREKLİ (NEEDS REVISION).** 1 Engel, 14 Önemli, 7 Öneri. Yönü doğru buluyorum: kütle + şekil + oyuncak
ekseni, 5 özellikten 3'ü (Y9, Y10, Y11) gerçekten yeni karar yaratıyor ve geometri K-49'a sığıyor. Ama bir özellik
(Palet) bugünkü tarifle 360 px telefonda bilgi gizliyor, bir özellik (Bonus) karar yaratmıyor, Bölüm 10 eşiği aşıyor.

## Ölçüm notları (bu incelemede yapıldı)

- **Geometri (K-49, K-05, K-02):** §8.4'teki 10 satırın hepsinde Wy + Ws = 8 (L1: 7), H ≤ 8, Hy 4–6; boyu 3 olan
  şekiller duvar ≤ H − 1 ile `(H + 2) − height = 3`'ü sağlıyor; E bantları doğru. L10 renk arz/talebi elle sayıldı:
  R 14 / G 10 / W 12, plan ile birebir. **GEÇTİ.**
- **Hücre boyu:** `tokens.json` `layout.adaptive` formülüyle 8 sütunlu tahtada c = 120 design px = **40 CSS px**
  (360 px genişlikte); L1 (7 sütun) c = 132 = 44 CSS px. Aşağıdaki okunurluk bulguları bu boyuta göredir.
- **Renk körlüğü (Machado 2009 matrisi, CIELAB ΔE76; `tokens.json` hex):**

| Çift | Normal | Protan | Deutan | Tritan | Kullanım |
|---|---|---|---|---|---|
| W–Y | 75 | 77 | 68 | 58 | L1–L5 iki renkli tanıtım: çok iyi |
| R–Y | 92 | 87 | 59 | 72 | iyi |
| W–G | 85 | 48 | 41 | 92 | iyi |
| G–Y | 73 | 53 | 57 | 64 | iyi (L8 "GY"/"YG") |
| R–G | 114 | 42 | **22** | 126 | L10 "GR"/"RG" ikizleri: zayıf |
| W–R | 42 | 25 | **19** | 44 | L10 "WR"/"RW", palet "WR": en zayıf |
| altın `ui.gold`–Y | 18 | 11 | **8** | 17 | Y12 "+2" madalyonu Y blokta: kaybolur |

- **Çalışma zamanı D3a:** `src/core/deadlock.ts` satır 21–25, `tileRemaining` "en alçak sütun" değil **her** sütun
  yüksekliğine oturan blokla dallanıyor (tam arama). H1 yalnız doğrulayıcıdaki `tileLevel`'de (logic.ts 806–818); oyunda
  yanlış Söküm beklenmez.
- **NOT ASSESSED — VERİ YOK:** v3 bölüm 3–10'un solver ölçütleri, bot kazanma oranları ve insan oyun testi (yalnız L1–L2
  taslak ölçümü var). Eğlence puanları tahmindir; aşağıdaki bulgular kurala, geometriye ve görsel ölçüye dayanır.

## Özellik başına karar testi (1. soru: karar mı, süs mü?)

| Özellik | Yarattığı karar | Karşı-olgusal (özellik yok sayılırsa ne değişir) | Hüküm |
|---|---|---|---|
| Y9 İki Renkli | hangi ikiz nereye; tek renkli satırın "her domino uyar" özelliğini kırar | yön/ikiz seçimi yanlışsa geri sekme; tile ailesi daralır | **Karar** (eşleştirme ağırlıklı; `shapeDecisions` ile ölçülmeli) |
| Y10 Palet | z sırası: üstü şimdi kullan / park et | Kolay'da sıra = kat sırası → karar yok, yalnız kütle | **Kütle + Normal'de karar** |
| Y11 Sargı + Makas | uzaktan sıra bağımlılığı (anahtarı önce kaz) | makas gömülü değilse karar yok | **Karar** (makas ≥ 1 kazı altında olmalı) |
| Y12 Bonus | k = 0'da sıra fark etmez; k = 1'de L10 son tarihi 17, kanonik 7 → bağlayıcı değil | hiçbir çözüm değişmez | **Süs / ödül anı** (DL-V3-07) |
| Y13 Kaygan | park yüksekliği | yükseğe park yasaklanır | Karar (Hikaye 2; bu turda puanlanmadı) |

## Bulgular

### DL-V3-01 · Engel · OBSTACLES Y10 "Okunurluk", LEVELS §8.7 L3/L4/L8/L10 · Palet katman sırası telefonda okunmuyor
- **Sorun:** Tarif alt katmanları "sağ-alt kenarda 6 px'lik renkli şeritler" olarak gösteriyor ve "bütün sıra her an
  okunur" diyor. 6 design px = 360 px telefonda **2 CSS px**; şerit yalnız renk taşıyor (sembol yok). Bu ART §1 madde 5'i
  ("renk asla tek taşıyıcı değil") ve K-18'i ("bilgi gizlenmez") bozar; aynı paket "gizli renkli paket"i tam da bu
  gerekçeyle RET etti. L3'ün tanıtım paleti `[W, Y, W]` karışık: oyuncunun tanıtım bölümündeki aha'sı ("palet sırası kat
  sırasıdır") görünmeyen bilgiye dayanıyor.
- **Kanıt:** 120 design px hücre = 40 CSS px (tokens `layout.adaptive`, 8 sütun); 6 / 3 = 2 px; W–R deutan ΔE 19.
- **Seçenekler:** (A) Hikaye 1'de palet **tek renkli** (bütün katmanlar aynı renk): sıra bilgisi gereksiz, palet saf
  kütle; karışık palet Hikaye 2'de gözetleme ile. (B) Karışık palet kalır; **"sonraki katman" dili** (üst bloğun altından
  28 design px yükseklikte, sembollü bir kenar görünür) + **basılı tutunca gözetleme** (katmanlar vinç alanında yelpaze
  gibi açılır, 400 ms; hamle harcamaz). (C) Palet katmanlarının hepsi yan yana küçük önizleme şeridi (paletin üstünde): 8
  sütunlu tahtada yer yok, RET.
- **Seçimim ve düzeltme:** **A + B'nin gözetlemesi.** L3 paletleri tek renkli (`[W,W,W]`, `[G,G,G]`); L3 aha'sı
  "paletten hep üstteki" + "iki paletten hangisi bu kat" olur. Karışık palet en erken L6'da ve yalnız 2 katman + sonraki
  katman kenarı + gözetleme ile. ART_DIRECTION/JUICE tarifini ben yazarım (paket onaylanınca); product-lead L3/L4/L8/L10
  palet renklerini buna göre günceller. Kapı: gözetleme çizilmeden karışık palet bölümü yayımlanmaz.

### DL-V3-02 · Önemli · OBSTACLES Y10 / LEVELS §8.9 · "Tahta palet" W (Ahşap) bloğuyla karışır
- **Sorun:** W'nin adı Ahşap, sembolü ağaç damarı, tabanı kahverengi (#764012). Kahverengi damarlı palet tabanı W blok
  ya da W plan hücresi gibi okunur.
- **Düzeltme:** Palet tabanı ahşap rengi ve damarı taşımaz: açık gri-mavi metal kızak (C ailesinden değil, `ui` nötr
  tonu), 2 çıta, yalnız bloğun altında 16 design px dudak olarak görünür; hiçbir zaman hücrenin ortasını kaplamaz.

### DL-V3-03 · Önemli · OBSTACLES Y10/Y12, ART §3 `wet` · Sayı rozetleri birbirine karışır; altın madalyon Y'de kaybolur
- **Sorun:** Palet "×n", Bonus "+2", Islak Beton (Y4) sayacı aynı biçimde (blok köşesinde rakamlı rozet). Oyuncu "×3"ü
  ödül, "+2"yi katman sanabilir. `ui.gold` madalyon Y blok üstünde deutan ΔE 7,8.
- **Düzeltme:** (1) Palet sayısı rakamla değil **katman çentikleriyle** (dudakta 2–4 çentik). (2) Bonus rozeti hamle
  sayacının ikonunu taşır (HUD'daki hamle simgesi + "+2"), krem zemin, `ui.ink` 4 px kontur, Ø 56 design px, sağ üst
  köşe; altın dolgu yok. (3) Kural: blok üstünde aynı anda en çok bir rakamlı rozet.

### DL-V3-04 · Önemli · OBSTACLES Y11 "Okunurluk" · Sargı, Cam (S3) ve Zincir (Y3) ile karışır
- **Sorun:** "Şeffaf streç film" ışık yansıması Cam'ın çapraz beyaz çizgileriyle (ART §3 `glass`), "kurdele" çapraz
  bantla çizilirse Zincir'in çapraz zincir + kilidiyle aynı silüete düşer. Üçü de "dokununca olmaz/kırılır" anlamında.
- **Düzeltme:** Sargı = bloğun dış konturunu 4 design px dışarı taşan buruşuk film kenarı (yarı saydam beyaz, %35) +
  **tek yatay** kurdele bandı + üst ortada fiyonk (48 design px). Çapraz çizgi ve kilit kullanılmaz; sembol %100 görünür
  kalır. Makas rozeti sağ üst köşede 56 design px, krem zemin + koyu kontur; makaslı blok sargılı bloğa dokunulduğunda
  bir kez parlar (tarif zaten var, kalsın).

### DL-V3-05 · Önemli · LEVELS §8.5 L8/L10, OBSTACLES birleşim tablosu · Bir blokta kaplama yığılması
- **Sorun:** Birleşim tablosu iki renkli + sargılı + bonus + palet üstü aynı blokta izin veriyor. 40 CSS px hücrede iki
  sembol + film + fiyonk + rozet + palet kenarı okunmaz; L10 bütün özellikleri aynı tahtada topluyor.
- **Düzeltme:** Hikaye 1 kuralı (doğrulayıcı uyarısı `trait_overlay_many`): blok başına en çok **bir kaplama özelliği**
  (`wrapped` | `scissors` | `bonus` | palet üstü olmak); `colors` taban sayılır ve kaplamayla birleşebilir.

### DL-V3-06 · Önemli · LEVELS §8.7 L10 (ve L9 "RW"/"WR") · İki renkli ikizlerde zayıf renk körü çiftleri
- **Sorun:** Tanıtım (L5, W/Y) çok iyi; ama L10'da "GR"/"RG", "WR"/"RW", palet "WR" var: deutan ΔE 22 ve 19.
  Aynalı ikizi ayırmak 40 px hücrede yalnız sembole kalır, finalde baskı en yüksekken.
- **Düzeltme:** Hikaye 1'de iki renkli bloklar yalnız deutan/protan ΔE ≥ 30 çiftlerinden (W–Y, R–Y, W–G, G–Y). L10'daki
  R–G ve W–R ikizleri R–Y / W–G'ye çevrilsin ya da tek renkli dominoya dönsün (product-lead renk dengesini yeniden
  kurar). İki renkli blok tek dış konturla çizilir; iki rengin sınırı blok ayrımı gibi koyu oluk değil, perçinli dikiş
  olur (ART §3A dikişi `seamPx` 3'ten farklı: 2 perçin, Ø 14 design px).

### DL-V3-07 · Önemli · GDD ÖNERİ K-60/K-62, LEVELS §8.5 L9/L10 · Bonus karar yaratmıyor; L10 sayacı "imkânsız" görünüyor
- **Sorun:** k = 0'da (L9) bonus her çözümde alınır, sıra fark etmez → saf pay. k = 1'de (L10) son tarih 17. hamle,
  kanonik çözüm 7. hamlede alıyor → son tarih bağlayıcı değil; etkin bütçe 19 + 2 = 21 = min + P, yani k = 0 ile aynı
  oyun. Tek fark oyuncunun gördüğü "19 hamle" ile `min` 20: ilk bakışta adaletsiz görünür. Ayrıca K-52 doğrulayıcısı
  `moves ≥ min + P` diyor; K-62 bunu değiştirdiğini açıkça yazmıyor.
- **Seçenekler:** (A) Bonus'u Hikaye 1'de **ödül anı** olarak sınıflandır (karar sayımına girmez), k hep 0; L10'dan
  bonusu çıkar. (B) Son tarihi bağlayıcı yap: bonusu sona bırakan en kısa çözümün sayacı 0'a düşsün (bonus 2+ kazı
  altında) ve HUD sayacı "19 (+2)" göstersin. (C) Bonus'u tamamen ertele.
- **Seçimim:** **A** (Hikaye 1), B Hikaye 2'de denenebilir. Eğlence gerekçesi doğru (olumlu sürpriz, sayaca uçuş);
  ama "yeni karar" listesinde sayılmamalı. K-62 kabul edilirse `moves_budget` formülünün değiştiği GDD'ye yazılsın.

### DL-V3-08 · Önemli · LEVELS §8.6, §8.10 U-v3-3 · Eğlence tezi tam ölçülebilir değil
- **Sorun:** Hedef bantlar (`greedyWin`, `ahaMin`, `branch3`) iyi, ama "her yeni özellik karar yaratır" iddiasının
  ölçüsü yok; eğlence 1–5 puanları tahmin.
- **Düzeltme:** (1) Yeni ölçüt `traitDelta`: tanıtım bölümünde özelliği yok sayan bot (ör. paleti sırasız, makası
  önceliksiz, ikizi rastgele seçen) ile orta botun kazanma farkı; hedef ≥ 10 puan (Y12 hariç). (2) `shapeDecisions`
  (zaten önerilmiş) Normal'de ≥ 2 **kapı** olsun, izleme değil. (3) Gri kutu ilkesi (ART ilke 7): L3, L5, L7 gri kutu
  tahtasıyla 5 kişilik koridor testi; ölçü "ilk 60 sn'de özelliği doğru kullandı mı" + "bitince bir daha oynar mısın"
  (evet ≥ 4/5) — sanat bundan sonra.

### DL-V3-09 · Önemli · LEVELS §8.4 (L6, L8, L9, L10) · Saha üst satırı duvar tepesiyle aynı hizada: imza hareket seyrelir
- **Sorun:** 6×6 saha (Hy 6), H 6, duvar 5: y5 satırındaki blok **kaldırılmadan** sağa kayarak şantiyeye girer. Kurala
  göre YAO'ya "duvar üstü" sayılıyor, ama oyuncu yukarı–aşağı yapmıyor (brif imza hareket). 16 bloğun 4–6'sı o satırda
  olabilir.
- **Seçenekler:** (A) `Hy ≤ height` kuralı (saha üst satırı duvar tepesinin altında): 6×5 saha + Σ'yi palet ayak iziyle
  düşür (F ≤ 28). (B) Satır kalsın ama y5'e yalnız ilk hamlesi park olan blok/palet konulsun (üretici kısıtı). (C) YAO'nun
  yanında `liftRatio` (en az 1 satır yukarı kaldırma gerektiren yerleşim / bütün yerleşim) ölçülsün, ≥ 0,60.
- **Seçimim:** **C + B** (geometri bozulmaz, ölçülür); `liftRatio` < 0,60 olan bölümde A uygulanır.

### DL-V3-10 · Önemli · GDD ÖNERİ K-58, LEVELS §8.4 L3/L4/L8 · Palet saha kapasitesini geri dönüşsüz eritir (çıkmaz)
- **Sorun:** Kaldırılan katman palete dönemez, palet ayak izi son katmana kadar dolu kalır: her park E'yi 2 düşürür.
  E = 4 olan L4'te iki yanlış park sahayı doldurur. Bu durumda üst satır blokları vinç alanına kalkabildiği için **D1
  tetiklenmez**, D3a (döşeme) de tetiklenmez (döşeme hâlâ mümkün, erişim yok) → Söküm'süz çıkmaz. V3-10 "D3b/makro çizge
  yakalar" diyor ama D3b çalışma zamanında yok (Faz 3). D-090 bütün uzay kapısı bu bölümleri büyük olasılıkla reddeder.
- **Düzeltme:** (1) Doğrulayıcı `pallet_capacity`: Kolay'da error, Normal'de warn (solver kanıtı varsa susar):
  `E ≥ 2 + max_palet(hücre × (katman − 1))`; pratikte 3 katmanlı `D2` paletinde E ≥ 6, yoksa palet 2 katman. (2) D1'in
  tanımına "tutulabilir blok var ama iptal dışı hiçbir hedef yok" eklensin (code-lead; bütün özelliklerden bağımsız
  güvenlik ağı). (3) Solver kanıtı gelene kadar L4 E = 4 + iki 3 katmanlı palet planı askıda.

### DL-V3-11 · Önemli · GDD ÖNERİ K-59 · Makas–sargı statik çıkmazı için doğrulayıcı kodu yok
- **Sorun:** Makaslı bloğun şantiye desteği (K-34) ya da sahadaki erişimi sargılı bir bloğa bağlıysa bölüm başlangıçtan
  ölüdür ya da Çekiç (ücretli) zorunlu olur. `scissors_missing/many` bunu yakalamaz; solver yakalar ama üretici her adayı
  pahalı aramaya sokar.
- **Düzeltme:** `scissors_blocked` (error): makasın kanonik kat sırasındaki yerleşimi, sargılı bir bloğun yerleşimine ya
  da sahadan kalkmasına bağımlıysa. Ayrıca makas ≥ 1 kazı altında olmalı (`scissors_trivial`, warn; yoksa karar yok).

### DL-V3-12 · Önemli · GDD ÖNERİ K-58/K-59, K-36/K-37/K-38 · Güçlendirici × özellik etkileşimi eksik
- **Sorun:** Vinç palet **alt** katmanını seçebilir mi? Altın Mala (otomatik yerleşim) sargılı ya da alt katmanı
  hedefleyebilir mi? Fırça palet katmanını boyar mı? Tanımsız; UX'te seçilebilir öğe vurgusu buna göre çizilir.
- **Düzeltme:** Önerim: Vinç ve Altın Mala yalnız **tutulabilir** blokları hedefler (palette yalnız üst; sargılı hariç);
  Fırça palet üst katmanını boyar, alt katmanları boyamaz; Çekiç yalnız sargı (kenar durumu tablosuna V3-11…V3-13).

### DL-V3-13 · Önemli · LEVELS §8.7 L8 · Öğretici ile aha birbirine ters
- **Sorun:** L8 öğreticisi Çekiç'i sargıya kullanmayı öğretiyor (`boosterUsed`), aha ise "Çekiç'i harcamak yerine
  makası kaz". Oyuncuya aynı bölümde iki zıt mesaj; ayrıca Çekiç ücretli güç.
- **Düzeltme:** L8 öğreticisi bağlamsal olsun: oyuncu sargılı bloğa 2. kez dokununca Çekiç yuvası parlar + `tut.m.hammer`
  ("Çekiç sargıyı keser."); zorunlu adım değil. Aha anlatımı "makas her şeyi açar, Çekiç kestirme" olarak değişir.

### DL-V3-14 · Önemli · LEVELS §8.10 U-v3-2, D-090 · Çözücü ölçeği kanıt sınıfı
- **Sorun:** Ölçülen 767 033 durum / 30 sn (5×4, 8 blok). 6×6 + 16 blok + palet + sargı için ışın araması `trapCount`
  ve "bütün uzay ölü masa yok" (K-51 madde 2) **kanıtı** veremez; yalnız örnekler. Makro çizge palet yüzünden yeni
  boyut kazanıyor ve sağlamlığı kanıtlanmadı.
- **Seçenekler:** (A) L6–L10'u tam taramanın bittiği boyuta indir (6×5, N 12–14). (B) Makro çizgeyi sağlamlık testiyle
  (küçük bölümlerde tam tarama ile birebir karşılaştırma) kabul et. (C) Kapıyı istatistiğe çevir (sahibin "kurallar
  korunur" şartını bozar, RET).
- **Seçimim:** **B, başarısızsa A.** L6 taslağı ile bir ölçüm spike'ı yapılmadan L7–L10 JSON'u yazılmasın. Ayrıca
  `D3A_MAX_EXPANSIONS` 20 000 (deadlock.ts:67) 16 blokta "unknown" oranı ölçülsün (unknown hiç ölü sayılmaz → Söküm
  gecikir).

### DL-V3-15 · Önemli · LEVELS §8.5–§8.7 L10 · Final zorluğu sahibin "abartı olmayan" sınırını zorluyor
- **Sorun:** L10: 16 blok, 3 şekil türü, 4 kaplama özelliği (iki renk, palet, sargı+makas, bonus), 2 aha, P 1,
  `branch3` ≤ 0,20, orta bot %40–55. Bilişsel yük (aynı anda 4 kural) ve dar pay birlikte; finalde tek hata kaybettirir.
- **Düzeltme:** L10'da en çok 3 özellik: bonus çıkar (DL-V3-07 A); iki renkli ikizler DL-V3-06'ya göre; hedef orta bot
  %50–60 (bandın üst yarısı); `branch3` alt sınırı 0,10 (tek yol değil). Testere dişi korunur, L11 nefes.

### DL-V3-16 · Öneri · LEVELS §8.7 L5 · Yeni renk (R) ve yeni özellik aynı bölümde
- R ilk kez L5'te, iki renkli tanıtımıyla birlikte geliyor (bölüm başına bir yeni fikir, K-45/10 ruhu). R'yi L4'e çekin
  (tek renkli, öğreticisiz) ya da L5'teki R blokları L6'ya kaysın.

### DL-V3-17 · Öneri · LEVELS §8.5 · Görünen kütle 3–4. bölümde düşüyor
- L1–L2'de 8 görünen blok; L3'te 10 blok ama 6 görünen öğe (2 palet + 4), L4'te benzer. Sahibin "daha çok blok" algısı
  ekranda görülene bakar. `visibleAtStart` izlensin, eğri tekdüze artmıyorsa paletli bölüme 1–2 tekil blok eklensin;
  palet görseli katman başına 6 design px yükselen gölgeyle "yığın" diye okunur (JUICE/ART: benim).

### DL-V3-18 · Öneri · LEVELS §8.10 U-v3-0, playtest H1 · H1 kapsamı netleşsin
- Çalışma zamanı `tileRemaining` tam (deadlock.ts 21–25); "muhtemelen çalışma zamanı da" cümlesi düzeltilsin. H1
  yalnız doğrulayıcı (`tileLevel`) — yine de yeni şekillerden önce kapanmalı (yanlış `untileable` üreticiyi kör eder).

### DL-V3-19 · Öneri · OBSTACLES Y9–Y13 bilgi kartları · EN yazım
- EN metinlerde "colour"; projenin `en.json`'u "color" kullanıyor (ör. "Wrong color, so it bounced back."). Y9 kartı:
  «Two-tone block: each color must match its spot.» TR metinler ≤ 6 kelime, ton uygun; ton denetimi onaydan sonra
  STORY §6'ya taşınır.

### DL-V3-20 · Öneri · Tema / telif · Usta Kral ve ödül simgeleri
- Yeni öğeler (palet, streç film, makas, hamle rozeti) inşaat temalı ve özgün; kopya riski görmedim. Kural: Bonus ve
  diğer rozetlerde **taç, kral, altın-mor** kullanılmaz (Usta Kral D-101 + taçlı "+hamle" rozeti Royal Match diline
  yaklaşır; D-092'deki benzerlik kaygısı). D-101 web `DECISIONS.md`'de değil, yalnız REVIEW_LOG/Unity belgelerinde:
  orkestratör karar satırını web'e de yazsın.

### DL-V3-21 · Öneri · LEVELS §8.4 · 6×7 / 6×8 saha Hikaye 1'de kullanılmıyor
- Orkestratör yorumu "saha 6×8'e kadar gerçekten kullanılır" diyordu; plan en çok 6×6 kullanıyor (Karar 6 gerekçesi
  `min` ≤ 20). Kabul ediyorum; proje sahibine açıkça "büyük sahalar Hikaye 2 finalinde" diye söylenmeli.

### DL-V3-22 · Öneri · L2 aha (K-34 "!" gölgesi) · Neden "!" görünür olmalı
- L2'nin aha'sı "L'yi önce denemek ! verir". Gölgede yalnız "!" yetmez: desteksiz hücre(ler) 2 px kesik kontur + aşağı ok
  ile işaretlensin (JUICE/ART satırı benim; K-18 Kolay/Normal nötr olmayan gölge ile uyumlu).

## Öğretici yükü (6. soru)

Toplam 12 öğretici adımı (L1 2, L2 2, diğerleri 1); K-53 hafif. Bölüm başına bir yeni fikir: L2 (L ve J ayna çifti =
bir fikir) ✓, L5 (iki renk + yeni renk R) ⚠ DL-V3-16, L8 (I3 + Çekiç) ⚠ DL-V3-13, diğerleri ✓. Yeni anahtarlar
(`tut.m.smallfirst`, `pallet`, `twotone`, `order`, `wrap`, `bonus`) ve 5 bilgi kartı metni onaydan sonra STORY'ye
TR + EN yazılır; benim işim.

## Sanat bağımlılıkları (onay sonrası design-lead)

6 yeni kaplama/ikon karesi (§8.9) bu incelemeyle **8**'e çıkar: palet dudağı + çentik (DL-V3-02/03), sonraki katman
kenarı (DL-V3-01), film kenarı, yatay kurdele + fiyonk, makas rozeti, hamle rozeti (+n), desteksiz hücre işareti
(DL-V3-22), (Hikaye 2) buz sırı. Hepsi önce gri kutu, sonra ART_REFERENCE rubriğiyle.

## product-lead kapanışı (G1b, 2026-11-08)

Yöntem: stüdyo şablonu `design-review` kapanış biçimi (bulgu → seçenek → seçim → yer → doğrulama). Her bulgu GDD §16,
LEVELS §8 ya da OBSTACLES "Bölümler v3" içinde kapatıldı. Plan düzeyi tuzak taraması yeniden renklendirilmiş 10 planla
yeniden koşuldu: hepsi çözülebilir, ✓-tuzağı 0 (resmî değildir; resmî ölçüm code-lead U-v3 paketinden sonra).
Durum: **KAPANDI** = metin ve kural yazıldı; **KAPANDI (bağımlı)** = kural yazıldı, uygulaması başka ajanda.

| Bulgu | Önem | Seçim | Nerede | Durum |
|---|---|---|---|---|
| DL-V3-01 | Engel | A, Hikaye 1 boyunca: palet tek tipli (aynı şekil, renk(ler), bayrak); karışık palet Hikaye 2'de, en çok 2 katman, kendi tanıtım bölümüyle, gözetleme + sonraki katman kenarı çizildikten sonra. design-lead'in "L6'dan 2 katman" seçimi alınmadı: L6/L8/L10'a ikinci yeni fikir olurdu (K-45 madde 10). Bölüm 3 paletleri W×2 ve G×2 (sahanın büyümesiyle 2 katman; görünen öğe 8 kalır). z kazısı kararı tek tipli palette de var: paletin altındaki blok (Bölüm 4, 10). | LEVELS §8.1 Karar 7, §8.4, §8.7; GDD ÖNERİ K-65 madde 1 (`stack_mixed`); OBSTACLES Y10 | KAPANDI |
| DL-V3-02 | Önemli | Kabul: gri-mavi metal kızak, 2 çıta, 16 design px dudak; ahşap rengi/damar yok | OBSTACLES Y10 Okunurluk; LEVELS §8.9 | KAPANDI (bağımlı: design-lead sanatı) |
| DL-V3-03 | Önemli | Kabul: katman sayısı çentikle; bonus rozeti HUD hamle simgesi + "+2", krem, Ø 56, altın yok; blokta en çok bir rakamlı rozet, `bonus` + `wet` yasak | OBSTACLES Y10, Y12, birleşim tablosu; GDD ÖNERİ K-65 madde 4 | KAPANDI |
| DL-V3-04 | Önemli | Kabul: film kenarı (4 px taşan, %35), tek yatay kurdele, 48 px fiyonk, çapraz çizgi/kilit yok; makas rozeti 56 px | OBSTACLES Y11; LEVELS §8.9 | KAPANDI (bağımlı: design-lead sanatı) |
| DL-V3-05 | Önemli | Kabul: blok başına en çok bir kaplama (`trait_overlay_many`, warn); ayrıca palet katmanı Hikaye 1'de bayraksız (`stack_mixed`, error) | GDD ÖNERİ K-65 madde 2; OBSTACLES birleşim tablosu (H1 ✗ / H1 ⚠); LEVELS §8.7 | KAPANDI |
| DL-V3-06 | Önemli | Kabul: Hikaye 1 çiftleri W–Y, R–Y, W–G, G–Y (`colors_low_contrast`). Yeniden renklendirme birebir eşlemeyle (tuzak yapısı korunur): Bölüm 7 W→Y ("YR"/"RY", ΔE 59), Bölüm 9 R→G, Bölüm 10 R→Y ("GY"/"YG", "GW"/"WG", palet "WY"); dikiş 2 perçin | LEVELS §8.1 Karar 8, §8.7; GDD ÖNERİ K-57 madde 7, K-65 madde 3; OBSTACLES Y9 | KAPANDI |
| DL-V3-07 | Önemli | A: Hikaye 1'de bonus ödül anı, `k` = 0, Bölüm 10'dan çıktı (hamle 21 = 20 + 1); B (bağlayıcı son tarih + HUD "19 (+2)") Hikaye 2'de. `moves_budget` formülü açık: `moves + B·k − min − P ∈ [0, a_max]`; Hikaye 1'de bugünküyle aynı | GDD ÖNERİ K-60 madde 6, K-62; LEVELS §8.5, §8.11 madde 4 | KAPANDI |
| DL-V3-08 | Önemli | Kabul: `traitDelta` ≥ 10 kapısı (Y12 muaf; Y10'un kapısı Bölüm 4'te: Bölüm 3 kural öğretir), yok sayan kip tanımları; `shapeDecisions` ≥ 2 Normal ve Zor'da kapı; Bölüm 3/5/7 koridor testi (5 kişi, ≥ 4/5 iki soru) sanat öncesi | GDD ÖNERİ K-64; LEVELS §8.6, §8.10 U-v3-3 | KAPANDI (bağımlı: code-lead bot kipi; koridor testi için oyuncu — §8.11 madde 7) |
| DL-V3-09 | Önemli | C + B: `liftRatio` ≥ 0,60 her bölümde kapı; üst satıra yalnız ilk hamlesi park olan blok. Ek: Bölüm 3–5 sahası 6×5 ve duvar 5 → 1–5 ve 7'de üst satır yok (A kendiliğinden); 6, 8, 9, 10'da C + B, tutmazsa A | LEVELS §8.1 Karar 9, §8.4 "Üst satır" sütunu, §8.8 madde 6; GDD ÖNERİ K-64 madde 1 | KAPANDI |
| DL-V3-10 | Önemli | Kabul: `pallet_capacity` (`E ≥ 2 + max(hücre × (katman − 1))`, Kolay error, Normal/Zor warn); D1 genişlemesi ("tutulabilir blok var ama iptal dışı hedef yok"); Bölüm 4 yeniden: saha 6×5, E 10, tek palet W×3 (alt sınır 6). Bütün 10 satır alt sınırı tutar (§8.4 `pal.cap`). V3-10 kenar durumu düzeltildi (D3b dayanağı geri çekildi) | GDD ÖNERİ K-58 madde 8, "K-30 değişikliği: D1 genişlemesi", V3-10; LEVELS §8.4 | KAPANDI (bağımlı: code-lead D1 + doğrulayıcı) |
| DL-V3-11 | Önemli | Kabul: `scissors_blocked` (error), `scissors_trivial` (warn); üretici kısıtı | GDD ÖNERİ K-59 madde 6, V3-14; LEVELS §8.8 madde 6, §8.10 kod tablosu | KAPANDI |
| DL-V3-12 | Önemli | Kabul (Fırça'da ince ayarla): Vinç ve Altın Mala yalnız tutulabilir (palet üstü, sargısız); Fırça yalnız palet üst katmanı ve yalnız Hikaye 2+ (Fırça 22'de açılır; takas paleti karıştırabilir, kenar/gözetleme gerekir); Fırça sargılıyı seçebilir; Çekiç yalnız sargı | GDD ÖNERİ K-66, V3-11…V3-13; OBSTACLES Y10 "Güçlendiriciler" | KAPANDI |
| DL-V3-13 | Önemli | Kabul: Bölüm 8 öğreticisi bağlamsal (sargılıya 2. dokunuşta Çekiç yuvası + `tut.m.hammer`; `done` = `boosterUsed` ya da makas yerleşimi); aha "makas her şeyi açar, Çekiç kestirme" | LEVELS §8.7 Bölüm 8 kartı; OBSTACLES Y11 | KAPANDI |
| DL-V3-14 | Önemli | B, olmazsa A: makro çizge sağlamlık testi (tam taramanın bittiği bütün bölümlerde ölü küme birebir); A'nın somut biçimi Bölüm 6–10 iki kat, 6×5, N 12–14; Bölüm 6 spike'ı (süre, bellek, `complete`, D3a "bilinmiyor" oranı, eşik %1) gelmeden 7–10 JSON'u yok | LEVELS §8.10 U-v3-2, §8.7 Bölüm 6 kartı | KAPANDI (bağımlı: code-lead spike) |
| DL-V3-15 | Önemli | Kabul: Bölüm 10 en çok 3 özellik (iki renkli, palet, sargı + makas), bonus yok, ikizler güçlü çiftlerden, orta bot %50–60, `branch3` 0,10–0,20, `greedyWin` 0,10–0,30, `ahaMin` 1–2; testere dişi ve Bölüm 11 nefes korunur | LEVELS §8.5, §8.6, §8.7 Bölüm 10 | KAPANDI |
| DL-V3-16 | Öneri | Kabul: R Bölüm 4'te (tek renkli, öğreticisiz; G→R eşlemesi); Bölüm 5'in tek yeni fikri iki renkli | LEVELS §8.7 renk satırı, Bölüm 4/5 kartları | KAPANDI |
| DL-V3-17 | Öneri | Kabul: `visibleAtStart` izleme ölçütü (K-64 madde 4); eğri 8, 8, 8, 8, 10, 11, 12, 12, 13, 14 (tekdüze); katman gölgesi §8.9 | LEVELS §8.4; GDD ÖNERİ K-64 | KAPANDI |
| DL-V3-18 | Öneri | Kabul: H1 yalnız doğrulayıcı (`tileLevel`); "muhtemelen çalışma zamanı" cümlesi düzeltildi | LEVELS §8.10 U-v3-0 | KAPANDI |
| DL-V3-19 | Öneri | Kabul: EN "color" | OBSTACLES Y9 kartı | KAPANDI |
| DL-V3-20 | Öneri | Kabul: rozetlerde taç, kral, altın-mor yok; D-101'in web `DECISIONS.md`'ye yazılması orkestratöre | OBSTACLES Y12; LEVELS §8.9, §8.11 madde 6 | KAPANDI (bağımlı: orkestratör) |
| DL-V3-21 | Öneri | Kabul: 6×7 / 6×8 ve N 18–22 Hikaye 2 finalinde; proje sahibine açıkça bildirilsin | LEVELS §8.1 Karar 6, §8.11 madde 2 | KAPANDI (bildirim orkestratörde) |
| DL-V3-22 | Öneri | Kabul: desteksiz hücre kesik kontur + aşağı ok (Bölüm 2 aha'sı) | LEVELS §8.7 Bölüm 2 kartı, §8.9 | KAPANDI (bağımlı: design-lead sanatı) |

**design-lead'den ayrıldığım tek nokta:** DL-V3-01'de karışık paleti Hikaye 1'den tamamen çıkardım (orkestratör onayı
LEVELS §8.11 madde 5). Gerekçe 3 satır: (1) Bölüm 6–10'un her birinin zaten bir yeni fikri var; karışık palet ikinci olurdu
(K-45 madde 10). (2) Hikaye 1 yeni sanat kapısına (gözetleme) bağlanmaz. (3) Tek tipli palette de z kazısı kararı
paletin altındaki blokla kurulur ve `traitDelta` ile Bölüm 4'te ölçülür.
