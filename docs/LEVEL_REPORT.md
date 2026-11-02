# Bölüm raporu

Sahip: code-lead (araçlarla üretilir) · Durum: Faz 2R Bölüm 1–10. "Bulmaca ölçütleri" bölümü
`npm run levels:solve -- --report` ile işaretler arasına yazılır; elle düzenlenmez. Playtest botu ve kazanma oranları
(WP-N, `levels:bot`) Faz 3'te eklenir.

**Okuma:** tanımlar GDD K-50, zorunluluklar K-51 (madde 2 bütün uzay kapısı, madde 5 teslimat adaleti), hamle bandı K-52.
"uzay çıkmaz (yakalanan)" = canlı bir durumdan tek hamleyle girilen çıkmaz durum sayısı ve bunların D1/D2/D3a ile
yakalananları; D3b tablosu Faz 3'te olduğu için yakalanmayan her durum `dead_table_missing` hatasıdır. "teslimat g·f" =
kamyon partisi başına önsezi kazancı `g` ve şans farkı `f` (ikisi de 0 olmalı; değilse `delivery_foresight` uyarısı).
"varyant" = LEVELS §2 bantları (`no-gaps`: geçitsiz min − min ≥ 1; `hammer-start`: min − Çekiç'le min ≥ 2).

**Uyarılar ve susturulanlar:** Bölüm 1–10'da 0 hata, 0 uyarı; `tools/levels-allow.json` boş (Bölüm 10'un eski bilinçli
kuyruğu solver turunda kalktı, E-54).

<!-- levels:solve:begin -->
## Bulmaca ölçütleri (`npm run levels:solve`)

Üretildi: 2026-11-02 · solver 3 · kurallar 3. Tanımlar GDD K-50; zorunluluklar K-51; hamle bandı K-52.

| # | Zorluk | Durum | N | min | s (dilim) | d | F0 örtü | trap | deadRate | ch@0·1·2 / best | YAO | moves | K-52 bandı (nominal) | varyant | uzay çıkmaz (yakalanan) | teslimat g·f | states | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Kolay (tanıtım) | solved | 6 | 6 | 0 (0+0) | 0 | 0 | 0 | 0.000 | 5·15·17 / 1·3·1 | 6/6 | 10 | 10–12 (10) | – | 0 (0) | – | 21 125 | 974 |
| 2 | Kolay | solved | 6 | 6 | 0 (0+0) | 0 | 0 | 0 | 0.000 | 1·6·8 / 1·1·1 | 6/6 | 10 | 10–12 (10) | – | 0 (0) | – | 13 797 | 576 |
| 3 | Kolay | solved | 7 | 8 | 1 (1+0) | 1 | 1 | 0 | 0.000 | 6·7·15 / 1·1·1 | 7/7 | 12 | 12–14 (12) | – | 0 (0) | – | 77 757 | 4 561 |
| 4 | Kolay (tanıtım) | solved | 8 | 9 | 1 (1+0) | 1 | 1 | 0 | 0.000 | 4·6·11 / 1·1·1 | 7/8 | 13 | 13–15 (13) | no-gaps 10 | 0 (0) | – | 220 746 | 11 577 |
| 5 | Normal | solved | 8 | 11 | 3 (3+0) | 2 | 1 | 0 | 0.000 | 7·6·5 / 2·1·1 | 8/8 | 13 | 13–15 (13) | – | 0 (0) | – | 745 442 | 36 524 |
| 6 | Normal (tanıtım) | solved | 7 | 9 | 2 (2+0) | 1 | 1 | 0 | 0.000 | 3·4·5 / 1·1·1 | 7/7 | 13 | 13–15 (13) | – | 0 (0) | – | 31 270 | 1 704 |
| 7 | Normal | solved | 7 | 11 | 4 (4+0) | 1 | 1 | 0 | 0.000 | 5·6·7 / 1·1·1 | 7/7 | 13 | 13–15 (13) | – | 0 (0) | – | 133 422 | 9 209 |
| 8 | Normal (tanıtım) | solved | 7 | 10 | 3 (3+0) | 3 | 1 | 0 | 0.000 | 5·7·7 / 1·1·3 | 7/7 | 14 | 14–16 (14) | hammer-start 8 | 0 (0) | – | 446 663 | 28 767 |
| 9 | Normal (tanıtım) | solved | 7 | 12 | 5 (5+0) | 2 | 2 | 0 | 0.000 | 4·5·6 / 1·1·1 | 6/7 | 16 | 16–18 (16) | no-gaps 14 | 0 (0) | – | 72 477 | 4 249 |
| 10 | Zor | solved | 7 | 13 | 6 (6+0) | 5 | 2 | 0 | 0.000 | 2·2·3 / 1·1·1 | 7/7 | 14 | 14–16 (14) | – | 0 (0) | – | 121 022 | 6 184 |

### D-099 bulmaca zekâsı (GDD K-50 madde 11–19, K-51 madde 6–9)

| # | şema | min | minShifts | firstNeedDepth | maxCover | depLater | crossDeps | carryShifts | parkSlack | forced | trapCount | greedyTrap | greedyExcess | greedyWin | ahaMin | branch3 | complete | yakalanmayan çıkmaz | D1 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 6 | 0 | 0 | 3 | 0 | 5 | 0 | – | 4 | 0 | – | 0 | 1.00 | 0 | 0.36 | evet | 0 | 0 |
| 2 | 2 | 6 | 0 | 0 | 2 | 0 | 5 | 0 | – | 5 | 0 | – | 0 | 1.00 | 0 | 0.75 | evet | 0 | 0 |
| 3 | 2 | 8 | 1 | 1 | 2 | 2 | 2 | 1 | 1 | 6 | 0 | – | 0 | 1.00 | 0 | 0.3 | evet | 0 | 0 |
| 4 | 2 | 9 | 1 | 1 | 5 | 1 | 11 | 0 | 2 | 8 | 0 | – | 0 | 1.00 | 0 | 0.33 | evet | 0 | 0 |
| 5 | 2 | 11 | 3 | 2 | 3 | 3 | 7 | 2 | 1 | 8 | 0 | – | 1 | 1.00 | 1 | 0.27 | evet | 0 | 0 |
| 6 | 2 | 9 | 2 | 1 | 3 | 2 | 6 | 2 | 2 | 7 | 0 | – | 0 | 1.00 | 0 | 0.5 | evet | 0 | 0 |
| 7 | 2 | 11 | 4 | 1 | 2 | 2 | 4 | 2 | 0.5 | 9 | 0 | – | 2 | 1.00 | 2 | 0.27 | evet | 0 | 0 |
| 8 | 2 | 10 | 3 | 3 | 3 | 3 | 4 | 2 | 0.83 | 7 | 0 | – | 0 | 1.00 | 0 | 0.21 | evet | 0 | 0 |
| 9 | 2 | 12 | 5 | 2 | 4 | 6 | 9 | 3 | 0.4 | 11 | 0 | – | 3 | 1.00 | 2 | 0.38 | evet | 0 | 0 |
| 10 | 2 | 13 | 6 | 5 | 3 | 4 | 6 | 2 | 0.33 | 13 | 0 | – | 2 | 0.00 | 1 | 0.43 | evet | 0 | 0 |
<!-- levels:solve:end -->
