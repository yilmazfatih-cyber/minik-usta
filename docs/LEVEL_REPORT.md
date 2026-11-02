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

Üretildi: 2026-11-02 · solver 3 · kurallar 3. Tanımlar GDD K-50; zorunluluklar K-51; hamle bandı K-52.

| # | Zorluk | Durum | N | min | s (dilim) | d | F0 örtü | trap | deadRate | ch@0·1·2 / best | YAO | moves | K-52 bandı (nominal) | varyant | uzay çıkmaz (yakalanan) | teslimat g·f | states | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Kolay (tanıtım) | solved | 6 | 6 | 0 (0+0) | 0 | 0 | 0 | 0.000 | 5·15·17 / 1·3·1 | 6/6 | 10 | 10–12 (10) | – | 0 (0) | – | 21 125 | 668 |
| 2 | Kolay | solved | 6 | 6 | 0 (0+0) | 0 | 0 | 0 | 0.000 | 1·6·8 / 1·1·1 | 6/6 | 10 | 10–12 (10) | – | 0 (0) | – | 13 797 | 473 |
| 3 | Kolay | solved | 7 | 8 | 1 (1+0) | 1 | 1 | 0 | 0.000 | 6·7·15 / 1·1·1 | 7/7 | 12 | 12–14 (12) | – | 0 (0) | – | 77 757 | 3 322 |
| 4 | Kolay (tanıtım) | solved | 8 | 9 | 1 (1+0) | 1 | 1 | 0 | 0.000 | 4·6·11 / 1·1·1 | 7/8 | 13 | 13–15 (13) | no-gaps 10 | 0 (0) | – | 220 746 | 8 650 |
| 5 | Normal | solved | 8 | 11 | 3 (3+0) | 2 | 1 | 0 | 0.000 | 7·6·5 / 2·1·1 | 8/8 | 13 | 13–15 (13) | – | 0 (0) | – | 745 442 | 29 185 |
| 6 | Normal (tanıtım) | solved | 7 | 9 | 2 (2+0) | 1 | 1 | 0 | 0.000 | 3·4·5 / 1·1·1 | 7/7 | 13 | 13–15 (13) | – | 0 (0) | – | 31 270 | 1 060 |
| 7 | Normal | solved | 7 | 11 | 4 (4+0) | 1 | 1 | 0 | 0.000 | 5·6·7 / 1·1·1 | 7/7 | 13 | 13–15 (13) | – | 0 (0) | – | 133 422 | 6 672 |
| 8 | Normal (tanıtım) | solved | 7 | 10 | 3 (3+0) | 3 | 1 | 0 | 0.000 | 5·7·7 / 1·1·3 | 7/7 | 14 | 14–16 (14) | hammer-start 8 | 0 (0) | – | 446 663 | 21 772 |
| 9 | Normal (tanıtım) | solved | 7 | 12 | 5 (5+0) | 2 | 2 | 0 | 0.000 | 4·5·6 / 1·1·1 | 6/7 | 16 | 16–18 (16) | no-gaps 14 | 0 (0) | – | 72 477 | 3 062 |
| 10 | Zor | solved | 7 | 13 | 6 (6+0) | 5 | 2 | 0 | 0.000 | 2·2·3 / 1·1·1 | 7/7 | 14 | 14–16 (14) | – | 0 (0) | – | 121 022 | 4 360 |

### D-099 bulmaca zekâsı (GDD K-50 madde 11–19, K-51 madde 6–9)

| # | şema | min | minShifts | firstNeedDepth | maxCover | depLater | crossDeps | carryShifts | parkSlack | forced | trapCount | greedyTrap | greedyExcess | greedyWin | beceri botu a/o/u | ahaMin | branch3 | complete | yakalanmayan çıkmaz | D1 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 6 | 0 | 0 | 3 | 0 | 5 | 0 | – | 4 | 0 | – | 0 | 1.00 | 0.94 / 1.00 / 1.00 | 0 | 0.36 | evet | 0 | 0 |
| 2 | 2 | 6 | 0 | 0 | 2 | 0 | 5 | 0 | – | 5 | 0 | – | 0 | 1.00 | 0.96 / 1.00 / 1.00 | 0 | 0.75 | evet | 0 | 0 |
| 3 | 2 | 8 | 1 | 1 | 2 | 2 | 2 | 1 | 1 | 6 | 0 | – | 0 | 1.00 | 0.74 / 0.96 / 0.99 | 0 | 0.3 | evet | 0 | 0 |
| 4 | 2 | 9 | 1 | 1 | 5 | 1 | 11 | 0 | 2 | 8 | 0 | – | 0 | 1.00 | 0.79 / 0.98 / 1.00 | 0 | 0.33 | evet | 0 | 0 |
| 5 | 2 | 11 | 3 | 2 | 3 | 3 | 7 | 2 | 1 | 8 | 0 | – | 1 | 1.00 | 0.30 / 0.72 / 0.91 | 1 | 0.27 | evet | 0 | 0 |
| 6 | 2 | 9 | 2 | 1 | 3 | 2 | 6 | 2 | 2 | 7 | 0 | – | 0 | 1.00 | 0.73 / 0.96 / 0.99 | 0 | 0.5 | evet | 0 | 0 |
| 7 | 2 | 11 | 4 | 1 | 2 | 2 | 4 | 2 | 0.5 | 9 | 0 | – | 2 | 1.00 | 0.31 / 0.73 / 0.92 | 2 | 0.27 | evet | 0 | 0 |
| 8 | 2 | 10 | 3 | 3 | 3 | 3 | 4 | 2 | 0.83 | 7 | 0 | – | 0 | 1.00 | 0.72 / 0.96 / 0.99 | 0 | 0.21 | evet | 0 | 0 |
| 9 | 2 | 12 | 5 | 2 | 4 | 6 | 9 | 3 | 0.4 | 11 | 0 | – | 3 | 1.00 | 0.47 / 0.88 / 0.98 | 2 | 0.38 | evet | 0 | 0 |
| 10 | 2 | 13 | 6 | 5 | 3 | 4 | 6 | 2 | 0.33 | 13 | 0 | – | 2 | 0.00 | 0.10 / 0.41 / 0.68 | 1 | 0.43 | evet | 0 | 0 |

### Şartname sapması (`targets_diverge_from_spec`, LEVELS §6.6 Tablo B)

Gerçek değer ya da JSON `targets` bandı Tablo B dışındaysa listelenir (JSON bantları ölçülen değerin çevresine yazıldığı için `metric_out_of_band` bunu göremez; P4B-02).

| # | ölçüt | gerçek | şartname (Tablo B) | JSON `targets` | durum |
|---|---|---|---|---|---|
| 1 | min | 6 | 8–9 | 6–6 | gerçek ve hedef bant dışı |
| 1 | maxCover | 3 | 0–1 | 0–3 | gerçek ve hedef bant dışı |
| 1 | forced | 4 | 0–2 | 0–6 | gerçek ve hedef bant dışı |
| 1 | branch3 | 0.36 | 0.4–1 | 0.3–1 | gerçek ve hedef bant dışı |
| 2 | firstNeedDepth | 0 | 0–0 | 0–1 | hedef bant şartname dışında |
| 2 | maxCover | 2 | 0–1 | 0–3 | gerçek ve hedef bant dışı |
| 2 | depLater | 0 | 0–0 | 0–1 | hedef bant şartname dışında |
| 2 | forced | 5 | 0–2 | 0–6 | gerçek ve hedef bant dışı |
| 2 | branch3 | 0.75 | 0.35–1 | 0.3–1 | hedef bant şartname dışında |
| 2 | choices0 | 1 | 3–∞ | – | gerçek bant dışı |
| 3 | min | 8 | 9–11 | 8–9 | gerçek ve hedef bant dışı |
| 3 | minShifts | 1 | 2–3 | 1–2 | gerçek ve hedef bant dışı |
| 3 | maxCover | 2 | 1–2 | 1–3 | hedef bant şartname dışında |
| 3 | parkSlack | 1 | 1.5–9.99 | 1–9.99 | gerçek ve hedef bant dışı |
| 3 | forced | 6 | 1–3 | 1–7 | gerçek ve hedef bant dışı |
| 3 | branch3 | 0.3 | 0.25–0.45 | 0.25–0.6 | hedef bant şartname dışında |
| 4 | min | 9 | 10–12 | 9–10 | gerçek ve hedef bant dışı |
| 4 | minShifts | 1 | 2–3 | 1–2 | gerçek ve hedef bant dışı |
| 4 | maxCover | 5 | 2–2 | 1–5 | gerçek ve hedef bant dışı |
| 4 | depLater | 1 | 1–2 | 0–2 | hedef bant şartname dışında |
| 4 | forced | 8 | 1–3 | 1–9 | gerçek ve hedef bant dışı |
| 4 | branch3 | 0.33 | 0.2–0.4 | 0.2–0.6 | hedef bant şartname dışında |
| 5 | min | 11 | 12–14 | 10–12 | gerçek ve hedef bant dışı |
| 5 | minShifts | 3 | 3–4 | 2–4 | hedef bant şartname dışında |
| 5 | depLater | 3 | 2–3 | 2–4 | hedef bant şartname dışında |
| 5 | parkSlack | 1 | 1–2 | 0.8–2 | hedef bant şartname dışında |
| 5 | forced | 8 | 2–4 | 4–9 | gerçek ve hedef bant dışı |
| 5 | greedyWin | 1 | 0.4–0.7 | 0.5–1 | gerçek ve hedef bant dışı |
| 6 | min | 9 | 11–13 | 9–10 | gerçek ve hedef bant dışı |
| 6 | minShifts | 2 | 3–3 | 2–3 | gerçek ve hedef bant dışı |
| 6 | firstNeedDepth | 1 | 2–2 | 1–2 | gerçek ve hedef bant dışı |
| 6 | depLater | 2 | 1–2 | 1–3 | hedef bant şartname dışında |
| 6 | parkSlack | 2 | 1–1.5 | 1–2 | gerçek ve hedef bant dışı |
| 6 | forced | 7 | 2–4 | 4–8 | gerçek ve hedef bant dışı |
| 6 | greedyWin | 1 | 0.5–0.85 | 0.5–1 | gerçek ve hedef bant dışı |
| 6 | branch3 | 0.5 | 0.2–0.4 | 0.2–0.6 | gerçek ve hedef bant dışı |
| 6 | choices0 | 3 | 4–∞ | – | gerçek bant dışı |
| 7 | min | 11 | 14–16 | 11–13 | gerçek ve hedef bant dışı |
| 7 | minShifts | 4 | 4–5 | 3–5 | hedef bant şartname dışında |
| 7 | firstNeedDepth | 1 | 2–2 | 1–2 | gerçek ve hedef bant dışı |
| 7 | depLater | 2 | 2–3 | 1–3 | hedef bant şartname dışında |
| 7 | parkSlack | 0.5 | 0.8–1.5 | 0.4–1 | gerçek ve hedef bant dışı |
| 7 | forced | 9 | 3–5 | 6–10 | gerçek ve hedef bant dışı |
| 7 | greedyWin | 1 | 0.3–0.6 | 0.5–1 | gerçek ve hedef bant dışı |
| 7 | branch3 | 0.27 | 0.15–0.3 | 0.15–0.35 | hedef bant şartname dışında |
| 8 | min | 10 | 11–13 | 10–11 | gerçek ve hedef bant dışı |
| 8 | minShifts | 3 | 3–4 | 2–4 | hedef bant şartname dışında |
| 8 | maxCover | 3 | 2–2 | 2–3 | gerçek ve hedef bant dışı |
| 8 | depLater | 3 | 1–2 | 2–4 | gerçek ve hedef bant dışı |
| 8 | parkSlack | 0.83 | 1–2 | 0.6–1.2 | gerçek ve hedef bant dışı |
| 8 | forced | 7 | 2–4 | 5–9 | gerçek ve hedef bant dışı |
| 8 | greedyWin | 1 | 0.4–0.8 | 0.6–1 | gerçek ve hedef bant dışı |
| 9 | minShifts | 5 | 3–4 | 3–5 | gerçek ve hedef bant dışı |
| 9 | maxCover | 4 | 2–2 | 2–4 | gerçek ve hedef bant dışı |
| 9 | depLater | 6 | 1–2 | 2–6 | gerçek ve hedef bant dışı |
| 9 | parkSlack | 0.4 | 1–9.99 | 0.4–1 | gerçek ve hedef bant dışı |
| 9 | forced | 11 | 2–4 | 8–12 | gerçek ve hedef bant dışı |
| 9 | greedyExcess | 3 | 0–1 | 1–3 | gerçek ve hedef bant dışı |
| 9 | greedyWin | 1 | 0.5–0.85 | 0.5–1 | gerçek ve hedef bant dışı |
| 9 | ahaMin | 2 | 0–1 | 1–2 | gerçek ve hedef bant dışı |
| 9 | branch3 | 0.38 | 0.2–0.4 | 0.2–0.5 | hedef bant şartname dışında |
| 10 | min | 13 | 22–26 | 13–14 | gerçek ve hedef bant dışı |
| 10 | minShifts | 6 | 7–9 | 5–7 | gerçek ve hedef bant dışı |
| 10 | firstNeedDepth | 5 | 2–3 | 4–6 | gerçek ve hedef bant dışı |
| 10 | maxCover | 3 | 3–4 | 2–4 | hedef bant şartname dışında |
| 10 | crossDeps | 6 | 5–∞ | 4–∞ | hedef bant şartname dışında |
| 10 | parkSlack | 0.33 | 0.6–1.2 | 0.25–0.6 | gerçek ve hedef bant dışı |
| 10 | forced | 13 | 5–8 | 10–13 | gerçek ve hedef bant dışı |
| 10 | greedyWin | 0 | 0.05–0.25 | 0–0.25 | gerçek ve hedef bant dışı |
| 10 | ahaMin | 1 | 2–∞ | 1–2 | gerçek ve hedef bant dışı |
| 10 | branch3 | 0.43 | 0–0.2 | 0.3–0.5 | gerçek ve hedef bant dışı |
| 10 | choices0 | 2 | 5–∞ | – | gerçek bant dışı |
<!-- levels:solve:end -->
