# code-lead — Faz 2R ekran incelemesi 1 kapanışı (WP-K + WP-O + DS-1)

Tarih: 2026-10-14 · Sahip: code-lead · Kaynak: `docs/review_inbox/design-lead-2R-screens-1.md` (code-lead'e düşen
Engel / Önemli / Öneri maddeleri ve "code-lead için devir listesi") · Bağlayıcı: `_orchestrator_rulings_2R.md` R2-07,
R2-08, R2-12, R2-13; DECISIONS D-073…D-090 · Paket: yarım kalan WP-K (göç + araçlar + analytics) ve WP-O (geri bildirim
dışa aktarımı) bitirildi, ekran incelemesi 1'in code-lead maddeleri kapatıldı. Görünüm v3 (ART_REFERENCE stil kitabı,
rubrik ≥ 4/5) **bu paketin konusu değildir**; bu tur yalnız doğru içerik ve çalışan araçlardır.

Özet: **KAPANDI 20 · RET (bu turda) 3 · AÇIK SORU 0.** Değişen dosyalar yalnız sahiplik matrisindeki kendi
dosyalarım (`src/**` tokens.json hariç, `tools/**`, `tests/**`, `docs/TECH_DESIGN.md`, bu dosya). `git commit` yok.

## Yarım kalan WP-K + WP-O'nun durumu (devralınan çalışma ağacı)

İki devralma oldu. **Birinci oturum (b81be89'a kadar):** `npm run typecheck` kırmızıydı (`HomeScene.ts(573)`
`this.geo.button`: `HomeLayout`'ta böyle bir alan yok; doğrusu `play`, DS-06 yardımcısı `lockedTabBalloon`'a taşındı) ve
`npx vitest run` 2 kırmızıydı: `layering.test` (sahne `timed('apply', …)` ile sarıyor) ve `checks.test` "K-53 every drag /
hold hand …" (solver'a bağlı, 60 s zaman aşımı). **İkinci oturum (bu kapanış, b81be89 sonrası):** `typecheck` yine
kırmızıydı — `tools/perf.ts(360–361)` `timings.commit` / `timings.saveWrite`: harness `timings()` tipi yalnız
`kitBake | levelBake | apply` sayıyordu, `services/timings.ts` `TimingKey`'e bağlandı (`commit`, `saveWrite` dahil);
Prettier `tools/perf.ts`'te kırmızıydı. `vitest` 4 kırmızıydı ve kapatıldı: (1) "TECH 2R.7 every key of tokens.json …"
— design-lead'in yeni `kit.v3` grubu (R2-13 stil öğrenimi) tiplenmemişti → `TokensSchema.kit.v3 = KitV3Group`
(özyinelemeli gevşek ağaç: `_doc*` atılır, yapraklar sayı / dize / boolean / liste; görünüm v3 paketi alt grupları
tüketirken sabit şekle daraltır), `PENDING_TOKEN_KEYS` boş kaldı; (2) "TECH 2R.12 WP-L every STORY 6 / 6A / 7 row …" —
STORY §7.8'in beş anahtarı (`loading.text`, `levelStart.boosters`, `levelStart.play`, `reward.tap`, `reward.ready`)
tr/en'e birebir girdi; (3) "K-51 the drafts 1–7 and 9 …" 8 solver koşusu 5 s varsayılanı aşıyordu → 120 s;
(4) `layering` "… commits drags through GameSession.apply" deseni: sürükleme bırakma artık `timed('commit', …)` ile
sarılı (perf raporunun "release split" bilgisi), desen güncellendi. **Araç hatası (ilk tam `screens` koşusunda bulundu):**
`tools/screens.ts` Söküm karesini `waitCue(107)` ile bekliyordu; JUICE #107 planda sayı değil `'teardown'` iç ipucu
türüyle kayıtlıdır (`juice/plan.ts` adım 12), `cueRuns.get(107)` hep 0 → `teardown` senaryosu Söküm oynadıktan sonra
zaman aşımına düşüyordu (kare `_failed-teardown.png`: blok sahaya dönmüş). Harness `cueCount` / `waitCue` artık
`CueKind` (sayı ya da iç tür) alır, araç `'teardown'` bekler; test "DS-14 the Söküm (JUICE #107) is planned under the
cue kind 'teardown' …" (plan + araç kaynağı). **İkinci araç bulgusu (hücre kapısı):** harness `state().displayScale`
iki ondalığa yuvarlanıyordu (360 × 800'de 1/3 → 0,33), araç 144 × 0,33 = 47,5 CSS px yazıp ≥ 48 kapısını düşürüyordu;
gerçek hücre tam 48,0 (390 × 844'te de 51,8 yerine 52,0). Ölçek yuvarlamasız, kapıda 0,05 px tolerans — yerleşim
değişmedi. **Üçüncü bulgu (typecheck):** `tsconfig.tools.json` `vite/client` tipsiz derlenir; harness `api.ts`'e
eklediğim `juice/plan.ts` tip ithali araç projesini sahne grafiği üzerinden `services/platform.ts`'in `import.meta.env`'ine
ulaştırıp "Property 'env' does not exist on type 'ImportMeta'" veriyordu → `api.ts` sahne dosyası ithal etmez
(`CueKey = number | string`, test "… the harness API must not reach the scene graph"). **Üçüncü oturum**
(2026-10-14, bu kapanışın son hali): devralınan ağaçta `npm run check`, `npm run build`, `npm run levels:check` zaten
yeşildi (görev notundaki `HomeScene.ts(573)` hatası ikinci oturumda kapanmıştı); açık kalan üç şey e2e'nin 2 kırmızısı,
bayat perf raporu (10:52, `applyBench` öncesi) ve kapı sonuçlarının bu belgeye yazılmamış olmasıydı. (1) e2e "UX 13.1
… the drag glove plays": iddia `tutorial.phase === 'shown'` olur olmaz okunuyordu; eldiven `shown` kenarından itibaren
160 ms'de belirir ve kenar karesinde α 0'dır (`TutorialView.gloveAlpha`), harness `hidden: true` veriyordu → test
`tutorialHand.hidden === false` olana kadar bekler, sonra türün `drag` olduğunu ister (ürün davranışı doğru, test
zamanlaması yanlıştı). (2) e2e "K-43 level 2 … then the golden wins": kazanma penceresi 120 s duvar bütçesini aşıyordu
— azaltılmış harekette de dilim kilidi + kamyon + kazanma girişi OYUN zamanında koşar ve SwiftShader'da oyun zamanı
0,6 s'lik kareye 16,7 ms ilerler (TECH §10.7 madde 7) → dört kazanma beklemesi ortak `WIN_WAIT_MS` 300 s (screens ile
aynı). (3) `tools/screens.ts` Söküm senaryosu: azaltılmış harekette Söküm `reducedFade` 150 ms'de biter, "+600 ms"
karesi oturmuş tahtadır — iki profilde de `teardown-line.png` ile `teardown-after.png` bayt bayt aynıydı → senaryo tam
hareketle koşar (DS-15 hayalet karesi gibi); dizi 120 ms oturma + 600 ms uçuş (+ 80 ms/blok) olduğu için +600 ms karesi
uçuşun sonunda, balon açık (design-lead ofseti değiştirmek isterse `settle(gp, 600)` tek yer). Geri kalanı gözden
geçirildi ve tamam bulundu:

- **Kayıt göçü (TECH §2R.10):** `SAVE_VERSION` 2, `RULES_VERSION` 2, `MIGRATIONS[1]` aynı şekil; okunamayan Faz 2
  `inLevel` göçte cezasız iptal (`voidUnreadableAttempt`), okunan ama `rulesVersion` 1 olan deneme açılışta K-43/4 ile
  (`level_resume_invalid`). Testler "K-43 save version bump keeps progress (v1 → v2 …)" ×2.
- **META §4 açılış deneme hakları:** `meta/boosters.ts` `pendingFreeTrials` → `SaveService.beginAttempt({ freeTrials })`
  aynı yazımda, `freeTrialsGranted` ile bir kez; kilitli gelen adet korunur ve denemeler eklenir. Testler "META 4 …" ×3.
- **Envanter kullanımda düşer:** `SaveService.recordAction` uygulanan `hammer | crane | paint | undo` eylemini aynı yazımda
  −1 yapar; iptal (`voidAttempt`) günlüktekileri birebir geri verir. Test "UX 5.2 step 3 …".
- **Yıldız yalnız ilk kazanmada (META §10):** `flow/attempt.ts` `win()` `first = !rec.won` ile; kazanılmış bölüm
  `mode = replay`, ödül `sliceWinRewards` (yalnız taban altın). Testler "META 10 …" ×2 (+ `meta/home.test` 4).
- **Analytics v6 gönderim noktaları (TECH §2R.16):** `booster_used.target` (Çekiç: K-36 hedef türü; Vinç/Fırça `block`;
  Geri Al `null`; Mala olay yok), `deadlock_teardown` (Söküm başına bir kez, `cause` eşlemesi, Geri Al geri alırsa yeni
  olay yok ve `level_end` sayaçları düşer), `tutorial_step.shows/msToDone`, `nav_tap`, `level_end.exitFree = movesSpent 0`,
  `blocksLeft`. ANALYTICS §2 ↔ `ANALYTICS_EVENTS` iki yönlü eşitlik testleri yeşil (30 olay). `unknown_before_offer`
  hiç gönderilmez (test).
- **WP-O geri bildirim:** `services/feedback.ts` (`PersistentLog` `minikusta.analytics` son 500 olay, 1 s birleştirme,
  gizlenince yazım; `feedbackExport` 9 huni olayı, ortak parametre yok, göreli `tMs`, ≤ 20 000 karakter; `copyFeedback`
  pano → `copied | manual`), `ui/manualCopy.ts` salt okunur seçili metin kutusu, Ayarlar penceresinin son öğesi krem
  640 × 128 (`settings.feedback*`). Testler "ANALYTICS feedback export has no personal data …", "ANALYTICS ring buffer
  survives a reload", "… copy …", "UX 3 settings window …". Ekran: `home-feedback-copied`, `home-feedback-manual`.
- **`test:rules --phase 2R`:** `package.json` geçti (76 kimlik: K 46, engel 5, E 22, N 3). `CLAUDE.md` komut tablosu hâlâ
  "`--phase 2`" yazıyor — orkestratöre not (REVIEW_LOG).
- **e2e duman testi:** `tests/e2e/smoke.spec.ts` Faz 2R bölümleriyle (Bölüm 1 golden kazanma, Bölüm 2 devam, çıkış onayı,
  `touchcancel`, sahne uyanması, öğretici + hayalet, Çekiç 8 / ×, Mala ×, Söküm fikstürü). Sonuç aşağıda.
- **`npm run perf` bu turda ilk kez sonuna kadar koştu; yolda bulunanlar:**
  1. **Oyun hatası (ürün):** `LevelScene` çalışırken `scene.start` ile yeniden başlatılınca (hata ayıklama panelinin
     bölüm seçimi `debug/sceneBridge.ts`, harness `loadLevel`; ana sayfa ise uyutur/uyandırır) tembel dolan saha
     önizleme havuzu (`yardPreview`) ölü görüntüleri tutuyordu; ilk kaydırma sürüklemesinde `setTexture` girdi adımı
     içinde `TypeError … 'sys'` fırlatıyor ve Phaser'ın rAF zinciri bir daha kare üretmiyordu (oyun donar). SHUTDOWN'da
     havuz boşaltılır; test "TECH 12.3 a forced restart drops the yard preview pool …" (havuz listesini de sabitler).
  2. **Harness `waitGameMs`:** sabit 120 s duvar bütçesi yerine "saat 120 s ilerlemezse" durma dedektörü; yoklama rAF
     ile 1 s'lik zamanlayıcının yarışı (rAF durursa da zaman aşımı işler, sonsuz askı yok). `status()` `gameMs`,
     `loopRunning`, `docHidden` tanı alanları.
  3. **Yazılım GPU'su (SwiftShader) gerçeği:** 1×'te rAF 1,6 fps (kare 617 ms), 4×'te saniyeler. Phaser 200 ms'den uzun
     kareye son "makul" delta'yı (16,7 ms) verir → oyun zamanı 1×'te duvar zamanının %2,7'si; bir hareketin 257 ms'lik
     kaldırma beklemesi 16 kare. Perf koşuları `TimeStep.smoothStep`'i kapatır (`setSmoothStep(false)`: oyun zamanı =
     duvar zamanı, makul kareli cihazdaki gibi); `screens` açık tutar (kısa balonlar oyun zamanı sürünürken çekilir).
  4. **Adım 12 kapısı (TECH §2R.4):** sahnedeki 15 örnekli "p99" JIT-soğuk ilk çağrıyı ölçüyordu; `applyBench` ≥ 2 000
     eylemi (Bölüm 1–10 golden'ları, saf çekirdek, 200 eylem ısınma) sayfada o CPU oranında koşar; sahne örnekleri bilgi.
  5. **Araç dayanıklılığı:** bölüm hatası çökme yerine rapora girer (sayfa hataları yığınla, saat/döngü durumu); harness
     derlemesi kaynak haritalı (`vite.config.ts`, yalnız `artifacts/harness`), `tools/lib/harnessClient.ts` `pageerror`
     yığınını kaydeder.

## Kapanışlar (ekran incelemesi 1)

- [DS-01] → KAPANDI (`tools/screens.ts` Faz 2R seti baştan: ana sayfa `home-v2-first`, `home-v2`, `home-v2-locked-tap`,
  `home-settings`, `home-feedback-copied`, `home-feedback-manual`, `home-v2-fallback`; `level-01…10` başlangıçları (dilimin
  bütün tahta boyutları; 1 ve 8 `-fallback`); `tutorial-shown/hidden`, `tutorial-l03-step1`, `tutorial-l01-ghost-motion`;
  `win-v2`, `win-v2-loop` (META §10 tekrar: yıldız yok); güçlendirici akışları `flow-hammer-pick/hit/after`,
  `booster-no-target`, `flow-crane-pick/spots/after`, `flow-trowel-pick`; `teardown-line`, `teardown-after`; `pause`,
  `exit-m0`, `lose-1-offer`, `lose-2-life`, `resume-strip`; kısa profillerde Bölüm 1–5. Her karede kapı: ekrandaki Phaser
  metinlerinde `^[a-z]+(\.[A-Za-z0-9_]+)+$` deseni 0 (ham i18n anahtarı), aksi çıkış 1. Set yeniden çekildi:
  `artifacts/screens/2r/<profil>/`, sonuç "Kapı sonuçları" bölümünde)
- [DS-02] → KAPANDI (WP-M'de: `town_ch1_tree` katalogda; `assets:check` yeşil)
- [DS-03] / [DS-30] → KAPANDI (`tools/assets.ts` hayalet işi: silüet önce opak `color.board.planUnderlay` #BCCADD, üstüne
  `board.blueprint` %35 ve 4 px beyaz %90 kesik kontur; `town_ch1_treehouse_ghost.webp` yeniden üretildi. Aynı hayalet
  kazanma kartında da kullanıldığı için DS-30'un ayrı kart tonu gerekmez. Test "ART 7.2 ozalit ghost (DS-03 / DS-30)")
- [DS-04] → KAPANDI (code-lead payı: `assetCatalog.ts` `chr_tuna_stand` 300 × 480, P2, `optional: true` — SVG yokken
  `assets:check` yeşil (33 SVG). Sahne bağlantısı (ölçek 1,35, taban düğmenin 24 px üstünde, çalı kalkar, Kepçe oturan
  poz) SVG ve ASSET §16.3 satırı geldiğinde görünüm v3 paketinde; şimdi büst + çalı duruyor)
- [DS-05] → RET (bu turda; Öneri: kalp içi sayı görünüm v3 paketinin işidir — bu paket "yalnız doğru içerik". UX §3
  ölçüsü değişmeden uygulanacak; REVIEW_LOG'a not)
- [DS-06] → KAPANDI (`ui/kit/layout.ts` `lockedTabBalloon(play, nav, tab, balloonH)`: balon sekmenin üstünde yalnız üst
  kenarı ≥ düğme alt kenarı + 8 ise; değilse gezinme çubuğunun içinde (kuyruk ucu sekme üst kenarının ≤ 96 px altında,
  balonun alt kenarı çubuğun alt kenarını geçmeyecek şekilde kırpılır). UX §3 token'larıyla (çubuk 176, düğme altı
  264, balon 122 px) çubuk dalı her profilde seçilir; taslaktaki kırpmasız +96 balonu her profilde ekranın 12 px altına
  taşırıyordu. `HomeScene` yalnız bu yardımcıyı çağırır. Test "UX 3 locked tab balloon (DS-06)" H 1920 / 2336 / 2400)
- [DS-10] → KAPANDI (test payı; WP-M: `boardLayout.test` UX §5.8 tablosu c = 144 / 132 / 120)
- [DS-11] → KAPANDI (test payı; WP-M: durum şeridi 1520 / 80 / 1600 sabitleri testlerde)
- [DS-12] → KAPANDI (`ui/Panorama.ts` `panoramaWellSplit`: kuyunun solunda "BÖLÜM n" `brightTitle` 52 px `ui.ink`
  konturlu, panorama sağdaki alanda ortalı; panorama hücre boyunu koruyamıyorsa etiket gizlenir, şerit bütün kuyu.
  `LevelScene` bütün panorama okumalarında aynı dikdörtgeni kullanır. Test "UX 5.9 item 8 …")
- [DS-13] → KAPANDI (Vazgeç = seçili yuvanın yüzünde kırmızı yuvarlak × 128 px (`boosterSlots.ts`), Mala'da durum
  şeridindeki mala ikonunun yerinde × (`StatusStrip`); yuvaya yeniden dokunmak ve `popstate` vazgeçer; açıklama şeridi
  yalnız metin, alt kenarı vinç alanı tepesinin 16 px üstünde (`hintStripY`); krem `TextButton` "Vazgeç" silindi.
  `screens` `flow-hammer-pick` ve `flow-trowel-pick` × ile iptali doğrular. Test "UX 5.2 step 1 …")
- [DS-14] → KAPANDI (`TEARDOWN_LINE_MS = duration.teardownLine` 2400; kilitli dizi satırları teardown / truckhelp.free /
  reshuffle bu süreyle, kuyruklu satırlar 4000; `tools/screens.ts` `teardown-line` karesi Söküm'ün (#107) +600 ms'inde
  **tam hareketle** (azaltılmış harekette Söküm 150 ms'de bittiği için kare oturmuş tahtaydı) ve `tut.ctx.teardown`
  görünür değilse hata. Test "UX 13.1 locked-sequence lines (DS-14)")
- [DS-15] → KAPANDI (`tutorial/glove.ts` `ghostPoints`: eldiven parmak uzayında, bloğun α 0,55 hayaleti blok uzayında
  — saha içi 1 hücrelik kaydırma düz, çapraz değil; hayalet yol başında 160 ms'de kalkar; noktalı iz hayaleti izler.
  Bölüm 1 izi vinç alanından geçer. Ekran `tutorial-l01-ghost-motion` (hareket açık). Test "UX 13.1 tutorial block
  ghost (DS-15)")
- [DS-16] → KAPANDI (`theme/layout.ts` `boardTray`: pay = min(24, yardX − 32); 8 px'in altında yan kenar çizilmez,
  yalnız üst/alt bant tam genişlikte (B8, B10). Test "UX 5.8 rule 9 board tray (DS-16)")
- [DS-17] → RET (bu turda; Öneri: "önce product-lead onayı" koşulu var, onay yok. Onay gelince `boosterSlots` sırası
  Çekiç, Vinç, Geri Al, Fırça + UX §5.1 tablosu; analytics kimlikleri değişmez. REVIEW_LOG'a product-lead'e not)
- [DS-18] → KAPANDI (`StatusStrip` `drawTrowelIcon(passive)`: pasif mala beyaz α 0,55 silüet, mala tutulunca tam renk;
  renk körü modunda "n/4" aynen)
- [DS-19] → KAPANDI (Çekiç flaşı bloğun kendi karesinin tint-doldurulmuş kopyasıdır — pişirilmiş `cargo_q9` / `cargo_i5`
  silüeti, köşe yarıçapı korunur — ADD karışımla; tepe α 1,0 → `JUICE_VIEW.smashFlashPeak` 0,85 (α 1 ADD her pikseli
  beyaza doyurup düz kare okutuyordu). Parçacıklar aynı. Test "JUICE 61 hammer flash (DS-19)")
- [DS-20] → KAPANDI (hata ayıklama paneli `import.meta.env.DEV` koşullu dinamik `import`: ne `dist/`'te (verify-dist
  panelin kendi etiketi "Drop the running attempt" ile arar, 63 dosya temiz) ne harness derlemesinde. `tools/screens.ts`
  her karede Phaser metinlerinde `DBG…` ve DOM'da `#mu-debug` (`DEBUG_ROOT_ID`, `src/debug/labels.ts`) yoksa geçer.
  Test "DS-20 …")
- [DS-21] → KAPANDI (değişiklik yok; set yeniden çekildi — ham anahtar kapısı hedef çipi dahil her karede geçti; "blok"
  etiketinin görsel onayı inceleme 2'de design-lead'in)
- [DS-32] → RET (bu turda; token design-lead'in, inceleme 2'de DS-31 ile birlikte — görünüm v3 paketi)
- [DS-34] → KAPANDI (`ui/WinScreen.ts` `SUNBURST_ALPHA = TOKENS.kit.sunburst.rayAlpha`, +0,1 eklemesi yok; karışım
  `kit.sunburst.blend`)
- [Devir listesi: tokens tüketimi] → KAPANDI (WP-M: 10 anahtar `TokensSchema`'da tipli ve okunuyor; `sfx_teardown`
  tipli; `RETIRED_TOKEN_KEYS` = `_docRetire` madde 1–2 (5 anahtar) şemadan çıktı — design-lead silebilir)
- [Devir listesi: silme sırası madde 3] → RET (bu turda; v1 blok çizicisi `theme/draw/block.ts` hâlâ `theme/textures.ts`
  tarafından okunuyor (`BlockSpec`, `GhostStyle`, `SilhouetteKind` ve v1 pişirme). Silinmesi görünüm v3 paketiyle;
  o güne kadar `block.*` v1 anahtarları ile `alpha.gloss`, `alpha.seam` tokens.json'da kalmalı)
- [Devir listesi: yerleşim sabitleri, i18n] → KAPANDI (WP-M; `NOT_IN_STORY` boş, "D-017 …" sıkı testi yeşil)

## Kapı sonuçları

(aşağıdaki değerler bu turun koşularıdır; ayrıntı TECH §2R.11 uygulama notu)

- `npm run check`: YEŞİL — typecheck (3 tsconfig) · eslint · prettier · vitest 102 dosya / 2023 test (100 s) · `test:rules --phase 2R` 76 kimlik (K 46, engel 5, E 22, N 3)
- `npm run build`: YEŞİL — `assets:check` 33 SVG, indirme 257,7 / 900 KB, doku 15,1 / 64 MB · vite 266 modül · `verify-dist` ilk yük 588,4 / 620 KB gzip, v2 görsel 257,7 / 1024 KB, 63 dosya, hata ayıklama / harness kodu yok (R-20)
- `npm run levels:check`: YEŞİL — validate + solve: 10 bölüm çözüldü, 0 error, 0 warning; YAO 3/4 … 10/10, K-52 bandı tutuyor; bot (WP-N, Faz 3) yok, atlandı
- `npm run perf`: SARI (çıkış 1; yazılım GPU'su SwiftShader, CPU tarafı 4×): **PASS 7** — sürükleme ortalama 59,1 fps ≥ 50, sürükleme p95 12,8 ms ≤ 25, ana sayfa 60 fps, FTUE 0 dokunuş ≤ 3, adım 12 en kötü 7,3 ms ≤ 8, doku 54,9 MB ≤ 64, girdi gecikmesi p95 / max 1 kare (1404 örnek); **FAIL 6** — kazanma ortalama 38,8 fps (p95 93,2 ms; kazanma katmanının açılış karesi 157 ms, 1×'te 39 ms), sürüklemede > 50 ms kare 10 (en uzunu 170,7 ms Bölüm 1 ilk bırakma: dokunma işleyicileri 129 ms = oturumun ilk commit'i, JIT-soğuk; 1×'te en kötü 20,9 ms), FTUE 13,1 s > 10 s (giriş 3,9 s'de, üç panel 5,4 s otomatik ilerleme = tasarım token'ı, bölüm ekranı 13,1 s'de; "Geç" yolu 10,6 s; 1× ağsız 7,9 s), bölüm pişirme 699 ms > 150 (1×'te 158), kit pişirme 684 ms > 200 (1×'te 150), adım 12 p99 3,0 ms > 2 (1×'te 0,4). 1× koşusunda bütün ölçütler kapı değerlerinin altında (bölüm pişirme 158 hariç, +8 ms). Rapor `artifacts/perf/report.json`; yorum ve öneriler "Bilinen sorunlar" bölümünde
- `npm run screens`: YEŞİL — 90 kare (390×844 ve 360×800 40'ar; 390×763 ve 360×740 5'er), 0 senaryo hatası, 0 konsol hatası, ham i18n anahtarı 0, `DBG` / `#mu-debug` 0 (DS-01, DS-20), hücre kapısı 360×800 Bölüm 1 = 48,0 CSS px (390×844 52,0); `teardown-line` ≠ `teardown-after` (tam hareket). Koşu `node tools/screens.ts --profile <ad>` ile profil çiftleri paralel (harness derlemesi bir kez; aynı senaryo ve kapılar), duvar süresi ≈ 100 dk; `npm run screens` aynı seti sırayla çeker
- e2e (`npx playwright test -c tests/e2e/playwright.config.ts`): YEŞİL — 11 / 11 geçti, 38,3 dk (Bölüm 1 golden 6,4 dk, Bölüm 2 devam + kazanma 5,5 dk, Bölüm 5 Mala 5,3 dk); bu turda düzeltilen iki test dahil
