# Karar günlüğü

Biçim:

```
### D-012 — Başlık
Durum: KABUL | ÖNERİ | RET     Sahip: ajan     Tarih: YYYY-AA-GG
Karar: ...
Gerekçe: ...
Etkilenen: ...
```

---

### D-001 — Proje, Deneme reposunda `minik-usta/` alt klasöründe yaşar
Durum: KABUL     Sahip: orkestratör     Tarih: 2026-10-04
Karar: Minik Usta ayrı bir GitHub reposu yerine `yilmazfatih-cyber/Deneme` reposunun `minik-usta/` klasöründe, `claude/determined-bardeen-3j767o` dalında geliştirilir. Klasör kendi `package.json`, `CLAUDE.md` ve `.claude/agents/` dosyalarıyla bağımsızdır; ileride olduğu gibi ayrı repoya taşınabilir. Brifteki "git init" adımı, mevcut repo kullanıldığı için uygulanmadı.
Gerekçe: Proje sahibi yeni repo istedi; oturumun repo oluşturma izni yok (GitHub 403). Kökte Köprü projesi yaşadığı için kökü değiştirmek Köprü'yü bozardı.
Etkilenen: tüm yollar `minik-usta/` köküne göredir; kök `.prettierignore` ve `eslint.config.js`'e `minik-usta` yok sayma satırı eklendi.

### D-002 — Teknik yığın sürümleri (npm'den doğrulandı, 2026-10-04)
Durum: KABUL     Sahip: code-lead     Tarih: 2026-10-04
Karar: phaser 4.2.1 (latest), vite 8.3.2, vitest 5.0.3, eslint 10.12.0, typescript-eslint 8.71.0, prettier 3.9.9, @playwright/test 1.63.0; typescript **6.0.3** (latest 7.0.2 değil).
Gerekçe: `npm view <paket> version`. typescript-eslint 8.71.0 peer bağımlılığı `typescript >=4.8.4 <6.1.0`; TS 7 ile lint kırılır. Phaser 4 güncel kararlı ana sürümdür (dist-tag `latest`).
Etkilenen: package.json, docs/TECH_DESIGN.md

### D-003 — `src/theme/tokens.json` design-lead'indir
Durum: KABUL     Sahip: orkestratör     Tarih: 2026-10-04
Karar: `src/**` code-lead'in olsa da `src/theme/tokens.json` design-lead'e aittir (ajan tanımları böyle). Kod bu dosyayı yalnızca okur.
Gerekçe: İki ajan tanımı arasındaki sahiplik çakışmasını açıkça çözmek.
Etkilenen: CLAUDE.md sahiplik matrisi

---

## Faz 1 kapanışı (2026-10-05)

Kaynak: orkestratör kararları R-01…R-24 (`docs/review_inbox/_orchestrator_rulings.md`), ajanların güncel öneri listeleri
(product-lead P-1…P-18, X-1, X-2; design-lead P-1…P-30; code-lead P-1…P-22; entrepreneur BUSINESS §13 P-1…P-13 ve
NAMING §5) ve kapanış dosyaları. Aynı konudaki öneriler tek kayıtta birleştirildi; kaynakları Gerekçe'nin başında yazar.
"ÖNERİ" kayıtları proje sahibinin onayını bekler; belgeler bu kayıtlarda varsayılan olarak öneriye göre yazılmıştır.

### D-004 — K-34 "Alttan Üste" (destek) kuralı ve görünürlük katmanları
Durum: KABUL     Sahip: product-lead (kural), design-lead (görünürlük), code-lead (uygulama)     Tarih: 2026-10-05
Karar: Bir blok şantiyede ancak kapladığı her sütunda altındaki bütün `.` olmayan plan hücreleri doğru doluysa doğru yerleşir (`.` yalnız boşken dolu sayılır). Görünürlük: inşa cephesi vurgusu (`buildFront`), gölgede ↓ rozeti + eksik destek taraması, geri sekme/harç yapışması sonrası vurgu, ilk karşılaşmada `tut.ctx.support` ve Bölüm 4 yumuşak öğretici adımı. Tek `isCorrectPlacement` doğrulama, gölge, Vinç, Altın Mala, Boya Fırçası ve solver'da kullanılır.
Gerekçe: R-01; product-lead P-1, design-lead P-10 (+ P-7 ↓ rozeti), code-lead P-13 (O-2). Kural olmadan gömülü delik bölümü sessizce çözümsüz bırakır (Bölüm 3); 1–10 betikle doğrulandı, K-34 ihlali yok.
Etkilenen: GDD K-34, K-18, K-33, E-43; LEVELS §0, B3/B4/B6; UX §5.4–5.5; ART §4; JUICE #83, #84; TECH §5.2, §6.4, §9.3, §14.1
Onay: Proje sahibi, 2026-10-06 (önerilen yanıtla).

### D-005 — GDD kural ve verinin tek kaynağıdır (TECH ↔ GDD farkları)
Durum: KABUL     Sahip: orkestratör     Tarih: 2026-10-05
Karar: TECH_DESIGN GDD'ye uyar. Teslimat kuyruğu: adım 8 yalnız kuyruğa ekler, adım 9 tek deneme noktası (FIFO; `dropColumns` öncelik listesi, E-34). Bot modeli parametreleri yalnız `config/events.json`'dan okunur. Doğrulayıcı hata kodları GDD K-45'e bağlıdır (`Issue.code` + `rule: 'K-45/n'`).
Gerekçe: R-02. Kural ve veri product-lead'in alanı; iki kaynak testlerde sapma üretir.
Etkilenen: GDD K-25, K-26, K-35, K-45; TECH §6.2, §8.3, §11.2

### D-006 — Yarım adım yerçekimi (önce düşme, sonra yükselme)
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-05
Karar: K-35 adım 6'nın her turu iki yarıdır: (a) balonlar katı sayılarak bütün desteksiz blok/torbalar 1 satır iner; (b) diğer her şey katı sayılarak tutulmayan balonlar 1 satır çıkar; hareket kalmayınca biter.
Gerekçe: R-02; product-lead P-10 (code-lead önerisi). Aynı hücreyi hedefleyen balon + düşen blok için belirlenimci sonuç (E-33).
Etkilenen: GDD K-20, K-35, E-33; OBSTACLES N33, N34; TECH §5.3

### D-007 — Balon tavanı = aktif dilimin plan tepesi; tavan kirişi her bölümde
Durum: KABUL     Sahip: product-lead (kural), design-lead (görsel)     Tarih: 2026-10-05
Karar: Şantiyede balonlu blok aktif dilimin plan tepesine (satır h + e) asılır, sahada y = 7; tavanın üstünden bırakılan balon tavana iner (E-35); kamyonla gelen balon düşüp oturur, yükselmez (E-36). Plan tepesinde her bölümde iskele tavan kirişi çizilir (plan yüksekliğini de gösterir).
Gerekçe: product-lead P-3 (R-02), design-lead P-15 (product-lead ve code-lead kabul). Varış bırakma yüksekliğinden bağımsız; hesap O(1).
Etkilenen: GDD K-20, S8, E-35, E-36; ART §4; JUICE #43; ASSET `board_ceiling_beam`; TECH §4.5, §5.1

### D-008 — Boya Kapısı: girilen kapı boyar, son girilen geçerli (`via`)
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-05
Karar: Sürüklemede blok bir boya kapısının ray kipine girdiyse (yarım girip geri çıkmak dahil) boyanır; birden çok kapıya girildiyse son girilenin rengi geçerli; sahaya geri dönen blok boyalı kalır. Hamle kaydında `drag.via`.
Gerekçe: product-lead P-6 (R-02), code-lead `via` tanım önerisi. Boyanan blok duvar üstünden yerleştirilebilir, YAO korunur (Bölüm 22 niyeti).
Etkilenen: GDD K-35 adım 1, W6, E-39; OBSTACLES `obs.w6.desc`; UX §13.2 Bölüm 22; TECH §4.2, §6.2, §9.3

### D-009 — Kamyon Yardımı üç ayrı yol (D1 / D2 / D3)
Durum: KABUL     Sahip: product-lead (kural), code-lead (uygulama)     Tarih: 2026-10-05
Karar: D1 hamle yok → zincir ve ıslaklık kalkar, gerekirse yeniden dizme; D2 malzeme açığı → eksik hücre sayısı kadar o renkte `B1` adım 12'de `x = 5`'ten teslim; D3 döşeme → yeniden şekillendirme. Sıra D1 → D2 → D3, sonda tek güvence denetimi (1 hamle → belirlenimci iş bütçeli 2 hamle → D3). code-lead'in "D2'de `B1` yerine döşeyen şekil" alt önerisi RET (product-lead: boya istismarı net negatif).
Gerekçe: code-lead P-12; R-02; tutarlılık denetimi tur 1–2 (E-23, E-42, E-44).
Etkilenen: GDD K-25, K-30, K-39, E-37; JUICE #21a–c; TECH §9.7

### D-010 — Duvar sıfır genişlikli sınırdır (çekirdek 8×10 ızgara)
Durum: KABUL     Sahip: code-lead     Tarih: 2026-10-05
Karar: Çekirdek duvarı x = 5 ile x = 6 arasındaki sıfır genişlikli sınır olarak modeller (sınır satır maskeleri, K-12 tam sığma koşulu); mantıksal 9×10 duvar sütunlu ızgara kaldırıldı. Ekran ölçüleri `layout.*`'tan (D-011). x = 5 ile x = 6 komşu değildir (E-46).
Gerekçe: R-03; code-lead P-1. Kurallar eşdeğer; 60 px görsel duvarla bloklar komşu hücrelere taşmaz.
Etkilenen: GDD §0, K-04/05/07/11/12, E-05/06/07/28/46; OBSTACLES; LEVELS lejant; TECH §2.2, §4

### D-011 — Ölçüler: hücre 120 px, duvar 60 px; tek kaynak `layout.grid.*`
Durum: KABUL     Sahip: design-lead (tokens), code-lead (okuma)     Tarih: 2026-10-05
Karar: `layout.grid.cellPx` 120, `wallW` 60, `yardX` 30, `wallX` 750, `buildX` 810; kod değerleri yalnız tokens'tan okur ve değişmezleri testle denetler.
Gerekçe: R-04. Tek kaynak kuralı (design-lead P-24 bu yüzden geri çekildi, D-050).
Etkilenen: `src/theme/tokens.json`; UX §0.1, §5.1; TECH §2.2, §10.2

### D-012 — Blok paleti yeni hex değerleri ve B = "Gök Mavisi"
Durum: KABUL     Sahip: design-lead     Tarih: 2026-10-05
Karar: Blok paleti renk körlüğü ayrışması için brif hex'lerinden değişti; renk kodları (W…P) aynı. B'nin adı "Gök Mavisi" / Sky Blue. Renk adları yalnız belgelerde, oyuncuya görünen metinde yok. Proje sahibine bilgi olarak sunulur.
Gerekçe: R-05; design-lead P-1, P-9; product-lead kabul (kurallar yalnız kodları kullanır; "Cam Mavisi" S3 cam bayrağıyla karışıyordu).
Etkilenen: ART §2.1; tokens `color.block`; LEVELS, OBSTACLES ad atıfları

### D-013 — Plan hücresi tarifi ve sembol mürekkebi
Durum: KABUL     Sahip: design-lead     Tarih: 2026-10-05
Karar: Plan hücresi = açık altlık #BCCADD + blok rengi %80 (renk körü modunda %90) + kesik kontur + mürekkep; katman sırası ozalit → plan → ızgara kaplaması → inşa cephesi → bloklar. Bileşik renkler `check.*` yalnız kontrol değeridir. Sembol mürekkebi: L* ≥ 60 ise koyu ×0,40, değilse beyaz %85 (B için koyu #14233D).
Gerekçe: R-05; design-lead P-2, P-3. Brifteki %30 opaklık renk körlüğünde ayırt edilmiyordu (ΔE00 ≈ 3,8).
Etkilenen: ART §4; tokens `board.planUnderlay`, `alpha.planFill`, `check.*`; TECH §10.2–10.3

### D-014 — K-18 düşüş gölgesi çift kodlu
Durum: KABUL     Sahip: design-lead     Tarih: 2026-10-05
Karar: Doğru/hatalı gölge yalnız renkle değil çizgi deseni + rozet + nabızla ayrılır; K-34 için ↓ rozeti ve yatay destek taraması; açılmamış `?` hücresine değen gölge nötr ve sessiz; çatlak cam uyarısı bütün zorluklarda; iptal edilecek bırakmada ↩ önizlemesi.
Gerekçe: R-05; design-lead P-7 (genişletilmiş). Renk körü erişimi ve adalet.
Etkilenen: UX §5.4; ART §2.3; JUICE #7; GDD K-18; TECH §5.1

### D-015 — Ekran ölçekleme: FIT mi EXPAND mı
Durum: KABUL     Sahip: design-lead + code-lead     Tarih: 2026-10-05
Karar: Öneri EXPAND (1920–2400 yükseklik, tahta grubu `expandShare` 0,5 ile büyür). Kod ve belgeler `layout.top/bottom/board/popup` çapa sözleşmesiyle iki kipte de çalışır; seçim tek ayar.
Gerekçe: R-06; code-lead P-7 (O-1) = design-lead P-4. Brif FIT diyor; EXPAND uzun ekranlarda boş bant bırakmaz.
Etkilenen: tokens `meta.scale`, `layout.*`; UX §0.1; TECH §10.1
Onay: Proje sahibi, 2026-10-06 (önerilen yanıtla).

### D-016 — Kasaba görevleri: STORY'deki 35 görev esastır
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-05
Karar: 5 hikaye bölümü × 7 görev = 35 görev (her bölüm 10★); ad, sıra ve yıldız maliyetleri META §1 ve `economy.json`'da kesin, STORY aynı değerleri gösterir. Anahtarlar `town.ch{n}.t{m}.name/.scene`.
Gerekçe: R-07 (brif "6–8 görev" aralığında). META'nın 36 görevlik listesi (X-2) ve design-lead'in STORY'yi META'ya göre yeniden yazma önerisi (P-22, D-048) geri çekildi.
Etkilenen: META §1; `config/economy.json`; STORY §5; UX §2.2; ASSET §7

### D-017 — Öğretici metinler: tek anahtar kümesi ve ton
Durum: KABUL     Sahip: design-lead (metin), product-lead (kurala uygunluk)     Tarih: 2026-10-05
Karar: Anahtarlar `tut.l{n}.{konu}`; bağlamsal satır adımda yeniden kullanılabilir (`tut.ctx.{konu}`, GDD §14.1); terim "blok"; oyuncu metninde renk adı yok; değişken sayılar `{n}`. Ekranda görünen metin STORY §6'dadır; OBSTACLES'taki metinler engel bilgi kartıdır (`obs.{id}.desc`).
Gerekçe: R-08. Üç belgede üç anahtar biçimi vardı; renk körü oyuncu "gölge yeşilse" cümlesini kullanamaz.
Etkilenen: STORY §6; LEVELS `tutorial[]`; OBSTACLES; GDD §14.1; TECH §8.2

### D-018 — Ara sahne tetikleyicileri
Durum: KABUL     Sahip: product-lead (kural), design-lead (sunum)     Tarih: 2026-10-05
Karar: Prolog ilk açılışta; `story.ch1.start` 1. görevden (ilk yıldız harcanınca) sonra (brif FTUE sırası); `story.chN.start` (N ≥ 2) önceki bitiş sahnesinden sonra ana ekranın bir sonraki açılışında, N'nin görevleri o sahneye kadar gizli; bitiş sahnesi son görevde; bir eylemde en çok bir sahne.
Gerekçe: R-09; product-lead P-14 (design-lead'in kuralına geçti). Not: design-lead P-21 raporunda "geri çekildi" yazıyor, ancak META §1, `economy.json → town.cutscenes`, STORY §3 ve UX §8'in son metni P-21'in özgün kuralıdır; belgeler tutarlı, ayrı RET kaydı açılmadı.
Etkilenen: META §1; `economy.json → town.cutscenes`; STORY §3; UX §8, §12; TECH §11.3

### D-019 — Hafif yerçekiminde (G-L) yönlendirme
Durum: KABUL     Sahip: design-lead (girdi), product-lead (kural), code-lead (maliyet)     Tarih: 2026-10-05
Karar: Düşüş/yükseliş sürerken tahtaya dokunmak (dokunulan taraf = yön) ya da boş noktadan yatay kaydırmak 1 genişlikli bloğu 1 sütun kaydırır; düşüş başına 1 kez, aynı hamle; geçersiz girdi hakkı harcamaz; blokta başlayıp eşiği aşan dokunuş tutmadır ve pencereyi kapatır (E-40); çıkıntı altına yönlendirme serbest; `atRow` iniş satırını içerebilir; iki aşamalı commit, `steerZone` = `board`.
Gerekçe: R-10; design-lead P-11, code-lead P-16, product-lead P-11. Düşen 120 px'lik bloğa dokunmak motor becerisi istiyordu.
Etkilenen: GDD K-19, E-40, E-47; UX §5.6; JUICE #46; TECH §4.7

### D-020 — Ağır yerçekimi 700 ms + 1400 ms erişilebilirlik seçeneği
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-05
Karar: K-19 ağır yerçekimi tutma süresi 700 ms kalır; Ayarlar › Erişilebilirlik "Zaman baskısını azalt" açıkken 1400 ms. Bot zorluğu 700 ms ile ölçülür. "Şantiye üstünde indirilemez" alternatifi ve "sayaç hiç olmasın" seçilmedi.
Gerekçe: R-11. "İndirilemez" davranışı G-H'nin dersini siler ve G-H + cam + yüksek duvar bölümlerini YAO ≥ %60 altına iter (product-lead).
Etkilenen: GDD K-19; OBSTACLES G-H; UX §5.7, §11, §14; JUICE #45; STORY `tut.l15.setting`; TECH §4.7

### D-021 — Animasyon sırasında girdi
Durum: KABUL     Sahip: design-lead (kural), code-lead (uygulama)     Tarih: 2026-10-05
Karar: Animasyon sürerken yeni blok tutulabilir; tutma anında tahtayı değiştiren bekleyen animasyonlar son karesine atlar. Girdi yalnız dilim kayması, kamyon teslimatı ve Kamyon Yardımı / karıştırma sırasında kilitlidir (600–900 ms; dokunuş 3× hızlandırır). "Animasyonları azalt" = JUICE solma varyantları (hız değil, daha az hareket); haptik ayrı anahtarda.
Gerekçe: R-12; design-lead P-12, code-lead P-15. Her yerleşim sonrası kilit "yapışkan" his veriyordu.
Etkilenen: JUICE §0 kural 3 ve 8; UX §0.3, §14; TECH §6.3

### D-022 — Bölüm içi kaldığı yerden devam ve `m = 0` cezasız çıkış
Durum: KABUL     Sahip: product-lead (kural), code-lead (uygulama)     Tarih: 2026-10-05
Karar: MVP. Her eylemde ve `pagehide`'da `inLevel` (hamle günlüğü, tohum, teklif durumu, `levelHash`, `rulesVersion`) kaydedilir; uygulamanın kapanması kayıp sayılmaz, bölüm belirlenimci tekrarla kaldığı yerden sürer; kayıp penceresi açıkken kapanırsa aynı teklifle yeniden açılır. Kayıp yalnız onaylı çıkış ya da hamle bitince. İlk hamleden önce (`m = 0`) çıkış cezasızdır: can ve oyun öncesi güçlendiriciler iade, seri bonusu tüketilmez (E-41). Sürüm uyuşmazlığında deneme oynanmamış sayılır ve tam iade edilir (E-45).
Gerekçe: R-13; product-lead P-7, code-lead P-17; entrepreneur ve code-lead yorumları (işletim sistemi uygulamayı öldürür; Köprü'de haksız elenme).
Etkilenen: GDD K-43, E-38, E-41, E-45; META §2, §5, §6.1; UX §1, §5.1, §12; TECH §11.1

### D-023 — Botlar: etiketli "Renkli Tepe çırakları", saf ve belirlenimci simülasyon
Durum: KABUL     Sahip: entrepreneur (sunum ilkesi), product-lead (model), design-lead (görsel), code-lead (uygulama)     Tarih: 2026-10-05
Karar: Köprü ve Lig'deki 99 rakip açıkça etiketli çıraklardır: "Çırak Fındık" / "Apprentice Hazelnut" kalıbı (100 ad çifti), kask + alet avatarı, "çırak" rozeti, kural kartı ve (i) paneli; gerçek kullanıcı adına benzeyen ad, bayrak, "çevrimiçi" işareti yok. `botSim` yalnız config + tohum + zamanı okur; ESLint import yasağı, iki-kayıt eşitlik testi, `seedHash`. Köprü tohumu `eventId`; Lig `(weekId, groupId)`, `groupId = hash32(weekId, installId)`; hash `fmix32-chain-v1`; Lig eğrisi 5 profilli tamsayı `curveTable` (motorlar arası bit-aynı).
Gerekçe: R-14; BUSINESS P-5, design-lead P-14, code-lead P-18, product-lead P-16. Aldatıcı uygulama riski (R-07); ödemeden bağımsızlık kodda kanıtlanır. code-lead'in "hiçbir tohumda kurulum kimliği yok" ve `powFixed` önerileri geri çekildi.
Etkilenen: META §6–§7; `config/events.json`; STORY §7.4; UX §9–§10; BUSINESS §4.6, E8; TECH §2.7, §11.2

### D-024 — Teklif etiği (+5 hamle penceresi ve Sallanan Köprü)
Durum: KABUL     Sahip: entrepreneur (ilke), design-lead (sunum), product-lead (kural)     Tarih: 2026-10-05
Karar: +5 penceresinde üç eşit boy seçenek (altın / reklam / "Hayır, teşekkürler"), hiyerarşi yalnız renkle; ortak `PriceLabel` ile gerçek para karşılığı; "Teklif n/3" ve eskalasyon görünür; baskı metni, kalan oyuncu sayacı, kural satırı yok; teklif penceresinde seri kaybı yazılmaz. Deneme başına en çok 3 uzatma; reklam yalnız 1. teklifin alternatifi ve sınıra sayılır. Köprü +5 fiyatı etkinlik dışıyla aynı; beklenen bitiren payı < ilk +5 fiyatı; Köprü +5 geliri toplam IAP'nin ≤ %25'i izlenir. Oyuncunun başlattığı "+" alımı serbest; kendiliğinden açılan bölüm içi satış yok (E4).
Gerekçe: R-15; BUSINESS P-4, design-lead P-13. Kayıp kaçınma baskısı ve düzenleyici risk (CPC, PEGI, DFA).
Etkilenen: UX §0.3, §7, §9; JUICE #52; STORY §7.3; GDD K-29; META §3, §5, §6; BUSINESS §4.3–4.5

### D-025 — Ekonomi tek değerleri (fiyatlar ve oyun içi altın)
Durum: KABUL     Sahip: entrepreneur (fiyat) + product-lead (altın)     Tarih: 2026-10-05
Karar: +5 hamle 900 / 1.350 / 1.800 altın; Köprü tur başına +5 altın tavanı 4.050 (`bridgeSpendCapCoins`; reklam tavandan bağımsız). Kumbara $1,99 / 89,99 TL, kırma 1.000, tavan 2.000, galibiyet başı 50 / 75 / 100. Altın paketleri 1.000 / 2.750 / 6.000 / 13.000 / 35.000 / 75.000 ($1,99–$99,99); Başlangıç paketi 2.500 + 2 Çekiç + 1 Vinç + 2 Termos, $1,99, tek seferlik, süresiz. Ödüllü reklam: +5 1/deneme ve 3/gün, can 2/gün, günlük ×2 1/gün, toplam 6/gün. Gerçek para karşılığı referans paket `coins_1000`'den. Ödemeyen oyuncu ölçütü: 10 bölümde ≥ 1 kez +5 tabanı; medyan bakiye 11–50'de 400–1.500; kayıp kurtarma karışımı altın %15–25 / reklam %30–40 / kurtarılmayan %40–50; +5 sonrası kazanma oranı %70–85.
Gerekçe: R-16; BUSINESS P-3, P-11; product-lead META §3, §8, §9. Eşikteki kumbara değeri ≥ Avuç paketi; 4.050 tek tam eskalasyondur.
Etkilenen: `config/economy.json`, `config/events.json`; META §3–§9; BUSINESS §4–§5; UX §7, §11; TECH §11.3

### D-026 — Usta Modu (içerik sonu) MVP'de
Durum: KABUL     Sahip: product-lead + entrepreneur     Tarih: 2026-10-05
Karar: 50. bölümden sonra 11…50 sırayla, sonra yeniden 11; hamle = solver minimumu + 2; yıldız yok; Köprü ve Lig'e sayılır; altın ve lig puanı özgün zorluk etiketinden; her 10 Usta Modu galibiyetinde Usta Sandığı 250 altın + 1 Çekiç. Faz 3 ayar kuralı: 10 galibiyetteki medyan gelir G < 900 ise sandık altını `250 + 50 · ceil((900 − G) / 50)`. "Sonra" kararında yedek: 11–50 özgün bütçeyle tekrar, yalnız kazanma tabanı.
Gerekçe: R-17; product-lead P-8, P-18; BUSINESS P-8. Köprü ve Lig bölüm kazanmaya bağlı; 50 bölüm medyan oyuncuda 7–9 günde biter (tahmin). Maliyet ≈ 1 g, sanat gerektirmez.
Etkilenen: META §8.5, §9; `economy.json → masterMode`; BUSINESS §9.2, §12.1; UX §3, §6; TECH §14.3
Onay: Proje sahibi, 2026-10-06 (önerilen yanıtla).

### D-027 — Hamle bütçeleri brif tahmininin altında
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-05
Karar: Hamle bütçeleri brif tahminlerinin %25–40 altındadır; formül (solver minimumu + tampon, bot ayarı) geçerli kalır ve bölüm süresi bandıyla (1–10: 45–75 s; 11–30: 75–120 s; 31–50: 100–180 s) ölçülür.
Gerekçe: R-18. Bütçe çözüm uzunluğundan türetilir; içerik pisti ve kayıp sıklığı süre bandıyla izlenir.
Etkilenen: LEVELS §0, §1, §4; META; BUSINESS §6.2
Onay: Proje sahibi, 2026-10-06 (önerilen yanıtla).

### D-028 — Albüm "Sonra"; kasaba görevi sahnesi MVP-lite
Durum: KABUL     Sahip: entrepreneur (kapsam), design-lead (sunum)     Tarih: 2026-10-05
Karar: Albüm alt navigasyonda Takım gibi kilitli "Yakında" sekmesidir; "Albüme eklendi" kartı ve albüm kartı varlıkları Sonra. Görev tamamlanınca sahne = yapı belirme animasyonu + tek satırlık balon; diyaloglu görev sahnesi Sonra.
Gerekçe: R-19; design-lead P-29. Ayrı ekran, veri ve kayıt alanı maliyeti.
Etkilenen: UX §3, §8, §12; STORY §4.1, §5; JUICE #75; ASSET §7, §10; BUSINESS §12.1; TECH §11.1

### D-029 — Debug paneli yalnız geliştirme derlemesinde
Durum: KABUL     Sahip: code-lead     Tarih: 2026-10-05
Karar: Panel yalnız `import.meta.env.DEV`'de; üretimde `?debug=1` etkisiz; staging için panelsiz `harness` modu; `build:verify` `dist/`'te debug/harness parçası olmadığını denetler.
Gerekçe: R-20; code-lead P-20. Üretimde sınırsız hamle ve bölüm seçimi monetizasyonu ve etkinlik bütünlüğünü bozar.
Etkilenen: TECH §1.2, §12.2–12.3

### D-030 — Bölüm 4 geçidi boy 2; mekanikler veri imzasından türetilir
Durum: KABUL     Sahip: product-lead (+ code-lead doğrulayıcı)     Tarih: 2026-10-05
Karar: Bölüm 4 geçidi boy 2'dir (brif boy 1); W3 Dar Geçit (`size = 1`) ilk kez Bölüm 9'da öğretilir. OBSTACLES her mekanik için veri imzası verir (27 satır); doğrulayıcı mekanik kümesini yalnız imzalardan türetir, K-45/9 istisnasızdır. Proje sahibine bilgi olarak sunulur.
Gerekçe: R-21 (seçim product-lead'e bırakıldı); product-lead P-9, code-lead P-19 (A seçeneği geri çekildi). Bölüm 4 öğretimi korunur, istisna gerekmez.
Etkilenen: LEVELS B4, B9; OBSTACLES veri imzası; GDD K-45; TECH §8.3

### D-031 — Yapı panoraması dokunuşu oyun durumunu değiştirmez
Durum: KABUL     Sahip: product-lead (kural), design-lead (sunum)     Tarih: 2026-10-05
Karar: K-06: "Panorama oyun durumunu değiştirmez; dokunuş yalnız büyük önizleme açar." Testte durum bit bit aynı kalır.
Gerekçe: R-22. `mirrorOf` / `repeat` bölümlerinde önceki dilim okunmalı.
Etkilenen: GDD K-06; UX §5.1; TECH §12.4

### D-032 — Yaş ekranı, servis arayüzleri ve referans düşük cihaz kapısı
Durum: KABUL     Sahip: entrepreneur + code-lead + design-lead     Tarih: 2026-10-05
Karar: Yaş ekranı yalnız mağaza sürümünde: Bölüm 3 kazanma → nötr tam sayfa (boş 4 hane doğum yılı + sayısal tuş takımı, varsayılan yok) → CMP → ana ekran. Ülkeden bağımsız tek kural: < 13 çocuk muamelesi, 13–17 kişiselleştirilmemiş reklam, 18+ onaya göre; yalnız yaş kovası ve onay sürümü saklanır. `ConsentService`, `AdsService`, `IapService` MVP'de sahte; sağlayıcılar onaydan sonra dinamik import. Referans düşük seviye Android (≤ 3 GB, Android 10–12) Faz 2 çıkış kapısıdır: ≥ 30 FPS, girdi ≤ 2 kare; eşik altında otomatik "azaltılmış efekt" profili.
Gerekçe: R-23; BUSINESS P-10, code-lead P-21, P-22, design-lead P-20. Karma kitle riski (R-01) ve düşük cihaz performans riski (R-09). Cihaz alımı ayrı kayıtta (D-062).
Etkilenen: UX §2.3, §12; BUSINESS S12; ANALYTICS; TECH §10.7, §11.8, §14.1

### D-033 — EN adlandırma ve oyun içi firma adı
Durum: KABUL     Sahip: entrepreneur + design-lead     Tarih: 2026-10-05
Karar: Kepçe EN'de "Kepche"; "Little Builder" mağaza adında ve EN metinde kullanılmaz; oyun içi firma adı `{company}` (EN "Tuna & Co.", TR hikayede "Minik Usta İnşaat"). BUSINESS §2 benzerlik kuralları (Festival Şatosu, ozalit, Bob the Builder) sanat yönüne girer.
Gerekçe: R-24; BUSINESS P-6, design-lead önerisi. Tescilli ad ve karakter çakışması (R-02, R-03).
Etkilenen: STORY §0; NAMING §5.2; ART §11.8; ASSET `logo_wordmark`; i18n

### D-034 — Rüzgârda d = 0 ise kayma yok; harç yalnız plan alanında yapışır
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-05
Karar: W8: bırakma anında düşüş mesafesi d = 0 ise rüzgâr kayması olmaz; balonda d = |bırakma satırı − tavan satırı|. Y8: harçlı blok yalnız bütün hücreleri plan alanındayken yapışır, değilse normal geri seker.
Gerekçe: product-lead P-2a, P-2b. Oturmuş bloğun kayması ve asansörde tahtadan taşma önlenir (E-08).
Etkilenen: GDD W8, Y8, E-08; TECH §5.1–5.2, §7.2

### D-035 — Yapı tamamken şantiyeye bırakma iptaldir (E-27)
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-05
Karar: Bütün dilimler tamamken (eksik hedef `clear` ise) şantiyeye bırakma iptal sayılır, 0 hamle; ekranda "Yapı tamam!" kurdelesi ve eksik hedef nabzı.
Gerekçe: product-lead P-12, design-lead P-27. Oyuncu farkında olmadan hamle yakmasın.
Etkilenen: GDD K-07 satır 5, E-27; UX; TECH §4.3 (`siteClosed`)

### D-036 — Saklı nesnelerin konumu her zaman görünür
Durum: KABUL     Sahip: product-lead (kural), design-lead (görsel)     Tarih: 2026-10-05
Karar: Vida ve anahtar "örtülü ama konumu belli"dir: her zorlukta örten hücrede ışıltı + soluk simge.
Gerekçe: product-lead P-13, design-lead P-16. Adalet ilkesi: kazı planı tahmine dönmesin.
Etkilenen: GDD K-42; OBSTACLES W7, Y7; ART §6; ASSET `obs_glint`

### D-037 — Bölüm 1'in ilk hedefi duvarın yanında
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-05
Karar: Bölüm 1'in ilk öğretici hedefi `a` (4,7)'ye taşındı (başparmağa yakın, kısa ilk hamle); betikle 3 hamle / YAO %100 doğrulandı.
Gerekçe: product-lead P-15, design-lead P-25 (a).
Etkilenen: LEVELS B1; UX §13.2

### D-038 — Ömürde ilk +5 teklifi ücretsiz
Durum: KABUL     Sahip: product-lead (kural) + entrepreneur (öneri)     Tarih: 2026-10-05
Karar: MVP. Oyuncunun ilk "Hamleler bitti" penceresinde +5 bir kez ücretsizdir ("Usta Dede'den hediye"); deneme başına 3 uzatma sınırında 1. teklif sayılır; o teklifte reklam seçeneği yok (`firstEverOfferFree`).
Gerekçe: product-lead P-17, BUSINESS P-12. Başlangıç cüzdanı (500) < 900; ilk ekonomi teması satın alma hunisi olmasın.
Etkilenen: GDD K-29; META §3; `economy.json → outOfMoves`; UX §7 (`lose.offer.gift`); TECH §11.3

### D-039 — Bölüm 1–2 duvarını yükseltme önerisi
Durum: RET     Sahip: product-lead     Tarih: 2026-10-05
Karar: Brifteki Bölüm 1 "Duvar 2" korunur; duvar en üst dolu satırın üstüne çıkarılmaz. Proje sahibi sorusu geri çekildi; bilgi olarak sunulur.
Gerekçe: design-lead P-25 (b) ve product-lead X-1, product-lead'in LEVELS §4/7 ölçümüyle reddedildi: Bölüm 1'in 2. hamlesi 2 satır, 3. hamlesi 1 satır kaldırma gerektirir; Bölüm 2'nin ilk hamlesi 2 satır. "Yukarı" hareket ilk oturumun 2. hamlesinde hissedilir.
Etkilenen: LEVELS B1, B2, §4/7

### D-040 — Eski değerlerin geri çekilmesi
Durum: RET     Sahip: product-lead     Tarih: 2026-10-05
Karar: Şu ilk değerler geçersizdir: META'nın 36 görevlik listesi; kumbara 20/30/40 · 1.500 · 3.000; "10 bölümde 2 kez +5 alamaz" üst sınırı; K-43 "uygulama kapanması = çıkış"; K-07 0,3 hücre eşiği; K-19 ms/satır değerleri.
Gerekçe: product-lead X-2. Yerine D-016 (R-07), D-025 (R-16), D-022 (R-13), D-041 (token eşiği) ve `tokens.physics` geldi.
Etkilenen: META, GDD K-07, K-19, K-43; `economy.json`

### D-041 — Dokunma/sürükleme eşiği tokens'tan
Durum: KABUL     Sahip: design-lead (değer), product-lead (kural metni)     Tarih: 2026-10-05
Karar: K-07 sayı içermez; dokunma ile sürükleme ayrımı `tokens.drag.startThresholdPx` (8 px) ve `holdMs` (100 ms) ile yapılır; eşik altında bırakma = dokunma. Test token değerini okur.
Gerekçe: design-lead P-26; code-lead yorumu. 0,3 hücre (36 px) "yapışkan" his verir ve tek kare şartıyla çelişir.
Etkilenen: GDD K-07; UX §5.3; tokens `drag.*`; TECH §4.3

### D-042 — Sol el modu "Sonra"
Durum: KABUL     Sahip: entrepreneur (kapsam), design-lead (tasarım)     Tarih: 2026-10-05
Karar: Sol el modu (Tuna köşesi ve güçlendirici çubuğu yer değiştirir, tahta aynalanmaz) MVP'de yoktur; tarif UX'te [Sonra] etiketiyle kalır.
Gerekçe: design-lead P-6; entrepreneur kapsam etiketi (brif dışı özellik).
Etkilenen: UX kapsam etiketleri; BUSINESS §12.1

### D-043 — Uygulama simgesi, mağaza görseli ve insan sanatçı kuralı
Durum: KABUL     Sahip: design-lead + entrepreneur     Tarih: 2026-10-05
Karar: Simge imza hareketi gösterir (ikaz şeritli duvar başlığı + kancadaki blok + kesik yay); karakter, yüz, kask, harf, küp yığını yok; A/B yalnız 18+ hedeflemeyle. Öne çıkan görsel: sol yarı kaldır–aşır–indir anı, sağ yarı yetişkin dünyası yapısı (fener/fırın), Tuna küçük. Ana karakterler, logo ve simge insan sanatçı işidir; araçlar yalnız keşif/eskiz; her final varlık için üretim kaydı; istemlerde marka/karakter adı yok.
Gerekçe: design-lead P-17; BUSINESS S5, S8; çocuk sinyali (R-01), telif koruması (insan yazarlığı şartı).
Etkilenen: ASSET §0, §11, §15; BUSINESS §3; STORE_LISTING §6

### D-044 — Tuna'nın yaşı oyun içinde ve mağazada geçmez
Durum: KABUL     Sahip: entrepreneur + design-lead     Tarih: 2026-10-05
Karar: Tuna'nın yaşı oyun içi metinde, mağaza materyallerinde ve kreatiflerde yazılmaz (S15); brifteki "8" yalnız iç belge bilgisidir. Yaşı vurgulayan STORY satırları değişti.
Gerekçe: design-lead P-19 (S15 kısmı), BUSINESS S15. Çocuğa yönelik sayılma riski (R-01).
Etkilenen: BUSINESS §3; STORY; STORE_LISTING

### D-045 — Tuna'nın görsel yaşı
Durum: KABUL     Sahip: design-lead     Tarih: 2026-10-05
Karar: Seçenekler: brifteki 8 yaş görünümü ya da 10–12 yaş görünümü. design-lead 10–12'yi önerir; entrepreneur için isteğe bağlı (S1–S15 her durumda uygulanır).
Gerekçe: design-lead P-19. Brifteki karakter tanımını değiştirdiği için proje sahibinin kararı.
Etkilenen: ART §11; ASSET §8; STORY
Onay: Proje sahibi, 2026-10-06 (önerilen yanıtla).

### D-046 — Font Baloo 2, sabit genişlikli hane yuvaları
Durum: KABUL     Sahip: design-lead (seçim), code-lead (yükleme)     Tarih: 2026-10-05
Karar: Baloo 2 (OFL 1.1, değişken 400–800, `baloo2-latin-tr.woff2` ≈ 38 KB alt küme); preload + `font-display: block`; Boot fontu bekler. Canvas'ta `tnum` olmadığından değişen sayılar en geniş haneye göre sabit yuvalarda ortalanır. Lisans Ayarlar › Lisanslar'da.
Gerekçe: design-lead P-28; code-lead TECH §10.2. Fredoka'da ğ, ş, İ yok.
Etkilenen: ART §8; ASSET `font_baloo2_latin_tr`; TECH §10.2

### D-047 — Sanat kapsamı ve öncelikleri
Durum: KABUL     Sahip: design-lead + entrepreneur     Tarih: 2026-10-05
Karar: İfade seti: ana 4 karakter × 6, yan 4 karakter × 3 (mutlu, şaşkın, üzgün), kalanı Sonra. Varlıklar P0 (Aşama 1 öncesi: simge, logo, 4 ana karakter, Hikaye 1–2), P1 (Hikaye 3–5), P2 (albüm, figüranlar) önceliğinde; iş yükü ≈ 126 sanatçı-günü (P0 ≈ 67), 1,5 FTE ile ≈ 17 hafta.
Gerekçe: design-lead P-30; entrepreneur maliyet yorumu. Kritik yol ara sahne panelleri; takvime tamponsuz sığıyordu.
Etkilenen: ART §11.6; ASSET §8, §14

### D-048 — STORY görevlerini META'nın 36 görevine göre yeniden yazma
Durum: RET     Sahip: design-lead     Tarih: 2026-10-05
Karar: Uygulanmaz; STORY §5'in 35 görevi esastır.
Gerekçe: design-lead P-22, R-07 ile geri çekildi (D-016).
Etkilenen: STORY §5

### D-049 — Ağır yerçekimi alternatifi: "şantiye üstünde indirilemez"
Durum: RET     Sahip: product-lead     Tarih: 2026-10-05
Karar: Uygulanmaz; D-020 geçerlidir.
Gerekçe: design-lead P-23 ve design-lead.md yorumu; R-11 ile geri çekildi; product-lead gerekçesi: G-H dersini siler, cam + yüksek duvar bölümlerini bozar.
Etkilenen: GDD K-19; UX §5.7

### D-050 — Token `layout.wallWidthCells`
Durum: RET     Sahip: design-lead     Tarih: 2026-10-05
Karar: Eklenmez; duvar ölçüsünün tek kaynağı `layout.grid.wallW` (60).
Gerekçe: design-lead P-24, code-lead'in tek kaynak kuralıyla geri çekildi (D-011).
Etkilenen: tokens `layout.*`

### D-051 — Şekil döndürme ve ağırlık kuralı
Durum: KABUL     Sahip: code-lead (+ product-lead GDD K-44)     Tarih: 2026-10-05
Karar: Yönelimler 0° tanımından saat yönünde 90° adımlarla üretilir ve sol alt köşeye normalize edilir; ağır = genişlik ≥ 3 ya da I5/Q9; dikey I5 bölüm verisinde yasak.
Gerekçe: code-lead P-2; GDD K-44'te kabul edildi.
Etkilenen: GDD K-44; TECH §3

### D-052 — Tek durum tamponu ve Zobrist karması
Durum: KABUL     Sahip: code-lead     Tarih: 2026-10-05
Karar: Bölüm durumu tek `Int32Array` tampon + kopyalama; 64 bit Zobrist karması isteğe bağlı hesaplanır. Alanlar: `filled`, `arrivedTurn`, `openShutterUntil` (`wrongOcc` türetilmiş, karmaya girmez).
Gerekçe: code-lead P-3. Solver/bot performansı, Geri Al ve belirlenimci devam.
Etkilenen: TECH §2

### D-053 — Şema kütüphanesi zod 4.6.5 (`zod/mini`)
Durum: KABUL     Sahip: code-lead     Tarih: 2026-10-05
Karar: Oyun ve araçlar tek şemayı paylaşır; `zod@4.6.5`, `zod/mini` (≈ 9,95 KB gzip).
Gerekçe: code-lead P-4; D-002'deki yığına ek.
Etkilenen: package.json (Faz 2 #1); TECH §8.2

### D-054 — Araçlar Node'un yerleşik TypeScript desteğiyle çalışır
Durum: KABUL     Sahip: code-lead     Tarih: 2026-10-05
Karar: `node tools/x.ts`, `.ts` uzantılı importlar, `erasableSyntaxOnly`; `tsx` bağımlılığı yok.
Gerekçe: code-lead P-5. Bağımlılık azaltma.
Etkilenen: `tsconfig.tools.json`; TECH §1

### D-055 — Bölüm şeması iyileştirmeleri
Durum: KABUL     Sahip: code-lead (şema) + product-lead (veri)     Tarih: 2026-10-05
Karar: `schemaVersion`; geçit tipleri ayrık birleşim; `build.elevator { range, start, dir }` ayrı alan; `debris[].segment`; kayar kapı `dir`; `drag.via`; GDD değer aralıkları (dilim 1–5, `carouselEvery` 2–6, `wetMoves` 1–5 …); genişletilmiş `tutorial[]` (`mode`, `highlight`, `hand`, `done`); `seed` isteğe bağlı, varsayılan `id × 1000 + id`.
Gerekçe: code-lead P-6; product-lead P-4, P-5.
Etkilenen: GDD §14, K-45; LEVELS; TECH §8.2

### D-056 — Sürükleme sırasında saha donuktur
Durum: KABUL     Sahip: code-lead (+ product-lead GDD K-08)     Tarih: 2026-10-05
Karar: Sürükleme sürerken yerçekimi ve komşu etkileri işlemez; hamle sonunda (K-35) çözülür.
Gerekçe: code-lead P-8; GDD K-08'de kabul edildi. Belirlenimcilik ve geri sekmenin başlangıç hücresine dönebilmesi.
Etkilenen: GDD K-08, K-17; TECH §4

### D-057 — Ses: gömülü ZzFX, parametreler tokens'ta
Durum: KABUL     Sahip: code-lead (motor), design-lead (parametreler)     Tarih: 2026-10-05
Karar: npm bağımlılığı yok; yalnız ZzFX `buildSamples` gömülür. Efekt parametreleri `tokens.json → audio.sfx.<ad>`; çok notalı sesler `audio.seq.<ad>: [startMs, params][]` tek arabellekte toplanır. 22,05 kHz mono, sahne bazında dilimli ön-çizim; kilitli bağlamda istek atılır.
Gerekçe: code-lead P-9, design-lead P-18 (`audio.seq` biçimi code-lead tarafından TECH §11.6'da onaylandı). Parametre sahipliği D-003 ile tutarlı.
Etkilenen: tokens `audio.*`; JUICE kural 6; TECH §11.6

### D-058 — Playwright önceden kurulu Chromium ile
Durum: KABUL     Sahip: code-lead     Tarih: 2026-10-05
Karar: `executablePath: /opt/pw-browsers/chromium`; `playwright install` çalıştırılmaz.
Gerekçe: code-lead P-10; ortam kısıtı.
Etkilenen: Playwright yapılandırması; CLAUDE.md

### D-059 — Solver yalnız Faz 3'te
Durum: KABUL     Sahip: code-lead     Tarih: 2026-10-05
Karar: Faz 2'de solver yazılmaz; LEVELS 1–5 el çözümleri golden test olur. Faz 3'te katmanlı A* + transpozisyon tablosu + budama (K-34, `via`, G-L) + beam yedeği tek seferde yazılır.
Gerekçe: code-lead P-11; entrepreneur önerisi (çift iş riski); −0,5 g. Faz 2 basit solver planı geri çekildi.
Etkilenen: TECH §9, §14.1–14.2; LEVELS §0

### D-060 — Bölüm başında prosedürel blok pişirme
Durum: KABUL     Sahip: code-lead (+ design-lead tarif)     Tarih: 2026-10-05
Karar: Bölümde geçen her (şekil × renk × bayrak) için Canvas2D `Path2D` ile bir doku + siluet dokusu bölüm başında pişirilir; hücre karosu yalnız plan hücreleri için; renk körü modunda yeniden pişirme. Oyun sırasında Filter/maske yok.
Gerekçe: code-lead P-14; R-05. Phaser 4'te RenderTexture/GenerateTexture yolu uygun değil; iç köşe ve parça düzeyi parlama 4-komşu maskeyle çizilemez.
Etkilenen: ART §3; ASSET §2; TECH §10.2

### D-061 — Faz 2 takvimi ≈ 6 hafta
Durum: KABUL     Sahip: code-lead (+ entrepreneur takvim)     Tarih: 2026-10-05
Karar: Faz 2 = 26,25 g net / 29,5 g tamponlu (≈ 6 hf; brif planı 4 hf; tampon ≈ %12, TECH §14'ün %20 hedefinin altında); Faz 2–5 toplamı 93,5 g net / 110 g tamponlu ≈ 22,0 hf (29,5 + 39 + 23,5 + 18), BUSINESS §10'un 22 haftasına payı kalmadan sığar. Alternatif: TECH §14.1 kesme seçeneği (giriş sahnesi, ek ekran profilleri/CVD, analytics genişlemesi Faz 4'e; 28,5 g tamponlu ≈ 5,7 hf). K-34, K-35, K-43 kesilemez. (2026-10-06: son tutarlılık ve senkron turlarından sonra güncellendi.)
Gerekçe: code-lead O-3; entrepreneur'ün %20 tampon isteği; K-34/K-35/devam/çapa işleri.
Etkilenen: TECH §14; BUSINESS §10
Onay: Proje sahibi, 2026-10-06 (önerilen yanıtla).

### D-062 — Test cihazları ve macOS derleme ortamı
Durum: KABUL     Sahip: code-lead + entrepreneur (bütçe)     Tarih: 2026-10-05
Karar: Faz 2 başında 1 düşük seviye (≤ 3 GB RAM, Android 10–12) ve 1 orta seviye Android test telefonu alınır (BUSINESS §10 bütçesinde ayrıca 1 düşük Android ve 1 eski iPhone); Faz 5 iOS için fiziksel Mac ya da bulut macOS CI (≈ $1.000, fiyat doğrulanmadı).
Gerekçe: code-lead P-22 (O-4); D-032 çıkış kapısı gerçek cihaz ister; Capacitor iOS derlemesi macOS gerektirir.
Etkilenen: TECH §10.7, §13, §14.1; BUSINESS §10
Onay: Proje sahibi, 2026-10-06 (önerilen yanıtla).

### D-063 — Hedef kitle: yetişkin casual oyuncu
Durum: KABUL     Sahip: entrepreneur     Tarih: 2026-10-05
Karar: Birincil kitle 25–54 yaş yetişkin casual bulmaca oyuncusu (çekirdek 35–54); oyun çocuğa yönelik değildir; BUSINESS §3'teki 15 koruma şartı (S1–S15) zorunlu; Play hedef yaşı 18+, Kids/Aile kategorisi yok.
Gerekçe: BUSINESS P-1; brif §15 varsayım 8'in teyidi. Çocuk kahraman COPPA/Play faktörlerini tetikler (R-01).
Etkilenen: ART, STORY, UX (yaş ekranı), STORE_LISTING, TECH (SDK başlatma sırası)
Onay: Proje sahibi, 2026-10-06 (önerilen yanıtla).

### D-064 — Monetizasyon modeli
Durum: KABUL     Sahip: entrepreneur     Tarih: 2026-10-05
Karar: IAP çekirdek + isteğe bağlı ödüllü reklam (3 yerleşim, ≤ 6/gün); geçiş ve banner reklam yok; ücretli rastgele öğe yok, sandık içeriği sabit ve önceden görünür, sandık satılmaz; tek para birimi altın; zamanlı satın alma teklifi MVP ve Aşama 1'de yok; günlük ödül kaçırılınca sıfırlanmaz.
Gerekçe: BUSINESS P-2 (R-15). Loot box ve karanlık örüntü düzenlemeleri; bulmaca türünde IAP ağırlığı.
Etkilenen: META; `economy.json`; UX; TECH §11

### D-065 — MVP kesme çizgisi ve B planı
Durum: KABUL     Sahip: entrepreneur     Tarih: 2026-10-05
Karar: BUSINESS §12.1 tablosu MVP sınırıdır (eklenenler: bölüm içi devam, `m = 0` cezasız çıkış, sahte servis arayüzleri, 1400 ms seçeneği, ilk +5 hediyesi; Usta Modu D-026'ya bağlı). Faz 3 iki haftadan fazla kayarsa B planı: önce S6 Asansör, gerekirse S5 Döner Platform kesilir (en çok 7 bölüm: 31, 34, 37, 39, 40, 48, 49; bölüm sayısı 50 kalır); G-L ayrı yedeği "yalnız yavaş düşüş" (23, 49). Soru: B planı tetiklenince proje sahibine yeniden sorulmadan uygulansın mı?
Gerekçe: BUSINESS P-7; code-lead §14.2 maliyetleri (S5 + S6 ≈ 2,5 g, G-L ≈ 1 g).
Etkilenen: BUSINESS §12; LEVELS §3; TECH §14.2
Onay: Proje sahibi, 2026-10-06 (önerilen yanıtla).

### D-066 — Soft launch planı ve karar kapıları
Durum: KABUL     Sahip: entrepreneur     Tarih: 2026-10-05
Karar: Aşama 0 web kapalı test (TR) → mağaza sürümü paketi (+1 hf) → Aşama 1 Android TR + Filipinler → Aşama 2 iOS + Android Kanada/Avustralya/Yeni Zelanda → Kapı 3 global (≥ 150 bölüm). Eşikler BUSINESS §8'de, test başlamadan sabitlenir. Takvim ≈ 43 hf; bütçe ≈ $277 bin (yalın senaryo ≈ $180 bin, tahmin).
Gerekçe: BUSINESS P-9; takvim ve bütçe proje sahibini bağlar.
Etkilenen: BUSINESS §8, §10; ANALYTICS; TECH §13
Onay: Proje sahibi, 2026-10-06 (önerilen yanıtla).

### D-067 — Paket kimliği ve kısa ad kuralı
Durum: KABUL     Sahip: entrepreneur + code-lead     Tarih: 2026-10-05
Karar: iOS bundle ID ve Android `applicationId` isim kararından sonra, ilk mağaza yüklemesinden önce kesinleşir; yalnız `[a-z0-9.]`, "kids/little/minik" içermez (`com.<şirket>.<ad>`); her dil için ≤ 12 karakter kısa ad; kod içi kimlikler (`minikusta.save`) kod adı olarak kalır.
Gerekçe: BUSINESS P-13; code-lead TECH §13'te kabul. Kimlik yayından sonra değişmez.
Etkilenen: NAMING §6.1; TECH §13; i18n `app.title`

### D-068 — Oyun adı (mağaza markası)
Durum: KABUL     Sahip: entrepreneur     Tarih: 2026-10-05
Karar: Aday sırası: 1 Lift & Land / Kaldır Kondur, 2 Hue Hill / Renktepe, 3 Hoppa Usta / Hoppa Builders (TR kullanıcı testi şartıyla). Öneri: tek global EN marka + TR mağazada Türkçe alt başlık. "Minik Usta" çalışma/kod adı olarak kalır. Paket kimliği için tüzel kişilik adı Faz 5'ten önce gerekir.
Gerekçe: NAMING §5–§6; entrepreneur kapanış soruları 3. "Little Builder" çakışması (R-03); "Minik" öneki çocuk sinyali.
Etkilenen: NAMING; ASSET `logo_wordmark`; STORE_LISTING; TECH §13
Onay: Proje sahibi, 2026-10-06 (önerilen yanıtla).

### D-069 — Kilitlenme denetimi D3'ün MVP kararı Faz 3'e bırakıldı
Durum: KABUL     Sahip: orkestratör (product-lead + code-lead)     Tarih: 2026-10-06
Karar: D3 (döşeme/erişim kilidi) MVP'de şimdilik isteğe bağlı kalır. Faz 3'teki solver taraması Zor/Çok Zor bölümlerde doğru yerleşim sonrası çıkmaz bulursa ya bölüm verisi düzeltilir ya D3 o bölümler için zorunlu yapılır; karar Faz 3 çıkışında verilir.
Gerekçe: F-3 taraması 1–9. bölümlerde D1/D2'nin kaçırdığı çıkmaz bulmadı; 10. bölümde yalnız gereksiz hamlelerden sonra 3 durum var. Proje sahibi önerilen yanıtı onayladı.
Etkilenen: GDD K-30, LEVELS §0/§5, TECH §9.7, §14.2

### D-070 — Sallanan Köprü ödül havuzu 6.500 altın
Durum: KABUL     Sahip: product-lead (+ entrepreneur)     Tarih: 2026-10-06
Karar: Havuz 10.000 (brif örneği) yerine 6.500 altın; bu bot modeliyle tavan 6.863. LiveOps temaları da bu tavanı aşamaz.
Gerekçe: D-024 etik kuralı — bitirene düşen beklenen pay her başlangıç bölümünde ilk +5 fiyatının (900) altında kalmalı. Proje sahibi onayladı.
Etkilenen: config/events.json `wobblyBridge.prizePoolCoins`, META §6, BUSINESS §4.5/§5.4/§7, UX §9

### D-071 — BRIEF §15 varsayımları onaylandı
Durum: KABUL     Sahip: orkestratör     Tarih: 2026-10-06
Karar: Varsayımlar 1–6 ve 8 olduğu gibi onaylandı. Değişikliklerle: 7 — botlar açıkça etiketli "Renkli Tepe çırakları" (D-023); 9 — TR + EN, "Minik Usta" yalnız kod adı, "Little Builder" kullanılmaz, mağaza adı D-068.
Gerekçe: Faz 1 onay paketi; proje sahibi Faz 1'i önerilen yanıtlarla onayladı ve Faz 2'yi başlattı.
Etkilenen: BRIEF §15, CLAUDE.md

### D-072 — Proje kendi reposuna taşındı
Durum: KABUL     Sahip: orkestratör     Tarih: 2026-10-07
Karar: Faz 2 sonunda proje, proje sahibinin açtığı `yilmazfatih-cyber/minik-usta` reposunun köküne taşındı (Deneme reposundaki `minik-usta/` klasörünün `7b9860f` commit'indeki izlenen dosyaları). Bundan sonra geliştirme bu repoda yapılır; Deneme'deki kopya Faz 0–2 geçmişi olarak kalır. GitHub Actions: `ci.yml` (`npm run check`) ve `pages.yml` (derleyip GitHub Pages'e yayınlar).
Gerekçe: Proje sahibi ayrı repo ve GitHub Pages yayını istedi (D-001'deki geçici çözüm). Ajan tanımları repo kökünde olduğu için Claude Code oturumlarında doğrudan görünür.
Etkilenen: D-001 (yerine geçer), CLAUDE.md, docs/BRIEF.md notu, .github/workflows/

### D-073 — Tam örtü ve kazanma (K-47, K-48)
Durum: KABUL     Sahip: orkestratör + product-lead     Tarih: 2026-10-07
Karar: Her bölümde renk başına blok arzı = plan talebi; şaşırtma blok yok; kazanma = bütün dilimler + ek hedefler tamam ve sahada/kuyrukta/elde malzeme bloğu kalmamış. Plan şantiyeyi tam kaplar (`.` yok; S2 Plan Boşluğu "Sonra").
Gerekçe: Proje sahibinin Faz 2 geri bildirimi (R2-01): "bölüm sonuna tüm bloklar kullanılmış olmalı", "alan sürekli doldurulmalı".
Etkilenen: GDD K-15, K-27, K-28, K-47, K-48; OBSTACLES S2; LEVELS

### D-074 — Değişken boyut ve saha doluluğu (K-49, K-02)
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-07
Karar: Saha Wy×Hy ve şantiye Ws×Hs bölüm verisidir (Wy+Ws ≤ 8, H ≤ 8). Saha boş hücresi 2 ≤ E ≤ ⌊0,4·C⌋. Bölüm 1–10'da saha 4×4…6×5; 6×8 Faz 3'ün çok dilimli bölümlerine kalır.
Gerekçe: R2-02: proje sahibi "bu 2 değişken olabilir" dedi; tam örtüde kaydırma alanı gerekir.
Etkilenen: GDD K-01…K-05, K-49; LEVELS; UX §5.8

### D-075 — Kilitlenme kurtarması Söküm (K-30)
Durum: KABUL     Sahip: product-lead + entrepreneur     Tarih: 2026-10-07
Karar: Tam örtüde çıkmaz oluşabilir. D1 yeniden dizme; D2/D3 (D3 MVP'de zorunlu) tespit edilince son yerleşim tek adımda geri alınır (Söküm), harcanan hamle iade edilmez. Kamyon Yardımı blok yaratmaz; yeniden kesme yok.
Gerekçe: Tasarlanan bulmacayı bozmadan oyuncuyu kurtarır; product-lead ve entrepreneur aynı görüşte. Proje sahibine bilgi olarak sunulur.
Etkilenen: GDD K-30, K-35 adım 12; TECH §2R; ANALYTICS v6

### D-076 — Tam örtüyle uyumlu güçlendiriciler ve fiyatlar
Durum: KABUL     Sahip: product-lead + entrepreneur     Tarih: 2026-10-07
Karar: Çekiç yalnız engelleri kırar (K-36); Altın Mala sahadaki bloğu doğru yerine koyar (K-33); Boya Fırçası eşit hücreli iki bloğun rengini takas eder (K-38); Vinç genişlik ≤ Ws (K-37). Fiyatlar: Boya Fırçası 450, Mala Başlangıcı 450, Çekiç 600; bant kuralı: oyun öncesi ≤ 180, bölüm içi 150–450 altın/hamle, 150'nin katları.
Gerekçe: R2-05: malzeme yaratan/yok eden her sistem tam örtüyü bozar.
Etkilenen: GDD K-33, K-36…K-38, K-54; META; economy.json; BUSINESS

### D-077 — Galibiyet serisi kademeleri
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-07
Karar: Kademe 2 = +1 mala +1 hamle; kademe 3 = +1 mala +2 hamle; her kademe 5 hamleden az.
Gerekçe: Mala değeri ≈ 2,5 hamleye çıktı (yeni K-33).
Etkilenen: META §5, economy.json v3

### D-078 — Engel yeniden tanımları
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-07
Karar: Y5 Ağır Yük (I5/Q9, renksiz, malzeme değil, sahada kalabilir, havaya kalkmaz); S4 moloz renkli malzeme bloğu; S2 Sonra; S9 Geniş Şantiye Faz 3 (ilk bölüm 12).
Gerekçe: R2-01/R2-05 uyumu.
Etkilenen: OBSTACLES, GDD K-44/K-48

### D-079 — Bölüm 1–10 öğretim sırası
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-07
Karar: 1 kaldır–taşı–indir, 2 şekil/gölge, 3 kazı, 4 W1, 5 S1, 6 W2, 7 taşınan malzeme, 8 Y5 + Çekiç, 9 W3, 10 final + Vinç.
Gerekçe: R2-03/R2-06: kazı ve kaydırma en geç Bölüm 3'te başlar.
Etkilenen: LEVELS §2

### D-080 — Hamle bütçesi formülü (K-52)
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-07
Karar: moves = min + T + a; T: Kolay max(6,⌈0,5·min⌉), Normal max(4,⌈0,35·min⌉), Zor max(3,⌈0,2·min⌉), Çok Zor max(2,⌈0,12·min⌉); |a| ≤ max(1,⌊0,1·min⌋). Tanıtım bölümünün tamponu bir alt zorluktan alınır.
Gerekçe: R2-04: hamle sayısı solver'ın en kısa çözümünden türetilir.
Etkilenen: GDD K-52, LEVELS

### D-081 — Bulmaca zorunlulukları (K-50, K-51)
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-07
Karar: id ≥ 3: ilk gereken blok başta tutulamaz (firstNeedDepth ≥ 1) ve en kısa çözüm en az 1 kaydırma içerir; Kolay/Normal'de ✓-tuzağı yasak. Ölçütleri solver hesaplar.
Gerekçe: R2-03: "ihtiyacımız olan blok direkt en üstte olmamalı, diğer blokları kaydırmalıyız".
Etkilenen: GDD K-50, K-51; TECH §2R solver

### D-082 — Hafif öğretici (K-53)
Durum: KABUL     Sahip: design-lead + product-lead     Tarih: 2026-10-07
Karar: Karartma, spot ışığı ve girdi kilidi yok; el animasyonu + kenarda balon; bölüm başına ≤ 2 yumuşak adım; balon ≤ 6 kelime; 4 sn hareketsizlik kuralı. Anahtarlar mekanik bazlı `tut.m.*`; adım verisinin tek kaynağı bölüm JSON `tutorial[]`.
Gerekçe: R2-10: "öğretici ekranı tüm oyunu kaplıyor".
Etkilenen: GDD K-53, UX §13, STORY §6A, tokens.tutorial

### D-083 — Görsel dil v2
Durum: KABUL     Sahip: design-lead     Tarih: 2026-10-07
Karar: Taban renk hex'leri ve renk körü sembolleri korunur; şeker blok (yastık, parlama, yan duvar) + hücre başına tek büyük çıkıntı; çivit oyun zemini; hacimli kit (kontur + alt kalınlık); kalın beyaz yazı + koyu kontur. Hedef ifade: "yetişkin casual oyuncu için premium casual; çocuksu değil".
Gerekçe: R2-07 ve proje sahibinin referans ekranları (R2-12); referanstaki 2×2 küçük çıkıntı özgünlük için alınmadı.
Etkilenen: ART_DIRECTION v2, tokens.json blockV2/kit

### D-084 — Görseller kendi çizimimiz: SVG + prosedürel
Durum: KABUL     Sahip: orkestratör     Tarih: 2026-10-07
Karar: Canva ve üretken yapay zekâ servisleri kullanılmaz. Karakter, arka plan, simge ve logo `public/art/**` altında design-lead'in SVG'leridir; blok, düğme, panel prosedüreldir. Bütçe: indirme ≤ 900 KB, doku belleği ≤ 64 MB. Proje sahibinin referans görüntüleri (başka bir ticari oyun) yalnız stil kılavuzudur, kopyalanmaz, repoya girmez. Mağaza sürümünde insan sanatçı kararı Faz 5'e kadar açık (P-15).
Gerekçe: Proje sahibi "canvayı boşver, bu görsellerden oluştur" ve "en ucuz/ücretsiz" dedi; telif ve mağaza riski.
Etkilenen: R2-08, R2-12, CLAUDE.md sahiplik, ASSET_LIST §16, TECH §2R.6

### D-085 — Uyarlanır hücre boyu 120–144 px
Durum: KABUL     Sahip: code-lead + design-lead     Tarih: 2026-10-07
Karar: R2-02'deki "hücre 120 px korunur" = en az 120 px; tahta izin verirse 144 px'e kadar büyür (tokens layout.adaptive.cellMaxPx).
Gerekçe: Küçük tahtalarda (4×4) boş alan ve dokunma alanı.
Etkilenen: UX §5.8, TECH §2R, tokens

### D-086 — Faz 2R uygulama düzeni
Durum: KABUL     Sahip: orkestratör     Tarih: 2026-10-07
Karar: İki kod şeridi: çekirdek + araç (A→B/C→D→P→E→M→K) ve görünüm + meta (F, J, G, H, I, L, O); paketler ayrık dosya alanlarında. Bölüm 1–10 JSON'ları product-lead tarafından solver ile yazılır.
Gerekçe: Kritik yolu kısaltır; ek ücret yok.
Etkilenen: TECH §2R.12

### D-087 — Tuna'nın görsel yaşı
Durum: KABUL     Sahip: design-lead     Tarih: 2026-10-07
Karar: Çizimlerde 10–12 yaş görünümü; yaş hiçbir metinde geçmez (D-044). Proje sahibi itiraz ederse değişir.
Gerekçe: Çocuk ürünü izlenimini azaltır (BUSINESS S8).
Etkilenen: ART §11.1, public/art

### D-088 — Faz 2R dilim kapsamı
Durum: KABUL     Sahip: product-lead     Tarih: 2026-10-07
Karar: Dilimde görev sistemi yok, mağaza kilitli, yalnız Bölüm 10 sandığı; ana sayfa ilerlemesi = tamamlanan bölüm, her kazanma yapıya bir kat ekler; 10'dan sonra 1–10 tekrar döngüsü.
Gerekçe: Dikey dilimi küçük tutar; meta Faz 4'te.
Etkilenen: META §10, UX §3

### D-089 — Erken kayıp penceresi
Durum: RET     Sahip: product-lead     Tarih: 2026-10-07
Karar: Hamle bitmeden "kazanamazsın" penceresi açılmaz.
Gerekçe: Kazanma hâlâ mümkünken yolu kesebilir ve +5 teklifini öne çekerek satış baskısı yaratır (R-15).
Etkilenen: DL-2R-13

### D-090 — Faz 2R solver turu: Söküm'süz çıkmaz kapısı ve teslimat adaleti
Durum: KABUL (orkestratör, 2026-10-08)     Sahip: product-lead (kural) + code-lead (araç)     Tarih: 2026-10-07
Karar: (1) D3b tablosu olmayan bölümde solver'ın bütün keşif uzayında D1/D2/D3a'nın yakalamadığı çıkmaz durum olamaz (GDD K-51 madde 2, error). (2) Çok dilimli bölümde en kısa çözüm gelecek kamyon partisini bilmeyi gerektiremez: önsezi kazancı ve şans farkı 0 (GDD K-51 madde 5, warn `delivery_foresight`). (3) Bölüm 4, 5, 7, 10 bu kurallar ve "Bölüm 4'ten itibaren en az 2 kazı" ile yeniden tasarlandı; Bölüm 10'un bilinçli kamyon kuyruğu kaldırıldı (LEVELS §2.11).
Gerekçe: Eski Bölüm 10'da `trapCount` 0 iken 338 Söküm'süz çıkmaz vardı (WP-E); kamyon içeriği oyuncuya gösterilmediği için önsezi isteyen en kısa çözüm "bilgi gizlenmez" ilkesini bozar.
Etkilenen: GDD K-51, K-50 madde 8, E-54; LEVELS §2.0 madde 9–11, §2.11; tools/solver (code-lead)

### D-091 — Unity taşıması: mevcut mekanik birebir, match-3 yok
Durum: KABUL     Sahip: proje sahibi + orkestratör     Tarih: 2026-10-30
Karar: Minik Usta Unity 6 (URP) ile yeniden yazılır; blok yerleştirme mekaniği, 10 bölüm, çözücü ve K-01…K-54 kuralları birebir taşınır. Brifteki match-3 maddeleri (takas, eşleşme, cascade, refill, booster oluşumu, ipucu) karşılıklarına çevrilir: sürükleme hissi, kötü geçiş geri sekmesi, şantiye düşüşü squash & bounce, kilit parlaması, Altın Mala kazanımı, kamyon teslimatı, takılma nabzı, kalan blok çipine uçuş, Bonus İnşaat.
Gerekçe: Brif 'mevcut davranışı birebir taşı' der; proje sahibi raporun 1. seçeneğini onayladı (docs/UNITY_PORT_FAZ1.md §4/1).
Etkilenen: Unity çekirdeği, UX, JUICE eşlemesi

### D-092 — Kahraman Tuna kalır
Durum: KABUL     Sahip: proje sahibi     Tarih: 2026-10-30
Karar: Unity sürümünde kahraman Tuna'dır (D-044, D-087); brifteki 'genç kral' uygulanmaz. Bloklu, eklemli oyuncak figür stili Tuna'ya uygulanır (parça adlandırma sözleşmesi Unity reposunda).
Gerekçe: Hikâye, kasaba, 41 SVG ve karakter kararları korunur; kral kahraman Royal Match benzerliği riski taşırdı (R2-13).
Etkilenen: STORY, ART_DIRECTION §11, Unity karakter prefab'ı

### D-093 — Unity derleme ve test yeri
Durum: KABUL     Sahip: proje sahibi + code-lead     Tarih: 2026-10-30
Karar: Çekirdek saf C# (UnityEngine bağımlılığı yok) olduğu için bulut oturumunda .NET SDK + NUnit ile derlenir ve test edilir; aynı test dosyaları Unity Test Framework (EditMode) altında da çalışır. Görünüm katmanı (URP, DOTween, TMP) proje sahibinin Unity kurulumunda derlenir; sonuç bu oturuma bildirilir.
Gerekçe: Bulut konteynerinde Unity Editor yok; Remote Control bağlı klasör yok.
Etkilenen: Unity repo yapısı: Assets/MinikUsta/Core (asmdef) + dotnet/ çözümü aynı .cs dosyalarını derler

### D-094 — Unity projesi ayrı repoda; Phaser görsel v3 dondurulur
Durum: KABUL     Sahip: proje sahibi + orkestratör     Tarih: 2026-10-30
Karar: Unity projesi `yilmazfatih-cyber/minik-usta-unity` reposunda yaşar. Web (Phaser) sürümü `main` = de6f16c olarak yayında kalır; görsel v3'ün kalan paketleri (C, D, eleştiri turları) web'de yapılmaz, stil kitabı (ART_REFERENCE) ve SVG'ler Unity'de kullanılır. `wip/phase-2r` dalı A/B paketleri ve C'nin yarımıyla arşiv olarak kalır.
Gerekçe: Kredi ve süreyi tek hedefe toplamak; Unity projeleri web reposunu büyütür.
Etkilenen: CLAUDE.md (Unity repo notu), TECH_DESIGN, BUSINESS takvimi (entrepreneur güncellemesi bekler)

### D-095 — Model dağılımı: orkestratör yönetir, işi diğer modeller yapar
Durum: KABUL     Sahip: proje sahibi + orkestratör     Tarih: 2026-10-31
Karar: Orkestratör (Fable) planlar, iş akışlarını kurar, sonuçları birleştirir ve kararları yazar; ajan işleri ihtiyaca göre dağıtılır: zor/kesin kod taşıma, şüpheci inceleme ve mimari → Opus; orta ölçekli uygulama, düzeltme turları, belge ve test yazımı → Sonnet; mekanik işler (kopyalama, biçimlendirme, basit kontrol) → Haiku. Her Workflow ajanında `model` açıkça verilir; Fable yalnız orkestrasyon için kullanılır.
Gerekçe: Proje sahibi isteği ("tüm her şeyi Fable'la yapma; işi Opus/Sonnet/Haiku yapsın, Fable yönetsin"); kullanım sınırlarını ve maliyeti dengeler.
Etkilenen: bütün sonraki Workflow betikleri; Unity Faz 2 P3–P6 (Opus/Sonnet)

### D-096 — Unity Faz 2 kabul; Faz 3'te yerleşik tween (DOTween sonra)
Durum: KABUL     Sahip: proje sahibi + orkestratör     Tarih: 2026-10-31
Karar: Unity Faz 2 (saf C# çekirdek) kabul edildi: 1455 test yeşil, 10/10 altın eşdeğerlik, 10 374 eylemlik TS-kâhinli fuzz'da 0 sapma, 76/76 kural kapsamı (minik-usta-unity `docs/PHASE2_REPORT.md`). Faz 3 başlar. Brifteki DOTween yerine bağımlılıksız yerleşik tween (easing + sekans, Presentation.Core'da motor-bağımsız) kullanılır; DOTween'e geçiş tek adaptörle sonraya bırakılır. Metin için yer tutucu aşamada uGUI `Text` (LegacyRuntime fontu); TextMeshPro + Baloo 2 Faz 4'te, TMP kaynakları projeye eklendiğinde. Bölüm JSON'ları `Resources/levels` olarak gömülür (WebGL'de StreamingAssets dosya okuması çalışmadığı için).
Gerekçe: DOTween Asset Store'dan elle indirilir, CI'da kurulamaz; Pages'te hemen oynanabilir olmak öncelik. Proje sahibi onayladı.
Etkilenen: minik-usta-unity Assets/MinikUsta/Presentation*, docs/CI.md, D-093

### D-097 — Unity Faz 3 kabul (2026-11-01)
Durum: KABUL. Faz 3 (Q0–Q5, Unity reposu commit 5c15573) kabul edildi: motor-bağımsız sunum çekirdeği (tween, planlayıcı, yerleşim, sürükleme),
oynanabilir yer tutucu tahta, his katmanı, şüpheci inceleme (18 bulgu; 1 Engel + 4 Önemli kapatıldı) ve belgeler. Unity Editor / GameCI doğrulaması lisans
gizli değerleri (UNITY_EMAIL, UNITY_PASSWORD, UNITY_LICENSE) girilince yapılır; Öneri düzeyi bulgular (P3-06…P3-18) Faz 4–5'te ele alınır.

### D-098 — Program yönetimi: orkestratör yalnız yönetir, fazlar otonom, Royal Match çıtası (2026-11-01)
Durum: KABUL. Proje sahibi talimatı ("fable sadece ceoluk yapsın… royal match seviyesinde… geri kalan işleri opus sonnet haiku yapsın"): orkestratör (Fable)
yalnız planlar, dağıtır, inceler ve karar yazar; tüm üretim işi Opus (mimari, zor port, şüpheci inceleme, sanat yönü), Sonnet (uygulama, düzeltme) ve Haiku
(belge, kopya, mekanik iş) ajanlarına gider (D-095'i genişletir). Faz sonunda onay beklenmez: faz raporu yazılır, bir sonraki faz başlar. Durma koşulları yalnız
proje sahibine bağlı girdiler (Unity lisans gizli değerleri, mağaza hesapları, imza anahtarları, ücretli hizmetler) ve geri alınamaz dış eylemlerdir. Kalite çıtası:
ART_REFERENCE §10 rubriğinde her ekranın her boyutu ≥ 4/5 (iki bağımsız puanlayıcı), CLAUDE.md "Bitti tanımı", R2-12/R2-13 sınırları (referanslar yalnız stil
rehberi), ücretsiz ve üretken yapay zekâsız görsel üretim. Program: Faz 4 görsel ve his yükseltmesi (Unity); Faz 5 içerik ve meta (50 bölüm, 5 hikâye bölümü,
kasaba, ekonomi, 2 etkinlik, sahte mağaza); Faz 6 yayın hazırlığı (performans, Android/WebGL derlemeleri, mağaza metinleri, gizlilik).


### D-099 — Sabit saha ve bulmaca zekâsı (K-55) (2026-11-02)
Durum: KABUL     Sahip: code-lead (Unity A3 ile eşleştirildi)     Tarih: 2026-11-02 (kayıt: 2026-11-09)
Karar: `schemaVersion` 2 bölümünde bütün bloklar baştan sahadadır; dilim geçişinde sahaya yeni parti ya da kamyon dolumu gelmez. D1 yeniden dizme kalktı (D1 → zincir/ıslaklık; hâlâ D1 ise Söküm `access`). `RULES_VERSION` 3. `schemaVersion` 1 (Faz 2R arşivi) verisi K-25…K-27 ile oynanmaya devam eder.
Gerekçe: Unity taşıması (D-091) ile web kuralının aynı kaynaktan ilerlemesi; kural metni GDD K-55'tedir.
Etkilenen: docs/GDD.md §16 (K-55), docs/TECH_DESIGN.md, minik-usta-unity README (Bağlayıcı kararlar tablosu)

### D-100 — 3B görsel dil: prosedürel model, ön-render sprite, 2.5B tween (2026-11-01)
Durum: KABUL     Sahip: design-lead (sözleşme), code-lead (teknik sanat)     Tarih: 2026-11-01 (kayıt: 2026-11-09)
Karar: Unity sürümünün görsel dili 3B'dir ama oyun 2.5B'de kalır: modeller Blender 4.0.2 bpy ile prosedürel üretilir, Cycles (CPU) ile ön-görüntülenip sprite ve kare dizisine çevrilir; Unity'de sprite + 2.5B tween kullanılır. Üretim ücretsiz ve açık kaynak araçlarla yapılır; üretken yapay zekâ kullanılmaz (ART_REFERENCE §11, R2-13). Kare adları, pivotlar ve atlas.json biçimi değişmez (ART_UNITY §3).
Gerekçe: Kalite çıtası (ART_REFERENCE §10) ile sınırlı bütçe arasında en ucuz yol; çalışma zamanında 3B motor yükü yok (60 FPS hedefi, brif ilke 6).
Etkilenen: docs/ART_REFERENCE.md, docs/ART_UNITY.md (3B sürüm notu), minik-usta-unity docs/ART_3D.md, art/3d/**

### D-101 — Usta Kral (maskot) (2026-11-01)
Durum: KABUL     Sahip: design-lead     Tarih: 2026-11-01 (kayıt: 2026-11-09)
Karar: Usta Dede'nin yerini özgün, baretli bir Usta Kral alır; ana sayfanın ana sembolü, bölüm ekranının köşesinde Tuna'nın yerindedir ve pencerelerde (başlangıç, kazanma, teklif, çıkış onayı) tepki verir. Öğretici balonunun portresi kralın konuşan büstüdür. Royal Match kralı kopyalanmaz; yalnız arketip ve kalite alınır.
Gerekçe: Kahraman Tuna kalır (D-092); maskot ayrı bir karakterdir ve metinler i18n'dedir (`lose.offer.gift` ve prolog konuşmacısı Usta Kral). STORY'deki yaklaşık 8 Usta Dede kalıntısı design-lead'de açıktır (REVIEW_PHASE4B P4B-07).
Etkilenen: docs/STORY.md, docs/JUICE.md (#21c), src/i18n/*.json, minik-usta-unity art/3d/spec/king.md

### D-102 — Bölümler v3: daha çok blok, yeni şekiller ve blok özellikleri; zorluk bandı sahibinin sınırıyla
Durum: KABUL     Sahip: proje sahibi + orkestratör (code-lead uygulaması)     Tarih: 2026-11-09
Karar: (1) Proje sahibinin 2026-11-08 isteği kabul edildi: "daha çok blok, daha farklı şekil ve özellik, uğraşılabilir ama abartısız". Bölümler v3 yayın kaynağı web `levels/` (701b8f3): 10 bölüm, blok sayısı 8, 8, 9, 10, 12, 14, 13, 14, 14, 16 (toplam 118; bugün 70). Yeni şekiller: L4/J4 (Bölüm 2), C3 kendi açılışıyla, T4 (6), I3 (8); şekil kuralı GDD §16 K-56 (ÖNERİ → KABUL). Yeni blok özellikleri: iki renkli Y9 (5), sargı ve makas Y11 (7), bonus Y12 (9), kaygan Y13 (8). Palet Y10 yayınlanan hiçbir bölümde yok; K-58 madde 9 açık.
(2) GDD §16 K-56…K-66 etiketleri ÖNERİ'den KABUL'a alındı. Bu tek etiket değişikliği code-lead tarafından yapıldı (GDD product-lead dosyasıdır; product-lead'in sonradan bakması beklenir). K-30 D1 genişlemesi ve §16 "v3 kenar durumları" ÖNERİ olarak kalır. `### K-xx` başlığına terfi ve TECH §12.4 satırları açık iş olarak kalır.
(3) Zorluk bandı proje sahibinin sınırında tutulur: yalnız Bölüm 10 Zor; Bölüm 1 için 6–8 blok hedefi 8 ile karşılandı; Bölüm 10 için 16–22 hedefi 16 ile alt sınırda karşılandı (`min` 20). Toplam 124 hedefi 118 ile tutturulamadı (kalan fark ve gerekçe: docs/LEVELS_V3_REPORT.md, Unity deposu).
(4) Kabul edilmeyenler ve açık sorular: P-G1-1 ve P-E2-1 ÖNERİ olarak kalır. `min` değerleri Bölüm 3–10 için çözücünün en iyi bulduğu değerdir (kanıtlanmamış; yalnız Bölüm 1, 2, 7 kanıtlı); Bölüm 5'te 182 örnekten 1 tane D1/D2/D3a'nın yakalamadığı çıkmaz durumu bulundu (tahmini %0,01, kanıt değil). Bot ölçümü (`tools/playtest-bot.ts`) yok: `levels:check` bu adımı atlar.
Gerekçe: Proje sahibi isteği; kapılar yeşil (web `npm run check` 2180 test geçti, `levels:check` 10/10 çözüldü, 0 hata; Unity `dotnet build -warnaserror` 0 uyarı, `dotnet test` 586 + 2023 geçti). Ölçü ve çekirdek sapması kanıtları: web docs/LEVEL_REPORT.md ve Unity docs/REVIEW_LEVELS_V3.md.
Etkilenen: docs/GDD.md §16 (K-56…K-66 etiketleri), docs/LEVELS.md §8 (v3 tasarımı), docs/OBSTACLES.md (Y9…Y13), levels/level_001…010.json (Bölüm 1 schemaVersion 2; 2–10 schemaVersion 3), config/economy.json (Çekiç unlockLevel 10), minik-usta-unity Resources/levels (aynı veri)

### D-103 — Geniş şantiye: Bölüm 6–10'da üç sütun (2026-11-09)
Durum: KABUL     Sahip: proje sahibi + orkestratör (code-lead uygulaması)     Tarih: 2026-11-09
Karar: Bölüm 6–10'da (ve ileride zor bölümlerde) şantiye 3 sütun olur; amaç 18–22 blok. Bu K-49'un Wy + Ws ≤ 8 sınırını değiştirir: `Wy + Ws ≤ 9` (6×N saha + 3 sütun = 9 sütun). Bölüm 1–5 2 sütunlu kalır (öğrenme eğrisi). Yerleşim: 1080 px genişlikte 9 sütun, duvar 54 px, hücre 108 px, kenar boşluğu 27 px; hücre hiçbir zaman 100 px'in altına inmez (dokunma hedefi korunur). Artı/çapraz ve S4/Z4 şekilleri 3 sütunlu şantiyede serbesttir (K-56 D-103 eki).
Gerekçe: Proje sahibinin 2026-11-09 kararı; "daha çok blok" isteğinin geometrik karşılığı. Geometri sınırı için K-49 ve K-56 güncellendi.
Etkilenen: docs/GDD.md §16 (K-49, K-50, K-56), docs/LEVELS.md §8.14, src/core (MAX_COLS 9), levels/level_006…010.json, minik-usta-unity BoardLayout (WideBoardCellPx 108)
Not: Bölüm 6–10 blok sayıları (17/18/18/17/19) D-103'ün 18–22 amacının altında kaldı; nedeni 6×8 sahanın D2_90 paletiyle sınırlı alanı. Proje sahibinin kararı bekleniyor (P-P3-1).

### D-104 — Palet: katman yalnız şantiyeye bırakılır (2026-11-09)
Durum: KABUL     Sahip: proje sahibi + orkestratör (code-lead uygulaması)     Tarih: 2026-11-09
Karar: Y10 palet özelliği yayına girer; K-58 madde 9 geçerlidir. Paletten kaldırılan katman YALNIZ şantiyeye bırakılabilir; sahaya park edilemez. Doğru bırakma şantiyede normal yerleşir; yanlış bırakma 1 hamlelik maliyetle katmanı kendi paletine üst katman olarak geri döndürür (kombo serisi sıfırlanır). Sahada, avluda, avluyu üstten geçen havada, duvar üstünde ya da vinç alanında bırakma 0 maliyetle iptal olur (`cancelled{reason:'palletSiteOnly'}`). En az 2 bölümde palet kullanılır (Bölüm 7–10'da var); tanıtım Bölüm 7'de Normal zorlukta verilir.
Gerekçe: Saha daralması ve çıkmaz riski (B1 bulgusu) ortadan kalkar. Hikaye 1'de palet yalnız yere basar (`pallet_not_grounded`); palet şekli D2_90 (ÖNERİ P-P3-1, proje sahibinin onayını bekler).
Etkilenen: docs/GDD.md §16 (K-58 madde 9–10), docs/OBSTACLES.md (Y10), src/core/movement.ts, levels/level_007…008.json

### D-105 — Bonus: yalnız ödül anı (k = 0) (2026-11-09)
Durum: KABUL     Sahip: proje sahibi + orkestratör (code-lead uygulaması)     Tarih: 2026-11-09
Karar: Y12 bonus blok yalnız ödül anıdır; hamle bütçesi bonusa göre düşürülmez (k = 0 her zaman). Doğru yerleşince +2 hamle eklenir ve HUD'da "+2" patlaması gösterilir (ses + kral kısa sevinç; ≤ 900 ms, girdi asla engellenmez). Vinç ve Altın Mala yerleşimleri de bonus kazanır. Olay: `movesChanged{reason:'bonus', delta, pieceId}`.
Gerekçe: Bonusun bütçe baskısı yaratmaması (brif ilke 5: süre baskısı yok); K-62 bu hâliyle kesinleşir. Bonus ilk kez Bölüm 10'da, `teaches` olmadan görünür (K-60 madde 6).
Etkilenen: docs/GDD.md §16 (K-60 madde 6–7, K-62), docs/OBSTACLES.md (Y12), src/core (bonus olayı), tools/levels-gen (bot oranları bonusla ölçülür)

### ÖNERİ P-A2-1 — Bölüm 10 iki katlı; üç kat, Ağır Yük ve takas tuzağı U-4 sonrasına (product-lead, 2026-11-02)
Durum: ÖNERİ. D0 eğrisi (LEVELS §6.6) Bölüm 10'u 6×8 saha, üç kat ve `Q9` ile tanımlıyordu; bugünkü tam tarama bu
uzayı bitiremez (`scan_incomplete`, error; 5×6 üç kat yedeği de > 2,5 M durum). A2'de Bölüm 10, 4×5 sahada iki katlı
bir yeniden dizme bulmacasıdır (`min` 13, `ahaMin` 1, P = 1 ile açgözlü oyun kazanamaz). Üç katlı final, Ağır Yük'ün iki
kez kayması (T9) ve takas tuzağı (T10) LEVELS §7 U-4 (makro çizge) geldiğinde Bölüm 15'te (Zor) kullanılır. Gerekçe:
bilgi gizlenmez ve her bölüm solver kanıtlı olmalı (brif ilkesi 5, K-51 madde 7).

### ÖNERİ P-A2-2 — Normal bütçe payı P = 2 kalır; bot ölçümüyle yeniden bakılır (product-lead, 2026-11-02)
Durum: ÖNERİ. D-099 bütçesinde Normal P = 2 iken Bölüm 5, 7, 9'da bekletmeyi ya da yer açmayı kaçıran açgözlü oyuncu
1–3 fazla hamleyle yine kazanır (`greedyWin` 1,00); aha anı kazanmayı değil payı belirler. Orta bot (WP-N) gelince bu
bölümlerde kazanma oranı %80'in üstündeyse önce `a` ve bulmaca ayarı, sonra Normal P'nin 1'e indirilmesi değerlendirilir
(K-52 tablosu, entrepreneur ile birlikte; ekonomi ve +5 talebi etkilenir).

### ÖNERİ P-F1-1 — Tablo B'nin ölçeğe bağlı sütunları revize edilir; Normal P = 2 kalır (code-lead, 2026-11-02)
Durum: ÖNERİ (P-A2-2'yi ölçümle tamamlar; karar product-lead + orkestratör, proje sahibine "Bölüm 1–9 açgözlü oyunla
kazanılabilir" açıkça sorulur). Ölçüm (LEVELS §6.11, `levels:solve`, beceri botu vekili ε 0,12, Bölüm 1–10 orta-bot hedefleriyle
kalibre): Normal P 2 → 1, Bölüm 5 ve 7'de orta vekil kazanma oranını 0,72/0,73'ten 0,51/0,52'ye indirir (hedef %65–80) ve Normal
bütçesini Zor ile eşitler; bu yüzden **P = 2 kalır**. Bölüm 10 `moves` 14'te 0,41 (hedef %40–55), 15'te 0,62: `a` = 0 kalır. Tablo B'nin
`min`, `maxCover`, `forced`, `parkSlack` sütunları bugünkü ölçek sınırında (A2: 4×5–6×5 saha, 7–8 blok, U-4 yok) tutturulamaz;
`greedyWin` neredeyse ikilidir (0 ya da 1) ve Tablo B'nin ara bantlarını (0,30–0,85) üretemez. Öneri: (1) `greedyWin` sütunu
`greedyExcess > P` (açgözlü en iyi yolda bile kaybeder) ya da beceri botu bandı olarak yeniden tanımlanır; (2) ölçek sütunları
Bölüm 1–4 için revize edilir; (3) Bölüm 5, 7, 10 U-4 (makro çizge) sonrası Tablo B'ye çekilir. O güne kadar `puzzle_greedy_easy`
uyarıları (Bölüm 5, 7) bilinçli ve görünür kalır. Yazıldığı yer: `docs/LEVELS.md` §6.11.

### ÖNERİ P-G1-1 — Bölümler v3: yeni şekiller, dört blok özelliği, blok kütlesi, eski mekanikler Hikaye 2'ye (product-lead, 2026-11-08)
Durum: ÖNERİ. Proje sahibinin 2026-11-08 isteği ("daha çok blok, daha farklı şekil ve özellik, uğraşılabilir ama
abartısız") üzerine: (1) Hikaye 1'de L4/J4 (2), T4 (6), I3 (8) dikey yönelimleriyle açılır (GDD ÖNERİ K-56; K-44
tablosu değişir); (2) dört blok özelliği: Y10 Palet (3), Y9 İki Renkli (5), Y11 Sargı + Makas (7), Y12 Bonus (9); Y13
Kaygan Hikaye 2'de (13) (GDD ÖNERİ K-57…K-61, OBSTACLES v3); (3) blok sayısı 8 → 16 (toplam 70 → 124), `min` ≤ 20,
Bölüm 10 Zor kalır (testere dişi), puan bandı LEVELS §8.6; (4) W1 → 11, W2 → 12, Y5 → 14, W3 → 16, S9 → 18; (5) hamle
bütçesine bonus eki (ÖNERİ K-62) ve döşeme ailesi uyarısı (ÖNERİ K-63). Gerekçe: oyun testi raporu
`docs/review_inbox/levels-v3-playtest.md` (%70 yatay domino, %96 tek renkli plan satırı, `greedyWin` 1–9'da 1,00).
Bağımlılık: code-lead U-v3-0…4 (LEVELS §8.10; önce D3a tamlık hatası H1), design-lead 6 kaplama karesi ve 6 öğretici
anahtarı (§8.9). Açık sorular LEVELS §8.11.
**G1b revizyonu (product-lead, 2026-11-08; design-lead incelemesi DL-V3-01…22):** (a) Hikaye 1'de palet tek tiplidir,
karışık palet Hikaye 2'de gözetleme + sonraki katman kenarıyla (ÖNERİ K-65 madde 1); (b) iki renkli bloklar yalnız W–Y,
R–Y, W–G, G–Y (K-65 madde 3); Bölüm 4, 7, 9, 10 birebir renk eşlemesiyle yeniden renklendi; (c) Bonus Hikaye 1'de ödül anı,
`k` = 0, Bölüm 10'dan çıktı (Bölüm 10 hamle 21; K-62 doğrulayıcı formülü açık yazıldı); (d) yeni kapılar `pallet_capacity`,
`scissors_blocked`, `liftRatio` ≥ 0,60, `shapeDecisions` ≥ 2, `traitDelta` ≥ 10 (ÖNERİ K-58 madde 8, K-59 madde 6, K-64);
(e) güçlendirici × özellik kuralları (ÖNERİ K-66) ve K-30 D1 genişlemesi; (f) R rengi Bölüm 4'e; Bölüm 3–5 sahası 6×5;
(g) çözücü kanıtı: makro çizge sağlamlık testi (B), olmazsa Bölüm 6–10 iki kata iner (A); Bölüm 6 spike'ı gelmeden 7–10
JSON'u yazılmaz. Ayrıntı ve kapanışlar: LEVELS §8, `docs/review_inbox/levels-v3-design-review.md` sonu.

### ÖNERİ P-E2-1 — v3.2: Hikaye 1 kanıt sınırında kalır; palet park kuralı; `shapeDecisions` izlenir (product-lead, 2026-11-09)
**Durum:** ÖNERİ. **Bağlam:** E2 bölüm turu (LEVELS §8.12), ≈ 650 aday tam tarandı. **Öneri:** (1) Hikaye 1 blok sayısı
8–9, saha ≤ 6×4/6×5, E 4–6 (D-090 tam tarama sınırı; 10+ parça her denemede > 2,5 M durum). 10–16 blok ve 6×6 saha makro çizge
kanıtıyla (U-v3-2 B) Hikaye 2'de. (2) Y10 Palet için K-58 madde 9: kaldırılan katman yalnız şantiyeye bırakılır (sahaya park
yok); D3b tablosu daha ucuzsa o. İkisinden biri gelene kadar palet Hikaye 1'de yok; Y10'un ilk bölümü 13'e (Y13 14'e) kayar.
(3) K-64 `shapeDecisions` Hikaye 1'de izleme ölçütüdür; L-42 bu hikayede uyarı. (4) Çekiç Bölüm 8'de hedefsiz: seçenek A
açılış 10'a (Vinç ile aynı bölüm), B Bölüm 8'e bir sargı + makas (8 parça sınırında Bölüm 8'in I3 fikri zayıflar). Öneri A.
**Gerekçe:** proje sahibinin "kurallar korunur" şartı (D-090 dahil) ile "daha çok blok" isteği bu çözücü ölçeğinde çakışıyor;
kanıtsız bölüm yayımlamak yerine çeşitliliği şekil + özellikle (C3, L/J, T, I3, iki renkli, sargı, bonus) verdim.
**Proje sahibine:** blok sayısı bugün 6–8'den 8–9'a çıktı, 16–22 hedefi bu turda yok; nedeni ve yolu yukarıda.

### ÖNERİ P-P3-1 — v3c yayını: Hikaye 1'de palet yalnız `D2_90`; Bölüm 6–10 17–19 blok; bonus ilk kez finalde (product-lead, 2026-11-12)
**Durum:** ÖNERİ. **Bağlam:** P3 bölüm turu (LEVELS §8.14); D-103…D-105 uygulandı, 6–10 `levels:check` yeşil.
**Öneri:** (1) GDD K-58 madde 10: alt katmanlı paletin üst katmanı ancak bir birim ötelemesi kendi ayak izine değmiyorsa
tutulabilir; Hikaye 1'de palet şekli yalnız `D2_90` (`I3_90` Bölüm 8+); doğrulayıcı kodu `pallet_stuck` (code-lead).
`C3`/`O4`/`L4`/`J4`/`T4` paletinin üst katmanı hiç tutulamaz (P1 planındaki `C3` paletleri bu yüzden çıkarıldı). (2) Blok
sayısı 17 / 18 / 18 / 17 / 19 (D-103 "18–22" amacının alt ucu): tek `D2_90` ×3 paletle Σ ≤ 48, domino ≤ %50 → N ≤ 19.
Daha fazlası Hikaye 2'de `I3_90` paletiyle (kazanç 6). (3) Bonus (Y12) ilk kez Bölüm 10'da, `teaches` olmadan (K-60
madde 6); 6–9'un her biri bir mekanik tanıttığı için L-22 bonusu oraya sokmaz. L-22'de Y12 muafiyeti kodlanırsa Hikaye 2'de
de serbest. (4) Yerleşim üçlüsü en çok 2 bölümde (CL-V3-04): Bölüm 10 duvar 6.
**Gerekçe:** D-103…D-105 ve korunan kurallar (K-55, K-47/K-48, YAO ≥ %60, D-090 kapıları, K-53, `min` ≤ 22) birlikte
sağlandı; sapmalar ölçülen geometri sınırından gelir, kural gevşetilmedi.
**Proje sahibine:** blok sayısı ve D-090'ın bu ölçekte tahmin sınıfı (10 000 yürüyüş, yakalanmayan çıkmaz %0,00) onayınızı bekler.

### ÖNERİ P-Fl-1 — Bölüm 1–5 verisi değişmez; resmî vekile 2 adım kazı bakışı, 3–5'e bant (product-lead, 2026-11-12; CL-V3C2-03)
**Durum:** ÖNERİ (orkestratör, proje sahibine "Bölüm 1–5 değişmez" notunun kapsamıyla). **Bağlam:** resmî ileri bakış
vekilinde (ε 0,1; 1 adım: gereken yerleşimi açan kaydırmayı görür) Kolay 3 0,51, Kolay 4 0,43, Normal 5 0,56; Normal 6–9
0,81–0,86; Zor 10 0,56 (REVIEW_LEVELS_V3C2 §5). Bölüm 4'te bütçe + 8 ile bile 0,59: iki derin kazıda (gereken blok iki
bloğun altında) ilk kaydırma hiçbir yerleşim açmaz, vekil rastgele kaydırır. **Ölçüm (product-lead, LEVELS §8.16.5):**
aynı vekile ikinci kazı adımı eklendiğinde (24 aday kaydırmanın hiçbiri yerleşim açmıyorsa her aday, ardından gelebilecek
12 kaydırmanın açtığı en çok yerleşimle puanlanır) Bölüm 3 **0,96**, 4 **0,89–0,91**, 5 **0,96–0,97** (2 000 oyun, ε 0,1, aralık tohum dizileri arası; ε 0'da
üçü de 1,00); 6 0,86, 7 0,91, 8 0,86, 9 0,84, 10 0,57 (400 oyun) — 6–10 neredeyse değişmez (sığ kazılar). Yani Kolay 3–4
gerçekte zor değil; 1 adımlık vekil derin kazıda kördür. Eğri bu vekilde testere dişidir: Kolay ≥ 0,89, Normal 0,84–0,97,
Zor 0,57.
**Öneri:** (1) Bölüm 1–5'in yerleşimi, planı ve bütçesi **değişmez** (sahibin notu korunur; hiçbir veri değişikliği
gerekmez). (2) code-lead resmî vekile (`tools/solver/walks.ts` `policyWinRates`) 2 adım kazı bakışını ekler (≈ 40 satır +
test "K-51 …"; ölçüm yöntemi LEVELS §8.16.5) ve `levels:check` 1–10'u bu vekille ölçer. (3) Bu vekil gelince product-lead
Bölüm 3–5'e `targets.policyWin` yazar: Kolay 3–4 [0,85, 1,00], Normal tanıtım 5 [0,80, 1,00] (tanıtım bölümü bandın üst
sınırına bağlanmaz; 0,97 "nefes" sayılır) ve 6–10 bantlarını yeni vekille yeniden doğrular; bandın dışına çıkan bölümde
yalnız `a` (bütçe) ayarlanır (ör. Bölüm 7 v3c3 2 adımlı vekilde 0,91 → `moves` 24 → 23 adayı).
**Reddedilen seçenek:** bugünkü 1 adımlı vekile göre Bölüm 4'ü tek derin kazıya indirmek ve 3–5 bütçesini büyütmek — kör
bir ölçüye ayar yapılır, eğrinin gerçek biçimi değil vekilin kusuru düzeltilir.
**Gerekçe:** brif ilke 4 (testere dişi) ve 6 (önce ölçü, sonra ayar); sahibin "abartısız zorluk" amacı veri değişmeden
korunur. **Proje sahibine:** "1–5 değişmez" notu bu öneriyle tam korunur; tek değişiklik ölçü aracındadır.

### ÖNERİ P-Fl-2 — Bölüm 8 ve 9'da 18 blok + dörtlü şekil; Bölüm 7 19 blok (product-lead, 2026-11-12; CL-V3C2-04)
**Durum:** ÖNERİ (D-107 alt sınırları içinde; hedef aralığın altı için kayıt). **Karar önerisi:** Bölüm 7 19 blok (D2 ×9,
C3 ×4, L4 ×2, palet `O4_0` ×4), Bölüm 8 18 blok (D2 ×7, C3 ×7 [3'ü palet], I3 ×3, L4), Bölüm 9 18 blok (D2 ×7, C3 ×8 [3'ü
palet], I3 ×2, L4). **Gerekçe:** sahibin amacı "daha çok blok, **daha çeşitli şekil**"; Σ 48'lik planda domino payı ≤ %50
iken bir dörtlü blokla N en çok 18'dir (tekli `B1` olmadan: 2d + 3c + 4 = 48, d + c + 1 = N, d ≤ N/2 ⇒ d = 7, N = 18;
tekli blok sayıyı artırır, çeşitliliği değil); Σ 54'te (Bölüm 7, palet `O4_0` ×4 = 16 hücre) paletsiz iki dörtlüyle N 19'dur. Bölüm 6'daki "şekil çeşitliliği 18'den önce gelir" ilkesi (D-107) 7–9'a da uygulanır; 7–9'un her biri
≥ 1 paletsiz dörtlü blok ve ≥ 4 şekil ailesi taşır (v3c2'de 0 dörtlü, 3 aile). D-107'nin "hedef 19–20"si 8 ve 9 için
Hikaye 2'nin yüksek sahasına kalır.
