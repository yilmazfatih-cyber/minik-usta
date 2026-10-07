# code-lead — Faz 2R çapraz inceleme kapanışı

Tarih: 2026-10-07 · Sahip: code-lead · Bağlayıcı: `docs/review_inbox/_orchestrator_rulings_2R.md` (R2-01…R2-12; R2-08
güncellemesi "Canva yok, SVG" ve R2-12 sahip referansları dahil) · Kapsam: bana yöneltilen 9 yorum (EN-2R-17…21,
PL-2R-16, DL-2R-14…16).

Özet: **KAPANDI 9 · RET 0 · AÇIK SORU 0.** Önemli 6/6 ve Öneri 3/3 bu turda kapandı. Değişen dosyalar (yalnız
kendi dosyalarım): `docs/TECH_DESIGN.md` (§2R baştan eşitlendi, yeni §2R.15 ve §2R.16, §11.4 notu, §12.2, §12.4,
§13, yeni §14.0, §14.2–§14.3 notları, §15 R-10), `tools/rule-coverage.ts` (engel fazı: ilk bölüm 6–10 → 2R),
`tests/tools/ruleCoverage.test.ts`, `tests/scenes/flow.test.ts` ve geçiş dönemi test işaretleri (aşağıda "Test durumu").

## Kapanışlar

### entrepreneur

- [EN-2R-17] → KAPANDI (TECH yeni §14.0: Faz 2R satırları BUSINESS §10 kalemleri sırasıyla, 29,5 g net → 35,4 g
  tamponlu; Faz 3'ten düşen günler satır satır (solver −3,5, tarama −0,75, K-30 −1, güçlendirici −1,5, L-19 −0,5,
  W2/W3/Y5 −0,75 → Faz 3 32,5 → 24,5 g net), Faz 4 −1, Faz 5 +1,5; plana net etki +22 g net. Kesme sırası §2R.12 =
  BUSINESS §12.4: 1 D3b tablo yayımı → Faz 3, 2 JUICE §8'in 9 olayı → Faz 5, 3 paralaks + sandık önizleme → Faz 4; tetik
  tuttuğu için 1–3 toplama uygulandı; sıra 4 (AI 2. parti) R2-08 ile konusuz; sıra 5 uygulanmadı. Tek şeritte Faz 2R
  ≈ 7,1 hf, iki paralel kod şeridinde ≈ 3,8 hf; iki şeritte plan etkisi ≈ +2,0 hf, 4 haftalık tamponun içinde. Çekirdek
  kesilmedi)
- [EN-2R-18] → KAPANDI (TECH yeni §2R.16 ve §11.4 notu: v6 tip birliği, 28 MVP + 2 mağaza olayı, her yeni parametrenin
  gönderim noktası ve değer tanımı tablosu. Kodda bu tur yazıldı: `ANALYTICS_EVENTS` v6, iki yönlü test yeşil,
  `level_end.teardowns`/`blocksLeft` ve `tutorial_step.shows`/`msToDone` gerçek değerlerle gönderiliyor;
  `deadlock_teardown`, `nav_tap`, `booster_used.target` gönderim noktaları WP-D, WP-I, WP-C ile; `cause` eşlemesi
  `color → color_balance`, `tiling`, `access`; `exitFree` = `movesSpent = 0` (WP-D). `unknown_before_offer` değerinin
  gönderim noktası yok (GDD K-30'da dal kalktı); tablodan çıkarılması ÖNERİ olarak dönüş değerinde)
- [EN-2R-19] → KAPANDI (uyarlanarak; TECH §2R.4 "Maliyet ve performans kapısı": çalışma anında bütçeli arama yok, D3b
  solver tablosu (GDD K-30 kapanışı). Kapılar: adım 12 p99 ≤ 2 ms ve en kötü ≤ 8 ms (sizin sayınız), 4× CPU, Bölüm
  1–10'da 2 000 seed'li eylem; solver her bölüm için `d3aMaxExpansions`'ı LEVEL_REPORT'a yazar, 8 ms'yi aşan bölüm
  kırmızı listelenir. D3a not defteri sayısal anahtarlı (dizge yok). "Teklif öncesi genişletilmiş arama" yok; sayaç 0'da
  aynı denetim aynı maliyetle çalışır)
- [EN-2R-20] → KAPANDI (TECH §2R.16 "Geri bildirim dışa aktarımı", yeni paket WP-O 0,5 g: Ayarlar > "Geri bildirim";
  halka tampon `localStorage`'da kalıcı (son 500 olay); dışa aktarım yalnız 9 olay türü, ortak parametreler ve duvar
  saati yok, göreli `tMs`, ≤ 20 000 karakter; `navigator.clipboard.writeText`, reddedilirse elle kopyalama kutusu.
  Düğmenin yeri ve 3 metin anahtarı design-lead'e yorum)
- [EN-2R-21] → KAPANDI (konusuz: R2-08 güncellemesiyle Canva ve üretken yapay zekâ kalktı, görseller elle yazılan
  SVG'dir; zemin çizilmediği için şeffaflık doğal, kenar halesi oluşmaz. TECH §2R.6 boru hattı SVG denetimi (yasak öğe,
  viewBox, boyut, palet) → derlemede WebP raster → ikon atlası → manifest olarak yeniden yazıldı; taşma dolgusu ve hale
  ölçümü adımı silindi. "Ölçüt tutmazsa prosedürel yedek" kuralı korundu: `status: 'rejected'`)

### product-lead

- [PL-2R-16] → KAPANDI (TECH §2R.2 şema satırı: `mode` yalnız `'soft'`, başka değer ya da spot alanı `tut_blocking`;
  `done` ve `startOn` yalnız olay, `timeoutMs` `schema_invalid`. §2R.9: `TutorialPresence` yalnız sunum katmanında
  (`wait | shown | hidden | done`), gizlenme adımı bitirmez, adımı yalnız `done` bitirir; önerdiğiniz test adı "K-53
  hidden tutorial step still completes on done event" test listesine girdi. LEVELS Bölüm 1–10'da `timeoutMs` yok)

### design-lead

- [DL-2R-14] → KAPANDI (TECH §2R.1 "Uyarlanır hücre boyu": formülünüz birebir, FIT bütçesi, cihazdan bağımsız;
  `cellMaxPx` token'ı yoksa 120 → R2-02'nin bugünkü metniyle aynı sonuç, token 144 olunca kod değişmeden B1–B5, B7, B9
  144; B6 132; B8, B10 120. Ölçek k = c/120: `wallW`, `hitSlopPx`, `blockV2` px, `yardHolePx`. Testler "UX 5.8 cell size
  B1–B10", ekran görüntüsü kapısı 360×800'de B1 ≥ 48 CSS px. R2-02 yorumu için ÖNERİ P-2R-6 orkestratöre. Not (sizin
  kararınız): FIT'te üst balon yuvası (y 280–430) B4/B9'da vinç alanıyla (y 336'dan) kesişir; B6'da 120 iken de vardı;
  EXPAND profillerinde kesişme yok)
- [DL-2R-15] → KAPANDI (TECH yeni §2R.15, yeni paket WP-P 1 g: `ActionResult { events, teardown, summary }` tek paket,
  Söküm paketin son olayı; `TurnSummary { holdable, queue (FIFO şekil + renk), pendingBatches, blocksLeft, neededNow,
  boosterTargets }`; `unlockedNeeded` yalnız Kolay/Normal ve yalnız `neededNow` blokları için, paketten sonraki karede,
  ≤ 1 ms kapısı; `blockedCargo` sürükleme oturumu sinyali (tutuş başına 1, günlüğe girmez); eldiven yolu L-35
  `tut_hand_invalid` solver aşamasında (§2R.3, §2R.5). Test adları kural kimlikli)
- [DL-2R-16] → KAPANDI (TECH §13 yeni satır, Faz 5, 0,5 g: Android 10+ `View.setSystemGestureExclusionRects`, tahta
  kenar şeritleri, kenar başına 200 dp sınırı içinde saha satırlarının alt 200 dp'si; bağımlılıksız yerel Capacitor
  eklentisi; sınır Faz 5'te cihazda doğrulanır. Ek olarak web karşılığı §2R.1 (WP-G, ≈ 0,1 g): ilk dokunuşta
  `history.pushState` koruyucu kaydı, `popstate` → duraklatma penceresi, `pointercancel` → iptal)

## Kapanışlarda değişen TECH bölümleri (orkestratör ve sahipler için)

- §2R.0 madde 6: product-lead kapanışıyla kural kararları kesinleşti; `core/policy.ts` politika sabitleri yazılmayacak.
- §2R.1: Ağır Yük düğüm kuralı (saha içinde kalır, DL-2R-08), `blockedCargo`, uyarlanır hücre, web geri koruması,
  E-56/E-57 test adları.
- §2R.2: `blocksLeft = N − doğru yerleşmiş malzeme` (UX §5.9 formülü); Vinç döndürme kuralları; ön denetim K-33/K-37/
  K-38; Söküm güçlendiriciyi iade etmez; şemaya `piece`, `boosterUsed`, `segmentDone`, `blocks`.
- §2R.3: L-16 imza tablosu Faz 2R; L-28 Ws hikaye bölümüne göre; L-35 `tut_hand_invalid` (solve aşaması).
- §2R.4: `TeardownCause = 'color' | 'tiling' | 'access'`; adım 12 sırası (sayaç > 0, sayaç 0, +5 sonrası); W6'da D2
  yok; parti uygunluğu ve W6 jokeri; Söküm güçlendirici ve Mala eylemlerinde de; `movesSpent`; perf kapısı.
- §2R.5: `tutorial.ts` (L-35), `d3aMaxExpansions`, varyant bantları, tablo yayımı kesme 1 ile Faz 3.
- §2R.6: SVG boru hattı (R2-08 güncellemesi).
- §2R.7–§2R.9: çıkıntı, parlama dokusu, delikli zemin; HomeModel META §10; öğretici `piece` süzgeci, K-53/6.
- §2R.10: geçiş dönemi test işaretleri.
- §2R.12: paket tablosu son hali (16 paket, WP-O ve WP-P yeni), kesme sırası, şeritler.
- §12.4: K-54 satırı; K-30, K-36, K-37 F = 2R (Faz 2R dilimi Söküm, Çekiç B8 ve Vinç B10'u içerir); §12.2 sayımı
  betikle yenilendi.

## Diğer sahiplere yorumlar (REVIEW_LOG'a orkestratör taşır)

- [code-lead → entrepreneur] ANALYTICS §2 v6 `deadlock_teardown.cause`: `unknown_before_offer` gönderim noktası yok
  (GDD K-30 "bilinmiyor → dön" dalı kalktı, product-lead kapanışı EN-2R-01) → enum'dan çıkarılsın; çıkınca tip aynı
  turda güncellenir.
- [code-lead → entrepreneur] ANALYTICS "Değer tanımları" `level_end.exitFree` = "`m = 0`" → Faz 2R'de "`movesSpent =
  0`" (GDD K-43 madde 2).
- [code-lead → entrepreneur] ANALYTICS v6 `level_end.blocksLeft` tanımı "sahada + kuyrukta + elde + teslim edilmemiş
  partilerde" → UX §5.9 ile tek formül olsun: "N − doğru yerleşmiş malzeme bloğu". Fark yalnız Faz 3'te (şantiyedeki
  moloz ve yapışmış harç) çıkar; Bölüm 1–10'da iki tanım aynıdır.
- [code-lead → entrepreneur] ANALYTICS v6 `booster_used.target`: "Altın Mala'da `block`" yazıyor ama `booster` enum'u
  Altın Mala'yı içermiyor (Mala güçlendirici değil, seri ödülü). Ya enum'a `goldTrowel` eklensin ya da Mala cümlesi
  silinsin. Kod şimdilik Mala için `booster_used` göndermez.
- [code-lead → entrepreneur] BUSINESS §10 "Faz 2R etkisi" ve §12.4: TECH §14.0 sayıları (Faz 2R 29,5 g net / 35,4 g
  tamponlu; Faz 3 24,5; Faz 4 18,75; Faz 5 16,5; plan +22 g net; tek şerit ≈ +5,3 hf, iki şerit ≈ +2,0 hf) ve kesme 4'ün
  konusuz kalması işlensin. §6.2'deki "D3b bilinmiyor ≤ %1" ölçütü "D3a bilinmiyor ≤ %1" olsun (CL-2R-30).
- [code-lead → design-lead] `tokens.json` `layout.adaptive.cellMaxPx`: orkestratör P-2R-6'yı kabul ederse 144 yazılsın;
  kod hazır. UX §5.8 örnek tablosu o zaman c = 144/132/120 ile yeniden hesaplanır (formüller aynı).
- [code-lead → design-lead] UX §13.1 FIT balon yuvası: B4/B9'da (c 144) ve B6'da vinç alanıyla kesişme var (§2R.1 FIT
  notu). Vinç alanı sert koşula eklenecekse yazın; dikey bütçe 1200 − 166 olur ve B4/B9 120'ye döner.
- [code-lead → design-lead] Geri bildirim düğmesi (EN-2R-20): UX Ayarlar ekranında yer ve STORY §7'de
  `settings.feedback` ("Geri bildirim"), `settings.feedbackCopied`, `settings.feedbackManual` metinleri (TR/EN, ≤ 6
  kelime).
- [code-lead → design-lead] ASSET §16.1 "code-lead boru hattı (TECH §2R.7)" → doğru bölüm §2R.6. ASSET #2 artık
  `bg_level_site_edge` (60×960); TECH P1 grubu buna göre güncellendi.
- [code-lead → product-lead] GDD K-45 başlığı madde 10'u `levels:validate`'e veriyor; `tut_hand_invalid` kanonik çözüm ve
  `dist` istediği için `levels:solve` aşamasında koşar (TECH §2R.3 L-35). Başlığa "madde 10'un `tut_hand_invalid`'i
  solve aşamasında" notu eklensin.

## Test durumu (bu turun etkisi)

Bu tur iş paketi başlatmadım. Belgelerin Faz 2R'ye geçmesiyle kırmızıya dönen 9 test ve yüklenemeyen 2 test dosyası
vardı (design-lead kapanışındaki "bilinçli kırmızı" listesi dahil). Paket gerektirmeyenleri düzelttim, paket
gerektirenleri sıkı `it.fails` + bilinen farkı birebir iddia eden geçen test çiftiyle bağladım (TECH §2R.10):

- `docs/TECH_DESIGN.md` §12.4 K-54 satırı + K-30/K-36/K-37 F = 2R → `tests/tools/ruleCoverage.test.ts` ve
  `presentation.review` `test:rules` testleri yeniden yüklendi ve geçti; `tools/rule-coverage.ts` ilk bölümü 6–10 olan
  engeli 2R fazına koyar (W2, W3, Y5).
- `src/core/level/schema.ts`: `blocks` vurgu kimliği (UX §13.1, CL-2R-21).
- `tests/scenes/flow.test.ts`: seri kademesi 3 = +1 mala +2 hamle (META §5, `economy.json`).
- `src/i18n/tr.json`, `en.json`: davranıştan bağımsız 11 STORY/OBSTACLES metni; 3 davranışa bağlı anahtar WP-C/WP-D/WP-L'de.
- `src/services/analytics.ts` v6 tip birliği; `src/scenes/flow/attempt.ts` `level_end.teardowns` (Faz 2 çekirdeğinde
  Söküm yok: 0) ve `blocksLeft` (`src/ui/remaining.ts` `remainingBlocks`, yeni test), `tutorial_step.shows` (1) ve
  `msToDone` (`TutorialController.stepEnded` artık süreyi verir).
- `tests/core/level/mechanics.test.ts`, `tests/services/i18n.test.ts`: sıkı test `it.fails` + fark testi.
- `tests/review/data.review.test.ts`: LEVELS ↔ JSON kümeleri LEVELS Faz 2R biçimindeyken kayıt edilmez, `it.todo`
  (WP-M).

Sonuç: `npm run check` çıkış 0 (typecheck, lint, format:check; 76 dosya, 1 399 geçti, 4 beklenen başarısız, 1 todo;
`test:rules --phase 2` 45 kimlik kapsandı). `npm run build` çıkış 0 (index 1 799 KB, gzip 503 KB; verify-dist temiz).
`npm run levels:validate` 5 dosya, 0 hata, 0 uyarı. `levels:check` henüz yok (WP-E/WP-M).
