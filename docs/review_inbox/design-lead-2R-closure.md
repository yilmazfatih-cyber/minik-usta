# design-lead — Faz 2R çapraz inceleme kapanışı

Tarih: 2026-10-07 · Sahip: design-lead · Bağlayıcı: `docs/review_inbox/_orchestrator_rulings_2R.md` (R2-01…R2-12; R2-08
güncellemesi "Canva yok, SVG" ve R2-12 sahip referansları dahil) · Kapsam: bana yöneltilen 39 yorum (CL-2R-20…27,
EN-2R-10…16, EN-2R-22, PL-2R-01…15, DL-2R-17…24).

Özet: **KAPANDI 39 · RET 0 · AÇIK SORU 0** (2 madde içinde proje sahibine giden alt soru var: EN-2R-14 P-15 onayı,
EN-2R-16 (c) Tuna'nın görsel yaşı). Engel 5/5, Önemli 23/23 ve Öneri 11/11 bu turda kapandı.

Değişen dosyalar (yalnız kendi dosyalarım): `docs/UX_FLOWS.md`, `docs/ART_DIRECTION.md`, `docs/JUICE.md`,
`docs/STORY.md`, `docs/ASSET_LIST.md`, `src/theme/tokens.json` (yalnız yeni anahtar + `kit.nav` üç renk değeri; silme ve
yeniden adlandırma yok; `npx vitest run tests/theme` 206/206 yeşil, Prettier temiz).

## Kapanışlar

### code-lead

- [CL-2R-20] → KAPANDI (UX §5.8 baştan yazıldı: `rows` yerine H = max(Hy, Hs + eMax), Hy, Hs; saha çerçevesi yalnız Hy
  satır, saha üstü hava zeminsiz `board.craneSky` bandı, şantiye ozalit Hs + e satır, şantiye üstü hava "plan dışı"
  dolgusu ve iskele H'ye kadar; çentik `(H + 2) − height`; örnek tablo LEVELS §2'nin gerçek boyutları B1–B10 + varsayılan;
  ART §5 aynı biçimde H cinsinden)
- [CL-2R-21] → KAPANDI (UX §13.1'den Z/Y ve "`mode` bu anlamla kalır" cümlesi çıktı: her adım `soft`, yalnız `done` ile
  biter, Bölüm 1–10'da `timeoutMs` yok; §13.2 Faz 2R tablosu LEVELS §2 adımlarının yalnız sunum karşılığı oldu (veri
  tekrar yazılmıyor); vurgu sözlüğüne `blocks` = yalnız kalan blok çipi eklendi, `goals` = panelin tamamı olarak B1 adım 2
  için kabul edildi)
- [CL-2R-22] → KAPANDI (UX §5.2 Faz 2R tablosu: Mala saha bloğu → |P| = 1 kendiliğinden / |P| ≥ 2 `ghost_<şekil>_valid`
  vurgusu → hedef; Fırça A + eşit hücreli, farklı renkli B, uymayan blokta titreme, renk seçici yok; Çekiç K-36 hedefleri;
  hedefsiz yuva UX §0.3 kalıbı + `booster.*.noTarget`; yeni doku yok)
- [CL-2R-23] → KAPANDI (ART §7 ve ASSET §16.1/§16.3: arka planlar SVG `viewBox 0 0 1080 1920`, 0,5 ölçekte 540×960
  raster (2,1 MB GPU), üst ≤ 480 px prosedürel gök; oyun ekranı arka planı artık doku değil prosedürel çivit (R2-12);
  ikonlar 128 px tek boy, tek atlas (512×640, 20 yuva), @2x yok; karakterler kullanım boyutunda; bütçe indirme ≤ 900 KB,
  doku ≤ 64 MB; tahmini toplam ≈ 15,2 MB, aynı anda ≈ 10 MB)
- [CL-2R-24] → KAPANDI (R2-08 güncellemesiyle Canva yolu tamamen kalktı: `generate-image` ve `remove-background` yok;
  görseller SVG olduğu için şeffaflık doğal, arka plan kaldırma adımı gerekmez; boru hattı SVG → raster + yasak öğe ve
  boyut denetimi (`npm run assets`, code-lead); ölçüt tutmazsa prosedürel yedek — ASSET §16.1, §16.2)
- [CL-2R-25] → KAPANDI (seçim: **siluete ADD flaş**; pişirilmiş süpürme şeridi yok. JUICE #92, #93, ART §3A.2 "Yerleşti",
  §15 "Parlama" güncellendi; düğmede `setCrop`'lu bant (#98) aynen)
- [CL-2R-26] → KAPANDI (ART §14.8: Usta Dede portresi yüklenince bir kez Canvas2D `arc` + `clip` ile 128×128 dokuya
  pişirilir; yapı açılışı `setCrop` aynen)
- [CL-2R-27] → KAPANDI (tokens `layout.adaptive._doc`: `minSideMarginPx` = tahta kenarı; 8 sütunda saha çerçevesi solda
  10 px, iskele dahil sağda 14 px; `tutorial._doc` ve UX §13.1'e girdi kilidi kodunun WP-H'de kalkacağı yazıldı)

### entrepreneur

- [EN-2R-10] → KAPANDI (UX §5.2 Çekiç: Ağır Yük, kasa, torba, zincir (yalnız zincir), şantiyedeki moloz ve yapışmış harç;
  saha malzeme blokları α 0,5. Fırça: A → eşit hücreli farklı renkli B, renk seçici kalktı. Mala: saha bloğu (P'si boş
  olan soluk) → P vurgusu. Hedefsiz durum sütunu eklendi)
- [EN-2R-11] → KAPANDI (UX §0.3 "Kilitli öğe" önceliği kilitli > hedefsiz > adet 0; yeni "Hedefsiz yuva" kalıbı: gri, "+"
  yok, dokununca `booster.hammer.noTarget` / `booster.brush.noTarget` balonu, `offer_shown` gönderilmez; §5.1, §5.2 madde
  5; STORY §7.6 iki yeni anahtar + `booster.trowel.noTarget`; JUICE #108)
- [EN-2R-12] → KAPANDI (ART §1: "yetişkin casual oyuncu için premium casual; çocuksu değil"; "her yaşa / for all ages /
  family" yasağı ART §1 ve ASSET §16.2'de; istem öneki R2-08 güncellemesiyle zaten kalktı. R2-07 metni için ÖNERİ dönüş
  değerinde)
- [EN-2R-13] → KAPANDI (konusuz: R2-08 güncellemesiyle Canva çağrısı, kota ve `remove-background` yok; ücret 0; ASSET §16
  girişinde kayıt)
- [EN-2R-14] → KAPANDI (ASSET §15 sütunları: yazar, araç + plan, rol, tarih, insan rötuşu, ters görsel arama; §16.1 açık
  soru yerine P-15 kuralı; §0'a not: SVG'leri yazan bir yapay zekâ ajanı olduğu için telif sorusu sürer, mağaza öncesi
  insan yeniden çizimi şartı korunur; §14'e yalın sanat yolu ≈ 126 g → ≈ 65 g. P-15'in proje sahibi onayı dönüş
  değerinde soru)
- [EN-2R-15] → KAPANDI (ART §11.8 yan yana benzerlik testi protokolü ve eşiği (5 kişiden ≥ 3 → ozalit hayaleti + iskele
  ≥ %40, oyna düğmesine ozalit kenarı), ART §12 test g; Faz 2R ekranları henüz yok, test görsel uygulamasının ilk
  `npm run screens` çıktısıyla yapılır)
- [EN-2R-16] → KAPANDI ((a) Mağaza kilitli, altın "+" "Yakında" — UX §3; (b) dilimde görev yok, her kazanma 1 ★ ve yapı
  katmanı — UX §2.2, §3, §6; (d) not alındı. (c) Tuna'nın görsel yaşı proje sahibine soru olarak dönüş değerinde;
  ASSET §16.3 kabul ölçütü 10–12 önerisini taşır)
- [EN-2R-22] → KAPANDI (proje sahibi R2-08 güncellemesiyle yanıtladı: "canvayı boşver"; Free/Pro sorusu konusuz; Gemini
  ve Canva yok, ücret 0)

### product-lead

- [PL-2R-01] → KAPANDI (UX §13.1: Z/Y ve `mode` cümlesi silindi, "her adım `soft`, yalnız `done` ile biter, Gösterim ↔
  Gizli sunumdur"; "Z satırı kuralı" paragrafı silindi; §13.2 tablosu LEVELS §2 ile birebir (B1 lift + useall … B10
  cranebooster), yalnız sunum sütunları; `timeoutMs` yok; v1 11–50 tablosuna "Z/Y Faz 3'te geçersiz" notu)
- [PL-2R-02] → KAPANDI (UX §5.8 kuralları ve örnek tablo (B1–B10 gerçek boyutlar, panorama hücresi `min(24, ⌊98/Hs⌋)`),
  §5.3 "Vinç alanı tavanı" ve §13.2 `tut.ctx.tootall` satırı `(H + 2) − height`; ART §5 gövdesindeki "y = 10" ve
  "10 − height" H cinsinden)
- [PL-2R-03] → KAPANDI (UX §5.2 Mala ve Çekiç akışları; §5.5 ve ART §4'ten "Altın Mala hedefleri = cephe" silindi; JUICE
  #17 blok sahadan P'ye uçar, #61 malzeme bloğu kırılmaz, hedef yoksa #108; STORY `booster.hint.trowel`,
  `tut.ctx.goldtrowel`, `tut.m.hammer` yeni metin, "R2-05'e bağlı" notları kalktı; §13.2 mala satırının vurgusu
  seçilebilir saha blokları; ASSET `icon_hammer` "Bölüm 8, K-36")
- [PL-2R-04] → KAPANDI (ART §6 Ağır Yük: Q9 kayışlı çelik sandık + palet, I5 çelik I-kiriş, tek parça, çıkıntı/sembol yok,
  gövde #7A7A7A — her tabana ΔE00 ≥ 24,6, renk körü simülasyonunda C'ye ≥ 25,9 (ölçüldü); ikaz bandı + kettlebell; kabul
  5/5; ART §1 sütun 8'e Ağır Yük; STORY `tut.m.heavy` "Ağır yük plana girmez: kenara kaydır." / "Heavy cargo stays out.
  Slide it."; Ağır Yük'e "blok" denmez kuralı UX §13.1 ve STORY'de; tokens `color.obstacle.cargo*`)
- [PL-2R-05] → KAPANDI (JUICE #107 Söküm 600 ms, 80 ms arayla, Usta Serisi söner, sayaç animasyonsuz, `tut.ctx.teardown`
  her Söküm'de 1,2 s; #21b kaldırıldı, #21c'den `reshape` çıktı; JUICE §0 kural 3 ve UX §0.3 kilit listesi 21a 600 / 21c
  900 / 107 600; UX §5.1 kilitlenme durumu; §13.2 bağlamsal tablo; STORY `truckhelp.material` kaldırıldı, `reshuffle`
  K-30 D1; kayıp penceresi Söküm sonrası durumu gösterir; tokens `duration.teardown*`, `audio.sfx.sfx_teardown`)
- [PL-2R-06] → KAPANDI (UX §5.9 madde 1 tek formül `kalan = N − doğru yerleşmiş malzeme bloğu` ve olay listesi (−1
  sürükleme/Vinç/Mala, +1 Söküm ve Geri Al, diğerleri değişmez, çift sayım yok); §7 tel kafesi "Kalan: {n} blok" + ek
  hedef; `lose.left` Faz 2R'de kullanılmaz; STORY `lose.blocksLeft` EN "Blocks left: {n}")
- [PL-2R-07] → KAPANDI (STORY `win.clear` "Bütün bloklar yerinde!" / "Every block in place!"; JUICE #94 tetiği K-48'in
  sağlandığı an, dizi #18 → #94 → #55, süpürme yükü kaldırmaz; UX §5.9 madde 5, §6.1 aşama 0; ART §4 notu düzeltildi)
- [PL-2R-08] → KAPANDI (UX §6.1 "Altın Mala ×n · ● 10·n" satırı 760×64, yalnız n ≥ 1, kapsüller 80 px aşağı; döngüde bonus
  ve mala satırı yok; tokens `layout.win.trowelRowY` 1160, `trowelRowH`, `rewardsShiftPx`)
- [PL-2R-09] → KAPANDI (UX §3: bölüm sandığı Bölüm 1'den her zaman görünür (n/10 halkası, önizleme penceresi
  `chest.preview`), diğer kenar ikonları gizli, kumbara sağ kenar listesinde; §2.2 dilim sırası: görev penceresi yok,
  `story.ch1.start` Bölüm 1'den sonraki ilk ana sayfa girişinden önce; Mağaza kilitliyken "Altın al" yerine gri pasif
  `common.notEnoughCoins` (§3, §3.1, §4, §7); 1–10 döngüsünde öğretici, ★ ve bonus yok — §3, §6, §6.1, §13.1; §12 akış)
- [PL-2R-10] → KAPANDI (STORY §6 giriş düzeltildi; 13 satır TR/EN ≤ 6 kelimeye kısaltıldı, `tut.ctx.lastmoves` yeni
  tetiğe göre yeniden yazıldı; yeni `tut.m.park`, `tut.m.carry`, `tut.m.carryNow`, `tut.ctx.teardown`,
  `booster.hammer.noTarget`, `booster.brush.noTarget` (+ `booster.trowel.noTarget`); betikle sayıldı: bütün `tut.*` ve
  `booster.*` satırları ≤ 6)
- [PL-2R-11] → KAPANDI (ART §6 moloz = §3A şeker blok + çatlak/toz katmanı α ≤ 0,35 + 40 px "↩" rozeti, bayrakla söner;
  UX §5.4 moloz satırı silindi, neden sırası `outside → color → support`; tokens `alpha.debrisLayer`)
- [PL-2R-12] → KAPANDI (UX §13.1 balon yuvası: sert koşul saha/şantiye/durum şeridi/HUD ile kesişmez; FIT'te alt yuva
  geçersiz → üst yuva (y 280–430), 390×844 ve 360×800'de alt yuva geçerli; kabul 0 px; kuyruk kuralı: adım etkinken
  (Gösterim ya da Gizli) gelen `tut.ctx` satırı Bitiş + 400 ms, `teardown` kuyruğa girmez)
- [PL-2R-13] → KAPANDI (ART §3A.3 oluk/kontur farkı ölçüldü: en az ΔL\* 16,6 ve 1,68:1 (W), iki blok arası bant ≥ 4,0:1;
  geçit açıklığı `board.craneSky` — ART §5, UX §5.8; ART §12 kabul testleri a (iki blok/tek blok 5/5, renk körü dahil),
  b (8 sembol 5/5; tutmazsa `symbolSizeRatio` 0,46))
- [PL-2R-14] → KAPANDI (ART §14.9 kalan blok ikonu krem kit rengi, `ui.ink` kontur, sembolsüz; UX §5.9 madde 7 en çok 4
  çip, 3–4 çipte ikon 72 / aralık 16, sığmazsa ikinci satır; tokens `layout.hud.goalChip*`)
- [PL-2R-15] → KAPANDI ((a) JUICE #63 iki blok renk takası, `booster.hint.brush` "Yer değiştirecek iki bloğa dokun."; (b)
  #68 ve UX §4 değerleri `winStreak.tiers[k]`'dan; (c) ART §7.2 7 kırpma durağı `layout.home.ch1CropStops`, SVG'de ip
  merdiven çatının üstünde yukarı doğru, dilimde oran = kazanılan bölüm / 10)

### design-lead (kendi bulgularım)

- [DL-2R-17] → KAPANDI (ART §3A.2 "Tutulabilir / Tutulamaz" durumları: parlama yayı + noktası yalnız tutulabilirde,
  tutulamaz ×0,92 `setTint`; parlama ayrı renksiz doku; UX §5.3 görünüm satırı ve "ötelemeyi kesen bütün komşular"
  vurgusu; JUICE #2; kabul 4/5, 2 sn — ART §12 test d; tokens `blockV2.notHoldableTint`, `duration.holdableFade`)
- [DL-2R-18] → KAPANDI (ART §2.4 delikli pano zemini Ø 12 delik, sahaya bırakma önizlemesi 4 px beyaz α 0,6 noktalı
  kontur, saha üstü hava; UX §5.3 yeni satır, §5.8 bölge tablosu; tokens `layout.adaptive.yardHolePx`,
  `stroke.yardPreviewPx`, `alpha.yardPreview`)
- [DL-2R-19] → KAPANDI (JUICE #51 ve UX §5.1, §5.9, §13.2: tetik `kalanHamle − kalanBlok ≤ 1` ya da `kalanHamle ≤ 2`, ses
  yalnız ilk girişte; kusursuz B5–B10'da uyarı yok; STORY `tut.ctx.lastmoves` "Hamleler azaldı, sakin düşün.")
- [DL-2R-20] → KAPANDI (UX §13.1 eldiven oynatma koşulu (path[0]'da vurgulu blok + tutulabilir + yol R içinde ve iptalsiz),
  `truck` = kamyon göstergesi, gizliyken vurgu yok sayılır; §13.2 = LEVELS)
- [DL-2R-21] → KAPANDI (STORY §6A / §6: park, carry, carryNow, heavy, hammer, gap, teardown, hammer.noTarget yazıldı;
  heavy/hammer/teardown/carry için product-lead'in daha net metinleri seçildi)
- [DL-2R-22] → KAPANDI (UX §5.1 ve JUICE #20: kamyon göstergesinde sıradaki kuyruk bloğunun 0,35 ölçekli önizlemesi;
  "+N−1" yerine mevcut `truck.queue` "Kamyonda: N" korundu, çünkü toplamı zaten verir ve yeni anahtar gerektirmez)
- [DL-2R-23] → KAPANDI (UX §5.9 madde 2 teslim edilmemiş parti alt rozeti "+n", madde 3 "sonraki kat" rozeti (her
  zorlukta); ASSET §16.5 `ui_truck_subbadge`, `ui_badge_nextfloor`; tokens `layout.hud`)
- [DL-2R-24] → KAPANDI (JUICE §0 kural 14: Söküm'le biten hamlede #7/#12 sesi, haptik, #15, #16, #92 oynamaz; blok 120 ms
  sessiz oturur, sonra #107; tokens `duration.teardownSettle`)

## Bağlayıcı karar uyumu (yorum dışı, aynı turda)

- **R2-08 güncellemesi (Canva yok, SVG):** ASSET §0, §14, §15, §16 baştan yazıldı (26 SVG, viewBox, raster boyutu, GPU
  belleği, kabul ölçütü, prosedürel yedek, üretim sırası; SVG yazım kuralları §16.2); ART §1, §7, §9, §11 "yapay zekâ ile
  üretilir" ifadeleri SVG'ye çevrildi. `public/art/**` SVG'leri görsel uygulama adımında yazılır (bu tur yalnız şartname).
- **R2-12 (sahip referansları):** ART §3A.5 çıkıntı (stud) katmanı — hücre başına tek büyük çıkıntı, sembol tepesinde
  (referanstaki 2×2 küçük çıkıntıdan özgün olarak ayrışır); §7.1 oyun ekranı prosedürel çivit sahne; §14.4 kare rozet;
  §14.7 çivit alt gezinme; §11.8'e referans oyunu satırı; §16'ya kaynak satırı. Tokens: `blockV2.stud*`, `color.scene`,
  `alpha.scene*`, `kit.badge.shape/cornerPx`, `kit.nav` renkleri.

## Test durumu (bu turun etkisi)

- `npx vitest run tests/theme`: 206/206 yeşil. `tests/review/services-theme.review.test.ts`: 89/89 yeşil.
- **Bilinçli kırmızı (code-lead eşitleyince yeşil):** `tests/services/i18n.test.ts` "D-017 every text is verbatim from
  STORY" — STORY metinleri PL-2R-03/04/07/10 gereği değişti, `src/i18n/tr.json` / `en.json` code-lead'in;
  `tests/core/level/schema.test.ts` "tutorial highlight vocabulary equals UX 13.1 list" — UX'e `blocks` vurgu kimliği
  eklendi (CL-2R-21), şema `HIGHLIGHT_PATTERNS`'a eklenmeli.
- Diğer kırmızılar bu turdan önce de vardı ve başka sahiplerin (ANALYTICS v6, META §5 seri, OBSTACLES imza, LEVELS el
  çözümü satırı, rule-coverage).
