# Unity taşıma — Faz 1 raporu (mekanik özeti, bölüm formatı, belirsizlikler)

Tarih: 2026-10-30 · Yazan: orkestratör · Kaynak: `src/core/**` (11 400 satır saf TypeScript), `docs/GDD.md` (K-01…K-54),
`docs/TECH_DESIGN.md` §2–§6, §2R, `levels/level_001…010.json`, `tests/golden/*`.

Bu rapor proje sahibinin "Minik Usta'yı Unity'ye taşı" brifinin 1. fazıdır. Brif: mevcut davranış birebir taşınır, yeni
mekanik icat edilmez, belirsizlikte koddaki davranış esastır. Aşağıdaki **belirsizlikler bölümü (§4) onay beklemektedir;
onaysız Faz 2'ye geçilmez.**

---

## 1. Mekanik özeti — oyun ne? (brifteki "match-3" tanımı uymuyor)

**Minik Usta bir match-3 değildir.** Taş takası, eşleşme bulma, kademeli patlama (cascade), yeniden doldurma (refill) ve
"eşleşmeden booster oluşumu" mekanikleri kodda **yoktur**. Oyun bir **blok yerleştirme bulmacası**dır:

| Öğe | Koddaki davranış (GDD kimliği) |
| --- | --- |
| Tahta | Sol: **malzeme sahası** `Wy × Hy` (bölüm başına, 4×4 … 6×8); sağ: **şantiye** `Ws × Hs` (2×5 … 2×8); arada sıfır genişlikli **duvar sınırı** (`height`, en çok 3 **geçit**); üstte 2 satır **vinç alanı** (hava). K-01…K-05, K-49 |
| Bloklar | 13 şekil (B1, D2, I3, I4, O4, C3, L4, J4, T4, S4, Z4; I5 ve Q9 = renksiz **Ağır Yük**) × 4 dönüş × 8 renk (W Y G R O C B P; her rengin sembolü var). K-44 |
| Hamle | Oyuncu bir bloğu tutar, **BFS ile geçerli konumlar** (her ara adımda bütün hücreler boş) içinde "yapışkan takip"le sürükler, bırakır. Üç sonuç: sahada yeniden konumlandırma (**kaydırma**), duvarın üstünden şantiyeye **düşüş**, geçitten **ray** ile giriş. Bırakma iptalse hamle harcanmaz. K-07…K-13 |
| Yerleşim | Şantiyedeki **renk planı** (dilim başına `rows`) ile blok rengi birebir ve **Alttan Üste** destek kuralı sağlanırsa blok kilitlenir; yanlışsa "kötü geçiş": blok geri seker, hamle yanar. K-14…K-18, K-34 |
| Yerçekimi | Şantiyede düşüş (`low/normal/high`), sahada isteğe bağlı (`yard`). K-19…K-21 |
| Kazanma | **Tam örtü**: bütün dilimler tamam **ve** sahada/kuyrukta/elde malzeme bloğu kalmamış. Blok arzı = plan talebi; şaşırtma blok yok. K-47, K-48 |
| Kaybetme | Hamle sayacı 0 → +5 hamle teklifi (altın/reklam, en çok 3). K-29 |
| Çıkmaz | Her hamle sonunda D1 (yeniden dizme) / D2 (renk dengesi) / D3a (döşeme) denetimi; çıkmaz tespit edilince **Söküm**: son yerleşim otomatik geri alınır, harcanan hamle iade edilmez. K-30 |
| Çok dilimli bölüm | Dilim bitince şantiye kayar (S1), sıradaki parti **kamyonla** sahaya iner; sığmayan blok kuyrukta bekler. K-22, K-25…K-27 |
| Güçlendiriciler | Çekiç (yalnız engel/Ağır Yük kırar), Vinç (bloğu döndürerek doğru yere koyar), Boya Fırçası (iki bloğun rengini takas eder), Altın Mala (sahadaki bloğu doğru yere koyar), Geri Al; oyun öncesi: Termos (+3), Mala Başlangıcı, Açık Kepenk. K-33, K-36…K-40, K-54 |
| Engeller (dilimde) | W1 sabit geçit, W2 yüksek duvar, W3 dar geçit, Y3 zincir, Y5 Ağır Yük, S1 kayan şantiye. (Faz 3: 27 engel imzası tanımlı.) `docs/OBSTACLES.md` |
| Öğretici | Bölüm başına ≤ 2 yumuşak adım; el animasyonu + balon; girdi kilidi yok. K-53 |
| Hamle sonu hattı | **K-35**: 12 sıralı adım (doğrulama → yerçekimi → zamanlayıcılar → dilim → teslimat → kuyruk → hedefler → kazanma/kaybetme → çıkmaz denetimi). Unity'deki "sıralı event listesi" buradan çıkar. |

### 1.1 Çekirdek mimarisi (Unity'ye birebir karşılık)

- **Saf ve belirlenimci:** `src/core` Phaser'a, DOM'a ve zamana bağımlı değildir. Durum tek bir `Int32Array` tamponudur;
  **Zobrist** karması (`hash.ts`) ve **mulberry32** seed'li RNG (`rng.ts`; 32-bit tamsayı aritmetiği) vardır. Bu, C#'ta
  `int`/`uint` ile bit bit aynı sonuç demektir.
- **Tek giriş noktası:** `applyMove(state, move, sink)` → `MoveResult` + **olay akışı**. Olay türleri (43 adet):
  `pieceLifted, pieceMoved, pieceFell, pieceBounced, pieceReturned, placementCorrect, placementWrong, movesChanged,
  segmentCompleted, siteShifted, deliveryQueued, deliveryArrived, truckHelp, goalProgress, levelWon, outOfMoves,
  deadlockDetected, teardown, boosterApplied, boosterRejected, cargoSmashed, chainReleased, crateDamaged, crateBroken,
  glassBroke, mortarStuck, balloonRose, windDrift, steered, gapChanged, gapUnlocked, elevatorMoved, carouselRotated,
  cellsRevealed, colorsSwapped, comboChanged, trowelEarned, keyCollected, screwCollected, bagTorn, wetTick, moveCancelled,
  piecePainted`. Brifteki "Core her hamlede sıralı event listesi üretir" kuralı **zaten uygulanmış**; Unity'de
  `AnimationQueue` bu listeyi oynatır.
- **Hamle türleri (`Move`):** `drag {pieceId, to, via?, steer?}`, `hammer {target}`, `crane {pieceId, to, rotation}`,
  `paint {a, b}`, `goldTrowel {pieceId, x, y}`, `addMoves {amount, source}`; oturum düzeyinde `undo`.
- **Oturum:** `GameSession` (hamle günlüğü, geri al, yeniden oynatma, bölüm içi devam, +5 teklifi, Söküm). `RULES_VERSION = 2`.
- **Çözücü ve altın kayıtlar:** `tools/solver` 10 bölümün kanonik çözümünü ve ölçütlerini üretir; `tests/golden/level_NNN.hand.json`
  her bölüm için adım listesi + `eventLogHash` + `levelHash` + son ASCII tahta tutar. **Eşdeğerlik testi için hazır veri:**
  C# çekirdeği aynı adımları oynatıp aynı Zobrist/olay karmasını vermelidir.

## 2. Bölüm formatı (`levels/level_NNN.json`, şema `src/core/level/schema.ts`, zod)

```
{ schemaVersion: 1, id, chapter, name {tr,en}, difficulty: easy|normal|hard|superhard, moves, teaches?, seed?,
  goals: [ {type:'build'} | {type:'clear', target: crate|chain|debris, count} | {type:'collect', item:'screw', count} ],
  gravity: { build: low|normal|high, yard: bool },
  wall:    { height: 0..8, gaps: [ {type: static|shutter|slider|paint|locked, y, size, …} ] (≤3), fan? },
  site?:   { cols, rows }                          // varsayılan 2×8
  build:   { mode: segments|carousel, carouselEvery?, elevator?, segments: [ {name, rows: ["WW","GY",…], hidden?} ] (1–5), debris? },
  yard:    { cols?, rows?, batches: [ { forSegment, dropColumns?, pieces: [ {shape:'O4_0', color:'R', x, y, flags?, wetMoves?} ] } ] },
  obstacles: [ {type: crate|cement_bag|screw|key, x, y, hp?, id?} ],
  tutorial?: [ {step, mode?:'soft', highlight[], hand?{kind,path?}, textKey, startOn?, done} ] (≤2),
  targets?:  { minShifts, firstNeedDepth, choices0, deadRate }   // yalnız solver okur
}
```

Doğrulama kuralları (K-45, 35 kod: `plan_size`, `cover_mismatch`, `yard_fill_*`, `gap_overlap` …) `src/core/level/logic.ts`'de;
Unity tarafında **aynı JSON aynen okunur** (adapter gerekmez; yalnız zod yerine elle/`System.Text.Json` doğrulama).

## 3. Mevcut durum (taşımaya girdi)

- Yayın: `main` = `de6f16c` (Faz 2R, görünüm v2), https://yilmazfatih-cyber.github.io/minik-usta/ — kontroller yeşil (2023 test).
- `wip/phase-2r`: görsel v3 paketleri A (blok/HUD) ve B (ana sayfa, bölüm başı, yükleme) bitti ve kaydedildi; C (kazanma/
  ödül/pencereler) yarım; D (öğretici + tam ekran seti), eleştiri turları ve son kapılar yapılmadı — ajan kredisi bitti.
- Tasarım kaynakları Unity'ye taşınabilir: `docs/ART_REFERENCE.md` (stil kitabı, px/hex tarifleri), `tokens.json`
  (renk/süre/ölçü), `public/art/**` 41 SVG (karakterler, ikonlar, sahneler), `docs/JUICE.md` (olay → animasyon tablosu, ms).

## 4. Belirsizlikler ve kararlar (onay bekliyor)

1. **Tür çelişkisi (en önemli):** Brif match-3 (swap/match/cascade/refill/booster oluşumu/hint) tarif ediyor; oyun blok
   yerleştirme. Önerim: **mevcut mekaniği birebir taşı** (brifin kendi kuralı), match-3'e özgü maddeleri karşılıklarına
   çevir — swap → sürükleme/bırakma hissi (kaldır %8 büyüme, gölge, OutBack iniş), geçersiz hamle → kötü geçiş geri sekmesi +
   titreme, "düşme" → şantiye düşüşü (hızlanan, squash & bounce), "patlama" → doğru yerleşim kilit parlaması + parçacık,
   "booster oluşumu" → Altın Mala kazanımı (Usta Serisi), cascade → kamyon teslimatı + dilim kayması, hint → 5 sn
   hareketsizlikte "takılma nabzı" (zaten var: tutulabilir bloklar parlar), hedef taşlar HUD'a uçar → `placementCorrect`
   sonrası "kalan blok" çipine uçuş, level sonu → kalan hamleler altına dönüşür (**Bonus İnşaat**, K-28). Alternatif: oyunu
   gerçekten match-3 yapmak = yeni oyun; brife ve D-073…D-090'a aykırı.
2. **Kahraman:** Brif "genç bir kral" (mor/turkuaz/altın) istiyor; projede kahraman **Tuna** (inşaatçı, D-044, STORY, 41 SVG,
   D-087). Seçenekler: (a) Tuna kalır, kral yok; (b) Tuna "genç kral" olarak yeniden tasarlanır (hikâye ve kasaba teması
   değişir — Renkli Tepe, Usta Dede, Kepçe'ye etkisi var); (c) kral ek karakter (ör. kasabanın genç kralı, görev veren).
   Not: Royal Match'in kahramanı kral; "kral + Royal Match ilhamı" mağaza değerlendirmesinde benzerlik riski taşır (R2-13 kopya yasağı).
3. **Unity ortamı:** Bu bulut oturumunda Unity Editor ve .NET SDK **yok**; C# yazılır ama derlenip test edilemez.
   Seçenekler: (a) sen Unity'yi yerelde kurup Remote Control ile bu oturuma klasör açarsın (Unity batch-mode testleri
   buradan koşturulur); (b) ben konteynere .NET SDK kurmayı denerim — çekirdek saf C# olduğu için NUnit ile Unity dışında
   test edilir, aynı testler Unity Test Framework'te de çalışır; görünüm katmanı yalnız sende derlenir; (c) her fazda kodu
   teslim ederim, sen Unity'de derleyip sonucu yazarsın.
4. **Unity projesinin yeri:** Brifteki `<UNITY_PROJE_YOLU>` boş. Önerim: ayrı repo `yilmazfatih-cyber/minik-usta-unity`
   (Unity projeleri büyüktür; web sürümü ve Pages aynen kalır). Alternatif: aynı repoda `unity/` klasörü.
5. **Phaser görsel v3 işi:** Unity'ye geçiliyorsa Phaser v3 (C, D, eleştiri) dondurulsun mu, yoksa web sürümü de bitirilsin mi?
   Önerim: dondur; stil kitabı ve SVG'ler Unity'de kullanılır.
6. **Unity sürümü ve paketler:** Unity 6 LTS + URP, DOTween (ücretsiz), TextMeshPro, Cinemachine — ücretsiz; Blender render
   betiği için Blender yerelde gerekli (bulutta yok).

## 5. Faz 2 planı (onaydan sonra)

- `Assets/MinikUsta/Core/` saf C# (assembly definition, UnityEngine referansı yok): Geometry, State (int[] tampon),
  Shapes, Movement (BFS + yapışkan takip), Gravity, Placement, Delivery, Deadlock, Boosters, Moves (K-35 hattı),
  Session, Rng (mulberry32/splitmix32), Zobrist, Level (JSON + doğrulama), Events.
- `Assets/MinikUsta/Core.Tests/` EditMode: kural testleri (K-xx adlı), **altın eşdeğerlik**: `tests/golden/*.hand.json`
  adımlarını oynat → `eventLogHash` ve son ASCII birebir.
- Çekirdek TS'den satır satır taşınır (yorumlar K-xx atıflarıyla); TS tarafı kaynak gerçek olarak kalır.
