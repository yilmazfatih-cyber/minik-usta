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

Üretildi: 2026-10-08 · solver 2 · kurallar 2. Tanımlar GDD K-50; zorunluluklar K-51; hamle bandı K-52.

| # | Zorluk | Durum | N | min | s (dilim) | d | F0 örtü | trap | deadRate | ch@0·1·2 / best | YAO | moves | K-52 bandı (nominal) | varyant | uzay çıkmaz (yakalanan) | teslimat g·f | states | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Kolay | solved | 5 | 5 | 0 | 0 | 0 | 0 | 0.000 | 11·11·16 / 2·1·1 | 5/5 | 11 | 10–12 (11) | – | 0 (0) | – | 10 401 | 376 |
| 2 | Kolay | solved | 3 | 3 | 0 | 0 | 0 | 0 | 0.000 | 7·13·9 / 1·1·1 | 3/3 | 9 | 8–10 (9) | – | 0 (0) | – | 97 | 5 |
| 3 | Kolay | solved | 4 | 5 | 1 | 1 | 1 | 0 | 0.000 | 6·9·10 / 3·1·1 | 4/4 | 11 | 10–12 (11) | – | 0 (0) | – | 1 931 | 59 |
| 4 | Kolay (tanıtım) | solved | 5 | 7 | 2 | 2 | 2 | 0 | 0.000 | 5·9·9 / 1·1·1 | 4/5 | 13 | 12–14 (13) | no-gaps 9 | 0 (0) | – | 1 922 | 107 |
| 5 | Normal (tanıtım) | solved | 8 | 11 | 3 (1+2) | 1 | 1 | 0 | 0.000 | 11·8·14 / 2·1·1 | 8/8 | 17 | 16–18 (17) | – | 0 (0) | 0·0 | 3 203 | 200 |
| 6 | Normal (tanıtım) | solved | 5 | 7 | 2 | 2 | 2 | 0 | 0.000 | 7·9·10 / 1·1·1 | 5/5 | 13 | 12–14 (13) | – | 0 (0) | – | 5 175 | 403 |
| 7 | Normal | solved | 8 | 12 | 4 (3+1) | 3 | 3 | 0 | 0.000 | 11·11·10 / 4·2·1 | 8/8 | 17 | 16–18 (17) | – | 0 (0) | 0·0 | 26 040 | 1 576 |
| 8 | Normal (tanıtım) | solved | 5 | 8 | 3 | 3 | 1 | 0 | 0.000 | 12·15·16 / 1·1·2 | 5/5 | 14 | 13–15 (14) | hammer-start 5 | 0 (0) | – | 431 006 | 15 408 |
| 9 | Normal (tanıtım) | solved | 4 | 7 | 3 | 1 | 1 | 0 | 0.000 | 3·5·5 / 1·1·1 | 3/4 | 13 | 12–14 (13) | no-gaps 8 | 0 (0) | – | 224 | 101 |
| 10 | Zor | solved | 10 | 15 | 5 (3+2) | 3 | 1 | 0 | 0.000 | 12·15·16 / 1·1·2 | 10/10 | 18 | 17–19 (18) | hammer-start 11 | 0 (0) | 0·0 | 559 797 | 24 495 |
<!-- levels:solve:end -->
