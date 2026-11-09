# Bölüm raporu

Sahip: code-lead (araçlarla üretilir) · Durum: D-099 Bölüm 1–10 (`schemaVersion` 2, P4B-01/02/03 turu). "Bulmaca ölçütleri"
bölümü `npm run levels:solve -- --report` ile işaretler arasına yazılır; elle düzenlenmez. Playtest botu (WP-N, `levels:bot`)
hâlâ yok; yerine **beceri botu vekili** (`skillWin`, P4B-03) var: oyuncu her hamlede olasılıkla 1 − ε en kısa yoldaki bir
hamleyi, ε olasılıkla herhangi bir yasal hamleyi seçer (tam DP, ε: acemi 0,25 · orta 0,12 · usta 0,06). ε = 0,12, Bölüm 1–10'un
LEVELS §0 orta-bot hedefleriyle en iyi örtüşendir (5: 0,72 ↔ %75, 7: 0,73 ↔ %70, 10: 0,41 ↔ %45); bu bir **insan kazanma
oranı ölçümü değildir**, bölümleri birbirine göre kıyaslayan bir vekildir.

**Okuma:** tanımlar GDD K-50, zorunluluklar K-51 (madde 2 bütün uzay kapısı, madde 5 teslimat adaleti), hamle bandı K-52.
"uzay çıkmaz (yakalanan)" = canlı bir durumdan tek hamleyle girilen çıkmaz durum sayısı ve bunların D1/D2/D3a ile
yakalananları; D3b tablosu Faz 3'te olduğu için yakalanmayan her durum `dead_table_missing` hatasıdır. "teslimat g·f" =
kamyon partisi başına önsezi kazancı `g` ve şans farkı `f` (ikisi de 0 olmalı; değilse `delivery_foresight` uyarısı).
"varyant" = LEVELS §2 bantları (`no-gaps`: geçitsiz min − min ≥ 1; `hammer-start`: min − Çekiç'le min ≥ 2).

**Uyarılar ve susturulanlar:** Bölüm 1–10'da 0 hata, **2 uyarı**: `puzzle_greedy_easy` Bölüm 5 ve 7 (açgözlü oyun bütçe
içinde kazanır, `greedyWin` 1,00; kural P4B-02 ile `ahaMin`'den bağımsız oldu). Susturulmadı: açık bir bulmaca bulgusudur
(LEVELS §6.11). `tools/levels-allow.json` boş. Şartname sapması tablosu (altta) JSON `targets` ile Tablo B arasındaki farkı gösterir.

<!-- levels:solve:begin -->
## Bulmaca ölçütleri (`npm run levels:solve`)

Üretildi: 2026-11-09 · solver 4 · kurallar 4. Tanımlar GDD K-50; zorunluluklar K-51; hamle bandı K-52.

| # | Zorluk | Durum | N | min | s (dilim) | d | F0 örtü | trap | deadRate | ch@0·1·2 / best | YAO | moves | K-52 bandı (nominal) | varyant | uzay çıkmaz (yakalanan) | teslimat g·f | states | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Kolay (tanıtım) | solved | 8 | 8 | 0 (0+0) | 0 | 0 | 0 | 0.000 | 18·18·16 / 4·4·2 | 8/8 | 12 | 12–14 (12) | – | 0 (0) | – | 767 033 | 30 236 |
| 2 | Kolay | solved | 8 | 8 | 0 (0+0) | 0 | 0 | 0 | 0.000 | 11·12·29 / 1·1·1 | 8/8 | 12 | 12–14 (12) | – | 0 (0) | – | 76 593 | 5 183 |
| 3 | Kolay | solved | 8 | 10 | 2 (2+0) | 2 | 1 | 0 | 0.000 | 4·4·6 / 2·1·1 | 8/8 | 14 | 14–16 (14) | – | 0 (0) | – | 90 554 | 5 421 |
| 4 | Kolay | solved | 8 | 10 | 2 (2+0) | 1 | 1 | 0 | 0.000 | 4·4·12 / 1·1·2 | 8/8 | 14 | 14–16 (14) | – | 0 (0) | – | 106 100 | 6 381 |
| 5 | Normal (tanıtım) | solved | 8 | 10 | 2 (2+0) | 2 | 1 | 0 | 0.000 | 5·8·12 / 1·1·1 | 8/8 | 14 | 14–16 (14) | – | 0 (0) | – | 289 240 | 13 358 |
| 6 | Normal | solved | 8 | 10 | 2 (2+0) | 1 | 1 | 0 | 0.000 | 4·4·9 / 1·1·3 | 8/8 | 12 | 12–14 (12) | – | 0 (0) | – | 640 996 | 36 037 |
| 7 | Normal (tanıtım) | solved | 9 | 10 | 1 (1+0) | 1 | 1 | 0 | 0.000 | 7·9·12 / 2·1·1 | 9/9 | 14 | 14–16 (14) | – | 0 (0) | – | 634 701 | 38 171 |
| 8 | Normal | solved | 8 | 12 | 4 (4+0) | 3 | 1 | 0 | 0.000 | 2·4·5 / 1·1·1 | 8/8 | 14 | 14–16 (14) | – | 0 (0) | – | 182 718 | 13 096 |
| 9 | Normal (tanıtım) | solved | 8 | 10 | 2 (2+0) | 1 | 1 | 0 | 0.000 | 5·5·4 / 1·1·1 | 8/8 | 14 | 14–16 (14) | – | 0 (0) | – | 417 473 | 15 112 |
| 10 | Zor | solved | 8 | 12 | 4 (4+0) | 3 | 1 | 0 | 0.000 | 1·2·1 / 1·1·1 | 8/8 | 13 | 13–15 (13) | – | 0 (0) | – | 103 142 | 6 304 |

### D-099 bulmaca zekâsı (GDD K-50 madde 11–19, K-51 madde 6–9)

| # | şema | min | minShifts | firstNeedDepth | maxCover | depLater | crossDeps | carryShifts | parkSlack | forced | trapCount | greedyTrap | greedyExcess | greedyWin | beceri botu a/o/u | ahaMin | branch3 | complete | yakalanmayan çıkmaz | D1 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 8 | 0 | 0 | 3 | 0 | 8 | 0 | – | 4 | 0 | – | 0 | 1.00 | 0.89 / 0.99 / 1.00 | 0 | 0.5 | evet | 0 | 0 |
| 2 | 2 | 8 | 0 | 0 | 3 | 1 | 3 | 0 | – | 6 | 0 | – | 0 | 1.00 | 0.76 / 0.97 / 1.00 | 0 | 0.23 | evet | 0 | 0 |
| 3 | 2 | 10 | 2 | 2 | 3 | 2 | 8 | 1 | 1 | 9 | 0 | – | 0 | 1.00 | 0.75 / 0.97 / 1.00 | 0 | 0.31 | evet | 0 | 0 |
| 4 | 2 | 10 | 2 | 1 | 2 | 2 | 6 | 1 | 1 | 6 | 0 | – | 0 | 1.00 | 0.70 / 0.96 / 0.99 | 0 | 0.21 | evet | 0 | 0 |
| 5 | 2 | 10 | 2 | 2 | 4 | 1 | 8 | 0 | 1 | 8 | 0 | – | 0 | 1.00 | 0.62 / 0.93 / 0.99 | 0 | 0.23 | evet | 0 | 0 |
| 6 | 2 | 10 | 2 | 1 | 3 | 2 | 7 | 2 | 2 | 6 | 0 | – | 0 | 1.00 | 0.45 / 0.83 / 0.96 | 0 | 0.4 | evet | 0 | 0 |
| 7 | 2 | 10 | 1 | 1 | 3 | 0 | 2 | 0 | 2 | 8 | 0 | – | 0 | 1.00 | 0.68 / 0.95 / 0.99 | 0 | 0.33 | evet | 0 | 0 |
| 8 | 2 | 12 | 4 | 3 | 2 | 2 | 4 | 2 | 0.4 | 9 | 0 | – | 0 | 1.00 | 0.32 / 0.73 / 0.91 | 0 | 0.33 | evet | 0 | 0 |
| 9 | 2 | 10 | 2 | 1 | 2 | 1 | 2 | 2 | 0.67 | 8 | 0 | – | 0 | 1.00 | 0.72 / 0.96 / 1.00 | 0 | 0.27 | evet | 0 | 0 |
| 10 | 2 | 12 | 4 | 3 | 3 | 3 | 3 | 2 | 0.44 | 8 | 0 | – | 0 | 1.00 | 0.15 / 0.49 / 0.74 | 0 | 0.43 | evet | 0 | 0 |

### Şartname sapması (`targets_diverge_from_spec`, LEVELS §6.6 Tablo B)

Gerçek değer ya da JSON `targets` bandı Tablo B dışındaysa listelenir (JSON bantları ölçülen değerin çevresine yazıldığı için `metric_out_of_band` bunu göremez; P4B-02).

| # | ölçüt | gerçek | şartname (Tablo B) | JSON `targets` | durum |
|---|---|---|---|---|---|
| 1 | maxCover | 3 | 0–1 | – | gerçek bant dışı |
| 1 | forced | 4 | 0–2 | – | gerçek bant dışı |
| 1 | greedyWin | 1 | 0.95–1 | 0.9–1 | hedef bant şartname dışında |
| 2 | maxCover | 3 | 0–1 | – | gerçek bant dışı |
| 2 | depLater | 1 | 0–0 | – | gerçek bant dışı |
| 2 | forced | 6 | 0–2 | – | gerçek bant dışı |
| 2 | branch3 | 0.23 | 0.35–1 | – | gerçek bant dışı |
| 3 | firstNeedDepth | 2 | 1–1 | 2–2 | gerçek ve hedef bant dışı |
| 3 | maxCover | 3 | 1–2 | – | gerçek bant dışı |
| 3 | parkSlack | 1 | 1.5–9.99 | – | gerçek bant dışı |
| 3 | forced | 9 | 1–3 | – | gerçek bant dışı |
| 4 | forced | 6 | 1–3 | – | gerçek bant dışı |
| 5 | min | 10 | 12–14 | 10–10 | gerçek ve hedef bant dışı |
| 5 | minShifts | 2 | 3–4 | 2–2 | gerçek ve hedef bant dışı |
| 5 | maxCover | 4 | 2–3 | – | gerçek bant dışı |
| 5 | depLater | 1 | 2–3 | – | gerçek bant dışı |
| 5 | forced | 8 | 2–4 | – | gerçek bant dışı |
| 5 | greedyExcess | 0 | 1–2 | – | gerçek bant dışı |
| 5 | greedyWin | 1 | 0.4–0.7 | 0.9–1 | gerçek ve hedef bant dışı |
| 5 | ahaMin | 0 | 1–1 | 0–0 | gerçek ve hedef bant dışı |
| 6 | min | 10 | 11–13 | 10–10 | gerçek ve hedef bant dışı |
| 6 | minShifts | 2 | 3–3 | 2–2 | gerçek ve hedef bant dışı |
| 6 | firstNeedDepth | 1 | 2–2 | 1–1 | gerçek ve hedef bant dışı |
| 6 | parkSlack | 2 | 1–1.5 | – | gerçek bant dışı |
| 6 | forced | 6 | 2–4 | – | gerçek bant dışı |
| 6 | greedyWin | 1 | 0.5–0.85 | 0.9–1 | gerçek ve hedef bant dışı |
| 7 | min | 10 | 14–16 | 10–10 | gerçek ve hedef bant dışı |
| 7 | minShifts | 1 | 4–5 | 1–1 | gerçek ve hedef bant dışı |
| 7 | firstNeedDepth | 1 | 2–2 | 1–1 | gerçek ve hedef bant dışı |
| 7 | depLater | 0 | 2–3 | – | gerçek bant dışı |
| 7 | crossDeps | 2 | 3–∞ | – | gerçek bant dışı |
| 7 | parkSlack | 2 | 0.8–1.5 | – | gerçek bant dışı |
| 7 | forced | 8 | 3–5 | – | gerçek bant dışı |
| 7 | greedyExcess | 0 | 1–3 | – | gerçek bant dışı |
| 7 | greedyWin | 1 | 0.3–0.6 | 0.9–1 | gerçek ve hedef bant dışı |
| 7 | ahaMin | 0 | 1–2 | 0–0 | gerçek ve hedef bant dışı |
| 7 | branch3 | 0.33 | 0.15–0.3 | – | gerçek bant dışı |
| 8 | parkSlack | 0.4 | 1–2 | – | gerçek bant dışı |
| 8 | forced | 9 | 2–4 | – | gerçek bant dışı |
| 8 | greedyWin | 1 | 0.4–0.8 | 0.9–1 | gerçek ve hedef bant dışı |
| 8 | choices0 | 2 | 4–∞ | – | gerçek bant dışı |
| 9 | min | 10 | 11–13 | 10–10 | gerçek ve hedef bant dışı |
| 9 | minShifts | 2 | 3–4 | 2–2 | gerçek ve hedef bant dışı |
| 9 | parkSlack | 0.67 | 1–9.99 | – | gerçek bant dışı |
| 9 | forced | 8 | 2–4 | – | gerçek bant dışı |
| 9 | greedyWin | 1 | 0.5–0.85 | 0.9–1 | gerçek ve hedef bant dışı |
| 10 | min | 12 | 22–26 | 12–12 | gerçek ve hedef bant dışı |
| 10 | minShifts | 4 | 7–9 | 4–4 | gerçek ve hedef bant dışı |
| 10 | crossDeps | 3 | 5–∞ | – | gerçek bant dışı |
| 10 | parkSlack | 0.44 | 0.6–1.2 | – | gerçek bant dışı |
| 10 | greedyExcess | 0 | 2–∞ | – | gerçek bant dışı |
| 10 | greedyWin | 1 | 0.05–0.25 | 0.9–1 | gerçek ve hedef bant dışı |
| 10 | ahaMin | 0 | 2–∞ | 0–0 | gerçek ve hedef bant dışı |
| 10 | branch3 | 0.43 | 0–0.2 | – | gerçek bant dışı |
| 10 | choices0 | 1 | 5–∞ | – | gerçek bant dışı |
<!-- levels:solve:end -->
