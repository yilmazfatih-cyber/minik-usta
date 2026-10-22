# Stil kitabı — ART_REFERENCE v1 (R2-13 stil öğrenimi)

Sahip: design-lead · Sürüm: **v1.1 (2026-10-21; v1 2026-10-14)** · Kaynak: proje sahibinin 25 referans ekranı
(`artifacts/reference/owner-2026-10-07/ref-01…09.png`, `artifacts/reference/owner-2026-10-14/ref-01…16.png`; git dışı,
yalnız stil; R2-12, R2-13) · Bağlı belgeler: `ART_DIRECTION.md` §17 (v3 farkları), `UX_FLOWS.md` §1.1, §4.1, §6.2,
`STORY.md` §7.8, `src/theme/tokens.json → kit.v3`.

> **Amaç.** Proje sahibinin isteği: "oyunu üreten görsel zekâna bunları öğret; bunlar gibi görsel üretebilsin; örnek
> alabilir, içeriği kopyalayabilir ama görsel böyle olsun." Bu belge 25 ekrandan **ölçülerek** çıkarılmış stil
> kurallarıdır: her tarif hex ve piksel verir; "benzer", "uygun" gibi sözcük yoktur. Kod bu belgeye göre çizer
> (prosedürel: Canvas2D / Phaser Graphics), SVG'ler bu belgeye göre yazılır, ekranlar §10 rubriğiyle kabul edilir
> (her boyutta ≥ 4/5). Neyin kopyalanıp neyin kopyalanamayacağı §11'dedir.
>
> **Ölçüm yöntemi.** Bütün referanslar 1206×2622 px (iPhone, 3×). Tasarım tuvali 1080 genişliktir: **k = 1080 / 1206 =
> 0,8955**; referansın 2622 px yüksekliği tasarımda **2348 px**'e denk gelir, bu da EXPAND kipindeki 390×844 (2337 px)
> ile aynıdır: referans düzenleri yükseklik ölçeklemesi olmadan birebir taşınır. Renkler PIL ile 5×5 piksel
> ortalamasıdır; gradyan durakları ekranın dikey sütunlarından, kalınlıklar satır/sütun boyunca renk koşularından
> okundu (örnek: "Oyna" düğmesi y 1556–1791 → 236 px → 211 tasarım px). Aşağıdaki her değer **tasarım px**'tir
> (parantez içi değer referansın ham ölçüsüdür, yalnız iz sürülebilirlik için).
>
> **v1.1 (2026-10-21).** 25 referans ikinci kez tek tek açıldı (doğrulama: v1 ölçüleri değişmedi). Eklenen: §3.4
> kapsül üstü rozet (14/ref-13, ref-16), §3.14 yön oku (14/ref-11), §9.1 yükleme "boot paketi" kuralı (iskelet yer
> tutucu yükleme ve kazanma ekranında kabul edilmez), §9.2 avatar karesi (Faz 4), §9.10 kasaba alan penceresi
> (14/ref-16) ve etkinlik sonu kartı (07/ref-05), §10.1 ilk puanlama kaydı (code-lead v3 ekran seti 2026-10-20).
> Tokens: `check.v3Addenda` (şemadan düşer; code-lead bileşeni yazarken `kit.v3.<grup>` altına tipleyerek taşır —
> TECH 2R.7 testi `kit.v3`'te tiplenmemiş anahtar kabul etmez).

---

## 1. Görsel dilin özü (10 cümle)

1. Arayüz zemini **koyu çivit-mordur** (#1A173C → #2B2661), parlak renk yalnız bloklarda, düğmelerde ve ödüllerde yaşar;
   zemin ne kadar koyuysa öğeler o kadar "ışıklı" görünür.
2. Her dokunulur öğe **hacimlidir**: koyu ince dış kontur (5–7 px), yüzün üstünde açık bir **bevel bandı**, altta
   yüzün %18–20'si kadar **koyu dudak**; düz kutu hiçbir yerde yoktur.
3. Yüzler **iki katmanlıdır**: dış yüz + 30 px içe oturan, daha açık **iç plaka** (düğme, güçlendirici karesi, pencere);
   bu "kapak + gövde" hissi oyuncak-plastik malzemeyi verir.
4. Işık **sol üstten** ve yumuşaktır: bevel bandı üstte (açık), dudak altta (koyu), sağ kenarda dar koyu yan duvar;
   sert siyah kontur yerine **tonun koyusu** (taban × 0,45–0,55) kullanılır.
5. Yazı **beyaz ya da krem, çok kalın (800), yuvarlak** (Baloo 2); koyu kontur ince (0,06 em) ve altında aynı renkte
   kısa gölge; büyük başlıklarda iki halkalı kontur (orta ton + koyu ton), altın başlıklarda sarı → turuncu gradyan.
6. **Yeşil = tek birincil eylem** (Oyna, Katıl, Al), **kırmızı yuvarlak × = kapat**, **kırmızı kare rozet = sayı**,
   **yeşil yuvarlak + = satın al**; bu dört kalıp her ekranda aynı yerde ve aynı biçimdedir.
7. Pencereler koyu zemin üstünde (karartma α 0,85) **ortalanmış, kalın çerçeveli, köşeleri 48–64 px** panellerdir;
   başlık panelin üst kenarına **biner** (yarısı dışarıda), × sağ üst köşeye **biner**.
8. Bloklar **çıkıntılı oyuncak tuğladır**: doygun taban, üstte açık bevel, altta koyu duvar, her çıkıntının üst-sol
   hilal parlaması; tahta kalın mor çerçeveyle "tepsi" içinde durur.
9. Karakterler **render edilmiş 3B görünümlü çizgi filmdir**: siyah kontur yok, çok duraklı gradyan, kenar ışığı,
   temas gölgesi, iki parlamalı büyük gözler; malzeme (plastik, kumaş, kürk) yüzeyden okunur.
10. Her ödül **sahnelenir**: karartma → ortada tek büyük nesne + parlama → sayı → "Dokun ve al"; ışın, kıvılcım ve
    konfeti yalnız bu anlarda, boşta asla.

---

## 2. Renk sistemi

### 2.1 Zeminler (hex ölçümü)

| Zemin | Ölçüm (referans) | v3 değeri (tokens `kit.v3.palette`) | Kullanım |
| ----- | ---------------- | ----------------------------------- | -------- |
| Oyun ekranı | üst #1A173C, y %26'da #2B2661 (radyal parlama), alt #1A183D | `gameBase` #1A173C + merkez (540, 0,26 H) r 0,6 W radyal `gameGlow` #2B2661 α 1 → 0 | oyun HUD'u (07/ref-01, 14/ref-01) |
| Meta ekranı (profil, koleksiyon, yolculuk) | düz #302488; koleksiyonda #161541 → #252460 | `metaBase` #302488; alt %35'te #262070'e giden dikey gradyan | profil, yolculuk, koleksiyon (14/ref-05…07) |
| Başlık şeridi (meta ekranı üstü) | #4E3BDB üst → #4333BB alt, altında 6 px #2E208E çizgi + 19 px #261970 gölge | `headerTop` #4E3BDB, `headerBottom` #4333BB, `headerEdge` #2E208E, `headerShadow` #261970 | sekmeli ekran başlıkları |
| Ana sayfa göğü | #3B1DB1 (0) → #7150CB (0,17) → #B270FE (0,26) → #C7ADFF (0,34) → buz #B8BEFE / #5AC8F0 (zemin) | `skyTop` #3B1DB1, `skyMid` #7150CB, `skyLow` #B270FE, `skyHorizon` #C7ADFF | ana sayfa sahnesi (07/ref-03) |
| Yükleme göğü | #1B49A4 (0) → #2B5FB6 (0,30) → #769AD2 (0,46) → bulut #F0D7D6 (0,61) → #D9BFC8 (1) | `loadTop` #1B49A4, `loadMid` #2B5FB6, `loadLight` #7AA3D8, `loadCloud` #F0D7D6 | yükleme (07/ref-09) |
| Karartma | arka plan #B270FE → #110F0E, beyaz → #191919 (oran 0,10) | `overlay` #05030D **α 0,85** (referans 0,90; bizde arka plan %15 görünür kalsın) | her pencere |
| Sıcak ahşap (liderlik) | #A34115 panel, #8B3A12 koyu, satır kremi #FBEBCB | `woodBase` #A34115, `woodDark` #8B3A12, `cream` #FBEBCB | Faz 4 liderlik (14/ref-03) |
| Lacivert + krem (RM ailesi) | lacivert #172033, mavi panel #134C88 → #1A63AC, krem #F9F3C3 / #F5EBC1 | `navy` #172033, `blueTop` #134C88, `blueBase` #1A63AC, `creamSoft` #F5EBC1 | hamle plakası, balon, bilgi kartı |

### 2.2 Panel ve çerçeve renkleri

| Katman | Hex | Kalınlık |
| ------ | --- | -------- |
| Pencere dış kontur | #221380 | 7 (8) |
| Pencere açık kenar bandı | #3A27B0 | 16 (18) |
| Pencere oluk | #27198A | 8 (9) |
| Pencere iç bevel | #3C2AAD | 22 (24) |
| Pencere gövdesi | #4A3AC7 (0) → #523ED5 (1) dikey | — |
| Pencere alt dudak | #3726A2 | 40 (45) |
| Pencere alt dudak koyusu | #261883 | 22 (25) |
| İç plaka (açık) | #8C7DFE gövde, #352496 kontur 6, #7261F1 üst çizgi 8 | — |
| Krem kart (içerik) | #F5EBC1 gövde, #FAF0CE açık kenar 8, ışın tonları #FAEFBC / #F1E5BD | — |
| Koyu kart (istatistik) | #1D1652 gövde, #281E6F kontur 6 | — |
| Lavanta kart (profil) | #A79BFE gövde, #6456CF kontur 7, alt #5F4EC3 7 + gölge #21185D 8; alan #604FE3 | — |
| Tahta çerçevesi | yüz #473DA3 (üst #5247B8 → alt #3F35A0), dış kenar #221B66, iç çizgi #2E2778 | 72 (75) |

### 2.3 Düğme renkleri × durum

Dörtlü sıra: **üst bevel / yüz (gradyan üst → alt) / dudak / kontur**. "Basılı": yüz 8 px iner, bevel bandı 0,5×, dudak
0,35× (L boyda 40 → 14). "Pasif": gri dörtlü, yazı α 0,8, parlama yok. "Kilitli": pasif + 48 px kilit rozeti (§3.13).

| Varyant | Üst bevel | Yüz | Dudak | Kontur | Yazı | Ölçüm kaynağı |
| ------- | --------- | --- | ----- | ------ | ---- | ------------- |
| `green` (birincil) | #3EE01A + 5 px #9BF34E çizgi | #5CE83A → #2BCA0A → #19B205 | #02630F | #0A5A12 (alt #003908) | beyaz + #0E5A14 kontur | Oyna 07/ref-02: üst #24DE15, yüz #2BCA0A, dudak #02630F, kontur #015203 |
| `greenSoft` (RM tipi, uzun CTA) | #ACD84E | #85BC01 → #579100 | #295A00 | #285900 | krem #FBF8D1 + #36520D kontur | Katıl 14/ref-13 |
| `orange` (teklif, +5) | #FFD36B | #FFB32A → #F08A00 | #B35A00 | #7A3A00 | beyaz + #7A3A00 | Blok Bileti şerit altı #F9CE01 / #D98A00 |
| `blue` (araç / güçlendirici karesi) | #25BCFC (bevel 29) | #2A9AE6 → #1670C0 | #0E489B | #5343B8 (lavanta-koyu) | — | 07/ref-02 güçlendirici karesi |
| `purple` (HUD aracı: geri al, duraklat, ayar) | #7A66F8 (bant 30) | #604DF7 → #5B48F7 | #2A1D8B | #16133C | ikon #C9BEFD | 07/ref-01 undo, 07/ref-03 ayar #5C49E8 |
| `red` (kapat ×) | #FE6E73 halka 6 | #FE3232 | #7C0000 | #A30101 | krem #F6EBDE + #8E1233 | 07/ref-02 × |
| `cream` (ikincil) | #FFFFFF | #FFF6D2 → #F4E3B6 | #D9B878 | #6B4A26 | #3B2A1A | sekme kremi #FCEDCE (14/ref-03) |
| `grey` (pasif) | #D6D1C8 | #B9B2A5 → #A39B8E | #8C8579 | #5C564D | #FFFFFF α 0,8 | — |

### 2.4 Vurgu ve bilgi renkleri

| Ad | Hex | Nerede |
| -- | --- | ------ |
| `gold` | #FFD119 (yüz), #FFE96A (açık), #FFAD00 (koyu), #B8430A (kontur) | altın başlık, sikke, yıldız, ilerleme dolgusu |
| `cyan` | #24CCFF → #0A71FE | yolculuk ilerleme izi, seçili çerçeve ışıması |
| `pink` | #B840D2 | konum işareti ("55" balonu), etkinlik |
| `badgeRed` | #F04A3C → #C8140F, kontur #9C0B00 | sayı rozeti |
| `checkGreen` | #3ED121, kontur #1E8A10 | tamamlandı ✓ |
| `lockGold` | #FFE24A → #F5A300, kontur #7A3A00, delik #5F2102 | kilit |
| `heartRed` | #FF3B3B → #B80E12 | can |

### 2.5 Metin renkleri

| Rol | Hex | Kontur / gölge | Ölçüm |
| --- | --- | -------------- | ----- |
| Parlak başlık (koyu zemin) | #FFFFFF | 1. halka #5A47EF 0,10 em, 2. halka #3325A2 0,045 em, gölge #211865 +0,06 em | "Seviye 55" 07/ref-02 |
| Altın başlık | #FFE96A → #FFD119 → #FFAD00 dikey | #B8430A 0,06 em, gölge #5E2206 α 0,6 +0,06 em | "Günlük Bonus Ödülleri" 07/ref-06 |
| Düğme etiketi | #FFFFFF | zeminin kontur rengi 0,06 em + gölge +0,04 em | "Oyna" |
| Sayaç (koyu kapsül) | #FFF6E3 (krem) | #0B0918 0,08 em | "03:00" 07/ref-01 |
| Sayaç (ikincil) | #A09AFC (lavanta) | gölge #0E0C2C +3 px | "3597", "Seviye 55" 07/ref-01 |
| Krem kart metni | #1A467B (lacivert-mavi) | yok | RM balonu, "Koleksiyon'u açmak…" |
| Krem satır metni | #51230E (kahve) | yok | liderlik adı |
| Koyu kart etiketi | #9385FF | yok | istatistik etiketi 14/ref-05 |
| Koyu kart değeri | #FFFFFF | yok | istatistik değeri |
| Açık kapsülde vurgu | #FFC20F | yok | "Seviye 95" 14/ref-06 |

**Renk körlüğü notu:** arayüz renkleri oyun bilgisi taşımaz; bilgi taşıyan dört kalıp (kırmızı rozet = sayı,
yeşil ✓ = tamam, kilit = kapalı, altın halka = dolu) **biçim + sayı** ile de okunur. Blok paleti değişmez
(ART §2.1, D-083; §5).

---

## 3. Bileşen tarifleri (Canvas2D / Phaser Graphics)

Ortak kurallar: bütün köşeler `arcTo`; gradyanlar dikey (`createLinearGradient(x, y, x, y + h)`); katmanlar sırayla
dolgu olarak çizilir (kontur = en dıştaki dolgu, iç katman onu halka olarak bırakır); ölçüler tasarım px; "r" köşe
yarıçapı. Her bileşen bir kez pişirilir (9-dilim ya da tam doku), basılı hâl ayrı doku.

### 3.1 Hacimli düğme — 3 boy (`kit.v3.button.L/M/S`)

| Boy | w × h | r | Kontur | İç plaka payı | Üst bevel bandı | Dudak | Yazı | Kaynak ölçüm |
| --- | ----- | - | ------ | ------------- | --------------- | ----- | ---- | ------------ |
| **L** (birincil CTA) | 560 × 212 | 48 | 6 | 30 | 38 + 5 px açık çizgi | 40 | 96 px, 800 | Oyna 548×211, Bölüm 568×204, Katıl 573×278 |
| **M** (ikincil, satır içi) | 360 × 136 | 36 | 5 | 20 | 24 + 4 | 28 | 56 px, 800 | Aktifleştir 349×134, Yap 249×133 |
| **S** (kart içi) | 240 × 100 | 28 | 4 | 14 | 16 + 3 | 20 | 44 px, 800 | Al 188×77, fiyat düğmeleri |

Çizim sırası (L, yeşil; diğer boylar oranla):

```
1 gölge      roundRect(x, y + 10, w, h, r)                 siyah α 0,30, blur 18
2 kontur     roundRect(x, y, w, h, r)                      stroke rengi (#0A5A12); alt kenarda 2 px daha koyu (#003908)
3 dış yüz    roundRect(x+6, y+6, w−12, h−12, r−6)          yüz gradyanının 0,7 koyusu (#1CCC16 → #11A80E): plaka çevresinde 30 px "kenar" olarak kalır
4 dudak      rect(x+6, y+h−6−40, w−12, 40) r alt köşeler   #02630F; üstünde 3 px #04800F çizgi
5 iç plaka   roundRect(x+36, y+30, w−72, h−30−40−12, r−22) gradyan 0 #5CE83A · 0,55 #2BCA0A · 1 #19B205
6 bevel      rect(plaka.x, plaka.y, plaka.w, 38) r üst     #3EE01A → α 0 dikey; en üstte 5 px #9BF34E α 0,9 çizgi (plaka genişliğinin %92'si, ortalı)
7 parlama    ellipse(plaka.sağ − 70, plaka.y + 26, 34, 12) beyaz α 0,55 (yalnız greenSoft / RM tipinde; yeşil L'de yok)
8 etiket     ortalı, dikey merkez = plaka merkezi + 2      beyaz, kontur #0E5A14 0,06 em (en az 4 px), gölge aynı renk +0,04 em, lineJoin round
```

Basılı: 5–7 katmanları 8 px iner, dudak 40 → 14, ölçek 0,97, süre 60 / 120 ms (JUICE #97). **Tek ekranda tek yeşil L.**
Dikkat (boşta "Bölüm N"): 4 s'de bir 500 ms çapraz parlama süpürmesi (ART §14.1) plaka dikdörtgenine kırpılı.

### 3.2 Kırmızı yuvarlak × (`kit.v3.close`)

Ø **120** (117), dokunma hedefi 144. Merkez, bağlı olduğu panelin **sağ üst köşesinin (−60, +50)** noktasındadır
(panel kenarına biner; 07/ref-02 ölçümü: kenardan 60 sol, 50 aşağı).

```
1 gölge     circle(cx, cy + 8, 60)                 siyah α 0,35, blur 14
2 kontur    circle(cx, cy, 60)                     #A30101
3 dudak     circle(cx, cy + 4, 48)                 #7C0000      (alt 12 px hilal kalır)
4 yüz       circle(cx, cy − 2, 48)                 #FE3232 → #F01F22 (radyal, merkez 0,4·r sol üst)
5 parlama   arc(cx, cy − 2, 42, 200°→340°) 6 px    #FE6E73 α 0,9 (üst yarım halka)
6 glyph     iki yuvarlak uçlu çubuk 26 × 66, ±45°  dolgu #F6EBDE, kontur #8E1233 6 px, gölge #8E1233 +3 px
```

### 3.3 Yeşil yuvarlak + (`kit.v3.plus`)

Ø **56** (60), kapsülün sağ ucunda, kapsül kenarından 8 px dışarı taşar; dokunma hedefi 128 (kapsülle birlikte).
Katmanlar: kontur #0C8312 5 → dudak #0E7A0E (alt 8 px hilal) → yüz #5BE03A → #22B018 radyal → üstte 4 px beyaz α 0,5
yay (210°→330°) → "+" beyaz iki çubuk 28 × 8, uçlar yuvarlak, gölge #0C8312 +2 px.

### 3.4 Kapsül sayaç (`kit.v3.capsule`)

İki boy: **ana sayfa** h 88 (98) · **oyun HUD'u** h 60 (58–68). r = h/2.

```
1 dolgu        roundRect                                   #23164D α 0,85 (HUD'da #14113A α 0,85)
2 iç kenar     roundRect inset 2, 2 px stroke              #0E0C2C α 0,7 (koyu iç halka — referans kapsülleri "çukur"dur)
3 üst çizgi    rect(x+r, y+3, w−2r, 2)                     beyaz α 0,10
4 ikon         Ø 80 (88) ana sayfa / Ø 64 (72) HUD          sol uçtan 20 px dışarı taşar, kapsülün önünde, kendi gölgesi α 0,3
5 sayı         sayaç stili (§4), 44 px / 40 px              ikon ile artı (varsa) arasında ortalı; HUD'da lavanta #A09AFC
6 artı         §3.3 (yalnız altın)                          sağ uçta
```

Can kapsülünde sayı kalbin **içinde** (beyaz 36 px, #B80E12 kontur 0,08 em), kapsül metni süre ("43:37") ya da "Dolu".
Zaman kapsülü (HUD ortası): 300 × 68, saat ikonu Ø 44 lavanta çizgi 5 px, rakamlar krem #FFF6E3 48 px sabit hane.

**Kapsül düzeni (ana sayfa, 07/ref-03 ölçümü):** kapsüller **ayrı ayrı** çizilir, tek birleşik bar yoktur: can
kapsülü 300 × 88 (x 160), altın kapsülü 300 × 88 (x 500), aralık 40; her kapsülün sol ucunda ikon 20 px dışarı taşar,
sağ ucunda (altında satın alma varsa) Ø 56 yeşil +; sağ uçta ayar düğmesi 104 (x 936). Yıldız sayacı (bizde) can
kapsülünün soluna değil **ilerleme çubuğunun sağ ucuna** biner (§3.8 "ödül ikonu" yuvası): üst çubukta en çok 2
kapsül + ayar kalır (375 pt'te okunurluk).

**Kapsül üstü rozet (14/ref-13, ref-16):** kapsülün sağ üst köşesine Ø 56 kırmızı daire rozeti (§3.5 küçük boy, rakam
34) biner: merkez = kapsül sağ kenarı − 16, kapsül üst kenarı + 4. Kullanım: harcanabilir yıldız sayısı (kasaba görevi
bekliyor); altın ve can kapsülünde yok. Rozet görünürken kapsül 1,0 ↔ 1,04 nabız 2 s'de bir (azaltılmış harekette
sabit). Değerler `check.v3Addenda.capsuleBadge` → `kit.v3.capsule.badge*`.

### 3.5 Kare sayı rozeti (`kit.v3.badge`)

**72 × 72** (80 pencere / 67 HUD), r 20, bağlı olduğu karenin sağ alt köşesine **merkezi köşede** olacak biçimde biner
(yarısı dışarıda). Katmanlar: gölge α 0,3 +4 → kontur #9C0B00 7 → dudak #A80E07 (alt 6 px) → yüz #F04A3C (0) → #DA201A
(0,45) → #C8140F (1) → üst 18 px beyaz α 0,22 bevel → rakam beyaz 44 px 800, kontur #7A0A05 0,06 em. Küçük boy 56
(etkinlik "1"): daire, aynı renkler, rakam 34.

### 3.6 Şerit başlık ve bant başlık (`kit.v3.header`)

İki kalıp ölçüldü:

- **Binen başlık (Block Out! tipi, varsayılan):** şerit yok; başlık yazısı (§4 "iki halkalı") panelin **üst kenarına
  biner**: yazının dikey merkezi = panel üst kenarı − 20; harf yüksekliği 112 px. Panel üst kenarının 57 px'lik bölümü
  (#312197) yazının gölge alanıdır (yazının arkasında panel tonu ×0,85 yumuşak bant, blur 24).
- **Bant başlık (RM tipi, Faz 4 bilgi pencereleri):** panelin üstünde 240 (269) yükseklikte yatay bant, mavi #134C88
  (0) → #1A63AC (1), bandın üst ve alt kenarında **çift altın çizgi**: 12 px #F7CD02 + 12 px #E07500 (üst çizgi bant
  içinden 20 px aşağıda, alt çizgi bant tabanından 20 px yukarıda); bant uçları panelden 28 px dışarı taşar (kuyruk),
  taşan kısmın altı #0F3E6E. Yazı krem #FBF4C8 + #0B3A6E kontur 0,08 em + altın #F7CD02 dış halka 0,05 em, 96 px.
- **Bilet şeridi (etkinlik adı):** 640 × 128 altın dikdörtgen (#F6B21B yüz, #D98A00 alt dudak 18, r 16) içinde 24 px
  payla magenta plaka (#D9237A → #B0124F, kontur #8D0527 4); yazı beyaz + #8D0527 0,08 em, 72 px.

Kazanma ve alan adı için v2 kuyruklu ribbon (ART §14.3) kalır; renkleri §2.4 altınla güncellenir.

### 3.7 Pencere gövdesi (`kit.v3.panel`)

Varsayılan boy **1000 × 900** (1005 × 899), x 40–1040; alttan çapa `layout.popup.panelBottomPx` 296 (FIT'te y
724–1624). İçerik yükseldikçe panel yukarı uzar (en çok 1000 × 1240).

```
1 gölge        roundRect(x, y + 16, w, h, 64)                 siyah α 0,40, blur 32
2 kontur       roundRect(x, y, w, h, 64)                      #221380
3 açık kenar   roundRect(x+7, y+7, w−14, h−14, 58)            #3A27B0
4 oluk         roundRect(x+23, y+23, w−46, h−46, 44)          #27198A
5 iç bevel     roundRect(x+31, y+31, w−62, h−62, 38)          #3C2AAD
6 gövde        roundRect(x+53, y+53, w−106, h−106−62, 28)     #4A3AC7 (0) → #523ED5 (1)
7 alt dudak    rect(x+53, y+h−53−62, w−106, 40) + altında 22  #3726A2, #261883   (gövde altında iki koyu bant)
8 iç plaka     roundRect(x+100, y+100, w−200, hp, 36)         #8C7DFE; kontur #352496 6; üst 8 px #7261F1 çizgi; alt 10 px #6B5DE0 bant
9 krem kart    (içerik okunacaksa iç plaka yerine)            #F5EBC1; kenar #FAF0CE 8; ışın yelpazesi (§8.1) α 0,5; üstte 12 px #E6D9B0 iç gölge
```

Başlık §3.6 "binen başlık", × §3.2. Pencere girişi: 0,9 → 1,0 ölçek + α, 220 ms `Back.easeOut` (JUICE #70).

### 3.8 İlerleme çubuğu (`kit.v3.progress`)

İki boy: **meta** h 84 (85) ve **kompakt** h 48. Katmanlar (meta): kontur #F79900 8 → iç kenar #1E6B00 4 (yalnız dolgu
tarafında) → iz #06436D → dolgu #7FC21A (0) → #4E9300 (1), dolgu sağ ucu yuvarlak, dolgunun üst 14 px'i beyaz α 0,18
→ metin "1/6" krem #F9F3C3 44 px + #06436D kontur 0,08 em ortada → sağ uçta ödül ikonu 120 (sandık) çubuğun üstüne
biner. Kompakt: kontur `ui.ink` 4, iz #3B2A1A, dolgu altın #FFE96A → #FFAD00, dilim çizgileri `ui.ink` α 0,35.

Dikey iz (yolculuk): 72 genişlik, iz #0E1147 + kontur #291A8B 8; dolgu 40 genişlik #24CCFF (sol) → #0A71FE (sağ)
yatay gradyan, her duraktan sonra 4 px koyu bölme çizgisi.

### 3.9 Alt gezinme + yükseltilmiş sekme (`kit.v3.nav`)

- **Çubuk:** h **200** (199) + güvenli alan; dolgu #533FE9 (0) → #4E3CDB (1); üst kenar: 8 px #31229C koyu çizgi + altında
  11 px #4634CE açık çizgi; güvenli alan bölgesi #4333BD. 5 sekme × 216; sekmeler arası 2 px #3624AA dikey ayraç
  (y + 60 … y + 140).
- **Seçili sekme (yükseltilmiş):** 300 × 300 (308) karo, çubuğun üstünden **100 px** (109) taşar, r 44 üst / 0 alt;
  kontur #2C1E94 12; içinde 5 px #9C92FF açık çizgi; yüz #6A5CFF (0) → #5747E8 (1). Seçili ikon 134 (150), etiket
  beyaz 40 px 800 + #2C1E94 kontur 0,06 em, karonun alt 70 px'inde ortalı. **Yükselen sekme her zaman seçili
  sekmedir** (orta değil; 14/ref-06 "Koleksiyon" sağda, 14/ref-07 "Yolculuk" 4. yuvada): sekme değişince karo 250 ms
  yeni yuvaya kayar (`Quad.easeOut`), ikonlar 1,0 ↔ 1,18 ölçek değiştirir.
- **Seçili olmayan:** yalnız ikon 115 (128), etiket yok; ikon dikey merkezi çubuğun ortası − 6. Kilitli: ikon α 0,55 +
  48 px kilit (§3.13) sağ altta; dokununca "Yakında" balonu (UX §0.3).
- Çubuk gölgesi: üstte 16 px siyah α 0,25 (sahne çubuğun arkasına girer).

### 3.10 Liderlik satırı (`kit.v3.leaderRow`)

**1040 × 176** (1039 × 176), satır aralığı 20, r 36. Katmanlar: gölge α 0,25 +6 → kontur #B07857 6 (altta 10) → üst iç
kenar #C8BDA5 10 → gövde #FBEBCB → sol **sıra sütunu** 120 genişlik (kontur r'siyle kırpılı): 1. #F4C00C (madalya +
#A73800 kurdele), 2. #C9D2E8 (gümüş-mavi), 3. #D08A4A (bronz), 4+ gövde rengi + sıra rakamı #51230E 56 px → avatar
karesi 136 (139) x 176: r 28, kontur #6E5EE6 7, iç çizgi #B5BAF7 3, içinde portre → ad #51230E 44 px 700, x 336 →
sağda ödül: sikke yığını ikonu 110 + altında kırmızı hap 150 × 56 (#E8324A → #C8143C, kontur #8A0A26 4) beyaz 36 px
sayı. Oyuncunun kendi satırı: gövde #FFF6D2 + 4 px #F7A704 kontur.

### 3.11 İstatistik kartı (`kit.v3.statCard`)

**480 × 200** (491 × 201), 2 sütun, aralık 40, r 36. Gövde #1D1652, kontur #281E6F 6, üstte 10 px #2A2170 çizgi (bevel).
İkon 90 (90) kartın üst kenarına biner (merkezi kenarın 2 px üstünde). Etiket #9385FF 36 px 700, y + 118; değer beyaz
56 px 800, y + 164; değer yoksa "–". Krem varyant (RM tipi, Faz 4): gövde #FBF3C8, etiket #2C334F 36, değer kutusu
280 × 64 #CFC3A4 → krem #F7EEB2 metin 44 px + #595E5A kontur.

### 3.12 Ödül kapsülü ve ödül hapı (`kit.v3.rewardPill`)

- **Kazanma kapsülü (v2 §14.5 boyu 300 × 96):** gövde koyu #14113A α 0,85, ikon 80 sol uçta, "+1" / "+61" krem 44 px.
- **Ödül hapı (ikon altı):** 150 × 56 kırmızı (#E8324A → #C8143C, kontur #8A0A26 4, r 28), beyaz 36 px; ikonun alt
  kenarına biner (ikonun %30'u hapın üstünde).
- **Adet etiketi ("x1"):** ikonun sağ altında beyaz 40 px 800 + #2C1E94 kontur 0,08 em + gölge +3; arka plan yok.

### 3.13 Kilit rozeti (`kit.v3.lock`)

İki boy: **büyük** 180 × 200 (yolculuk kilidi) ve **küçük** 48 × 56. Gövde: roundRect r 22 (küçükte 8), gradyan
#FFE24A (0) → #FFC21A (0,5) → #F5A300 (1), kontur #7A3A00 4 (küçük 3), üst-sol 6 px beyaz α 0,45 çizgi; kelepçe: 20 px
(küçük 6) kalınlıkta "U" yol, #F9B400, iç kenar #C76A00 4, kelepçe gövdeye 0,55 gövde genişliği oranında; delik: daire
Ø 0,30 w + aşağı trapez, #5F2102; gölge α 0,3 +4. Kilitli kartlarda kart gövdesi α 0,85 kalır, kilit sağ alt köşeye
biner.

### 3.14 Balon (`kit.v3.bubble`) — öğretici

Kaynak: RM öğretici balonu 969 × 244 (14/ref-09, ref-11). v3: genişlik ≤ **880**, yükseklik ≥ 160, r 36; dolgu #FFF6D2;
**iki halkalı kontur**: iç 8 px #2E9BF0, dış 6 px #0B3A6E (alt kenarda dış halka 10 px — dudak); gölge siyah α 0,25 +10;
metin #1D4F8F 48 px 800 ortalı, en çok 2 satır, iç pay 40 / 28. Kuyruk yok (referansta yok); hedefe bağ **eldiven**
ile kurulur. Usta Dede portresi (ART §14.8 Ø 128) balonun sol dış kenarına biner (identity; referansta yoktur).
Karartma **yok** (D-082; referanstaki α 0,75 karartma alınmaz).

**Eldiven / el:** 140 × 160; ten #FEC999 (0) → #F2A978 (0,6) → #D98A5E (1), kontur #C0755A 5 (siyah değil), işaret
parmağı yukarı, manşet beyaz #FFFFFF + turuncu reflektör bandı #FF8A1F (Tuna'nın yeleği; RM'deki kırmızı-taş bileklik
alınmaz), gölge siyah α 0,30 +10; `tap` 0,9× basılı, halka dalgası beyaz 4 px α 0,8 → 0.

**Yön oku (isteğe bağlı, 14/ref-11 ölçümü 134 × 190):** 120 × 170; gövde 48 genişlik + üçgen uç 120 genişlik / 70
yükseklik; dolgu dikey #FFD53A (0) → #FFC21A (0,5) → #F5A300 (1), kontur #7A3A00 5, üst-sol 6 px beyaz α 0,45 çizgi,
gölge siyah α 0,30 +8; hedefin **24 px dışında** durur ve hedefi gösterir; 600 ms'de 16 px ileri-geri salınım
(`Sine.easeInOut`), azaltılmış harekette sabit. Yalnız eldivenin parmak ucuyla gösterilemeyen geniş hedeflerde (vinç
alanı bandı, şantiye, HUD paneli) ve en çok 2 ok; karartma yok (D-082). Değerler `check.v3Addenda.arrow` →
`kit.v3.bubble.arrow*`. Kullanım kuralı UX §13.1.

---

## 4. Tipografi

Font Baloo 2 (ART §8) değişmedi; ölçülen stil referansla aynıdır (çok kalın, yuvarlak, geniş harf aralığı). v3 yazı
stilleri (kod: `kit.v3.text.*`; em = yazı boyuna oran, kontur `lineJoin: round`, önce gölge, sonra kontur, sonra dolgu):

| Stil | Dolgu | Kontur | Gölge | Boy | Ölçüm |
| ---- | ----- | ------ | ----- | --- | ----- |
| `titleTwoRing` (pencere / ekran başlığı) | #FFFFFF | 1. halka #5A47EF 0,10 em, 2. halka #3325A2 0,045 em | #211865 +0,06 em | 112 / 96 | "Seviye 55" harf 85, halkalar 11 + 5, gölge 7 |
| `titleGold` (ödül başlığı) | #FFE96A (0) → #FFD119 (0,5) → #FFAD00 (1) | #B8430A 0,06 em | #5E2206 α 0,6 +0,06 em | 112 (2 satıra kadar) | "Günlük Bonus Ödülleri": harf 95, kontur 7 |
| `button` | #FFFFFF (greenSoft'ta krem #FBF8D1) | zemin kontur rengi 0,06 em, en az 4 px | aynı renk +0,04 em | 96 / 56 / 44 | "Oyna" harf 90, kontur 7, gölge 5 |
| `counterCream` | #FFF6E3 | #0B0918 0,08 em | yok | 48 / 44 | "03:00" |
| `counterLavender` | #A09AFC | yok | #0E0C2C +3 px | 40 | "3597" |
| `bigNumber` (hamle, ödül sayısı) | #FBF1BD | #00325A 0,08 em | #00325A +0,05 em | 110 / 72 | RM "19" |
| `label` (koyu kart) | #9385FF | yok | yok | 36 | "İlk Denemede Kazanıldı" |
| `cardText` (krem kart) | #1A467B | yok | yok | 48 / 44 | RM balonu |
| `rowText` (krem satır) | #51230E | yok | yok | 44 | liderlik adı |
| `plain` (sahne üstü bilgi) | #FFFFFF | #111111 0,07 em | #111111 +0,05 em | 64 | "Yükleniyor", "Dokun ve al" (72) |

Kurallar: başlıklar **yazıldığı gibi** ("Bölüm 12", "Güçlendiricileri seç"), büyük harf yalnız etiket ve zorluk
etiketinde (ART §8.1 listesi; referans "GÜNLÜK HEDİYE" dışında büyük harf kullanmaz). En küçük boy 34. Rakamlar
sayaçlarda sabit hane yuvası (ART §8). Vurgu kelimesi aynı cümlede **altın #FFC20F** (14/ref-06 "Seviye 95'de",
14/ref-15 "21.Bölüm'e" kırmızı #B8260A) — tek kelime, `{hl}` yer tutucusuyla (STORY §0-11 kalıbı).

---

## 5. Blok ve tahta

### 5.1 Referans bloğun ölçümü (07/ref-01, hücre 117 px tasarım)

| Katman | Ölçüm | Ton (yeşil örneği, taban #077C16) |
| ------ | ----- | ---------------------------------- |
| Taban yüz | düz dolgu | #077C16 |
| Üst bevel bandı | 24 px (27) | #0FB110 = taban × 1,30 (L\* +9) |
| Alt yan duvar | 26 px (29) | #065C1A = taban × 0,74 |
| Sağ yan duvar | 8 px | taban × 0,92 |
| Dış kontur | 2 px | taban × 0,6 (neredeyse yok; ayrım tahta zemininden gelir) |
| Bloklar arası boşluk | 6 px zemin (#2C2670) | — |
| Köşe yarıçapı | 14 px dış, 6 px iç | — |
| Çıkıntı | hücre başına **2 × 2**, Ø 0,44 c (51), aralık 0,5 c | yüz = taban; üst-sol hilal 8 px × 1,25 α 0,7; alt hilal 10 px × 0,80; silindir yanı 6 px × 0,80 |
| Büyük parlama elipsi | **yok** (plastik mat) | — |
| Renk ruhu | R #EE2A1E, G #0A8A17, B #0053EA, Y #F0AE05, P #9433E3, açık mavi #1195E7 | doygunluk C\* 70–95 |

### 5.2 v3 bloğumuz (ART §3A üstüne farklar; `kit.v3.block`)

Blok paleti ve sembol kuralı **değişmez** (D-083). Değişen: (1) kontur 6 → **4 px** ve ton × 0,42 → **× 0,50**
(referans "konturu zeminden alır"; bizde tahta zemini açık olduğundan 4 px kalır); (2) üst bevel bandı yastığın üst
**0,20 h**'si taban × 1,28 → α 0 (yeni katman, parlama elipsinden önce); (3) yan duvar `lipPx` 12 → **20** ve ton × 0,68
→ × 0,74; (4) yastık parlama elipsi α 0,50 → **0,30**, rx 0,22 w → 0,18 w (şeker değil, mat plastik); (5) çıkıntı:
**hücre başına tek, Ø 0,54 c** kalır (özgünlük, §11), üst-sol hilal 6 px × 1,25 α 0,7 ve alt hilal 8 px × 0,80
eklenir, sembol çıkıntı tepesinde kalır; (6) bloklar arası ayrım `insetPx` 3 → **4** (iki blok arasında 8 px zemin +
4 + 4 kontur). Tutulamaz blok: hilal parlamaları yok, × 0,92 koyu (ART §3A.2 aynen).

### 5.3 Tahta çerçevesi ve tepsi (`kit.v3.board`)

Referans: tahta 7 hücre, kalın mor çerçeve her yanda **72** (75), alt kenarda 30 px daha koyu dudak; köşe 40 dış /
20 iç; zemin (hücreler arası) #2C2670. v3: tahta grubu (vinç alanı tepesi – durum şeridi altı, UX §5.8) çevresine
**çerçeve 48** (6 ≤ kenar payı olan profillerde 24'e düşer; UX §5.8 madde 9 tepsi payı kuralı): yüz #5247B8 (0) →
#3F35A0 (1), dış kenar #221B66 8 (altta 24), iç çizgi #2E2778 4, köşe 40 / 20; saha, duvar ve şantiye çerçevenin
içinde kendi v2 görünümleriyle (ahşap saha, beton duvar, ozalit şantiye) kalır. Çerçevenin üst kenarında, sahanın
üstünde, 24 px #A09AFC α 0,5 "havalandırma" çizgisi yok — sade. **Karar (ÖNERİ, proje sahibine):** saha zemini sıcak
kum (#E9C891) kalır; referansla birebir "koyu zemin" isteniyorsa `kit.v3.board.floorDark` #2C2670 varyantı tek
anahtarla açılır (sembol mürekkebi kuralı aynı; kontrast ölçümü ART §2.5 yeniden koşulur).

Mekanik bloklar (ok yönlü, buz faset, dalga kenarlı sayı etiketi, kilitli sarı çerçeveli şerit) referansın oyun
mekaniğidir; **alınmaz** (§11). Bizim engellerimiz (kasa, torba, zincir, ıslak, Ağır Yük) ART §6'daki gibi kalır ama
v3 malzeme diliyle: koyu kontur 4 px tonun koyusu, bevel bandı, yan duvar.

---

## 6. Karakter ve maskot çizim dili

### 6.1 Ölçülen dil (07/ref-03 mavi maskot, 07/ref-09 üçlü, 14/ref-03 binekli dörtlü, 14/ref-13 kral + uşak + köpek, penguen)

| Özellik | Ölçüm |
| ------- | ----- |
| Oran | baş : gövde 1 : 1,3 (maskot), 1 : 2,2 (yetişkin insan); gözler baş yüksekliğinin **%30–32**'si, göz aralığı baş genişliğinin %45'i |
| Göz | göz akı beyaz → alt kenarda #DCE6F2; iris göz yüksekliğinin %58'i, radyal #5FD0FF (merkez) → #1577D8 (kenar); bebek irisin %45'i #0A1630; **iki parlama**: büyük irisin %28'i saat 10–11'de, küçük %12'si saat 4–5'te; üst kapak çizgisi ten × 0,6 α 0,5 |
| Kaş | kalın (baş genişliğinin %12'si), uçları yuvarlak, gövde renginin koyu-soğuk tonu (mavi maskotta #2E2A8A) |
| Ağız | geniş gülüş baş genişliğinin %55'i; iç #4A1430, diş sırası beyaz yuvarlak dikdörtgen, dil #FF6B7A; dudak kenarında 3 px ten × 0,8 |
| Malzeme | plastik-mat deri: geniş yumuşak spekülar sol üstte (beyaz α 0,35, baş genişliğinin %40'ı, blur %30); kumaş: 3 duraklı gradyan + dikiş çizgisi; kürk / tüy: kenarda 40–60 küçük yumru (6–10 px), iç kısım gradyan |
| Kenar ışığı (rim) | ışığın karşı kenarında 6–10 px, gök renginde (#C7ADFF ana sayfa, #A9D0FF yükleme) α 0,45 |
| Ortam gölgesi (AO) | çene altı, kol altı, bacak arası: ton × 0,70 α 0,40, 12–20 px yumuşak |
| Temas gölgesi | ayak altında elips 1,2 × ayak genişliği, 0,25 × yüksekliği, siyah α 0,35 → 0 |
| Kontur | **yok**; kenarlar tonun koyusuyla (× 0,45) 2–3 px'lik gradyan kenarıdır |
| Yetişkin yüz (kral, uşak) | ten 4 durak: #F2C9A3 açık, #E7B48A taban, #C98A5E gölge, #A8653F derin; burun ve yanakta sıcak kırmızı α 0,2; sakal / bıyık tutam tutam (6–8 ana tutam, her birinde açık çizgi); kaş kalın koyu kahve |
| Metal (taç, kelepçe) | #FFE27A → #F2B21A → #B87900 + beyaz α 0,8 ince spekülar çizgi + alt kenarda #7A4B00 |
| Hayvan (köpek, penguen) | kürk gradyanı #F5A44A → #D9742B → #B35418; göz kahve #3B1F0E + büyük parlama; burun #2E1A12 ıslak parlama |

### 6.2 SVG'de nasıl (R2-08: elle yazılmış SVG; `filter`, `mask`, `image` yasak — ASSET §16.2)

1. **Hacim:** her ana yüzey `radialGradient` (cx 0,38 cy 0,32 r 0,78) **4 durak**: 0 → renk × 1,35 (ya da renk·0,65 +
   beyaz·0,35), 0,45 → imza renk (birebir hex), 0,85 → × 0,78, 1 → × 0,62. Silindirik parçalarda `linearGradient` yatay
   3 durak (× 1,2 / renk / × 0,7).
2. **Kenar ışığı:** siluet yolunun kopyası, ışığın karşı yönüne 8 px ötelenir, siluetin `clipPath`'iyle kırpılır,
   dolgu gök rengi α 0,45; **kontur yoktur** (ART §16.2'deki 6 px #3B2A1A kuralı karakterde v3'te kalkar; ikon ve
   yapıda 4 px tonun koyusu — ART §17).
3. **Ortam gölgesi:** üst üste binen parçalarda alttaki parçanın `clipPath`'i içinde ton × 0,7 α 0,4 elips/yol
   (filtre yok: 2 katmanlı — α 0,4 geniş + α 0,25 dar).
4. **Temas gölgesi:** ayak tabanında 3 iç içe elips (α 0,35 / 0,20 / 0,10, yarıçaplar 1,0 / 1,25 / 1,5).
5. **Göz:** `ellipse` göz akı (gradyan beyaz → #DCE6F2) → `circle` iris (`radialGradient` 3 durak) → `circle` bebek →
   `circle` ×2 parlama (beyaz; büyük sol üst, küçük sağ alt) → üst kapak `path` (ten × 0,6 α 0,5, 3 px).
6. **Spekülar:** baş üstünde `ellipse` beyaz α 0,35, `radialGradient` ile kenarı yumuşak (0 → α 0,35, 1 → α 0).
7. **Kürk / tüy kenarı:** siluet `path` kenarı 6–10 px yumrulu (`q` eğrileri), 40–60 yumru; iç dolgu gradyan.
8. **Boyut:** karakter SVG ≤ 28 KB (v2 20 KB; 4 duraklı gradyan ve kenar ışığı +%30), koordinat 1 ondalık.

### 6.3 Bizim karakterlerimize uygulama (ART §11 tarifleri değişmez; görünüm v3)

- **Tuna:** nane kask (#7FE0C4) plastik: geniş spekülar + kenar ışığı; turuncu yelek kumaş 3 durak + reflektör
  bantları beyaz α 0,9 çizgi; eldivenler (#FFC93C) yumuşak deri, parmak ayrımı AO; göz §6.1 oranı (D-087: göz ≤ yüzün
  %30'u korunur); saç tutam tutam 6 parça, her tutamda açık çizgi.
- **Usta Dede:** ten 4 durak (#F2C9A3 / #D9A27A / #B8805A / #8F5E3E), bıyık (#F5F5F0) 6 tutam, gözlük camında
  beyaz α 0,5 yansıma şeridi, kasket kumaş dokusu (dikiş), metre ahşap gradyan + siyah çentik.
- **Kepçe:** kürk #B5652B → #8A4A1F yumrulu kenar; kask (#FF9A1F) plastik spekülar; burun ıslak parlama; kulak
  sarkık AO.
- **Bay Gribeton:** gri takım kumaş (3 durak #A7AEB7 / #8C939C / #666C75), beton saç kalıp çizgileri koyu #6E757D 3
  px; göz kapakları yarı kapalı (kapak çizgisi kalın).
- **Yer tutucu kuralı:** final SVG gelene kadar ART §11.7 iskeletleri çizilir; v3 kabulü §10 "karakter / sahne" ≥ 4.

---

## 7. Arka plan ve sahne katmanları

### 7.1 Derinlik katmanları (07/ref-03, 07/ref-09, 14/ref-03)

| # | Katman | Tarif | Ölçüm |
| - | ------ | ----- | ----- |
| 1 | Gök | 3–4 duraklı dikey gradyan (§2.1), üstte en koyu | ana sayfa #3B1DB1 → #C7ADFF |
| 2 | Uzak | dağ / tepe siluetleri, gök rengine %40 karışmış (hava perspektifi), kontur yok | #C691F2 (tepe), #C7ADFF (dağ) |
| 3 | Orta | ağaçlar, kayalar, yapılar; tam doygunluk × 0,85; 4 px tonun koyusu kenar | ağaç #3B7A4A / kar #ECD8FE |
| 4 | Yakın zemin | buz / çimen / taş; yansıma (karakter siluetinin α 0,15 dikey aynası) | buz #B8BEFE → #5AC8F0 |
| 5 | Karakterler | §6 | — |
| 6 | Ön plan parçaları | kenarlarda büyük, bulanık değil ama %10 koyu nesne (kaya, yaprak) | — |
| 7 | Vinyet | kenarlarda × 0,85, ortada 1,0 (radyal) | — |
| 8 | Hava | üstte beyaz α 0,08 → 0 sis bandı (gök ile uzak arasında) | — |

"Sakin orta" ilkesi (ART §7) korunur: tahta ve birincil düğmenin arkasında katman 3–6 nesnesi yoktur.

### 7.2 Oyun ekranı zemini (`kit.v3.scene`)

Referans oyun ekranı **tamamen sade**dir: taban #1A173C + merkez (0,5 W, 0,26 H) r 0,6 W radyal parlama #2B2661 → 0 +
kenar vinyeti × 0,85. v2'deki ozalit ızgara deseni (ART §7.1) **α 0,04 → 0,02**'ye iner, kenar siluetleri (α 0,06)
kalır. Alt bant `ui.ink` α 0 → 0,35 kalır (güçlendirici çubuğu ayrışsın).

### 7.3 Meta ekranı zemini

Düz #302488; üstünde α 0,08 beyaz çizgi "karalama" ikonları (yıldız, blok, kıvrım; 80–160 px, rastgele 10–14 adet,
kenarlarda) — 14/ref-07 deseni. Başlık şeridi §2.1.

### 7.4 Yükleme ekranı sahnesi

Gök §2.1 `load*`; merkezden (540, 420) **18 ışın** beyaz α 0,10 (ışın genişliği 10°, aralık 10°), 0,02 tur/s; alt
%32'de 3 katman bulut (#FFFFFF α 0,95 / #F4E3E8 / #E6D2DD, üst kenar yumruları r 60–140); logonun çevresinde 8 uçuşan
tuğla (§9.1); 12 dört köşeli kıvılcım.

---

## 8. Efektler

| Efekt | Tarif | Ölçüm kaynağı |
| ----- | ----- | ------------- |
| **Işın yelpazesi** | 16–24 ışın, iki ton (açık = zemin × 1,06, koyu = zemin × 0,97), merkezden dışa; krem kartta #FAEFBC / #F1E5BD; ödülde #FFF3C4 α 0,35 (ADD); 0,02–0,05 tur/s | 07/ref-09, 14/ref-12, 14/ref-13 |
| **Parlama (glow)** | ödül nesnesinin arkasında radyal beyaz-altın (#FFE7A3) α 0,55 → 0, r = nesnenin 1,6 katı; nesne 0 → 1,15 → 1,0 ölçek 350 ms `Back.easeOut` | 07/ref-06, 14/ref-04 |
| **Kıvılcım** | 4 köşeli yıldız 20–48 px, beyaz çekirdek + nesne renginde α 0,5 hale; 1,2 s'de bir 2–3 tanesi yanıp söner (0 → 1 → 0, 400 ms) | 07/ref-09 gök, 07/ref-03 etkinlik rozeti |
| **Konfeti** | 24 × 12 dikdörtgen + Ø 14 daire, blok renkleri, 3B dönüş (x ölçeği cos), 2 × 40 parçacık | 14/ref-03 üst sahne |
| **Siyah karartma** | #05030D α 0,85, 200 ms; pencere 0,9 → 1,0 | 07/ref-02, 07/ref-06 |
| **"Dokun ve al" dizisi** | karartma → başlık (`titleGold`, 2 satıra kadar, y 0,22 H) → nesne + glow (y 0,46 H, 240 px) → sayı (`bigNumber` 72, nesnenin 40 px altında) → "Dokun ve al" (`plain` 72, y 0,80 H) 400 ms sonra belirir, 1,0 ↔ 1,04 nabız 1,2 s; dokununca nesne üst çubuk kapsülüne uçar (JUICE #74), karartma 200 ms söner | 07/ref-06, 14/ref-04 |
| **Sikke uçuşu** | 12 sikke, yay (kontrol noktası +160 px yukarı), 600 ms, 40 ms arayla; hedef kapsül 1,0 → 1,08 | — (JUICE #56/#74 aynen) |
| **Düğme süpürmesi** | ART §14.1 "Dikkat" aynen (referans ana düğmesinde boşta parlama yok; bizde kalır) | — |
| **Seçili çerçeve ışıması** | seçili kart çevresinde 10 px #24CCFF α 0,8 → 0,3 nabız (1,2 s) | 07/ref-07 pişmiş kutu |

Bütçe JUICE §0 kural 4 aynen; azaltılmış harekette ışın dönmez, glow sabit, konfeti yok.

---

## 9. Ekran şablonları (1080 genişlik, tasarım px; FIT H = 1920, EXPAND'de orta grup `(H − 1920) × 0,5` kayar)

Ölçülen anatomi (referans → tasarım) ve v3 yerleşimi. Mevcut UX §3, §5, §6 yerleşimleri temel alınır; burada yalnız v3
ile **değişen** ölçüler verilir. Değerler `kit.v3.screen.*`.

### 9.1 Yükleme (UX §1.1)

| Öğe | Konum / boyut | Tarif |
| --- | ------------- | ----- |
| Gök + ışın + bulut | tam ekran | §7.4 |
| Logo amblemi (`logo_emblem` + `app.title` yazısı) | 640 × 360, merkez (540, 420) | yazı §4 `titleTwoRing` yerine **3B harf**: dolgu renkli (harf başına blok rengi), 12 px aşağı-sağ ekstrüzyon ton × 0,6, kontur #4F1E9C 6, gölge α 0,4 +12 (07/ref-09 logosunun **dili**; harf biçimi, renk sırası ve tuğla-harf motifi alınmaz, §11) |
| Uçuşan tuğlalar | 8 adet, 96–200 px, logonun çevresinde halka (r 420–520), açılar 20°, 70°, 110°, 160°, 200°, 250°, 290°, 340° | v3 blok (§5.2), ±30° dönük, 3 s'de ±8 px salınım, uzaktakiler 0,7 ölçek α 0,85 |
| Karakter grubu | 840 × 720, merkez (540, 1060) | Tuna sıçrar (orta, 1,0), Kepçe solda (0,8), Usta Dede sağ arkada (0,9); §6.3 |
| Yükleme metni | `loading.text` "Yükleniyor", `plain` 64, merkez (540, 1700) | 3 nokta 1 s döngü (…) ya da altında 400 × 12 çubuk (iz #0A1F4A α 0,4, dolgu beyaz α 0,9) |
| Sürüm | (540, 1840) 34 `ui.inkSoft` | UX §1 aynen |

Referans ölçüm: logo merkezi 0,18 H, karakterler 0,40–0,80 H, metin 0,89 H, bulut bandı 0,68 H'den aşağı.

**Boot paketi kuralı (v1.1):** yükleme ekranı **ilk karesinden itibaren** SVG rasterlerini gösterir; ART §11.7
iskelet yer tutucusu (kalın kontur, düz renk) yükleme ve kazanma ekranında kabul edilmez (rubrik "karakter / sahne"
≤ 2). Yöntem (R2-08 "derlemede PNG'ye çevrilir"): `chr_tuna_cheer`, `chr_dede_bust`, `chr_kepce_bust`, `logo_emblem`,
`brick_fly_o/i2/l3/1` derleme zamanında PNG'ye çevrilir (kullanım boyutunun 0,75'i; ekranda 1,33× büyütme), toplam
≤ 150 KB, `public/art/boot/`; BootScene bunları ilk boyamadan önce yükler, iskelet yalnız ağ hatası yedeğidir. Logo
grubu: amblem 240 px harf bloğunun sol üstüne (−40, −60) biner (iki ayrı nesne gibi durmaz); harf bloğu 2 satır,
toplam 360 px yükseklik, her satır 150 px harf. Uçuşan tuğlalar `brick_fly_*` (sembolsüz süs); oyun blok dokuları
kullanılmaz. Değerler `check.v3Addenda.bootPack`.

### 9.2 Ana sayfa (UX §3 üstüne)

| Öğe | v2 | v3 | Ölçüm |
| --- | -- | -- | ----- |
| Üst çubuk kapsülleri | h 96 | h 88, ikon Ø 80 (20 taşar), artı Ø 56 | kapsül 98, sikke 88, artı 60 |
| Ayar düğmesi | 120, mavi | 104, `purple` dörtlü, ikon 56 lavanta | 97 |
| Etkinlik baloncukları | 152 kare | **Ø 176 daire** + altında 160 × 56 etiket şeridi (turuncu #AD3E0D / yeşil #288338, beyaz 34) + Ø 56 kırmızı rozet sol üst + 200 × 52 koyu zamanlayıcı kapsülü (#680C29) | 176 / 57 / 56 |
| Yapı + karakterler | yapı merkez, karakter köşesi 300 × 360 | yapı aynı; **karakter grubu 700 × 760** (x 60–760, y 700–1460): Tuna önde büyük, Kepçe solda, Usta Dede sağ arkada; düğmenin arkası boş | 3 karakter + penguen 0,33–0,78 H |
| Bölüm düğmesi | 720 × 176, alttan 264 | **600 × 200 L** (§3.1), alttan **336** (y 1384–1584) | 568 × 204, alt boşluk 122 + sekme 12 |
| Alt gezinme | h 176, 24 taşan sekme | **h 200**, yükseltilmiş sekme 300 × 300 (100 taşar), §3.9 | 199 / 308 / 109 |
| Avatar karesi (Faz 4, profil girişi) | — | sol üstte 100 × 100 (r 24) lavanta kare: yüz #8C7DFE (0) → #6A5CFF (1), kontur #3A27B0 8, iç çizgi #B5BAF7 3, içinde Tuna portresi (`chr_tuna_bust` kırpımı); MVP'de **gizli**, kapsüller x 160'tan başlar (§3.4 kapsül düzeni) | 07/ref-03 avatar 110, 14/ref-13 100 |

### 9.3 Bölüm başı penceresi (UX §4.1)

| Öğe | Konum / boyut | Tarif |
| --- | ------------- | ----- |
| Karartma | tam ekran | #05030D α 0,85 |
| Panel | 1000 × 1040, x 40–1040, y 584–1624 (alttan 296) | §3.7 |
| Başlık | `home.play` "Bölüm {n}", `titleTwoRing` 112, merkez (540, 564) | panel üst kenarına biner; zorluk etiketi ("ZOR") başlığın sağında 200 × 72 kırmızı/mor hap |
| × | merkez (980, 634) | §3.2 |
| İç plaka | 880 × 560, x 100–980, y 684–1244 | §3.7 katman 8 |
| Hedef satırı | y 716–876: yapı küçük resmi 160 × 160 (x 140) + ad (`town.ch<n>.title` 44 beyaz) + ek hedef çipleri 120 | v2 hedef kutusu içeriği |
| Seri satırı | y 892–972, 760 × 80 | v2 seri göstergesi (Bölüm 15+); yokken hedef satırı 40 aşağı iner |
| Etiket | `levelStart.boosters` "Güçlendiricileri seç", 56 px beyaz + #352496 kontur 0,06 em, y 1016 | — |
| Güçlendirici kareleri | 3 × 184, aralık 48, x 252 / 484 / 716, y 1052–1236 | `blue` dörtlü (§2.3), rozet 72 sağ altta (§3.5); seçili: 8 px #24CCFF ışıma + ✓ 40; kilitli: §3.13 küçük kilit + "Bölüm N" 34 |
| Oyna | `levelStart.play` "Oyna", L 560 × 212, x 260–820, y 1332–1544 | §3.1 yeşil |

Durumlar UX §4 ile aynı (can yok, adet 0, kilitli yuva, hata). Referans: panel 1005 × 899, başlık harf 85, kare 183,
rozet 72, Oyna 548 × 211, Oyna altı boşluk 78.

### 9.4 Oyun HUD'u (UX §5.1, §5.9 üstüne)

| Bölge | v3 | Ölçüm |
| ----- | -- | ----- |
| Satır 1 (y 24–84) | sol: "Bölüm {n}" kapsülü 220 × 60 (`counterLavender`); sağ: Usta Serisi kapsülü 260 × 60 | kapsül 58, metin 40 |
| Satır 2 (y 112–248) | sol **Geri Al** 136 × 136 `purple` (x 48); orta **hamle plakası** 300 × 136: üst 52 px lacivert bant #26355A (altın 2 × 4 px çizgi) + "HAMLE" krem 34; altı krem #F9F3C3 plaka, rakam `bigNumber` 96; sağ **Duraklat** 136 × 136 `purple` (x 896) | undo 132 × 140, zaman kapsülü 296 × 68, RM plaka 272 × 180 |
| Hedef çipleri | y 264–344, kapsül biçimi (h 60) × ≤ 4, §3.4 HUD boyu | — |
| Tahta tepsisi | §5.3 çerçeve 48 | 72 |
| Güçlendirici çubuğu | 4 × 160 kare `green` küçük (bevel 18, dudak 20, kontur 8), aralık 32, x 304–1040, alttan 120; rozet 68 | 184 kare, aralık 48, rozet 67 |
| Tuna + Kepçe köşesi | 240 × 260, (16, alttan 24) | — |
| Zemin | §7.2 | — |

### 9.5 Duraklat / çıkış (UX §5.1 Mola penceresi)

| Öğe | Konum / boyut (FIT) | Tarif |
| --- | ------------------- | ----- |
| Panel | 1000 × 900, x 40–1040, y 724–1624 (alttan 296) | §3.7 |
| Başlık | `pause.title` "Mola", `titleTwoRing` 96, merkez (540, 704) | panel üst kenarına biner |
| × | merkez (980, 774) | §3.2; "Devam" ile aynı işlev |
| İç plaka | 760 × 340, x 160–920, y 796–1136 | 3 satır 760 × 100 (y 816 / 916 / 1016): ses / müzik / titreşim; etiket beyaz 44 solda; anahtar 176 × 88 hap sağda: açık #4CC23F + beyaz topuz Ø 72 sağda, kapalı #9C96B5 + topuz solda |
| Bölümden çık | M `cream` 360 × 136, x 360–720, y 1164–1300 | `pause.exit`; ikincil, birincilin **üstünde** (UX §0.2: birincil en altta) |
| Devam | L yeşil 560 × 212, x 260–820, y 1332–1544 | `common.continue`; tek birincil |

Çıkış onayı: panel 920 × 560 (x 80–1000, alttan 296 → y 1064–1624), başlık `exit.title` 96, gövde satırları
`cardText` 44 krem kart (820 × 160) içinde, "Kal" L yeşil 560 × 212 (y 1332–1544), "Çık" M krem 360 × 136 onun
**üstünde** (y 1164–1300): kalmak birincildir (UX §5.1).

### 9.6 Kazanma + ödül katmanı (UX §6.1, §6.2)

Kazanma v2 düzeni kalır (şerit, kart, Tuna, bonus satırı, kapsüller, Devam); v3 kiti: altın şerit §2.4, kart krem
§3.7 katman 9 (ışın yelpazesi), kapsüller §3.12, Devam L. **Ödül katmanı ("Dokun ve al")** sandık, günlük hediye ve
etkinlik ödülünde §8 dizisi: başlık (örn. `chest.title`) y 420, nesne 240 px (540, 880) + glow, sayı 72 y 1040,
`reward.tap` "Dokun ve al" 72 y 1540. Referans: nesne 0,46 H, sayı nesnenin 40 px altında, metin 0,80 H.

### 9.7 Kayıp / +5 (UX §7)

Panel 1000 × 1120 (alttan 296); başlık `lose.title` `titleGold` 96; kalan blok önizlemesi krem kart 880 × 300 (§3.7
katman 9) içinde; "Teklif 1/3" 34 lavanta; üç eşit düğme 920 × 152 (UX §7 aynen) v3 anatomisiyle: turuncu (kontur 5,
dudak 28), krem, krem. × (§3.2) sağ üst köşede durur ve "Hayır, teşekkürler" ile aynı işi yapar (UX §7).

### 9.8 Ayarlar (UX §11)

Pencere kipinde (ana sayfa dişlisi): panel 1000 × 1240; başlık `settings.title` `titleTwoRing` 96; satırlar iç plaka
üstünde krem 880 × 112 (r 32, #FFF6D2, kontur #D9B878 4), etiket `cardText` 44, anahtar 176 × 88; "Geri bildirim" M
krem; ×. Tam ekran kipinde (Faz 4): §2.1 başlık şeridi + liste.

### 9.9 Öğretici balonu + el (UX §13.1)

Balon §3.14 (≤ 880 × ≥ 160) üst yuvada (x 100, y 280); Usta Dede portresi Ø 128 balonun sol kenarına biner (x 60);
eldiven §3.14 hedef hücrede; vurgu ART §14.8 (8 px beyaz kontur + 18 px parlama) → v3: **kontur #24CCFF α 0,9 8 px +
parlama #24CCFF α 0,35 18 px** (referans seçili kart ışıması). Karartma yok.

### 9.10 Faz 4 şablon notları (ölçülü)

| Ekran | Anatomi (tasarım px) | Kaynak |
| ----- | -------------------- | ------ |
| **Profil** | §2.1 başlık şeridi (h 180, başlık `titleTwoRing` 96, × sağ üst); profil kartı 960 × 360 lavanta (§2.2) y 440: avatar karesi 200 × 200 (r 36, kontur #6E5EE6 8, içi #4A1E8A portre zemini) kartın üst kenarına biner, altında ad alanı 400 × 88 (#604FE3, beyaz 48), sağda "Seviye N" (lavanta 44 + beyaz 72), 4 px dikey ayraç #6456CF; "Genel İstatistikler" 56 beyaz + 4 px #1D1766 çizgi; istatistik kartları 2 × 4, §3.11 | 14/ref-05, 14/ref-10 |
| **Koleksiyon (kilitli)** | §7.3 zemin; ortada 3B illüstrasyon 720 × 720 (y 540–1260; kitap + sandıklar bizim: alet sandığı + plan ruloları); kapsül 1000 × 120 (#1E1A56 α 0,9, kontur #121443 4, r 48) beyaz 52 + altın vurgu `{hl}`; nav'da sekme yükseltilmiş | 14/ref-06, 14/ref-12 |
| **Yolculuk** | §7.3 zemin; üstte Ø 640 yuvarlak önizleme (kilitli: gri-mavi × 0,6 doygunluk + §3.13 büyük kilit + "Bölüm 71" kapsülü 400 × 88 #0E1456); dikey iz §3.8 (x 504–576); haplar (§3.10 satır anatomisiyle) **920 × 228** (#5F4EEB, kontur #291A8B 8) sol "Bölüm 60" (lavanta 44 + beyaz 64), sağ ödül ikonu 120 + "x1"; tamamlanan hapın sağ üstünde Ø 80 yeşil ✓; konum işareti pembe 120 × 64 balon "55" | 14/ref-07 |
| **Liderlik (Usta Ligi / seri yarışı)** | üst sahne 0–880 (karakterler); başlık `titleGold` 112 sahnenin alt kenarına biner; sıcak ahşap panel (#A34115) y 900–1360: açıklama krem 40, çarpan sekmeleri 5 × 184 × 128 (seçili: turuncu çerçeve #FDA415 12 + krem; diğer: krem #FCEDCE + ahşap kenar #9E6A4A 6, metin #9E6A4A 48; seçili metin altın + kahve kontur); zamanlayıcı kapsülü 240 × 64 kahve #6A2D12 beyaz 40; satırlar §3.10 | 14/ref-03 |
| **Mağaza** | başlık şeridi + altın kapsülü solda; teklif kartı 1040 × 460: dış altın çerçeve #F6B21B 10 → turuncu gövde #FFAE00 (ışın yelpazesi) → içerik kutusu 600 × 300 (#FFD36B α 0,5, kontur #E08A00 3) → alt bant 100 (mavi #1A4FA0 / magenta #B0124F) + sol ad krem 56 + sağ fiyat düğmesi M `greenSoft` 320 × 120; altın paketleri 3 × 320 × 420 (krem kart #F3E6C0 + altın alt bant 120 + fiyat S); "Daha fazla" krem hap 640 × 112 + Ø 72 yeşil ok | 14/ref-14 |
| **Takım** | başlık şeridi; krem kart 960 × 1240 (ışın yelpazesi) içinde illüstrasyon 760 × 760 + açıklama `cardText` 56 (vurgu kelime kırmızı #B8260A) + 2 satır ödül (ikon 96 + "BEDAVA canlar" 56: BEDAVA krem + #1A467B kontur, devamı #1A467B); "Katıl" L `greenSoft` 560 × 240 | 14/ref-13, 14/ref-15 |
| **Günlük hediye** | pencere §3.7 1000 × 1240; başlık `titleGold`; 3 × 3 kapalı kutu kareleri 200 × 200 (v3 blok dili: kapak + "?" krem 96); seçilen kutu 1,0 → 1,15 + #24CCFF ışıma, açılınca §8 "Dokun ve al"; referansın arcade kabini ve piksel sanatı **alınmaz** (§11) | 07/ref-07, 07/ref-08 |
| **Etkinlik geçidi (bilet)** | magenta zemin #B0215C (§2.1), bilet şeridi §3.6, iki sütun kart 420 × 440 (sol pembe #F280A5 / kontur #DB2D7F, sağ altın #F6D35A / kontur #E09A00) + ortada dikey iz (yeşil #6FED2B → gri #4B1537) ve numaralı Ø 96 turuncu daireler; **Faz 5+** (BUSINESS kapsamı) | 07/ref-04 |
| **Kasaba alan penceresi ("Yap ★N"; UX §3.1 görev penceresi, META yıldızla inşa)** | §3.6 bant başlık (alan adı `town.ch<n>.title`, bant 240, çift altın çizgi) + × köşeye biner; gövde §3.7 çivit pencere 1000 × 1240; **ilerleme kartı** 920 × 200 krem (#F5EBC1, r 36, kontur #D9B878 4): içinde §3.8 meta çubuk 600 × 84 ("k/n" krem + #06436D kontur) ve sağ uçta sandık ikonu 160 çubuğun üstüne biner; altında 4 px ayraç #0F3E6E α 0,4; **görev satırları** 920 × 160 krem (r 32), sol ikon 96 + görev adı `cardText` 48 (#1A467B), sağda M `greenSoft` 280 × 120 "Yap ★1" (yıldız ikonu 48 metnin içinde); yapılmış satır: ikon yerine Ø 64 yeşil ✓ (#3ED121 + #1E8A10), düğme yok, satır α 0,7; yıldız yetmezse düğme `grey` + "★1" rakamı kırmızı #B8260A, dokununca 2 px titreşim (ölü uç yok); değerler `check.v3Addenda.townAreaWindow` | 14/ref-16 |
| **Etkinlik sonu kartı** (Faz 5+) | sahne üstünde 1000 × 480 pencere: §3.6 bant başlık (etkinlik adı), krem gövde #F5EBC1 içinde sol 160 sonuç ikonu (kazanç: altın kupa; kayıp: gri kum saati — kırmızı × yalnız kapat düğmesidir, §1-6) + `cardText` 48 iki satır; altında M `cream` 360 × 136 "Bitti"; sahnenin altında `plain` 64 "Devam etmek için dokun" (bütün ekran dokunma hedefi) | 07/ref-05 |

---

## 10. Rubrik — referans yakınlığı (her ekran, her boyut 1–5; kabul ≥ 4)

| Boyut | 1 | 2 | 3 | 4 | 5 (yan yana konunca aynı sınıf) |
| ----- | - | - | - | - | ------------------------------- |
| **Hacim / ışık** | düz kutular, tek renk dolgu, gölge yok | tek gradyan ya da tek kontur; dudak yok | kontur + dudak var; bevel bandı ya da iç plaka yok; ışık yönü tutarsız | kontur + bevel + dudak + iç plaka, ışık sol üstten; 1–2 öğede eksik | §3 tariflerinin hepsi her öğede; basılı hâl, gölge ve parlama ölçüde |
| **Renk ve kontrast** | pastel / gri; zemin ile öğe ayrışmıyor | doygun ama zemin açık; vurgu renkleri karışık | çivit zemin + doygun öğeler; yeşil-kırmızı kalıpları eksik | §2 paleti; yeşil = birincil, kırmızı × / rozet, altın ödül; 1 sapma | §2 hex'leri ±8 ΔE; zemin → öğe → yazı üç kademe; vurgu yalnız ödülde |
| **Tipografi** | ince ya da sistem fontu; kontursuz | kalın ama kontursuz ya da siyah ince kontur | beyaz + koyu kontur; gölge yok; boyut hiyerarşisi zayıf | §4 stilleri; iki halkalı ya da altın başlık var; 1 stil eksik | §4 tablosu birebir (em oranları, renkler), başlık panele biner, rakamlar sabit hane |
| **Düzen ve boşluk** | öğeler rastgele / sıkışık; başparmak bölgesi boş | hiyerarşi var ama ölçüler §9'dan > %20 sapıyor | §9 ölçüleri ±%10; başlık / × / birincil yerleri doğru; boşluk dengesiz | §9 ±%5; panel payları, kapsül yükseklikleri, nav yüksekliği doğru | §9 birebir; ekran görüntüsü referansla üst üste konunca kenarlar çakışır |
| **Karakter / sahne** | yer tutucu şekil, düz renk, siyah kontur | 2 durak gradyan + siyah kontur (v2) | 3–4 durak + spekülar; kontur kalkmış; gözlerde parlama; sahne tek katman | §6 öğeleri (rim, AO, temas gölgesi, iki parlama) + §7 katmanları 1–5 | §6 + §7 tamamı; malzeme okunur (plastik / kumaş / kürk); vinyet ve hava |
| **İkon ve rozet** | düz tek renk simgeler | kontur + düz renk | gradyan + dudak; rozet kare ve kırmızı; kilit altın | §3.5, §3.13, §3.3 ölçüleri; ikonlar 3B hacimli (bevel + yan yüz) | ikonlar küçük illüstrasyon gibi (3 ton + spekülar + gölge), rozetler köşeye biner, boyutlar ±4 px |

Puanlama: `npm run screens` çıktısı her ekran için 6 satırlık tablo; 3 düzeltme turu; sonra orkestratör proje sahibine
sorar (R2-13 madde 5).

### 10.1 Puanlama kaydı

Tur 1 (design-lead, 2026-10-21; set `artifacts/screens/v3/*-390x844.png`, code-lead 2026-10-20). Bulgular ve
düzeltmeler `REVIEW_LOG.md` "v3 ekran incelemesi 1" (DS3-01…DS3-10). "—" = ekranda karakter yok (boyut sayılmaz).

| Ekran | Hacim/ışık | Renk/kontrast | Tipografi | Düzen/boşluk | Karakter/sahne | İkon/rozet | Kabul |
| ----- | ---------- | ------------- | --------- | ------------ | -------------- | ---------- | ----- |
| Yükleme (`boot-v3`) | 3 | 4 | 3 | 4 | 2 (iskelet yer tutucu) | 3 | hayır |
| Ana sayfa (`home-v2`, `home-v2-first`) | 4 | 4 | 4 | 4 | 3 | 4 | hayır (karakter) |
| Bölüm başı penceresi (`home-level-start`) | 4 | 4 | 4 | 4 | — | 4 | **evet** |
| Ödül katmanı (`home-reward-layer`) | 3 | 4 | 4 | 3 | — | 3 | hayır |
| Oyun HUD + tahta + öğretici (`level-01*`, `tutorial-*`) | 4 | 4 | 4 | 3 | 3 | 4 | hayır (düzen, karakter) |
| Kazanma (`win-v2`) | 3 | 4 | 4 | 4 | 2 (iskelet yer tutucu) | 3 | hayır |

SVG öz puanı r4 (design-lead, 2026-10-22; yalnız SVG katkısı, ASSET §16.6 r4): karakter/sahne **4** (Tuna büst / sevinç /
tam boy, Usta Dede büst / **tam boy yeni**, Kepçe, Gribeton), ikon/rozet **4** (kettlebell ve nextfloor 3 → 4). Ekran puanı
tur 2, code-lead DS3-01…DS3-09 düzeltmeleri + yeni `npm run screens` setiyle.

---

## 11. Kopyalanabilir / kopyalanamaz (R2-13)

**Kopyalanabilir (bu belge bunları alır):** ekran düzeni ve bilgi hiyerarşisi (üst çubuk, ortada sahne, altta büyük
düğme, alt gezinme; pencere + binen başlık + köşeye binen ×); bileşen anatomisi ve oranları (§3: kontur / bevel / dudak /
iç plaka kalınlıkları, kapsül ve rozet oranları, yükseltilmiş sekme); UI örüntüleri (kalp içinde sayı, yeşil +,
kırmızı kare rozet, bölüm başı penceresi "güçlendirici seç + Oyna", "Dokun ve al" katmanı, liderlik satırı,
istatistik kartı, yolculuk hapı, ilerleme çubuğu + sandık); renk ruhu (§2 hex'leri); yazı stili (§4); efekt dili
(§8); karakter **çizim kalitesi** (§6: render dili, göz yapısı, malzeme); genel metin kalıpları ("Güçlendiricileri
seç", "Dokun ve al", "Seviye N", "x1", "1/6"); arka plan derinlik katmanları (§7).

**Kopyalanamaz (asla):** görüntü dosyalarının kendisi (kırpma, iz sürme, yeniden boyama, doku olarak kullanma, renk
örneği dışında piksel aktarımı); referans oyunların karakterleri ve maskotları (mavi / yeşil / turuncu yumurta
maskotlar, dinozorlar, penguen, kral, uşak, köpek, bitki); logolar ve logo harf biçimleri (3B tuğla-harf logosu,
"!"li ad); adlar ve marka öğeleri ("Block Out!", "Royal Match", "Blok Bileti", "Nilüfer Sıçrayışı", "Kralın Kâbusu",
"Seri Yarışı" gibi özel adlar; bizde "Usta Ligi", "Sallanan Köprü", kendi etkinlik adlarımız); hikâye içeriği ve
sahneleri (buz dünyası, mutfak, dinozor yarışı); oyun mekaniği görselleri (ok yönlü blok, buz blok, sayı etiketli
dondurulmuş blok, kilitli sarı şerit, RM taçları / kalkanları / kitapları); arcade kabini ve piksel sanatı günlük
hediye; bilet çentiği motifi; referansın hücre başına 2 × 2 çıkıntısı (bizde tek çıkıntı + sembol, D-083);
ikon çizimleri (roket, dondurucu tabanca, ufo, kupa, şato, küre, kart destesi) — bizim ikonlarımız kendi nesnelerimizdir
(mala, kask, vinç kancası, termos, alet sandığı; ART §9).

**Doğrulama:** her yeni SVG ve pişirilmiş doku için ASSET §16.2 kabul ölçütü 5 ("ART §11.8 ihlali yok") bu listeye göre
okunur; mağaza öncesi ters görsel arama (ASSET §15).
