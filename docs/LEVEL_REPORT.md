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

Üretildi: 2026-11-12 · solver 7 · kurallar 6. Tanımlar GDD K-50; zorunluluklar K-51; hamle bandı K-52.

| # | Zorluk | Durum | N | min | s (dilim) | d | F0 örtü | trap | deadRate | ch@0·1·2 / best | YAO | moves | K-52 bandı (nominal) | varyant | uzay çıkmaz (yakalanan) | teslimat g·f | states | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Kolay (tanıtım) | solved | 8 | 8 | 0 (0+0) | 0 | 0 | 0 | 0.000 | 18·18·16 / 4·4·2 | 8/8 | 12 | 12–14 (12) | – | 0 (0) | – | 767 033 | 36 665 |
| 2 | Kolay | solved | 8 | 8 | 0 (0+0) | 0 | 0 | 0 | 0.000 | 11·12·29 / 1·1·1 | 8/8 | 12 | 12–14 (12) | – | 0 (0) | – | 76 593 | 6 319 |
| 3 | Kolay | solved | – | ≤11 | – | – | – | – | – | – | 9/9 | 15 | 15–17 (15) | – | – | – | 2 004 | 28 968 |
| 4 | Kolay | solved | – | ≤12 | – | – | – | – | – | – | 10/10 | 16 | 16–18 (16) | – | – | – | 2 001 | 32 566 |
| 5 | Normal (tanıtım) | solved | – | ≤14 | – | – | – | – | – | – | 12/12 | 18 | 18–21 (18) | – | – | – | 2 002 | 63 960 |
| 6 | Normal (tanıtım) | solved | – | ≤19 | – | – | – | – | – | – | 17/17 | 23 | 23–26 (23) | – | – | – | 2 001 | 82 790 |
| 7 | Normal (tanıtım) | solved | – | ≤20 | – | – | – | – | – | – | 18/18 | 24 | 24–27 (24) | – | – | – | 2 000 | 92 889 |
| 8 | Normal (tanıtım) | solved | – | ≤20 | – | – | – | – | – | – | 18/18 | 24 | 24–27 (24) | – | – | – | 2 008 | 85 425 |
| 9 | Normal (tanıtım) | solved | – | ≤19 | – | – | – | – | – | – | 17/17 | 23 | 23–26 (23) | – | – | – | 2 000 | 288 132 |
| 10 | Zor | solved | – | ≤21 | – | – | – | – | – | – | 19/19 | 23 | 22–25 (22) | – | – | – | 2 006 | 619 137 |

### D-099 bulmaca zekâsı (GDD K-50 madde 11–19, K-51 madde 6–9)

| # | şema | min | minShifts | firstNeedDepth | maxCover | depLater | crossDeps | carryShifts | parkSlack | forced | trapCount | greedyTrap | greedyExcess | greedyWin | beceri botu a/o/u | ahaMin | branch3 | complete | yakalanmayan çıkmaz | D1 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 8 | 0 | 0 | 3 | 0 | 8 | 0 | – | 4 | 0 | – | 0 | 1.00 | 0.89 / 0.99 / 1.00 | 0 | 0.5 | evet | 0 | 0 |
| 2 | 2 | 8 | 0 | 0 | 3 | 1 | 3 | 0 | – | 6 | 0 | – | 0 | 1.00 | 0.76 / 0.97 / 1.00 | 0 | 0.23 | evet | 0 | 0 |
| 3 | – | solved | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| 4 | – | solved | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| 5 | – | solved | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| 6 | – | solved | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| 7 | – | solved | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| 8 | – | solved | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| 9 | – | solved | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| 10 | – | solved | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |

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
<!-- levels:solve:end -->

## Paket F: bölüm seçici tohumları (levels v3b, 2026-11-09)

Bölüm 3–10 `tools/gen/pick-v3.ts` ile seçildi (belirlenimci; `tools/gen/specs/level_NNN.spec.json`, tohum aşağıda, sonra
`tools/gen/finalize-v3.ts`). Bölüm 1–2 E2'den aynen. Ölçütler yukarıdaki "Bulmaca ölçütleri" tablosundadır; `min` sütunu
büyük bölümlerde `≤` ile bir üst sınırdır ("en iyi bulunan", TECH V3.6).

| # | Tohum (aday) | N | Saha / şantiye / duvar | `best` / alt sınır | `moves` | Özellikler |
|---|---|---|---|---|---|---|
| 3 | 6 (c0) | 9 | 5×5 / 2×5×2 / 4 | 11 / 10 | 15 | O4 (ilk kare blok) |
| 4 | 10 (c2) | 10 | 6×5 / 2×4×3 / 4 | 12 / 11 | 16 | C3 dört yönelim |
| 5 | 4 (c0) | 12 | 6×6 / 2×5×3 / 4 | 14 / 13 | 18 | Y9: 4 iki renkli (D2 ×3, O4) |
| 6 | 30 (c0, 4. tur) | 14 | 6×7 / 2×6×3 / 5 | 16 / 15 | 18 | T4 ilk kez; 1 iki renkli C3 |
| 7 | 7 (c1) | 13 | 6×6 / 2×4×4 / 3 | 14 / 14 (kanıtlı) | 18 | Y11: 2 sargı + makas; 2 iki renkli |
| 8 | 61 (c0, 9. tur) | 14 | 6×7 / 2×6×3 / 5 | 16 / 15 | 20 | Y13: 2 kaygan; I3 ilk kez |
| 9 | 55 (c1, 8. tur) | 14 | 6×7 / 2×6×3 / 4 | 18 / 15 | 22 | Y12: bonus (+2); 4 iki renkli (D2, C3, I3 ×3) |
| 10 | 54 (c0, 8. tur) | 16 | 6×8 / 2×5×4 / 5 | 20 / 17 | 21 | sargı + makas, kaygan, 4 iki renkli (D2 ×3, I3) |

Toplam blok 118 (eski küme 81). Ölü masa kapısı (10 000 yürüyüş): hepsinde tahmin ≤ %0,01. Seçim sırasında elenenler:
3. turda L8–L10 adaylarının yürüyüş kapısı %2,4–%14 verdi (ışının kazanç bulamadığı uçlar; üçüncü kademe bir kısmını çözdü);
"dikkatli oyuncu" (arama sezgisini izleyen) kazanma oranı ≈ 0 olan düzenler (L9 ilk aday) tuzak yoğundu ve atıldı.
