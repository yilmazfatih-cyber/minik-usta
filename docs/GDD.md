# GDD — Oyun kuralları

Sahip: product-lead · Sürüm: Faz 2R (2026-10-07; orkestratör kararları R2-01…R2-06, R2-10, R2-11 — `docs/review_inbox/_orchestrator_rulings_2R.md`; çapraz inceleme kapanışı `docs/review_inbox/product-lead-2R-closure.md`) · Önceki: Faz 1 revizyonu (2026-10-04; R-01…R-24; tutarlılık denetimi tur 1–2, 2026-10-05; Faz 2 ifade düzeltmesi K-08/K-26, 2026-10-06) · Kaynak: `docs/BRIEF.md` §4–§8, §10

Bu belge oyunun **bütün** kurallarını kimlikle (K-xx) verir. Brifteki K-01…K-33 kimlikleri ve anlamları korunmuştur;
yalnızca belirsizlikleri sayıyla kapatan açıklamalar eklenmiştir. Yeni kurallar K-34'ten başlar. Engel ayrıntıları
`docs/OBSTACLES.md`'dedir (kimlikler W1–W8, Y1–Y8, S1–S9, G-H, G-L); bu belge onlara atıf yapar.
Teknik modelle (TECH_DESIGN §2–§6) uyumludur; code-lead'in açık sorularına (S-1…S-28) yanıtlar §15'tedir.

**Faz 2R özeti (proje sahibi geri bildirimi, R2-01…R2-06, R2-10):** (1) **Tam örtü:** bütün blokların hücre toplamı
planın hücre toplamına eşittir, şaşırtma blok yoktur, bölüm saha/kuyruk/el boşalınca kazanılır (K-47, K-48; K-27 ve
K-28 güncellendi). (2) **Değişken boyut:** saha `Wy × Hy`, şantiye `Ws × Hs` bölüm parametresidir; bütün koordinatlı
kurallar genel yazıldı, örnekler varsayılan boyutla (6×8 saha, 2×8 şantiye) korunur (K-49; K-01…K-05, K-10…K-12,
K-15, K-17, K-19, K-25 güncellendi). (3) **Bulmaca ölçütleri** solver'ın hesaplayacağı biçimde tanımlandı (K-50) ve
zorunlu kılındı (K-51). (4) **Hamle bütçesi** formülü (K-52). (5) **Tam örtüyle çelişen sistemler** yeniden tanımlandı:
Çekiç (K-36), Altın Mala (K-33), Boya Fırçası (K-38), Kamyon Yardımı ve Söküm (K-30); moloz, Ağır Malzeme ve Plan
Boşluğu OBSTACLES'ta. (6) **Hafif öğretici** (K-53, §14.1). (7) **Çapraz inceleme kapanışı:** Söküm tek adımlık geri
dönüştür ve hamle sayacı ile `movesSpent` dışındaki bütün çekirdek durumu geri yükler; erişim çıkmazı solver tablosuyla
bulunur (K-30); adım 12 sayaç 0 iken de +5 penceresinden önce çalışır (K-29, K-35); güçlendirici yuva durumu (K-54);
kazı geri bildirimi ve takılma ipucu (K-34 kanca 5); Ağır Yük saha dışına kalkmaz (K-08, K-44). Değişen kural
başlığında "(Faz 2R)" yazar; kimlikler yeniden kullanılmaz.

Her kural: **Kural** (test edilebilir cümle) + **Örnek** (koordinat, önce/sonra). Test adları kural kimliğini içerir.

---

## 0. Sözlük ve gösterim

| Terim | Tanım |
|---|---|
| Boyut parametreleri (Faz 2R) | `yard.cols = Wy`, `yard.rows = Hy`, `site.cols = Ws`, `site.rows = Hs` (K-49). Varsayılan Wy = 6, Hy = 8, Ws = 2, Hs = 8. **Tahta yüksekliği** `H = max(Hy, Hs + eMax)` (`eMax` = asansör aralığının üst ucu `b`, K-24; asansör yoksa 0). Bu belgedeki sayısal örnekler, aksi yazılmadıkça varsayılan boyutla verilir (H = 8, duvar sınırı x = 5 \| 6, Vinç Alanı y = 8–9); "Bölüm N" diye anılan örnekler LEVELS §2'deki o bölümün boyutunu kullanır. |
| Hücre | Tahtadaki 1×1 kare. Genel koordinat `(x, y)`; x=0 en sol, y=0 en alt. Tahta x = 0 … Wy+Ws−1, y = 0 … H−1. |
| Blok | Tek renkli poliomino. Kimlik `TÜR_AÇI` (ör. `C3_90`). Çapa = kutusunun sol alt köşesi. Oyuncuya görünen metinde terim her zaman "blok / block"tur ("parça / piece" kullanılmaz, R-08). |
| Malzeme bloğu (Faz 2R) | Ağır Yük (Y5: I5 ve Q9) dışındaki her blok; moloz (S4) dahil. Arz, tam örtü ve kazanma sayımları yalnız malzeme bloklarını içerir (K-47, K-48). |
| Saha | x = 0 … Wy−1, y = 0 … Hy−1 (Wy·Hy hücre; varsayılan x=0–5, y=0–7, 48 hücre). Malzeme deposu. |
| Saha üstü hava (Faz 2R) | x ≤ Wy−1 ve Hy ≤ y ≤ H−1 hücreleri (yalnız Hy < H iken vardır). Sürüklemede geçilir; blok burada duramaz (bırakma iptal, K-07 satır 3). |
| Şantiye | x = Wy … Wy+Ws−1, y = e … e+Hs−1 (e = asansör ofseti, K-24; varsayılan x=6–7, y=0–7). Aktif dilimin planı burada gösterilir ve alanı tamamen kaplar (K-15). Şantiye sütunlarında y ≥ Hs+e hücreleri "şantiye üstü hava"dır. |
| Duvar sınırı | x=Wy−1 ile x=Wy arasındaki **sıfır genişlikli** sınır (varsayılan x=5 \| 6; R-03; TECH_DESIGN P-1). Satır `y`'de sınır **kapalıdır** ⇔ `y < height` ve `y` açık bir geçidin satırlarında değil; diğer satırlarda açıktır. Bir öteleme adımında sınırı geçen her hücre kendi satırında geçer ve o satır açık olmalıdır. Bloğun hücreleri sınırın iki yanındaysa blok "sınırı kesiyor"dur. (Önceki taslaktaki "duvar sütunu" ile kurallar eşdeğerdir; yalnızca ara konum sayısı değişir.) |
| Vinç Alanı | Tahtanın üstündeki y = H ve y = H+1 satırları (varsayılan y=8–9); bütün sütunlar ve sınırın üstü dahil. |
| Arz / talep (Faz 2R) | `talep(c)` = rengi c olan plan hücrelerinin sayısı (`?` çözülmüş rengiyle); `arz(c)` = rengi c olan malzeme bloklarının hücre toplamı (K-47). "Kalan" sözcüğü: talep için doğru dolu olmayan plan hücreleri, arz için şantiyede kilitli olmayan malzeme blokları. |
| Kaydırma hamlesi (Faz 2R) | K-07 satır 2 sonucunu veren sürükleme (bütün hücreleri sahada biten; Ağır Yük taşıma dahil). "Kazı" ile aynı şeydir (K-50). |
| Söküm (Faz 2R) | K-30 kurtarması: çıkmaz durumu üreten son eylemden (sürükleme hamlesi, güçlendirici ya da Altın Mala) önceki duruma **tek adımda** dönüş. Hamle sayacı ve `movesSpent` dışındaki bütün çekirdek durum geri gelir. |
| Hamle (tur) | İptal edilmeyen bir bırakma. Hamle sayacını düşürür, zamanlayıcıları 1 kez ilerletir. |
| Serbest kip (FREE) | Bloğun saha, Vinç Alanı ya da duvar üstünden şantiyeye taşındığı kip. Şantiyede bırakılınca düşer. |
| Ray kipi (RAIL) | Bloğun bir geçitten geçerek şantiyeye girdiği kip. Dikey konumu kilitli, bırakılınca düşmez. |
| Siluet (`top(c)`) | Şantiye sütunu `c`'deki en yüksek dolu hücrenin satırı + 1; sütun boşsa çerçeve tabanı (asansörsüz 0). |
| Düşüş mesafesi | Bırakma satırı − iniş satırı (bloğun çapa satırları farkı). |
| Doğru dolu hücre | Doğru yerleşmiş (kilitli) bir bloğun doldurduğu plan hücresi (Faz 2R: Altın Mala artık hücre doldurmaz, bir bloğu yerleştirir; K-33). |
| `m` | Bölüm başından beri tamamlanan hamle sayısı (`turn`). Bölüm başında 0. Zamanlayıcılar (W4, W5, S5, S6, Y4) `m`'den hesaplanır. Geri Al ve Söküm `m`'yi eylem öncesi değerine döndürür. |
| `movesSpent` (Faz 2R) | Bu denemede iptal edilmeyen sürükleme hamlelerinin sayısı. Yalnız artar; tek istisna Geri Al'dır (K-39: geri alınan hamle 1 düşer). Söküm düşürmez. Bölümden çıkış cezası buna bakar (K-43 madde 2). Bölüm başında 0. |

Yön sözcükleri: "yukarı" = +y, "sağ" = +x. "Komşu" her yerde **4-komşuluk** (sol, sağ, alt, üst) demektir.
Komşuluk duvar sınırını **aşmaz**: x=Wy−1 ile x=Wy hücreleri (varsayılan x=5 ile x=6) duvar yüksekliğinden ve
geçitlerden bağımsız olarak hiçbir zaman komşu sayılmaz (R-03 eşdeğerliği: önceki "duvar sütunu" modelinde bu hücreler
arasında duvar hücresi vardı; E-46).

---

## 1. Oyun alanı

### K-01 Tahta (Faz 2R)
**Kural:** Oyun tahtası (Wy + Ws) sütun × H satırdır (K-49; varsayılan 8 × 8); geçerli hücreler
`0 ≤ x ≤ Wy+Ws−1`, `0 ≤ y ≤ H−1`. Bunun üstünde Vinç Alanı (y = H, H+1) vardır. Hiçbir bloğun hücresi y > H+1, x < 0
ya da x > Wy+Ws−1 olamaz.
**Örnek (varsayılan):** `D2_0` (1×2) çapası (3,8) ise hücreleri (3,8),(3,9) → geçerli. Çapası (3,9) ise (3,10) taşar →
bu konum yok. **Örnek (Bölüm 1: Wy=4, Hy=4, Ws=2, Hs=5):** H = 5, tahta 6 × 5, Vinç Alanı y = 5–6; `D2_90` çapası (4,6) →
(4,6),(5,6) geçerli; çapa (5,6) → (6,6) taşar (x > 5).

### K-02 Malzeme Sahası (Faz 2R)
**Kural:** Saha Wy × Hy hücredir (`C = Wy·Hy`); kaymaz. Bölüm başında (parti 0 yerleşince) dolu hücre sayısı
`F` = malzeme blokları + Ağır Yük (Y5) + Ahşap Kasa (Y1) + Çimento Torbası (Y2) hücreleri; boş hücre `E = C − F`.
Doğrulayıcı bütün bölümlerde (öğretici bölümler dahil) **`2 ≤ E ≤ ⌊0,4 · C⌋`** ister (doluluk en az %60; en az 2 boş
hücre). `E < 2` → `yard_fill_high`; `E > ⌊0,4·C⌋` → `yard_fill_low`. Kamyon partileri (k ≥ 1) bu sınıra tabi değildir
(K-25). "Sade tahta" (brif §8) az renk, az şekil demektir; düşük doluluk demek değildir.
**Gerekçe:** (1) Tam örtüde (K-47) saha malzemesi plan kadardır; eski %80–100 sınırı 6×8 sahada 2×8 planla sağlanamazdı
(16/48 = %33), bu yüzden sınır sahanın kendi boyutuna göre verilir ve saha bölüm bölüm boyutlandırılır (K-49).
(2) Alt sınır `E ≥ 2`: K-51 kazısı en az bir bloğun sahada yer değiştirmesini ister; 1 boş hücre yalnız `B1`'i
oynatabilir, 2 boş hücre en az bir `D2`'ye yer açar (çözülebilirliği yine solver kanıtlar, K-45/9). (3) Üst sınır
`E ≤ ⌊0,4·C⌋`: daha fazla boşlukta engelleyiciyi park etmek düşünme gerektirmez ve yığın "dolu tahta" olarak okunmaz.
**Örnek:** Bölüm 3: C = 16, F = 10 → E = 6 = ⌊6,4⌋ → geçerli. Varsayılan 6×8: C = 48 → E ∈ [2, 19]. C = 16 iken E = 7 →
`yard_fill_low`; E = 1 → `yard_fill_high`.

### K-03 Şantiye (Faz 2R)
**Kural:** Şantiye x = Wy … Wy+Ws−1 sütunlarıdır (varsayılan x=6–7) ve yalnızca aktif dilimin (döner platformda öndeki
dilimin) planını gösterir. Plan satırları şantiyenin tabanına hizalanır: plan satırı `r`, tahta satırı `r + e`'dir
(`e` = asansör ofseti, K-24; asansör yoksa `e = 0`). Her dilimin planı Ws sütun × Hs satırdır ve şantiyeyi **tamamen**
kaplar (K-15; plan dışı şantiye hücresi yoktur). Şantiye sütunlarında `y ≥ Hs + e` hücreleri **şantiye üstü
hava**dır: serbest kipte geçilir; bir blok buraya inerse yerleşim `outside` nedeniyle hatalıdır (K-16 koşul 1).
**Örnek:** Bölüm 1: Ws=2, Hs=5, plan `["WW","YY","WW","YW","YW"]` (`rows` yukarıdan aşağıya, K-15), e=0 → (4,0)=Y,
(5,0)=W, (4,1)=Y, (5,1)=W, (4,2)…(5,2)=W, (4,3)…(5,3)=Y, (4,4)…(5,4)=W; (4,5)…(5,6) Vinç Alanı.

### K-04 Şantiye Duvarı (Faz 2R)
**Kural:** Duvar, saha (x ≤ Wy−1) ile şantiye (x ≥ Wy) arasındaki sıfır genişlikli sınırdır (§0). Parametreler:
`height` (0 … H) ve `gaps[]` (`y`, `size`, `type`). Sınır `y` satırında şu durumda **kapalıdır**: `y < height` ve `y` açık
bir geçidin satır aralığında değil. Vinç Alanı satırları (H, H+1) her zaman açıktır. `height = H` "Yüksek Duvar"dır
(W2).
Geçit kısıtları (doğrulayıcı): `size ≥ 1`; `y ≥ 0`; `y + size ≤ height − 1` (geçidin üstünde en az 1 kapalı duvar
satırı olmalı; aksi halde bu geçit değil alçak duvardır); geçitler örtüşmez. Blok sınırı keserken **bırakılamaz**
(bırakılırsa iptal, K-07).
**Örnek (varsayılan):** `height=6`, geçit `y=2, size=2` → sınır satır 0–1 kapalı, 2–3 geçit, 4–5 kapalı, 6–9 açık
(duvar üstü hava). `height=6`, geçit `y=4, size=2` → 4+2=6 > 5 → doğrulayıcı hatası `gap_touches_top`. **Örnek
(Bölüm 4: H=6):** `height=4`, geçit `y=0, size=2` → sınır satır 0–1 geçit, 2–3 kapalı, 4–7 açık.

### K-05 Vinç Alanı (Faz 2R)
**Kural:** y = H ve y = H+1 satırları (varsayılan 8–9) bütün sütunlarda serbest havadır. Blok sürüklenirken buraya
girebilir. Bırakma anında bloğun bütün hücreleri x ≤ Wy−1 iken herhangi bir hücresi y ≥ Hy ise (Vinç Alanı ya da saha
üstü hava, §0) bırakma **iptaldir** (blok yerine döner, hamle harcanmaz). Şantiye sütunları (x ≥ Wy) üstünde
bırakılan blok şantiyeye düşer (K-11).
**Sonuç (açık yükseklik):** Sınırı serbest kipte geçen her hücre `y ≥ height` olmalıdır. Bu yüzden duvarın üstünden
geçebilecek bloğun kutu yüksekliği `(H + 2) − height` satırı aşamaz. Varsayılan boyutta `height=8` iken yalnızca boyu
≤ 2 olan bloklar (B1, D2_0, D2_90, O4, C3 hepsi) duvarı aşar; I3_0, I4_0, L4_0 gibi boyu 3–4 olan dikey bloklar
yalnızca uygun bir geçitten girebilir. Bölüm 6'da (H = 7, `height = 7`) sınır yine 2'dir. Yapışkan takibin (K-08) duvar tepesinde durması bir sunum olayıdır
(`blockedByWallHeight`; design-lead bu anda vinç alanı sınırını ve yükseklik işaretini gösterir); kuralı değiştirmez.
Oyuncunun hesabındaki ilk `blockedByWallHeight` olayında bağlamsal öğretici `tut.ctx.tootall` bir kez tetiklenir (metin
STORY §6, UX §13.2 bağlamsal tablo).
**Örnek:** `height=8`, `I3_0` (1×3) çapası (5,7) → yukarı sürüklenir, en fazla çapa (5,7)'ye (hücreler 7–9) çıkar;
sınırı geçmek için 3 hücrenin de y ≥ 8 olması gerekir → imkânsız. `height=7` iken çapa (5,7) → hücreler
7,8,9 ≥ 7 → geçer.

### K-06 Yapı Panoraması
**Kural:** Tahtanın üstünde bütün dilimlerin küçük önizlemesi bulunur: tamamlanan dilimler tam renkli, aktif dilim
vurgulu çerçeveli, gelecek dilimler %30 opak gösterilir. Gizli `?` hücreleri panoramada da `?` görünür; açılınca
(K-32) rengini alır. Panorama **oyun durumunu değiştirmez**; dokunuş yalnızca büyük önizleme açar (sunum design-lead'in,
UX_FLOWS §5.1; R-22). Test: önizleme açılıp kapanınca oyun durumu (tahta, sayaçlar, `m`) bit bit aynıdır.
**Örnek:** 3 dilimli bölümde 1. dilim bitince panorama: [dilim 1 renkli][dilim 2 çerçeveli][dilim 3 soluk].

---

## 2. Hareket

### K-07 Hamle, iptal ve hamle maliyeti (Faz 2R: tablo koordinatları genel)
**Kural:** Dokunma ile sürükleme ayrımı sayı içermez: `tokens.drag.startThresholdPx` / `tokens.drag.holdMs`
(design-lead) ile yapılır; eşik altında kalan bırakma **dokunmadır**, hiçbir şey olmaz (blok tutulmamış sayılır). Test
token değerini okur. Bırakma anındaki konuma göre sonuç aşağıdaki tabloyla **tek** biçimde belirlenir (satırlar
yukarıdan aşağı denenir, ilk tutan geçerlidir):

| # | Bırakma konumu | Sonuç | Hamle maliyeti |
|---|---|---|---|
| 1 | Başlangıç konumu (aynı hücre kümesi, aynı kip) | İptal | 0 |
| 2 | Serbest kip, bütün hücreler x ≤ Wy−1 ve y ≤ Hy−1 (varsayılan x ≤ 5, y ≤ 7) | Sahaya yerleşim (K-10; "kaydırma hamlesi") | 1 |
| 3 | Serbest kip, bütün hücreler x ≤ Wy−1, en az bir hücre y ≥ Hy | İptal (K-05) | 0 |
| 4 | Blok duvar sınırını kesiyor (hücreleri sınırın iki yanında) | İptal | 0 |
| 5 | Bütün hücreler x ≥ Wy ve şantiye **kapalı**: bütün dilimler tamamlanmış, bölüm ek hedef (K-41) yüzünden sürüyor | İptal (E-27) | 0 |
| 6 | Serbest kip, bütün hücreler x ≥ Wy | Şantiyeye düşüş (K-11) → doğrulama (K-16) | 1 |
| 7 | Ray kipi, bütün hücreler x ≥ Wy | Rayda yerleşim (K-12) → doğrulama (K-16) | 1 |

Ek maliyetler **toplanır**: hamle maliyeti = taban + cam cezası. Taban 1'dir; harçla yapışmış (Y8) bloğun hamlesinde
2'dir. Cam kırılırsa (S3) +1. Buna göre sıradan cam kırılması 2, yapışmış harçlı cam bloğun yeniden sürüklenip kırılması
3 hamle yer (test "K-07 stuck glass mortar break cost"). Hamle sayacı 0'ın altına inmez (1 hamle kalmışken maliyeti 2
olan hamle sayacı 0 yapar). Sayaç 0 iken blok tutulamaz. İptal edilen bırakmada
hiçbir durum değişmez: sayaç, Usta Serisi, zamanlayıcılar, boya, komşu etkileri olduğu gibi kalır.
**Örnek:** Blok (2,6)'dan alınıp Vinç Alanı'nda (2,8)'de bırakılır → satır 3 → iptal, kalan hamle 12 → 12.
Aynı blok (4,7)'de bırakılır (o hücre boş) → satır 2 → kalan hamle 12 → 11.

### K-08 Yol kuralı ve yapışkan takip (Faz 2R: Ağır Yük saha içinde kalır)
**Kural:** Blok yalnızca birim ötelemelerle (±1 x ya da ±1 y), her ara konumda bütün hücreleri boş ve geçerli olacak
biçimde hareket eder (BFS). Diğer bloklar, sınırın kapalı satırları, kasa, torba ve şantiye platformu geçilemez.
**Ağır Yük (Y5, Faz 2R):** her ara konumda bütün hücreleri saha içindedir (x ≤ Wy−1 ve y ≤ Hy−1); saha üstü havaya ve
Vinç Alanı'na kalkmaz, diğer blokların üstünden atlamaz. `R`'si yalnız saha içi konumlardır (K-44 Ağırlık).
Saklı nesneler (anahtar, vida) yolu kapatmaz. Tutma anında erişilebilir konum kümesi `R` hesaplanır; sürükleme
süresince tahta donuktur (hiçbir şey düşmez, kırılmaz), bu yüzden `R` değişmez.
Parmak hedefi `p = parmak − tutmaOfseti + (0; 1,2)` hücredir (blok parmağın 1,2 hücre üstünde görünür). Blok, `R`
içinde `p`'ye Öklid uzaklığı en küçük konuma gider ("yapışkan takip"). Eşitlikte sırasıyla: (1) mevcut konumdan BFS
adımı az olan, (2) serbest kip ray kipinden önce (ray kipindeki iki konum arasında bu ölçüt eşittir), (3) çapa y'si
küçük olan, (4) çapa x'i küçük olan, (5) yalnızca (1)–(4) de eşitse geçidin `wall.gaps` dizinindeki sırası küçük olan.
Geçit dizini sıralamada **en sondadır**: iki ayrı geçidin rayındaki konumlar önce (3) y ve (4) x ile ayrılır, veride
geçitlerin yazılış sırası (1)–(4)'ün sonucunu hiçbir zaman değiştirmez. Geçitler örtüşmediğinden (K-04, W5 `gap_overlap`)
aynı çapa iki rayda bulunamaz; (5) geçerli veride hiç belirleyici olmaz, yalnızca belirlenimcilik içindir. Titremeyi önlemek için
yeni konum ancak uzaklık karesi mevcut konumunkinden en az 0,2 küçükse seçilir. Blok ekranda hiçbir zaman bir engelin
içinden "ışınlanmaz"; yeni konuma BFS yolu boyunca gider.
**Örnek:** (2,6)'daki `B1` tutulur; parmak (2,3)'e (dolu, kapalı) iner. `R`'de en yakın konum (2,6)'dır (aşağısı dolu) →
blok yerinde kalır. Parmak (3,9)'a çıkınca blok (2,7)→(2,8)→(3,8)→(3,9) yolunu izler.
**Örnek (eşitlik):** `height=5`, iki sabit geçit `y=1` ve `y=3` (boy 1); sahada yalnızca (4,2) ve (5,2)'de `B1`, (6,2)'de
moloz. (4,2)'deki `B1` tutulur, `p = (6,2)`. Ray konumları (6,1) ve (6,3) ikisi de 1 uzak ve 3 BFS adımı → (3) ile
(6,1) seçilir; `gaps` dizisi `[y=3, y=1]` sırasıyla yazılsa da sonuç aynıdır. Tek geçit `y=3`, `B1` (4,3)'te, (6,4)'te
moloz, `p = (6,4)` → serbest (5,4) ile ray (6,3) ikisi de 1 uzak ve 2 adım → (2) ile serbest (5,4) seçilir, ray konumunun
y'si küçük olsa da.

### K-09 Çıkarma (tutulabilirlik) (Faz 2R)
**Kural:** Bir blok ancak şu koşulların hepsi sağlanırsa tutulabilir: (a) 4 birim ötelemesinden en az biri K-08'e göre
geçerli bir konuma götürür ("bir yönü açık"); (b) kilitli değildir (K-14); (c) zincirli (Y3) ya da ıslak (Y4) değildir;
(d) kasa ya da torba değildir (Ağır Yük Y5 tutulabilir, yalnız sahada taşınır); (e) hamle sayacı > 0. Bölüm başında saha
K-02 sınırlarında dolu olduğundan (a) koşulunu yalnızca üstü, yanı ya da bir geçide bakan yüzü boş olan bloklar sağlar.
**Örnek:** Saha tamamen dolu; (0,6)–(0,7)'deki `D2_0`'ın üstü (0,8) Vinç Alanı → yukarı öteleme geçerli → tutulabilir.
(0,4)–(0,5)'teki blok: üst (0,6) dolu, alt (0,3) dolu, sol tahta dışı, sağ (1,4)/(1,5) dolu → tutulamaz; dokununca
hafif "kımıldamıyor" sarsıntısı (design-lead), hamle harcanmaz.

### K-10 Sahada yeniden konumlandırma (Faz 2R)
**Kural:** Blok sahada başlangıçtan farklı, bütün hücreleri x ≤ Wy−1 ve y ≤ Hy−1 olan boş bir konuma bırakılabilir
(1 hamle). Bu hamle **kaydırma hamlesi**dir (kazı; K-50 sayımlarında kullanılır).
Saha yerçekimi kapalıysa (`gravity.yard=false`) blok bırakıldığı yerde kalır, altı boş olsa bile. Açıksa hamle
sonundaki yerçekimi adımında düşer (K-20). Balonlu blok (S8) bırakıldığı anda yükselir.
**Örnek:** `O4` (2,6)'dan alınıp (4,6)'ya bırakılır; (4,5),(5,5),(4,4),(5,4) boş, (4,3),(5,3) dolu. Saha yerçekimi
kapalı → (4,6)'da asılı kalır. Açık → hamle sonunda 2 satır iner ve (4,4)'te durur (altındaki ilk destek (4,3),(5,3)).

### K-11 Şantiyeye giriş A — Duvarın Üstünden (ana yol) (Faz 2R: koordinatlar genel)
**Kural:** Serbest kipte blok, sınırı geçen her hücresi `y ≥ height` olacak biçimde duvarı aşar ve şantiye sütunlarının
(x = Wy … Wy+Ws−1) üstüne gelir. Şantiye üstünde serbest kipteki blok için **açık gökyüzü** koşulu geçerlidir: bloğun
kapladığı her şantiye sütunu `c` için bloğun o sütundaki en alt hücresi `y ≥ top(c)`. Parmak basılıyken blok bu koşulla aşağı
indirilebilir (gölgenin altına inemez). Parmak kalkınca blok **düşer**: iniş satırı
`yL = max_c (top(c) − altOfset_c)` (altOfset_c = bloğun c sütunundaki en alt hücresinin çapaya göre satırı).
Düşüş mesafesi `d = yBırakma − yL` (cam için S3). Blok havada asılı kalamaz. Rüzgâr (W8), balon (S8) ve hafif
yerçekimi yönlendirmesi (G-L) bu düşüşü değiştirir; sıra: rüzgâr kayması → düşüş/yükseliş → (G-L yönlendirme).
**Örnek:** Şantiye boş, plan h=3. `D2_90` (yatay) Vinç Alanı'nda çapa (6,8)'de bırakılır → top(6)=top(7)=0 → iner (6,0);
d=8. Aynı blok önce çapa (6,1)'e indirilip bırakılırsa d=1.

### K-12 Şantiyeye giriş B — Geçitten (ray) (Faz 2R: koordinatlar genel)
**Kural:** "Şantiyede" = bütün hücreleri x ≥ Wy; "sahada" = bütün hücreleri x ≤ Wy−1 (varsayılan 6 ve 5; aşağıdaki
sayılar varsayılan boyuttadır). Blok ancak **tamamen sahadaki** bir konumdan sağa ötelenerek bir geçide girebilir ve bunun için bloğun
bütün satırları geçidin satır aralığında olmalıdır (`g.y ≤ yAlt` ve `yÜst ≤ g.y + g.size − 1`) ve geçit o an açık
olmalıdır (W4 kepenk açık, W7 kilit açılmış). Geçide giren blok **ray kipindedir**: yalnızca yatay hareket eder,
dikey konumu kilitlidir. Ray kipinden sola, bütün hücreleri sahaya geçecek biçimde çıkılabilir (serbest kipe döner).
Şantiye tarafından ray kipine girilemez. **Tek istisna moloz (S4):** şantiyedeki başlangıç konumunda bütün satırları
bir geçidin satır aralığında olan moloz, o geçit tutulduğu an açıksa (W4 kepenk açık, W7 kilit açılmış) ray kipinde de
başlayabilir ve sola, bütün hücreleri sahaya geçecek biçimde çekilebilir (1 hamle, K-10; OBSTACLES S4, N14).
Harçla yapışmış blok (Y8) ve diğer şantiye blokları bu istisnaya girmez. Rayda, bütün hücreleri x ≥ 6 iken bırakılan
blok iskele tarafından tutulur ve **düşmez**; altı boş olabilir.
**Örnek:** Geçit y=3, size=1. Sahada (4,3)–(5,3)'teki `D2_90` sağa ötelenir: (4,3)–(5,3) → (5,3)|(6,3) (sınırı
kesiyor, ray kipi) → (6,3)–(7,3); bırakılır → satır 3'te kalır. Aynı geçide `D2_0` (1×2, satır 3–4) giremez: satır 4
geçit dışında. **Moloz örneği:** aynı geçit açık; (6,3)–(7,3)'te moloz `D2_90` var, sahada (4,3) ve (5,3) boş → moloz
ray kipinde tutulur, sola (4,3)–(5,3)'e çekilip bırakılır (1 hamle). Geçit kepenkli (W4) ve kapalıyken aynı moloz
yalnız serbest kipte tutulur (yukarıdan, duvar üstünden).

### K-13 Şantiyede serbest dikey hareket yoktur
**Kural:** Şantiyede duran (kilitli) bloklar hiçbir yönde hareket etmez. Şantiyeye blok yalnızca (a) üstten düşerek
(K-11) ya da (b) raydan (K-12) girer. Serbest kipteki blok açık gökyüzü koşulu nedeniyle bir çıkıntının (üstü dolu
hücrenin) altına yandan giremez; bunun tek yolları ray ve hafif yerçekimi yönlendirmesidir (G-L).
**Örnek:** (7,3)'te raydan konmuş blok var, (7,2) boş. Serbest kipteki `B1` (6,1)'e indirilmiş; sağa (7,1)'e öteleme
geçersizdir çünkü top(7)=4 > 1.

### K-14 Doğru yerleşen blok kilitlenir (Faz 2R)
**Kural:** Doğru yerleşen (K-16) blok kilitlenir; tutulamaz, Çekiç ve Boya Fırçası ile hedeflenemez, yerçekiminden
etkilenmez. İstisnalar yalnız ikidir: Geri Al güçlendiricisi (K-39) ve Kamyon Yardımı Söküm'ü (K-30).
**Örnek:** (6,0)'a doğru konmuş `D2_90` Y'ye dokunulur → tepki yok, hamle harcanmaz.

---

## 3. Plan ve doğrulama

### K-15 Plan bir renk haritasıdır (Faz 2R)
**Kural:** Her dilimin planı Ws sütun × Hs satırdır (K-49) ve şantiyeyi tamamen kaplar; `rows` yukarıdan aşağıya yazılır,
tam Hs satır, her satır tam Ws karakter (`plan_size`). Karakterler: renk kodu (`W Y G R O C B P`) ya da `?` (gizli,
K-32). `.` (Plan Boşluğu, S2) **MVP'de yasaktır** (R2-01; doğrulayıcı `plan_has_window`; geri getirilmesi proje sahibi
kararıdır, OBSTACLES S2). Bir dilimin bütün hücreleri doğru dolu olunca dilim **tamamlanır**; plan alanı tam örtüldüğü
için dilim alanında başka blok kalamaz.
**Örnek:** Bölüm 2: Ws=2, Hs=5, `rows: ["YY","WY","WW","GG","GG"]` → (4,0),(5,0),(4,1),(5,1)=G; (4,2),(5,2)=W; (4,3)=W,
(5,3)=Y; (4,4),(5,4)=Y; 10 hücrenin hepsi doldurulur. `["YY","W."]` → `plan_has_window` (ve `plan_size`, Hs=5 iken 2 satır).

### K-16 Doğru yerleşim (Faz 2R)
**Kural:** Yerleşim ancak şu koşulların hepsi sağlanırsa doğrudur: (1) bloğun **her** hücresi aktif dilimin plan
alanındadır ve o hücrenin plan rengi (gizliyse çözülmüş rengi) bloğun rengine eşittir; (2) (Faz 2R: kaldırıldı —
moloz artık bir malzeme bloğudur ve taşındıktan sonra sıradan blok gibi doğrulanır, OBSTACLES S4; numara korunur);
(3) Alttan Üste kuralı (K-34) sağlanır. Blok sınırlarının plandaki bir parça çizgisiyle örtüşmesi gerekmez.
**Örnek:** Plan alt iki satırı `WW`,`WW`. `O4` W (6,0)'a iner → doğru. Bunun yerine iki `D2_0` W (6,0) ve (7,0) → ikisi
de doğru. `D2_0` Y (6,0) → (6,0) W ≠ Y → hatalı.

### K-17 Hatalı yerleşim ("kötü geçiş") ve geri sekme (Faz 2R: koordinatlar genel)
**Kural:** K-16'nın herhangi bir koşulu bozulursa yerleşim hatalıdır: blok "hatalı" vurgusuyla parlar (görsel design-lead), sallanır (350 ms) ve geri
seker; hamle yanar (maliyet 1), Usta Serisi sıfırlanır. Geri sekme hedefi şu sırayla aranır:
1. Başlangıç konumunun bütün hücreleri boşsa oraya (kavisli animasyon). Sürükleme sırasında tahta donuk olduğundan
   (K-08) bu, saha ve moloz bloklarında her zaman sağlanır.
2. Değilse sahanın üstünden düşürme: aday sol sütunlar `xs = 0 … Wy − w` başlangıç `x`'ine uzaklığa göre sıralanır,
   eşitlikte duvara yakın (büyük x) önce; her aday için blok y = (H + 2) − boy'dan saha yerçekimi ayarından bağımsız
   düşürülür; iniş konumunun bütün hücreleri y ≤ Hy−1 ise hedef budur (varsayılan: `xs = 0 … 6 − w`, y = 10 − boy, y ≤ 7).
3. Hiçbiri olmazsa blok kamyon kuyruğunun **sonuna** girer (K-26).
İstisnalar: Harçlı blok (Y8) geri sekmez, iniş yerinde yapışır. Cam blok (S3) eşiği aştıysa önce kırılma uygulanır;
kırılan blok aynı hedef arama sırasıyla **sahaya** döner. Başlangıcı şantiyede olan kırılan cam blok (bu yalnız yapışmış
harçlı cam blok olabilir; moloz cam olamaz, OBSTACLES bayrak birleşimleri) **1. adımı atlar**, 2. adımdan (başlangıç
`x`'i Wy ya da daha büyük iken ilk aday sütun duvara en yakın olan `Wy − w`'dir) ve gerekirse 3. adımla aranır; **yapışma kalkar** (blok
sahada sıradan harçlı cam blok olur, sonraki bırakmalarda Y8 ve S3 yeniden uygulanır). Maliyet 3 (K-07).
Yapışmış harçlı blok (cam değil ya da kırılmadı) yeniden sürüklenip bir hücresi plan dışında hatalı yerleşirse Y8
yapışması uygulanmaz ve normal geri sekme 1. adımla onu **başlangıç konumuna** döndürür; blok orada **yapışık kalır**
(başlangıç durumu; maliyet 2, K-07). Plan içinde başka bir hatalı konuma inerse orada yeniden yapışır (Y8).
**Örnek (plan dışına bırakılan yapışmış harç):** plan yüksekliği 3, sütun 7'nin plan satırları (y 0–2) dolu; `B1`
harçlı (6,2)'ye yapışmış. Oyuncu onu (7,8)'de bırakır, iniş (7,3) plan dışı → hatalı, yapışmaz → (6,2) boş (tahta
donuk, K-08) → oraya döner ve yapışık kalır; kalan 10 → 8.
**Örnek (yapışmış harçlı cam):** normal eşik 3; `B1` harçlı cam (6,2)'ye yapışmış. Oyuncu onu sürükleyip (7,8)'de
bırakır, iniş (7,3) → d = 5 > 3 → kırılır. (6,2) boş olsa da şantiyeye dönmez: 2. adımda ilk aday sütun 5'tir (`xs`
sırası 5, 4, 3 …) → sütun 5'in tepesine düşer, yapışma kalkar; kalan 10 → 7.
**Örnek:** `B1` Y başlangıç (3,7). Şantiyede W hücresine düşer → hatalı → (3,7) boş → oraya döner; kalan hamle 9 → 8.
Moloz bloğu başlangıcı şantiyede (7,0)–(7,1) ise ve başka bir hatalı yere bırakıldıysa (7,0)–(7,1)'e döner.

### K-18 Düşüş gölgesi
**Kural:** Serbest kipte blok şantiye sütunlarına değdiği sürece, bırakılırsa duracağı konum gölge olarak **her zaman
doğru** gösterilir: rüzgâr kayması (W8), balon yükselişi (S8), asansör ofseti dahil. Ray kipinde gölge, bloğun kendi
konumudur. Gölge, doğruluk bilgisini `verdict` (K-34 "Görünürlük kancaları") ile taşır:
- **Doğruluk** (doğru/hatalı ve nedeni): Kolay ve Normal bölümlerde gösterilir; Zor ve Çok Zor bölümlerde gölge yalnızca
  konumu gösterir (nötr). Gölge açılmamış bir `?` hücresine değiyorsa bütün zorluklarda doğruluk **nötr**dür (gizli
  bilgi sızmaz; doğru/hatalı sesi de çalmaz).
- **Fizik bilgisi** (cam kırılacak: çatlak simgesi; rüzgâr kayması, balon yükselişi ve asansör ofseti dahil konum):
  **bütün zorluklarda** ve nötr gölgede de gösterilir (K-21 okunabilirlik ilkesi).
- **Hafif yerçekimi:** gölge önce yönlendirmesiz inişi gösterir; yönlendirme (K-19) yapıldığı anda yeni inişi gösterir
  (eski konumdan yeniye geçiş animasyonu design-lead'in, JUICE #46 / UX §5.4).
Renk, desen ve rozetler design-lead'indir; oyuncuya görünen metinde renk adı geçmez (renk körlüğü, R-05/P-7).
**Örnek:** Kolay bölüm, `C3_0` W'nin inişinde (7,3) Y hücresine denk geliyor → gölge "hatalı (renk)". Aynı durum Zor
bölümde → gölge yalnızca konumu gösterir. Zor bölümde cam blok d=5 ile düşecek → gölge nötr ama çatlak simgesi var.

---

## 4. Yerçekimi

### K-19 Şantiye yerçekimi (`gravity.build`) (Faz 2R: G-L sütunları genel)
**Kural:** Bölüm parametresidir; değerler:

| Ayar | Şantiye üstünde tutma | Cam kırılma eşiği (d > eşik ⇒ kırılır) | Yönlendirme |
|---|---|---|---|
| `low` (G-L) | Sınırsız | 4 | Düşüş/yükseliş başına en çok 1 kez, 1 sütun (aşağıda) |
| `normal` | Sınırsız | 3 | Yok |
| `high` (G-H) | Serbest kipte bloğun bir hücresi şantiye sütununa değdiği andan `holdMs` sonra blok o anki konumda zorla bırakılır; şantiye sütunlarından tamamen çıkınca sayaç sıfırlanır. `holdMs` = 700; Ayarlar > Erişilebilirlik "Zaman baskısını azalt" açıksa 1400 (R-11) | 2 | Yok |

Bu kuraldaki `holdMs` G-H tutma süresidir (çekirdeğin yerçekimi profili, TECH_DESIGN); K-07'deki dokunma/sürükleme
eşiği `tokens.drag.holdMs` ile ilgisi yoktur.

**Düşüş hızı kural değildir:** görsel düşüş/yükseliş eğrisinin tek kaynağı `tokens.physics` (JUICE §0.1,
design-lead). İniş satırı, cam kırılması ve doğrulama hızdan bağımsızdır. Gerçek zaman yalnızca G-H tutma süresinde ve
G-L yönlendirme penceresinde vardır. Bot zorluk ölçümü `holdMs = 700` ile yapılır (1400 ayarı kolaylaştırıcıdır;
LEVELS hedef kazanma oranları 700'e göredir).

**G-L yönlendirme kuralı (R-10):**
1. **Pencere:** serbest kipte şantiyeye bırakılan bloğun düşüşü (ya da balonun yükselişi) görsel olarak sürerken açıktır;
   iniş satırına varış anı pencereye dahildir, iniş animasyonu bitince kapanır. Pencereyi erken kapatan olayların
   **tam listesi** (TECH §4.7 `flushPending`): (a) yeni bir blok tutma (R-12, E-40); (b) Geri Al (K-39; geri alınan,
   düşmekte olan bu hamledir); (c) güçlendirici yuvasına dokunma (Çekiç, Vinç, Boya Fırçası, Altın Mala); (d) duraklatma
   düğmesi, Android geri tuşu ya da çıkış menüsü (K-43 madde 1 istisnası, E-47); (e) uygulamanın arka plana gitmesi ya
   da kapanması (K-43 madde 3 kaydı); (f) sahne değişimi. Bu olaylardan biri gelince pencere kapanır, blok o ana
   kadarki durumuyla (yönlendirilmediyse yönlendirmesiz) hemen iner, hamle sonu çözümlemesi (K-35) biter, olay **ondan
   sonra** işlenir. Listede olmayan hiçbir olay pencereyi kapatmaz.
2. **Girdi (biçim design-lead'in):** pencere içinde tahtanın herhangi bir yerine **dokunma** (K-07 eşiği altında).
   Dokunuş noktası bloğun dikey orta çizgisinin solundaysa yön −1 (sol), sağındaysa +1 (sağ). Kaydırma (swipe) girdisi
   de aynı yönü verir (design-lead seçimi).
3. **Etki:** blok, dokunuş anındaki satırı `atRow`'da 1 sütun `yön` tarafına kayar; koşul: kaymış konumun bütün hücreleri
   şantiye sütunları (x = Wy … Wy+Ws−1; varsayılan x=6–7) içinde ve boş. Kayma bir çıkıntının (üstü dolu hücrenin) altına girebilir (K-13'ün izin verdiği yol). Kaydıktan
   sonra blok aynı yönde (düşüş ya da yükseliş) yeni sütun(lar)ında ilk desteğe/tavana kadar sürer.
4. **Hak:** düşüş/yükseliş başına en çok 1 yönlendirme. Koşul tutmazsa (kenar, dolu hücre, genişliği Ws olan blok) hiçbir
   şey olmaz ve hak **harcanmaz**.
5. **Aynı hamle:** yönlendirme ayrı hamle değildir; hamle sayacını, `m`'yi, zamanlayıcıları değiştirmez. Cam için `d`
   bırakma satırı ile son iniş satırı arasındaki toplam düşüştür.
6. **Kayıt ve solver:** hamle kaydı `steer: { dir, atRow }` taşır; çekirdek sonucu yalnızca bu iki değerden hesaplar
   (görsel eğriden bağımsız). Solver yönlendirmeyi hamle parametresi olarak modeller: `atRow`, bırakma satırı ile
   yönlendirmesiz iniş satırı (ikisi de dahil) arasındaki herhangi bir satır olabilir. YAO'da yönlendirilmiş yerleşim
   "duvar üstü"dür.
**Örnek (S2'li; Faz 2R'de `.` MVP dışıdır, K-15 — örnek yalnız S2 geri gelirse ya da çıkıntı moloz/harç olduğunda geçerlidir):** `low`. Sütun 6: (6,0)–(6,1) dolu. Sütun 7: (7,0)–(7,1) dolu, (7,2) plan `.` hücresi (boş), (7,3) dolu
(raydan konmuş doğru blok = çıkıntı; altındaki boş `.` K-34'te dolu sayıldığı için doğrudur). `B1` (6,8)'den bırakılır;
yönlendirmesiz iniş (6,2). Blok (6,5)'teyken oyuncu bloğun sağına dokunur → (7,5)'e kayar → sütun 7'de (7,4)'e iner
(çıkıntının üstü). Dokunuş blok (6,2)'ye vardığında gelirse (`atRow = 2`) → (7,2)'ye kayar ve çıkıntının altında
kalır; (7,2) `.` olduğu için yerleşim hatalıdır (`window`) ve blok geri seker — kural erişimi verir, doğruluğu K-16/K-34
belirler. Çıkıntının altına **doğru** yerleşim yalnızca çıkıntı yanlış bir nesneyse (moloz S4, yapışmış harçlı blok Y8)
mümkündür. Bloğun soluna dokunmak hiçbir şey yapmaz (sütun 5 şantiye dışı), hak harcanmaz.
**Örnek (G-H):** `high`, cam blok Vinç Alanı'nda (6,8)'de şantiyeye değdi; oyuncu 700 ms içinde (6,4)'e indiremedi,
blok (6,6)'da bırakıldı, iniş (6,2) → d=4 > 2 → kırılır.

### K-20 Saha yerçekimi (`gravity.yard`, varsayılan `false`)
**Kural:** `true` ise hamle sonu yerçekimi adımında (K-35 adım 6) altı boş kalan saha blokları düşer; bütün
desteksizler aynı anda 1'er satır iner, tekrar desteklenene kadar sürer (zincirleme). Destek: y=0 tabanı, Ahşap Kasa
(Y1) ya da desteklenen başka bir blok/torba. Balonlu bloklar (S8) bu adımda tavana doğru yükselir; düşen bloklarla
aynı turda karşılaşmaları K-35 adım 6'nın "yarım adım" kuralıyla çözülür (E-33). Zincirli ve ıslak
bloklar da düşer (yalnızca oyuncunun tutması yasaktır). Kasalar düşmez. Çimento Torbası (Y2) saha yerçekimi kapalıyken
de düşer. Kamyon teslimatındaki bloklar ayardan bağımsız olarak düşer (K-25); bu düşüş sahadaki diğer blokları
oynatmaz.
**Örnek:** `gravity.yard=true`; (2,0)–(2,1) `D2_0` alınıp şantiyeye konur. (2,2)–(3,2) `D2_90` ve üstündeki (2,3)
`B1` desteksiz kalır, ama (3,2)'nin altı (3,1) doluysa `D2_90` desteklidir → hiçbir şey düşmez. (3,1) boşsa ikisi
birlikte 2 satır iner: `D2_90` (2,0)–(3,0), `B1` (2,1).

### K-21 Blok bayrakları
**Kural:** Bir bloğun bayrakları: `glass` (S3), `balloon` (S8), `mortar` (Y8), `chained` (Y3), `wet` (Y4, `wetMoves`
ile), ve doğrulayıcının eklediği `debris` (S4). İzin verilen birleşimler ve yasaklar OBSTACLES.md etkileşim
matrisindedir; özetle: `debris` hiçbir başka bayrakla birleşmez; `glass`+`balloon` yasaktır; ağır bloklar (Y5) yalnızca
`chained` ve `wet` alabilir.
**Örnek:** `{ "shape":"B1_0","color":"B","flags":["glass","chained"] }` geçerli. `["glass","balloon"]` → hata
`flag_combo_forbidden`.

**Düşme bir engeldir (tasarım ilkesi):** Yanlış sütuna düşüş, pencere boşluğuna düşüş, cam kırılması, rüzgâr sapması,
ağır yerçekiminde zaman baskısı ve saha yerçekiminde istenmeyen zincirleme kaymalar bölüm tasarımında bilinçli
kullanılır; her biri gölge ya da görünür bir göstergeyle önceden okunabilir olmalıdır.

### K-34 Alttan Üste (destek) kuralı — YENİ (öneri P-1; Faz 2R notu)
**Faz 2R notu:** Plan `.` içermediği için (K-15, R2-01) aşağıdaki `.` cümleleri MVP'de hiçbir durumda tetiklenmez ve
yalnız S2 geri gelirse geçerlidir. `.`'sız hâli: bir yerleşimin doğru sayılması için bloğun kapladığı her sütun `c` ve o
sütundaki en alt hücre satırı `r` için plan satırları `0 … r−1` doğru dolu olmalıdır; şantiyedeki doğru bloklar her
sütunda alttan kesintisiz bir yığın oluşturur ve doğru bir yerleşimde bloğun her sütundaki alt hücresi tam o sütunun
yığın yüksekliğine oturur (K-33 Altın Mala ve K-30 D3a bu biçimi kullanır).
**Kural:** Şantiyede bir yerleşimin doğru sayılması için, bloğun kapladığı her sütun `c` ve o sütundaki en alt hücre
satırı `r` için, plan satırları `0 … r−1` içindeki `.` olmayan her hücre doğru dolu olmalıdır. Yani yapı her sütunda
alttan üste kurulur; bir bloğun altında doldurulması gereken boş hücre (gömülü delik) bırakılamaz. `.` hücreleri bu
kuralda **yalnızca boşken** "dolu sayılır". Kural ray yerleşimi, balon, Vinç güçlendiricisi ve Altın Mala için de
geçerlidir. Moloz ya da yapışmış harçlı blok (yanlış bloklar) "doğru dolu" değildir; üstlerine doğru yerleşim yapılamaz.
Bu, yanlış nesnenin bir `.` hücresinde durduğu durumu da kapsar: `.` hücresinde moloz ya da yapışmış harçlı blok varsa o
hücre "dolu" sayılmaz; o sütunda bu hücrenin üstüne düşen her yerleşim `support` nedeniyle hatalıdır ve nesne
kaldırılana kadar o sütunda inşa cephesi (kanca 1) yoktur (E-43). Nedeni: aksi halde `.` içindeki harcın üstü doğru
blokla kapanır, harç tutulamaz hale gelir ve dilim K-15 gereği hiç tamamlanamazdı (D1/D2/D3'ün yakalamadığı kilit).
**Gerekçe:** Brif K-16 "doğru blok = doğru renk + kalan boşluğa uyan şekil" der; açık gökyüzü kuralı (K-13) yüzünden
gömülü bir delik bir daha doldurulamaz ve bölüm sessizce çözümsüz kalırdı. Bu kural kilitlenmeyi kaynağında önler ve
gölge rengiyle (K-18) öğretilir.
**Örnek 1:** Plan `["WW","WW","WW","WW"]` (h=4), şantiyede yalnızca (6,0)–(6,1)'de doğru `D2_0` W var. `O4` W
bırakılır → top(6)=2, top(7)=0 → iniş (6,2): dört hücre de W (K-16 koşul 1 sağlanır) ama sütun 7'de r=2 ve (7,0),(7,1)
boş → K-34 bozulur → hatalı, gölge "hatalı (destek)". Doğru hamle: önce bir `D2_0` W'yi sütun 7'ye bırakmak.
**Örnek 2:** Plan (alttan) y0 `WW`, y1 `W.`, y2 `WW`. (6,0)–(7,0) ve (6,1) dolu. `D2_90` W rayla (6,2)–(7,2)'ye girer:
sütun 7'de r=2, satır 1 boş `.` (dolu sayılır), satır 0 dolu → doğru.
**Durum:** KABUL (R-01; proje sahibine onay için sunulur). Kural test edilebilir kalır; aşağıdaki kancalar yalnızca
oyuncunun kuralı **görmesi** içindir, sonucu değiştirmez.

**Görünürlük kancaları (çekirdek bunları üretir, sunum design-lead'in):**
1. **İnşa cephesi** `buildFront(state)`: aktif dilimin her sütunu `c` için, boş, `.` olmayan ve altındaki bütün plan
   hücreleri doğru dolu ya da **boş** `.` olan **en alt** plan hücresi (sütun tamamsa ya da altında yanlış nesne varsa
   yok). (Faz 2R: `eligibleTrowelCells` kaldırıldı; Altın Mala hücre değil blok yerleştirir, konum kümesi K-33 `P`'dir.) Bütün
   zorluklarda gösterilebilir (renk bilgisi değil, yapı sırası bilgisi).
2. **Gölge kararı** `verdict = { ok, reasons[], missingSupport[] }`: `reasons` şu sabit sırayla dolar: `debris` (S4),
   `outside` (plan alanı dışı), `window` (`.` hücresi), `color` (renk ya da çözülmüş `?` rengi), `support` (K-34).
   **Faz 2R:** `debris` ve `window` **üretilmez** (moloz taşınınca sıradan bloktur ve başlangıç konumuna yerleşim
   tanımlı değildir, OBSTACLES S4; `.` MVP'de yoktur, K-15). Kod sırayı korur; Faz 2R'de etkin sıra `outside → color →
   support`'tur. Test "K-34 hook 2 debris and window never produced". **Birincil neden** = ilk eleman. `missingSupport` = K-34'ü bozan plan hücreleri: doğru dolu olmayan `.` olmayan
   hücreler ve içinde yanlış nesne bulunan `.` hücreleri (sütun, satır sıralı).
   `support` nedeni gizli bilgi taşımadığı için gölge nötr olduğunda (Zor, `?`) da gösterilebilir.
3. **Geri sekme olayı** `bounce { pieceId, reason, missingSupport[] }`: K-17 geri sekmesinde birincil neden ve eksik
   destek hücreleri olayla birlikte yayınlanır (sekme sonrası vurgu bütün zorluklarda).
4. **İlk karşılaşma (Faz 2R):** oyuncunun hesabında ilk kez `reason = support` olan bir geri sekme (ya da harç yapışması)
   olunca bağlamsal öğretici `tut.ctx.support` bir kez tetiklenir (metin STORY §6; sunum K-53: hafif balon, oyunu
   kilitlemez) — **ancak** `seenContextTips.support` henüz işaretli değilse; bir sonraki bağlamsal tetik bir daha çıkmaz.
   Faz 2R bölüm taslaklarında (LEVELS §2) bu satırı öğretici adımında yeniden kullanan bölüm yoktur (eski Bölüm 4 adım 2
   kaldırıldı). Doğal ilk nokta Bölüm 2'dir: `C3_180` Y temelden önce şantiyeye bırakılırsa gölge "hatalı (renk +
   destek)" gösterir, bırakılırsa `support` reddi olur. Bölüm öğretici adımı etkinken (Gösterim ya da Gizli, K-53 madde
   4) bağlamsal satır kuyrukta bekler ve adım bitince gösterilir (§14.1 madde 2, K-53). Neden gösterimi (kanca 2–3) her
   zaman sürer.
5. **Kazı geri bildirimi ve takılma ipucu (Faz 2R):** Her eylemin (sürükleme hamlesi, güçlendirici, Altın Mala, Söküm)
   sonunda çekirdek iki küme yayınlar:
   - `neededNow(state)` = aktif dilimde K-16'ya (K-34 dahil) göre en az bir doğru konumu olan, sahadaki, kilitsiz
     malzeme blokları (K-50 madde 5'in o anki durumdaki karşılığı; erişim, duvar ve geçit yok sayılır). Kuyruktaki
     bloklar girmez.
   - `unlockedNeeded { pieceIds }` = `neededNow` içinde olup bu eylemden **sonra** `R`'sinde (K-08) doğru yerleşim veren
     bir bırakma konumu bulunan, eylemden **önce** bulunmayan bloklar (kazı bir gömülü gereken bloğu açtı). Boş küme
     olay üretmez.
   - **Zorluk kapısı** (bilgi düzeyi; gölge doğruluğuyla aynı ilke, K-18): Kolay ve Normal'de `unlockedNeeded` anı
     sunulur; ayrıca son dokunuştan beri Kolay'da **6000 ms**, Normal'de **12000 ms** girdi yoksa `neededNow` blokları
     **2 kez** nabız atar (hareketsizlik dönemi başına bir kez; herhangi bir dokunuş süreyi sıfırlar). Zor ve Çok Zor'da
     ikisi de kapalıdır. Bir öğretici adımı etkinken (K-53 madde 4) nabız gösterilmez. Sunum (ışıltı, ses, haptik)
     design-lead'in (JUICE).
   - Bot (K-52 `a` ayarı, LEVELS §1 hedef bantları) bu ipuçlarını görmez; hedef bantlar ipuçsuz ölçülür.
   **Örnek:** Bölüm 3 başında `neededNow` = {`a`, `b`}; ikisinin de `R`'sinde doğru konum yok. Hamle 1'de `c` (1,2)'ye
   kaydırılır → `a`'nın yolu açılır, (4,0) `R`'ye girer → `unlockedNeeded { [a] }` (`b` hâlâ kımıldamaz). Hamle 2'de `a`
   (4,0)'a yerleşir → `b` sola kayıp yukarı çıkabilir, (5,0) `R`'ye girer → `unlockedNeeded { [b] }`. Kolay bölüm: iki
   an da sunulur; oyuncu hamle 1'den sonra 6 sn dokunmazsa `a` 2 kez nabız atar. Test "K-34 hook 5 unlockedNeeded after
   dig".
**Örnek 3 (kanca):** Örnek 1 durumunda `verdict = { ok: false, reasons: ["support"], missingSupport: [(7,0),(7,1)] }`;
`buildFront = {(6,2), (7,0)}`.

---

## 5. Hareketli şantiye

Şantiye modu `build.mode` ile seçilir: `segments` (S1, varsayılan) ya da `carousel` (S5). Asansör (S6) moddan bağımsız
bir eklentidir: `build.elevator` alanı varsa her iki modla birlikte çalışır (Bölüm 40'ta döner platform + asansör;
TECH_DESIGN S-16 ve code-lead'in önerisiyle uyumlu; bkz. öneri P-4).

### K-22 `segments` — Kayan Şantiye (S1) (Faz 2R: dilim boyutu)
**Kural:** Plan S dilimden oluşur (1 ≤ S ≤ 5; her dilim Ws sütun × Hs satır, K-15, K-49). Bir anda yalnızca aktif dilim
şantiyededir. Aktif dilim tamamlanınca (K-15) hamle sonu adım 8'de: iskele söner, yapı parlar, şantiye sola kayar
(600 ms), tamamlanan dilim (üstündeki kilitli bloklarla) panoramaya eklenir, sıradaki dilim boş olarak gelir ve onun
partisi kamyonla teslim edilir (K-25). Son dilim tamamlanınca kayma yerine kazanma kontrolüne geçilir.
**Örnek:** Bölüm 5 (LEVELS §2), dilim 1 (Sol Oda) son bloğu 5. hamlede doğru yerleşir → aynı hamle sonunda dilim 2 (Sağ
Oda) gelir, parti 1 sahaya düşer; 6. hamle dilim 2'de oynanır.

### K-23 `carousel` — Döner Platform (S5)
**Kural:** Bütün dilimler aynı anda vardır ve durumlarını korur; şantiyede yalnızca **öndeki** dilim gösterilir ve
oyuncu ona yerleştirir. Bölüm başında ön dilim 0'dır; dönüş sayacı `t = 0`. Her hamle sonunda (adım 10) `t` 1 artar;
`t = carouselEvery` olunca ön dilim, sıradaki (dairesel artan indeks) **tamamlanmamış** dilime geçer ve `t = 0` olur.
Ön dilim tamamlanırsa (adım 8) dönüş hemen o hamlede yapılır ve `t = 0` olur; **ön dilimin tamamlandığı hamlenin
adım 10'unda `t` artmaz** (0 kalır) ve ikinci kez dönülmez; sayım bir sonraki hamlenin adım 10'unda 1'den başlar.
Ön dilim Altın Mala, Vinç ya da Boya Fırçası ile tamamlanırsa (E-09) mini hat adım 8'de aynı dönüşü yapar ve `t = 0`
olur; mini hat adım 10'u çalıştırmadığından `t` bu eylemde artmaz. Partiler: parti 0 bölüm başında sahadadır; `k`'inci dilim tamamlandığında (hangi dilim olduğundan bağımsız)
`forSegment = k` olan parti teslim edilir. Bütün dilimler tamamlanınca bölüm kazanılır (ek hedefler de tamamsa).
`carouselEvery` 2–6 arasıdır.
**Örnek:** 3 dilim, `carouselEvery = 4`. Hamle 1–4 ön dilim 0; 4. hamle sonunda ön dilim 1. Dilim 1, 6. hamlede
tamamlanırsa ön dilim hemen 2 olur, `t=0` (6. hamlenin adım 10'unda artmaz); 7., 8., 9., 10. hamle sonlarında
`t` = 1, 2, 3, 4 → 10. hamle sonunda ön dilim 2'den sıradaki indeks 0'a döner. 11., 12., 13., 14. hamle sonlarında
`t` = 1, 2, 3, 4 → 14. hamle sonunda ön dilim 0'dan 2'ye geçer (dilim 1 tamamlandığı için atlanır).

### K-24 `elevator` — Asansör İskele (S6) (Faz 2R: tahta yüksekliği)
**Kural:** `build.elevator = { range: [a, b], start, dir }` (0 ≤ a < b ≤ 3, a ≤ start ≤ b, dir ∈ {+1, −1}). Şantiye
çerçevesinin ofseti `e` başta `start`'tır. Her hamle sonunda (adım 10) şu iki iş bu sırayla yapılır: (1) `e + dir`
aralığın dışındaysa (`< a` ya da `> b`) önce yön döner (`dir = −dir`); (2) `e += dir` (ping-pong). Böylece `e` sınıra
ulaştıktan sonraki hamlede geri döner; `e` başta sınırdaysa ve `dir` dışarı bakıyorsa (`start = b, dir = +1` ya da
`start = a, dir = −1`; geçerli veri) ilk hamlede önce yön döner, `e` hiçbir zaman aralığın dışına çıkmaz ve çerçeve
tahtadan taşmaz (Faz 2R: tahta yüksekliği `H = max(Hy, Hs + b)`, K-49; önceki `h + b ≤ 8` sınırı bu tanımla kendiliğinden
sağlanır). Plan satırı `r` tahta satırı `r + e`'dedir; `y < e` şantiye hücreleri platformdur
(dolu, destek). Şantiyedeki bütün bloklar çerçeveyle birlikte hareket eder. Duvar ve geçitler tahtaya sabittir; bu
yüzden bir geçidin açıldığı plan satırı `g.y − e`'dir. Doğrulayıcı: `b ≤ 3` (şema) ve `Hs + b ≤ 8` (`elevator_overflow`; tahta yüksekliği H en çok 8 satır + 2 Vinç Alanı satırıdır, R2-02 code-lead yerleşim sınırı).
**Örnek:** `range [0,2]`, `start 0`, `dir +1` → hamle sonları: e = 1, 2, 1, 0, 1 … Geçit tahta satırı 3'te; e=0 iken plan
satırı 3'e, e=2 iken plan satırı 1'e açılır. Sınırda dışarı bakan başlangıç: `range [0,2]`, `start 2`, `dir +1` → 1.
hamle sonunda önce `dir = −1`, sonra e = 1; devamı e = 0, 1, 2, 1 … (test "K-24 start at bound facing out turns first").

---

## 6. Malzeme teslimatı

### K-25 Partiler ve kamyon dökümü (Faz 2R: koordinatlar genel, tam örtü)
**Kural:** `yard.batches[k]` k'inci partidir. Parti 0'ın blokları bölüm başında kendi `(x, y)` konumlarındadır.
Parti k ≥ 1 teslim edildiğinde (K-35 adım 8) blokları dizideki sırayla **kamyon kuyruğunun sonuna** eklenir; teslim
**aynı hamlenin 9. adımında**, kuyruktaki eski bloklardan sonra denenir (K-26; tek deneme noktası adım 9'dur; tek
yazılı istisnası olan K-30 D2 `B1` teslimatı Faz 2R'de kaldırıldı; artık istisna yoktur). Bir
bloğun teslimi: aday sol sütun sırası (öncelik listesi, son aşama hiçbir zaman atlanmaz):
1. bloğun `x`'i;
2. varsa `dropColumns` listesindeki sütunlar, listedeki sırayla (1. aşamada denenenler atlanır);
3. kalan bütün geçerli sol sütunlar (`0 … Wy − w`), `x`'e uzaklık sırasıyla, eşitlikte duvara yakın (büyük x) önce.
Her adayda blok y = (H + 2) − boy'dan **yerçekimi ayarından bağımsız** düşürülür ve ilk desteğe oturur; bütün hücreleri
y ≤ Hy−1 olan ilk aday seçilir (E-34; varsayılan: `0 … 6 − w`, y = 10 − boy, y ≤ 7). Parti k ≥ 1 bloklarındaki `y` yok
sayılır (veride `y = Hy` yazılır; varsayılan 8). Partide Ağır Yük (Y5) de bulunabilir; aynı kuralla düşer. Parti
içeriği tam örtüye uyar (K-27, K-47). Teslimat düşüşü
sahadaki diğer blokları oynatmaz, komşu etkisi (kasa, torba, zincir) üretmez. Balonlu blok da diğerleri gibi düşüp
oturur, teslimatta yükselmez (E-36).
**Örnek:** Parti 1: `[O4 G x=4, B1 R x=0]`. Sütun 4–5'in en üst dolu hücresi y=3 → `O4` (4,4)'e iner. Sütun 0 tamamen
dolu → `B1` için sırayla x=1 (uzaklık 1), x=2 … denenir; x=1'de y=6 boş → (1,6)'ya iner.

### K-26 Kuyruk (Faz 2R: yardım `B1`'i yok)
**Kural:** Yer bulamayan blok kuyrukta kalır. Hamle sonu adım 9'da kuyruktaki her blok sırayla (FIFO) bir kez denenir;
yerleşemeyen blok sonrakileri bekletmez. Kuyruktaki bloklar tutulamaz, Çekiç'le hedeflenemez.
**Kamyon göstergesi (çip):** tek sayı `N` gösterir. `N` = kuyrukta bekleyen **blok** sayısıdır (hücre ya da parti sayısı
değil; bloğun boyu ve rengi sayıyı değiştirmez). Kuyruktaki her blok sayılır: sıradaki partinin henüz düşmemiş blokları
(adım 8), sahada yer bulamayıp kuyruğa giren geri sekmiş blok (K-17 adım 3) (Faz 2R: Kamyon Yardımı blok teslim etmez, K-30; Söküm geri dönen bir dilim teslimatını kuyruktan çıkarır, E-48).
Hamle sonunda görünen `N`, o hamlenin bütün adımlarından sonraki kuyruk uzunluğudur. `N = 0` iken gösterge **gizlidir**;
`N ≥ 1` iken görünür. Metni GDD belirlemez: STORY anahtarı (`truck.queue`, TR "Kamyonda: {n}") ve yeri UX §5.1
design-lead'indir; bu belgedeki "Kamyonda: N" yazımları yalnız bu sayıyı anar.
**Örnek:** Kuyrukta `[O4 W, B1 Y]` (`N = 2`); sahada yalnızca (5,7) boş → `O4` sığmaz, kalır; `B1` (5,7)'ye iner →
`N = 1` ("Kamyonda: 1"). Sonraki bir hamlede `O4` de düşerse `N = 0` → gösterge gizlenir.

### K-27 Parti içeriği (Faz 2R)
**Kural:** Partiler tam örtüye uyar (K-47): bölümün bütün partilerindeki ve molozundaki malzeme blokları, renk renk,
bütün dilimlerin plan hücrelerine eşittir; **şaşırtma (decoy) blok yoktur** — her malzeme bloğu çözümde tam bir kez
doğru yerleşir. Bir partinin blokları yalnız kendi dilimi için değildir: sonraki bir dilimde kullanılacak blok önceki
partide gelebilir ("taşınan malzeme", LEVELS §2.0). Doğrulayıcı K-47'nin eşitlik ve birikimli koşullarını denetler;
solver en az bir çözümün varlığını ve çözümde kullanılmayan blok kalmadığını (`unused_block`) kanıtlar. Ağır Yük (Y5)
malzeme değildir; partide bulunabilir, sayılmaz.
**Örnek:** Bölüm 5, dilim 2'de 4 R, 2 W, 4 Y hücresi var; parti 1: `D2_0` R, `D2_0` W, `D2_90` Y ×2, `D2_90` R → R 4,
W 2, Y 4 → geçerli. Partiye bir `C3` W (3) eklenirse W arzı 5 > 2 → `cover_mismatch` (eski kuraldaki "şaşırtma" artık
geçersizdir).

---

## 7. Hamle, kazanma, kaybetme

### K-28 Kazanma (Faz 2R)
**Kural:** Hamle sonu adım 11'de (ya da mini hattın 11. adımında) **K-48 koşulu** sağlanmışsa — bütün dilimler
tamamlanmış, bütün ek hedefler (K-41) karşılanmış ve sahada, kuyrukta, teslim edilmemiş partilerde ve elde hiç malzeme
bloğu kalmamış — bölüm kazanılır; bu kontrol hamle sayacı 0 olsa bile kaybetmeden önce yapılır. Kalan her hamle "Bonus İnşaat" gösterisinde altına
dönüşür; elde kalan Altın Mala'lar da altına dönüşür (miktarlar META.md, `config/economy.json`).
**Örnek:** Son hamlede (kalan 0) son dilim tamamlanır → kazanma; bonus 0 hamle.

### K-29 Kaybetme ve +5 hamle teklifi (Faz 2R: pencere adım 12'den sonra)
**Kural:** Adım 11'de hamle sayacı 0 ve bölüm kazanılmamışsa, adım 12 (K-30) bittikten sonra "Hamleler bitti!" penceresi
açılır. Pencere, bu denemenin
`n`'inci teklifidir (`n` = 1, 2, 3; deneme = bölüm başından kazanma/kayıp/çıkışa kadar, K-43 devamı aynı denemedir):
- **Altın seçeneği:** +5 hamle, fiyat `offerCosts[n−1]` = 900 / 1.350 / 1.800 (META §3.2).
- **Reklam seçeneği:** +5 hamle; **yalnızca teklif `n = 1`'de** sunulur (dolayısıyla deneme başına en çok 1), günde en
  çok 3 (ve günlük toplam reklam tavanı) — META §3.3, entrepreneur kararı (BUSINESS §4.3, P-4). 2. ve 3. teklifte reklam
  seçeneği yoktur. Ömrün ilk (ücretsiz) teklifinde de reklam seçeneği gösterilmez (UX §7).
- Hangisi kabul edilirse edilsin teklif `n`'e sayılır (R-15). 3 teklif kullanılmışsa pencere teklif içermez, doğrudan
  sonuç (kayıp) gösterilir.
- Oyuncunun ömründeki **ilk** teklif penceresinde altın seçeneğinin fiyatı 0'dır ("Usta Dede'den hediye"); teklif 1'e
  sayılır (META §3.2).
- Sallanan Köprü'de altın seçeneği yalnızca tur harcaması + fiyat ≤ 4.050 ise etkindir (META §6.1); reklam seçeneği bu
  tavandan bağımsızdır (yine yalnız `n = 1`). Tavan doluyken 2. ve 3. teklifte kabul edilebilir seçenek kalmaz; pencerede
  yalnız ret seçeneği kullanılabilir (sunum UX §7).
- Sunum ilkeleri (R-15; design-lead uygular): eşit boy düğmeler, altının gerçek para karşılığı, eskalasyon ve kalan
  teklif sayısı görünür, baskı metni yok, seri kaybı bu pencerede yazılmaz (META §5).
**Pencereden önce (Faz 2R):** sayaç 0 olan hamlenin adım 12'si K-30 D2 ve D3 denetimlerini yapar ve gerekirse Söküm'ü
uygular; pencere ancak bundan sonra açılır. Böylece pencere hiçbir zaman tespit edilmiş bir çıkmaz durumda açılmaz ve
penceredeki kalan blok bilgisi Söküm sonrası durumu gösterir (BUSINESS E5, E13). Test "K-30 step 12 runs at zero moves
before the offer window".
Kabul edilirse sayaç 5 olur ve oyun aynı durumdan sürer (zamanlayıcılar, `m`, `movesSpent` ve Usta Serisi değişmez);
ardından **yalnız K-30 D1 denetimi bir kez çalışır** (sayaç 0 iken D1 çalışmaz, K-30): hiçbir blok K-09 (a)–(d)'ye göre
tutulamıyorsa D1 yardımı uygulanır, ardından D3 denetlenir. Gerekçe: son hamle D1 durumu üretip sayacı 0 yaptıysa
teklif sonrası denetim olmadan oyuncu +5'i ödeyip hiçbir bloğa dokunamazdı (E-42). Reddedilirse bölüm kaybedilir:
1 can gider, galibiyet serisi sıfırlanır, Sallanan Köprü'deyse oyuncu elenir.
**Örnek:** Kalan 0, plan %90 dolu; teklif 1'de oyuncu reklam izler → kalan 5. Yine biter → teklif 2: altın 1.350, reklam
seçeneği yok (reklam yalnız 1. teklifte). Reddeder → kayıp.

### K-30 Kilitlenme, Kamyon Yardımı ve Söküm (Faz 2R)
**Soru (R2-05): Tam örtüde oyuncu hamle bütçesi içinde çıkmaza girebilir mi?** Evet. Arz = talep olduğundan malzeme
hiçbir zaman eksik ya da fazla kalmaz (K-47 madde 5), ama üç yol çıkmaz üretir: (1) **döşeme sırası** — rengi tutan ve
K-34'e uyan bir yerleşim kalan blokların kalan planı örtmesini imkânsız kılar (ör. bir `D2_0` W, bir `O4` W'nin
bölgesine dikey iner; tek hücreli komşu W kalır); (2) **taşınan malzeme** — sonraki dilimin bloğu (K-27) önceki dilimde
kullanılır; (3) **erişim** — sahada kalan bloklar hiçbir hamle dizisiyle duvarı ya da geçidi aşamaz (saha yerçekimi Y6,
kamyon dökümü ya da hamle bitmeden açılmayan kilit). Kolay ve Normal bölümlerde (1) ve (2) tasarımla yasaktır (K-51
madde 2: ✓-tuzağı 0); Zor ve Çok Zor'da planlama zorluğu olarak kullanılabilir. Kurtarma her zorlukta aynıdır: Söküm.

**Kural:** Adım 12 bölüm kazanılmadıysa **her zaman** çalışır (Faz 2R: sayaç 0 iken de; o durumda K-29 penceresi adım 12
bittikten sonra açılır). Çekirdek şu denetimleri bu sırayla yapar:
- **D1 Hamle yok** (yalnız sayaç > 0 iken; sayaç 0 iken çalışmaz, +5 kabulünden sonra bir kez çalışır, K-29): hiçbir
  blok K-09 (a)–(d)'ye göre tutulamıyor (sayaç koşulu (e) bu denetimde yok sayılır). Yardım: bütün zincirler ve ıslaklık
  kalkar; hâlâ D1 ise saha yeniden dizilir — blokların şekli, rengi ve sayısı korunur, yalnız saha konumları değişir
  (yöntem TECH §2R.4, §9.7). Ardından D3 denetimi yapılır.
- **D2 Renk dengesi:** bir renk c için kalan arz(c) ≠ kalan talep(c) (kalan arz = sahada, kuyrukta, teslim edilmemiş
  partilerde ve şantiyede kilitsiz duran — moloz, yapışmış harç — malzeme blokları). Faz 2R kurallarıyla oluşamaz
  (renk değiştiren kurallar renk başına arzı korur: Boya Fırçası takası K-38); güvenlik ağıdır. **Boya Kapısı (W6) olan
  bölümde D2 çalışmaz:** orada renk başına arz ile talep tasarım gereği baştan farklıdır ve denge boyamayla kurulur
  (K-47 madde 1); istenmeyen boyamayı jokerli D3a yakalar. Yardım: Söküm.
- **D3 Çıkmaz:** durum çözülemez (K-50 madde 7). Tespit iki katmanlıdır ve **MVP'de zorunludur**:
  - **D3a Döşeme denetimi (kesin, açılım sınırlı):** kalan malzeme blokları, kalan bütün dilimlerin doğru dolu olmayan
    plan hücrelerini tam örtemiyorsa çıkmazdır. Kısıtlar: yönelimler sabit; her dilimde alttan üste (K-34); `segments`'te
    dilim sırasıyla, `carousel`'de dilimler bağımsız ve aynı blok havuzuyla; **parti uygunluğu:** teslim edilmemiş parti
    k'nin (k ≥ 1) blokları yalnız k'inci dilim tamamlandıktan sonra tamamlanan dilimlere atanabilir (`segments`'te dilim
    indeksi ≥ k; sahadaki ve kuyruktaki bloklar her dilime); **W6 jokeri:** boya kapılı bölümde kutu yüksekliği bir boya
    kapısının `size`'ından büyük olmayan malzeme bloğunun rengi, kendi rengi ile bu kapıların renklerinden herhangi biri
    sayılır. Erişim yok sayılır (her blok her an alınabilir sayılır). Arama belirlenimci deneme sırasıyla (TECH §2R.4)
    en çok **20 000 açılım** yapar; sınır aşılırsa sonuç **"bilinmiyor"**dur ve çıkmaz sayılmaz. Saha hamleleri döşemeyi
    değiştirmediği için D3a yalnız doğru yerleşim, kamyon teslimatı, güçlendirici ya da Altın Mala içeren eylemlerde
    yeniden hesaplanır.
  - **D3b Erişim denetimi (solver tablosu; Faz 2R: çalışma anı araması kaldırıldı):** `levels:solve` bölümün sürükleme
    hamleleriyle ulaşılan durum uzayını tarar ve **çıkmaz olup çıkmaz olmayan bir durumdan tek eylemle girilen**
    durumların Zobrist listesini bölümle birlikte dağıtır (`src/generated/deadlock/`, TECH §2R.4). Çalışma anında durum
    listedeyse çıkmazdır. Listede değilse çıkmaz sayılmaz; buna liste yokken, liste bölüm verisine (`levelHash`) ya da
    kural sürümüne uymadığında ve durum bir güçlendirici ya da Altın Mala eyleminden sonra listede olmadığında varılan
    sonuç dahildir. **Bilinen sınır:** güçlendirici ya da Mala sonrası listede bulunmayan bir erişim çıkmazı tespit
    edilmez; döşeme çıkmazlarını D3a ve güçlendirici ön denetimi (K-33, K-37, K-38) her durumda önler. Tarama
    tamamlanamazsa (`complete: false`) bölüm LEVELS'ta kabul notu alır (K-51 madde 2). Bölüm 1–10'da liste boştur
    (`deadRate` = 0). Tablo bakışı ve D3a durumun saf fonksiyonudur; cihaz hızından bağımsızdır.
- **Yardım (D2 ya da D3): Söküm.** Çekirdek, çıkmazı üreten **son eylemin** (sürükleme hamlesi, güçlendirici ya da
  Altın Mala) öncesindeki duruma **tek adımda** döner. **Geri gelen:** hamle sayacı ve `movesSpent` dışındaki bütün
  çekirdek durum — blok konumları ve renkleri (şantiyedeki kilitli bloklar dahil; K-14 istisnası), aktif/ön dilim, kamyon
  kuyruğu ve teslim imleci, kasa katları, toplanan nesneler, hedef sayaçları, açılan `?` hücreleri, Altın Mala sayısı,
  `m` ve `m`'den hesaplanan zamanlayıcılar (W4, W5, S6, Y4 sayaçları), döner platform sayacı `t`, asansör ofseti `e`.
  **Geri gelmeyen:** hamle sayacı (harcanan hamle iade edilmez), `movesSpent` (düşmez; K-43 çıkış cezası buna bakar,
  Söküm'le bölüm başına dönüp cezasız çıkılamaz), envanterdeki güçlendiriciler (meta kayıt; Söküm kullanılmış
  güçlendiriciyi iade etmez). **Sıfırlanan:** Usta Serisi `c = 0`. Söküm hamle harcamaz, güçlendirici değildir, YAO'ya
  ve Usta Serisi'ne sayılmaz. Olay `teardown { toTurn, pieces[], cause }`, `cause` = `color` (D2) | `tiling` (D3a) |
  `access` (D3b); analytics `deadlock_teardown.cause` aynı üç nedenin karşılığıdır (`color_balance` | `tiling` |
  `access`; ANALYTICS, code-lead). Sunum design-lead'in (geri sökülen bloklar önceki yerlerine uçar; Usta Dede tek satır,
  nedene göre metin, genel yedek `tut.ctx.teardown`, STORY).
- **Sıra:** D1 → D2 → D3; aynı adımda birden fazlası tutarsa yardımlar bu sırayla uygulanır, D3 en sonda bir kez
  denetlenir. Söküm'den sonra adım 12 yeniden çalışmaz: denetimler durumun saf fonksiyonudur ve dönülen durum, o eylemden
  önceki adım 12'de aynı denetimlerden geçmiştir (bölüm başı durumu doğrulayıcının `untileable` ve solver denetimlerinden
  geçmiştir, K-45).
- **Kamyon Yardımı artık blok yaratmaz:** önceki D2 `B1` teslimatı ve D3 "yeniden şekillendirme" kaldırıldı (R2-05; tam
  örtüyü bozuyordu). Kamyon Yardımı = D1 yeniden dizme + Söküm.
- **Güvence:** Söküm'den sonraki durum tespit edilmiş bir çıkmaz değildir; sayaç 0 ise K-29 penceresi bu durumda açılır.

**Örnek (döşeme çıkmazı):** Plan alt satırları (Ws = 2) y0–1 `YW`, `YW`, y2–3 `WW`, `WW`; arz `D2_0` Y, `D2_0` W,
`O4` W, … Oyuncu `D2_0` Y'yi sütun 0'a, sonra `D2_0` W'yi sütun 0'ın y2–3'üne bırakır: renk W, altı dolu → ✓ (K-16).
Ama sütun 1'in y0–1 W hücrelerine yalnız `D2_0` W uyardı ve `O4` W artık hiçbir yere sığmaz → D3a çıkmaz → Söküm:
`D2_0` W bu hamleden önceki saha konumuna döner; `m` 5 → 4 (hamle öncesi), kalan hamle 9 → 8 kalır (iade yok),
`movesSpent` 5 kalır, Usta Serisi 0.
**Örnek (sayaç 0):** Kalan 1; oyuncu aynı çıkmaz yerleşimi yapar → sayaç 0 → adım 11 kazanma yok → adım 12 D3a çıkmaz →
Söküm (sayaç 0 kalır) → "Hamleler bitti" penceresi Söküm sonrası durumda açılır; kalan blok sayısı geri sökülen bloğu
da sayar (E-58).
**Örnek (Geri Al ile):** Aynı durumda oyuncu Söküm'den hemen sonra Geri Al kullanırsa (K-39) hamle ve Söküm birlikte
geri alınır; kalan hamle 9, `movesSpent` 4 olur.

---

## 8. Örüntü mekanikleri

### K-31 Renk örüntüsü (Faz 2R: renk kümesi)
**Kural:** Her dilim okunabilir bir desene dayanır: şerit (yatay bantlar), çapraz şerit (C3 çiftleri), dama, kemer
(`.` hücreleriyle), simetri ya da basit ikon. LEVELS.md her dilimin desen adını yazar; desen incelemesi product-lead
kontrol listesidir. Kodla test edilen kısım: bölümün **renk kümesi** hikaye bölümü sınırını aşmaz (bölüm 1 → 3,
bölüm 2 → 4, bölüm 3–5 → 5) ve yalnızca o bölüme kadar açılmış renkleri içerir (brif §6). Renk kümesi = bütün dilimlerin
plan hücreleri (`?` hücrelerinin çözülmüş renkleri dahil) ∪ bölümdeki bütün malzeme bloklarının renkleri (parti 0,
bütün kamyon partileri, moloz; Faz 2R: şaşırtma yoktur, K-47; Ağır Yük Y5 renksizdir ve kümeye girmez) ∪ Boya Kapısı
(W6) geçitlerinin `color` değerleri (LEVELS §0 ile aynı; TECH L-06/L-07).
**Örnek:** Bölüm 12 (hikaye bölümü 2) planında W, Y, O, C, R → 5 renk → hata `too_many_colors`. Bölüm 5 (sınır 3): plan
R/W/Y, bloklar R/W/Y → 3 renk, geçerli; sahaya bir G blok eklenirse küme 4 renk olur → `too_many_colors` (ve tam örtü
bozulur → `cover_mismatch`). Bölüm 22'de boya kapısı rengi P kümeye girer (B, P, Y, R → 4).

### K-32 Gizli plan (`?`)
**Kural:** `?` hücresinin rengi gösterilmez; dilimin `hidden` kuralından çözülür:
- `repeat` (`period = p`, 1 ≤ p ≤ 4): `?` hücresi (c, r)'nin rengi aynı dilimde (c, r − p) hücresinin rengidir; o da `?`
  ise zincirle çözülür. Doğrulayıcı: her dilimin alt `p` satırında `?` yoktur.
- `mirrorOf` (`segment = j`): `?` hücresi (c, r)'nin rengi j dilimindeki (1 − c, r) hücresinin rengidir (sütunlar yer
  değiştirir). Doğrulayıcı: j dilimi aynı yükseklikte ve `?` içermez; j < bu dilimin indeksi.
`.` hücresi hiçbir zaman gizli değildir. Gizli hücreye konan bloğun rengi çözülmüş renkten farklıysa hatalı yerleşimdir
(K-17). Doğru dolan `?` hücresi açılır, rengini gösterir ve panoramada da açılır.
**Örnek:** `repeat p=2`, dilim `["??","??","YW","WY"]` (alttan: y0 `WY`, y1 `YW`) → y2 = y0 = `WY`, y3 = y1 = `YW`.
`mirrorOf 0`: dilim 0 alttan y0 `RW` → dilim 1 y0 = `WR`.

---

## 9. Hedefler

### K-41 Hedef tipleri ve sayım — YENİ (Faz 2R: moloz sayımı)
**Kural:** `goals` her zaman bir `build` içerir. Ek hedefler:
- `clear` / `crate`: bir kasa canı 0'a indiğinde 1 sayılır (kat kırmak sayılmaz).
- `clear` / `chain`: bir zincir kalktığında (komşu hareketi, Çekiç ya da Kamyon Yardımı) 1 sayılır.
- `clear` / `debris` (Faz 2R): her moloz bloğu en çok 1 kez sayılır, şantiyedeki başlangıç konumundan ilk kez ayrıldığı
  anda: sahaya yerleşim (sürükleme — serbest ya da ray kipi, K-12 istisnası — ya da Vinç), şantiyede başka bir konuma
  **doğru** yerleşim, Çekiç (K-36: molozu sahaya indirir). Ayrılınca `debris` bayrağı kalkar, blok sıradan malzeme
  bloğudur; sonraki hamleleri yeniden sayılmaz.
- `collect` / `screw`: bir Altın Vida toplandığında (K-42) 1 sayılır.
Sayaç hedefi aşınca hedef "tamam" kalır; fazlası sayılmaz. Hedef paneli her hedef için `değer/hedef` gösterir.
Doğrulayıcı: `count` ≤ bölümdeki ilgili nesne sayısı.
**Örnek:** `{type:"clear", target:"crate", count:6}`; 3 kasa 2 katlı, 3 kasa 1 katlı. 4 kasa yok edildi → "4/6".
**Örnek (moloz):** `{type:"clear", target:"debris", count:3}`, 3 moloz. Moloz 0 sahaya taşınır → "1/3"; aynı blok
sonra şantiyede doğru yerleşir → "1/3" kalır. Moloz 1 şantiyedeyken Çekiç'le sahaya indirilir → "2/3".

### K-42 Saklı nesnelerin toplanması — YENİ (Faz 2R: Ağır Yük örtüsü)
**Kural:** Anahtar (W7) ve Altın Vida (Y7) bir saha hücresinin zemininde saklıdır; bölüm başında o hücre bir blokla ya
da kasayla örtülüdür (doğrulayıcı; Çimento Torbası Y2 örtü sayılmaz → `hidden_item_exposed`, TECH L-14). "Saklı" = **örtülü ama konumu her zaman görünür**: örten bloğun/kasanın o hücresinde
işaret gösterilir (sunum design-lead'in; adalet ilkesi — gizli bilgi yalnızca `?` ile verilir). Hamle sonunda adım 5 (taşıma ve komşu etkilerinden sonra) ve adım 6'dan (saha
yerçekimi) sonra, hücresi **boş** olan her saklı nesne toplanır; hücre bu iki denetim arasında yeniden örtülse bile
ilk denetimde toplanmış olur. Kasa altındaki nesne kasa yok olunca toplanır. Güçlendirici (Çekiç, Vinç) ya da Altın Mala ile
açılan hücre de aynı adımın sonunda toplanır. Örten nesne Ağır Yük (Y5) de olabilir (Faz 2R).
**Örnek:** Vida (3,2)'nin altında; (3,2)–(3,3) `D2_0` alınıp şantiyeye konur → adım 5'te (3,2) boş → vida toplanır;
adım 6'da (3,4)'teki blok (3,2)'ye düşse bile vida sayılmıştır.

---

## 10. Güçlendiriciler ve kombo

Genel: Güçlendiriciler **hamle harcamaz**, `m`'yi ve `movesSpent`'i artırmaz, zamanlayıcıları ilerletmez, Usta
Serisi'ni değiştirmez ve YAO'ya sayılmaz. Uygulanınca "mini hat" çalışır: K-35 adım 5 (saklı nesne), 6, 7, 8, 9, 11, 12.
Geçersiz hedefe dokunulursa güçlendirici harcanmaz. Konum ya da renk değiştiren eylemler (Altın Mala K-33, Vinç K-37,
Boya Fırçası K-38) uygulanmadan önce sonucu D3a (K-30) ile denetlenir; "çıkmaz" sonucu veren hedef geçersizdir. Bir
güçlendirici eyleminden sonra Söküm olursa kullanılan güçlendirici iade edilmez (K-30). Yuva durumları K-54'tedir. Açılış bölümleri ve ücretsiz denemeler META.md'dedir. Oyuncu blokları kendisi
döndüremez; yalnızca Vinç döndürür.

### K-33 Usta Serisi ve Altın Mala (Faz 2R)
**Kural:** Seri sayacı `c` bölüm başında 0'dır. Her doğru yerleşimde (sürükleme hamlesiyle) `c += 1`; `c = 4` olunca
oyuncu 1 Altın Mala kazanır ve `c = 0` olur. Hatalı yerleşim (geri sekme, harç yapışması), cam kırılması ve Söküm (K-30)
`c = 0` yapar. Kaydırma hamleleri, güçlendiriciler ve Altın Mala kullanımı `c`'yi değiştirmez; Geri Al `c`'yi hamle
öncesi değerine döndürür.
**Altın Mala kullanımı (Faz 2R, tam örtü):** Mala artık plan hücresini blok olmadan doldurmaz (bir malzeme bloğunu
kullanılmadan bırakırdı, K-47). Yeni etki: oyuncu malaya, sonra **sahadaki** bir malzeme bloğuna dokunur (gömülü olsa
bile; kilitli, zincirli, ıslak, kuyruktaki ve şantiyedeki bloklar hariç). Çekirdek, bloğun aktif (öndeki) dilimde K-16'ya
(K-34 dahil) göre doğru olduğu konumların kümesi `P`'yi hesaplar; erişim, duvar ve geçit yok sayılır, yalnız iniş
kuralı geçerlidir (bloğun her sütundaki en alt hücresi o sütunun doluluk yüksekliğine oturur). `P` boşsa işlem yapılmaz,
mala harcanmaz. **Ön denetim (Faz 2R):** `P`'nin her konumu için yerleşim sonrası durum D3a (K-30) ile denetlenir;
sonucu "çıkmaz" olan konumlar `P`'den çıkarılır (vurgulanmaz). `|P| = 1` ise blok oraya uçar; `|P| ≥ 2` ise oyuncu
vurgulanan konumlardan birine dokunur (sunum design-lead'in). Blok kilitlenir (doğru yerleşim; `?` hücreleri açılır), hamle harcanmaz, Usta Serisi'ne ve YAO'ya
sayılmaz; mini hat çalışır (K-35 adım 5 saklı nesne, 6, 7, 8, 9, 11, 12). Mala kısaca "döndürmeyen, yalnız doğru yere
koyan küçük Vinç"tir (K-37).
Altın Mala bölümler arasında taşınmaz; kazanınca kalanlar altına dönüşür (K-28), kaybedince yok olur.
**Örnek:** Sırasıyla doğru, doğru, kaydırma, doğru, doğru → 4. doğru yerleşimde +1 mala, c=0. Doğru, doğru,
hatalı → c=0. Bölüm 8 başında malası olan oyuncu malaya, sonra Ağır Yük'ün altındaki `O4` R'ye (0,0) dokunur → `P` =
{(6,0)} → blok (6,0)'a uçar ve kilitlenir; üç kaydırma hamlesine gerek kalmaz, kalan hamle değişmez. Aynı anda `D2_90` W'ye
(4,3) dokunulursa `P` boştur (W yalnız en üst satırda doğru, altı boş) → işlem yok, mala harcanmaz.

### K-36 Çekiç (Faz 2R)
**Kural:** Tam örtü (K-47) gereği Çekiç **malzeme bloğunu yok etmez**. Hedef ve etkisi:
- **Ağır Yük (Y5)** → yok olur (malzeme değildir).
- **Ahşap Kasa** → bütün katlarıyla yok olur (`clear/crate` sayılır); **Çimento Torbası** → yırtılır.
- **Zincirli blok** → yalnızca zincir kalkar (`clear/chain` sayılır), blok yerinde kalır.
- **Şantiyedeki moloz (S4)** → sahaya iner: K-17 2. adım hedef sırasıyla (başlangıç `x`'i ≥ Wy olduğundan ilk aday sütun
  `Wy − w`), yer yoksa kuyruğun sonuna (K-26); `clear/debris` sayılır, `debris` bayrağı kalkar.
- **Şantiyede yapışmış harçlı blok (Y8)** → yapışma kalkar, blok aynı sırayla sahaya iner.
Hedeflenemez (dokunulursa işlem yapılmaz, Çekiç harcanmaz): sahadaki malzeme blokları, kilitli bloklar, kuyruktaki
bloklar, duvar ve geçitler, saklı nesne hücreleri. Hedef kümesi o an boşsa yuva **hedefsiz** durumdadır (K-54: gri, "+"
ve satış penceresi yok; metin `booster.hammer.noTarget`). Çekiç malzeme bloğunun konumunu ya da rengini değiştirmediği
için döşeme ön denetimi gerekmez.
**Örnek:** Bölüm 8: `Q9_0` Ağır Yük (0,2) Çekiç'le kırılır → dokuz hücre boşalır; `O4` R'nin üstü açılır, üç kaydırma
hamlesine gerek kalmaz, hamle sayacı değişmez. Sahadaki `D2_0` W'ye Çekiç → işlem yok, Çekiç harcanmaz.

### K-37 Vinç (güçlendirici) (Faz 2R)
**Kural:** Kilitli olmayan, zincirsiz, ıslak olmayan herhangi bir saha bloğu (malzeme ya da Ağır Yük), moloz ya da
yapışmış harçlı blok seçilir (gömülü olsa bile; yol kuralı yok sayılır). Hedef:
- (a) **Saha:** bütün hücreleri boş, x ≤ Wy−1 ve y ≤ Hy−1 olan herhangi bir konum. Blok **özgün yönelimini korur**
  (Faz 2R: saha hedefinde döndürme yoktur; kalıcı bir yönelim değişikliği Ws'den geniş ya da plana hiç uymayan bir blok
  bırakıp tam örtüyü bozabilirdi, K-47).
- (b) **Şantiye:** K-16'ya (K-34 dahil) göre **doğru** olan bir konum (yalnız malzeme blokları). Oyuncu bloğu **yalnız bu
  hedef için** 90°'lik adımlarla saat yönünde döndürebilir; blok o konumda kilitlendiği için döndürülmüş yönelim sahada
  hiçbir zaman bulunmaz.
Ağır Yük (I5, Q9) döndürülmez ve şantiyeye konamaz. **Ön denetim:** hedef seçildiğinde sonuç durumu D3a (K-30) ile
denetlenir; "çıkmaz" ise hedef geçersizdir. Vinçle şantiyeye konan blok düşmez, rüzgâr ve cam kuralları uygulanmaz;
doğru yerleşim olarak kilitlenir ama Usta Serisi'ne ve YAO'ya sayılmaz. Geçersiz hedef = işlem yapılmaz, güçlendirici
harcanmaz. Vinç bloğu taşır, yok etmez; tam örtüyle uyumludur.
**Örnek:** Bölüm 10 dilim 2'de y0–y2 doğru dolu iken sahadaki `O4_0` G (gömülü olsa bile) Vinçle seçilir → (6,3) doğru
konumuna konur. Ws = 2 iken `C3_0` W Vinçle seçilir; şantiye hedefi için 90° döndürülür → `C3_90` olarak doğru konuma
konur. Aynı blok sahada boş bir konuma taşınırken döndürme düğmesi kapalıdır (`C3_0` kalır).

### K-38 Boya Fırçası — Renk Takası (Faz 2R)
**Kural:** Tek bir bloğu boyamak renk başına arzı bozar (bir renk fazla, biri eksik kalır, K-47) ve bölümü çözümsüz
bırakırdı; bu yüzden Fırça **iki bloğun rengini takas eder**. Oyuncu fırçaya, sonra sahada iki malzeme bloğuna dokunur
(kilitli olmayan; gömülü, zincirli ve ıslak olabilir — taşınmazlar, yalnız renkleri değişir; moloz, kuyruktaki ve
şantiyedeki bloklar hariç). İki bloğun **hücre sayısı eşit** ve **renkleri farklıysa** renkleri yer değiştirir; şekil,
konum ve bayraklar korunur. Değilse işlem yapılmaz, fırça harcanmaz. Her renk için arz değişmez. **Ön denetim (Faz 2R):**
takas sonrası durum D3a'da (K-30) "çıkmaz" ise işlem yapılmaz, fırça harcanmaz. Sahada bu koşulları sağlayan bir çift
yoksa yuva **hedefsiz** durumdadır (K-54).
**Örnek:** Sahada üstte `O4` Y, gömülü `O4` W; sıradaki plan hücreleri W → fırça ikisinin rengini takas eder → üstteki
blok artık W'dir (kazı kısalır). `D2_0` W ile `O4` Y → hücre sayıları 2 ≠ 4 → işlem yok, fırça harcanmaz.

### K-39 Geri Al (K-14 istisnası) (Faz 2R)
**Kural:** Son eylem bir sürükleme hamlesiyse (aradan güçlendirici ya da +5 teklifi geçmemişse) o hamle tamamen geri
alınır: blok konumları ve renkleri, hamle sayacı (cam cezası ve harç maliyeti dahil), `m`, `movesSpent` (1 düşer),
zamanlayıcılar,
seri sayacı, kazanılan Altın Mala, teslimatlar ve kuyruk, dilim geçişi, kırılan kasa katları, toplanan nesneler, hedef
sayaçları. O hamlenin 12. adımında tetiklenen **Kamyon Yardımı da (D1 yeniden dizme ya da Söküm) hamleyle birlikte**
geri alınır (hamle öncesi anlık görüntüye dönülür; E-37). Söküm'den sonra Geri Al, Söküm'ün iade etmediği hamleyi de
geri verir (K-30 örneği). Derinlik 1'dir: Geri Al'dan sonra yeni bir hamle yapılmadan ikinci Geri Al kullanılamaz. Kayıp
penceresi açıkken kullanılamaz. Geri Al blok yaratmaz ve yok etmez; tam örtüyle uyumludur.
**Örnek:** Hamle 7'de bir blok hatalı yerleşti ve geri sekti (kalan 9 → 8, c=3 → 0). Geri Al → kalan 9, c=3, blok
hamle öncesi konumunda.

### K-40 Oyun öncesi güçlendiriciler ve başlangıç bonusları — YENİ (Faz 2R: seri miktarları örneği)
**Kural:** Bölüm öncesi pencerede seçilen güçlendiriciler bölüm başlarken harcanır:
- **Termos:** hamle sayacı +3.
- **Mala Başlangıcı:** +1 Altın Mala.
- **Açık Kepenk:** `m = 0 … 4` (ilk 5 hamle) boyunca bütün Kepenk (W4) ve Kilitli (W7) geçitleri açık sayılır; Kayar
  Kapı (W5) kaymaya, Boya Kapısı (W6) boyamaya devam eder. 5. hamlenin adım 10'undan sonra geçitler kendi kurallarına
  döner. Bölümde W4 ya da W7 yoksa bu yuva seçilemez (gri, "Bu bölümde kepenk yok").
Galibiyet serisi bonusu (META.md) aynı anda uygulanır ve güçlendiricilerle toplanır. Oyuncu ilk hamleden önce bölümden
çıkarsa harcanan güçlendiriciler iade edilir (K-43).
**Örnek (Faz 2R seri miktarları, META §5):** Termos + seri kademe 2 (+1 hamle, +1 mala) → bölüm 20 hamle yerine 24 hamle ve 1 malayla başlar.

### K-54 Bölüm içi güçlendirici yuvasının durumu — YENİ (Faz 2R; EN-2R-04, BUSINESS E12)
**Kural:** Her bölüm içi güçlendirici yuvası (Çekiç, Vinç, Geri Al, Boya Fırçası) her eylemin sonunda (adım 12 ya da
mini hat bittikten sonra) ve bölüm başında şu sırayla **tek** duruma girer (ilk tutan geçerlidir):
1. **Kilitli:** güçlendirici açılmamış (META §4). Adet rozeti görünür; dokunuş yalnız bilgi balonu açar.
2. **Hedefsiz:** o anki durumda geçerli hedef yok. Çekiç: K-36 hedef kümesi boş. Boya Fırçası: sahada hücre sayısı eşit,
   rengi farklı ve K-38'e göre seçilebilir iki malzeme bloğu yok. Vinç: K-37'ye göre seçilebilir blok yok ya da seçilebilir
   hiçbir bloğun (a) ya da (b) hedefi yok. Geri Al: son eylem K-39'a göre geri alınabilir bir sürükleme hamlesi değil. Yuva
   gri; **"+" gösterilmez ve satın alma penceresi açılmaz**; dokunuş yalnız nedeni söyleyen balonu açar
   (`booster.<ad>.noTarget`, metin STORY). Ön denetim (D3a) hedef durumunu etkilemez: yalnız oyuncunun dokunduğu hedefte
   uygulanır.
3. **Adet 0:** hedef var, envanterde 0 adet. "+" ve satın alma penceresi açılabilir (fiyat META §3.2, sunum UX).
4. **Hazır:** hedef var, adet ≥ 1.
Bölüm kazanıldığında ya da kayıp penceresi açıkken yuvalar kullanılamaz (K-39; sunum design-lead'in).
**Örnek:** Bölüm 8 başında Çekiç açılmıştır, 3 adet, K-36 hedefi Ağır Yük → hazır. Ağır Yük Çekiç'le kırıldıktan sonra
hedef kalmaz → hedefsiz (adet 2 olsa da gri, "+" yok). Bölüm 9'da (Ağır Yük, kasa, torba, zincir, moloz yok) Çekiç
yuvası bölüm boyunca hedefsizdir. Test "K-54 no purchase offer for booster without target".

---

## 11. Bölüm akışı, şekiller, veri

### K-43 Duraklatma, bölümden çıkma ve kaldığı yerden devam — YENİ (R-13; cezasız çıkış P-7 KABUL; Faz 2R: `movesSpent`)
**Kural:**
1. **Duraklatma:** hiçbir şey ilerlemez (G-H sayacı ve animasyonlar dahil). Tek istisna: G-L yönlendirme penceresi
   açıkken (düşüş/yükseliş sürerken) duraklatma pencereyi kapatır; blok yönlendirmesiz (daha önce yönlendirildiyse o
   haliyle) hemen iner ve hamle sonu çözümlemesi (K-35) duraklatma penceresi açılmadan biter (K-19 madde 1 (d), E-47).
   Gerekçe: duraklatma penceresindeki çıkış onayı `movesSpent`'i ve kaydı yarım kalmış bir hamleyle görmemelidir (madde
   2–3); ilk hamlenin düşüşünde açılan çıkış menüsü `movesSpent = 1` görür.
2. **Çıkış:** yalnızca oyuncunun onayıyla olur. `movesSpent ≥ 1` iken çıkış **kayıp** sayılır (1 can, seri sıfırlanır,
   Köprü'de elenme). `movesSpent = 0` iken çıkış cezasızdır (Faz 2R: ölçüt `m` değil `movesSpent`'tir, çünkü Söküm `m`'yi
   geri yükler ama `movesSpent`'i düşürmez; Söküm'le bölüm başı durumuna dönen oyuncu cezasız çıkamaz): ayrılan can iade edilir, oyun öncesi güçlendiriciler iade edilir, galibiyet
   serisi bonusu **tüketilmez** (bir sonraki girişte aynen verilir), seri bozulmaz.
3. **Kaldığı yerden devam (MVP):** uygulamanın kapanması, sistemin uygulamayı öldürmesi, telefon araması, sekme
   kapanması **kayıp değildir**. Kayıp yalnızca (a) onaylı çıkışla (`movesSpent ≥ 1`) ya da (b) K-29'da teklifin
   reddiyle olur.
   - Kayıt: bölüm başında ve her eylemden sonra (K-35 adım 12 bittiğinde) ve `pagehide`/`visibilitychange` anında
     `inLevel = { levelId, levelHash, rulesVersion, seed, actions[], offersUsed, adOfferUsed, offerSpendCoins,
     preBoosters, streakTier, outcomeWindow, tutorial }` yazılır (`levelHash`, `rulesVersion`, `offerSpendCoins` madde 4
     içindir). `actions[]` = sürükleme hamleleri (`drag.via` ve `steer` dahil), güçlendirici kullanımları, kabul edilen
     teklifler. `tutorial: { index, shown, count, actions }` = ekrandaki öğretici adımının konumu (`index` sıralı
     `tutorial[]` indeksi, `tutorial[]` uzunluğu = öğretici bitti; `shown` adım ekranda, false = `startOn` bekliyor;
     `count` adımın koşuluna sayılan olay; `actions` konumun içerdiği `actions[]` girdisi, `start` dahil); konum her
     değiştiğinde (sürükleme sinyali, hamle sonu, dokunuş, süre) yazılır; öğreticisiz bölümde ve eski kayıtta `null`.
   - Açılış: `inLevel` varsa oyun ana ekrana değil o bölüme döner; durum belirlenimci yeniden oynatmayla (ya da durum
     tamponundan) kurulur ve sonuç bit bit aynıdır. Ayrılan can ayrılmış kalır. Başka bölüm başlatılamaz.
   - Açılışta etkin öğretici adımı (Gösterim ya da Gizli durumu, `tut.ctx.*` işareti ve sayacıyla) aynen geri gelir; kayıtta
     konum yoksa (ya da konum bu bölümün öğreticisine uymuyorsa: indeks, sayaç ya da `actions` aralık dışı; `startOn`'suz adım
     `shown` false) adım hamle kaydından kurulur. Konumdan sonra kayda geçmiş eylemlerin (kapanış hamlenin efektleri
     oynarken geldiyse) yalnız hamle sonu olayları sayılır; devam kayıttaki adımdan ileri gitmez ve kayıtta olmayan bir
     sürükleme sinyali (iptal edilen sürüklemenin `overWall` / `gapPass`'ı, `holdOverBuild` süresi) varsayılmaz.
     Örnek (Faz 2R Bölüm 1): adım 1 (`tut.m.lift`, `placementCorrect`) etkinken oyuncu `b`'yi (5,0)'a doğru yerleştirir
     → adım 1 biter, adım 2 (`tut.m.useall`) başlar; oyuncu `a`'yı tutup duvar üstünden geçirir ve bırakmadan uygulama
     kapanır → sürükleme iptal sayılır; açılışta adım 2 etkin (`index` 1, `count` 0) ve tahta 1 hamle sonrası durumdadır.
     Adım 2 etkinken (Gizli) kapanırsa açılışta aynı adım Gizli durumda gelir ve 4 sn hareketsizlikte yeniden görünür
     (K-53 madde 3).
   - Sürükleme ortasında kapanma = o sürükleme iptal (K-07 satır 1). G-H sayacı ve animasyonlar sıfırdan başlar.
   - "Hamleler bitti" penceresi açıkken kapanırsa açılışta **aynı pencere** aynı teklif numarasıyla gelir (kaçış yolu
     yok); kazanma ekranındayken kapanırsa ödüller verilmiş sayılır.
   - Sallanan Köprü: devam eden bölüm süre dolduktan sonra biterse de sayılır (META §6.1, süre içinde başlatıldıysa).
4. **Güncellemeyle geçersiz kalan deneme:** Açılışta `inLevel`'in kaydedildiği bölüm verisi (`levelHash`) ya da kural
   sürümü (`rulesVersion`) uygulamadaki sürümden farklıysa deneme yeniden oynatılmaz ve **cezasız kapanır** (oyuncunun
   seçimi değil, oyunun değişikliği): deneme hiç oynanmamış sayılır. İade edilenler: ayrılan can, oyun öncesi
   güçlendiriciler, bu denemede kullanılan bölüm içi güçlendiriciler, bu denemede +5 tekliflerine ödenen altının tamamı
   (`offerSpendCoins`). Galibiyet serisi bonusu tüketilmez (sonraki girişte aynen verilir), seri bozulmaz. Geri
   verilmeyenler: izlenen reklamların günlük sayaçları ve kullanılmışsa ömür ilk teklif hediyesi (K-29). Sallanan
   Köprü'de deneme sayılmaz: elenme yok, tahta yok; iade edilen altın tur harcamasından (`bridgeSpendCapCoins` sayacı)
   düşülür. Usta Ligi'ne puan yazılmaz. Oyuncu ana ekrana döner ve aynı bölümü yeniden başlatabilir (yerel tanılama
   kaydı; analytics: `level_resume_invalid` gönderilir; altın iadesi > 0 ise `coin_source{reason: refund}` gönderilir;
   bu denemede `level_end`, `level_resume`, `life_lost`, `event_eliminated` gönderilmez — ANALYTICS §2; `level_resume_invalid` v2'den beri tabloda). Bu, K-43 madde 3'teki "kayıp yalnızca (a) ya da (b) ile olur" kuralının istisnası değildir:
   bu denemede kayıp da kazanma da yoktur (E-45).
**Örnek:** 3 hamle yapıldı, oyuncu çıkışı onaylar → can 5 → 4, seri 3 → 0. 1 hamle yapıldı, Söküm onu geri aldı (`m` = 0,
`movesSpent` = 1), oyuncu çıkar → kayıp. 3 hamle yapıldı, telefon çaldı, sistem
uygulamayı kapattı → açılışta aynı bölüm, kalan hamle ve tahta aynı; can ayrılmış, seri 3.

### K-44 Şekiller, yönelimler ve ağırlık — YENİ (Faz 2R)
**Kural:** Hücreler brif §5'teki 0° tanımından **saat yönünde** 90°'lik dönüşle üretilir ve kutunun sol alt köşesine
(0,0) normalize edilir (TECH_DESIGN §3.3 tablosu bağlayıcıdır). Simetrik eş kimlikler (`O4_90`, `D2_180` …) veride kabul
edilir ve kanonik kimliğe indirgenir. `I5_90`/`I5_270` bölüm verisinde yasaktır. Hikaye bölümüne göre izinli türler:
1 → B1, D2, O4, C3; 2 → + I3, L4, J4; 3 → + T4, S4, Z4; 4–5 → + I4.
**Ağırlık (Faz 2R):** (1) **Ağır Yük (Y5)** = I5 ve Q9, her yönelimde; malzeme değildir, renk taşımaz (verideki `color`
yok sayılır, renk kümesine girmez, K-31), duvar sınırını hiçbir kipte geçemez, yalnız **saha içinde** taşınır: her ara
konumda bütün hücreleri x ≤ Wy−1 ve y ≤ Hy−1'dir, saha üstü havaya ve Vinç Alanı'na kalkmaz (K-08; bırakması kaydırma
hamlesidir). Çekiç yok eder (K-36). 8. bölümden itibaren her hikaye bölümünde kullanılabilir. **Sunum olayı
`blockedCargo { pieceId }`:** Ağır Yük tutulurken parmak hedefi `p` (K-08) ilk kez saha dışına (x ≥ Wy ya da y ≥ Hy)
çıktığında, tutuş başına en çok 1 kez yayınlanır (sunum design-lead'in). Oyuncuya görünen metinde Ağır Yük'e "blok"
denmez; kalan blok sayısına girmez (K-48). (2) Diğer bütün şekiller **malzeme
bloğu**dur ve bölüm verisindeki yönelimin genişliği ≤ Ws olmalıdır (`piece_too_wide`): oyuncu döndüremediği için daha
geniş bir yönelim hiçbir yere yerleşemez ve tam örtüyü bozardı. Böylece `w ≥ 3` yönelimler (`L4_90` …) yalnız
Ws ≥ 3 olan bölümlerde ve tür açıldıktan sonra kullanılır; önceki "8. bölümden önce kullanılamaz" sınırı yalnız I5/Q9
için kalır. Vinç (K-37) yalnız şantiyede doğru konum hedefi için döndürür; bu yüzden Ws'den geniş bir yönelim sahada
hiçbir zaman oluşmaz.
**Örnek:** `C3_90` hücreleri (0,0)(0,1)(1,1) → görünüm `XX / X.` (üst satır solda). Bölüm 5'te `I3_0` → hata
`shape_locked`. Ws = 2 bölümde `L4_90` W → `piece_too_wide`; Ws = 3 bölümde (hikaye bölümü 2+) geçerli. Bölüm 8'de
`Q9_0` → Ağır Yük, renk yazılsa da yok sayılır.

### K-45 Bölüm verisi doğrulama kuralları — YENİ (Faz 2R)
**Kural:** `npm run levels:validate` (madde 1–8, 10) ve `npm run levels:solve` (madde 9) her bölüm için aşağıdakileri
denetler; her madde ayrı hata kodudur (TECH §8.3 `code` adları buna birebir eşitlenir; code-lead uygular). **Yeni** =
Faz 2R'de eklendi, **değişti** = anlamı Faz 2R'de değişti.
1. Şema (TECH_DESIGN), `id` 1–50, `chapter = ceil(id/10)`. `seed` verilmemişse `seed = id × 1000 + id` (ör. 4004).
   **Yeni:** `yard.cols`, `yard.rows`, `site.cols`, `site.rows` alanları (isteğe bağlı; yoksa 6, 8, 2, 8).
2. **Boyut (yeni, K-49):** `size_out_of_range` (Wy 3–6, Hy 4–8, Ws 2–3 hikaye bölümü 1–3'te, 2–4 hikaye bölümü 4–5'te,
   Hs 4–8); `board_too_wide` (Wy + Ws > 8). **Saha (değişti, K-02):** `yard_fill_high` (E < 2), `yard_fill_low`
   (E > ⌊0,4·Wy·Hy⌋); `overlap`; `out_of_yard` (parti-0 hücreleri x ≤ Wy−1, y ≤ Hy−1).
3. Duvar: `0 ≤ height ≤ H` (değişti); geçitler K-04 kısıtları (`gap_touches_top`, `gap_overlap`); `paint` geçidinde
   `color`, `locked` geçidinde var olan `keyId`; `shutter` için `period ≥ 1`, `0 ≤ phase < 2·period`; `slider` için
   `0 ≤ range[0] < range[1]`, `range` geçidin `y`'sini içerir ve `range[1] + size ≤ height − 1` (`slider_range`); kayar
   kapının kapsadığı bütün satırlar (`range[0] … range[1] + size − 1`) diğer geçitlerle örtüşmez (`gap_overlap`).
4. Plan (değişti): `plan_size` (her dilim tam Hs satır, her satır tam Ws karakter); `plan_has_window` (`.` yasak,
   R2-01); renk sayısı ve açılmış renkler (K-31: `too_many_colors`, `color_locked`); `?` kuralları (K-32,
   `hidden_invalid`); asansörde `Hs + b ≤ 8` (`elevator_overflow`, K-24).
5. Şekiller ve ağırlık (K-44): `shape_forbidden`, `shape_locked`, **`piece_too_wide`** (yeni: malzeme bloğu genişliği >
   Ws); bayrak birleşimleri (K-21, OBSTACLES matrisi; `flag_combo_forbidden`).
6. Saklı nesneler başta örtülü (K-42, `hidden_item_exposed`); `collect`/`clear` sayıları ≤ nesne sayısı (K-41).
7. Moloz (değişti, OBSTACLES S4): şantiye alanında (x ≥ Wy, şeklin bütün hücreleri) ve ait olduğu dilimin plan alanında
   durur, molozlar çakışmaz (`debris_misplaced`); başlangıç konumunda K-16'ya göre **doğru olamaz**
   (`debris_correct_at_start`); moloz malzeme arzına sayılır (madde 8). `segment` isteğe bağlıdır, verilmezse 0.
8. **Tam örtü (yeni, K-47):** `cover_mismatch` (renk başına toplam arz ≠ toplam talep; W6 boya kapılı bölümde toplam
   hücre sayısı); `cover_prefix_short` (`segments` kipinde, W6'sız bölümde, bir dilim k ve renk c için birikimli arz <
   birikimli talep); **`untileable`** (Faz 2R, CL-2R-09; error): başlangıç durumunda D3a (K-30) "çıkmaz" der. D3a
   "bilinmiyor" derse bu kod üretilmez, karar madde 9'daki solver'ındır.
9. **Solver (değişti):** `unsolvable`; `unused_block` (çözümün sonunda kullanılmamış malzeme bloğu — K-47 madde 3);
   `moves_budget` (moves, K-52 aralığının dışında); `yao_low` (YAO < 0,60, K-46); **bulmaca (yeni, K-51):**
   `puzzle_first_reachable` (id ≥ 3 ve `firstNeedDepth = 0`), `puzzle_no_shift` (id ≥ 3 ve `minShifts = 0`),
   `trap_in_easy` (Kolay/Normal ve `trapCount > 0`; error), `trap_warn` (Zor/Çok Zor ve `trapCount > 0`; warn),
   **`trap_scan_incomplete`** (Faz 2R, CL-2R-09; warn): tarama kapsamı K (K-50 madde 8) solver'ın belirlenimci açılım
   bütçesiyle tamamlanamadı; `trapCount`, `deadRate` ve D3b tablosu eksiktir. Kolay/Normal bölümde bu uyarı varken bölüm
   LEVEL_REPORT'ta kırmızı listelenir ve LEVELS'taki bölüm kaydına product-lead "tarama eksik — kabul" notu (gerekçe +
   elle denetlenen tuzak kaynakları, LEVELS §2.0 madde 4) yazılana kadar yayına girmez (K-51 madde 2).
   `metric_out_of_band` (K-50 ölçütlerinden biri LEVELS hedef aralığının dışında; warn), `batch_queued` (kanonik
   çözümde bir kamyon bloğu kuyrukta bekliyor; warn). **Bilinçli uyarılar:** bölüm verisine alan açılmaz; gerekçe
   LEVELS'taki bölüm kaydına yazılır ve uyarı code-lead'in `tools/levels-allow.json` dosyasında bölüm bölüm susturulur
   (ör. `{ "10": ["batch_queued"] }`; Bölüm 10 dilim 2'nin bilinçli kuyruğu, E-54).
10. Öğretim: bir bölümün mekanik kümesi veriden türetilir (OBSTACLES "Veri imzası" tablosu; yalnızca imzası tanımlı
   mekanikler). Bölümde, önceki bölümlerin kümelerinde olmayan **en çok 1** mekanik vardır (`too_many_new_mechanics`).
   `teaches` isteğe bağlıdır; verilmişse türetilen yeni mekaniğe eşit olmalıdır (`teaches_mismatch`). Engel olmayan
   öğretimler (kaldır–taşı–indir, gölge, kazı, taşınan malzeme, güçlendirici açılışı) yalnızca `tutorial` adımlarıyla
   ifade edilir. **Öğretici (yeni, K-53):** `tut_too_many_steps` (> 2 adım), `tut_blocking` (`mode` `"soft"` dışında
   bir değer ya da spot ışığı alanı), `schema_invalid` (`done` ya da `startOn` içinde `timeoutMs`, CL-2R-10),
   **`tut_hand_invalid`** (Faz 2R, DL-2R-01): `drag`/`hold` eldiveni §14 "`hand.path` anlamı" kuralını bozuyor
   (`path[0]` vurgulu bloğun hücresi değil, ara konum `R` dışında ya da son konum iptal veriyor; `drag`'in son konumu
   en kısa çözüm hamlesi değil). Denetim kanonik çözüm üzerinde, adımın başladığı durumda yapılır (LEVELS §5).
**Örnek:** Bölüm 9 (LEVELS §2: H = 6, `height 4`, dar geçit `y=0, size=1`) geçidi varsayımsal olarak `y=3`'e taşınırsa →
3+1 > 3 → `gap_touches_top`. Bölüm 4'e `size=1` geçit konursa türetilen yeni mekanikler {W1, W3} olur →
`too_many_new_mechanics`. Bölüm 3'te `O4` G sahanın en üstüne konursa başta doğru yerleşim mümkün olur →
`puzzle_first_reachable`. Bölüm 2'de saha 4×4 ve bloklar 10 hücre iken bir `B1` eklenirse E = 5 kalır ama arz 11 > talep
10 → `cover_mismatch`.

### K-46 YAO (Yukarı–Aşağı Oranı) — YENİ (brif §4.11; Faz 2R notu)
**Kural:** YAO = (serbest kipte şantiyeye girip doğru yerleşen sürükleme hamleleri) / (bütün doğru yerleşen sürükleme
hamleleri). Balon yükselişi ve hafif yerçekimi yönlendirmesi "duvar üstü" sayılır; ray yerleşimi "geçit" sayılır;
Vinç, Altın Mala, Kamyon Yardımı ve Söküm sayılmaz. Bölüm ölçütü solver'ın kanonik en kısa çözümü (K-50 madde 4)
üzerindendir; eşit hamleli çözümler arasında YAO'su en yüksek olan alınır. Her bölümde YAO ≥ 0,60 (`yao_low`). Tam
örtüde paydadaki yerleşim sayısı bölümdeki malzeme bloğu sayısı N'dir (her blok tam bir kez yerleşir). Oyuncunun YAO'su
`level_end` analytics olayına yazılır.
**Örnek:** Bölüm 4: 5 doğru yerleşim: 4 duvar üstü, 1 ray → YAO 0,80. Bölüm 9: 4 yerleşim, 1 ray → 0,75.

---

## 11A. Faz 2R: tam örtü, boyut, bulmaca ölçütleri, hamle bütçesi, öğretici

### K-47 Tam örtü: arz = talep — YENİ (Faz 2R, R2-01)
**Kural:**
1. **Eşitlik:** her renk c için, bölümün bütün partilerindeki (parti 0 ve kamyon partileri) ve molozundaki malzeme
   bloklarının c renkli hücre toplamı = bütün dilimlerin c renkli plan hücresi sayısı (`?` çözülmüş rengiyle). Ağır Yük
   (Y5) sayılmaz. Boya Kapısı (W6) olan bölümde eşitlik toplam hücre sayısında aranır, renk bazındaki eşitliği solver'ın
   çözümü kanıtlar. Bozulursa `cover_mismatch`.
2. **Birikimli koşul (`segments`, W6'sız):** her dilim k ve renk c için, dilim 0…k'nın c talebi ≤ parti 0…k'nın ve dilim
   0…k molozunun c arzı (`cover_prefix_short`). `carousel`'de yalnız madde 1.
3. **Şaşırtma yok:** her malzeme bloğu solver'ın çözümünde tam bir kez doğru yerleşir; çözüm sonunda kullanılmamış blok
   kalırsa `unused_block` (madde 1'in sonucudur; ayrıca denetlenir).
4. **Taşınan malzeme:** bir partinin blokları yalnız kendi dilimine ait değildir; sonraki dilimin bloğu daha önceki
   partide gelebilir (LEVELS §2.0 "taşınan malzeme").
5. **Korunum:** hiçbir kural, güçlendirici ya da engel oyun sırasında malzeme bloğu yaratmaz ya da yok etmez (Çekiç
   K-36, Vinç K-37, Altın Mala K-33, Boya Fırçası K-38, Geri Al K-39, Kamyon Yardımı/Söküm K-30, cam S3 ve kamyon K-25
   buna göre tanımlıdır). Bu yüzden her durumda kalan toplam arz = kalan toplam talep; renk bazında da eşittir (W6'lı
   bölüm hariç: orada renk dengesi boyamayla kurulur; istenmeyen boyama döşenemez bir durum üretirse jokerli K-30 D3a
   onu yakalar ve Söküm'e gider; D2 W6'lı bölümde çalışmaz). Test: rastgele 10 000 hamle dizisinde her adımda
   `Σ arz = Σ talep` ("K-47 conservation").
**Örnek:** Bölüm 3: plan Y 4, W 2, G 4 hücre; bloklar `D2_0` Y (2) + `D2_90` Y (2), `D2_0` W (2), `O4` G (4) → eşit.
Bir `D2_90` Y daha eklenirse Y arzı 6 > 4 → `cover_mismatch`.

### K-48 Kazanma koşulu: tam kullanım — YENİ (Faz 2R, R2-01)
**Kural:** Bölüm, hamle sonu adım 11'de (ya da güçlendirici/Mala mini hattının 11. adımında) şu üçü birlikte
sağlanınca kazanılır: (1) bütün dilimler tamam (K-15); (2) bütün ek hedefler tamam (K-41); (3) sahada, kamyon
kuyruğunda, teslim edilmemiş partilerde ve elde (tutulan blok) **hiç malzeme bloğu yok**. Ağır Yük, Ahşap Kasa ve
Çimento Torbası malzeme değildir, sahada kalabilir. K-47 madde 5 gereği (1) sağlanınca (3) kendiliğinden sağlanır; (3)
yine de ayrı denetlenir (bozuk veride kazanma olmaz). K-28 bu kuralı kullanır.
**Örnek:** Bölüm 8: son `D2_90` W doğru yerleşir; sahada yalnız `Q9_0` Ağır Yük kalır → kazanılır. Test fikstürü (bozuk
veri): plan tamam ama sahada bir `B1` kaldı → kazanılmaz (doğrulayıcı zaten `cover_mismatch` verir).

### K-49 Değişken boyutlar — YENİ (Faz 2R, R2-02)
**Kural:** Bölüm verisi `yard: { cols, rows, batches }` ve `site: { cols, rows }` taşır (Wy, Hy, Ws, Hs; alan
yazılmazsa 6, 8, 2, 8). Sınırlar:
- code-lead yerleşim kısıtı (R2-02, `board_too_wide` / `size_out_of_range`): Wy + Ws ≤ 8 (hücre 120 px korunur), Hy ve
  Hs 4–8, Ws 1–4, tahta yüksekliği H ≤ 8.
- product-lead aralıkları (`size_out_of_range`): Wy 3–6; Ws 2–3 (Bölüm 1–30), 2–4 (Bölüm 31–50); Hy 4–8; Hs 4–8. Ws = 1
  MVP'de kullanılmaz (tek sütunda şekil kararı yoktur). Ws ≥ 3 imzası S9 Geniş Şantiye'dir (OBSTACLES; ilk kullanım Faz
  3'te hikaye bölümü 2+, çünkü 3 renk sınırında 3 sütunlu tuzaksız döşeme kurulamadı — LEVELS §2.0).
- Türetilen: `H = max(Hy, Hs + eMax)`; Vinç Alanı y = H, H+1; duvar `height` ≤ H; Hy < H ise saha üstü hava, Hs + e < H
  ise şantiye üstü hava (§0). Duvar sınırı x = Wy−1 | Wy.
- Her bölümün boyut seçimi LEVELS §2 tablosunda gerekçelendirilir (ölçüt: K-02 doluluk bandı, kazı alanı, istenen
  "yukarı" yüksekliği).
**Örnek:** Bölüm 4: Wy=4, Hy=4, Ws=2, Hs=6 → H=6, tahta 6×6, Vinç Alanı y=6–7; duvar sınırı x=3|4; şantiye x=4–5; saha
üstü hava y=4–5 (x 0–3). Wy=6, Ws=3 → `board_too_wide`.

### K-50 Bulmaca ölçütleri (tanımlar) — YENİ (Faz 2R, R2-03)
**Kural:** Solver (`levels:solve`, code-lead) her bölüm için aşağıdakileri hesaplar ve LEVEL_REPORT'a yazar. Hesap
Kamyon Yardımı/Söküm, güçlendiriciler ve Altın Mala **kapalıyken**, yalnız sürükleme hamleleriyle ve hamle sınırı
olmadan yapılır; "durum" K-43'teki belirlenimci oyun durumudur (`m`'ye bağlı zamanlayıcılar dahil). Hedef aralıklar
bölüm başına LEVELS §2'dedir; zorunlu alt sınırlar K-51'dedir.
1. **Kaydırma hamlesi (kazı):** K-07 satır 2 sonucunu veren sürükleme (Ağır Yük taşıma dahil). **Yerleşim hamlesi:**
   K-07 satır 6–7 sonucu K-16'ya göre doğru olan sürükleme. Hatalı yerleşim ve iptal çözüm hamlesi değildir.
2. **Çözüm:** başlangıçtan K-48 kazanmasına giden sürükleme dizisi. **`min`** = en kısa çözümün hamle maliyeti (K-07:
   taban + cezalar; her hamle kendi maliyetiyle). Tam örtüde her malzeme bloğu tam bir kez yerleşir; cam/harç cezası
   olmayan bölümde `min = N + minShifts` (N = malzeme bloğu sayısı) kendiliğinden tutar.
3. **`minShifts` (Faz 2R: ayrı arama):** bütün çözümler üzerinde en az kaydırma hamlesi sayısı; kaydırma hamlesinin
   maliyeti 1, yerleşim hamlesinin 0 olduğu en kısa yol (0-1 BFS). `min` ile `minShifts` farklı çözümlerden gelebilir
   (cam ya da harç cezalı bölümde en az kaydırmalı çözüm en kısa çözüm olmayabilir); rapor ikisini de yazar.
   **`shiftsBySegment`:** kanonik çözümdeki kaydırmaların dilimlere dağılımı.
4. **Kanonik en kısa çözüm:** en kısa çözümler arasında önce YAO'su en yüksek olan (K-46); kalan eşitlikte her adımda
   hamle sırası duvar üstü yerleşim < ray yerleşimi < kaydırma, sonra şu demetin sözlük sırası: (tür adı alfabetik
   dizge olarak — `B1` < `C3` < `D2` < `I3` < `I4` < `I5` < `J4` < `L4` < `O4` < `Q9` < `S4` < `T4` < `Z4`; açı sayısal —
   0 < 90 < 180 < 270; renk `W Y G R O C B P` sırasıyla; başlangıç çapası x, y; hedef çapa x, y — sayısal). Golden test
   ve LEVELS el çözümü bununla karşılaştırılır.
5. **İlk gereken bloklar `F0`:** bölüm başındaki şantiye durumunda K-16'ya (K-34 dahil) göre doğru bir konumu olan
   malzeme blokları; erişim, duvar ve geçit yok sayılır (yalnız renk, şekil ve sütun doluluğu).
   **`firstNeedDepth`** (ilk gereken bloğun derinliği): başlangıçtan **yalnız kaydırma hamleleriyle**, en az bir doğru
   yerleşim hamlesinin (herhangi bir blokla) mümkün olduğu bir duruma ulaşmak için gereken en az hamle sayısı. 0 = bölüm
   başında bir blok doğrudan doğru yerleştirilebilir.
6. **Örtü sayısı `cover(b)`** (statik, tasarım ve sunum yardımı): b'nin her sütununda b'nin o sütundaki en üst
   hücresinin üstündeki saha hücrelerini kaplayan farklı parçaların (malzeme, Ağır Yük, kasa, torba) sayısı.
   **`firstNeedCover`** = F0 blokları üzerinde en küçük `cover`.
7. **Çıkmaz durum:** hiçbir sürükleme dizisiyle (hamle sınırı olmadan) K-48'e ulaşılamayan durum. **✓-tuzağı:**
   çıkmaz olmayan bir durumdan bir doğru yerleşim hamlesiyle (ya da boya kapısından geçen hamleyle) girilen çıkmaz durum.
8. **Tarama kapsamı `K`:** başlangıçtan doğru yerleşimler + en çok `minShifts + 1` kaydırma hamlesiyle ulaşılan bütün
   durumlar. **`trapCount`** = K içindeki ✓-tuzağı geçişlerinin sayısı. **`deadRate`** = K içinde çıkmaza giden doğru
   yerleşim geçişleri / K içindeki bütün doğru yerleşim geçişleri (0–1).
9. **Seçenek sayısı:** kanonik çözümün k'inci durumunda (k = 0, 1, 2): **`choices@k`** = tek bir sürükleme hamlesiyle
   ulaşılan, tahtası değişmeyen hatalı yerleşim ve iptal hariç, hamle bütçesinin kalanıyla hâlâ kazanılabilir
   durumların sayısı; **`bestChoices@k`** = bunlardan en kısa çözümde kalan (kazanmaya uzaklığı 1 azalan) durumların
   sayısı.
   **Sayım kuralları (Faz 2R, CL-2R-07; `trapCount`, `deadRate` ve `choices@k` için ortak):** (a) **Birim** = farklı
   (durum, sonraki durum) Zobrist çifti. Aynı sonraki duruma giden iki sürükleme (özdeş iki blok, farklı yol, farklı
   tutma hücresi) 1 sayılır. (b) **Bütçe** = bölüm JSON'undaki `moves`; JSON henüz yoksa `moves = min + T` (K-52, `a =
   0`). Bu, `a`'nın solver'dan sonra bulunmasından doğan döngüyü kırar; `a` değişince ölçüt yeniden hesaplanır. (c)
   **Saha konumları:** saha yerçekimi kapalıyken (`gravity.yard = false`) K-07 satır 2'yi veren her erişilebilir saha
   konumu — altı boş, asılı konumlar dahil — ayrı bir seçenektir; açıkken sonraki durum yerçekimi sonrası durumdur.
10. **YAO:** K-46.
**Örnek:** Bölüm 3 (LEVELS §2): N = 4, `minShifts` = 1 → `min` = 5; F0 = {`a` `D2_0` Y, `b` `D2_0` W}, ikisi de `O4` G'nin
altında → `firstNeedDepth` = 1, `firstNeedCover` = 1; `trapCount` = 0, `deadRate` = 0; `choices@0..2` = 6, 9, 10;
`bestChoices@0..2` = 3, 1, 1; YAO = 4/4.

### K-51 Bulmaca zorunlulukları — YENİ (Faz 2R, R2-03)
**Kural (solver aşaması doğrulayıcısı):**
1. Bölüm id ≥ 3: `firstNeedDepth ≥ 1` (`puzzle_first_reachable`) ve `minShifts ≥ 1` (`puzzle_no_shift`). Bölüm 1–2
   öğreticidir ve 0 olabilir.
2. Kolay ve Normal: `trapCount = 0` (`trap_in_easy`, error). Zor ve Çok Zor: `trapCount > 0` serbesttir
   (`trap_warn`, warn) ve `deadRate` LEVELS bandında olmalıdır. **Tarama eksikse** (`trap_scan_incomplete`, K-45 madde
   9) bölüm yalnız LEVELS kaydında product-lead'in "tarama eksik — kabul" notuyla yayına girer. **Söküm bedeli (Faz 3
   bot ölçümü, EN-2R-07):** Zor ve Çok Zor bölümde orta botun deneme başına Söküm sayısının medyanı ≤ 1,0 olmalıdır
   (LEVEL_REPORT sütunu "Söküm / deneme"); aşılırsa önce T 1 artırılır (K-52 tablosunun dışına çıkılmaz, `a` ile), yine
   aşılırsa tuzak kaynağı kaldırılır.
3. K-50'nin her ölçütü LEVELS §2 (Faz 3'te §3) hedef aralığında olmalıdır; dışındaysa `metric_out_of_band` (warn) ve
   bölüm product-lead'e geri döner.
4. YAO ≥ 0,60 (K-46).
**Örnek:** Bölüm 3'te `O4` G sahanın sağ altına, `D2_0` Y ile `D2_0` W üstte açık konursa `firstNeedDepth` = 0 →
`puzzle_first_reachable`. Bölüm 3 taslağının ilk sürümünde `O4` W planı ile `D2_0` W aynı renkteydi → `trapCount` = 20 →
`trap_in_easy` (LEVELS §2.0 "tuzak kaynağı").

### K-52 Hamle bütçesi — YENİ (Faz 2R, R2-04)
**Kural:** `moves = min + T + a`. `min` solver sonucudur (K-50; LEVELS'taki el çözümü değil). Tampon `T`:

| Zorluk | T | Taban (moves − min en az) |
|---|---|---|
| Kolay | max(6, ⌈0,50 · min⌉) | 4 |
| Normal | max(4, ⌈0,35 · min⌉) | 3 |
| Zor | max(3, ⌈0,20 · min⌉) | 2 |
| Çok Zor | max(2, ⌈0,12 · min⌉) | 1 |

**Tanıtım bölümü (Faz 2R, DL-2R-05):** `teaches` alanı dolu bölümde (yeni bir veri imzası öğreten bölüm, K-45 madde 10)
T ve taban **bir alt zorluğun** satırından alınır (Normal → Kolay, Zor → Normal, Çok Zor → Zor; Kolay değişmez). Zorluk
etiketi (ödül, kumbara, rozet) değişmez. Gerekçe: yeni mekanikle ilk karşılaşmada tipik hata 2 hamledir (1 hatalı
yerleşim + 1 gereksiz kazı); Normal tabanı 4 bunun yarısını yer.
Ayar `a`: "orta" bot (500 oyun, seri kademe 0; Altın Mala'yı kazandığı anda bir sonraki gömülü gereken blokta kullanır,
güçlendirici kullanmaz, K-34 kanca 5 ipuçlarını görmez) hedef kazanma bandına (LEVELS §1) göre seçilir;
`|a| ≤ max(1, ⌊0,1 · min⌋)` ve `moves − min ≥ taban`. Doğrulayıcı: `moves_budget` (aralık dışı). **`a` yetmezse
(CL-2R-15):** `a` sınırına ve tabana dayandığı hâlde bot oranı bandın üstündeyse bölüm yeniden tasarlanır (`minShifts`
en az 1 artırılır ya da Altın Mala'nın atlattığı kazı derinliği azaltılır); bandın altındaysa yine yeniden tasarlanır
(kazı ya da tuzak kaynağı azaltılır). Usta Serisi eşiği (`combo.correctPlacementsPerTrowel` = 4) bölüm başına
değiştirilmez. Gerekçe: oyuncunun israfı (gereksiz kaydırma, hatalı
bırakma) bölüm uzunluğuyla büyür; eski sabit tampon (Çok Zor +2) 36 hamlelik bölümde %5,5'lik pay bırakıyordu. Taban
kısa bölümleri affedici tutar.
**Örnek:** Bölüm 3: min 5, Kolay → T = max(6, 3) = 6 → 11 (a = 0). Bölüm 10: min 13, Zor → T = max(3, ⌈2,6⌉) = 3 → 16;
bot oranı %60 çıkarsa a = −1 → 15 (|a| ≤ max(1, 1) = 1; 15 − 13 = 2 ≥ taban 2); oran a = −1 ile de bandın üstündeyse
bölüm yeniden tasarlanır. Bölüm 5 (Normal, `teaches: "S1"`): min 11 → Kolay satırı T = max(6, ⌈5,5⌉) = 6 → 17; taban 4.

### K-53 Öğretici: hafif ve kilitlemez — YENİ (Faz 2R, R2-10)
**Kural:**
1. Bölüm başına `tutorial[]` en çok **2** adımdır (`tut_too_many_steps`).
2. **Hiçbir adım girdiyi kilitlemez:** `mode` isteğe bağlıdır ve yalnız `"soft"` olabilir (yazılmazsa `"soft"`;
   başka değer → `tut_blocking`); spot ışığı, karartma ve "yalnız vurgulu bloğa dokunulabilir" kısıtı yoktur. Oyuncu her
   bloğa, güçlendiriciye ve menüye dokunabilir.
3. Adım **yalnız** `done` olayı (§14.1 madde 3 sözlüğü, süzgeçleriyle) gerçekleşince **biter**. `timeoutMs` Faz 2R'de
   geçersizdir (şema reddeder, `schema_invalid`). Görünürlük — el/eldiven animasyonu ve kısa konuşma balonu; doğru
   eylemden sonra ya da 4 sn hareketsizlikten sonra gizlenme, yeniden hareketsizlikte yeniden belirme — sunumdur
   (design-lead; süreler `tokens.tutorial.*`). **Gizlenme adımı bitirmez**; gizliyken de girdi serbesttir. Bir adım
   **etkindir** = başlamış ve bitmemiştir (Gösterim ya da Gizli durumunda).
4. Bağlamsal `tut.ctx.*` satırları da aynı hafif biçimdedir ve oyunu kilitlemez; bir adım etkinken (Gösterim ya da Gizli)
   gelen bağlamsal satır kuyruğa girer ve adım bitince gösterilir. Tek istisna Söküm satırıdır (`tut.ctx.teardown` ve
   nedene göre metinleri, K-30): kuyruğa girmez, hemen gösterilir.
5. K-43 devam kaydı (`inLevel.tutorial`) değişmez.
6. **Tekrar oynanış (Faz 2R):** oyuncunun kaydında bölüm `won = true` ise (§14 "Kayıt, bölüm başına") o bölümün
   `tutorial[]` adımları gösterilmez (1–10 tekrar döngüsü ve Usta Modu dahil, META §8.5, §10). Bağlamsal satırlar kendi
   `seenContextTips` kuralına bağlıdır.
**Örnek:** Bölüm 3 adım 1 (`piece:2` = `c`, `done: { event: yardMove, piece: 'piece:2' }`) etkinken oyuncu `d`'yi
(`D2_90` Y, (2,0)) sahada (2,1)'e kaydırır → `yardMove` olur ama süzgeç tutmaz, adım sürer; 4 sn hareketsizlikte el
yeniden görünür. Oyuncu `c`'yi (1,2)'ye kaydırınca adım biter, adım 2 (`tut.m.free`) başlar. Oyuncu Bölüm 3'ü kazanıp
yeniden oynarsa hiçbir adım gösterilmez. Testler "K-53 step done ignores other piece", "K-53 no tutorial on replay".

## 12. K-35 Hamle sonu çözümleme hattı — YENİ (Faz 2R: adım 12, sayaç 0 dahil)

**Kural:** İptal edilmeyen her bırakma aşağıdaki adımları **bu sırayla**, her adım bir kez (6. adımın iç döngüsü hariç)
çalıştırır. Adım numaraları TECH_DESIGN §6.2 ile aynıdır. Aynı adımda birden fazla nesne etkilenirse işlem sırası:
satır küçükten büyüğe, aynı satırda x küçükten büyüğe (y, x sıralı tarama).

| Adım | İş | Kurallar |
|---|---|---|
| 0 | Bırakma sınıflandırması (K-07 tablosu). İptalse **dur**: hiçbir şey değişmez. | K-05, K-07 |
| 1 | Blok bırakma konumuna taşınır. Sürüklemede blok bir Boya Kapısı'nın ray kipine **girdiyse** (en az bir hücresi sınırı o geçidin satırlarında geçtiyse; yarım girip geri çıkmak dahil) blok boyanır; birden çok boya kapısına girildiyse **son girilenin** rengi geçerlidir, `drag.via` = son girilen boya kapısının geçit indeksi (W6, S-21). G-H zorla bırakması sıradan bırakmadır. | K-10–K-12, W6 |
| 2 | Şantiyede serbest kipteyse: rüzgâr kayması (W8) → düşüş ya da balon yükselişi (S8) → G-L yönlendirmesi (`steer`, K-19) → iniş. Cam (S3) d > eşikse kırılır, K-17 hedefine döner, adım 3 atlanır. Sahada bırakılan balon burada yükselir. | K-11, K-19, W8, S3, S8 |
| 3 | Şantiyedeyse doğrulama: doğru → kilitle, `?` aç, seri +1, gerekirse Altın Mala; hatalı → harçlı blok yapışır (Y8), değilse geri seker (K-17), seri 0. | K-14, K-16, K-17, K-32, K-33, K-34, Y8 |
| 4 | Maliyet: sayaç − (taban + cam cezası), en az 0; taban 1 (yapışmış harçlı blokta 2), cam kırıldıysa +1; maliyetler toplanır (yapışmış harçlı cam kırılırsa 3). `m += 1`. | K-07 |
| 5 | Komşu etkileri: taşınan bloğun **başlangıç** hücrelerinin 4-komşusu (komşuluk duvar sınırını aşmaz, §0) olan kasa 1 kat kaybeder (Y1), torba yırtılır (Y2), zincirli bloğun zinciri kalkar (Y3); her engel bu hamlede en çok 1 kez etkilenir. Ardından saklı nesne denetimi #1 (K-42). | Y1, Y2, Y3, K-42 |
| 6 | Saha yerçekimi: torbalar her zaman, diğer bloklar Y6 açıksa düşer; balonlar Y6 açıksa yükselir (K-20). Her tur iki **yarım adımdır** (R-02): (a) **düşme yarısı** — balonlar katı sayılır, bütün desteksiz blok ve torbalar aynı anda 1 satır iner; (b) **yükselme yarısı** — diğer her şey katı sayılır, tutulmayan bütün balonlar aynı anda 1 satır çıkar. Hareket kalmayınca biter; aynı boş hücreyi hedefleyen düşen blok ve balon arasında boşluk kalmaz (E-33). Düşen her bloğun düşüş öncesi hücrelerine komşu engeller 5. adım kuralıyla etkilenir (bu hamlede daha önce etkilenen etkilenmez). Bir torba yırtıldıysa ya da kasa yok olduysa yerçekimi yeniden çalışır; değişiklik kalmayınca biter. Saklı nesne denetimi #2. | K-20, Y2, Y6, S8 |
| 7 | Hedef sayaçları güncellenir. | K-41 |
| 8 | Aktif (ya da öndeki) dilim tamamlandıysa: `segments` → kayma ve sonraki dilim; `carousel` → ön dilim sıradaki tamamlanmamış dilim, `t = 0`. Sıradaki parti kamyon kuyruğunun sonuna eklenir. | K-22, K-23, K-25 |
| 9 | Teslimat: kuyruktaki bütün bloklar FIFO sırasıyla birer kez denenir. | K-25, K-26 |
| 10 | Zamanlayıcılar, bu sırayla: Kepenk (W4) → Kayar Kapı (W5) → Döner Platform sayacı (S5; bu hamlenin 8. adımında ön dilim tamamlandıysa artmaz, K-23) → Asansör (S6) → Islak Beton (Y4; bu hamlenin 9. adımında teslim edilen bloklar hariç) → Açık Kepenk süresi (K-40). | W4, W5, S5, S6, Y4 |
| 11 | Kazanma (K-28) → değilse hamle bitti mi (K-29); bittiyse pencere adım 12'den **sonra** açılır. | K-28, K-29 |
| 12 | Bölüm kazanılmadıysa (Faz 2R: sayaç 0 iken de) kilitlenme denetimi ve Kamyon Yardımı (K-30): sayaç > 0 iken D1 → D2 → D3; sayaç 0 iken D2 → D3; D1 yeniden dizme, D2/D3 → Söküm; blok teslimatı yok. Sonra, sayaç 0 ise K-29 penceresi açılır. +5 teklifi kabul edildiğinde hamle olmadan yalnız D1 (ve D1 yardım yaptıysa D3) bir kez çalışır (K-29). | K-29, K-30 |

**Sıranın gerekçesi**
1. **Komşu etkileri (5) yerçekiminden (6) önce:** yırtılan torba ve kırılan kasa aynı hamlede boşluk açar, yerçekimi
   bunu hemen doldurur; oyuncu tek hamlede tek "zincirleme" görür.
2. **Yerçekimi (6) teslimattan (8–9) önce:** kamyon blokları oturmuş bir sahaya düşer; teslimat düşüşü sahayı yeniden
   oynatmaz, böylece aynı hamlede ikinci zincirleme olmaz.
3. **Dilim tamamlama (8) zamanlayıcılardan (10) önce:** döner platform tamamlanmış dilimi öne getirmez, asansör yeni
   dilimin çerçevesini oynatır; oyuncu yeni dilimi zamanlayıcı ilerlemiş haliyle görür.
4. **Zamanlayıcılar (10) teslimattan sonra:** yeni gelen ıslak blok sayacının tamamını korur; sonraki hamlenin başında
   görülen geçit/çerçeve durumu kesindir.
5. **Kazanma (11) kaybetmeden önce:** son hamlede biten bölüm kazanılır. Kazanma zamanlayıcılardan etkilenmez, ama
   kilitlenme (12) zamanlayıcı sonrası durumla bakılmalıdır (açılan bir kepenk D1'i çözebilir).
6. **Kilitlenme (12) kayıp penceresinden önce (Faz 2R):** +5 teklifi yalnız tespit edilmiş çıkmaz olmayan bir durumda
   sunulur; Söküm gerekiyorsa pencereden önce uygulanır (K-29, BUSINESS E13).

**Birden fazla engelin aynı anda tetiklendiği örnek:** Bölümde kepenk (period 2, phase 1), asansör, ıslak beton,
torba, zincir ve saha yerçekimi (`gravity.yard = true`, Y6) var. Oyuncu (3,4)–(4,4) `D2_90`'ı ((5,4) boş olduğundan tutulabilir) şantiyeye doğru bırakır, dilim tamamlanır.
Adım 3 doğru → adım 4 kalan 12 → 11, m 5 → 6 → adım 5 (3,5)'teki torba yırtılır → adım 6 (3,6)'daki blok (3,4)'e düşer;
düşüş öncesi komşusu (2,6)'daki zincirli bloğun zinciri kalkar → adım 8 dilim 2 gelir, parti 2 kuyruğa → adım 9 bloklar
düşer → adım 10 kepenk durumu `floor((6+1)/2)=3` tek → kapalı; asansör e 1 → 2; ıslak sayaçlar −1 (yeni gelenler
hariç) → adım 11 kazanma yok, sayaç > 0 → adım 12 kilitlenme yok.

---

## 13. Kenar durumları

Her satır bir test senaryosudur (test adı "E-xx …" ve ilgili K kimliği).

| # | Durum | Sonuç | Kural |
|---|---|---|---|
| E-01 | Son hamle (kalan 1) son dilimi tamamlar | Adım 4 kalan 0; adım 11 önce kazanma → kazanılır, bonus 0 | K-28, K-35 |
| E-02 | Kalan 1 hamlede cam blok eşiği aşan yükseklikten bırakılır | Kırılır, sahaya döner, maliyet 2 → sayaç 0 (negatif olmaz) → "Hamleler bitti" | K-07, S3 |
| E-03 | Teslimat sırasında sahada yer yok | Bloklar kuyrukta; sonraki hamlede yer açılınca o hamlenin 9. adımında düşer; kamyon göstergesi `N` = kuyruktaki blok sayısı ("Kamyonda: N"; `N = 0` iken gizli) | K-26 |
| E-04 | Kuyrukta eski bloklar varken döner platformda yeni dilim tamamlanır | Yeni parti kuyruğun sonuna eklenir; eskiler önce denenir | K-23, K-26 |
| E-05 | Kepenk kapanırken şantiyede, geçit satırında raydan konmuş blok var | Blok yerinde kalır; kepenk yalnızca sınırın o satırlarını kapatır, şantiye hücrelerini etkilemez | W4, K-12 |
| E-06 | Blok geçitte sınırı keserken (hücreleri sınırın iki yanında) bırakılır | İptal, hamle harcanmaz; kepenk/kayar kapı sürükleme sırasında değişmediği için "kapanırken içinde blok" oluşamaz | K-04, K-07 |
| E-07 | Kayar kapı, sahada geçide komşu blok varken kayar | Hiçbir blok itilmez; kapı yalnızca sınırın açık satırlarını değiştirir | W5 |
| E-08 | Asansör yükselirken şantiyede yapışmış harçlı blok var | Harçlı blok yalnızca bütün hücreleri plan alanında (renkli ya da `.`) ise yapışır, değilse geri seker (öneri P-2b); bu yüzden h + b ≤ 8 ile tahta dışına çıkamaz | Y8, K-24 |
| E-09 | Dilim Altın Mala ile tamamlanır | Mini hat: adım 8 kayma ve parti (döner platformda ön dilim değişir, `t = 0`), 9 teslimat, 11 kazanma, 12 kilitlenme; `m` artmaz, zamanlayıcılar ilerlemez (`t` de artmaz) | K-23, K-33, K-35 |
| E-10 | Anahtar açığa çıkar | Adım 5/6'da toplanır, Kilitli Geçit aynı anda açılır; ilk kullanım bir sonraki hamlede | W7, K-42 |
| E-11 | Taşınan bloğun başlangıç hücrelerinden ikisi aynı kasaya komşu | Kasa yalnızca 1 kat kaybeder | Y1, K-35 |
| E-12 | Yırtılan torba yüzünden düşen blok başka bir torbaya komşu geçer | 6. adım döngüsü: ikinci torba yırtılır, yerçekimi yeniden çalışır | Y2, K-35 |
| E-13 | Zincirli blok, komşusu taşındığı hamlede saha yerçekimiyle de düşer | 5. adımda zincir kalkar, 6. adımda düşer | Y3, K-20 |
| E-14 | Sahada bırakılan balonun üstünde blok var | Balon o bloğun altına kadar yükselir, yoksa y=7'ye kadar | S8 |
| E-15 | Şantiyede serbest kipte bırakılan balon | Plan tavanına (h + e satırının altı) ya da üstündeki ilk bloğa kadar yükselir; sonra doğrulama | S8, öneri P-3 |
| E-16 | Rüzgâr 1 genişlikteki bloğu `.` sütununa iter | Blok pencereye düşer → hatalı; gölge bunu önceden gösterir | W8, K-18 |
| E-17 | Oyuncu 1 genişlikteki bloğu rüzgârlı bölümde siluete kadar indirip bırakır | d = 0 → rüzgâr kayması yok | W8 |
| E-18 | G-H: blok Vinç Alanı'ndayken 700 ms dolar | O konumdan zorla bırakılır, normal düşüş ve cam kuralı | G-H, K-19 |
| E-19 | G-H: blok şantiye üstünden sahaya geri çekilir | Sayaç sıfırlanır; tekrar şantiyeye değince yeniden 700 ms | G-H |
| E-20 | Açılmamış `?` hücresine yanlış renk | Hatalı yerleşim; gölge her zorlukta nötr kalmıştır | K-18, K-32 |
| E-21 | Dilim geçişi ve teslimat yapan hamleden sonra Geri Al | Kayma ve teslimat dahil bütün durum hamle öncesine döner | K-39 |
| E-22 | Sallanan Köprü'de hamle biter, oyuncu +5 alır | Elenmez; deneme sürer | K-29, META |
| E-23 | (Faz 2R: geçersiz — Kamyon Yardımı artık `B1` teslim etmez, K-30.) Eski: D2 `B1`'leri saha doluyken | Kimlik yeniden kullanılmaz; çıkmaz kurtarması için E-26, E-48, E-58, E-59 | K-30 |
| E-24 | Harçlı blok `.` (pencere) hücresine yapışır (Faz 2R: S2 MVP dışı; yalnız S2 geri gelirse geçerlidir) | Dilim tamamlanamaz (K-15: dilim alanında fazladan blok); 2 hamlelik geri sürükleme ya da Çekiç (Faz 2R: yapışmayı çözer, K-36) gerekir. Harç oradayken o sütunda üstüne doğru yerleşim yapılamaz (E-43), bu yüzden harcın üstü kapanıp tutulamaz hale gelmez | Y8, K-15, K-34 |
| E-25 | Boya kapısından geçip boyanan blok şantiyede hatalı yerleşir | Geri seker, yeni rengini korur (boya hamle kesinleşince kalıcıdır) | W6, K-17 |
| E-26 | (Faz 2R) Kalan son plan hücresi 1×1, sahada o renkte yalnız 2 hücreli blok var | Tam örtüde arz = talep olduğundan bu durum yalnız bir döşeme çıkmazıyla oluşur (başka bir hücreye 1 hücre fazla yerleşmiştir) → K-30 D3a → Söküm: çıkmaza sokan son yerleşim geri alınır, hamle iade edilmez | K-30, K-47 |
| E-27 | `build` tamamlandı, `clear` hedefi eksik | Oyun sürer; şantiye **kapalıdır**: şantiyeye bırakma iptal (0 hamle, K-07 satır 5); tam örtüde sahada malzeme kalmadığından hedef yalnız Ağır Yük kaydırmasıyla (komşu etkisi) bitirilebilir; bitirilemiyorsa durum çıkmazdır (K-50/7) → Söküm son yerleşimi geri alır ve oyuncu hedefi önce bitirir. Bölüm tasarımı bunu kaçınır (LEVELS kontrol listesi) | K-07, K-28, K-30, K-41 |
| E-28 | Blok duvar üstünde, Vinç Alanı'nda sınırı keserken bırakılır | İptal (K-07 satır 4) | K-07 |
| E-29 | Sahada, başlangıçtan farklı ama yine saklı vidanın hücresini örten konuma bırakma | Hücre boş kalmadığı için vida toplanmaz | K-42 |
| E-30 | Hamle sayacı 0 iken bloğa dokunma | Tutulamaz; kayıp penceresi zaten açıktır | K-09 |
| E-31 | Islak blok teslimatla gelir (wetMoves 3) | Geldiği hamlede sayaç 3 kalır, sonraki 3 hamlenin 10. adımında 2, 1, 0 olur | Y4, K-35 |
| E-32 | Döner platformda ön dilime yapışmış harç varken dönüş | Harç dilimiyle birlikte döner; dilim onu kaldırmadan tamamlanamaz | S5, Y8 |
| E-33 | Y6 açık; aynı sütunda düşen blok (6. satır) ile yükselen balon (4. satır) arasında 1 boş hücre (5. satır) | Tur 1 düşme yarısı: blok 5'e iner; yükselme yarısı: balonun üstü dolu, kalır. Sonuç: blok 5'te balona oturur, balon bloğa dayanır, boşluk yok (R-02) | K-20, K-35, S8, N33 |
| E-34 | Teslimat: bloğun `x`'i dolu, `dropColumns` [3, 0] ikisi de dolu | Aşama 3: kalan sütunlar `x`'e uzaklıkla denenir; liste son aşamayı kapatmaz. Hiçbiri olmazsa kuyrukta kalır | K-25, K-26 |
| E-35 | Balon şantiyede tavanın **üstünden** (Vinç Alanı) bırakılır | Tavana **iner** (yükselmez); W8 için `d = |bırakma satırı − tavan satırı|`, `d = 0` ise rüzgâr kayması yok | S8, W8 |
| E-36 | Kamyonla balonlu blok gelir (Y6 kapalı / açık) | Diğer bloklar gibi düşüp oturur, yükselmez. Y6 açıksa **sonraki** hamlenin 6. adımında yükselir; Y6 kapalıysa oyuncu bırakana kadar yerinde kalır | K-25, S8 |
| E-37 | (Faz 2R) Hamle sonunda Söküm çalıştı (ya da D1 yeniden dizme); oyuncu Geri Al kullanır | Hamle ve yardım birlikte geri alınır; hamle sayacı da hamle öncesine döner (Söküm'ün iade etmediği hamle geri gelir). Durum yine çıkmazsa aynı yerleşim yeniden Söküm'e gider | K-30, K-39 |
| E-38 | 5. hamleden sonra sistem uygulamayı kapatır, oyuncu 2 saat sonra açar | Bölüm aynı durumdan sürer (kalan hamle, tahta, seri, ayrılan can); kayıp değildir. Can yenilenmesi saatle işlemiştir | K-43 |
| E-39 | Sürükleme sırasında blok önce R boya kapısına, sonra Y boya kapısına girip sahaya bırakılır | Blok Y olur (son girilen); `via` = Y kapısının indeksi; 1 hamle | W6, K-35 |
| E-40 | G-L: blok düşerken oyuncu başka bir bloğu tutar | Yönlendirme penceresi kapanır, düşen blok yönlendirmesiz (ya da daha önce yönlendirildiyse o haliyle) iner; yeni blok tutulur | K-19, R-12 |
| E-41 | `movesSpent = 0` (Faz 2R; eski `m = 0`), galibiyet serisi kademe 2 bonusu (Faz 2R: +1 hamle, +1 mala) verilmiş; oyuncu çıkar | Ceza yok; can, oyun öncesi güçlendiriciler iade; bonus tüketilmez, sonraki girişte yine verilir | K-40, K-43 |
| E-42 | (Faz 2R) Son hamle hiçbir bloğun tutulamadığı bir durum (D1) üretir ve sayacı 0 yapar | Adım 12'de D2 ve D3 çalışır (D1 sayaç 0 iken çalışmaz); çıkmaz yoksa kayıp penceresi açılır. Oyuncu +5'i kabul eder → D1 bir kez çalışır: zincirler/ıslaklık kalkar, hâlâ D1 ise saha yeniden dizilir, ardından D3 denetlenir; oyuncu 5 hamleyle oynayabilir. `m`, `movesSpent`, zamanlayıcılar ve seri değişmez | K-29, K-30 |
| E-43 | Harçlı blok (7,1) `.` hücresine yapıştı (E-24; Faz 2R: S2 MVP dışı, yalnız S2 geri gelirse geçerlidir); (7,0) doğru dolu, (7,2) W boş. Oyuncu sütun 7'ye W blok bırakır | Blok (7,2)'ye iner ve **hatalıdır** (`support`; `missingSupport` = [(7,1)]); harç orada durdukça sütun 7'de `buildFront` yoktur. Harç sürüklenip çıkarılınca (7,1) yeniden boş `.` olur ve (7,2) cephe hücresi olur | K-34, Y8 |
| E-44 | (Faz 2R) Sahada 2 hücrelik R moloz (şantiyeden taşınmış) var; planda 2 R hücre kaldı | Moloz malzemedir (OBSTACLES S4): arz sayılır, kilitlenme yok; moloz sıradan blok gibi doğru yerleşebilir. Çekiç onu kıramaz (K-36) | K-27, K-36, K-47, S4 |
| E-45 | Oyuncu 2. teklifi 1.350 altınla almış (1. teklif reklamla); uygulama kapanır, güncellenir, bölüm verisi değişmiştir; Sallanan Köprü'de, tur harcaması 2.250 | Deneme cezasız kapanır: can ve güçlendiriciler iade, 1.350 altın iade, tur harcaması 2.250 → 900; elenme ve tahta yok; reklam sayacı geri verilmez; oyuncu ana ekranda | K-43 |
| E-46 | Moloz (6,2)'den sahaya taşınır; (5,2)'de Ahşap Kasa, (5,1)'de zincirli blok var | Hiçbiri etkilenmez: x=5 ile x=6 komşu değildir (duvar sınırı, §0); kasa kat kaybetmez, zincir kalkmaz | §0, K-35, Y1, Y3 |
| E-47 | G-L: bölümün ilk hamlesinde blok düşerken (yönlendirilmemiş) oyuncu Duraklat'a basar, sonra "Bölümden çık"ı seçer | Yönlendirme penceresi kapanır, blok yönlendirmesiz iner (animasyon son karesine atlar), hamle sonu çözümlemesi biter ve kayıt yazılır; sonra Duraklat penceresi açılır. Devam'da o düşüş için yönlendirme hakkı yoktur. Çıkış menüsü `movesSpent = 1` görür → çıkış kayıptır | K-19, K-43 |
| E-48 | (Faz 2R) Dilimi tamamlayan yerleşim (kamyon dökümü dahil) çıkmaz üretir | Söküm dilim geçişini ve teslimatı da geri alır: tamamlanan dilim şantiyeye geri kayar, parti teslim edilmemiş (kuyrukta değil, beklemede) olur; hamle iade edilmez | K-22, K-25, K-30 |
| E-49 | (Faz 2R) Son dilim tamamlanır; sahada Ağır Yük ve iki kasa kalır | Kazanılır (K-48: yalnız malzeme blokları sayılır) | K-28, K-48 |
| E-50 | (Faz 2R) Altın Mala ile seçilen bloğun aktif dilimde doğru konumu yok (`P` boş) | İşlem yapılmaz, mala harcanmaz; blok yerinde kalır | K-33 |
| E-51 | (Faz 2R) Çekiç sahadaki bir malzeme bloğuna dokunur | İşlem yapılmaz, Çekiç harcanmaz (tam örtü: malzeme yok edilmez) | K-36, K-47 |
| E-52 | (Faz 2R) Boya Fırçası `D2_0` W ile `O4` Y'ye dokunur | Hücre sayıları farklı → işlem yok, fırça harcanmaz. `O4` W ile `O4` Y → renkler takas edilir | K-38 |
| E-53 | (Faz 2R) Zincirli bloğun 4-komşularında hamle sonunda hiç blok ya da Ağır Yük kalmadı | Zincir adım 5'te kendiliğinden kalkar ve `clear/chain` sayılır (OBSTACLES Y3; aksi halde blok hiç çözülemez ve tam örtü bozulurdu) | Y3, K-41, K-47 |
| E-54 | (Faz 2R) Kamyon partisi Ağır Yük'ün altında kalan sütunlara düşemiyor (K-25 hiçbir adayda yer yok) | Blok kuyrukta bekler (K-26); oyuncu Ağır Yük'ü kaydırınca o hamlenin 9. adımında düşer (LEVELS Bölüm 10 dilim 2'de bilinçli kullanılır) | K-25, K-26, Y5 |
| E-55 | (Faz 2R: geçersiz — çok adımlı Söküm ve çalışma anı D3b araması kaldırıldı; Söküm tek adımdır, D3b solver tablosudur, K-30. Kimlik yeniden kullanılmaz.) | — | K-30 |
| E-56 | (Faz 2R) Bölüm 1 boyutu (Wy 4, Hy 4, H 5): `a` (`D2_0` Y, (0,2)) tutulur, çapa (0,4)'te (hücreler (0,4), (0,5): saha üstü hava ve Vinç Alanı) bırakılır | K-07 satır 3 → iptal, hamle harcanmaz; blok (0,2)'ye döner. Çapa (0,3)'te bırakılırsa da (hücre (0,4) y ≥ Hy) iptal | K-05, K-07, K-49 |
| E-57 | (Faz 2R) Bölüm 5 boyutu (Hy 4, H 5): kamyon bloğu `D2_0` x = 0'a düşer, sütun 0'da y 0–2 dolu | Blok y = (H + 2) − 2 = 5'ten düşer, (0,3)'e oturur; (0,4) y ≥ Hy olduğundan aday reddedilir; K-25 sırasıyla sonraki aday denenir; hiçbiri olmazsa kuyruk (K-26). Test "K-49 yard air truck candidate rejected" | K-25, K-49 |
| E-58 | (Faz 2R) Kalan 1 hamlede yapılan doğru yerleşim döşeme çıkmazı üretir, sayaç 0 olur | Adım 11 kazanma yok → adım 12 D3a çıkmaz → Söküm (sayaç 0 kalır, `movesSpent` düşmez) → "Hamleler bitti" penceresi Söküm sonrası durumda açılır; kalan blok sayısı geri sökülen bloğu sayar. Test "E13 out-of-moves offer only after deadlock check" | K-29, K-30, K-35 |
| E-59 | (Faz 2R) Kepenkli bölümde (`period` 2, `phase` 0) `m = 3` iken yapılan yerleşim çıkmaz üretir | Hamle `m`'yi 4 yapar (kepenk açık: ⌊4/2⌋ çift); Söküm `m`'yi 3'e döndürür → kepenk yeniden kapalı (⌊3/2⌋ tek), tahta ve zamanlayıcılar hamle öncesiyle bit bit aynı; kalan hamle iade edilmez, `movesSpent` 4 kalır | K-30, W4 |
| E-60 | (Faz 2R) Vinç'le seçilen `D2_0` W için iki doğru şantiye konumu var; biri D3a'ya göre döşeme çıkmazı üretir | O konum geçersiz hedeftir (dokunulursa işlem yok, Vinç harcanmaz); diğer konum geçerlidir. Aynı blok saha hedefine taşınırken döndürülemez | K-30, K-37 |
| E-61 | (Faz 2R) Bölüm 9'da Çekiç açık, envanterde 0 adet; sahada Ağır Yük, kasa, torba, zincir ve moloz yok | Çekiç yuvası **hedefsiz**: gri, "+" yok, satın alma penceresi açılmaz; dokunuş `booster.hammer.noTarget` balonunu açar | K-36, K-54 |

---

## 14. Veri alanı ekleri (code-lead'e)

Brif §12 veri tipine product-lead'in istediği ekler (kesin şema TECH_DESIGN'dadır):

| Alan | Tip | Neden |
|---|---|---|
| `build.elevator` | `{ range: [number, number]; start: number; dir: 1 \| -1 }` | Asansör moddan bağımsız (K-24, P-4) |
| `build.debris[].segment` | `number` (varsayılan 0) | Molozun hangi dilime ait olduğu (K-45/7, P-5) |
| `wall.gaps[].dir` (slider) | `1 \| -1` (varsayılan 1) | Kayar kapının ilk yönü (W5) |
| `PiecePlacement.y` (parti ≥ 1) | `Hy` yazılır (varsayılan 8), yok sayılır | Kamyon dökümü sütundan yapılır (K-25) |
| `yard.cols`, `yard.rows` (Faz 2R) | `number` (isteğe bağlı; varsayılan 6, 8) | Değişken saha boyutu Wy, Hy (K-49) |
| `site: { cols, rows }` (Faz 2R) | `number` (isteğe bağlı; varsayılan 2, 8) | Değişken şantiye boyutu Ws, Hs (K-49); her dilimin `rows` uzunluğu Hs, satır uzunluğu Ws (K-15) |
| `PiecePlacement.color` (Ağır Yük, Faz 2R) | I5/Q9 için isteğe bağlı, yok sayılır | Ağır Yük malzeme değildir, renksizdir (K-44) |
| Hamle kaydı `drag.via` | `number` (geçit indeksi, isteğe bağlı) | Son girilen boya kapısı (W6, K-35 adım 1, E-39) |
| Hamle kaydı `steer` | `{ dir: 1 \| -1; atRow: number }` (isteğe bağlı) | G-L yönlendirmesi (K-19) |
| `seed` | `number` (isteğe bağlı; yoksa `id × 1000 + id`) | K-45/1 |
| `teaches` | mekanik kimliği (OBSTACLES veri imzası tablosu), isteğe bağlı | K-45/9 |
| `tutorial[]` (Faz 2R: en çok 2 adım, `mode` isteğe bağlı ve yalnız `'soft'`, `done` yalnız olay, K-53) | `{ step, mode?: 'soft', highlight: string[], hand?: { kind: 'tap' \| 'drag' \| 'hold', path?: [x, y][] }, textKey, startOn?: Cond, done: Cond }`; `Cond = { event, count?, minMs?, at?: [x, y], piece?: string, type?, flag?, wind?: true, hidden?: true, painted?: true }` (hangi alanın hangi olayda yazılabileceği §14.1 madde 3; `startOn` madde 5). **`{ timeoutMs }` Faz 2R'de geçersizdir** (şema reddeder, CL-2R-10); `hand.path` anlamı aşağıdaki paragrafta | code-lead önerisi KABUL; `minMs`, `at`, süzgeçler (`type`, `flag`, `wind`, `hidden`, `painted`) ve `startOn` eklendi (kesin şema TECH §8.2 `TutCond` / `TutDone`). `highlight` sözlüğü UX_FLOWS §13.1; `piece:<i>` = parti-0 dizi sırası = LEVELS tablosundaki satır sırası; partilerde `k<parti>_<indeks>`. `textKey` biçimi ve `done` sözlüğü aşağıda (§14.1) |
| Kayıt `inLevel` | K-43 madde 3 | Kaldığı yerden devam (R-13) |
| Kayıt, bölüm başına | `{ won: boolean, attempts: number }` | `attempts` yalnızca analytics içindir (`level_start.attempt`); kural kullanmaz |

**`hand.path` anlamı (Faz 2R, DL-2R-01; `drag` ve `hold` için):** (1) Her nokta, oyuncunun **tuttuğu hücrenin** tahta
koordinatıdır (çapa değil). `path[0]`, `highlight`'taki `piece:` bloklarından birinin bir hücresidir ve eldiven o bloğu
taşır; tutma ofseti = `path[0]` − bloğun çapası; her noktanın çapası = nokta − ofset. (2) Ardışık iki nokta aynı satırda ya da aynı sütundadır;
aradaki her tamsayı nokta da dahil olmak üzere bütün çapalar, adımın başladığı durumda bloğun `R` kümesindedir (K-08).
(3) Son nokta bırakma (`drag`) ya da bekleme (`hold`) konumudur ve K-07'de satır 2, 6 ya da 7 sonucunu verir; iptal
(satır 1, 3, 4, 5) veremez. (4) `drag`'in son konumu, adımın başladığı durumdan bir en kısa çözümün ilk hamlesidir
(kazanmaya uzaklık 1 azalır; K-50 `bestChoices`). `hold`'un son konumu şantiye sütunlarının üstündedir (gölge görünür,
K-18); bırakılması doğru olmak zorunda değildir. (5) Çalışma anında `path[0]` hücresi vurgulu blok tarafından
doldurulmuyorsa (blok yer değiştirdiyse) eldiven gösterilmez; balon ve vurgu sürer. (6) Blok o an tutulamıyorsa (K-09)
`hand` yazılmaz. Doğrulayıcı kodu `tut_hand_invalid` (K-45 madde 10); test "K-53 tutorial hand path reachable and not
cancel". **Örnek:** Bölüm 4 adım 2 `drag [[1,1],[5,1]]`: `a` (`O4_0` W, çapa (0,0)) sağ üst hücresi (1,1)'den tutulur
(ofset (1,1)); son çapa (4,0) → hücreler (4,0)…(5,1) geçidin rayında, K-07 satır 7, doğru. Eski yol `[[1,1],[4,1]]`
son çapayı (3,0) yapar, blok sınırı keser (satır 4, iptal) → `tut_hand_invalid`.

### 14.1 Öğretici adımı (`tutorial[]`) kuralları

**Faz 2R (K-53):** bölüm başına en çok 2 adım; bütün adımlar yumuşaktır (`mode` yazılmaz ya da `'soft'`), `highlight`
yalnız hafif bir parıltıdır (spot ışığı ve karartma yok), hiçbir dokunuş engellenmez; adım yalnız olayla biter
(`timeoutMs` geçersiz). Aşağıdaki "Z (required)", "spot ışığı" ve `timeoutMs` geçen maddeler (madde 4 ve örnekleri)
Faz 2R'de uygulanmaz; sözlük (madde 3), `startOn` (madde 5) ve kapsam (madde 6) geçerlidir. LEVELS §2'nin öğretici
adımları bu kurala uyar.

1. **`textKey`:** `tut.l<bölüm>.<konu>`, **Faz 2R:** mekanik bazlı `tut.m.<konu>` (design-lead STORY §6A; Bölüm 1–10 bunu
   kullanır, regex üç biçimi kabul eder) **ya da** bağlamsal bir satırı öğretici adımında yeniden kullanmak için
   `tut.ctx.<konu>`. R-08'in tek anahtar kümesi korunur: yeni bir anahtar ailesi açılmaz; `tut.ctx.*` UX §13.1 ve
   STORY §6'da zaten tanımlı bağlamsal satırlardır. Anahtardaki bölüm numarası metnin ilk yazıldığı bölümdür; aynı
   metin başka bölümün adımında yeniden kullanılabilir (ör. `tut.l1.match` Bölüm 2, 3 ve 9'da). code-lead şema
   regex'ini iki biçimi kabul edecek şekilde genişletir.
2. **Bağlamsal satırın adımda gösterilmesi:** `textKey`'i `tut.ctx.<konu>` olan bir adım ekranda gösterildiği anda
   `seenContextTips.<konu>` işaretlenir; o bağlamsal tetik bu hesapta bir daha çıkmaz (K-34 kanca 4, UX §5.5). Faz 2R
   Bölüm 1–10'da hiçbir adım `tut.ctx.*` kullanmaz (eski Bölüm 4 adım 2 kaldırıldı).
3. **`done` olay sözlüğü** (code-lead enum'u buna eşitler):
   - **Sürükleme sinyalleri** (bırakma beklenmez; sürükleme sonra iptal edilse de sayılmış kalır): `overWall` — tutulan
     bloğun bir hücresi serbest kipte duvar sınırını ilk kez geçtiği an (hamle sonu kaydındaki `entry: 'overWall'` ile
     karıştırılmaz); `gapPass` — tutulan blok bir geçitte ray kipine girdiği an (K-12), yani yalnız serbest kipten ray
     kipine geçiş (yolun ilk serbest → ray geçişi): ray kipinde başlayan molozun (K-12 istisnası) başlangıç konumu giriş
     sayılmaz (ör. K-12 moloz örneğinde (6,3)–(7,3)'ten ray kipinde tutulup sola çekilen moloz `gapPass` üretmez; sahaya
     çıkıp serbest kipten yeniden bir geçide girerse sayılır); `holdOverBuild` — serbest kipteki
     bloğun bir hücresi şantiye sütunlarına değerken kesintisiz `minMs` milisaniye geçtiği an.
   - **Hamle sonu olayları** (K-35; parantezde TECH `GameEvent` karşılığı): `turnEnd` (iptal olmayan bir sürükleme
     hamlesi adım 11'e ulaştı — saha ya da şantiye; `movesChanged{reason:'move'}`), `placementCorrect` (adım 3,
     sürükleme hamlesiyle doğru yerleşim), `yardMove` (K-07 satır 2, sahaya yerleşim), `landed` (adım 2: serbest kipte
     şantiyeye bırakılan blok **kırılmadan** durdu — iniş ya da balon yükselişi, doğru ya da hatalı; `pieceFell
     {cause:'release'}` / `balloonRose`, aynı hamlede `glassBroke` yok), `steered` (adım 2, G-L yönlendirmesi; `steered`),
     `obstacleHit` (adım 5–6 komşu etkisi **ya da Çekiç'in doğrudan vuruşu** (K-36; güçlendiricinin hedefe doğrudan
     etkisi, TECH `step: 1`): kasa kat kaybetti ya da yok oldu / torba yırtıldı / zincir kalktı;
     `crateDamaged`·`crateBroken` / `bagTorn` / `chainReleased`; ör. Bölüm 11 adım 1'de kasa Çekiç'le kırılırsa adım
     biter), `itemCollected` (adım 5–6 saklı nesne toplandı;
     `screwCollected` / `keyCollected`), `yardFall` (adım 6, en az bir saha bloğu saha yerçekimiyle düştü;
     `pieceFell{cause:'yardGravity'}`), `segmentDone` (adım 8, dilim tamamlandı), `deliveryDone` (adım 9, en az bir
     blok sahaya düştü), `carouselTurn` (adım 8 ya da 10, döner platform döndü; `carouselRotated`).
   - **Diğer:** `tap` (vurgulanan hedefe dokunma; hedef `pre:` ise bölüm öncesi pencerenin kapanması — Oyna ya da
     kapat — da adımı bitirir), `boosterUsed` (bir bölüm içi güçlendirici geçerli bir hedefe uygulandı ve harcandı; Vinç
     yerleşimi `placementCorrect` üretmez, yalnız `boosterUsed` üretir). Olay yerine `timeoutMs` Faz 2R'de geçersizdir
     (K-53 madde 3).
   - **Süzgeçler** (olay yalnızca süzgeç tutunca sayılır; başka olayda verilemez): `type` (zorunlu) — `obstacleHit` için
     `crate | cement_bag | chain`, `itemCollected` için `screw | key`; `flag` (`glass | balloon | mortar`) — `landed` ve
     `deliveryDone` için (bloğun / düşen bloklardan en az birinin bayrağı); `wind: true` — `landed` için (aynı hamlede
     rüzgâr kaydırdı, W8); `hidden: true` — `placementCorrect` için (yerleşen hücrelerden en az biri açılmamış `?` idi,
     K-32); `painted: true` — `yardMove` için (blok bu hamlede bir boya kapısında boyandı, W6).
   - `count` (varsayılan 1) adım **başladıktan sonra** gerçekleşen olayları sayar; önceki olaylar sayılmaz. Her hamle
     sonu olayı bir sürükleme hamlesinde ya da bir güçlendirici kullanımında (mini hat, Çekiç vuruşu dahil) **en çok 1
     kez** sayılır: aynı hamlede eşleşen birden çok etki ("en az bir" tanımları; ör. iki kasa kat kaybetti, üç blok
     düştü) `count`'u 1 artırır.
   - `minMs` yalnız `holdOverBuild` içindir (biçim: `{ event: 'holdOverBuild', count: 1, minMs: 500 }`). Bölüm verisi
     `holdOverBuild`'i adım bitişi (`done`) ya da `startOn` olarak kullanmaz: tutuşu beklemeden bırakan oyuncuda olay
     gelmez ve adım kazanana kadar ekranda kalır (LEVELS §5 "Öğretici zamandan bağımsız ve görünür"). `hold` eldiveni
     gösterimdir; adım hamle sonu olayıyla biter (ör. Bölüm 2 adım 2: `{ event: 'placementCorrect', count: 1 }`).
   - `at: [x, y]` yalnız `yardMove` ve `placementCorrect` içindir: olay yalnızca blok bu çapaya yerleşince sayılır
     (ör. Faz 2R Bölüm 6 park adımı: `{ event: 'yardMove', count: 1, at: [2, 3] }`; alçak park adımı bitirmez).
   - `piece: '<vurgu kimliği>'` (Faz 2R, DL-2R-02) yalnız `yardMove` ve `placementCorrect` içindir: olay yalnızca o blok
     (`piece:<i>` ya da `piece:k<p>_<i>`) yerleşince sayılır; başka bloğun hamlesi adımı bitirmez (ör. Bölüm 3 adım 1:
     `{ event: 'yardMove', piece: 'piece:2' }`). `at` ile birlikte yazılabilir (ikisi de tutmalı).
   - UX §13.2'deki 11–38. bölüm satırlarının bu sözlükle `done` eşlemesi LEVELS §3 "11–38 `tutorial[]` `done`
     eşlemesi" tablosundadır (ör. Bölüm 11 `{ event: 'obstacleHit', type: 'crate' }`, Bölüm 27 `{ event: 'placementCorrect', hidden: true }`).
     Sözlük kapalıdır: yeni bir tamam koşulu önce buraya eklenir.
4. **Kilit güvencesi (zorunlu adım) — Faz 2R: geçersiz, zorunlu adım kalktı (K-53); madde yalnız tarihsel kayıttır ve doğrulayıcı uygulamaz:** (a) Veri kuralı (LEVELS §5): Z adımının `highlight`'ı en az bir `piece:` ya da
   `debris:` (moloz, UX §13.1) içerir; `piece:` içermeyen Z adımının `done` olayı `placementCorrect` olamaz (moloz
   hiçbir yerde doğru olamaz, K-16 koşul 2; ör. Bölüm 17 `debris:0` adımı `yardMove` bekler). Z adımı yalnızca istediği
   hamle, önceki adımın tamamlanabildiği **her** durumda geçerli ve K-34'e uygunsa yazılır; "her durum" her hamle
   sırasını ve önceki bir `timeoutMs`'in hamlelere göre her dolma anını kapsar (sayım adım başladıktan sonra başlar,
   süre dolmadan yapılan hamleler sonraki adımın sayımına girmez; sonraki adımın bitişi bu yüzden süreye bağlı
   kalıyorsa önceki adım olayla biter, ör. Bölüm 4 adım 1 `placementCorrect` ×1, LEVELS §2). Spot ışığı en az bir
   tutulabilir bloğu açık bırakır. (b) Çalışma anı: Z adımı başlarken ve her hamle sonunda, vurgulanan `piece:` ve
   `debris:` bloklarından hiçbiri adımın `done` olayını o anki durumda üretemiyorsa adım atlanır (tamam sayılır) ve
   sonraki adıma geçilir. "Üretemiyor" = blok K-09'a göre tutulamıyor ya da erişim kümesinde (K-08 `R`) olayı üreten
   konum yok: `overWall` için sınırı serbest kipte geçen konum, `gapPass` için ray konumu, `placementCorrect` için doğru
   yerleşim (`debris:` için hiçbir zaman yok), `yardMove` için (`at` verilmişse o çapada) sahaya yerleşim (`piece:` ve
   `debris:` için aynı koşul: K-10'a göre boş, bütün hücreleri x ≤ 5 ve y ≤ 7 olan, `R`'de erişilebilir bir konum;
   moloz için OBSTACLES S4; `painted` süzgeci varsa yol bir boya kapısının ray kipinden geçmeli). `steered` için
   serbest kipte şantiyeye bırakma konumu yeter (yönlendirme oyuncu girdisidir). Diğer hamle sonu olayları (`turnEnd`
   dışında: `landed`, `obstacleHit`, `itemCollected`, `yardFall`, `carouselTurn`, süzgeçleriyle) için: vurgulanan
   blokların `R`'deki hiçbir bırakma konumu K-35 hattında simüle edildiğinde olayı üretmiyor. `turnEnd`,
   `holdOverBuild` ve `tap` için tutulabilirlik yeter; `timeoutMs` adımı kendiliğinden biter. Oyuncu spot ışığı içinde
   hiçbir zaman kilitli kalmaz. Test "GDD 14.1 required tutorial step never locks".
5. **Başlama koşulu (`startOn`, isteğe bağlı):** adım, önceki adım bittikten **sonra** `startOn` olayı gerçekleşince
   başlar (biçim `done` olayıyla aynı: `event` + süzgeçler, `count`; `timeoutMs` olamaz); `startOn` yoksa önceki adım
   bitince başlar. `startOn` olayı bölüm sonuna kadar gerçekleşmezse adım ve sonraki adımlar gösterilmez. Kullanım: adımın
   vurguladığı blok bölüm başında sahada değilse (kamyonla gelir). Ör. Bölüm 35 adım 1 (harçlı bloklar 2. ve 3. partide,
   LEVELS §3 #35, §4 madde 4): `startOn: { event: 'deliveryDone', flag: 'mortar' }`, vurgu ilk teslim edilen harçlı blok
   (`piece:k<p>_<i>`). L-17 karşılığı: `startOn`'lu adımın `piece:k…` vurgusu `startOn` teslimatındaki bloğu gösterir.
6. **Kapsam:** `tutorial[]` yalnızca bölüm ekranı ve bölüm öncesi pencere adımlarını taşır. Ana ekran satırları
   (`tut.meta.*`: Köprü, kumbara, lig, sandık, mağaza) ve bağlamsal tetikler (`tut.ctx.*` satırının ilk
   gerçekleştiği anda gösterilmesi) bölüm verisi değildir (UX §13.2 alt tablo; META); bir `tut.ctx.*` satırının
   öğretici adımında `textKey` olarak yeniden kullanılması (madde 1–2) bu kuralın dışındadır.

---

## 15. code-lead sorularına yanıtlar (TECH_DESIGN §16, S-1…S-28)

| Soru | Yanıt (bağlayıcı kural) |
|---|---|
| S-1 | Saat yönünde, sol alta normalize (K-44). |
| S-2 | `I5_90/270` veride yasak; I5 ve Q9 Vinçle döndürülse de ağır (K-37, K-44). |
| S-3 | **Faz 2R ile değişti:** doluluk sınırı `2 ≤ E ≤ ⌊0,4·Wy·Hy⌋`, öğretici bölümlerde de geçerli (K-02). |
| S-4 | Şart: `y + size ≤ height − 1` (K-04). |
| S-5 | İptal, hamle harcanmaz (K-07 satır 4). |
| S-6 | Hamle sonunda; sürüklemede tahta donuk (K-08, K-35). |
| S-7 | Başlangıç hücrelerinin 4-komşuluğu; saha yerçekimi düşüşleri sayılır (düşüş öncesi hücreler), teslimat sayılmaz; engel başına hamlede en çok 1 (K-35 adım 5–6). |
| S-8 | Bırakınca, düşüşten önce, 1 sütun; hedef duvar/kenar/dolu ise kayma yok; ray etkilenmez. **Ek:** bırakma anında d = 0 (blok siluete oturmuş) ise kayma yok (W8, öneri P-2a). |
| S-9 | **Farklı (R-02: GDD geçerli):** Şantiyede tavan aktif dilimin plan tepesidir (tahta satırı h + e); sahada y=7. Tavanın üstünden bırakılan balon tavana iner (E-35); teslimat balonu yükselmez (E-36). Öneri P-3. |
| S-10 | d > eşik; d bırakma satırından; geri sekme ve teslimat düşüşünde cam kırılmaz (S3). |
| S-11 | Kuyruğun sonuna (K-17). |
| S-12 | Evet, torba her zaman düşer (K-20). |
| S-13 | Moloz düşmez. **Faz 2R ile değişti:** moloz bir malzeme bloğudur; başlangıç konumunda doğru olamaz (`debris_correct_at_start`), taşındıktan sonra sıradan blok gibi doğru yerleşebilir (OBSTACLES S4, K-16 koşul 2 kaldırıldı). |
| S-14 | Zamanlayıcılar `m` (iptal olmayan hamle) başına 1 kez; cezalar yalnızca sayacı düşürür; güçlendirici ve teklif ilerletmez (K-35). |
| S-15 | Atlar; sayaç `t` her hamle +1 (ön dilimin tamamlandığı hamlede artmaz), dönüşte ve dilim tamamlanınca 0 (K-23). |
| S-16 | `build.elevator` ayrı alan (K-24, P-4). |
| S-17 | Dilim içinde `period` satır aşağısı, zincirle (K-32). |
| S-18 | Minimum hamleli çözüm, eşitlikte en yüksek YAO; yönlendirme ve balon duvar üstü; Mala/Vinç sayılmaz (K-46). |
| S-19 | **Faz 2R ile geçersiz:** Kamyon Yardımı blok yaratmaz ve yeniden şekillendirmez; D3 çıkmazında Söküm uygulanır (K-30). |
| S-20 | Hatalı yerleşim (harç yapışması dahil) ve cam kırılması bozar; saha hamlesi bozmaz (K-33). |
| S-21 | **Farklı (R-02: GDD geçerli):** Sürüklemede boya kapısının ray kipine giren (yarım girip çıkmak dahil) ve iptal edilmeyen her hamlede blok boyanır; sahaya geri dönse bile; birden çok kapıda son girilen geçerli (K-35 adım 1, E-39). Gerekçe: "boyahane" kullanımı duvar üstü yerleşimi (YAO) korur. Öneri P-6. |
| S-22 | Evet, açıldığı denetimde toplanır (K-42). |
| S-23 | Ping-pong; iptalde oynamaz (K-24). |
| S-24 | `period` hamle açık + `period` hamle kapalı; açık ⇔ `floor((m + phase) / period)` çift; `phase = 0` açık başlar (W4). |
| S-25 | Lig haftası UTC Pazartesi 00:00 (META). |
| S-26 | **Değişti (R-10):** düşüş/yükseliş sürerken tahtanın herhangi bir yerine dokunma; dokunulan taraf (bloğun orta çizgisine göre) = yön; 1 sütun; düşüş başına 1; aynı hamle; kayıt `steer { dir, atRow }` (K-19). |
| S-27 | Evet; erişilebilirlik ayarıyla 1400 ms (K-19). |
| S-28 | Hayır (§10 genel). |
