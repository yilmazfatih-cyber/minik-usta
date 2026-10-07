# design-lead — Faz 2R çapraz inceleme (product-lead: GDD, LEVELS, OBSTACLES, oyuncu deneyimi)

Tarih: 2026-10-07 · İnceleyen: design-lead · Bağlayıcı: `docs/review_inbox/_orchestrator_rulings_2R.md` (R2-01…R2-11).
Kapsam: GDD §0, K-01…K-05, K-07, K-09, K-10, K-12, K-17, K-25…K-30, K-34 kancaları, K-47…K-53, §14, §14.1; LEVELS §1,
§2.0, Bölüm 1–10, §4, §5; OBSTACLES Faz 2R uyum tablosu, W1, W2, Y5, S4, S9.
Yöntem: Bölüm 1–10 taslaklarını koordinat koordinat elle oynattım (eldiven yolları, açılış seçenekleri, kamyon düşüşleri,
hamle sayacının seyri). Ölçüler UX §0.1 eşlemesiyle hesaplandı: 1080 px = ekran genişliği, 360 px genişlikte 1 tasarım
px = 0,333 CSS px.

Özet: Engel 1 · Önemli 14 · Öneri 9

**Tutan noktalar (değişiklik istemez):**
- Boyutlar okunur. Bölüm 1–7 ve 9'da tahta 6 sütun (780 px), 8 ve 10'da 8 sütundur (1020 px). En yüksek tahta B6'dır
  (H + 2 = 9 satır); FIT'te vinç alanı tepesi y 408'de kalır, HUD ile çakışmaz (HUD alt kenarı 264). 4×4 … 6×5 saha ve
  %62–%75 doluluk yığını bir bakışta okutuyor.
- 44 pt kuralı geçerli: 120 px hücre 360 px'te 40 CSS px, `touch.hitSlopPx` 30 ile tek blok hedefi 60 CSS px (UX §0.1
  kararı). Bitişik iki bloğu ayırma genişliği hücrenin kendisi kadar, yani 40 px (iyileştirme DL-2R-14).
- Kazı öğretim sırası doğru: B1–2 kazısız, B3 tek kapak, B4 tıkaç + geçit, B6 cep, B8 ve B10 yük. Her bölümde en çok 2
  adım var, hepsi yumuşak (R2-10 ✓).
- Duvar ile "yukarı" hareketi: B1–5 ve B9'da duvar saha yüksekliğinde, her blok en az 2 satır kalkıyor; B6'da yüksek
  duvar bloğu 3 satır kaldırıyor. Açık yükseklik `(H + 2) − height` her bölümde ≥ 2. 1–10'da boyu 2'yi aşan malzeme
  bloğu olmadığından `blockedByWallHeight` ve `tut.ctx.tootall` bu dilimde hiç çıkmaz (beklenen sonuç).
- Tam örtü iletişimi tek sayıya iniyor: K-47 madde 5'e göre "plan tamam" ile "malzeme bitti" aynı an
  (kalan blok = N − doğru yerleşmiş, PL-2R-06). Söküm 1–10'da beklenmiyor (trapCount 0, deadRate 0).
- Kolay/Normal gölge doğruluğu ve K-51 (trapCount 0) birlikte çalışıyor: gölgedeki ✓ oyuncuyu çıkmaza götürmüyor. Zor'da
  gölge nötr olduğu için tuzaklı bölümde ✓ gösterilmiyor.
- Bilgi kartı tonu: `obs.s4.desc` ve `obs.s9.desc` uygun. `obs.y5.desc` ve `obs.w1.desc` için öneri DL-2R-06 ve
  DL-2R-07'de.

**product-lead'in bana bıraktığı notların karşılığı:** (1) yerleşim: PL-2R-02'yi kabul ediyorum, hücre boyu DL-2R-14'te ·
(2) Ağır Yük ve moloz görseli: PL-2R-04/PL-2R-11, ayrıca DL-2R-06 · (3) Söküm: PL-2R-05, DL-2R-12, DL-2R-24 · (4)
güçlendirici akışları: EN-2R-10/CL-2R-22 · (5) kamyon kuyruğu: DL-2R-22 · (6–7) öğretici: DL-2R-01/02/03/10/20/21 · (8)
Bölüm 4 adı: DL-2R-11 · (9) bilgi kartları: DL-2R-06/07.

---

## product-lead

- [DL-2R-01] [design-lead → product-lead] (Engel) LEVELS §2 B2 adım 2, B4 adım 2, B8 adım 1; GDD §14 `hand.path`; LEVELS §5
  "Öğretici" maddesi: Yol noktaları tutulan hücrenin koordinatı olarak okunuyor (B1, B3 ve B6 yolları yalnız bu okumayla
  tutuyor: path[0] bloğun çapası değil, bir hücresi). Ama bu anlam GDD'de yazılı değil. Bu okumayla üç yol
  uygulanamıyor. (a) **B8 adım 1** `[[1,3],[3,3]]` yükü (0,2) → (2,2) taşıyor. Başlangıçta (4,2)'de `d`, (4,3)'te `e`
  var, bu konum R'de yok. Yapışkan takip yükü (1,2)'de bırakır. Bu hamle kanonik çözümde yok ve 12 hamlelik bütçeden
  1'ini boşa harcatır: yükün sonra yine (2,2)'ye kayması gerekir. (b) **B4 adım 2** `[[1,1],[4,1]]`: (1,1), `a`'nın sağ
  üst hücresi. Son çapa (3,0) olur, blok x 3|4 sınırını keser, bırakma iptal edilir (K-07 satır 4). Eldiven iptali
  gösterir. (c) **B2 adım 2** `[[1,3],[1,5],[4,5]]`: (1,3), `c`'nin sağ üst hücresi. Çapa (3,4) olur, (3,5), (4,5) ve
  (4,4) sınırı keser. Adımın amacı olan "!" gölgesi yerine iptal öngörüsü çıkar (UX §5.3). → (1) B8 adım 1: highlight
  `piece:5`, `piece:3`, `piece:4`; drag `[[4,2],[4,0]]` (kanonik hamle 1: `d` cebe); `done` aynı. (2) B4 adım 2: drag
  `[[1,1],[5,1]]` (çapa (4,0), ray). (3) B2 adım 2: hold `[[1,3],[1,5],[5,5]]` (çapa (4,4); gölge (4,2)'ye iner, renk
  için "!" gösterir). (4) GDD §14'e tanım ekle: "`path` noktaları tutulan hücrenin (x, y)'sidir. path[0] o hücrenin
  başlangıcıdır, ara noktalar R'dedir. Son nokta bırakma konumudur ve K-07'de satır 2, 6 ya da 7 sonucunu verir (iptal
  değil)." (5) LEVELS §5'e ekle: "son nokta, adımın başladığı durumda R'de ve kanonik çözümün sıradaki hamlesidir".
  Doğrulayıcıyı code-lead yazar (DL-2R-15/6). Test adı önerisi: "K-53 tutorial hand path reachable and not cancel".

- [DL-2R-02] [design-lead → product-lead] (Önemli) GDD §14.1 madde 3 (süzgeçler), K-53 örneği; LEVELS B3, B4 ve B6 adım 1:
  `yardMove` herhangi bir bloğun sahaya yerleşimiyle sayılıyor. **B3:** `d` (`D2_90` Y, (2,0)) başta tutulabilir.
  Oyuncu onu kaydırırsa adım 1 biter. Adım 2 "Şimdi alttakini taşı!" bu sırada `a` ve `b` hâlâ `c`'nin altındayken
  görünür, yani yanlış bilgi verir. **B4:** `b` ya da `d` kaydırılırsa adım 1 biter. Adım 2'nin eldiveni `a`'yı
  geçide götürür ama `c` hâlâ (3,0)'da durur, gösterilen hamle yapılamaz. **B6:** `e` cebe konursa "yükseğe park et"
  adımı biter ve cep bozulur (`b` ile `c` artık birlikte sığmaz). K-53 örneği de aynı açığı taşıyor ("bırakma kaydırma
  değilse"). → §14.1'e `piece: '<vurgu kimliği>'` süzgecini ekle: yalnız `yardMove` ve `placementCorrect` için, olay
  yalnız o blokla sayılır. B3 adım 1: `{ event: yardMove, piece: 'piece:2' }`. B4 adım 1: aynı. B6 adım 1 için mevcut
  süzgeç yeter: `{ event: yardMove, at: [2,3] }`. Alçak park adımı bitirmez, balon yeniden görünür; istenen düzeltme
  de budur. K-53 örneğini süzgeçle yeniden yaz. Test: "K-53 step done ignores other piece".

- [DL-2R-03] [design-lead → product-lead] (Önemli) LEVELS B5 adım 2 (`highlight: truck`): Parti 1 boş sahaya kuyruğa
  girmeden düşüyor ("kuyruk yok"). K-26'ya göre N = 0 iken kamyon göstergesi gizlidir, yani vurgulanacak bir öğe yok.
  Benim UX §13.2 satırım da aynı hatayı taşıyor; sözlükte `truck` = kamyon göstergesi tanımını netleştiriyorum
  (DL-2R-20). → highlight `piece:k1_0` … `piece:k1_4` (yeni düşen 5 blok); eldiven yok, metin `tut.m.truck` aynı kalır.

- [DL-2R-04] [design-lead → product-lead] (Önemli) GDD K-34 "Görünürlük kancaları", K-50 madde 5; LEVELS §1 hedef bandı.
  Soru: oyuncu "gereken blok altta" olduğunu nasıl görür? Bugünkü zincir şöyle: inşa cephesi sıradaki renkleri gösterir
  → oyuncu o rengi sahada arar → gömülü bloğa dokununca "kımıldamıyor" titremesi ve engel vurgusu gelir (UX §5.3) →
  Kolay/Normal'de üstteki yanlış blok gölgede "!" verir. K-51'e göre id ≥ 3 olan her bölüm "en üstteki blok yanlış"
  durumuyla açılıyor. Bu zincirde iki parça eksik. (a) Kazının ödül anı yok: bir kaydırma gömülü gereken bloğu
  tutulabilir yaptığında hiçbir şey olmuyor (yerleşimin ✓'si var, kazının yok). Bu, 1–10'un ana mekaniğinde tasarım
  ilkesi 5'i bozuyor. (b) Takılan oyuncu için ipucu yok. İkisi de "şu an gereken bloklar" kümesine dayanır; bu küme
  K-50 madde 5'te yalnız bölüm başı için (F0) tanımlı. → (1) K-34'e kanca 5 ekle: `neededNow(state)` = K-50 madde 5
  tanımının o anki durumdaki karşılığı (o an doğru bir konumu olan malzeme blokları; erişim yok sayılır), her hamle
  sonunda yayınlanır. `unlockedNeeded { pieceIds }` = bu hamleden önce tutulamayan, şimdi tutulabilir olan ve
  `neededNow` içinde bulunan bloklar. (2) Zorluk kapısı (bilgi sızıntısı kararı senin): Kolay'da `unlockedNeeded` anı
  açık, 6 sn hareketsizlikte `neededNow` blokları 2 kez nabız atar; Normal'de `unlockedNeeded` açık, nabız 12 sn'de;
  Zor ve Çok Zor'da ikisi de kapalı (gölge de orada nötr). (3) LEVELS §1'e not: hedef kazanma bandı bot içindir, bot
  ipucu görmez. Sunum benim: JUICE'a yeni satır "gömülü blok açıldı" (220 ms ışıltı + yumuşak tık + hafif haptik).

- [DL-2R-05] [design-lead → product-lead] (Önemli) GDD K-52; LEVELS §1 ve §2, B5, B6, B8, B9: Yeni imza tanıtan dört
  Normal bölümün (S1, W2, Y5, W3) hepsinde tampon T = 4 ve dördünde de değer tabandan geliyor
  (max(4, ⌈0,35·min⌉) = 4). Yeni mekanikle ilk karşılaşmada sık görülen hata 2 hamle tutar (bir yanlış yerleşim + bir
  gereksiz kazı), bu da tamponun yarısıdır. B5 üç geçişi aynı anda yaşatıyor: Kolay'dan Normal'e geçiş, iki yeni
  kavram (kayan şantiye + kamyon) ve tamponun 6'dan 4'e inmesi. → K-52'ye madde ekle: `teaches` dolu bölümde T bir alt
  zorluğun formülüyle hesaplanır (Normal için Kolay formülü). Sonuç: B5 11 + 6 = **17**, B6 7 + 6 = **13**, B8 8 + 6 =
  **14**, B9 7 + 6 = **13**. Baskı tanıtımdan sonraki bölüme kayar (B7 15 olarak kalır). Bot hedefleri yeniden
  ölçülür. Seçenek: bu dört bölüm Kolay etiketi alır.

- [DL-2R-06] [design-lead → product-lead] (Önemli) OBSTACLES Y5 (bilgi kartı, kural); GDD K-05 sunum olayları: B1 oyuncuya
  tam örtüyü tek cümleyle öğretiyor: "Bütün bloklar plana girecek" (`tut.m.useall`). B8'de ise sahada 9 hücrelik bir
  parça bölüm sonuna kadar kalıyor. Kart "duvarı geçemez, kenara kaydır ya da kır" diyor ama "plana girmez" demiyor.
  Bu yüzden oyuncu yükü de "kullanmak" için hamle harcayabilir. Ayrıca yük duvara dayandığında oyuncuya giden bir olay
  yok: K-05'teki `blockedByWallHeight` yalnız yükseklik için. → (1) `obs.y5.desc` TR "Ağır yük plana girmez. Kenara
  kaydır ya da kır." · EN "Cargo isn't part of the plan. Slide it aside or smash it." (2) Y5'e sunum olayı ekle:
  `blockedCargo { pieceId }`; yükün yapışkan takibi duvar sınırında durduğu an, tutuş başına 1 kez yayınlanır. Sunumu
  duvarda "dur" çentiği + çarpma esnemesi + hafif haptik. (3) Oyuncu metinlerinde Ağır Yük'e "blok" denmez (kalan blok
  sayısına girmez).

- [DL-2R-07] [design-lead → product-lead] (Önemli) OBSTACLES W1 `obs.w1.desc`; GDD K-12, K-34; LEVELS §2.0 madde 3c:
  "Geçitten giren blok düşmez, bıraktığın yerde kalır." MVP'de bunun gözlenebilir bir etkisi yok. K-34 her yerleşimin
  altının dolu olmasını ister, `.` hücresi yok (S2 MVP dışı), bu yüzden çıkıntı da oluşamaz. B4 ve B9'da ray zaten en
  alt satırda. Kartı "havada bırakabilirim" diye okuyan oyuncu bloğu rayla üst satıra koyarsa `support` nedeniyle geri
  seker; kart ile kural çelişir. Geçidin 1–10'daki gerçek değeri gömülü alt bloğa yatay kestirmedir (§2.0 3c: 2 ve 1
  hamle kazandırıyor). → `obs.w1.desc` TR "Geçit alttaki bloğa kestirme yol açar." · EN "Gaps are a shortcut for bottom
  blocks." K-12'deki "düşmez" kuralı Faz 3 için (W8, S8) aynen kalır. `tut.m.gap` metnini aynı anlama ben çeviriyorum
  (DL-2R-21).

- [DL-2R-08] [design-lead → product-lead] (Öneri) OBSTACLES Y5; GDD K-08; CL-2R-18: Ağır Yük saha üstü havaya ve Vinç
  Alanı'na kalkabiliyor. Bu, görsel kimlikle (ağır palet) ve "kaydır" metniyle çelişiyor. B8'de oyuncu yükü havaya
  kaldırıp duvara götürür, orada durur ve nedenini anlamaz. → Kural: Y5'in bütün hücreleri her konumda y ≤ Hy−1 kalır
  (yük yalnız saha içinde kayar, havaya kalkmaz). B8 ve B10 kanonik çözümleri değişmez, çünkü ikisinde de yük saha
  içinde kayıyor; durum uzayı da küçülür. Kural kabul edilmezse bilgi kartında en azından "kaldırılır ama duvarı
  geçemez" yazmalı.

- [DL-2R-09] [design-lead → product-lead] (Öneri) LEVELS B10 adım 1, §1: Adım Vinç'i bölüm başında öneriyor. 2 ücretsiz
  deneme dilim 1'deki yük kazısını (3 kaydırma) atlatıyor, B8'den kalan Çekiç denemeleri de aynı işi görüyor. Böylece
  hikaye finalinin bulmacası çoğu ilk oyuncuda hiç oynanmaz. → Adım 1'e `startOn: { event: segmentDone }` ekle (Vinç
  dilim 2'de önerilir), `done` = `boosterUsed` (CL-2R-11). İlk Zor bölüm olduğu için bölüm düğmesindeki ve bölüm öncesi
  penceredeki "ZOR" etiketi (UX §3, §3.1) yeterli; ek uyarı gerekmez.

- [DL-2R-10] [design-lead → product-lead] (Öneri) LEVELS B2 adım 1, B7 adım 1, B9 adım 1: (a) B2 tek dilimli bir bölüm.
  `panorama` burada şantiyenin 24 px'lik kopyasından ibaret; "Plan alttan üste dolar" fikrini inşa cephesi gösterir →
  highlight `front`, `build`. (b) B7'de "sonraki kat" yalnız panoramada görünüyor (dilim 2'nin alt satırları GG) →
  highlight `piece:4`, `panorama`. (c) B9'da tek adım `b`'nin kazısını gösteriyor ama metin dar geçitten söz ediyor.
  Kazıdan sonra eldivenin `a` için gösterecek yolu kalmıyor → iki adım: (1) `piece:1` · drag `[[2,0],[2,1]]` ·
  `tut.m.dig` · `{ event: yardMove, piece: 'piece:1' }`; (2) `piece:0`, `gap:0` · drag `[[1,0],[5,0]]` (çapa (4,0), ray)
  · `tut.m.narrow` · `{ event: gapPass }`.

- [DL-2R-11] [design-lead → product-lead] (Öneri) LEVELS Bölüm 4 adı: Planda delik yok. Panoramada, bölüm öncesi
  pencerede ve kasaba açılışında "Pencere" adı dolu bir bandın üstünde duruyor. → TR "Pencere Pervazı" · EN "Window
  Sill" (dolu bant olarak doğal okunur). Dilim adı "Pervaz / Sill".

- [DL-2R-12] [design-lead → product-lead] (Öneri) GDD K-30 `teardown` olayı: Söküm sunumunda (PL-2R-05) tek metin var.
  Oyuncu tahtanın neden geri gittiğini ancak nedeni görürse anlar; code-lead analytics'te `cause` alanını zaten taşıyor
  (CL-2R-29). → `teardown { toTurn, pieces[], cause: 'tiling' | 'access' | 'color' }`. Metinleri STORY'ye ben yazarım:
  tiling "Bu blok yerleşince diğerleri sığmaz." · access "Kalan bloklar duvara ulaşamaz." `tut.ctx.teardown` genel
  yedek olarak kalır.

- [DL-2R-13] [design-lead → product-lead] (Öneri) GDD K-29; K-52: 1–10 bütçeleri küçük (9–16 hamle). Kalan hamle kalan
  bloktan azsa ve elde Altın Mala ya da güçlendirici yoksa bölüm kazanılamaz. Oyuncu yine de sayaç 0 olana kadar
  oynamaya devam eder. → K-29'a madde ekle: `kalanHamle + eldeMala < kalanBlok` ve kullanılabilir Vinç hakkı yoksa
  kayıp penceresi hemen açılır. Teklif fiyatı ve sayısı entrepreneur'ündür, sunum benim.

## code-lead

- [DL-2R-14] [design-lead → code-lead] (Önemli) UX §5.8, tokens `layout.adaptive`, R2-02 ("hücre 120 px korunur"); 360 px
  kontrolü: 1–10'un 7 bölümünde tahta 6 sütun ve H ≤ 6, buna rağmen hücre 120 px (360 px'te 40 CSS px). Bitişik blok
  ayrımı 44 px'in altında kalıyor. R2-02'deki 120 px'i alt sınır olarak okuyorum (orkestratör onayına ÖNERİ). →
  `cellPx = max(120, min(144, ⌊960/(Wy+Ws)/12⌋·12, ⌊1200/(H+2)/12⌋·12))`, FIT bütçesiyle ve cihazdan bağımsız hesaplanır.
  Sonuç: B1–5, B7, B9 → 144 (360 px'te 48 CSS px, 375 pt'de 50 pt); B6 → 132 (44 px); B8, B10 → 120. `layout.grid`,
  `blockV2` px değerleri ve `hitSlopPx` `cellPx/120` ile ölçeklenir. UX §5.8'i ve `layout.adaptive.cellMaxPx = 144`
  token'ını ben yazarım. Kabul: 360×800 ekran görüntüsünde B1 bloğunun genişliği ≥ 48 CSS px.

- [DL-2R-15] [design-lead → code-lead] (Önemli) TECH olay/durum arayüzü (sunum kancaları): Bu incelemedeki sunum
  önerileri çekirdekten şunları ister: (1) her hamle sonunda ve teslimattan sonra `holdableIds` (K-09; ≤ 20 blok × 4
  öteleme); (2) GDD kabul ederse `neededNow` ve `unlockedNeeded` (DL-2R-04); (3) bir hamlenin bütün olayları tek paket
  olarak gelir, sunum paketin sonunda `teardown` olup olmadığına bakar (DL-2R-24); (4) kamyon kuyruğunun sıralı içeriği
  (şekil, renk; DL-2R-22); (5) `blockedCargo` (DL-2R-06); (6) doğrulayıcıda eldiven yolunun K-08 BFS'iyle R içinde ve
  iptal olmayan bir konumda bittiğinin denetimi (DL-2R-01). → TECH §2R'ye bu 6 maddeyi ekle. Test adları kural
  kimliğiyle verilir.

- [DL-2R-16] [design-lead → code-lead] (Öneri) Capacitor aşaması, Android hareketle gezinme: 6+2 tahtada (B8, B10) saha
  sütun 0'ın kenarı ekranın sol kenarından 30 tasarım px uzakta (360 px'te 10 CSS px), hücre merkezi ise 30 CSS px
  uzakta. Bu nokta sistemin geri hareketi bölgesine düşebilir; bloğu sola sürükleyen oyuncu uygulamadan geri çıkar. →
  Android'de tahta dikdörtgenini `setSystemGestureExclusionRects` ile hariç tut (platform sınırı: kenar başına en çok
  200 dp dikey). Web'de etkisizdir; Faz 5 cila listesine yaz.

## design-lead (kendi belgelerim; kapanış turunda düzeltirim)

- [DL-2R-17] [design-lead → design-lead] (Önemli) ART §3A, UX §5.3 "Taşınamayan blok": (1) Görünümde "alınabilir"
  ayrımı yok. Tutulabilir bloklar tam parlama elipsi ve noktayı alır. Tutulamayanlarda parlama noktası olmaz ve açıklık
  %8 düşer (ton değişmez, sembol aynı kalır). (2) Engel vurgusu yalnız "üstündeki" bloğu gösteriyor. B7 dilim 2'de `e`
  ise yandan, `k1_1` kaldırılınca çıkıyor. Bu yüzden tutulamayan bloğa dokunulunca, bloğun birim ötelemesini kesen
  bütün 4-komşu parçalar 300 ms vurgulanmalı. Kabul: 375 pt'de 5 kişiden 4'ü "hangisi alınır?" sorusunu 2 sn içinde
  doğru yanıtlar.

- [DL-2R-18] [design-lead → design-lead] (Önemli) ART §2.4, §7.1; UX §5.3: B3, B4 ve B6 kazıları sahada havada park
  etmeye dayanıyor (B6'da `c` (2,3)'te duruyor, altı boş). Kamyon dökümü ise düşerek iniyor (K-25). İki davranış
  görsel olarak ayrılmalı. (1) Saha zemini delikli pano olur: her hücrenin ortasında Ø 12 px delik, renk
  `board.yardGrid`; havada duran blok böylece "asılı" okunur. (2) Sahaya bırakma önizlemesi: blok saha hücrelerine
  değerken, oturacağı hücreler 4 px beyaz α 0,6 noktalı konturla gösterilir. Bu desen şantiyedeki kesik düşüş
  gölgesinden ayrıdır. (3) Saha üstü hava zeminsiz gök bandı olarak çizilir (PL-2R-02).

- [DL-2R-19] [design-lead → design-lead] (Önemli) JUICE #51, UX §13.2 `tut.ctx.lastmoves`: Kusursuz oynayan oyuncu
  B5–B10'da (6 bölüm) kalan 5 hamleye iniyor; bölümleri 4, 4, 4, 4, 4 ve 3 hamle artırarak bitiriyor. Yani hata
  yapmayan oyuncu da kırmızı nabız, uyarı sesi ve Usta Dede satırı alıyor. → Tetik `kalanHamle − kalanBlok ≤ 1` ya da
  `kalanHamle ≤ 2` olsun; ses yalnız ilk girişte çalar. Kontrol: kusursuz B10 oyuncusunda bu fark en az 3, uyarı
  çıkmaz. 2 hamle boşa harcayan oyuncuda çıkar.

- [DL-2R-20] [design-lead → design-lead] (Önemli) UX §13.1–§13.2: (1) Eldiven, path[0] hücresinde hâlâ vurgulu blok varken
  ve yol o durumda R içindeyken oynar. Değilse yalnız vurgu ve balon kalır. (2) Vurgu sözlüğünde `truck` = kamyon
  göstergesi (N ≥ 1); gösterge gizliyken bu vurgu yok sayılır. (3) §13.2 Faz 2R tablosu LEVELS ile birebir eşitlenir
  (PL-2R-01); Z/Y ve `timeoutMs` kalkar.

- [DL-2R-21] [design-lead → design-lead] (Önemli) STORY §6A, §6, §7.7, product-lead'in istediği satırlar (TR / EN, en çok
  6 kelime): `tut.m.park` "Üsttekini yükseğe park et." / "Park the top one up high." · `tut.m.carry` "Bu blok sonraki
  kat için." / "Save this block for later." · `tut.m.carryNow` "Şimdi sırası geldi." / "Now it's this one's turn." ·
  `tut.m.heavy` "Ağır yük geçemez, kenara kaydır." / "Cargo can't cross. Slide it aside." · `tut.m.hammer` "Çekiç ağır
  yükü kırar." / "The Hammer smashes cargo." · `tut.m.gap` "Alttakini geçitten kaydır!" / "Slide the bottom one
  through!" · `tut.ctx.teardown` "Bu blok yolu kapattı, geri aldım." / "That block blocked the rest. Undone!" ·
  `booster.hammer.noTarget` "Kırılacak yük yok." / "Nothing to smash here." `tut.m.match`, `tut.m.rail` ve
  `tut.m.drop` kullanılmıyor; i18n testleri bırakılana kadar kalırlar.

- [DL-2R-22] [design-lead → design-lead] (Önemli) UX §5.1 kamyon göstergesi; LEVELS B10 dilim 2: Kuyruk bilinçli
  kullanılıyor ("Kamyonda: 1", `k1_3` `O4` G). Oyuncu kuyrukta ne beklediğini göremiyor. Ayrıca `k1_2` yerleşince
  `k1_3` (3,2)'ye, `k1_1`'in üstüne düşüyor. → Göstergeye sıradaki kuyruk bloğunun 0,35 ölçekli önizlemesini ekle
  (şekil, renk, sembol); N ≥ 2 iken "+N−1" yazılır.

- [DL-2R-23] [design-lead → design-lead] (Öneri) UX §5.9 kalan blok çipi: (1) B5 başında çip 9 gösteriyor, sahada ise 4
  blok var. Büyük sayı toplamı göstermeye devam eder, yanına teslim edilmemiş partiler için küçük kamyon alt rozeti
  "+5" eklenir. (2) Taşınan malzeme rozeti: bloğun hücre sayısı, aktif dilimde o rengin kalan talebinden büyükse
  bloğun sağ üstünde 32 px "sonraki kat" rozeti çıkar. B7'de `e` dilim 1 boyunca rozetli olur (G talebi 2 < 4). Bilgi
  panoramada zaten açık, bu yüzden her zorlukta gösterilir.

- [DL-2R-24] [design-lead → design-lead] (Öneri) JUICE #7, #17, #107 (PL-2R-05): Aynı hamle Söküm'le bitiyorsa "doğru"
  sesi, haptik, Usta Serisi boncuğu ve ışıltı oynatılmaz. Blok 120 ms oturur, ardından #107 başlar. Böylece oyuncuya
  önce ödül verip sonra geri alınması önlenir. Bunun için tek pakette olay gerekir (DL-2R-15/3).
