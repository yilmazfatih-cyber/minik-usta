# Varlık listesi — Minik Usta

Sahip: design-lead · Sürüm: **Faz 2R uygulama (2026-10-07)** — 33 SVG teslim edildi (§15 kayıt, §16.6 teslim durumu); **Faz 2R (2026-10-07)** — görsel listesi v2 §16: **elle yazılmış SVG** (R2-08 güncellemesi: Canva ve üretken yapay zekâ yok; 26 varlık, ücret 0), bellek ve indirme bütçesi (CL-2R-23), R2-12 studlu tuğla ve çivit sahne varlıkları, prosedürel v2 varlıkları §16.5; çapraz inceleme kapanışı aynı gün; önceki: Faz 1 revizyonu (2026-10-05; R-04, R-05, R-07, R-14, R-19, R-24), Faz 2 boşluğu 2 (2026-10-06) · Görsel
tarifler: `docs/ART_DIRECTION.md` · Animasyon/ses: `docs/JUICE.md` · Sahneler: `docs/STORY.md`

---

## 0. Kurallar

- **Boyutlar** 1080×1920 tasarım tuvaline göre px (1×). Tuval cihazda yaklaşık fiziksel piksel çözünürlüğünde çizildiği
  için (390 pt × 3 = 1170 px) 1× yeterlidir; ikonlar ve logo ayrıca SVG kaynağıyla teslim edilir.
- **Durum:** `prosedürel` = kodla çizilir (final kalitesinde kalabilir) · `yer tutucu` = basit SVG/şekil, final sanatla
  değişecek · `final` = teslim edildi.
- **Format:** düz renkli ve kenar keskin öğeler SVG kaynak + PNG atlas; büyük illüstrasyonlar WebP (kalite 85, şeffaflık
  gerekiyorsa WebP-alpha), yedek PNG. Ses: prosedürel (MVP), final için OGG + M4A.
- **Dosya adı:** `kategori_ad_varyant` (İngilizce, küçük harf, alt çizgi). Klasör yerleşimi code-lead'in kararı
  (öneri `public/assets/<kategori>/`).
- **Atlas:** oyun ekranındaki tüm küçük görseller tek bir 2048×2048 atlasa — çizim çağrısı bütçesi için. Bloklar atlas
  değil, **bölüm başında parça bazlı pişirilir** (§2; ART_DIRECTION §3): Canvas2D (`Path2D`) → `CanvasTexture`, tek
  `refresh()`. Kasaba parçaları hikaye bölümü başına 1–2 atlasa paketlenir (§7).
- **Öncelik** (entrepreneur, BUSINESS §10 takvimi): **P0** = Aşama 1 (yumuşak lansman) öncesi final: uygulama ikonu,
  logo, 4 ana karakter, Hikaye 1–2'nin kasabası + panelleri + arka planları, arayüz ikonları, P0 engelleri · **P1** =
  Aşama 2 öncesi: Hikaye 3–5, geç açılan engeller, yan karakterler · **P2** = albüm kartları, figüranlar, **[Sonra]**
  öğeler · `kod` = prosedürel, sanatçı işi yok. İş yükü tahmini §14.
- **Üretim yöntemi ve fikri mülkiyet (entrepreneur):** ana karakterler (Tuna, Usta Dede, Kepçe, Gribeton), logo ve
  uygulama ikonu **insan sanatçı** tarafından çizilir; görsel üretim araçları yalnız keşif/eskiz için kullanılır
  (yalnız yapay zekâyla üretilen görsel ABD'de telif korumasına girmez; taklitlere karşı koruma zayıflar). Her final
  varlık için kaynak dosya (katmanlı SVG/PSD/Krita) + üretim kaydı tutulur (§15). Brif ve negatif istemlerde **marka ya
  da karakter adı geçmez**; yerine öğe tarifi yazılır. Logo ve ana karakterler isim kararıyla birlikte marka başvurusuna
  girer (BUSINESS R-05).
- **Faz 2R (R2-08 güncellemesi, 2026-10-07; proje sahibi: "canvayı boşver, bu görsellerden oluştur"):** Canva ve
  bütün üretken yapay zekâ görsel servisleri **kullanılmaz**. Web MVP'nin illüstrasyonları (arka plan, kasaba yapısı,
  karakter, ikon, logo amblemi) design-lead'in elle yazdığı **SVG** dosyalarıdır (`public/art/**`, §16); bloklar,
  düğmeler, paneller ve sayaçlar prosedüreldir. Ücret yok, üçüncü taraf araç lisansı yok. **Mağaza sürümü (Aşama 1)
  öncesi** (entrepreneur kararı P-15, proje sahibi onayına; EN-2R-14): logo amblemi, uygulama simgesi ve 4 ana karakter
  insan sanatçı tarafından SVG'ler referans alınarak yeniden çizilir; diğer varlıklarda belgelenmiş insan rötuşu yeter
  (§15). Not: SVG'leri yazan design-lead bir yapay zekâ ajanıdır; bu yüzden "insan katkısı olmayan üretim telif
  alamaz" sorusu (BUSINESS K58) SVG'ler için de geçerlidir ve P-15'in mağaza öncesi yeniden çizim şartı bu nedenle
  korunur.

### 0.1 Genel stil brifi — v1 (Faz 2R'de §16.2 ile değişti)

> **Faz 2R:** bu brifteki "no glossy candy look" ve "no gradients except skies" R2-07 ile kaldırıldı. Yeni üretimde
> §16.2'deki stil öneki ve negatif kullanılır; aşağıdaki metin kayıt için kalır.

> "Polished, tactile casual-game 2D art for adult players on mobile. Warm, bright palette; thick rounded dark-brown
> outlines (#3B2A1A); flat colors with one soft shadow tone and one white highlight band; rounded corners; materials
> read as painted wood, matte plastic and concrete. Friendly but grown-up: no baby proportions, no preschool look. No
> gradients except skies. No text, letters, numbers or logos in the image. Original characters only."
>
> **Negatif (her zaman; marka adı yok):** "no yellow hard hat on the child, no overalls, no tool belt on the child, no
> talking or face-wearing construction vehicles, no bulldog, no crown, no cape, no king or royal figure, no stacked
> alphabet cubes, no neon glow, no glossy candy look, no text, no watermark, no photorealism, no 3D render, no anime
> style."

Türkçe karşılığı: yetişkin oyuncuya yönelik, cilalı ve dokunsal casual oyun sanatı; sıcak parlak palet; kalın yuvarlak
koyu kahve kontur; düz renk + tek gölge tonu + beyaz ışık bandı; boyalı ahşap, mat plastik ve beton dokusu; bebeksi oran
ve okul öncesi görünüm yok. Görselde yazı/rakam/logo yok. ("toy box / toy-like" ifadeleri üretim araçlarında okul öncesi
stili tetiklediği için kullanılmaz — ART_DIRECTION §1, BUSINESS S2–S5.)

---

## 1. Font

| Ad | Boyut | Format | Durum | Öncelik | Brif |
| -- | ----- | ------ | ----- | -- | ---- |
| `font_baloo2_latin_tr` | 38 KB | WOFF2 (değişken 400–800) | final | P0 | Baloo 2 (OFL 1.1), Latin + Latin Ext-A + Türkçe noktalama alt kümesi. Kaynak: google/fonts `ofl/baloo2`. Lisans metni `OFL.txt` uygulama içi Lisanslar sayfasına. |

---

## 2. Bloklar, semboller, bayraklar

| Ad | Boyut | Format | Durum | Öncelik | Brif |
| -- | ----- | ------ | ----- | -- | ---- |
| `blk_<şekil>_<W..P>[_<bayrak>]` (bölüm başına tipik ≤ 24) | şekil kutusu, en çok 360×360 | `CanvasTexture` (bölüm başında pişirilir) | prosedürel | kod | ART_DIRECTION §3 tarifi; bölümde geçen her (şekil × renk × bayrak) birleşimi için **bir doku** (code-lead): kesintisiz dış kontur, dış ve içbükey köşe, parça düzeyinde parlama, iç dikiş, sembol. Tahtada parça başına tek `Image`. Renk körü modunda yeniden pişirilir (~10–30 ms). Final'de de prosedürel kalır (tutarlılık, renk körü modu, boyut). |
| `blk_sil_<şekil>_<contact/lifted/crane>` | şekil kutusu + bulanıklık payı | `CanvasTexture` | prosedürel | kod | Temas, kaldırılmış ve vinç gölgesi için önceden bulanıklaştırılmış siluet (Canvas `shadowBlur`; çalışma anında Filter yok). |
| `ghost_<şekil>_<valid/invalid/neutral>` | şekil kutusu | `CanvasTexture` | prosedürel | kod | Düşüş gölgesi: düz (doğru) / kesik kırmızı (hatalı) / kesik beyaz (nötr) kontur + %25 gövde (UX §5.4). |
| `sym_<W..P>` (8) | 100×100 birim (hücrede 55 px) | SVG | prosedürel | kod | ART_DIRECTION §3.1 yolları. Final iyileştirme brifi: "8 simple monochrome glyphs, one per material: wood grain with knot, three sand dots, leaf, brick bond, roof-tile scallops, concrete cross-hatch, four-point sparkle, faceted gem. Each must stay distinct as a silhouette at 40 px and in grayscale. W (wood grain), R (brick bond), O (tile scallops) and C (cross-hatch) are stroke-based with rounded caps and joins, 7–9% stroke weight; Y (three dots), G (leaf), B (sparkle) and P (gem) are filled silhouettes, G and P with base-color carved lines (vein, facets), per ART_DIRECTION §3.1. Keep this stroke/filled mix: it is what keeps the glyphs apart in grayscale." |
| `flag_glass` | 120×120 katman | PNG/prosedürel | prosedürel | kod | İki çapraz beyaz parıltı + köşede çatlak cam rozeti (28 px). Final: "subtle glass overlay for a building block: two diagonal white streaks, faint inner rim, tiny cracked-glass corner badge; transparent background." |
| `flag_mortar` | 120×140 (alttan 20 px taşar) | PNG | yer tutucu | P1 | Bloğun altından sarkan 3 gri harç damlası + 32 px mala rozeti. Final: "three soft gray mortar drips hanging from the bottom edge of a block, plus a small trowel badge; cartoon, thick outline." |
| `flag_balloon_1`, `flag_balloon_2` | 80×120, 140×120 | PNG | yer tutucu | P1 | Beyaz balon(lar) + ip, kontur #3B2A1A. Final: "one / two white party balloons with short strings, glossy highlight, thick outline, tied to the top of a block." |
| `flag_chain` | 120×120 | PNG | yer tutucu | P1 | Çapraz iki zincir + ortada 40 px altın asma kilit. Final: "two steel chains crossing diagonally over a square tile, small chunky gold padlock in the middle; tactile casual-game style." |
| `flag_wet` | 120×120 | PNG | yer tutucu | P1 | Parlak gri ıslak harç tabakası (%55) + 2 beyaz parlama. Final: "glossy wet-cement glaze over a block, gray, two white shine spots, a few drips; semi-transparent." |
| `badge_counter` | Ø 48 | prosedürel | prosedürel | kod | Krem daire + koyu kontur; rakam Baloo 2 800, 34 px. |
| `heavy_band`, `badge_weight` | 120×16, 40×40 | PNG | yer tutucu | P0 | Sarı-siyah ikaz bandı ve kettlebell silueti (Ağır Malzeme). |

---

## 3. Tahta, şantiye, plan

| Ad | Boyut | Format | Durum | Öncelik | Brif |
| -- | ----- | ------ | ----- | -- | ---- |
| `board_yard_floor` | 120×120 döşeme (2 ton dama) | PNG | prosedürel | kod | #E9C891 / #E2BD80 ince ahşap-kum zemin, 3 px ızgara #D4AE6E. Final: "warm sandy wooden floor tile, very subtle grain, seamless, low contrast so blocks pop." |
| `board_yard_frame` | 9-dilim, köşe 40 | PNG | yer tutucu | P0 | 20 px ahşap tahta çerçeve #B98A4E, köşelerde çivi. |
| `board_blueprint` | 240×240 döşeme | PNG | prosedürel | kod | #1F4F8F zemin, beyaz %14/%24 ızgara, %4 kâğıt benekleri. Final: "seamless blueprint paper texture, deep blue, faint white grid every cell and stronger every two cells, slight paper speckle; flat, not photographic." |
| `board_blueprint_corner` | 72×72 | SVG | prosedürel | kod | Pafta köşebendi (beyaz %30 L). |
| `board_blueprint_deep` | 120×120 kare (hücre başına) | prosedürel | prosedürel | kod | Plan dışı şantiye hücresi (ART §4 "Plan dışı"; aktif dilimde `y ≥ h + e`, GDD K-03): düz `board.blueprintDeep` #173D70 dolgu; ızgara, kâğıt beneği ve köşebent **yok**. `board_blueprint` döşemesinden koyu olduğu için plan alanının sınırı ızgarasız da okunur. Final'de de prosedürel kalır. |
| `board_scaffold_pole`, `_ledger`, `_clamp` | 16×960, 240×10, 20×20 | PNG | yer tutucu | P0 | Çelik iskele borusu (#8A96A3, üst ışık), yatay kuşak, turuncu kelepçe. Final: "chunky scaffolding in a tactile casual-game style: rounded steel poles, orange clamps, thick outline." |
| `board_ceiling_beam` | 240×12 (+ 2 kelepçe 20×20) | prosedürel | prosedürel | kod | Tavan kirişi (S8 balon tavanı, ART §4): aktif dilimin plan tepesinde her bölümde yatay çelik boru `board.scaffold` + iki uçta turuncu kelepçe; asansörle birlikte hareket eder. |
| `plan_<W..P>` (8; eski ad `plan_cell`) | 120×120 kare (çizim kutusu 104×104, içe 8 px) | prosedürel | prosedürel | kod | Açık altlık `board.planUnderlay` #BCCADD + renk `alpha.planFill` %80 (renk körü modunda %90) + kesik kontur (bileşik dolgu × 0,65) + sembol %100 `color.planInk` (ART_DIRECTION §4). |
| `plan_<W..P>_front` (8) | 120×120 kare (kutu 104×104) | prosedürel | prosedürel | kod | İnşa cephesindeki plan hücresi (K-34, R-01; ART §4 katman 1): `plan_<c>` tarifinin aynısı, yalnız **dolgu** +%15 açılır (`plan.frontLighten`: bileşik dolgu × 0,85 + beyaz × 0,15; renk körü modunda %90'lık bileşikten); kesik kontur açılmış dolgudan × 0,65; **sembol ve mürekkep değişmez** (%100). Üstüne `plan_front` konur. Cephe kayınca (JUICE #83) eski hücre `plan_<c>`'ye, yenisi `plan_<c>_front`'a geçer. |
| `plan_front` | 120×120 kare (kutu 104×104) | prosedürel | prosedürel | kod | İnşa cephesi **katmanı** (K-34, R-01; ART §4 katman 2): yalnız **düz** 6 px kontur `plan.frontStrokePx`, `board.buildFront` (plan kesik konturuyla aynı yol, kesikleri örter) + dış parlama `alpha.buildFrontGlow` (8 px bulanıklık). Dolgu, açıklık ve sembol **yok**; +%15 açıklık `plan_<c>_front` hücresindedir. `plan_<c>_front`'un ve cephedeki `?` hücresinin üstüne konur. |
| `plan_support_hatch` | 104×104 | prosedürel | prosedürel | kod | Eksik destek taraması (K-34): yatay 6 px çizgi, 20 px aralık, `color.ghost.support` %85 (45° renk taramasından desen olarak ayrı); her sarı çizginin altında önce 10 px `ui.ink` %80 alt çizgi (ART §4, Faz 2 tur 2; açık plan renklerinde okunurluk). Aynı çerçeve gölgede ve JUICE #84'te. |
| `plan_empty` (`.`) | 104×104 | prosedürel | prosedürel | kod | 45° beyaz %28 tarama + kesik kontur; komşular birleşik çerçeve. |
| `plan_hidden_tag` (`?`) | 64×64 | SVG | yer tutucu | P1 | Krem kâğıt etiket, ip deliği; `?` **Baloo 2 800 glifi** (el yazısı değil), i18n değil (sembol). Final: "small cream paper tag with a string hole, slightly rotated; the question mark is added in code." |
| `crane_hook_ornament` | 80×120 | SVG | yer tutucu | P0 | Vinç alanı sol ucunda sabit kanca. Final: "orange crane hook on a short cable, tactile casual-game style." |
| `ghost_badge_ok`, `_warn`, `_support`, `_glass`, `_cancel` | Ø 44 (renk körü modunda 60) | SVG | prosedürel | kod | ✓ / ! / ↓ (K-34 eksik destek) / çatlak cam / ↩ (bırakma iptal olacak; UX §5.3); beyaz daire + koyu kontur. |
| `hud_heavy_ring` | Ø 96 | prosedürel | prosedürel | kod | Ağır yerçekimi halka sayacı (UX §5.7): beyaz → son %30'da turuncu. |
| `hud_steer_chip` | 72×72 | prosedürel | prosedürel | kod | Hafif yerçekimi "↔" çipi (UX §5.6). |
| `segment_mini_<n>` | 2×8 hücre, hücre 12 px | prosedürel | prosedürel | kod | Panorama için planın küçük render'ı (K-06): tamamlanan dilim tam renk, gelecek dilim plan renkleriyle %30 (`alpha.panoramaFuture`), `?` hücreleri `?` etiketiyle; büyük önizlemede semboller de çizilir (UX §5.1). |

---

## 4. Duvar ve geçitler

| Ad | Boyut | Format | Durum | Öncelik | Brif |
| -- | ----- | ------ | ----- | -- | ---- |
| `wall_body` | 60×120 döşeme | PNG | prosedürel | kod | Beton gövde, dikey kalıp çizgileri. Final: "vertical concrete column segment, light gray, soft formwork lines, rounded edges, seamless vertically." |
| `wall_cap` | 72×20 | PNG | prosedürel | kod | Sarı-siyah ikaz şeritli başlık. |
| `gap_static_edge` | 72×14 | PNG | prosedürel | kod | İkaz bandı (üst/alt) + `gap_rail` 300×12 çerçeve (duvar şeridi 60 + şantiye 240; ray açıklıktan da geçer, Faz 2 tur 3): ortada 8 px `board.rail` #3F454D ray, üst kenarında 2 px `board.wallLight` ışık çizgisi, 40 px'te bir 4×12 px travers çentiği (ART §5, Faz 2 tur 2; gerçek boyunda pişirilir, gerilmez). |
| `gap_narrow_jaw` | 18×28 ×2 | SVG | yer tutucu | P0 | İçe bakan çelik çene (#4A525C) + 10 px çelik çerçeve; W3 bir katmandır, `size = 1` olan **her** geçit tipinin üstüne eklenir (ART §5). Final: "two small chunky steel wedge jaws pointing inward, bolted." |
| `gap_shutter_slats` | 60×(120·size) | PNG | yer tutucu | P0 | Yatay lamelli panjur; `gap_shutter_roll` 72×28 sarılı silindir. Final: "metal roller shutter, horizontal slats, gray-blue, closed and rolled-up states." |
| `gap_slider_plate` + `badge_updown` | 72×(120·size), Ø 52 | PNG/SVG | yer tutucu | P0 | Turuncu kayar plaka, dikey ray izi, ▲▼ rozeti (dolu = sıradaki yön). |
| `gap_paint_frame_<W..P>` | 72×(120·size) | prosedürel | prosedürel | kod | Geçit rengiyle 8 damla + damla rozeti içinde sembol. Final: "paint-splattered door frame, thick drips in the gate color, a drop-shaped badge on top." |
| `gap_locked_gate` + `padlock` | 72×(120·size), 72×80 | PNG | yer tutucu | P1 | Dikey parmaklıklar + büyük altın asma kilit; açılma animasyonu için 3 kare. Final: "barred gate with 4 vertical steel bars and a chunky gold padlock; open and closed padlock frames." |
| `fan_housing`, `fan_blades` | 112×112, 96×96 | SVG | yer tutucu | P1 | Rüzgâr fanı muhafazası ve 3 kanat (dönen sprite); `wind_lines` 240×120 kesik çizgiler. |

---

## 5. Engeller

| Ad | Boyut | Format | Durum | Öncelik | Brif |
| -- | ----- | ------ | ----- | -- | ---- |
| `obs_crate_hp3`, `_hp2`, `_hp1` | 120×120 | PNG | yer tutucu | P0 | Açık çam kasa, X destek, çiviler; hp3 = 2 metal kuşak, hp2 = 1 kuşak + küçük çatlak, hp1 = kuşaksız 2 çatlak. Final: "light pine wooden crate, cartoon, X brace, nails; three damage states: two steel straps, one strap, no strap with cracks; must not look like a wooden building block." |
| `obs_cement_bag` + `_torn` | 120×120 | PNG | yer tutucu | P0 | Kâğıt çuval, ip bağı, gri tuğla piktogramı; yırtık kare. Final: "plump paper cement sack, off-white, tied top, gray brick pictogram (no text), slightly slumped; torn frame with dust puff." |
| `obs_screw` | Ø 56 | SVG | yer tutucu | P0 | Altın vida başı, artı yarık. Final: "shiny golden screw head, cross slot, top view, chunky." |
| `obs_key` | 88×40 | SVG | yer tutucu | P1 | Altın anahtar, halkasında renk şeridi. |
| `obs_glint` | 20×20 (+ 28 px soluk vida/anahtar simgesi) | SVG | prosedürel | kod | Örtülü vida/anahtar için köşe ışıltısı; **her zorlukta** görünür (GDD K-42: konum gizlenmez). |
| `obs_debris_mask_<shape>` | şekil kutusu | prosedürel | prosedürel | kod | Kırık beton (#8D8579), tırtıklı kenar, çatlaklar. Final dokusu: "broken concrete chunk texture, brown-gray, jagged edges, cracks, dust specks; tileable." |

---

## 6. Arka planlar (her hikaye bölümü için 4 katman)

Boyut 1080×2400 (uzun telefonlar için; bkz. UX_FLOWS §0.1). Gökyüzü gradyanı prosedürel.

| Ad | Boyut | Format | Durum | Öncelik | Brif |
| -- | ----- | ------ | ----- | -- | ---- |
| `bg_ch<1..5>_sky` | 1080×2400 | prosedürel | prosedürel | kod | ART_DIRECTION §7 renkleri. |
| `bg_clouds_<a..d>` | 360×160 | PNG | yer tutucu | P0 | 4 yumuşak bulut, beyaz, kontursuz, alt kenarda hafif gölge. |
| `bg_ch1_far/mid/near` | 1080×600 / 1080×700 / 1080×500 | WebP | yer tutucu | P0 | Ağaç Ev: "soft rolling green hills, round-topped forest silhouettes, grass with tiny daisies; low saturation, layered parallax strips, transparent top." |
| `bg_ch2_far/mid/near` | aynı | WebP | yer tutucu | P0 | Fırın: "warm orange small-town street, tiled roofs and chimneys with curly smoke, cozy window lights; low saturation." |
| `bg_ch3_far/mid/near` | aynı | WebP | yer tutucu | P1 | Kütüphane: "blue-violet school silhouette, round trees, clouds shaped faintly like open books, mosaic tile trim." |
| `bg_ch4_far/mid/near` | aynı | WebP | yer tutucu | P1 | Fener: "sunset sea in turquoise and peach, rocky shore, lighthouse silhouette, distant gulls." |
| `bg_ch5_far/mid/near` | aynı | WebP | yer tutucu | P1 | Şato: "purple festival night, hilltop with warm golden lights, bunting flags, faint fireworks." |

---

## 7. Kasaba (Ana ekran) ve albüm

| Ad | Boyut | Format | Durum | Öncelik | Brif |
| -- | ----- | ------ | ----- | -- | ---- |
| `town_ch<n>_base` | 1080×1200 | WebP | yer tutucu | P0 (ch1–2) · P1 (ch3–5) | Hikaye bölümünün yapı alanı boş hâli (iskele, temel çukuru). |
| `town_ch<n>_part<1..7>` (35 parça, R-07) | **sınır kutusuna kırpılmış**, en çok 1080×1200; `{x, y}` ofseti `town_ch<n>.json`'da | WebP → atlas | yer tutucu | P0 (ch1–2) · P1 (ch3–5) | STORY §5 görevleri; her görev yapıya bir katman ekler. Çizim tam tuvalde (1080×1200) yapılır, teslimde kırpılıp ofsetle verilir ve hikaye bölümü başına **1–2 atlasa (2048×2048)** paketlenir; yalnız aktif hikaye bölümü bellekte (tam tuval katman başına ~5,2 MB GPU yerine, code-lead). Brif örneği (Ağaç Ev 1): "wooden tree-house steps nailed to a big plane tree trunk, transparent background, matches layered composition." Her parça aynı kamera açısında (¾ önden, hafif aşağıdan) ve aynı ölçekte. |
| `town_ch<n>_complete_glow` | 1080×1200 | PNG | prosedürel | kod | Tamamlanınca yapının arkasında yumuşak ışık halesi. |
| `album_card_ch<1..5>` | 600×800 | WebP | yer tutucu | P2 [Sonra] | Tamamlanan yapının kartpostal görünümü, beyaz kenar, köşede yıldız. |
| `album_card_locked` | 600×800 | prosedürel | prosedürel | kod [Sonra] | Gri siluet + asma kilit (Albüm R-19 ile Sonra; MVP'de yalnız kilitli "Yakında" sekmesi). |

---

## 8. Karakterler

Teslim: her karakter katmanlı (gövde, kafa, saç/şapka, yüz parçaları göz/kaş/ağız ifade başına), kod ile tween'lenir.
Büst 256×320, tam boy 320×480 (1×). Yer tutucular ART_DIRECTION §11.7 SVG'leri. **Ana 4 karakter insan sanatçı
işidir** (§0). **İfade kapsamı (entrepreneur, ART §11.6):** ana 4 karakter (Tuna, Usta Dede, Kepçe, Gribeton) MVP'de 6
ifade; yan 4 karakter (Ayşe, Selin, Rıza, Kurdele) 3 ifade (mutlu, şaşkın, üzgün); kalan ifadeler **[Sonra]**;
figüranlar yalnız mutlu/şaşkın.

| Ad | Boyut | Format | Durum | Öncelik | Brif |
| -- | ----- | ------ | ----- | -- | ---- |
| `chr_tuna_*` (büst, tam boy, 8 poz, 6 ifade) | 256×320 / 320×480 | SVG → PNG parçalar | yer tutucu | P0 | Görsel yaş proje sahibine açık soru (brif 8 ↔ 10–12 görünüm; ART §11.1); karar gelene kadar brif geçerli, yaş oyun içi metinde ve mağaza görselinde yazılmaz (STORY §0-8). "An 8-year-old gender-neutral child builder: chin-length messy chestnut hair poking out of a MINT-GREEN hard hat with a white star sticker, freckles, big amber eyes, orange safety vest with two pale-yellow reflective bands over a cream/teal striped long-sleeve shirt, navy trousers with a sand-colored knee patch, HUGE yellow work gloves (bigger than the head's width ratio suggests), red sneakers, yellow pencil behind the ear. Big head, small body. Poses: thumbs up, carrying a block, fixing helmet with both hands, writing on plan, victory jump, startled hop, chin on glove thinking, hugging the dog." + genel negatif. |
| `chr_dede_*` (6 poz, 6 ifade) | aynı | SVG → PNG | yer tutucu | P0 | "Tall thin elderly master builder: terracotta flat cap, very thick round black glasses magnifying the eyes, broad white blunt mustache, white tufts of hair at the sides, olive multi-pocket work jacket over white shirt, yellow tape-measure case on the belt, holds a folding wooden ruler as a pointer; slightly stooped, kind smile. No apron, no vest, no bushy white hair on top, no old-woodcarver look." |
| `chr_kepce_*` (6 poz, 6 ifade) | 320×220 | SVG → PNG | yer tutucu | P0 | "Red dachshund with a very long body and tiny legs, wearing an oversized ORANGE hard hat that slips sideways, one ear flopping out under it, mint collar with a bone-shaped tag; loves digging. Not a bulldog, no vehicle, no backpack, no badge." |
| `chr_gribeton_*` (6 poz, 6 ifade) | 256×320 | SVG → PNG | yer tutucu | P0 | "Boxy, rectangular-bodied businessman: flat-top gray hair shaped like a poured concrete slab with horizontal form lines, thick straight dark-gray eyebrows, thin straight 'spirit level' mustache, half-lidded confident eyes, gray three-piece suit, dark-gray tie with a tiny cement-mixer tie pin, gray hard-cover folder with a plain gray square emblem, polished black shoes. Comedic and proud but clearly kind-hearted; never villainous or sinister. No top hat, no cane, no monocle." Bölüm 5 varyantı: kravatta küçük renkli mozaik iğne. |
| `chr_ayse_*` (4 poz, 3 ifade) | 256×320 | SVG → PNG | yer tutucu | P0 | "Warm middle-aged baker: dark-gray hair bun, rosy cheeks, mustard apron dusted with flour, sleeves rolled, long wooden bread peel over the shoulder." |
| `chr_selin_*` (3 ifade) | 256×320 | SVG → PNG | yer tutucu | P1 | "Young teacher: high black ponytail, purple cardigan, mosaic-pattern scarf in blue/purple/yellow, stack of three books in her arms." |
| `chr_riza_*` (3 ifade) | 256×320 | SVG → PNG | yer tutucu | P1 | "Sturdy fisherman: navy knit beanie, yellow oilskin jacket, short salt-and-pepper beard, fish-shaped whistle on a cord. Not a captain's cap, no pipe." |
| `chr_kurdele_*` (3 ifade) | 256×320 | SVG → PNG | yer tutucu | P0 | "Tall slim mayor: navy suit, red-and-white diagonal sash, oversized golden ceremonial scissors, enthusiastic speech-giving pose." Her kazanma ekranında kurdele keser (UX §6), bu yüzden P0. |
| `chr_extras_<neighbor1..2, kid1, fisher1..2>` | 200×280 | SVG | yer tutucu | P2 | 5 sade figür, aynı stil: 2 yetişkin komşu (esnaf, emekli okur), 1 çocuk, 2 balıkçı. Kalabalık sahnelerde yetişkinler en az çocuklar kadar (STORY §0-8, BUSINESS S1–S3). Yüz ifadesi yalnız mutlu/şaşkın. |
| `chr_bridge_helmet_player`, `_bot_<1..8>` | 64×64 | SVG | yer tutucu | P0 | Köprü ve Lig avatarları (R-14): oyuncu = Tuna'nın nane kaskı + yıldız; botlar = 8 blok renginde kask + kaskın önünde **küçük alet simgesi** (çekiç, mala, metre, fırça, kürek, pense, su terazisi, anahtar), yıldızsız. Bayrak, çevrimiçi ışığı, fotoğraf benzeri avatar yok; satırda "çırak" rozeti (`ui_bot_badge`). |

---

## 9. Ara sahne panelleri

Panel 1000×1000, WebP; konuşma balonları ve yazılar kodla üstüne basılır (görselde yazı yok). Toplam **47 panel**.
Yer tutucu: düz renkli arka plan + karakter yer tutucu SVG'leri + 1 sahne nesnesi. Bellek: yalnız gösterilen ve sıradaki
panel yüklü (panel başına ~4 MB GPU; code-lead). İlk yüke yalnız prolog paneli girer (≤ 300 KB toplam; UX §2.1), kalan
44 panel tembel yüklenir. Yapı kartı yalnız `story.ch1.end` Panel 4'tedir (`cut_ch1_end_p4`) ve yalnız gösterilir;
diğer bitiş sahneleri STORY'deki son panelleriyle kapanır; "Albüme eklendi" yok (R-19). Sahnelerde yetişkin kasaba
halkı en az çocuklar kadar yer alır (STORY §0-8). **Yedek plan:** Faz 3–4 sanat takvimi kayarsa
Hikaye 4–5 sahneleri 4 panele indirilir: `ch4_start` 5 → 4, `ch4_end` 5 → 4, `ch5_start` 4 (değişmez),
`ch5_end` 6 → 4 = **−4 panel** (47 → 43; entrepreneur önerisi). Kısalacak ve birleşecek paneller STORY §4.4–§4.5
"Yedek plan" notlarındadır; birleşen panelde balonlar korunur, kesilen panelin balonu komşu panele taşınır.

| Ad | Adet | Durum | Öncelik | Brif |
| -- | ---- | ----- | -- | ---- |
| `cut_prologue_p<1..3>` | 3 | yer tutucu | P0 | STORY §4.0 panel tarifleri. Ortak: "comic panel, single clear focal point, characters large (head ≥ 25% of panel height), soft background, space in the bottom 30% for a speech bubble." |
| `cut_ch1_start_p<1..4>`, `cut_ch1_end_p<1..4>` | 8 | yer tutucu | P0 | STORY §4.1. |
| `cut_ch2_start_p<1..4>`, `cut_ch2_end_p<1..4>` | 8 | yer tutucu | P0 | STORY §4.2. |
| `cut_ch3_start_p<1..4>`, `cut_ch3_end_p<1..4>` | 8 | yer tutucu | P1 | STORY §4.3. |
| `cut_ch4_start_p<1..5>`, `cut_ch4_end_p<1..5>` | 10 | yer tutucu | P1 | STORY §4.4. |
| `cut_ch5_start_p<1..4>`, `cut_ch5_end_p<1..6>` | 10 | yer tutucu | P1 | STORY §4.5. Final paneli (havai fişek) en yüksek detay. |
| `ui_speech_bubble` | 9-dilim, köşe 48, kuyruk 3 yön | prosedürel | kod | Beyaz balon, 6 px kontur, kuyruk sol/sağ/alt. |

---

## 10. Arayüz

| Ad | Boyut | Format | Durum | Öncelik | Brif |
| -- | ----- | ------ | ----- | -- | ---- |
| `ui_button_<primary/secondary/neutral/danger/disabled>` | 9-dilim, köşe 48, dudak 12 | prosedürel | prosedürel | kod | ART_DIRECTION §2.3 renkleri (`ui.<tip>` / `Top` / `Lip` / `Stroke`); üst ışık bandı + dudak. `neutral` = dolgulu krem (`ui.neutral` / `neutralLip`, yazı `ui.ink`): R-15 teklif pencerelerinin "Hayır, teşekkürler" ve "Reklam izle" seçenekleri, eşit çift düğmelerin krem tarafı (UX §0.3). |
| `ui_panel` | 9-dilim, köşe 48 | prosedürel | prosedürel | kod | Krem panel, kenar ışığı, alt dudak. |
| `ui_close` | Ø 112 | SVG | yer tutucu | P0 | Kırmızı daire + beyaz kalın ×. |
| `ui_tag_hard`, `ui_tag_superhard` | 240×80 | prosedürel | prosedürel | kod | Kırmızı / mor etiket, yazı i18n ("ZOR", "ÇOK ZOR"), kenarda ince ikaz şeridi (yalnız çok zor). |
| `ui_toggle` | 176×96 | prosedürel | prosedürel | kod | Açık = yeşil, kapalı = gri; düğme topu krem. |
| `ui_streak_bar` | 560×80 | prosedürel | prosedürel | kod | 4 boncuk + Altın Mala yuvası. |
| `ui_moves_panel` | 280×224 | prosedürel | prosedürel | kod | Krem panel, büyük rakam alanı. |
| `ui_moves_chip` | 160×96 | prosedürel | prosedürel | kod | Hamle sayacı panelinin minyatürü + "+N" (Baloo 2 800); galibiyet serisi "+N hamle" bonusu (UX §4, JUICE #68). Termos ikonundan ayrıdır. |
| `ui_booster_slot` | 172×172 | prosedürel | prosedürel | kod | Yuvarlak kare, çukur, adet rozeti / "+" / kilit; kilitli ve adet > 0 ise kilit + köşede gri adet rozeti (Ø 56, `ui.badgeLocked`, beyaz sayı; UX §0.3, META §4). |
| `ui_tutorial_glove` | 140×160 | SVG | yer tutucu | P0 | Tuna'nın sarı iş eldiveni, işaret parmağı uzatılmış; 2 kare (açık, basılı). Final: "big yellow cartoon work glove pointing with the index finger, thick outline; pressed and released frames." |
| `ui_spotlight` | — | kaldırıldı | — | — | **Faz 2R'de kaldırıldı** (R2-10: karartma ve delik yok; UX §13.1). Yerine `ui_highlight` (§16.5). |
| `ui_loading_crane` | 96×96 (8 kare) | PNG | yer tutucu | P0 | Bloğu döndüren mini vinç döngüsü. |
| `ui_progress_crane` | 840×200 | SVG | yer tutucu | P0 | Açılış yükleme vinci: kol + kanca + blok. |
| `ui_panel_dots` | 24×24 | prosedürel | prosedürel | kod | Ara sahne ilerleme noktaları. |
| `ui_price_label` | düğme içi 2 satır | prosedürel | prosedürel | kod | `PriceLabel` (UX §0.3): `icon_coin` + "900" + altında gerçek para karşılığı (`font.size.caption`; renkli düğmede `ui.ink`, krem zeminde `ui.inkSoft`; her durumda ≥ 4,5:1); her altın fiyatlı düğmede aynı bileşen. |
| `ui_test_badge` | 200×56 | prosedürel | prosedürel | kod | "test sürümü" rozeti (web MVP sahte satın alma, BUSINESS E9). |
| `ui_bot_badge` | 140×48 | prosedürel | prosedürel | kod | "çırak" rozeti (`color.ui.botBadge`, R-14), bot satırında ad yanında. |
| `ui_rule_card` | 9-dilim panel | prosedürel | prosedürel | kod | Köprü / Lig kural kartı (UX §9–§10), eşit boy "Katıl" / "Şimdi değil". |
| `ui_keypad_key` | 160×128 | prosedürel | prosedürel | kod | **[Mağaza]** yaş ekranı sayısal tuşu (UX §2.3). |
| `ui_line_promote`, `ui_line_demote` | 1000×6 kesik | prosedürel | prosedürel | kod | Lig terfi (yeşil) / düşme (turuncu, kırmızı değil) çizgisi. |
| `ui_site_ribbon` | 306×96 (`layout.board.siteRibbon*`) | prosedürel | prosedürel | kod | "Yapı tamam!" kurdelesi (UX §5.1, GDD E-27, D-035): `ui.gold` dolgu, 4 px `ui.goldDark` kenar, −6° eğik, uçları 24 px V kesik; metin i18n `build.done` (görselde yazı yok). JUICE #89–#90. |
| `ui_bonus_band` | 1000×120 (iki satırda 1000×160) | prosedürel | prosedürel | kod | Lig LiveOps bandı (UX §10): `ui.panelInset` zemin, solda 12 px `ui.gold` şerit, köşe 24, sağda "Şimdi geçerli" / "Başlıyor" çipi. |

**İkonlar** (128×128, SVG kaynak + atlas PNG; brif: ART_DIRECTION §9 ikon dili; her biri "chunky casual-game icon,
thick dark outline, two-tone fill, white highlight pill, no text"):

| Ad | Durum | Öncelik | Ek brif |
| -- | ----- | -- | ------- |
| `icon_life` | yer tutucu | P0 | Kalp, ortasında küçük beyaz yıldız. |
| `icon_life_unlimited` | yer tutucu | P0 | `icon_life` kalbi; yıldız yerine ortasında **çizilmiş** kalın beyaz sonsuzluk işareti (yazı ya da font karakteri değil; ∞ Baloo 2 alt kümesinde yok, ART §8). Sınırsız can: üst çubukta süre boyunca kalbin yerine (yanında geri sayım), günlük ödül 7. gün, bölüm / lig sandığı içeriğinde (yanında süre `common.minutes` "{n} dk"; UX §3, §3.1). |
| `icon_coin` | yer tutucu | P0 | Altın sikke, kabartma mala. |
| `icon_star` | yer tutucu | P0 | Tombul 5 köşeli yıldız. |
| `icon_hammer` | yer tutucu | P0 | Ahşap saplı kırmızı başlı çekiç, 20° eğik. Kullanım: Bölüm 8'den (K-36 Faz 2R: Ağır Yük, kasa, torba, zincir, şantiyedeki moloz ve yapışmış harç; malzeme bloğu kırmaz); dilimde gerekli. Final SVG §16.3. |
| `icon_crane` | yer tutucu | P0 | Turuncu kanca + halat. |
| `icon_brush` | yer tutucu | P0 | Ahşap saplı fırça, ucu 3 renk şerit. |
| `icon_undo` | yer tutucu | P0 | Kıvrık ok, ucunda küçük mala. |
| `icon_thermos` | yer tutucu | P0 | Mavi termos, buhar. |
| `icon_trowel_start` | yer tutucu | P0 | Altın mala + parıltı. |
| `icon_open_shutter` | yer tutucu | P0 | Yarı açık panjur + yukarı ok. |
| `icon_gold_trowel` | yer tutucu | P0 | Altın mala, ahşap sap. |
| `icon_truck` | yer tutucu | P0 | Turuncu kamyon ¾ önden, kasada 3 blok. Karaktersiz (yüz yok). |
| `icon_settings` | yer tutucu | P0 | Dişli içinde vida başı. |
| `icon_pause` | yer tutucu | P0 | İki kalın çubuk. |
| `icon_nav_shop`, `_league`, `_home`, `_team`, `_album` | yer tutucu | P0 | Tente+tezgâh · mala kupa · kiremit çatılı ev · iki kask (kilitli varyant gri) · spiralli albüm (yalnız kilitli "Yakında" varyantı MVP'de, R-19). |
| `icon_event_bridge` | yer tutucu | P0 | Halat köprü + simit. |
| `icon_daily`, `icon_piggy_<0..2>`, `icon_chest` | yer tutucu | P0 | Takvim+yıldız · tuğla biçimli kumbara (3 doluluk) · ahşap alet sandığı (kapalı/açık). |
| `icon_goal_build`, `_crate`, `_chain`, `_debris`, `_screw` | yer tutucu | P0 | Hedef paneli ikonları (64 px'te okunur). |
| `icon_lock` | yer tutucu | P0 | Altın asma kilit. |
| `icon_info` | yer tutucu | P0 | Yuvarlak (i), kural kartı düğmesi (Köprü, Lig). |
| `icon_ad` | yer tutucu | P0 | ▶ oynat üçgeni, ödüllü reklam düğmeleri (+5, +1 can, günlük ×2). |
| `icon_wait_clock` | yer tutucu | P0 | Küçük saat; günlük ödülde kaçırılan gün "bekliyor" (sıfırlama yok, E10). |
| `icon_reward_<chest/pouch/coin>` | yer tutucu | P1 | Lig satırı ödül bandı: 1–3 sandık, 4–20 küçük kese, 21–50 tek sikke. |
| `icon_master_chest` | yer tutucu | P1 | Usta Sandığı (Usta Modu, MVP onay bekliyor R-17); alet sandığı + altın mala kabartması. |
| `icon_league_<bronze/silver/gold/diamond>` | yer tutucu | P1 | Mala biçimli rozet; bronz/gümüş/altın/elmas, kademeli süsleme. |

---

## 11. Logo, uygulama ikonu, mağaza

| Ad | Boyut | Format | Durum | Öncelik | Brif |
| -- | ----- | ------ | ----- | -- | ---- |
| `logo_wordmark` | 880×360 | SVG + PNG | yer tutucu | P0 (insan sanatçı) | Metin **marka sabitinden** (`app.title`); çalışma değeri "Lift & Land" (D-068 aday sırası 1, STORY §0-10) marka araması bitene kadar yer tutucudur; yer tutucu logo bu metni yazıldığı biçimde (büyük harfe çevirmeden, ART §8) çizer. Baloo 2 800, beyaz dolgu + koyu kontur, harf gruplarının arkasında renkli bloklar (en çok 8: W Y G R O C B P). Düzen 8–12 harflik adlara ölçeklenir (sığmazsa yazı 120 → 96 px; UX §1). Tek global EN marka seçilirse logo bir kez EN çizilir. "Little Builder" kullanılmaz (R-24, BUSINESS P-6). Final çizim isim kararından sonra. |
| `app_icon` | 1024×1024 | PNG (şeffaflık yok) | yer tutucu | P0 (insan sanatçı) | **İmza hareket:** sarı-siyah ikaz şeritli duvar başlığı; vinç kancasındaki tek blok kesik çizgili bir yayla duvarın **üstünden** aşıyor; sıcak gökyüzü zemini (#7FD3F7 → sıcak açık ton). Karakter, yüz, kask, harf ve üst üste küp yığını **yok** (BUSINESS S5, R-01, R-04). Final brif: "a single colorful building block hanging from an orange crane hook, swinging over a short concrete wall with a yellow-black hazard-striped cap, a dashed arc showing its path, warm sky background; bold silhouette readable at 48 px; no characters, no faces, no letters, no stacked cubes." Faz 5'te 2 varyant; A/B testi yalnız 18+ hedeflemeyle. iOS köşe maskesi sistemden. |
| `app_icon_android_fg`, `_bg` | 432×432 (108 dp @4×) | PNG | yer tutucu | P0 | Uyarlanabilir ikon: ön plan duvar başlığı + kanca + blok + yay (güvenli alan 66 dp daire), arka plan gökyüzü düz renk. |
| `pwa_icon_192`, `_512`, `_maskable_512` | 192/512 | PNG | yer tutucu | P0 | app_icon'dan türetilir. |
| `store_feature_graphic` | 1024×500 | PNG | yer tutucu | P0 | Google Play öne çıkan görsel (BUSINESS S8): **sol yarı** tahta ölçeğinde kaldır–aşır–indir anı (saha, duvar, yaylı iz, şantiye planı); **sağ yarı** tamamlanmış yetişkin dünyası yapısı (deniz feneri ya da mahalle fırını; ağaç ev değil); Tuna küçük ve köşede, ikincil. Sıcak saha baskın, ozalit yalnız şantiyede. Yazı yok (mağaza metni ayrı). |
| `store_screenshots` | 1290×2796 (iOS 6,7"), 1080×1920 (Android) | PNG | yer tutucu | P0 | Faz 5'te `npm run screens` profilleriyle: `--profile ios67` (430×932 @3 = 1290×2796) ve `--profile android` (360×640 @3 = 1080×1920) (code-lead, TECH §12.2); tasarım iki oranda da çapa sözleşmesiyle düzgün (UX §0.1). Çerçeve + entrepreneur'ün STORE_LISTING metinleri; ilk görsel oyun tahtası. |
| `splash_native` | 2732×2732 (merkez 1024 güvenli) | PNG | yer tutucu | P0 | Capacitor native splash: #7FD3F7 + logo. |

---

## 12. Parçacıklar (fx atlası, 512×512)

| Ad | Boyut | Durum | Öncelik | Brif |
| -- | ----- | ----- | -- | ---- |
| `fx_dust` | 32×32 | prosedürel | kod | Yumuşak krem toz bulutu (#F2E6CF, kenar %0). |
| `fx_spark` | 24×24 | prosedürel | kod | 4 köşeli beyaz kıvılcım (renklenebilir). |
| `fx_gold` | 28×28 | prosedürel | kod | Altın kıvılcım (#FFC21A + beyaz merkez). |
| `fx_confetti_<W..P>` | 16×24 | prosedürel | kod | Dikdörtgen konfeti, blok renkleri. |
| `fx_splinter` | 24×8 | yer tutucu | P0 | Çam kıymığı. |
| `fx_glass` | 20×20 (3 varyant) | yer tutucu | P1 | Beyaz-mavi üçgen cam kırığı. |
| `fx_paint` | 20×20 | prosedürel | kod | Boya damlası (renklenebilir). |
| `fx_water` | 16×20 | prosedürel | kod | Su damlası. |
| `fx_steam` | 40×40 | prosedürel | kod | Buhar halkası. |
| `fx_star_small` | 20×20 | prosedürel | kod | Küçük yıldız. |
| `fx_note` | 24×24 | yer tutucu | P2 [Sonra] | Müzik notası (kombo dansı). |
| `fx_wind` | 64×8 | prosedürel | kod | Rüzgâr çizgisi. |

---

## 13. Sesler

MVP'de tümü **prosedürel** (JUICE tarifleri; ZzFX `buildSamples`, 22,05 kHz mono, sahne bazında ön-çizim). Parametre
dizileri `tokens.json` → `audio.sfx.<ad>` (tek ses) ve `audio.seq.<ad>` (çok notalı: `[ms, [parametreler]]` adımları
tek arabellekte karıştırılır); `sfx.ts` yalnız adları eşler (TECH §11.6). Faz 2 P0 kümesi tokens'ta dolu; engel, meta
ve güçlendirici sesleri ilgili mekanikle (Faz 2–3) eklenir. Perde/ses farkları çalma `rate`/`volume` ile. Final brifi
(ses tasarımcısı ya da üretim aracı): "bright, tactile wooden, plastic and metal-tool textures, short and soft-attack,
never harsh; failure sounds gentle and non-judgmental; all sounds mono, 44.1 kHz, peak −3 dBFS, delivered as OGG +
M4A."

| Grup | Adlar | Adet |
| ---- | ----- | ---- |
| Sürükleme | `sfx_pick`, `sfx_blocked`, `sfx_bump`, `sfx_whoosh`, `sfx_ghost_ok`, `sfx_cancel`, `sfx_set_yard`, `sfx_fall`, `sfx_land` | 9 |
| Yerleşim / kombo | `sfx_place_ok` (perde kademeli), `sfx_place_bad`, `sfx_bounce`, `sfx_mortar`, `sfx_streak_pip`, `sfx_combo`, `sfx_trowel`, `sfx_segment` | 8 |
| Teslimat | `sfx_truck_horn`, `sfx_queue`, `sfx_reshuffle` | 3 |
| Geçitler | `sfx_gap_rail`, `sfx_clamp`, `sfx_gap_squeeze`, `sfx_shutter`, `sfx_tick`, `sfx_slider`, `sfx_paint`, `sfx_unlock`, `sfx_wind` | 9 |
| Engeller | `sfx_crate_hit`, `sfx_crate_break`, `sfx_bag_tear`, `sfx_bag_thud`, `sfx_chain_break`, `sfx_dry`, `sfx_key`, `sfx_screw`, `sfx_goal_tick`, `sfx_debris`, `sfx_glass`, `sfx_balloon`, `sfx_slip`, `sfx_steer`, `sfx_carousel`, `sfx_elevator`, `sfx_reveal` | 17 |
| Hamle / sonuç | `sfx_lastmoves`, `sfx_offer`, `sfx_moves_add`, `sfx_goal_done`, `music_win`, `sfx_coin`, `sfx_out_of_moves`, `sfx_life_lost`, `sfx_star` | 9 |
| Güçlendiriciler | `sfx_select`, `sfx_hammer`, `sfx_crane`, `sfx_brush`, `sfx_undo`, `sfx_thermos`, `sfx_streak_bonus` | 7 |
| Arayüz / meta | `sfx_button`, `sfx_popup`, `sfx_close`, `sfx_tab`, `sfx_locked`, `sfx_town_build`, `sfx_bridge_step`, `sfx_splash`, `sfx_rank_up`, `sfx_page`, `sfx_woof`, `sfx_chest` | 12 |
| Karakter sesleri **[Sonra]** (JUICE #81) | `sfx_voice_tuna`, `_dede`, `_gribeton`, `_kepce`, `_ayse`, `_selin`, `_riza`, `_kurdele` | 8 |
| Müzik **[Sonra]** (JUICE §7) | `music_town_loop`, `music_level_loop`, `music_cutscene` | 3 |

---

## 14. Sanat iş yükü ve takvim (tahmin)

Kapasite BUSINESS §10'dandır (1,0 FTE Faz 2 başından 22 hafta + 0,5 FTE Faz 3 başından 16 hafta); "gün" =
sanatçı-günü, **tahmin**. Kapsam
kararlarından (R-07: 35 kasaba parçası; ifade kapsamı §8; albüm Sonra) sonra güncel:

| Kalem | Adet × gün | Toplam | Öncelik |
| ----- | ---------- | ------ | ------- |
| Ara sahne panelleri | 47 × 1 | 47 | P0: 19 (prolog + Hikaye 1–2) · P1: 28 |
| Kasaba parçaları + tabanlar | 35 × 0,5 + 5 × 1 | 22,5 | P0: ch1–2 · P1: ch3–5 |
| Arka plan katmanları | 15 × 0,75 | 11,25 | P0: ch1–2 · P1: ch3–5 |
| Ana karakterler (6 ifade, insan sanatçı) | 4 × 4 | 16 | P0 |
| Yan karakterler (3 ifade) | 4 × 1,5 | 6 | P0: Ayşe, Kurdele · P1: Selin, Rıza |
| Figüranlar | 5 × 0,5 | 2,5 | P2 |
| İkonlar | ~46 × 0,25 | 11,5 | P0: ~38 (`icon_life_unlimited` dahil) · P1: 8 (lig rozetleri, ödül bandı, Usta Sandığı) |
| Engel / geçit görselleri | ~20 × 0,25 | 5 | P0 / P1 (engelin açıldığı bölüme göre) |
| Logo, uygulama ikonu (2 varyant), öne çıkan görsel | — | 4 | P0 (insan sanatçı) |
| **Toplam** | | **≈ 126** | P0 ≈ 67 · P1 ≈ 56 · P2 ≈ 2,5 |

**Faz 2R yalın sanat yolu (EN-2R-14, BUSINESS §10, P-15; proje sahibi onayına):** web MVP ve Aşama 0'da illüstrasyon
işi design-lead'in SVG'leridir (≈ 7 tasarım günü: 3 arka plan × 0,5 + yapı 1 + 5 karakter × 0,5 + logo 0,5 + 16 ikon ×
0,1; ücret 0; §16.3). Mağaza öncesi insan sanatçı yalnız logo amblemi, uygulama simgesi ve 4 ana karakteri yeniden
çizer (≈ 4 + 16 = 20 g); ara sahne panelleri ve kasaba parçaları SVG + belgelenmiş rötuş. Bu yolla aşağıdaki ≈ 126 g'lik
talep entrepreneur hesabıyla **≈ 65 g**'e iner ve 0,5 FTE serbest sanatçı kesilir. Aşağıdaki tablo Faz 1 planının
kaydıdır; P-15 onaylanırsa geçersizdir.

**Kapasite ve pay (BUSINESS §10 ile aynı hesap):** talep ≈ 126 g; kapasite 1,0 FTE × 22 hf + 0,5 FTE × 16 hf = 110 + 40
≈ 150 g → **sığar, pay ≈ %16 (≈ 24 g)**. "1,5 FTE ile ≈ 17 hafta" (D-047) iki sanatçının aynı gün başladığı varsayımıyla
yalnız süre hesabıdır; tampon yokluğu anlamına gelmez. Kritik yol ara sahne panelleri (P1'in yarısı). Yedek plan:
Hikaye 4–5 sahneleri 4 panele (−4 panel = −4 gün, §9) → talep ≈ 122 g, pay ≈ %19. Albüm kartları [Sonra] olduğu için
sayıma girmez.

---

## 15. Üretim kaydı (provenance)

Her **final** varlık için bir satır (entrepreneur, fikri mülkiyet). Kaynak dosya `art-source/` altında (depo dışı
yedekli); bu tablo Faz 5'te `docs/ASSET_PROVENANCE.md` olarak ayrılabilir. Faz 2R SVG'lerinde kaynak dosya SVG'nin
kendisidir (katmanlar `<g id>` grupları); referans görsellerden (R2-12) iz sürme, kırpma ya da renk örnekleme yapılmadı.

Sütunlar EN-2R-14 ile genişletildi: **araç + plan**, **tarih**, **insan rötuşu** (var/yok, kim), **ters görsel arama**
sonucu (Google Lens ya da TinEye, ücretsiz; mağaza öncesi her final illüstrasyon için; benzer görsel bulunursa varlık
yeniden çizilir).

| Varlık | Sürüm | Yazar (insan / design-lead ajanı) | Araç ve plan (ücret) | Rol (eskiz / web MVP final / mağaza final) | Tarih | İnsan rötuşu (var/yok, kim) | Ters görsel arama (araç, tarih, sonuç) | Kaynak dosya | Lisans / devir |
| ------ | ----- | --------------------------------- | -------------------- | ------------------------------------------ | ----- | --------------------------- | -------------------------------------- | ------------ | -------------- |
| `font_baloo2_latin_tr` | 1 | Ek Type (OFL 1.1) | pyftsubset (ücretsiz) | final (alt küme) | 2026-10-04 | yok | — (font) | `fonts/baloo2/` | OFL 1.1, Lisanslar sayfasında |
| `bg_home_town` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/bg/bg_home_town.svg` | proje sahibine ait |
| `bg_level_site_edge` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/bg/bg_level_site_edge.svg` | proje sahibine ait |
| `bg_win_plaza` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/bg/bg_win_plaza.svg` | proje sahibine ait |
| `town_ch1_tree` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/town/town_ch1_tree.svg` | proje sahibine ait |
| `town_ch1_treehouse` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/town/town_ch1_treehouse.svg` | proje sahibine ait |
| `chr_tuna_bust` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/chr/chr_tuna_bust.svg` | proje sahibine ait; D-084/P-15: mağaza öncesi insan sanatçı kararı Faz 5 |
| `chr_tuna_cheer` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/chr/chr_tuna_cheer.svg` | proje sahibine ait; D-084/P-15: mağaza öncesi insan sanatçı kararı Faz 5 |
| `chr_dede_bust` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/chr/chr_dede_bust.svg` | proje sahibine ait; D-084/P-15: mağaza öncesi insan sanatçı kararı Faz 5 |
| `chr_kepce_bust` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/chr/chr_kepce_bust.svg` | proje sahibine ait; D-084/P-15: mağaza öncesi insan sanatçı kararı Faz 5 |
| `chr_gribeton_bust` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/chr/chr_gribeton_bust.svg` | proje sahibine ait; D-084/P-15: mağaza öncesi insan sanatçı kararı Faz 5 |
| `logo_emblem` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/logo/logo_emblem.svg` | proje sahibine ait; D-084/P-15: mağaza öncesi insan sanatçı kararı Faz 5 |
| `icon_coin` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_coin.svg` | proje sahibine ait |
| `icon_life` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_life.svg` | proje sahibine ait |
| `icon_star` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_star.svg` | proje sahibine ait |
| `icon_moves` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_moves.svg` | proje sahibine ait |
| `icon_settings` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_settings.svg` | proje sahibine ait |
| `icon_lock` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_lock.svg` | proje sahibine ait |
| `icon_hammer` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_hammer.svg` | proje sahibine ait |
| `icon_crane` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_crane.svg` | proje sahibine ait |
| `icon_gold_trowel` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_gold_trowel.svg` | proje sahibine ait |
| `icon_chest` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_chest.svg` | proje sahibine ait |
| `icon_nav_shop` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_nav_shop.svg` | proje sahibine ait |
| `icon_nav_league` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_nav_league.svg` | proje sahibine ait |
| `icon_nav_team` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_nav_team.svg` | proje sahibine ait |
| `icon_nav_home` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_nav_home.svg` | proje sahibine ait |
| `icon_nav_album` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_nav_album.svg` | proje sahibine ait |
| `icon_kettlebell` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_kettlebell.svg` | proje sahibine ait |
| `icon_nextfloor` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_nextfloor.svg` | proje sahibine ait |
| `icon_brush` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_brush.svg` | proje sahibine ait |
| `icon_undo` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_undo.svg` | proje sahibine ait |
| `icon_thermos` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_thermos.svg` | proje sahibine ait |
| `icon_piggy` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/icon_piggy.svg` | proje sahibine ait |
| `ui_tutorial_glove` | 1 | design-lead ajanı | elle SVG, metin düzenleyici + Chromium önizleme (ücret 0) | web MVP final | 2026-10-07 | yok | mağaza öncesi (yapılmadı) | `public/art/icon/ui_tutorial_glove.svg` | proje sahibine ait |

---

## 16. Faz 2R görsel üretim listesi v2 (R2-07, R2-08 güncellemesi, R2-12)

Sürüm: Faz 2R (2026-10-07), çapraz inceleme kapanışı. Görsel dil ART §1, §3A, §7, §9, §11, §14, §15. Bu bölüm §0.1
genel brifinin ve §6–§11'deki tek tek brif cümlelerinin **yerine geçer** (çelişkide §16 geçerlidir); eski satırlar Faz
3 varlıkları için kaynak olarak kalır. **Önceki sürümdeki Canva istemleri (26 istem, 30 çağrı kotası,
`remove-background`) R2-08 güncellemesiyle kaldırıldı** (CL-2R-24, EN-2R-13, EN-2R-21, EN-2R-22 konusuz kaldı).

### 16.1 Üretim yolu, bütçe ve kayıt

- **Yol (ücret 0):** design-lead SVG'yi elle yazar → `public/art/<kategori>/<kimlik>.svg` (depoya girer) → code-lead
  boru hattı (TECH §2R.7) kullanım boyutunda raster eder (çalışma anında `load.svg` boyutla ya da derlemede `npm run
  assets` ile kurulu Chromium'da PNG/WebP; seçim code-lead'in) → ikonlar tek atlasa. Şeffaflık SVG'de doğaldır: zemin
  çizilmez, **arka plan kaldırma adımı yoktur**. Yeni bağımlılık, hesap, kota ve ağ erişimi gerekmez.
- **Klasörler:** `public/art/bg/`, `public/art/town/`, `public/art/chr/`, `public/art/icon/`, `public/art/logo/`.
- **Bellek ve indirme bütçesi (CL-2R-23; TECH §2R.7 ölçüm kapısı):** v2 görsellerinin toplam indirmesi **≤ 900 KB**,
  toplam doku belleği **≤ 64 MB**. Raster boyutları §16.3'te; tahmin: arka plan 3 × 2,1 MB (0,5 ölçek) + yapı 2 × 2,5 MB
  (renkli + hayalet) + karakter 5 × ≈ 0,4 MB + logo 0,5 MB + ikon atlası 1,3 MB (512×640, 20 yuva) ≈ **15,2 MB** (aynı
  anda yüklü en çok ≈ 10 MB: ana sayfa). İndirme: SVG kaynakları toplam ≈ 300 KB (gzip ≈ 90 KB); derlemede raster edilirse WebP q80
  toplam ≤ 900 KB. **@2x yoktur:** tuval 1080 tasarım pikselinde çizilir, ikonlar 128 px tek boy.
- **Prosedürel yedek:** her satırın yedeği vardır; SVG yüklenemezse oyun tam görünür (ART §1 sütun 6). Görsel uygulama
  sırası: önce blockout (ART §13), sonra SVG.
- **Kayıt (§15):** her SVG için bir satır: varlık, sürüm, yazar (design-lead ajanı / insan), araç ve plan (elle SVG, ücret
  0), rol, tarih, insan rötuşu, ters görsel arama sonucu (mağaza öncesi), kaynak dosya, lisans/devir notu.
- **İnsan sanatçı (§0, P-15):** mağaza öncesi logo amblemi, uygulama simgesi ve 4 ana karakter insan sanatçıyla yeniden
  çizilir (entrepreneur kararı, proje sahibi onayına; EN-2R-14). Web MVP ve Aşama 0'da SVG'ler finaldir.

### 16.2 SVG yazım kuralları (her varlık)

- **Ton:** yetişkin casual oyuncu için premium casual; çocuksu değil (ART §1, EN-2R-12). Dosya adı, `id` ve
  yorumlarda "kids / toy box / for all ages / family" yok.
- **Kök:** `<svg xmlns="http://www.w3.org/2000/svg" viewBox="…" width="…" height="…">` (§16.3 viewBox'ı); `width` /
  `height` = viewBox.
- **Yasak öğeler:** `<text>`, `<image>` (gömülü bitmap), `<foreignObject>`, `<script>`, `<style>` içinde `@import`,
  dış `href`, `filter` (bulanıklık dahil), `mask`. İzinli: `path`, temel şekiller, `g`, `defs`, `linearGradient`,
  `radialGradient`, `clipPath`, `use`. Yazı, harf, rakam ve logo görselde **yoktur** (metin i18n katmanıyla basılır,
  STORY §0-7).
- **Hacim tarifi (bloklarla aynı aile, ART §2.5 formülü):** her ana yüzey 2 duraklı dikey `linearGradient` — üst durak
  **açık** = renk·0,68 + beyaz·0,32, alt durak renk × 0,92; altta iç gölge şeridi renk × 0,68 α 0,35; sol üstte beyaz
  α 0,45 parlama elipsi; ışık her zaman **sol üstten**. Kontur `#3B2A1A`: karakter ve yapıda 6 px, ikonda 8 px
  (128 viewBox; 64 px'te 4 px), arka planda **en az 8 px** (0,5 raster sonrası 4 px). En küçük şekil arka planda 24 px.
- **Palet:** yalnız `tokens.json` renkleri ve yukarıdaki formülle türetilen tonlar. Karakter imza renkleri
  `color.character.*` ile **birebir** aynı hex. Yeni renk gerekiyorsa önce tokens.json'a eklenir.
- **Karakterler (R2-12):** basit hacimli biçimler — kapsül/tuğla gövde, büyük göz (yüz genişliğinin %16'sı), tek imza
  siluet öğesi (ART §11); yüz `<g id="face">` içinde (ifade değişimi yalnız bu grup).
- **Boyut sınırı (gzip öncesi):** arka plan ≤ 60 KB, yapı ≤ 40 KB, karakter ≤ 20 KB, logo ≤ 15 KB, ikon ≤ 6 KB.
  Yol koordinatları en çok 1 ondalık.
- **Özgünlük (ART §11.8):** sarı çocuk kaskı, tulum, buldok, taç/pelerin, konuşan makine, üst üste küp yığını, neon
  ışıma yok; R2-12 referansından ve rakiplerden iz sürme, kırpma, birebir düzen yok.

- **Uygulama netleştirmeleri (Faz 2R uygulama, 2026-10-07; 33 SVG bu kurallarla yazıldı):**
  - Karakter yüzeyleri **3 duraklıdır**: açık (0) → **imza rengi** (0,5) → alt (1). Böylece imza hex'i dosyada birebir
    bulunur (§16.3 kabul, code-lead `checkSvg` imza denetimi). Diğer varlıklarda 2 durak.
  - İç gölge şeridi filtre/maske olmadan: şekil kendi `clipPath`'iyle kırpılır; içine önce koyu ton (× 0,68) α 0,35,
    üstüne aynı şekil 5–10 px yukarı kaydırılmış gradyanla çizilir; altta koyu şerit kalır.
  - **Alt kalınlık ("dudak"):** ikon, yapı ve logo ana şekillerinin `#3B2A1A` kopyası 4–6 px aşağıda, konturla aynı
    kalınlıkta (UI kiti düğmeleriyle aynı hacim dili, ART §14.1).
  - Ölçekli gruplarda (`scale(.7)` vb.) `stroke-width` ölçeğe bölünür; ekranda kontur 6 / 8 px kalır.
  - Silindirik uzun parçalarda (sap, gövde) dikey gradyan korunur; sol kenarda beyaz α 0,3–0,5 parlama şeridi ışığı
    sol üstten verir.
  - `bg_level_site_edge`: yalnız #FFFFFF; **grup `opacity=".06"` dosyanın içindedir** — oyun dokuyu α 1 ile çizer,
    `alpha.sceneSilhouette` ikinci kez uygulanmaz. Siluetlerde kontur yoktur.
  - `transform` değerleri de en çok 1 ondalık (`scale(.8)`, `scale(.75)` değil).

**Ortak kabul ölçütleri (her SVG):** (1) yasak öğe yok ve boyut sınırı içinde (`npm run assets` denetler, code-lead);
(2) renkler palet içinde, imza renkleri birebir; (3) kontur ve ışık yönü kurallara uygun, aynı ailedeki görseller yan
yana tek oyundan görünür; (4) kullanım boyutunda (ikonda 64 px) siluet tanınır — 3 kişiden 3'ü ikonun adını söyler;
(5) ART §11.8 ihlali yok. Ölçüt tutmazsa SVG düzeltilir; o zamana kadar prosedürel yedek kalır.

### 16.3 Varlık tablosu (26 SVG)

Raster = oyunun yüklediği doku boyutu; GPU = RGBA bellek. "Faz" sütunu: **2R** dilimde gerekli, **3** Faz 3 ile.

| # | Kimlik (`public/art/…`) | viewBox | Raster / GPU | Kullanım yeri | Kabul ölçütü (ortak ölçütlere ek) | Prosedürel yedek | Faz |
| - | ----------------------- | ------- | ------------ | ------------- | --------------------------------- | ---------------- | --- |
| 1 | `bg/bg_home_town` | 0 0 1080 1920 | 540×960, 0,5 ölçek, ×2 çizilir / 2,1 MB; üstte ≤ 480 px prosedürel gök | Ana sayfa (UX §3, ART §7.2) | Orta arsa (x 160–920, y 360–1240) yalnız çimen (çınar `town_ch1_tree`'dedir, yapıyla aynı kutuda: EXPAND'de arka plan ile yapı ayrı kaydığı için hizayı yalnız aynı kutu korur); üst 300 ve alt 420 px düşük ayrıntı; 6–12 bina; ortalama **CIE LCh kroma C\*** blok tabanlarının ortalamasından ≥ %25 düşük (HSL doygunluğu açık pastellerde %100 çıktığı için ölçüt kromaya çevrildi, 2026-10-07; ölçüm §16.6) | ART §7.4 ch1: gök gradyanı + 3 tepe + 4–6 ev silueti | 2R |
| 2 | `bg/bg_level_site_edge` | 0 0 120 1920 | 60×960 / 0,23 MB; sağ kenarda yatay aynalanır | Oyun ekranı kenar siluetleri (ART §7.1, R2-12); zemin prosedürel çivit | Yalnız beyaz α 0,06 dolgu (tek renk), alt %40'ta iskele + kule vinç silueti; tahta dikdörtgeniyle kesişmez | yok (zemin yalnız gradyan) | 2R |
| 3 | `bg/bg_win_plaza` | 0 0 1080 1920 | 540×960 / 2,1 MB | Kazanma katmanı (UX §6.1, ART §7.3) | Merkez (x 240–840, y 440–1040) açık ve sade; bayraklar üst %30'da | `kit.sunburst` ışın + bayrak üçgenleri | 2R |
| 4 | `town/town_ch1_treehouse` | 0 0 760 820 | 760×820 / 2,5 MB + hayalet dokusu 2,5 MB | Ana sayfa yapısı (UX §3, ART §7.2) | Görev sırası alttan üste (ART §7.2: basamak → platform → duvar → pencere → çatı → ip merdiven + makara yukarıda → bayrak); her görev parçası kendi `<g id="t1">`…`<g id="t7">` grubunda; kırpma durakları `layout.home.ch1CropStops` ile örtüşür; **ağaç bu dosyada yoktur** (4b); grup sınırları ve bant taşmaları §16.6 | gövde + 3 yaprak dairesi + platform + ozalit hayaleti | 2R |
| 4b | `town/town_ch1_tree` (2026-10-07 eklendi) | 0 0 760 820 | 760×820 / 2,5 MB | Ana sayfa: yapının **altında**, aynı kutuda (merkez x 540, taban y 1180), her zaman tam renk | Ozalit hayaleti ve `setCrop` **uygulanmaz** (ağaç inşa edilmez, yalnız yapı); gövde x 340–436 basamakların arkasında, gözcü dalı y 80–200 makara ve bayrak direğini taşır; taç yapının arkasında | gövde + 3 yaprak dairesi (#4 yedeğinin ağaç kısmı) | 2R |
| 5 | `chr/chr_tuna_bust` | 0 0 256 320 | 300×375 / 0,45 MB | Oyun köşesi, ana sayfa, ara sahne | `color.character.tuna` birebir; sarı kask ve tulum yok; görünür yaş 10–12 (açık soru ART §11.1); 6 ifade `face` grubu | ART §11.7 Tuna | 2R |
| 6 | `chr/chr_tuna_cheer` | 0 0 300 400 | 300×400 / 0,48 MB | Kazanma (UX §6.1) | #5 ile aynı karakter (yan yana 2 kişiden 2'si aynı der) | Tuna SVG + eldivenler yukarıda | 2R |
| 7 | `chr/chr_dede_bust` | 0 0 256 320 | 256×320 / 0,33 MB + portre 128×128 (Canvas2D daire kırpımı, bir kez; ART §14.8) | Öğretici balonu, ara sahne | Kasket #C65A3A, ceket #7A8B4A birebir; katlanır metre görünür; Ø 128 dairede yüz + kasket sığar **Portre kırpım dairesi: viewBox merkezi (126, 142), r 84** → 128 px (yüz, kasket, bıyık ve metrenin ucu içeride; 72 px'te de okunur, `contact_characters.png`) | ART §11.7 Usta Dede | 2R |
| 8 | `chr/chr_kepce_bust` | 0 0 320 220 | 300×206 / 0,25 MB | Oyun köşesi, ana sayfa | Kask #FF9A1F, tasma #7FE0C4; sosis köpek oranı (gövde ≥ 2,5 × omuz yüksekliği) | ART §11.7 Kepçe | 2R |
| 9 | `chr/chr_gribeton_bust` | 0 0 256 320 | 256×320 / 0,33 MB | Ara sahne, rakip satırları | Dikdörtgen siluet, beton blok saç; takım #8C939C; kötü adam ifadesi yok | ART §11.7 Gribeton | 2R |
| 10 | `logo/logo_emblem` | 0 0 360 360 | 360×360 / 0,52 MB | Açılış logosu (UX §1) | Harf yok (yazı `app.title` kodla, Baloo 2); 48 px'te siluet okunur; küp yığını yok; studlu tek tuğla + vinç kancası + duvar başlığı motifi | `logo_wordmark` yer tutucusu | 2R |
| 11–26 | `icon/icon_<ad>` (coin, life, star, moves, settings, lock, hammer, crane, brush, undo, thermos, gold_trowel, chest, nav_shop, nav_league, nav_team) | 0 0 128 128 | 128×128 tek boy, **tek atlas 512×512** (16 yuva) / 1,05 MB | Kapsüller, yuvalar, gezinme (ART §9) | Biçim tarifleri önceki sürümle aynı: sikke + mala kabartması (`ui.gold`), kalp + yıldız (`ui.heart`), 5 köşe yuvarlak yıldız (`ui.star`), ok + duvar başlığı (moves; `icon_undo` ile karışmaz), 8 dişli dişli, asma kilit (48 px'te okunur), çekiç kırmızı baş (**Bölüm 8, K-36**: yükü kırar), kanca + halat (vinç, #FF9A1F; kule vinç değil), fırça + iki renk takas oku (brush, K-38), saat yönü tersi kıvrım (undo), termos #2984DE + 2 buhar kıvrımı, altın mala, düz kapaklı alet sandığı (kubbe yok), tente (shop), kupa + mala (league), iki kask (team) | ART §9 v1 prosedürel ikonlar | 2R: coin, life, star, moves, settings, lock, hammer, crane, gold_trowel, chest, nav_shop, nav_league, nav_team · 3: brush, undo, thermos |

**Yeni küçük SVG'ler (R2-12 ve kapanış):** `icon/icon_piggy` (kumbara, kenar ikonu; Faz 4), `icon/icon_kettlebell`
(Ağır Yük rozeti, 40 px; ART §6), `icon/icon_nextfloor` (32 px "sonraki kat" rozeti; UX §5.9) — atlasın boş yuvalarına
(16 + 3 = 19 > 16: atlas 512×640, 20 yuva, 1,3 MB). **Ek (2026-10-07):** `icon/icon_nav_home` (kiremit çatılı ev, seçili sekmede
mavi karo üstünde) ve `icon/icon_nav_album` (spiralli albüm, MVP'de yalnız kilitli) — code-lead kataloğunda isteğe bağlı
iki gezinme ikonu (UX §3, ART §9); atlas 21 ikonla 512×768 (24 yuva, 1,5 MB). `icon/ui_tutorial_glove` (0 0 140 160;
§16.5) atlasa girmez, tek doku 140×160 (0,09 MB).

### 16.4 Üretim sırası (Faz 2R görsel uygulaması)

1. Blockout ekran görüntüleri onayı (ART §13). 2. İkon atlası (#11–#26 + 3 yeni; oyun ekranında en çok görünen). 3.
Karakterler #5, #7, #8 (oyun köşesi ve öğretici portresi). 4. `town_ch1_treehouse` + `bg_home_town`. 5.
`bg_level_site_edge`, `bg_win_plaza`, #6, #10. 6. #9 (ara sahne, dilimde en son). Her adımın sonunda `npm run screens`
incelemesi ve REVIEW_LOG kaydı.

### 16.5 Prosedürel v2 varlıkları (kodla çizilir; keskinlik ve renk körü modu için)

| Ad | Boyut | Tarif | Öncelik |
| -- | ----- | ----- | ------- |
| `blk_<şekil>_<W..P>` v2 | şekil kutusu (en çok 480×480, `site.cols` 4'te I4) | ART §3A şeker blok + §3A.5 hücre başına çıkıntı (R2-12; sembol çıkıntı tepesinde); bölüm başında pişirilir | Faz 2R |
| `blk_gloss_<şekil>` | şekil kutusu | §3A.5 çıkıntı parlama yayı + noktası, renksiz beyaz; yalnız tutulabilir parçanın üstüne konur (DL-2R-17; şekil başına 1, en çok 9) | Faz 2R |
| `cargo_q9`, `cargo_i5` | 360×360 / 600×120 | Ağır Yük (ART §6, PL-2R-04): çelik #7A7A7A gövde + palet/flanş #3A3A3A + kayış + ikaz bandı + `icon_kettlebell`; çıkıntı ve sembol yok | Faz 2R |
| `debris_layer_<şekil>` | şekil kutusu | moloz "yanlış yerde" katmanı (ART §6, PL-2R-11): çatlak + toz α ≤ 0,35 + 40 px "↩" rozeti; bayrak kalkınca söner | Faz 3 (Bölüm 17) |
| `yard_floor` v2 | 120×120 döşeme | delikli pano: v1 zemin + hücre merkezinde Ø 12 delik `board.yardGrid` (ART §2.4, DL-2R-18) | Faz 2R |
| `ui_yard_preview` | hücre 120 | 4 px beyaz α 0,6 noktalı kontur (sahaya bırakma önizlemesi, UX §5.3) | Faz 2R |
| `scene_game_bg` | 1080 × ekran yüksekliği | çivit gradyan #3B2C85 → #1F1850 + 120 px ozalit deseni α 0,04/0,07 (ART §7.1, R2-12); `Graphics`, doku değil | Faz 2R |
| `ui_badge_nextfloor` | 32×32 | "sonraki kat" rozeti: krem daire + `ui.ink` yukarı ok ve kat çizgisi (UX §5.9 madde 3) | Faz 2R |
| `ui_truck_subbadge` | 40×40 + "+n" | teslim edilmemiş partiler rozeti (UX §5.9 madde 2) | Faz 2R |
| `blk_glow_<şekil>` | şekil kutusu + 2 × 10 px | kaldırma ışıltı halkası (ART §3A durum tablosu) | Faz 2R |
| `ui_button_<green/orange/blue/cream/red/grey>` v2 | 9-dilim, köşe ≤ 48 | ART §14.1 (normal + basılı kare) | Faz 2R |
| `ui_button_shine` | 130×176 | §14.1 parlama süpürmesi bandı (20°, α 0,45) | Faz 2R |
| `ui_panel` v2, `ui_panel_hud` | 9-dilim, köşe 48 / 32 | ART §14.2 (ahşap çerçeveli / HUD sade) | Faz 2R |
| `ui_ribbon_<orange/gold/blue>` | 3-dilim (kuyruk + gövde + kuyruk), h 104 | ART §14.3 | Faz 2R |
| `ui_badge` v2 | 60×60, köşe 16 (R2-12 kare rozet) | ART §14.4 | Faz 2R |
| `ui_capsule` | 3-dilim, h 96 | ART §14.5 | Faz 2R |
| `ui_progress_<track/fill>` | 3-dilim, h 48 | ART §14.6 | Faz 2R |
| `ui_nav_bar`, `ui_nav_tab_selected` | 1080×176 / 200×212 | ART §14.7 | Faz 2R |
| `ui_tutorial_bubble` v2, `ui_portrait_ring` | 9-dilim köşe 32 / Ø 128 | ART §14.8 (portre `chr_dede_bust` kırpımı) | Faz 2R |
| `ui_tutorial_glove` | 140×160 | v1 satırı (§10), prosedürel vektör ya da küçük SVG (`public/art/icon/ui_tutorial_glove.svg`, Tuna'nın sarı eldiveni #FFC93C; UX §13.1) | Faz 2R |
| `ui_highlight` | hedef kutusu + 2 × 26 | 8 px beyaz kontur + 18 px parlama (UX §13.1) | Faz 2R |
| `ui_blocks_left_icon` | 96×96 (3–4 çipte 72×72) | L3 şeker blok geometrisi, **krem kit rengi + `ui.ink` kontur, sembol yok** (ART §14.9, PL-2R-14) | Faz 2R |
| `ui_structure_ghost_<ch>` | yapı kutusu | yapı görselinin siluetinden ozalit hayaleti: `board.blueprint` %35 + 4 px beyaz %90 kesik kontur (ART §7.2) | Faz 2R |
| `fx_sparkle4`, `fx_sunburst`, `fx_ring` | 48×48 / 1080×1080 / 256×256 | ART §15 | Faz 2R |
| `yard_frame` v2 | 9-dilim, köşe 24 | 20 px ahşap gradyan #E2A653 → #B97A35 + 6 px #5A3A1E kontur + iç gölge (UX §5.8) | Faz 2R |
| `site_scaffold` v2 | boru 16 × ((Hs + e)·120 + 40; şantiye üstü hava varsa H·120 + 40), kelepçe 24×20 | ART §4 Faz 2R notu, UX §5.8 | Faz 2R |

**Kaldırılan:** `ui_spotlight` (§10) — Faz 2R'de karartma ve delik yok (UX §13.1, R2-10).

### 16.6 Teslim durumu (Faz 2R uygulama, 2026-10-07)

**Teslim:** 33 SVG, toplam 113 KB (gzip -9 ≈ 19,7 KB): `bg/` 3, `town/` 2, `chr/` 5, `logo/` 1, `icon/` 22 (§16.3'ün 19
ikonu + `icon_nav_home`, `icon_nav_album`, `ui_tutorial_glove`). Hepsi §15'te kayıtlı (web MVP final, insan rötuşu yok).
Sıra §16.4'e uygun: ikonlar → Tuna/Dede/Kepçe → ağaç ev + ana sayfa → kenar, kazanma, Tuna sevinç, logo → Gribeton →
Faz 3 ikonları.

**Denetimler:** (1) code-lead `checkSvg` (`src/services/assetCatalog.ts`, salt okunur çağrı): katalogdaki 32 SVG'nin
32'si geçer, ret 0; yalnız `town_ch1_tree` katalog dışı (code-lead'e katalog isteği REVIEW_LOG'da). (2) `npm run
assets` (son SVG'lerle yeniden üretildi): 33 SVG → 33 ok + 1 sorun (katalog dışı ağaç; araç bu yüzden çıkış 1 verir),
indirme 229,0 / 900 KB, doku 12,8 / 64 MB; ardından `npm run assets:check` çıkış 0 (bayat çıktı yok, 1 uyarı). (3)
design-lead betiği (yasak öğe, kök viewBox, boyut, geometri öznitelikleri ve `transform` dahil en çok 1 ondalık, palet
± 2, kontur rengi): 33 / 33 geçer. (4) Görsel inceleme Chromium'da kullanım boyutunda (ikon 128 / 64 / 40 / 32 px,
karakter ≈ 300 px, arka plan 540×960) çivit #2B2560 ve krem zeminde; kontak sayfaları `artifacts/screens/art-review/`
(`contact_icons.png`, `contact_characters.png`, `contact_scenes.png`; git dışı).

**Arka plan kroması (CIE LCh C\*, 540×960 raster ortalaması; blok tabanları ortalaması 55,6):** `bg_home_town` 33,4
(%40 düşük), `bg_win_plaza` 34,4 (%38 düşük) → eşik (%25) tutar. HSV doygunluğuyla %43 / %41 düşük; HSL ile %12 / −%21
(pastel gök ve ışık renklerinde HSL S = %100; ölçüt bu yüzden C\*'a çevrildi, ART §7).

**Ağaç ev katmanları (code-lead için):** `town_ch1_tree` (taban, her zaman tam renk) + `town_ch1_treehouse` (görev
parçaları; renkli doku `setCrop`, hayalet bu dosyanın siluetinden) aynı 760×820 kutuda üst üste çizilir. Tek başına
yapı dokusunda basamaklar havada kalır; taban katmanı zorunludur. Kırpma tek y çizgisi olduğu için grupların bir kısmı
komşu banda taşar (ölçüm: Chromium `getBBox`, viewBox y; bant = `ch1CropStops`'tan):

| Grup | Görev | Grup y | Bant y | Taşma (hangi aşamada erken/geç görünür) |
| ---- | ----- | ------ | ------ | --------------------------------------- |
| `t1` | basamaklar | 600–796 | 672–820 | üst 2 basamak (600–672) 2. aşamada platformla açılır |
| `t2` | platform | 500–680 | 525–672 | korkuluk üstü (500–525) 3. aşamada; payanda ucu 8 px 1. aşamada |
| `t3` | duvarlar + kapı | 316–560 | 394–525 | duvar tabanı 2. aşamada (döşeme gibi okunur); üst duvar 4. aşamada pencereyle |
| `t4` | pencere + perde | 322–392 | 312–394 | yok |
| `t5` | çatı | 176–342 | 197–312 | saçak uçları 4. aşamada; mahya başlığı 6. aşamada |
| `t6` | ip merdiven + makara | 112–250 | 98–197 | merdiven alt ucu (197–250) 5. aşamada çatıyla |
| `t7` | bayrak + tabela | 9–106 | 0–98 | direk dibi 8 px 6. aşamada |

Faz 4'te görev sistemi gelince grup bazlı açılış (her `<g id="tk">` ayrı) bu taşmaları sıfırlar; Faz 2R'de taşmalar
"yapım sürüyor" görünümü verir ve hayalet örtüsüyle kabul edilir.

**Usta Dede portre kırpımı:** viewBox merkezi (126, 142), r 84 → Ø 128 (CL-2R-26 Canvas2D `arc` + `clip`).

**Kalite açısından zayıf kalanlar (sonraki tur):** `bg_win_plaza` ve `bg_home_town` alt üçte birinde geniş düz alan
(UI örtüyor, ama tek başına sade); `chr_gribeton_bust` eli ve klasörü basit; Tuna'nın oranları (büyük kafa, iri göz)
D-087'nin 10–12 yaş görünümünden genç okunabilir — 5 kişilik yaş tahmini testi ART §12'deki yan yana testle birlikte
yapılır; `icon_moves` duvarı 128 px'te küçük bir sıraya benzer (64 px'te sorun yok).
