# 50 bölüm planı

Sahip: product-lead · Sürüm: Faz 2R (2026-10-07; R2-01…R2-06, R2-10 — `docs/review_inbox/_orchestrator_rulings_2R.md`; çapraz inceleme kapanışı: tanıtım bölümü tamponu, öğretici yolları ve süzgeçleri, Bölüm 4 adı, Faz 3 kuralları) · Önceki: Faz 1 revizyonu (2026-10-04; R-01, R-08, R-18, R-21; tutarlılık denetimi tur 1, 2026-10-05; F-3 çıkmaz taraması, 2026-10-05) · Kaynak: `docs/BRIEF.md` §8, `docs/GDD.md` (Faz 2R), `docs/OBSTACLES.md`

Bu belge 50 bölümün taslağıdır. **Faz 2R dikey dilimi Bölüm 1–10'dur (R2-06):** §2'de her biri yeni kurallarla (tam örtü
K-47/K-48, değişken boyut K-49, bulmaca ölçütleri K-50/K-51, hamle bütçesi K-52, hafif öğretici K-53) yeniden
tasarlandı; ASCII taslak, blok tablosu (koordinat, şekil kimliği, renk), kamyon partileri, karalama çözücüsüyle izlenmiş
kanonik çözüm (hamle hamle) ve ölçüt hedefleri JSON'a doğrudan çevrilebilecek kesinliktedir. **Bölüm JSON'ları bu turda
yazılmaz**; code-lead solver'ı (`levels:solve`) hazır olunca yazılır ve ölçütler resmî solver'la doğrulanır (R2-01 çalışma
sırası 3). 11–50. bölümler (§3) eski kurallarla yazılmış tek satırlık kayıtlardır; Faz 3'te §2.0 yöntemiyle yeniden
tasarlanır (§3 başındaki Faz 2R notu).

## 0. Kurallar ve yöntem

**Bölüm akışı (Faz 2R):** plan + blok listesi → ASCII taslak (ters istif, §2.0) → karalama çözücüsüyle ölçütler →
hedef aralığa göre yineleme → JSON → `npm run levels:validate` → `levels:solve` (resmî ölçütler, K-50) → playtest botu
(3 profil × 500) → `docs/LEVEL_REPORT.md` → hamle ayarı (K-52).

**Hamle bütçesi (K-52):** `moves = min + T + a`; `min` solver sonucudur. `T`: Kolay max(6, ⌈0,5·min⌉), Normal max(4,
⌈0,35·min⌉), Zor max(3, ⌈0,2·min⌉), Çok Zor max(2, ⌈0,12·min⌉). `a` = orta bot ayarı, |a| ≤ max(1, ⌊0,1·min⌋), taban
(Kolay 4, Normal 3, Zor 2, Çok Zor 1). **Tanıtım bölümü** (`teaches` dolu): T ve taban bir alt zorluğun satırından
(Normal → Kolay, Zor → Normal, Çok Zor → Zor; K-52, DL-2R-05). Hedef kazanma oranları (orta bot): Kolay ≥ %90, Normal
%65–80, Zor %40–55, Çok Zor %25–40; tanıtım bölümünde bant, kendi bandının üst sınırı ile bir alt zorluğun bandının alt
sınırı arasıdır (Normal tanıtım %80–90, Zor tanıtım %55–65, Çok Zor tanıtım %40–50). `a` sınırı ve taban bandı
tutturmaya yetmezse bölüm yeniden tasarlanır (K-52). Hedef bantlar **bot içindir**; bot K-34 kanca 5 ipuçlarını
(gereken blok nabzı) görmez, bu yüzden Kolay/Normal'de oyuncu oranı bandın üstünde olabilir. §2'deki hamleler `a = 0`
ile hesaplandı; bot ölçümü Faz 2R'nin 3. adımında (R2-01 çalışma sırası).

**Doğrulama notu (Faz 2R):** Bölüm 1–10 taslakları product-lead'in **karalama çözücüsüyle** (Python, oturum
scratchpad'i; proje kodu değil, depoya girmez) hücre hücre ve tam durum uzayında denetlendi. Çözücü GDD Faz 2R
kurallarını uygular: değişken boyut (K-49), duvar sınırı ve açık yükseklik (K-04, K-05), yol kuralı / BFS (K-08),
tutulabilirlik (K-09), kaydırma (K-10), duvar üstü düşüş (K-11), ray (K-12), doğru yerleşim ve Alttan Üste (K-16,
K-34), kamyon dökümü ve kuyruk (K-25, K-26), tam örtü ve kazanma (K-47, K-48), Ağır Yük (Y5). Kapalı olanlar:
güçlendiriciler, Altın Mala, Kamyon Yardımı/Söküm, hatalı yerleşim (yalnız hamle israfıdır). Her bölüm için bütün
erişilebilir durumlar (en büyüğü 446 138 durum, Bölüm 10) açıldı; `min`, `minShifts`, `firstNeedDepth`, F0, `trapCount`,
`deadRate`, `choices@0..2` ve YAO K-50 tanımlarıyla hesaplandı. Kanonik çözüm K-50 madde 4 sırasıyla seçildi. Resmî
sonuç code-lead solver'ınındır; fark çıkarsa solver geçerlidir ve taslak yinelenir.

**JSON eşlemesi:** Blok tablosundaki satır sırası = JSON parti-0 dizi sırası (`piece:<i>`: `a` = 0, `b` = 1 …); parti
blokları `k<parti>_<indeks>` (0 tabanlı; ASCII'de rakamla: `0` = `k1_0` …). Ağır Yük ASCII'de `Q` (Q9) ile çizilir,
`color` yazılmaz. `yard: { cols, rows, batches }`, `site: { cols, rows }` alanları her bölümde yazılır (K-49). Parti k ≥ 1
bloklarında `y = Hy` yazılır (yok sayılır, K-25). `seed` yazılmazsa `id × 1000 + id`. `targets` (isteğe bağlı, oyun
okumaz; TECH §2R.2, P-2R-4 KABUL önerisi): §2 tablosundaki hedef aralıkların makine okunur kopyası (`minShifts`,
`firstNeedDepth`, `choices0`, `deadRate`); `metric_out_of_band` bunu okur; yazarı product-lead. `teaches` yalnızca veri imzası olan
mekanik için yazılır (OBSTACLES "Veri imzası": 4 → W1, 5 → S1, 6 → W2, 8 → Y5, 9 → W3).

**Öğretici adımları (K-53, GDD §14.1):** bölüm başına en çok 2 adım, hepsi yumuşak (`mode` yazılmaz ya da `"soft"`),
spot ışığı yok, oyunu kilitlemez; adım yalnız `done` olayıyla biter (`timeoutMs` yok), el/balon hareketsizlikte
gizlenir/belirir (sunum design-lead'in). Eldiven yolu noktaları **tutulan hücrenin** koordinatıdır (GDD §14 "`hand.path`
anlamı"). Biçim: `adım · vurgu · el · textKey · done (· startOn)`. `done` içindeki `piece:` süzgeci olayı yalnız o
bloğun hamlesiyle sayar (GDD §14.1 madde 3). Kazanılmış bölümün tekrarında öğretici gösterilmez (K-53 madde 6). Metinler STORY §6A'dadır (design-lead, `tut.m.*`); oyuncu metninde renk adı yok
(R-08). Yeni ve metni güncellenecek anahtarlar §2.0 madde 8'de.

**Bölüm süresi hedef bandı (tahmin; entrepreneur önerisi KABUL):** 1–10 = 45–75 sn; 11–30 = 75–120 sn; 31–50 = 100–180 sn.
Bot raporu ve Aşama 0 testinde `level_end.durationMs` medyanıyla ölçülür. Tam örtüde kaydırma hamleleri bölümü
uzattığı için 1–10 (5–13 hamle, ≈ 5 sn/hamle) bandın içindedir.

**Renk ve şekil açılışları** (brif §5, §6; GDD K-31, K-44):

| Hikaye bölümü | Bölümler | Renk havuzu (ilk göründüğü bölüm) | Bölüm başına en çok renk | Şekiller |
|---|---|---|---|---|
| 1 Ağaç Ev | 1–10 | W (1), Y (1), G (2), R (5) | 3 | B1, D2, O4, C3; 8'den itibaren Ağır Yük I5, Q9 |
| 2 Mahalle Fırını | 11–20 | + O, C (11) | 4 | + I3, L4, J4 |
| 3 Okul Kütüphanesi | 21–30 | + B, P (21) | 5 | + T4, S4, Z4 |
| 4 Deniz Feneri ve Köprü | 31–40 | hepsi | 5 | + I4 |
| 5 Festival Şatosu | 41–50 | hepsi | 5 | hepsi |

Renk sayısına bölümdeki **bütün** malzeme blokları (parti 0, bütün kamyon partileri, moloz), plan hücreleri (`?`
çözülmüş rengiyle) ve Boya Kapısı renkleri girer; Ağır Yük renksizdir (GDD K-31). R'nin ilk kullanımı Faz 2R'de
Bölüm 5'tir (brif: 4; renk açılışı "en erken"dir, `color_locked` R için id ≥ 4 ister).

**Testere dişi:** Zor = 10, 15, 25, 35, 45, 49; Çok Zor = 20, 30, 40, 50. Her Zor/Çok Zor bölümden sonraki bölüm
"nefes" bölümüdür (hedef kazanma oranı Normal bandının üstü, %75–80). 49 → 50 istisnadır (büyük final).

**Öğretim kuralı:** Her bölüm en çok 1 yeni mekanik öğretir (GDD K-45/10). **Tanıtım bölümü** = veri imzasına göre yeni
mekaniği olan bölümdür (`teaches` dolu). Tanıtım bölümü sadedir; tamponu bir alt zorluğun formülüyle hesaplanır ve hedef
kazanma oranı Kolay'da ≥ %90, Normal'de %80–90, Zor'da %55–65, Çok Zor'da %40–50'dir (yukarıdaki hamle bütçesi
paragrafı).
İmzasız öğretimler (Faz 2R 1–10): 1 kaldır–taşı–indir, 2 şekil + gölge, 3 kazı (K-10, R2-03), 7 taşınan malzeme (K-27),
10 final; güçlendirici açılışları 8 Çekiç, 10 Vinç (META §4).

**YAO:** Her bölümde çözümdeki yerleşimlerin ≥ %60'ı duvar üstünden (GDD K-46). Geçitli bölümlerde ray yerleşimi
toplam yerleşimin %40'ını aşmaz (Bölüm 4: 1/5, Bölüm 9: 1/4).

**Gösterim (ASCII):** Satırlar yukarıdan aşağıya y = H+1 … 0. Saha hücrelerinde blok harfi (aynı harf = aynı blok; rakam
= kamyon partisi bloğu; `Q` = Ağır Yük), `.` boş, `·` saha üstü hava ya da Vinç Alanı. `D` sütunu duvar sınırıdır
(çekirdekte sıfır genişlik): `#` kapalı, `=` geçit, `:` duvar üstü hava. Şantiyede aktif dilimin planı (renk kodu);
`·` şantiye üstü hava / Vinç Alanı. Çapa = bloğun kutusunun sol alt köşesi (JSON `x, y`). Kamyon partilerinde `x` =
düşeceği sol sütun (GDD K-25).

---

## 1. Zorluk eğrisi (50 bölüm özeti)

| # | Zorluk | Hamle (taslak) | Hedef kazanma (orta bot) | # | Zorluk | Hamle (taslak) | Hedef kazanma (orta bot) |
|---|---|---|---|---|---|---|---|
| 1 | Kolay | 11 | ≥ %95 | 26 | Normal (nefes) | 20 | %80 |
| 2 | Kolay | 9 | ≥ %92 | 27 | Normal | 20 | %70 |
| 3 | Kolay | 11 | ≥ %92 | 28 | Normal | 21 | %70 |
| 4 | Kolay | 12 | ≥ %90 | 29 | Normal | 19 | %70 |
| 5 | Normal (tanıtım) | 17 | %85 | 30 | **Çok Zor** | 27 | %30 |
| 6 | Normal (tanıtım) | 13 | %85 | 31 | Normal (nefes) | 20 | %80 |
| 7 | Normal | 15 | %75 | 32 | Normal | 20 | %70 |
| 8 | Normal (tanıtım) | 14 | %85 | 33 | Normal | 22 | %65 |
| 9 | Normal (tanıtım) | 13 | %85 | 34 | Normal | 22 | %65 |
| 10 | **Zor** | 16 | %45 | 35 | **Zor** | 21 | %50 |
| 11 | Normal (nefes) | 14 | %80 | 36 | Normal (nefes) | 21 | %75 |
| 12 | Normal | 16 | %70 | 37 | Normal | 21 | %70 |
| 13 | Normal | 16 | %70 | 38 | Normal | 21 | %70 |
| 14 | Normal | 15 | %70 | 39 | Normal | 25 | %65 |
| 15 | **Zor** | 16 | %50 | 40 | **Çok Zor** | 29 | %30 |
| 16 | Normal (nefes) | 15 | %80 | 41 | Normal (nefes) | 22 | %80 |
| 17 | Normal | 17 | %70 | 42 | Normal | 24 | %65 |
| 18 | Normal | 19 | %70 | 43 | Normal | 24 | %65 |
| 19 | Normal | 18 | %70 | 44 | Normal | 24 | %70 |
| 20 | **Çok Zor** | 24 | %35 | 45 | **Zor** | 27 | %45 |
| 21 | Normal (nefes) | 16 | %80 | 46 | Normal (nefes) | 27 | %75 |
| 22 | Normal | 17 | %70 | 47 | Normal | 25 | %65 |
| 23 | Normal | 17 | %70 | 48 | Normal | 28 | %65 |
| 24 | Normal | 20 | %70 | 49 | **Zor** | 30 | %45 |
| 25 | **Zor** | 22 | %45 | 50 | **Çok Zor** | 38 | %30 |

Hamle sütunu 1–10 için Faz 2R `karalama çözücüsü min + T` (K-52, `a = 0`; tanıtım bölümlerinde 5, 6, 8, 9 T Kolay
satırından; §2), 11–50 için eski kurallarla `tahmini minimum + eski tampon`dur (Faz 3'te K-52 ile yeniden hesaplanır;
tanıtım bölümleri aynı kuralla). Fark ve gerekçe §4'te. 11–50'nin tanıtım bölümlerinin hedef oranları Faz 3'te
tanıtım bandına (§0) çekilir. "Hedef kazanma" sütunu **bot** oranıdır; bot K-34 kanca 5 ipuçlarını görmez (DL-2R-04).

---

---

## 2. Bölüm 1–10 (Hikaye Bölümü 1 — Ağaç Ev) — Faz 2R dikey dilimi

### 2.0 Bulmaca tasarım yöntemi (Faz 2R; R2-01…R2-04)

Proje sahibinin isteği: "ihtiyacımız olan blok direkt en üstte olmamalı, diğer blokları kaydırmalıyız ki onu bulalım;
şantiye sürekli dolmalı, bölüm sonunda bütün bloklar kullanılmış olmalı." Bölüm 1–10 bu yöntemle kuruldu.

1. **Ters istif (plan ↔ yığın).** Plan alttan üste kurulur (K-34), saha yığını üstten açılır. Bu yüzden planın **alt**
   satırlarının blokları sahada **derinde**, üst satırlarının blokları yığının **üstünde** durur: üstteki blok henüz
   yerleştirilemez (rengi ya da K-34 desteği tutmaz), önce kenara alınmalıdır (kazı). Tam ters istif (yığın = planın
   birebir tersi) her bloğu bir kez park ettirir (`minShifts ≈ N − 1`) ve tekdüzedir; taslaklar **kısmi ters istif**
   kullanır: 1–2 "kapak" blok (sonra gereken, üstte) + kapakların park edileceği bir "cep" + kazısız alınabilen birkaç blok.
   Örnek: Bölüm 6'nın sol yığını alttan `O4` G, `C3_0` W, `C3_180` Y'dir — planın alt beş satırıyla aynı sırada, yani
   açılış sırasının tam tersi; iki kapak (C3'ler) park edilir.
2. **Kaydırma alanı (`E`, K-02).** `2 ≤ E ≤ ⌊0,4·C⌋`. Boşluğun **yeri** zorluğu belirler: yığının yanında açık bir sütun
   (Bölüm 3, 5) kolaydır; dar koridor (Bölüm 4: 1 sütunluk koridor, tıkaç blok), yerleşim sırasına bağlı cep (Bölüm 6:
   üstteki kapak cebe **yüksek** park edilmezse ikincisi sığmaz), Ağır Yük'ün kayacağı 3 hücrelik sütun (Bölüm 8, 10)
   zordur. Saha boyutu (K-49) doluluk bandını tutturmak için bölüm bölüm seçilir: tam örtüde saha malzemesi plan
   kadardır, bu yüzden 1–10'da saha 4×4 … 6×5'tir (varsayılan 6×8 saha 2×8 planla %33 dolardı).
3. **Şaşırtmasız zorluk kaynakları** (şaşırtma yasak, K-47):
   a. **Şekil uyumu:** aynı renk bölgesini yalnız belirli yönelimler doldurur (`C3_0` + `C3_180` çifti, Bölüm 2, 6);
      yanlış yönelim gölgede "!" verir, blok kaybolmaz, sonra kullanılır.
   b. **Renk sırası:** kapak bloğun rengi alt satırlara uymaz ya da K-34 desteği yoktur; erken yerleştirilemez.
   c. **Duvar ve geçit erişimi:** duvar yüksekliği "yukarı"yı büyütür (Bölüm 1–4'te duvar = saha yüksekliği, her blok
      en az 1 satır kalkar; Bölüm 6 ve 10'da duvar = tahta yüksekliği, Vinç Alanı'na çıkılır). Geçit derindeki bloğa
      yatay kısayol verir; taslaklarda kısayol geçitsiz hâle göre **2 hamle** (Bölüm 4) ve **1 hamle** (Bölüm 9)
      kazandırır (karalama çözücüsü karşılaştırması).
   d. **Taşınan malzeme:** sonraki dilimin bloğu bu dilimde engeldir, sonra gerekir (Bölüm 7).
   e. **Ağır Yük kapak:** kaydırmak için önce yan sütun boşaltılır (Bölüm 8, 10); Çekiç bu kazıyı atlatır. Yük yalnız saha
      içinde kayar: saha üstü havaya ve Vinç Alanı'na kalkmaz, blokların üstünden atlamaz (GDD K-08, K-44; DL-2R-08).
      Bu yüzden kısıt hem yolda hem iniştedir; Bölüm 8 ve 10'un kanonik çözümleri yükü yalnız saha içinde kaydırır ve
      bu kuraldan etkilenmez (CL-2R-18 notu).
   f. **Kamyon dökümü:** yeni partinin yığını K-25 sırasıyla tasarlanır; önce düşen blok altta kalır (Bölüm 5, 7, 10).
      Kuyruk bilinçli kullanılabilir: Bölüm 10 dilim 2'de `O4` G ancak Ağır Yük kaydırılınca düşer.
   g. **Saha yerçekimi** (Y6) yığını kendiliğinden açar/kapatır (Faz 3).
4. **Tuzak kaynağı (Kolay/Normal'de yasak, K-51).** Döşeme tuzağı, aynı renkte iki farklı şekil kombinasyonunun aynı
   bölgeye girebildiği yerde doğar: (i) dikey `D2_0` X ile `O4` X'in ya da `C3` X'in dikey çifti; (ii) yatay `D2_90` X ile
   `O4` X'in bir satırı. Kural: bir renk bölgesini tek şekil kombinasyonu doldurur **ya da** aynı renkteki parçalar özdeştir
   (birbirinin yerine geçer). Örnek: Bölüm 3'ün ilk taslağında `D2_0` W ile `O4` W aynı plandaydı; `D2_0` W `O4`'ün
   bölgesine inince bölüm bitmiyordu (çözücü: 20 ✓-tuzağı) → `O4` G yapıldı, tuzak 0. Ws = 3 planlarda 3 renkle bu kural
   sağlanamadı (iki tasarım denendi, ikisinde de dikey çift çakıştı) → S9 hikaye bölümü 2'ye ertelendi.
5. **Zorluk eğrisi.** `minShifts`: 0, 0, 1, 1, 2, 2, 3, 3, 3, 4 (artan); `firstNeedDepth`: 0, 0, 1, 1, 1, 2, 2, 3, 1, 3. Bölüm
   9 W3'ün tanıtımıdır ve sade tutulur (derinlik 1), kazı sayısı 3'te kalır.
6. **Seçenek.** `bestChoices@0` taslakların çoğunda 1'dir (açılışta tek en iyi hamle); `choices@0` 3–12 (oynanabilir ama
   yanlış yollar). Bütçe içinde bütün seçenekler kazanılabilir kalır (Kolay/Normal'de ✓-tuzağı yok, kaydırma geri
   alınabilir), bu yüzden "çıkmaz oranı" 1–10'da 0'dır; zorluk israfın bütçeyi yemesinden gelir.
7. **Öğretici (K-53).** En çok 2 yumuşak adım; adım olayla biter.
8. **Metin anahtarları (STORY §6A, design-lead):** Bölüm 1–10 öğreticisi design-lead'in mekanik bazlı `tut.m.*`
   anahtarlarını kullanır (GDD §14.1 madde 1, Faz 2R). Kullanılanlar: `tut.m.lift`, `tut.m.useall`, `tut.m.pattern`,
   `tut.m.shadow`, `tut.m.dig` (Bölüm 3, 4, 9), `tut.m.free`, `tut.m.gap`, `tut.m.segments`, `tut.m.truck`,
   `tut.m.highwall`, `tut.m.heavy`, `tut.m.hammer`, `tut.m.narrow`, `tut.m.cranebooster`. **Yeni istenen** (design-lead
   yazar): `tut.m.park` ("Üsttekini yükseğe park et."), `tut.m.carry` ("Bu blok sonraki kat için."), `tut.m.carryNow`
   ("Şimdi sırası geldi."), `tut.ctx.teardown` (Söküm genel satırı) ve Söküm nedeni satırları (`tiling`, `access`,
   `color`; K-30, DL-2R-12), `booster.hammer.noTarget` (K-36, K-54). **Metni güncellenecek:** `tut.m.heavy` ("Geniş
   blok" → Ağır Yük, Y5 yeniden tanımı; Ağır Yük'e "blok" denmez), `tut.m.hammer` (Çekiç malzeme kırmaz, yükü/engeli
   kırar, K-36), `tut.m.gap` (geçit = alttaki bloğa kestirme, OBSTACLES W1 kartı). Kullanılmayan: `tut.m.match`,
   `tut.m.rail`, `tut.m.drop`.

**Bölüm 1–10 özeti** (`N` = malzeme bloğu, `E` = başta boş saha hücresi, `d` = `firstNeedDepth`, `s` = `minShifts`, ch =
`choices@0·1·2 / bestChoices@0·1·2`; hedef aralıklar `metric_out_of_band` için):

| # | Ad | Zorluk | Öğretir (imza) | Saha Wy×Hy | Şantiye Ws×Hs × dilim | H / duvar / geçit | Renkler | Şekiller | N | E | min | s (hedef) | d (hedef) | YAO | ch | T | Hamle | Kazanma hedefi |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Ağaç Basamakları | Kolay | kaldır–taşı–indir (—) | 4×4 | 2×5 × 1 | 5 / 4 / — | W, Y | D2 | 5 | 6 | 5 | 0 (0) | 0 (0) | 5/5 | 11·11·16 / 2·1·1 | 6 | **11** | ≥ %95 |
| 2 | Platform | Kolay | şekil + gölge (—) | 4×4 | 2×5 × 1 | 5 / 4 / — | G, W, Y | O4, C3 | 3 | 6 | 3 | 0 (0) | 0 (0) | 3/3 | 7·13·9 / 1·1·1 | 6 | **9** | ≥ %92 |
| 3 | Ön Duvar | Kolay | kazı (—) | 4×4 | 2×5 × 1 | 5 / 4 / — | G, W, Y | D2, O4 | 4 | 6 | 5 | 1 (1) | 1 (1) | 4/4 | 6·9·10 / 3·1·1 | 6 | **11** | ≥ %92 |
| 4 | Pencere Pervazı | Kolay | W1 Sabit Geçit | 4×4 | 2×6 × 1 | 6 / 4 / y0 boy 2 | G, W, Y | D2, O4 | 5 | 4 | 6 | 1 (1–2) | 1 (1) | 4/5 | 9·9·17 / 1·1·1 | 6 | **12** | ≥ %90 |
| 5 | İki Odalı Ev | Normal (tanıtım) | S1 Kayan Şantiye + kamyon | 4×4 | 2×5 × 2 | 5 / 4 / — | R, W, Y | D2, O4 | 9 | 6 | 11 | 2 (2–3, her dilimde ≥ 1) | 1 (1–2) | 9/9 | 11·8·14 / 2·1·1 | 6 (tanıtım) | **17** | %85 |
| 6 | Uzun Gövde | Normal (tanıtım) | W2 Yüksek Duvar | 4×5 | 2×7 × 1 | 7 / 7 / — | G, W, Y | D2, O4, C3 | 5 | 6 | 7 | 2 (2–3) | 2 (2) | 5/5 | 7·9·10 / 1·1·1 | 6 (tanıtım) | **13** | %85 |
| 7 | Çatı Altı | Normal | taşınan malzeme (—) | 4×5 | 2×5 × 2 | 5 / 5 / — | G, R, W | D2, O4 | 8 | 6 | 11 | 3 (3–4, dilim 2'de ≥ 1) | 2 (2) | 8/8 | 8·10·12 / 1·1·1 | 4 | **15** | %75 |
| 8 | Bahçe Çiti | Normal (tanıtım) | Y5 Ağır Yük + Çekiç | 6×5 | 2×6 × 1 | 6 / 5 / — | R, W, Y | D2, O4, Q9 | 5 | 9 | 8 | 3 (3–4) | 3 (2–3) | 5/5 | 12·15·16 / 1·1·2 | 6 (tanıtım) | **14** | %85 |
| 9 | İp Merdiven | Normal (tanıtım) | W3 Dar Geçit | 4×4 | 2×6 × 1 | 6 / 4 / y0 boy 1 | G, R, W | D2, O4 | 4 | 4 | 7 | 3 (3–4) | 1 (1–2) | 3/4 | 3·5·5 / 1·1·1 | 6 (tanıtım) | **13** | %85 |
| 10 | Ağaç Ev Tamam! | **Zor** | final + Vinç | 6×5 | 2×6 × 2 | 6 / 6 / — | G, R, W | D2, O4, Q9 | 9 | 9 | 13 | 4 (4–5) | 3 (3) | 9/9 | 12·15·16 / 1·1·2 | 3 | **16** | %45 |

Bütün satırlarda `trapCount = 0`, `deadRate = 0`, K-02 bandı tutuyor. **Varyant ölçütleri** (K-50 ölçütü değil, solver
varyantı; `levels:solve --variant no-gaps|hammer-start`, sonuç LEVEL_REPORT'ta; CL-2R-13): Bölüm 4 ve 9 için
`geçitsiz min − min ≥ 1` (karalama: 4'te 8 − 6 = 2, 9'da 8 − 7 = 1); Bölüm 8 ve 10 için `min − Çekiç'le min ≥ 2`
(`hammer-start`: başta bütün Ağır Yük silinir; karalama: 8'de 8 − 5 = 3). Bant tutmazsa geçit ya da yük bölümde
gereksizdir ve bölüm yeniden tasarlanır. Bölüm 10 `batch_queued` uyarısı bilinçlidir (dilim 2 kuyruğu, E-54) ve
`tools/levels-allow.json`'da susturulur (K-45 madde 9; code-lead dosyası).

**Boyut gerekçeleri (K-49):** Bölüm 1–5: 4×4 saha, şantiye 2×5/2×6 — en küçük okunur yığın, doluluk %62–%75, H = 5–6 ile
duvar (4) saha tepesinin üstünde: her blok en az 1 satır kalkar. Bölüm 6: saha 4×5, şantiye 2×7, H = 7 = duvar → yüksek
duvar dersi için blok sahanın tepesinden 3 satır kalkar. Bölüm 7: iki dilim + taşınan `O4` için 4×5. Bölüm 8 ve 10: Ağır
Yük (3×3) ve yanında kayma sütunu için varsayılan genişlik 6 (Wy + Ws = 8). Bölüm 9: 4×4, dar geçidin önündeki tıkaç
dersi küçük sahada okunur.

### Bölüm 1 — Ağaç Basamakları (Tree Steps)

| Alan | Değer |
|---|---|
| Öğretilen | Kaldır–taşı–indir (duvar üstü + düşme); imza yok (`tutorial`) |
| Zorluk / hedef kazanma | Kolay / ≥ %95 |
| Boyut (K-49) | `yard { cols 4, rows 4 }`, `site { cols 2, rows 5 }` → H = 5, Vinç Alanı y = 5–6 |
| Duvar | `height 4` (saha tepesiyle aynı: her blok saha üstü havaya kalkar); geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Basamaklar (EN: Steps) `["WW", "YY", "WW", "YW", "YW"]` |
| Renkler / şekiller | W, Y (2) / D2 |
| Saha | C = 16, F = 10, E = 6 (= ⌊6,4⌋, üst sınır) |
| Ölçütler (karalama çözücüsü) | N 5 · min 5 · minShifts 0 · firstNeedDepth 0 · F0 {`a`, `b`} · YAO 5/5 · trapCount 0 · choices@0..2 11, 11, 16 · best 2, 1, 1 |
| Hamle (K-52) | 5 + max(6, 3) = **11** |

**Tasarım niyeti:** Oyuncu bloğu yukarı kaldırıp duvarın üstünden aşırmanın ve bırakınca düşmenin temel hareket
olduğunu keşfeder; yığının üstünün planın altı olduğunu (ters istif) ilk kez görür. Kazı yok (öğretici).

```
       x: 0 1 2 3   D   4 5
   y=6:  · · · ·   :   · ·  ← Vinç Alanı
   y=5:  · · · ·   :   · ·
   y=4:  · · · ·   :   W W
   y=3:  a b . .   #   Y Y
   y=2:  a b . .   #   W W
   y=1:  c c d d   #   Y W
   y=0:  e e . .   #   Y W
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_0` | Y | (0,2) | ilk gereken (y0–1 sütun 0) |
| `b` | `D2_0` | W | (1,2) | ilk gereken (y0–1 sütun 1) |
| `c` | `D2_90` | W | (0,1) | y2 (ya da y4; `e` ile özdeş) |
| `d` | `D2_90` | Y | (2,1) | y3 |
| `e` | `D2_90` | W | (0,0) | y4 |

Kanonik çözüm (karalama çözücüsü, hamle hamle):
1. `b` (D2_0 W) (1,2) → saha üstü havaya kaldır → duvar üstünden → bırak → (5,0) — duvar üstü, doğru
2. `a` (D2_0 Y) (0,2) → (4,0) — duvar üstü, doğru
3. `c` (D2_90 W) (0,1) → (4,2) — duvar üstü, doğru
4. `d` (D2_90 Y) (2,1) → (4,3) — duvar üstü, doğru
5. `e` (D2_90 W) (0,0) → (4,4) — duvar üstü, doğru → dilim tamam, saha boş → kazanma (K-48)

Öğretici (`tutorial[]`, K-53):
1. `piece:0`, `crane` · drag `[[0,3],[0,5],[4,5]]` (tutulan hücre `a`'nın üst hücresi (0,3); son çapa (4,4), düşüş (4,0),
   doğru) · `tut.m.lift` · `{ event: placementCorrect, count: 1 }`
2. `goals` (kalan blok çipi, UX §5.9) · — · `tut.m.useall` · `{ event: placementCorrect, count: 1 }`

### Bölüm 2 — Platform (Platform)

| Alan | Değer |
|---|---|
| Öğretilen | Şekil uyumu + düşüş gölgesi (`C3` çifti); imza yok (`tutorial`) |
| Zorluk / hedef kazanma | Kolay / ≥ %92 |
| Boyut | `yard { cols 4, rows 4 }`, `site { cols 2, rows 5 }` → H = 5 |
| Duvar | `height 4`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Platform (EN: Platform) `["YY", "WY", "WW", "GG", "GG"]` (çapraz şerit = `C3_0` + `C3_180`) |
| Renkler / şekiller | G, W, Y (3) / O4, C3 |
| Saha | C = 16, F = 10, E = 6 |
| Ölçütler | N 3 · min 3 · minShifts 0 · firstNeedDepth 0 · F0 {`a`} · YAO 3/3 · trapCount 0 · choices 7, 13, 9 · best 1, 1, 1 |
| Hamle | 3 + 6 = **9** |

**Tasarım niyeti:** En üstteki `c` (`C3_180` Y) ilk göze çarpan bloktur ama gölgesi "!" gösterir (renk + destek); oyuncu
gölgenin doğruyu söylediğini ve yanlış zamanda gelen bloğun kaybolmadığını, sırası gelince kullanıldığını keşfeder.
`b` (`C3_0` W) sağa kayıp boş sütundan çıkar (yol kuralı ilk kez görünür).

```
       x: 0 1 2 3   D   4 5
   y=6:  · · · ·   :   · ·  ← Vinç Alanı
   y=5:  · · · ·   :   · ·
   y=4:  · · · ·   :   Y Y
   y=3:  c c a a   #   W Y
   y=2:  . c a a   #   W W
   y=1:  b . . .   #   G G
   y=0:  b b . .   #   G G
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `O4_0` | G | (2,2) | ilk gereken (y0–1) |
| `b` | `C3_0` | W | (0,0) | y2–3 |
| `c` | `C3_180` | Y | (0,2) | y3–4; üstte, gölgesi önce "!" |

Kanonik çözüm:
1. `a` (O4_0 G) (2,2) → (4,0) — duvar üstü, doğru
2. `b` (C3_0 W) (0,0) → sağa (2,0) → yukarı → duvar üstünden → (4,2) — duvar üstü, doğru (hücreler (4,2),(5,2),(4,3))
3. `c` (C3_180 Y) (0,2) → (4,3) — duvar üstü, doğru (hücreler (5,3),(4,4),(5,4)) → kazanma

Öğretici:
1. `front`, `build` · — · `tut.m.pattern` · `{ event: placementCorrect, count: 1 }` (tek dilimli bölümde panorama
   şantiyenin kopyasıdır; "alttan üste" fikrini inşa cephesi gösterir, DL-2R-10)
2. `piece:2`, `build` · hold `[[1,3],[1,5],[5,5]]` (`c`'nin sağ üst hücresi (1,3), ofset (1,1); son çapa (4,4) tamamen
   şantiye üstünde; gölge (4,2)'ye iner ve renk + destek için "!" gösterir) · `tut.m.shadow` · `{ event: placementCorrect,
   count: 1 }`

### Bölüm 3 — Ön Duvar (Front Wall)

| Alan | Değer |
|---|---|
| Öğretilen | **Kazı** (sahada yeniden konumlandırma, K-10; R2-03 "en geç Bölüm 3"); imza yok (`tutorial`) |
| Zorluk / hedef kazanma | Kolay / ≥ %92 |
| Boyut | `yard { cols 4, rows 4 }`, `site { cols 2, rows 5 }` → H = 5 |
| Duvar | `height 4`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Ön Duvar (EN: Front Wall) `["YY", "GG", "GG", "YW", "YW"]` |
| Renkler / şekiller | G, W, Y (3) / D2, O4 |
| Saha | C = 16, F = 10, E = 6 |
| Ölçütler | N 4 · min 5 · **minShifts 1** · **firstNeedDepth 1** · F0 {`a`, `b`} (ikisi de `c`'nin altında, `cover` 1) · YAO 4/4 · trapCount 0 · choices 6, 9, 10 · best 3, 1, 1 |
| Hamle | 5 + 6 = **11** |

**Tasarım niyeti:** İlk gereken iki dikey blok, sonra gereken `O4` G'nin altındadır; `O4` G henüz yerleşemez (y2–3,
altı boş). Oyuncu "üstteki bloğu boş yere çek, alttakini al" kazısını keşfeder. Kapak sağa bir sütun kayınca sol sütun
açılır; `b` önce sola, sonra yukarı tünelden çıkar.

```
       x: 0 1 2 3   D   4 5
   y=6:  · · · ·   :   · ·  ← Vinç Alanı
   y=5:  · · · ·   :   · ·
   y=4:  · · · ·   :   Y Y
   y=3:  c c . .   #   G G
   y=2:  c c . .   #   G G
   y=1:  a b . .   #   Y W
   y=0:  a b d d   #   Y W
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_0` | Y | (0,0) | ilk gereken (y0–1 sütun 0), gömülü |
| `b` | `D2_0` | W | (1,0) | ilk gereken (y0–1 sütun 1), gömülü |
| `c` | `O4_0` | G | (0,2) | kapak (y2–3) |
| `d` | `D2_90` | Y | (2,0) | y4 |

Kanonik çözüm:
1. `c` (O4_0 G) (0,2) → (1,2) — **kaydırma** (sol sütun açılır)
2. `a` (D2_0 Y) (0,0) → yukarı (0,2)… → duvar üstünden → (4,0) — duvar üstü, doğru
3. `b` (D2_0 W) (1,0) → sola (0,0) → yukarı → (5,0) — duvar üstü, doğru
4. `c` (O4_0 G) (1,2) → (4,2) — duvar üstü, doğru
5. `d` (D2_90 Y) (2,0) → (4,4) — duvar üstü, doğru → kazanma

Tuzak notu: ilk taslakta y2–3 `WW` ve kapak `O4` W idi; `b` (`D2_0` W) sütun 0'ın y2–3'üne de ✓ iniyordu ve bölüm
bitmiyordu (20 ✓-tuzağı geçişi) → kapak G yapıldı (§2.0 madde 4).

Öğretici:
1. `piece:2` · drag `[[0,3],[1,3]]` · `tut.m.dig` · `{ event: yardMove, count: 1, piece: 'piece:2' }` (`d`'nin
   kaydırılması adımı bitirmez, DL-2R-02)
2. `piece:0`, `piece:1` · — · `tut.m.free` · `{ event: placementCorrect, count: 1 }`

### Bölüm 4 — Pencere Pervazı (Window Sill)

| Alan | Değer |
|---|---|
| Öğretilen | **W1 Sabit Geçit** + ray (`teaches: "W1"`); yapı parçası "pencere pervazı" (dolu bant; S2 MVP dışı, plan dolu; DL-2R-11) |
| Zorluk / hedef kazanma | Kolay / ≥ %90 |
| Boyut | `yard { cols 4, rows 4 }`, `site { cols 2, rows 6 }` → H = 6, Vinç Alanı y = 6–7 |
| Duvar | `height 4`; geçit `{ type: "static", y: 0, size: 2 }` (boy 2: W3 dar geçit 9'a kalır, R-21) |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Pervaz (EN: Sill) `["YY", "GG", "GG", "YY", "WW", "WW"]` |
| Renkler / şekiller | G, W, Y (3) / D2, O4 |
| Saha | C = 16, F = 12, E = 4 |
| Ölçütler | N 5 · min 6 · minShifts 1 · firstNeedDepth 1 · F0 {`a`} (`cover` 2) · YAO 4/5 (1 ray) · trapCount 0 · choices 9, 9, 17 · best 1, 1, 1 · **geçitsiz min 8** (ray 2 hamle kazandırır) |
| Hamle | 6 + 6 = **12** |

**Tasarım niyeti:** İlk gereken `O4` W yığının en altında, iki `D2_90` Y'nin altındadır; duvar üstünden çıkarmak iki kazı
ister. Ama `O4` geçit satırlarında (y0–1) durur ve önündeki 1 sütunluk koridor boştur; tek engel duvarın dibindeki
"tıkaç" `c`'dir. Oyuncu tıkacı kaldırınca bloğun geçitten yatay kayıp raya girdiğini ve düşmediğini keşfeder.

```
       x: 0 1 2 3   D   4 5
   y=7:  · · · ·   :   · ·  ← Vinç Alanı
   y=6:  · · · ·   :   · ·
   y=5:  · · · ·   :   Y Y
   y=4:  · · · ·   :   G G
   y=3:  b b . d   #   G G
   y=2:  e e . d   #   Y Y
   y=1:  a a . c   =   W W
   y=0:  a a . c   =   W W
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `O4_0` | W | (0,0) | ilk gereken (y0–1), raydan |
| `b` | `D2_90` | Y | (0,3) | y2 (ya da y5; `e` ile özdeş) |
| `c` | `D2_0` | G | (3,0) | tıkaç; y3–4 (ya da sütun 1) |
| `d` | `D2_0` | G | (3,2) | y3–4 |
| `e` | `D2_90` | Y | (0,2) | y5 |

Kanonik çözüm:
1. `c` (D2_0 G) (3,0) → sola (2,0) → yukarı → (2,2) — **kaydırma** (koridor ve geçit önü açılır)
2. `a` (O4_0 W) (0,0) → sağa (1,0), (2,0) → geçitten raya → (4,0)'da bırak — **ray**, doğru (düşmez)
3. `b` (D2_90 Y) (0,3) → (4,2) — duvar üstü, doğru
4. `c` (D2_0 G) (2,2) → (4,3) — duvar üstü, doğru
5. `d` (D2_0 G) (3,2) → (5,3) — duvar üstü, doğru
6. `e` (D2_90 Y) (0,2) → (4,5) — duvar üstü, doğru → kazanma

Öğretici:
1. `gap:0`, `piece:2` · drag `[[3,1],[2,1],[2,3]]` · `tut.m.dig` · `{ event: yardMove, count: 1, piece: 'piece:2' }`
   (`b` ya da `d` kaydırılırsa adım sürer, DL-2R-02)
2. `piece:0`, `gap:0` · drag `[[1,1],[5,1]]` (`a`'nın sağ üst hücresi (1,1), ofset (1,1); son çapa (4,0) rayda, K-07 satır
   7, doğru; eski `[[1,1],[4,1]]` çapayı (3,0) yapıp sınırı kesiyordu, DL-2R-01) · `tut.m.gap` · `{ event: placementCorrect,
   count: 1 }`

### Bölüm 5 — İki Odalı Ev (Two-Room House)

| Alan | Değer |
|---|---|
| Öğretilen | **S1 Kayan Şantiye** + kamyon teslimatı (`teaches: "S1"`) |
| Zorluk / hedef kazanma | Normal (tanıtım) / %85 (tanıtım bandı %80–90) |
| Boyut | `yard { cols 4, rows 4 }`, `site { cols 2, rows 5 }` → H = 5 |
| Duvar | `height 4`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Sol Oda (EN: Left Room) `["WW", "WY", "WY", "RR", "RR"]` → 2. Sağ Oda (EN: Right Room) `["RR", "YY", "RW", "RW", "YY"]` |
| Renkler / şekiller | R, W, Y (3) / D2, O4 |
| Saha | C = 16, F = 10, E = 6 (parti 0 = dilim 1'in malzemesi) |
| Ölçütler | N 9 · min 11 · minShifts 2 (dilim 1: 1, dilim 2: 1) · firstNeedDepth 1 · F0 {`a`} · YAO 9/9 · trapCount 0 · choices 11, 8, 14 · best 2, 1, 1 |
| Hamle | 11 + max(6, ⌈5,5⌉) = **17** (tanıtım: Kolay satırı, K-52; taban 4) |

**Tasarım niyeti:** Oyuncu bir dilim bitince şantiyenin kaydığını, kamyonun boşalan sahaya yeni yığın döktüğünü ve yeni
yığının da bir kapakla geldiğini keşfeder. Her dilim kendi malzemesiyle tam örtülür (parti = dilim).

Dilim 1 başlangıcı:
```
       x: 0 1 2 3   D   4 5
   y=6:  · · · ·   :   · ·  ← Vinç Alanı
   y=5:  · · · ·   :   · ·
   y=4:  · · · ·   :   W W
   y=3:  . . . .   #   W Y
   y=2:  d d . .   #   W Y
   y=1:  a a b c   #   R R
   y=0:  a a b c   #   R R
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `O4_0` | R | (0,0) | ilk gereken (y0–1), kapak altında |
| `b` | `D2_0` | W | (2,0) | y2–3 sütun 0 |
| `c` | `D2_0` | Y | (3,0) | y2–3 sütun 1 |
| `d` | `D2_90` | W | (0,2) | kapak; y4 |

Kamyon partisi 1 (dilim 1 tamamlanınca, dizi sırasıyla; `y = 4`): `k1_0` `D2_0` R x=0 · `k1_1` `D2_0` W x=1 · `k1_2`
`D2_90` Y x=0 · `k1_3` `D2_90` Y x=2 · `k1_4` `D2_90` R x=1. Boş sahaya düşüş (K-25): `k1_0` (0,0), `k1_1` (1,0), `k1_2`
(0,2), `k1_3` (2,0), `k1_4` (1,3) — kuyruk yok.

Dilim 2 başlangıcı (5. hamleden sonra):
```
       x: 0 1 2 3   D   4 5
   y=6:  · · · ·   :   · ·  ← Vinç Alanı
   y=5:  · · · ·   :   · ·
   y=4:  · · · ·   :   R R
   y=3:  . 4 4 .   #   Y Y
   y=2:  2 2 . .   #   R W
   y=1:  0 1 . .   #   R W
   y=0:  0 1 3 3   #   Y Y
```

Kanonik çözüm:
1. `d` (D2_90 W) (0,2) → (2,2) — **kaydırma**
2. `a` (O4_0 R) (0,0) → (4,0) — duvar üstü, doğru
3. `b` (D2_0 W) (2,0) → (4,2) — duvar üstü, doğru
4. `c` (D2_0 Y) (3,0) → (5,2) — duvar üstü, doğru
5. `d` (D2_90 W) (2,2) → (4,4) — duvar üstü, doğru → dilim 1 tamam, kayma, parti 1 düşer
6. `k1_4` (D2_90 R) (1,3) → (0,3) — **kaydırma** (sağdaki baca açılır)
7. `k1_2` (D2_90 Y) (0,2) → sağa (2,2) → yukarı → (4,0) — duvar üstü, doğru
8. `k1_1` (D2_0 W) (1,0) → (5,1) — duvar üstü, doğru
9. `k1_0` (D2_0 R) (0,0) → (4,1) — duvar üstü, doğru
10. `k1_3` (D2_90 Y) (2,0) → (4,3) — duvar üstü, doğru
11. `k1_4` (D2_90 R) (0,3) → (4,4) — duvar üstü, doğru → kazanma

Öğretici:
1. `panorama` · — · `tut.m.segments` · `{ event: segmentDone, count: 1 }`
2. `piece:k1_0`, `piece:k1_1`, `piece:k1_2`, `piece:k1_3`, `piece:k1_4` (yeni düşen 5 blok; `N = 0` iken kamyon
   göstergesi gizli olduğundan `truck` vurgulanmaz, DL-2R-03) · — · `tut.m.truck` · `{ event: placementCorrect, count: 1 }`
   (adım 1 dilim tamamlanınca biter; teslimat aynı hamlenin 9. adımında olduğu için adım 2 `deliveryDone`'la bitseydi
   hiç görünmezdi — dilim 2'nin ilk doğru yerleşimine kadar etkin kalır)

### Bölüm 6 — Uzun Gövde (Tall Trunk)

| Alan | Değer |
|---|---|
| Öğretilen | **W2 Yüksek Duvar** (`teaches: "W2"`): duvar = tahta yüksekliği, Vinç Alanı'na kaldırma |
| Zorluk / hedef kazanma | Normal (tanıtım) / %85 (tanıtım bandı %80–90) |
| Boyut | `yard { cols 4, rows 5 }`, `site { cols 2, rows 7 }` → H = 7, Vinç Alanı y = 7–8 |
| Duvar | `height 7` (= H); geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Uzun Gövde (EN: Tall Trunk) `["YY", "YY", "YY", "WY", "WW", "GG", "GG"]` |
| Renkler / şekiller | G, W, Y (3) / D2, O4, C3 |
| Saha | C = 20, F = 14, E = 6 |
| Ölçütler | N 5 · min 7 · minShifts 2 · firstNeedDepth 2 · F0 {`a`} (`cover` 2) · YAO 5/5 · trapCount 0 · choices 7, 9, 10 · best 1, 1, 1 |
| Hamle | 7 + max(6, ⌈3,5⌉) = **13** (tanıtım: Kolay satırı, K-52; taban 4) |

**Tasarım niyeti:** Sol yığın alttan `O4` G, `C3_0` W, `C3_180` Y'dir — planın alt beş satırı, açılış sırasının tam
tersi. İki C3 kapak sağdaki cebe park edilir; cebe ilk giren `c` **yükseğe** (2,3) konmazsa `b` altına sığmaz ve fazladan
hamle gerekir ("üsttekini yükseğe park et"). Yüksek duvar her bloğu saha tepesinden 3 satır yukarı, Vinç Alanı'na
kaldırtır.

```
       x: 0 1 2 3   D   4 5
   y=8:  · · · ·   :   · ·  ← Vinç Alanı
   y=7:  · · · ·   :   · ·
   y=6:  · · · ·   #   Y Y
   y=5:  · · · ·   #   Y Y
   y=4:  c c . .   #   Y Y
   y=3:  b c . .   #   W Y
   y=2:  b b . .   #   W W
   y=1:  a a e e   #   G G
   y=0:  a a d d   #   G G
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `O4_0` | G | (0,0) | ilk gereken (y0–1), iki kapak altında |
| `b` | `C3_0` | W | (0,2) | kapak 2; y2–3 |
| `c` | `C3_180` | Y | (0,3) | kapak 1; y3–4 |
| `d` | `D2_90` | Y | (2,0) | y5 (`e` ile özdeş) |
| `e` | `D2_90` | Y | (2,1) | y6 |

Kanonik çözüm:
1. `c` (C3_180 Y) (0,3) → (2,3) — **kaydırma** (cebin üstüne; hücreler (3,3),(2,4),(3,4))
2. `b` (C3_0 W) (0,2) → (2,2) — **kaydırma** (`c`'nin altına kilitlenir; hücreler (2,2),(3,2),(2,3))
3. `a` (O4_0 G) (0,0) → yukarı Vinç Alanı'na (y ≥ 7) → duvar üstünden → (4,0) — duvar üstü, doğru
4. `b` (C3_0 W) (2,2) → (4,2) — duvar üstü, doğru
5. `c` (C3_180 Y) (2,3) → (4,3) — duvar üstü, doğru
6. `d` (D2_90 Y) (2,0) → (4,5) — duvar üstü, doğru
7. `e` (D2_90 Y) (2,1) → (4,6) — duvar üstü, doğru → kazanma

Öğretici:
1. `piece:2`, `cell:2,4`, `cell:3,4` · drag `[[1,4],[3,4]]` (`c`'nin sağ üst hücresi (1,4), ofset (1,1); son çapa (2,3))
   · `tut.m.park` (yeni) · `{ event: yardMove, count: 1, at: [2, 3] }` (yalnız yüksek park adımı bitirir; alçak park ya
   da `e`'nin cebe konması bitirmez, DL-2R-02)
2. `crane`, `wall` · — · `tut.m.highwall` · `{ event: overWall, count: 1 }`

### Bölüm 7 — Çatı Altı (Under the Roof)

| Alan | Değer |
|---|---|
| Öğretilen | **Taşınan malzeme** (sonraki dilimin bloğu bu dilimde sahada, K-27); imza yok (`tutorial`). W2 pekiştirilir. |
| Zorluk / hedef kazanma | Normal / %75 |
| Boyut | `yard { cols 4, rows 5 }`, `site { cols 2, rows 5 }` → H = 5 |
| Duvar | `height 5` (= H, W2); geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Kiriş (EN: Beam) `["WW", "GW", "GW", "RR", "RR"]` → 2. Saçak (EN: Eaves) `["RR", "RW", "RW", "GG", "GG"]` |
| Renkler / şekiller | G, R, W (3) / D2, O4 |
| Saha | C = 20, F = 14 (dilim 1'in 10 hücresi + taşınan `O4` G), E = 6 |
| Ölçütler | N 8 · min 11 · minShifts 3 (dilim 1: 2, dilim 2: 1) · firstNeedDepth 2 · F0 {`a`} · YAO 8/8 · trapCount 0 · choices 8, 10, 12 · best 1, 1, 1 |
| Hamle | 11 + max(4, ⌈3,85⌉) = **15** |

**Tasarım niyeti:** Sağ alttaki `e` (`O4` G) dilim 1'de hiçbir yere uymaz (planında G 2×2 yok); oyuncu onun **sonraki kat
için** sahada beklediğini, yerinden oynatmadan etrafından kazmayı keşfeder. Dilim 2'de kamyon yığını `e`'nin üstüne
döker; `e` ilk gereken olur ve sol köşedeki `k1_1` kaydırılınca sola kayıp çıkar.

Dilim 1 başlangıcı:
```
       x: 0 1 2 3   D   4 5
   y=6:  · · · ·   :   · ·  ← Vinç Alanı
   y=5:  · · · ·   :   · ·
   y=4:  . b . .   #   W W
   y=3:  . b . c   #   G W
   y=2:  d d . c   #   G W
   y=1:  a a e e   #   R R
   y=0:  a a e e   #   R R
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `O4_0` | R | (0,0) | ilk gereken (dilim 1 y0–1) |
| `b` | `D2_0` | G | (1,3) | kapak; dilim 1 y2–3 sütun 0 |
| `c` | `D2_0` | W | (3,2) | dilim 1 y2–3 sütun 1 |
| `d` | `D2_90` | W | (0,2) | kapak; dilim 1 y4 |
| `e` | `O4_0` | G | (2,0) | **taşınan malzeme**: dilim 2 y0–1 |

Kamyon partisi 1 (dilim 1 tamamlanınca; `y = 5`): `k1_0` `D2_0` W x=2 · `k1_1` `D2_90` R x=0 · `k1_2` `D2_0` R x=2.
Düşüş: `k1_0` (2,2) (`e`'nin üstüne), `k1_1` (0,0), `k1_2` x=2 dolu (y=4'e iner, taşar) → aday x=3 → (3,2). Kuyruk yok.

Dilim 2 başlangıcı (6. hamleden sonra):
```
       x: 0 1 2 3   D   4 5
   y=6:  · · · ·   :   · ·  ← Vinç Alanı
   y=5:  · · · ·   :   · ·
   y=4:  . . . .   #   R R
   y=3:  . . 0 2   #   R W
   y=2:  . . 0 2   #   R W
   y=1:  . . e e   #   G G
   y=0:  1 1 e e   #   G G
```

Kanonik çözüm:
1. `b` (D2_0 G) (1,3) → (2,2) — **kaydırma**
2. `d` (D2_90 W) (0,2) → (2,4) — **kaydırma**
3. `a` (O4_0 R) (0,0) → (4,0) — duvar üstü, doğru
4. `b` (D2_0 G) (2,2) → (4,2) — duvar üstü, doğru
5. `c` (D2_0 W) (3,2) → (5,2) — duvar üstü, doğru
6. `d` (D2_90 W) (2,4) → (4,4) — duvar üstü, doğru → dilim 1 tamam, kayma, parti 1 düşer
7. `k1_1` (D2_90 R) (0,0) → (2,4) — **kaydırma** (sol köşe boşalır)
8. `e` (O4_0 G) (2,0) → sola (0,0) → yukarı → (4,0) — duvar üstü, doğru
9. `k1_2` (D2_0 R) (3,2) → (4,2) — duvar üstü, doğru
10. `k1_0` (D2_0 W) (2,2) → (5,2) — duvar üstü, doğru
11. `k1_1` (D2_90 R) (2,4) → (4,4) — duvar üstü, doğru → kazanma

Öğretici:
1. `piece:4`, `panorama` · — (eldiven yok: `e` başta tutulamaz, K-09) · `tut.m.carry` (yeni) · `{ event:
   placementCorrect, count: 1 }` (sonraki kat yalnız panoramada görünür, DL-2R-10)
2. `startOn: { event: segmentDone }` · `piece:4` · — · `tut.m.carryNow` (yeni) · `{ event: placementCorrect, count: 1 }`

### Bölüm 8 — Bahçe Çiti (Garden Fence)

| Alan | Değer |
|---|---|
| Öğretilen | **Y5 Ağır Yük** (`teaches: "Y5"`) + Çekiç açılır (META §4: 3 ücretsiz deneme) |
| Zorluk / hedef kazanma | Normal (tanıtım) / %85 (tanıtım bandı %80–90) |
| Boyut | `yard { cols 6, rows 5 }`, `site { cols 2, rows 6 }` → H = 6 (varsayılan genişlik 6 + 2) |
| Duvar | `height 5`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Çit (EN: Fence) `["WW", "YY", "YW", "YW", "RR", "RR"]` |
| Renkler / şekiller | R, W, Y (3) / D2, O4; Ağır Yük Q9 |
| Saha | C = 30, F = 21 (12 malzeme + 9 Ağır Yük), E = 9 |
| Ölçütler | N 5 · min 8 · minShifts 3 · firstNeedDepth 3 · F0 {`a`} (`cover` 1: Ağır Yük) · YAO 5/5 · trapCount 0 · choices 12, 15, 16 · best 1, 1, 2 · **Çekiç'le (başta Ağır Yük kırılırsa) min 5** |
| Hamle | 8 + max(6, ⌈4⌉) = **14** (tanıtım: Kolay satırı, K-52; taban 4) |

**Tasarım niyeti:** Paletli yük (`f`, `Q9_0`) ilk gereken `a`'nın üstünde bir kapaktır ve duvarı geçemez. Kaymak için
sağında 3 hücrelik serbest sütun gerekir; o sütunu sağdaki iki yatay blok tıkar. Oyuncu iki bloğu aşağıdaki cebe indirip
yükü iki sütun kaydırmayı (3 kaydırma) **ya da** Çekiç'le yükü kırmayı (0 hamle) keşfeder; iki yol da açıktır (Çekiç
adımı yumuşak).

```
       x: 0 1 2 3 4 5   D   6 7
   y=7:  · · · · · ·   :   · ·  ← Vinç Alanı
   y=6:  · · · · · ·   :   · ·
   y=5:  · · · · · ·   :   W W
   y=4:  Q Q Q . . .   #   Y Y
   y=3:  Q Q Q . e e   #   Y W
   y=2:  Q Q Q . d d   #   Y W
   y=1:  a a b c . .   #   R R
   y=0:  a a b c . .   #   R R
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `O4_0` | R | (0,0) | ilk gereken (y0–1), yükün altında |
| `b` | `D2_0` | W | (2,0) | y2–3 sütun 1 |
| `c` | `D2_0` | Y | (3,0) | y2–3 sütun 0 |
| `d` | `D2_90` | Y | (4,2) | y4; yükün kayma yolunu tıkar |
| `e` | `D2_90` | W | (4,3) | y5; yükün kayma yolunu tıkar |
| `f` | `Q9_0` | — (Ağır Yük, `color` yazılmaz) | (0,2) | kapak |

Kanonik çözüm:
1. `d` (D2_90 Y) (4,2) → (4,0) — **kaydırma** (sağ alt cebe)
2. `e` (D2_90 W) (4,3) → (4,1) — **kaydırma**
3. `f` (Q9_0 Ağır Yük) (0,2) → (2,2) — **kaydırma** (iki sütun sağa; sol iki sütun açılır)
4. `a` (O4_0 R) (0,0) → (6,0) — duvar üstü, doğru
5. `b` (D2_0 W) (2,0) → sola (1,0) → yukarı → (7,2) — duvar üstü, doğru
6. `c` (D2_0 Y) (3,0) → sola (1,0) → yukarı → (6,2) — duvar üstü, doğru
7. `d` (D2_90 Y) (4,0) → sola (0,0) → yukarı → (6,4) — duvar üstü, doğru
8. `e` (D2_90 W) (4,1) → sola (0,1) → yukarı → (6,5) — duvar üstü, doğru → kazanma; Ağır Yük sahada kalır (K-48)

Öğretici:
1. `piece:5`, `piece:3`, `piece:4` · drag `[[4,2],[4,0]]` (kanonik hamle 1: `d` sağ alt cebe; tutulan hücre (4,2) =
   çapa) · `tut.m.heavy` (metin Ağır Yük'e göre güncellenir) · `{ event: yardMove, count: 1 }`. Eski yol `[[1,3],[3,3]]`
   yükü `R`'de olmayan (2,2)'ye götürüyordu (DL-2R-01).
2. `booster:hammer`, `piece:5` · tap (yuva) · `tut.m.hammer` (metin: Çekiç yükü kırar) · `{ event: placementCorrect,
   count: 1 }` (Çekiç'in Ağır Yük'ü kırması `obstacleHit` üretmez; adım iki yolda da ilk doğru yerleşimle biter,
   CL-2R-11)

### Bölüm 9 — İp Merdiven (Rope Ladder)

| Alan | Değer |
|---|---|
| Öğretilen | **W3 Dar Geçit** (`teaches: "W3"`): yalnız tek sıra boyundaki blok geçer |
| Zorluk / hedef kazanma | Normal (tanıtım) / %85 (tanıtım bandı %80–90) |
| Boyut | `yard { cols 4, rows 4 }`, `site { cols 2, rows 6 }` → H = 6 |
| Duvar | `height 4`; geçit `{ type: "static", y: 0, size: 1 }` |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Basamaklar (EN: Rungs) `["RR", "RR", "WW", "WW", "GG", "RR"]` |
| Renkler / şekiller | G, R, W (3) / D2, O4 |
| Saha | C = 16, F = 12, E = 4 |
| Ölçütler | N 4 · min 7 · minShifts 3 · firstNeedDepth 1 · F0 {`a`} · YAO 3/4 (1 ray) · trapCount 0 · choices 3, 5, 5 · best 1, 1, 1 · **geçitsiz min 8** |
| Hamle | 7 + max(6, ⌈3,5⌉) = **13** (tanıtım: Kolay satırı, K-52; taban 4) |

**Tasarım niyeti:** İlk gereken `a` (`D2_90` R) dar geçidin satırında ama arkasında `b` tıkacı vardır; üstü `O4` R ile
kapalıdır. Tıkaç bir satır kalkınca `a` geçitten kayar. `O4`'ler iki satır boyunda olduğu için dar geçide hiç giremez
(yapışkan takip geçit ağzında durur) ve duvar üstünden gider. Tanıtım bölümü olarak derinlik 1'dir; kazı sayısı 3'tür.

```
       x: 0 1 2 3   D   4 5
   y=7:  · · · ·   :   · ·  ← Vinç Alanı
   y=6:  · · · ·   :   · ·
   y=5:  · · · ·   :   R R
   y=4:  · · · ·   :   R R
   y=3:  . . d d   #   W W
   y=2:  c c d d   #   W W
   y=1:  c c . .   #   G G
   y=0:  a a b b   =   R R
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_90` | R | (0,0) | ilk gereken (y0), dar geçitten |
| `b` | `D2_90` | G | (2,0) | tıkaç; y1 |
| `c` | `O4_0` | R | (0,1) | kapak; y4–5 |
| `d` | `O4_0` | W | (2,2) | y2–3 |

Kanonik çözüm:
1. `b` (D2_90 G) (2,0) → (2,1) — **kaydırma** (geçit önü açılır)
2. `a` (D2_90 R) (0,0) → sağa (2,0) → dar geçitten raya → (4,0)'da bırak — **ray**, doğru
3. `c` (O4_0 R) (0,1) → (0,0) — **kaydırma**
4. `d` (O4_0 W) (2,2) → (0,2) — **kaydırma** (`b`'nin üstü açılır)
5. `b` (D2_90 G) (2,1) → (4,1) — duvar üstü, doğru
6. `d` (O4_0 W) (0,2) → (4,2) — duvar üstü, doğru
7. `c` (O4_0 R) (0,0) → (4,4) — duvar üstü, doğru → kazanma

Öğretici:
1. `piece:1` · drag `[[2,0],[2,1]]` (kanonik hamle 1: tıkaç `b` bir satır yukarı) · `tut.m.dig` · `{ event: yardMove,
   count: 1, piece: 'piece:1' }`
2. `piece:0`, `gap:0` · drag `[[1,0],[5,0]]` (`a`'nın sağ hücresi (1,0), ofset (1,0); son çapa (4,0) dar geçidin rayında)
   · `tut.m.narrow` · `{ event: gapPass, count: 1 }` (DL-2R-10: tek adım kazıyı gösterip dar geçitten söz ediyordu)

### Bölüm 10 — Ağaç Ev Tamam! (Treehouse Done!)

| Alan | Değer |
|---|---|
| Öğretilen | Hikaye bölümü finali (W2 + Y5 + S1 + kamyon kuyruğu) + Vinç açılır (META §4: 2 ücretsiz deneme); imza yok |
| Zorluk / hedef kazanma | **Zor** / %45 |
| Boyut | `yard { cols 6, rows 5 }`, `site { cols 2, rows 6 }` → H = 6 |
| Duvar | `height 6` (= H, W2); geçit yok (§4 madde 5) |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Gövde (EN: Trunk) `["WW", "GG", "GW", "GW", "RR", "RR"]` → 2. Çatı (EN: Roof) `["RR", "GG", "GG", "RR", "WW", "WW"]` |
| Renkler / şekiller | G, R, W (3) / D2, O4; Ağır Yük Q9 |
| Saha | C = 30, F = 21, E = 9 |
| Ölçütler | N 9 · min 13 · minShifts 4 (dilim 1: 3, dilim 2: 1) · firstNeedDepth 3 · F0 {`a`} · YAO 9/9 · trapCount 0 · deadRate 0 · choices 12, 15, 16 · best 1, 1, 2 |
| Hamle | 13 + max(3, ⌈2,6⌉) = **16** |

**Tasarım niyeti:** Bölüm 8'in yük kazısı bu kez duvar dibinde (ayna düzen) ve yüksek duvarla: yük ilk gereken `a`'nın
(duvara bitişik) üstündedir, kayması için soldaki cep boşaltılır. Dilim 2'de kamyonun son bloğu (`k1_3` `O4` G) yükün
gölgesinde yer bulamaz ve **kuyrukta bekler** ("Kamyonda: 1"); oyuncu yükü aşağı indirince düşer. Zorluk dar bütçeden
(+3) ve iki dilimlik planlamadan gelir; Vinç gömülü bloğu tek dokunuşla çıkarır.

Dilim 1 başlangıcı:
```
       x: 0 1 2 3 4 5   D   6 7
   y=7:  · · · · · ·   :   · ·  ← Vinç Alanı
   y=6:  · · · · · ·   :   · ·
   y=5:  · · · · · ·   #   W W
   y=4:  . . . Q Q Q   #   G G
   y=3:  e e . Q Q Q   #   G W
   y=2:  d d . Q Q Q   #   G W
   y=1:  . . c b a a   #   R R
   y=0:  . . c b a a   #   R R
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `O4_0` | R | (4,0) | ilk gereken (dilim 1 y0–1), yükün altında |
| `b` | `D2_0` | W | (3,0) | dilim 1 y2–3 sütun 1 |
| `c` | `D2_0` | G | (2,0) | dilim 1 y2–3 sütun 0 |
| `d` | `D2_90` | G | (0,2) | dilim 1 y4; cebi tıkar |
| `e` | `D2_90` | W | (0,3) | dilim 1 y5; cebi tıkar |
| `f` | `Q9_0` | — (Ağır Yük) | (3,2) | kapak |

Kamyon partisi 1 (dilim 1 tamamlanınca; `y = 5`): `k1_0` `D2_90` R x=3 · `k1_1` `D2_90` R x=0 · `k1_2` `O4_0` W x=1 ·
`k1_3` `O4_0` G x=1. Kanonik çözümde yük (0,2)'dedir: `k1_0` x=3 → (3,0); `k1_1` x=0 yükün üstüne çıkar (taşar) → aday
sırası x=1, 2 (taşar) → x=3 → (3,1); `k1_2` x=1, 2, 0 taşar → x=3 → (3,2); `k1_3` hiçbir adayda sığmaz → **kuyruk**
("Kamyonda: 1", K-26).

Dilim 2 başlangıcı (8. hamleden sonra):
```
       x: 0 1 2 3 4 5   D   6 7
   y=7:  · · · · · ·   :   · ·  ← Vinç Alanı
   y=6:  · · · · · ·   :   · ·
   y=5:  · · · · · ·   #   R R
   y=4:  Q Q Q . . .   #   G G
   y=3:  Q Q Q 2 2 .   #   G G
   y=2:  Q Q Q 2 2 .   #   R R
   y=1:  . . . 1 1 .   #   W W
   y=0:  . . . 0 0 .   #   W W
```

Kanonik çözüm:
1. `d` (D2_90 G) (0,2) → (0,0) — **kaydırma** (cebe)
2. `e` (D2_90 W) (0,3) → (0,1) — **kaydırma**
3. `f` (Q9_0 Ağır Yük) (3,2) → (0,2) — **kaydırma** (üç sütun sola; duvar dibi açılır)
4. `a` (O4_0 R) (4,0) → Vinç Alanı'na → (6,0) — duvar üstü, doğru
5. `b` (D2_0 W) (3,0) → (7,2) — duvar üstü, doğru
6. `c` (D2_0 G) (2,0) → (6,2) — duvar üstü, doğru
7. `d` (D2_90 G) (0,0) → sağa (3,0) → yukarı → (6,4) — duvar üstü, doğru
8. `e` (D2_90 W) (0,1) → (6,5) — duvar üstü, doğru → dilim 1 tamam, kayma, parti 1: 3 blok düşer, `k1_3` kuyrukta
9. `f` (Q9_0 Ağır Yük) (0,2) → (0,0) — **kaydırma** (aynı hamlenin 9. adımında `k1_3` (1,3)'e düşer)
10. `k1_2` (O4_0 W) (3,2) → (6,0) — duvar üstü, doğru
11. `k1_1` (D2_90 R) (3,1) → (6,2) — duvar üstü, doğru
12. `k1_3` (O4_0 G) (1,3) → (6,3) — duvar üstü, doğru
13. `k1_0` (D2_90 R) (3,0) → (6,5) — duvar üstü, doğru → kazanma; Ağır Yük sahada kalır

Kamyon dökümü oyuncunun yükü nereye koyduğuna bağlıdır (K-25 belirlenimci); solver bütün yerleşimleri tarar, kanonik
çözüm yukarıdadır. Zor bölüm olmasına rağmen tarama kapsamında ✓-tuzağı yoktur (Zor'da serbest, K-51); zorluk +3
tampondan gelir.

Öğretici:
1. `startOn: { event: segmentDone }` · `booster:crane` · tap (yuva) · `tut.m.cranebooster` · `{ event: boosterUsed,
   count: 1 }` (Vinç dilim 2'de önerilir; dilim 1'in yük kazısı ilk oyunda oynanır, DL-2R-09. Vinç yerleşimi
   `placementCorrect` üretmez, CL-2R-11. Oyuncu Vinç'i kullanmazsa adım bölüm sonuna kadar etkin kalır ve hareketsizlikte
   görünür)

---

## 3. Bölüm 11–50 (tasarım kayıtları)

**Faz 2R notu (bağlayıcı):** Aşağıdaki 11–50 kayıtları Faz 1 kurallarıyla yazıldı ve **Faz 3'te §2.0 yöntemiyle yeniden
tasarlanır** (R2-06). Yeniden tasarımda: (1) tam örtü — "şaşırtma", "dolgu" kalkar, saha boyutu K-49 ile seçilir;
(2) S2 `.` (13, 16, 23, 38, 43, 44, 45, 50) MVP dışıdır — bu bölümlerin "kemer/pencere" yapı parçaları dolu desenle
(ör. cam rengi B) ya da proje sahibi S2'yi geri getirirse `.` ile kurulur; (3) Y5 "ağır" yalnız Ağır Yük (I5/Q9)
demektir; (4) moloz (S4: 17, 20, 45, 50) malzemedir; (5) Boya Fırçası takas (22), Çekiç yalnız engeller (K-36);
(6) hamle K-52 ile (tanıtım bölümünde bir alt zorluğun tamponu); (7) S9 Geniş Şantiye'nin tanıtımı **Bölüm 12**'dir
(imza `site.cols ≥ 3`; hikaye bölümü 2'nin imzasız tek bölümü; 14 Y6'yı öğrettiği için aday dışı). 12'nin `clear`
hedefi öğretimi (imzasız) Faz 3 yeniden tasarımında 11'e (kasa tanıtımıyla aynı engel) taşınır; Termos açılışı 12'de
kalır (güçlendirici açılışı imza değildir); (8) öğretici K-53'e uyar: aşağıdaki eşlemedeki Z (zorunlu) adımlar Y
(yumuşak) olur, 3 adımlı Bölüm 22 iki adıma indirilir, `timeoutMs` bitişleri olay bitişine çevrilir (Faz 2R şeması
`timeoutMs`'i reddeder); (9) **Çekiç hedefli bölüm oranı (EN-2R-05):** 11–50'de K-36 hedef kümesi bölüm başında ya da
kanonik çözümün en az bir durumunda boş olmayan bölüm sayısı ≥ 20 (%50). Bugünkü bağımlılık dizinine göre 14 bölüm
(11, 12, 17, 18, 19, 20, 24, 29, 35, 40, 41, 45, 48, 50) hedeflidir; eksik ≥ 6 bölüm en ucuz yolla, Ağır Yük (Y5;
imza 8'de açıldığı için yeni mekanik sayılmaz) ile tamamlanır. Faz 3 sonunda oran < %50 ise günlük ödül 2. günü ve
Usta Sandığı'ndaki Çekiç → Geri Al olur (META §4.1). LEVEL_REPORT'a "Çekiç hedefli" sütunu (code-lead); (10) **solver
kapasitesi (CL-2R-14):** taslaklarda saha ≤ 30 hücre ve başta boş saha hücresi `E ≤ 10` hedeflenir; daha büyük saha
gerekiyorsa bölüm kaydına `trap_scan_incomplete` kabul notu yazılır (K-51 madde 2); (11) **Söküm bedeli (EN-2R-07):**
Zor/Çok Zor'da LEVEL_REPORT "Söküm / deneme" (orta bot, medyan) ≤ 1,0; aşılırsa T + 1 (`a` ile) ya da tuzak kaldırılır.
Engel bağımlılık dizini ve tanıtım bölümleri bu kayıtlara göre geçerlidir.

Sütunlar: **Kurulum** = bölüm genelindeki parametreler (duvar, geçitler, yerçekimi, mod, engel sayıları); **Hamle** =
tahmini minimum + tampon = bütçe; **Hedef** = "orta" bot kazanma oranı. Duvar ve yerçekimi bölüm boyunca sabittir
(geçitler, fan, `gravity` dilimden dilime değişmez); dilimden dilime değişebilenler plan (`.`, `?`), moloz ve kamyonla
gelen blokların bayraklarıdır (cam, balon, harç, ıslak, zincir).

**Engel bağımlılık dizini (11–50; entrepreneur isteği, kesme etkisini tek bakışta gösterir):**

| Engel | Kullanıldığı bölümler | Engel | Kullanıldığı bölümler |
|---|---|---|---|
| W1 | 11, 12, 17, 19, 21, 24, 27, 29, 32, 37, 39 | Y6 | 14, 18, 20, 36, 41 |
| W2 | 25, 33, 42, 50 | Y7 | 19, 36, 49 |
| W3 | 16, 17, 19, 20, 22, 25, 27, 29, 30, 32, 35, 37, 39, 43, 47, 50 | Y8 | 35, 40, 48, 50 |
| W4 | 13, 20, 34, 35, 41 | S2 | 13, 16, 23, 38, 43, 44, 45, 50 |
| W5 | 16, 20, 43 | S3 | 21, 23, 25, 30, 33, 40, 42, 49, 50 |
| W6 | 22, 25, 30, 43, 47, 50 | S4 | 17, 20, 45, 50 |
| W7 | 26, 30, 45, 50 | S5 | 31, 34, 40, 48 |
| W8 | 32, 33, 36, 40, 46, 47 | S6 | 37, 39, 40, 49 |
| Y1 | 11, 12, 19, 41 | S7-R / S7-M | 27, 30, 44 / 29, 46, 50 |
| Y2 | 18 | S8 | 38, 39, 44, 47, 50 |
| Y3 | 24, 29, 45 | G-H / G-L | 15, 42 / 23, 49 |
| Y4 | 28, 48 | Y5, S1 | Faz 3 blockout'ında (ağır blok ve çok dilim hemen her bölümde; Y5 Çekiç hedefli oran için ≥ 6 bölüm, Faz 2R notu madde 9) |
| S9 | 12 (tanıtım; Faz 3'te pekiştirme bölümleri seçilir) | S2 | MVP dışı (yukarıdaki satır Faz 1 kaydıdır; dolu desenle yeniden kurulur) |

**B planı etkisi (BUSINESS P-7, entrepreneur kapsam kararı):** S5 Döner Platform ve S6 Asansör kesilirse 7 bölüm yeniden
kurulur: 31, 34, 37, 39, 40, 48, 49. Yapı parçası ve zorluk etiketi korunur; 31 ve 37 "nefes / pekiştirme" bölümüne
döner (yeni mekanik yok), 34 kepenk zamanlaması, 39 dar geçit + balon, 40 rüzgâr + harç + cam, 48 ıslak + harç, 49 hafif
yerçekimi + cam + vida olur. G-L yönlendirmesi de kesilirse 23 ve 49'da `gravity.build = low` yalnızca cam eşiği 4 ve
yavaş düşüş olarak kalır (yönlendirme öğretimi çıkar).

**11–50 öğretici notları:** Güçlendirici açılış bölümlerinde yumuşak adım (META §4; metin STORY §6, sunum UX §13.2):
Bölüm 12 `tut.l12.thermos` (`pre:thermos`, bölüm öncesi pencerede), Bölüm 13 `tut.l13.undo`, Bölüm 16 `tut.l16.trowel`
(`pre:trowel`), Bölüm 20 `tut.l20.openshutter`, Bölüm 22 `tut.l22.brush`. `pre:` vurgulu adım her zaman 1. adımdır
(Bölüm 12, 16, 20; UX §13.1): bölüm öncesi pencere tahtadan önce açılır ve pencere kapanınca adım biter (GDD §14.1
madde 3), oyun içi adımlar ondan sonra gelir. Bölüm 15'te ikinci yumuşak adım `tut.l15.setting` (Ayarlar > "Zaman
baskısını azalt", R-11; metin design-lead). Bölüm 23'te G-L girdisi: düşerken tahtaya dokunma, dokunulan taraf = yön
(GDD K-19, R-10). Bölüm 23 iki adımlıdır: 1 Z hafif yerçekimi (`tut.l23.light`, `overWall`; 1 genişlikli blok, çünkü
2 genişlikli blok yönlendirilemez) ve 2 Y yönlendirme (`tut.l23.steer`, `steered`; blok parmaktayken başlar, düşüş
başlayınca el gösterilir). Bölüm 19, 26, 36, 49'da saklı nesnelerin konumu görünür (GDD K-42).

**11–38 `tutorial[]` `done` eşlemesi** (UX §13.2 satırlarının veri karşılığı; sözlük GDD §14.1 madde 3, başlama
koşulu madde 5; Z/Y, vurgu, el ve metin UX §13.2'dekiyle aynı; `piece:` indeksleri Faz 3 blockout'ında yazılır). Ana
ekran satırları (`tut.meta.*`; 15, 20, 25) bölüm verisi değildir (GDD §14.1 madde 6).

| Bölüm · adım | Z/Y | `done` | UX "Tamam koşulu" |
|---|---|---|---|
| 11 · 1 | Y | `{ event: obstacleHit, type: crate }` | ilk kasa katı kırıldı |
| 12 · 1 | Y | `{ event: tap }` (`pre:thermos`; bölüm öncesi pencerede, pencere kapanınca da biter) | yuva seçildi ya da pencere kapandı (Oyna / ×) |
| 12 · 2 | Y | `{ timeoutMs: 2000 }` (vurgu `goals`, `tut.l12.clear`) | — (2 s) |
| 13 · 1 | Y | `{ event: turnEnd }` | 1 hamle yapıldı |
| 13 · 2 | Y | `{ timeoutMs: 3000 }` (Bölüm 10 Vinç adımıyla aynı; Geri Al için bağlamsal tetik yok, UX §13.2) | — (3 s) |
| 14 · 1 | Z | `{ event: yardFall }` | zincirleme düşüş oldu |
| 15 · 1 | Y | `{ event: landed }` | ilk iniş |
| 15 · 2 | Y | `{ timeoutMs: 2500 }` | — (2,5 s) |
| 16 · 1 | Y | `{ event: tap }` (`pre:trowel`; bölüm öncesi pencerede, pencere kapanınca da biter) | yuva seçildi ya da pencere kapandı (Oyna / ×) |
| 16 · 2 | Y | `{ event: turnEnd }` (vurgu `gap:0`, `tut.l16.slider`) | 1 hamle yapıldı |
| 17 · 1 | Z | `{ event: yardMove }` (`debris:0`) | moloz taşındı |
| 18 · 1 | Y | `{ event: obstacleHit, type: cement_bag }` | torba gitti |
| 19 · 1 | Y | `{ event: itemCollected, type: screw }` | ilk vida toplandı |
| 20 · 1 | Y | `{ event: tap }` (`pre:shutter`; bölüm öncesi pencerede, pencere kapanınca da biter) | — |
| 21 · 1 | Y | `{ event: landed, flag: glass }` | ilk cam blok sağlam indi |
| 22 · 1 | Z | `{ event: yardMove, painted: true }` | blok boyandı ve sahada |
| 22 · 2 | Y | `{ event: placementCorrect }` | 1 doğru yerleşim |
| 22 · 3 | Y | `{ timeoutMs: 4000 }` (Bölüm 8 Çekiç adımıyla aynı; kullanım isteğe bağlı) | kullanıldı ya da atlandı |
| 23 · 1 | Z | `{ event: overWall }` (vurgu: çözümün ilk 1 genişlikli `piece:` bloğu + `crane` + `build`; metin `tut.l23.light`; 2. adım blok parmaktayken başlar, Bölüm 1 adım 1 gibi) | `overWall` ×1 |
| 23 · 2 | Y | `{ event: steered }` (vurgu `build` + düşen bloğun "↔" çipi; metin `tut.l23.steer`) | yönlendirme yapıldı (`steered` ×1) |
| 24 · 1 | Y | `{ event: obstacleHit, type: chain }` | zincir koptu |
| 26 · 1 | Y | `{ event: itemCollected, type: key }` (kilit aynı denetimde açılır, K-42) | anahtar alındı, kilit açıldı |
| 27 · 1 | Y | `{ event: placementCorrect, hidden: true }` | ilk `?` doğru dolduruldu |
| 28 · 1 | Y | `{ event: turnEnd }` | 1 hamle |
| 29 · 1 | Y | `{ event: placementCorrect, hidden: true }` | ilk `?` doğru dolduruldu |
| 31 · 1 | Y | `{ event: carouselTurn }` | ilk dönüş |
| 32 · 1 | Z | `{ event: landed, wind: true }` | rüzgârlı iniş |
| 35 · 1 | Y | `startOn: { event: deliveryDone, flag: mortar }` · `{ timeoutMs: 2500 }`; vurgu ilk teslim edilen harçlı blok (`piece:k<p>_<i>`) — harçlı bloklar bölüm başında sahada yok (#35, §4 madde 4) | — (2,5 s) |
| 37 · 1 | Y | `{ event: turnEnd }` | 1 hamle |
| 38 · 1 | Z | `{ event: landed, flag: balloon }` | balonlu blok yerleşti |

Z adımları (14, 17, 22, 23, 32, 38) Faz 3 blockout'ında §5 "Z adımı kilitlemez" maddesiyle denetlenir (çalışma anı
güvencesi GDD §14.1 madde 4b).

### Hikaye Bölümü 2 — Mahalle Fırını (renkler W Y G R + O C; en çok 4)

| # | Yapı parçası | Öğretir | Kurulum | Dilim | Renkler | Hamle | Zorluk | Hedef | Niyet |
|---|---|---|---|---|---|---|---|---|---|
| 11 | Fırın Temeli | Y1 Ahşap Kasa (1 kat) | Duvar 5, sabit geçit y=1 boy 2; 6 kasa hp 1 (hedef değil) | 2 | O, C, W | 9+5 = 14 | Normal (nefes) | %80 | Kasa yanındaki bloğu almanın kasayı kırdığını ve yolu açtığını keşfetmek. |
| 12 | Tezgâh | `clear` hedefi (kasa ×6, 2 kat) + Termos açılır | Duvar 6, sabit geçit y=2 boy 2; 6 kasa hp 2 | 2 | O, C, Y, W | 11+5 = 16 | Normal | %70 | Kazı hamlesini kasa kırma sayacına da yarayacak yerden seçmek. |
| 13 | Vitrin | W4 Kepenk (period 2, phase 0) + Geri Al açılır | Duvar 6, kepenk y=2 boy 2; vitrin camı `.` | 2 | O, C, R, W | 11+5 = 16 | Normal | %70 | Kepenk kapalıyken duvar üstü yerleşim yapıp açık hamleyi raya saklamak. |
| 14 | Un Deposu | Y6 Saha Yerçekimi | Duvar 5, geçit yok; `gravity.yard = true` | 2 | W, Y, C | 10+5 = 15 | Normal | %70 | Alttan bir blok çekince üsttekilerin inip yeni yol açtığını (ya da kapattığını) okumak. |
| 15 | Baca | G-H Ağır yerçekimi | Duvar 7, geçit yok; `gravity.build = high`; dilimler 2×8 | 2 | R, C, O | 13+3 = 16 | **Zor** | %50 | Şantiyeye geçer geçmez 700 ms içinde doğru sütuna hizalamak; uzun baca boyunca hatasız dizmek. |
| 16 | Kapı Kemeri | W5 Kayar Kapı (range [1,3], boy 1) + Mala Başlangıcı açılır | Duvar 6; kemer = 2 satır `.`, üstü raydan | 2 | O, C, W | 10+5 = 15 | Normal (nefes) | %80 | Kapının hangi satıra geleceğini sayıp kemerin üstünü o hamlede raydan kurmak. |
| 17 | Eski Fırın | S4 Moloz | Duvar 6, sabit geçit y=2 boy 1; 3 moloz (dilim 0: 2, dilim 1: 1); `clear debris 3` | 2 | R, C, Y, O | 12+5 = 17 | Normal | %70 | Molozu sahaya taşımanın hem şantiyeyi açtığını hem de sahada yer yediğini dengelemek. |
| 18 | Un Çuvalları | Y2 Çimento Torbası | Duvar 5; `gravity.yard = true`; 5 torba | 3 | W, Y, C | 14+5 = 19 | Normal | %70 | Torbaları yırtarak sütunları istenen sırada indirmek. |
| 19 | Tabela | Y7 Altın Vida (`collect 5`) | Duvar 6, sabit geçit y=3 boy 1; 5 vida (2'si kasa altında) | 2 | O, Y, R, C | 13+5 = 18 | Normal | %70 | Vida toplayan kazı sırasını inşaat sırasıyla örtüştürmek. |
| 20 | Fırın Açılışı | Bölüm finali + Açık Kepenk açılır | Duvar 7; kepenk y=1 boy 2 (period 2), kayar kapı range [3,5] boy 1; `gravity.yard = true`; moloz 2 | 4 | O, C, R, Y | 22+2 = 24 | **Çok Zor** | %35 | Kepenk, kayar kapı ve düşen sahayı aynı plan üzerinde zamanlamak. |

### Hikaye Bölümü 3 — Okul Kütüphanesi (+ B P; en çok 5)

| # | Yapı parçası | Öğretir | Kurulum | Dilim | Renkler | Hamle | Zorluk | Hedef | Niyet |
|---|---|---|---|---|---|---|---|---|---|
| 21 | Kütüphane Penceresi | S3 Cam Blok | Duvar 6, sabit geçit y=2 boy 2; cam bloklar B renkli | 2 | B, P, W, C | 11+5 = 16 | Normal (nefes) | %80 | Cam bloğu siluete yakın indirip öyle bırakmak; geçidin camı koruyan güvenli yol olduğunu görmek. |
| 22 | Renkli Raflar | W6 Boya Kapısı + Boya Fırçası açılır | Duvar 6, boya kapısı y=2 boy 1 renk P | 2 | B, P, Y, R | 12+5 = 17 | Normal | %70 | Boya kapısını "boyahane" gibi kullanıp bloğu sahaya geri almak, sonra duvar üstünden yerleştirmek. |
| 23 | Okuma Köşesi | G-L Hafif yerçekimi | Duvar 6; `gravity.build = low`; cam bloklar | 2 | B, P, G, W | 12+5 = 17 | Normal | %70 | Yavaş düşen bloğu bir sütun yönlendirip pencereyi ıskalamak; cam eşiğinin 4 olduğunu görmek. |
| 24 | Kitap Kolileri | Y3 Zincir | Duvar 5, sabit geçit y=1 boy 2; 4 zincirli blok; `clear chain 4` | 3 | P, O, C, B | 15+5 = 20 | Normal | %70 | Zinciri çözecek komşu hamlesini doğru yerleşimle aynı hamlede yapmak. |
| 25 | Saat Kulesi | Kombinasyon | Duvar 8, boya kapısı y=3 boy 1 renk Y; cam bloklar; dilimler 2×8 | 3 | B, P, C, Y, W | 19+3 = 22 | **Zor** | %45 | Uzun düşüşte camı korumak ve boyayı doğru blokta harcamak. |
| 26 | Arşiv Kapısı | W7 Kilitli Geçit + anahtar | Duvar 6, kilitli geçit y=2 boy 2; anahtar (1,3) altında | 3 | P, W, C, B | 15+5 = 20 | Normal (nefes) | %80 | Anahtarı açan kazıyı önce yapıp geçidi kestirme olarak kullanmak. |
| 27 | Mozaik Duvar | S7 Gizli plan `repeat` (period 2) | Duvar 6, sabit geçit y=2 boy 1; 2. ve 3. dilimin üst 4 satırı `?` | 3 | B, P, Y, G, R | 15+5 = 20 | Normal | %70 | Alt satırlardan deseni okuyup `?` hücrelerini doğru tahmin etmek. |
| 28 | Bahçe Duvarı | Y4 Islak Beton | Duvar 6; ıslak bloklar wetMoves 2–3 (kamyonla da gelir) | 3 | G, C, W, B | 16+5 = 21 | Normal | %70 | Kuruma süresini başka yerleşimlerle doldurup hamle israf etmemek. |
| 29 | Simetrik Cephe | S7 Gizli plan `mirrorOf` | Duvar 6, sabit geçit y=3 boy 1; dilim 2 = dilim 1'in aynası; 3 zincir | 2 | P, B, O, W | 14+5 = 19 | Normal | %70 | İlk dilimi hatasız kurup aynasını renk yer değiştirerek kurmak. |
| 30 | Kütüphane Açılışı | Bölüm finali | Duvar 7, boya kapısı y=1 boy 1 renk B + kilitli geçit y=4 boy 1; cam; gizli `repeat` | 4 | B, P, C, Y, W | 25+2 = 27 | **Çok Zor** | %30 | Boya, gizli desen, cam ve anahtarı tek planda sıralamak. |

### Hikaye Bölümü 4 — Deniz Feneri ve Köprü (bütün renkler; en çok 5)

| # | Yapı parçası | Öğretir | Kurulum | Dilim | Renkler | Hamle | Zorluk | Hedef | Niyet |
|---|---|---|---|---|---|---|---|---|---|
| 31 | Balıkçı İskelesi | S5 Döner Platform (`carouselEvery 4`) | Duvar 5, geçit yok; `build.mode = carousel` | 3 | B, W, C, Y | 15+5 = 20 | Normal (nefes) | %80 | Öndeki yüz dönmeden önce ona yerleştirilecek bloğu hazırda tutmak. |
| 32 | Rüzgârlı Kıyı | W8 Rüzgâr Fanı (`dir right`) | Duvar 6, sabit geçit y=2 boy 1 | 3 | B, R, W, Y | 15+5 = 20 | Normal | %70 | Rüzgârın ince blokları kaydırdığını gölgeden okuyup sütunu ona göre seçmek ya da bloğu siluete indirmek. |
| 33 | Fener Gövdesi | Kombinasyon | Duvar 8, fan `left`; cam bloklar; dilimler 2×8 | 3 | R, W, B, C | 17+5 = 22 | Normal | %65 | Yüksek duvar, rüzgâr ve camı aynı düşüşte hesaba katmak. |
| 34 | Fener Odası | Kombinasyon (zamanlama) | Duvar 6, kepenk y=2 boy 2 (period 2, phase 0); `carousel`, `carouselEvery 4` | 3 | Y, B, R, P | 17+5 = 22 | Normal | %65 | Kepenk ile platformun aynı ritimde döndüğünü fark edip ray hamlelerini o ana denk getirmek. |
| 35 | Islak Harç | Y8 Harçlı Blok | Duvar 6, kepenk y=3 boy 1 (period 3); harçlı bloklar 2. ve 3. partide | 3 | C, R, W, O | 18+3 = 21 | **Zor** | %50 | Harçlı bloğu bırakmadan önce, Zor bölümde gölge doğruluk göstermediği için (GDD K-18), plan rengini ve inşa cephesini (her zorlukta görünür, K-34 kanca 1) kendisi eşleştirip gölgenin gösterdiği konumda bırakmak; zorluk yeni engelden değil dar bütçeden gelir. |
| 36 | Martı Yuvaları | Kombinasyon | Duvar 6, fan `right`; `gravity.yard = true`; `collect screw 6` | 3 | W, G, B, Y | 16+5 = 21 | Normal (nefes) | %75 | Vidaları açan düşüş zincirlerini rüzgârlı yerleştirmeyle birleştirmek. |
| 37 | Yükselen İskele | S6 Asansör İskele (`range [0,2]`) | Duvar 6, sabit geçit y=3 boy 1; `build.elevator` start 0 dir +1 | 3 | O, C, B, W | 16+5 = 21 | Normal | %70 | Geçidin hangi plan satırına açılacağını asansör ofsetinden hesaplamak. |
| 38 | Köprü Halatları | S8 Balonlu Blok | Duvar 5; planlarda `.` sütunlarının üstünde tavan hücreleri | 3 | R, W, B, Y | 16+5 = 21 | Normal | %70 | Balonlu bloğun tavana asılıp boşluk üstündeki halatı kurduğunu keşfetmek. |
| 39 | Köprü Tabliyesi | Kombinasyon | Duvar 6, dar sabit geçit y=2 boy 1; asansör [0,1]; balonlar | 4 | W, R, C, B, O | 20+5 = 25 | Normal | %65 | Asansör, balon ve dar geçidi tabliyenin dört parçasında sırayla kullanmak. |
| 40 | Fener Yandı! | Bölüm finali | `carousel` 4 dilim (`carouselEvery 3`) + asansör [0,2]; fan `right`; harçlı ve cam bloklar | 4 | Y, R, B, W, C | 27+2 = 29 | **Çok Zor** | %30 | Dönen ve yükselen şantiyeye rüzgârda harçlı/cam bloğu hatasız yerleştirmek. |

### Hikaye Bölümü 5 — Festival Şatosu (bütün renkler; en çok 5)

| # | Yapı parçası | Öğretir | Kurulum | Dilim | Renkler | Hamle | Zorluk | Hedef | Niyet |
|---|---|---|---|---|---|---|---|---|---|
| 41 | Hendek Köprüsü | Tekrar ve pekiştirme | Duvar 6, kepenk y=2 boy 2 (period 2); `gravity.yard = true`; 6 kasa hp 1–2 | 3 | C, B, W, G | 17+5 = 22 | Normal (nefes) | %80 | Bildik üç engelle akıcı bir bölümde ustalık hissi yaşamak. |
| 42 | Sol Kule Temeli | Kombinasyon | Duvar 8, geçit yok; `gravity.build = high`; cam bloklar | 3 | C, P, Y, B | 19+5 = 24 | Normal | %65 | Ağır yerçekiminde cam bloğu 700 ms içinde siluete indirmek. |
| 43 | Sol Kule Pencereleri | Kombinasyon | Duvar 7, kayar kapı range [1,3] boy 1 + boya kapısı y=5 boy 1 renk P; pencereler `.` | 3 | P, C, Y, B, W | 19+5 = 24 | Normal | %65 | Pencere üstlerini kayar kapıdan, renk eksiğini boya kapısından tamamlamak. |
| 44 | Mazgallar | Kombinasyon | Duvar 5; balonlar; gizli `repeat` (period 2) mazgal deseni | 3 | C, P, R, Y | 19+5 = 24 | Normal | %70 | Tekrar eden mazgal desenini okuyup boşluk üstündeki dişleri balonla kurmak. |
| 45 | Büyük Kapı | Kombinasyon | Duvar 7, kilitli geçit y=2 boy 2; kemer `.` (2×2); 4 zincir; 3 moloz | 4 | C, P, W, O, Y | 24+3 = 27 | **Zor** | %45 | Anahtar, zincir ve molozu çözme sırasını kemerin kuruluş sırasına bağlamak. |
| 46 | Sağ Kule | Kombinasyon | Duvar 6, fan `left`; dilim 3–4 `mirrorOf` dilim 1–2 | 4 | C, P, Y, B | 22+5 = 27 | Normal (nefes) | %75 | Sol kulenin aynasını rüzgârın yönünü hesaba katarak kurmak. |
| 47 | Bayraklar | Kombinasyon | Duvar 6, boya kapısı y=2 boy 1 renk R; fan `right`; balonlar | 3 | R, Y, B, P, G | 20+5 = 25 | Normal | %65 | Bayrakları balonla tavana asarken rüzgâr kaymasını ve boyayı birlikte planlamak. |
| 48 | Şato Avlusu | Kombinasyon | `carousel` (`carouselEvery 4`); ıslak ve harçlı bloklar | 4 | C, G, W, O, P | 23+5 = 28 | Normal | %65 | Dönen avluda kuruyan ve yapışan blokların sırasını yönetmek. |
| 49 | Festival Işıkları | Kombinasyon | Asansör [0,2]; `gravity.build = low`; cam; `collect screw 5` | 4 | Y, P, B, R, O | 27+3 = 30 | **Zor** | %45 | Yükselen iskeleye yavaş düşen cam ışıkları yönlendirerek asmak, vidaları yol üstünde toplamak. |
| 50 | Festival Şatosu | BÜYÜK FİNAL | Duvar 8; kilitli dar geçit y=2 boy 1 + boya kapısı y=5 boy 1 renk P; dilim engelleri: 1 Sol Kule (cam), 2 Kapı (kemer `.` + anahtar), 3 Sağ Kule (`mirrorOf` 1), 4 Bayrak Direkleri (balon), 5 Kule Tepeleri (harç + moloz) | 5 | C, P, Y, B, R | 36+2 = 38 | **Çok Zor** | %30 | Bütün oyunun araçlarıyla, her dilimi farklı bir ustalık sınavına çevirerek şatoyu bitirmek. |

---

---

## 4. Briften sapmalar ve gerekçeler (Faz 2R)

1. **Tam örtü (R2-01) bölüm yapısını değiştirdi.** Şaşırtma ve dolgu blokları kalktı; saha yalnız planın malzemesini
   taşır. Brif §8'deki "6×8 saha %80–100 dolu" ile bağdaşmadığından saha bölüm bölüm boyutlandırılır (K-49) ve doluluk
   `2 ≤ E ≤ ⌊0,4·C⌋`'dir (K-02). 1–10'da saha 4×4 … 6×5'tir; varsayılan 6×8 büyük, çok dilimli ve taşınan malzemeli
   bölümler (Faz 3) içindir.
2. **Öğretim sırası değişti.** Kazı (K-10) R2-03 gereği Bölüm 3'e alındı (eski: 7). W1 Sabit Geçit 3 → 4. S2 Plan
   Boşluğu MVP dışı (R2-01), eski Bölüm 4 dersi kalktı; Bölüm 4'ün adı "Pencere Pervazı" (dolu bant) oldu (DL-2R-11). Bölüm 7 imzasız "taşınan malzeme" dersidir. S9 Geniş Şantiye hikaye bölümü 2'ye ertelendi (§2.0 madde 4).
3. **Hamleler (K-52).** 1–10: 11, 9, 11, 12, 17, 13, 15, 14, 13, 16 (eski: 11, 11, 11, 12, 11, 11, 12, 12, 13, 14). Kazı
   hamleleri minimumu artırdı; tampon orantılıdır; tanıtım bölümleri (5, 6, 8, 9) bir alt zorluğun tamponunu alır
   (DL-2R-05). Bot ölçümünden sonra `a` ayarı yapılır.
4. **Renk R'nin ilk kullanımı Bölüm 5** (brif: 4). Bölüm 4'ün 3 rengi G/W/Y'dir; açılış "en erken" anlamındadır.
5. **Bölüm 10'da geçit yoktur** (brif: "yüksek duvar + pencere + dar geçit + ağır malzeme"). Dar geçitli final taslakları
   karalama çözücüsünde ya geçidi kullanmadı (ray kazançsız) ya da 8–9 kazı istedi (Zor için fazla); final yüksek duvar +
   Ağır Yük + iki dilim + kamyon kuyruğu ile kuruldu. Pencere (S2) MVP dışı.
6. **Bölüm 9'un derinliği 1'dir** (eğride 8'den düşük): W3 tanıtımı sade tutuldu; kazı sayısı 3'te kaldı (eğri §2.0
   madde 5).
7. **İmza hareketin "yukarı" yarısı:** 1–5'te duvar saha tepesiyle aynı (4), tahta yüksekliği 5–6 → her blok saha üstü
   havaya kalkar; 6 ve 10'da duvar = tahta yüksekliği (Vinç Alanı); 7'de duvar 5 = H. Önceki "ilk hamle kısa" notu
   geçersiz: Bölüm 1'in ilk hamlesinde blok 2 satır kalkar.
8. **Faz 1–2 kayıtları:** önceki §4 madde 8–10 (✓ sonrası çıkmaz düzeltmeleri, F-3) eski 1–10 verisine aittir ve Faz 2R
   taslaklarıyla geçersizdir; ilke (Kolay/Normal'de ✓-tuzağı yok) K-51 madde 2 olarak kuraldır. Bölüm 35, 40 ve 50 notları
   (eski madde 4–6) Faz 3'te §3 yeniden tasarlanırken gözden geçirilir.

## 5. Bölüm tasarım kontrol listesi (her JSON için; Faz 2R)

- [ ] **Boyut (K-49):** `yard`/`site` alanları yazılı; Wy + Ws ≤ 8; aralıklar içinde; seçimin gerekçesi §2 tablosunda.
- [ ] **Tam örtü (K-47):** renk başına arz = talep; birikimli koşul; şaşırtma yok; Ağır Yük renksiz.
- [ ] **Saha (K-02):** `2 ≤ E ≤ ⌊0,4·C⌋`; bloklar ve engeller çakışmaz; saklı nesneler örtülü.
- [ ] **Plan (K-15):** her dilim Ws × Hs, `.` yok; renk sayısı ve açılmış renkler (§0 tablosu); şekiller açılmış (K-44),
      malzeme bloğu genişliği ≤ Ws.
- [ ] **Bulmaca (K-50, K-51):** id ≥ 3 için `firstNeedDepth ≥ 1` ve `minShifts ≥ 1`; Kolay/Normal'de `trapCount = 0`;
      ölçütler §2 hedef aralığında; geçitli bölümde `geçitsiz min − min ≥ 1` (`--variant no-gaps`); Ağır Yüklü bölümde
      `min − Çekiç'le min ≥ 2` (`--variant hammer-start`); tarama eksikse (`trap_scan_incomplete`) bölüm kaydında kabul
      notu.
- [ ] **Tuzak kaynağı (§2.0 madde 4):** bir renk bölgesi tek şekil kombinasyonuyla dolar ya da aynı renkteki parçalar
      özdeştir; aynı renkte dikey `D2_0` + `O4`/`C3` dikey çifti ve yatay `D2_90` + `O4` satırı birlikte kullanılmaz.
- [ ] **Hamle (K-52):** `moves = min + T + a`; `min` solver sonucu.
- [ ] **YAO ≥ %60** (K-46); ray yerleşimi ≤ %40.
- [ ] **Kamyon (K-25, K-26):** parti sırası, ilk gereken blok önce düşecek (altta kalacak) biçimde seçilir; kuyruk
      yalnız bilinçliyse (`batch_queued` uyarısı, bölüm notu ve `tools/levels-allow.json` girişi, ör. Bölüm 10).
- [ ] En çok 1 yeni mekanik; `teaches` imzayla birebir (OBSTACLES "Veri imzası").
- [ ] Ek hedefler (clear/collect) son yerleşimden önce tamamlanabilir (E-27'den kaçın; tamamlanamazsa Söküm devreye
      girer, K-30).
- [ ] Gölge her düşüşü doğru gösterir; gizli bilgi yalnızca `?` ile verilir; saklı nesnelerin konumu görünür.
- [ ] **Öğretici (K-53):** en çok 2 adım, hepsi `soft`; adım olayla biter (`timeoutMs` şemada yok; `holdOverBuild`
      `done` olarak kullanılmaz); başka bir bloğun hamlesi adımı bitirmemeliyse `piece:` ya da `at` süzgeci yazılır.
      **Eldiven yolu (GDD §14 "`hand.path` anlamı"):** noktalar tutulan hücrenin koordinatıdır; `path[0]` vurgulu bir
      `piece:` bloğunun hücresidir ve blok o anda tutulabilir (K-09), değilse eldiven yazılmaz (Bölüm 7 adım 1);
      ardışık noktalar aynı satır ya da sütunda, aradaki bütün çapalar `R`'de; son nokta iptal vermez (K-07 satır 2, 6
      ya da 7); `drag`'in son noktası, **adımın başladığı durumda** (kanonik çözümde adımın başlama koşulunun ilk
      sağlandığı durum) bir en kısa çözümün ilk hamlesidir; `hold`'un son noktası şantiye sütunlarının üstündedir
      (`tut_hand_invalid`). Metin anahtarları `tut.m.{konu}` / `tut.l{n}.{konu}` / `tut.ctx.{konu}`; oyuncu metninde renk
      adı ve "parça" yok; Ağır Yük'e "blok" denmez.
- [ ] Karalama çözücüsü ve resmî solver aynı `min`/`minShifts`/YAO'yu verir; fark varsa taslak yinelenir (§0 doğrulama notu).
