# 50 bölüm planı

Sahip: product-lead · Sürüm: **v3c2** (paket B1, 2026-11-12: Bölüm 6–10 D-106/D-107 ile yeniden kuruldu, 4–5 tuzaksız boyandı; §0 `teaches` listesi, §1 eğri tablosu, §2 kartları ve §8.15 güncel) · Önceki: D-099 bölüm turu (2026-11-02, paket A2: Bölüm 1–10 `schemaVersion` 2 olarak yeniden kuruldu; §1, §2, §6.6 güncel, yeni §6.10 hedef–gerçek tablosu) · Önceki: D-099 bulmaca zekâsı şartnamesi (2026-11-01; yeni §6 ölçütler, hedef aralıklar ve Bölüm 1–10 eğrisi, §7 code-lead uygulama notları; §1–§2 Faz 2R verisini anlatmaya devam eder) · Önceki: Faz 2R solver turu (2026-10-07; Bölüm 1–10 JSON'ları `levels/` altında, resmî solver
`levels:solve` ile doğrulandı; Bölüm 4, 5, 7 ve 10 yeniden tasarlandı — §2.11) · Önceki: Faz 2R (2026-10-07; R2-01…R2-06, R2-10 — `docs/review_inbox/_orchestrator_rulings_2R.md`; çapraz inceleme kapanışı: tanıtım bölümü tamponu, öğretici yolları ve süzgeçleri, Bölüm 4 adı, Faz 3 kuralları) · Faz 1 revizyonu (2026-10-04; R-01, R-08, R-18, R-21; tutarlılık denetimi tur 1, 2026-10-05; F-3 çıkmaz taraması, 2026-10-05) · Kaynak: `docs/BRIEF.md` §8, `docs/GDD.md` (Faz 2R), `docs/OBSTACLES.md`

**v3 notu (G1, 2026-11-08):** Bölüm 1–10'un "Bölümler v3" yeniden tasarım önerisi (yeni şekiller, blok özellikleri,
blok sayısı eğrisi, 10 bölüm planı, code-lead notları) **§8**'dedir; ÖNERİ'dir, onaya kadar §1–§7 ve JSON'lar bağlayıcıdır.
**v3c notu (2026-11-09, D-103…D-105):** Bölüm 6–10'un 3 sütunlu şantiye planı, palet ve bonus kararları **§8.13**'tedir
(plan; JSON değişmedi). **v3c2 notu (2026-11-12, D-106…D-108, paket B1):** yayın verisi §8.15'tedir; §1 eğri tablosu ve
§2 bölüm kartları bu veriden üretildi (kanonik çözüm = `tests/golden/level_NNN.hand.json`).

Bu belge 50 bölümün taslağıdır. **Faz 2R dikey dilimi Bölüm 1–10'dur (R2-06):** §2'de her biri yeni kurallarla (tam örtü
K-47/K-48, değişken boyut K-49, bulmaca ölçütleri K-50/K-51, hamle bütçesi K-52, hafif öğretici K-53) yeniden
tasarlandı; ASCII taslak, blok tablosu (koordinat, şekil kimliği, renk), kamyon partileri, karalama çözücüsüyle izlenmiş
kanonik çözüm (hamle hamle) ve ölçüt hedefleri JSON'a doğrudan çevrilebilecek kesinliktedir. **Bölüm JSON'ları yazıldı**
(`levels/level_001.json` … `level_010.json`, R2-01 çalışma sırası 3) ve bütün ölçütler resmî solver'la doğrulandı:
`npm run levels:check` 10/10 geçerli, 10/10 çözüldü, 0 hata, 0 uyarı. §2'deki ASCII taslaklar, kanonik çözümler, ölçütler
ve hamleler solver çıktısıdır; doğrulama özeti §2.11'dedir. 11–50. bölümler (§3) eski kurallarla yazılmış tek satırlık
kayıtlardır; Faz 3'te §2.0 yöntemiyle yeniden tasarlanır (§3 başındaki Faz 2R notu).

**D-099 (2026-11-01, sabit saha, GDD K-55):** bölümün bütün blokları ilk andan sahadadır; dilim geçişinde sahaya parti ya
da kamyon dolumu gelmez. Bulmaca zekâsı şartnamesi (ölçütler, hedef aralıklar, ölü masa kapısı, D-099 hamle bütçesi,
Bölüm 1–10 eğrisi ve öğretici taslakları) **§6**'da, code-lead uygulama notları (şema, doğrulayıcı, çözücü ölçütleri,
ölçek, üretici tarifi) **§7**'dedir. §1 tablosu, §2 kayıtları ve `levels/level_001…010.json` D2 paketinde (A2, 2026-11-02) §6.6'ya göre `schemaVersion` 2
olarak yeniden yazıldı; üçü aynı commit'te değişti (testler bu belgeyi JSON'larla karşılaştırır, §7 U-7). Faz 2R
verisi (`schemaVersion` 1) git geçmişindedir (`f065b80`); bu paragrafın üstündeki Faz 2R anlatımı tarihseldir.

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

**Doğrulama notu (Faz 2R solver turu, bağlayıcı):** Bölüm 1–10'un bütün ölçütleri code-lead'in resmî solver'ıyla
(`levels:solve`, SOLVER_VERSION 1; K-50 tanımları, bütçe = JSON `moves`) hesaplandı; kanonik çözümler çekirdekte
yeniden oynatıldı (`replay ok`). Karalama çözücüsü artık yalnız tasarım aracıdır. **Önceki not (tarihsel):** Bölüm 1–10
taslakları product-lead'in **karalama çözücüsüyle** (Python, oturum
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
mekanik için yazılır (OBSTACLES "Veri imzası": 1 → S1, 5 → Y9, 6 → S9, 7 → Y10, 8 → Y11, 9 → Y13). Y12 bonus (ilk
bölümü 7) yeni fikir sayılmaz ve `teaches`'e yazılmaz (GDD K-60 madde 6, D-105). Faz 2R arşivinin listesi (1 → S1,
4 → W1, 6 → W2, 8 → Y5, 9 → W3) `tests/fixtures/levels-2r/` içindir.

**Öğretici adımları (K-53, GDD §14.1):** bölüm başına en çok 2 adım, hepsi yumuşak (`mode` yazılmaz ya da `"soft"`),
spot ışığı yok, oyunu kilitlemez; adım yalnız `done` olayıyla biter (`timeoutMs` yok), el/balon hareketsizlikte
gizlenir/belirir (sunum design-lead'in). Eldiven yolu noktaları **tutulan hücrenin** koordinatıdır (GDD §14 "`hand.path`
anlamı"). Biçim: `adım · vurgu · el · textKey · done (· startOn)`. `done` içindeki `piece:` süzgeci olayı yalnız o
bloğun hamlesiyle sayar (GDD §14.1 madde 3). Kazanılmış bölümün tekrarında öğretici gösterilmez (K-53 madde 6). Metinler STORY §6A'dadır (design-lead, `tut.m.*`); oyuncu metninde renk adı yok
(R-08). Yeni ve metni güncellenecek anahtarlar §2.0 madde 8'de.

**Bölüm süresi hedef bandı (tahmin; entrepreneur önerisi KABUL):** 1–10 = 45–75 sn; 11–30 = 75–120 sn; 31–50 = 100–180 sn.
Bot raporu ve Aşama 0 testinde `level_end.durationMs` medyanıyla ölçülür. Tam örtüde kaydırma hamleleri bölümü
uzattığı için 1–10 (en kısa çözüm 3–15 hamle, ≈ 5 sn/hamle) bandın içindedir.

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
İmzasız öğretimler (D-099 1–10, §6.6): 2 şekil + gölge, 3 kazı (T1), 5 bekletme (T5), 7 takas ve yer açma (T4 + T6),
10 final (yeniden dizme); güçlendirici açılışları 8 Çekiç, 10 Vinç (META §4).

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
| 1 | Kolay (tanıtım) | 12 | ≥ %95 | 26 | Normal (nefes) | 20 | %80 |
| 2 | Kolay | 12 | ≥ %92 | 27 | Normal | 20 | %70 |
| 3 | Kolay | 15 | ≥ %92 | 28 | Normal | 21 | %70 |
| 4 | Kolay | 16 | ≥ %90 | 29 | Normal | 19 | %70 |
| 5 | Normal (tanıtım) | 18 | %80–90 | 30 | **Çok Zor** | 27 | %30 |
| 6 | Normal (tanıtım) | 23 | %80–90 (vekil) | 31 | Normal (nefes) | 20 | %80 |
| 7 | Normal (tanıtım) | 24 | %80–90 (vekil) | 32 | Normal | 20 | %70 |
| 8 | Normal (tanıtım) | 26 | %80–90 (vekil) | 33 | Normal | 22 | %65 |
| 9 | Normal (tanıtım) | 25 | %80–90 (vekil) | 34 | Normal | 22 | %65 |
| 10 | **Zor** | 24 | %50–60 (vekil) | 35 | **Zor** | 21 | %50 |
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

Hamle sütunu 1–10 için sevkiyatın `moves` değeridir (6 ve 10 v3c2, §8.15; 7–9 v3c3, §8.16): `min + P + a` (K-52 D-099
tablosu; resmî önbelleksiz `levels:check`; tanıtım bölümleri 1, 5, 6, 7, 8, 9 P'yi bir alt zorluğun satırından alır; `a`:
6 ve 7'de 0, 9'da 1, 8 ve 10'da 2), "Hedef kazanma" 6–10 için ileri bakış vekilinin (ε 0,1, 400 oyun) bandıdır (D-107); 11–50 için eski kurallarla `tahmini minimum + eski tampon`dur (Faz 3'te K-52 ile yeniden hesaplanır;
tanıtım bölümleri aynı kuralla). Fark ve gerekçe §4'te. 11–50'nin tanıtım bölümlerinin hedef oranları Faz 3'te
tanıtım bandına (§0) çekilir. "Hedef kazanma" sütunu **bot** oranıdır; bot K-34 kanca 5 ipuçlarını görmez (DL-2R-04).

**Bölüm 3–5 ölçümü (CL-V3C2-03; §8.16.5, ÖNERİ P-Fl-1):** 1–5'in hedefi bot oranıdır, `targets.policyWin` bandı yoktur.
Resmî 1 adımlı ileri bakış vekilinde (ε 0,1) 3 0,51, 4 0,43, 5 0,56 çıkar; aynı vekile ikinci kazı adımı eklenince 3
0,96, 4 0,89–0,91, 5 0,96–0,97 (2 000 oyun; aralık tohumlar arası). Fark vekilin derin kazı körlüğüdür (gereken blok iki bloğun altında), bölümün zorluğu
değildir; 1–5 verisi değişmez. Resmî vekil 2 adımlı olunca 3–4'e Kolay bandı [0,85, 1,00], 5'e [0,80, 1,00] yazılır.

---

---

<!-- levels:section2-current -->

## 2. Bölüm 1–10 (Hikaye Bölümü 1 — Ağaç Ev) — v3c2 sevkiyatı (`schemaVersion` 3; D-099 sabit saha)

**v3c3 notu (Fl, 2026-11-12; CL-V3C2-01…04):** Bölüm 7–9 kartları v3c3 verisinden yeniden üretildi (§8.16); 1–6 ve
10 kartları aynı.

**v3c2 notu (B1, 2026-11-12; CL-V3C-09):** aşağıdaki "Bölüm N" kartları sevkiyat verisinden (`levels/level_NNN.json`,
`tests/golden/level_NNN.hand.json`, `artifacts/solver/level_NNN.json`) üretildi: alan tablosu, başlangıç gri kutusu
(palet hücresinde üst katmanın harfi), blok tablosu (JSON parti-0 sırası), kanonik çözüm ve öğretici adımları JSON ile
birebirdir. Bölüm 6–10'un tasarım kaydı §8.15'tedir. "Saha" satırında F, `data.review` testinin tanımıyla Σ'dır (bütün
katmanlar); K-02 boşluğu E palet ayak izine göredir (K-58 madde 5). §2.0 ve "Bölüm 1–10 özeti" tablosu Faz 2R
arşivini (`tests/fixtures/levels-2r/`) anlatır.

**D-099 notu (A2, 2026-11-02):** Bölüm 1–10 kayıtları (§2 başlıkları "Bölüm N") §6 şartnamesine göre yeniden
kuruldu: her bölüm iki katlıdır, bütün bloklar baştan sahadadır (K-55), hamle `min + P`'dir (K-52 D-099). Aşağıdaki
§2.0 Faz 2R yöntemidir; tarihsel kayıt olarak kalır, D-099 yöntemi §6'dadır. Kayıtlardaki ASCII, blok tablosu ve kanonik
çözüm solver çıktısıdır (`tests/golden/level_NNN.hand.json` ile birebir).

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
   (Bölüm 3, 5) kolaydır; dar koridor (Bölüm 4: tıkacın tek kaçış sütunu üstteki blokla kapalı, önce o blok kayar),
   üç katlı ters istif kule ve taşınan bloğun üstündeki tek cep (Bölüm 7), yerleşim sırasına bağlı cep (Bölüm 6:
   üstteki kapak cebe **yüksek** park edilmezse ikincisi sığmaz), Ağır Yük'ün kayacağı 3 hücrelik sütun (Bölüm 8, 10)
   zordur. Saha boyutu (K-49) doluluk bandını tutturmak için bölüm bölüm seçilir: tam örtüde saha malzemesi plan
   kadardır, bu yüzden 1–10'da saha 4×4 … 6×5'tir (varsayılan 6×8 saha 2×8 planla %33 dolardı).
3. **Şaşırtmasız zorluk kaynakları** (şaşırtma yasak, K-47):
   a. **Şekil uyumu:** aynı renk bölgesini yalnız belirli yönelimler doldurur (`C3_0` + `C3_180` çifti, Bölüm 2, 6);
      yanlış yönelim gölgede "!" verir, blok kaybolmaz, sonra kullanılır.
   b. **Renk sırası:** kapak bloğun rengi alt satırlara uymaz ya da K-34 desteği yoktur; erken yerleştirilemez.
   c. **Duvar ve geçit erişimi:** duvar yüksekliği "yukarı"yı büyütür (Bölüm 1–4'te duvar = saha yüksekliği, her blok
      en az 1 satır kalkar; Bölüm 6 ve 10'da duvar = tahta yüksekliği, Vinç Alanı'na çıkılır). Geçit derindeki bloğa
      yatay kısayol verir; kısayol geçitsiz hâle göre **2 hamle** (Bölüm 4: 9 − 7) ve **1 hamle** (Bölüm 9: 8 − 7)
      kazandırır (solver `--variant no-gaps`).
   d. **Taşınan malzeme:** sonraki dilimin bloğu bu dilimde engeldir, sonra gerekir (Bölüm 7).
   e. **Ağır Yük kapak:** kaydırmak için önce yan sütun boşaltılır (Bölüm 8, 10); Çekiç bu kazıyı atlatır. Yük yalnız saha
      içinde kayar: saha üstü havaya ve Vinç Alanı'na kalkmaz, blokların üstünden atlamaz (GDD K-08, K-44; DL-2R-08).
      Bu yüzden kısıt hem yolda hem iniştedir; Bölüm 8 ve 10'un kanonik çözümleri yükü yalnız saha içinde kaydırır ve
      bu kuraldan etkilenmez (CL-2R-18 notu).
   f. **Kamyon dökümü:** yeni partinin yığını K-25 sırasıyla tasarlanır; önce düşen blok altta kalır (Bölüm 5, 7, 10).
      Bölüm 5'te dilim 2'nin ilk gereken bloğu iki dikey bloğun altına düşer (dilim 2'de 2 kazı); Bölüm 10'da ilk gereken
      `O4` W bir yatay bloğun altında kalır ve onu park etmek için önce Ağır Yük aşağı indirilir. **Faz 2R 1–10'un
      kanonik çözümlerinde kuyruk yoktur** (Bölüm 10'da yalnız yük başka yerde bırakılırsa oluşur ve çıkmaz üretmez).
      Bölüm 10'un eski kuyruklu dilim 2'si (E-54) bütün uzayda 338 erişim çıkmazı üretiyordu (D1/D2/D3a hiçbirini
      yakalamıyordu, D3b tablosu Faz 3'te; §2.11) ve yeniden tasarlandı. Bilinçli kuyruk Faz 3'te yalnız madde 10'dan
      geçerse kullanılır.
   g. **Saha yerçekimi** (Y6) yığını kendiliğinden açar/kapatır (Faz 3).
4. **Tuzak kaynağı (Kolay/Normal'de yasak, K-51).** Döşeme tuzağı, aynı renkte iki farklı şekil kombinasyonunun aynı
   bölgeye girebildiği yerde doğar: (i) dikey `D2_0` X ile `O4` X'in ya da `C3` X'in dikey çifti; (ii) yatay `D2_90` X ile
   `O4` X'in bir satırı. Kural: bir renk bölgesini tek şekil kombinasyonu doldurur **ya da** aynı renkteki parçalar özdeştir
   (birbirinin yerine geçer). Örnek: Bölüm 3'ün ilk taslağında `D2_0` W ile `O4` W aynı plandaydı; `D2_0` W `O4`'ün
   bölgesine inince bölüm bitmiyordu (çözücü: 20 ✓-tuzağı) → `O4` G yapıldı, tuzak 0. Ws = 3 planlarda 3 renkle bu kural
   sağlanamadı (iki tasarım denendi, ikisinde de dikey çift çakıştı) → S9 hikaye bölümü 2'ye ertelendi.
5. **Zorluk eğrisi (solver).** `minShifts`: 0, 0, 1, 2, 3 (1+2), 2, 4 (3+1), 3, 3, 5 (3+2); `firstNeedDepth`: 0, 0, 1, 2,
   1, 2, 3, 3, 1, 3; `min`: 5, 3, 5, 7, 11, 7, 12, 8, 7, 15. Bölüm 4'ten itibaren her bölümde **en az 2 kazı** vardır
   (proje sahibi: "ihtiyacımız olan blok direkt en üstte olmamalı"). İmzasız bölümler eğrinin tepeleridir (3 → 7 → 10:
   1, 4, 5 kazı); tanıtım bölümleri (4, 5, 6, 8, 9) 2–3 kazıda kalır ve tamponları bir alt zorluktandır (K-52). Bölüm 6'nın
   2 kazısı Bölüm 5'ten azdır ama "yükseğe park" sırası iki adım ileriyi görmeyi ister; Bölüm 9 W3'ün tanıtımıdır ve sade
   tutulur (derinlik 1, kazı 3).
6. **Seçenek.** `bestChoices@0` bölümlerin çoğunda 1'dir (açılışta tek en iyi hamle; 1, 3, 5, 7'de 2–4 eşdeğer park yeri);
   `choices@0` 3–12 (oynanabilir ama yanlış yollar). Bütçe içinde bütün seçenekler kazanılabilir kalır (Kolay/Normal'de
   ✓-tuzağı yok, kaydırma geri alınabilir), bu yüzden "çıkmaz oranı" 1–10'da 0'dır; zorluk israfın bütçeyi yemesinden
   gelir.
7. **Öğretici (K-53).** En çok 2 yumuşak adım; adım olayla biter.
8. **Metin anahtarları (STORY §6A, design-lead):** Bölüm 1–10 öğreticisi design-lead'in mekanik bazlı `tut.m.*`
   anahtarlarını kullanır (GDD §14.1 madde 1, Faz 2R). Kullanılanlar: `tut.m.lift`, `tut.m.useall`, `tut.m.pattern`,
   `tut.m.shadow`, `tut.m.dig` (Bölüm 3, 4, 9), `tut.m.free`, `tut.m.gap`, `tut.m.segments`, `tut.m.truck`,
   `tut.m.highwall`, `tut.m.heavy`, `tut.m.hammer`, `tut.m.narrow`, `tut.m.cranebooster`; v3/v3c yayını (Bölüm 5–10):
   `tut.m.twotone`, `tut.m.wrap`, `tut.m.widesite` (6), `tut.m.pallet` ve `tut.m.palletsite` (7), `tut.m.slippery` (9),
   `tut.m.bonus` (bilgi balonu, kullanılmıyor). **Yeni istenen** (design-lead
   yazar): `tut.m.park` ("Üsttekini yükseğe park et."), `tut.m.carry` ("Bu blok sonraki kat için."), `tut.m.carryNow`
   ("Şimdi sırası geldi."), `tut.ctx.teardown` (Söküm genel satırı) ve Söküm nedeni satırları (`tiling`, `access`,
   `color`; K-30, DL-2R-12), `booster.hammer.noTarget` (K-36, K-54). **Metni güncellenecek:** `tut.m.heavy` ("Geniş
   blok" → Ağır Yük, Y5 yeniden tanımı; Ağır Yük'e "blok" denmez), `tut.m.hammer` (Çekiç malzeme kırmaz, yükü/engeli
   kırar, K-36), `tut.m.gap` (geçit = alttaki bloğa kestirme, OBSTACLES W1 kartı). Kullanılmayan: `tut.m.match`,
   `tut.m.rail`, `tut.m.drop`.
9. **Teslimat adaleti (GDD K-51 madde 5, solver turu).** Kamyonun getireceği bloklar ve düşeceği sütunlar oyuncuya
   gösterilmez (UX §5.9: yalnız "+n" rozeti). Bu yüzden en kısa çözüm, gelecek partiyi bilmeyi gerektiren bir hazırlık
   hamlesi içermemelidir. Ölçüt **önsezi kazancı** `g(k)`: dilim k−1'i en az hamleyle bitiren bütün durumlar içinde
   kazanmaya en yakın olanın toplam hamlesi − `min`; hedef `g = 0`. Ek olarak bu durumların kazanmaya uzaklıkları
   arasındaki **fark** (şans payı) 0 olmalıdır. Örnek: Bölüm 10'un bir ara taslağında oyuncu dilim 1'in son bloğunu
   koymadan önce Ağır Yük'ü sağ alta indirirse kamyon dilim 2'yi yükün üstüne döküyor ve 2 kazı kalkıyordu (`min` 14,
   doğal oyun 15, `g = 1`) → parti sırası değiştirildi, son taslakta `g = 0`, fark 0. Faz 2R'de product-lead karalama
   aracıyla ölçer (§2.11); solver uyarısı code-lead'den istendi (REVIEW_LOG).
10. **Söküm'süz çıkmaz yok (GDD K-51 madde 2, solver turu).** D3b tablosu Faz 3'tedir (kesme 1); bu yüzden Faz 2R
   bölümlerinde **bütün keşif uzayında** D1/D2/D3a'nın yakalamadığı tek bir çıkmaz durum bile olmamalıdır (yalnız
   kapsam K değil, yalnız ✓-tuzağı değil: teslimatlı kaydırmalar da sayılır). Bölüm 1–10'un hepsinde `dead states 0`.
11. **Vekil oyuncu (tasarım aracı, bağlayıcı değil).** Bot (WP-N) gelene kadar product-lead karalama aracında iki vekil
   koşar: "acemi" (doğru yerleşim varsa rastgele birini yapar, yoksa bir sonraki yerleşimi hemen açan kaydırmalardan
   rastgele birini, o da yoksa rastgele bir kaydırma) ve "kazıcı" (en yakın doğru yerleşime en kısa kazı yolunu izler).
   Kazıcı 1–10'un hepsini bütçe içinde en kısa yoldan kazanır: bölümler "gereken bloğu bul ve önünü aç" düzeyindedir,
   tuzak ya da uzak planlama istemez (Kolay/Normal ilkesi). Acemi oranları §2.11 tablosundadır; hedef bantlar bot
   içindir ve `a` ayarı bot ölçümünden sonra yapılır (K-52).

**Bölüm 1–10 özeti** (`N` = malzeme bloğu, `E` = başta boş saha hücresi, `d` = `firstNeedDepth`, `s` = `minShifts`, ch =
`choices@0·1·2 / bestChoices@0·1·2`; hedef aralıklar `metric_out_of_band` için):

| # | Ad | Zorluk | Öğretir (imza) | Saha Wy×Hy | Şantiye Ws×Hs × dilim | H / duvar / geçit | Renkler | Şekiller | N | E | min | s (hedef) | d (hedef) | YAO | ch | T | Hamle | Kazanma hedefi |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Ağaç Basamakları | Kolay | kaldır–taşı–indir (—) | 4×4 | 2×5 × 1 | 5 / 4 / — | W, Y | D2 | 5 | 6 | 5 | 0 (0) | 0 (0) | 5/5 | 11·11·16 / 2·1·1 | 6 | **11** | ≥ %95 |
| 2 | Platform | Kolay | şekil + gölge (—) | 4×4 | 2×5 × 1 | 5 / 4 / — | G, W, Y | O4, C3 | 3 | 6 | 3 | 0 (0) | 0 (0) | 3/3 | 7·13·9 / 1·1·1 | 6 | **9** | ≥ %92 |
| 3 | Ön Duvar | Kolay | kazı (—) | 4×4 | 2×5 × 1 | 5 / 4 / — | G, W, Y | D2, O4 | 4 | 6 | 5 | 1 (1) | 1 (1) | 4/4 | 6·9·10 / 3·1·1 | 6 | **11** | ≥ %92 |
| 4 | Pencere Pervazı | Kolay (tanıtım) | W1 Sabit Geçit | 4×4 | 2×6 × 1 | 6 / 4 / y0 boy 2 | G, W, Y | D2, O4 | 5 | 4 | 7 | 2 (2–3) | 2 (1–2) | 4/5 | 5·9·9 / 1·1·1 | 6 | **13** | ≥ %90 |
| 5 | İki Odalı Ev | Normal (tanıtım) | S1 Kayan Şantiye + kamyon | 4×4 | 2×5 × 2 | 5 / 4 / — | R, W, Y | D2, O4 | 8 | 6 | 11 | 3 (3–4; 1+2) | 1 (1–2) | 8/8 | 11·8·14 / 2·1·1 | 6 (tanıtım) | **17** | %85 |
| 6 | Uzun Gövde | Normal (tanıtım) | W2 Yüksek Duvar | 4×5 | 2×7 × 1 | 7 / 7 / — | G, W, Y | D2, O4, C3 | 5 | 6 | 7 | 2 (2–3) | 2 (2) | 5/5 | 7·9·10 / 1·1·1 | 6 (tanıtım) | **13** | %85 |
| 7 | Çatı Altı | Normal | taşınan malzeme (—) | 4×5 | 2×5 × 2 | 5 / 5 / — | G, R, W | D2, O4 | 8 | 6 | 12 | 4 (4–5; 3+1) | 3 (2–3) | 8/8 | 11·11·10 / 4·2·1 | 5 | **17** | %75 |
| 8 | Bahçe Çiti | Normal (tanıtım) | Y5 Ağır Yük + Çekiç | 6×5 | 2×6 × 1 | 6 / 5 / — | R, W, Y | D2, O4, Q9 | 5 | 9 | 8 | 3 (3–4) | 3 (2–3) | 5/5 | 12·15·16 / 1·1·2 | 6 (tanıtım) | **14** | %85 |
| 9 | İp Merdiven | Normal (tanıtım) | W3 Dar Geçit | 4×4 | 2×6 × 1 | 6 / 4 / y0 boy 1 | G, R, W | D2, O4 | 4 | 4 | 7 | 3 (3–4) | 1 (1–2) | 3/4 | 3·5·5 / 1·1·1 | 6 (tanıtım) | **13** | %85 |
| 10 | Ağaç Ev Tamam! | **Zor** | final + Vinç | 6×5 | 2×6 × 2 | 6 / 6 / — | G, R, W | D2, O4, Q9 | 10 | 9 | 15 | 5 (5–6; 3+2) | 3 (3) | 10/10 | 12·15·16 / 1·1·2 | 3 | **18** | %45 |

Bütün satırlarda `trapCount = 0`, `deadRate = 0`, bütün keşif uzayında çıkmaz durum 0 (§2.0 madde 10), K-02 bandı
tutuyor. **Varyant ölçütleri** (K-50 ölçütü değil, solver varyantı; `levels:solve --variant no-gaps|hammer-start`, sonuç
LEVEL_REPORT'ta; CL-2R-13): Bölüm 4 ve 9 için `geçitsiz min − min ≥ 1` (solver: 4'te 9 − 7 = 2, 9'da 8 − 7 = 1); Bölüm 8
ve 10 için `min − Çekiç'le min ≥ 2` (`hammer-start`: başta bütün Ağır Yük silinir; solver: 8'de 8 − 5 = 3, 10'da 15 − 11 =
4). Bant tutmazsa geçit ya da yük bölümde gereksizdir ve bölüm yeniden tasarlanır. Faz 2R 1–10'da kanonik çözümde
kuyrukta bekleyen kamyon bloğu yoktur (`batch_queued` uyarısı yok; `tools/levels-allow.json`'daki `"10"` girişi artık
gereksizdir, code-lead dosyası).

**Boyut gerekçeleri (K-49):** Bölüm 1–5: 4×4 saha, şantiye 2×5/2×6 — en küçük okunur yığın, doluluk %62–%75, H = 5–6 ile
duvar (4) saha tepesinin üstünde: her blok en az 1 satır kalkar. Bölüm 6: saha 4×5, şantiye 2×7, H = 7 = duvar → yüksek
duvar dersi için blok sahanın tepesinden 3 satır kalkar. Bölüm 7: iki dilim + taşınan `O4` için 4×5. Bölüm 8 ve 10: Ağır
Yük (3×3) ve yanında kayma sütunu için varsayılan genişlik 6 (Wy + Ws = 8). Bölüm 9: 4×4, dar geçidin önündeki tıkaç
dersi küçük sahada okunur.

### Bölüm 1 — Ağaç Basamakları (Tree Steps)

| Alan | Değer |
|---|---|
| Öğretilen | **S1 Kayan Şantiye** (iki kat tek sahada, K-55) + kaldır–taşı–indir (`teaches: "S1"`) |
| Zorluk / hedef kazanma | Kolay (tanıtım) / ≥ %95 (orta bot; `levels:bot` yok) |
| Boyut (K-49) | `yard { cols 5, rows 4 }`, `site { cols 2, rows 4 }` → H = 4, Vinç Alanı y = 4–5 |
| Duvar | `height 3`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Alt Basamak (EN: Lower Step) `["WY", "WY", "YW", "YW"]` · 2. Üst Basamak (EN: Upper Step) `["YY", "WW", "YY", "WW"]` |
| Renkler / şekiller | W, Y (2) / D2 |
| Saha | C = 20, F = 16, E = 4 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 8 · min 8 · alt sınır 8 · YAO 8/8 · plan_trap 0 |
| Hamle (K-52, D-099) | 8 + P 4 = **12** |

**Tasarım niyeti:** Oyuncu bloğu kaldırıp duvarın üstünden aşırmanın temel hareket olduğunu keşfeder. Sekiz domino: 1. kat dikey `D2_0`, 2. kat yatay `D2_90`; dama deseni tek bir karar ister: hangi domino hangi sütuna. Kazı yok (`min` = N), kat bitince şantiye kayar ve sahada kalanlar ikinci katın malzemesidir.

```
       x: 0 1 2 3 4   D   5 6
   y=5:  · · · · ·   :   · ·
   y=4:  · · · · ·   :   · ·  ← Vinç Alanı
   y=3:  a b c d .   :   W Y
   y=2:  a b c d .   #   W Y
   y=1:  e e f f .   #   Y W
   y=0:  g g h h .   #   Y W
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_0` | Y | (0,2) | 1. kat, kanonik 2. hamle |
| `b` | `D2_0` | W | (1,2) | 1. kat, kanonik 1. hamle |
| `c` | `D2_0` | W | (2,2) | 1. kat, kanonik 3. hamle |
| `d` | `D2_0` | Y | (3,2) | 1. kat, kanonik 4. hamle |
| `e` | `D2_90` | Y | (0,1) | 2. kat, kanonik 6. hamle |
| `f` | `D2_90` | W | (2,1) | 2. kat, kanonik 5. hamle |
| `g` | `D2_90` | W | (0,0) | 2. kat, kanonik 7. hamle |
| `h` | `D2_90` | Y | (2,0) | 2. kat, kanonik 8. hamle |

Kanonik çözüm (solver, K-50 madde 4):
1. `b` (D2_0 W) (1,2) → (6,0) — duvar üstü, doğru
2. `a` (D2_0 Y) (0,2) → (5,0) — duvar üstü, doğru
3. `c` (D2_0 W) (2,2) → (5,2) — duvar üstü, doğru
4. `d` (D2_0 Y) (3,2) → (6,2) — duvar üstü, doğru; 1. kat biter
5. `f` (D2_90 W) (2,1) → (5,0) — duvar üstü, doğru
6. `e` (D2_90 Y) (0,1) → (5,1) — duvar üstü, doğru
7. `g` (D2_90 W) (0,0) → (5,2) — duvar üstü, doğru
8. `h` (D2_90 Y) (2,0) → (5,3) — duvar üstü, doğru; 2. kat biter

Öğretici:
1. `piece:1`, `crane` · drag `[[1,3],[1,5],[6,5]]` · `tut.m.lift` · `{ event: placementCorrect, count: 1 }` (tutulan hücre `b`nin üst hücresi (1,3); Vinç Alanı y = 4–5, son çapa (6,5) şantiye üstünde)
2. `startOn: { event: segmentDone }` · `goals` · — · `tut.m.useall` · `{ event: placementCorrect, count: 1 }` (kat bitince kalan blok çipi)

### Bölüm 2 — Köşe Destekleri (Corner Braces)

| Alan | Değer |
|---|---|
| Öğretilen | — (imzasız: şekil + gölge; L4/J4 ilk kez) |
| Zorluk / hedef kazanma | Kolay / ≥ %92 (orta bot) |
| Boyut (K-49) | `yard { cols 6, rows 5 }`, `site { cols 2, rows 6 }` → H = 6, Vinç Alanı y = 6–7 |
| Duvar | `height 5`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Sol Köşe (EN: Left Corner) `["YW", "YW", "WW", "GG", "YG", "YG"]` · 2. Sağ Köşe (EN: Right Corner) `["GY", "GY", "GG", "YW", "YW", "WW"]` |
| Renkler / şekiller | G, W, Y (3) / D2, J4, L4 |
| Saha | C = 30, F = 24, E = 6 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 8 · min 8 · alt sınır 8 · YAO 8/8 · liftRatio 1 · plan_trap 0 |
| Hamle (K-52, D-099) | 8 + P 4 = **12** |

**Tasarım niyeti:** L ve J ilk kez gelir: yanlış yönelimdeki blok gölgede "!" verir, önce küçük dikey domino oturur. Kazı yok; her yerleşim duvar üstünden.

```
       x: 0 1 2 3 4 5   D   6 7
   y=7:  · · · · · ·   :   · ·
   y=6:  · · · · · ·   :   · ·  ← Vinç Alanı
   y=5:  · · · · · ·   :   Y W
   y=4:  . . a b . .   #   Y W
   y=3:  c c a b . .   #   W W
   y=2:  d c e f g h   #   G G
   y=1:  d c e f g h   #   Y G
   y=0:  d d f f h h   #   Y G
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_0` | Y | (2,3) | 2. kat, kanonik 6. hamle |
| `b` | `D2_0` | Y | (3,3) | 2. kat, kanonik 8. hamle |
| `c` | `L4_180` | G | (0,1) | 1. kat, kanonik 2. hamle |
| `d` | `L4_0` | G | (0,0) | 2. kat, kanonik 7. hamle |
| `e` | `D2_0` | Y | (2,1) | 1. kat, kanonik 4. hamle |
| `f` | `J4_0` | W | (2,0) | 2. kat, kanonik 5. hamle |
| `g` | `D2_0` | Y | (4,1) | 1. kat, kanonik 1. hamle |
| `h` | `J4_0` | W | (4,0) | 1. kat, kanonik 3. hamle |

Kanonik çözüm (solver, K-50 madde 4):
1. `g` (D2_0 Y) (4,1) → (6,0) — duvar üstü, doğru
2. `c` (L4_180 G) (0,1) → (6,0) — duvar üstü, doğru
3. `h` (J4_0 W) (4,0) → (6,3) — duvar üstü, doğru
4. `e` (D2_0 Y) (2,1) → (6,4) — duvar üstü, doğru; 1. kat biter
5. `f` (J4_0 W) (2,0) → (6,0) — duvar üstü, doğru
6. `a` (D2_0 Y) (2,3) → (6,1) — duvar üstü, doğru
7. `d` (L4_0 G) (0,0) → (6,3) — duvar üstü, doğru
8. `b` (D2_0 Y) (3,3) → (7,4) — duvar üstü, doğru; 2. kat biter

Öğretici:
1. `panorama`, `build` · — · `tut.m.pattern` · `{ event: placementCorrect, count: 1 }` (plan paneli ve şantiye; ilk doğru yerleşimle biter)
2. `piece:2` · — · `tut.m.shadow` · `{ event: placementCorrect, count: 1 }` (ilk L/J'nin gölgesi)

### Bölüm 3 — Köşe Taşları (Corner Stones)

| Alan | Değer |
|---|---|
| Öğretilen | — (imzasız: kazı, C3 ilk kez) |
| Zorluk / hedef kazanma | Kolay / ≥ %92 (orta bot) |
| Boyut (K-49) | `yard { cols 5, rows 5 }`, `site { cols 2, rows 5 }` → H = 5, Vinç Alanı y = 5–6 |
| Duvar | `height 4`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Kat 1 (EN: Floor 1) `["YY", "YW", "YW", "WW", "WW"]` · 2. Kat 2 (EN: Floor 2) `["YY", "YY", "YY", "WW", "WW"]` |
| Renkler / şekiller | W, Y (2) / D2, O4 |
| Saha | C = 25, F = 20, E = 5 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 9 · min 11 · alt sınır 10 · YAO 9/9 · liftRatio 0,78 · plan_trap 0 · yerleştiren vekil 0,24 / 0,39 · 10 000 yürüyüş: kazanılan 9159, kurtarılan 0, yakalanmayan çıkmaz 0 (tahmin) |
| Hamle (K-52, D-099) | 11 + P 4 = **15** |

**Tasarım niyeti:** İlk gereken bloklar iki kapağın altındadır: kapakları sahada kenara çekmek (kazı) ilk derstir. Kanonik çözümde 2 park + 9 yerleşim.

```
       x: 0 1 2 3 4   D   5 6
   y=6:  · · · · ·   :   · ·
   y=5:  · · · · ·   :   · ·  ← Vinç Alanı
   y=4:  . a a b b   :   Y Y
   y=3:  c d e e .   #   Y W
   y=2:  c d e e .   #   Y W
   y=1:  f g h . i   #   W W
   y=0:  f g h . i   #   W W
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_90` | Y | (1,4) | 2. kat, kanonik 9. hamle |
| `b` | `D2_90` | Y | (3,4) | 1. kat, kanonik 7. hamle |
| `c` | `D2_0` | Y | (0,2) | 1. kat, kanonik 6. hamle |
| `d` | `D2_0` | W | (1,2) | 1. kat, kanonik 3. hamle |
| `e` | `O4_0` | W | (2,2) | 2. kat, kanonik 8. hamle |
| `f` | `D2_0` | Y | (0,0) | 2. kat, kanonik 10. hamle |
| `g` | `D2_0` | Y | (1,0) | 2. kat, kanonik 11. hamle |
| `h` | `D2_0` | W | (2,0) | 1. kat, kanonik 4. hamle |
| `i` | `D2_0` | W | (4,0) | 1. kat, kanonik 5. hamle |

Kanonik çözüm (solver, K-50 madde 4):
1. `a` (D2_90 Y) (1,4) → (0,4) — **kaydırma** (park)
2. `e` (O4_0 W) (2,2) → (3,2) — **kaydırma** (park)
3. `d` (D2_0 W) (1,2) → (5,0) — duvar üstü, doğru
4. `h` (D2_0 W) (2,0) → (6,0) — duvar üstü, doğru
5. `i` (D2_0 W) (4,0) → (6,2) — duvar üstü, doğru
6. `c` (D2_0 Y) (0,2) → (5,2) — duvar üstü, doğru
7. `b` (D2_90 Y) (3,4) → (5,4) — duvar üstü, doğru; 1. kat biter
8. `e` (O4_0 W) (3,2) → (5,0) — duvar üstü, doğru
9. `a` (D2_90 Y) (0,4) → (5,2) — duvar üstü, doğru
10. `f` (D2_0 Y) (0,0) → (5,3) — duvar üstü, doğru
11. `g` (D2_0 Y) (1,0) → (6,3) — duvar üstü, doğru; 2. kat biter

Öğretici:
1. `piece:0` · — · `tut.m.dig` · `{ event: yardMove, count: 1, piece: 'piece:0' }` (ilk kapak bloğu; sahada kenara çekilince biter)

### Bölüm 4 — Ön Duvar (Front Wall)

| Alan | Değer |
|---|---|
| Öğretilen | — (imzasız: R rengi + aynalı C3; 3 kat) |
| Zorluk / hedef kazanma | Kolay / ≥ %90 (orta bot); ileri bakış vekili %46 (aşağıda) |
| Boyut (K-49) | `yard { cols 6, rows 5 }`, `site { cols 2, rows 4 }` → H = 5, Vinç Alanı y = 5–6 |
| Duvar | `height 4`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Kat 1 (EN: Floor 1) `["WW", "RR", "RR", "RR"]` · 2. Kat 2 (EN: Floor 2) `["WY", "WY", "YW", "YW"]` · 3. Kat 3 (EN: Floor 3) `["YY", "WY", "WY", "YY"]` |
| Renkler / şekiller | R, W, Y (3) / C3, D2 |
| Saha | C = 30, F = 24, E = 6 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 10 · min 12 · alt sınır 11 · YAO 10/10 · liftRatio 1 · plan_trap 0 · yerleştiren vekil 0,17 / 0,3 · 10 000 yürüyüş: kazanılan 7082, kurtarılan 0, yakalanmayan çıkmaz 0 (tahmin) |
| Hamle (K-52, D-099) | 12 + P 4 = **16** |

**Tasarım niyeti:** Üç katlı ilk bölüm; aynalı C3'ler aynı renk bölgesinde değil, ayrı katlardadır. **v3c2 (CL-V3C-03):** yerleşim ve şekiller aynı kaldı, 4 bloğun rengi değişti (`D2_0` (2,3) W → Y, `D2_0` (0,2) R → W, `D2_0` (0,0) R → Y, `C3_180` (2,0) W → Y); plan düzeyi tuzak taraması 4 → 0, 10 000 yürüyüşte Söküm'le kurtarılan 259 → 0. İleri bakış vekili (ε 0) bütçede 0,25 → 0,56; Kolay bandının altında kalması yerleşimin 2 derin kazısındandır (1 adım ileri bakan oyuncu ikinci kapağı göremez), yeniden yerleşim sonraki tura açık soru (§8.15.5).

```
       x: 0 1 2 3 4 5   D   6 7
   y=6:  · · · · · ·   :   · ·
   y=5:  · · · · · ·   :   · ·  ← Vinç Alanı
   y=4:  a a b . . c   :   · ·
   y=3:  d a b f g c   #   W W
   y=2:  d e e f g g   #   R R
   y=1:  h . i i . j   #   R R
   y=0:  h . . i j j   #   R R
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `C3_180` | R | (0,3) | 1. kat, kanonik 4. hamle |
| `b` | `D2_0` | Y | (2,3) | 2. kat, kanonik 6. hamle |
| `c` | `D2_0` | W | (5,3) | 2. kat, kanonik 9. hamle |
| `d` | `D2_0` | W | (0,2) | 2. kat, kanonik 7. hamle |
| `e` | `D2_90` | W | (1,2) | 1. kat, kanonik 5. hamle |
| `f` | `D2_0` | W | (3,2) | 3. kat, kanonik 11. hamle |
| `g` | `C3_0` | R | (4,2) | 1. kat, kanonik 3. hamle |
| `h` | `D2_0` | Y | (0,0) | 2. kat, kanonik 8. hamle |
| `i` | `C3_180` | Y | (2,0) | 3. kat, kanonik 12. hamle |
| `j` | `C3_270` | Y | (4,0) | 3. kat, kanonik 10. hamle |

Kanonik çözüm (solver, K-50 madde 4):
1. `i` (C3_180 Y) (2,0) → (1,0) — **kaydırma** (park)
2. `f` (D2_0 W) (3,2) → (3,0) — **kaydırma** (park)
3. `g` (C3_0 R) (4,2) → (6,0) — duvar üstü, doğru
4. `a` (C3_180 R) (0,3) → (6,1) — duvar üstü, doğru
5. `e` (D2_90 W) (1,2) → (6,3) — duvar üstü, doğru; 1. kat biter
6. `b` (D2_0 Y) (2,3) → (6,0) — duvar üstü, doğru
7. `d` (D2_0 W) (0,2) → (7,0) — duvar üstü, doğru
8. `h` (D2_0 Y) (0,0) → (7,2) — duvar üstü, doğru
9. `c` (D2_0 W) (5,3) → (6,2) — duvar üstü, doğru; 2. kat biter
10. `j` (C3_270 Y) (4,0) → (6,0) — duvar üstü, doğru
11. `f` (D2_0 W) (3,0) → (6,1) — duvar üstü, doğru
12. `i` (C3_180 Y) (1,0) → (6,2) — duvar üstü, doğru; 3. kat biter

Öğretici: yok — kazı 3'te öğretildi.

### Bölüm 5 — Renkli Pencere (Two-Tone Window)

| Alan | Değer |
|---|---|
| Öğretilen | **Y9 İki Renkli Blok** (`teaches: "Y9"`) |
| Zorluk / hedef kazanma | Normal (tanıtım) / %80–90 (Normal tanıtım, orta bot) |
| Boyut (K-49) | `yard { cols 6, rows 6 }`, `site { cols 2, rows 5 }` → H = 6, Vinç Alanı y = 6–7 |
| Duvar | `height 4`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Kat 1 (EN: Floor 1) `["WW", "RY", "WW", "RW", "RR"]` · 2. Kat 2 (EN: Floor 2) `["WW", "YY", "RY", "RR", "WW"]` · 3. Kat 3 (EN: Floor 3) `["YR", "YY", "RY", "RW", "RR"]` |
| Renkler / şekiller | R, W, Y (3) / C3, D2, L4, O4 |
| Saha | C = 36, F = 30, E = 6 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 12 · min 14 · alt sınır 13 · YAO 12/12 · liftRatio 0,75 · plan_trap 0 · yerleştiren vekil 0,29 / 0,55 · 10 000 yürüyüş: kazanılan 9825, kurtarılan 0, yakalanmayan çıkmaz 0 (tahmin) |
| Hamle (K-52, D-099) | 14 + P 4 = **18** |

**Tasarım niyeti:** `WY`/`YW` ikizleri ve iki renkli `O4` aynı görünür ama tek yere oturur; ilk gereken iki renkli blok gömülüdür (ilk hamle kazı). **v3c2 (CL-V3C-03):** 2 blok yeniden boyandı (`D2_90` (0,3) R → W, `D2_0` (5,0) W → Y); plan tuzağı 3 → 0, kanonik çözüm ve `eventLogHash` aynı; 10 000 yürüyüşte yakalanmayan çıkmaz 1/182 → 0/175. `tile_family_mix` uyarısı sürer (K-63 (a) iki sütunda; `plan_trap` kanıtı varken susması code-lead'e önerildi).

```
       x: 0 1 2 3 4 5   D   6 7
   y=7:  · · · · · ·   :   · ·
   y=6:  · · · · · ·   :   · ·  ← Vinç Alanı
   y=5:  b a a c c .   :   · ·
   y=4:  b b e e c .   :   W W
   y=3:  d d e e f f   #   R Y
   y=2:  g g . k h h   #   W W
   y=1:  i j . k . l   #   R W
   y=0:  i j . k k l   #   R R
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_90` | W | (1,5) | 1. kat, kanonik 6. hamle |
| `b` | `C3_0` | R | (0,4) | 1. kat, kanonik 3. hamle |
| `c` | `C3_180` | W | (3,4) | 1. kat, kanonik 4. hamle |
| `d` | `D2_90` | W | (0,3) | 2. kat, kanonik 7. hamle |
| `e` | `O4_0` | R | (2,3) | iki renkli "RRRY"; 2. kat, kanonik 8. hamle |
| `f` | `D2_90` | R | (4,3) | iki renkli "RY"; 1. kat, kanonik 5. hamle |
| `g` | `D2_90` | W | (0,2) | 2. kat, kanonik 10. hamle |
| `h` | `D2_90` | Y | (4,2) | 2. kat, kanonik 9. hamle |
| `i` | `D2_0` | W | (0,0) | iki renkli "WY"; 3. kat, kanonik 12. hamle |
| `j` | `D2_0` | Y | (1,0) | iki renkli "YR"; 3. kat, kanonik 13. hamle |
| `k` | `L4_0` | R | (3,0) | 3. kat, kanonik 11. hamle |
| `l` | `D2_0` | Y | (5,0) | 3. kat, kanonik 14. hamle |

Kanonik çözüm (solver, K-50 madde 4):
1. `c` (C3_180 W) (3,4) → (4,4) — **kaydırma** (park)
2. `a` (D2_90 W) (1,5) → (2,5) — **kaydırma** (park)
3. `b` (C3_0 R) (0,4) → (6,0) — duvar üstü, doğru
4. `c` (C3_180 W) (4,4) → (6,1) — duvar üstü, doğru
5. `f` (D2_90 R) (4,3) → (6,3) — duvar üstü, doğru
6. `a` (D2_90 W) (2,5) → (6,4) — duvar üstü, doğru; 1. kat biter
7. `d` (D2_90 W) (0,3) → (6,0) — duvar üstü, doğru
8. `e` (O4_0 R) (2,3) → (6,1) — duvar üstü, doğru
9. `h` (D2_90 Y) (4,2) → (6,3) — duvar üstü, doğru
10. `g` (D2_90 W) (0,2) → (6,4) — duvar üstü, doğru; 2. kat biter
11. `k` (L4_0 R) (3,0) → (6,0) — duvar üstü, doğru
12. `i` (D2_0 W) (0,0) → (7,1) — duvar üstü, doğru
13. `j` (D2_0 Y) (1,0) → (7,3) — duvar üstü, doğru
14. `l` (D2_0 Y) (5,0) → (6,3) — duvar üstü, doğru; 3. kat biter

Öğretici:
1. `piece:4` · — · `tut.m.twotone` · `{ event: placementCorrect, count: 1 }` (iki renkli `O4` (`e`); ilk doğru yerleşimle biter)

### Bölüm 6 — Geniş Temel (Wide Base)

| Alan | Değer |
|---|---|
| Öğretilen | **S9 Geniş Şantiye** (3 sütun, 9 sütunlu tahta; D-103) (`teaches: "S9"`) |
| Zorluk / hedef kazanma | Normal (tanıtım) / %80–90 (Normal tanıtım; ileri bakış vekili, ε 0,1, 400 oyun) |
| Boyut (K-49) | `yard { cols 6, rows 8 }`, `site { cols 3, rows 5 }` → H = 8, Vinç Alanı y = 8–9 |
| Duvar | `height 7`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Kat 1 (EN: Floor 1) `["YWY", "GGY", "YGW", "YGW", "GGG"]` · 2. Kat 2 (EN: Floor 2) `["YWW", "YWG", "GGW", "GGG", "YYG"]` · 3. Kat 3 (EN: Floor 3) `["YGG", "YWG", "WWW", "WWG", "GGG"]` |
| Renkler / şekiller | G, W, Y (3) / C3, D2, L4, T4 |
| Saha | C = 48, F = 45, E = 3 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 17 · min 19 · alt sınır 18 · YAO 17/17 · liftRatio 0,94 · plan_trap 0 · vekil (ileri bakış, ε 0,1, 400 oyun) 0,83 [0,79–0,86] · yerleştiren vekil 0,23 / 0,44 · 10 000 yürüyüş: kazanılan 9683, kurtarılan 0, yakalanmayan çıkmaz 0 (tahmin) |
| Hamle (K-52, D-099) | 19 + P 4 = **23** |

**Tasarım niyeti:** Şantiye ilk kez 3 sütun: katın taban satırını tek hamlede kapatan **düz** bloklar sığar. İlk gereken blok düz `T4_270` G'dir (`c`) ve bir Y dominonun (`a`) altındadır: 1 kazı, sonra T tabanı kapatır, çıkıntısı ortadaki G'ye oturur. İkinci düz blok `L4_270` G (2. kat tabanı). İki renkli ikizler (`d` YW, `l` WG; Y9 pekiştirme) gölgede yalnız tek yerde ✓ verir. Paletsiz (D-107: geniş şantiye tek başına), 17 blok (6×8 saha 45 plan hücresi taşır; şekil çeşitliliği 18. bloktan önce gelir: D2, C3, L4, T4).

```
       x: 0 1 2 3 4 5   D   6 7 8
   y=9:  · · · · · ·   :   · · ·
   y=8:  · · · · · ·   :   · · ·  ← Vinç Alanı
   y=7:  b . c a a .   :   · · ·
   y=6:  b c c c e e   #   · · ·
   y=5:  d d f f g e   #   · · ·
   y=4:  h i i f g g   #   Y W Y
   y=3:  h i j k l m   #   G G Y
   y=2:  j j j k l m   #   Y G W
   y=1:  n n o p p q   #   Y G W
   y=0:  n . o o p q   #   G G G
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_90` | Y | (3,7) | 2. kat, kanonik 8. hamle |
| `b` | `D2_0` | Y | (0,6) | 1. kat, kanonik 3. hamle |
| `c` | `T4_270` | G | (1,6) | 1. kat, kanonik 2. hamle |
| `d` | `D2_90` | Y | (0,5) | iki renkli "YW"; 1. kat, kanonik 5. hamle |
| `e` | `C3_180` | G | (4,5) | 2. kat, kanonik 9. hamle |
| `f` | `C3_180` | G | (2,4) | 1. kat, kanonik 4. hamle |
| `g` | `C3_0` | W | (4,4) | 3. kat, kanonik 17. hamle |
| `h` | `D2_0` | W | (0,3) | 1. kat, kanonik 6. hamle |
| `i` | `C3_90` | G | (1,3) | 2. kat, kanonik 10. hamle |
| `j` | `L4_270` | G | (0,2) | 3. kat, kanonik 15. hamle |
| `k` | `D2_0` | Y | (3,2) | 1. kat, kanonik 7. hamle |
| `l` | `D2_0` | W | (4,2) | iki renkli "WG"; 2. kat, kanonik 11. hamle |
| `m` | `D2_0` | Y | (5,2) | 2. kat, kanonik 12. hamle |
| `n` | `C3_90` | W | (0,0) | 2. kat, kanonik 14. hamle |
| `o` | `C3_0` | W | (2,0) | 3. kat, kanonik 16. hamle |
| `p` | `C3_180` | G | (3,0) | 3. kat, kanonik 18. hamle |
| `q` | `D2_0` | Y | (5,0) | 3. kat, kanonik 19. hamle |

Kanonik çözüm (solver, K-50 madde 4):
1. `a` (D2_90 Y) (3,7) → (4,7) — **kaydırma** (park)
2. `c` (T4_270 G) (1,6) → (6,0) — duvar üstü, doğru
3. `b` (D2_0 Y) (0,6) → (6,1) — duvar üstü, doğru
4. `f` (C3_180 G) (2,4) → (6,2) — duvar üstü, doğru
5. `d` (D2_90 Y) (0,5) → (6,4) — duvar üstü, doğru
6. `h` (D2_0 W) (0,3) → (8,1) — duvar üstü, doğru
7. `k` (D2_0 Y) (3,2) → (8,3) — duvar üstü, doğru; 1. kat biter
8. `a` (D2_90 Y) (4,7) → (6,0) — duvar üstü, doğru
9. `e` (C3_180 G) (4,5) → (7,0) — duvar üstü, doğru
10. `i` (C3_90 G) (1,3) → (6,1) — duvar üstü, doğru
11. `l` (D2_0 W) (4,2) → (8,2) — duvar üstü, doğru
12. `m` (D2_0 Y) (5,2) → (6,3) — duvar üstü, doğru
13. `j` (L4_270 G) (0,2) → (2,2) — **kaydırma** (park)
14. `n` (C3_90 W) (0,0) → (7,3) — duvar üstü, doğru; 2. kat biter
15. `j` (L4_270 G) (2,2) → (6,0) — duvar üstü, doğru
16. `o` (C3_0 W) (2,0) → (6,1) — duvar üstü, doğru
17. `g` (C3_0 W) (4,4) → (7,2) — duvar üstü, doğru
18. `p` (C3_180 G) (3,0) → (7,3) — duvar üstü, doğru
19. `q` (D2_0 Y) (5,0) → (6,3) — duvar üstü, doğru; 3. kat biter

Öğretici:
1. `piece:2` · — · `tut.m.widesite` · `{ event: placementCorrect, count: 1, piece: 'piece:2' }` (ilk gereken düz blok `c` (`T4_270`); üstündeki `a` kazılınca alınır, doğru yerleşince biter)

### Bölüm 7 — Palet Yığını (Pallet Stack)

| Alan | Değer |
|---|---|
| Öğretilen | **Y10 Palet** (yalnız şantiyeye, D-104; şekli serbest, D-106) + bonus ödül anı (Y12, öğretilmez) (`teaches: "Y10"`) |
| Zorluk / hedef kazanma | Normal (tanıtım) / %80–90 (Normal tanıtım; ileri bakış vekili, ε 0,1, 400 oyun) |
| Boyut (K-49) | `yard { cols 6, rows 8 }`, `site { cols 3, rows 6 }` → H = 8, Vinç Alanı y = 8–9 |
| Duvar | `height 7`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Kat 1 (EN: Floor 1) `["RRW", "RWW", "RWW", "RRW", "RRY", "RYY"]` · 2. Kat 2 (EN: Floor 2) `["WWW", "WYY", "WYY", "WRR", "YYR", "YYR"]` · 3. Kat 3 (EN: Floor 3) `["WWW", "WRR", "YYR", "YYR", "YYW", "YYW"]` |
| Renkler / şekiller | R, W, Y (3) / C3, D2, L4, O4 |
| Saha | C = 48, F = 54 (Σ, bütün palet katmanları dahil; K-58 madde 5 ayak izi 42), E = 6 (ayak izine göre; K-02) |
| Ölçütler (solver) | N 19 · min 20 · alt sınır 20 · YAO 19/19 · liftRatio 1 · plan_trap 0 · vekil (ileri bakış, ε 0,1, 400 oyun) 0,86 [0,83–0,89] · yerleştiren vekil 0,34 / 0,59 · 10 000 yürüyüş: kazanılan 6195, kurtarılan 0, yakalanmayan çıkmaz 1 (tahmin) |
| Hamle (K-52, D-099) | 20 + P 4 = **24** |

**Tasarım niyeti:** **v3c3 (Fl, CL-V3C2-01/02/04).** Palet `O4_0` Y ×4 (`m`–`p`) sol altta. Üstünde 1. katın iki kırmızı `C3`'ü (`e`, `h`) ve en üst sırada bir W domino (`j`) durur. Kırmızı `C3`'ler 2–3. kata hiç uymaz (2–3. katın kırmızısı yalnız `L4_180` biçimindedir: `i`, `l`); plan tuzağı 0 olduğundan 1. kat ancak onlar yerleşince biter ve kat bitince paletin yolu açıktır: 2. katın ilk bloğu paletin üst katmanıdır (yerleştiren vekil, ε 0: 1. katı bitiren oyunların %98,4'ünde üst katman tutulabilir). Aynı renk iki şekle bölünür: kırmızı `C3` = 1. kat, kırmızı `L4` = 2–3. kat (şekil okuma kararı). Dört Y katman 2. ve 3. katın Y karelerine gider; katmanı sahaya bırakmak iptaldir (hamle yanmaz), bilgi kartı `card.y10.site`. Bonus `D2_0` W (`q`) sahanın dibinde, kırmızı `L4` `i`'nin çıkıntısının altında; 2–3. katın W'sidir ve ilk palet katmanından sonra yerleşir (ε 0,1 oyunların %98,7'si; "+2", D-105). D2 ×9, C3 ×4, L4 ×2, O4 ×4 = 19 blok (Σ 54, ayak izi 42); `min` 20 kanıtlı (alt sınıra eşit).

```
       x: 0 1 2 3 4 5   D   6 7 8
   y=9:  · · · · · ·   :   · · ·
   y=8:  · · · · · ·   :   · · ·  ← Vinç Alanı
   y=7:  . j a a b c   :   · · ·
   y=6:  . j a b b c   #   · · ·
   y=5:  e . d d f g   #   R R W
   y=4:  e e i i f g   #   R W W
   y=3:  h h . i l l   #   R W W
   y=2:  h . . i k l   #   R R W
   y=1:  p p q r k l   #   R R Y
   y=0:  p p q r s s   #   R Y Y
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `C3_90` | R | (2,6) | 1. kat, kanonik 3. hamle |
| `b` | `C3_270` | Y | (3,6) | 1. kat, kanonik 2. hamle |
| `c` | `D2_0` | W | (5,6) | 1. kat, kanonik 4. hamle |
| `d` | `D2_90` | W | (2,5) | 2. kat, kanonik 13. hamle |
| `e` | `C3_0` | R | (0,4) | 1. kat, kanonik 6. hamle |
| `f` | `D2_0` | W | (4,4) | 1. kat, kanonik 7. hamle |
| `g` | `D2_0` | W | (5,4) | 3. kat, kanonik 17. hamle |
| `h` | `C3_90` | R | (0,2) | 1. kat, kanonik 8. hamle |
| `i` | `L4_180` | R | (2,2) | 2. kat, kanonik 10. hamle |
| `j` | `D2_0` | W | (1,6) | 1. kat, kanonik 5. hamle |
| `k` | `D2_0` | W | (4,1) | 2. kat, kanonik 14. hamle |
| `l` | `L4_180` | R | (4,1) | 3. kat, kanonik 18. hamle |
| `m` | `O4_0` | Y | (0,0) | palet 0 katman z 0; 3. kat, kanonik 16. hamle |
| `n` | `O4_0` | Y | (0,0) | palet 0 katman z 1; 3. kat, kanonik 15. hamle |
| `o` | `O4_0` | Y | (0,0) | palet 0 katman z 2; 2. kat, kanonik 11. hamle |
| `p` | `O4_0` | Y | (0,0) | palet 0 katman z 3 (üst); 2. kat, kanonik 9. hamle |
| `q` | `D2_0` | W | (2,0) | bonus +2; 3. kat, kanonik 19. hamle |
| `r` | `D2_0` | W | (3,0) | 2. kat, kanonik 12. hamle |
| `s` | `D2_90` | W | (4,0) | 3. kat, kanonik 20. hamle |

Kanonik çözüm (solver, K-50 madde 4):
1. `c` (D2_0 W) (5,6) → (0,6) — **kaydırma** (park)
2. `b` (C3_270 Y) (3,6) → (7,0) — duvar üstü, doğru
3. `a` (C3_90 R) (2,6) → (6,0) — duvar üstü, doğru
4. `c` (D2_0 W) (0,6) → (8,2) — duvar üstü, doğru
5. `j` (D2_0 W) (1,6) → (8,4) — duvar üstü, doğru
6. `e` (C3_0 R) (0,4) → (6,2) — duvar üstü, doğru
7. `f` (D2_0 W) (4,4) → (7,3) — duvar üstü, doğru
8. `h` (C3_90 R) (0,2) → (6,4) — duvar üstü, doğru; 1. kat biter
9. `p` (O4_0 Y) (0,0) → (6,0) — duvar üstü, doğru
10. `i` (L4_180 R) (2,2) → (7,0) — duvar üstü, doğru
11. `o` (O4_0 Y) (0,0) → (7,3) — duvar üstü, doğru
12. `r` (D2_0 W) (3,0) → (6,2) — duvar üstü, doğru
13. `d` (D2_90 W) (2,5) → (7,5) — duvar üstü, doğru
14. `k` (D2_0 W) (4,1) → (6,4) — duvar üstü, doğru; 2. kat biter
15. `n` (O4_0 Y) (0,0) → (6,0) — duvar üstü, doğru
16. `m` (O4_0 Y) (0,0) → (6,2) — duvar üstü, doğru
17. `g` (D2_0 W) (5,4) → (8,0) — duvar üstü, doğru
18. `l` (L4_180 R) (4,1) → (7,2) — duvar üstü, doğru
19. `q` (D2_0 W) (2,0) → (6,4) — duvar üstü, doğru
20. `s` (D2_90 W) (4,0) → (7,5) — duvar üstü, doğru; 3. kat biter

Öğretici:
1. `startOn: { event: segmentDone, count: 1 }` · `piece:15` · tap · `tut.m.pallet` · `{ event: overWall, count: 1 }` (1. kat bitince açılır; el palet üst katmanına (`p`, z 3) dokunur; bir blok duvarı aşınca biter)
2. `piece:15` · — · `tut.m.palletsite` · `{ event: placementCorrect, count: 1, piece: 'piece:15' }` (üst katman şantiyede doğru yerleşince biter)

### Bölüm 8 — Paketli Kat (Wrapped Floor)

| Alan | Değer |
|---|---|
| Öğretilen | **Y11 Sargılı Blok + Makas** (`teaches: "Y11"`) |
| Zorluk / hedef kazanma | Normal (tanıtım) / %80–90 (Normal tanıtım; ileri bakış vekili, ε 0,1, 400 oyun) |
| Boyut (K-49) | `yard { cols 6, rows 8 }`, `site { cols 3, rows 4 }` → H = 8, Vinç Alanı y = 8–9 |
| Duvar | `height 7`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Kat 1 (EN: Floor 1) `["YYW", "GGG", "GYY", "GGG"]` · 2. Kat 2 (EN: Floor 2) `["WWW", "YWW", "YGW", "GGW"]` · 3. Kat 3 (EN: Floor 3) `["WYY", "WWY", "WYY", "WWY"]` · 4. Kat 4 (EN: Floor 4) `["WYY", "WWW", "YYG", "GGG"]` |
| Renkler / şekiller | G, W, Y (3) / C3, D2, I3, L4 |
| Saha | C = 48, F = 48 (Σ, bütün palet katmanları dahil; K-58 madde 5 ayak izi 42), E = 6 (ayak izine göre; K-02) |
| Ölçütler (solver) | N 18 · min 20 · alt sınır 19 · YAO 18/18 · liftRatio 1 · plan_trap 0 · vekil (ileri bakış, ε 0,1, 400 oyun) 0,87 [0,83–0,9] · yerleştiren vekil 0,28 / 0,45 · 10 000 yürüyüş: kazanılan 9506, kurtarılan 0, yakalanmayan çıkmaz 1 (tahmin) |
| Hamle (K-52, D-099) | 20 + P 6 = **26** |

**Tasarım niyeti:** **v3c3 (Fl, CL-V3C2-04).** Makas `D2_90` Y (`e`) sahanın sol ortasında, `d` ve `c`'nin altında (1 kazı); 1. katın Y çiftine oturur (kanonik 6. hamle, 1. katı bitirir). Oturunca iki paket birden açılır: `C3_270` G (`h`) ve yatay `I3_90` W kiriş (`j`), ikisi de 2. katın malzemesidir; makas yerleşmeden onlara yol yoktur. Aynı Y çifti yuvasına başka `D2_90` Y'ler de uyar: makası ilk yuvaya koymak oyuncunun kararıdır. Palet `C3_0` W ×3 (`p`–`r`) sağ altta, katmanları 3–4. katın W köşeleri. Dörtlü `L4_180` W (`m`) 2. kat; üç yatay `I3_90` (`b`, `j`, `l`) ve iki renkli ikizler (`c`, `k` GW). 18 blok, dört aile (D2, C3, I3, L4; Σ 48, ayak izi 42); `min` 20 (alt sınır 19), hamle 26 = 20 + P 4 + `a` 2.

```
       x: 0 1 2 3 4 5   D   6 7 8
   y=9:  · · · · · ·   :   · · ·
   y=8:  · · · · · ·   :   · · ·  ← Vinç Alanı
   y=7:  . . . a a .   :   · · ·
   y=6:  . . c b b b   #   · · ·
   y=5:  d d c f f g   #   · · ·
   y=4:  d e e h f g   #   · · ·
   y=3:  i i h h m m   #   Y Y W
   y=2:  k i j j j m   #   G G G
   y=1:  k l l l r m   #   G Y Y
   y=0:  n n o o r r   #   G G G
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_90` | Y | (3,7) | 1. kat, kanonik 3. hamle |
| `b` | `I3_90` | G | (3,6) | 1. kat, kanonik 2. hamle |
| `c` | `D2_0` | G | (2,5) | iki renkli "GW"; 1. kat, kanonik 5. hamle |
| `d` | `C3_90` | G | (0,4) | 1. kat, kanonik 4. hamle |
| `e` | `D2_90` | Y | (1,4) | makaslı; 1. kat, kanonik 6. hamle |
| `f` | `C3_180` | Y | (3,4) | 3. kat, kanonik 13. hamle |
| `g` | `D2_0` | Y | (5,4) | 2. kat, kanonik 9. hamle |
| `h` | `C3_270` | G | (2,3) | sargılı; 2. kat, kanonik 8. hamle |
| `i` | `C3_180` | Y | (0,2) | 3. kat, kanonik 15. hamle |
| `j` | `I3_90` | W | (2,2) | sargılı; 2. kat, kanonik 11. hamle |
| `k` | `D2_0` | G | (0,1) | iki renkli "GW"; 4. kat, kanonik 19. hamle |
| `l` | `I3_90` | G | (1,1) | 4. kat, kanonik 16. hamle |
| `m` | `L4_180` | W | (4,1) | 2. kat, kanonik 10. hamle |
| `n` | `D2_90` | Y | (0,0) | 4. kat, kanonik 20. hamle |
| `o` | `D2_90` | Y | (2,0) | 4. kat, kanonik 17. hamle |
| `p` | `C3_0` | W | (4,0) | palet 0 katman z 0; 4. kat, kanonik 18. hamle |
| `q` | `C3_0` | W | (4,0) | palet 0 katman z 1; 3. kat, kanonik 14. hamle |
| `r` | `C3_0` | W | (4,0) | palet 0 katman z 2 (üst); 3. kat, kanonik 12. hamle |

Kanonik çözüm (solver, K-50 madde 4):
1. `a` (D2_90 Y) (3,7) → (0,6) — **kaydırma** (park)
2. `b` (I3_90 G) (3,6) → (6,0) — duvar üstü, doğru
3. `a` (D2_90 Y) (0,6) → (7,1) — duvar üstü, doğru
4. `d` (C3_90 G) (0,4) → (6,1) — duvar üstü, doğru
5. `c` (D2_0 G) (2,5) → (8,2) — duvar üstü, doğru
6. `e` (D2_90 Y) (1,4) → (6,3) — duvar üstü, doğru; 1. kat biter
7. `f` (C3_180 Y) (3,4) → (0,5) — **kaydırma** (park)
8. `h` (C3_270 G) (2,3) → (6,0) — duvar üstü, doğru
9. `g` (D2_0 Y) (5,4) → (6,1) — duvar üstü, doğru
10. `m` (L4_180 W) (4,1) → (7,0) — duvar üstü, doğru
11. `j` (I3_90 W) (2,2) → (6,3) — duvar üstü, doğru; 2. kat biter
12. `r` (C3_0 W) (4,0) → (6,0) — duvar üstü, doğru
13. `f` (C3_180 Y) (0,5) → (7,0) — duvar üstü, doğru
14. `q` (C3_0 W) (4,0) → (6,2) — duvar üstü, doğru
15. `i` (C3_180 Y) (0,2) → (7,2) — duvar üstü, doğru; 3. kat biter
16. `l` (I3_90 G) (1,1) → (6,0) — duvar üstü, doğru
17. `o` (D2_90 Y) (2,0) → (6,1) — duvar üstü, doğru
18. `p` (C3_0 W) (4,0) → (6,2) — duvar üstü, doğru
19. `k` (D2_0 G) (0,1) → (8,1) — duvar üstü, doğru
20. `n` (D2_90 Y) (0,0) → (7,3) — duvar üstü, doğru; 4. kat biter

Öğretici:
1. `piece:4` · — · `tut.m.wrap` · `{ event: placementCorrect, count: 1, piece: 'piece:4' }` (makaslı blok `e`; doğru yerleşince biter)

### Bölüm 9 — Kaygan Çatı (Slippery Roof)

| Alan | Değer |
|---|---|
| Öğretilen | **Y13 Kaygan Blok** (`teaches: "Y13"`) |
| Zorluk / hedef kazanma | Normal (tanıtım) / %80–90 (Normal tanıtım; ileri bakış vekili, ε 0,1, 400 oyun) |
| Boyut (K-49) | `yard { cols 6, rows 8 }`, `site { cols 3, rows 4 }` → H = 8, Vinç Alanı y = 8–9 |
| Duvar | `height 7`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Kat 1 (EN: Floor 1) `["YYG", "GGG", "GWY", "GWW"]` · 2. Kat 2 (EN: Floor 2) `["WYY", "WGY", "GGY", "YYY"]` · 3. Kat 3 (EN: Floor 3) `["YYG", "YGG", "YYG", "YGG"]` · 4. Kat 4 (EN: Floor 4) `["GGG", "WYW", "WGW", "GGW"]` |
| Renkler / şekiller | G, W, Y (3) / C3, D2, I3, L4 |
| Saha | C = 48, F = 48 (Σ, bütün palet katmanları dahil; K-58 madde 5 ayak izi 42), E = 6 (ayak izine göre; K-02) |
| Ölçütler (solver) | N 18 · min 20 · alt sınır 19 · YAO 18/18 · liftRatio 1 · plan_trap 0 · vekil (ileri bakış, ε 0,1, 400 oyun) 0,83 [0,79–0,86] · yerleştiren vekil 0,21 / 0,38 · 10 000 yürüyüş: kazanılan 7823, kurtarılan 0, yakalanmayan çıkmaz 1 (tahmin) |
| Hamle (K-52, D-099) | 20 + P 5 = **25** |

**Tasarım niyeti:** **v3c3 (Fl, CL-V3C2-04).** İlk kaygan `D2_0` W (`c`) üstteki Y dominonun (`a`) altında; kazıdan sonra 1. katın ilk yerleşimidir (kanonik 2. hamle). İkinci kaygan `D2_0` W (`j`) sağ kenarda `h`'nin altında, 4. katta gerekir. Kaygan blok desteğinin üstünde durur; altı boşalırsa kayar ve boşluğu doldurur. Palet `C3_270` G ×3 (`o`–`q`) altta (1,0); dörtlü `L4_270` Y (`d`) sağ üstte, 2. katın tabanı. İki renkli ikizler (`e` WY, `m` YW). 18 blok, dört aile (D2, C3, I3, L4; Σ 48, ayak izi 42); `min` 20 (alt sınır 19), hamle 25 = 20 + P 4 + `a` 1.

```
       x: 0 1 2 3 4 5   D   6 7 8
   y=9:  · · · · · ·   :   · · ·
   y=8:  · · · · · ·   :   · · ·  ← Vinç Alanı
   y=7:  . b a a . .   :   · · ·
   y=6:  b b c . . d   #   · · ·
   y=5:  e . c d d d   #   · · ·
   y=4:  e f i g h h   #   · · ·
   y=3:  f f i g h j   #   Y Y G
   y=2:  k k i l l j   #   G G G
   y=1:  n k q l m m   #   G W Y
   y=0:  n q q r r r   #   G W W
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_90` | Y | (2,7) | 1. kat, kanonik 7. hamle |
| `b` | `C3_270` | G | (0,6) | 1. kat, kanonik 6. hamle |
| `c` | `D2_0` | W | (2,5) | kaygan; 1. kat, kanonik 2. hamle |
| `d` | `L4_270` | Y | (3,5) | 2. kat, kanonik 8. hamle |
| `e` | `D2_0` | W | (0,4) | iki renkli "WY"; 1. kat, kanonik 5. hamle |
| `f` | `C3_270` | G | (0,3) | 2. kat, kanonik 9. hamle |
| `g` | `D2_0` | W | (3,3) | 2. kat, kanonik 11. hamle |
| `h` | `C3_90` | Y | (4,3) | 3. kat, kanonik 13. hamle |
| `i` | `I3_0` | G | (2,2) | 1. kat, kanonik 3. hamle |
| `j` | `D2_0` | W | (5,2) | kaygan; 4. kat, kanonik 17. hamle |
| `k` | `C3_180` | Y | (0,1) | 2. kat, kanonik 10. hamle |
| `l` | `C3_90` | Y | (3,1) | 3. kat, kanonik 15. hamle |
| `m` | `D2_90` | Y | (4,1) | iki renkli "YW"; 4. kat, kanonik 18. hamle |
| `n` | `D2_0` | W | (0,0) | 4. kat, kanonik 19. hamle |
| `o` | `C3_270` | G | (1,0) | palet 0 katman z 0; 4. kat, kanonik 16. hamle |
| `p` | `C3_270` | G | (1,0) | palet 0 katman z 1; 3. kat, kanonik 14. hamle |
| `q` | `C3_270` | G | (1,0) | palet 0 katman z 2 (üst); 3. kat, kanonik 12. hamle |
| `r` | `I3_90` | G | (3,0) | 4. kat, kanonik 20. hamle |

Kanonik çözüm (solver, K-50 madde 4):
1. `a` (D2_90 Y) (2,7) → (3,6) — **kaydırma** (park)
2. `c` (D2_0 W) (2,5) → (7,0) — duvar üstü, doğru
3. `i` (I3_0 G) (2,2) → (6,0) — duvar üstü, doğru
4. `b` (C3_270 G) (0,6) → (1,5) — **kaydırma** (park)
5. `e` (D2_0 W) (0,4) → (8,0) — duvar üstü, doğru
6. `b` (C3_270 G) (1,5) → (7,2) — duvar üstü, doğru
7. `a` (D2_90 Y) (3,6) → (6,3) — duvar üstü, doğru; 1. kat biter
8. `d` (L4_270 Y) (3,5) → (6,0) — duvar üstü, doğru
9. `f` (C3_270 G) (0,3) → (6,1) — duvar üstü, doğru
10. `k` (C3_180 Y) (0,1) → (7,2) — duvar üstü, doğru
11. `g` (D2_0 W) (3,3) → (6,2) — duvar üstü, doğru; 2. kat biter
12. `q` (C3_270 G) (1,0) → (7,0) — duvar üstü, doğru
13. `h` (C3_90 Y) (4,3) → (6,0) — duvar üstü, doğru
14. `p` (C3_270 G) (1,0) → (7,2) — duvar üstü, doğru
15. `l` (C3_90 Y) (3,1) → (6,2) — duvar üstü, doğru; 3. kat biter
16. `o` (C3_270 G) (1,0) → (6,0) — duvar üstü, doğru
17. `j` (D2_0 W) (5,2) → (8,0) — duvar üstü, doğru
18. `m` (D2_90 Y) (4,1) → (7,2) — duvar üstü, doğru
19. `n` (D2_0 W) (0,0) → (6,1) — duvar üstü, doğru
20. `r` (I3_90 G) (3,0) → (6,3) — duvar üstü, doğru; 4. kat biter

Öğretici:
1. `piece:2` · — · `tut.m.slippery` · `{ event: placementCorrect, count: 1, piece: 'piece:2' }` (ilk gereken kaygan blok `c`; doğru yerleşince biter)

### Bölüm 10 — Ağaç Ev Tamam! (Treehouse Done!)

| Alan | Değer |
|---|---|
| Öğretilen | — (final kombinasyon; yeni fikir yok) |
| Zorluk / hedef kazanma | Zor / %50–60 (Zor; ileri bakış vekili, ε 0,1, 400 oyun) |
| Boyut (K-49) | `yard { cols 6, rows 8 }`, `site { cols 3, rows 6 }` → H = 8, Vinç Alanı y = 8–9 |
| Duvar | `height 6`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Kat 1 (EN: Floor 1) `["GWW", "GGW", "YGG", "YWG", "WWY", "WWY"]` · 2. Kat 2 (EN: Floor 2) `["YWG", "WGG", "WGG", "WWG", "WYY", "WWY"]` · 3. Kat 3 (EN: Floor 3) `["GGG", "YYG", "YWG", "WWW", "WWY", "YYY"]` |
| Renkler / şekiller | G, W, Y (3) / C3, D2, I3, L4 |
| Saha | C = 48, F = 54 (Σ, bütün palet katmanları dahil; K-58 madde 5 ayak izi 45), E = 3 (ayak izine göre; K-02) |
| Ölçütler (solver) | N 20 · min 21 · alt sınır 21 · YAO 20/20 · liftRatio 0,85 · plan_trap 0 · vekil (ileri bakış, ε 0,1, 400 oyun) 0,54 [0,49–0,59] · yerleştiren vekil 0,45 / 0,54 · 10 000 yürüyüş: kazanılan 6465, kurtarılan 0, yakalanmayan çıkmaz 0 (tahmin) |
| Hamle (K-52, D-099) | 21 + P 3 = **24** |

**Tasarım niyeti:** Makas `D2_0` G (`j`) sağ sütunda bir kapağın (`d`) altında; oturunca alttaki `I3_90` G tabanı (`p`) ve ortadaki `D2_0` G (`m`) paketlerinden çıkar. Kaygan `D2_0` G (`k`) sol sütunda bir dominonun üstünde; altını boşaltmadan önce yerleştir. Dört katmanlı palet `C3_0` W (`q`–`t`) sağ altta, son katların W köşeleri. Üç iki renkli C3 (`c`, `d` YWY; `g` WYW) ve düz `L4_270` Y. Bonus yok (D-107). `min` 21 kanıtlı (alt sınır 21), hamle 24 = 21 + P 1 + `a` 2.

```
       x: 0 1 2 3 4 5   D   6 7 8
   y=9:  · · · · · ·   :   · · ·
   y=8:  · · · · · ·   :   · · ·  ← Vinç Alanı
   y=7:  a b b . c c   :   · · ·
   y=6:  a a b . d c   :   · · ·
   y=5:  e f g g d d   #   G W W
   y=4:  e f g h i j   #   G G W
   y=3:  k h h h i j   #   Y G G
   y=2:  k l l m n n   #   Y W G
   y=1:  o l . m t n   #   W W Y
   y=0:  o p p p t t   #   W W Y
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `C3_0` | W | (0,6) | 1. kat, kanonik 2. hamle |
| `b` | `C3_180` | Y | (1,6) | 2. kat, kanonik 10. hamle |
| `c` | `C3_180` | Y | (4,6) | iki renkli "YWY"; 1. kat, kanonik 3. hamle |
| `d` | `C3_0` | Y | (4,5) | iki renkli "YWY"; 1. kat, kanonik 4. hamle |
| `e` | `D2_0` | G | (0,4) | 1. kat, kanonik 8. hamle |
| `f` | `D2_0` | G | (1,4) | 2. kat, kanonik 13. hamle |
| `g` | `C3_90` | W | (2,4) | iki renkli "WYW"; 2. kat, kanonik 14. hamle |
| `h` | `L4_270` | Y | (1,3) | 3. kat, kanonik 16. hamle |
| `i` | `D2_0` | G | (4,3) | 1. kat, kanonik 5. hamle |
| `j` | `D2_0` | G | (5,3) | makaslı; 1. kat, kanonik 6. hamle |
| `k` | `D2_0` | G | (0,2) | kaygan; 2. kat, kanonik 12. hamle |
| `l` | `C3_90` | Y | (1,1) | 3. kat, kanonik 19. hamle |
| `m` | `D2_0` | G | (3,1) | sargılı; 3. kat, kanonik 20. hamle |
| `n` | `C3_180` | W | (4,1) | 1. kat, kanonik 7. hamle |
| `o` | `D2_0` | G | (0,0) | 2. kat, kanonik 15. hamle |
| `p` | `I3_90` | G | (1,0) | sargılı; 3. kat, kanonik 21. hamle |
| `q` | `C3_0` | W | (4,0) | palet 0 katman z 0; 3. kat, kanonik 18. hamle |
| `r` | `C3_0` | W | (4,0) | palet 0 katman z 1; 3. kat, kanonik 17. hamle |
| `s` | `C3_0` | W | (4,0) | palet 0 katman z 2; 2. kat, kanonik 11. hamle |
| `t` | `C3_0` | W | (4,0) | palet 0 katman z 3 (üst); 2. kat, kanonik 9. hamle |

Kanonik çözüm (solver, K-50 madde 4):
1. `b` (C3_180 Y) (1,6) → (2,6) — **kaydırma** (park)
2. `a` (C3_0 W) (0,6) → (6,0) — duvar üstü, doğru
3. `c` (C3_180 Y) (4,6) → (7,0) — duvar üstü, doğru
4. `d` (C3_0 Y) (4,5) → (6,2) — duvar üstü, doğru
5. `i` (D2_0 G) (4,3) → (7,3) — duvar üstü, doğru
6. `j` (D2_0 G) (5,3) → (8,2) — duvar üstü, doğru
7. `n` (C3_180 W) (4,1) → (7,4) — duvar üstü, doğru
8. `e` (D2_0 G) (0,4) → (6,4) — duvar üstü, doğru; 1. kat biter
9. `t` (C3_0 W) (4,0) → (6,0) — duvar üstü, doğru
10. `b` (C3_180 Y) (2,6) → (7,0) — duvar üstü, doğru
11. `s` (C3_0 W) (4,0) → (6,2) — duvar üstü, doğru
12. `k` (D2_0 G) (0,2) → (7,3) — duvar üstü, doğru
13. `f` (D2_0 G) (1,4) → (8,2) — duvar üstü, doğru
14. `g` (C3_90 W) (2,4) → (6,4) — duvar üstü, doğru
15. `o` (D2_0 G) (0,0) → (8,4) — duvar üstü, doğru; 2. kat biter
16. `h` (L4_270 Y) (1,3) → (6,0) — duvar üstü, doğru
17. `r` (C3_0 W) (4,0) → (6,1) — duvar üstü, doğru
18. `q` (C3_0 W) (4,0) → (7,2) — duvar üstü, doğru
19. `l` (C3_90 Y) (1,1) → (6,3) — duvar üstü, doğru
20. `m` (D2_0 G) (3,1) → (8,3) — duvar üstü, doğru
21. `p` (I3_90 G) (1,0) → (6,5) — duvar üstü, doğru; 3. kat biter

Öğretici:
1. `startOn: { event: segmentDone }` · `booster:crane` · tap · `tut.m.cranebooster` · `{ event: boosterUsed, count: 1 }` (1. kat bitince; Vinç açılışı (META §4))

### 2.11 Solver doğrulaması (D-099 bölüm turu, A2, 2026-11-02)

**Komutlar ve sonuç:** `npm run levels:validate` (i18n dahil) 10/10 geçerli, 0 hata, 0 uyarı; `npm run levels:check`
(validate + `levels:solve`, önbelleksiz, varyantlar dahil) 10/10 `solved`, 0 hata, 0 uyarı; bütün kanonik çözümler
çekirdekte yeniden oynatıldı (`replay ok`), bütün eldiven yolları geçerli (L-35); bütün bölümlerde `complete` evet,
`undetectedDead` 0, D1 durumu 0 (K-51 madde 7–8). Golden kayıtlar `npm run levels:solve -- --update-golden` ile yeniden
üretildi. Bot adımı (WP-N) yok; `a = 0`. Bölüm başına ölçütlerin hedef–gerçek karşılaştırması §6.10'dadır.

| # | N | min | s | d | trap | YAO | moves (K-52 bandı) | varyant | ahaMin | greedyWin | greedyExcess | durum |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 6 | 6 | 0 | 0 | 0 | 6/6 | 10 (10–12) | – | 0 | 1 | 0 | 21 125 |
| 2 | 6 | 6 | 0 | 0 | 0 | 6/6 | 10 (10–12) | – | 0 | 1 | 0 | 13 797 |
| 3 | 7 | 8 | 1 | 1 | 0 | 7/7 | 12 (12–14) | – | 0 | 1 | 0 | 77 757 |
| 4 | 8 | 9 | 1 | 1 | 0 | 7/8 | 13 (13–15) | geçitsiz 10 | 0 | 1 | 0 | 220 746 |
| 5 | 8 | 11 | 3 | 2 | 0 | 8/8 | 13 (13–15) | – | 1 | 1 | 1 | 745 442 |
| 6 | 7 | 9 | 2 | 1 | 0 | 7/7 | 13 (13–15) | – | 0 | 1 | 0 | 31 270 |
| 7 | 7 | 11 | 4 | 1 | 0 | 7/7 | 13 (13–15) | – | 2 | 1 | 2 | 133 422 |
| 8 | 7 | 10 | 3 | 3 | 0 | 7/7 | 14 (14–16) | Çekiç'le 8 | 0 | 1 | 0 | 446 663 |
| 9 | 7 | 12 | 5 | 2 | 0 | 6/7 | 16 (16–18) | geçitsiz 14 | 2 | 1 | 3 | 72 477 |
| 10 | 7 | 13 | 6 | 5 | 0 | 7/7 | 14 (14–16) | – | 1 | 0 | 2 | 121 022 |

**Yöntem (brif ilkesi 6):** her bölüm için plan (renk deseni, iki kat) → ASCII gri kutu → JSON → `levels:solve` →
hamle ayarı sırası izlendi. Adaylar üç kaynaktan geldi: `npm run levels:gen` (Bölüm 2 ve 6 adayları, aday 1 ve 3),
oturum karalama aracıyla rastgele arama ve tepe tırmanma (aynı solver modülleri; Bölüm 4, 5, 7, 8, 9, 10) ve elle
kurulum (Bölüm 1, 3). Her aday resmî solver'la ölçüldü; seçim ve ince ayar (renkler, katlar, öğretici, `targets`)
elle yapıldı. Faz 2R'nin 4×4–6×5 sahaları yerine D-099'da sahalar 20–30 hücredir: bugünkü tam tarama 6 genişlikte 8–9
blokta 0,5–2 M durumu aştığı için (§6.8) bölümler 5×4, 4×5 ve (yüklü) 6×5'te kuruldu; en büyük uzay 745 442 durumdur
(Bölüm 5), toplam `levels:solve` 4 işçiyle ≈ 45 sn.

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
3. **Hamleler (K-52, solver).** 1–10: 11, 9, 11, 13, 17, 13, 17, 14, 13, 18 (Faz 2R taslağı: 11, 9, 11, 12, 17, 13, 15,
   14, 13, 16; Faz 1: 11, 11, 11, 12, 11, 11, 12, 12, 13, 14). Kazı hamleleri minimumu artırdı; tampon orantılıdır;
   tanıtım bölümleri (5, 6, 8, 9) bir alt zorluğun tamponunu alır (DL-2R-05). Bot ölçümünden sonra `a` ayarı yapılır.
4. **Renk R'nin ilk kullanımı Bölüm 5** (brif: 4). Bölüm 4'ün 3 rengi G/W/Y'dir; açılış "en erken" anlamındadır.
5. **Bölüm 10'da geçit yoktur** (brif: "yüksek duvar + pencere + dar geçit + ağır malzeme"). Dar geçitli final taslakları
   karalama çözücüsünde ya geçidi kullanmadı (ray kazançsız) ya da 8–9 kazı istedi (Zor için fazla); final yüksek duvar +
   Ağır Yük + iki dilim + kamyon ile kuruldu. Pencere (S2) MVP dışı. **Solver turu:** taslaktaki bilinçli kamyon kuyruğu
   (E-54) kaldırıldı; Söküm'süz erişim çıkmazları üretiyordu (§2.11).
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
      yalnız bilinçliyse (`batch_queued` uyarısı, bölüm notu ve `tools/levels-allow.json` girişi; Faz 2R 1–10'da yok).
- [ ] **Teslimat adaleti (§2.0 madde 9, GDD K-51 madde 5):** her dilim geçişinde önsezi kazancı 0 ve fark 0; ilk
      gereken bloğun gömülmesi parti sırasından gelir, oyuncunun önceki dilimi nasıl bitirdiğinden değil.
- [ ] **Söküm'süz çıkmaz yok (§2.0 madde 10, GDD K-51 madde 2):** D3b tablosu yokken bütün keşif uzayında D1/D2/D3a'nın
      yakalamadığı çıkmaz durum yok (solver notu "whole space … dead state(s)" çıkmaz).
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
- [ ] Resmî solver (`npm run levels:check`) 0 hata, 0 uyarı; LEVELS §2 ASCII, kanonik çözüm, ölçüt ve hamleleri solver
      çıktısıyla aynı; karalama çözücüsüyle fark varsa solver esastır ve taslak yinelenir (§0 doğrulama notu).

---

## 6. Bulmaca zekâsı şartnamesi (D-099, sabit saha)

Sahip: product-lead · 2026-11-01 · Kaynak: proje sahibinin isteği ("ilk tahtaya yeni brick ekleme; yandaki ekran geçse de
ilk tahtanın puzzle'ını daha fazla düşün"), orkestratör kararı D-099, GDD K-55 (sabit saha), K-50 madde 11–19, K-51 madde
6–9, K-52 D-099 bütçesi. Bu bölüm `schemaVersion` 2 içeriğinin tasarım sözleşmesidir; §1–§2 Faz 2R (`schemaVersion` 1)
verisini anlatmaya devam eder ve D2 paketinde JSON'larla aynı commit'te bu bölüme göre yenilenir.

### 6.0 Değişen bulmaca

Faz 2R'de her dilimin malzemesi kamyonla geliyordu; bulmaca "gereken bloğu bul, önünü aç" düzeyindeydi: §2.0 madde 11'deki
kazıcı vekil 1–10'un hepsini en kısa yoldan kazanıyordu (açgözlü oyun en iyi oyundu). D-099'da bölümün **bütün katları
tek sahada, ilk andan** durur. Bulmaca artık şudur: (1) hangi bloğun hangi kata gideceğine karar vermek (blok dilime bağlı
değildir, GDD K-55 madde 4); (2) sonraki katın bloklarını bu katın yolundan, sonraki katın da yolunu kapatmayacak yere
park etmek; (3) park yeri yoksa önce bir yerleşimle yer açmak; (4) bazen yerleşebilecek bir bloğu bekletmek. Bu kararlar
ölçülür (§6.2) ve her bölümde tek bir fikir öğretilir (§6.6).

**İlkeler (değişmez):** tam örtü ve tam kullanım (K-47, K-48); imza hareket YAO ≥ 0,60 (K-46); bilgi gizlenmez (bütün
katlar panoramada, bütün bloklar sahada görünür; gölge her zaman doğru, K-18); şansa bağlı hiçbir şey yok (teslimat yok,
yeniden dizme yok); bölüm başına en çok 1 yeni mekanik (K-45 madde 10); testere dişi (§0).

### 6.1 Bulmaca kaynakları (D-099 kataloğu)

Her kaynak bir ölçütü oynatır; bölümün "tek fikri" bu kaynaklardan biridir (§6.6 "Fikir" sütunu).

| Kod | Kaynak | Tanım (kodlanabilir) | Oynattığı ölçüt (GDD K-50) | İlk bölüm |
|---|---|---|---|---|
| T1 | Kat arası örtü | Sonraki katın bloğu (`seg` büyük) bu katın gereken bloğunun üstünde; önce park edilir | `depLater` ≥ 1, `carryShifts` ≥ 1 | 3 |
| T2 | Doğal açılış | Bu katın blokları sonraki katlarınkinin üstünde; kat bitince alttakiler açılır | `depEarlier` ≥ 1 | 1 |
| T3 | Park yeri seçimi | Kapak bloğun en az iki park yeri var; yalnız biri sonraki katın ilk bloğunu örtmez | `forced` ≥ 1 (park anında), `reparks` (yanlış cepte) | 5 |
| T4 | Takas (eşdeğer döşeme) | Aynı renk bölgesini farklı şekil kümeleri doldurur (`O4` X = iki `D2` X); açıkta duran "sonraki kat" bloklarını şimdi kullanmak gömülü olanı sonraya bırakır | `min` düşer, `depLater` düşer (K-50 madde 13 örneği) | 7 |
| T5 | Bekletme | Şimdi doğru yerleşebilen blok kenara alınır; altındaki önce gerekir | `ahaMin` ≥ 1 (`hold`) | 5 |
| T6 | Yer açmak için yerleştir | Park için yeterli boş hücre yok; önce bir yerleşim yer açar | `parkSlack` < 1 | 7 |
| T7 | Yükseğe park | Cebe ilk giren blok üstte kalmalı; alçağa konursa ikincisi sığmaz | `forced`, `greedyWin` düşer | 6 |
| T8 | Geçit kestirmesi | Derindeki blok geçitten yatay çıkar (W1, W3) | varyant `geçitsiz min − min` | 4 |
| T9 | Ağır Yük iki kez | Yük bir kat için bir yana, sonraki kat için öbür yana kayar (yalnız saha içinde, K-44) | `reparks` ≥ 1 (yük), varyant `min − Çekiç'le min` | 8 |
| T10 | Takas tuzağı | Açgözlü takas kalan katı döşenemez bırakır → D3a → Söküm (yalnız Zor/Çok Zor) | `trapCount`, `greedyTrap` | 10 |

**Tuzak kaynağı kuralı (§2.0 madde 4) D-099'da dilimler arasına genişler:** bir renk bölgesini dolduran şekil
kombinasyonları **bütün dilimlerdeki** aynı renkli bloklarla sayılır, çünkü her blok her dilimde kullanılabilir (K-55
madde 4). Kolay ve Normal'de bir takas (T4) yalnız **her ara durumda** kalan aynı renkli bloklar kalan bölgeleri
döşeyebiliyorsa kullanılır. Güvenli örüntü: bir renk için 2×2 bölgeler ve tek satırlık bölgeler, arzda `O4` X + yeterli
`D2_90` X; **2×2 bölge ile aynı renkten tek satır aynı dilimde birlikte bulunmaz** ya da o dilime kalan `D2_90` X sayısı
her yolda yeter. Karşı örnek (§6.8 P5, solver): dilim 2'de 2×2 Y bölgesi ile YY satırı birlikteydi; dilim 1 kendi 2×2
Y'sini iki `D2_90` Y ile doldurunca dilim 2'de kalan tek `D2_90` Y'yi 2×2 bölgenin tabanına koymak döşenemez bir durum
üretti (103 ✓-tuzağı geçişi; aynı taslağın W tarafı — dilim 2'de yalnız 2×2 W — güvenliydi). Solver her bölümde
`trapCount` 0 ve `greedyTrap` yok ile kanıtlar. Zor ve Çok Zor'da tek yollu takas T10'dur ve her tuzak Söküm'le kurtarılır
(§6.3).

**Yasak (her zorlukta):** şaşırtma blok (K-47); oyuncunun göremediği bilgiye dayanan en kısa çözüm (gelecek teslimat yoktur
ama gizli `?` hücresi Faz 3'te yalnız K-32 kuralıyla çözülür); hiçbir hamle dizisiyle kurtarılamayan çıkmaz (§6.3); her
ölçütü tek bir bloğun derinliğiyle şişirmek (`maxDigRun` sınırı, §6.2).

### 6.2 Ölçütler ve hedef aralıkları (zorluk başına)

Tanımlar GDD K-50'dedir (madde numarası "K-50/n"); solver hesaplar (§7 U-3). Bantlar **ilk tahmindir**: D2 paketinde
üretici + solver + orta bot ile kalibre edilir ve bölüm bazındaki son değerler §6.6 tablosuna, makine okunur kopyası JSON
`targets` alanına yazılır. Bir bölüm bandın dışındaysa `metric_out_of_band` (warn) ile product-lead'e döner.

| Ölçüt | Tanım | Ne ölçer | Kolay | Normal | Zor | Çok Zor |
|---|---|---|---|---|---|---|
| `min` | K-50/2 | en kısa çözüm (hamle) | 6–12 | 10–16 | 16–26 | 20–30 |
| YAO | K-46 | imza hareket (duvar üstü / bütün yerleşim) | ≥ 0,75 | ≥ 0,70 | ≥ 0,60 | ≥ 0,60 |
| `minShifts` | K-50/3 | toplam kazı ve park | 0–3 | 2–5 | 5–9 | 6–10 |
| `firstNeedDepth` | K-50/5 | açılış derinliği (ilk yerleşime kadar kaydırma) | 0–1 | 1–2 | 2–3 | 2–4 |
| `firstNeedCover` | K-50/6 | ilk gereken bloğun üstündeki parça sayısı | 0–1 | 1–2 | 1–3 | 2–3 |
| `maxCover` | K-50/11 | en derin gereken bloğun üstündeki parça sayısı | ≤ 2 | 2–3 | 3–4 | 3–5 |
| `maxDigRun` | K-50/12 | art arda en uzun kazı | ≤ 2 | ≤ 3 | ≤ 4 | ≤ 5 |
| `reparks` | K-50/12 | iki kez taşınan blok | 0 | 0–1 | 1–2 | ≥ 1 |
| `depLater` | K-50/13 | sonraki katın bloğu önceki katınkinin üstünde (çift) | 0–1 | 1–3 | 2–5 | 3–6 |
| `crossDeps` | K-50/13 | toplam kat arası örtü (çift) | ≥ 1 | ≥ 2 | ≥ 3 | ≥ 4 |
| `carryShifts` | K-50/13 | sonraki kat için park hamlesi | 0–1 | 1–2 | 2–4 | 2–5 |
| `parkSlack` | K-50/14 | boş hücre / en çok park hücresi (küçük = park baskısı) | park yok ya da ≥ 1,5 | 1,0–2,0 | 0,6–1,2 | 0,5–1,0 |
| `forced` | K-50/15 | tek doğru sıralı karar noktası | 0–2 | 2–4 | 4–7 | 5–9 |
| `trapCount` / `deadRate` | K-50/7–8 | ✓-tuzağı | 0 / 0 | 0 / 0 | 0–4 / ≤ 0,05 | 0–8 / ≤ 0,10 |
| `greedyTrap` | K-50/16 | açgözlünün ölü masaya düştüğü ilk hamle | yok | yok | yok ya da ≥ 4 | yok ya da ≥ 3 |
| `greedyExcess` | K-50/16 | en şanslı açgözlünün fazladan hamlesi | 0 | 0–2 | ≥ 2 ya da ∞ | ≥ 2 ya da ∞ |
| `greedyWin` | K-50/16 | rastgele açgözlünün bütçe içinde kazanma olasılığı | ≥ 0,80 | 0,30–0,70 (tanıtım 0,50–0,90) | 0,05–0,25 | ≤ 0,10 |
| `ahaMin` | K-50/17 | her en kısa çözümün istediği görünüşte ters hamle | 0 | 1–2 (tanıtım 0–1) | 2–3 | ≥ 3 |
| `branch3` | K-50/18 | ilk üç hamlede doğru bloğa dokunma oranı | ≥ 0,35 | 0,15–0,35 | 0,08–0,20 | ≤ 0,15 |
| `choices@0` | K-50/9 | açılışta oynanabilir seçenek | ≥ 3 | ≥ 4 | ≥ 5 | ≥ 5 |
| P (bütçe payı) | K-52 | `moves − min − a` | 4 | 2 | 1 | 1 |
| Kazanma (orta bot) | §0 | hedef bant | ≥ %90 | %65–80 (tanıtım %80–90) | %40–55 | %25–40 |
| `complete` | K-50/19 | çıkmazlık denetimi tam | evet | evet | evet | evet |

**Yorum kuralları:** (1) Normal ve üstünde zorluğu **önce** `ahaMin`, `greedyWin`, `forced`, `parkSlack` ve `depLater`
taşır; `minShifts` ve `maxCover` yalnız eşlik eder (derin ama tek yollu kazı sıkıcıdır, `maxDigRun` sınırı bu yüzden
var). (2) Tanıtım bölümünde yeni mekanik dışındaki ölçütler bir alt zorluğun bandına çekilir (`greedyWin`, `ahaMin`
tanıtım değerleri tabloda). (3) Nefes bölümü (§0, Zor/Çok Zor'dan sonraki) Normal bandının kolay ucundadır (`ahaMin` 1,
`greedyWin` 0,60–0,70). (4) Kolay/Normal'de `trapCount` 0, `deadRate` 0 ve `greedyTrap` yok zorunludur (K-51 madde 2, 6).

### 6.3 Ölü masa kapısı (D-090, GDD K-51 madde 7)

Kural (bütün zorluklar, `schemaVersion` 2): **geri alınamaz ölü durum yoktur.** Erişilebilir her çıkmaz durum ya hiç
oluşmaz ya da oluştuğu hamlenin 12. adımında D2/D3a (ya da bölümün D3b tablosu) tarafından bulunur ve Söküm oyuncuyu
**tek adımda** çıkmaz olmayan son duruma döndürür. Solver bunu bölüm başına kanıtlar: `complete` = evet,
`undetectedDead` = 0, D1 erişilemez (`d1_reachable` yok). Bir tuzağın bedeli yalnız harcanan hamledir (Söküm hamle iade
etmez) ve tuzak yalnız Zor/Çok Zor'da tasarlanır (T10). Kanıt verilemeyen bölüm (tarama bütçesi aşıldı, makro çizge
yöntemi uygulanamadı) yayına girmez: önce saha küçültülür (Hy, sonra N), sonra araç ölçeklenir (§7 U-4). Geri Al (K-39)
bu kapının parçası değildir.

### 6.4 Hamle bütçesi (GDD K-52, D-099 tablosu)

`moves = min + P + a`; P: Kolay 4, Normal 2, Zor 1, Çok Zor 1; tanıtım bölümünde P bir alt zorluktan (Normal tanıtım 4,
Zor tanıtım 2, Çok Zor tanıtım 1). `a` = orta bot ayarı, **0 ile** üst sınır arasında (Kolay/Normal max(2, ⌈0,15·min⌉),
Zor/Çok Zor max(1, ⌈0,10·min⌉)). Bot `a = 0`'da bandın üstündeyse bulmaca zorlaştırılır (bütçe kısılmaz); `a` üst
sınırında bandın altındaysa bulmaca kolaylaştırılır. Örnek: Bölüm 7 (Normal) `min` 15 → 17 … 20 (aMax 3); Bölüm 10 (Zor)
`min` 24 → 25 … 28 (aMax = max(1, ⌈2,4⌉) = 3).

### 6.5 Boyut ve geometri (K-49, K-02, K-55)

**Doluluk:** plan toplamı `Σ = S·Ws·Hs`, yük ve engel hücreleri `F₀` → `Σ + F₀ + 2 ≤ Wy·Hy ≤ ⌊(Σ + F₀) / 0,6⌋`
(K-02 bandının sabit sahadaki karşılığı). **Her blok kalkar** (Bölüm 1–5 ilkesi: duvar = saha tepesi, şantiye sahadan en
az 1 satır uzun): `Hs = Hy + 1`, duvar `height = Hy < H`; iki dilim için `4·(Hy + 1) ≤ Wy·Hy − 2` → Ws = 2'de yalnız
Wy = 6 (Hy 4–7) sağlar; üç dilim hiçbir Wy ≤ 6 ile sağlamaz. Bu yüzden üç katlı ve dar sahalı bölümler Yüksek Duvar (W2,
`height = H`, Bölüm 6'dan sonra) kullanır: her blok Vinç Alanı'na kalkar. **Yükseklik:** H ≤ 8, Hy ve Hs 4–8 (K-49).

| Düzen | Saha (C) | Σ (+ yük) | E | H / duvar | Not |
|---|---|---|---|---|---|
| S=2 · 2×5 | 6×4 (24) | 20 | 4 | 5 / 4 | her blok kalkar; Bölüm 1–5 |
| S=2 · 2×6 | 6×5 (30) | 24 | 6 | 6 / 5 | her blok kalkar; durum uzayı büyük (§6.8 P3) |
| S=2 · 2×5 | 4×6 (24) | 20 | 4 | 6 / 6 (W2) | dar ve yüksek; Bölüm 6, 9 |
| S=2 · 2×6 | 4×7 (28) | 24 | 4 | 7 / 7 (W2) | Bölüm 7 |
| S=2 · 2×4 + Q9 | 6×5 (30) | 16 + 9 | 5 | 5 / 5 (W2) | Bölüm 8 |
| S=3 · 2×4 | 5×6 (30) | 24 | 6 | 6 / 6 (W2) | üç kat, yüksüz |
| S=3 · 2×5 + Q9 | 6×8 (48) | 30 + 9 | 9 | 8 / 8 (W2) | varsayılan 6×8 saha; Bölüm 10 |

**Durum uzayı bütçesi:** bugünkü solver tam taramayı en çok 3 000 000 durumda keser (`DEFAULT_MAX_STATES`); 6 genişlikli
sabit sahada 8 blok sınırdadır, 10 blok aşar (§6.8). §7 U-4 gelene kadar 6 genişlikli bölümlerde N ≤ 8 tutulur; Bölüm 8 ve
10'un tam kanıtı U-4'e bağlıdır.

### 6.6 Bölüm 1–10 zorluk eğrisi (D-099)

Her bölüm **tek bir fikir** öğretir (§6.1 kodu); fikir ya bir veri imzası (OBSTACLES, `teaches`) ya da bir bulmaca
kaynağıdır. Bütün bölümler 2–3 dilimlidir (D-099: tek sahada birden çok kat). Zorluk etiketleri ve testere dişi §0–§1
ile aynıdır; Bölüm 5 artık tanıtım değildir (S1 imzası 2+ dilimle Bölüm 1'e geldi). Türetilen yeni mekanikler: 1 → S1,
4 → W1, 6 → W2, 8 → Y5, 9 → W3 (K-45 madde 10; OBSTACLES "Veri imzası" tablosundaki S1 ilk bölüm değeri D2 paketinde
koddaki `firstLevel` ile birlikte 5 → 1 olur, §7 U-2).

**Tablo A — yapı, fikir, geometri**

| # | Ad (TR / EN) | Zorluk | Tek fikir (öğretilen) | Kaynak | Yeni imza | Saha Wy×Hy | Şantiye Ws×Hs × S | H / duvar / geçit | E | Renkler | Şekiller | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Ağaç Basamakları / Tree Steps | Kolay (tanıtım) | Kaldır, duvarı aş, bırak; dikey ve yatay domino dama deseni kurar | T2 | S1 | 5×4 | 2×4 × 2 | 4 / 3 / — | 4 | W, Y | D2 | 8 |
| 2 | Köşe Destekleri / Corner Braces | Kolay | Yeni şekiller L ve J: çıkıntılı blok ancak altı dolunca oturur | T2 | — | 6×5 | 2×6 × 2 | 6 / 5 / — | 6 | G, W, Y | D2, J4, L4 | 8 |
| 3 | Köşe Taşları / Corner Stones | Kolay | `C3` köşe çifti iç içe oturur; ilk köşe bir kapak altında (kazı 2) | T1 | — | 6×4 | 2×5 × 2 | 5 / 4 / — | 4 | G, W, Y | C3, D2 | 8 |
| 4 | Ön Duvar / Front Wall | Kolay | Aynalı köşeler (`C3_0` / `C3_270` R, `C3_180` / `C3_90` Y); R ilk kez | T1 | — | 6×4 | 2×5 × 2 | 5 / 4 / — | 4 | R, W, Y | C3, D2 | 8 |
| 5 | Renkli Pencere / Two-Tone Window | Normal (tanıtım) | İki renkli blok: her hücre kendi rengine; `WY` ile `YW` aynalı ikiz | T5 | Y9 | 5×4 | 2×4 × 2 | 4 / 3 / — | 4 | G, W, Y | D2 | 8 |
| 6 | Uzun Gövde / Tall Trunk | Normal | T şekli: önce alt köşe (`C3_270`), sonra T, sonra üst köşe | T1 | — | 6×4 | 2×5 × 2 | 5 / 4 / — | 4 | G, W, Y | C3, D2, T4 | 8 |
| 7 | Paketli Malzeme / Wrapped Supplies | Normal (tanıtım) | Sargılı blok tutulamaz; makaslı blok doğru yerleşince bütün sargılar açılır | T1 | Y11 | 6×4 | 2×5 × 2 | 5 / 4 / — | 4 | G, R, Y | C3, D2 | 9 |
| 8 | İp Merdiven / Rope Ladder | Normal | `I3` direkleri üç satırı birden kapatır; iki köşe (`C3_180` / `C3_90`) direğe yaslanır | T1 | — | 6×4 | 2×5 × 2 | 5 / 4 / — | 4 | G, W, Y | C3, D2, I3 | 8 |
| 9 | Çatı Altı / Under the Roof | Normal (tanıtım) | Bonus blok doğru yerleşince +2 hamle (Hikaye 1'de ödül anı) | T1 | Y12 | 6×4 | 2×5 × 2 | 5 / 4 / — | 4 | G, W, Y | D2, J4, L4 | 8 |
| 10 | Ağaç Ev Tamam! / Treehouse Done! | **Zor** | Final: T kilidi + sargı/makas + iki renkli; Vinç açılır | T1 + T5 | — | 6×4 | 2×5 × 2 | 5 / 4 / — | 4 | G, W, Y | C3, D2, T4 | 8 |

**E2 notu (2026-11-09):** tablo E2 bölüm turunun gerçekleşen verisidir (`levels/*.json`, §8.12); D-099 A2 satırları git geçmişindedir (`2035fc6`). **A2 notu (2026-11-02):** D0 taslağı (6×4 sahalar, 2×5 katlar, Bölüm 10'da
6×8 saha ve üç kat) git geçmişindedir (`806311d`). Fark ve gerekçe §6.10'dadır.

Geometri gerekçeleri (§6.5, D0 taslağı; A2 gerçekleşeni §6.10): 1–5 "her blok kalkar" düzenidir (6×4, duvar = saha tepesi, şantiye bir satır yüksek; E 4 ile
6 genişlikte N ≤ 9 bugünkü tarama bütçesine sığar, §6.8 P5–P6). 6, 7, 9 dar ve yüksek sahada Yüksek Duvar kullanır: dar
saha kazıyı derinleştirir, durum uzayını küçültür (§6.8 P2). 8 ve 10 Ağır Yük için 6 genişlik ister (Q9 3×3 ve yanında
kayma sütunu); 10 varsayılan 6×8 sahayı ilk kez tam kullanır (bölüm finali: "bütün şantiye malzemesi tek yığında") ve
tam kanıtı §7 U-4'e bağlıdır.

**Tablo B — hedef ölçüt aralıkları** (GDD K-50 tanımları; `—` = uygulanmaz/yok; bantlar §6.2'nin bölüm bazındaki
inceltmesidir, D2 paketinde JSON `targets`'a kopyalanır)

| # | min | YAO | minShifts | firstNeedDepth | maxCover | depLater | crossDeps | parkSlack | forced | trapCount | greedyTrap | greedyExcess | greedyWin | ahaMin | branch3 | P | Hamle | Kazanma (orta bot) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 8–9 | 1,00 | 0 | 0 | ≤ 1 | 0 | ≥ 1 | — | 0–2 | 0 | — | 0 | ≥ 0,95 | 0 | ≥ 0,40 | 4 | min + 4 | ≥ %95 |
| 2 | 6–8 | 1,00 | 0–1 | 0 | ≤ 1 | 0 | ≥ 1 | — ya da ≥ 2,0 | 0–2 | 0 | — | 0 | ≥ 0,90 | 0 | ≥ 0,35 | 4 | min + 4 | ≥ %92 |
| 3 | 9–11 | 1,00 | 2–3 | 1 | 1–2 | 1–2 | ≥ 2 | ≥ 1,5 | 1–3 | 0 | — | 0 | ≥ 0,85 | 0 | 0,25–0,45 | 4 | min + 4 | ≥ %92 |
| 4 | 10–12 | ≥ 0,75 (1–2 ray) | 2–3 | 1–2 | 2 | 1–2 | ≥ 2 | ≥ 1,0 | 1–3 | 0 | — | 0 | ≥ 0,75 | 0 | 0,20–0,40 | 4 | min + 4 | ≥ %90 |
| 5 | 12–14 | 1,00 | 3–4 | 1–2 | 2–3 | 2–3 | ≥ 3 | 1,0–2,0 | 2–4 | 0 | — | 1–2 | 0,40–0,70 | 1 | 0,15–0,35 | 2 | min + 2 | %75 |
| 6 | 11–13 | 1,00 | 3 | 2 | 2–3 | 1–2 | ≥ 2 | 1,0–1,5 | 2–4 | 0 | — | 0–1 | 0,50–0,85 | 0–1 | 0,20–0,40 | 4 | min + 4 | %85 |
| 7 | 14–16 | 1,00 | 4–5 | 2 | 2–3 | 2–3 | ≥ 3 | 0,8–1,5 | 3–5 | 0 | — | 1–3 | 0,30–0,60 | 1–2 | 0,15–0,30 | 2 | min + 2 | %70 |
| 8 | 11–13 | 1,00 | 3–4 | 2–3 | 2 | 1–2 | ≥ 2 | 1,0–2,0 | 2–4 | 0 | — | 0–1 | 0,40–0,80 | 0–1 | 0,15–0,35 | 4 | min + 4 | %85 |
| 9 | 11–13 | ≥ 0,85 (1 ray) | 3–4 | 1–2 | 2 | 1–2 | ≥ 2 | ≥ 1,0 | 2–4 | 0 | — | 0–1 | 0,50–0,85 | 0–1 | 0,20–0,40 | 4 | min + 4 | %85 |
| 10 | 22–26 | 1,00 | 7–9 | 2–3 | 3–4 | 3–5 | ≥ 5 | 0,6–1,2 | 5–8 | 0–3 | — ya da ≥ 4 | ≥ 2 | 0,05–0,25 | ≥ 2 | ≤ 0,20 | 1 | min + 1 | %45 |

Bütün satırlarda: `deadRate` Kolay/Normal 0, Bölüm 10 ≤ 0,05; ölü masa kapısı (§6.3) geçer; `complete` evet; kanonik
çözümde kuyruk yok. **Varyant ölçütleri** (§2'deki gibi, `levels:solve --variant`): Bölüm 4 `geçitsiz min − min ≥ 2`,
Bölüm 9 `≥ 1`; Bölüm 8 ve 10 `min − Çekiç'le min ≥ 2`. **Eğri okuması:** `ahaMin` ilk kez 5'te 1 olur (park yeri ve
bekletme), 7'de takasla 1–2'ye, 10'da ≥ 2'ye çıkar; tanıtım bölümleri (4, 6, 8, 9) yeni mekaniğe yer açmak için 0–1'de
kalır. `greedyWin` 1–4'te ≥ 0,75 (açgözlü oyun yeter), 5 ve 7'de 0,30–0,70 (plan gerekir), 10'da ≤ 0,25 (plan şart).
`depLater` 3'te ilk kez ≥ 1 (D-099'un özü: "sonraki katın bloğu yolu keser"), 10'da 3–5.

### 6.7 Öğretici taslakları (GDD K-53: en çok 2 yumuşak adım; adım yalnız `done` olayıyla biter)

Biçim §0'daki gibidir (`adım · vurgu · el · textKey · done (· startOn)`); eldiven yolu kanonik çözümün ilgili hamlesidir
ve D2 paketinde JSON'la birlikte `tut_hand_invalid` denetiminden geçer. Konuşan karakter sunumdur (D-101: Usta Kral;
design-lead). **Yeni anahtarlar** (design-lead yazar, STORY §6A; en çok 6 kelime, renk adı yok): `tut.m.nextfloor` (niyet:
"Kalan bloklar sonraki kat için."), `tut.m.parkfar` (niyet: "Kenara al, yolu kapatma."), `tut.m.swap` (niyet: "Bu ikisi
de o yere uyar."). Kullanılmayan (D-099): `tut.m.segments` ve `tut.m.truck` (kamyon yok; anahtarlar arşiv verisi için
kalır).

| # | Adım 1 | Adım 2 |
|---|---|---|
| 1 | ilk gereken blok · drag (kanonik hamle 1; tutulan hücre bloğun üst hücresi, yol saha üstü havadan duvar üstüne) · `tut.m.lift` · `{ event: placementCorrect, count: 1 }` | `startOn: { event: segmentDone }` · `panorama`, `goals` · — · `tut.m.nextfloor` · `{ event: placementCorrect, count: 1 }` |
| 2 | `panorama`, `build` · — · `tut.m.pattern` · `{ event: placementCorrect, count: 1 }` | üstteki `C3` · hold (gölge "!" gösterir) · `tut.m.shadow` · `{ event: placementCorrect, count: 1 }` |
| 3 | sonraki katın kapak bloğu · drag (kanonik ilk kaydırma) · `tut.m.dig` · `{ event: yardMove, count: 1, piece: <kapak> }` | `startOn: { event: yardMove, piece: <kapak> }` · kapak, `panorama` · — · `tut.m.carry` · `{ event: segmentDone, count: 1 }` |
| 4 | tıkaç · drag (kanonik ilk kaydırma) · `tut.m.dig` · `{ event: yardMove, count: 1, piece: <tıkaç> }` | `startOn: { event: yardMove, piece: <tıkaç> }` · derindeki blok, `gap:0` · drag (raya) · `tut.m.gap` · `{ event: gapPass, count: 1 }` |
| 5 | kapak, `cell:<iyi cep>` · drag (kanonik ilk kaydırma, iyi cebe) · `tut.m.parkfar` · `{ event: yardMove, count: 1, at: <iyi cep çapası> }` (yanlış cep adımı bitirmez) | — (Normal bölüm sade kalır) |
| 6 | cebe ilk girecek blok, `cell:<yüksek cep>` · drag · `tut.m.park` · `{ event: yardMove, count: 1, at: <yüksek cep çapası> }` | `crane`, `wall` · — · `tut.m.highwall` · `{ event: overWall, count: 1 }` |
| 7 | açıktaki iki `D2`, `build` · — (eldiven yok) · `tut.m.swap` · `{ event: segmentDone, count: 1 }` | `startOn: { event: segmentDone }` · gömülü `O4` · — · `tut.m.carryNow` · `{ event: placementCorrect, count: 1 }` |
| 8 | Ağır Yük ve yolunu tıkayan blok · drag (kanonik ilk kaydırma) · `tut.m.heavy` · `{ event: yardMove, count: 1 }` | `booster:hammer`, Ağır Yük · tap (yuva) · `tut.m.hammer` · `{ event: placementCorrect, count: 1 }` |
| 9 | tıkaç · drag (kanonik ilk kaydırma) · `tut.m.dig` · `{ event: yardMove, count: 1, piece: <tıkaç> }` | derindeki tek sıralı blok, `gap:0` · drag (dar geçitten raya) · `tut.m.narrow` · `{ event: gapPass, count: 1 }` |
| 10 | `startOn: { event: segmentDone }` · `booster:crane` · tap (yuva) · `tut.m.cranebooster` · `{ event: boosterUsed, count: 1 }` | — (Söküm ilk kez görülürse bağlamsal `tut.ctx.teardown`, K-30) |

### 6.8 Kalibrasyon ölçümleri (2026-11-01, resmî solver, `levels:solve --dir`, önbelleksiz, varyantsız)

Taslaklar oturum scratchpad'inde `schemaVersion` 1 biçiminde tek partiyle yazıldı (bugünkü çekirdek tek partiyi K-55
anlamında oynatır); depoya girmez. Amaç ölçek ve tuzak davranışını görmekti, bölüm tasarımı değil.

| Taslak | Saha / şantiye × S | N (ikiz) | Sonuç | Durum | Süre / bellek |
|---|---|---|---|---|---|
| P1 | 6×4 / 2×5 × 2 | 8 (az) | `min` 9, `minShifts` 1, takas kendiliğinden (K-55 madde 4 örneği), trap 0 | 2 379 724 (tam) | 117 sn / 513 MB |
| P2 | 4×5 / 2×4 × 2 | 8 (`D2`) | `min` 17, `minShifts` 9, `firstNeedDepth` 9: dar sahada derin kayar-blok bulmacası | 754 098 (tam) | 26 sn / 126 MB |
| P3 | 6×5 / 2×6 × 2 | 10 | bilinmiyor | > 3 000 000 (kesildi) | 56 sn / 431 MB |
| P4 | 6×4 / 2×5 × 2 | 10 (`D2`) | bilinmiyor | > 3 000 000 (kesildi) | 78 sn / 758 MB |
| P5 | 6×4 / 2×5 × 2 | 8 (çok) | `min` 8, `minShifts` 0; 103 ✓-tuzağı geçişi, `deadRate` 0,052 (2×2 Y + YY satırı aynı dilimde, §6.1 karşı örnek); 1 404 çıkmazın hepsi D1/D2/D3a ile yakalanır | 900 998 (tam) | 38 sn / 242 MB |
| P6 | 6×4 / 2×5 × 2 | 9 (çok) | **Bölüm 1 gri kutu adayı** (aşağıda): `min` 9, `minShifts` 0, `firstNeedDepth` 0, trap 0, bütün uzayda çıkmaz 0, choices 11·18·27 / best 2·1·4, YAO 9/9; D-099 bütçesi 9 + 4 = 13 | 525 552 (tam) | 27 sn / 149 MB |

**P6 — Bölüm 1 gri kutu adayı** (§6.1 güvenli örüntü: W yalnız 2×2 bölgelerde, arzda `O4` W + iki `D2_90` W; Y yalnız
satırlarda ve hepsi özdeş `D2_90` Y). Dilim 1 `["YY","YY","YY","WW","WW"]`, dilim 2 `["YY","WW","WW","YY","YY"]`; duvar 4,
geçit yok. Dilim 1 başlangıcı:

```
       x: 0 1 2 3 4 5   D   6 7
   y=6:  · · · · · ·   :   · ·  ← Vinç Alanı
   y=5:  · · · · · ·   :   · ·
   y=4:  · · · · · ·   :   Y Y
   y=3:  a a b b . .   #   Y Y
   y=2:  a a c c . .   #   Y Y
   y=1:  d d e e f f   #   W W
   y=0:  g g h h i i   #   W W
```

`a` `O4_0` W (0,2) · `b` `D2_90` Y (2,3) · `c` `D2_90` Y (2,2) · `d` `D2_90` Y (0,1) · `e` `D2_90` Y (2,1) · `f` `D2_90` W
(4,1) · `g` `D2_90` Y (0,0) · `h` `D2_90` Y (2,0) · `i` `D2_90` W (4,0). Kanonik çözüm (solver): `f` → (6,0), `i` → (6,1),
`h` → (6,2), `g` → (6,3), `d` → (6,4) (dilim 1 tamam; `d` alttan boşalan tünelden çıkar), `e` → (6,0), `c` → (6,1), `a`
→ (6,2), `b` → (6,4); hepsi duvar üstü. Kanonik çözüm takası kendiliğinden yapar: dilim 1'in 2×2 W tabanını iki `D2_90` W
doldurur, `O4` W dilim 2'nin ortasına gider; ters atama da çözülür (trap 0). Öğretici adım 1'in eldiveni `f`'nin kalkışıdır
(`piece:5`). D2 paketinde §6.6 Tablo B'ye göre ölçülür ve JSON'a çevrilir (yeni ölçütler U-3 gelince).

**Sonuçlar:** (1) Sabit sahada durum uzayı, sahada serbestçe asılı duran blokların konum sayısıyla büyür; genişlik 6'da 10
blok bugünkü 3 000 000 sınırını aşar (P3, P4). Bölüm 1–7 bu yüzden ya 6×4'te N ≤ 9 ve ikiz ağırlıklı ya da 4 genişlikte
tasarlanır; 8 ve 10 için §7 U-4 gereklidir. (2) Dar ve sıkı saha (P2: 4×5, E 4) çok derin bulmaca üretir; bant tavanları
(`maxDigRun`) bu yüzden vardır. (3) Takas tuzakları yalnız dilimler arası sayımla görünür (P5); §6.1 güvenli örüntüsü
ve solver kanıtı zorunludur. (4) P1 ve P5'te bütün çıkmazlar D1/D2/D3a ile yakalandı (Söküm'süz çıkmaz 0): kamyon
dökümünün kalkması Faz 2R'de görülen tek Söküm'süz çıkmaz kaynağını (eski Bölüm 10, 338 durum) ortadan kaldırdı.

### 6.9 Kontrol listesi ekleri (D-099; §5'e ek)

- [ ] `schemaVersion: 2`, `yard.batches` tek parti, `forSegment: 0`, `dropColumns` yok (K-55 madde 1).
- [ ] 2–3 dilim; her dilimin planı okunur desen (K-31); renk ve şekil açılışları §0.
- [ ] §6.1 tuzak kaynağı kuralı dilimler arası sayımla denetlendi; Kolay/Normal'de `trapCount` 0, `greedyTrap` yok.
- [ ] Ölü masa kapısı (§6.3): `complete` evet, `undetectedDead` 0, D1 erişilemez.
- [ ] Tablo B bantları tutuyor; dışındaki her ölçüt için gerekçe bölüm kaydında.
- [ ] Hamle `min + P + a`, `a ≥ 0` (K-52 D-099); bot ölçümü LEVEL_REPORT'ta.
- [ ] Öğretici ≤ 2 yumuşak adım, eldiven yolu kanonik hamle (`tut_hand_invalid` yok).
- [ ] ASCII gri kutu taslak → JSON → `levels:check` → LEVEL_REPORT → hamle ayarı sırası izlendi (brif ilkesi 6).

### 6.10 D2 turu sonucu: hedef ve gerçek (A2, 2026-11-02)

Her hücre `gerçek (D0 hedefi, Tablo B)`; kalın = D0 bandının dışında. Bağlayıcı bantlar artık JSON `targets`'tadır
(gerçek değerin çevresinde, solver `metric_out_of_band` ile denetler; 10/10 bölümde bant dışı uyarı yok). Tanımlar GDD
K-50; değerler `levels:solve` (SOLVER_VERSION 3) çıktısıdır.

| # | min | minShifts | firstNeedDepth | maxCover | depLater | crossDeps | parkSlack | forced | greedyExcess | greedyWin | ahaMin | branch3 | Hamle |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **6** (8–9) | 0 (0) | 0 (0) | **3** (≤ 1) | 0 (0) | 5 (≥ 1) | – (—) | **4** (0–2) | 0 (0) | 1 (≥ 0,95) | 0 (0) | **0,36** (≥ 0,40) | 10 |
| 2 | 6 (6–8) | 0 (0–1) | 0 (0) | **2** (≤ 1) | 0 (0) | 5 (≥ 1) | – (—/≥ 2,0) | **5** (0–2) | 0 (0) | 1 (≥ 0,90) | 0 (0) | 0,75 (≥ 0,35) | 10 |
| 3 | **8** (9–11) | **1** (2–3) | 1 (1) | 2 (1–2) | 2 (1–2) | 2 (≥ 2) | **1** (≥ 1,5) | **6** (1–3) | 0 (0) | 1 (≥ 0,85) | 0 (0) | 0,3 (0,25–0,45) | 12 |
| 4 | **9** (10–12) | **1** (2–3) | 1 (1–2) | **5** (2) | 1 (1–2) | 11 (≥ 2) | 2 (≥ 1,0) | **8** (1–3) | 0 (0) | 1 (≥ 0,75) | 0 (0) | 0,33 (0,20–0,40) | 13 |
| 5 | **11** (12–14) | 3 (3–4) | 2 (1–2) | 3 (2–3) | 3 (2–3) | 7 (≥ 3) | 1 (1,0–2,0) | **8** (2–4) | 1 (1–2) | **1** (0,40–0,70) | 1 (1) | 0,27 (0,15–0,35) | 13 |
| 6 | **9** (11–13) | **2** (3) | **1** (2) | 3 (2–3) | 2 (1–2) | 6 (≥ 2) | **2** (1,0–1,5) | **7** (2–4) | 0 (0–1) | **1** (0,50–0,85) | 0 (0–1) | **0,5** (0,20–0,40) | 13 |
| 7 | **11** (14–16) | 4 (4–5) | **1** (2) | 2 (2–3) | 2 (2–3) | 4 (≥ 3) | **0,5** (0,8–1,5) | **9** (3–5) | 2 (1–3) | **1** (0,30–0,60) | 2 (1–2) | 0,27 (0,15–0,30) | 13 |
| 8 | **10** (11–13) | 3 (3–4) | 3 (2–3) | **3** (2) | **3** (1–2) | 4 (≥ 2) | **0,83** (1,0–2,0) | **7** (2–4) | 0 (0–1) | **1** (0,40–0,80) | 0 (0–1) | 0,21 (0,15–0,35) | 14 |
| 9 | 12 (11–13) | **5** (3–4) | 2 (1–2) | **4** (2) | **6** (1–2) | 9 (≥ 2) | **0,4** (≥ 1,0) | **11** (2–4) | **3** (0–1) | **1** (0,50–0,85) | **2** (0–1) | 0,38 (0,20–0,40) | 16 |
| 10 | **13** (22–26) | **6** (7–9) | **5** (2–3) | 3 (3–4) | 4 (3–5) | 6 (≥ 5) | **0,33** (0,6–1,2) | **13** (5–8) | 2 (≥ 2) | **0** (0,05–0,25) | **1** (≥ 2) | **0,43** (≤ 0,20) | 14 |

**Sapmalar ve gerekçeleri:**
1. **Saha ve kat boyu (ölçek):** D0'nın 6×4 saha + 2×5 katı 8–9 blokta 0,5–0,9 M durum, bölüm başına 30–40 sn tam tarama
   veriyordu; 6×5 + `Q9` ile 8 blok 3 M'yi aştı, üç kat 4×7'de 12 blokla 2,5 M'yi aştı (oturum ölçümü). Bu yüzden katlar
   2×4, sahalar 20–30 hücredir ve `min` değerleri D0 bandının 2–3 hamle altındadır. Zorluk `min`den değil `ahaMin`,
   `greedyExcess`, `forced` ve `parkSlack`'ten gelir (§6.2 yorum kuralı 1). `maxCover` ve `forced` küçük sahada doğal
   olarak yüksektir (son katın dipteki bloğu her zaman derindedir; her durumda tek doğru blok çoğunluktadır).
2. **Bölüm 10 iki katlıdır** (D0: üç kat, 6×8 + `Q9`): üç katlı sabit saha §7 U-4 (makro çizge) olmadan tam taranamaz
   (`scan_incomplete`). Final, 7 bloklu bir yeniden dizme bulmacasıdır; P = 1 bütçesinde açgözlü oyun hiç kazanamaz
   (`greedyWin` 0). Ağır Yük ve takas tuzağı (T9, T10) U-4 gelince Bölüm 15'e (Zor) taşınır.
3. **`greedyWin` Normal'de 1,00:** D-099 bütçesinde Normal P = 2'dir; bekletmeyi ya da yer açmayı kaçıran açgözlü oyuncu
   1–2 fazla hamleyle yine kazanır. Aha anı kazanmayı değil payı belirler (5: +1, 7: +2, 9: +3). Bot (WP-N) gelince
   `a` ayarı ve gerekirse Normal P'nin 1'e çekilmesi önerilir (DECISIONS ÖNERİ, §6.4).
4. **Bölüm 8'de `ahaMin` 0:** yük tanıtımı sade tutuldu (brif ilkesi 3); yükle bekletme birleşimini arama (≈ 300 tam çözüm)
   bugünkü ölçek sınırında bulamadı. Orkestratörün "8–10'da aha ≥ 1" çıtası 9 (2) ve 10 (1) için sağlandı; 8 için açık.
5. **Bölüm 4 ve 9'da geçit:** iki bölümde de geçit ikinci katın (4) ya da birinci katın (9) tabanını raydan getirir;
   geçitsiz `min` 4'te +1, 9'da +2 (varyant bandı ≥ 1, §6.6).

**Kendi kendine inceleme (3 insan stratejisi; bot yok, zihinden ve solver ölçütleriyle):** "Açgözlü" = her an doğru
yerleşimi, yoksa en yakın yerleşimi açan kaydırmayı yapar (`greedyWin`, `greedyExcess`); "en üsttekini al" = hep en
üstteki bloğu dener, uymazsa ilk boş cebe park eder; "plancı" = kanonik çözüm.

| # | Açgözlü | En üsttekini al | Plancı | Karar |
|---|---|---|---|---|
| 1 | en kısa yol (+0) | üstteki blok tam sıradır, kazanır | 6 | kolay, ilk 10 sn'de oynanır |
| 2 | +0 | `c` erken denenir, 1 hamle geri sekme; 10 hamlede rahat kazanır | 6 | gölge öğretiliyor |
| 3 | +0 | üstteki `O4` Y tek cebe gider; kazanır | 8 | kazı tek ve okunur |
| 4 | +0 | `f`yi kazıp geçidi kullanmazsa +1; 13 hamlede kazanır | 9 | geçit fark edilmezse de adil |
| 5 | +1 | dikey W'yi hemen koyar, eşini dipten kazar (+1); 13 hamlede kazanır | 11 | ilk "bekle" anı; öğretici ipucu var |
| 6 | +0 | kapağı sağa park eder, geri getirir; kazanır | 9 | tanıtım sade |
| 7 | +2 | `O4` W'yi bu kata koyar, dikey R'leri kazar (+2); son hamlede kazanır | 11 | sıkı ama adil |
| 8 | +0 | üst Y'yi park edecek yer bulamaz; yükü kaydırınca açılır (öğretici `tut.m.heavy`) | 10 | yük dersi net |
| 9 | +3 | dar geçidi geç fark ederse 15 hamle; 16 bütçede kazanır | 12 | düşündürür, bütçe affeder |
| 10 | +2 (bütçe 14) | yığını sırasız boşaltırsa 15+ hamle; kaybeder, Söküm gerekmez | 13 | final: plan şart |

Sinir bozucu bulunan ve düzeltilen: (1) ilk Bölüm 4 adayında geçit hiç kullanılmıyordu (sol sütun boşalınca dipteki
blok yandan kaçıyordu); geçidi ikinci katın tabanına taşıyan aday seçildi. (2) Bölüm 6'nın ilk adayında kapak üç kez
taşınıyordu; iki kaydırmalı aday seçildi. (3) Bölüm 9'un ikinci adımı başlangıçta yer değiştiren bir bloğa eldiven
koyuyordu (`tut_highlight_invalid`); eldiven kaldırıldı, vurgu ve metin kaldı.

### 6.11 İnceleme turu (code-lead, P4B-02 / P4B-03, 2026-11-02): ölçülen sapma ve karar bekleyen soru

Sahip: product-lead. Bu bölümü code-lead ekledi (orkestratör "veri bulgusu varsa düzeltmeyi yine yap, LEVELS'e not düş"
dedi); bölüm verisi ve bantlar değişmedi, yalnız ölçüm ve araç eklendi. Ayrıntı: `docs/LEVEL_REPORT.md` "Şartname sapması".

1. **Sapma artık görünür.** `levels:solve` her v2 bölümü için Tablo B ile karşılaştırır (`tools/solver/spec.ts`; tablo bu
   dosyanın Tablo B'sine `tests/tools/solver/spec.test.ts` ile eşitlenir) ve gerçek değer ya da JSON `targets` bandı Tablo B
   dışındaysa `targets_diverge_from_spec` notu yazar (hata değil). 10/10 bölümde en az 4 ölçüt dışındadır. En ağırı: Bölüm
   10 `min` 13 (22–26), `forced` 13 (5–8), `ahaMin` 1 (≥ 2), `choices@0` 2 (≥ 5); Bölüm 2 `choices@0` 1 (≥ 3); Normal 5–9'da
   `greedyWin` 1,00 (0,30–0,85).
2. **`puzzle_greedy_easy` sıkılaştı** (GDD K-51/9 metni «`ahaMin ≥ 1` ya da `greedyWin ≤ 0,70`» diyordu; kod artık `ahaMin`'e
   bakmaz): Normal (tanıtım hariç) ve Zor'da `greedyWin > 0,70` uyarır. Bölüm 5 ve 7 uyarı alır (susturulmadı). **GDD K-51/9
   metnini buna göre güncelleyin** (ya da kuralı geri alın).
3. **`greedyWin` neredeyse ikilidir** (0 ya da 1): bu küçük çizgelerde açgözlü politikanın bütün eşit seçimleri aynı maliyeti
   verir; Tablo B'nin 0,40–0,70 gibi ara bantları bu ölçekte üretilemez. Bu yüzden Tablo B'nin `greedyWin` sütunu ya
   `greedyExcess > P` (açgözlü en iyi yolda bile kaybeder) biçiminde yeniden yazılmalı ya da beceri botuyla (madde 4) ölçülmelidir.
4. **Beceri botu vekili** (`skillWin`, ε = 0,25 / 0,12 / 0,06; WP-N botu gelene kadar): ε = 0,12 Bölüm 1–10'un orta-bot
   hedefleriyle örtüşür. Orta: 1 → 1,00 · 2 → 1,00 · 3 → 0,96 · 4 → 0,98 · **5 → 0,72** · 6 → 0,96 · **7 → 0,73** · 8 → 0,96 ·
   9 → 0,88 · **10 → 0,41** (hedefler %90+, %75, %70, %45). Yani eğri oyuncuyu ayırt ediyor; açgözlü politika ise bölüm 1–9'da
   fark yaratmıyor.
5. **Normal P 2 → 1 denemesi (ucuz yol) ölçüldü ve reddedildi.** Bölüm 5 ve 7 `moves` 12'ye çekilince orta vekil 0,72 → 0,51 ve
   0,73 → 0,52 olur (Normal hedefi %65–80'in altı); Bölüm 7'de açgözlü oyun kaybeder (`greedyMin` 13 > 12) ama Bölüm 5'te
   kazanmaya devam eder (12 = 12). Normal P = 1 ayrıca Normal ile Zor bütçesini eşitler (K-52 tablosu). **Veri değişmedi.**
6. **Bölüm 10 duvar değildir (vekil ölçümü):** `moves` 14 (a = 0) orta vekil 0,41 (hedef %40–55); `moves` 15 (a = 1) 0,62 olur
   (bandın üstü) ve açgözlü oyun 15'te kesin kazanır (`greedyWin` 1,00, `puzzle_greedy_wins` uyarısı). Bu yüzden `a` = 0 kaldı.
   Gerçek insan kazanma oranı için WP-N botu ve oynatma gerekir.
7. **Karar bekleyen soru (product-lead + orkestratör, proje sahibine):** (a) Tablo B DECISIONS'ta resmen revize edilir
   (`min`, `maxCover`, `forced`, `parkSlack`, `greedyWin` ölçek sınırına göre; bölüm 1–9 açgözlü oyunla kazanılabilir kalır) ya
   da (b) bölümler Tablo B'ye çekilir: bu U-4 (makro çizge, daha büyük sahalar) ve yeni Bölüm 5/7/10 aday araması ister
   (A2'nin sahası 4×5–6×5, 7–8 blok; Bölüm 10 için 22–26 hamle 7 bloğa sığmaz). Önerim: (a) bölüm 1–4 için, (b) Bölüm 5, 7, 10
   için (U-4 sonrası); o güne kadar `skillWin` orta vekili eğrinin kabul ölçütüdür.

---

## 7. Uygulama notları (code-lead'e; D-099)

Bu notlar product-lead'in istedikleridir; kesin tasarım, adlar ve dosya yolları code-lead'in TECH_DESIGN'ıdır. TS çekirdeği
ve Unity C# çekirdeği birlikte değişir (D-091: golden + TS-kâhinli fuzz eşdeğerliği korunur).

**U-1 Şema (geriye dönük uyumlu).** Önerilen yol A: `schemaVersion` alanı `1 | 2` olur (yoksa 1). v2'de `yard.batches`
dizisi **biçim olarak kalır** ama tam 1 eleman, `forSegment: 0`, `dropColumns` yok (doğrulayıcı `fixed_yard_batches`,
GDD K-45 madde 11). Böylece derleyici (`compile.ts`), durum tamponu, Zobrist ve C# ayrıştırıcı değişmez; v1 dosyaları
(Faz 2R arşivi, `tests/golden/**`) aynen yüklenir. Yol B (sonra, isteğe bağlı): v2'de `yard.pieces` dizisi, derleyici
onu `batches[0]`'a çevirir; bütün fixture'ları ve iki ayrıştırıcıyı değiştirdiği için D-099 kapsamında önerilmez.
`targets` şemasına isteğe bağlı bantlar eklenir (GDD §14): `min`, `maxCover`, `depLater`, `crossDeps`, `parkSlack`,
`forced`, `greedyExcess`, `greedyWin`, `ahaMin`, `branch3` (tamsayı ölçütler `[alt, üst]` tamsayı, oranlar 0–1 sayı;
`parkSlack` için üst sınır 9,99 "park yok" yerine geçmez: park yoksa ölçüt bant dışı sayılmaz).

**U-2 Doğrulayıcı.** v1/v2 ayrımı `schemaVersion`'a göre; v2'de K-45 madde 11 kodları. K-02 bandı kodu değişmez (tek
partide F zaten bütün bloklardır). K-52 bandı v2'de D-099 tablosuyla (`min + P ≤ moves ≤ min + P + aMax`). Mekanik
imzaları: S1 imzası değişmez (`segments` ve dilim sayısı ≥ 2); `MECHANICS` tablosundaki `firstLevel` S1 = 5 değeri ile
OBSTACLES "Veri imzası" satırı D2 paketinde, yeni Bölüm 1 JSON'uyla aynı commit'te 1 olur (`mechanics.test` ikisini eşit
ister).

**U-3 Çözücü ölçütleri (GDD K-50 madde 11–19).** Hepsi bugünkü keşif çizgesi ya da U-4 yapıları üzerinde hesaplanır:
- `maxCover`: başlangıç durumunda `coverOf` (metrics.ts) en büyüğü. `canonShifts`, `parkedBlocks`, `reparks`,
  `maxDigRun`, `carryShifts`, `parkPeak`/`parkSlack`: kanonik adımlar (`CanonicalStep`) üzerinde tek geçiş; `seg(b)` =
  bloğun yerleşim adımındaki `segment`.
- `depLater`/`depEarlier`/`crossDeps`: başlangıç saha doluluğundan sütun bazlı örtü ilişkisi (madde 6 ile aynı), `seg`
  kanonik atamadan.
- `choices@k`/`bestChoices@k` bütün k için (bugün k ≤ 2): kanonik yol boyunca aynı hesap; `forced`, `decisionPoints`.
- `dig(s)`: kaydırma kenarlarının tersinde, "doğru yerleşim kenarı olan durumlar"dan çok kaynaklı BFS. G-uygun kenar
  kümesi buradan çıkar. `greedyMin`: G-alt çizgesinde (DAG) en kısa yol; `greedyTrap`: G-alt çizgesinde çıkmaz duruma en
  kısa yol; `greedyWin`: G-DAG üzerinde (durum, kalan bütçe) DP — olasılık = G-uygun hamlelerin ortalaması (birim K-50
  madde 9 (a): farklı sonraki durum); G-alt çizgesi solver sınırını aşarsa bölüm tohumundan (`seed`) türeyen belirlenimci
  PRNG ile 2 000 oyunluk örneklem ve raporda `greedyWin~` işareti.
- `ahaMin`: en kısa çözüm DAG'ında (`dist(s) = c(e) + dist(s')` kenarları) G-uygun olmayan kenarlar 1, diğerleri 0
  ağırlıklı en kısa yol (0-1 BFS). Kanonik çözümün aha hamleleri (`hold` / `prep`) raporlanır.
- `branch3`: kanonik yolun k = 0…2 durumlarında giden kenarlar parça kimliğine göre gruplanır; "iyi" = en az bir kenarı
  en kısa çözüm DAG'ında.
- LEVEL_REPORT sütunları: yukarıdakiler + `complete` + `undetectedDead` + D1 erişilebilirliği; `metric_out_of_band`
  bunları `targets` ile karşılaştırır. SOLVER_VERSION artar (önbellek geçersizleşir).

**U-4 Ölçek (engelleyici bağımlılık).** §6.8: sabit sahada 6 genişlik + 10 blok 3 000 000 durumu aşıyor. İstenen: Bölüm
1–10'un hepsi için `complete` evet, bir bölüm ≤ 120 sn ve ≤ 2 GB (CI'da `levels:check` ≤ 20 dk). Önerilen yöntemler
(code-lead seçer, kanıtı testle verir):
1. **`min`, `minShifts`, kanonik çözüm:** A* (h = kalan malzeme bloğu sayısı; her yerleşim en az 1 hamle, kabul edilebilir)
   ve kaydırma sayısı sınırlı 0-1 BFS; bu, K-50 madde 8 kapsamı K'yı (≤ `minShifts` + 1 kaydırma) zaten kapsar.
   `trapCount`, `deadRate`, `choices@k` kapsam K ile sınırlıdır; bütün uzayı gerektirmez.
2. **Çıkmazlık ve D1 için saha sıfırlama eşdeğerliği (önerilen kanıt, testle doğrulanmalı):** saha yerçekimi kapalı
   (`gravity.yard = false`), zamanlayıcısız (W4, W5, S5, S6, Y4 yok) ve komşu etkili saha engelleri olmayan (Y1, Y2, Y3,
   Y7 yok) bir v2 bölümünde, erişilebilir her s durumundan sahadaki kalan blokların hepsi **başlangıç çapalarına** geri
   götürülebilir: s'ye giden geçmişteki kaydırmalar ters sırayla geri oynatılır, yerleşmiş blokların kaydırmaları atlanır
   (onlar artık yoktur ve yalnız yer açarlar; kalan blokların ara konumları geçmişteki ile aynıdır). Ters yön de geçerlidir.
   Sonuç: s ile s\* (aynı şantiye, kalan bloklar başlangıç çapalarında) aynı kaydırma bileşenindedir; **çıkmazlık yalnız
   şantiye durumunun (hangi blok sınıfının nereye yerleştiğinin) fonksiyonudur.** Böylece çıkmaz ve D1 denetimi "makro
   durum" çizgesinde yapılır: düğüm = geçerli kısmi şantiye dolumu; kenar = s\*'den kaydırmalarla çıkarılıp doğru yere
   bırakılabilen blok (tek kaynaklı erişim araması, erken çıkışlı). Çizge küçük (kısmi döşeme sayısı) ve kesin.
   **Kanıtın dışında kalan yol:** kaydırma yolunun bir geçidin rayından geçip sahaya dönmesi (K-12); sonradan o raya yerleşen
   blok yolun tersini kapatabilir. Geçitli bölümde (4, 9) bu kenarlar ya tam tarama ile ya da kaydırma yolu raya girmeyen
   alternatif yolla denetlenir. Doğrulama: makro yöntem ile tam taramanın çıkmaz kümeleri bugünkü tam taranabilen bütün
   bölümlerde (Faz 2R 1–10, §6.8 P1, P2, P5, P6) eşit olmalıdır.
3. **Bellek ve hız:** ikiz bloklar zaten tek sınıftır (hash.ts); ek olarak ölçüt geçişleri kenar listesini saklamadan
   yeniden üretebilir; işçi iş parçacıkları bölüm başına.
U-4 gelene kadar: 6 genişlikli v2 bölümünde N ≤ 8–9 (P1, P5, P6 tam tarandı); Bölüm 8 ve 10 yalnız U-4 ile kanıtlanır.

**U-5 Üretici (generator) tarifi — belirlenimci arama.** Komut önerisi `npm run levels:gen -- --level N` (ad code-lead'in).
1. **Girdi:** §6.6 Tablo A + B satırı (boyut, S, duvar/geçit, renkler, şekiller, N aralığı, hedef bantlar, zorluk, P) ve
   tohum `seed` (yoksa `id × 1000 + id`). Plan desenleri ya product-lead'in yazdığı plan listesinden (yapı parçası adlarıyla)
   ya da desen ailelerinden (K-31: şerit, çapraz şerit, dama, simetri) seçilir.
2. **Parça kümesi:** her dilimin planı, izinli şekillerle **tam örtü** olarak döşenir (renk tutar, K-34 alttan üste
   sırası vardır); bütün dilimlerin döşemeleri birleşik parça çok kümesini verir. §6.1 tuzak kaynağı kuralı burada
   süzgeçtir: Kolay/Normal adayında, dilimler arası sayımla her ara durumda döşenebilirlik bozulmamalıdır (D3a ile hızlı
   ön sınama; kesin karar solver'da).
3. **Sahaya diz:** parçalar Wy × Hy sahaya **yerçekimiyle** (saha yerçekimi kapalı olsa da başlangıçta her blok tabana ya da
   başka bir bloğa oturur; asılı başlangıç yok — okunabilirlik ve D1 güvenliği) ve "ters istif" sırasıyla konur: önce
   gereken bloklar üstte, sonraki katlarınkiler altta (T2), sonra Tablo B'nin `depLater`'ı kadar sonraki kat bloğu üste
   alınır (T1); E boş hücre bir ya da iki "cep" olarak bırakılır (yeri zorluk değişkenidir).
4. **Ölç:** solver (U-3) bütün ölçütleri hesaplar. Uygunluk = sert kısıtlar (çözülür, `complete`, `undetectedDead` 0, D1
   yok, YAO ≥ 0,60, Kolay/Normal'de `trapCount` 0 ve `greedyTrap` yok, K-02 bandı, tam örtü) + yumuşak kısıtlar (Tablo B
   bantlarına ağırlıklı uzaklık; önce `ahaMin`, `greedyWin`, `forced`, `depLater`, `parkSlack`, sonra `min`, `minShifts`,
   `maxCover`, `branch3`).
5. **Ara:** tavlama ya da tepe tırmanma; komşuluk işlemleri: iki parçanın saha yerini takas, bir parçayı başka bir oturak
   yere taşı, cebi taşı, bir bölgenin döşemesini eşdeğeriyle değiştir (`O4` X ↔ iki `D2` X), iki dilimin renk bölgelerini
   desen korunarak değiştir, yük (Q9) konumunu değiştir. Her yineleme önce ucuz ölçütleri (A* `min`, `minShifts`,
   `firstNeedDepth`) hesaplar; pahalılar (G-ölçütleri, makro çıkmaz) yalnız eşiği geçen adayda.
6. **Belirlenimcilik:** bütün rastgelelik tek PRNG'den (tohum = `seed`; çekirdeğin `rng.ts` üreteci) ve sabit sırayla;
   sabit yineleme sayısı ya da sabit "iyileşmesiz adım" sınırı (duvar saati yok); eşitlikte K-50 madde 4 demeti. Aynı
   tohum + aynı girdi + aynı SOLVER_VERSION → bit bit aynı bölüm. Aday sonuçları `levelHash` ile önbelleğe alınır.
7. **Çıktı:** en iyi 3 aday JSON (`schemaVersion: 2`, `targets` dolu) + ölçüt raporu + ASCII önizleme
   (`levels:preview`). Seçim ve ASCII kaydı product-lead'indir (LEVELS §2 biçiminde); hamle ayarı `a` bot ölçümünden sonra
   (K-52).

**U-6 Çekirdek (TS + C#).** (1) K-55 madde 1 yükleme denetimi (v2'de tek parti; çekirdek zaten parti 0'ı başta yerleştirir,
parti k ≥ 1 yoksa teslimat imleci hiç ilerlemez — davranış değişikliği yok). (2) K-30 D1: yeniden dizme yerine zincir/ıslaklık
kaldırma + Söküm (`cause: access`); `RULES_VERSION` 2 → 3 (K-43 madde 4 eski kayıtları cezasız kapatır, E-67). (3) Olaylar:
v2'de dilim geçişi `deliveryDone` üretmez; bu olay ve kamyon göstergesi yalnız K-55 madde 5 kuyruğuyla oluşur. (4) Golden kayıtlar:
Faz 2R 1–10 (v1) aynen kalır; D2 paketinde yeni v2 bölümlerinin golden'ı eklenir. (5) Unity: aynı değişiklikler C#
çekirdeğinde, TS-kâhinli fuzz v1 ve v2 bölümleriyle.

**U-7 Belge senkronu ve testler.** Bu paket (D0) GDD'ye K-55 başlığı ve E-62…E-67 ekledi; `npm run test:rules` bu yüzden
TECH §12.4'te **K-55 satırı** ister (önerim: F sütunu `3` — D-099 içerik fazı; böylece `--phase 2R` kapısı yeni testleri
şimdi istemez) ve `tests/tools/ruleCoverage.test.ts`'deki K sayısı 54 → 55 olur. K-55 ve E-62…E-67 için testler ("K-55 …",
"E-62 …") D1 paketinde. GDD'de var olan E satırlarına eklenen D-099 notları K/engel kimliği içermez (faz hesapları
değişmez). D2 paketinde: §1 tablosu, §2 kayıtları ve `levels/*.json` aynı commit'te değişir
(`tests/review/data.review.test.ts`, `tests/level/drafts.test.ts` bunları karşılaştırır); OBSTACLES `obs.s1.desc` metni
ve `src/i18n/*.json` birlikte değişir (`tests/services/i18n.test.ts`).

**U-8 Sıra önerisi.** D1 (code-lead): U-1, U-2, U-6 + U-3'ün ucuz ölçütleri + U-4 madde 1–2 + testler (TECH §12.4 dahil).
D2 (product-lead + code-lead): U-5 üretici, Bölüm 1–10 v2 (§6.6), §1/§2/JSON/golden birlikte. D3: orta bot (WP-N) ve `a`
ayarı, LEVEL_REPORT, Unity'ye taşıma. Her pakette kapı: `npm run check`, `levels:check`.

---

## 8. Bölümler v3 tasarımı — ÖNERİ (paket G1, 2026-11-08; G1b revizyonu aynı gün)

Sahip: product-lead · Durum: **ÖNERİ** — onaylanınca code-lead U-v3 paketi (§8.10) ve product-lead bölüm turu (JSON,
golden, §1/§2/§6 tabloları) aynı commit'te gelir; o güne kadar §1–§7 ve `levels/*.json` bağlayıcıdır (testler §2 ve §6
tablolarını JSON'la karşılaştırır, bu bölüm okunmaz). Kaynaklar: proje sahibinin 2026-11-08 isteği, oyun testi raporu
`docs/review_inbox/levels-v3-playtest.md`, design-lead incelemesi `docs/review_inbox/levels-v3-design-review.md`
(DL-V3-01…22; kapanışlar o dosyanın sonunda), GDD §16 (ÖNERİ K-56…K-66), OBSTACLES "Bölümler v3 blok özellikleri".
Yöntem: stüdyo şablonu (game-designer, level-designer, systems-designer; `quick-design`, `balance-check`,
`design-review`); orkestrasyonlu koşu istisnası (hedef yollar brifte; her kararda 2–4 seçenek ve seçim yazıldı).

**G1b revizyonunun özeti (v3.1):** (1) Hikaye 1'de palet **tek tiplidir** (bütün katmanlar aynı blok); karışık palet
Hikaye 2'ye, gözetleme ve "sonraki katman" kenarı çizildikten sonra gelir (DL-V3-01). (2) İki renkli bloklar yalnız
renk körlüğünde güçlü çiftlerden (W–Y, R–Y, W–G, G–Y) yapılır; Bölüm 4, 7, 9, 10 yeniden renklendi (DL-V3-06). (3) Bonus
Hikaye 1'de **ödül anıdır** (`k` = 0) ve Bölüm 10'dan çıktı; Bölüm 10 üç özellikle kalır (DL-V3-07, DL-V3-15). (4) Yeni
kapılar: `pallet_capacity`, `scissors_blocked`, `liftRatio` ≥ 0,60, `traitDelta` ≥ 10, `shapeDecisions` ≥ 2 (DL-V3-08,
-09, -10, -11). (5) R rengi Bölüm 4'e çekildi; Bölüm 5'in tek yeni fikri iki renkli bloktur (DL-V3-16). (6) Bölüm 3–5
sahası 6×5'e büyüdü (duvar 5): palet kapasitesi sağlanır, üst satır duvarın altında kalır, görünen blok sayısı 8'in
altına düşmez (DL-V3-10, -09, -17).

### 8.0 Teşhis (özet; ayrıntı oyun testi raporunda)

Bugünkü 10 bölümde 70 malzeme bloğunun 49'u (%70) yatay domino, 80 plan satırının 77'si (%96) tek renkli; her blok
yalnız renkle eşleşir, şekil kararı yoktur. Bölüm başına 6–8 blok, 9/10 bölümde 20 hücrelik saha (6×8 = 48 olanak).
`greedyWin` 1–9'da 1,00, 10'da 0,00: eğri "düşünmeden kazan" ile "tek doğru dizi" arasında ikili. v3'ün üç kolu:
**kütle** (daha çok blok, Palet), **şekil** (karışık renkli satırlar, L/J/T/I3, iki renkli blok), **oyuncak** (her
2–3 bölümde bir yeni, görsel olarak okunur blok özelliği).

### 8.1 Kararlar ve seçenekler

**Karar 1 — Şantiye genişliği.** (**D-103 ile geçersiz:** Bölüm 6–10 Ws = 3; §8.13.) (A) Ws = 2 kalır, şekiller yalnız 2 genişlikli yönelimlerle (L/J/T/I3 dikey) gelir;
(B) Ws = 3'e (S9) Hikaye 1'de geçilir, artı/yatay L/T açılır; (C) Ws = 2–3 karışık. **Seçim A.** Gerekçe: Wy + Ws ≤ 8
(K-49, 120 px hücre) Ws = 3'te sahayı 5 sütuna indirir ("daha çok blok" isteğiyle çelişir); 3 renk sınırında 3 sütunlu
tuzaksız döşeme kurulamadı (§2.0 madde 4); ölçek (§8.10). Artı ve yatay şekiller S9 ile Hikaye 2'de (18) gelir.

**Karar 2 — Blok kütlesi nasıl artar?** (A) Saha 6×8'e büyür, tekil bloklar; (B) Palet (Y10): katmanlar aynı
hücrede, ayak izi küçük; (C) ikisi birlikte. **Seçim C, ağırlık B'de.** Gerekçe: tam örtüde saha malzemesi plan kadardır;
plan Σ'yı büyütmek `min`'i büyütür ve "minMoves ≤ 20" sınırını deler. Palet 2 hücrelik yerde 2–3 blok taşır: blok sayısı
artar, ekran ve durum uzayı daha az büyür. Saha 1. bölümde 20, 2–5 ve 7'de 30, 6 ve 8–10'da 36 hücre (§8.4).

**Karar 3 — Hangi özellikler?** 10 aday puanlandı (OBSTACLES v3 tablosu: karar, okunurluk, adalet, çözücü, tam örtü,
çakışma). **Seçim:** Y9 İki Renkli, Y10 Palet, Y11 Sargı + Makas (Hikaye 1, karar yaratan üç özellik); Y12 Bonus
(Hikaye 1, **ödül anı** — karar sayımına girmez, G1b); Y13 Kaygan (Hikaye 2, 13). Reddedilen: ağır blok (ücretli güce
bağlar), çift yerleşim (kodlanamaz tanım), gizli renk (bilgi gizler); ertelenen: renk değiştiren (K-47 dinamikleşir;
Hikaye 3+).

**Karar 4 — Eski mekanikler.** (A) W1/W2/Y5/W3 Hikaye 1'de kalır, yeniler sıkışır (bölüm başına 2 yeni → K-45 madde 10
ihlali); (B) eskiler Hikaye 2'ye taşınır; (C) yeni özelliklerin yarısı Hikaye 2'ye. **Seçim B** (OBSTACLES "Taşınan ilk
bölümler"): W1 → 11, W2 → 12, Y5 → 14, W3 → 16, S9 → 18. Gerekçe: proje sahibi tazelik istiyor; geçit ve yük "kazı"
ailesindendir, bugünkü 1–10'un tekdüzeliğinin parçasıdır. Çekiç 8'de kalır (META §4): hedefi Ağır Yük yerine sargıdır.

**Karar 5 — Zorluk bandı yorumu.** Orkestratör bandı "Kolay 1–3, Normal 4–7, Zor 8–10". (A) Bölüm numarası olarak
(8, 9, 10 Zor); (B) **zorluk puanı** (1–10 ölçeği) olarak; brif testere dişi (yalnız 10 Zor) korunur. **Seçim B.**
Gerekçe: brif ilkesi 4 (10, 15, 25 … Zor; Zor'dan sonra nefes) ve "zorluğu abartı olmayan" isteği; arka arkaya üç Zor
bölüm 1–10'da kaybı yoğunlaştırır. Bantlar: puan 1–3 Kolay (orta bot ≥ %85), 4–7 Normal (%60–80), 8–10 Zor (%40–60;
`min` ≤ 20, `ahaMin` ≤ 2). Bölüm 10'un bandı G1b'de bandın üst yarısına (%50–60) çekildi (DL-V3-15). Açık soru olarak
orkestratöre döner.

**Karar 6 — "minMoves ≤ 20" ile "Bölüm 10'da 16–22 blok".** Her blok en az bir hamledir (`min ≥ N`); 22 blok `min`
≤ 20 ile çelişir. (A) N ≤ 17, `minShifts` ≤ 4; (B) N 20–22, `min` ≤ 26. **Seçim A:** Bölüm 10 N = 16, `min` 20.
Gerekçe: abartısız zorluk; bölüm süresi 1–10 bandı 45–75 sn (§0) ≈ 15–20 hamle. N 18–22 ve 6×7 / 6×8 sahalar
**Hikaye 2'nin finalinde (20)** kullanılır; proje sahibine bu açıkça söylenir (DL-V3-21).

**Karar 7 — Palet katman sırasının okunurluğu (G1b, DL-V3-01).** 40 CSS px hücrede 2 px'lik renkli şerit sırayı
taşıyamaz. (A) Hikaye 1'de palet **tek tipli**: bütün katmanlar aynı şekil, aynı renk(ler), bayraksız; sıra bilgisi
gereksizdir, gizli bilgi yoktur. (B) Karışık palet kalır; üst bloğun altından 28 design px'lik sembollü "sonraki katman"
kenarı + basılı tutunca gözetleme (katmanlar vinç alanında yelpaze, 400 ms, hamle harcamaz). (C) Paletin üstünde önizleme
şeridi (8 sütunlu tahtada yer yok). (D) A + B: karışık palet L6'dan itibaren 2 katmanla. **Seçim A (Hikaye 1 boyunca),
B Hikaye 2'de (karışık palet o hikayenin bir bölümünde kendi tanıtımıyla).** Gerekçe: D, karışık paleti L6 / L8 / L10'dan
birine ikinci yeni fikir olarak sokardı (K-45 madde 10) ve Hikaye 1'i yeni sanat kapısına (gözetleme) bağlardı; A'da
"z kazısı" kararı yine vardır: palet ayak izi son katmana kadar dolu kaldığı için paletin **altındaki** blok, palet
boşalmadan alınamaz (Bölüm 4 ve 10'un aha'sı). Kapı: gözetleme ve kenar çizilmeden karışık paletli bölüm yayımlanmaz
(GDD ÖNERİ K-65 madde 1).

**Karar 8 — İki renkli renk çiftleri (G1b, DL-V3-06).** (A) Her çift serbest, ayrım sembolde; (B) yalnız deutan ve protan
ΔE ≥ 30 çiftleri (W–Y, R–Y, W–G, G–Y); (C) iki renkli blokta yalnız W–Y. **Seçim B.** Gerekçe: A finalde en yüksek baskı
anında zayıf ayrıma (W–R deutan ΔE 19) dayanır; C çeşitliliği öldürür. Plan düzeyindeki tuzak sonucu değişmesin diye
yeniden renklendirme **birebir renk eşlemesiyle** yapıldı (Bölüm 4 G→R, Bölüm 7 W→Y, Bölüm 9 R→G, Bölüm 10 R→Y);
eşleme bire bir olduğundan döşeme ve tuzak yapısı aynıdır (denetim yeniden koşuldu, §8.7).

**Karar 9 — Saha üst satırı ve imza hareket (G1b, DL-V3-09).** (A) `Hy ≤ height` kuralı; (B) üretici kısıtı: duvar
tepesinin üstündeki saha satırına (y ≥ `height`) yalnız kanonik çözümde ilk hamlesi park olan blok konur; (C) yeni ölçüt
`liftRatio` ≥ 0,60. **Seçim C + B; A, Hy ≤ height'i bozmadan sağlanabilen bölümlerde zaten uygulanır** (1–5 ve 7'de
Hy ≤ duvar). 6, 8, 9, 10'da (6×6 saha, duvar 5; boyu 3 şekiller duvar ≤ H − 1 ister) C + B; `liftRatio` < 0,60 çıkarsa
o bölüm A'ya geçer (saha 6×5, palet katmanı ile Σ korunur).

### 8.2 Şekil kümesi v3 (GDD ÖNERİ K-56)

Ws = 2'de kullanılabilen yönelimler (hücreler sol alt köşeden, (x, y); çizim yukarıdan aşağı):

| Kimlik | Hücreler | Görünüm | Not | İlk bölüm (v3) |
|---|---|---|---|---|
| `B1_0` | (0,0) | `X` | kama; tuzak mıknatısı, 1–10'da kullanılmaz | (izinli) |
| `D2_0` | (0,0)(0,1) | `X / X` | dikey domino | 1 |
| `D2_90` | (0,0)(1,0) | `XX` | yatay domino; tek renkli satır | 1 |
| `O4_0` | (0,0)(1,0)(0,1)(1,1) | `XX / XX` | v3 1–10'da kullanılmaz (palet ve L/J daha çok karar verir) | (izinli) |
| `C3_0` | (0,0)(1,0)(0,1) | `X. / XX` | alt satırı dolu | 4 |
| `C3_90` | (0,0)(0,1)(1,1) | `XX / X.` | | 6 |
| `C3_180` | (1,0)(0,1)(1,1) | `XX / .X` | | 4 |
| `C3_270` | (0,0)(1,0)(1,1) | `.X / XX` | alt satırı dolu | 6 |
| `L4_0` | (0,0)(1,0)(0,1)(0,2) | `X. / X. / XX` | boy 3 | 2 |
| `L4_180` | (1,0)(1,1)(0,2)(1,2) | `XX / .X / .X` | sol sütunu askıda (K-34: önce sol alt) | 2 |
| `J4_0` | (0,0)(1,0)(1,1)(1,2) | `.X / .X / XX` | boy 3 | 2 |
| `J4_180` | (0,0)(0,1)(0,2)(1,2) | `XX / X. / X.` | sağ sütunu askıda | 2 (§8.10 H1 düzelince) |
| `T4_0` | (0,0)(0,1)(0,2)(1,1) | `X. / XX / X.` | çıkıntı sağda; altına `C3_270` ya da kama | 6 |
| `T4_180` | (1,0)(0,1)(1,1)(1,2) | `.X / XX / .X` | çıkıntı solda | 6 |
| `I3_0` | (0,0)(0,1)(0,2) | `X / X / X` | dikey üçlü; merdiven direği | 8 |
| `S4_0`, `Z4_0` | K-44 tablosu | | Hikaye 2 | 13+ |

Artı (5 hücre) ve 2×3 dikdörtgen: Ws = 2'de yerleşemez (artı) ya da yeni tür gerektirir (2×3; çekirdek + C# eşdeğerlik
+ sanat). Seçenekler: (A) S9 ile Hikaye 2'de artı; (B) 2×3'ü tür olarak eklemek; **seçim A**, 2×3 MVP dışı (plan Σ'yı 6
hücre yer, blok sayısını düşürür). Ağır Yük (I5, Q9) ayrı kalır.

### 8.3 Blok özellikleri (özet; kurallar GDD ÖNERİ K-57…K-61 ve K-65, kartlar OBSTACLES)

| Kimlik | Ad | Tek cümle kural | Ne görünür (G1b) | Hangi kararı yaratır | Zorluk etkisi | Çözücü etkisi | İlk |
|---|---|---|---|---|---|---|---|
| Y10 | Palet | Yalnız en üst katman alınır; palet son katmana kadar yer kaplar | gri-mavi metal kızak dudağı (16 design px) + katman çentikleri (**D-108 ile geçersiz:** katman sayısı "×n" beyaz daire rozeti, GDD K-65 madde 4); Hikaye 1'de tek tipli | paletin altındaki bloğa ulaşmak için paleti ne zaman boşaltmalı (karar Bölüm 4'te ölçülür) | + küçük (park baskısı) | durum × Π(kᵢ+1); ayak izi küçüldüğü için saha uzayı küçülür | 3 |
| Y9 | İki Renkli | Her hücre kendi rengine oturmalı (dönüş yok) | tek dış kontur, hücre başına renk + sembol, 2 perçinli dikiş | yön / aynalı ikiz kararı | + orta | ×1; D3a sınıfı renk deseniyle | 5 |
| Y11 | Sargı + Makas | Sargılı tutulamaz; makaslı doğru yerleşince bütün sargılar kalkar | konturdan 4 design px taşan buruşuk film kenarı, tek yatay kurdele + fiyonk; sağ üstte makas rozeti | uzaktan sıra bağımlılığı (makası önce kaz) | + orta | ×1 (sargı durumu makasın bölgesinden türetilir) | 7 |
| Y12 | Bonus | Doğru yerleşince +2 hamle; Hikaye 1'de ödül anı | krem zeminli hamle rozeti "+2" (HUD hamle simgesi), altın dolgu yok | yok (Hikaye 1); Hikaye 2'de bağlayıcı son tarihle öncelik | − (ödül) | `k` = 0'da yok; `k` = 1'de K-62 zamanlama kanıtı | 9 |
| Y13 | Kaygan | Sahada desteksiz kalamaz, düşer | buz sırı | park yeri (yükseğe park yok) | + küçük | uzayı küçültür | 13 |

### 8.4 Saha ve şantiye boyutları (K-49, K-02 v3 ayak izi; G1b)

`pal.cap` = `pallet_capacity` alt sınırı `2 + max(hücre × (katman − 1))` (GDD ÖNERİ K-58 madde 8); E bu değerden küçük
olamaz. "Üst satır" = sahada duvar tepesinin üstünde kalan satır var mı (Karar 9).

| # | Saha Wy×Hy (C) | Şantiye Ws×Hs × S | H / duvar | Σ | Ayak izi F | E (bant) | Palet (tek tipli) | `pal.cap` | Üst satır | Görünen öğe |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 5×4 (20) | 2×4 × 2 | 4 / 3 | 16 | 16 | 4 (2–8) | — | — | y3 (yalnız dikey blokların üst hücresi) | 8 |
| 2 | 6×5 (30) | 2×6 × 2 | 6 / 5 | 24 | 24 | 6 (2–12) | — | — | yok | 8 |
| 3 | 6×5 (30) | 2×6 × 2 | 6 / 5 | 24 | 20 | 10 (2–12) | `D2_90` W×2, `D2_90` G×2 | 4 | yok | 8 |
| 4 | 6×5 (30) | 2×6 × 2 | 6 / 5 | 24 | 20 | 10 (2–12) | `D2_90` W×3 | 6 | yok | 8 |
| 5 | 6×5 (30) | 2×6 × 2 | 6 / 5 | 24 | 20 | 10 (2–12) | `D2_90` R×3 | 6 | yok | 10 |
| 6 | 6×6 (36) | 2×6 × 3 | 6 / 5 | 36 | 30 | 6 (2–14) | `D2_90` "YW"×3, `D2_90` G×2 | 6 | y5 (B + `liftRatio`) | 11 |
| 7 | 6×5 (30) | 2×7 × 2 | 7 / 5 | 28 | 24 | 6 (2–12) | `D2_0` G×3 | 6 | yok | 12 |
| 8 | 6×6 (36) | 2×6 × 3 | 6 / 5 | 36 | 28 | 8 (2–14) | `D2_90` G×3, `D2_90` "GY"×3 | 6 | y5 (B + `liftRatio`) | 12 |
| 9 | 6×6 (36) | 2×6 × 3 | 6 / 5 | 36 | 30 | 6 (2–14) | `D2_90` G×3, `D2_90` Y×2 | 6 | y5 (B + `liftRatio`) | 13 |
| 10 | 6×6 (36) | 2×6 × 3 | 6 / 5 | 36 | 32 | 4 (2–14) | `D2_90` "WY"×2, `D2_90` Y×2 | 4 | y5 (B + `liftRatio`) | 14 |

Boy 3 şekilli bölümlerde (2, 3, 6, 8, 9, 10) duvar ≤ H − 1 (K-56 açık yükseklik). Bölüm 3–5 sahası G1b'de 6×4'ten 6×5'e
büyüdü ve duvar 5'e çıktı: `pal.cap` sağlanır (G1'de Bölüm 4 E 4 < 6 idi, DL-V3-10), saha üst satırı duvar tepesinin
altında kalır (Karar 9 A) ve görünen öğe sayısı 8'in altına düşmez (DL-V3-17). Görünen öğe = başta sahada görünen
tekil blok + palet sayısı; eğri 8, 8, 8, 8, 10, 11, 12, 12, 13, 14 tekdüze artar. 6×7 ve 6×8 sahalar Hikaye 2'de
(N 18–22) kullanılır (Karar 6).

### 8.5 Blok sayısı eğrisi ve hamle bütçesi

| # | N (blok) | Şekil türü | Özellikli blok (G1b) | `min` hedefi | P (K-52) | Bonus `B·k` | Hamle (taslak, `a` = 0) |
|---|---|---|---|---|---|---|---|
| 1 | 8 | 1 (D2, iki yönelim) | 0 | 8 (ölçüldü) | 4 | — | 12 |
| 2 | 8 | 3 (L4, J4, D2) | 0 | 8 (ölçüldü) | 4 | — | 12 |
| 3 | 10 | 2 (L4, D2) | 4 palet katmanı (2 palet × 2) | 11–12 | 4 | — | min + 4 |
| 4 | 10 | 2 (C3, D2) | 3 palet katmanı | 12–13 | 4 | — | min + 4 |
| 5 | 12 | 1 (D2) + iki renk | 4 iki renkli, 3 palet katmanı | 14–15 | 4 (tanıtım) | — | min + 4 |
| 6 | 14 | 3 (C3, T4, D2) | 5 iki renkli (3'ü palette), 5 palet katmanı | 17–18 | 2 | — | min + 2 |
| 7 | 14 | 1 (D2) + iki renk | 3 sargılı, 1 makas, 2 iki renkli, 3 palet katmanı | 17–18 | 4 (tanıtım) | — | min + 4 |
| 8 | 16 | 2 (I3, D2) | 7 iki renkli (3'ü palette), 2 sargılı, 1 makas, 6 palet katmanı | 19–20 | 2 | — | min + 2 |
| 9 | 16 | 2 (L4, D2) | 4 iki renkli, 1 bonus (ödül), 5 palet katmanı | 19–20 | 4 (tanıtım) | 0 (`k` = 0) | min + 4 |
| 10 | 16 | 3 (C3, T4, D2) | 7 iki renkli (2'si palette), 2 sargılı, 1 makas, 4 palet katmanı | 20 | 1 | — (bonus yok, G1b) | 21 |

Toplam 124 blok (bugün 70; +%77). Yatay tek renkli domino payı %39 (bugün %70); tek renkli plan satırı 69/142 = %49
(bugün %96). `minMoves` ≤ 20 her bölümde. Hamle bütçesi K-52 D-099 tablosu; Hikaye 1'de bonus her zaman saf paydır
(ÖNERİ K-62, `k` = 0), bu yüzden bugünkü `moves_budget` doğrulayıcısı değişmeden geçerlidir. `a` orta bot ölçümünden
sonra (P-A2-2, P-F1-1 açık). Bölüm 10'un sayacı artık `min`'in altında görünmez (G1'deki 19 < 20 sorunu, DL-V3-07).

### 8.6 Zorluk bandı, eğri ve kapılar (Karar 5; G1b ölçütleri)

| # | Etiket | Puan | Kazanma (orta bot) | `greedyWin` | `ahaMin` | `minShifts` | `firstNeedDepth` | `parkSlack` | `branch3` | YAO | `liftRatio` | `shapeDecisions` | `traitDelta` |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Kolay (tanıtım S1) | 1 | ≥ %95 | ≥ 0,95 | 0 | 0 | 0 | — | ≥ 0,40 | 1,00 | ≥ 0,60 | izle | — |
| 2 | Kolay | 2 | ≥ %92 | ≥ 0,90 | 0 | 0–1 | 0 | — | ≥ 0,20 | 1,00 | ≥ 0,60 | izle | — |
| 3 | Kolay (tanıtım Y10) | 2 | ≥ %92 | ≥ 0,85 | 0 | 1–2 | 0–1 | ≥ 1,5 | 0,25–0,50 | 1,00 | ≥ 0,60 | izle | izle (kural öğrenme) |
| 4 | Kolay | 3 | ≥ %90 | ≥ 0,75 | 0–1 | 2–3 | 1 | ≥ 1,0 | 0,20–0,45 | 1,00 | ≥ 0,60 | izle | Y10 ≥ 10 |
| 5 | Normal (tanıtım Y9) | 4 | %80–90 | 0,50–0,90 | 0–1 | 2–3 | 1 | 1,0–2,0 | 0,20–0,40 | ≥ 0,75 | ≥ 0,60 | ≥ 2 | Y9 ≥ 10 |
| 6 | Normal | 5 | %65–80 | 0,30–0,70 | 1 | 3–4 | 1–2 | 1,0–1,5 | 0,15–0,35 | ≥ 0,70 | ≥ 0,60 | ≥ 2 | — |
| 7 | Normal (tanıtım Y11) | 5 | %80–90 | 0,50–0,90 | 0–1 | 3–4 | 2 | 1,0–2,0 | 0,15–0,35 | ≥ 0,70 | ≥ 0,60 | ≥ 2 | Y11 ≥ 10 |
| 8 | Normal | 6 | %65–80 | 0,30–0,60 | 1–2 | 3–4 | 1–2 | 0,8–1,5 | 0,15–0,30 | ≥ 0,70 | ≥ 0,60 | ≥ 2 | — |
| 9 | Normal (tanıtım Y12) | 6 | %75–85 | 0,50–0,80 | 1 | 3–4 | 1–2 | 0,8–1,5 | 0,15–0,30 | ≥ 0,70 | ≥ 0,60 | ≥ 2 | Y12 muaf (ödül) |
| 10 | **Zor** | 8 | **%50–60** | 0,10–0,30 | 1–2 | 3–4 | ≤ 2 | 0,6–1,2 | **0,10–0,20** | ≥ 0,60 | ≥ 0,60 | ≥ 2 | — |

Bütün satırlarda: `trapCount` 0 ve `deadRate` 0 (Bölüm 10 dahil: v3 finalinin zorluğu tuzaktan değil sıradan ve
paydan gelir), `complete` evet, `maxDigRun` ≤ 3, `firstNeedDepth` ≤ 2 (P5: final ödülsüz açılmaz). `forced` sütunu
P-F1-1 revizyonu bitene kadar izlenir, bant konmaz. Ölçüt tanımları GDD ÖNERİ K-64'tedir. **Kapı** sütunları: `liftRatio`
her bölümde, `shapeDecisions` Normal ve Zor'da, `traitDelta` yazılı bölümlerde kapıdır (tutmazsa bölüm yeniden
tasarlanır: `liftRatio` için Karar 9 A; `shapeDecisions` için aynalı ikiz ya da çıkıntılı şekil eklenir; `traitDelta`
için özelliğin kararı derinleştirilir: makas bir kazı daha aşağı, palet bir gereken bloğun üstüne). Y10'un `traitDelta`
kapısı Bölüm 3'te değil Bölüm 4'tedir: Bölüm 3 kuralı öğretir (Kolay, ≥ %92), karar Bölüm 4'te doğar (paleti boşaltıp
altındaki köşeye ulaşmak). **Koridor testi (DL-V3-08 madde 3):** Bölüm 3, 5 ve 7 gri kutu tahtasıyla 5 kişiye
oynatılır; geçme ölçütü "özelliği ilk 60 saniyede doğru kullandı" ≥ 4/5 ve "bir daha oynar mısın: evet" ≥ 4/5. Test
geçilmeden bu bölümlerin sanatı (kaplama kareleri) bağlayıcı sayılmaz.

### 8.7 Bölüm planları (Usta Kral'ın kasabası Renkli Tepe, Hikaye 1 "Ağaç Ev")

Plan satırları yukarıdan aşağıya (K-15). "Denetim" sütunu product-lead karalama aracının plan düzeyi tuzak taramasıdır
(bütün alttan-üste doğru yerleşim sıraları; erişim, palet sırası, sargı ve bonus hariç; resmî değildir). G1b'de bütün
satırlar yeniden koşuldu: hepsi çözülebilir, ✓-tuzağı 0. Renkler bölüm başına: 1 W/Y · 2–3 W/Y/G · 4–5 W/Y/R · 6 W/Y/G ·
7 G/R/Y · 8–10 W/Y/G (R ilk kez 4'te, tek renkli ve öğreticisiz; DL-V3-16).

| # | Dilimler (yukarıdan aşağıya) | Bloklar (palet = tek tipli yığın) | Denetim |
|---|---|---|---|
| 1 | `["WY","WY","YW","YW"]` / `["YY","WW","YY","WW"]` | D2_0 W×2, D2_0 Y×2, D2_90 W×2, D2_90 Y×2 | 15 durum, ✓-tuzağı 0 |
| 2 | `["YW","YW","WW","GG","YG","YG"]` / `["GY","GY","GG","YW","YW","WW"]` | L4_0 G, L4_180 G, J4_0 W×2, D2_0 Y×4 | 11 durum, 0 |
| 3 | `["WW","YY","WW","GG","YG","YG"]` / `["GG","YY","GG","WW","YW","YW"]` | D2_0 Y×2, L4_180 G, L4_180 W, D2_90 Y×2, palet A D2_90 W×2, palet B D2_90 G×2 | 13 durum, 0 |
| 4 | `["WW","YY","RY","RR","WW","WW"]` / `["WW","WW","YY","RY","RR","YY"]` | C3_0 R×2, C3_180 Y×2, D2_90 Y, D2_90 W×2, palet D2_90 W×3 | 13 durum, 0 |
| 5 | `["WW","WY","RR","YW","WY","RR"]` / `["YY","RR","YW","RY","RY","WW"]` | D2_90 "WY"×2, D2_90 "YW"×2, D2_90 W×2, D2_0 R, D2_0 Y, D2_90 Y, palet D2_90 R×3 | 16 durum, 0 |
| 6 | `["YW","YY","GY","GG","GW","WW"]` / `["GG","YY","YW","GG","WY","YW"]` / `["YW","WW","WY","YY","WY","WW"]` | C3_270 W, T4_0 G, C3_180 Y, C3_0 W, T4_180 Y, C3_90 W, D2_90 "WY", D2_90 "YW", D2_90 Y, palet D2_90 "YW"×3, palet D2_90 G×2 | 18 durum, 0 |
| 7 | `["GG","RG","RG","YY","GY","GY","RR"]` / `["GY","GY","RR","YY","GG","RY","YR"]` | D2_90 R×2 (biri makaslı), D2_0 Y×2, D2_0 R, D2_90 Y×2, D2_90 G×2, D2_90 "YR", D2_90 "RY", palet D2_0 G×3; sargılı 3 (D2_90 "YR", D2_90 "RY", bir D2_90 G) | 20 durum, 0 |
| 8 | `["YW","GY","GG","WY","WY","WY"]` / `["YY","WG","WG","WG","GY","GG"]` / `["GY","YG","GG","GW","GW","YY"]` | I3_0 W×2, I3_0 Y, I3_0 G, D2_90 "YW", D2_90 "YG", D2_90 Y×2, D2_90 "GW"×2, palet D2_90 G×3, palet D2_90 "GY"×3; sargılı 2 (bir I3_0 W, D2_90 "YG"), makaslı 1 (D2_90 "YW") | 22 durum, 0 |
| 9 | `["GG","WW","WY","GG","YG","YG"]` / `["YY","GY","WW","YW","YW","GG"]` / `["WW","GG","YY","WG","GW","YY"]` | D2_0 Y×2, L4_180 G, L4_180 W, D2_90 "WY", D2_90 W×2, D2_90 "GY", D2_90 Y, D2_90 "GW", D2_90 "WG", palet D2_90 G×3, palet D2_90 Y×2; bonus 1 (1. katın tekil D2_90 W'si) | 20 durum, 0 |
| 10 | `["YG","GY","GG","WW","YW","YW"]` / `["GW","WW","YW","YY","YG","GG"]` / `["WY","YY","WG","GW","YY","WY"]` | D2_0 Y, D2_0 W, D2_90 W, D2_90 G, D2_90 "GY", D2_90 "YG", C3_270 G, T4_0 Y, C3_180 W, D2_90 "GW"×2, D2_90 "WG", palet D2_90 "WY"×2, palet D2_90 Y×2; sargılı 2 (T4_0 Y, 2. katın D2_90 "GW"'si), makaslı 1 (1. katın D2_90 W'si) | 21 durum, 0 |

Hikaye 1 kısıtları (GDD ÖNERİ K-65) her satırda sağlanır: palet tek tipli ve bayraksız; blok başına en çok bir kaplama
özelliği (sargı, makas, bonus ya da palet katmanı olmak); iki renkli bloklar yalnız W–Y, R–Y, W–G, G–Y; makaslı blok
en az 1 kazı altında ve sargılı bloklara bağımlı değil (`scissors_blocked` / `scissors_trivial`, U-v3-4 üretici
kısıtı). Renk sayısı her bölümde ≤ 3 (K-31, Hikaye 1).

#### Bölüm kartları

**Bölüm 1 — Ağaç Basamakları / Tree Steps** · Kolay (tanıtım S1) · puan 1. *Tek fikir:* kaldır, duvarı aş, bırak; kat
bitince kalanlar sonraki kat için bekler. *Gri kutu (ölçüldü, `levels:solve --dir`, taslak):* saha 5×4, duvar 3.
```
y3  Y W W Y .     a=D2_0 Y (0,2)  b=D2_0 W (1,2)  c=D2_0 W (2,2)  d=D2_0 Y (3,2)
y2  Y W W Y .     e=D2_90 Y (0,1) f=D2_90 W (2,1)
y1  Y Y W W .     g=D2_90 W (0,0) h=D2_90 Y (2,0)
y0  W W Y Y .     x=4 sütunu boş (E 4)
```
Ölçüm: `min` 8, YAO 8/8, `trapCount` 0, `choices@0` 18 (en iyi 4), `branch3` 0,50, `greedyWin` 1,00, beceri botu orta
0,99, 767 033 durum. `liftRatio` 8/8 (her bloğun alt hücresi y ≤ 2, duvar 3). *Öğretici:* (1) `piece:1` drag (kanonik
hamle 1) · `tut.m.lift` · `placementCorrect`; (2) `startOn segmentDone` · `panorama`, `goals` · `tut.m.nextfloor` ·
`placementCorrect`. *Aha:* yok (Kolay); keyif: dikey dominolar dama deseni kurar. 10 saniyede oynanır: ilk hamle
eldivenle gösterilir, 4 dikey blok sahanın tepesinde.

**Bölüm 2 — Köşe Destekleri / Corner Braces** · Kolay · puan 2. *Tek fikir:* yeni şekiller L ve J; çıkıntılı blok
ancak altı dolunca oturur (gölge "!" ve desteksiz hücre işareti söyler). *Gri kutu (ölçüldü; K-44 kilidi yüzünden deneme
kimliği 12 ile):* saha 6×5, duvar 5.
```
y4  . . Y Y . .   a=L4_0 G (0,0)   b=L4_180 G (0,1)
y3  b b Y Y . .   c=J4_0 W (2,0)   d=D2_0 Y (2,1)
y2  a b d c f e   e=J4_0 W (4,0)   f=D2_0 Y (4,1)
y1  a b d c f e   g=D2_0 Y (2,3)   h=D2_0 Y (3,3)
y0  a a c c e e
```
Ölçüm: `min` 8, YAO 8/8, `trapCount` 0, `choices@0` 11, `greedyWin` 1,00, beceri botu orta 0,97, 76 593 durum.
*Öğretici:* (1) `piece:5` (kanonik hamle 1: sağdaki gömülü olmayan dikey Y) · drag · `tut.m.smallfirst` (yeni, niyet:
"Önce küçük blok, sonra köşe.") · `placementCorrect`; (2) `piece:1` (L) · hold · `tut.m.shadow` · `placementCorrect`.
*Aha:* L'yi önce denemek "!" verir; desteksiz hücre kesik kontur + aşağı okla işaretlenir (DL-V3-22, design-lead);
küçük dikey blok konunca L kilitlenir.

**Bölüm 3 — Tuğla Paleti / Brick Pallet** · Kolay (tanıtım Y10) · puan 2. *Tek fikir:* paletten hep en üstteki alınır.
*Gri kutu (niyet):* saha 6×5, duvar 5; palet A W×2 (sağ alt, x4–5 y0) = 1. katın iki W satırı; palet B G×2 (x2–3 y0)
= 2. katın iki G satırı; iki tekil `D2_90` Y ve iki `D2_0` Y paletlerin solunda; 2. katın `L4_180` W'si 1. katın
`L4_180` G'sinin üstünde (1 kazı). *Öğretici:* (1) palet A üst katmanı · drag · `tut.m.pallet` (yeni, niyet: "Paletten
hep üstteki alınır.") · `placementCorrect piece:<A üst>`. *Aha:* yok (Kolay; kural öğrenme). Keyif: W paleti 1. katı,
G paleti 2. katı besler; iki paletten hangisinin bu kata ait olduğu tek bakışta okunur (tek tipli palet, Karar 7).

**Bölüm 4 — Ön Duvar / Front Wall** · Kolay · puan 3 · R rengi ilk kez (öğreticisiz, tek renkli). *Tek fikir
(imzasız):* `C3` köşe çifti; çiftin bir yarısı **paletin altında**. *Gri kutu (niyet):* saha 6×5 (E 10), duvar 5; palet
W×3 (2,1)–(3,1), altında 1. katın `C3_0` R'si (1,0) (sağ kolu (2,0) paletin altında); 1. kat alttan W, W, R-köşe, Y-köşe, W ister: paletin
iki katmanı 1. katın iki alt satırına doğrudan gider, üçüncüsü (en üst satırın W'si) **park edilir** ve R köşe açılır.
*Öğretici:* (1) kapak blok · drag · `tut.m.dig` · `yardMove`. *Aha (0–1):* "paletin son katmanını park et, altındaki
köşe senin". `pallet_capacity` 10 ≥ 6. Y10'un `traitDelta` kapısı bu bölümdedir (§8.6).

**Bölüm 5 — Renkli Pencere / Two-Tone Window** · Normal (tanıtım Y9) · puan 4. *Tek fikir:* iki renkli blok; "WY" ile
"YW" aynalı ikizdir, yerleri farklıdır (W–Y deutan ΔE 68, en güçlü çift). *Gri kutu:* saha 6×5, duvar 5; iki renkli
dört domino saha üstünde yan yana, aynalı çiftler çapraz konumda (yanlış olanı ilk elde); R paleti (×3) sahanın sağ
altında, iki R satırı ve bir R dikeyi için kütle. *Öğretici:* (1) iki renkli blok · hold · `tut.m.twotone` (yeni, niyet:
"Her renk kendi yerine.") · `placementCorrect`. *Aha:* gölge iki hücrede ayrı ✓/! verir; aynalı ikizi bul.

**Bölüm 6 — Uzun Gövde / Tall Trunk** · Normal · puan 5 · ilk 3 katlı bölüm. *Tek fikir (imzasız):* T şekli; T'nin
çıkıntısı altına önce köşe (`C3_270`) gelir. *Gri kutu:* saha 6×6, duvar 5; `C3_270` W 2. katın `T4_180`'i altında (kat
arası örtü), palet "YW"×3 ortada, palet G×2 sağda (her iki palet tek tipli; `pallet_capacity` 6 ≥ 6). Saha y5 satırına
yalnız ilk hamlesi park olan blok konur (Karar 9 B). *Öğretici:* (1) `C3_270` · drag · `tut.m.order` (yeni, niyet: "Önce
alt köşe, sonra T.") · `placementCorrect`. *Aha:* 1 — `C3_270`'i T'den önce koymak; açgözlü T'yi dener, "!" görür ve 1–2
hamle yer. **Ölçüm spike'ı:** v3 çözücü ölçeği bu bölümün taslağıyla ölçülür (§8.10 U-v3-2); sonuç gelmeden 7–10'un JSON'u
yazılmaz.

**Bölüm 7 — Paketli Malzeme / Wrapped Supplies** · Normal (tanıtım Y11) · puan 5 · renkler G/R/Y. *Tek fikir:* makaslı
blok yerleşince paketler açılır. *Gri kutu:* saha 6×5, duvar 5; makaslı `D2_90` R 1. katın tabanı, iki blok altında
(kazı 2; `scissors_trivial` sağlanır); üç sargılı blok (2. katın iki renklileri "YR"/"RY" ve bir `D2_90` G) makasın
yolunu ve desteğini kapatmaz (`scissors_blocked` yok). *Öğretici:* (1) sargılı bloğa dokunuş · tap · `tut.m.wrap` (yeni,
niyet: "Önce makaslı bloğu yerleştir.") · `placementCorrect piece:<makas>`. *Aha:* paketleri kurcalamak boşuna; makası
kaz, tek yerleşim üç bloğu açar. R–Y ikizleri deutan ΔE 59 (G1'deki W–R ΔE 19 yerine).

**Bölüm 8 — İp Merdiven / Rope Ladder** · Normal · puan 6 · Çekiç açılır. *Tek fikir (imzasız):* `I3` direkleri; dikey
üçlüler yan yana 3 satırı birden kapatır. *Gri kutu:* saha 6×6, duvar 5; iki tek tipli palet (G×3, "GY"×3), dört `I3`
sahada dik; iki blok sargılı (bir `I3_0` W ve `D2_90` "YG"), makaslı blok (`D2_90` "YW") bir paletin yanında 2 kazı
altında. *Öğretici (bağlamsal, DL-V3-13):* zorunlu adım yok. Oyuncu sargılı bir bloğa ikinci kez dokunduğunda Çekiç
yuvası parlar ve `tut.m.hammer` (metni güncellenir, niyet: "Çekiç sargıyı keser.") bir kez gösterilir; `done` olayı
`boosterUsed` ya da `placementCorrect piece:<makas>` (hangisi önce gelirse). *Aha:* "makas her şeyi açar, Çekiç
kestirme": makası 2–3 hamlede kazmak iki sargıyı birden açar; Çekiç tek sargıyı keser ve yine kazandırır.

**Bölüm 9 — Çatı Altı / Under the Roof** · Normal (tanıtım Y12) · puan 6 · renkler W/Y/G. *Tek fikir:* bonus blok
yerine oturunca +2 hamle verir (ödül anı; Hikaye 1'de bütçe dışı, `k` = 0). *Gri kutu:* saha 6×6, duvar 5; bonus blok 1.
katın tekil `D2_90` W'si, G paletinin yanında 1 kazı altında; palet G×3 ve Y×2 tek tipli. *Öğretici:* (1) bonus blok,
`moves` · drag · `tut.m.bonus` (yeni, niyet: "Bonus blok iki hamle verir.") · `placementCorrect piece:<bonus>`. *Aha (1):*
şekilden gelir, bonustan değil: 2. katın `L4_180` W'sinin sol sütunu askıdadır; önce sol alttaki `D2_0` Y konmalı
(K-34). Bonusun hissi: rozet sayaca uçar, sayaç zıplar.

**Bölüm 10 — Ağaç Ev Tamam! / Treehouse Done!** · **Zor** · puan 8 · Vinç açılır · renkler W/Y/G. *Tek fikir (final):*
öğrenilenlerin birleşimi, en çok 3 özellik (iki renkli, palet, sargı + makas; bonus yok, DL-V3-15). İki aha: (a) makaslı
blok (1. katın `D2_90` W'si) Y paletinin **altında**; paletin iki katmanı da 3. katın: paleti boşaltmak için katmanları
şimdi park et (yukarıdaki boş satırlara), 2. katın iki sargısı makasla açılır; (b) 2. katın `T4_0` Y'si 1. katın iki
renklilerinin altında: 1. kat bitmeden T'nin çıkıntı yerini aç. Bütün ikizler güçlü çiftlerden (G–Y "GY"/"YG", W–G
"GW"/"WG", W–Y palet). *Gri kutu:* saha 6×6, E 4, `pallet_capacity` 4 ≥ 4, `firstNeedDepth` ≤ 2 (ilk yerleşim en geç 3.
hamlede). Hamle 21 (`min` 20 + P 1). *Öğretici:* (1) `startOn segmentDone` · `booster:crane` · tap · `tut.m.cranebooster`
· `boosterUsed` (bugünkü gibi). *Aha:* 2 adım, ikisi de görünür bilgiyle (panorama + tek tipli palet).

**Bölüm 11 (not):** nefes bölümü (testere dişi); W1 Sabit Geçit'in tanıtımı (Karar 4).

**Hikaye 2 notu (G1b):** karışık palet (Karar 7 B), bonusun bağlayıcı son tarihi (K-62 `k` = 1) ve Y13 Kaygan Hikaye
2'nin sırasıyla birer tanıtım bölümünde gelir; her biri bölüm başına bir yeni fikir kuralına uyar.

### 8.8 Tuzak kuralı v3 (üretici kısıtı; GDD ÖNERİ K-63)

1. Her renk için tek renkli bloklar tek "alt satırı dolu" aile (`D2_90` | `O4_0` | `C3_0` | `C3_270` | `L4_0` | `J4_0`)
   ve tek "sütun" aile (`D2_0` | `I3_0` | L/J/T sütunu) taşır; iki aile ancak K-34 ile korunuyorsa (biri öbürünün
   bloğu yerleşmeden oraya inemez) birlikte bulunur. Örnek ihlal: `C3_0` G + `D2_90` G (Bölüm 4 ilk taslağı).
2. Aynı iki renkli desen üst üste iki satırda bulunursa o iki rengin dikey dominoları bölümde bulunmaz (aksi halde
   `D2_0` çifti 2×2'yi kapar).
3. Kama (`B1`) yalnız rengi bölümde başka tek hücrede bulunmayan yerde kullanılır; 1–10'da kullanılmaz.
4. Sonraki katın bloğu, önceki katın bölgesine ancak önceki kat onu tüketiyorsa uyabilir (dilim sırası korur):
   Bölüm 10'da tek `D2_90` G 1. katta tükenir, bu yüzden 2. katın `C3_270` G'si güvenlidir.
5. Hikaye 1'de palet tek tiplidir (K-65 madde 1); sıra kuralı yalnız "paletin altındaki blok" ile ilgilidir: paletin
   altındaki gereken blok en çok 1 park ile açılır (Kolay'da 0–1, Normal'de en çok 2, Zor'da en çok 2 katman park).
6. (G1b) Duvar tepesinin üstündeki saha satırına (y ≥ `height`) yalnız kanonik çözümde ilk hamlesi park olan blok konur
   (Karar 9 B). Makaslı blok en az 1 kazı altındadır ve şantiye desteği ile sahadan çıkışı sargılı bloğa bağlı değildir
   (K-59 madde 6).

### 8.9 Sunum ve his notları (design-lead'e; JUICE/ASSET_LIST önerisi; G1b'de inceleme bulgularına göre)

Palet: açık gri-mavi metal kızak (nötr `ui` tonu; ahşap rengi ve damar yok, DL-V3-02), 2 çıta, yalnız bloğun altında 16
design px dudak; katman sayısı dudakta 2–4 **çentikle** gösterilir, rakam yok (DL-V3-03; **D-108 ile geçersiz:** katman
sayısı "×n" beyaz daire rozetiyle gösterilir, GDD K-65 madde 4, OBSTACLES Y10); katman başına 6 design px
yükselen gölge "yığın" okunurluğu verir (DL-V3-17); üst katman kalkınca alttaki 120 ms "pop". Hikaye 2'de karışık palet
için "sonraki katman" kenarı (28 design px, sembollü) ve basılı tutunca gözetleme (400 ms yelpaze, hamle harcamaz).
İki renkli: tek dış kontur, hücre başına renk + sembol, renk sınırında koyu oluk değil 2 perçinli dikiş (Ø 14 design px;
DL-V3-06). Sargı: konturdan 4 design px taşan buruşuk film kenarı (%35 beyaz), tek yatay kurdele, üst ortada 48 design
px fiyonk; çapraz çizgi ve kilit yok, sembol %100 görünür (DL-V3-04); makaslı blokta sağ üstte 56 design px makas rozeti
(krem zemin, koyu kontur); makaslı yerleşince kurdeleler kesilip savrulur (tek hamlede bütün paketler). Bonus: HUD hamle
simgesi + "+2" rozeti, krem zemin, `ui.ink` 4 px kontur, Ø 56 design px, sağ üst köşe, altın dolgu yok; taç, kral ve
altın-mor kullanılmaz (DL-V3-03, DL-V3-20); yerleşince rozet sayaca uçar, sayaç zıplar. Bir blokta en çok bir rakamlı
rozet (K-65 madde 4). Kaygan: buz sırı, düşüşte kayma izi. K-34 desteksiz hücre: 2 px kesik kontur + aşağı ok
(DL-V3-22). Unity'de hücre maskesi karoları şekli zaten çizer; **yeni kaplama/ikon kareleri (8):** palet dudağı +
çentik, sonraki katman kenarı (Hikaye 2), film kenarı, yatay kurdele + fiyonk, makas rozeti, hamle rozeti (+n), perçinli
dikiş, desteksiz hücre işareti; buz sırı Hikaye 2. Yeni öğretici anahtarları: `tut.m.smallfirst`, `tut.m.pallet`,
`tut.m.twotone`, `tut.m.order`, `tut.m.wrap`, `tut.m.bonus`; metni güncellenecek: `tut.m.hammer`. Bilgi kartları:
`obs.y9.desc` … `obs.y13.desc` (OBSTACLES; EN yazımı "color", DL-V3-19).

### 8.10 Uygulama notları (code-lead'e; U-v3)

**U-v3-0 Hata H1 (önce):** L-11 `tileLevel` (core/level/logic.ts 806–818) yalnız en alçak sütunu örter; çıkıntılı
şekillerde (`L4_180`, `J4_180`, `C3_180`, `T4_*`) çözülebilir planı `dead` sayar (oyun testi raporu H1, taslak kanıtı
orada). **Kapsam (G1b, DL-V3-18):** yalnız doğrulayıcı; çalışma zamanı `tileRemaining` (core/deadlock.ts 21–25) her
sütun yüksekliğine oturan blokla dallanır ve doğrudur, oyunda yanlış Söküm beklenmez. Düzeltme: alt hücreleri sütun
yüksekliklerine oturan her (sınıf, çapa) çiftiyle dallan; bellek anahtarı değişmez. Yeni şekillerden önce kapanır (yanlış
`untileable` üreticiyi kör eder).

**U-v3-1 Şema (geriye uyumlu, `schemaVersion` 3 önerisi).** Seçenekler: (A) her özellik `obstacles[]` kaydı; (B) blok
başına `traits` dizisi; (C) mevcut `flags` dizisini genişletmek + veri taşıyan özellikler için ayrı alan. **Öneri C:**
`flags` enum'una `wrapped`, `scissors`, `bonus`, `slippery` eklenir (K-21 bayrak sistemi, Zobrist ve kural eklentisi
zaten var; `obstacles[]` hücreye bağlı nesneler içindir, bloğa değil). Veri taşıyanlar ayrı isteğe bağlı alan:
`colors: string` (Y9; uzunluk = hücre sayısı), `stack: { id: 0–7, z: 0–3 }` (Y10), `bonusMoves: 1–3` (Y12). Yeni
alanların hepsi isteğe bağlıdır; `schemaVersion` 2 dosyaları değişmeden geçerlidir. `schemaVersion` 3 yalnız yeni alan
kullanan dosyaya yazılır ve eski istemcinin dosyayı açıkça reddetmesini sağlar (`RULES_VERSION` 3 → 4, K-43 madde 4).
Doğrulayıcı kodları (G1b ile tam liste):

| Kod | Düzey | Kural | Ne zaman |
|---|---|---|---|
| `colors_invalid` | error | K-57 | `colors` uzunluğu hücre sayısı değil ya da tek renk |
| `colors_low_contrast` | error (Hikaye 1) | K-65 madde 3 | iki renkli blokta izinli çift dışı renk çifti |
| `stack_invalid` | error | K-58 | aynı `id`'de şekil/çapa farkı, `z` boşluğu, katman sayısı 2–4 dışı |
| `stack_mixed` | error (Hikaye 1) | K-65 madde 1 | palet katmanları aynı `color`/`colors`/`flags` taşımıyor |
| `pallet_capacity` | error (Kolay), warn (Normal/Zor; solver kanıtı varsa susar) | K-58 madde 8 | `E < 2 + max(hücre × (katman − 1))` |
| `scissors_missing` / `scissors_many` | error | K-59 madde 2 | sargı var, makas yok / birden çok makas |
| `scissors_blocked` | error | K-59 madde 6 | makasın kanonik kat sırasındaki yerleşimi ya da sahadan çıkışı sargılı bir bloğa bağlı |
| `scissors_trivial` | warn | K-59 madde 6 | makaslı blok başta en az 1 kazı altında değil |
| `bonus_many` | error | K-60 | bölümde 2'den çok bonus blok |
| `bonus_late` | error | K-62 | `k` = 1 iken zamanlama kanıtı yok (Hikaye 1'de `k` = 0, kod çalışmaz) |
| `trait_overlay_many` | warn (Hikaye 1) | K-65 madde 2 | blokta birden çok kaplama özelliği |
| `flag_combo_forbidden` | error | OBSTACLES v3 birleşim tablosu | yasak birleşim (ör. bonus + wet: iki rakamlı rozet) |
| `piece_unreachable` | error | K-56 | şekil hiçbir girişten geçemiyor |
| `tile_family_mix` | warn | K-63 | aile karışımı (solver kanıtı varsa susar) |

İmza tablosu Y9–Y13 ve `KIND_FIRST_CHAPTER`/K-44 kilidi (L4/J4 → 1. hikaye 2. bölüm, T4 → 6, I3 → 8) aynı pakette;
mevcut `shape_locked` kuralı bölüm numarasıyla ince ayar ister. Çekirdek: palet = katman başına parça + `stackBelow`
ilişkisi; tutulabilirlik ve `R` hesabı K-58; sargı bayrağı K-35 adım 5'te makasın `locked` durumundan; bonus adım 4b;
güçlendirici hedef kümeleri K-66; D1 genişlemesi (K-30 ÖNERİ değişikliği, GDD §16). TS ↔ C# eşdeğerliği (D-091) golden +
fuzz kâhiniyle.

**U-v3-2 Çözücü ölçeği (G1b: seçim B, olmazsa A; DL-V3-14).** Ölçüm: 5×4 sahada 8 blokla tam tarama 767 033 durum / 30 sn
(Bölüm 1 v3 taslağı); 6×6 sahada 16 blok tam taramayla bitmez. Öneri katmanları: (1) `min`, kanonik çözüm,
`minShifts`: A* (h = kalan malzeme bloğu + erişilemez gereken blok başına 1; kabul edilebilir) ya da IDA*; (2) çıkmazlık
ve D1 kapısı: §7 U-4 madde 2 **makro çizge** (saha sıfırlama eşdeğerliği). Palet bu eşdeğerliği bozar (kaldırılan katman
palete dönemez): makro düğüme "palet yükseklikleri" vektörü eklenir; kaldırılmış katman ilk bırakıldığı yeri çapa sayar.
Sargı ve bonus makasın/bonusun yerleşim durumundan türer (ek durum yok). (3) `trapCount`, `choices@k`, `greedyWin`:
kapsam K'de ışın araması + beceri botu vekili örneklemesi. **Kanıt sınıfı:** ışın araması `trapCount` ve "bütün uzayda
ölü masa yok" (K-51 madde 2) için kanıt değildir. Seçenekler: (A) Bölüm 6–10'u tam taramanın bittiği boyuta indir; (B)
makro çizgeyi **sağlamlık testiyle** kabul et: tam taramanın bittiği bütün bölümlerde (v2 1–10, v3 1–5 taslakları) makro
çizgenin ölü durum kümesi tam taramanınkiyle birebir aynı çıkmalı, palet dahil; (C) kapıyı istatistiğe çevir (sahibin
"kurallar korunur" şartını bozar, RET). **Seçim B, başarısızsa A.** A'nın somut biçimi: Bölüm 6–10 iki katlı (Σ 24–28),
saha 6×5, N 12–14 (palet katmanları korunur; 3 katlı final Hikaye 2'ye). **Sıra:** Bölüm 6 taslağıyla ölçüm spike'ı
yapılır (süre, bellek, `complete`, D3a "bilinmiyor" oranı); spike sonucu gelmeden Bölüm 7–10 JSON'u yazılmaz. D3a
açılım sınırı `D3A_MAX_EXPANSIONS` = 20 000 (deadlock.ts:67) ile 16 blokta "bilinmiyor" oranı ölçülür; oran > %1 ise
sınır artırılır ya da bölüm A'ya iner ("bilinmiyor" çıkmaz sayılmaz, Söküm gecikir). Kapı: Bölüm 1–10 v3'ün her biri
≤ 120 sn, ≤ 2 GB; `complete` evet. Kanıt yoksa §6.3 kuralı: saha küçültülür.

**U-v3-3 Ölçütler (GDD ÖNERİ K-64).** `greedyWin` ikili kalıyorsa (P-F1-1) Tablo §8.6 bantları beceri botu bandına
çevrilir. Kapı ölçütleri: `liftRatio`, `shapeDecisions`, `traitDelta` (tanımlar K-64; bantlar §8.6). İzleme ölçütleri:
`visibleAtStart`, `stackParks` (palet katmanı park sayısı), `unwrapAt` (makasın yerleştiği hamle / `min`), `bonusAt`.
`traitDelta` için orta bot bir **yok sayan** kipiyle koşar: Y9'da iki renkli bloğu ilk hücresinin rengiyle tek renkli
sanar, Y10'da paletin ayak izini ilk katman kalkınca boşalmış sanar, Y11'de makaslı bloğa öncelik vermez; fark = orta
bot kazanma oranı − yok sayan kip oranı (yüzde puanı, 500 oyun).

**U-v3-4 Üretici (`levels:gen`) parametreleri.** Girdi: plan dilimleri (§8.7), blok çoklu kümesi, palet listesi
(şekil, renk, katman sayısı), özellik atamaları, saha boyutu; kısıtlar: K-02 ayak izi bandı, `pallet_capacity`, §8.8
tuzak kuralı (madde 6 dahil), açık yükseklik (K-56), K-65 Hikaye 1 kısıtları, `firstNeedDepth` ≤ 2, `maxDigRun` ≤ 3;
amaç: §8.6 satırının bantları (önce `ahaMin`, `greedyWin`, `parkSlack`, `liftRatio`, sonra `minShifts`). Arama:
rastgele yerleşim + yerel arama (takas/kaydırma), tohum `id × 1000 + id` (belirlenimci); her aday hızlı ölçütle (A*
`min`, kapsam K tuzak) elenir, son 5 aday tam kapıdan geçer.

### 8.11 Açık sorular (orkestratöre)

1. Karar 5: "Kolay 1–3 / Normal 4–7 / Zor 8–10" bölüm numarası mı, puan mı? (Öneri: puan; testere dişi korunur.)
2. Karar 6: Bölüm 10 N = 16 ve `min` 20 kabul mü, yoksa N ≥ 18 için `min` sınırı 24'e mi çıksın? 6×7 / 6×8 sahaların
   Hikaye 2 finaline kaldığı proje sahibine açıkça bildirilsin (DL-V3-21).
3. Karar 4: W1/W2/Y5/W3'ün Hikaye 2'ye taşınması (OBSTACLES ilk bölüm değişiklikleri) onaylanıyor mu?
4. ~~ÖNERİ K-62 bonus bütçesi (`k`)~~ — **G1b'de kapandı:** Hikaye 1'de `k` = 0 (ödül anı); `k` = 1 yalnız Hikaye 2'de
   bağlayıcı son tarihle (DL-V3-07 seçenek B).
5. (G1b) Karar 7: karışık palet Hikaye 1'den tamamen çıktı (design-lead'in seçimi "L6'dan 2 katmanla" idi; gerekçe
   K-45 madde 10). Orkestratör onaylasın.
6. (G1b) D-101 (Usta Kral) web `DECISIONS.md`'ye yazılsın (DL-V3-20; orkestratör dosyası).
7. (G1b) Koridor testi (§8.6) için 5 kişilik oyuncu bulma ve gri kutu derlemesi kimin işi? (Öneri: code-lead derleme,
   proje sahibi oyuncu.)

### 8.12 E2 bölüm turu sonucu (product-lead, 2026-11-09) — ölçülen gerçek ve v3.2 ÖNERİ

**Ne yapıldı.** `levels/level_001…010.json` v3 planına göre yeniden kuruldu (Tablo A, §6.6, E2 notu). Her bölüm için
rastgele + yerçekimli yerleşim adayları üretildi (bölüm başına 16–60 aday), hepsi resmî `levels:solve` ile tam tarandı
(`--max-states 2 500 000`), sonra seçilen aday elle bitirildi (Bölüm 1, 2 ve 7 elle kuruldu). Toplam ≈ 650 aday tarandı.
`levels:validate` 10/10 temiz; `levels:solve` 10/10 çözülür, tuzak 0, `deadRate` 0, yakalanmayan çıkmaz 0, D1 0, YAO 1,00,
hamle bütçesi K-52 bandında; **6 hata kalır: `shape_decisions_low` (Bölüm 5–10)** — aşağıda B3. Playtest botu
(`levels:bot`, WP-N) hâlâ yok; oranlar **beceri botu vekilidir** (tam DP, ε acemi 0,25 · orta 0,12 · usta 0,06).

**Tanıtım sırası (gerçekleşen).** 1 S1 (D2 iki yönelim) · 2 L4/J4 · 3 C3 · 4 R rengi + aynalı C3 · 5 Y9 İki Renkli ·
6 T4 · 7 Y11 Sargı + Makas · 8 I3 (Çekiç açılır) · 9 Y12 Bonus · 10 final (Vinç açılır). Bölüm başına en çok bir yeni
fikir (K-45 madde 10); `teaches`: 1 S1, 5 Y9, 7 Y11, 9 Y12. Y10 Palet bu turda **yok** (B1).

| # | Etiket | Hedef (G1b §8.5–8.6) | Gerçek: saha / şantiye / E | N (hedef → gerçek) | Şekiller · özellik | `min` (N + kazı) | hamle | `firstNeedDepth` | durum sayısı | beceri botu a / o / u | orta bot bandı | kapı durumu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Kolay (tanıtım S1) | ≥ %95 | 5×4 / 2×4×2 / 4 | 8 → 8 | D2 | 8 (8+0) | 12 | 0 | 767 033 | 0,89 / 0,99 / 1,00 | ✓ | yeşil |
| 2 | Kolay | ≥ %92 | 6×5 / 2×6×2 / 6 | 8 → 8 | D2, L4, J4 | 8 (8+0) | 12 | 0 | 76 593 | 0,76 / 0,97 / 1,00 | ✓ | yeşil |
| 3 | Kolay | ≥ %92 | 6×4 / 2×5×2 / 4 | 10 → 8 | D2, C3 | 10 (8+2) | 14 | 2 | 90 554 | 0,75 / 0,97 / 1,00 | ✓ | yeşil |
| 4 | Kolay | ≥ %90 | 6×4 / 2×5×2 / 4 | 10 → 8 | D2, C3 (4 yönelim) | 10 (8+2) | 14 | 1 | 106 100 | 0,70 / 0,96 / 0,99 | ✓ | yeşil |
| 5 | Normal (tanıtım Y9) | %80–90 | 5×4 / 2×4×2 / 4 | 12 → 8 | D2 · 4 iki renkli | 10 (8+2) | 14 | 2 | 289 240 | 0,62 / 0,93 / 0,99 | +3 puan üstte | `shape_decisions_low` |
| 6 | Normal | %65–80 | 6×4 / 2×5×2 / 4 | 14 → 8 | D2, C3, T4 · 1 iki renkli | 10 (8+2) | 12 | 1 | 640 996 | 0,45 / 0,83 / 0,96 | +3 puan üstte | `shape_decisions_low` |
| 7 | Normal (tanıtım Y11) | %80–90 | 6×4 / 2×5×2 / 4 | 14 → 9 | D2, C3 · 2 sargılı, 1 makas, 2 iki renkli | 10 (9+1) | 14 | 1 | 634 701 | 0,68 / 0,95 / 0,99 | +5 puan üstte | `shape_decisions_low` |
| 8 | Normal | %65–80 | 6×4 / 2×5×2 / 4 | 16 → 8 | D2, C3, I3 | 12 (8+4) | 14 | 3 | 182 718 | 0,32 / 0,73 / 0,91 | ✓ | `shape_decisions_low` |
| 9 | Normal (tanıtım Y12) | %75–85 | 6×4 / 2×5×2 / 4 | 16 → 8 | D2, L4, J4 · 1 bonus (+2), 2 iki renkli | 10 (8+2) | 14 | 1 | 417 473 | 0,72 / 0,96 / 1,00 | +11 puan üstte | `shape_decisions_low` |
| 10 | **Zor** | %50–60 | 6×4 / 2×5×2 / 4 | 16 → 8 | D2, C3, T4 · 1 sargılı, 1 makas, 2 iki renkli | 12 (8+4) | 13 | 3 | 103 142 | 0,15 / 0,49 / 0,74 | −1 puan altta | `shape_decisions_low` |

Toplam blok 81 (A2: 70, G1b hedefi 124). Bütün bölümlerde `liftRatio` 1,00 (v3 dosyalarında ölçüldü; 3 ve 4 `schemaVersion`
2'dir, yeni alan kullanmaz), `trapCount` 0, `undetectedDead` 0, `greedyWin` 1,00 (Bölüm 6, 8, 10'da `puzzle_greedy_easy`
uyarısı; Bölüm 10'da ayrıca `puzzle_greedy_wins`). `levels:check` 10 bölümde 58 sn (4 iş parçacığı, önbelleksiz).

**Eğlence denetimi (her bölüm için "aha" ve karar).** 1: dikey/yatay domino dama deseni, karar 4 (ilk hamlede 18 seçenek).
2: L'yi erken denemek "!" verir; küçük dikey blok önce. 3: ilk köşe iki kapak altında; kapakları "sonraki katın yerine"
park et. 4: iki kırmızı köşe aynı renk ama ayna şekil; yanlış köşe bu katta oturmaz. 5: `WY` / `YW` ikizleri; tek `WY`
gömülü (ilk hamle kazı). 6: T'nin çıkıntısı köşeye yaslanır (alt köşe → T → üst köşe). 7: makas kapak altında; makas oturunca
iki paket birden açılır. 8: iki direk üç satırı birden kapatır; ilk G döşemesi 3 kazı derinde (bölümün Normal'in zor ucu).
9: bonus iki renkli blok üçüncü yerleşim; sayaç +2 zıplar. 10: final; 3 kazı derinde ilk blok, bütçe `min` + 1.
**Ölçülen "aha" (`ahaMin`) her bölümde 0'dır:** kazı var ama açgözlü oyun da kazanır (`greedyWin` 1,00). Bu turun bulmaca
derinliği hedefin altındadır; nedeni B2–B3.

**Bulgular (ölçümle; ayrıntı ve sayılar REVIEW_LOG E2 kaydında).**
- **B1 — Palet (Y10) bugünkü D-090 kapısıyla yayımlanamaz.** 6×4 ve 5×5 sahalarda 2 tek tipli paletli ≈ 40 çözülebilir
  adayın, araç hatası (`unused_block` + `solver_replay_mismatch`) veren 6'sı dışında hepsinde `undetected_dead` > 0 çıktı (4–266 durum). Mekanizma: palet
  katmanı kaldırılınca geri dönemez ve sahada 2 hücre yer kaplar; boş alan **azalabilen tek kaynak** budur. Oyuncu katmanları
  park ederek üst satırı yatay bloklarla mühürler, alttaki dikey cep içinde bir blok kıpırdar (D1 değil), hiçbir blok sahadan
  çıkamaz → D1/D2/D3a yakalamaz, Söküm gelmez. `pallet_capacity` (tek paletin `max`'ı) bunu önlemez.
- **B2 — Tam tarama sınırı blok sayısını 8–9'a bağlar.** 6×4 sahada E = 4 ile 8 parça 0,1–0,8 M durum; 9 parça (2'si sargılı)
  0,63 M; 10 parça (5 sınıf domino) ve 6×5 sahada E = 6–10 her denemede > 2,5 M (`scan_incomplete`). Sargı durumu ancak makas
  yerleşene kadar küçültür. G1b'nin 10–16 blokluk eğrisi (§8.5) ve 6×6 sahalar bu kapıyla kurulamaz.
- **B3 — `shapeDecisions` ≥ 2 kapısı (K-64, L-42) bu ölçekte sağlanamıyor.** 2×2 tek renkli bölgeler (D2_90 ×2 ya da D2_0 ×2),
  aynalı C3'ler ve iki renkli ikizlerle ≈ 300 Normal aday: en yüksek değer 1. Ölçüt "eşit renkli ama başka şekilli doğru
  yerleşim **kesin olarak** daha pahalı" ister; 8 parçalık sahada iki seçenek neredeyse her zaman eşit maliyetlidir. 2×4
  bölgede karışık H/V arz ise tuzak üretir (K-63).
- **B4 — `firstNeedDepth` ≥ 1 ile özdeş sınıflar çatışır.** Aynı sınıftan iki blok varsa ikisi de gömülü olmalı; plan
  ilk ihtiyacı tek kopyalı bloğa verecek biçimde yazıldı (Bölüm 5'te tek `WY`, Bölüm 7'de makas).

**v3.2 ÖNERİ (DECISIONS P-E2-1).** (1) Y10 Palet, code-lead'in iki yolundan biri gelene kadar Hikaye 1 dışında: (a) D3b
erişim tablosu (K-30; solver çıkmaz listesini bölümle dağıtır) ya da (b) **K-58 madde 9 ÖNERİ: palet katmanı yalnız
şantiyeye bırakılabilir, sahaya park edilemez** (boş alan hiç azalmaz → yeni erişim çıkmazı doğmaz; L4 "son katmanı park et"
aha'sı "hangi paletten çekeceğini seç"e döner). Benim tercihim (b): kural basit, kanıtı ucuz, sunumu tek cümle. (2) K-64
`shapeDecisions` Hikaye 1'de **izlenir** (kapı değil); kapı makro çizge ile bölüm ölçeği büyüyünce (Hikaye 2) ≥ 1 ile
başlar. (3) Blok sayısı eğrisi Hikaye 1'de 8–9'da kalır; 10–16 blok ve 6×6 sahalar makro çizge (U-v3-2 seçim B)
kanıtlanınca gelir. (4) Bölüm 6–10'un bulmaca derinliği (`ahaMin` ≥ 1, `greedyWin` < 0,70) için code-lead'in `levels:gen`
v3'ü bu sabit-nesne planlarıyla (§8.12 tablosu) ve `--max-states 2 500 000` ile koşulur; ilk tur bu belgeyle kapanır.

**Açık iş (bu turda yapılmadı, sahibi):** LEVELS §0 "JSON eşlemesi" listesi, §1 eğri tablosu ve §2 bölüm kartları (blok
tablosu, gri kutu, öğretici listesi, kanonik çözüm metni) yeni JSON'a göre yeniden yazılmadı (product-lead, sonraki tur;
`tests/review/data.review.test.ts` bu bölümleri JSON'la karşılaştırır). Testlerin içerik sabitleri (code-lead): REVIEW_LOG
E2 kaydı.

### 8.13 v3c — Bölüm 6–10 yeniden planı: 3 sütunlu şantiye, palet yalnız şantiyeye, bonus ödül anı (KABUL kararlarının planı, product-lead paketi P1, 2026-11-09)

Sahip: product-lead · Durum: **plan; yayın verisi ve sapmalar §8.14'te (P3, 2026-11-12)** (kurallar KABUL: D-103, D-104, D-105; GDD K-49, K-56 "D-103 eki", K-58 madde 9,
K-60 madde 6–7, K-62, K-63 "D-103 eki"). Bu alt bölüm JSON değildir: `levels/level_006…010.json` bu pakette değişmez;
yayın verisi v3b (701b8f3) kalır, v3c JSON'u code-lead'in U-v3c paketi (aşağıda) ve product-lead'in bölüm turu ile gelir.
Testler bu alt bölümü okumaz. Yöntem: stüdyo şablonu (game-designer: oyuncu fantezisi ve "aha"; level-designer: blok
kütlesi, gri kutu, ritim; systems-designer: kapasite ve bütçe hesabı; `balance-check`: bant ve bütçe).

**Kararların bu plana çevrilişi (özet).** D-103: Bölüm 6–10 Ws = 3, 9 sütunluk tahta (6 saha + 3 şantiye), hücre 108
design px (K-49 madde 5); Bölüm 1–5 Ws = 2 kalır. D-104: palet katmanı yalnız şantiyeye gider (sahaya iptal, şantiyede
hatalıysa kendi paletine geri seker); Hikaye 1'de palet yerdedir; `pallet_capacity` kalkar; palet 4 bölümde (7 tanıtım,
8, 9, 10). D-105: bonus her yerde ödül anıdır (`k` = 0); 7 ve 9'da birer bonus, doğru yerleşince "+2" patlaması.

#### 8.13.1 Bölüm 1–5 kontrolü (değişmez)

| # | Saha / şantiye (JSON) | Ws | v3c kurallarıyla durum |
|---|---|---|---|
| 1 | 5×4 / 2×4 | 2 | K-49 madde 2 (Ws = 2) ✓; palet, bonus, 3 genişlikli şekil yok → K-58/K-62/K-56 eki etkilemez |
| 2 | 6×5 / 2×6 | 2 | ✓ (L4/J4 dikey; 2 genişlik) |
| 3 | 5×5 / 2×5 | 2 | ✓ |
| 4 | 6×5 / 2×4 | 2 | ✓ |
| 5 | 6×6 / 2×5 | 2 | ✓ (Y9 tanıtımı; iki renkli çiftler W–Y, R–Y, W–G — K-65 madde 3'ün v3c metniyle uyumlu) |

Bölüm 1–5'in planı, JSON'u ve bütçesi değişmez. Açık kalan tek nokta v3b'den gelir: Bölüm 5'te 10 000 yürüyüşte 182
örnekten 1 yakalanmayan çıkmaz tahmini (D-102 madde 4); v3c bunu değiştirmez, code-lead'in makro çizge kanıtını bekler.

#### 8.13.2 Kapasite hesabı (systems-designer): neden 17–20 blok, neden palet

Sabitler: saha en çok 6×8 (C = 48; K-49), K-02 `E = C − F ≥ 2`, domino payı ≤ %50, `min` ≤ 22. Bunlardan:
1. **Plan alanı alt sınırı:** N blokta en çok ⌊N/2⌋ domino (2 hücre), kalanlar en az 3 hücre (C3) → `Σ ≥ 2·⌊N/2⌋ +
   3·⌈N/2⌉`. N = 18 → Σ ≥ 45; N = 20 → 50; N = 22 → 55. Ws = 3'te Σ = 3 · Hs · S ∈ {45, 48, 54, 60, …}.
2. **Saha tavanı:** paletsiz `F = Σ ≤ 46`. Paletsiz bölümde N ≤ 18 ve yalnız Σ 45; N = 18 Σ 45 bütün 9 domino dışı bloğu
   C3 yapar (şekil çeşitliliği yok). Bu yüzden **Bölüm 6 (paletsiz) N = 17**: 8 domino + 7 C3 + 2 geniş L/J = Σ 45.
3. **Palet kazancı:** k katmanlı, s hücreli palet ayak izini `s · (k − 1)` azaltır (D2×3 → 4, C3×3 → 6). Σ 54 olan
   bölümlerde iki palet (4 + 6 = 10) `F = 44, E = 4` verir.
4. **`min` sınırı:** `min = N + minShifts` (cam/harç yok). Final için en az 2 kazı ("aha" için sıra kararı) → N ≤ 20.
   **Bölüm 10 N = 20** (D-103'ün 22 hedefinden 2 eksik; 22 blokla `min` ≤ 22 yalnız sıfır kazıyla mümkün, final
   düşünmeden kazanılırdı). Seçenek: `min` tavanı 24'e çıkarsa N 22 + 2 kazı kurulabilir (Σ 60, üç palet, kazanç ≥ 14);
   karar proje sahibinin (§8.13.7 soru 1).

Sonuç eğrisi: **N = 17, 18, 19, 20, 20** (toplam 94; v3b'de 6–10: 14+13+14+14+16 = 71, +%32). Bölüm 1–10 toplamı 141
(v3b 118).

#### 8.13.3 Fikir sırası (game-designer): bölüm başına tek yeni fikir

| # | Yeni fikir (`teaches`) | Pekiştirilen | Neden bu sırada |
|---|---|---|---|
| 6 | **S9 Geniş Şantiye** — 3 sütun, yatay yatan L/J (düz tabanlı `L4_270`, `J4_90`) | iki renkli (5) | Geometri değişikliği tek başına öğretilir; özellik yok |
| 7 | **Y10 Palet** (yalnız şantiyeye) | geniş şantiye; **bonus** ödül anı (yeni fikir sayılmaz, K-60 madde 6) | Kolay bir dilimle; paletin "nereye gider" kuralı tek cümle |
| 8 | **Y11 Sargı + Makas** | palet (2. bölüm), iki renkli | Palet katmanları sargısız (K-65); makas tekil blokta |
| 9 | **Y13 Kaygan** | palet (3.), sargı yok; **bonus** ödül anı | Park kararı: kaygan çukura düşer; palet boşalınca açılan köşe güvenli park yeri |
| 10 | — (final kombinasyon, Zor) | palet + sargı/makas + kaygan + iki renkli + geniş şekiller | Yeni fikir yok (brif ilke 3) |

Bilinçli dışarıda bırakılanlar: **T4 ve I3** kural gereği 6/8'den izinlidir (K-56) ama v3c kullanmaz (beş bölüme beş
fikir sığar; T4/I3 yeni parça olarak birer fikir sayılır). **S4, Z4, P5 (artı)** Ws = 3'te serbesttir (K-56 eki) ama
Hikaye 2'ye kalır; önerilen sıra: 11 I3 kiriş (`I3_90`), 12 T4 çatı (`T4_90` çentik), 13 S4/Z4, 16 P5 artı (Zor 15'ten
sonraki nefes bölümü değil, 16 Normal tanıtım). Bu sıra Hikaye 2 planında kesinleşir.

Tanıtım bölümü bütçe ve bant kuralı (K-52 D-099, §0): 6–9 `teaches` doludur → Normal tanıtım P = 4, orta bot bandı
%80–90. Sonuç: 6–9 nazik, 10 sert. Testere dişini korumak için 9'un hedefi bandın alt yarısıdır (%80–84) ve 10 Zor
bandın üst yarısındadır (%50–60, G1b DL-V3-15).

#### 8.13.4 Bölüm planı tablosu (level-designer)

Plan satırları ve blok koordinatları üretici (`levels:gen` v3c) ile bulunur; aşağıdaki tablo üreticinin girdisidir ve
bölümün kabul ölçütüdür. Renk kümesi her bölümde 3 (K-31). İki renkli çiftler yalnız W–Y, R–Y, W–G (K-65 madde 3).
"Geniş" = 3 genişlikli yönelim (K-56 eki).

| # | Ad (çalışma) | Saha (C) / şantiye (Ws×Hs×S) / H / duvar | Σ | N | Şekil karışımı (domino payı) | Palet (yerde, tek tipli) | F / E | Özellikli bloklar | Renkler |
|---|---|---|---|---|---|---|---|---|---|
| 6 | Geniş Temel | 6×8 (48) / 3×5×3 / 8 / 7 | 45 | 17 | D2 ×8 (D2_0 ×4, D2_90 ×4) · C3 ×7 (dört yönelim) · `L4_270` ×1 · `J4_90` ×1 — %47 | — | 45 / 3 | iki renkli ×2 (D2_90 "WY", "YW") | W Y G |
| 7 | Palet Yığını | 6×8 (48) / 3×4×4 / 8 / 7 | 48 | 18 | D2 ×9 (3'ü palette) · C3 ×6 · `L4_270`, `J4_90`, `L4_0` — %50 | A: `D2_90` W ×3 | 44 / 4 | bonus ×1 (tekil C3, 2. dilim; ödül) | W Y R |
| 8 | Paketli Kat | 6×8 (48) / 3×6×3 / 8 / 7 | 54 | 19 | D2 ×9 (3'ü palette) · C3 ×4 (3'ü palette) · `L4_270`, `J4_90`, `L4_90`, `J4_270`, `L4_0` · O4 ×1 — %47 | A: `D2_90` Y ×3 · B: `C3_0` W ×3 | 44 / 4 | sargılı ×2 (`L4_90`, bir `D2_0`), makas ×1 (tekil C3, 2 kazı altında), iki renkli ×2 ("WG") | W Y G |
| 9 | Kaygan Çatı | 6×8 (48) / 3×6×3 / 8 / 7 | 54 | 20 | D2 ×10 (3'ü palette) · C3 ×6 (3'ü palette) · `L4_270`, `J4_90`, `L4_0`, `J4_0` — %50 | A: `D2_90` G ×3 · B: `C3_270` W ×3 | 44 / 4 | kaygan ×2 (tekil `D2_90`, `D2_0`), bonus ×1 (2. katın ilk tekil bloğu; ödül), iki renkli ×3 ("WY" ×2, "WG") | W Y G |
| 10 | Ağaç Ev Tamam! | 6×8 (48) / 3×6×3 / 8 / 7 | 54 | 20 | D2 ×10 (3'ü palette) · C3 ×6 (3'ü palette) · `L4_90`, `J4_270`, `L4_270`, `J4_90` — %50 | A: `D2_90` Y ×3 · B: `C3_0` G ×3 | 44 / 4 | sargılı ×2, makas ×1 (Y paletinin ihtiyacı olan zeminin altında), kaygan ×1, iki renkli ×4 ("WY" ×2, "WG" ×2) | W Y G |

Ortak: duvar 7 = H − 1 (boyu 3 dikey L4/J4 için açık yükseklik, K-56); saha üst satırı y7 duvar tepesinin üstündedir →
**Karar 9 B** (y7'ye yalnız kanonik çözümde ilk hamlesi park olan blok) ve `liftRatio` ≥ 0,60 kapısı. Palet katmanları
sargılı/makaslı/bonus/kaygan olamaz (K-65 madde 1–2, K-58 madde 9 f). Hikaye 1 paleti yerdedir (y = 0; `C3_0`, `C3_270`,
`D2_90` hepsi tabandan oturur).

**Gri kutu (Bölüm 7, üretici girdisi; diğerleri aynı çerçeve).** `P` palet ayak izi, `#` blok, `.` boş, `|` duvar
(yükseklik 7), sağda 3 sütunluk şantiye (4 katlık dilimin 1. katı, `?` plan):

```
y9  . . . . . .   .   . . .    ← Vinç Alanı (9 sütun boyunca)
y8  . . . . . .   .   . . .
y7  # # . . # .   .   . . .    ← saha üst satırı (duvarın üstü): yalnız ilk hamlesi park olan blok
y6  # # # # # #   |   . . .
y5  # # # # . #   |   . . .
y4  # # # # # #   |   . . .
y3  # # # # # #   |   ? ? ?
y2  # # # # # #   |   ? ? ?
y1  # # # # # #   |   ? ? ?
y0  P P # # # #   |   ? ? ?    ← palet A (D2_90 W ×3) sol alt köşede, üstü (0,1)–(1,1) bir blokla kapalı
     x0 … x5     x5|6  x6–x8
```

#### 8.13.5 Hedef ölçütler (LEVELS §8.6 adlarıyla) ve bütçe

| # | Etiket (puan) | Orta bot / vekil bandı | `minShifts` | `min` hedefi | P | Hamle (`a` = 0) | `firstNeedDepth` | `maxDigRun` | `parkSlack` | YAO | `liftRatio` | `trapCount` / `plan_trap` / `deadRate` | `traitDelta` | `shapeDecisions` | `visibleAtStart` |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 6 | Normal tanıtım S9 (4) | %80–90 | 2–3 | 19–20 | 4 | 23–24 | 1 | ≤ 2 | 1,0–2,0 | ≥ 0,75 | ≥ 0,60 | 0 / 0 / 0 | — (geometri) | izle | ≥ 12 |
| 7 | Normal tanıtım Y10 (4) | %80–90 | 1–2 | 19–20 | 4 | 23–24 | 0–1 | ≤ 2 | 1,0–2,0 | ≥ 0,75 | ≥ 0,60 | 0 / 0 / 0 | izle (kural öğrenme) | izle | ≥ 12 |
| 8 | Normal tanıtım Y11 (5) | %80–90 | 2–3 | 21–22 | 4 | 25–26 | 1–2 | ≤ 3 | 0,8–1,5 | ≥ 0,70 | ≥ 0,60 | 0 / 0 / 0 | Y11 ≥ 10, Y10 ≥ 10 | izle | ≥ 13 |
| 9 | Normal tanıtım Y13 (6) | %80–84 (alt yarı) | 2 | 22 | 4 | 26 | 1–2 | ≤ 3 | 0,8–1,5 | ≥ 0,70 | ≥ 0,60 | 0 / 0 / 0 | Y13 izle; Y12 muaf | izle | ≥ 13 |
| 10 | **Zor** (8) | **%50–60** | 2 | 22 | 1 | 23 | ≤ 2 | ≤ 3 | 0,6–1,2 | ≥ 0,60 | ≥ 0,60 | 0 / 0 / 0 | — | izle | ≥ 14 |

Notlar: (1) Bantlar **bonuslu** orandır (K-62: bot bonusu gerçek oyundaki gibi alır). Bonus `traitDelta`'dan muaftır.
(2) `ahaMin` ve `greedyWin` bu ölçekte tam çizge istediğinden ölçülemez (v3b CL-V3-03); yerine oyun vekili (`policy.loose`)
ve beceri botu vekili raporlanır; bölüm 10'da `policy.loose` ≤ 0,50 (açgözlü oyun kaybeder). (3) `shapeDecisions`
Hikaye 1'de izleme ölçütüdür (P-E2-1 madde 3; L-42 uyarı). (4) **Ölü masa kapısı (D-090) bu ölçekte:** `plan_trap` tam
tarama (kanıt) + 10 000 yürüyüşte yakalanmayan çıkmaz 0 (tahmin; CL-V3-01 B) + D3a "bilinmiyor" oranı < %1. Makro çizge
kanıtı (U-v3-2 B) gelene kadar bu bölümler "tahminle geçti" etiketi taşır (§8.13.7 soru 2). (5) `min` çözücünün en iyi
bulduğu değerdir (ışın araması); alt sınırla farkı > 2 ise bütçe `alt sınır + P` ile yeniden denetlenir (bot bandı
tutmazsa bölüm yeniden üretilir).

#### 8.13.6 Öğretici, "aha" ve tasarım niyeti

| # | Öğretici (K-53, ≤ 2 adım) | Beklenen "aha" (oyuncu ne keşfetmeli) | Tasarım niyeti |
|---|---|---|---|
| 6 | 1 adım: `tut.m.widesite` «Şantiye genişledi: yatay blok da sığar.» / «The site is wider: flat blocks fit too.» (el, `L4_270`'i 1. katın düz tabanına gösterir; `done: placeCorrect`) | "Yatay L bir satırı tek hamlede kapatır ama çıkıntısı bir köşeyi yükseltir: o köşenin yanına gelecek C3'ü buna göre seç." | 3 sütunlu planda şekil yönü kararı; iki renkli ikizler (5'ten) tuzak kırıcı olarak satır ortasında |
| 7 | 2 adım: `tut.m.pallet` «Paletten hep en üstteki alınır.»; `tut.m.palletsite` «Palet bloğu yalnız şantiyeye gider.» / «Pallet blocks go only to the site.» (ikinci adım ilk iptalde ya da ilk palet yerleşiminde) | "Paletin üç W'si üç ayrı kata gider; paleti erken boşaltan sol alt köşede iki park hücresi kazanır." Bonus: 2. dilimde tekil C3 → "+2" patlar | Paletin kuralı tek cümle; karar kolay: palet sahayı tıkamaz, boşalınca yer açar. Bonus ilk kez görülür (ödül) |
| 8 | 1 adım: `tut.m.wrap` «Önce makaslı bloğu yerleştir.» (mevcut anahtar) | "Makas iki kazı altında; üstündeki Y paletinin iki katmanını şantiyeye vermek hem kazıdır hem inşa. Makas oturunca iki paket birden açılır." | Uzaktan sıra bağımlılığı; palet katmanları kazı yerine yerleşimle "kazar" (palet pekiştirme: `traitDelta` Y10) |
| 9 | 1 adım: `tut.m.slippery` «Kaygan blok boşlukta durmaz, kayar.» / «Slippery blocks slide into gaps.» (yeni anahtar; el, kaygan bloğu düz zemine gösterir) | "Kaygan bloğu kazdığın çukura park edersen düşüp gereken bloğu yeniden gömer; paletin boşalttığı düz köşe güvenli park yeri." | Park yeri kararı; palet boşaltma zamanlaması kaygan için yer açar. Bonus 2. katta (ödül) |
| 10 | 0 adım (final) | "Önce makas, sonra Y paleti: makasın oturacağı zemin paletin ilk iki katmanı; kaygan blok en son boşalan palet köşesine." Bütçe `min + 1`: bir yanlış kazı affedilir, iki yanlış kaybettirir | Kombinasyon finali; zorluk tuzaktan değil sıradan ve paydan (`trapCount` 0) |

Yeni i18n anahtarları (TR/EN; ton denetimi design-lead, ekleme code-lead): `tut.m.widesite`, `tut.m.palletsite`,
`tut.m.slippery`; `obs.y10.desc` için önerilen ek cümle OBSTACLES Y10 kartında (i18n değişikliği code-lead). STORY §6A listesine eklenmeleri gerekir (D-017).

#### 8.13.7 Açık sorular (orkestratöre / proje sahibine)

1. **Blok sayısı 17/18/19/20/20 (D-103 hedefi 18/18/20/20/22).** 6'da 17: paletsiz bölümde 6×8 saha tavanı (Σ ≤ 46) ile
   şekil çeşitliliği birlikte en çok 17'ye izin verir (18 yalnız D2 + C3 ile olur). 10'da 20: `min` ≤ 22 ile 22 blok
   sıfır kazı demektir. Seçenek A (önerim): bu eğri. Seçenek B: `min` tavanı 24 → Bölüm 10 N 22 (Σ 60, üç palet),
   Bölüm 6 N 18 (yalnız D2 + C3).
2. **D-090 kanıt sınıfı.** 17–20 blokta tam tarama bitmez; kapı `plan_trap` (kanıt) + rastgele yürüyüş (tahmin) +
   D3a "bilinmiyor" < %1'dir. Makro çizge (U-v3-2 B) gelene kadar bu bölümlerin "ölü masa yok" iddiası tahmindir.
   Proje sahibi bu kanıt sınıfını yayın için kabul ediyor mu?
3. **Hücre 108 px** (K-49 madde 5): D-103'teki 112 yerine; yan pay 27 px. design-lead ve code-lead onaylasın.
4. **T4 ve I3 6–10'da yok** (çeşitlilik ↔ tek yeni fikir). v3b'deki T4 (6) ve I3 (8–10) kalkar; yerine geniş L/J/C3
   yönelimleri gelir. Kabul mü?
5. **6–9'un dördü tanıtım** (S9, Y10, Y11, Y13) → P 4 ve %80–90 bandı; final Zor'a sert geçiş. Alternatif: kaygan
   Hikaye 2'ye (13) kalır, 9 Normal pekiştirme (P 2, %65–80) olur ve eğri yumuşar. Önerim: alternatif; ancak bu
   paketin listesi kaygan istediği için plan kaygan ile yazıldı.

#### 8.13.8 Uygulama notları (code-lead'e; U-v3c)

**U-v3c-1 Ağırlık hatası (önce).** `src/core/shapes.ts` `heavy: w >= 3 || ALWAYS_HEAVY.has(kind)` bugün bütün 3
genişlikli yönelimleri (`I3_90`, `L4_90/270`, `J4_90/270`, `T4_90/270`, `S4_90`, `Z4_90`) Ağır Yük sayar: duvarı hiç
aşamazlar ve D-103 boşa çıkar. GDD K-44 "Ağırlık (Faz 2R)" yalnız I5/Q9'u ağır sayar. Düzeltme: `heavy =
ALWAYS_HEAVY.has(kind)`; TECH §3 "Y5: w ≥ 3" cümlesi ve C# eşi aynı pakette. Test adı: "K-44 K-49 3-wide material crosses
the wall".

**U-v3c-2 Yeni tür P5.** `SHAPE_KINDS` sonuna `P5` (mevcut indeksler ve Zobrist anahtarları değişmesin; 0..51 → 0..55),
`BASE_CELLS.P5 = [[1,0],[0,1],[1,1],[2,1],[1,2]]`, dört yönelim `P5_0`'a indirgenir. Kanonik sıra (K-50 madde 4) dizge
sırasıyla kendiliğinden `O4` < `P5` < `Q9`. `KIND_FIRST_LEVEL_V3.P5` = 16 (Hikaye 2 planı), ama Ws = 3 bölümde S4, Z4,
P5 için `shape_locked` üretilmez (K-56 eki madde 2). Unity: hücre maskesi karoları genel; P5 için sanat gerekmez
(design-lead teyit).

**U-v3c-3 Doğrulayıcı.** L-28: `board_too_wide` eşiği Wy + Ws > 9; Ws ∈ {2, 3}; Ws = 3 yalnız `id ≥ 6` (`size_out_of_range`,
yol `site.cols`); Ws 4 aralığı kalkar. `pallet_capacity` kalkar (K-58 madde 8). Yeni: `pallet_not_grounded` (error,
Hikaye 1; K-58 madde 9 g), `plan_trap` (K-63 eki; Ws = 3 bölümde zorunlu tam tarama; Hikaye 1'de error). `tile_family_mix`
Ws = 3'te üretilmez. `flag_combo_forbidden`: `stack` + `slippery`/`mortar`/`glass` (OBSTACLES v3 birleşim tablosu zaten
✗). `bonus_late` emekli (üretilmez). K-65 madde 3 metni G–Y'siz (kod zaten öyle).

**U-v3c-4 Palet katmanı yalnız şantiyeye (K-58 madde 9).** Tutulan katmanın `R` kümesi: şantiye konumları (doğru ve
hatalı) + başlangıç (iptal). Bırakma sonucu park/saha içi taşıma olacaksa → iptal, olay `cancelled { pieceId, reason:
'palletSiteOnly' }`, maliyet 0. Hatalı şantiye yerleşimi → K-07 maliyeti 1, Usta Serisi 0, katman eski `z` ve `stackBelow`
ilişkisiyle paletine döner (K-17 adım 1–3 atlanır). Vinç'in saha hedefi palet katmanı için kapalı. Geri Al / Söküm
değişmez (çekirdek tampon). Çözücü hamle üreticisi palet katmanı için yalnız şantiye hamlesi üretir (dallanma azalır).
Unity sunumu: sahanın üstündeki katman "iptal" görünümü (design-lead, UX).

**U-v3c-5 3 sütunda yerleşim ve D3a.** K-34, `buildFront`, `verdict.missingSupport`, Altın Mala `P` kümesi ve D3a
`tileRemaining` sütun döngüleri Ws'den bağımsız olmalı (bugünkü kodda `Ws = 2` varsayımı aranmalı: `site.ts`,
`placement.ts`, `deadlock.ts`). U-v3-0 H1 düzeltmesi düz olmayan profilleri (`T4_90` 1,0,1; `P5_0` 1,0,1; `L4_90` 0,1,1)
kapsamalı. D3a bellek anahtarı = (dilim, üç sütun yüksekliği, kalan çoklu küme). Ölçüm: 20 bloklu Bölüm 9–10
taslaklarında D3a "bilinmiyor" oranı `D3A_MAX_EXPANSIONS` = 20 000 ile; > %1 ise sınır artırılır ya da bölüm küçülür.
Performans kapısı: hamle sonu hattı 4× CPU yavaşlatmada kare bütçesini aşmaz (`npm run perf`).

**U-v3c-6 Bonus olayı (K-60 madde 7, K-62).** Adım 4: `movesChanged { reason: 'bonus', delta: bonusMoves, pieceId }`
(alan eksikse eklenir). Unity `LevelHud`: sayaçta "+n" patlaması, ses, karakter kısa sevinci, toplam ≤ 900 ms, giriş
kilitlenmez; "(+2)" ön gösterimi yok. Doğrulayıcı bütçe formülü değişmez. Bot ve vekiller bonusu uygular.

**U-v3c-7 Yerleşim: hücre basamağı (K-49 madde 5).** `BoardLayout.AdaptiveCellPx` (Unity) ve web `createLayout`: sütun
sayısı 9 iken hücre 108 (12'nin katı), duvar `WallW · k` = 54, tahta 1026, yan pay 27. Bugünkü formül `max(CellPx=120, …)`
9 sütunda 120 verir ve tahta 1140 px olur (ekrandan taşar); taban 9 sütun için 108'e iner. Tepsi kenar payı kuralı
(UX §5.8 madde 9, `min(24, yardX − 32)`) 27 px'te yan kenar çizmez. Ekran görüntüleri 390×844 ve 360×800'de 9 sütunlu
bir tahta ile (design-lead incelemesi). Dokunma: 108 design px, 390 CSS px genişlikte ≈ 39 CSS px (bugünkü 120 → 43).

**U-v3c-8 Üretici ve çözücü parametreleri (`levels:gen` v3c).** Girdi: §8.13.4 satırı (boyutlar, Σ, N, şekil çoklu
kümesi, paletler, özellik atamaları, renk kümesi). Kısıtlar: `plan_trap` 0; palet yerde; domino payı ≤ %50; Karar 9 B;
K-02 bandı; `firstNeedDepth` ≤ 2; `maxDigRun` ≤ 3; makas en az 1 kazı altında ve `scissors_blocked` yok; kaygan blok
başta desteğinde. Amaç: §8.13.5 bantları (önce `liftRatio`, `minShifts`, vekil bandı). Plan üretimi önce yapılır
(plan + blok kümesi, `plan_trap` tam tarama), sonra saha yerleşimi aranır. Kapı: bölüm başına ≤ 120 sn, ≤ 2 GB; ışın
genişliği 8–512; yürüyüş 10 000; tohum `id × 1000 + id`.

**U-v3c-9 Mekanik ilk bölüm tablosu.** OBSTACLES "Veri imzası" ve `mechanics.ts` `firstLevel`: S9 6, Y10 7, Y12 7, Y11 8,
Y13 9. v3b JSON'u (Y13 Bölüm 8, Y11 Bölüm 7) bu tabloyla çakıştığı için tablo v3c JSON'uyla **aynı commit'te** değişir.

**U-v3c-10 C# eşdeğerliği (D-091).** U-v3c-1…7'nin C# karşılıkları, golden ve DiffFuzz kâhini 3 sütunlu tahtalar ve
palet iptal/geri sekme dizileriyle genişler.

### 8.14 v3c yayını — Bölüm 6–10 (product-lead paketi P3, 2026-11-12)

Sahip: product-lead · Durum: **tarihsel (v3c, P3)** — yayın verisi v3c2'dir (§8.15, paket B1, 2026-11-12). §8.13 planıdır;
bu alt bölüm v3c'nin gerçekleşenini, plandan sapmalarını ve ölçümünü yazar. Yöntem: plan örnekleyici (3 sütunlu dilim döşemeleri, aile kurallı
boyama + `planTrapScan` tepe tırmanışı) → ters oyunla saha kurucu (her blok, ihtiyaç anında sahadan gerçek bir sürükleme
yoluyla çıkabileceği yere konur; kazı = sonraki bir bloğun ihtiyaç duyulan bloğun yolunu kapatması) → resmî
`levels:validate` + `levels:solve` (ışın araması, 10 000 yürüyüşlü çıkmaz kapısı, oyun vekili). Bölüm başına 15–60 aday
tarandı; 1–5 değişmedi ve yeniden doğrulandı (§8.13.1 tablosu geçerli).

#### 8.14.1 Plandan sapmalar (gerekçeli)

1. **Palet şekli (bulgu, GDD K-58 madde 10 ÖNERİ).** Planın `C3_0`/`C3_270` paletleri (§8.13.4, Bölüm 8–10) kurulamaz: alt
   katmanlı üst katmanın her birim ötelemesi kendi ayak izine değer (K-58 madde 4 + K-08), üst katman hiç tutulamaz. Dikey
   `D2_0` paleti yalnız yana çıkar. Hikaye 1'de yalnız yatay `D2_90` paleti kaldı → her bölümde **tek palet `D2_90` ×3**
   (kazanç 4 hücre). Sonuç: Σ 54 ile E ≥ 2 kurulamaz (54 − 4 = 50 > 48); 8 ve 10 Σ 48 (3×4×4), 9 Σ 45 (3×5×3).
2. **Blok sayısı 17 / 18 / 18 / 17 / 19 (toplam 89; plan 17/18/19/20/20 = 94; v3b 71).** Σ 48'de domino payı ≤ %50 ile
   N en çok 19'dur (9 D2 + 10 üçlü); 3 genişlikli L/J kullanılan bölümde 18. Bölüm 9'da T4 (4 hücre) için Σ 45'te N 17.
   D-103'ün 18–22 aralığına 7, 8, 10 girer; 6 ve 9 bir eksik (6×8 saha tavanı + palet şekli). Bölüm 10 `min` 22 (tavan).
3. **Bonus ilk kez Bölüm 10'da** (plan 7 ve 9). Doğrulayıcı L-22 Y12'yi yeni mekanik sayar; 6–9'un her biri zaten bir
   mekanik tanıttığı için bonus oralara giremez. Finalde `teaches` yoktur (bonus öğretilmez, K-60 madde 6); "+2" finalin
   ödül anıdır. Kod önerisi (L-22'de Y12 muaf) REVIEW_LOG'da.
4. **Yerleşim çeşitliliği (CL-V3-04: aynı saha/şantiye/duvar üçlüsü en çok 2 bölümde).** 6 ve 9: 6×8 · 3×5×3 · duvar 7;
   7 ve 8: 6×8 · 3×4×4 · duvar 7; 10: 6×8 · 3×4×4 · **duvar 6** (saha y6–y7 duvarın üstünde; `liftRatio` 0,79).
5. **T4 ve I3 (§8.13.7 soru 4'ün cevabı veriyle):** CL-V3-04 "yeni şekiller" isteği için T4 (`T4_270`) Bölüm 9'da, I3
   (`I3_90`, tam satır) Bölüm 10'da **sade malzeme** olarak var (mekanik değil; öğretici istemez). Bölüm 1–10'da 7 tür.
6. **Öğretici anahtarları:** yeni anahtarlar (`tut.m.widesite`, `tut.m.palletsite`, `tut.m.slippery`) STORY §6A'ya girmeden
   i18n'e eklenemez (i18n testi); bölümler mevcut anahtarlarla çıktı (aşağıda). i18n değişmedi.
7. **Ölçüt adları:** `minShifts`, `firstNeedDepth`, `maxDigRun`, `parkSlack`, `shapeDecisions`, `traitDelta` bu ölçekte
   (tam çizge yok) ölçülmez; yerine "kazı" = en iyi bulunan − N ve oyun vekili raporlanır. Orta bot (`levels:bot`) yok.

#### 8.14.2 Bölüm tablosu (yayın)

| # | Ad (TR / EN) | Etiket · `teaches` | Saha / şantiye / duvar | Σ / F / E | N (domino) | Şekiller | Palet | Özellikli bloklar | Renk | `min` (alt sınır) · kazı | P · hamle | Öğretici |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 6 | Geniş Temel / Wide Base | Normal · S9 | 6×8 / 3×5×3 / 7 | 45 / 45 / 3 | 17 (7) | D2, C3 ×9, `J4_90` | — | iki renkli ×2 (`D2_0` WY, YW) | W Y G | 19 (18) · 2 | 4 · **23** | `tut.m.pattern` (1 adım) |
| 7 | Palet Yığını / Pallet Stack | Normal · Y10 | 6×8 / 3×4×4 / 7 | 48 / 44 / 4 | 18 (8) | D2, C3 ×8, `L4_0` ×2 | `D2_90` W ×3, (4,0) | — | W Y R | 20 (19) · 2 | 4 · **24** | `tut.m.useall` (palet üst katmanı, 1 adım) |
| 8 | Paketli Kat / Wrapped Floor | Normal · Y11 | 6×8 / 3×4×4 / 7 | 48 / 44 / 4 | 18 (9) | D2, C3 ×6, `L4_270` ×2, `L4_90` | `D2_90` G ×3, (1,0) | makas `C3_270` Y; sargılı `C3_270` Y, `L4_270` Y; iki renkli ×2 (`D2_0` GW, WG) | W Y G | 20 (19) · 2 | 4 · **24** | `tut.m.wrap` (makas, 1 adım) |
| 9 | Kaygan Çatı / Slippery Roof | Normal · Y13 | 6×8 / 3×5×3 / 7 | 45 / 41 / 7 | 17 (7) | D2, C3 ×9, `T4_270` | `D2_90` W ×3, (4,0) | kaygan ×2 (`D2_0` W); iki renkli ×2 (`D2_0` YW) | W Y G | 19 (18) · 2 | 4 · **23** | — (bilgi kartı `obs.y13.desc`) |
| 10 | Ağaç Ev Tamam! / Treehouse Done! | **Zor** · — | 6×8 / 3×4×4 / **6** | 48 / 44 / 4 | 19 (9) | D2, C3 ×9, `I3_90` | `D2_90` G ×3, (2,0) | makas `D2_90` W; sargılı `D2_0` G, `C3_90` W; kaygan `D2_0` G; bonus `C3_180` W (+2); iki renkli ×3 (`C3_90` GWG, WGW; `C3_270` WYW) | W Y G | 22 (20) · 3 | 1 · **23** | `tut.m.cranebooster` (Vinç açılışı, 1 adım) |

Ortak: `plan_trap` 0 (Ws = 3 tam tarama, kanıt), YAO 1,00 (geçit yok), palet yerde (`pallet_not_grounded` yok), palet
katmanı özelliksiz, domino payı ≤ %50, iki renkli çiftler yalnız W–Y ve W–G (K-65 madde 3), her bölümde ≥ 3 şekil türü.
`min` ışın aramasının en iyi bulduğudur (alt sınırla fark ≤ 2, §8.13.5 not 5); bütçe `min + P` (`a` = 0).

#### 8.14.3 Ölçüm (resmî `levels:solve`, önbelleksiz, 2026-11-12)

| # | `min` · alt sınır | Hamle bandı | 10 000 yürüyüş: kazanılan / kurtarılan / çözülmemiş (yoklanan → çözülebilir) | Yakalanmayan çıkmaz (**tahmin**) | Oyun vekili (bütçede / bütçe + N/2) | `liftRatio` | `visibleAtStart` | `unwrapAt` · `bonusAt` | Süre |
|---|---|---|---|---|---|---|---|---|---|
| 6 | 19 · 18 | 23–26 (23) | 9 858 / 0 / 142 (142 → 142) | %0,00 | 0,25 / 0,24 | 1,00 (17/17) | 17 | – | ≈ 45 sn |
| 7 | 20 · 19 | 24–27 (24) | 9 003 / 0 / 997 (200 → 200) | %0,00 | 0,16 / 0,38 | 1,00 (18/18) | 16 | – | ≈ 130 sn |
| 8 | 20 · 19 | 24–27 (24) | 9 932 / 0 / 68 (68 → 68) | %0,00 | 0,35 / 0,68 | 0,94 (17/18) | 16 | 0,35 · – | ≈ 70 sn |
| 9 | 19 · 18 | 23–26 (23) | 9 925 / 0 / 75 (75 → 75) | %0,00 | 0,26 / 0,44 | 1,00 (17/17) | 15 | – | ≈ 265 sn |
| 10 | 22 · 20 | 23–26 (23) | 9 781 / 0 / 219 (200 → 200) | %0,00 | 0,04 / 0,30 | 0,79 (15/19) | 17 | 0,27 · 0,23 | ≈ 600 sn |

**D-090 kanıt sınıfı:** 6–10'da tam durum taraması bitmez; "ölü masa yok" iddiası `plan_trap` 0 (kanıt) + 10 000 rastgele
yürüyüşün çıkmaz kapısıdır ve **tahmindir** (CL-V3-01 B; yoklanan bütün uçlar çözülebilir çıktı). Makro çizge kanıtı
(U-v3-2 B) gelene kadar bu bölümler "tahminle geçti" etiketi taşır (§8.13.7 soru 2). **Bant:** orta bot ve beceri botu
vekili bu ölçekte yok; oyun vekili (görünen doğru yerleşimi hep alan oyuncu) acemi alt sınırıdır. 6–9 tanıtımda vekil
bütçede %16–35 (v3b 6–9: %0–47), 10'da %4 (v3b %0) — testere dişi (9 → 10) vekilde görünür. %80–90 / %50–60 bantları
`levels:bot` gelince doğrulanır (açık).

#### 8.14.4 Gri kutu (saha başlangıcı ve plan)

Hücre: renk + blok harfi (`P` palet, aynı hücrede 3 katman) + işaret (`2` iki renkli, `~` sargılı, `%` makas, `^` kaygan,
`+` bonus). `|` duvarın sahadaki yüksekliği (o satır duvar içinde); işaretsiz satırlar duvarın üstündedir. Sağda
şantiye planı (katlar soldan sağa, satırlar üstten alta).

**Bölüm 6 — Geniş Temel** (saha 6×8, duvar 7; plan katları soldan sağa Kat 1 → Kat 3, satırlar üstten alta)

```
y7  Ga  Ga  Wb  Wb  .   .     
y6  Ga  Wc2 Yd2 Wb  .   Ye   |
y5  Gf  Yc2 Wd2 Wg  Yh  Ye   |
y4  Gf  Gf  Wg  Wg  Yh  Wj   |   YYY  YGG  WWY
y3  Yi  Yi  Yk  Wl  Wj  Wj   |   GGW  YGW  WGY
y2  Gm  Gm  Yk  Wl  Wl  Wl   |   GWW  YWW  GGG
y1  Gm  Gn  Yo  Wp  Wp  Gq   |   WGW  YWY  WGG
y0  Gn  Gn  Yo  Wp  Gq  Gq   |   YGG  WWY  WWW
```

**Bölüm 7 — Palet Yığını** (saha 6×8, duvar 7; plan katları soldan sağa Kat 1 → Kat 4, satırlar üstten alta)

```
y7  Wa  Wa  .   Wb  Wb  .     
y6  Ye  Wa  .   Wb  Rc  Rc   |
y5  Ye  Wf  Wf  Yg  Rd  Rd   |
y4  Ye  Ye  Wf  Yg  Yh  Yh   |
y3  Yi  Yi  .   Yg  Yg  Yh   |   RRR  WWR  WWY  WWY
y2  Rj  Yi  Rk  Wl  Wl  Rm   |   RYY  YWR  YYY  RYY
y1  Rj  Yn  Rk  Yo  Wl  Rm   |   WWY  YWW  YWW  RYY
y0  Yn  Yn  Yo  Yo  WP  WP   |   WRR  YYW  YYW  WWY
```

**Bölüm 8 — Paketli Kat** (saha 6×8, duvar 7; plan katları soldan sağa Kat 1 → Kat 4, satırlar üstten alta)

```
y7  Ga  Ga  Wb  .   .   Wc2   
y6  Wb  Wb  Wb  Yd% Ye  Gc2  |
y5  Wf  Wf  Yd% Yd% Ye  Ye   |
y4  .   Wf  Yg  Yg  Yh  Gi   |
y3  Gj  Gk  Yg  Yh  Yh  Gi   |   WWW  GGG  GGY  GGY
y2  Gj  Gk  Yl~ Ym  Ym  Ym   |   YWG  YYG  GYY  YYY
y1  Gn2 Yl~ Yl~ Ym  .   Yr~  |   YYW  YYG  WYG  YYY
y0  Wn2 GP  GP  Yr~ Yr~ Yr~  |   WWW  YYG  YYG  YGG
```

**Bölüm 9 — Kaygan Çatı** (saha 6×8, duvar 7; plan katları soldan sağa Kat 1 → Kat 3, satırlar üstten alta)

```
y7  .   .   Ga  .   Yb  Yb    
y6  .   Ga  Ga  Ga  Yb  Gc   |
y5  Wd2 Ye  Ye  Yf  Gc  Gc   |
y4  Yd2 Ye  Yf  Yf  Wg2 Wh^  |   YYW  WWW  WWW
y3  Gi  Gi  Yj  Yj  Yg2 Wh^  |   YGW  WGG  YGG
y2  Gi  Yk  Yk  Yj  Gl  Gl   |   GGG  GGG  YYG
y1  Wm^ Yk  Gn  Gn  .   Gl   |   YYG  GYW  YYY
y0  Wm^ .   .   Gn  WP  WP   |   YGG  YYY  WWY
```

**Bölüm 10 — Ağaç Ev Tamam!** (saha 6×8, duvar 6; plan katları soldan sağa Kat 1 → Kat 4, satırlar üstten alta)

```
y7  .   Ga  Ga  Yc  .   .     
y6  Yb  Yb  Yb  Yc  Gd  Gd    
y5  Wf+ Wf+ We% We% Yg  Yg   |
y4  Gh^ Wf+ Wi  Wj2 Gj2 Yg   |
y3  Gh^ Wi  Wi  Gj2 Wk  Wk   |   YWW  WGW  GGG  GGG
y2  Yl  Yl  Gm~ Wn~ Wn~ Wk   |   YWW  GWY  WWG  GWG
y1  Yl  Wo2 Gm~ Wn~ Gs2 Ws2  |   GGW  YYW  WYY  WWW
y0  Wo2 Yo2 GP  GP  Ws2 .    |   YYY  YWW  GGY  GGW
```
#### 8.14.5 Tasarım niyeti, "aha" ve öğretici

| # | Oyuncu ne keşfetmeli ("aha") | Tasarım niyeti | Öğretici (K-53) |
|---|---|---|---|
| 6 | Üç sütunlu kat bir satırda üç hücre ister. İlk gereken blok iki renkli `D2_0` YW ikizidir ve bir G bloğun altındadır (ilk hamle kazı); WY ikizi aynı görünür ama başka satıra oturur — gölge farkı gösterir. | Geniş şantiye tek başına; özellik yok, 2 kazı. | 1 adım `tut.m.pattern` (iki renkli blok vurgulu, `placementCorrect`) |
| 7 | Palet sağ alt köşede, üstünde bloklar: üç W katmanı 3. ve 4. katın W çiftleridir, palet ancak üstündekiler kendi katlarına yerleştikçe açılır. Katmanı sahaya bırakmak iptaldir (hamle yanmaz). Kanonik çözüm: 2 park + 18 yerleşim, palet 16., 17. ve 21. hamlede. | Paletin "yalnız şantiyeye" kuralı cezasız öğrenilir; 3 katman 3 ayrı satır. | 1 adım `tut.m.useall` (palet üst katmanı vurgulu); bilgi kartı `obs.y10.desc` |
| 8 | Makas (`C3_270` Y) sahanın ortasında, üstünde iki blok; makas (kanonik 7. hamle) oturunca alt sıradaki iki paket (`C3_270` Y, `L4_270` Y) birden açılır; paketler açılmadan alt sıra kazılamaz. Palet G'leri son katların malzemesi. | Uzaktan sıra bağımlılığı; palet (2. kullanım) son katların malzemesi. | 1 adım `tut.m.wrap` (makas vurgulu, `placementCorrect` makasla) |
| 9 | Kaygan W'ler (biri yerde, biri bir G yığınının üstünde) desteksiz kalamaz: altındaki blok erken alınırsa kayar ve aşağıdaki gereken bloğu yeniden kapatır; önce kaygan W'yi yerleştir. | Park/sıra kararı; boş alan en geniş bölüm (E 7) — kayacak yer çok. T4 sade malzeme. | Yok (bilgi kartı `obs.y13.desc`); K-53 "en çok 2" sağlanır |
| 10 | Duvar 6: üst iki satır doğrudan kayar ama asıl iş duvar içinde; makas (`D2_90` W) bonus `C3_180`'in yanında, iki paket alt sırada. Bonus erken oturursa +2 hamle tamponu olur (kanonik çözümde 5. hamle); kaygan G iki kez park edilir (çukura değil, düz zemine); bütçe `min + 1`. | Kombinasyon finali (palet + sargı/makas + kaygan + iki renkli C3 + bonus); zorluk tuzaktan değil sıradan ve paydan (`plan_trap` 0). | 1 adım `tut.m.cranebooster` (1. kat bitince, Vinç açılışı) |

#### 8.14.6 Açık sorular (orkestratöre / proje sahibine)

1. **Blok sayısı 17/18/18/17/19** (D-103 hedefi 18–22): kabul mü? Daha fazlası için ya Σ 54 + iki palet (Hikaye 1'de yalnız
   `D2_90` ile E ≥ 2 sağlanmaz) ya da `I3_90` paleti (kazanç 6; I3 Bölüm 8+) gerekir; önerim Hikaye 2'de `I3_90` paleti.
2. **D-090 tahmin sınıfı** (§8.13.7 soru 2) hâlâ açık; 6–10 yürüyüş tahminiyle geçti.
3. **Bonusun yeri:** L-22 Y12 muafiyeti kodlanırsa bonus Bölüm 7 ya da 9'a taşınabilir (plan); şimdilik finalde.
4. **`levels:check` süresi:** Bölüm 10'un çıkmaz kapısı ≈ 10 dk (zor uç durumların yoklaması); CI bütçesi kabul mü?

### 8.15 v3c2 — Bölüm 6–10 yeniden kurulumu ve Bölüm 4–5 boyaması (D-106, D-107, D-108; product-lead paketi B1, 2026-11-12)

Sahip: product-lead · Durum: **yayın verisi** (`levels/level_004…006.json` ve `level_010.json`; Bölüm 7–9 için §8.16 v3c3
yerini alır; §8.14 tarihsel kayıttır).
Kararlar: **D-106** (palet katmanı kendi paletiyle çarpışmaz; GDD K-58 madde 4 ve 10 KABUL, `pallet_stuck` emekli,
`RULES_VERSION` 6), **D-107** (blok hedefleri 6 ≥ 17, 7–9 ≥ 18 [hedef 19–20], 10 ≥ 20; bonus Bölüm 7'de; bantlar ileri
bakış vekiliyle 6–9 %80–90, 10 %50–60, sevkiyatta `policyWin` uyarısı 0), **D-108** (palet görünümü: "×n" beyaz daire
rozet, gri-mavi metal kızak; GDD K-65 madde 4). Kapanan inceleme bulguları: CL-V3C-01 (final zorluğu), -03 (Bölüm 4–5
tuzak), -04 (blok sayısı), -06 (palet tanıtımı + öğretici anahtarları), -09 (LEVELS §1–§2 kartları; test işareti için
code-lead adımı kaldı, aşağıda), -14 (GDD örnekleri). Yöntem: stüdyo `level-designer` (gri kutu, ritim), `systems-designer`
(kapasite, bütçe) ve `balance-check` (bant): plan örnekleyici (3 sütunlu kat döşemeleri, aile kurallı boyama +
`planTrapScan` tepe tırmanışı) → ters oyunla saha kurucu (D-106'ya göre: palet katmanının çıkış yolu kendi paletinin
hücrelerinden geçebilir) → aday başına ışın araması + ileri bakış vekili (eleme 120 oyun) → seçilen aday için resmî
`node tools/solve.ts --check --no-cache --jobs 4 --update-golden` (10 000 yürüyüş, vekil 400 oyun, Wilson %95). Bölüm
başına 15–400 tohum tarandı (Bölüm 10 ≈ 400).

#### 8.15.1 Değişiklikler (v3c → v3c2)

1. **Palet şekilleri (D-106).** Her paletli bölümde başka bir şekil: 7 `O4_0` ×4, 8 `C3_0` ×3, 9 `C3_270` ×3, 10 `C3_0`
   ×4. Kazanç (`s · (k − 1)`): 12 / 6 / 6 / 9 hücre; bu yüzden Σ 54'lük üç katlı planlar 6×8 sahaya sığar (7 ve 10).
2. **Blok sayısı 17 / 20 / 19 / 19 / 20 = 95** (v3c 17 / 18 / 18 / 17 / 19 = 89). D-107 alt sınırlarının hepsi tutar;
   7 hedef aralıkta (20), 8 ve 9 hedefin alt ucunda (19): Σ 48'de domino payı ≤ %50 ile N 19 tavandır (9 D2 + 10 üçlü)
   ve Σ 54'e çıkmak bu bölümlerde ≥ 8 hücre kazançlı ikinci bir palet ister (iki palet = iki ayrılmış kanal, saha
   kurulamadı; §8.15.6).
3. **Bonus 10 → 7** (D-107: palet tanıtımının ödülü). Bölüm 10'da bonus yok: finalin etkin payı `moves − min` = 3'tür
   (v3c'de P 1 + bonus 2 = 3 idi, ama bonus her kazanışta alındığı için gizliydi; şimdi açık ve ölçülü).
4. **Bölüm 4 ve 5 yeniden boyandı** (CL-V3C-03; yerleşim ve şekiller aynı). Plan tuzağı 4 → 0 ve 3 → 0.
5. **Öğreticiler STORY §6A'nın v3c anahtarlarına bağlandı:** 6 `tut.m.widesite`, 7 `tut.m.pallet` + `tut.m.palletsite`,
   9 `tut.m.slippery`; 8 `tut.m.wrap`, 10 `tut.m.cranebooster` aynı.
6. **Zorluk resmî ölçümle** (CL-V3C-01, -13): `targets.policyWin` her v3c2 bölümünde, 400 oyun, Wilson %95 aralığı
   raporda; hamle bütçesi `min + P + a` (K-52 D-099), `a` banda göre seçildi.

#### 8.15.2 Bölüm tablosu (yayın; resmî önbelleksiz `node tools/solve.ts --check --no-cache`, 2026-11-12)

| # | Ad | Etiket · `teaches` | Saha / şantiye / duvar | Σ / F / E | N (domino) | Tekil şekiller | Palet | Özellikli bloklar | `min` (alt sınır) | pay (P + a) · hamle | YAO | `liftRatio` | İleri bakış vekili (ε 0,1, 400 oyun) [Wilson %95] | Yerleştiren vekil (bütçe / + N/2) | 10 000 yürüyüş: kazanılan / kurtarılan / yakalanmayan (tahmin) | Öğretici |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 6 | Geniş Temel | Normal · S9 | 6×8 / 3×5×3 / 7 | 45 / 45 / 3 | 17 (8) | C3 ×7, D2 ×8, L4, T4 | — | iki renkli `D2_90` YW, `D2_0` WG | 19 (18) | 4 · **23** | 17/17 | 0,94 | 0,83 [0,79–0,86] | 0,23 / 0,44 | 9683 / 0 / 0 | `tut.m.widesite` |
| 7 | Palet Yığını | Normal · Y10 | 6×8 / 3×6×3 / 7 | 54 / 42 / 6 | 20 (10) | C3 ×6, D2 ×10 | `O4_0` Y ×4 (0,0) | bonus `D2_0` R | 21 (21) | 4 · **25** | 20/20 | 1 | 0,86 [0,83–0,89] | 0,26 / 0,48 | 7759 / 0 / 0 | `tut.m.pallet`, `tut.m.palletsite` |
| 8 | Paketli Kat | Normal · Y11 | 6×8 / 3×4×4 / 7 | 48 / 42 / 6 | 19 (9) | C3 ×5, D2 ×9, I3 ×2 | `C3_0` W ×3 (4,0) | makas `C3_0` W; sargılı `C3_0` W; sargılı `D2_90` G; iki renkli `D2_90` WG, `D2_0` YW | 20 (20) | 4 · **24** | 19/19 | 0,95 | 0,86 [0,82–0,89] | 0,49 / 0,66 | 9570 / 0 / 0 | `tut.m.wrap` |
| 9 | Kaygan Çatı | Normal · Y13 | 6×8 / 3×4×4 / 7 | 48 / 42 / 6 | 19 (9) | C3 ×2, D2 ×9, I3 ×5 | `C3_270` G ×3 (2,0) | kaygan `D2_0` Y; kaygan `D2_0` W; iki renkli `D2_90` WG, `D2_0` YW | 21 (20) | 4 · **25** | 19/19 | 0,95 | 0,88 [0,84–0,91] | 0,33 / 0,64 | 9877 / 0 / 0 | `tut.m.slippery` |
| 10 | Ağaç Ev Tamam! | **Zor** | 6×8 / 3×6×3 / 6 | 54 / 45 / 3 | 20 (7) | C3 ×7, D2 ×7, I3, L4 | `C3_0` W ×4 (4,0) | makas `D2_0` G; kaygan `D2_0` G; sargılı `D2_0` G; sargılı `I3_90` G; iki renkli `C3_180` YWY, `C3_0` YWY, `C3_90` WYW | 21 (21) | 3 · **24** | 20/20 | 0,85 | 0,54 [0,49–0,59] | 0,45 / 0,54 | 6465 / 0 / 0 | `tut.m.cranebooster` |

Ortak: `plan_trap` 0 (Ws = 3 tam tarama, kanıt), `policyWin` bandı uyarısı **0** (D-107), domino payı ≤ %50, YAO 1,00,
`liftRatio` ≥ 0,85, palet yerde ve bayraksız, iki renkli çiftler yalnız W–Y ve W–G (K-65 madde 3), her bölümde ≥ 3 şekil
türü (Bölüm 6–10 toplamında D2, C3, L4, T4, I3, O4), görünen doğru yerleşimi hep alan vekil bütçe + N/2'de ≤ %70
(`puzzle_greedy_easy` yok; CL-V3-03 testi). Bölüm 7 ve 8'de `min` alt sınıra eşittir (kanıtlı), Bölüm 10'da da; 6 ve
9'da fark 1. Sevkiyatın tek uyarısı Bölüm 5 `tile_family_mix` (§8.15.3).
`levels:check` süresi: önbelleksiz, 4 iş, 10 bölüm ≈ 33 dk; uzun kutup Bölüm 10 (≈ 16 dk: 10 000 yürüyüşün 3 535'i
çözülmemiş uç, 200'ü yoklanır).

#### 8.15.3 Bölüm 4 ve 5 — tuzaksız boyama (CL-V3C-03)

| # | Değişen bloklar (yerleşim ve şekil aynı) | `planTrapScan` | `min` (alt sınır) | 10 000 yürüyüş: kurtarılan (D1/D2/D3a Söküm) · yakalanmayan | İleri bakış vekili bütçede (ε 0 / ε 0,1, 400 oyun) | Kanonik çözüm |
|---|---|---|---|---|---|---|
| 4 | `D2_0` (2,3) W → Y, `D2_0` (0,2) R → W, `D2_0` (0,0) R → Y, `C3_180` (2,0) W → Y | 4 → **0** | 12 (11) | 259 → **0** · 0 | 0,25 / 0,23 → **0,56 / 0,46** | değişti (`eventLogHash` e4f5bf2770578c87) |
| 5 | `D2_90` (0,3) R → W, `D2_0` (5,0) W → Y | 3 → **0** | 14 (13) | 14 → **0** · 1/182 → **0/175** | 0,76 / 0,58 → 0,72 / 0,56 | aynı (`eventLogHash` aa2b8f84c7abebf9) |

Bölüm 4'ün plan satırları: Kat 1 `WW RR RR RR` (aynı), Kat 2 `WY WY YW YW`, Kat 3 `YY WY WY YY`; her katta iki renk.
Bölüm 5'te `tile_family_mix` (warn, K-63 (a)) sürer: R rengi `C3_0` ve `L4_0` iki aileyi karıştırır, `planTrapScan` 0
tuzak kanıtlar; uyarının kanıt varken susması code-lead'e önerildi (REVIEW_LOG B1).

#### 8.15.4 Gri kutu (saha başlangıcı ve plan)

Hücre: renk + blok harfi (§2 kartlarıyla aynı harfler) + işaret (`P` palet, aynı hücrede bütün katmanlar; `2` iki renkli,
`~` sargılı, `%` makas, `^` kaygan, `+` bonus). `|` duvarın sahadaki yüksekliği (o satır duvar içinde). Sağda şantiye
planı (katlar soldan sağa, satırlar üstten alta).

**Bölüm 6 — Geniş Temel** (saha 6×8, duvar 7; plan katları soldan sağa, satırlar üstten alta)

```
y7  Yb  .   Gc  Ya  Ya  .
y6  Yb  Gc  Gc  Gc  Ge  Ge  |
y5  Yd2 Wd2 Gf  Gf  Wg  Ge  |
y4  Wh  Gi  Gi  Gf  Wg  Wg  |  YWY  YWW  YGG
y3  Wh  Gi  Gj  Yk  Gl2 Ym  |  GGY  YWG  YWG
y2  Gj  Gj  Gj  Yk  Wl2 Ym  |  YGW  GGW  WWW
y1  Wn  Wn  Wo  Gp  Gp  Yq  |  YGW  GGG  WWG
y0  Wn  .   Wo  Wo  Gp  Yq  |  GGG  YYG  GGG
```

**Bölüm 7 — Palet Yığını** (saha 6×8, duvar 7; plan katları soldan sağa, satırlar üstten alta)

```
y7  .   .   .   Ya  Ya  Yb
y6  Rc  Rd  .   Ya  Yb  Yb  |
y5  Rc  Rd  .   Wf  Wg  Wh  |  RRR  YYW  WYY
y4  Re  Re  Wf  Wf  Wg  Wh  |  YYR  YWW  WWY
y3  Ri  Wj  Rk  Yl  Yl  Rm+ |  YRW  YYW  YYR
y2  Ri  Wj  Rk  Yl  .   Rm+ |  RRW  YYW  YYR
y1  YqP YqP Rr  Ws  Yt  Yt  |  RYW  RYY  YYR
y0  YqP YqP Rr  Ws  Ws  Yt  |  YYW  RYY  YYR
```

**Bölüm 8 — Paketli Kat** (saha 6×8, duvar 7; plan katları soldan sağa, satırlar üstten alta)

```
y7  .   .   .   .   Ya  Ya
y6  Gc  Ye  Yf  Wd% Wb2 Gb2 |
y5  Gc  Ye  Yf  Wd% Wd% Gg  |
y4  Wh2 Ye  Yf  Gi  Wj~ Gg  |
y3  Yh2 Yl  Yl  Gi  Wj~ Wj~ |  YYG  GGG  WGG  WYY
y2  Gk~ Gk~ Yl  Gm  Gm  Gn  |  YWG  GGY  YYY  WWY
y1  Yo  Yo  Yp  Yp  WsP Gn  |  YWW  WGY  GWY  WYY
y0  .   Yo  .   Yp  WsP WsP |  YWG  WWY  GWW  WWY
```

**Bölüm 9 — Kaygan Çatı** (saha 6×8, duvar 7; plan katları soldan sağa, satırlar üstten alta)

```
y7  Ya  Ya  Ya  .   .   .
y6  Gb  Gb  Gb  Yc  Yc  Yc  |
y5  Gd  Gd  Gd  Ge  Yf  Yg^ |
y4  .   Wh^ Ge  Ge  Yf  Yg^ |
y3  Wj2 Wh^ Wi2 Gi2 Gl  Gl  |  YYY  GGG  WWY  WWG
y2  Yj2 Gk  Gk  Gk  .   Gl  |  GGG  YWG  GGY  WGG
y1  .   Wm  Wm  GqP Wr  Ws  |  YYY  YGW  WGG  WGW
y0  Wn  Wn  GqP GqP Wr  Ws  |  GGG  GGW  YGG  GGW
```

**Bölüm 10 — Ağaç Ev Tamam!** (saha 6×8, duvar 6; plan katları soldan sağa, satırlar üstten alta)

```
y7  Wa  Yb  Yb  .   Wc2 Yc2
y6  Wa  Wa  Yb  .   Yd2 Yc2
y5  Ge  Gf  Yg2 Wg2 Yd2 Wd2 |  GWW  YWG  GGG
y4  Ge  Gf  Wg2 Yh  Gi  Gj% |  GGW  WGG  YYG
y3  Gk^ Yh  Yh  Yh  Gi  Gj% |  YGG  WGG  YWG
y2  Gk^ Yl  Yl  Gm~ Wn  Wn  |  YWG  WWG  WWW
y1  Go  Yl  .   Gm~ WtP Wn  |  WWY  WYY  WWY
y0  Go  Gp~ Gp~ Gp~ WtP WtP |  WWY  WWY  YYY
```

#### 8.15.5 Tasarım niyeti ve "aha" (bölüm başına tek yeni fikir)

| # | Yeni fikir | Oyuncu ne keşfetmeli ("aha") | Tasarım niyeti | Öğretici (K-53, ≤ 2 adım) |
|---|---|---|---|---|
| 6 | S9 Geniş şantiye (3 sütun) | "Düz blok bir satırı tek hamlede kapatır": `T4_270` G tabanı örter, çıkıntısı ortadaki G'ye oturur | Paletsiz tanıtım; ilk gereken düz blok 1 kazı altında; şekil çeşitliliği (D2, C3, L4, T4) blok sayısından önce gelir | `tut.m.widesite` (1 adım; vurgu `T4_270`, doğru yerleşince biter) |
| 7 | Y10 Palet (v3c3, §8.16) | "Paletten yalnız en üstteki alınır ve yalnız şantiyeye gider"; 1. katın kırmızı blokları paletin üstündedir ve başka kata uymaz, kat bitince palet açılır | 1. kat paletin yolunu açar, 2. katın ilk bloğu palet katmanıdır; dört Y katman 2–3. katın kareleri; bonus 2–3. katta "+2" ödülü | `tut.m.pallet` (1. kat bitince, el üst katmanda) + `tut.m.palletsite` |
| 8 | Y11 Sargılı blok + makas (v3c3) | "Makaslı blok yerleşince sargılar açılır": sargılı blok makastan önce gelmez, makası erken çıkarmak gerekir | Makas `e` 1. katın iki bloğunun (`d`, `c`) altında: onlar yerleşince açılır, 1. katı bitirir; iki sargılı blok (`h`, `j`) 2. katın malzemesi; ilk hamle kazı (K-51/1); D2, C3, I3, L4 ile dört şekil ailesi | `tut.m.wrap` (1 adım; vurgu makaslı blok, doğru yerleşince biter) |
| 9 | Y13 Kaygan blok (v3c3) | "Kaygan blok boşlukta durmaz": altı dolmadan yerleştirilemez, sırayı aşağıdan kurmak gerekir | İki kaygan `D2_0` W; L4 ve I3 ile dört aile; 2 kazı | `tut.m.slippery` (1 adım; vurgu ilk kaygan blok, doğru yerleşince biter) |
| 10 | — (Zor final; yeni mekanik yok) | "Vinç gömülü bloğu da taşır"; dar boşlukta (E 3) kazı sırasını önceden planlamak | Hikaye 1'in bütün özellikleri bir arada; bonus yok, etkin pay açık (3) | `tut.m.cranebooster` (1. kat bitince) |

#### 8.15.6 Plandan sapmalar, gerekçeler ve açık sorular

1. **"Paletin üstü başta açık" (CL-V3C-06) 6×8 sahada kurulamaz; yerine "1. kat bitince açık".** Hikaye 1'de palet yerdedir
   (K-58 madde 9 g). Yerdeki 2 genişlikli bir paletin üst katmanının duvarı (yükseklik 7) aşması için üstündeki iki
   sütunun 1–7 satırları boş olmalıdır (12–14 hücre); bölümün bütün boşluğu `E` = 6'dır. Bu yüzden Bölüm 7'de paletin
   üstünde **yalnız 1. katın blokları** durur (kurucu kısıtı): kat bitince yol açıktır ve 2. katın ilk bloğu paletin üst
   katmanıdır. Öğretici adımı `startOn: segmentDone` ile tam o anda açılır (CL-V3C-06'nın ikinci seçeneği), vurgu 1 hamle
   bile tutulamayan bir bloğu göstermez. **Düzeltme (CL-V3C2-01):** bu iddia yalnız kanonik çözüm için doğruydu; 1. katın
   R/W talebini paletin üstündekiler dışındaki bloklar da karşıladığından oyuncuların ≈ %96'sında palet 1. kat bitince
   örtülüydü. v3c3'te (§8.16.3) paletin üstündeki iki R `C3` başka hiçbir kata uymaz (plan tuzağı 0 iken 1. kat ancak
   onlarla biter) ve en üst sıradaki W domino onlara ulaşmak için kalkar; 1. kat bitince palet ε 0 oyunların %98,4'ünde açıktır.
2. **8 ve 9'da 19 blok (hedef 19–20'nin alt ucu).** Σ 48'de domino payı ≤ %50 ile N en çok 19'dur. Σ 54'e çıkmak için
   ≥ 8 hücre kazanç gerekir: ya 4 hücreli bir palet ×3–4 (bu bölümlerde 4 hücreli şekil paletleri `I3` ve `C3`'ün yerini
   alır, N 19'da kalır) ya da iki palet; iki paletin çıkış kanalları sahanın dört sütununu ayırır ve ters oyun kurucusu
   iki paletli Σ 54 taslağında (Bölüm 10 ilk denemesi, 11 tohum) geçerli saha bulamadı. Hikaye 2'de (yüksek saha ya da
   `I3_90` paleti) 20+ kurulur. **Güncelleme (v3c3, CL-V3C2-04):** 8 ve 9 paletsiz birer dörtlüyle 18 bloktur; bir dörtlü ve
   domino ≤ %50 ile Σ 48'de tavan 18'dir (§8.16.1 madde 3, ÖNERİ P-Fl-2).
3. **Bölüm 4 Kolay bandının altında (ileri bakış vekili ε 0 %56, ε 0,1 %46).** CL-V3C-03 yalnız boyama istedi; tuzak 0 oldu, Söküm'le
   kurtarılan yürüyüş 259 → 0 düştü, ama 2 derin kazı (1 adım ileri bakan oyuncu ikinci kapağı göremez) yerleşimden gelir.
   Öneri: Bölüm 4'ün yerleşimi bir sonraki turda tek derin kazıya indirilir (proje sahibinin "1–5 değişmez" notu nedeniyle
   bu turda yapılmadı). Karar: orkestratör / proje sahibi. **Güncelleme (Fl, CL-V3C2-03):** öneri geri çekildi. 2 adım kazı
   bakışlı vekilde Bölüm 4 ≈ 0,90 (Kolay bandı ≥ 0,85 içinde); darboğaz bölüm değil vekilin derin kazı körlüğüdür. Yerleşim
   değişmez (§8.16.5, ÖNERİ P-Fl-1).
4. **D-090 kanıt sınıfı değişmedi:** 6–10'da "ölü masa yok" iddiası `plan_trap` 0 (kanıt) + 10 000 yürüyüşte yakalanmayan
   çıkmaz 0 (**tahmin**) üzerinedir (§8.13.7 soru 2).
5. **Bölüm 10'un `min` değeri kanıtlıdır** (ışın araması alt sınıra eşit: 21 = 21). 6–9'da alt sınırla fark 1.
6. **İleri bakış vekili orta bot değildir:** 24 rastgele kaydırma adayından en çok doğru yerleşim açanı seçer, %10 rastgele
   hamle yapar. Bantlar bu vekile göre tutturuldu; `levels:bot` (WP-N) gelince yeniden ölçülür.
7. **K-51/1 (`puzzle_first_reachable`, ilk hamle kazı) ve ölü masa kapısı seçimi daralttı.** İlk ölçümde üç aday (7, 8,
   9) başta doğru yerleşime izin verdiği için error aldı ve değiştirildi; bir Bölüm 9 adayı 10 000 yürüyüşte %1,73
   yakalanmayan çıkmazla (8/200 yoklama) reddedildi. Sevkiyattaki Bölüm 9, `puzzle_greedy_easy` sınırını (%70) tutmak için
   en üstteki Y çubuğu bir sütun sola alınmış adaydır (vekil %74 → %64).
8. **Bölüm 4–5 tanıtım ölçümleri bot gelene kadar vekildir;** Bölüm 1–3 değişmedi (golden'ları birebir aynı).

### 8.16 v3c3 — Bölüm 7–9 yeniden kurulumu: palet öğreticisi, bonus anı, şekil çeşitliliği (CL-V3C2-01…04; product-lead paketi Fl, 2026-11-12)

Sahip: product-lead · Durum: **yayın verisi** (`levels/level_007…009.json`; §8.15'in 7–9 satırlarının yerini alır, Bölüm 6
ve 10 §8.15'te kalır, Bölüm 1–5 değişmedi). Kararlar: D-106…D-108 aynen; ÖNERİ P-Fl-1 (zorluk eğrisi ölçüsü) ve P-Fl-2
(8–9'da 18 blok + dörtlü şekil). Kapanan inceleme bulguları (REVIEW_LEVELS_V3C2): **CL-V3C2-01** (Bölüm 7 öğretici adımı),
**-02** (Bölüm 7 bonus anı), **-04** (7–9 şekil çeşitliliği) veriyle; **-03** (Kolay 3–4 eğrisi) ölçüm + karar önerisiyle
(veri değişmedi); **-10** (§8.15.5 "aha" tablosu dolduruldu, §8.3/§8.9'a D-108 notu; kart F biçimi code-lead testine bağlı).
Yöntem: B1 hattı (§8.15) + dört ek: (a) **1. kata özgü kapak**: paletin üstüne yalnız şekli ve rengiyle 2–3. katın hiçbir
yerine uymayan 1. kat blokları konur (plan tuzağı 0 iken 1. kat ancak onlar yerleşince biter; kural GDD K-53 madde 7
ÖNERİ); (b) plan örnekleyicide paletsiz ≥ 1 `L4`/`J4`/`T4`, ≥ 4 şekil ailesi, domino ≤ %50 ve tam N; (c) aday elemesinde
§8.16.3 senaryoları (yerleştiren vekil, 200–300 oyun); (d) tek blok yer değiştirmeli yerel arama (K-51/1, `min`, bant ve
`puzzle_greedy_easy` korunarak). Seçilen adaylar resmî önbelleksiz kapıdan geçti; Bölüm 8'in ilk adayı (18 blok, beş aile)
ölü masa kapısında %1,74 > %1 ile **error** aldı ve değiştirildi.

#### 8.16.1 Değişiklikler (v3c2 → v3c3)

1. **Bölüm 7 öğretici adımı oyuncuda da doğru (CL-V3C2-01, B seçeneği — veri).** Paletin üstünde 1. katın iki kırmızı
   `C3`'ü (`e`, `h`) ve en üst sırada bir W domino (`j`) durur. Kırmızı `C3` 2–3. katın hiçbir yerine uymaz: 2–3. katın
   kırmızısı yalnız `L4_180` biçimindedir (`i`, `l`). Bu yüzden 1. kat biten her oyunda `e` ve `h` şantiyededir, paletin
   üstü açılmıştır; adım 1 (`startOn: segmentDone`, `piece:15`, el `tap`) tutulabilir katmanı gösterir. Öğretici verisi
   aynı biçimde kaldı (yalnız `piece:16` → `piece:15`); kod değişikliği gerekmedi. Code-lead'in A seçeneği
   (`startOn: pieceFree`) ε 0,2'deki kalan %5 için sağlamlık önerisi olarak REVIEW_LOG'dadır.
2. **Bonus ilk palet katmanından sonra (CL-V3C2-02).** Bonus artık `D2_0` W (`q`): sahanın dibinde, kırmızı `L4` `i`'nin
   çıkıntısının altında; 2–3. katın W'sidir. Kanonik çözümde 19. hamle (dört katmanın hepsinden sonra; sayaç 6 − 1 + 2 = 7,
   GDD K-62 örneği). D-107 gerekçesi ("palet tanıtımının ödülü") oyuncuların %98,7'sinde tutar.
3. **Şekil çeşitliliği (CL-V3C2-04).** 7–9'un her birinde paletsiz dörtlü blok ve ≥ 4 aile: 7 `L4_180` ×2 (D2, C3, L4, O4);
   8 `L4_180` W (D2, C3, I3, L4); 9 `L4_270` Y (D2, C3, I3, L4). Blok sayısı 19 / 18 / 18 (v3c2 20 / 19 / 19); Σ 48'de domino
   ≤ %50 iken bir dörtlüyle N en çok 18'dir (P-Fl-2). 6–10 toplamı 17 + 19 + 18 + 18 + 20 = **92** (v3c2 95); D-107 alt
   sınırlarının (6 ≥ 17, 7–9 ≥ 18, 10 ≥ 20) hepsi tutar.
4. **Kolay 3–4 eğrisi (CL-V3C2-03): veri değişmedi.** 2 adım kazı bakışlı vekil 3–5'i 0,89–0,97 ölçer (§8.16.5); sorun
   vekilin derin kazıda körlüğüdür. Karar önerisi P-Fl-1 (vekil code-lead'de, bantlar sonra).

#### 8.16.2 Bölüm tablosu (yayın; resmî önbelleksiz `node tools/solve.ts --check --no-cache --jobs 3 --level 7,8,9 --update-golden`, 2026-11-12: 0 hata, 0 uyarı)

| # | Ad | Etiket · `teaches` | Saha / şantiye / duvar | Σ / F / E | N (domino) | Paletsiz şekiller | Palet | Özellikli bloklar | `min` (alt sınır) | pay (P + a) · hamle | YAO | `liftRatio` | İleri bakış vekili (ε 0,1, 400 oyun) [Wilson %95] | Yerleştiren vekil (bütçe / + N/2) | 10 000 yürüyüş: kazanılan / kurtarılan / çözülmemiş uç → yakalanmayan (tahmin) | Öğretici |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7 | Palet Yığını | Normal · Y10 | 6×8 / 3×6×3 / 7 | 54 / 42 / 6 | 19 (9) | D2 ×9, C3 ×4, L4 ×2 | `O4_0` Y ×4 (0,0) | bonus `D2_0` W | 20 (20) | 4 + 0 · **24** | 19/19 | 1 | 0,86 [0,83–0,89] | 0,34 / 0,59 | 6195 / 0 / 3805 → 1 / 200 yoklama (%0,19) | `tut.m.pallet`, `tut.m.palletsite` |
| 8 | Paketli Kat | Normal · Y11 | 6×8 / 3×4×4 / 7 | 48 / 42 / 6 | 18 (7) | D2 ×7, C3 ×4, I3 ×3, L4 | `C3_0` W ×3 (4,0) | makas `D2_90` Y; sargılı `C3_270` G, `I3_90` W; iki renkli `D2_0` GW ×2 | 20 (19) | 4 + 2 · **26** | 18/18 | 1 | 0,87 [0,83–0,90] | 0,28 / 0,45 | 9506 / 0 / 494 → 1 / 200 (%0,02) | `tut.m.wrap` |
| 9 | Kaygan Çatı | Normal · Y13 | 6×8 / 3×4×4 / 7 | 48 / 42 / 6 | 18 (7) | D2 ×7, C3 ×5, I3 ×2, L4 | `C3_270` G ×3 (1,0) | kaygan `D2_0` W ×2; iki renkli `D2_0` WY, `D2_90` YW | 20 (19) | 4 + 1 · **25** | 18/18 | 1 | 0,83 [0,79–0,86] | 0,21 / 0,38 | 7823 / 0 / 2177 → 1 / 200 (%0,11) | `tut.m.slippery` |

Ortak: `plan_trap` 0, `policyWin` bandı uyarısı 0 (D-107), domino ≤ %50 (7: %47), YAO 1,00, `liftRatio` 1, palet yerde ve
bayraksız, iki renkli çiftler yalnız W–Y ve W–G, `puzzle_greedy_easy` yok (bütçe + N/2'de ≤ 0,59), K-51/1 (ilk hamle kazı)
✓, `min` ≤ 22 ✓. Bölüm 7'de `min` kanıtlı (alt sınıra eşit); 8 ve 9'da en iyi bulunan 20, alt sınır 19. Bölüm 1–6 ve 10'un
çözücü sonuçları değişmedi (`tests/tools/solver/shipped.expected.ts` farkı yalnız 7–9). Süre: üç bölüm paralel ≈ 9 dk.
Yeniden koşum (Fl kapanışı, 2026-11-12): `node tools/solve.ts --check --no-cache --jobs 4` (1–10, `--update-golden`
olmadan) **0 hata, 0 uyarı**, 10 dk 49 sn; golden'lar birebir aynı, `artifacts/solver/*.json` farkı yalnız süre alanları ve
1–6, 10'un önbellek anahtarı (CL-V3C2-07 tazelendi); vekil ve yürüyüş sayıları yukarıdaki tabloyla aynı.

#### 8.16.3 Bölüm 7 senaryoları (CL-V3C2-01/02 kabul ölçüsü; inceleyenin betikleriyle, 2 000 oyun)

Yöntem REVIEW_LEVELS_V3C2 §6: çözücünün hamle kümesiyle "görünen doğru yerleşimi al, yoksa rastgele kaydır" oyuncusu;
1. kat bittiği an (`visibleSegment` 0 → 1) palet üst katmanı için `holdableIgnoringMoves` sorulur; bonusun yerleştiği kat ve
ilk palet katmanına göre sırası sayılır.

| Ölçüm | v3c2 (inceleme) | **v3c3** | Kabul |
|---|---|---|---|
| 1. kat bitince üst katman tutulabilir, ε 0 | 75 / 1 948 (%3,9) | **1 749 / 1 777 (%98,4)** | ≥ %95 ✓ |
| aynı, ε 0,2 | 89 / 1 924 (%4,6) | **1 625 / 1 710 (%95,0)** | sınırda |
| bonus ilk palet katmanından sonra, ε 0,1 | 146 / 1 929 (%7,6) | **1 630 / 1 651 (%98,7)** | ≥ %80 ✓ |
| bonusun katı (1. / 2. / 3.), ε 0,1 | 1 569 / 228 / 132 | 21 / 1 284 / 346 | — |

ε 0,2'de kalan %5: rastgele bir kaydırma 1. kat bitmeden paletin üstündeki boşluğa (2 hücre) blok bırakır. Veriyle sıfırlanamaz
(boş hücre her yerde vardır); code-lead'in `pieceFree` başlatma koşulu bunu %100 yapar (REVIEW_LOG Fl, öneri).

#### 8.16.4 Gri kutu (saha başlangıcı ve plan; işaretler §8.15.4 ile aynı)

**Bölüm 7 — Palet Yığını** (saha 6×8, duvar 7; plan katları soldan sağa, satırlar üstten alta)

```
y7  .   Wj  Ra  Ra  Yb  Wc
y6  .   Wj  Ra  Yb  Yb  Wc  |
y5  Re  .   Wd  Wd  Wf  Wg  |  RRW  WWW  WWW
y4  Re  Re  Ri  Ri  Wf  Wg  |  RWW  WYY  WRR
y3  Rh  Rh  .   Ri  Rl  Rl  |  RWW  WYY  YYR
y2  Rh  .   .   Ri  Wk  Rl  |  RRW  WRR  YYR
y1  YpP YpP Wq+ Wr  Wk  Rl  |  RRY  YYR  YYW
y0  YpP YpP Wq+ Wr  Ws  Ws  |  RYY  YYR  YYW
```

**Bölüm 8 — Paketli Kat** (saha 6×8, duvar 7; plan katları soldan sağa, satırlar üstten alta)

```
y7  .   .   .   Ya  Ya  .
y6  .   .   Wc2 Gb  Gb  Gb  |
y5  Gd  Gd  Gc2 Yf  Yf  Yg  |
y4  Gd  Ye% Ye% Gh~ Yf  Yg  |
y3  Yi  Yi  Gh~ Gh~ Wm  Wm  |  YYW  WWW  WYY  WYY
y2  Wk2 Yi  Wj~ Wj~ Wj~ Wm  |  GGG  YWW  WWY  WWW
y1  Gk2 Gl  Gl  Gl  WrP Wm  |  GYY  YGW  WYY  YYG
y0  Yn  Yn  Yo  Yo  WrP WrP |  GGG  GGW  WWY  GGG
```

**Bölüm 9 — Kaygan Çatı** (saha 6×8, duvar 7; plan katları soldan sağa, satırlar üstten alta)

```
y7  .   Gb  Ya  Ya  .   .
y6  Gb  Gb  Wc^ .   .   Yd  |
y5  Ye2 .   Wc^ Yd  Yd  Yd  |
y4  We2 Gf  Gi  Wg  Yh  Yh  |
y3  Gf  Gf  Gi  Wg  Yh  Wj^ |  YYG  WYY  YYG  GGG
y2  Yk  Yk  Gi  Yl  Yl  Wj^ |  GGG  WGY  YGG  WYW
y1  Wn  Yk  GqP Yl  Ym2 Wm2 |  GWY  GGY  YYG  WGW
y0  Wn  GqP GqP Gr  Gr  Gr  |  GWW  YYY  YGG  GGW
```

#### 8.16.5 Zorluk eğrisi ölçümü (CL-V3C2-03; product-lead, ölçüm betiği scratch'te, repoya girmedi)

Vekil: resmî ileri bakış vekili (`tools/solver/walks.ts` `policyWinRates`: görünen doğru yerleşim varsa onu, yoksa 24 aday
kaydırmadan en çok yerleşim açanı alır, ε rastgele hamle) + **ikinci kazı adımı**: 24 adayın hiçbiri yerleşim açmıyorsa her
aday, ardından gelebilecek 12 kaydırmanın açtığı en çok yerleşimle puanlanır. İkinci adım kapalıyken betik resmî sayıları
yeniden üretir (3 0,505, 4 0,400, 5 0,575; 400 oyun), yani fark yalnız ikinci kazı adımından gelir.

| # | Etiket | 1 adım (resmî, inceleme §5) ε 0,1 | **2 adım** ε 0,1 [Wilson %95] | 2 adım ε 0 | 2 adım, `moves` + 4 |
|---|---|---|---|---|---|
| 3 | Kolay | 0,509 | **0,962** [0,952–0,969] (2 000) | 1,000 (1 000) | 0,998 |
| 4 | Kolay | 0,430 | **0,909** [0,896–0,921] (2 000) | 1,000 (1 000) | 0,980 |
| 5 | Normal (tanıtım) | 0,558 | **0,965** [0,955–0,972] (2 000) | 1,000 (1 000) | 0,999 |
| 6 | Normal (tanıtım) | 0,83 | 0,855 [0,817–0,886] (400) | — | — |
| 7 | Normal (tanıtım) | 0,86 (v3c3) | 0,912 [0,881–0,936] (400) | — | — |
| 8 | Normal (tanıtım) | 0,87 (v3c3) | 0,858 [0,820–0,888] (400) | — | — |
| 9 | Normal (tanıtım) | 0,83 (v3c3) | 0,843 [0,804–0,875] (400) | — | — |
| 10 | Zor | 0,54 | 0,565 [0,516–0,613] (400) | — | — |

Yeniden üretim (Fl kapanışı, aynı betik, ε 0,1, dizi başına 2 000 oyun; 3 ve 5: tohum 101 ve 101…505 × 400; 4: ayrıca tohum
1, 3, 4, 5, 7, 1…5 × 400 ve 11…55 × 400): 3 0,956–0,957, 4 **0,894–0,905**
(Wilson alt ucu ≥ 0,880), 5 0,963–0,966; ikinci adım kapalıyken 400 oyunda 0,515 / 0,450 / 0,583 (resmî 1 adımlı sayılarla
aynı aralık). Tablodaki 0,909 bu aralığın hemen üstündedir (tohum farkı); Bölüm 4'ün gerçekçi değeri ≈ 0,90'dır ve Kolay
bandının alt sınırı (0,85) her tohumda tutar.

Okuma: 3–5'in "zorluğu" derin kazıdaki vekil körlüğüdür (iki kapak üst üste: ilk kapağı kaldırmak hiçbir yerleşim açmaz);
6–10 sığ kazılı olduğu için iki vekilde aynıdır (fark ≤ 0,05). 2 adım vekilde eğri testere dişidir: Kolay 0,89–0,96 · Normal
0,84–0,97 · Zor 0,57. Bölüm 1–5 verisi değişmez; öneri P-Fl-1: resmî vekil 2 adımlı olur (code-lead), sonra 3–5'e
`targets.policyWin` (Kolay [0,85, 1,00], Normal tanıtım 5 [0,80, 1,00]) ve 6–10 bantları yeni vekille yeniden doğrulanır
(Bölüm 7 0,91 ile üst sınırı aşarsa `moves` 24 → 23 adayı; yalnız `a` değişir).

#### 8.16.6 Sapmalar, gerekçeler ve açık sorular

1. **Ölü masa tahmini 0 değil, kapının içinde.** 7–9'un her birinde 200 yoklamadan 1 uç sınırlı ışın aramasıyla (genişlik
   ≤ 512, 100 000 düğüm) çözülemedi → tahmin %0,19 / %0,02 / %0,11 (kapı ≤ %1, K-51/2; v3c2'de 0). Güçlü yoklama sonucu
   aşağıda madde 7'de: üç uç da çözülebilir. Kanıt sınıfı v3c2 ile aynıdır: `plan_trap` 0 (kanıt) + yürüyüş tahmini (D-090, §8.13.7 soru 2).
2. **8 ve 9'da 18 blok** (D-107 alt sınırı; hedef 19–20'nin altı). Gerekçe P-Fl-2: dörtlü şekil + domino ≤ %50 ile Σ 48'de
   tavan 18. 20+ blok Hikaye 2'nin yüksek sahasında.
3. **Bölüm 8 ve 9'un `min`'i kanıtlı değil** (en iyi bulunan 20, alt sınır 19; v3c2'de 8 kanıtlıydı). Hamle bütçesi
   bulunan `min`'e göre kuruldu; daha kısa bir çözüm varsa bütçe 1 hamle bol olur (oyuncu lehine).
4. **Bölüm 8 ve 9'un öğreticisi (el yok) başta örtülü bloğu vurgular** (makas `e` iki bloğun, ilk kaygan `c` bir dominonun
   altında); v3c2 ile aynı desen, `done` o bloğun doğru yerleşimidir; elsiz olması GDD K-53 madde 7 (c) gereğidir.
5. **Bonus 1. kata da uyar** (`D2_0` W, 1. katın W sütunu): ε 0,1 oyunların %1,3'ünde 1. katta yerleşir (kazı ile `i`'nin
   altından erken çıkarılırsa). Ödül anı bu oyuncularda da paletin öğretildiği bölümde kalır.
6. **Bölüm 7 bütçesi `a` = 0** (24 = 20 + 4): vekil 0,86 bandın ortasında; 25'te 0,91 (bant dışı). Bölüm 8'de `a` = 2
   (25'te 0,77), Bölüm 9'da `a` = 1.
7. **Güçlü yoklama: yoklanan uçlarda gerçek çıkmaz 0.** Resmî kapının sınırlı ışın aramasıyla çözemediği uç (her bölümde
   200 yoklamadan 1; aynı tohum = bölüm kimliği, aynı 10 000 yürüyüş) daha geniş bir ışın aramasıyla (genişlik 2 048 →
   8 192 → 32 768, ≤ 20 milyon düğüm, 120 sn; scratch betiği, `tools/solver/large.ts` `solveLarge` ile o durumdan) yeniden
   yoklandı. Üçü de **çözülebilir**: Bölüm 7 19 hamlede (317 271 düğüm, 88 sn), Bölüm 8 25 hamlede (45 713 düğüm, 9 sn),
   Bölüm 9 43 hamlede (79 630 düğüm, 41 sn). Resmî tahmin (%0,19 / %0,02 / %0,11) yoklama aramasının sınırından gelir;
   7–9'da yoklanan 600 uçta yakalanmayan çıkmaz 0'dır (v3c2 ile aynı sınıf). Kanıt sınıfı yine tahmindir (D-090 tam uzay
   taraması koşmaz). Öneri (code-lead'e, REVIEW_LOG Fl): kapı, ilk yoklamanın çözemediği uca bu ayarlarla ikinci bir yoklama
   eklerse resmî tahmin de bunu okur.
