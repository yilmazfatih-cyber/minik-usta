# design-lead — Faz 2R ön ekran incelemesi 1 (2026-10-08)

Kaynak görüntüler: `artifacts/screens/2r/` (`game/` 48, `tutorial/` 7, `wp-i/` 11, kök 8; 390×844 ve 360×800).
Kıyas: proje sahibinin stil referansı `artifacts/reference/owner-2026-10-07/ref-01…09.png` (yalnız stil, R2-12) ve
ART v2 (§1, §3A, §7, §11, §14). Biçim: `[DS-nn] (önem) ekran: sorun → somut düzeltme (sahibi)`. design-lead'e düşen
maddeler bu turda düzeltildi ("DÜZELTİLDİ" notu); code-lead'e düşenler açık.

**Önemli uyarı — görüntülerin bir kısmı bayat:** `wp-i/` 21:44'te, `game/` 22:34'te çekildi; `src/i18n/tr.json` 00:34'te,
`levels/level_001…010.json` 23:48'de değişti. Ham anahtarlar (`hud.livesFull`, `town.ch1.title`, `nav.*`,
`common.comingSoon`), "Parlayan bir hücreye dokun." (artık hiçbir yerde yok) ve hedef çipindeki eksik "blok" etiketi bu
yüzden görünüyor. Bölüm 4, 5, 7, 10 tahtaları da eski taslaktır. İnceleme 2 için bütün set yeniden çekilmeli (DS-01).

## Ana sayfa (`wp-i/home-*`)

- [DS-01] (Önemli) ana sayfa + oyun, bütün profiller: ekranda ham i18n anahtarları ve eski metinler var (bayat çekim; WP-L sonrası tr.json'da hepsi var) → `npm run screens` ile bütün 2R setini (game/, tutorial/, wp-i/) yeni i18n ve `levels/` verisiyle yeniden çek; `tools/screens.ts`'e kapı ekle: ekrandaki metin nesnelerinde `^[a-z]+(\.[A-Za-z0-9_]+)+$` deseni 0 olmalı (sahibi: code-lead)
- [DS-02] (Engel) ana sayfa 390×844, 360×800: `town_ch1_tree` katalogda olmadığı için ağaç ev havada asılı, basamaklar boşlukta duruyor; proje sahibinin ilk göreceği yapı "kırık" okunuyor (benzetim `home-tree-sim-390x844.png` doğru görünümü veriyor) → `src/services/assetCatalog.ts`'e `def('town_ch1_tree', 'town', {760,820}, {760,820}, 'P2')` (hayalet yok; ASSET §16.3 #4b satırı 2026-10-07'den beri var), `npm run assets` çıkış 0'a döner; HomeScene kodu hazır (sahibi: code-lead)
- [DS-03] (Önemli) ana sayfa (ağaçlı benzetim): yarı saydam ozalit hayaleti (%35) çınarın yaprakları üstünde çamurlu yeşil-mavi; yapı silueti taçtan ayrışmıyor → hayalet işi önce silueti opak `color.board.planUnderlay` #BCCADD ile boyasın, üstüne `board.blueprint` %35 + 4 px beyaz %90 kesik kontur (görünen ton ≈ #859FC2, her zeminde aynı); `tools/assets.ts` ghost işine `underlay` ekle ve hayaleti yeniden üret. ART §7.2 bu tarife güncellendi — DÜZELTİLDİ (tarif); üretim (sahibi: code-lead)
- [DS-04] (Önemli) ana sayfa: karakter köşesi referansın "sahnede karakterler" düzeyinin çok altında — Tuna büstü küçük, alt kenarı çalıyla örtülmüş (kodda `drawHedge` yaması), Kepçe ufak; Tuna ile "Bölüm N" düğmesi arasında 390×844'te ≈ 430 px boş çimen → tam boy `chr_tuna_stand` (300×480, başparmak yukarı, D-087 oranları) + Kepçe oturan poz, ölçek 1,35, tabanı düğmenin 24 px üstünde, çalı kaldırılır. Sıra: code-lead katalog satırını `optional` olarak açar → design-lead SVG + ASSET §16.3 satırını aynı turda teslim eder (katalog dışı SVG `npm run assets`'i kırmızıya çeviriyor). Bu turda `layout.home.characterExpandShare` 1 token'ı yazıldı (WP-I `CHARACTER_EXPAND_SHARE` kabul) — kısmen DÜZELTİLDİ (sahibi: design-lead + code-lead)
- [DS-05] (Öneri) ana sayfa üst çubuk: can kapsülünde "5" ve "Dolu" iki satır 40 CSS px'lik kapsüle sıkışıyor (her biri ≈ 12 CSS px) → sayı kalbin içine (beyaz 52 px, `ui.ink` kontur), kapsül gövdesinde yalnız "Dolu" ya da geri sayım tek satır 52 px; referans ref-03'teki kalp-içi sayı ilkesi (birebir değil) (sahibi: code-lead; UX §3 ölçüsü değişmez)
- [DS-06] (Öneri) ana sayfa 360×800 `home-v2-locked-tap`: "Yakında" balonu birincil "BÖLÜM 4" düğmesinin metnini 1,2 s örtüyor → balonu sekmenin üstünde ama düğme dikdörtgeninin dışında tut: balon üst kenarı ≥ düğme alt kenarı + 8, sığmıyorsa balon gezinme çubuğunun içine (sekme etiketinin yerine) çizilsin (sahibi: code-lead)
- [DS-07] (Öneri) ana sayfa genel: sahne düz vektör; referansın hacmi 3B render'dan geliyor (R2-08 gereği hedef değil). Hacmi SVG'de artırmak için: tepe ve ağaç taçlarına 1 kenar ışığı + 1 temas gölgesi, yapının altına yumuşak gölge elipsi (α 0,18) → Faz 5 cila turu, ART §7.2 "ışık geçişi" maddesiyle (sahibi: design-lead)

## Oyun ekranı (`game/`)

- [DS-10] (Önemli) oyun 390×844 / 360×800: tahta küçük; HUD alt kenarı ile vinç alanı tepesi arasında B1'de 592 tasarım px (≈ 214 CSS px) boşluk, B1 hücresi 360×800'de 40 CSS px → `layout.adaptive.cellMaxPx` 144 yazıldı (D-085): B1–B5, B7, B9 144 · B6 132 · B8, B10 120; B1 tahtası 936 px (%87), boşluk 424, 360×800'de 48 CSS px. UX §5.8 tablosu yeniden hesaplandı. Tahta EXPAND'de yukarı çekilmedi (`board.expandShare` 0,5 kalır: 0,5'te B1 saha üst satırı ekranın %51'inde, 0,25'te %47 — ilke 3). 8 sütunlu B8/B10'da (yatayda 120'ye kilitli) boşluk 472 kalır; inceleme 2'de ölçülür, gerekirse DS-12'deki kuyu EXPAND'de büyür — DÜZELTİLDİ (sahibi: design-lead); `boardLayout`/`layout` testleri yeni değerlere (sahibi: code-lead)
- [DS-11] (Önemli) oyun FIT 1080×1920: saha çerçevesi (boardBottomY 1488 + 20 = 1508) durum şeridiyle (statusY 1504) 4 px örtüşüyor → `layout.board.statusY` 1520, `statusH` 80, `statusBottomY` 1600 (değişmez; alt yuva ve alt grup değişmezi aynen), çerçeveyle 12 px boşluk; Usta Serisi dokunma hedefi 80 + 2×24 = 128. UX §5.1 wireframe ve §5.8 madde 10 güncellendi — DÜZELTİLDİ (sahibi: design-lead); 1504/96/1744 sabit testleri (sahibi: code-lead)
- [DS-12] (Önemli) oyun HUD: oyuncu bölüm numarasını hiçbir yerde görmüyor; panorama kuyusu 592 px genişliğinde, 1 dilimli planda içindeki 2×5 hücre (19 px) kuyunun %85'ini boş bırakıyor → kuyunun solunda `home.play` "BÖLÜM {n}" (`brightTitle` 52 px), panorama sağdaki alanda ortalı; panorama sığmazsa etiket gizlenir (UX §5.9 madde 8 yazıldı) (sahibi: code-lead)
- [DS-13] (Önemli) güçlendirici seçim kipi (`flow-hammer-pick`, `flow-crane-spots`, `flow-trowel-pick`): büyük krem "Vazgeç" düğmesi tahtanın üst kenarında, ekranın üst yarısında (390×844'te y ≈ 300–350 CSS px) ve vinç alanının üstünde — ilke 3 (başparmak bölgesi) ihlali → Vazgeç = seçili yuvanın yüzünde kırmızı yuvarlak × (128 px; Mala'da durum şeridindeki mala ikonunun yerinde), yuvaya yeniden dokunmak vazgeçer, `popstate` = Vazgeç; açıklama şeridi yalnız metin, alt kenarı vinç alanı tepesinin 16 px üstünde. UX §5.2 madde 1 ve JUICE #60 güncellendi (sahibi: code-lead)
- [DS-14] (Önemli) Söküm (`flow-teardown-before/mid/after`): üç karenin hiçbirinde `tut.ctx.teardown` balonu yok; 1,2 s satır, 600 ms + 80 ms/blok süren kilitli diziyle birlikte bitiyor ve okunmuyor → `duration.teardownLine` 2400 ms (yeni token; #107, #21a, #21c kilitli dizi satırları); UX §13.1 (4000 ms kuyruklu bağlamsal satırlar) ile JUICE #21a/#107 (1,2 s) çelişkisi "kilitli dizi satırları" kuralıyla kapandı (UX §13.1, JUICE, STORY §6) — DÜZELTİLDİ (sahibi: design-lead); `TEARDOWN_LINE_MS` sabiti token'a, `tools/screens.ts`'e Söküm başlangıcından +600 ms'de `teardown-line` karesi (sahibi: code-lead)
- [DS-15] (Önemli) öğretici Bölüm 3 adım 1 (`tutorial-l03-step1`): eldiven saha içi 1 hücrelik kaydırmada çapraz aşağı iniyor ve "yeşil bloğu kahverengi bloğun üstüne it" gibi okunuyor (WP-H sorusu) → parmak uzayı yolu doğru ve kalır (K-08: aynı satırda yana çekilen blok saha üstü havaya kalkar, bırakma K-07 satır 3 ile iptal olur); eldivenle birlikte bloğun α 0,55 hayalet kopyası blok uzayında yürür (her karede K-08'in o parmak noktası için vereceği konum), noktalı iz hayaletin merkezini izler, yol başında hayalet 160 ms'de kalkar. Tokens `tutorial.ghostAlpha` 0,55, `ghostLiftMs` 160; UX §13.1 madde 1, JUICE #103 güncellendi. Bölüm 1 adım 1'de de iz şimdi vinç alanından geçer (veri yolu y 5'te, iz parmak ofseti yüzünden saha tepesinde görünüyordu; `crane` vurgusuyla çelişki kalkar) (sahibi: code-lead)
- [DS-16] (Önemli) oyun 8 sütun (B8, B10; `b08-*`, `b10-*`, `x6x5_2x7-*`): tahta tepsisinin yan kenarı ekran kenarına ≈ 2 CSS px, saha çerçevesi tepsi çizgisine yapışık; sıkışık ve "taşmış" okunuyor → tepsi payı `min(24, yardX − 32)`; 8 px'in altında yan kenarlar çizilmez, yalnız üst/alt bant (UX §5.8 madde 9, ART §7.1 tepsi tarifi yazıldı) (sahibi: code-lead)
- [DS-17] (Öneri) oyun alt grup (Bölüm 1–7): kilitli yuvaların sırası Çekiç (8) · Vinç (10) · Fırça (22) · Geri Al (13) — kilit numaraları sırasız okunuyor → açılış sırasına göre Çekiç, Vinç, Geri Al, Fırça (UX §5.1 tablo + K-54 yuva sırası; analytics `booster` kimlikleri değişmez) (sahibi: code-lead, önce product-lead onayı)
- [DS-18] (Öneri) oyun durum şeridi: pasif Altın Mala ikonu koyu kapsülde kahverengi silüet, kontrast ≈ 2:1 → pasifte beyaz α 0,55 silüet + boncuklar dolunca tam renk (ART §14.5), renk körü modunda "3/4" zaten var (sahibi: code-lead)
- [DS-19] (Öneri) Çekiç vuruşu (`flow-hammer-hit`): "1 kare beyaz" flaş Ağır Yük'ün yerine köşeli düz beyaz kare çiziyor, yük siluetini kaybediyor → flaş pişirilmiş `cargo_q9`/`cargo_i5` siluetinin beyaz ADD kopyası (köşe yarıçapı korunur, α 0,85), parçacıklar aynı (JUICE #61) (sahibi: code-lead)
- [DS-20] (Öneri) bütün oyun kareleri: sağ üstte "DBG n" rozeti → üretim derlemesinde yok olduğunu `verify-dist`'te doğrula; `screens` çekimlerinde gizle (inceleme görüntüsü ürün görüntüsüdür) (sahibi: code-lead)
- [DS-21] (Öneri) oyun HUD okunurluğu — kabul: hamle plakası (rakam 120 px) ve hedef çipi 360×800'de de tek bakışta okunuyor; plan hücreleri (düz, kesik konturlu) ile yerleşmiş bloklar (çıkıntılı, parlak) ayrışıyor; sıradaki satırın beyaz konturu (K-34) net. Değişiklik yok; inceleme 2'de "blok" etiketinin her durumda göründüğü doğrulanacak (DS-01) (sahibi: code-lead)

## Kazanma (`wp-i/win-*`, `game/flow-win-*`)

- [DS-30] (Önemli) kazanma kartı: yapı hayaleti krem kart üstünde gri ve "ölü"; ozalit dili kayboluyor, oyuncu inşa ettiği planı tanımıyor → DS-03'teki opak tabanlı hayalet krem kartta da ozalit mavisi verir (ayrı kart tonu gerekmez; WP-I sorusunun yanıtı). UX §6.1 ve ART §7.2 güncellendi (sahibi: code-lead — `tools/assets.ts` hayalet üretimi)
- [DS-31] (Önemli) kazanma 390×844: ödül kapsülleri ile "DEVAM" arasında ≈ 450 tasarım px boş meydan zemini; Tuna kartın sol kenarında, ayakları zemin çizgisinin ≈ 250 px üstünde "havada" → blockout önerisi (ilke 7; inceleme 2'de onaylanınca tokens): kart 600 → 680 (`layout.win.cardSize`, `cardY` 440 korunur), bonus/mala/kapsül satırları +80 (bonusY 1160), `characterX` 0 → −32 ve `characterY` 640 → 760 (300×400 aynı; kartla örtüşme 680'lik kartta 68 px): Tuna'nın tabanı bonus satırının üst kenarına (1160) basar, SVG'deki temas gölgesi satırın üstüne düşer — "havada" değil "panelin üstünde duran maskot" okunur; `expandShare` 0,5 kalır; böylece boşluk 390×844'te ≈ 370, FIT'te 164 px. Şimdi değiştirilmedi: `homeWinLayout.test` sabitleri ve görsel onay birlikte gelsin (sahibi: design-lead, inceleme 2)
- [DS-32] (Öneri) kazanma şeridi: "KAZANDIN!" metni ≈ 80 px, ödül anı için küçük (referans başlıkları ekran genişliğinin ≈ %70'i) → kazanma şeridine özel `kit.ribbon` boyu 136 / metin 104 px (`winTitle` değişkesi), şerit genişliği 900 (sahibi: design-lead token + code-lead; inceleme 2'de DS-31 ile birlikte)
- [DS-33] (Öneri) kazanma arka planı: iki sokak lambası (x 286 / 794) ödül satırlarının altından kartın "ayakları" gibi çıkıyordu → `bg_win_plaza.svg` lambaları x 40 / 1040'a taşındı (merkez sade kuralı), `npm run assets` yeniden üretildi — DÜZELTİLDİ (sahibi: design-lead)
- [DS-34] (Öneri) kazanma ışını: WP-I'nin ADD karışım + α 0,45 seçimi kabul → `kit.sunburst.blend` "add", `rayAlpha` 0,45 yazıldı; kod `rayAlpha + 0,1` eklemesini kaldırmalı — DÜZELTİLDİ (token) (sahibi: code-lead)

## Tuna'nın yaş görünümü (D-087)

- [DS-40] (Önemli) oyun köşesi, ana sayfa, kazanma: Tuna 6–8 yaş okunuyordu (göz yüksekliği görünen yüzün %38'i, kocaman açık gülüş, pembe yanak α 0,45; sevinç pozunda kafatası ölçüsüyle 2,9 baş) → `chr_tuna_bust` ve `chr_tuna_cheer` D-087 oran tablosuna çekildi (ART §11.1): göz ry 19 → 15 + üst kapak çizgisi, düz kaş, burun çizgisi, küçük yan gülüş, yanak α 0,22, hafif sivri çene; sevinç pozunda baş ölçeği 0,8 → 0,66, boyun, gövde 124 ve bacak 100 birim (3,7 baş), eldivenler başın yanına açıldı. İmza siluet (kask, kocaman eldiven, çil, dağınık saç) korundu. `npm run assets` yeniden üretildi; `assets:check` 0, `tests/assets` 38/38; kontak sayfası `artifacts/screens/art-review/contact_characters_r2.png` — DÜZELTİLDİ (sahibi: design-lead). Proje sahibine bilgi: D-087 itiraz edilirse eski çizim git geçmişinde

## Referans kalitesine yakınlık (ölçüt: 1 = uzak, 5 = referans düzeyi; yalnız stil ilkesi)

| Ekran | Hacim / ışık | Renk ve kontrast | Tipografi | Düzen ve boşluk dengesi | Karakter / sahne | Not |
| ----- | ------------ | ---------------- | --------- | ----------------------- | ---------------- | --- |
| Bloklar ve kit (`blocks-v2-a`, `kit-v2`) | 4 | 5 | 4 | — | — | çıkıntılı şeker bloklar, kalın konturlu hacimli düğmeler, kare rozetler referans ilkesini karşılıyor; sembol + renk her blokta |
| Oyun ekranı | 4 | 4 | 4 | 2 → (144 ile) 3 | 2 | en büyük fark boşluk dengesi ve küçük tahta (DS-10, DS-12); çivit zemin + çerçeveli tahta doğru |
| Öğretici | 4 | 4 | 4 | 4 | 3 | R2-10 hedefi tuttu: kenar balonu, tam ekran karartma yok; eldiven/iz dili DS-15 ile düzelir |
| Ana sayfa | 3 | 4 | 4 | 2 | 2 | yapı "kırık" (DS-02), karakter ölçeği küçük (DS-04), alt üçte bir boş çimen; üst çubuk ve alt gezinme referans düzeyine yakın |
| Kazanma | 3 | 4 | 3 | 2 | 3 | seyrek ve gri kart (DS-30, DS-31, DS-32) |

Özet: bileşen düzeyinde (blok, düğme, kapsül, rozet, şerit, balon) referans çıtasına yakınız; ekran kompozisyonu
düzeyinde (boşluk, karakter ölçeği, ödül anının büyüklüğü) değiliz. İnceleme 2'nin hedefi bu üç maddedir.

## Görev maddelerine yanıt (orkestratör listesi 1–4)

1. `layout.adaptive.cellMaxPx` 144 yazıldı (DS-10). FIT çerçeve/şerit örtüşmesi token düzeyinde çözüldü: statusY 1520 /
   statusH 80 / statusBottomY 1600 (DS-11).
2. STORY: `booster.crane.noTarget` "Şu an taşınacak blok yok." / "No block to move right now."; `settings.feedback`
   "Geri bildirim" / "Feedback"; `settings.feedbackCopied` "Kopyalandı. Mesaja yapıştırıp gönder." / "Copied. Paste it
   into a message."; `settings.feedbackManual` "Metni seçip elle kopyala." / "Select the text and copy it." (hepsi ≤ 6
   kelime). Geri bildirim düğmesinin yeri UX §3 (ana sayfa ayar penceresinin son öğesi, krem 640×128) ve §11 (Ayarlar,
   "Hesap" grubu). Söküm satırı: `duration.teardownLine` 2400 (DS-14).
3. ASSET §13: `sfx_teardown` "Teslimat ve kilitlenme" grubuna girdi; tokens'a `audio.seq.sfx_locked` (#73, #108) ve
   `audio.seq.sfx_hammer` (#61, Bölüm 8) eklendi. Kaldırılacak anahtarlar `tokens.json` → `meta._docRetire`: (1) şemadan
   çıkınca silinir: `alpha.tutorialOverlay`, `alpha.tutorialSoftOverlay`, `duration.tutorialHandLoop`,
   `duration.tutorialHandPause`; (2) TrowelPicker `duration.targetPulse`'a geçince: `duration.spotlightPulse`; (3) v1 blok
   çizicisi silinince: `block.*` v1 anahtarları + `alpha.gloss`, `alpha.seam`; (4) kalır: `block.symbolDarkFactor`,
   `block.symbolLightThresholdLstar`. Sıra: code-lead şemadan çıkarır → design-lead siler (şema zorunluyken silmek açılış
   hatasıdır).
4. WP-H eldiven sorusu: çapraz yol kabul, ama tek başına değil — blok hayaleti kuralı (DS-15).

Diğer bekleyen istekler (REVIEW_LOG WP-F / WP-J / WP-I): `color.board.yardFrameTop` #E2A653 / `yardFrameBottom` #B97A35
yazıldı (kontur `kit.panel.outline`); `layout.home.characterExpandShare` 1 ve EXPAND kenar satırı germe kuralı kabul
(UX §0.1, ART §7 güncellendi); kazanma "DEVAM" 80 px kabul; çıkıntı parlama noktası W damarı / Y noktaları yanında
`blocks-v2-a`'da ayırt ediliyor (beyaz nokta ↔ koyu sembol), değişiklik yok; vinç alanı öğretici balonunun sert koşuluna
**girmez**, yumuşak koşuldur (B4/B9 144'te kalır).

## code-lead için devir listesi (bu turun token / metin değişikliklerinin kırdığı ve beklenen testler)

`npx vitest run`: önce 25, sonra 41 kırmızı; yeni 16'sı aşağıdaki el sıkışmalardır (önceki 25'i `levels/` geçişi):
- **Tip:** `TokensSchema`'ya 10 anahtar: `color.board.yardFrameTop`, `color.board.yardFrameBottom`,
  `layout.home.characterExpandShare`, `kit.sunburst.blend` ('add' | 'normal'), `duration.teardownLine`,
  `duration.targetPulse`, `tutorial.ghostAlpha`, `tutorial.ghostLiftMs`, `audio.seq.sfx_locked`, `audio.seq.sfx_hammer`;
  `audio.sfx.sfx_teardown` `PENDING_TOKEN_KEYS`'ten çıkar (ASSET §13 satırı var) → "TECH 2R.7 every key … reaches the
  runtime tokens", "ART 2.4 board colour table = tokens".
- **Yerleşim sabitleri:** status 1520/80 → "TECH 10.1 example: H = 2400 … 1744" (yeni 1760), review "TECH 10.1 H = 2400
  … 1744" (1760), "UX 5.1 wireframe (FIT) … status 1504 h 96" ([1520, 80]), "UX 5.1 'Yapı tamam!' ribbon … 96 px + 16 px
  pads" (80 + 2×24). cellMaxPx 144 → `boardLayout.test` UX 5.8 tablo testleri (UX §5.8 yeni tablo), "120 without
  cellMaxPx" (cellMaxPx'siz kopya token ile), "360 × 800 … (40 CSS px at 120)" (120 kopyası ile), EXPAND +208/+240 ve
  kurdele testi (c ile).
- **i18n:** tr/en'e `booster.crane.noTarget`, `settings.feedback`, `settings.feedbackCopied`, `settings.feedbackManual`;
  `NOT_IN_STORY` boşalır → "TECH 2R.12 WP-L every STORY 6 / 6A / 7 row …", "… every i18n key named in src …".
