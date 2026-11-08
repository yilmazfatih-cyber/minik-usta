# Engel kütüphanesi

Sahip: product-lead · Sürüm: D-099 bölüm turu (2026-11-02, A2: S1 ilk bölüm 1) · Önceki: D-099 sabit saha notları (2026-11-01; GDD K-55: S1 kamyonsuz, kamyona bağlı notlar yalnız `schemaVersion` 1) · Önceki: Faz 2R (2026-10-07; R2-01 tam örtü, R2-02 değişken boyut, R2-05 çelişen sistemler; çapraz inceleme kapanışı: Y5 saha içinde kalır, W1/Y5 kartları, W6 jokerli D3a, S9 ilk bölüm 12, veri imzası tablosu) · Önceki: Faz 1 revizyonu (2026-10-04; R-08, R-10, R-21; tutarlılık denetimi tur 1, 2026-10-05) · Kaynak: `docs/BRIEF.md` §7, `docs/GDD.md`

Her engel: kimlik, bölge, kural (kodlanabilir), veri parametreleri, ilk bölüm, bilgi kartı metni (TR/EN, en çok 12 kelime).
Genel kurallar (yol, düşüş, doğrulama, hamle sonu hattı) GDD'dedir; burada yalnızca engele özel olan yazılır.
Hamle sonu adım numaraları GDD K-35'e göredir. `m` = tamamlanan hamle sayısı (bölüm başında 0).

**Metin sahipliği (R-08):** Bu belgedeki TR/EN cümleler **engel bilgi kartı** metnidir (kural özeti; oyuncu engele
dokununca ya da ilk karşılaşmada kartta görür). Anahtar `obs.{id}.desc`; `id` küçük harf, tire atılır (`obs.w1.desc`,
`obs.gh.desc`, `obs.s7r.desc`). Yazarı product-lead, ton denetimi design-lead. Bölüm içinde ekranda görünen öğretici /
Usta Dede satırları STORY §6'dadır (`tut.l{n}.{konu}`, design-lead). Kurallar: terim "blok" (parça değil); renk adı
yok (renk körlüğü); bölüme göre değişen sayılar `{n}` yer tutucusuyla (ör. kepenk periyodu, platform dönüşü).
**Duvar:** saha ile şantiye arasındaki sıfır genişlikli sınırdır (GDD §0, K-04; R-03).
**Koordinatlar (Faz 2R):** bu belgedeki sayısal koordinatlar varsayılan boyuttadır (saha 6×8, şantiye 2×8, duvar sınırı
x=5|6, Vinç Alanı y=8–9). Genel hâlleri GDD §0 ve K-49'dadır: saha x ≤ Wy−1, y ≤ Hy−1; şantiye x ≥ Wy; Vinç Alanı
y = H, H+1; `H = max(Hy, Hs + eMax)`.

## Faz 2R uyum tablosu (tam örtü K-47/K-48 ve değişken boyut K-49)

"Tam örtü" sütunu: kural bir malzeme bloğunu yaratıyor, yok ediyor ya da kalıcı kullanılamaz bırakıyor mu? "Boyut"
sütunu: kural sabit koordinata bağlı mı? Uyumsuzlar yeniden tanımlandı ya da MVP dışı bırakıldı (R2-05).

| Kimlik | Tam örtü | Değişken boyut | Durum (Faz 2R) |
|---|---|---|---|
| W1 Sabit Geçit | ✓ (blok taşır) | ✓ geçit satırı < `height` ≤ H | Değişmedi; ilk bölüm 3 → **4** |
| W2 Yüksek Duvar | ✓ | **Değişti:** imza `height = H` (eski `= 8`) | Genelleştirildi |
| W3 Dar Geçit | ✓ | ✓ | Değişmedi |
| W4 Kepenk | ✓ | ✓ | Değişmedi (Faz 3) |
| W5 Kayar Kapı | ✓ | ✓ (`range[1] + size ≤ height − 1`) | Değişmedi (Faz 3) |
| W6 Boya Kapısı | ⚠ istenmeyen boyama renk başına arzı bozar | ✓ | **Uyarlandı:** tasarımda boyama arzın parçasıdır; D2 W6'lı bölümde çalışmaz; döşenemez bir durum üreten istenmeyen boyamayı jokerli K-30 D3a yakalar → Söküm (Faz 3) |
| W7 Kilitli Geçit | ✓ | ✓ | Değişmedi (Faz 3) |
| W8 Rüzgâr Fanı | ✓ | ✓ (kayma şantiye sütunları içinde) | Değişmedi (Faz 3) |
| Y1 Ahşap Kasa | ✓ (malzeme değil, sahada kalabilir) | ✓ | Değişmedi (Faz 3) |
| Y2 Çimento Torbası | ✓ (malzeme değil) | ✓ | Değişmedi (Faz 3) |
| Y3 Zincir | ⚠ komşusu kalmayan zincirli blok hiç çözülemezdi | ✓ | **Uyarlandı:** komşusuz kalan zincir kendiliğinden kalkar (E-53) |
| Y4 Islak Beton | ✓ | ✓ | Değişmedi (Faz 3) |
| Y5 Ağır Malzeme | ✗ şantiyeye giremeyen blok tam örtüyü bozuyordu | ✓ | **Yeniden tanımlandı: Ağır Yük** — I5/Q9 malzeme değildir, renksizdir, yalnız saha içinde kayar (havaya kalkmaz), sahada kalabilir; Çekiç yok eder |
| Y6 Saha Yerçekimi | ✓ | ✓ | Değişmedi (Faz 3) |
| Y7 Altın Vida | ✓ | ✓ | Değişmedi (Faz 3) |
| Y8 Harçlı Blok | ✓ (yapışan blok malzemedir, taşınır) | ✓ | Değişmedi; Çekiç yapışmayı çözer (K-36) |
| S1 Kayan Şantiye | ✓ (taşınan malzeme serbest, K-27) | ✓ dilim Ws×Hs | Değişmedi |
| S2 Plan Boşluğu | ✗ "plan şantiyeyi tamamen kaplar" kararıyla çelişir | — | **MVP dışı** (R2-01); doğrulayıcı `.`'yı reddeder; geri getirmek proje sahibi kararı |
| S3 Cam Blok | ✓ (kırılan cam sahaya döner, yok olmaz) | ✓ | Değişmedi (Faz 3) |
| S4 Moloz | ✗ "hiçbir yerde doğru olamaz" bloğu sahada kalıcı kalıyordu | ✓ | **Yeniden tanımlandı:** moloz renkli bir malzeme bloğudur, yalnız başlangıç konumunda yanlıştır; taşınınca kullanılır |
| S5 Döner Platform | ✓ | ✓ | Değişmedi (Faz 3) |
| S6 Asansör İskele | ✓ | **Değişti:** `H = max(Hy, Hs + b)`, `Hs + b ≤ 8` | Genelleştirildi (Faz 3) |
| S7 Gizli Plan | ✓ | ✓ | Değişmedi (Faz 3) |
| S8 Balonlu Blok | ✓ | ✓ | Değişmedi; S2 olmadan şantiyedeki anlamı daralır (yalnız sütun tepesine doğru), Faz 3'te yeniden değerlendirilir |
| S9 Geniş Şantiye (yeni) | ✓ | Ws ≥ 3 | **Yeni imza**; ilk bölüm 12 (Faz 3); kapsam MVP (Faz 3), yalnız veri |
| G-H, G-L | ✓ | ✓ (yönlendirme şantiye sütunları içinde) | Değişmedi (Faz 3) |

**D-099 uyumu (sabit saha, GDD K-55; `schemaVersion` 2):** bütün bloklar ilk andan sahadadır, dilim geçişinde kamyon
teslimatı yoktur. Engel kuralları değişmez; değişen yalnız kamyona dayanan etkileşimlerdir: S1 kayması sahayı oynatmaz,
N28, N42, N43 ve N45 yalnız `schemaVersion` 1 verisi içindir, Y5 + S1'de kuyruk yoktur ve Ağır Yük bir kat için bir yana,
sonraki kat için öbür yana kayabilir (LEVELS §6.1 T9). Yerinde kalan engeller (Y1, Y2, Y5) zaten sahadadır; v2'de
kuyruğa yalnız S3 kırılması (GDD K-17 adım 3) ve S4 molozun Çekiç'le inmesi (K-36) blok ekler.

---

## Duvar (W)

### W1 — Sabit Geçit
- **Bölge:** duvar · **İlk bölüm:** 4 (Faz 2R: kazı 3. bölüme alındı)
- **Kural:** Duvarda her zaman açık boşluk. Satırları tamamen geçide sığan blok tamamen sahadaki bir konumdan sağa
  ötelenerek ray kipine girer (GDD K-12); şantiyede bırakılınca düşmez.
- **Veri:** `wall.gaps[] = { y, size, type: "static" }`; kısıt `y + size ≤ height − 1`.
- **Bilgi kartı** (`obs.w1.desc`, Faz 2R): TR "Geçit alttaki bloğa kestirme yol açar." · EN "Gaps are a shortcut for bottom blocks."
  Gerekçe (DL-2R-07): plan şantiyeyi tam kapladığı ve K-34 her yerleşimin altını dolu istediği için MVP'de "düşmez"in
  gözlenebilir bir etkisi yoktur; geçidin oyuncuya değeri gömülü alt bloğa yatay kestirmedir. "Raydan konan blok düşmez"
  kuralı (GDD K-12) aynen geçerlidir.

### W2 — Yüksek Duvar (Faz 2R)
- **Bölge:** duvar · **İlk bölüm:** 6
- **Kural:** `height = H` (tahta yüksekliği, K-49; varsayılan 8). Sınır y=0…H−1 arası kapalıdır (geçitler hariç); serbest
  kipte yalnızca Vinç Alanı (y = H, H+1) üzerinden geçilir. Sonuç: kutu yüksekliği 2'den büyük bloklar (I3_0, I4_0,
  L4_0 …) duvarı aşamaz (GDD K-05). Düşüş mesafesi uzar (cam için önemli). Saha Hy < H ise blok sahanın tepesinden en az
  H − Hy + 1 satır kaldırılır ("yukarı" hareketi belirginleşir; LEVELS Bölüm 6: Hy = 5, H = 7).
- **Veri:** `wall.height: H` (ör. Bölüm 6'da 7).
- **Bilgi kartı** (`obs.w2.desc`): TR "Duvar çok yüksek! Bloğu en tepeye kaldırıp öyle aşır." · EN "The wall is tall! Lift the block to the very top."

### W3 — Dar Geçit
- **Bölge:** duvar · **İlk bölüm:** 9
- **Kural:** `size = 1` olan her geçit. Yalnızca boyu 1 satır olan bloklar (B1, D2_90; ağırlar sınırı hiç
  geçemez) geçer. Geçit tipinden bağımsızdır: dar kepenk, dar kayar kapı vb. olabilir.
- **Veri:** `wall.gaps[].size: 1`.
- **Bilgi kartı** (`obs.w3.desc`): TR "Dar geçitten yalnızca tek sıra boyundaki bloklar geçer." · EN "Only one-row-tall blocks fit through a narrow gap."

### W4 — Kepenk
- **Bölge:** duvar · **İlk bölüm:** 13
- **Kural:** Geçit `m` için açıktır ⇔ `floor((m + phase) / period)` çift. Durum yalnızca hamle sonu adım 10'da değişir;
  sürükleme sırasında sabittir. Kapalıyken geçit satırları sınırın kapalı satırlarıdır (ray kipine girilemez). Bloklar
  sınırı keserken bırakılamadığı için "kapanırken içinde blok" oluşamaz (GDD E-06). **Sayaç:** geçidin üstünde bir sonraki
  değişime kalan hamle sayısı `k = period − ((m + phase) mod period)` (1…period) ve bir sonraki durum (açık/kapalı) gösterilir;
  `k = 1` iken sayaç vurgulanır (sunum design-lead). Aynı sayaç dili S5 (dönmeye kalan) ve Y4 (`wetMoves`) için kullanılır.
- **Veri:** `{ type: "shutter", y, size, period (1–4), phase (0 … 2·period−1) }`.
- **Örnek:** `period 2, phase 0` → m=0,1 açık; 2,3 kapalı; 4,5 açık. `phase 2` → kapalı başlar. Sayaç: m=0 → 2 (sonra
  kapalı), m=1 → 1 (sonra kapalı, vurgulu), m=2 → 2 (sonra açık).
- **Bilgi kartı** (`obs.w4.desc`): TR "Kepenk {n} hamlede bir açılıp kapanır. Sayaca bak!" · EN "The shutter opens and closes every {n} moves. Watch the counter!"

### W5 — Kayar Kapı
- **Bölge:** duvar · **İlk bölüm:** 16
- **Kural:** Geçidin alt satırı `y`, `range = [a, b]` içinde her hamle sonunda (adım 10) şu sırayla kayar: (1) `y + dir`
  aralığın dışındaysa önce yön döner (`dir = −dir`); (2) `y += dir` (1 satır; ping-pong, GDD K-24 ile aynı algoritma).
  Başlangıçta sınırdaysa ve `dir` dışarı bakıyorsa (`y = b, dir = 1` ya da `y = a, dir = −1`; geçerli veri) ilk hamlede
  önce yön döner; `y` hiçbir zaman aralığın dışına çıkmaz. Boy `size` sabittir. Kapı hiçbir bloğu itmez. Kısıt
  (doğrulayıcı, GDD K-45/3): `0 ≤ a < b` (asansör K-24 ile aynı; `a = b` iken ping-pong aralık dışına çıkardı), `a ≤ y ≤ b`,
  `b + size ≤ height − 1`; kayar kapının hareket boyunca kapsadığı bütün satırlar (`a … b + size − 1`) diğer geçitlerin
  satırlarıyla örtüşmez (yalnız başlangıç `y`'si değil). Hata kodları `slider_range`, `gap_overlap`.
  **Örnek (geçersiz):** `range [3,3], y 3, dir 1` → `a < b` değil → `slider_range` (kabul edilseydi ilk hamlede `dir = −1`,
  `y = 2`, aralık dışı). `height 8`, kayar kapı `range [1,3]`, `size 2` (satır 1–4) + sabit geçit `y 4, size 1` → satır 4 ortak →
  `gap_overlap`.
- **Veri:** `{ type: "slider", y (başlangıç), size, range: [a, b], dir (1 | −1, varsayılan 1) }`.
- **Örnek:** `range [1,3], y 1, dir 1` → hamle sonları: 2, 3, 2, 1, 2 … · `range [1,3], y 3, dir 1` → 2, 1, 2, 3, 2 …
- **Bilgi kartı** (`obs.w5.desc`): TR "Kayar kapı her hamleden sonra bir sıra kayar." · EN "The sliding gate shifts one row after every move."

### W6 — Boya Kapısı
- **Bölge:** duvar · **İlk bölüm:** 22
- **Kural:** İptal edilmeyen bir hamlede blok sürükleme sırasında bu geçidin ray kipine **girdiyse** (en az bir hücresi
  sınırı bu geçidin satırlarında geçtiyse; yarım girip geri çıkmak dahil) kapının rengine boyanır (adım 1). Birden çok boya
  kapısına girildiyse **son girilenin** rengi geçerlidir (GDD E-39). Blok şantiyeye bırakılsa da sahaya geri çekilse de boya kalıcıdır; iptalde boya olmaz. Bayraklar korunur
  (cam camdır). Sürükleme sırasında blok kapıdayken yeni rengini gösterir (önizleme). Hamle kaydında `via` alanı
  (son girilen boya kapısının geçit indeksi) tutulur (öneri P-6, S-21).
  **Faz 2R (tam örtü):** boyama renk başına arzı değiştirir; bu yüzden boya kapılı bölümde K-47 eşitliği toplam hücre
  sayısında aranır ve tasarlanan boyamalar solver çözümünün parçasıdır (renk başına eşitliği solver kanıtlar). Tasarım
  dışı bir boyama bir rengi fazla, birini eksik bırakır. W6'lı bölümde K-30 D2 çalışmaz (renk başına arz ile talep
  tasarım gereği baştan farklıdır); D3a boyanabilir blokları **joker** sayar (kutu yüksekliği bir boya kapısının `size`'ından
  büyük olmayan bloğun rengi = kendi rengi ya da bu kapıların renklerinden biri). Boyama döşenemez bir durum ürettiyse
  D3a çıkmaz der → Söküm o hamleyi geri alır (hamle iade edilmez); yeniden boyanarak düzeltilebilecek bir boyama Söküm'e
  gitmez. Gölge/önizleme boyanmış rengi gösterdiği için bilgi gizlenmez. Faz 3'te bölüm verisi yazılırken
  yeniden değerlendirilir; MVP'de kalır.
- **Veri:** `{ type: "paint", y, size, color }`.
- **Örnek:** Kırmızı boya kapısı y=2. (4,2)'deki `B1` Y geçide girip sahada (5,6)'ya bırakılır → `B1` R, 1 hamle.
- **Bilgi kartı** (`obs.w6.desc`): TR "Boya kapısına giren blok kapının rengini alır." · EN "A block that enters the paint gate takes its color."

### W7 — Kilitli Geçit
- **Bölge:** duvar · **İlk bölüm:** 26
- **Kural:** `keyId` eşleşen anahtar toplanana kadar kapalıdır; toplandığı denetimde (GDD K-42) kalıcı olarak açılır ve
  sabit geçit gibi davranır. Anahtarın konumu örtülü ama her zaman görünürdür (GDD K-42). Açık Kepenk güçlendiricisi ilk 5 hamlede geçici olarak açar.
- **Veri:** geçit `{ type: "locked", y, size, keyId }`; anahtar `obstacles[] = { type: "key", x, y, id }` (saha hücresi,
  başta örtülü).
- **Bilgi kartı** (`obs.w7.desc`): TR "Anahtarın üstündeki bloğu kaldır; kilit açılsın." · EN "Move the block covering the key to unlock the gate."

### W8 — Rüzgâr Fanı
- **Bölge:** duvar (şantiye üstüne eser) · **İlk bölüm:** 32
- **Kural:** Serbest kipte şantiyeye bırakılan, genişliği 1 olan blok (balon dahil) düşmeden/yükselmeden önce `dir`
  yönünde 1 sütun kayar; koşullar: (a) bırakma anında d ≥ 1 (blok siluete oturmuş değil; balonda
  `d = |bırakma satırı − tavan satırı|`, GDD E-35), (b) kaymış konum x=6–7
  içinde, (c) kaymış konumun hücreleri boş ve açık gökyüzü koşulunu sağlıyor. Koşul tutmazsa kayma yok. (a) maddesi öneri P-2a'dır. Genişliği 2
  olan bloklar, ray kipi, Vinç güçlendiricisi etkilenmez. Gölge kaymış inişi gösterir (GDD K-18).
- **Veri:** `wall.fan: { dir: "left" | "right" }`.
- **Örnek:** `dir right`; `B1` (6,7)'de bırakılır, top(6)=2, top(7)=3 → (7,7) boş → kayar → (7,3)'e iner.
- **Bilgi kartı** (`obs.w8.desc`): TR "Rüzgâr ince blokları bir sütun iter. Gölgeye bak!" · EN "Wind pushes thin blocks one column. Check the shadow!"

---

## Saha (Y)

### Y1 — Ahşap Kasa
- **Bölge:** saha · **İlk bölüm:** 11
- **Kural:** 1 hücre kaplar; tutulamaz, düşmez, destek olur. Can `hp` 1–3. Bir hamlede, taşınan bloğun başlangıç
  hücrelerine ya da saha yerçekimiyle düşen bir bloğun düşüş öncesi hücrelerine 4-komşu ise 1 can kaybeder (hamle başına
  en çok 1). Can 0 → kasa yok olur, `clear/crate` 1 sayılır, altındaki saklı nesne toplanır. Çekiç tek vuruşta yok eder.
  Teslimat düşüşü kasaya etki etmez.
- **Veri:** `obstacles[] = { type: "crate", x, y, hp }`.
- **Örnek:** Kasa (2,3) hp 2. (2,4)'teki blok taşınır → hp 1. Sonra (1,3)'teki blok taşınır → kasa yok olur.
- **Bilgi kartı** (`obs.y1.desc`): TR "Kasanın yanındaki bloğu oynat, kasa kırılsın." · EN "Move a block next to a crate to break it."

### Y2 — Çimento Torbası
- **Bölge:** saha · **İlk bölüm:** 18
- **Kural:** 1 hücre kaplar; tutulamaz. Saha yerçekimi ayarından bağımsız olarak her hamle sonunda (adım 6) altı boşsa
  düşer. Kasa ile aynı komşuluk kuralıyla tek seferde yırtılır ve yok olur (can 1). Düşen torba komşu etkisi üretmez.
  Hiçbir hedefe sayılmaz (tasarımda "engel" ve destek olarak kullanılır).
- **Veri:** `obstacles[] = { type: "cement_bag", x, y }`.
- **Örnek:** Torba (4,5), altı (4,4) boşalır → adım 6'da (4,4)'e, oradan ilk desteğe düşer.
- **Bilgi kartı** (`obs.y2.desc`): TR "Torbanın yanındaki bloğu oynat; torba yırtılır." · EN "Move a block beside the bag to tear it open."

### Y3 — Zincir
- **Bölge:** saha · **İlk bölüm:** 24
- **Kural:** `chained` bayraklı blok oyuncu tarafından tutulamaz, Vinçle seçilemez, ama saha yerçekimiyle düşer. Kasa ile
  aynı komşuluk kuralıyla bir kez tetiklenince zincir kalkar (`clear/chain` 1 sayılır). Çekiç zinciri kırar, bloğu değil.
  **Faz 2R (tam örtü):** hamle sonu adım 5'te zincirli bloğun 4-komşularında hiç blok, Ağır Yük, kasa ya da torba
  kalmamışsa zincir kendiliğinden kalkar ve sayılır (GDD E-53); aksi halde blok hiç çözülemez, saha boşalamazdı (K-48).
- **Veri:** `PiecePlacement.flags: ["chained"]`.
- **Örnek:** Zincirli `O4` (0,0); (2,0)'daki blok taşınır → (2,0) zincirlinin komşusu (1,0)'a bitişik → zincir kalkar.
- **Bilgi kartı** (`obs.y3.desc`): TR "Zincirli bloğun komşusunu oynat, zincir çözülsün." · EN "Move a neighbor to free the chained block."

### Y4 — Islak Beton
- **Bölge:** saha · **İlk bölüm:** 28
- **Kural:** `wet` bayraklı blokta sayaç `wetMoves` (1–5) görünür. Sayaç > 0 iken tutulamaz, Vinçle seçilemez. Her hamle
  sonunda (adım 10) 1 azalır; o hamlede kamyonla gelen ıslak blok azalmaz. 0 olunca bayrak kalkar. Saha yerçekimiyle
  düşer. (Faz 2R) Çekiç ıslak malzeme bloğunu kıramaz (tam örtü, GDD K-36); blok kuruyunca kullanılır.
- **Veri:** `flags: ["wet"], wetMoves: N`.
- **Örnek:** wetMoves 2; hamle 1 sonu 1, hamle 2 sonu 0 → 3. hamlede tutulabilir.
- **Bilgi kartı** (`obs.y4.desc`): TR "Islak beton kurusun; sayaç sıfır olunca kullanabilirsin." · EN "Wet concrete must dry; use it when the counter hits zero."

### Y5 — Ağır Yük (Faz 2R; eski adı Ağır Malzeme)
- **Bölge:** saha · **İlk bölüm:** 8
- **Kural (Faz 2R, tam örtü):** I5 ve Q9 şekilli parçalar (her yönelim) **Ağır Yük**tür: malzeme değildir, renk taşımaz
  (verideki `color` yok sayılır), arz/talep ve kazanma sayımlarına girmez (GDD K-44, K-47, K-48). Duvar sınırını hiçbir
  kipte geçemez ve **yalnız saha içinde** sürüklenir: her ara konumda bütün hücreleri x ≤ Wy−1 ve y ≤ Hy−1'dir; saha
  üstü havaya ve Vinç Alanı'na kalkmaz, diğer blokların üstünden atlamaz (GDD K-08; DL-2R-08). Sahaya bırakılması
  kaydırma hamlesidir (1 hamle). Bölüm sonunda sahada kalabilir. Çekiç tek vuruşta yok eder (GDD K-36); Vinç sahada
  taşır (döndürmez), şantiyeye koyamaz (K-37). Eski kuraldaki "genişliği ≥ 3 olan yönelimler ağırdır" maddesi kalktı:
  malzeme bloklarının genişliği ≤ Ws olmalıdır (`piece_too_wide`), daha geniş yönelim yalnız Ws ≥ 3 bölümlerde kullanılır
  (S9).
  **Sunum olayı:** `blockedCargo { pieceId }` — yük tutulurken parmak hedefi ilk kez saha dışına (x ≥ Wy ya da y ≥ Hy)
  çıktığında, tutuş başına en çok 1 kez (GDD K-44; sunum design-lead'in: sınırda "dur" çentiği, çarpma esnemesi, hafif
  haptik). Oyuncuya görünen metinde Ağır Yük'e "blok" denmez ve kalan blok sayısına girmez.
  **Tasarım rolü:** kazı bulmacasında "kapak": gerekli blokların üstünü örter; kaymak için yanında yük boyunda serbest
  sütun (Q9 için 3 hücre, sütun yönünde) ya da serbest satır (I5) gerekir, çünkü yük havadan atlayamaz (LEVELS Bölüm 8,
  10; §2.0 madde 3e).
- **Veri:** `PiecePlacement` şekli `I5_0` ya da `Q9_0` (`I5_90/270` yasak, K-44); `color` isteğe bağlı ve yok sayılır.
- **Örnek:** Bölüm 8: `Q9_0` (0,2) iki sütun sağa (2,2)'ye kaydırılır → altındaki `O4` R'nin üstü açılır (1 hamle). Çekiç'le
  kırılırsa hamle harcanmaz. Varsayılan boyutta `I5_0` (0,7)–(4,7) yukarı tutulamaz (y = 8 saha dışı); (0,7)'den (1,7)'ye
  kaydırılır ((5,7) boşsa) → 1 hamle. Bölüm 8 başında yük (0,2)'den tutulup parmak duvarın ötesine (x ≥ 6) götürülürse
  yük çapa (1,2)'de durur (sağ kenarı x = 3; sağında `d` ve `e` var), `blockedCargo` bir kez yayınlanır.
- **Bilgi kartı** (`obs.y5.desc`, Faz 2R): TR "Ağır yük plana girmez. Kenara kaydır ya da kır." · EN "Cargo isn't part of the plan. Slide it aside or smash it."

### Y6 — Saha Yerçekimi
- **Bölge:** saha · **İlk bölüm:** 14
- **Kural:** `gravity.yard = true` (GDD K-20). Bütün saha blokları (zincirli, ıslak, ağır dahil) adım 6'da düşer, balonlar
  yükselir; kasalar sabittir.
- **Veri:** `gravity.yard: true`.
- **Bilgi kartı** (`obs.y6.desc`): TR "Bu sahada bloklar düşer. Alttakini alınca üsttekiler iner." · EN "Here blocks fall. Take one and the ones above drop."

### Y7 — Altın Vida
- **Bölge:** saha · **İlk bölüm:** 19
- **Kural:** Bir saha hücresinin zemininde saklıdır; bölüm başında örtülüdür, konumu her zaman görünür (GDD K-42). Hücre
  boş kaldığı ilk denetimde toplanır
  (GDD K-42), `collect/screw` 1 sayılır. Bir hücrede en çok 1 saklı nesne olur.
- **Veri:** `obstacles[] = { type: "screw", x, y }`.
- **Bilgi kartı** (`obs.y7.desc`): TR "Altın vidalar blokların altında. Üstünü aç, topla!" · EN "Golden screws hide under blocks. Uncover them to collect!"

### Y8 — Harçlı Blok
- **Bölge:** saha (etkisi şantiyede) · **İlk bölüm:** 35
- **Kural:** `mortar` bayraklı blok şantiyede hatalı yerleşirse ve bütün hücreleri plan alanında (renkli, `?` ya da `.`
  hücre) ise geri sekmez, **yapışır** (kilitli değildir). Bir hücresi plan dışındaysa normal geri seker (öneri P-2b); yapışmış blok böyle bırakılırsa başlangıç konumuna döner
  ve yapışık kalır (GDD K-17). Yapışmış blok
  sürüklenebilir; iptal olmayan her hamlesi 2 hamle yer (cam da kırılırsa 3; maliyetler toplanır, GDD K-07; kırılan
  yapışmış cam blok sahaya döner ve yapışma kalkar, GDD K-17). (Faz 2R) Çekiç yapışmayı çözer ve bloğu sahaya indirir (blok yok
  olmaz, GDD K-36); Boya Fırçası artık yalnız sahadaki blokların rengini takas eder ve yapışmış bloğu hedefleyemez (K-38); Vinçle taşınır. Yapışmış blok dilimin tamamlanmasını engeller (GDD K-15) ve üstüne doğru
  yerleşim yapılamaz (K-34); bir `.` hücresine yapışmışsa o `.` hücresi K-34'te "dolu" sayılmaz, o sütunda üstündeki her
  yerleşim `support` nedeniyle hatalıdır (GDD E-43). Doğru yerleşirse normal kilitlenir.
- **Veri:** `flags: ["mortar"]`.
- **Örnek:** `B1` R harçlı (6,2) W hücresine düşer → yapışır. Oyuncu sahaya geri sürükler → kalan 10 → 8.
- **Bilgi kartı** (`obs.y8.desc`): TR "Harçlı blok yanlış yere düşerse yapışır. Dikkatli bırak!" · EN "A mortar block sticks if it lands wrong. Drop with care!"

---

## Şantiye ve yerçekimi (S, G)

### S1 — Kayan Şantiye
- **Bölge:** şantiye · **İlk bölüm:** 1 (D-099; Faz 2R'de 5)
- **Kural:** `build.mode = "segments"`, 2–5 dilim (GDD K-22, K-25). Dilim bitince kayma ve kamyon teslimatı.
- **Veri:** `build.segments[]`, `yard.batches[]` (`forSegment` = dilim indeksi).
- **D-099 (GDD K-55, `schemaVersion` 2):** dilim bitince yalnız kayma; tamamlanan dilim panoramaya (kasabaya) gider,
  sıradaki dilim boş gelir, saha aynen kalır; kamyon teslimatı yoktur (yukarıdaki iki satır `schemaVersion` 1 içindir).
  Veri: tek parti `yard.batches[0]` (`forSegment: 0`). İlk bölüm D-099 eğrisinde 1'dir (LEVELS §6.6); yeni Bölüm 1
  verisiyle (A2, 2026-11-02) "Veri imzası" tablosu 1 oldu; koddaki `mechanics.ts` `firstLevel` değeri code-lead
  paketinde 1 olur (iki tablo testle eşit tutulur).
  Bilgi kartı için D-099 metni (i18n dosyalarıyla aynı commit'te geçerli olur; anahtar `obs.s1.desc` aynı): TR «Bu kat
  bitince şantiye kayar; kalan bloklar sahada bekler.» · EN «Finish this floor; the site slides, your blocks wait.»
- **Bilgi kartı** (`obs.s1.desc`, D-099; code-lead P4B-07 ile i18n'e işledi): TR "Bu kat bitince şantiye kayar; kalan bloklar sahada bekler." · EN "Finish this floor; the site slides, your blocks wait."

### S2 — Plan Boşluğu — **MVP DIŞI (Faz 2R, R2-01)**
- **Durum:** Proje sahibinin "şantiye alanı sürekli doldurulmalı" kararıyla plan şantiyeyi tamamen kaplar (GDD K-15);
  doğrulayıcı `.`'yı reddeder (`plan_has_window`). Aşağıdaki kural yalnız proje sahibi S2'yi geri getirirse geçerlidir
  (ÖNERİ: Faz 3'te hikaye bölümü 3+ için "pencere" olarak; tam örtü `.` hücrelerini talepten çıkarır, R2-01 ile çelişmez
  ama "alan tam dolu" görüntüsünü bozar — proje sahibi kararı). Eski ilk bölüm 4'tü; Bölüm 4 artık W1'i öğretir.
- **Bölge:** şantiye · **İlk bölüm:** — (MVP'de yok)
- **Kural:** `.` hücresi boş kalmalıdır; bloğun herhangi bir hücresi `.` üstüne gelirse hatalı yerleşim. K-34'te `.`
  yalnızca boşken dolu sayılır (içinde moloz S4 ya da yapışmış harçlı blok Y8 varsa sayılmaz; GDD K-34, E-43). `.`
  üstündeki hücre şu yollarla dolar: ray (W1), iki sütuna köprü kuran 2 geniş blok (duvar üstü), balon (S8), Vinç.
- **Veri:** `rows` içinde `.`.
- **Örnek:** Plan sütun 7: y0 W, y1 `.`, y2 W. `B1` W sütun 7'ye bırakılır → (7,1)'e düşer → hatalı.
- **Bilgi kartı** (`obs.s2.desc`): TR "Taralı hücre boş kalmalı. Üstünü geçitten ya da köprüyle doldur." · EN "Keep hatched cells empty. Fill above them via a gap or bridge."

### S3 — Cam Blok
- **Bölge:** şantiye (bayrak sahadaki blokta) · **İlk bölüm:** 21
- **Kural:** `glass` bayraklı blok serbest kipte şantiyeye düşerken d > eşik (low 4, normal 3, high 2) ise kırılır:
  doğrulama yapılmaz, blok GDD K-17 hedef sırasıyla sahaya döner, hamle maliyeti taban + 1 (sıradan blokta 2; yapışmış
  harçlı cam blokta 2 + 1 = 3, GDD K-07), Usta Serisi 0. Yapışmış harçlı cam blok kırılırsa (başlangıcı şantiyede)
  K-17'nin 1. adımı atlanır: blok başlangıç konumuna değil, 2. adımla sahaya döner ve yapışma kalkar (GDD K-17 istisnası
  ve örneği). Ray, Vinç, balon
  yükselişi, geri sekme, teslimat ve saha yerçekimi düşüşlerinde kırılmaz.
- **Veri:** `flags: ["glass"]`.
- **Örnek:** normal; cam `D2_90` (6,8)'de bırakılır, iniş (6,3) → d=5 > 3 → kırılır. (6,6)'ya indirilip bırakılırsa d=3 → sağlam.
- **Bilgi kartı** (`obs.s3.desc`): TR "Cam kırılır! Bloğu aşağı indir, sonra bırak." · EN "Glass breaks! Lower the block before you let go."

### S4 — Moloz (Faz 2R: yeniden tanımlandı)
- **Bölge:** şantiye · **İlk bölüm:** 17
- **Kural (Faz 2R, tam örtü):** Moloz, bölüm başında dilimin şantiye alanında **yanlış yerde** duran, renkli bir
  **malzeme bloğudur** (Bay Gribeton'un ekibinin bıraktığı). Arz sayılır (K-47); bölüm sonunda kullanılmış olmalıdır.
  Başlangıç konumunda K-16'ya göre doğru olamaz (renk ya da K-34 desteği tutmaz; doğrulayıcı `debris_correct_at_start`).
  Tutulabilir (serbest kipte; bütün satırları bir geçitteyse ve geçit o an açıksa ray kipinde de — GDD K-12'nin tek
  istisnası). İlk kez başlangıç konumundan ayrıldığında (sahaya yerleşim, şantiyede başka bir yere **doğru** yerleşim,
  Vinç ya da Çekiç) `clear/debris` 1 sayılır ve `debris` bayrağı kalkar; artık sıradan malzeme bloğudur. Şantiyede başka
  bir yere hatalı bırakılırsa başlangıcına döner (K-17). Altı boşalsa da düşmez. Dilim, alanında moloz varken tamamlanmaz
  (alan tam örtülemez). Moloz o dilimde ya da sonraki bir dilimde doğru yerleşebilir (taşınan malzeme). Moloz şantiyeden
  alınırken başlangıç hücreleri sahadaki (x = Wy−1) engellere komşu sayılmaz (duvar sınırı; GDD §0, E-46). Çekiç molozu
  yok etmez, sahaya indirir (K-36).
- **Veri:** `build.debris[] = { shape, color, x, y, segment? }` (`segment` isteğe bağlı, verilmezse 0; P-5, GDD §14, K-45/7).
  Renk zorunludur ve K-31 renk kümesine girer.
- **Örnek:** Dilim 0 planı alttan `RR`, `WW`; molozu `D2_90` W (6,0)'da (alt satır R → yanlış). Oyuncu onu sahaya taşır
  ("1/1"), sonra `D2_90` R'yi (6,0)'a, ardından aynı W bloğunu (6,1)'e koyar.
- **Bilgi kartı** (`obs.s4.desc`): TR "Bu blok yanlış yerde. Kaldır, doğru yerine sonra koy." · EN "This block is in the wrong spot. Lift it and place it later."

### S5 — Döner Platform
- **Bölge:** şantiye · **İlk bölüm:** 31
- **Kural:** `build.mode = "carousel"` (GDD K-23). Sayaç: dönmeye kalan hamle `carouselEvery − t` (W4 sayaç dili). `t`
  her hamlenin adım 10'unda 1 artar; **ön dilimin tamamlandığı hamlede artmaz** (dönüş adım 8'de olmuş, `t = 0` kalır) ve
  güçlendirici / Altın Mala ile tamamlanmada da artmaz (mini hatta adım 10 yok).
- **Veri:** `build.carouselEvery` (2–6).
- **Bilgi kartı** (`obs.s5.desc`): TR "Platform {n} hamlede bir döner. Öndeki yüze inşa et." · EN "The platform turns every {n} moves. Build on the front face."

### S6 — Asansör İskele
- **Bölge:** şantiye · **İlk bölüm:** 37
- **Kural:** `build.elevator` (GDD K-24); her iki modla birleşebilir. Adım 10'da önce `e + dir` aralık dışındaysa yön
  döner, sonra `e += dir` (W5 ile aynı ping-pong); başlangıçta sınırda ve dışarı bakan `dir` geçerli veridir.
  **Faz 2R (boyut):** plan şantiyeyi tamamen kapladığı için (Hs satır) çerçevenin yükselebileceği boşluk tahta
  yüksekliğinden gelir: `H = max(Hy, Hs + b)` ve `Hs + b ≤ 8` (`elevator_overflow`, GDD K-24, K-49).
- **Veri:** `build.elevator: { range: [a, b], start, dir }`.
- **Bilgi kartı** (`obs.s6.desc`): TR "İskele her hamlede bir sıra iner çıkar. Geçide dikkat!" · EN "The scaffold moves one row each move. Mind the gap!"

### S7 — Gizli Plan
- **Bölge:** şantiye · **İlk bölüm:** 27 (`repeat`), 29 (`mirrorOf`)
- **Kural:** GDD K-32.
- **Veri:** `rows` içinde `?`, `segments[].hidden: { kind: "repeat", period } | { kind: "mirrorOf", segment }`.
- **Bilgi kartı** (`obs.s7r.desc`, 27): TR "Soru işaretleri deseni tekrarlar. Aşağıdaki sıralara bak!" · EN "Question marks repeat the pattern. Look at the rows below!"
  · (`obs.s7m.desc`, 29): TR "Bu kat, öbür katın aynası. Renkler yer değiştirir!" · EN "This floor mirrors the other. Colors swap sides!"

### S8 — Balonlu Blok
- **Bölge:** şantiye ve saha · **İlk bölüm:** 38
- **Faz 2R notu:** S2 (`.`) MVP dışı olduğundan şantiyede doğru balon yerleşimi yalnız bir sütunun tepe hücresidir (normal
  düşüşle de aynı yere inilir); balonun ayırt edici rolü sahada (saha yerçekimiyle yükselme) kalır. Faz 3'te S2 kararına
  göre yeniden değerlendirilir. Sahada tavan y = Hy−1'dir.
- **Kural:** `balloon` bayraklı blok bırakılınca yükselir. Sahada: üstündeki ilk dolu hücreye ya da y=Hy−1'e (varsayılan 7) kadar.
  Şantiyede serbest kipte: bırakma yüksekliğinden bağımsız olarak sütunlarının **tavanına** asılır; tavan = aktif dilimin
  plan tepesi (bloğun en üst hücresi satır `h + e − 1`; öneri P-3); bloğun sütunlarında siluet tavana ulaşmışsa blok siluetin üstünde
  kalır (plan dışı → hatalı). Rayda bırakılan balon hareket etmez. Saha yerçekimi açıkken adım 6'da yükselir. Rüzgâr
  (genişlik 1) önce kaydırır; G-L yönlendirmesi yükselişte de kullanılabilir. Doğrulama K-16 ve K-34 iledir.
  Tavanın üstünden (Vinç Alanı) bırakılan balon tavana **iner** (GDD E-35). Kamyonla gelen balon düşüp oturur, yükselmez;
  Y6 açıksa sonraki hamlenin 6. adımında yükselir (E-36). Saha yerçekiminde düşen bloklarla karşılaşma "yarım adım"
  kuralıyla çözülür (GDD K-35 adım 6, E-33).
- **Veri:** `flags: ["balloon"]`.
- **Örnek:** Plan h=6, sütun 7: y0–y3 dolu, y4 `.`, y5 W boş. `B1` W balon sütun 7'ye bırakılır → (7,5)'e asılır → doğru.
  Normal `B1` W aynı yerde (7,4) `.` hücresine düşerdi → hatalı.
- **Bilgi kartı** (`obs.s8.desc`): TR "Balonlu blok yukarı süzülür ve tavana asılır." · EN "Balloon blocks float up and hang from the ceiling."

### S9 — Geniş Şantiye (YENİ, Faz 2R, R2-02)
- **Bölge:** şantiye · **İlk bölüm:** 12 (Faz 3; hikaye bölümü 2'nin imzasız tek bölümü, LEVELS §3 madde 7) ·
  **Kapsam:** MVP (Faz 3) — yalnız veridir (`site.cols ≥ 3`, K-49; yerleşim ve prosedürel blok çizimi zaten genel).
  Ek kod ya da sanat gerektirirse etiket "Sonra (Hikaye 6+)" olur ve 12 imzasız kalır (EN-2R-08). Engel sayısı 26
  kalır (S2 MVP dışı).
- **Kural:** `site.cols = Ws ≥ 3`. Plan Ws sütundur; genişliği ≤ Ws olan yönelimler (ör. `L4_90`, `T4_90`, hikaye bölümü
  2+) şantiyeye girebilir. Duvar sınırı x = Wy−1 | Wy kalır; Wy + Ws ≤ 8 (`board_too_wide`). Rüzgâr (W8) ve G-L
  yönlendirmesi şantiye sütunları içinde 1 sütun kaydırır; 2 genişlikli blok da yönlendirilebilir (genişliği Ws olan
  yönlendirilemez).
- **Neden 1–10'da yok:** hikaye bölümü 1'de en çok 3 renk vardır; 3 sütunlu bir planda dikey `D2` ve `C3` bloklarının
  rengi, aynı renkte başka bir dikey hücre çiftiyle her zaman çakıştı ve Normal bölümde yasak olan ✓-tuzakları (K-51)
  doğdu (LEVELS §2.0 tuzak kaynağı; karalama çözücüsüyle 2 tasarımda doğrulandı). Hikaye bölümü 2'deki 4 renkle kurulur.
- **Veri:** `site: { cols: 3 | 4, rows }`.
- **Bilgi kartı** (`obs.s9.desc`): TR "Şantiye genişledi! Geniş bloklar artık sığar." · EN "The site is wider! Wide blocks fit now."

### G-H — Ağır yerçekimi
- **Bölge:** şantiye · **İlk bölüm:** 15
- **Kural:** `gravity.build = "high"`: `holdMs` tutma (sonra zorla bırakma), cam eşiği 2 (GDD K-19). `holdMs` = 700;
  Ayarlar > Erişilebilirlik "Zaman baskısını azalt" açıksa 1400 (R-11). Bot ölçümü 700 ile yapılır.
- **Veri:** `gravity.build: "high"`.
- **Bilgi kartı** (`obs.gh.desc`): TR "Ağır yerçekimi! Şantiye üstünde blok çabucak kayıp düşer." · EN "Heavy gravity! Over the site, blocks slip and drop fast."

### G-L — Hafif yerçekimi
- **Bölge:** şantiye · **İlk bölüm:** 23
- **Kural:** `gravity.build = "low"`: yavaş düşüş; düşüş/yükseliş sürerken tahtanın herhangi bir yerine dokunmak bloğu
  dokunulan tarafa (bloğun orta çizgisine göre) 1 sütun kaydırır; koşul: kaymış hücreler x=6–7 içinde ve boş; düşüş
  başına en çok 1; aynı hamle; koşul tutmazsa hak harcanmaz; kayıt `steer { dir, atRow }` (GDD K-19, R-10). Cam eşiği 4.
  Yönlendirilen yerleşim YAO'da "duvar üstü" sayılır. Gölge yönlendirmeden sonra yeni inişi gösterir (K-18).
- **Veri:** `gravity.build: "low"`.
- **Bilgi kartı** (`obs.gl.desc`): TR "Hafif yerçekimi: düşerken tahtaya dokun, blok o yana kayar." · EN "Low gravity: tap the board while it falls to nudge it."

---

## Veri imzası (mekanik türetme; GDD K-45/9, R-21)

`levels:validate` her bölümün mekanik kümesini aşağıdaki imzalardan türetir; "yeni mekanik" = önceki bölümlerin
kümelerinde olmayan imza. İmzası olmayan öğretimler (kaldır–taşı–indir, gölge, kazı K-10, taşınan malzeme K-27,
`clear`/`collect` hedef türleri, güçlendirici açılışları) yalnızca `tutorial` adımlarıyla ifade edilir. Faz 2R
değişiklikleri: W1 ilk bölüm 4; W2 imzası `height = H`; Y5 imzası I5/Q9; S2 MVP dışı (tablo altı notu); S9 yeni (12).
"İlk bölüm" sütunu her satırda bir tamsayıdır (`mechanics.test`, `rule-coverage` sayı olarak okur).

| Mekanik | Veri imzası | İlk bölüm |
|---|---|---|
| W1 | bir geçitte `type = "static"` | 4 |
| W2 | `wall.height = H` (H = max(Hy, Hs + eMax), K-49; varsayılan 8) | 6 |
| W3 | herhangi bir geçitte `size = 1` (tipten bağımsız, N2) | 9 |
| W4 | `type = "shutter"` | 13 |
| W5 | `type = "slider"` | 16 |
| W6 | `type = "paint"` | 22 |
| W7 | `type = "locked"` (+ `key` nesnesi) | 26 |
| W8 | `wall.fan` var | 32 |
| Y1 | `obstacles[]` içinde `crate` | 11 |
| Y2 | `cement_bag` | 18 |
| Y3 | herhangi bir blokta (parti 0 ya da k) `chained` | 24 |
| Y4 | `wet` | 28 |
| Y5 | herhangi bir partide `I5_*` ya da `Q9_*` (Ağır Yük, GDD K-44) | 8 |
| Y6 | `gravity.yard = true` | 14 |
| Y7 | `screw` | 19 |
| Y8 | `mortar` | 35 |
| S1 | `build.mode = "segments"` ve dilim sayısı ≥ 2 | 1 |
| S3 | `glass` | 21 |
| S4 | `build.debris[]` dolu | 17 |
| S5 | `build.mode = "carousel"` | 31 |
| S6 | `build.elevator` var | 37 |
| S7-R | `hidden.kind = "repeat"` | 27 |
| S7-M | `hidden.kind = "mirrorOf"` | 29 |
| S8 | `balloon` | 38 |
| G-H | `gravity.build = "high"` | 15 |
| G-L | `gravity.build = "low"` | 23 |
| S9 | `site.cols ≥ 3` | 12 |

**MVP dışı imzalar** (tabloya girmez; araçlar bu satırı okumaz — CL-2R-12): S2 Plan Boşluğu, imza "herhangi bir planda
`.`"; doğrulayıcı `plan_has_window` ile reddeder. Proje sahibi S2'yi geri getirirse ilk bölüm numarasıyla tabloya
döner.

Denetim (product-lead, LEVELS §2–§3 üzerinden elle): 50 bölümün her birinde türetilen yeni mekanik ≤ 1 ve `teaches`
alanlarıyla birebir. Faz 2R Bölüm 1–10 türetilen yeni mekanikler: 4 → W1, 5 → S1, 6 → W2, 8 → Y5, 9 → W3; 1, 2, 3, 7, 10
yeni imza içermez (öğretimleri `tutorial` ile: kaldır–taşı–indir, şekil/gölge, kazı, taşınan malzeme, final). Bölüm
4'ün geçidi boy 2'dir, bu yüzden W3 ilk kez 9'da görünür (R-21). Bölüm 10'da W1/W3 yoktur (LEVELS §4).

**D-099 eğrisi (LEVELS §6.6):** bütün bölümler iki dilimli olduğundan S1 imzası Bölüm 1'de doğar; türetilen yeni
mekanikler 1 → S1, 4 → W1, 6 → W2, 8 → Y5, 9 → W3'tür (A2 denetimi: `levels:validate` 10/10, `teaches` alanlarıyla
birebir; 2, 3, 5, 7, 10 yeni imza içermez). Tablodaki S1 "İlk bölüm" değeri yeni Bölüm 1 verisiyle 5 → 1 oldu; koddaki
`firstLevel` code-lead paketinde aynı değere çekilir (iki tablo testle eşit tutulur; LEVELS §7 U-2).

## Aynı bloktaki bayrak birleşimleri

| | glass | balloon | mortar | chained | wet | debris | ağır şekil |
|---|---|---|---|---|---|---|---|
| **glass** | — | ✗ balon düşmez, cam anlamsız | ✓ önce kırılma denetimi; kırılırsa yapışmaz | ✓ | ✓ | ✗ | ✗ şantiyeye giremez |
| **balloon** | | — | ✓ hatalı balon tavanda yapışır | ✓ | ✓ | ✗ | ✗ |
| **mortar** | | | — | ✓ | ✓ | ✗ | ✗ |
| **chained** | | | | — | ✓ ikisi de kalkmalı | ✗ | ✓ |
| **wet** | | | | | — | ✗ | ✓ |
| **debris** | | | | | | — | ✗ moloz ≤ 2 geniş |

✓ izinli · ✗ doğrulayıcı reddeder (`flag_combo_forbidden`).

## Etkileşim matrisi (aynı bölümde birlikte bulunma)

Okuma: satır × sütun (üst üçgen). `·` = birlikte bulunabilir, kuralları birbirine dokunmaz (her biri kendi kuralıyla, K-35 sırasıyla çalışır). `Nxx` = önemsiz olmayan etkileşim, notu aşağıda. `—n` = aynı bölümde imkânsız, gerekçesi aşağıda. Aynı bloktaki bayrak birleşimleri yukarıdaki tablodadır. `■` = kendisi.

| | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | Y1 | Y2 | Y3 | Y4 | Y5 | Y6 | Y7 | Y8 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | G-H | G-L |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **W1** | ■ | N3 | N2 | N1 | N1 | N1 | N1 | · | · | · | · | · | N6 | N9 | · | · | · | N10 | N11 | N14 | · | N16 | · | N19 | N21 | · |
| **W2** |   | ■ | N3 | N3 | N3 | N3 | N3 | · | · | · | · | · | · | · | · | · | · | · | N12 | · | · | · | · | · | N37 | · |
| **W3** |   |   | ■ | N2 | N2 | N2 | N2 | · | · | · | · | · | N6 | N9 | · | · | · | N10 | N11 | N14 | · | N16 | · | N19 | N21 | · |
| **W4** |   |   |   | ■ | N1,N8 | N1 | N1 | · | · | · | · | N8 | N6 | N9 | · | · | · | N10 | N11 | N14 | N8,N15 | N8,N16 | · | N19 | N21 | · |
| **W5** |   |   |   |   | ■ | N1 | N1 | · | · | · | · | N8 | N6 | N9 | · | · | · | N10 | N11 | N14 | N8 | N8,N17 | · | N19 | N21 | · |
| **W6** |   |   |   |   |   | ■ | N1 | · | · | · | N7 | N7 | N6 | N9 | · | N7 | · | N10 | N7,N11 | N14 | · | N16 | N41 | N7,N19 | N21 | · |
| **W7** |   |   |   |   |   |   | ■ | · | N4 | · | · | · | N6 | N40,N9 | N5 | · | · | N10 | N11 | N14 | · | N16 | · | N19 | N21 | · |
| **W8** |   |   |   |   |   |   |   | ■ | · | · | · | · | · | · | · | · | · | N18 | N13 | · | · | · | · | N20 | · | N22 |
| **Y1** |   |   |   |   |   |   |   |   | ■ | N23 | N24 | · | · | N25 | N4 | · | · | · | · | · | · | · | · | · | · | · |
| **Y2** |   |   |   |   |   |   |   |   |   | ■ | N24 | · | · | N26 | · | · | · | · | · | · | · | · | · | N34 | · | · |
| **Y3** |   |   |   |   |   |   |   |   |   |   | ■ | · | · | N27 | · | · | · | · | · | · | · | · | · | · | · | · |
| **Y4** |   |   |   |   |   |   |   |   |   |   |   | ■ | · | N27 | · | · | N28 | · | · | · | N28 | · | · | · | · | · |
| **Y5** |   |   |   |   |   |   |   |   |   |   |   |   | ■ | · | · | · | · | · | · | · | · | · | · | · | · | · |
| **Y6** |   |   |   |   |   |   |   |   |   |   |   |   |   | ■ | N4 | · | N43 | · | · | · | N42 | · | · | N33 | · | · |
| **Y7** |   |   |   |   |   |   |   |   |   |   |   |   |   |   | ■ | · | · | · | · | · | · | · | · | · | · | · |
| **Y8** |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | ■ | N31 | N29 | N30 | · | N31 | N31 | N32 | · | · | · |
| **S1** |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | ■ | · | · | N38 | —1 | N35 | · | · | · | · |
| **S2** |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | ■ | · | · | · | · | · | N36 | · | · |
| **S3** |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | ■ | · | · | · | · | · | N37 | N37 |
| **S4** |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | ■ | N38 | · | · | · | · | · |
| **S5** |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | ■ | N35 | · | · | · | · |
| **S6** |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | ■ | · | · | · | · |
| **S7** |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | ■ | · | · | · |
| **S8** |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | ■ | · | N39 |
| **G-H** |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | ■ | —2 |
| **G-L** |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | ■ |

### Notlar

`[kural]` = test edilebilir kural; test adı "N33 …" biçimindedir ve kapsam aracı bunları zorlar (code-lead). `[not]` =
tasarım notu, test gerektirmez.

- **N1** [kural] — Geçit tipleri aynı geçitte birleşmez (bir geçidin tek `type`'ı vardır); farklı geçitlerde aynı bölümde bulunabilir.
- **N2** [kural] — W3 bir boyuttur (`size=1`), tip değildir: dar kepenk, dar kayar kapı, dar boya kapısı, dar kilitli geçit geçerlidir.
- **N3** [kural] — Yüksek duvarda geçit tek kestirmedir: boyu > 2 dikey bloklar (I3_0, L4_0 …) şantiyeye yalnızca geçitten girer (K-05).
- **N4** [kural] — Saklı nesne (anahtar/vida) bir bloğun ya da kasanın altında olabilir (GDD K-42; Çimento Torbası Y2 örtü değildir, torba altındaki nesne doğrulayıcıda `hidden_item_exposed`, TECH L-14): kasa yok olunca hücre boşalır, o denetimde toplanır. Saha yerçekimi zincirlemesiyle açılan hücre adım 6 denetiminde toplanır (K-42).
- **N5** [kural] — Bir hücrede en çok 1 saklı nesne (anahtar ya da vida).
- **N6** [kural] — Ağır blok duvar sınırını geçemez: hiçbir geçitten geçemez, boyanamaz, kepenk/kilit onu etkilemez.
- **N7** [kural] — Boya kapısı yalnızca rengi değiştirir; bayraklar (cam, harç, balon) korunur. Zincirli/ıslak blok tutulamadığı için serbest kalana kadar boyanamaz.
- **N8** [kural] — İki zamanlayıcı aynı hamle sonunda ilerler; sıra adım 10'daki gibidir (kepenk → kayar kapı → döner platform → asansör → ıslak beton). Birbirlerinin girdisini kullanmazlar; sıra yalnızca **olay (event) sırasıdır**. Animasyonlar bu sıraya bağlı değildir: JUICE §0 kural 10'a göre eşzamanlı oynar (sunum design-lead'in). Test yalnızca olay sırasını denetler.
- **N9** [not] — Saha yerçekimi geçide giden saha tünelini kapatabilir ya da açabilir; gölge yoktur ama yerçekimi deterministiktir, hamle sonu animasyonu gösterir.
- **N10** [not] — `.` üstündeki hücreyi doldurmanın ana yolu raydır; geçit satırı `.`'nin hemen üstüne denk getirilir (Bölüm 4, 9).
- **N11** [kural] — Raydan giren cam blok düşmediği için asla kırılmaz; cam bölümlerinde geçit güvenli ama pahalı yoldur (kazı gerekir).
- **N12** [not] — Yüksek duvarda blok Vinç Alanı'ndan bırakılırsa d büyür (8–9 satır); cam için mutlaka siluete yakın indirilmelidir.
- **N13** [kural] — Rüzgâr kayması düşüş mesafesini değiştirmez (aynı satırdan düşer); kaymış sütunun silueti d'yi belirler.
- **N14** [kural] — Geçit satırlarındaki moloz rayı tıkar; geçit açıkken aynı moloz ray kipinde geçitten sahaya çekilebilir (1 hamle; GDD K-12 istisnası).
- **N15** [not] — Döner platform ile kepenk aynı periyotta tasarlanırsa senkron bulmaca olur (Bölüm 34): kepenk açıkken hangi yüzün önde olduğu `m`'den hesaplanabilir.
- **N16** [kural] — Asansörde geçidin açıldığı plan satırı `g.y − e`'dir; ray yerleşimi hangi plan satırına gideceğini ofsete göre değiştirir.
- **N17** [kural] — Kayar kapı ve asansör aynı hamlede oynar: geçidin plan satırı her hamle −2, 0 ya da +2 değişebilir.
- **N18** [kural] — Rüzgâr 1 genişlikteki bloğu `.` sütununa itebilir; gölge bunu gösterir (E-16).
- **N19** [kural] — Raydan giren balon yükselmez (iskele tutar); balonun anlamı serbest kipte tavana asılmaktır.
- **N20** [kural] — Balon rüzgârla önce kayar, sonra tavana yükselir.
- **N21** [kural] — G-H 700 ms sayacı yalnızca serbest kipte şantiye sütunlarına değince işler; raydaki blok için zaman baskısı yoktur.
- **N22** [kural] — G-L yönlendirmesi rüzgâr kaymasını geri alabilir (düşüş başına 1 yönlendirme).
- **N23** [kural] — Torba kasanın üstünde durur; kasa yok olunca torba adım 6'da düşer.
- **N24** [kural] — Aynı komşu hareketi birden fazla engeli tetikler (kasa katı, torba, zincir); her biri hamle başına en çok 1 kez.
- **N25** [kural] — Kasa düşmez ve destektir; saha yerçekiminde kasa üstündeki bloklar yerinde kalır.
- **N26** [kural] — Düşen torba komşu etkisi üretmez (yalnızca düşen bloklar üretir).
- **N27** [kural] — Zincirli ve ıslak bloklar saha yerçekimiyle düşer; düşmeleri zinciri çözmez, sayacı değiştirmez.
- **N28** [kural] — (D-099: yalnız `schemaVersion` 1) Kamyonla gelen ıslak blok geldiği hamlede sayaç kaybetmez (E-31).
- **N29** [kural] — Harçlı blok `.` (pencere) hücresine yapışabilir; dilim tamamlanamaz, 2 hamlelik çekme ya da Çekiç gerekir (E-24).
- **N30** [kural] — Harçlı cam: önce kırılma denetlenir; kırılırsa sahaya döner, yapışmaz.
- **N31** [kural] — Yapışmış harç kendi dilimiyle birlikte döner/kayar; asansörde çerçeveyle oynar. Yalnızca plan alanında yapıştığı için tahtadan taşmaz (E-08, E-32).
- **N32** [kural] — Yanlış renkle `?` hücresine yapışan harç hücreyi açmaz; Boya Fırçası doğru renge boyarsa kilitlenir ve hücre açılır.
- **N33** [kural] — Saha yerçekimi açıkken balonlar adım 6'da yükselir; düşen bloklarla aynı sütunda karşılaşırlarsa "yarım adım" kuralı geçerlidir (GDD K-35 adım 6): önce düşme yarısı (balon katı), sonra yükselme yarısı; blok balona oturur, balon bloğa dayanır, arada boşluk kalmaz (E-33).
- **N34** [kural] — Torba balonun üstüne düşerse ikisi de durur (torba balona, balon torbaya dayanır).
- **N35** [kural] — Asansör ofseti dilim geçişinde ve döner platform dönüşünde korunur; yeni gelen/öne geçen dilim mevcut `e` ile görünür.
- **N36** [not] — Balon `.` hücrelerinin üstündeki tavan hücrelerini doldurmanın duvar üstü yoludur (asma köprü, bayrak).
- **N37** [kural] — Cam eşiği: G-H 2, normal 3, G-L 4. G-H'de 700 ms içinde indirmek gerekir.
- **N38** [kural] — Moloz dilime aittir (`segment`); kayan şantiyede o dilim gelince, döner platformda kendi yüzündedir.
- **N39** [kural] — G-L yönlendirmesi balonun yükselişinde de kullanılabilir.
- **N40** [kural] — Kilitli geçidin anahtarı saha yerçekimiyle açığa çıkabilir (N4).
- **N41** [kural] — Gizli `?` hücresine düşecek gölge her zorlukta nötrdür; Boya Kapısı rengi ipucu olarak tasarlanabilir.
- **N42** [kural] — (D-099: yalnız `schemaVersion` 1) Döner platform ve kayan şantiyede teslim partisi dilim tamamlanma sayısına bağlıdır (K-23, K-25).
- **N43** [kural] — (D-099: yalnız `schemaVersion` 1) Saha yerçekimi açıkken kamyon blokları da oturmuş sahaya düşer; teslimat sahayı yeniden oynatmaz.
- **N44** [kural] (Faz 2R) — S9 Geniş Şantiye matriste ayrı satır/sütun almaz: bütün engellerle `·`'dır (kuralları
  sütun sayısından bağımsızdır), şu iki not dışında: W8 ve G-L kaymaları şantiye sütunları (x = Wy … Wy+Ws−1) içinde
  kalır; genişliği Ws olan blok kaymaz.
- **N45** [kural] (Faz 2R) — (D-099: yalnız `schemaVersion` 1) Y5 Ağır Yük + kamyon (S1): parti bloğu Ağır Yük yüzünden sahaya düşemezse kuyrukta bekler
  (GDD E-54); Ağır Yük kaydırılınca o hamlenin 9. adımında düşer. Tasarım notu (solver turu): kuyruktaki blok, yer açan
  hamleye göre başka bir gereken bloğun üstüne düşebilir; bilinçli kuyruk yalnız GDD K-51 madde 2'nin bütün uzay
  çıkmaz kapısından geçen bölümde kullanılır (Bölüm 10'un eski taslağı geçemedi, LEVELS §2.11). Y5 + S1'de partinin
  yükün hangi yanına kurulacağı oyuncunun yükü nereye koyduğuna bağlıdır; teslimat adaleti (GDD K-51 madde 5) denetlenir.
- **N46** [kural] (Faz 2R) — Y5 + Y1/Y2: kasa, torba ve Ağır Yük malzeme değildir; üçü de bölüm sonunda sahada kalabilir
  (GDD K-48). Ağır Yük taşınırken başlangıç hücrelerine komşu kasa/torba/zincir K-35 adım 5 ile etkilenir.
- **N47** [kural] (Faz 2R) — S4 Moloz + S1: moloz arza sayıldığı için taşınan malzeme olabilir: dilim 0'daki moloz
  dilim 1'de doğru yerleşebilir (K-27 madde "taşınan malzeme").

### İmkânsız çiftler

- **—1** — Aynı bölümde tek `build.mode` olur (segments ya da carousel).
- **—2** — Aynı bölümde tek `gravity.build` değeri olur.

Kullanılmayan not yok; her `N01…N43` en az bir hücrede geçer; N44–N47 (Faz 2R) matris dışı genel notlardır. Matris, `docs/OBSTACLES.md` üretilirken bir betikle kontrol edildi: 26 engel, 325 çift, her çift tam bir kod taşır.

---

## Bölümler v3 blok özellikleri — ÖNERİ (G1, 2026-11-08; G1b revizyonu aynı gün)

Sahip: product-lead · Durum: **ÖNERİ** (orkestratör/proje sahibi onayı ve code-lead uygulaması bekleniyor). Kurallar
GDD §16'daki ÖNERİ K-57…K-61 ve K-65/K-66'dadır; burada engel kartı biçiminde özetlenir. Bu bölümdeki kimlikler (Y9–Y13)
yukarıdaki "Veri imzası" tablosuna onaydan sonra code-lead paketinde girer (tablo `mechanics.test` ve `rule-coverage`
tarafından okunur; onaysız satır testleri kırar). Bilgi kartı metinleri i18n'e henüz girmedi (design-lead ton denetimi +
code-lead anahtar ekler); bu yüzden aşağıda «…» ile yazıldı. **G1b:** design-lead incelemesinin (DL-V3-01…06, -12, -19,
-20) okunurluk ve etkileşim bulguları kartlara işlendi.

**Seçim (systems-designer yöntemi: aday → ölçülebilir gerekçe).** Orkestratörün 10 adayı ve benim 3 ek adayım şu
ölçütle puanlandı: (a) yeni bir **karar** yaratıyor mu (K-50 `choices`, `ahaMin`, `depLater` üzerindeki beklenen etki;
G1b'den sonra K-64 `traitDelta` ile ölçülür), (b) **görsel okunurluk** (renk körü dahil, tek bakışta, 40 CSS px hücrede),
(c) **adalet** (bilgi gizlenmez, şans yok), (d) **çözücü maliyeti** (durum uzayı çarpanı), (e) **tam örtü uyumu**
(K-47/K-48), (f) mevcut bir engelle **çakışma**.

| Aday | Karar | Okunur | Adil | Çözücü | K-47 | Çakışma | Sonuç |
|---|---|---|---|---|---|---|---|
| İki renkli blok | şekil+yön kararı geri gelir | yüksek (hücre başına renk + sembol; yalnız güçlü renk çiftleri) | evet | ×1 | evet | yok | **SEÇİLDİ → Y9** |
| Palet (katmanlı yığın) — *product-lead önerisi* | paletin altındaki bloğa ulaşma (z kazısı); çok blok | yüksek **yalnız tek tipliyken** (Hikaye 1); karışık palet gözetleme ister | evet | × Π(kᵢ+1), küçük | evet | yok | **SEÇİLDİ → Y10** |
| Sargılı blok + Makas ("sargılı" adayı) | uzaktan sıra bağımlılığı | yüksek (film kenarı + yatay kurdele + makas rozeti) | evet (renk görünür) | ×1 (makas konumundan türetilir) | evet | Y3 Zincir ve S3 Cam'dan silüetle ayrışır | **SEÇİLDİ → Y11** |
| Bonus blok (+2 hamle) | Hikaye 1'de yok (ödül anı); Hikaye 2'de bağlayıcı son tarihle öncelik | yüksek (krem hamle rozeti) | evet | `k` = 0'da yok | evet | Altın Mala ile ayrışır | **SEÇİLDİ → Y12** (ödül) |
| Kaygan blok | yüksek park yasak → park yeri kararı | orta (buz parıltısı) | evet | uzayı **küçültür** | evet | Y6'nın tek blokluk hâli | **SEÇİLDİ → Y13** (Hikaye 2) |
| Ağır blok (yalnız vinçle) | yok (güçlendiriciye bağlar) | orta | **hayır** (ücretli güce bağlı) | — | — | Y5 adı | RET |
| Renk değiştiren blok | zamanlama | orta | evet | × periyot; K-47 renk eşitliği dinamikleşir | kısmen | W6 jokerli D3a gerekir | ERTELENDİ (Hikaye 3+) |
| Çift yerleşim | belirsiz tanım | — | — | — | — | — | RET (kodlanamaz tanım) |
| Gizli renkli paket | — | — | **hayır** (bilgi gizler) | — | — | K-18 ilkesi | RET |
| Yapışkan harç / cam | var (Y8, S3) | — | — | — | — | — | mevcut, ilk bölüm değişmez |

### Y9 — İki Renkli Blok (ÖNERİ)
- **Bölge:** saha (etkisi şantiyede) · **İlk bölüm (öneri):** 5
- **Kural:** Bloğun her hücresinin kendi rengi vardır (`colors`, hücre sırası şeklin (y, x) sırası). K-16 doğru yerleşim
  her hücrede kendi rengini ister; döndürme yoktur, bu yüzden `D2_90` "WY" ile "YW" farklı bloklardır. Arz/talep (K-47)
  hücre rengiyle sayılır. Gölge (K-18) hücre başına ✓/! gösterir. Hikaye 1'de renk çifti yalnız W–Y, R–Y, W–G, G–Y
  (K-65 madde 3, `colors_low_contrast`).
- **Veri:** `PiecePlacement.colors: "WY"` (uzunluk = hücre sayısı, en az iki farklı renk); `color` = ilk hücrenin rengi.
- **Örnek:** Plan satırı `"WY"` (x0 W, x1 Y): `D2_90` "WY" doğru; `D2_90` "YW" aynı yerde `!` (iki hücre de yanlış).
- **Okunurluk (G1b, DL-V3-06):** tek dış kontur (tek blok olduğu anlaşılır); hücre başına renk + renk sembolü; iki rengin
  sınırı blok ayrımı gibi koyu oluk değil, 2 perçinli dikiş (Ø 14 design px). Renk çiftleri deutan/protan ΔE ≥ 30.
- **Eğlence gerekçesi:** tek renkli satırlarda kaybolan **şekil/yön kararını** geri getirir; karışık satırlı planlar
  ("WY/YW" pencere) yalnız doğru iki renkliyle dolar. Ölçü: `traitDelta` ≥ 10 (Bölüm 5), `shapeDecisions` ≥ 2.
- **Bilgi kartı** (ÖNERİ, anahtar `obs.y9.desc`): TR «İki renkli blok: her rengi kendi yerine gelmeli.» · EN «Two-tone block: each color must match its spot.»

### Y10 — Palet (ÖNERİ)
- **Bölge:** saha · **İlk bölüm (öneri):** 3
- **Kural:** Palet, aynı şekilde 2–4 malzeme bloğunun aynı hücrelerde üst üste (z) durduğu yığındır. Yalnız en üst katman
  tutulabilir (K-09); alttaki katmanlar paletin hücrelerini doldurur. Üst katman kaldırılınca bir alttaki aynı anda
  "üst" olur (hücreler dolu kalır). Kaldırılan katman palete geri **konamaz**; başlangıç konumuna bırakılırsa hamle
  iptaldir (K-07 satır 1) ve katman yeniden üst olur. Son katman kalkınca hücreler boşalır. Her katman ayrı bloktur:
  blok sayısına, arz/talebe (K-47) ve kazanma koşuluna (K-48) girer. **Hikaye 1'de palet tek tiplidir** (bütün katmanlar
  aynı şekil, renk ve bayrak; K-65 madde 1); bu yüzden katman sırası bilgisi gerekmez. **Kapasite:** başlangıç boş hücre
  sayısı `E ≥ 2 + max(hücre × (katman − 1))` (`pallet_capacity`, K-58 madde 8).
- **Veri:** parçada `stack: { id, z }` (aynı `id`'li parçalar aynı şekil ve çapa; `z` 0 = en alt, ardışık).
- **Örnek:** Bölüm 4 v3.1: palet `D2_90` W×3 (2,1)–(3,1); altında `C3_0` R (1,0) (hücreleri (1,0), (2,0), (1,1); sağ
  kolu paletin altında), (3,0) başka bir blokla dolu. İki üst W 1. katın iki alt satırına doğrudan konur
  (2 hamle); üçüncü W park edilir (1 hamle) → palet boşalır, `C3_0` R'nin üstü açılır. Saha 6×5, E 10 ≥ 2 + 2 × 2 = 6.
- **Okunurluk (G1b, DL-V3-01/02/03/17):** taban açık gri-mavi metal kızaktır (nötr `ui` tonu; ahşap rengi ve ağaç damarı
  yok — W "Ahşap" bloğuyla karışmasın), 2 çıta, yalnız bloğun altında 16 design px dudak olarak görünür, hücrenin
  ortasını kaplamaz. Katman sayısı dudakta 2–4 **çentikle** gösterilir (rakam yok; "+2" bonus ve Islak Beton sayacıyla
  karışmasın); katman başına 6 design px yükselen gölge "yığın" okunur. Üst katman kalkınca alttaki 120 ms "pop" ile
  yükselir (JUICE). Hikaye 2'de karışık palet: üst bloğun altından 28 design px'lik sembollü "sonraki katman" kenarı +
  basılı tutunca gözetleme (katmanlar vinç alanında yelpaze, 400 ms, hamle harcamaz); bunlar çizilmeden karışık palet
  yayımlanmaz.
- **Güçlendiriciler (K-66):** Vinç ve Altın Mala yalnız üst katmanı hedefler; Çekiç hedefsiz; Fırça Hikaye 2+'da yalnız
  üst katman.
- **Eğlence gerekçesi:** ekranı taşırmadan **blok kütlesini** artırır (2 hücrelik yerde 2–3 blok); paletin altındaki
  gereken blok "z kazısı" kararı üretir ("katmanları şimdi mi harcayayım, park mı edeyim?"). Ölçü: `traitDelta` ≥ 10
  (Bölüm 4), `stackParks` izlenir.
- **Bilgi kartı** (ÖNERİ, anahtar `obs.y10.desc`): TR «Paletten hep en üstteki alınır.» · EN «Take from the top of the pallet.»

### Y11 — Sargılı Blok ve Makas (ÖNERİ)
- **Bölge:** saha (tetik şantiyede) · **İlk bölüm (öneri):** 7
- **Kural:** `wrapped` bayraklı blok tutulamaz (K-09 (c)), Vinçle ve Altın Mala'yla seçilemez; rengi ve şekli görünür.
  Bölümde tam bir `scissors` bayraklı blok vardır. Makaslı blok K-16'ya göre **doğru** yerleştiği hamlenin 5. adımında
  (K-35) sahadaki bütün sargılar kalkar. Çekiç (K-36) tek sargıyı keser (bloğu kırmaz). Geri Al ve Söküm sargıları geri
  getirir. Makaslı blok en az 1 kazı altındadır ve yerleşimi/çıkışı sargılı bloğa bağlı değildir (`scissors_trivial`,
  `scissors_blocked`; K-59 madde 6). Hikaye 1'de palet katmanı sargılı ya da makaslı olamaz.
- **Veri:** `flags: ["wrapped"]`, `flags: ["scissors"]`; makaslı blok sargılı olamaz.
- **Örnek:** Makaslı `D2_90` R gömülü; üstündeki iki blok park edilip makaslı blok şantiyede doğru konur → aynı hamlede
  üç sargılı blok serbest kalır.
- **Okunurluk (G1b, DL-V3-04):** sargı = bloğun dış konturunu 4 design px dışarı taşan buruşuk film kenarı (yarı saydam
  beyaz, %35) + **tek yatay** kurdele bandı + üst ortada 48 design px fiyonk. Çapraz çizgi ve kilit kullanılmaz (S3 Cam'ın
  çapraz beyaz çizgileri ve Y3 Zincir'in çapraz zincir + kilidiyle silüet karışmaz); renk sembolü %100 görünür.
  Makaslı blokta sağ üst köşede 56 design px makas rozeti (krem zemin, koyu kontur). Sargılı bloğa dokununca kurdele
  titrer ve makaslı blok 1 kez parlar (ipucu, K-34 kanca 5 gibi); ikinci dokunuşta Çekiç açıksa yuvası parlar (Bölüm 8).
- **Eğlence gerekçesi:** "önce anahtarı bul" düzeninde uzaktan **sıra bağımlılığı** kurar; tek yerleşim üç bloğu açar
  (doyurucu zincirleme an). Y3 Zincir komşu hareketiyle, Y11 bir yerleşimle açılır: ayrı karar. Ölçü: `traitDelta` ≥ 10
  (Bölüm 7).
- **Bilgi kartı** (ÖNERİ, anahtar `obs.y11.desc`): TR «Makaslı bloğu yerleştir, paketler açılsın.» · EN «Place the scissors block to unwrap the rest.»

### Y12 — Bonus Blok (ÖNERİ)
- **Bölge:** saha (tetik şantiyede) · **İlk bölüm (öneri):** 9 (Hikaye 1'de yalnız burada)
- **Kural:** `bonus` bayraklı blok doğru yerleştiği hamlenin 4. adımında (K-35, maliyetten sonra) hamle sayacına
  `bonusMoves` (varsayılan 2) ekler. Hatalı yerleşim ve kaydırma bir şey vermez. Bölümde en çok 2 bonus blok. Geri Al ve
  Söküm bonusu geri alır. **Hikaye 1'de ödül anıdır:** bütçeye girmez (K-62 `k` = 0), karar sayımına ve `traitDelta`
  kapısına girmez. Bağlayıcı son tarihli bonus (`k` = 1, HUD "19 (+2)") Hikaye 2'de.
- **Veri:** `flags: ["bonus"]`, isteğe bağlı `bonusMoves: 1–3` (varsayılan 2).
- **Örnek:** Sayaç 6; bonus blok doğru konur → 6 − 1 + 2 = 7.
- **Okunurluk (G1b, DL-V3-03/20):** HUD hamle sayacının simgesi + "+2" rozeti; krem zemin, `ui.ink` 4 px kontur, Ø 56
  design px, sağ üst köşe; altın dolgu yok (`ui.gold` Y blok üstünde deutan ΔE 7,8). Taç, kral ve altın-mor kullanılmaz.
  Yerleşince rozet hamle sayacına uçar. Bir blokta en çok bir rakamlı rozet (bonus + Islak Beton yasak).
- **Eğlence gerekçesi:** olumlu sürpriz ve "sayaç zıpladı" hissi; zorluğu bütçeyle değil ödülle yumuşatır (abartısız
  zorluk isteği). Karar yarattığı iddia edilmez (design-lead karşı-olgusal testi: hiçbir çözüm değişmez).
- **Bilgi kartı** (ÖNERİ, anahtar `obs.y12.desc`): TR «Bonus blok yerine oturunca +2 hamle verir.» · EN «A bonus block gives +2 moves when placed.»

### Y13 — Kaygan Blok (ÖNERİ; Hikaye 2)
- **Bölge:** saha · **İlk bölüm (öneri):** 13
- **Kural:** `slippery` bayraklı blok sahada desteksiz kalamaz: `gravity.yard` kapalı olsa da hamle sonu 6. adımda (K-35)
  altında boşluk varsa düşer (K-20 kuralıyla, yalnız bu blok). Şantiyede sıradan bloktur.
- **Veri:** `flags: ["slippery"]`.
- **Örnek:** Kaygan `D2_90` (0,3)'ten (3,4)'e park edilir; (3,3)–(4,3) boş, (3,2)–(4,2) dolu → adım 6'da (3,3)'e iner.
- **Okunurluk:** mavi buz sırı, alt kenarda damla; düşüşte kısa kayma izi.
- **Eğlence gerekçesi:** "yükseğe park" (T7) seçeneğini kapatır → park yeri kararı; ayrıca çözücü uzayını küçültür.
- **Bilgi kartı** (ÖNERİ, anahtar `obs.y13.desc`): TR «Kaygan blok havada durmaz, aşağı kayar.» · EN «Slippery blocks slide down; they never float.»

### v3 imza önerileri (onaydan sonra "Veri imzası" tablosuna; bu tablo araçlarca okunmaz)

| Mekanik | Veri imzası | İlk bölüm |
|---|---|---|
| Y9 | herhangi bir parçada `colors` | 5 (öneri) |
| Y10 | herhangi bir parçada `stack` | 3 (öneri) |
| Y11 | `wrapped` ya da `scissors` | 7 (öneri) |
| Y12 | `bonus` | 9 (öneri) |
| Y13 | `slippery` | 13 (öneri) |

**Taşınan ilk bölümler (ÖNERİ, v3 eğrisi; LEVELS §8.2):** W1 Sabit Geçit 4 → 11, W2 Yüksek Duvar 6 → 12 (yalnız
boyu ≤ 2 şekillerle), Y5 Ağır Yük 8 → 14, W3 Dar Geçit 9 → 16; S9 Geniş Şantiye 12 → 18. Hikaye 1 yeni oyuncaklara
(şekil + 4 özellik) ayrılır; eski mekanikler Hikaye 2'de bir ritimle döner. Karışık palet (Y10 genişlemesi) ve bağlayıcı
bonus Hikaye 2'de birer tanıtım bölümüyle gelir.

### v3 aynı bloktaki birleşimler (ÖNERİ; G1b)

| | colors (Y9) | stack (Y10) | wrapped | scissors | bonus | slippery | glass | mortar | chained | wet |
|---|---|---|---|---|---|---|---|---|---|---|
| **colors** | — | ✓ (katmanlar aynı `colors`) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **stack** | | — | H1 ✗; H2+ ✓ (yalnız en üst katman) | H1 ✗ | H1 ✗ | ✗ (katman havada durmaz) | ✗ | ✗ | ✗ | ✗ |
| **wrapped** | | | — | ✗ | H1 ⚠ | ✓ | ✓ | ✓ | ✗ (iki kilit) | ✗ (iki kilit) |
| **scissors** | | | | — | H1 ⚠ | ✓ | ✗ (kırılıp dönmesi tetiği belirsizleştirir) | ✓ | ✗ | ✗ |
| **bonus** | | | | | — | ✓ | ✓ | ✓ | ✓ | ✗ (iki rakamlı rozet) |
| **slippery** | | | | | | — | ✓ | ✓ | ✓ | ✓ |

✓ izinli · ✗ doğrulayıcı reddeder (`flag_combo_forbidden`) · H1 ✗ Hikaye 1'de reddedilir (`stack_mixed`: palet katmanı
bayraksız, K-65 madde 1) · H1 ⚠ Hikaye 1'de uyarı (`trait_overlay_many`: blok başına en çok bir kaplama, K-65 madde 2);
Hikaye 2+'da izinli. Ağır Yük (I5/Q9) v3 özelliklerinin hiçbirini almaz.
