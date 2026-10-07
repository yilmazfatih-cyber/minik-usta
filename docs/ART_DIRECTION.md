# Sanat yönü — Minik Usta

Sahip: design-lead · Sürüm: **Faz 2R (2026-10-07) — görsel dil v2** (R2-07 görsel çıta, R2-08 ücretsiz üretim yolu,
R2-02 değişken boyut); **Faz 2R çapraz inceleme kapanışı** (aynı gün: R2-08 güncellemesi — görseller elle yazılmış SVG,
yapay zekâ yok; R2-12 sahip referansları — studlu oyuncak tuğla, çivit arayüz zemini; Ağır Yük ve moloz yeniden tarif;
`docs/review_inbox/design-lead-2R-closure.md`); önceki: Faz 1 revizyonu (2026-10-04; R-01, R-04, R-05, R-24), Faz 2 boşluğu 2 (2026-10-06) ·
Kaynak: `docs/BRIEF.md` §6, §7, §9, §11 · Kod karşılığı: `src/theme/tokens.json` (her değerin tek kaynağı; türetilen
renkler `check.*`, salt kontrol)

> Bu belgedeki tüm ölçüler **1080×1920 tasarım çözünürlüğünde piksel** (px) olarak verilir. 390 pt genişlikte bir
> telefonda 1 pt ≈ 2,77 px; 375 pt'de 1 pt ≈ 2,88 px. "Hücre" (c) = 120 px (bkz. `UX_FLOWS.md` §0).
>
> **Faz 2R okuma sırası:** §1 (görsel sütunlar) → §2.5 (blok tonları v2) → §3A (blok çizim şartnamesi v2) → §14 (UI
> kiti v2) → §15 (efektler v2) → §7 (arka planlar v2) → §8.1 (yazı stili v2) → §16 (araştırma kaynakları). §3'teki v1
> tarifi ve tabloları kodun bugünkü hâlidir; testler bu tabloları okuduğu için code-lead v2 çiziciyi ve testlerini
> getirene kadar yerinde kalır, sonra silinir (bkz. §3 başındaki not).

---

## 1. Görsel sütunlar (v2 — Faz 2R, R2-07)

Proje sahibinin geri bildirimi: "görsel dil yok, çok basic". Hedef çıta Royal Match / Block Blast düzeyinde parlaklık,
hacim ve ödül hissi; ton **yetişkin casual oyuncu için "premium casual"; çocuksu değil** (EN-2R-12, BUSINESS S8: "her
yaşa / tüm aile / for all ages / family-friendly" ifadeleri hiçbir belgede, SVG açıklamasında ve mağaza metninde
kullanılmaz). Proje sahibinin stil referansları (R2-12, `artifacts/reference/owner-2026-10-07/`, git dışı) **yalnız
ilke** olarak alınır: çivit/mor arayüz zemini, doygun ana renkler, çıkıntılı (studlu) oyuncak tuğla bloklar, hacimli şeker
düğmeler, kalın konturlu beyaz yazı. Referans oyunun ve rakiplerin karakteri, logosu, ikonu ve ekran düzeni kopyalanmaz,
izi sürülmez, kırpılıp kullanılmaz (kaynaklar ve çıkarılan ilkeler §16, özgünlük §11.8).

| # | Sütun | Kural (ölçülebilir) | Tarif |
| - | ----- | ------------------- | ----- |
| 1 | **Şeker hacim + oyuncak tuğla** | Her blok dolgun ve parlak: koyu kontur 6 px, hücre başına yastık + dikey gradyan + üst parlama elipsi, alt kenarda 12 px görünen yan duvar (kalınlık), yastık altında iç gölge; **hücre başına tek büyük çıkıntı (stud)**, sembol çıkıntının tepesine kabartılır (R2-12). Bir blok tahtada düz renk alan olarak görünmez. Plan hücresi, gölge ve Ağır Yük çıkıntısızdır. | §3A, §3A.5 |
| 2 | **Cilalı UI kiti** | Her dokunulur öğe hacimlidir: 6 px kontur + 14 px alt kalınlık + gradyan yüz + üst parlama bandı; basılınca 10 px iner. Paneller ahşap çerçeveli krem, başlıklar şerit (ribbon), sayaçlar koyu yarı saydam kapsül, bildirimler kırmızı rozet. | §14 |
| 3 | **Zengin sahne, sakin orta** | Ana sayfa ve kazanma arka planları design-lead'in elle yazdığı **SVG illüstrasyonlarıdır** (R2-08, ASSET §16; yapay zekâ yok); oyun ekranı **prosedürel çivit sahnedir** (R2-12, §7.1). Kenarlar ayrıntılı, tahta ve birincil düğmenin arkası sakin (orta bölgede belirgin nesne yok). Sahne doygunluğu blok tabanlarının altında kalır. | §7 |
| 4 | **Her ödül parlar** | Doğru yerleşim, dilim, kazanma, toplama: ışık (parlama süpürmesi, 4 köşeli kıvılcım, yıldız patlaması, ışın) + ses + haptik. Bütçe JUICE §0 kural 4 (ekranda ≤ 120, patlama başına ≤ 40 parçacık). | §15, JUICE §8 |
| 5 | **Okunurluk kutsal** | 375 pt'de 1 sn kuralı; renk asla tek taşıyıcı değil; gradyan ve parlama sembol kontrastını 3:1 altına indiremez (ölçüm §2.5). | §2.5 |
| 6 | **Kodla keskin** | Bloklar, plan hücreleri, düğmeler, paneller, şeritler, rozetler, kapsüller, ilerleme çubukları ve efektler **prosedürel** (Canvas2D, ekran/bölüm başında pişirilir): her çözünürlükte keskin, renk körü moduna uyar. İllüstrasyonlar (arka plan, karakter, kasaba yapısı, ikon, logo amblemi) elle yazılmış SVG'dir (`public/art/**`, R2-08); kullanım boyutunda raster edilir (ASSET §16). | §3A, §14 |
| 7 | **Yetişkine saygı** | Okul öncesi işaret yok (ABC küpü, bebeksi oran, emzik pasteli, harfli küp); SVG adlarında ve açıklamalarında "toy box / kids" yok (BUSINESS S2–S5). Studlu tuğla bir **inşaat malzemesi** olarak çizilir (mat-parlak plastik, kalın kontur), oyuncak kutusu sahnesi kurulmaz. Parlak ama zarif: çivit zemin üstünde **neon ışıma yok** (ışıltı yalnız ödül anında, §15). | §7, ASSET §16.2 |
| 8 | **İkaz şeridi yalnız vurgu** | Sarı-siyah şerit yalnız duvar başlığı, geçit kenarı, **Ağır Yük** (Y5, §6; PL-2R-04) ve "ÇOK ZOR" etiketinde. | §5, §6 |

**v1 → v2 farkı (Faz 2 ekran görüntüleri, 2026-10-07 incelemesi):**

| Konu | v1 (Faz 2) | v2 (Faz 2R) |
| ---- | ---------- | ----------- |
| Blok | düz taban + 17 px ışık bandı + 19 px gölge bandı, parça başına tek küçük parlama hapı; tahtada "mat karo" | hücre başına yastık, dikey gradyan, her hücrede parlama elipsi + nokta, 12 px yan duvar, hücre başına tek çıkıntı (stud) ve tepesinde kabartmalı sembol (§3A, §3A.5) |
| Öğretici | ekranın tamamı %60 (yumuşak adımda %30) kararır; HUD ve tahta zeytin/gri görünür | karartma yok; eldiven + kenarda küçük balon (UX §13.1); `alpha.tutorialOverlay` = 0 |
| Arka plan | düz gök mavisi gradyan | prosedürel çivit şantiye sahnesi (oyun, R2-12), SVG Renkli Tepe kasabası (ana sayfa), SVG kutlama meydanı (kazanma) |
| HUD / panel | gri-krem düz kutular, başlıksız | ahşap çerçeveli paneller, şerit başlık, kapsül sayaçlar |
| Ana sayfa | gök + logo metni + tek düğme | üst çubuk, alan şeridi + ilerleme, kasaba yapısı, büyük "Bölüm N", alt gezinme (UX §3) |
| Kazanma | tahta üstünde "KAZANDIN!" yazısı | tam ekran: ışın + altın şerit + yıldız patlaması + karakter + ödül kapsülleri (UX §6.1) |
| Alt %25 | boş (Faz 2'de güçlendirici çubuğu yok) | Tuna + Kepçe köşesi ve kilitli güçlendirici yuvaları her bölümde görünür (UX §5.9) |

## 2. Palet

### 2.1 Blok renkleri (final öneri — kodlar değişmedi)

| Kod | Ad | Brif hex | **Yeni hex** | L\* | Sembol | Sembol mürekkebi | Neden değişti |
| --- | -- | -------- | ------------ | --- | ------ | ---------------- | ------------- |
| W | Ahşap | #B8763E | **#764012** | 33 | ağaç damarı | beyaz %85 | Deuteranopide R ile neredeyse aynıydı (ΔE00 2,1). Koyu ceviz tonuna çekildi. |
| Y | Kum Sarısı | #FFC83D | **#FFE23E** | 90 | üç nokta | koyu (taban ×0,40) | O ile ayrışsın diye daha açık ve güneşli. |
| G | Bahçe Yeşili | #4CC35E | **#44D088** | 75 | yaprak | koyu (taban ×0,40) | Protanopide Y ve O ile karışıyordu; daha açık ve hafif nane. |
| R | Tuğla Kırmızısı | #E8483B | **#CF404E** | 49 | tuğla derzi | beyaz %85 | Protanopide W ile karışıyordu; hafif koyu, kiraz yönüne. |
| O | Kiremit Turuncusu | #F58A2B | **#EC8D20** | 67 | kiremit dalgası | koyu (taban ×0,40) | Küçük ince ayar. |
| C | Beton Grisi | #9AA4B1 | **#C8CFDA** | 83 | çapraz tarama | koyu (taban ×0,40) | Brifte B ile en yakın çiftti; açık, serin beton. |
| B | **Gök Mavisi** (EN *Sky Blue*) | #3BA6F5 | **#2984DE** | 54 | parıltı | beyaz %85 | Tritanopide G ile karışıyordu (6,5); daha koyu. |
| P | Mozaik Moru | #9B5DE5 | **#5D3AAE** | 35 | elmas | beyaz %85 | Deuteranopide B ile karışıyordu (9,3); derin mor. |

Ad notu (P-9, R-05 KABUL): B'nin adı **"Gök Mavisi"** (EN *Sky Blue*); eski ad "Cam Mavisi" S3 "Cam Blok" bayrağıyla
karışıyordu. Kod B aynı kalır. Palet değişikliği (P-1) proje sahibine bilgi olarak sunulur; renk kodları değişmedi.
Renk adları **yalnız belgelerde** geçer; oyuncuya görünen hiçbir metinde (öğretici, ipucu, renk körü modu dahil) renk
adı yoktur (R-08; renk sembolle tanınır). Bu yüzden STORY'de `color.name.*` anahtarı yoktur.

Açıklık merdiveni (L\*): **Y 90 › C 83 › G 75 › O 67 › B 54 › R 49 › P 35 › W 33.** Renk körlüğünde ton kaybolsa da
açıklık kalır; palet bu merdivenle ayrışır. W ile P aynı açıklıkta ama ton ekseni zıt (sarı-kahve ↔ mavi-mor) olduğu
için üç simülasyonda da ayrık kalır (≥ 22 ΔE00).

### 2.2 Renk körlüğü doğrulaması (hesaplandı)

**Yöntem.** Atılabilir betik (`scratchpad/design-lead/cvd_check.py`, proje dışında) 8 rengi üç modelle simüle etti:
Machado 2009 (şiddet 1,0), Brettel 1997 ve Viénot 1999 (yalnız protan/deutan; tritan için geçerli değil). Kütüphane:
DaltonLens 0.1.5 (`pip install daltonlens`). Her çift için sRGB → CIELAB (D65) → **CIEDE2000**; her koşulda modeller
arasındaki **en kötü** değer alındı. CIEDE2000 uygulaması Sharma (2005) test çiftleriyle doğrulandı (2,0425 ve
27,1492). Eşik: **ΔE00 < 12 = zayıf çift** (tahtada bir bakışta karışma riski); normal görüşte hedef ≥ 20.

**Brif paleti (başlangıç):**

| Koşul | En düşük ΔE00 (çift) | 2. | 3. | ΔE00 < 12 olan çiftler |
| ----- | -------------------- | -- | -- | ---------------------- |
| Normal | **12,9** (W–O) | C–B 17,6 | W–R 19,4 | — |
| Deuteranopi | **2,1** (W–R) | G–O 8,9 | G–R 9,1 | W–R 2,1 · G–O 8,9 · G–R 9,1 · B–P 9,3 · W–G 9,5 · Y–O 10,0 · R–O 11,0 |
| Protanopi | **7,4** (W–R) | Y–G 7,6 | G–O 9,1 | W–R 7,4 · Y–G 7,6 · G–O 9,1 · W–O 11,1 |
| Tritanopi | **6,5** (G–B) | W–O 10,3 | W–R 11,2 | G–B 6,5 · W–O 10,3 · W–R 11,2 |

**Yeni palet (öneri):**

| Koşul | En düşük ΔE00 (çift) | 2. | 3. | ΔE00 < 12 olan çiftler |
| ----- | -------------------- | -- | -- | ---------------------- |
| Normal | **26,3** (W–R) | Y–O 27,2 | B–P 28,7 | — |
| Deuteranopi | **14,4** (Y–O) | G–O 15,5 | B–P 15,8 | — |
| Protanopi | **14,1** (W–R) | Y–G 14,5 | G–O 15,1 | — |
| Tritanopi | **16,6** (G–B) | R–O 16,8 | G–C 16,9 | — |

Sonuç: en kötü çift 2,1 → 14,1. Zayıf çift kalmadı. En yakın kalan çiftler (Y–O deutan, W–R protan, G–B tritan)
sembolle ayrışır: üç nokta ↔ kiremit dalgası, ağaç damarı ↔ tuğla derzi, yaprak ↔ parıltı.

Simüle edilmiş görünüm (Machado / Brettel), inceleme için:

| Kod | Normal | Deutan | Protan | Tritan |
| --- | ------ | ------ | ------ | ------ |
| W | #764012 | #5C5211 / #5D4F0C | #50460A / #524613 | #813436 / #783A43 |
| Y | #FFE23E | #FEE649 / #FEE03E | #F8DC19 / #FEE13D | #FED0C2 / #FED4D9 |
| G | #44D088 | #BCB38C / #BEB18B | #CEBF83 / #D7C487 | #00CEBD / #6BC4E1 |
| R | #CF404E | #8A7F4A / #8A7B48 | #66604D / #635E4F | #E21946 / #CF3D58 |
| O | #EC8D20 | #C1AC21 / #C2A710 | #AA9600 / #B09822 | #FE7679 / #F18290 |
| C | #C8CFDA | #C9CDD9 / #C9CEDA | #CBCFDA / #CACED9 | #C3D1D2 / #C6CFD4 |
| B | #2984DE | #387ADC / #3881DE | #578AE1 / #3D83DD | #0099A6 / #008FAF |
| P | #5D3AAE | #004FAB / #0057AD | #0053B1 / #0047AE | #44566E / #41545C |

**Plan hücreleri de ölçüldü.** Brifteki "aynı renk %30 opak" ozalit mavisi (#1F4F8F) üstünde: normal görüşte en
düşük 7,7; renk körlüğünde **3,8–4,1** (W–R, G–C). Yani plan renkleri birbirinden zor ayrılır. Opaklık–ΔE00 tablosu:

| Plan dolgu opaklığı | Normal | Deutan | Protan | Tritan |
| ------------------- | ------ | ------ | ------ | ------ |
| %30 (brif) | 7,7 | 3,9 | 4,1 | 3,8 |
| %60 | 17,9 | 9,9 | 12,7 | 8,9 |
| %70 | 20,6 | 11,3 | 14,6 | 10,6 |
| %75 | 22,2 | 11,9 | 15,4 | 11,9 |
| **Açık altlık #BCCADD + renk %80 (seçilen)** | **22,8** | **12,2** | **13,6** | **13,5** |

%70 doğrudan mavi üstüne karıştırıldığında sarı zeytin yeşiline döner (#BCB656) ve "plan sarısı" bloğun sarısına
benzemez. Bu yüzden seçilen tarif: hücreye önce "açık altlık" (#BCCADD = beyaz %70 + ozalit), üstüne renk %80.
Renkler kendi tonunda kalır (Y plan = #F2DD5E) ve renk körlüğünde ayrım daha iyidir. Plan hücresini yerleşmiş bloktan
ayıran şey biçimdir: plan hücresi düz (bevel, parlama, gölge yok), içe 8 px çekik, **kesik** kontur ve ozalit ızgara
çizgileri plan hücresinin **üstünden** geçer ("kâğıda basılı"); bloğun üstünden asla geçmez (bkz. §4).

**Sembol kontrastı da ölçüldü.** Brifteki "%35 beyaz sembol" açık renklerde görünmez (kontrast oranı Y 1,08, C 1,18,
G 1,25). WCAG 1.4.11 grafik nesne eşiği 3:1'dir. Kural:

| Taban | Sembol mürekkebi | Kontrast (blok) |
| ----- | ---------------- | --------------- |
| L\* ≥ 60 (Y, C, G, O) | tabanın ×0,40 koyusu, %100 opak | Y 5,33 · C 4,93 · G 4,55 · O 4,10 |
| L\* < 60 (W, R, B, P) | beyaz, %85 opak | W 6,5 · P 6,2 · R 3,8 · B 3,2 |

### 2.3 Arayüz renkleri

| Token | Hex | Kullanım |
| ----- | --- | -------- |
| `ui.panel` | #FFF4D6 | krem panel zemini |
| `ui.panelInset` | #FBE7B5 | panel içi çukur alanlar (hedef kutusu, liste satırı) |
| `ui.panelEdge` | #F2D9A0 | panel iç kenar ışığı |
| `ui.panelShadow` | #C99A52 | panel alt "dudak" gölgesi |
| `ui.ink` | #3B2A1A | ana metin (krem üstünde 12,5:1) |
| `ui.inkSoft` | #6B5440 | ikincil metin, **yalnız krem / nötr zeminde** (krem #FFF4D6 üstünde 6,5:1, nötr #FFF9EA üstünde 6,7:1). Renkli düğme üstünde kullanılmaz (turuncu 3,3:1, yeşil 2,7:1); orada `ui.ink` (turuncu 6,5:1, yeşil 5,3:1) |
| `ui.primary` / `Top` / `Lip` / `Stroke` | #45B649 / #74D16F / #2C8A34 / #1E6427 | "Oyna", "Devam" |
| `ui.secondary` / `Top` / `Lip` / `Stroke` | #FF9A1F / #FFBE5C / #C46A00 / #8A4A00 | "+5 hamle", "Al" |
| `ui.danger` / `Top` / `Lip` / `Stroke` | #E8473B / #FF7468 / #A82A22 / #7A1C16 | kapat (×) |
| `ui.disabled` / `Lip` | #B9B2A5 / #8C8579 | pasif düğme |
| `ui.badgeLocked` | #6B5440 | kilitli öğedeki **gri adet rozeti** dolgusu (açılmadan kazanılan güçlendirici, META §4; UX §0.3): beyaz sayı 7,1:1, gri yuva `ui.disabled` üstünde 3,4:1. Kırmızı `ui.badge` "yeni / dikkat" anlamı taşıdığı için burada kullanılmaz |
| `ui.tagHard` | #E8473B | "ZOR" etiketi |
| `ui.tagSuperHard` | #8E44D9 | "ÇOK ZOR" etiketi |
| `ui.gold` / `goldDark` | #FFC21A / #C98A00 | altın, Altın Mala, Altın Vida |
| `ui.star` / `starOutline` | #FFD23F / #D99A00 | yıldız |
| `ui.heart` | #FF4F6A | can |
| `ui.hazardYellow` / `hazardBlack` | #FFC21A / #2B2B2B | ikaz şeridi (45°, 24 px bant) |
| `ui.overlay` | #141828 (%55) | açılır pencere arkası |
| `ui.neutral` / `Top` / `Lip` / `Stroke` | #FFF9EA / #FFFFFF / #D9C08A / #6B5440 | nötr dolgulu düğme ("Hayır, teşekkürler", "Reklam izle", çıkış onayında "Çık"; "Kal" yeşil, eşit çift düğme, UX §0.3 ve §5.1); yazı `ui.ink` |
| `ui.botBadge` | #E2D5B8 | "çırak" rozeti zemini (yazı `ui.inkSoft`) |
| `color.ghost.valid` | #5CF59A | düşüş gölgesi doğru (Kolay/Normal) |
| `color.ghost.invalid` | #FF4A3D | düşüş gölgesi hatalı (Kolay/Normal) |
| `color.ghost.neutral` | #FFFFFF | düşüş gölgesi (Zor/Çok Zor; açılmamış `?` hücresi) |
| `color.ghost.support` | #FFC21A | K-34 eksik destek hücrelerinin yatay taraması (UX §5.4–5.5) |

Token adları `tokens.json` ile birebirdir: `ui.*` = `color.ui.*`, `board.*` = `color.board.*`.

Düğme yazısı: beyaz dolgu + düğmenin `Stroke` renginde 0,12 em kontur + 4 px aşağı gölge (`Lip` rengi). Beyaz yazının
yeşil üstünde ham kontrastı düşüktür (2,7:1); kontur ve gölge okunurluğu taşır. Bu, türün yerleşik dilidir.

### 2.4 Tahta renkleri

| Token | Hex | Kullanım |
| ----- | --- | -------- |
| `board.yardFloor` | #E9C891 | saha zemini (kum/ahşap) |
| `board.yardFloorAlt` | #E2BD80 | dama deseni için ikinci ton (%50 hücre) |
| `board.yardGrid` | #D4AE6E | saha ızgara çizgisi (3 px) |
| `board.yardFrame` | #B98A4E | saha çerçevesi (20 px tahta kenar) |
| `board.blueprint` | #1F4F8F | şantiye ozalit zemini |
| `board.blueprintDeep` | #173D70 | plan dışı hücreler |
| `board.planUnderlay` | #BCCADD | plan hücresi açık altlığı (üstüne renk %80; bileşik renk formülle üretilir) |
| `board.buildFront` | #FFFFFF | inşa cephesi hücresinin düz konturu (K-34, §4) |
| `board.blueprintLine` + `alpha.blueprintLine` | #FFFFFF %14 | ince ızgara (2 px, her hücre) |
| `board.blueprintLine` + `alpha.blueprintLineMajor` | #FFFFFF %24 | kalın ızgara (3 px, her 2 hücre); ayrı renk token'ı yok, yalnız alfa farklı |
| `board.wall` / `wallLight` / `wallDark` | #A9AFB8 / #C9CED5 / #7D848E | duvar betonu |
| `board.scaffold` / `scaffoldClamp` | #8A96A3 / #FF9A1F | iskele boruları ve kelepçeler |
| `board.rail` | #3F454D | W1 geçit rayı (koyu çelik, 8 px; üst ışık çizgisi `wallLight`; §5). İskele ve tavan kirişinden bilerek ayrı ton |
| `board.craneSky` | #FFFFFF %10 | vinç alanı bandı (gökyüzü üstüne) |
| `board.craneLine` | #FFFFFF %45 | vinç alanı alt sınırı (kesik çizgi) |
| delikli pano (`board.yardGrid`) | #D4AE6E | **Faz 2R (DL-2R-18):** saha zemini **delikli pano**dur: her saha hücresinin merkezinde Ø 12 px delik (`layout.adaptive.yardHolePx`), dolgu `board.yardGrid`, alt yarısında 2 px `board.yardFrame` iç gölge yayı. Havada (altı boş) duran saha bloğu "panoya asılı" okunur; kamyon dökümü ise düşer (K-25), iki davranış görsel olarak ayrılır |
| sahaya bırakma önizlemesi | #FFFFFF %60 | blok saha hücrelerine değerken oturacağı hücrelerde 4 px noktalı kontur (nokta 4, aralık 10), hücre kenarından 6 px içeride (`stroke.yardPreviewPx`, `alpha.yardPreview`; UX §5.3). Şantiyedeki düşüş gölgesinin (renkli gövde + rozet) deseninden ayrıdır |
| saha üstü hava | `board.craneSky` | Hy < H iken sahanın üstündeki satırlar: zeminsiz gök bandı, ızgara/delik/çerçeve yok (UX §5.8) |

### 2.5 Blok tonları v2 (Faz 2R)

**Taban renkleri değişmedi** (§2.1; renk kodları W Y G R O C B P, semboller ve renk körü doğrulaması aynen geçerli).
v2'nin "şeker" görünümü tabandan **formülle** türetilen altı tondan gelir (`tokens.blockV2`; kod formülü uygular,
`check.v2.*` ±1 salt kontroldür):

- **açık (light)** = taban·0,68 + beyaz·0,32 (`lightMix`) — yastık gradyanının üst durağı
- **alt (bottom)** = taban × 0,92 (`bottomFactor`) — yastık gradyanının alt durağı
- **oluk (groove)** = taban × 0,88 (`grooveFactor`) — yastıklar arası yüz ve dış kenar payı
- **yan duvar (dark)** = taban × 0,68 (`darkFactor`) — alt kenarda görünen kalınlık, iç gölge rengi
- **kontur (outline)** = taban × 0,42 (`outlineFactor`) — 6 px dış kontur, beyaz sembol kabartma gölgesi
- **ışıltı (glow)** = taban·0,45 + beyaz·0,55 (`glowMix`) — kaldırma halkası, kıvılcım ve konfeti kenarı

| Kod | Taban | Açık | Alt | Oluk | Yan duvar | Kontur | Işıltı | Sembol kontrastı (taban / sembol üst kenarı) |
| --- | ----- | ---- | --- | ---- | --------- | ------ | ------ | -------------------------------------------- |
| W | #764012 | #A27D5E | #6D3B11 | #683810 | #502C0C | #321B08 | #C1A994 | 7,4 / 6,4 |
| Y | #FFE23E | #FFEB7C | #EBD039 | #E0C737 | #AD9A2A | #6B5F1A | #FFF2A8 | 5,3 / 5,4 |
| G | #44D088 | #80DFAE | #3FBF7D | #3CB778 | #2E8D5C | #1D5739 | #ABEAC9 | 4,5 / 4,7 |
| R | #CF404E | #DE7D87 | #BE3B48 | #B63845 | #8D2C35 | #571B21 | #E9A9AF | 4,2 / 3,9 |
| O | #EC8D20 | #F2B167 | #D9821D | #D07C1C | #A06016 | #633B0D | #F6CC9B | 4,1 / 4,3 |
| C | #C8CFDA | #DADEE6 | #B8BEC9 | #B0B6C0 | #888D94 | #54575C | #E6E9EE | 4,9 / 5,1 |
| B | #2984DE | #6DABE9 | #2679CC | #2474C3 | #1C5A97 | #11375D | #9FC8F0 | 3,5 / 3,2 |
| P | #5D3AAE | #9179C8 | #5635A0 | #523399 | #3F2776 | #271849 | #B6A6DB | 6,9 / 6,0 |

**Sembol kontrastı (ölçüldü, WCAG 1.4.11 eşiği 3:1).** Mürekkep kuralı §2.2 ile aynı (L\* ≥ 60: taban × 0,40, %100;
L\* < 60: beyaz). v2'de beyaz mürekkep **%92** (`blockV2.symbolWhiteAlpha`; v1 %85) çünkü gradyanın açık durağı
sembolün üst kenarına değer. "Sembol üst kenarı" sütunu sembol kutusunun en üst satırındaki gradyan rengine göre en
kötü değerdir: gradyan durağı yastık yüksekliğinin **%30**'unda (`gradientStop`) bitiyor; durak %42 olsaydı B 2,9:1'e
düşüyordu (eşik altı), bu yüzden %30 seçildi. En düşük değer B 3,2:1; beyaz sembolün altındaki 4 px koyu kabartma
gölgesi (§3A katman 7) kenar kontrastını ayrıca taşır.

**Renk körlüğü (aynı yöntem §2.2: Machado 2009 + Brettel 1997, CIEDE2000, en kötü model).** Kimlik taban rengiyle
okunur: yastık alanının %70'i taban ya da daha koyu tondadır. Türetilen tonlar ayrıca ölçüldü:

| Ton | Normal | Deutan | Protan | Tritan |
| --- | ------ | ------ | ------ | ------ |
| Taban (değişmedi) | 26,3 (W–R) | 14,4 (Y–O) | 14,1 (W–R) | 16,6 (G–B) |
| Açık | 19,3 (Y–O) | 9,4 (B–P) | 11,6 (G–O) | 10,3 (G–B) |
| Yan duvar | 20,5 (W–R) | 9,6 (B–P) | 11,2 (W–R) | 12,3 (R–O) |

Açık ve yan duvar tonları tek başına kimlik taşımadığı için (yalnız gradyan ucu ve 12 px şerit) 12'nin altındaki
değerler kabul edilir; bu çiftler (B–P, G–O, G–B) sembolle ayrışır (parıltı ↔ elmas, yaprak ↔ kiremit dalgası,
yaprak ↔ parıltı).

### 2.6 Arayüz renkleri v2 (UI kiti)

§2.3 renkleri geçerlidir; v2 kiti (§14) kendi dörtlülerini `tokens.kit.*` altında taşır (`color.ui.*` değişmedi):

| Token | Üst / Yüz / Kalınlık / Kontur | Kullanım |
| ----- | ----------------------------- | -------- |
| `kit.buttonColor.green` | #8BE36A / #4CC23F / #2E8A2A / #16501A | birincil: "Bölüm N", "Devam", "Oyna" |
| `kit.buttonColor.orange` | #FFC966 / #FF9A1F / #C46A00 / #6E3600 | satın alma ve teklif: "+5 hamle", "Al" |
| `kit.buttonColor.blue` | #7FD0FF / #2E9BF0 / #1767B5 / #0B3A6E | araç düğmesi: ayar dişlisi, bilgi (i) |
| `kit.buttonColor.cream` | #FFFFFF / #FFF4D6 / #D9B878 / #6B4A26 | nötr: "Hayır, teşekkürler", "Bölümden çık", duraklat |
| `kit.buttonColor.red` | #FF8A7E / #EC4A3C / #A82A22 / #5E1410 | kapat (×) |
| `kit.buttonColor.grey` | #D6D1C8 / #B9B2A5 / #8C8579 / #5C564D | pasif ve kilitli |

Beyaz yazı yeşil yüzde ham olarak 2,3:1'dir; 0,16 em koyu kontur (#16501A üstünde beyaz 9,6:1) ve 0,07 em gölge
okunurluğu taşır (türün yerleşik dili, §2.3 notu). Krem düğmede yazı `ui.ink` (12,5:1), kontursuz.

---

## 3. Blok render tarifi (prosedürel)

> **v1 — Faz 2'nin bugünkü çizimi.** Faz 2R'de bu tarifin yerini **§3A (v2)** aldı. Bu bölümün tabloları
> `tests/review/services-theme.review.test.ts` ve `tests/theme/*` tarafından okunduğu için code-lead v2 çiziciyi ve
> testlerini getirene kadar metin değiştirilmez; v2 birleşince bu bölüm (3.1 sembol tarifleri hariç) silinir ve
> `block.*` v1 anahtarları kaldırılır (code-lead'e liste: dönüş notu). Sembol yolları (§3.1) v2'de aynen kullanılır.

**Yaklaşım: bölüm başında parça bazlı pişirme** (code-lead önerisi, kabul). Bölümde geçen her (şekil × renk × bayrak)
birleşimi için **bir doku** Canvas2D ile çizilir (tipik ≤ 24 doku, en çok 360×360), `CanvasTexture`'a yüklenir; tahtada
parça başına tek `Image`. Böylece kesintisiz dış kontur, yuvarlak dış köşe, **içbükey (iç) köşe**, ilk hücre parlaması,
iç dikiş ve sembol birebir çizilir (4-komşu hücre maskesi iç köşeyi ve parça düzeyindeki parlamayı taşıyamıyordu).
Temas gölgesi, kaldırılmış gölge ve gölge parıltısı için şekil başına ayrı **siluet dokusu** pişirilir (çalışma anında
Filter yok). Renk körü modu açılınca dokular yeniden pişirilir (~10–30 ms). Hücre karosu yalnız plan hücreleri için
kalır. Bitişik iki aynı renkli blok konturla ayrılır.

Ölçüler hücre boyu `c` = `layout.grid.cellPx` 120 px'e göredir (oranlar `tokens.json` → `block`).

| Katman | Tarif | 120 px'te |
| ------ | ----- | --------- |
| 0. Yerleşim | Bloklar arası boşluk: blok dış kenarları 0,025c içe çekilir. | 3 px |
| 1. Taban | Düz `color.block.X`. Dış köşe yarıçapı 0,18c (`block.cornerRadiusRatio`); komşu olan kenarlarda köşe yok. **İç (içbükey) köşe** (L, T, C3): kontur 6 px'lik çeyrek yayla döner, yarıçap 0,06c (`block.innerCornerRadiusRatio`). | r = 22 / 7 px |
| 2. Üst ışık (bevel) | Üstü açık kenarlarda 0,14c yüksekliğinde bant, taban + %20 beyaz karışım. Solu açık kenarlarda 0,06c bant, %10 beyaz. | 17 px / 7 px |
| 3. Alt gölge | Altı açık kenarlarda 0,16c bant, taban × 0,75. Sağı açık kenarlarda 0,06c bant, taban × 0,88. | 19 px / 7 px |
| 4. Parlama | Parça düzeyinde: üstü **ve** solu açık olan hücrelerden en üst-soldakinde beyaz %28 hap: x 0,14c, y 0,12c, g 0,34c, y 0,10c, tam yuvarlak. | 41×12 px |
| 5. İç dikiş | İki komşu hücre arasında 3 px çizgi, taban × 0,85, %60 opak (blok kaç hücre, okunur). | 3 px |
| 6. Kontur | Bloğun dış sınırında 6 px (≈ 2 pt), taban × 0,55 (%45 koyu). | 6 px |
| 7. Sembol | Her hücrenin ortasında, kutu 0,46c; mürekkep §2.2'deki kurala göre. | 55 px |
| 8. Temas gölgesi | Tahtada dururken: `shadow.contact` (y +4, 6 px bulanık, #000 %12); pişirilmiş siluet. | — |
| 9. Kaldırılmış gölge | Sürüklerken: `shadow.lifted` (y +18, 16 px bulanık, #000 %30); vinç alanında `shadow.crane` (y +30, %20); blok ×1,08. | — |

Hesaplanmış katman renkleri (kodda formülle üretilir; `tokens.json` → `check.*` salt kontrol, test ±1):

| Kod | Taban | Üst ışık (+%20) | Alt gölge (×0,75) | Kontur (×0,55) | Sembol mürekkebi |
| --- | ----- | --------------- | ----------------- | -------------- | ---------------- |
| W | #764012 | #916641 | #58300E | #41230A | #FFFFFF %85 |
| Y | #FFE23E | #FFE865 | #BFAA2E | #8C7C22 | #665A19 |
| G | #44D088 | #69D9A0 | #339C66 | #25724B | #1B5336 |
| R | #CF404E | #D96671 | #9B303A | #72232B | #FFFFFF %85 |
| O | #EC8D20 | #F0A44D | #B16A18 | #824E12 | #5E380D |
| C | #C8CFDA | #D3D9E1 | #969BA4 | #6E7278 | #505357 |
| B | #2984DE | #549DE5 | #1F63A6 | #17497A | #FFFFFF %85 |
| P | #5D3AAE | #7D61BE | #462C82 | #332060 | #FFFFFF %85 |

**Bayrak katmanları** (renk bloğunun üstüne, sembolün altına):

| Bayrak | Görsel |
| ------ | ------ |
| `glass` (S3) | Taban %78 opak; iki çapraz beyaz çizgi (%55, 8 px ve 4 px, 35°); sağ alt köşede 28 px "çatlak cam" rozeti (beyaz üçgen kırık çizgi). Kontur beyaz %70, 4 px (normal konturun içinde). |
| `mortar` (Y8) | Alt kenardan sarkan 3 gri harç damlası (#B9B4AA, kontur #7D776C), sağ üstte 32 px mala rozeti. |
| `balloon` (S8) | Bloğun üst ortasına bağlı 1 balon (1×1–1×2 bloklarda) ya da 2 balon (daha geniş): beyaz balon #FFFFFF, kontur #3B2A1A, ip 3 px. Boşta 2 s sinüs, ±4 px yüzme. |
| `chained` (Y3) | Bloğun üstünde çapraz iki zincir (halkalar 22×14 px, #6E7681, kontur #3F454D); merkezde 40 px asma kilit (#FFC21A). |
| `wet` (Y4) | Bloğun üstünde parlak gri ıslak beton tabakası (#8E959E %55) + 2 beyaz parlama; sağ üstte sayaç rozeti (Ø 48 px, krem zemin, `ui.ink` rakam, Baloo 2 800, 34 px). Sembol %50 opak (blok hâlâ okunur). |

### 3.1 Sembol vektör tarifleri

Her sembol 100×100 birimlik kutuda tanımlıdır; hücrede 0,46c kutuya ölçeklenir (120 px'te 55 px). Çizgi kalınlığı
birim cinsindendir (×0,55 → px). `stroke-linecap: round; stroke-linejoin: round`. Dolgu ve çizgi = sembol mürekkebi.
Siluetler bilinçli olarak farklı yapıdadır (dalgalı çizgi / nokta / dolu yaprak / ızgara / kavis / X / yıldız / eşkenar
dörtgen) — gri tonlamada da ayırt edilirler.

| Kod | Sembol | SVG yolu (100×100) |
| --- | ------ | ------------------ |
| W | ağaç damarı | `<path d="M10 24 C30 14 50 34 90 22" stroke-width="9" fill="none"/>` `<path d="M10 50 C22 42 34 58 48 50" stroke-width="9" fill="none"/>` `<ellipse cx="70" cy="51" rx="11" ry="7" stroke-width="7" fill="none"/>` `<path d="M10 76 C30 66 50 86 90 74" stroke-width="9" fill="none"/>` (budak sağda; ortada olursa göze benziyor) |
| Y | üç nokta | `<circle cx="50" cy="28" r="13"/>` `<circle cx="27" cy="70" r="13"/>` `<circle cx="73" cy="70" r="13"/>` (dolu) |
| G | yaprak | `<path d="M18 82 C18 40 46 14 86 14 C86 54 60 82 18 82 Z"/>` (dolu) + damar `<path d="M24 76 L68 32" stroke="TABAN" stroke-width="7"/>` |
| R | tuğla derzi | `<rect x="10" y="16" width="80" height="68" rx="10" stroke-width="8" fill="none"/>` `<path d="M10 50 H90 M50 16 V50 M30 50 V84 M70 50 V84" stroke-width="8"/>` |
| O | kiremit dalgası | `<path d="M8 44 Q22 18 36 44 Q50 18 64 44 Q78 18 92 44" stroke-width="9" fill="none"/>` `<path d="M8 80 Q22 54 36 80 Q50 54 64 80 Q78 54 92 80" stroke-width="9" fill="none"/>` |
| C | çapraz tarama | `<path d="M18 50 L50 18 M18 82 L82 18 M50 82 L82 50 M18 50 L50 82 M18 18 L82 82 M50 18 L82 50" stroke-width="8"/>` |
| B | parıltı | `<path d="M46 8 C50 36 58 44 86 48 C58 52 50 60 46 88 C42 60 34 52 6 48 C34 44 42 36 46 8 Z"/>` + `<path d="M82 8 C83 16 85 18 93 19 C85 20 83 22 82 30 C81 22 79 20 71 19 C79 18 81 16 82 8 Z"/>` (dolu) |
| P | elmas | `<path d="M50 8 L90 42 L50 92 L10 42 Z"/>` (dolu) + faset `<path d="M10 42 H90 M30 42 L50 8 L70 42 L50 92" stroke="TABAN" stroke-width="6" fill="none"/>` |

`TABAN` = bloğun taban rengi (sembolün içine "oyma" çizgi). Renk körü modunda (§10) semboller ×1,2 büyür.

---

## 3A. Blok çizim şartnamesi v2 — "şeker blok" (Faz 2R)

Kaynak token: `tokens.blockV2` (oranlar hücre boyu `c` = 120 px'e göre; yastık içi konumlar yastık dikdörtgeninin
`w`/`h`'sine göre). Tonlar §2.5. Doğrulama: `scratchpad` prototipinde Chromium Canvas2D ile 8 renk × 9 şekil, kaldırılmış
blok ve 6 düğme varyantı çizildi (§12).

**Pişirme modeli değişmez (§3 ilk paragraf):** bölüm başında parça bazlı (şekil × renk × bayrak) tek `CanvasTexture`,
şekil başına bulanık siluet dokuları, renk körü modunda yeniden pişirme. Doku boyu v1 ile aynıdır (`w·c × h·c`); 12 px
yan duvar **parçanın kendi kutusunun içindedir**, alttaki hücreye taşmaz (ızgara okunurluğu korunur).

### 3A.1 Geometri — yollar

1. **Siluet `S`:** polyomino dış hattı (hücre kenarları birleşimi, saat yönünde), her kenar 3 px içe (`insetPx`). Dış
   (dışbükey) köşe yarıçapı 0,20c = **24 px**, iç (içbükey) köşe 0,07c = **8 px** (`cornerRadiusRatio`,
   `innerCornerRadiusRatio`; köşeler `arcTo` ile).
2. **Gövde `B`:** `S` her kenarda 6 px daha içe (`outlinePx`); köşe yarıçapları 18 / 6 px (24 − 6; iç köşe en az 2 px).
3. **Yüz `F`:** `B`'nin yalnız **altı açık** (aşağıya bakan) kenarları 12 px yukarı ötelenmiş hâli (`lipPx`); öteki
   kenarlar `B` ile aynı. Hesap (dik açılı çokgende kesin): her kenar kendi iç normali yönünde ötelenir (yatay kenar
   y'de, dikey kenar x'te); her köşe, komşu iki kenarın ötelenmiş doğrularının kesişimidir. L, T, S şekillerindeki iç
   basamaklarda da alt kenar ötelenir; böylece her basamakta yan duvar görünür.
4. **Yastık `P(x, y)` (hücre başına):** hücre dikdörtgeninden içe pay: komşusu **olan** kenarda 0,06c = **7 px**
   (`pillowInsetRatio`), komşusu **olmayan** kenarda 0,12c = **14 px** (`pillowOpenInsetRatio`), altı açık kenarda ek
   olarak +12 px (`lipPx`). Köşe yarıçapı 0,16c = **19 px**. Örnekler: 1×1 blokta yastık x 14,4–105,6, y 14,4–93,6 (≈ 91×79);
   yatay I4'ün iç hücrelerinde x 7–113 (106 genişlik), uç hücrelerde 99; komşu iki yastık arasında 14 px oluk.

### 3A.2 Katmanlar (çizim sırası)

| # | Katman | Tarif | 120 px'te |
| - | ------ | ----- | --------- |
| 0 | Temas gölgesi | Pişirilmiş siluet, `shadow.contact` (y +4, 6 px bulanık, siyah %12) — v1 ile aynı | — |
| 1 | Kontur | `S` dolgusu **kontur** tonu (taban × 0,42); `B` üstüne çizildiği için 6 px halka olarak kalır | 6 px |
| 2 | Yan duvar | `B` dolgusu **yan duvar** tonu (× 0,68); yüz yukarı kaydığı için yalnız altı açık kenarlarda 12 px şerit görünür | 12 px |
| 3 | Yüz / oluk | `F` dolgusu **oluk** tonu (× 0,88); yastıkların arasında (14 px) ve çevresinde (dış kenarda 5 px) kalan kısım | 5–14 px |
| 4 | Yastık | `P` dolgusu dikey doğrusal gradyan: durak 0 → **açık**, durak 0,30 → **taban**, durak 1 → **alt** (× 0,92) | — |
| 5 | İç gölge | Yastığa kırpılı, yastığın alt %18'i (`innerShadeRatio`): **yan duvar** tonu α 0 → α 0,28 (`innerShadeAlpha`) | 14–15 px |
| 6 | Parlama | Her yastıkta beyaz elips: merkez (0,34w, 0,13h), yarıçap (0,22w, 0,06h), −8° döndürülmüş, α 0,50 (`glossEllipse`, `glossRotDeg`, `glossAlpha`) + beyaz nokta: merkez (0,70w, 0,12h), r 0,035c = 4 px, α 0,80 (`glossDot`) | elips 40×10 px (1×1) |
| 7 | Sembol | Yastık merkezinde (0,5w, **0,54h**; `symbolCenterYRatio`), kutu 0,42c = **50 px** (`symbolSizeRatio`), §3.1 yolları. **Kabartma:** koyu mürekkepli renklerde (Y C G O) önce beyaz α 0,45 kopya **+3 px aşağıda** (`embossLight*`; oyma izi), beyaz mürekkepli renklerde (W R B P) önce **kontur** tonu α 0,55 kopya **+4 px aşağıda** (`embossDark*`; gölge), sonra asıl sembol. Sembol içi "oyma" çizgileri (G damarı, P fasetleri) **taban** renginde | 50 px |
| 8 | Bayrak katmanları | `glass`, `mortar`, `balloon`, `chained`, `wet` (§3 tablosu, Faz 3): yastıkların üstüne, sembolün altına; konumlar hücre yerine yastık dikdörtgenine göre | — |

**Durum katmanları (pişirilmez, çalışma anında):**

| Durum | Görsel | Token |
| ----- | ------ | ----- |
| Kaldırılmış (sürükleme) | ölçek × 1,08 (`drag.liftScale`) + `shadow.lifted` (vinç alanında `shadow.crane`) + **ışıltı halkası**: siluetin 10 px genişletilmiş pişirilmiş kopyası, **ışıltı** tonunda α 0,35, bloğun arkasında (`liftGlowPx`, `liftGlowAlpha`; JUICE #91) | `blockV2.liftGlow*` |
| Yerleşti (doğru) | v1 #12 dolumu + pişirilmiş siluetin üstünde 260 ms beyaz **ADD flaşı** (bütün siluet aynı anda, α 0 → 0,60 → 0, `placedSheenAlpha`; eğik süpürme bandı **yok** — maske gerektirmez, CL-2R-25, JUICE kural 11) + 6 adet 4 köşeli kıvılcım (JUICE #92); köşe harç noktaları (§4) kalır | `blockV2.placedSheenAlpha` |
| İptal öngörüsü | %60 opak + "↩" rozeti (UX §5.3) — değişmedi | — |
| Tutulabilir (K-09; DL-2R-17) | tam parlama: yastık elipsi + çıkıntı parlama yayı + çıkıntı parlama noktası (§3A.5) | — |
| Tutulamaz (K-09; DL-2R-17) | çıkıntının parlama yayı ve noktası **yok**, parça ×0,92 koyulaşır (`setTint` `blockV2.notHoldableTint` #EBEBEB); ton ilişkisi ve sembol aynı. Uygulama: çıkıntı parlaması parçadan **ayrı** pişirilen renksiz beyaz bir dokudur (şekil başına 1 doku, en çok 9; renkten bağımsız), yalnız tutulabilir parçanın üstüne konur. Küme `holdableIds` her hamle sonunda ve teslimattan sonra (UX §5.3); geçiş 160 ms | `blockV2.notHoldableTint` |
| Taşınamaz (dokunuş) | v1 titreme + ötelemeyi kesen bütün komşuların 300 ms vurgusu (UX §5.3) | — |

### 3A.3 Birleşik blok (hücreler arası)

- Parça **tek kontur ve tek yan duvar** taşır: dış hat kesintisizdir, içbükey köşeler 8 px yayla döner; iki hücre
  arasında kontur çizilmez.
- Hücre sayısı yastıklardan okunur: komşu iki yastık arasında 14 px **oluk** (taban × 0,88) kalır; v1'deki 3 px iç dikiş
  çizgisi v2'de yoktur.
- Parlama **her hücrede** tekrarlanır (v1'de parça başına bir tane): şeker hissi buradan gelir; tahtada 48 hücrelik
  dolu sahada da tekrar ritmi "taneli" bir yüzey verir, tek bir büyük parlama noktası oluşmaz.
- Bitişik iki **aynı renkli** blok yine iki ayrı konturla ayrılır (3 px pay × 2 + 6 px kontur × 2 = 18 px ayrım: kontur
  6 px · zemin 6 px · kontur 6 px). **Ölçüm (PL-2R-13 a, sRGB çarpanı, CIELAB L\*):** blok içi oluk (taban × 0,88) ile
  kontur (× 0,42) arasındaki fark en az ΔL\* 16,6 (W; P 17,4, R 23,5, B 25,5, O 30,8, G 33,9, C 37,1, Y 40,0), kontrast en
  az 1,68:1 (W). İki blok arasındaki ayrım bandında saha zemini (#E9C891) kontura karşı en az 4,0:1'dir (Y; W 10,2). Yani
  "iki blok" ipucu = koyu–açık–koyu 18 px bant (≥ 4:1), "tek blok" ipucu = orta tonlu 14 px oluk (≤ 3,8:1). Ayrıca her
  hücrenin kendi çıkıntısı vardır (§3A.5); hücre sayısı çıkıntı sayısından da okunur.
- Renk körü modu: sembol × 1,2 (60 px; yastığın en dar hâline, 80 px, sığar), mürekkep kuralı §10; tonlar değişmez.

### 3A.4 Canvas2D çizim sırası (code-lead için birebir)

```
c = cellPx; poly = rectilinearOutline(cells) × c
S = offsetEdges(poly, 3, 3, 3, 3);  B = offsetEdges(S, 6, 6, 6, 6);  F = offsetEdges(B, top 0, right 0, bottom 12, left 0)
trace(S, R=0.20c, r=0.07c); fill(outline)
trace(B, R−6, max(2, r−2)); fill(dark)
trace(F, R−6, max(2, r−2)); fill(groove)
for each cell (x, y):
  P = cellRect(x, y) inset { shared: 0.06c, open: 0.12c, openBottom: 0.12c + 12 }
  roundRect(P, 0.16c); fill(linearGradient(P.top → P.bottom: 0 light, 0.30 base, 1 bottom))
  clip(P); fillRect(P.x, P.bottom − 0.18·P.h, P.w, 0.18·P.h, gradient dark α0 → α0.28); unclip
  ellipse(P.x + 0.34·P.w, P.y + 0.13·P.h, 0.22·P.w, 0.06·P.h, −8°); fill(white α0.50)
  if !studEnabled: circle(P.x + 0.70·P.w, P.y + 0.12·P.h, 0.035c); fill(white α0.80)
  # §3A.5 stud (R2-12): d = min(0.54c, P.w − 12, P.h − 18); sc = (P.cx, P.y + (P.h − 6)/2)
  circle(sc + (0, 6), d/2); fill(dark); circle(sc, d/2); fill(base); stroke(outline α0.45, 2 px)
  [holdable layer, baked separately] arc(sc, 0.42d, 205°→285°, 5 px, white α0.50); circle(sc + polar(225°, 0.30d), 4); fill(white α0.80)
  symbol at sc, size min(0.42c, 0.82d): emboss copy (+3 px white α0.45 | +4 px outline α0.55), then ink
  (studEnabled = false iken: glossDot yastıkta, symbol at (P.cx, P.y + 0.54·P.h), size 0.42c — v2 ilk tarifi)
```

`offsetEdges` tek bir saf fonksiyondur (birim testi: L4 ve T4 için köşe koordinatları); gradyan, elips ve kırpma
Canvas2D çağrılarıdır (Phaser Graphics değil; §1 ilke 6). Bölüm başı pişirme bütçesi v1'den yüksektir (hücre başına
+1 gradyan, +1 kırpma, +2 dolgu): tahmin ≤ 24 doku × ≈ 1,5 ms; perf kapısı `npm run perf` (code-lead) ölçer.

### 3A.5 Çıkıntı (stud) — oyuncak tuğla katmanı (Faz 2R, R2-12)

Proje sahibinin referansındaki "çıkıntılı oyuncak tuğla" ilkesi Minik Usta'nın inşaat temasına birebir uyar. Özgün
uygulamamız: **hücre başına tek büyük çıkıntı** ve **sembol çıkıntının tepesinde** (referanstaki hücre başına 2×2 küçük
çıkıntı ve okla işaretli özel bloklar kullanılmaz, §11.8). Çıkıntı yalnız malzeme bloklarındadır; plan hücresi, düşüş
gölgesi, Ağır Yük, kasa ve torba çıkıntısızdır (blok ↔ plan ↔ yük ayrımı büyür). Değerler `tokens.blockV2.stud*`.

| # | Katman (yastık `P` çizildikten sonra, sembolden önce) | Tarif | 120 px'te (iç hücre / 1×1) |
| - | ------------------------------------------------------ | ----- | -------------------------- |
| 6a | Geometri | çap `d = min(0,54c, P.w − 12, P.h − 12 − 6)` (`studDiameterRatio`, `studMarginPx` 6, `studSidePx` 6); merkez `(P.cx, P.y + (P.h − 6)/2)` | d 65 / 61 px |
| 6b | Yan (kalınlık) | merkezden 6 px aşağıdaki aynı çaplı daire, **yan duvar** tonu (taban × 0,68); üstteki yüz örttüğü için altta 6 px hilal kalır | 6 px hilal |
| 6c | Üst yüz | çap `d` daire, **taban** rengi düz dolgu (gradyan yok: sembol kontrastı §2.5 "taban" sütunu aynen geçerli, en düşük B 3,5:1) | — |
| 6d | Kenar | üst yüzün çevresinde 2 px **kontur** tonu α 0,45 (`studRimPx`, `studRimAlpha`) | — |
| 6e | Parlama yayı (yalnız tutulabilir) | yarıçap 0,42d, 205° → 285° (sol üst), 5 px beyaz α 0,50, uçlar yuvarlak (`studGlossArc`, `studGlossWidthPx`, `studGlossAlpha`) | — |
| 6f | Parlama noktası (yalnız tutulabilir) | açı 225°, yarıçap 0,30d konumunda r 4 px beyaz α 0,80 (`studDot`). §3A.2 katman 6'daki yastık parlama **noktası** çıkıntı varken çizilmez (yastık parlama elipsi kalır) | — |
| 7 | Sembol | çıkıntı merkezinde; kutu `min(0,42c, 0,82d)` (`studSymbolMaxRatio`); kabartma kuralı §3A.2 katman 7 ile aynı | 50 / 50 px |

- 6e ve 6f renksizdir; tutulabilirlik görünümü için ayrı pişirilir (§3A.2 durum tablosu "Tutulamaz"). Renk körü
  modunda sembol × 1,2 (60 px) çıkıntının dışına 0–4 px taşabilir; kabul (sembol okunurluğu önce gelir).
- Yerleşmiş (kilitli) bloklar çıkıntısını korur (yapı "tuğla tuğla" görünür); düşüş gölgesi ve plan hücreleri düz kalır.
- **Doğrulama (blockout önce, §13):** Faz 2R görsel uygulamasında 8 renk × {B1, D2_0, D2_90, O4, C3, L4} prototipi
  Chromium'da 375 pt'de çizilir; kabul ölçütleri §12 "Faz 2R kabul testleri" (sembol ayırt etme 5/5, iki blok/tek blok
  5/5, tutulabilirlik 4/5). Ölçüt tutmazsa ilk geri dönüş: `studDiameterRatio` 0,54 → 0,48 (sembol yastığa taşar,
  çıkıntı halka gibi okunur); ikinci: çıkıntı kapatılır (`studEnabled` false), v2 yastık aynen kalır.
- Pişirme maliyeti: hücre başına +4 dolgu, +1 yay; tahmin ≤ 24 doku × ≈ 1,8 ms (perf kapısı code-lead).

---

## 4. Şantiye (ozalit) ve plan hücreleri

> **Faz 2R (v2) değişiklikleri:**
> - **Genişlik değişken (R2-02):** şantiye `site.cols` = 1–4 sütun, `rows` = 4–8 satır; bütün tarifler sütun sayısından
>   bağımsızdır (ızgara her hücre, kalın ızgara her 2 hücre, iskele iki yanda). Yerleşim UX §5.8.
> - **İskele v2 (hacimli):** iki yanda dikey boru 16 px, yatay gradyan #C6CED6 → #6E7A87 + 3 px `ui.ink` kontur; tepede
>   40 px vinç alanına uzanır; her 2 satırda yatay kuşak (10 px `board.scaffold`) ve uçlarda turuncu kelepçe 24×20
>   (`board.scaffoldClamp`, 3 px kontur). Ozalit zemin ve plan hücresi tarifleri aşağıdaki gibi kalır (plan hücresi düz
>   ve kesik konturlu olduğu için şeker bloktan bir bakışta ayrışır; v2 farkı büyüdü).
> - **`.` hücresi MVP'de yok (R2-01):** plan şantiyeyi tamamen kaplar. Aşağıdaki `.` tarifi product-lead'in olası ÖNERİ'si
>   için korunur; MVP bölümlerinde çizilmez.
> - **Tam örtü (R2-01, K-48):** son plan hücresi dolunca sahada **malzeme bloğu** kalmaz; Ağır Yük, kasa ve torba
>   kalabilir (malzeme değildir). "Bütün bloklar yerinde" anı JUICE #94 (tetik K-48'in sağlandığı an; PL-2R-07).


- **Zemin:** `board.blueprint` #1F4F8F; ince ızgara her hücre (beyaz %14, 2 px), kalın ızgara her 2 hücre (beyaz %24,
  3 px); sol alt köşede 0,6c'lik "pafta" köşebendi (beyaz %30 L çizgisi). Kâğıt dokusu: 2 px'lik rastgele beyaz %4
  benekler (tohumlu gürültü, sabit).
- **İskele:** şantiyenin iki yanında dikey boru (16 px, `board.scaffold`, üstte ışık 4 px), her 2 satırda yatay
  kuşak borusu (10 px, %70 opak) ve birleşim yerlerinde turuncu kelepçe (20×20, `board.scaffoldClamp`). Dilim
  tamamlanınca iskele söner (%100 → %30 opaklık `alpha.segmentDoneScaffold`, 200 ms `duration.scaffoldFade`; JUICE #18).
- **Tavan kirişi (S8 balon tavanı, product-lead P-3):** aktif dilimin plan tepesinde (satır `h + e` sınırı) **her
  bölümde** yatay çelik kiriş: 12 px (`plan.ceilingBeamPx`) `board.scaffold` boru + iki uçta turuncu kelepçe. Plan
  yüksekliğini bir bakışta gösterir; asansörde (S6) çerçeveyle birlikte hareket eder. Balon kirişe çarpınca 2 küçük
  sekme yapar ve ipi kirişe bağlanır (JUICE #43).
- **Katman sırası** (alttan üste): ozalit zemin → plan hücreleri → **ozalit ızgara katmanı** (dilim başına önceden
  çizilmiş tek saydam doku) → W1 rayı ve #22 ışığı (§5) → inşa cephesi konturu → yerleşmiş bloklar → tavan kirişi →
  gölge → sürüklenen blok.
- **Plan hücresi (renk):** içe 8 px çekik, köşe yarıçapı 0,14c; önce açık altlık `board.planUnderlay` #BCCADD,
  üstüne renk %80 (`alpha.planFill`; renk körü modunda `a11y.colorBlindPlanFill` %90 — formül esastır, bileşik hex
  `check.plan` yalnız kontroldür; dolgu opak olduğu için düz renk çizilir); kontur 4 px **kesik** (14 px çizgi, 10 px boşluk), bileşik dolgu × 0,65; sembol
  %100, mürekkep (`color.planInk`): Y, G, O, C **ve B** plan hücrelerinde koyu lacivert #14233D; W, R, P'de beyaz %100
  (`alpha.planInkLight` 1,0). Plan sembolü renk körü oyuncu için rengin ikincil taşıyıcısıdır; her durumda WCAG 1.4.11
  ≥ 3:1 (ölçüldü; varsayılan / inşa cephesi +%15 açık): W 5,9 / 4,3 · R 4,0 / 3,2 · P 5,6 / 4,1 · B 4,8 / 5,8 · Y 11,4 ·
  G 8,1 · O 6,6 · C 9,9; renk körü modu (%90 dolgu) en düşük R 3,5. Eski B beyaz %90 (2,9:1, cephede 2,5:1) eşiğin
  altındaydı. Bevel, parlama ve gölge **yok**. Ozalit ızgarası plan hücrelerinin üstünden geçer (beyaz %14). Bileşik plan renkleri (kontrol için):
  W #845C3B · Y #F2DD5E · G #5CCF99 · R #CB5C6B · O #E29946 · C #C6CEDB · B #4692DE · P #7057B7.
- **`.` hücresi (boş kalacak):** dolgu yok; 45° beyaz %28 çapraz tarama (4 px çizgi, 16 px aralık); 3 px beyaz %40 kesik
  kontur. Pencere/kapı/kemerde komşu `.` hücreleri tek bir kemer/pencere çerçevesi olarak birleşik çizilir (dış hatta
  4 px beyaz %55 düz çizgi).
- **`?` hücresi (gizli):** dolgu beyaz %10; 4 px beyaz %60 kesik kontur; ortada 64×64 "kâğıt etiket" (krem #FFF4D6, 4 px
  ip deliği) üstünde `?` (Baloo 2 800 glifi, 52 px, `ui.ink`; el yazısı değil). Doğru dolunca etiket kart gibi döner
  (bkz. JUICE) ve plan rengi + sembol açılır. `?` hücresine değen gölge bütün zorluklarda nötrdür.
- **İnşa cephesi (K-34, R-01):** her şantiye sütununda doldurulabilir en alt boş plan hücresi (altındaki bütün hücreler
  doğru dolu ya da **boş** `.`; sütun tamamsa ya da altında yanlış nesne — moloz, yapışmış harçlı blok — duran bir `.`
  varsa o sütunda cephe yok, GDD K-34 kanca 1, E-43) iki katmanla çizilir (ASSET §3):
  1. **Hücre: `plan_<c>_front`** — plan hücresinin aynı tarifi; yalnız **dolgu** +%15 açılır: bileşik dolgu %15 beyazla
     karışır (`plan.frontLighten`; dolgu × 0,85 + #FFFFFF × 0,15; renk körü modunda %90'lık bileşikten aynı formül).
     Kesik kontur açılmış dolgudan × 0,65 hesaplanır (2. katmanın altında kalır). **Sembol ve mürekkebi değişmez**
     (%100, `color.planInk`); yukarıdaki kontrastların "inşa cephesi" değerleri bu modelle ölçüldü (beyaz perde sembolün
     üstüne de çekilseydi koyu mürekkep açılır, B 5,8 → 3,7 düşerdi).
  2. **Katman: `plan_front`** — yalnız **düz** 6 px kontur (`plan.frontStrokePx`, `board.buildFront`; plan kesik
     konturuyla aynı yol, kesikleri örter) + dış parlama `alpha.buildFrontGlow` (8 px bulanıklık). Dolgu, açıklık ve
     sembol **yok**; katman sırasındaki "inşa cephesi konturu" budur.
  Diğer boş hücreler kesik konturda kalır. `?` hücresi cephedeyse açıklık almaz (renk bilgisi vermez); yalnız
  `plan_front` konturu etiketli hücreyi çerçeveler. (Faz 2R: Altın Mala hedefleri bu küme değildir; mala seçilen
  bloğun `P` konumlarını gölge diliyle gösterir, UX §5.2.)
- **Eksik destek taraması (K-34):** yatay çizgi (6 px, 20 px aralık, `color.ghost.support` %85), hücre konturunun
  içinde; **her sarı çizginin altında 10 px `ui.ink` %80 alt çizgi** (Faz 2 tur 2: sarı çizgi tek başına açık plan
  renklerinde kayboluyordu — Y #F2DD5E 1,15:1, G 1,14:1, C 1,03:1, O 1,39:1; sarı/koyu çift ikaz bandı gibi kendi
  içinde ≥ 5:1 ve her plan renginde ya da ozalitte en az bir kenarı ≥ 2,7:1 verir); renk uyuşmazlığının 45° taramasından yön olarak ayrılır. Taranan hücreler `missingSupport` kümesidir: doğru
  dolu olmayan plan hücreleri ve içinde yanlış nesne (moloz, yapışmış harçlı blok) duran `.` hücreleri; ikincisinde
  tarama nesnenin üstüne çizilir. Yalnız gölgede (Kolay/Normal) ve geri sekme ya da harç yapışmasından sonra 600 ms
  görünür.
- **Plan dışı:** `board.blueprintDeep` #173D70 düz dolgu, ızgara, benek ve köşebent yok (doku `board_blueprint_deep`,
  ASSET §3). Plan dışı = aktif dilimde `y ≥ h + e` şantiye hücreleri (GDD K-03, K-16 `outside`).
- **Yerleşmiş blok:** §3 tarifinin aynısı + kilit işareti: yerleştiği an hücre köşelerinde 4 küçük "harç" noktası
  (beyaz %50, 6 px) belirir ve kalır (K-14 kilit, dokunulmaz).
- **Düşüş gölgesi (K-18):** bkz. `UX_FLOWS.md` §5.4.

---

## 5. Duvar, geçitler ve vinç alanı

> **Faz 2R genelleme (R2-02, GDD K-49):** tahta `W = Wy + Ws` (≤ 8) sütun ve **H = max(Hy, Hs + eMax)** satırdır
> (saha Hy ve şantiye Hs farklı olabilir; yerleşim UX §5.8). Duvar sahanın son sütunuyla şantiyenin ilk sütunu
> arasındaki sınırdır (x = Wy−1 | Wy); görsel genişliği 60 px aynen. Vinç alanı tahtanın üstündeki **2 satırdır**
> (y = H ve H + 1). Açık yükseklik işareti **`(H + 2) − height`** çentik gösterir. Kural metni GDD'de (product-lead);
> buradaki sayılar yalnız görseldir. **Duvar v2:** beton gövdeye yatay gradyan (#D3D8DE → `board.wall` → `board.wallDark`)
> eklenir; kalıp çizgileri, kenarlar, ikaz başlığı ve kontur aşağıdaki gibi kalır.


**Duvar (K-04):** genişlik 0,5c (60 px, `layout.grid.wallW`), `height` satır kadar. Mantıkta duvar sütun Wy−1 ile Wy
arasındaki sıfır genişlikli **sınırdır** (R-03; varsayılan 6 + 2 tahtada 5 | 6); 60 px yalnız görseldir, geçitten geçen blok çizimde duvar şeridinin
üstünden kayar. Beton gövde `board.wall`; dikey kalıp çizgileri (2 px,
`wallDark` %40, 20 px aralık); sol kenar 6 px `wallLight`, sağ kenar 6 px `wallDark`; 6 px `#3B2A1A` %80 kontur.
Üstte 20 px duvar başlığı: sarı-siyah ikaz şeridi + 6 px kontur. Duvar H satırsa (W2; dilimde Bölüm 6, 7, 10) başlık
vinç alanının alt sınırına oturur.

**Vinç alanı (K-05):** tahtanın üstünde 2 satır (240 px; üst kenarı `boardTopY − 240`, UX §5.8) gök bandı;
`board.craneSky` bandı + alt sınırda 4 px kesik çizgi (`board.craneLine`, 16/12 px). Sol uçta sabit küçük vinç kancası
süsü (80×120, sallanmaz). Sağ kenarda **açık yükseklik işareti**: duvar tepesinden (y = `height`) vinç alanı tavanına
(y = H + 2) uzanan dikey cetvel, içinde `(H + 2) − height` kısa çentik + küçük ↕ (K-05; metin yok, sayı çentikten
okunur). Dilim örnekleri: Bölüm 1 (H 5, duvar 4) → 3 çentik; Bölüm 4 ve 9 (H 6, duvar 4) → 4; Bölüm 6 (H 7, duvar 7) →
2; Bölüm 8 (H 6, duvar 5) → 3; varsayılan 8 satır, duvar 8 → 2. Boyu `(H + 2) − height`'i aşan blok takılınca işaret
ve kesik çizgi 400 ms parlar. Saha üstü hava (Hy ≤ y < H, UX §5.8) aynı `board.craneSky` dolgusuyla, ızgarasız çizilir;
geçit açıklığı da `board.craneSky` ile doldurulur (arkadaki sahne açıklıkta görünmez; PL-2R-13 b).
Saha tarafındaki havada bırakılan blok buradan yerine döner (JUICE: iptal).

**Hiza kılavuzu (S6 asansör, W5 kayar kapı):** geçidin satırını şantiyede gösteren 3 px beyaz %35 yatay kesik çizgi,
geçitten şantiyenin sağ kenarına kadar; geçit ya da çerçeve kayınca çizgi de kayar.

**Geçitler — her tipin ilk bakışta ayrışan bir siluet işareti var:**

| Tip | Kimlik | Görsel tarif | Bir bakışta ayırt eden |
| --- | ------ | ------------ | ---------------------- |
| Sabit | W1, `static` | Duvarda `size` satırlık açıklık; üst ve alt kenarda 14 px sarı-siyah ikaz bandı; açıklığın içinden şantiyeye uzanan **2 çelik ray** (açıklığın üst ve alt sınırında). **Faz 2 tur 2:** ray 8 px koyu çelik `board.rail` #3F454D + üstte 2 px `board.wallLight` ışık çizgisi, 40 px'te bir 4×12 px travers çentiği; plan hücrelerinin ve ozalit ızgarasının **üstünde**, inşa cephesi konturu ve blokların altında çizilir (ray şantiye boyunca görünür; iskele kuşağı ve tavan kirişi açık gri `board.scaffold` kaldığı için aynı satır sınırında bile ayrışır). Eski tarif (6 px `board.scaffold`, zemin katmanında) rayı kuşak/kirişle aynı çizgi yapıyordu. | Yalnızca ikaz bandı + ray. Temel tip. |
| Dar (**katman**, tip değil) | W3 = `size = 1` olan **her** geçit tipi (OBSTACLES W3, N2) | Geçidin kendi tip görünümünün **üstüne** eklenir: iki yanda içe bakan **çelik çene** (►◄, 18×28 px üçgenler, `board.narrowJaw` #4A525C) + açıklığın çevresinde 10 px çelik çerçeve. Tip işaretleri korunur ve tek satıra sığdırılır: dar sabit = ikaz bandı + ray; dar kepenk = lameller + sayaç rozeti (#35); dar kayar kapı = dikey ray izi + ▲▼ rozeti, turuncu plaka çenelerin dışında (#16); dar boya kapısı = damla çerçeve + sembol damlası, damlalar çerçevenin dışına sarkar (#22); dar kilitli = parmaklık (2 çubuk) + asma kilit 56×64'e küçülür, çene kilidi örtmez (#30). | İçe bakan çeneler + tek satırlık yarık; tip işareti ayrıca okunur. |
| Kepenk | W4, `shutter` | Açıklığa **yatay metal panjur** lamelleri (8 px lamel, 4 px aralık, #7D8793 / #A3ABB5). Açıkken panjur üstte 28 px'lik silindir olarak sarılı durur. Duvarın üstünde sayaç rozeti: Ø 52 px, içinde "kaç hamle sonra değişecek" rakamı + 1 küçük kilit/açık kilit simgesi. | Lamelli panjur + sayaç rozeti. |
| Kayar kapı | W5, `slider` | `range` boyunca duvarın yüzünde **2 dikey ray çizgisi** (4 px, beyaz %60); açıklığın yanında ▲▼ ok rozeti (Ø 52 px), bir sonraki hamledeki yön dolu, diğeri boş. Açıklık çerçevesi turuncu (#FF9A1F) "araba" plakası. | Dikey ray izi + yön oku. |
| Boya kapısı | W6, `paint` | Açıklık çerçevesi **geçidin renginde boya damlalarıyla** (8 damla, 10–18 px, kenardan sarkar); üstte damla biçimli rozet (56×68) içinde o rengin sembolü. Boşta damlalar 1,6 s'de bir hafif salınır. | Renkli damla çerçeve + sembol damlası. |
| Kilitli | W7, `locked` | Açıklık **dikey parmaklıklı kapı** ile kapalı (4 çubuk, 10 px, #6E7681); ortada büyük asma kilit (72×80, `ui.gold`, kontur `goldDark`); kilidin üstünde anahtarın kimlik rengi şeridi (birden çok kilitte). | Parmaklık + altın asma kilit. |
| Rüzgâr fanı | W8 (geçit değil) | Duvar başlığının üstünde fan muhafazası (112×112, `board.wall`, 6 px kontur), içinde dönen 3 kanat (#FFFFFF), şantiye üstünde `dir` yönünde 3 kesik rüzgâr çizgisi (beyaz %55, 2 s döngü). | Dönen fan + rüzgâr çizgileri. |

Gizli kural: Hiçbir iki geçit tipi aynı renk + aynı biçim kombinasyonunu kullanmaz. Kepenk ve kilitli ikisi de "kapalı"
olabilir; kepenk **yatay** lamel, kilitli **dikey** parmaklık + altın kilit — siluetleri diktir.

---

## 6. Engeller (saha ve şantiye)

| Engel | Kimlik | Görsel tarif (hücre 120 px) | Ayırt eden |
| ----- | ------ | --------------------------- | ---------- |
| Ahşap kasa 3 kat | Y1 hp3 | Açık çam kasa #D9A35B, 4 yatay tahta (çizgi #A8743A), X çapraz destek, köşe çivileri (6 px, #6E7681); **2 metal kuşak** (12 px, #8A96A3) dikey; sağ altta 3 nokta (●●●). Kontur #6B4420 6 px. | W bloğundan ayrımı: açık çam + X destek + sembol yok + metal kuşak. |
| Ahşap kasa 2 kat | Y1 hp2 | Aynı, **1 metal kuşak**; ●● ; köşede küçük çatlak. | Nokta sayısı = kat; kuşak sayısı = kat − 1. |
| Ahşap kasa 1 kat | Y1 hp1 | Kuşak yok; 2 çatlak çizgisi; ● ; tahta hafif eğik. | Kırılmaya hazır görünüm. |
| Çimento torbası | Y2 | Kâğıt çuval siluetinde (alt geniş, üst bağlı) #EDE6D6, kontur #8C8272; ortada gri tuğla piktogramı (#9AA4B1); üstte ip bağı. Hafif "çökmüş" alt kenar. | Yumuşak çuval silueti, blok değil. |
| Zincir | Y3 | §3 `chained` katmanı. | Çapraz zincir + kilit. |
| Islak beton | Y4 | §3 `wet` katmanı + sayaç. | Parlak gri tabaka + rakam. |
| Altın vida | Y7 | Zemin hücresinde altın vida başı (Ø 56, `ui.gold`, artı yarık #C98A00). Üstü kapalıyken, kapatan bloğun (ya da kasanın) o hücresinin sağ alt köşesinde 20 px altın "ışıltı" ucu + 28 px soluk vida simgesi **her zorlukta** görünür (adalet: konum gizlenmez; product-lead onayı, GDD K-42). | Altın daire + artı yarık. |
| Anahtar | W7 | Zemin hücresinde altın anahtar (88×40, `ui.gold`), halkasında kilidin kimlik rengi şeridi. Üstü kapalıyken vida gibi köşe ışıltısı. | Anahtar silueti. |
| Moloz (Faz 2R, PL-2R-11) | S4 | **Renkli malzeme bloğudur:** §3A şeker blok (kendi rengi, sembolü ve çıkıntısı; kontrast kuralları aynen) + "yanlış yerde" katmanı: 3–4 çatlak çizgisi (4 px, `obstacle.debrisCrack`) ve toz zerreleri, **α ≤ 0,35** (`alpha.debrisLayer`), sembolün altında; sağ üstte 40 px **"↩" rozeti** (krem daire, 4 px `ui.ink` kontur, ok `ui.ink`). İlk ayrılışta `debris` bayrağı kalkar; katman ve rozet 200 ms'de söner, blok sıradan bloktur. Eski "gri #8D8579, sembolsüz" tarif rengi gizlediği için kalktı (`obstacle.debris` token'ı yalnız eski kayıt) | Renk ve sembol her zaman görünür; çatlak + ↩ rozeti "başlangıç yeri yanlış" der |
| Cam blok | S3 | §3 `glass` katmanı. | Saydamlık + çapraz parıltı + kırık cam rozeti. |
| Harçlı blok | Y8 | §3 `mortar` katmanı. | Sarkan harç + mala rozeti. |
| Balonlu blok | S8 | §3 `balloon` katmanı. | Bağlı beyaz balon. |
| Ağır Yük (Faz 2R, PL-2R-04) | Y5 (Q9, I5) | **Malzeme değildir, renksizdir** (veri renk vermez), plana girmez. **Tek parça** çizilir (hücre başına yastık, çıkıntı ve sembol **yok**). **Q9 = 3×3 yük paleti:** alt 24 px koyu palet (`obstacle.cargoDark` #3A3A3A, 3 ayak), üstünde kayışlı çelik sandık: gövde `obstacle.cargoSteel` #7A7A7A (alanın ≥ %70'i), 4 px yatay panel çizgileri `cargoDark` α 0,5, iki dikey kayış 16 px `cargoDark` + toka 20×14 `obstacle.cargoBuckle` #B5B5B5; üst kenarda 4 px beyaz α 0,35 ışık çizgisi; 6 px `ui.hazardBlack` kontur, köşe 18. **I5 = 5×1 çelik I-kiriş:** aynı gövde rengi, üst ve alt flanş 14 px `cargoDark`, gövdede 3 cıvata deliği Ø 10 (`cargoDark`). **İkisinde:** iki karşı köşede (sol üst, sağ alt) 16 px genişlikli 45° sarı-siyah ikaz bandı (`ui.hazardYellow` / `ui.hazardBlack`; §1 sütun 8) ve sol üstte 40 px **kettlebell rozeti** (krem daire, `ui.ink` kettlebell silueti). **Ölçüm (CIEDE2000; Machado 2009 renk körü simülasyonu):** gövde #7A7A7A her blok tabanına ΔE00 ≥ 24,6 (en yakın B), renk körü simülasyonlarında C'ye ≥ 25,9 ve her tabana ≥ 13,6 (protan, R); palet #3A3A3A her tabana ≥ 23,1 (W). Oyuncu metninde Ağır Yük'e "blok" denmez ("yük"; STORY §6A `tut.m.heavy`). **Kabul:** 375 pt ekran görüntüsünde (Bölüm 8 ve 10) 5 kişiden 5'i "bu plana girmez" der | Çıkıntısız gri çelik + palet + ikaz bandı + kettlebell; hiçbir blok renginde değil |

---

## 7. Arka planlar (v2 — üç sahne + hikaye bölümü renkleri)

**Üretim (R2-08 güncellemesi, 2026-10-07):** yapay zekâ ve Canva **kullanılmaz**. Ana sayfa ve kazanma arka planları
design-lead'in elle yazdığı **SVG** dosyalarıdır (`public/art/bg/*.svg`, ASSET §16); oyun ekranı arka planı
**prosedüreldir** (R2-12 çivit sahne, doku yok). SVG yokken ya da yüklenemezse §7.4 tablosundaki prosedürel yedek
çizilir. Ortak kurallar:

- **Boyut, raster ve bellek (CL-2R-23):** SVG `viewBox="0 0 1080 1920"`; oyun **0,5 ölçekte** raster eder (540×960
  RGBA = 2,0 MB GPU) ve ×2 çizer. Arka plan sakin ve düşük ayrıntılı olduğu için yumuşama kabul edilir (derinlik
  hissi verir); bunu taşımak için arka plan SVG'lerinde kontur **en az 8 px**, en küçük şekil 24 px'tir. 1920'nin
  üstündeki fazla yükseklik (EXPAND, en çok 480 px) görselin üst kenar rengine eşlenmiş **prosedürel gök gradyanıdır**
  (doku değil). Raster yolu (çalışma anında `load.svg` boyutla ya da derlemede PNG/WebP) code-lead'in kararıdır;
  bütçe ikisinde de aynıdır: **v2 görsellerinin toplam indirmesi ≤ 900 KB, toplam doku belleği ≤ 64 MB** (TECH §2R.7
  ölçüm kapısı; ayrıntılı tablo ASSET §16.1).
- **Sakin orta:** oyun ekranında tahta grubunun dikdörtgeni (8 sütunluk tahtada x 10–1070, y = vinç alanı tepesi –
  durum şeridi altı) ve ana sayfada "Bölüm N" düğmesinin arkası belirgin nesne içermez; ayrıntı kenarlarda.
- **Doygunluk:** arka planın ortalama **CIE LCh kroması (C\*)** blok tabanlarının ortalamasından (55,6) en az **%25
  düşük**; en doygun renkler yalnız bloklarda ve birincil düğmede. (2026-10-07: ölçüt HSL doygunluğundan kromaya
  çevrildi; HSL açık pastel gök ve ışık tonlarında %100 verip görsel doygunluğu yansıtmıyor. Ölçüm: `bg_home_town` %40,
  `bg_win_plaza` %38 düşük; ASSET §16.6.)
- **Paralaks:** yalnız ana sayfada, kasaba görseli tek katman + bulut katmanı (prosedürel, 0,2 hızla sürüklenir: 12
  px/s). Oyun ekranında arka plan sabittir (performans ve dikkat).

### 7.1 Oyun sahnesi — çivit şantiye (prosedürel; R2-12)

R2-12 gereği oyun ekranının zemini **koyu çivit/mor**dur; tahta bu zeminde çerçeveli durur. Çizim (doku yok, ekran
açılışında `Graphics` + bir kez pişirilen desen):

- **Zemin:** dikey gradyan `color.scene.gameTop` #3B2C85 → `color.scene.gameBottom` #1F1850 (ekranın tamamı, EXPAND
  dahil). Üstüne çok düşük kontrastlı **ozalit deseni**: 120 px ızgara, 2 px `color.scene.gameLine` #FFFFFF α 0,04 ve
  her 4 hücrede bir 3 px α 0,07 (planın çizildiği kâğıt fikri; tahta ızgarasıyla hizalı değildir, tahtanın arkasında
  kalır).
- **Kenar siluetleri:** sol ve sağ kenarda, yalnız x < 120 ve x > 960 içinde, alt %40'ta iskele ve kule vinç
  siluetleri beyaz α 0,06 dolgu (`color.scene.gameSilhouette` #FFFFFF + `alpha.sceneSilhouette`; zeminden ΔL\* 4–6, doygunluk yok), tek SVG
  (`bg_level_site_edges`, 0,5 raster, ≤ 30 KB). Tahta grubunun dikdörtgeninin arkasında hiçbir nesne yoktur.
- **Tahta:** saha ahşap çerçeveli "malzeme sandığı" (UX §5.8; delikli pano zemini §2.4), şantiye iskeleli ozalit
  (§4), duvar beton (§5). Saha üstü hava ve vinç alanı `board.craneSky` (beyaz α 0,10) bandıdır: çivit üstünde açık
  bir "hava" şeridi olarak okunur.
- **Alt bant:** UX §5.10 (`ui.ink` α 0 → 0,35).
- Block Blast benzerliğinden ayrışma (§11.8): tahta koyu ızgara değildir — sıcak kum/ahşap saha + mavi ozalit +
  beton duvar; neon ışıma yok; bloklar çıkıntılı ve sembollü.

### 7.2 Ana sayfa — Renkli Tepe kasabası (`bg_home_town` + `town_ch1_treehouse`)

Tepe yamacına kurulu sabah kasabası: kiremit, nane, tereyağı sarısı ve leylak çatılı evler, kıvrılan Arnavut kaldırımı,
yuvarlak ağaçlar, bacasından kıvrık duman çıkan fırın, sağda kıyıda uzak fener, uzakta festival tepesi. **Ortada boş çimen
arsa ve büyük çınar**: aktif hikaye yapısı (`town_ch1_treehouse`, ayrı şeffaf görsel) buraya oturur. Üst %15 sakin gök
(üst çubuk), alt %22 sakin çimen (Bölüm düğmesi + alt gezinme). İnşa ilerlemesi yapının üstüne prosedürel çizilir:
yapılmamış katmanlar **ozalit hayaleti** (yapı siluetinin `board.blueprint` %35 dolgusu + 4 px beyaz %90 kesik kontur,
16/12) ve iki yanda iskele; yapılan kısım tam renk, alttan üste `setCrop` ile açılır (JUICE #102). Hayaletin plan
dilini oyun ekranındaki ozalitten alması bilinçlidir: "planı çiz, sonra inşa et".

**SVG ve kırpma durakları (R2-08, PL-2R-15 c):** `bg_home_town` ve `town_ch1_treehouse` elle yazılmış SVG'dir (ASSET
§16). **Çınar ayrı taban katmanıdır** (`town_ch1_tree`, 2026-10-07): yapıyla aynı 760×820 kutuda, yapının altında, her
zaman tam renk; hayalet ve kırpma yalnız `town_ch1_treehouse`'a uygulanır (ağaç inşa edilmez). Arka planın orta
arsası bu yüzden yalnız çimendir; EXPAND'de arka plan ile yapı farklı kaydığından ağacın arka planda olması hizayı
bozardı. Yapı, STORY §5 görev sırası **alttan üste** okunacak biçimde çizilir: basamaklar → platform → duvarlar → pencere
ve perde → çatı → **ip merdiven ve makara** (çatının üstündeki gözcü dalına yukarı doğru uzanır, platformdan aşağı
sarkmaz) → bayrak ve tabela (en tepe). Açılan yükseklik oranları (görselin altından, yüksekliğine göre)
`layout.home.ch1CropStops` = [0,18 · 0,36 · 0,52 · 0,62 · 0,76 · 0,88 · 1,00]; Faz 4'te k. görev tamamlanınca oran
`ch1CropStops[k−1]`. **Faz 2R dilimi** (görev yok, META §10): oran = kazanılmış farklı bölüm / 10 (doğrusal). Tek görsel
+ `setCrop` yeter; maske gerekmez (JUICE kural 11).

### 7.3 Kazanma — kutlama meydanı (`bg_win_plaza`)

Altın saatte bayram süslü kasaba meydanı: gökte çapraz bayrak dizileri (blok renklerinde üçgenler), merkezden ılık
ışık, yumuşak bokeh konfeti, uzakta çeşme silueti; **merkez parlak ve sade** (ödül kartı burada). Üstüne prosedürel
**ışın** (§15.4) döner. Ön planda insan yok (karakterler ayrı görsel). Prosedürel yedek: radyal gradyan #FFE7A3 →
#FF9E55 + 12 ışın + bayrak üçgenleri (`fx_confetti_<c>` renkleri).

### 7.4 Hikaye bölümü renkleri (prosedürel yedek ve tint)

Katmanlar (arkadan öne): gökyüzü gradyanı → bulutlar → uzak siluet → orta katman → yakın katman. Uzak / Orta / Yakın
sütunlarının ilk hex'i `tokens.color.chapter.ch<n>.far` / `mid` / `near` ile birebirdir (tek kaynak tokens). Görsel
yokken üç sahnenin yedeği bu tabloyla çizilir (UX §3 ve §5.8 mock'ları bu yedekle doğrulandı, §12).

| Hikaye bölümü | Gökyüzü (üst → alt) | Bulut | Uzak | Orta | Yakın / vurgu |
| ------------- | ------------------- | ----- | ---- | ---- | ------------- |
| 1 Ağaç Ev | #7FD3F7 → #D6F2FF | #FFFFFF | tepe silueti #9ED9A0 | orman #5FB86A, ağaç tepeleri yuvarlak | çimen #4FA65A, papatya noktaları #FFFFFF / #FFE23E |
| 2 Mahalle Fırını | #FFC98A → #FFF0D6 | #FFF7EA | çatı silueti #F2B27A | kasaba sokağı #E99A55, bacadan kıvrık duman | kaldırım #D98A4A, sıcak pencere ışıkları #FFE7A3 |
| 3 Okul Kütüphanesi | #9DB5F2 → #E6E2FF | #F4F2FF | okul silueti #A8A2E0 | ağaçlar #7C76C9 | kitap biçimli bulut süsleri, mozaik karo kenarı #5D3AAE / #2984DE |
| 4 Fener ve Köprü | #FF9E7A → #FFE3B0 (gün batımı) | #FFD3C2 | ufuk #7FD8D2, uzak fener silueti | deniz #2FB7B3 | kayalık #3F7F8C + dalga köpüğü #E8FFFB, martılar (beyaz V) |
| 5 Festival Şatosu | #2E2464 → #6B3FA0 (gece) | #8E6CD9 %50 | tepe silueti #3E2F7A | kasaba ışıkları #FFD24A noktaları | ön plan silueti #2E2464, bayrak dizileri (G, Y, R, B), sıcak sarı ip lambalar, uzak havai fişek (yalnız Kasaba ekranında) |

**Benzerlik sınırları (BUSINESS §2), v2:** Festival Şatosu renkli bloklardan bir "festival kalesi"dir: taç, arma,
kraliyet altını kenar süsü, kırmızı pelerinli figür yok (Royal Match'in kral ve şato evreninden uzak). Oyun ekranı
R2-12 gereği çivit zeminlidir, ama **tahta koyu değildir**: sıcak kum/ahşap saha + mavi ozalit şantiye + beton duvar,
iki bölgeli; bloklarda neon ışıma yok, her hücrede çıkıntı ve sembol var (Block Blast'ın lacivert 8×8 tahta + ışıyan
blok görünümünden ve referans oyunun mor çerçeveli tek tahtasından uzak); ozalit yalnız şantiye sütunlarında
(tahtanın %24–%47'si, `site.cols` 2–4). Ana sayfa düzeni Royal Match örüntüsündedir (üst çubuk, ortada yapı, altta büyük oyna düğmesi, alt
gezinme — türün ortak dili, R2-09) ama yapı kasaba arsasında bir **inşaat projesidir**, oda dekorasyonu değil; görev
balonu yerine ozalit hayaleti ilerlemeyi gösterir.

---

## 8. Tipografi

**Seçim: Baloo 2** (Ek Type), değişken ağırlık 400–800.

- **Lisans:** SIL Open Font License 1.1 — doğrulandı: Google Fonts deposundaki lisans dosyası
  <https://raw.githubusercontent.com/google/fonts/main/ofl/baloo2/OFL.txt> ("Copyright 2019 The Baloo 2 Project Authors
  (https://github.com/EkType/Baloo2) … licensed under the SIL Open Font License, Version 1.1") ve `METADATA.pb`
  (`license: "OFL"`, alt kümeler: latin, latin-ext, vietnamese, devanagari). OFL, yazılımla birlikte gömmeye ve ticari dağıtıma
  izin verir (madde 2); fontun tek başına satılması yasaktır (madde 1). Lisans dosyası "Reserved Font Name" ilan
  etmiyor; bu yüzden alt küme (değiştirilmiş sürüm) adı korunabilir (madde 3). Telif satırı ve lisans metni uygulama
  içi "Lisanslar" sayfasına eklenir (madde 2).
- **Türkçe karakterler — dosyadan doğrulandı:** `Baloo2[wght].ttf` (sürüm 1.700) indirildi ve fontTools ile cmap
  tarandı: ğ Ğ ü Ü ş Ş ı İ ö Ö ç Ç â î û ₺ … " " « » **hepsi var**. Ayrıca GSUB'da `latn/TRK` `locl` dil sistemi
  mevcut (Türkçe yerelleştirilmiş glifler).
- **Elenen aday — Fredoka:** Google Fonts'taki güncel `Fredoka[wdth,wght].ttf` (sürüm 2.001) tarandı: **ğ Ğ ş Ş İ ve ₺
  yok.** Türkçe metinde karışık font (fallback) görünür; bu yüzden elendi.
- **Teslim:** Latin + Latin Extended-A + Türkçe noktalama alt kümesi, değişken WOFF2: **≈ 38 KB** (pyftsubset ile
  denendi, 2026-10-05: 38.648 bayt; U+0020–007E, U+00A0–017F, U+2010–2027, U+20BA, U+2212, U+00D7, **U+2248** "≈" —
  PriceLabel'daki "≈ 81 TL" için eklendi; glif Baloo 2'de var). Uygulama içinde barındırılır (çevrimdışı ve Capacitor
  için), CDN'e bağımlılık yok. Yedek yığın: `"Baloo 2", "Nunito", system-ui, sans-serif`.
- **Alt küme dışı karakter yasağı:** i18n metinlerinde (`src/i18n/tr.json`, `en.json`) yalnız yukarıdaki aralıklardaki
  karakterler bulunur; yoksa o karakter yedek fontla çizilir ve Fredoka'yı eleten "karışık font" sorunu geri gelir.
  Baloo 2'de **olmayan** ● (U+25CF), ✓ (U+2713), ★, ♥, ∞ (U+221E), ↔, ↕ metne yazılmaz; satır içi simge yer tutucusu kullanılır
  (STORY §0-11: `{coin}` → `icon_coin`, `{ok}` → `ghost_badge_ok`). Wireframe'lerdeki "●" altın simgesidir, karakter
  değildir. **Test notu (code-lead):** i18n dosyalarındaki her karakter alt küme aralığında olmalı (ör. "i18n glyphs
  within Baloo 2 subset"); alt küme aralıkları tek listede tutulur ve font üretim betiği ile test aynı listeyi okur.
- **Rakamlar:** varsayılan rakamlar orantılıdır (0: 583, 1: 357 birim). Hamle sayacı gibi değişen sayılar **ortaya
  hizalanır** (genişlik değişimi kayma yapmaz). Canvas `tnum` açamaz (code-lead); hamle sayacı, altın ve süre
  etiketleri **sabit genişlikli hane yuvalarıyla** çizilir (her rakam en geniş hane genişliğinde ortalanır; code-lead).
- **Yükleme:** `<link rel="preload" as="font" type="font/woff2" crossorigin>` + `@font-face { font-weight: 400 800;
  font-display: block }`; Boot `document.fonts.load('800 120px "Baloo 2"')` ve `'600 44px "Baloo 2"'` bitmeden hiçbir
  `Text` oluşturmaz (yedek fontla rasterize olup kalmasın). iOS'ta değişken ağırlık seçimi bozuksa yedek: 700 ve 800
  statik örnekleri.

| Token | Boyut (px @1080) | ≈ pt @390 | Ağırlık | Satır yüksekliği | Kullanım |
| ----- | ---------------- | --------- | ------- | ---------------- | -------- |
| `font.size.display` | 120 | 43 | 800 | 1,0 | hamle sayacı, "Kazandın!" |
| `font.size.h1` | 88 | 32 | 800 | 1,05 | pencere başlığı, "Bölüm 12" |
| `font.size.h2` | 64 | 23 | 800 | 1,1 | alt başlık, düğme (büyük) |
| `font.size.button` | 56 | 20 | 700 | 1,0 | düğme |
| `font.size.body` | 44 | 16 | 600 | 1,25 | konuşma balonu, açıklama |
| `font.size.small` | 38 | 14 | 600 | 1,25 | rozet, sayaç etiketi |
| `font.size.caption` | 34 | 12 | 600 | 1,2 | **en küçük metin**, altı yasak |

Büyük harf her zaman `toLocaleUpperCase('tr-TR')` ("MİNİK USTA", "ÇOK ZOR"). **İstisna — oyun adı:** `app.title`
(çalışma değeri "Lift & Land", STORY §0-10) büyük harfe çevrilmez, yazıldığı biçimde çizilir; marka adı Latin
yazımlıdır ve TR yerelinde `toLocaleUpperCase` "LİFT" yazardı. Başlıklar ve düğmeler: beyaz dolgu + 0,12 em
koyu kontur + 4 px gölge. Konuşma balonu metni: `ui.ink` düz.

### 8.1 Yazı stili kuralları v2 (Faz 2R)

Font ve boyut tablosu değişmedi. v2'de **dört yazı stili** vardır; her metin bunlardan biriyle çizilir (stil adı kodda
tek yardımcı fonksiyon, `kit.button.textStrokeEm` / `textShadowEm`):

| Stil | Nerede | Dolgu | Kontur | Gölge | Örnek |
| ---- | ------ | ----- | ------ | ----- | ----- |
| **Parlak başlık** | renkli zemin, sahne, şerit, düğme | beyaz #FFFFFF | 0,16 em, zeminin kontur rengi (düğmede `kit.buttonColor.<v>.stroke`, şeritte `kit.ribbon.<v>.stroke`, sahnede `ui.ink`); `lineJoin: round` | aynı metin, kontur renginde, **+0,07 em** aşağıda, konturdan önce çizilir | "BÖLÜM 12", "KAZANDIN!", "Ağaç Ev" |
| **Sayaç** | koyu kapsül, HUD | beyaz | 0,12 em `kit.capsule.textStroke` #141E34 | yok | "1.250", "5", "3/7" |
| **Panel metni** | krem panel, balon | `ui.ink` #3B2A1A | yok | yok | pencere gövdesi, öğretici balonu |
| **İkincil** | krem panel | `ui.inkSoft` #6B5440 | yok | yok | "Teklif 1/3", "HAMLE" etiketi |

- Büyük harf yalnız şu öğelerde (`toLocaleUpperCase('tr-TR')`): düğme etiketi, pencere başlığı şeridi, kazanma şeridi,
  zorluk etiketi. Alan adı ("Ağaç Ev"), sayaç, balon ve gövde metni yazıldığı gibi.
- Parlak başlıkta en küçük boy `font.size.small` (38 px); 34 px `caption` yalnız panel metni ve sekme etiketinde
  (kontur küçük boyda harf içini doldurur).
- Rakamlar: sayaçlar sabit genişlikli hane yuvalarıyla (§8 "Rakamlar"); "Bölüm N" düğmesinde orantılı.
- Bu tablo §8'deki "beyaz dolgu + 0,12 em koyu kontur + 4 px gölge" cümlesinin v2 hâlidir (başlık ve düğmede kontur
  0,12 → 0,16 em; gölge 4 px → 0,07 em = 56 px'lik düğme yazısında 4 px, 120 px'lik başlıkta 8 px).

---

## 9. İkon dili

> **Faz 2R (v2; R2-08 güncellemesi):** ikonlar design-lead'in elle yazdığı hacimli **SVG**'lerdir (`public/art/icon/*.svg`,
> `viewBox 0 0 128 128`; ASSET §16), **128 px tek boyda** raster edilip tek atlasa (512×512, 16 yuva) konur; 112/96/64 px
> kullanımda küçültülür, @2x yoktur (CL-2R-23). Aşağıdaki biçim tarifleri SVG'nin içeriğidir. v1'deki "gradyan yok, 2 ton" kuralı v2'de kalkar: ikon
> yumuşak hacim, sol üst ışık, beyaz parlama ve kalın koyu kontur taşır (§1 sütun 2). Görsel gelmeden prosedürel yedek
> v1 kuralıyla (2 ton + parlama hapı + 8 px kontur) çizilir. Sınama: her ikon 64 px'te siluetinden tanınır, yan yana
> iki ikon aynı ana renk + aynı siluet taşımaz.


- **Izgara:** 128×128 tuval, 8 px iç boşluk; ana biçim 112 px'e sığar. Küçük kullanımda (64 px) aynı çizim ölçeklenir.
- **Kontur:** 8 px `#3B2A1A` (%100), yuvarlak birleşim/uç. 64 px'te 5 px'e iner (en az 4 px).
- **Dolgu:** 2 ton (ana + %25 koyu alt yarı) + üstte beyaz %35 parlama hapı. Gradyan yok.
- **Bakış:** ön/¾ önden, hafif aşağıdan; nesneler tombul ve kısa. Metin yok (i18n gerektirmesin).
- **Metafor:** inşaat ve kasaba nesneleri. Genel kavramlar için tanıdık şekil korunur (can = kalp, ayar = dişli).

| İkon | Biçim |
| ---- | ----- |
| Can | kalp #FF4F6A, ortasında küçük beyaz yıldız (Tuna'nın kask çıkartması) |
| Sınırsız can | aynı kalp; yıldız yerine çizilmiş kalın beyaz sonsuzluk işareti (vektör, font karakteri değil; §8 alt küme yasağı) |
| Altın | sikke `ui.gold`, üstünde kabartma mala |
| Yıldız | tombul 5 köşe `ui.star`, yuvarlatılmış uçlar |
| Hamle | ikon yok; büyük sayaç rakamı ve altında "hamle" etiketi |
| Çekiç | ahşap saplı, kırmızı başlı çekiç, 20° eğik |
| Vinç | sarı kule vinç değil, **kanca + halat** (turuncu kanca #FF9A1F) |
| Boya Fırçası | ahşap saplı fırça, ucu 3 renk şeritli (G, Y, B) |
| Geri Al | kıvrık ok, ucunda küçük mala |
| Termos | mavi termos #2984DE, buhar 2 kıvrım |
| Mala Başlangıcı | altın mala + parıltı |
| Açık Kepenk | yarı açık panjur, yukarı ok |
| Altın Mala (kombo) | altın mala, sapı ahşap |
| Kamyon | turuncu kamyon önden ¾, kasada 3 blok |
| Ayarlar | dişli içinde vida başı |
| Mağaza | çizgili tente + tezgâh |
| Lig | mala biçimli kupa |
| Ana sayfa | kiremit çatılı ev |
| Takım | yan yana iki kask (kilitli: gri + asma kilit) |
| Albüm | spiralli fotoğraf albümü |
| Sallanan Köprü | halat köprü silueti + simit |
| Günlük ödül | takvim yaprağı + yıldız |
| Kumbara | tuğla biçimli kumbara (domuz değil) |
| Bölüm sandığı | ahşap alet sandığı, metal köşeler |
| Duraklat | iki kalın dikey çubuk, yuvarlak düğme içinde |

---

## 10. Renk körü modu (Ayarlar)

Palet zaten üç simülasyonda ≥ 14 ΔE00 ayrıştığı için mod paleti değiştirmez; **ikincil işaretleri güçlendirir**
(her değerin anahtarı `tokens.a11y`):

| Değişiklik | Varsayılan → renk körü modu | Token |
| ---------- | --------------------------- | ----- |
| Blok ve plan sembolü boyu | ×1,0 → ×1,2 | `a11y.colorBlindSymbolScale` |
| Sembol mürekkebi kontrastı | +%15: koyu mürekkep `block.symbolDarkFactor` × (1 − 0,15) (0,40 → 0,34); beyaz mürekkep opaklığı × 1,15 (%85 → %98; plan mürekkebi zaten %100) | `a11y.colorBlindContrastBoost` |
| Plan hücresi renk dolgusu | %80 → %90 | `a11y.colorBlindPlanFill` |
| Gölge rozeti (✓ / ! / ↓) | 44 → 60 px | `a11y.colorBlindGhostBadgePx` |
| Gölge çizgisi (düz/kesik) | +2 px (6 → 8, 8 → 10, 5 → 7) | `a11y.colorBlindGhostStrokeAddPx` |
| Eksik destek taraması | 6 → 8 px | `a11y.colorBlindSupportHatchPx` |
| Boya kapısı damla rozetindeki sembol | ×1,3 | `a11y.colorBlindPaintSymbolScale` |
| Usta Serisi çubuğu | boncuklar + sayı ("3/4") | — |

Blok ve plan dokuları modla birlikte yeniden pişirilir. Renk adı etiketi bu modda da gösterilmez (§2.1).

---

## 11. Karakterler

> **Faz 2R (v2; R2-08 güncellemesi, R2-12):** karakterlerin büst ve poz görselleri design-lead'in elle yazdığı **SVG**
> dosyalarıdır (`public/art/chr/*.svg`; ASSET §16: Tuna büst + Tuna sevinç, Usta Dede büst, Kepçe büst, Gribeton
> büst); yapay zekâ görsel üretimi yoktur. R2-12 ilkesiyle biçimler basit ve hacimlidir: kapsül/tuğla gövde, büyük
> göz, her yüzeyde 2 durak gradyan + sol üst parlama + 6 px `#3B2A1A` kontur. Aşağıdaki tarifler (renk, imza siluet,
> özgünlük listesi §11.8) SVG'nin içeriği ve kabul ölçütüdür: imza renkler `tokens.color.character.*` ile **birebir**
> (aynı hex). §11.7 yer tutucuları final SVG'lerin iskeletidir. **Teslim (2026-10-07):** `chr_tuna_bust`,
> `chr_tuna_cheer`, `chr_dede_bust`, `chr_kepce_bust`, `chr_gribeton_bust`; yüzeyler 3 duraklı gradyan (açık → imza
> rengi → alt) ki imza hex'i birebir kalsın; gözler beyaz göz akı + iris + bebek + iki parlama (§11.6'daki düz
> "fasulye göz" yer tutucu tarifidir); her dosyada tek `<g id="face">`. Mağaza sürümü öncesi logo, uygulama simgesi ve 4 ana
> karakterin insan sanatçıyla yeniden çizimi entrepreneur kararı P-15'tir (proje sahibi onayına; ASSET §0, §16.1).


Genel stil: **büyük kafa (boyun %45'i), küçük gövde**, iri gözler (yüz genişliğinin %16'sı), kalın 6 px `#3B2A1A`
kontur, düz renk + tek gölge tonu, burun küçük yuvarlak. Ten tonları gerçekçi değil, sıcak ve yumuşak. Her karakterin
**tek bir imza siluet öğesi** vardır (karanlıkta bile tanınsın).

### 11.1 Tuna — "Minik Usta"

> Yaş yalnız iç bilgidir (brif: 8); oyun içi metinde ve mağaza materyalinde geçmez (STORY §0-8). **Açık soru (proje
> sahibi):** görsel yaşın 10–12 görünüme çekilmesi (çocuk ürünü sinyalini azaltır; BUSINESS S15).

- **Cinsiyet nötr tasarım önerisi:** Çene hizasında, kaskın iki yanından taşan dağınık kestane saç (perçem değil,
  "kask altından fışkıran tutam"); kirpik vurgusu yok; çil; iri amber gözler; düz, yuvarlak yüz. Kıyafet cinsiyetsiz
  iş kıyafeti. İsim Türkçede iki cinsiyette de kullanılır. Hikaye metinlerinde zamir sorunu TR'de yok; **EN metinlerde
  "he/she" kullanılmaz, isim ya da "they" kullanılır** (bkz. STORY).
- **Kıyafet:** nane yeşili kask #7FE0C4 (brim #5CC9AB), önünde beyaz yıldız çıkartması; turuncu yelek #FF8A1F + 2
  açık sarı reflektör bant #FFF06A; altında krem/teal çizgili uzun kollu tişört (#F7F3EA / #2A9D8F); lacivert pantolon
  #2E3A59, dizde kum rengi yama #E9C891; **kocaman sarı iş eldivenleri** #FFC93C (el başından büyük — imza siluet);
  kırmızı spor ayakkabı #E8473B; sağ kulağın arkasında sarı kurşun kalem (#FFD23F, pembe silgi #FF8FA3).
- **Ten / saç / göz:** #E8B48A / #4A2C1D / #3B2A1A (parlama beyaz 2 nokta).
- **Kişilik pozları:** (1) eldivenli başparmak yukarı, (2) blok kucaklamış taşıyor, (3) kaskını iki eliyle düzeltiyor
  (açılış), (4) kalemle plana not alıyor, (5) zafer zıplaması (kombo dansı: iki eldiven havada döner), (6) şaşkın geri
  sıçrama, (7) oturmuş, çenesi eldivende (düşünme), (8) Kepçe'yi kucaklama.

### 11.2 Usta Dede

- **İmza siluet:** **katlanır ahşap metre** (açık sarı #E9C27A, siyah çentikler) — öğretici sahnelerde işaret çubuğu
  olarak kullanır.
- Kiremit rengi kasket #C65A3A (sert kask değil); çok kalın siyah yuvarlak çerçeveli gözlük (camlar gözleri %130
  büyütür); **mala biçimli** geniş beyaz bıyık #F5F5F0 (uçları yukarı kıvrık değil, düz ve küt); kasketin altından
  taşan beyaz kulak üstü saç; zeytin yeşili çok cepli iş ceketi #7A8B4A, beyaz gömlek; kemerinde sarı şerit metre
  kutusu #FFC21A; uzun ve ince (Tuna'dan 1,6 kat boylu), hafif kambur.
- Ten #D9A27A. Kişilik: sabırlı, şakacı, atasözü sever ama kısa konuşur.
- **Pozlar:** (1) metreyle işaret ediyor (ipucu balonu), (2) kollar kavuşmuş gülümseme, (3) gözlüğünü burnuna itiyor
  (düşünme), (4) Tuna'nın kaskına hafifçe dokunuyor, (5) şaşkınlıkla kasketini kaldırıyor, (6) eski tabelayı gösteriyor.

### 11.3 Kepçe

- **Sosis köpek** (kızıl #B5652B, ağız çevresi #D99A5E, kulaklar #8A4A1F). **Kulaklarına büyük gelen turuncu kask**
  #FF9A1F (sarı değil), kask bir yana kaymış, bir kulak kaskın altından sarkıyor — imza siluet. Nane yeşili tasma
  #7FE0C4, kemik biçimli künye.
- Gövde uzun, bacaklar çok kısa; kuyruk sürekli sallanır (boşta 3 Hz animasyon).
- Kişilik: kazmaya bayılır (kazı mekaniğinin maskotu), heyecanlı, sahibine sadık.
- **Pozlar:** (1) ön patilerle kazıyor (toprak fışkırır), (2) havlıyor (açılış), (3) kask gözüne düşmüş, (4) kuyruk
  pervane gibi dönüyor (kombo), (5) kulakları düşük (üzgün), (6) burnunda bir tuğlayı dengeliyor (gülme).

### 11.4 Bay Gribeton

- **İmza siluet:** **dikdörtgen gövde ve beton blok biçiminde düz, kalıp çizgili gri saç** (#B8BEC6, yatay kalıp izleri)
  — Tuna'nın yuvarlak siluetine bilinçli zıtlık.
- Gri üç parça takım #8C939C, beyaz gömlek, koyu gri kravat #5E656E üstünde minik beton mikseri kravat iğnesi; düz,
  kalın, koyu gri kaşlar #4A4F57; ince düz bıyık ("su terazisi" çizgisi); yarı kapalı, kendinden emin gözler; elinde
  gri sert kapaklı klasör (üstünde "G" harfi yok — logo/harf kullanılmaz; yalnızca gri kare amblem). Cilalı siyah
  ayakkabı. Ten #F0C8A8.
- Kişilik: kibirli ama komik, "verimlilik" takıntılı, gri her şeyi pratik bulur. Kötü adam değil; hikaye boyunca renge
  ısınır (bölüm 5'te kravatında küçük renkli bir mozaik iğne belirir).
- **Pozlar:** (1) klasörü göğsüne bastırıp burnu havada, (2) kaşını kaldırıp şüpheyle bakıyor, (3) ceketinden toz
  silkeliyor, (4) gizlice gülümsüyor (arkasını dönmüşken), (5) çatlak köprü önünde elleri başında, (6) Tuna'ya el sıkışmak
  için uzanıyor.

### 11.5 Kasaba halkı

| Karakter | İmza siluet | Renkler | Pozlar |
| -------- | ----------- | ------- | ------ |
| Fırıncı Ayşe Teyze | uzun saplı ahşap fırın küreği + topuz saç | hardal önlük #E9A93B, un lekeleri beyaz, koyu gri topuz #5A5A5A, pembe yanak | küreği omzunda; ekmek uzatıyor; elleri belinde; bacaya bakıp ağlamaklı |
| Öğretmen Selin | kucağında üst üste 3 kitap + yüksek at kuyruğu | mor hırka #8E6CD9, mozaik desenli atkı (B, P, Y), siyah saç | kitapları sallıyor; parmağını kaldırıp "bilgi" veriyor; ıslak rafa üzülüyor |
| Balıkçı Rıza Kaptan | lacivert örgü bere + sarı muşamba | bere #2E3A59, muşamba #FFD23F, kır kısa sakal #9A9A9A, balık biçimli düdük | dürbünle bakıyor; halat atıyor; şapka sallayarak teşekkür |
| Belediye Başkanı Bay Kurdele | dev altın tören makası + çapraz kırmızı-beyaz kuşak | lacivert takım #2E3A59, kuşak #E8473B / #FFFFFF, makas `ui.gold` | makası havaya kaldırıyor; kurdele kesiyor; nutuk atıyor (eli havada) |

Kasaba halkı §11.6'daki ifade setinden MVP kapsamındakileri kullanır.

### 11.6 İfade seti

**Kapsam (entrepreneur):** MVP'de ana 4 karakter (Tuna, Usta Dede, Kepçe, Gribeton) 6 ifade; yan 4 karakter (Ayşe,
Selin, Rıza, Kurdele) 3 ifade (mutlu, şaşkın, üzgün); kalan ifadeler **[Sonra]**. Figüranlar yalnız mutlu/şaşkın.

Yüz parçaları değiştirilerek üretilir (gözler, kaşlar, ağız). Koordinatlar 256×256 kafa kutusunda; göz merkezleri
(102, 140) ve (154, 140), ağız merkezi (128, 176). Karakterler kendi yüzlerine ölçekler.

| İfade | Gözler | Kaşlar | Ağız | Ek |
| ----- | ------ | ------ | ---- | -- |
| mutlu | elips rx 12 ry 15, parlama 4 px | yukarı kavis `M88 116 Q102 108 116 116` | gülümseme `M106 170 Q128 192 150 170` (stroke 6) | yanak pembe %40 |
| şaşkın | daire r 16, göz bebeği r 7 | yükseğe kalkık `M88 106 Q102 98 116 106` | "O" `ellipse rx 10 ry 13` dolu #7A2E2E | 3 küçük şaşırma çizgisi kafa üstünde |
| üzgün | elips ry 12 + üst göz kapağı çizgisi | iç uçlar yukarı `M88 122 L114 114` | ters kavis `M110 184 Q128 170 146 184` | gözyaşı yok (ölçülü) |
| kararlı | elips ry 11, bebek biraz içte | iç uçlar aşağı `M88 112 L116 120` | düz, bir yan yukarı `M110 178 L146 172` | yumruk pozu |
| gülme | kapalı ters U `M90 142 Q102 128 114 142` | yukarı kavis | açık D: `M104 166 H152 Q150 198 128 198 Q106 198 104 166 Z` dolu #7A2E2E + dil #FF8A8A | omuzlar kalkık |
| düşünme | bebekler sağ üste kaymış (+4, −4) | biri kalkık, biri düz | yan çizgi `M118 178 Q128 172 140 180` | el çenede |

### 11.7 Yer tutucu SVG tarifleri

Yer tutucular Faz 2'de kodla ya da statik SVG olarak kullanılır. Hepsi `viewBox="0 0 256 320"` (büst), 6 px kontur
`#3B2A1A`. Yüz parçaları `<g id="face">` içindedir; ifade değiştirmek için yalnız bu grup değişir (§11.6).

**Tuna:**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 320" stroke="#3B2A1A" stroke-width="6" stroke-linejoin="round">
  <rect x="80" y="206" width="96" height="92" rx="28" fill="#2A9D8F"/>
  <path d="M84 212 H172 V286 Q172 298 160 298 H96 Q84 298 84 286 Z" fill="#FF8A1F"/>
  <path d="M84 240 H172 M84 264 H172" stroke="#FFF06A" stroke-width="10"/>
  <circle cx="64" cy="262" r="30" fill="#FFC93C"/><circle cx="192" cy="262" r="30" fill="#FFC93C"/>
  <path d="M52 128 Q44 176 74 198 L88 188 Q70 162 76 130 Z" fill="#4A2C1D"/>
  <path d="M204 128 Q212 176 182 198 L168 188 Q186 162 180 130 Z" fill="#4A2C1D"/>
  <circle cx="128" cy="138" r="76" fill="#E8B48A"/>
  <rect x="198" y="112" width="12" height="54" rx="4" fill="#FFD23F" transform="rotate(18 204 139)"/>
  <path d="M46 118 A82 76 0 0 1 210 118 Z" fill="#7FE0C4"/>
  <rect x="34" y="108" width="188" height="22" rx="11" fill="#5CC9AB"/>
  <path d="M128 56 L135 72 L152 73 L139 84 L143 101 L128 92 L113 101 L117 84 L104 73 L121 72 Z" fill="#FFFFFF" stroke-width="4"/>
  <g id="face" stroke="none">
    <ellipse cx="102" cy="150" rx="12" ry="15" fill="#3B2A1A"/><circle cx="106" cy="144" r="4" fill="#FFF"/>
    <ellipse cx="154" cy="150" rx="12" ry="15" fill="#3B2A1A"/><circle cx="158" cy="144" r="4" fill="#FFF"/>
    <g fill="#B5652B" opacity=".55"><circle cx="86" cy="172" r="3"/><circle cx="96" cy="178" r="3"/><circle cx="160" cy="178" r="3"/><circle cx="170" cy="172" r="3"/></g>
    <path d="M108 182 Q128 202 148 182" fill="none" stroke="#3B2A1A" stroke-width="6" stroke-linecap="round"/>
  </g>
</svg>
```

**Usta Dede:**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 320" stroke="#3B2A1A" stroke-width="6" stroke-linejoin="round">
  <rect x="70" y="200" width="116" height="110" rx="26" fill="#7A8B4A"/>
  <path d="M112 200 L128 236 L144 200 Z" fill="#F7F3EA"/>
  <rect x="70" y="282" width="116" height="14" fill="#5A3A22"/><rect x="150" y="276" width="30" height="26" rx="6" fill="#FFC21A"/>
  <ellipse cx="128" cy="134" rx="70" ry="78" fill="#D9A27A"/>
  <path d="M60 124 Q56 150 70 160 M196 124 Q200 150 186 160" fill="none" stroke="#F5F5F0" stroke-width="12"/>
  <path d="M52 92 Q128 30 204 92 L210 104 H46 Z" fill="#C65A3A"/><rect x="40" y="98" width="140" height="16" rx="8" fill="#A84A2E"/>
  <g id="face">
    <circle cx="102" cy="138" r="24" fill="#FFFFFF" fill-opacity=".4" stroke-width="9"/>
    <circle cx="154" cy="138" r="24" fill="#FFFFFF" fill-opacity=".4" stroke-width="9"/>
    <path d="M126 138 H130" stroke-width="9"/>
    <circle cx="102" cy="140" r="9" fill="#3B2A1A" stroke="none"/><circle cx="154" cy="140" r="9" fill="#3B2A1A" stroke="none"/>
    <path d="M86 178 Q106 164 128 174 Q150 164 170 178 Q170 194 150 192 Q138 190 128 184 Q118 190 106 192 Q86 194 86 178 Z" fill="#F5F5F0"/>
    <path d="M116 202 Q128 210 140 202" fill="none" stroke-linecap="round"/>
  </g>
</svg>
```

**Kepçe:**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" stroke="#3B2A1A" stroke-width="6" stroke-linejoin="round">
  <rect x="70" y="110" width="200" height="70" rx="35" fill="#B5652B"/>
  <path d="M268 128 Q300 112 306 90" fill="none" stroke-width="10" stroke-linecap="round"/>
  <rect x="88" y="168" width="22" height="34" rx="8" fill="#B5652B"/><rect x="230" y="168" width="22" height="34" rx="8" fill="#B5652B"/>
  <rect x="78" y="128" width="40" height="18" rx="9" fill="#7FE0C4"/>
  <ellipse cx="78" cy="104" rx="56" ry="48" fill="#B5652B"/>
  <ellipse cx="38" cy="122" rx="30" ry="22" fill="#D99A5E"/><circle cx="14" cy="114" r="10" fill="#3B2A1A"/>
  <path d="M104 92 Q132 130 112 168 Q96 150 98 112 Z" fill="#8A4A1F"/>
  <path d="M30 74 A58 50 0 0 1 140 66 L146 78 H24 Z" fill="#FF9A1F" transform="rotate(-12 85 72)"/>
  <g id="face" stroke="none"><ellipse cx="66" cy="96" rx="9" ry="12" fill="#3B2A1A"/><circle cx="69" cy="91" r="3" fill="#FFF"/>
    <path d="M24 134 Q38 144 52 134" fill="none" stroke="#3B2A1A" stroke-width="5" stroke-linecap="round"/></g>
</svg>
```

**Bay Gribeton:**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 320" stroke="#3B2A1A" stroke-width="6" stroke-linejoin="round">
  <rect x="62" y="196" width="132" height="116" rx="10" fill="#8C939C"/>
  <path d="M110 196 L128 230 L146 196 Z" fill="#FFFFFF"/><path d="M122 214 H134 L138 270 L128 282 L118 270 Z" fill="#5E656E"/>
  <rect x="150" y="226" width="40" height="54" rx="4" fill="#6E7681"/>
  <rect x="62" y="70" width="132" height="132" rx="26" fill="#F0C8A8"/>
  <rect x="54" y="30" width="148" height="56" rx="8" fill="#B8BEC6"/>
  <path d="M60 46 H196 M60 62 H196" stroke="#9AA1AA" stroke-width="3"/>
  <g id="face">
    <path d="M84 116 H118 M138 116 H172" stroke="#4A4F57" stroke-width="10" stroke-linecap="round"/>
    <path d="M90 136 Q101 130 112 136 M144 136 Q155 130 166 136" fill="none" stroke-width="6" stroke-linecap="round"/>
    <circle cx="101" cy="140" r="6" fill="#3B2A1A" stroke="none"/><circle cx="155" cy="140" r="6" fill="#3B2A1A" stroke="none"/>
    <path d="M106 166 H150" stroke="#4A4F57" stroke-width="6" stroke-linecap="round"/>
    <path d="M112 182 Q128 186 146 178" fill="none" stroke-linecap="round"/>
  </g>
</svg>
```

**Kasaba halkı şablonu** (parametreli): Tuna büstündeki gövde ve kafa geometrisi; `hat` (bere / topuz / at kuyruğu /
yok), `outfit` rengi ve tek bir imza aksesuarı (fırın küreği, kitap yığını, dürbün, dev makas) 64–96 px'lik basit
şekillerle eklenir.

### 11.8 Özgünlük kontrolü

| Benzememesi gereken | Onun belirgin öğeleri | Bizim farkımız |
| ------------------- | --------------------- | -------------- |
| Bob the Builder (Bob) | sarı sert kask, ekose gömlek, mavi tulum, alet kemeri, yetişkin erkek, kahverengi saç | Tuna 8 yaşında, **nane yeşili** kask + yıldız, turuncu yelek + çizgili tişört, tulum ve alet kemeri yok, imza öğe dev eldivenler. Kask rengi sarı **olmayacak** (kural). |
| Bob the Builder (Wendy) | sarı kask, kısa sarı saç, mavi tulum | Tuna'nın saçı koyu kestane, tulum yok. |
| Bob the Builder (makineler: Scoop, Muck, Dizzy) | konuşan iş makineleri, sarı kepçe | Oyunda konuşan makine yok; kamyon karaktersiz bir araç. **Not:** "Kepçe" kelimesi "Scoop"un sözlük karşılığıdır; Türkçe dublajda Scoop'un adı doğrulanamadı (web aramasında bulunamadı). Bizim Kepçe bir köpek, kelime gündelik Türkçe isim; TR'de risk düşük. EN'de "Scoop" diye **çevrilmez**, adı "Kepche" (BUSINESS P-6 ile uyumlu). EN metinde "Little Builder" da kullanılmaz (STORY §0). |
| PAW Patrol (Rubble) | sarı kasklı İngiliz buldok inşaat köpeği, kepçeli araç, sırt çantası | Kepçe **sosis köpek**, **turuncu** ve büyük gelen kask, araç/sırt çantası/rozet yok; imza: kulak kaskın altından sarkar, uzun gövde. |
| Handy Manny | konuşan aletler, alet kutusu | Konuşan alet yok. |
| Color Block Jam (Rollic) | renkli blokları eşleşen renkli **kapılardan** kaydırarak çıkarma; renkli çerçeveli kapılar | Bizde geçit duvarın içinde bir **kestirmedir**, çıkış değil; kapı rengi yalnız W6 Boya Kapısı'nda ve damla diliyle görünür; diğer geçitler gri/çelik. Mağaza görsellerinde geçit değil **duvar üstü kaldır–aşır–indir** hareketi öne çıkar. |
| Block Blast (Hungry Studio) | lacivert tahta, neon parlak bloklar, 8×8 ızgara, blok yığını ikonu | Çivit sahne (R2-12) ama tahta sıcak kum/ahşap saha + ozalit şantiye + beton duvar, iki bölgeli; neon ışıma yok; hücre başına çıkıntı + sembol; simgede blok yığını yok (ASSET_LIST §11). |
| Block Out! (proje sahibinin stil referansı, R2-12) | mor çerçeveli tek tahta, hücre başına 2×2 küçük çıkıntılı tuğlalar, ok işaretli yön blokları, saydam buz blokları, roket/UFO/su tabancası güçlendiricileri, pembe-mor ödül ekranları | Hücre başına **tek** büyük çıkıntı ve tepesinde **renk sembolü**; ok/yön bloğu yok; tahta saha + duvar + şantiye; güçlendiriciler inşaat aletleri (çekiç, vinç, fırça, mala); paneller krem gövdeli ahşap çerçeve (mor/pembe değil); karakterler bizim (Tuna, Usta Dede, Kepçe, Gribeton). Referans dosyaları depoya girmez, iz sürülmez, kırpılmaz. |
| Royal Match (Kral Robert) | taç, kırmızı pelerin, kahverengi bıyık, şato sahnesi | Kral/taç/pelerin yok; şato bizde bir festival yapısı, karakteri değil. Ekran düzeni: bizde tahta saha + duvar + şantiye olarak ikiye bölünmüş, üstte yapı panoraması şeridi, sol altta Tuna/Kepçe köşesi. Ana sayfa v2 türün ortak örüntüsünü (üst çubuk, ortada yapı, büyük oyna düğmesi, alt gezinme) kullanır; yapı kasaba arsasında ozalitten inşa edilen bir proje, renkler ve karakterler bizim (§7). |
| Pinokyo (Geppetto) | beyaz saç, gözlük, beyaz bıyık, yelek | Usta Dede: kasket, mala biçimli küt bıyık, zeytin iş ceketi, şerit metre, imza katlanır metre. |
| Monopoly (Bay Monopoly) | silindir şapka, beyaz bıyık, baston | Gribeton'da şapka/baston/monokl yok; imza beton blok saç ve dikdörtgen gövde. |
| Mario | kırmızı şapka, siyah bıyık, tulum | Bıyıklı karakterlerimizde tulum yok; renk ve siluet farklı. |

Kural listesi (ASSET_LIST brifine de girer; **marka adı değil öğe tarifi** olarak): sarı inşaat kaskı yok · tulum yok ·
konuşan makine yok · taç/pelerin yok · karakterlerde harf/logo yok · köpek buldok değil · üst üste renkli küp yığını
yok · neon parıltı yok.

**Yan yana benzerlik testi (EN-2R-15, BUSINESS §2, R-04):** Faz 2R görsel uygulamasının ilk ekran görüntüleri
(`npm run screens`, 390×844: ana sayfa, oyun ekranı Bölüm 8, kazanma) türün 3 yaygın oyununun mağaza ekran görüntüleri
ve R2-12 referansıyla, adları gizlenmiş olarak yan yana gösterilir; 5 kişiye "Hangisi hangi oyunla aynı görünüyor?"
sorulur. **Eşik:** 5 kişiden ≥ 3'ü ana sayfamızı bir rakiple eşlerse ayırt edici öğe büyütülür: ozalit hayaleti ve
iskele yapının ≥ %40'ında görünür kalır, "Bölüm N" düğmesine 6 px ozalit kenarı (`board.blueprint` + beyaz kesik iç
çizgi) eklenir. Oyun ekranı için aynı eşikte çıkıntı çapı ve sembol boyu korunur, saha zemin deseni (delikli pano)
belirginleştirilir. Maliyet ≈ 0,5 gün; sonuç REVIEW_LOG'a yazılır.

---

## 12. Görsel doğrulama (Faz 1 ve Faz 2R)

Tarifler `scratchpad` içinde Chromium ile çizdirilip kontrol edildi (8 blok, 6 şekil, plan hücreleri, `.` ve `?`
hücreleri, Baloo 2 ile "MİNİK USTA · ÇOK ZOR · ğüşıİöç", 4 karakter yer tutucusu). Bulunan ve düzeltilen sorunlar:
ortası budaklı ağaç damarı göze benziyordu (budak sağa alındı); Usta Dede'nin dikdörtgen bıyığı sırıtan dişlere
benziyordu (kıvrımlı bıyık + ayrı ağız); plan sarısı mavi üstünde zeytin rengine dönüyordu (açık altlık).

**Faz 2R (2026-10-07):** `npm run screens` (390×844) çıktıları incelendi: ana sayfa, giriş, Bölüm 1 öğretici, Bölüm 2
sürükleme ve Mola, Bölüm 3 başlangıç ve ray geçişi, kayıp ve kazanma. Bulgular §1 "v1 → v2 farkı" tablosundadır. v2
tarifleri `scratchpad` prototipinde (Canvas2D + Baloo 2, Chromium) çizildi: (a) 8 renk × L3, I4, O4, I3, T4, I2, L5
şekilleri + kaldırılmış blok, (b) 6 düğme varyantı + basılı hal + rozet, (c) oyun ekranı 1080×2337 (hafif öğretici,
kalan blok çipi, kilitli güçlendirici çubuğu), (d) ana sayfa 1080×2337 (kapsüller, alan şeridi, ilerleme, ozalit
hayaleti, alt gezinme). Bulunan ve düzeltilen sorunlar: yüzü kaydırma yöntemi yastıkların üst kenarını kırpıyordu
(yerine kenar başına öteleme, §3A.1 madde 3); parlama elipsi sembolün üst çizgisine değiyordu (merkez 0,17h → 0,13h,
sembol merkezi 0,50h → 0,54h, boy 0,44c → 0,42c); gradyan durağı %42'de B sembolü 2,9:1'e düşüyordu (%30, §2.5).

**Faz 2R kabul testleri (görsel uygulamanın ilk ekran görüntüleriyle; PL-2R-13, PL-2R-04, DL-2R-17).** Her test 375 pt
genişlikte, normal görüşte ve deutan + protan simülasyonunda (Machado 2009) 5 kişiyle yapılır; sonuç REVIEW_LOG'a yazılır.

| # | Test | Kurulum | Eşik | Tutmazsa |
| - | ---- | ------- | ---- | -------- |
| a | İki blok / tek blok (K-16 şekil okuma) | sahada yan yana iki aynı renkli `D2_0` ile tek `O4`, aynı renkte; 8 rengin her biri | 5/5 kişi, 1 sn içinde doğru | `blockV2.outlinePx` 6 → 8; oluk × 0,88 → × 0,92 |
| b | Sembol ayırt etme (v1 0,46c → v2 0,42c) | 8 sembol çıkıntı üstünde, karışık sıra, tek tek | 5/5 kişi, 1 sn | `symbolSizeRatio` 0,46'ya döner, `studDiameterRatio` 0,54 → 0,60 |
| c | Ağır Yük okunurluğu (§6) | Bölüm 8 ve 10 başı; "Hangi nesne plana girmez?" | 5/5 | ikaz bandı iki köşeden bütün üst kenara; kettlebell 40 → 56 px |
| d | Tutulabilirlik (§3A.2) | Bölüm 3, 6, 8 başı; "Hangisi alınır?" | 4/5, 2 sn | tutulamaz tint #EBEBEB → #D9D9D9 (× 0,85) |
| e | Geçit açıklığı (§5) | Bölüm 4 ve 9; açıklık dikdörtgeni | sahne pikseli 0 (dolgu yalnız `board.craneSky`) | — |
| f | Öğretici balonu (UX §13.1) | Bölüm 1–10 her adım, 1080×1920 ve 390×844 | saha hücreleri ve durum şeridiyle kesişim 0 px | UX §13.1 yuva kuralı |
| g | Yan yana benzerlik (§11.8) | ana sayfa, Bölüm 8, kazanma | 5 kişiden ≤ 2'si rakiple eşler | §11.8 ayırt edici öğeler |

## 13. Blockout önce kuralı

Her ekran önce gri kutu düzeniyle (`#D9D9D9` bloklar, `#9E9E9E` çerçeve, yalnız metin etiketleri) uygulanır ve ekran
görüntüsü design-lead onayından geçer; sonra bu belgedeki görsel tarifler uygulanır (tasarım ilkesi 7).

**Faz 2R:** yeni ekranlar (ana sayfa v2, kazanma v2, hafif öğretici) önce blockout ekran görüntüsüyle (390×844 ve
360×800) incelenir; yerleşim onaylanınca §14 kiti ve §7 görselleri uygulanır. Bloklar ve mevcut ekranların yalnız
deri değişikliği (v1 → v2) blockout gerektirmez.

---

## 14. UI kiti v2 (Faz 2R)

Bütün öğeler prosedüreldir (Canvas2D, ekran açılışında pişirilir ya da 9-dilim doku). Değerler `tokens.kit.*`.
Boyutlar UX §0.3'teki dokunma kurallarına uyar (sık hedef ≥ 144 px, diğer ≥ 128 px).

### 14.1 Hacimli düğme (`kit.button`, `kit.buttonColor.<v>`)

Çizim sırası (genişlik w, yükseklik h, köşe r = min(48, 0,32·h)):

| # | Katman | Tarif |
| - | ------ | ----- |
| 1 | Düşen gölge | yuvarlak dikdörtgen (x, y + 14 + 8, w, h − 14), siyah α 0,22 (`dropShadowYPx`, `dropShadowAlpha`) |
| 2 | Kontur | tam dikdörtgen (x, y, w, h), r; dolgu **stroke** |
| 3 | Kalınlık | 6 px içe (`strokePx`), r − 6; dolgu **lip** |
| 4 | Yüz | (x + 6, y + 6, w − 12, h − 12 − 14), r − 6; dikey gradyan **top** (0) → **base** (0,55) → base (1) |
| 5 | Parlama bandı | (x + 20, y + 12, w − 40, yüz yüksekliği × 0,40), köşe max(4, r − 14); beyaz α 0,55 → 0,08 dikey |
| 6 | Etiket | §8.1 "Parlak başlık" (krem varyantta "Panel metni"); dikeyde yüzün ortası + 4 px |

| Durum | Görsel |
| ----- | ------ |
| Normal | yukarıdaki gibi |
| Basılı | yüz 10 px aşağı iner, kalınlık 14 → 4 px (`pressedLipPx`), ölçek 0,97 (`pressedScale`); gradyan aynı. Süre `duration.buttonPress` 60 ms, bırakınca `buttonRelease` 120 ms 1,04 → 1,00 (JUICE #69, #97) |
| Pasif | `grey` dörtlüsü, parlama α 0,12 (`disabledGlossAlpha`), etiket α 0,80, dokununca titreme yok |
| Kilitli | pasif + sağ üstte 48 px `icon_lock`; dokununca `common.unlockAt` balonu (UX §0.3) |
| Dikkat (yalnız ana sayfa "Bölüm N") | yüzün üstünden sola-sağa çapraz parlama süpürmesi: genişlik w × 0,18, 20° eğik, beyaz α 0,45, 500 ms, 4000 ms'de bir; bant dokusu yüz dikdörtgenine `setCrop` ile kırpılır, dikeyde yüz yüksekliğinin %70'i (köşelerde taşmasın; maske yok, JUICE kural 11). Azaltılmış harekette yok |

Varyant → kullanım §2.6. Tek ekranda **tek yeşil** düğme (birincil eylem, UX §0.2).

### 14.2 Panel (`kit.panel`)

Pencereler, HUD hamle plakası ve kazanma kartı. Katmanlar: düşen gölge (y + 18, siyah α 0,25) → 6 px dış kontur
#5A3A1E (`outline`) → 14 px ahşap çerçeve, dikey gradyan #FFD27A → #D9933A (`frameTop`, `frameBottom`) → 3 px iç çizgi
#8A5A26 (`frameInner`) → krem gövde #FFF4D6 (`body`) → gövdenin üst 28 px'inde iç gölge #C99A52 α 0,45 → 0. Köşe 48 px
(dış), içe doğru her katmanda katman kalınlığı kadar azalır. Gövde iç payı 48 px (`padPx`). Çukur alanlar (hedef kutusu,
liste satırı) `inset` #FBE7B5, köşe 24, üstte 3 px iç gölge. **HUD varyantı (hedefler paneli):** çerçeve yok, yalnız 6
px kontur + krem gövde, köşe 32 (tahtanın üstünde daha az ağırlık).

### 14.3 Başlık şeridi — ribbon (`kit.ribbon`)

Pencere başlıkları, ana sayfa alan adı, kazanma "KAZANDIN!". Gövde: yükseklik 104 px, genişlik = yazı + 2 × 64 (en az
480, en çok 820), köşe 18, 6 px kontur, dikey gradyan **top** → **base** (0,5); üst %35'te beyaz α 0,35 parlama bandı.
Kuyruklar: iki yanda gövdenin 20 px arkasından çıkan 64 px genişlikli kuyruk, 22 px aşağıda, dış ucunda 28 px "V"
çentiği, dolgu **dark** + kontur. Yazı: yüksekliğin %56'sı (58 px) "Parlak başlık". Pencerede şerit panelin üst
kenarına ortalanır ve 52 px (yarısı) taşar. Varyantlar: `orange` (pencere, alan adı), `gold` (kazanma, ödül), `blue`
(bilgi, kural kartı).

### 14.4 Rozet (`kit.badge`)

**Faz 2R (R2-12): yuvarlatılmış kare** 60×60 px, köşe 16 (`kit.badge.shape` `roundedSquare`, `cornerPx`): 6 px beyaz
halka (`ring`) + içte dikey gradyan #FF8A7E → #D8362A + halkanın dışında 3 px #5E1410 kontur (alt kenarda +3 px kalın,
hacim). Sayı 36 px "Parlak başlık". Kilitli adet rozeti (UX §0.3) aynı geometri, dolgu `ui.badgeLocked`. (Eski Ø 60
daire, `diameterPx` anahtarı kare kenarı olarak okunur.)

### 14.5 Sayaç kapsülü (`kit.capsule`) — üst çubuk

Yükseklik 96, köşe 48; dolgu #141E34 α 0,78 (her zeminde beyaz rakam ≥ 8,1:1, ölçüldü: beyaz gök üstünde 8,1, çimen
üstünde 11,8); içte 3 px beyaz α 0,22 çizgi. İkon 112 px, kapsülün sol ucundan 16 px dışarı taşar (ikon kapsülün önünde).
Rakam 52 px "Sayaç" stili, ikonla artı arasında ortalı. **Artı düğmesi** (yalnız altın): Ø 68, yeşil dörtlü, beyaz "+"
(32×10 çubuklar); dokununca Mağaza. Can kapsülünde sayı yanında yenilenme sayacı ("29:12" ya da "Dolu", `hud.livesFull`)
`font.size.caption`.

### 14.6 İlerleme çubuğu (`kit.progress`) — kasaba ilerlemesi

Yükseklik 48, köşe 24; iz #3B2A1A + içte 6 px payla beyaz α 0,35; dolgu dikey gradyan #FFE680 → #F0A800; görev sayısı
kadar dilim çizgisi (3 px `ui.ink` α 0,35); sağ uçta 80 px `icon_star` (yarısı dışarı taşar); ortada "3/7"
(`common.count`) 38 px "Sayaç".

### 14.7 Alt gezinme (`kit.nav`)

Çubuk h 176 + güvenli alan, dikey gradyan #3A2E7A → #241C52 (Faz 2R, R2-12 çivit arayüz zemini; eski #2A3D66 →
#1B2843), üst kenarda 6 px #5546A8 çizgi. 5 sekme × 216 px. İkon 112
px (seçili 132), altında etiket 34 px. **Seçili sekme:** 200×212 karo 24 px yukarı taşar, gradyan #5FA8FF → #2E6FD0, 6 px
#0B3A6E kontur, etiket beyaz. **Kilitli sekme:** ikon α 0,55 + sağ altında 48 px `icon_lock`, etiket #C9D2E6 (çubukta
7,1:1). Seçilmemiş açık sekme: ikon α 1, etiket #C9D2E6.

### 14.8 Öğretici balonu (`kit.bubble`, `tutorial.*`)

Beyaz #FFFFFF, 6 px `ui.ink` kontur, köşe 32, düşen gölge y + 8 siyah α 0,18; iç pay 28 / 20 px; metin `font.size.body`
44 px ağırlık 700 "Panel metni"; tek satır hedeflenir (≤ 6 kelime), en çok 2 satır; genişlik ≤ 640 px. Sol ucunda Usta
Dede portresi: Ø 128 daire, krem dolgu, 6 px `ui.ink` halka, içinde `chr_dede_bust` kırpımı (yer tutucu: §11.7 SVG
kafa); balona 24 px kuyrukla bağlanır. **Daire kırpımı çalışma anında maske kullanmaz (CL-2R-26):** portre yüklenince
bir kez Canvas2D `arc` + `clip` ile 128×128 dokuya pişirilir (halka dahil), sonra sıradan görüntü olarak çizilir. Eldiven: 140×160 `ui_tutorial_glove`, düşen gölge siyah α 0,30 y + 8. Vurgu:
hedefin çevresinde 8 px beyaz α 0,95 kontur + 18 px beyaz parlama, 1,0 ↔ 1,04 nabız (UX §13.1). **Karartma yok.**

### 14.9 Hedef çipi (oyun HUD'u)

Hedefler panelinde iki çip yan yana: [yapı ikonu 96 px + dilim "1/3"] ve [kalan blok ikonu 96 px + sayı 64 px +
`hud.blocks` "blok" 34 px]. **Kalan blok ikonu nötrdür (PL-2R-14):** üç hücrelik L, §3A geometrisinde (yastık, çıkıntı,
yan duvar) ama **krem kit rengi** (`kit.buttonColor.cream`: yüz #FFF4D6, kalınlık #D9B878) + `ui.ink` kontur, **sembol
yok**, 0,42 ölçek; hiçbir blok rengini ima etmez ve her bölümde aynıdır. Çip tamamlanınca (dilimler bitti / kalan 0)
ikonun sağ altında yeşil ✓ rozeti (`ghost_badge_ok`, 40 px). Teslim edilmemiş parti rozeti ve en çok 4 çip kuralı UX
§5.9 madde 2 ve 7.

---

## 15. Efektler v2 (görsel tarif; zamanlama JUICE §8)

| Efekt | Doku / tarif | Kullanım |
| ----- | ------------ | -------- |
| **4 köşeli kıvılcım** (`fx_sparkle4`) | 4 uçlu yıldız yolu (uzun eksen 48 px, kısa 16 px), merkez beyaz → kenar **ışıltı** tonu; ölçek 0 → 1,2 → 0, 45° döner | doğru yerleşim (#92), düğme süpürmesi ucu, ödül kapsülleri |
| **Parlama** (CL-2R-25 kararı) | **Blokta: siluet ADD flaşı** — pişirilmiş siluetin bütününe beyaz ADD, α 0 → 0,6 → 0, 260 ms; eğik bant yok (maske ve ek doku yok). **Düğmede: süpürme** — 20° eğik beyaz bant, genişlik %18, α 0,45, `setCrop`'lu bant dokusu (yüz dikdörtgenine kırpılı; maske yok) | blok yerleşti (#92), dilim (#93), "Bölüm N" düğmesi (#98) |
| **Işıltı halkası** | siluetin 10 px genişletilmiş pişirilmiş kopyası, **ışıltı** tonunda α 0,35 | kaldırılmış blok (#91) |
| **Işın (sunburst)** | 12 ışın, merkezden dışa; ışın rengi #FFF3C4 α 0,35, arası saydam; zemin radyal #FFE7A3 → #FF9E55; 0,05 tur/s döner (`kit.sunburst`) | kazanma (#95), sandık |
| **Yıldız patlaması** | 16 küçük yıldız (`fx_star_small`, 20–36 px) radyal 160–320 px + 1 halka (beyaz 8 px, 0,6 → 1,6 ölçek, α 0,6 → 0) | kazanılan yıldız (#96) |
| **Konfeti v2** | `fx_confetti_<c>` dikdörtgenine 2 px beyaz α 0,5 parlama şeridi; 3D salınım: x ölçeği cos(t) ile −1…1 | kazanma (#55), dilim (#18) |
| **Toz** | v1 `fx_dust` aynen | iniş, kazı |
| **Altın iz** | sikke ve yıldız uçuşunda arkada 6 küçük `fx_gold`, 60 ms arayla, α 0,8 → 0 | #59, #74 |

Bütçe (JUICE §0 kural 4) değişmez: ekranda ≤ 120, patlama başına ≤ 40 parçacık; azaltılmış harekette ≤ %20 ve ışın
dönmez.

---

## 16. Araştırma ve kaynaklar (Faz 2R, 2026-10-07)

Web araması (WebSearch) ile Royal Match, Block Blast ve benzer premium casual oyunlar (Toon Blast, Gardenscapes) için
görsel dil, ana sayfa, öğretici ve ödül yaklaşımı tarandı. Yalnız **ilke** alındı; ekran düzeni, karakter, ikon ve logo
kopyalanmadı (§1 sütun 7, §7 benzerlik sınırları, §11.8). Bulunan kaynakların çoğu ikincil analiz yazısıdır; birincil
geliştirici belgesi bulunamadı. İlkelerin bir kısmı tür bilgisidir ve bu belgedeki ölçümlerle (prototip, kontrast,
renk körlüğü) doğrulandı.

| Kaynak | Çıkarılan ilke | Bu belgedeki karşılığı |
| ------ | -------------- | ---------------------- |
| [Funovus — Royal Match Dominates Match-3: What Can ALL Designers Learn?](https://www.funovus.com/blogs/royal-match-dominates-match-3-what-can-all-designers-learn/) | Zorlayıcı, uzun "büyük el" öğreticileri yerine erken bölümler o kadar cilalanır ki oyuncu zorlanmadan takılmaz; meta akışı iki eyleme indirgenir (oyna / inşa et); UI sayfaları otomatik geçer; yüksek kontrastlı canlı palet ve ayırt edici şekiller; her dokunuşta haptik | Hafif öğretici (UX §13.1), ana sayfada tek büyük "Bölüm N" + ilerleme (UX §3), §1 sütun 4–5 |
| [This Week in LiveOps — 5 Simple UX Lessons From Royal Match](https://thisweekinliveops.substack.com/p/5-simple-ux-lessons-from-royal-match) | Sade meta, otomatik yönlendirme, net ilerleme | Ana sayfa durumları ve geçişleri (UX §3) |
| [Royal Match Breakdown: Part 1 (Pranay Sarepaka)](https://pranaysarepaka.substack.com/p/royal-match-breakdown-part-1) | Ana sayfa = alan yapısı + oyna düğmesi + yıldız ilerlemesi; FTUE'de zorunlu tıklama azaltılır | Alan şeridi + ilerleme çubuğu (§14.6), FTUE (UX §2.2) |
| [Game Analysis of Royal Match and Toon Blast (Medium)](https://medium.com/@ekinmelissezer/game-analysis-for-royal-match-and-toon-blast-9c4bff8ef48b) | Royal Match ile Toon Blast'ın mekanik, bölüm tasarımı, zorluk ve oyuncu kancası karşılaştırması (yalnız başlık ve özet okundu; çapraz kontrol) | §1, UX §3 |
| [Block Blast tasarım özeti (cinevva)](https://app.cinevva.com/arcade/block-blast) ve [Blocky Blast Puzzle (seeles.ai)](https://www.seeles.ai/games/puzzle/blocky-blast-puzzle) | Yerleşmiş blok = parlak yuvarlak kare + üstte açık şerit + altta koyu şerit; eğimli kenar (bevel) ve parlama derinlik verir; keskin kenar ve net kontrast hızda okunurluk sağlar | §3A katman 2–6 (yan duvar, gradyan, parlama), §2.5 kontrast ölçümü |
| [Layer Lab — GUI Ribbon Pack](https://layerlab.itch.io/2d-ribbon-pack-1), [Casual Game Design UI 01](https://kraupin.itch.io/casual-game-design-ui-01), [Unity Asset Store — UI Kit Hyper Casual](https://assetstore.unity.com/packages/2d/gui/ui-kit-hyper-casual-262070) | Casual UI kitlerinin ortak bileşenleri: şerit başlıklar, hacimli düğme + basılı hal, panel + dolgu, çubuklar, rozetler; yumuşak gölge ve ince gradyan | §14 bileşen listesi (kendi ölçü ve renklerimizle; kit görselleri kullanılmadı) |
| [Toon Blast inceleme (sts.org)](https://auth.sts.org/?p=8341) | Bölüm numarası ve ilerleme taşıyan net bölüm kartı/düğmesi; yıldız, altın ve ilerleme göstergelerinin animasyonlu sunumu | "Bölüm N" düğmesi, ödül kapsülleri (UX §6.1), §15 |
| Proje sahibinin 9 ekran görüntüsü (R2-12, "Block Out!", `artifacts/reference/owner-2026-10-07/`, git dışı) | Çivit/mor arayüz zemini; doygun ana renkler; çıkıntılı tuğla bloklar; kalın konturlu şeker düğmeler (yeşil ana eylem, kırmızı yuvarlak ×); beyaz kalın yazı + koyu kontur; üst çubuk kapsülleri + yeşil "+"; kırmızı kare rozet; ortada yükseltilmiş ana sekme; bölüm başı penceresi; yükleme ekranında uçuşan tuğlalar | §1, §3A.5 (tek çıkıntı + sembol), §7.1 (çivit sahne), §14.4 (kare rozet), §14.7 (çivit gezinme); kopya yasağı §11.8 |

**Bilinçli farklar:** Royal Match'in kral/şato evreni, mavi-altın marka renkleri ve oda dekorasyon meta'sı yok (bizde
kasaba arsasında ozalitten inşa); Block Blast'ın koyu lacivert 8×8 tahtası, neon ışıması ve "kombo yazısı" patlamaları
yok (bizde çivit sahne üstünde sıcak kum/ahşap saha + ozalit şantiye, iki bölgeli tahta, plan dili; R2-12). Proje
sahibinin referans oyunundan alınmayanlar: hücre başına 2×2 küçük çıkıntı, yön oklu bloklar, buz blokları, oyuncak
güçlendiriciler, mor/pembe paneller ve bütün karakter, logo ve simgeler (§11.8).
