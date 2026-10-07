# product-lead — Faz 2R çapraz inceleme (design-lead: görsel dil v2, ana sayfa, hafif öğretici)

Tarih: 2026-10-07 · İnceleyen: product-lead · Bağlayıcı: `docs/review_inbox/_orchestrator_rulings_2R.md` (R2-01…R2-11),
GDD K-05, K-16, K-30, K-33, K-34, K-36, K-43, K-47…K-53, §14.1; META §1–§8; LEVELS §2; OBSTACLES Y5, S4.
Kapsam: UX_FLOWS §0.3, §2.2, §3, §5.1–§5.10, §6, §6.1, §7, §12, §13; STORY §0, §6, §6A, §7.7; JUICE §0, #17, #21, #61,
#63, #68, §8 (#91–#106); ART_DIRECTION §1, §2.1–§2.6, §3A, §4, §5, §6, §14.9; ASSET §16.3; tokens `color.block`,
`blockV2`, `layout.adaptive`, `tutorial`.

Özet: Engel 4 · Önemli 10 · Öneri 4

**Tutan noktalar (değişiklik istemez):** taban hex'ler aynı (`tokens.color.block` = ART §2.1: W #764012, Y #FFE23E,
G #44D088, R #CF404E, O #EC8D20, C #C8CFDA, B #2984DE, P #5D3AAE); semboller ve renk körü ölçümü geçerli, v2'de en düşük
sembol kontrastı B 3,2:1 ≥ 3:1. Plan hücresi (düz, kesik kontur, bevel yok) ile şeker blok arasındaki ayrım v1'den büyük.
K-18 gölge tarifi değişmedi. Karartma kalktı (`alpha.tutorialOverlay` = 0). `tutorial.maxStepsPerLevel` 2 ve
`maxWordsPerBubble` 6, K-53 ile aynı. `tut.m.*` 17 satırın hepsi TR/EN ≤ 6 kelime; hiçbirinde renk adı yok; iki satır
dışında "blok" terimi doğru (PL-2R-03, PL-2R-04). `.` hücresi MVP'de çizilmiyor (K-15 `plan_has_window` ile uyumlu;
design-lead sorusu 4 kapandı). Vinç alanı y = H, H+1 ve açık yükseklik `(H + 2) − height` K-05 ile uyumlu (soru 5;
uygulama hatası PL-2R-02'de).

**design-lead sorularına yanıt yeri:** 1 → PL-2R-01 · 2 → PL-2R-06 · 3 → PL-2R-03 · 4 → yukarıda · 5, 6 → PL-2R-02 ·
7 → PL-2R-09, PL-2R-18 · 8 → PL-2R-06.

---

## design-lead

- [PL-2R-01] [product-lead → design-lead] (Engel) UX §13.1 "Adım tipi" ve "Adım alanları" maddeleri, §13.2 "Z satırı
  kuralı" paragrafı ve "Faz 2R dilimi — Bölüm 1–10" tablosu; GDD K-53 madde 2–3, §14.1: (1) UX "`mode` (`required` = Z /
  `soft` = Y) bu anlamla kalır" diyor; K-53 madde 2'ye göre `mode` yalnız `'soft'` olabilir, `'required'` doğrulayıcıda
  `tut_blocking` hatasıdır. Aynı alan iki belgede iki anlam taşıyor. (2) "Z satırı kuralı" GDD §14.1 madde 4'e dayanıyor;
  madde 4 Faz 2R'de geçersiz. (3) Tablo LEVELS §2 `tutorial[]` verisinden 8 bölümde ayrışıyor: B1 adım 2 (`tut.m.match`
  + `timeoutMs` 8000 ↔ `tut.m.useall` / `placementCorrect`), B2 (shadow + useall ↔ pattern + shadow), B4 (gap Z `gapPass`
  + rail ↔ dig `yardMove` + gap `placementCorrect`), B5 adım 2 (`deliveryDone` ↔ `placementCorrect`; teslimat adım 1'i
  bitiren hamlede geldiği için `deliveryDone`'lu adım hiç görünmezdi), B6 (tek adım ↔ park + highwall), B7
  (`tut.ctx.support` ↔ `tut.m.carry` + `tut.m.carryNow`), B8 (`timeoutMs` bitişleri ↔ `yardMove` / `placementCorrect`),
  B10 (`timeoutMs` 3000 ↔ `placementCorrect`). "Fark çıkarsa LEVELS geçerlidir" notu çelişkiyi kaldırmıyor; code-lead ve
  test yazarı iki kaynak görüyor. → (a) Z/Y ayrımını ve `mode` cümlesini sil; yerine "her adım `mode: 'soft'`; adım
  yalnız `done` koşuluyla biter; Gösterim ↔ Gizli geçişleri sunumdur (K-53 madde 3)" yaz. (b) "Z satırı kuralı"
  paragrafını sil. (c) Faz 2R tablosunu LEVELS §2 ile birebir yap ve yalnız sunum sütunlarını (eldiven yolu biçimi, balon
  yuvası, vurgu animasyonu) tut: B1 `tut.m.lift` / `placementCorrect` + `tut.m.useall` / `placementCorrect` · B2
  `tut.m.pattern` + `tut.m.shadow` (ikisi `placementCorrect`) · B3 `tut.m.dig` / `yardMove` + `tut.m.free` /
  `placementCorrect` · B4 `tut.m.dig` / `yardMove` + `tut.m.gap` / `placementCorrect` · B5 `tut.m.segments` /
  `segmentDone` + `tut.m.truck` / `placementCorrect` · B6 `tut.m.park` / `yardMove` + `tut.m.highwall` / `overWall` · B7
  `tut.m.carry` / `placementCorrect` + `tut.m.carryNow` (`startOn: segmentDone`) / `placementCorrect` · B8 `tut.m.heavy`
  / `yardMove` + `tut.m.hammer` / `placementCorrect` · B9 `tut.m.narrow` / `gapPass` (tek adım) · B10
  `tut.m.cranebooster` / `placementCorrect` (tek adım). Bölüm 1–10'da `timeoutMs` kullanılmaz. `tut.m.match`,
  `tut.m.rail`, `tut.m.drop` STORY'de kalabilir, dilimde kullanılmaz.

- [PL-2R-02] [product-lead → design-lead] (Engel) UX §5.8 kural 1–6 ve örnek tablo; §5.3 "Vinç alanı tavanı" satırı;
  §13.2 bağlamsal tablo `tut.ctx.tootall` satırı; ART §5 gövde metni; GDD K-49, K-05: §5.8 tek bir `rows` kullanıyor
  ("saha `yard.cols × rows`, şantiye `site.cols × rows`"). K-49'da saha Hy, şantiye Hs ayrıdır; tahta yüksekliği
  `H = max(Hy, Hs + eMax)`. Dilimin 10 bölümünden 9'unda Hy < H (yalnız B7'de Hy = Hs = H). Saha çerçevesi H değil Hy
  satır olmalı ve saha üstü hava (x ≤ Wy−1, Hy ≤ y ≤ H−1; bırakma iptal, K-05) görünmeli. `rows` = Hy okunursa vinç alanı
  tahtanın içine düşer ve açık yükseklik yanlış çıkar: B1'de `(4 + 2) − 4 = 2` çizilir, doğrusu `(5 + 2) − 4 = 3`; 3 boylu
  blok geçebilirken oyuncu geçemez sanır. §5.3 ve §13.2 hâlâ `10 − height` yazıyor. Örnek tablodaki 6 + 1 × 5 (Ws = 1
  MVP'de yok, K-49) ve 4 + 4 × 6 (Ws = 4 yalnız Bölüm 31–50) dilimde yok. → (1) §5.8: `boardTopY = boardBottomY − H·120`;
  saha çerçevesi `boardBottomY − Hy·120` ile `boardBottomY` arası; saha üstü hava (H − Hy satır) zeminsiz gök bandı,
  ızgarasız, çerçevesiz; şantiye iskelesi Hs + e satır; Hs + e < H ise şantiye üstü hava ART §4 "plan dışı" dolgusuyla;
  vinç alanı üstü `boardTopY − 240`; açık yükseklik `(H + 2) − height`; panorama hücresi `min(24, ⌊98 / Hs⌋)`. (2) §5.3
  satırı "boyu > (H + 2) − height", §13.2 satırı "(H + 2) − height çentik"; ART §5 gövdesindeki "y = 10" ve
  "10 − height" H cinsinden. (3) Örnek tabloyu dilimin gerçek boyutlarıyla değiştir (soru 6 yanıtı; FIT, `boardBottomY`
  1488; sıra: boyut, H, duvar → boardW / yardX / wallX / buildX, saha tepesi y, tahta tepesi y, vinç alanı tepesi y,
  çentik): B1, B2, B3, B5 4×4 + 2×5, H 5, duvar 4 → 780 / 150 / 630 / 690, 1008, 888, 648, 3 · B4, B9 4×4 + 2×6, H 6,
  duvar 4 → 780 / 150 / 630 / 690, 1008, 768, 528, 4 · B6 4×5 + 2×7, H 7, duvar 7 → 780 / 150 / 630 / 690, 888, 648,
  408, 2 · B7 4×5 + 2×5, H 5, duvar 5 → 780 / 150 / 630 / 690, 888, 888, 648, 2 · B8 6×5 + 2×6, H 6, duvar 5 → 1020 /
  30 / 750 / 810, 888, 768, 528, 3 · B10 6×5 + 2×6, H 6, duvar 6 → 1020 / 30 / 750 / 810, 888, 768, 528, 2.

- [PL-2R-03] [product-lead → design-lead] (Engel) UX §5.2 tablo (Çekiç, Altın Mala satırları), §5.5 madde 1 son cümlesi,
  §13.2 bağlamsal "Altın Mala ilk kez kazanıldı" satırı; ART §4 "Altın Mala hedefleri bu kümedir"; JUICE #17, #61; STORY
  `booster.hint.trowel`, `tut.ctx.goldtrowel`, `tut.m.hammer`; ASSET §16.3 #17; GDD K-33, K-36: Altın Mala Usta
  Serisi'yle Bölüm 1'den, Çekiç Bölüm 8'den itibaren dilimdedir. Bu satırlar Faz 1 davranışını anlatıyor: mala "plan
  hücresini sıvar" (K-33 Faz 2R: önce sahadaki malzeme bloğu, sonra P konumu; blok olmadan hücre doldurmak tam örtüyü
  bozar), Çekiç "saha bloğunu 4 parçaya kırar" (K-36: malzeme bloğu kırılmaz; hedefler Ağır Yük, kasa, torba, zincir,
  şantiyedeki moloz ve yapışmış harçlı blok). `tut.m.hammer` "Çekiç sıkışan bloğu kırar." oyuncuya yanlış kural öğretir.
  EN-2R-10 ile aynı yöndeyim; ek olarak §5.5, ART §4, JUICE #17/#61 ve STORY satırları da değişmeli. Soru 3 yanıtı: R2-05
  kararı K-36'dır, Çekiç kalır. → (1) UX §5.2 Altın Mala: 1. dokunuş sahadaki malzeme bloğu (P'si boş olanlar ile kilitli,
  zincirli, ıslak ve kuyruktaki bloklar α 0,5); |P| = 1 ise blok kendiliğinden uçar, |P| ≥ 2 ise 2. dokunuş vurgulanan P
  konumlarından birine (gölge dilinde, ✓ rozetli); P boşsa blok 2 px titrer, mala harcanmaz. (2) §5.5 madde 1 ve ART §4'ten
  "Altın Mala hedefleri bu kümedir" cümlesini sil (P bloğa bağlıdır, inşa cephesiyle aynı küme değildir). (3) JUICE #17:
  blok sahadan kavisle P konumuna uçar (altın iz), iner, ardından #12 + #92; süre 450 ms aynı. (4) JUICE #61: malzeme
  bloğunun kırılma görselini sil; Ağır Yük/kasa/torba kırılır, zincirde yalnız zincir kırılır (#36), şantiyedeki
  moloz/harçlı blok #8 kavisiyle sahaya iner. Hedefsiz bölümde (dilimde B9; B1–B7'de yuva zaten kilitli) yuva gri +
  `booster.hammer.noTarget` balonu (öncelik EN-2R-11: kilitli > hedefsiz > adet 0). (5) STORY: `booster.hint.trowel` TR
  "Yerleştirilecek bloğa dokun." / EN "Tap the block to place."; `tut.ctx.goldtrowel` TR "Mala ile sahadaki bloğa dokun."
  / EN "Trowel: tap a block to place."; `tut.m.hammer` TR "Çekiç blok kırmaz, yükü kırar." / EN "Hammer smashes cargo,
  never blocks."; Kural sütunundaki "R2-05 kararına bağlı" notunu sil. (6) §13.2 bağlamsal mala satırının vurgusu
  `streak` → `front` yerine `streak` → seçilebilir saha blokları. (7) ASSET #17 `icon_hammer` kullanım notu "Bölüm 8,
  K-36"; ikon dilimde gerekli.

- [PL-2R-04] [product-lead → design-lead] (Engel) ART §6 "Ağır malzeme Y5" satırı, ART §1 sütun 8; STORY §6A
  `tut.m.heavy`; OBSTACLES Y5, GDD K-44, K-48: ART "Normal blok tarifi + şerit … Genişlik ≥ 3" Faz 1 tanımıdır. Faz 2R'de
  Ağır Yük yalnız I5/Q9'dur, malzeme değildir, **renksizdir** (`color` yok sayılır) ve sahada kalabilir. "Normal blok
  tarifi" renk ve sembol ister, veri renk vermez: bu satırla çizilemez. Renkli şeker blok gibi görünürse oyuncu onu plana
  sokmaya çalışır ve `tut.m.useall` "Bütün bloklar plana girecek." ile çelişir. Bölüm 8 ve 10 dilimde. `tut.m.heavy`
  "Geniş blok: kenara çek." aynı hatayı metinde yapıyor. Ayrıca ikaz şeridi ART §1 sütun 8'in kapalı listesinde yok. →
  (1) ART §6 Y5 satırı: Q9 = 3×3 yük paleti (ahşap palet üstünde kayışlı çelik sandık), I5 = 5×1 çelik I-kiriş; tek parça
  çizim (hücre başına yastık yok); 8 blok renginden hiçbiri kullanılmaz (her blok tabanına ΔE00 ≥ 20, renk körü
  simülasyonlarında C'ye ΔE00 ≥ 12); sembol yok; iki köşede 16 px sarı-siyah ikaz bandı + 40 px kettlebell rozeti; 6 px
  koyu kontur. Kabul: 375 pt ekran görüntüsünde 5 kişiden 5'i "bu plana girmez" der. ART §1 sütun 8 listesine "Ağır Yük"
  eklenir. (2) `tut.m.heavy` TR "Ağır yük plana girmez: kenara kaydır." / EN "Heavy cargo stays out. Slide it."; Kural
  sütunu "Y5, K-10, K-48". (3) Oyuncuya görünen hiçbir metinde Ağır Yük "blok" diye anılmaz (`obs.y5.desc` "Ağır yük" ile
  aynı).

- [PL-2R-05] [product-lead → design-lead] (Önemli) JUICE §0 kural 3, #21a–#21c; UX §0.3 "Animasyon sırasında girdi",
  §5.1 "Durumlar: kilitlenme", §13.2 bağlamsal "İlk Kamyon Yardımı" satırı; STORY §6 `tut.ctx.truckhelp.material`,
  `tut.ctx.reshuffle`; GDD K-30: Faz 2R'de Kamyon Yardımı = D1 yeniden dizme + Söküm. D2 `B1` teslimatı (#21b,
  `tut.ctx.truckhelp.material`) ve D3 yeniden şekillendirme (#21c `reshape`) kaldırıldı. Söküm'ün sunumu (K-30: geri
  sökülen bloklar sahadaki önceki yerlerine uçar, Usta Dede tek satır `tut.ctx.teardown`) hiçbir belgede yok. D3 MVP'de
  zorunlu; Kolay/Normal'de ✓-tuzağı 0 olsa da tarama kapsamı (K-50 madde 8) dışında çıkmaz oluşabilir, B10 Zor. → (1)
  JUICE'a #107 "Söküm (K-30)": `teardown.pieces[]` blokları şantiyeden kalkar, kavisle sahadaki önceki çapalarına uçar
  (son yerleşenden başlayarak 80 ms arayla), inişte toz; Usta Serisi boncukları söner (c = 0); hamle sayacı değişmez ve
  sayaçta animasyon yok (iade yok, ceza vurgusu da yok); balon `tut.ctx.teardown` 1,2 s. Süre 600 ms
  (`duration.teardown`), girdi kilitli, dokunuş 3× hızlandırır; azaltılmış harekette 150 ms solma. Söküm balonu bağlamsal
  tablonun "bir kez" kuralının istisnasıdır: her Söküm'de gösterilir (oyuncu tahtanın neden geri gittiğini görmeli). (2)
  #21b'yi ve #21c'nin `reshape` kısmını sil; #21c yalnız D1 `reshuffle`. JUICE §0 kural 3 ve UX §0.3 kilit listesi:
  "#21a 600, #21c 900, #107 600". (3) UX §5.1: "kilitlenme (K-30: D1 yeniden dizme ya da Söküm)". (4) §13.2 bağlamsal
  tablo: `tut.ctx.truckhelp.material` satırı kalkar, `tut.ctx.teardown` satırı eklenir; STORY `tut.ctx.reshuffle` Kural
  sütunu "K-30 D1". (5) Kayıp penceresi, Söküm sonrası durumu gösterir (EN-2R-01).

- [PL-2R-06] [product-lead → design-lead] (Önemli) UX §5.9 madde 1 ve 4; §7 Pencere 1 tel kafesi ("Kalan: 2 hücre");
  STORY §7.7 `lose.blocksLeft`; GDD K-47, K-48: Sayım tanımı ("saha + kuyruk + elde + teslim edilmemiş partiler") (a)
  şantiyede yanlış konumda duran malzeme bloklarını (S4 moloz, Y8 yapışmış harçlı blok) dışarıda bırakıyor, oysa K-48 için
  onlar da yerleşmeli; (b) "elde" bloğunu sahadakiyle iki kez sayma riski taşıyor; (c) Vinç, Altın Mala, Söküm ve Geri Al
  için değişim yazılmamış. Soru 2 yanıtı: gelecek partiler sayılır (K-48 madde 3; bilgi gizlenmez). Soru 8 yanıtı: kayıp
  penceresinde blok bilgisi kabul. → (1) Tek formül: `kalan = N − doğru yerleşmiş malzeme bloğu sayısı` (N = bölümün
  bütün partilerindeki ve molozundaki malzeme blokları, K-47; Ağır Yük, kasa, torba sayılmaz). Sonuç: her doğru
  yerleşimde (sürükleme, Vinç, Altın Mala) −1; Söküm'de geri sökülen blok başına +1; Geri Al bir doğru yerleşimi geri
  alırsa +1; kazı, hatalı yerleşim, geri sekme, Çekiç ve teslimat sayıyı değiştirmez. Değer 0 ⇔ bütün dilimler tamam
  (K-47 madde 5). Test adı önerisi: "K-48 blocks-left chip equals N minus correct". (2) §7 Pencere 1 tel kafesi:
  `lose.blocksLeft` "Kalan: {n} blok" + ek hedef satırı ("Kasa ×1"); `lose.left` (hücre) kalkar. (3) EN tekil/çoğul:
  `lose.blocksLeft` EN "Blocks left: {n}" (n = 1'de "1 blocks" yazılmasın).

- [PL-2R-07] [product-lead → design-lead] (Önemli) UX §5.9 madde 3; JUICE #94; STORY §7.7 `win.clear`; ART §4 Faz 2R
  notunun son maddesi; GDD K-48, E-27: K-48'e göre Ağır Yük, kasa ve torba sahada kalabilir; B8 ve B10'da Çekiç
  kullanılmazsa Q9 sahada durur. "Saha tertemiz!" bu durumda yanlış bilgi verir; EN "All blocks used!" ile anlam da
  ayrışıyor. ART §4'teki "son plan hücresi dolunca saha da boşalmış olur" aynı hata. Tetik "son doğru yerleşim"
  yazılmış; E-27 durumunda (dilimler tamam, `clear` hedefi eksik) kazanma son yerleşimden sonra bir Çekiç vuruşuyla
  gelir. → (1) `win.clear` TR "Bütün bloklar yerinde!" / EN "Every block in place!". (2) #94'ün tetiği K-48'in sağlandığı
  an (hamle sonu adım 11 ya da güçlendirici mini hattının adım 11'i); dizi: #18 (bu hamlede dilim bittiyse) → #94 → #55.
  (3) Altın süpürme sahada kalan Ağır Yük, kasa ve torbanın üstünden geçer, onları kaldırmaz. (4) ART §4 cümlesi: "son
  plan hücresi dolunca sahada malzeme bloğu kalmaz; Ağır Yük, kasa ve torba kalabilir (K-48)".

- [PL-2R-08] [product-lead → design-lead] (Önemli) UX §6.1 tel kafes ve aşama tablosu; tokens `layout.win`; META §3.1:
  v1'de "Altın Mala ×1 ● 10" satırı vardı; v2'de yalnız Bonus İnşaat satırı ile ★/● kapsülleri var. Kalan mala başına 10
  altın verilir ve Usta Serisi her bölümde çalıştığı için (K-33) Bölüm 1'den itibaren elde mala kalabilir. Satır olmadan
  ödül toplamı (● +61) açıklanamaz (BUSINESS E1). → Bonus satırının altına aynı kalıpta (760×64 panel çukuru)
  "Altın Mala ×n · ● 10·n" satırı (`win.trowel`), yalnız n ≥ 1 iken; ödül kapsülleri 80 px (64 + 16) aşağı kayar (yeni
  token `layout.win.trowelRowY`). Mala sikkeleri mala yuvasından altın kapsülüne uçar (#56 son cümlesi). Dilimdeki 1–10
  tekrar döngüsünde (PL-2R-18) bu satır ve Bonus İnşaat satırı gösterilmez.

- [PL-2R-09] [product-lead → design-lead] (Önemli) UX §3 "Kenar ikonları" satırı, "Durumlar → İlk açılış" ve "Kilitli";
  §2.2 adım 7–11; §6 "Faz 2R dikey dilimi" paragrafı; §3.1 can penceresi "Altın al"; §7 Pencere 1; META §1, §8.2, §8.3:
  (a) "Açılmadan gizli (sürpriz)" bölüm sandığını da kapsıyor; META §8.2'ye göre sandık ilerlemesi Bölüm 1'den görünür ve
  içerik açılmadan önce görünür (BUSINESS E1). Dilimde Bölüm 10 sandığı var (§12 `W -->|10. bölüm| CH`); Faz 2R yedeğindeki
  "kenar ikonları gizli" aynı çelişkiyi taşıyor. (b) Kumbara (META §8.3, açılış 20) kenar ikonu listesinde yok. (c) Faz
  2R yedeğinde üç boşluk var: görev yokken `story.ch1.start` hiç tetiklenmiyor (META §1 tetiği = 1. görev); Mağaza
  kilitliyken +5 penceresindeki ve can penceresindeki "Altın al" ölü uç; Bölüm 10 sonrası 1–10 döngüsünde yıldız, altın ve
  öğretici tanımsız. META kararım PL-2R-18'dadır. → (1) Bölüm sandığı ikonu sağ kenarda Bölüm 1'den itibaren her zaman
  görünür (ilerleme halkası "n/10"; dokununca içerik önizlemesi); diğer kenar ikonları (Köprü 15, Lig 25, günlük ödül 2.
  takvim günü, kumbara 20) açılışa kadar gizli kalır. §2.2 adım 7 ve §3/§6 Faz 2R yedeği buna göre. (2) Kumbara ikonunu
  sağ kenar listesine ekle. (3) PL-2R-18'u işle: dilimde görev penceresi yok; `story.ch1.start` Bölüm 1 kazanıldıktan
  sonraki ilk ana sayfa girişinden önce oynar (§2.2 adım 8–9 dilimde atlanır); Mağaza kilitliyken "Altın al" gösterilmez,
  aynı yerde aynı boyda gri pasif düğme "Altın yetmiyor" (yeni anahtar, TR 2 / EN "Not enough coins" 3 kelime); reklam
  seçeneği (yalnız 1. teklif) ve ömrün ilk ücretsiz teklifi değişmez; döngü bölümlerinde öğretici yok, ★ kapsülü yok,
  ödül yalnız kazanma tabanı.

- [PL-2R-10] [product-lead → design-lead] (Önemli) STORY §0 kural 4, §6 giriş paragrafı ("`tut.ctx.*` ve `tut.meta.*`
  satırları zaten ≤ 6 kelimedir"), §6 tablosu, §6A; LEVELS §2.0 madde 8: Aynı balonu kullanan 13 satır 6 kelime sınırını
  aşıyor (`{n}`, `{ok}` = 1 kelime): `tut.ctx.streak` EN 10, `tut.ctx.goldtrowel` EN 8, `tut.ctx.tootall` EN 7,
  `tut.ctx.queue` EN 7, `tut.ctx.reshuffle` EN 8, `tut.ctx.truckhelp.material` EN 9, `tut.ctx.truckhelp.free` EN 9,
  `tut.ctx.blocked` EN 8, `tut.ctx.resume` EN 9, `tut.meta.bridge` TR 7 / EN 9, `tut.meta.league` TR 7 / EN 8,
  `tut.meta.daily` EN 7, `tut.meta.piggy` EN 7. LEVELS §2 adımlarının istediği 5 anahtar yok: `tut.m.park`, `tut.m.carry`,
  `tut.m.carryNow`, `tut.ctx.teardown`, `booster.hammer.noTarget` (+ EN-2R-11 `booster.brush.noTarget`). JSON yazılınca
  i18n denetimi B6, B7, B8 ve Söküm için kırılır. → (1) Listelenen satırları TR ve EN ≤ 6 kelimeye kısalt; §6 giriş
  cümlesini düzelt. (2) Yeni satırlar (öneri; ton design-lead'in): `tut.m.park` TR "Üsttekini yükseğe park et." / EN
  "Park the top one high." (K-10) · `tut.m.carry` TR "Bu blok sonraki kat için." / EN "This one's for the next floor."
  (K-27) · `tut.m.carryNow` TR "Şimdi sırası geldi!" / EN "Now it's its turn!" (K-27) · `tut.ctx.teardown` TR "Çıkmaz
  oldu, son bloğu söktük." / EN "Dead end, so we undid that." (K-30) · `booster.hammer.noTarget` TR "Burada kırılacak yük
  yok." / EN "Nothing to smash here." (K-36).

- [PL-2R-11] [product-lead → design-lead] (Önemli) ART §6 "Moloz S4" satırı; UX §5.4 "Hatalı — moloz (`debris`)" satırı
  ve "birincil neden" sırası; OBSTACLES S4, GDD K-16: Faz 2R'de moloz renkli bir malzeme bloğudur, yalnız başlangıç
  konumunda yanlıştır; ilk ayrılışta `debris` bayrağı kalkar ve sıradan blok olur; K-16 koşul 2 ("moloz hiçbir yerde
  doğru olamaz") kaldırıldı. ART "#8D8579, sembol yok" rengi gizler (renk körü sembol kuralı ve "bilgi gizlenmez"
  ilkesi); UX §5.4 satırı "moloz şantiyede hiçbir yere doğru inmez" diyor ve `debris` gölge nedeni artık oluşmaz.
  Bölüm 17 Faz 3'tedir, ama kural–sunum çelişkisi belge düzeltmesiyle bu turda kapanır. → (1) ART §6: moloz = §3A şeker
  blok (kendi rengi ve sembolü, kontrast kuralları aynen) + "yanlış yerde" katmanı: çatlak/toz dokusu α ≤ 0,35
  (sembolün altında) + sağ üstte 40 px "↩" rozeti; bayrak kalkınca katman ve rozet 200 ms'de söner. (2) UX §5.4 moloz
  satırını sil; birincil neden sırası `outside → color → support` (`window` yalnız S2 geri gelirse). GDD K-34 kanca 2
  sırasını aynı biçimde düzeltiyorum (PL-2R-17).

- [PL-2R-12] [product-lead → design-lead] (Öneri) UX §13.1 "Balon" (alt yuva) ve "Bağlamsal öğreticiler" maddeleri; GDD
  K-53 madde 4: (a) FIT'te (1080×1920) alt yuva y 1480–1584'e oturur; durum şeridiyle (y 1504–1600, Usta Serisi) 80 px,
  sahanın alt satırıyla (y 1368–1488) 8 px kesişir. B1 adım 2 (`goals`) bu yuvaya gider ve Usta Serisi şeridini örter.
  390×844 EXPAND'de kesişme yok. (b) K-53 madde 4 (adım etkinken gelen bağlamsal satır adım bitince gösterilir) UX'te
  yazılı değil. → (a) Kural: balon dikdörtgeni saha hücreleriyle ve durum şeridiyle kesişmez; iki yuva da kesişiyorsa
  balon üst yuvaya gider. Kabul: 1080×1920 ve 390×844 ekran görüntülerinde B1–B10'un her adımında kesişme 0 px. (b)
  §13.1'e: "adım etkinken (Gösterim ya da Gizli) gelen `tut.ctx.*` satırı kuyruğa girer; adımın Bitiş'inden 400 ms
  sonra gösterilir; `tut.ctx.teardown` kuyruğa girmez, hemen gösterilir".

- [PL-2R-13] [product-lead → design-lead] (Öneri) ART §3A.3, §5, §12; UX §5.8: Oyun okunurluğu için üç ölçülebilir
  kabul: (a) Şekil okuma (K-16; LEVELS §2.0 madde 4 tuzak kuralı şekil ayrımına dayanır): bitişik iki aynı renkli `D2_0`
  ile tek `O4` aynı renkte yan yana; 375 pt'de 5 kişiden 5'i 1 sn içinde "iki blok / tek blok" ayrımını yapar; renk
  körü simülasyonu (deutan, protan) aynı testle. Oluk (taban × 0,88) ile kontur (× 0,42) açıklık farkı ART §3A.3'e sayı
  olarak yazılır. (b) Geçit açıklığının dolgusu açıkça `board.craneSky` olsun; arkadaki illüstrasyon (ART §7.1) açıklıkta
  görünmesin (geçit, sahne nesnesiyle karışmaz). (c) Sembol v1'de 0,46c (55 px), v2'de 0,42c (50 px): 375 pt'de 8 sembol
  ayırt etme testi (5/5 kişi) §12'ye eklensin; tutmazsa `symbolSizeRatio` 0,46'ya döner.

- [PL-2R-14] [product-lead → design-lead] (Öneri) ART §14.9 kalan blok ikonu; UX §5.9 madde 5: (a) İkon "üç hücrelik L,
  `O` rengi" bir renk ima ediyor (oyuncu "kalan turuncu bloklar" okuyabilir, O'suz bölümlerde de görünür). (b) Faz 3'te ek
  hedefler (`clear`, `collect`) için çip yeri tanımsız (§5.1'de "▦ 4/6 ✦ 2/5" vardı). → (a) İkon nötr: krem kit rengi
  (`kit.buttonColor.cream`) + `ui.ink` kontur, sembol yok. (b) Panel kuralı: en çok 4 çip (yapı, kalan blok, en çok 2 ek
  hedef); 4 çipte ikon 72 px, çip arası 16 px; 592 px'e sığmazsa ek hedefler hedef panelinin altına ikinci satır.

- [PL-2R-15] [product-lead → design-lead] (Öneri) JUICE #63, #68; STORY `booster.hint.brush`, `tut.l22.brush`; ASSET
  §16.3 #4 `town_ch1_treehouse`; GDD K-38, META §1, §5: (a) #63 tek bloğu boyuyor; K-38'e göre Fırça iki eşit hücreli
  bloğun rengini takas eder (Faz 3, Bölüm 22). (b) #68 "+2 / +3" sabit yazılmış; Faz 2R kademeleri `economy.json →
  winStreak.tiers`'tan gelir (kademe 2 +1 hamle; kademe 3 değeri entrepreneur ile kesinleşecek, EN-2R-03). (c) Tek
  `town_ch1_treehouse` görseli + alttan üste `setCrop` en ucuz yoldur (1 çağrı; v1'de 7 parça). Faz 4'te görevler gelince
  STORY §5 görev adı ile açılan bölge eşleşmeli: 6. görev "İp merdiven ve makara" alt bölgede durur, kırpma ise o anda
  üst bölgeyi açar. → (a) #63: fırça iki bloğa sırayla dokunur, renkler 300 ms'de çapraz geçer, iki bloktan 6'şar damla;
  `booster.hint.brush` TR "Yer değiştirecek iki bloğa dokun." / EN "Tap two blocks to swap." (b) #68 metnini "+N hamle (N
  = `winStreak.tiers[k].moves`)" yap. (c) ART §7.2'ye 7 kırpma durağı (`town.ch1.cropStops`, yükseklik oranı) yaz; görsel
  istemi ip merdiveni platformdan sarkmayacak biçimde ağacın üst dalına yerleştirsin ya da kırpma yerine görev başına
  maske kullanılsın. Görev sırası META'da değişmez.

## code-lead

- [PL-2R-16] [product-lead → code-lead] (Önemli) UX §13.1 "şemadaki `mode` alanı (`required`/`soft`) bu anlamla kalır
  (code-lead)" cümlesi; GDD K-53 madde 2–3, §14.1; TECH §8.2 `tutorial`: Bu cümle GDD ile çelişir ve PL-2R-01 ile
  kalkacak. Uygulama GDD'ye göre olsun: şema `mode` için yalnız `'soft'` kabul eder, `'required'` → `tut_blocking`;
  `timeoutMs` Bölüm 1–10 verisinde kullanılmaz; UX §13.1 durum makinesi (Bekleme, Gösterim, Gizli, Bitiş) yalnız sunum
  katmanındadır, adımın bitişini yalnız `done` belirler. Test adı önerisi: "K-53 hidden tutorial step still completes on
  done event".

## product-lead (kendi belgelerim; sonraki turda düzeltirim)

- [PL-2R-17] [product-lead → product-lead] (Önemli) GDD K-53 madde 3–4, §14.1 tablo satırı ve madde 3 "Diğer", K-43
  örneği, K-34 kanca 2: (a) K-53 madde 3 "adım yalnız `done` olayı gerçekleşince biter" diyor; §14.1 `done: Cond |
  { timeoutMs }` kabul ediyor. (b) K-53 madde 4 "adım ekrandayken" Gizli durumu kapsıyor mu belirsiz. (c) K-43 devam
  örneği "Bölüm 3 adım 2 (Z) … spot dışı dokunuş kapısı" ve "Bölüm 1 adım 1 (`overWall`)" Faz 1 verisiyle yazılı. (d) K-34
  kanca 2 neden sırası hâlâ `debris → outside → window → color → support`. (e) 1–10 döngüsünde öğretici tekrarı
  tanımsız. → (a) K-53 madde 3: "adım `done` koşulu (olay ya da `timeoutMs`, §14.1) sağlanınca biter; Bölüm 1–10 yalnız
  olay kullanır". (b) madde 4: "adım etkinken (Gösterim ya da Gizli)". (c) K-43 örneğini Faz 2R B1 ile yeniden yaz (adım
  1 `placementCorrect`; spot ve Z ifadeleri kalkar). (d) kanca 2: `outside → color → support`; `window` yalnız S2 geri
  gelirse. (e) Yeni madde K-53/6: bölüm kaydında `won = true` ise `tutorial[]` gösterilmez (tekrar oynanış).

- [PL-2R-18] [product-lead → product-lead] (Önemli) META §1, §3.2, §8.2, §8.4; yeni "§10 Faz 2R dilim kapsamı": Dilimde
  (Bölüm 1–10) hangi META öğelerinin bulunduğu yazılı değil; design-lead yedek kurallarla doldurdu (UX §3, §6). Proje
  sahibinin "en ucuz olabiliyorsa ücretsiz" isteği ve EN-2R-16 (a)(b) doğrultusunda en ucuz kapsamı seçiyorum. → META
  §10'a yaz: (1) Görev sistemi dilimde yok (Faz 4); her kazanma 1 ★ verir ve yıldız sayacı görünür; yapı ilerlemesi =
  kazanılmış farklı bölüm / 10. (2) `story.ch1.start` Bölüm 1 kazanıldıktan sonraki ilk ana sayfa girişinden önce,
  `story.ch1.end` Bölüm 10 kazanıldıktan sonraki ilk ana sayfa girişinden önce oynar (her biri bir kez). (3) Mağaza
  kilitli (açılış 5, Faz 4'te geçerli); altın yetmezse "Altın al" yerine pasif "Altın yetmiyor". (4) Bölüm sandığı 10
  dilimde var (META §8.2 içeriği; Termos kilitli adet rozetiyle gelir). Günlük ödül, Köprü, Lig, kumbara dilimde yok. (5)
  Bölüm 10'dan sonra 1–10 döngüsü META §8.5 `replay` kuralıyla: özgün hamle bütçesi, yıldız yok, yalnız kazanma tabanı
  altını, Bonus İnşaat ve kalan mala altını yok, öğretici yok (PL-2R-17 e).
