# 50 bölüm planı

Sahip: product-lead · Sürüm: D-099 bölüm turu (2026-11-02, paket A2: Bölüm 1–10 `schemaVersion` 2 olarak yeniden kuruldu; §1, §2, §6.6 güncel, yeni §6.10 hedef–gerçek tablosu) · Önceki: D-099 bulmaca zekâsı şartnamesi (2026-11-01; yeni §6 ölçütler, hedef aralıklar ve Bölüm 1–10 eğrisi, §7 code-lead uygulama notları; §1–§2 Faz 2R verisini anlatmaya devam eder) · Önceki: Faz 2R solver turu (2026-10-07; Bölüm 1–10 JSON'ları `levels/` altında, resmî solver
`levels:solve` ile doğrulandı; Bölüm 4, 5, 7 ve 10 yeniden tasarlandı — §2.11) · Önceki: Faz 2R (2026-10-07; R2-01…R2-06, R2-10 — `docs/review_inbox/_orchestrator_rulings_2R.md`; çapraz inceleme kapanışı: tanıtım bölümü tamponu, öğretici yolları ve süzgeçleri, Bölüm 4 adı, Faz 3 kuralları) · Faz 1 revizyonu (2026-10-04; R-01, R-08, R-18, R-21; tutarlılık denetimi tur 1, 2026-10-05; F-3 çıkmaz taraması, 2026-10-05) · Kaynak: `docs/BRIEF.md` §8, `docs/GDD.md` (Faz 2R), `docs/OBSTACLES.md`

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
mekanik için yazılır (OBSTACLES "Veri imzası": 1 → S1, 4 → W1, 6 → W2, 8 → Y5, 9 → W3).

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
| 1 | Kolay (tanıtım) | 10 | ≥ %95 | 26 | Normal (nefes) | 20 | %80 |
| 2 | Kolay | 10 | ≥ %92 | 27 | Normal | 20 | %70 |
| 3 | Kolay | 12 | ≥ %92 | 28 | Normal | 21 | %70 |
| 4 | Kolay (tanıtım) | 13 | ≥ %90 | 29 | Normal | 19 | %70 |
| 5 | Normal | 13 | %75 | 30 | **Çok Zor** | 27 | %30 |
| 6 | Normal (tanıtım) | 13 | %85 | 31 | Normal (nefes) | 20 | %80 |
| 7 | Normal | 13 | %70 | 32 | Normal | 20 | %70 |
| 8 | Normal (tanıtım) | 14 | %85 | 33 | Normal | 22 | %65 |
| 9 | Normal (tanıtım) | 16 | %85 | 34 | Normal | 22 | %65 |
| 10 | **Zor** | 14 | %45 | 35 | **Zor** | 21 | %50 |
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

Hamle sütunu 1–10 için D-099 `solver min + P` (K-52 D-099 tablosu, `a = 0`; resmî `levels:solve` sonucu, §2.11; tanıtım
bölümleri 1, 4, 6, 8, 9 P'yi bir alt zorluğun satırından alır, 1 ve 4 zaten Kolay), 11–50 için eski kurallarla `tahmini minimum + eski tampon`dur (Faz 3'te K-52 ile yeniden hesaplanır;
tanıtım bölümleri aynı kuralla). Fark ve gerekçe §4'te. 11–50'nin tanıtım bölümlerinin hedef oranları Faz 3'te
tanıtım bandına (§0) çekilir. "Hedef kazanma" sütunu **bot** oranıdır; bot K-34 kanca 5 ipuçlarını görmez (DL-2R-04).

---

---

## 2. Bölüm 1–10 (Hikaye Bölümü 1 — Ağaç Ev) — D-099 sabit saha (`schemaVersion` 2)

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
   `tut.m.highwall`, `tut.m.heavy`, `tut.m.hammer`, `tut.m.narrow`, `tut.m.cranebooster`. **Yeni istenen** (design-lead
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
| Zorluk / hedef kazanma | Kolay (tanıtım) / ≥ %95 |
| Boyut (K-49) | `yard { cols 5, rows 4 }`, `site { cols 2, rows 4 }` → H = 4, Vinç Alanı y = 4–5 |
| Duvar | `height 3`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Alt Basamak (EN: Lower Step) `["YY", "YY", "WW", "WW"]` · 2. Üst Basamak (EN: Upper Step) `["WW", "WW", "YY", "YY"]` |
| Renkler / şekiller | W, Y (2) / D2, O4 |
| Saha | C = 20, F = 16, E = 4 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 6 · min 6 · minShifts 0 · firstNeedDepth 0 · YAO 6/6 · trapCount 0 · maxCover 3 · depLater 0 · crossDeps 5 · parkSlack – · forced 4 · greedyWin 1 · greedyExcess 0 · greedyTrap – · ahaMin 0 · branch3 0,36 · 21 125 durum, complete evet, undetectedDead 0, D1 0 |
| Hamle (K-52, D-099) | 6 + P 4 = **10** |

**Tasarım niyeti:** Oyuncu bloğu kaldırıp duvarın üstünden aşırmanın temel hareket olduğunu keşfeder (duvar `height 3`, saha tepesi bir satır yukarıda). İlk kat üç hamlede biter; şantiye kayınca sahada kalan üç blok ikinci katın malzemesidir: sahaya yeni blok gelmez, kalanlar sırasını bekler (K-55). Yığının üstü planın altıdır (ters istif); kazı ve tuzak yok, açgözlü oyun en kısa yoldur (`greedyWin` 1,00).

```
       x: 0 1 2 3 4   D   5 6
   y=5:  · · · · ·   :   · ·
   y=4:  · · · · ·   :   · ·  ← Vinç Alanı
   y=3:  a a b b .   :   Y Y
   y=2:  a a c c .   #   Y Y
   y=1:  d d e e .   #   W W
   y=0:  d d f f .   #   W W
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `O4_0` | W | (0,2) | 1. kat y0–1 (ilk gereken) |
| `b` | `D2_90` | Y | (2,3) | 1. kat y3 |
| `c` | `D2_90` | Y | (2,2) | 1. kat y2 |
| `d` | `O4_0` | Y | (0,0) | 2. kat y0–1 |
| `e` | `D2_90` | W | (2,1) | 2. kat y3 |
| `f` | `D2_90` | W | (2,0) | 2. kat y2 |

Kanonik çözüm (solver, K-50 madde 4):
1. `a` (O4_0 W) (0,2) → (5,0) — duvar üstü, doğru
2. `c` (D2_90 Y) (2,2) → (5,2) — duvar üstü, doğru
3. `b` (D2_90 Y) (2,3) → (5,3) — duvar üstü, doğru
4. `d` (O4_0 Y) (0,0) → (5,0) — duvar üstü, doğru
5. `f` (D2_90 W) (2,0) → (5,2) — duvar üstü, doğru
6. `e` (D2_90 W) (2,1) → (5,3) — duvar üstü, doğru

Öğretici:
1. `piece:0`, `crane` · drag `[[0,3],[0,5],[5,5]]` · `tut.m.lift` · `{ event: placementCorrect, count: 1 }` (tutulan hücre `a`nın sol üst hücresi (0,3); Vinç Alanı y = 4–5, son çapa (5,4) şantiye üstünde, düşüş (5,0))
2. `startOn: { event: segmentDone }` · `goals` · — · `tut.m.useall` · `{ event: placementCorrect, count: 1 }` (kat bitince kalan blok çipi)

### Bölüm 2 — Platform (Platform)

| Alan | Değer |
|---|---|
| Öğretilen | Şekil ve gölge: `C3` çifti iki katta da merdiven deseninde kilitlenir; yanlış zamanda denenen blok kaybolmaz |
| Zorluk / hedef kazanma | Kolay / ≥ %92 |
| Boyut (K-49) | `yard { cols 5, rows 4 }`, `site { cols 2, rows 4 }` → H = 4, Vinç Alanı y = 4–5 |
| Duvar | `height 3`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Platform Tabanı (EN: Platform Base) `["WW", "GG", "YG", "YY"]` · 2. Platform Korkuluğu (EN: Platform Rail) `["GG", "YY", "WY", "WW"]` |
| Renkler / şekiller | G, W, Y (3) / C3, D2 |
| Saha | C = 20, F = 16, E = 4 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 6 · min 6 · minShifts 0 · firstNeedDepth 0 · YAO 6/6 · trapCount 0 · maxCover 2 · depLater 0 · crossDeps 5 · parkSlack – · forced 5 · greedyWin 1 · greedyExcess 0 · greedyTrap – · ahaMin 0 · branch3 0,75 · 13 797 durum, complete evet, undetectedDead 0, D1 0 |
| Hamle (K-52, D-099) | 6 + P 4 = **10** |

**Tasarım niyeti:** `C3_0` + `C3_180` çifti 2×3 bir merdiven kurar (K-34 alttan üste). Başlangıçta tek oynanabilir hamle `a`dır; açıktaki `c` (`C3_180` G) erken denenirse gölge «hatalı» gösterir (K-18) ve blok geri döner, ikinci hamlede yerine oturur. İkinci kat aynı deseni ters renkte tekrarlar. Kazı yok.

```
       x: 0 1 2 3 4   D   5 6
   y=5:  · · · · ·   :   · ·
   y=4:  · · · · ·   :   · ·  ← Vinç Alanı
   y=3:  a . . c c   :   W W
   y=2:  a a b b c   #   G G
   y=1:  . e e f .   #   Y G
   y=0:  d d e f f   #   Y Y
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `C3_0` | Y | (0,2) | 1. kat y0–1 (ilk gereken) |
| `b` | `D2_90` | W | (2,2) | 1. kat y3 |
| `c` | `C3_180` | G | (3,2) | 1. kat y1–2 |
| `d` | `D2_90` | G | (0,0) | 2. kat y3 |
| `e` | `C3_180` | Y | (1,0) | 2. kat y1–2 |
| `f` | `C3_0` | W | (3,0) | 2. kat y0–1 |

Kanonik çözüm (solver, K-50 madde 4):
1. `a` (C3_0 Y) (0,2) → (5,0) — duvar üstü, doğru
2. `c` (C3_180 G) (3,2) → (5,1) — duvar üstü, doğru
3. `b` (D2_90 W) (2,2) → (5,3) — duvar üstü, doğru
4. `f` (C3_0 W) (3,0) → (5,0) — duvar üstü, doğru
5. `e` (C3_180 Y) (1,0) → (5,1) — duvar üstü, doğru
6. `d` (D2_90 G) (0,0) → (5,3) — duvar üstü, doğru

Öğretici:
1. `panorama`, `build` · — · `tut.m.pattern` · `{ event: placementCorrect, count: 1 }`
2. `piece:2` · hold `[[3,3],[3,4],[5,4]]` · `tut.m.shadow` · `{ event: placementCorrect, count: 1 }` (tutulan hücre `c`nin sol üst hücresi (3,3); şantiye üstünde tutulurken gölge «doğru» gösterir, iniş (5,1))

### Bölüm 3 — Ön Duvar (Front Wall)

| Alan | Değer |
|---|---|
| Öğretilen | Kazı (T1): sonraki katın bloğu bu katın bloğunun üstündedir; önce kenara çek |
| Zorluk / hedef kazanma | Kolay / ≥ %92 |
| Boyut (K-49) | `yard { cols 5, rows 4 }`, `site { cols 2, rows 4 }` → H = 4, Vinç Alanı y = 4–5 |
| Duvar | `height 3`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Duvar Altı (EN: Wall Base) `["WW", "WW", "YY", "GG"]` · 2. Duvar Üstü (EN: Wall Top) `["WW", "WW", "YY", "YY"]` |
| Renkler / şekiller | G, W, Y (3) / D2, O4 |
| Saha | C = 20, F = 16, E = 4 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 7 · min 8 · minShifts 1 · firstNeedDepth 1 · YAO 7/7 · trapCount 0 · maxCover 2 · depLater 2 · crossDeps 2 · parkSlack 1 · forced 6 · greedyWin 1 · greedyExcess 0 · greedyTrap – · ahaMin 0 · branch3 0,3 · 77 757 durum, complete evet, undetectedDead 0, D1 0 |
| Hamle (K-52, D-099) | 8 + P 4 = **12** |

**Tasarım niyeti:** İlk kez kazı: ikinci katın tabanı `O4` Y (`a`), birinci katın G ve Y bloklarının üstündedir (`depLater` 2). Sahada tek cep (sağ üstte 2×2) vardır; `a` oraya kayınca birinci kat açılır, cepteki blok ikinci katın tabanı olarak bekler. Dikey W çifti (sütun 4) birinci katın üst bölgesini doldurur; yatay W çifti ikinci kata kalır.

```
       x: 0 1 2 3 4   D   5 6
   y=5:  · · · · ·   :   · ·
   y=4:  · · · · ·   :   · ·  ← Vinç Alanı
   y=3:  a a . . f   :   W W
   y=2:  a a . . f   #   W W
   y=1:  b b d d g   #   Y Y
   y=0:  c c e e g   #   G G
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `O4_0` | Y | (0,2) | 2. kat y0–1; önce sahada kaydırılır |
| `b` | `D2_90` | G | (0,1) | 1. kat y0 (ilk gereken) |
| `c` | `D2_90` | Y | (0,0) | 1. kat y1 |
| `d` | `D2_90` | W | (2,1) | 2. kat y3 |
| `e` | `D2_90` | W | (2,0) | 2. kat y2 |
| `f` | `D2_0` | W | (4,2) | 1. kat y2–3 |
| `g` | `D2_0` | W | (4,0) | 1. kat y2–3 |

Kanonik çözüm (solver, K-50 madde 4):
1. `a` (O4_0 Y) (0,2) → (2,2) — **kaydırma**
2. `b` (D2_90 G) (0,1) → (5,0) — duvar üstü, doğru
3. `c` (D2_90 Y) (0,0) → (5,1) — duvar üstü, doğru
4. `f` (D2_0 W) (4,2) → (5,2) — duvar üstü, doğru
5. `g` (D2_0 W) (4,0) → (6,2) — duvar üstü, doğru
6. `a` (O4_0 Y) (2,2) → (5,0) — duvar üstü, doğru
7. `e` (D2_90 W) (2,0) → (5,2) — duvar üstü, doğru
8. `d` (D2_90 W) (2,1) → (5,3) — duvar üstü, doğru

Öğretici:
1. `piece:0` · drag `[[0,3],[2,3]]` · `tut.m.dig` · `{ event: yardMove, count: 1, piece: 'piece:0' }` (`a`nın sol üst hücresi (0,3), sağa (2,3); son çapa (2,2) = kanonik hamle 1)
2. `startOn: { event: yardMove, piece: 'piece:0' }` · `piece:0`, `panorama` · — · `tut.m.carry` · `{ event: segmentDone, count: 1 }` (kat bitene kadar)

### Bölüm 4 — Pencere Pervazı (Window Sill)

| Alan | Değer |
|---|---|
| Öğretilen | **W1 Sabit Geçit** + ray (`teaches: "W1"`) |
| Zorluk / hedef kazanma | Kolay (tanıtım) / ≥ %90 |
| Boyut (K-49) | `yard { cols 4, rows 5 }`, `site { cols 2, rows 4 }` → H = 5, Vinç Alanı y = 5–6 |
| Duvar | `height 4`; geçit `{ type: "static", y: 0, size: 2 }` |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Pervaz (EN: Sill) `["WW", "GG", "YY", "WW"]` · 2. Pencere Üstü (EN: Window Top) `["YY", "WW", "GG", "YY"]` |
| Renkler / şekiller | G, W, Y (3) / D2 |
| Saha | C = 20, F = 16, E = 4 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 8 · min 9 · minShifts 1 · firstNeedDepth 1 · YAO 7/8 (1 ray) · trapCount 0 · maxCover 5 · depLater 1 · crossDeps 11 · parkSlack 2 · forced 8 · greedyWin 1 · greedyExcess 0 · greedyTrap – · ahaMin 0 · branch3 0,33 · 220 746 durum, complete evet, undetectedDead 0, D1 0 |
| Hamle (K-52, D-099) | 9 + P 4 = **13** |

**Tasarım niyeti:** Geçit satır 0–1'de açıktır. Başlangıçta iki W bloğu `a` (Y) ile örtülüdür; `a` bir hücre sağa kayınca `b` açılır. İkinci katın tabanı `h` (Y) duvar dibinde, `f`nin altındadır: duvarın üstünden çıkamaz ama geçitten yatay kayar, raya girer ve düşmez (1 ray). Geçitsiz `min` 10: geçit bir hamle kazandırır (`no-gaps` +1).

```
       x: 0 1 2 3   D   4 5
   y=6:  · · · ·   :   · ·
   y=5:  · · · ·   :   · ·  ← Vinç Alanı
   y=4:  . a a .   :   · ·
   y=3:  b b c c   #   W W
   y=2:  d d e e   #   G G
   y=1:  . f f .   =   Y Y
   y=0:  g g h h   =   W W
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_90` | Y | (1,4) | 1. kat y1; önce sahada kaydırılır |
| `b` | `D2_90` | W | (0,3) | 1. kat y0 (ilk gereken) |
| `c` | `D2_90` | W | (2,3) | 2. kat y2 |
| `d` | `D2_90` | G | (0,2) | 1. kat y2 |
| `e` | `D2_90` | W | (2,2) | 1. kat y3 |
| `f` | `D2_90` | G | (1,1) | 2. kat y1 |
| `g` | `D2_90` | Y | (0,0) | 2. kat y3 |
| `h` | `D2_90` | Y | (2,0) | 2. kat y0, raydan |

Kanonik çözüm (solver, K-50 madde 4):
1. `a` (D2_90 Y) (1,4) → (2,4) — **kaydırma**
2. `b` (D2_90 W) (0,3) → (4,0) — duvar üstü, doğru
3. `a` (D2_90 Y) (2,4) → (4,1) — duvar üstü, doğru
4. `d` (D2_90 G) (0,2) → (4,2) — duvar üstü, doğru
5. `e` (D2_90 W) (2,2) → (4,3) — duvar üstü, doğru
6. `h` (D2_90 Y) (2,0) → geçitten raya → (4,0) — **ray**, doğru (düşmez)
7. `f` (D2_90 G) (1,1) → (4,1) — duvar üstü, doğru
8. `c` (D2_90 W) (2,3) → (4,2) — duvar üstü, doğru
9. `g` (D2_90 Y) (0,0) → (4,3) — duvar üstü, doğru

Öğretici:
1. `piece:0` · drag `[[2,4],[3,4]]` · `tut.m.dig` · `{ event: yardMove, count: 1, piece: 'piece:0' }` (`a`nın sağ hücresi (2,4), bir sağa; son çapa (2,4) = kanonik hamle 1)
2. `startOn: { event: segmentDone }` · `piece:7`, `gap:0` · drag `[[3,0],[5,0]]` · `tut.m.gap` · `{ event: gapPass, count: 1 }` (ikinci kat başında; `h`nin sağ hücresi (3,0), son çapa (4,0) rayda, kanonik hamle 6)

### Bölüm 5 — İki Odalı Ev (Two-Room House)

| Alan | Değer |
|---|---|
| Öğretilen | Bekletme (T5) ve park yeri: yerleşebilecek dikey bloğu sonraki kata sakla |
| Zorluk / hedef kazanma | Normal / %75 |
| Boyut (K-49) | `yard { cols 5, rows 4 }`, `site { cols 2, rows 4 }` → H = 4, Vinç Alanı y = 4–5 |
| Duvar | `height 3`; geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Sol Oda (EN: Left Room) `["YY", "WW", "WW", "RR"]` · 2. Sağ Oda (EN: Right Room) `["RR", "WW", "WW", "YY"]` |
| Renkler / şekiller | R, W, Y (3) / D2 |
| Saha | C = 20, F = 16, E = 4 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 8 · min 11 · minShifts 3 · firstNeedDepth 2 · YAO 8/8 · trapCount 0 · maxCover 3 · depLater 3 · crossDeps 7 · parkSlack 1 · forced 8 · greedyWin 1 · greedyExcess 1 · greedyTrap – · ahaMin 1 · branch3 0,27 · 745 442 durum, complete evet, undetectedDead 0, D1 0 |
| Hamle (K-52, D-099) | 11 + P 2 = **13** |

**Tasarım niyeti:** İlk bekletme (`hold`): birinci katın W bölgesine (y1–2) dikey `D2_0` W de uyar, ama şimdi konursa eşi `d` (sol sütunda, park edilen `a`nın altında) kazılmalıdır (açgözlü +1). Kanonik çözüm 4. hamlede yerleşebilecek dikey `b`yi sütun 4'teki dikey cebe çeker; iki yatay W (`e`, `g`) bu katı, iki dikey W (`b`, `d`) sonraki katı doldurur (`ahaMin` 1). Açılışta `b` bir hücre sağa, `a` sol üste park edilir: R tabanı açılır.

```
       x: 0 1 2 3 4   D   5 6
   y=5:  · · · · ·   :   · ·
   y=4:  · · · · ·   :   · ·  ← Vinç Alanı
   y=3:  . b . a a   :   Y Y
   y=2:  d b . c c   #   W W
   y=1:  d e e f f   #   W W
   y=0:  g g . h h   #   R R
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_90` | Y | (3,3) | 1. kat y3; önce sahada kaydırılır |
| `b` | `D2_0` | W | (1,2) | 2. kat y1–2; önce sahada kaydırılır |
| `c` | `D2_90` | R | (3,2) | 1. kat y0 (ilk gereken) |
| `d` | `D2_0` | W | (0,1) | 2. kat y1–2 |
| `e` | `D2_90` | W | (1,1) | 1. kat y1 |
| `f` | `D2_90` | R | (3,1) | 2. kat y3 |
| `g` | `D2_90` | W | (0,0) | 1. kat y2 |
| `h` | `D2_90` | Y | (3,0) | 2. kat y0 |

Kanonik çözüm (solver, K-50 madde 4):
1. `b` (D2_0 W) (1,2) → (2,2) — **kaydırma**
2. `a` (D2_90 Y) (3,3) → (0,3) — **kaydırma**
3. `c` (D2_90 R) (3,2) → (5,0) — duvar üstü, doğru
4. `b` (D2_0 W) (2,2) → (4,2) — **kaydırma**
5. `e` (D2_90 W) (1,1) → (5,1) — duvar üstü, doğru
6. `g` (D2_90 W) (0,0) → (5,2) — duvar üstü, doğru
7. `a` (D2_90 Y) (0,3) → (5,3) — duvar üstü, doğru
8. `h` (D2_90 Y) (3,0) → (5,0) — duvar üstü, doğru
9. `d` (D2_0 W) (0,1) → (5,1) — duvar üstü, doğru
10. `b` (D2_0 W) (4,2) → (6,1) — duvar üstü, doğru
11. `f` (D2_90 R) (3,1) → (5,3) — duvar üstü, doğru

Öğretici:
1. `piece:1` · drag `[[1,3],[2,3]]` · `tut.m.dig` · `{ event: yardMove, count: 1, piece: 'piece:1' }` (`b`nin üst hücresi (1,3), bir sağa; son çapa (2,2) = kanonik hamle 1)
2. `startOn: { event: placementCorrect }` · `piece:1`, `piece:3` · — · `tut.m.carry` · `{ event: segmentDone, count: 1 }` (ilk doğru yerleşimden sonra; iki dikey W vurgulanır, eldiven yok)

### Bölüm 6 — Uzun Gövde (Tall Trunk)

| Alan | Değer |
|---|---|
| Öğretilen | **W2 Yüksek Duvar**: duvar saha tepesiyle aynı, her blok Vinç Alanı'na kalkar; kapağı yükseğe park et (`teaches: "W2"`) |
| Zorluk / hedef kazanma | Normal (tanıtım) / %85 |
| Boyut (K-49) | `yard { cols 4, rows 5 }`, `site { cols 2, rows 4 }` → H = 5, Vinç Alanı y = 5–6 |
| Duvar | `height 5` (Yüksek Duvar, W2); geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Gövde Altı (EN: Trunk Base) `["WW", "GW", "GG", "YY"]` · 2. Gövde Üstü (EN: Trunk Top) `["YY", "WW", "WW", "YY"]` |
| Renkler / şekiller | G, W, Y (3) / C3, D2 |
| Saha | C = 20, F = 16, E = 4 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 7 · min 9 · minShifts 2 · firstNeedDepth 1 · YAO 7/7 · trapCount 0 · maxCover 3 · depLater 2 · crossDeps 6 · parkSlack 2 · forced 7 · greedyWin 1 · greedyExcess 0 · greedyTrap – · ahaMin 0 · branch3 0,5 · 31 270 durum, complete evet, undetectedDead 0, D1 0 |
| Hamle (K-52, D-099) | 9 + P 4 = **13** |

**Tasarım niyeti:** Yüksek Duvar (`height 5` = H): her blok saha tepesinin üstüne (Vinç Alanı y = 5–6) kalkmalıdır. Kapak `a` (W) saha tepesinde sağa park edilir (yükseğe park, T7), `b` ilk katın tabanını kurar, `a` geri döner ve `c` (`C3_0` G) açılır; `C3` çifti birinci katın ortasıdır. Tanıtım sade: iki kaydırma, tuzak yok.

```
       x: 0 1 2 3   D   4 5
   y=6:  · · · ·   :   · ·
   y=5:  · · · ·   :   · ·  ← Vinç Alanı
   y=4:  a a . .   #   · ·
   y=3:  b b c .   #   W W
   y=2:  d d c c   #   G W
   y=1:  . d e e   #   G G
   y=0:  f f g g   #   Y Y
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_90` | W | (0,4) | 2. kat y1; önce sahada kaydırılır |
| `b` | `D2_90` | Y | (0,3) | 1. kat y0 (ilk gereken) |
| `c` | `C3_0` | G | (2,2) | 1. kat y1–2 |
| `d` | `C3_180` | W | (0,1) | 1. kat y2–3 |
| `e` | `D2_90` | Y | (2,1) | 2. kat y3 |
| `f` | `D2_90` | Y | (0,0) | 2. kat y0 |
| `g` | `D2_90` | W | (2,0) | 2. kat y2 |

Kanonik çözüm (solver, K-50 madde 4):
1. `a` (D2_90 W) (0,4) → (2,4) — **kaydırma**
2. `b` (D2_90 Y) (0,3) → (4,0) — duvar üstü, doğru
3. `a` (D2_90 W) (2,4) → (0,4) — **kaydırma**
4. `c` (C3_0 G) (2,2) → (4,1) — duvar üstü, doğru
5. `d` (C3_180 W) (0,1) → (4,2) — duvar üstü, doğru
6. `f` (D2_90 Y) (0,0) → (4,0) — duvar üstü, doğru
7. `a` (D2_90 W) (0,4) → (4,1) — duvar üstü, doğru
8. `g` (D2_90 W) (2,0) → (4,2) — duvar üstü, doğru
9. `e` (D2_90 Y) (2,1) → (4,3) — duvar üstü, doğru

Öğretici:
1. `piece:0` · drag `[[0,4],[2,4]]` · `tut.m.park` · `{ event: yardMove, count: 1, piece: 'piece:0' }` (`a`nın sol hücresi (0,4), iki sağa; son çapa (2,4) = kanonik hamle 1)
2. `startOn: { event: yardMove, piece: 'piece:0' }` · `crane`, `wall` · — · `tut.m.highwall` · `{ event: overWall, count: 1 }` (`a` park edilince)

### Bölüm 7 — Çatı Altı (Under the Roof)

| Alan | Değer |
|---|---|
| Öğretilen | Takas ve yer açma (T4 + T6): büyük `O4` W sonraki kata kalır, bu kat iki yatay W ile dolar; önce dipte yer aç |
| Zorluk / hedef kazanma | Normal / %70 |
| Boyut (K-49) | `yard { cols 5, rows 4 }`, `site { cols 2, rows 4 }` → H = 4, Vinç Alanı y = 4–5 |
| Duvar | `height 4` (Yüksek Duvar, W2); geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Tavan Arası (EN: Attic) `["GG", "GG", "WW", "WW"]` · 2. Çatı Kirişi (EN: Roof Beam) `["RR", "RR", "WW", "WW"]` |
| Renkler / şekiller | G, R, W (3) / D2, O4 |
| Saha | C = 20, F = 16, E = 4 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 7 · min 11 · minShifts 4 · firstNeedDepth 1 · YAO 7/7 · trapCount 0 · maxCover 2 · depLater 2 · crossDeps 4 · parkSlack 0,5 · forced 9 · greedyWin 1 · greedyExcess 2 · greedyTrap – · ahaMin 2 · branch3 0,27 · 133 422 durum, complete evet, undetectedDead 0, D1 0 |
| Hamle (K-52, D-099) | 11 + P 2 = **13** |

**Tasarım niyeti:** Birinci katın W bölgesine `O4` W de uyar ama onu almak dikey R çiftini kazdırır. Kanonik çözüm önce dipteki `f`yi bir hücre sağa, dikey `d`yi köşeye kaydırır (iki `prep` hamlesi, `ahaMin` 2); böylece `b` sola geçer ve `c` açılır. İki yatay W bu katı doldurur, `O4` W ikinci katın tabanı olur. Açgözlü oyun 2 fazla hamle harcar (`greedyExcess` 2).

```
       x: 0 1 2 3 4   D   5 6
   y=5:  · · · · ·   :   · ·
   y=4:  · · · · ·   :   · ·  ← Vinç Alanı
   y=3:  . . b a a   #   G G
   y=2:  d . b c c   #   G G
   y=1:  d e e g g   #   W W
   y=0:  f f . g g   #   W W
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_90` | G | (3,3) | 1. kat y3 |
| `b` | `D2_0` | R | (2,2) | 2. kat y2–3; önce sahada kaydırılır |
| `c` | `D2_90` | W | (3,2) | 1. kat y0 (ilk gereken) |
| `d` | `D2_0` | R | (0,1) | 2. kat y2–3; önce sahada kaydırılır |
| `e` | `D2_90` | G | (1,1) | 1. kat y2; önce sahada kaydırılır |
| `f` | `D2_90` | W | (0,0) | 1. kat y1; önce sahada kaydırılır |
| `g` | `O4_0` | W | (3,0) | 2. kat y0–1 |

Kanonik çözüm (solver, K-50 madde 4):
1. `f` (D2_90 W) (0,0) → (1,0) — **kaydırma**
2. `d` (D2_0 R) (0,1) → (0,0) — **kaydırma**
3. `b` (D2_0 R) (2,2) → (0,2) — **kaydırma**
4. `c` (D2_90 W) (3,2) → (5,0) — duvar üstü, doğru
5. `e` (D2_90 G) (1,1) → (3,2) — **kaydırma**
6. `f` (D2_90 W) (1,0) → (5,1) — duvar üstü, doğru
7. `e` (D2_90 G) (3,2) → (5,2) — duvar üstü, doğru
8. `a` (D2_90 G) (3,3) → (5,3) — duvar üstü, doğru
9. `g` (O4_0 W) (3,0) → (5,0) — duvar üstü, doğru
10. `d` (D2_0 R) (0,0) → (5,2) — duvar üstü, doğru
11. `b` (D2_0 R) (0,2) → (6,2) — duvar üstü, doğru

Öğretici:
1. `startOn: { event: segmentDone }` · `piece:6` · — · `tut.m.carryNow` · `{ event: placementCorrect, count: 1 }` (ikinci kat başında `O4` W vurgulanır)

### Bölüm 8 — Bahçe Çiti (Garden Fence)

| Alan | Değer |
|---|---|
| Öğretilen | **Y5 Ağır Yük**: plana girmez, yalnız sahada kayar; Çekiç onu kırar (`teaches: "Y5"`) |
| Zorluk / hedef kazanma | Normal (tanıtım) / %85 |
| Boyut (K-49) | `yard { cols 6, rows 5 }`, `site { cols 2, rows 4 }` → H = 5, Vinç Alanı y = 5–6 |
| Duvar | `height 5` (Yüksek Duvar, W2); geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Çit Direkleri (EN: Fence Posts) `["WW", "WW", "RR", "RR"]` · 2. Çit Tahtaları (EN: Fence Boards) `["RR", "YY", "YY", "YY"]` |
| Renkler / şekiller | R, W, Y (3) / D2, O4, Q9 |
| Saha | C = 30, F = 25, E = 5 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 7 · min 10 · minShifts 3 · firstNeedDepth 3 · YAO 7/7 · trapCount 0 · maxCover 3 · depLater 3 · crossDeps 4 · parkSlack 0,83 · forced 7 · greedyWin 1 · greedyExcess 0 · greedyTrap – · ahaMin 0 · branch3 0,21 · 446 663 durum, complete evet, undetectedDead 0, D1 0 |
| Hamle (K-52, D-099) | 10 + P 4 = **14** |

**Tasarım niyeti:** `Q9` Ağır Yük (`e`) sağ üstte, `O4` Y'nin sağ yarısının ve `h`nin üstündedir; sahada park yeri yoktur. Önce `O4` Y bir sola kayar, yük boşalan satıra bir satır iner (yalnız saha içinde kayar, K-44) ve saha tepesinde park yeri açar; üstteki Y (`a`) oraya park edilir ve R tabanı açılır. Yük ikinci katta yerinde kalır, `h` sola kayıp çıkar. Çekiç yükü baştan kırarsa `min` 8 olur (`hammer-start` −2). Tanıtım sade: üç kaydırma, tuzak yok; bu bölümde bekletme yoktur (`ahaMin` 0, §6.10).

```
       x: 0 1 2 3 4 5   D   6 7
   y=6:  · · · · · ·   :   · ·
   y=5:  · · · · · ·   :   · ·  ← Vinç Alanı
   y=4:  a a . Q Q Q   #   · ·
   y=3:  b b d Q Q Q   #   W W
   y=2:  c c d Q Q Q   #   W W
   y=1:  f . g g . .   #   R R
   y=0:  f . g g h h   #   R R
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_90` | Y | (0,4) | 2. kat y0; önce sahada kaydırılır |
| `b` | `D2_90` | R | (0,3) | 1. kat y0 (ilk gereken) |
| `c` | `D2_90` | R | (0,2) | 1. kat y1 |
| `d` | `D2_0` | W | (2,2) | 1. kat y2–3 |
| `e` | `Q9_0` | — (Ağır Yük, `color` yazılmaz) | (3,2) | Ağır Yük; plana girmez, yalnız sahada kayar |
| `f` | `D2_0` | W | (0,0) | 1. kat y2–3 |
| `g` | `O4_0` | Y | (2,0) | 2. kat y1–2; önce sahada kaydırılır |
| `h` | `D2_90` | R | (4,0) | 2. kat y3 |

Kanonik çözüm (solver, K-50 madde 4):
1. `g` (O4_0 Y) (2,0) → (1,0) — **kaydırma**
2. `e` (Q9_0 Ağır Yük) (3,2) → (3,1) — **kaydırma**
3. `a` (D2_90 Y) (0,4) → (2,4) — **kaydırma**
4. `b` (D2_90 R) (0,3) → (6,0) — duvar üstü, doğru
5. `c` (D2_90 R) (0,2) → (6,1) — duvar üstü, doğru
6. `f` (D2_0 W) (0,0) → (6,2) — duvar üstü, doğru
7. `d` (D2_0 W) (2,2) → (7,2) — duvar üstü, doğru
8. `a` (D2_90 Y) (2,4) → (6,0) — duvar üstü, doğru
9. `g` (O4_0 Y) (1,0) → (6,1) — duvar üstü, doğru
10. `h` (D2_90 R) (4,0) → (6,3) — duvar üstü, doğru

Öğretici:
1. `piece:4`, `piece:6` · — · `tut.m.heavy` · `{ event: yardMove, count: 1, piece: 'piece:4' }` (yük kaydırılınca biter)
2. `booster:hammer`, `piece:4` · tap · `tut.m.hammer` · `{ event: placementCorrect, count: 1 }` (Çekiç yuvası; yük kırılmasa da ilk doğru yerleşimle biter)

### Bölüm 9 — İp Merdiven (Rope Ladder)

| Alan | Değer |
|---|---|
| Öğretilen | **W3 Dar Geçit** (boy 1): yalnız tek sıra boyundaki blok satır 0'dan geçer (`teaches: "W3"`) |
| Zorluk / hedef kazanma | Normal (tanıtım) / %85 |
| Boyut (K-49) | `yard { cols 4, rows 5 }`, `site { cols 2, rows 4 }` → H = 5, Vinç Alanı y = 5–6 |
| Duvar | `height 5` (Yüksek Duvar, W2); geçit `{ type: "static", y: 0, size: 1 }` |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Alt Basamaklar (EN: Lower Rungs) `["GG", "RR", "WW", "WW"]` · 2. Üst Basamaklar (EN: Upper Rungs) `["RR", "RR", "GG", "WW"]` |
| Renkler / şekiller | G, R, W (3) / D2, O4 |
| Saha | C = 20, F = 16, E = 4 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 7 · min 12 · minShifts 5 · firstNeedDepth 2 · YAO 6/7 (1 ray) · trapCount 0 · maxCover 4 · depLater 6 · crossDeps 9 · parkSlack 0,4 · forced 11 · greedyWin 1 · greedyExcess 3 · greedyTrap – · ahaMin 2 · branch3 0,38 · 72 477 durum, complete evet, undetectedDead 0, D1 0 |
| Hamle (K-52, D-099) | 12 + P 4 = **16** |

**Tasarım niyeti:** Dar geçit yalnız satır 0'dadır. Birinci katın tabanı W'dir; `O4` R bir satır yukarı itilir, `e` (W) onun altına girer, R `g` sola kalkar ve `e` satır 0'a inip dar geçitten raya geçer (1 ray); ardından `O4` R sağ alta iner. Beş kaydırmalık bir yer açma dizisidir (iki `prep`, `ahaMin` 2); geçitsiz `min` 14 (`no-gaps` +2).

```
       x: 0 1 2 3   D   4 5
   y=6:  · · · ·   :   · ·
   y=5:  · · · ·   :   · ·  ← Vinç Alanı
   y=4:  . a a .   #   · ·
   y=3:  b b d d   #   G G
   y=2:  c c d d   #   R R
   y=1:  . e e .   #   W W
   y=0:  f f g g   =   W W
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_90` | G | (1,4) | 2. kat y1; önce sahada kaydırılır |
| `b` | `D2_90` | G | (0,3) | 1. kat y3 |
| `c` | `D2_90` | W | (0,2) | 1. kat y1 |
| `d` | `O4_0` | R | (2,2) | 2. kat y2–3; önce sahada kaydırılır |
| `e` | `D2_90` | W | (1,1) | 1. kat y0, raydan (ilk gereken); önce sahada kaydırılır |
| `f` | `D2_90` | W | (0,0) | 2. kat y0 |
| `g` | `D2_90` | R | (2,0) | 1. kat y2; önce sahada kaydırılır |

Kanonik çözüm (solver, K-50 madde 4):
1. `a` (D2_90 G) (1,4) → (0,4) — **kaydırma**
2. `d` (O4_0 R) (2,2) → (2,3) — **kaydırma**
3. `e` (D2_90 W) (1,1) → (2,2) — **kaydırma**
4. `g` (D2_90 R) (2,0) → (0,1) — **kaydırma**
5. `e` (D2_90 W) (2,2) → geçitten raya → (4,0) — **ray**, doğru (düşmez)
6. `d` (O4_0 R) (2,3) → (2,0) — **kaydırma**
7. `c` (D2_90 W) (0,2) → (4,1) — duvar üstü, doğru
8. `g` (D2_90 R) (0,1) → (4,2) — duvar üstü, doğru
9. `b` (D2_90 G) (0,3) → (4,3) — duvar üstü, doğru
10. `f` (D2_90 W) (0,0) → (4,0) — duvar üstü, doğru
11. `a` (D2_90 G) (0,4) → (4,1) — duvar üstü, doğru
12. `d` (O4_0 R) (2,0) → (4,2) — duvar üstü, doğru

Öğretici:
1. `piece:0` · drag `[[1,4],[0,4]]` · `tut.m.dig` · `{ event: yardMove, count: 1, piece: 'piece:0' }` (`a`nın sol hücresi (1,4), bir sola; son çapa (0,4) = kanonik hamle 1)
2. `startOn: { event: yardMove, piece: 'piece:6' }` · `piece:4`, `gap:0` · — · `tut.m.narrow` · `{ event: gapPass, count: 1 }` (`g` kaydırılınca; eldiven yok (blok başlangıç yerinde değil))

### Bölüm 10 — Ağaç Ev Tamam! (Treehouse Done!)

| Alan | Değer |
|---|---|
| Öğretilen | Final: iki kat, yüksek duvar, bekletme ve yer açma; Vinç güçlendiricisi açılır |
| Zorluk / hedef kazanma | **Zor** / **%45** |
| Boyut (K-49) | `yard { cols 4, rows 5 }`, `site { cols 2, rows 4 }` → H = 5, Vinç Alanı y = 5–6 |
| Duvar | `height 5` (Yüksek Duvar, W2); geçit yok |
| Yerçekimi | build `normal`, yard `false` |
| Dilimler | 1. Çatı (EN: Roof) `["GG", "WW", "WW", "RR"]` · 2. Bayrak Kulesi (EN: Flag Tower) `["RR", "GG", "WW", "WW"]` |
| Renkler / şekiller | G, R, W (3) / D2, O4 |
| Saha | C = 20, F = 16, E = 4 (K-55: bütün bloklar baştan sahada, tek parti) |
| Ölçütler (solver) | N 7 · min 13 · minShifts 6 · firstNeedDepth 5 · YAO 7/7 · trapCount 0 · maxCover 3 · depLater 4 · crossDeps 6 · parkSlack 0,33 · forced 13 · greedyWin 0 · greedyExcess 2 · greedyTrap – · ahaMin 1 · branch3 0,43 · 121 022 durum, complete evet, undetectedDead 0, D1 0 |
| Hamle (K-52, D-099) | 13 + P 1 = **14** |

**Tasarım niyeti:** Final: yığını doğru sırayla yeniden dizmek. Birinci katın sırası R, W, W, G'dir; R ve W'ler iki yanda dağınık, `O4` W ortada `d` ile `e`nin üstünde oturur, iki yanı boştur. Kanonik çözüm altı kaydırmayla sağ sütunda R–W–W sırasını kurar (`O4` W sola kayar, R yukarı, iki W onun altına girer), `O4` W sol köşeye iner ve üstteki G onun üstüne park edilir; sonra yedi yerleşim art arda akar. Her en kısa çözüm bir `prep` hamlesi ister (`ahaMin` 1); açgözlü oyun 2 fazla hamle harcar ve P = 1 bütçesiyle kazanamaz (`greedyWin` 0). Üç kat yerine iki kat: üç katlı sabit saha bugünkü tam taramayı aşar (LEVELS §7 U-4, §6.10).

```
       x: 0 1 2 3   D   4 5
   y=6:  · · · ·   :   · ·
   y=5:  · · · ·   :   · ·  ← Vinç Alanı
   y=4:  a a b b   #   · ·
   y=3:  . c c .   #   G G
   y=2:  . c c .   #   W W
   y=1:  d d e e   #   W W
   y=0:  f f g g   #   R R
```

| Kimlik | Şekil | Renk | Çapa (x,y) | Rol |
|---|---|---|---|---|
| `a` | `D2_90` | G | (0,4) | 1. kat y3; önce sahada kaydırılır |
| `b` | `D2_90` | G | (2,4) | 2. kat y2 |
| `c` | `O4_0` | W | (1,2) | 2. kat y0–1; önce sahada kaydırılır |
| `d` | `D2_90` | W | (0,1) | 1. kat y1; önce sahada kaydırılır |
| `e` | `D2_90` | R | (2,1) | 1. kat y0 (ilk gereken); önce sahada kaydırılır |
| `f` | `D2_90` | W | (0,0) | 1. kat y2; önce sahada kaydırılır |
| `g` | `D2_90` | R | (2,0) | 2. kat y3 |

Kanonik çözüm (solver, K-50 madde 4):
1. `c` (O4_0 W) (1,2) → (0,2) — **kaydırma**
2. `e` (D2_90 R) (2,1) → (2,3) — **kaydırma**
3. `d` (D2_90 W) (0,1) → (2,2) — **kaydırma**
4. `f` (D2_90 W) (0,0) → (2,1) — **kaydırma**
5. `c` (O4_0 W) (0,2) → (0,0) — **kaydırma**
6. `a` (D2_90 G) (0,4) → (0,2) — **kaydırma**
7. `e` (D2_90 R) (2,3) → (4,0) — duvar üstü, doğru
8. `d` (D2_90 W) (2,2) → (4,1) — duvar üstü, doğru
9. `f` (D2_90 W) (2,1) → (4,2) — duvar üstü, doğru
10. `a` (D2_90 G) (0,2) → (4,3) — duvar üstü, doğru
11. `c` (O4_0 W) (0,0) → (4,0) — duvar üstü, doğru
12. `b` (D2_90 G) (2,4) → (4,2) — duvar üstü, doğru
13. `g` (D2_90 R) (2,0) → (4,3) — duvar üstü, doğru

Öğretici:
1. `startOn: { event: segmentDone }` · `booster:crane` · tap · `tut.m.cranebooster` · `{ event: boosterUsed, count: 1 }` (ikinci kat başında Vinç yuvası; güçlendirici kullanılınca biter)

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
| 1 | Ağaç Basamakları / Tree Steps | Kolay (tanıtım) | Kaldır, duvarı aş, bırak; kat bitince kalan bloklar sonraki kat için sahada bekler | T2 | S1 | 5×4 | 2×4 × 2 | 4 / 3 / — | 4 | W, Y | D2, O4 | 6 |
| 2 | Platform / Platform | Kolay | Şekil ve gölge: `C3` çifti; yanlış zamanda denenen blok kaybolmaz | T2 | — | 5×4 | 2×4 × 2 | 4 / 3 / — | 4 | G, W, Y | C3, D2 | 6 |
| 3 | Ön Duvar / Front Wall | Kolay | Kazı: sonraki katın `O4`'ü bu katın bloklarının üstünde; tek cebe çek | T1 | — | 5×4 | 2×4 × 2 | 4 / 3 / — | 4 | G, W, Y | D2, O4 | 7 |
| 4 | Pencere Pervazı / Window Sill | Kolay (tanıtım) | Geçit dipteki bloğa kestirmedir (ikinci katın tabanı raydan) | T8 | W1 | 4×5 | 2×4 × 2 | 5 / 4 / y0 boy 2 | 4 | G, W, Y | D2 | 8 |
| 5 | İki Odalı Ev / Two-Room House | Normal | Bekletme: yerleşebilecek dikey W'yi sonraki kata sakla; park yerini seç | T5 (+T3) | — | 5×4 | 2×4 × 2 | 4 / 3 / — | 4 | R, W, Y | D2 | 8 |
| 6 | Uzun Gövde / Tall Trunk | Normal (tanıtım) | Yüksek duvar: her blok Vinç Alanı'na kalkar; kapağı yükseğe park et | T7 | W2 | 4×5 | 2×4 × 2 | 5 / 5 / — | 4 | G, W, Y | C3, D2 | 7 |
| 7 | Çatı Altı / Under the Roof | Normal | Takas ve yer açma: `O4` W sonraki kata kalır; önce dipte yer aç | T4 (+T6) | — | 5×4 | 2×4 × 2 | 4 / 4 / — | 4 | G, R, W | D2, O4 | 7 |
| 8 | Bahçe Çiti / Garden Fence | Normal (tanıtım) | Ağır Yük kapaktır, yalnız saha içinde kayar ve park yeri açar; Çekiç onu kırar | T9 (ilk yarı) | Y5 | 6×5 | 2×4 × 2 (+ Q9) | 5 / 5 / — | 5 | R, W, Y | D2, O4, Q9 | 7 |
| 9 | İp Merdiven / Rope Ladder | Normal (tanıtım) | Dar geçitten yalnız tek sıra boyundaki blok geçer; önce onu satır 0'a indir | T8 (+T6) | W3 | 4×5 | 2×4 × 2 | 5 / 5 / y0 boy 1 | 4 | G, R, W | D2, O4 | 7 |
| 10 | Ağaç Ev Tamam! / Treehouse Done! | **Zor** | Final: yığını doğru sırayla yeniden diz; Vinç açılır | T6 + T1 | — | 4×5 | 2×4 × 2 | 5 / 5 / — | 4 | G, R, W | D2, O4 | 7 |

**A2 notu (2026-11-02):** tablo gerçekleşen veridir (`levels/*.json`); D0 taslağı (6×4 sahalar, 2×5 katlar, Bölüm 10'da
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
