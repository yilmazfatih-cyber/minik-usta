# Oyun testi raporu — Bölüm 1–10 (D-099 verisi) ve "Bölümler v3" gerekçesi

Sahip: product-lead · Paket G1 · 2026-11-08 · Yöntem: stüdyo şablonu `playtest-report` (analyze kipi) + `design-review`
(lean) + `balance-check`; rol: game-designer / level-designer / systems-designer. Orkestrasyonlu koşu istisnası:
hedef yollar brifte verildi, onay beklenmeden yazıldı; kararlar aşağıda seçenekleriyle gerekçelendirildi.

## Oturum bilgisi

- **Tarih:** 2026-11-08 · **Yapı:** `wip/phase-2r` @ `cbfe09c` (levels `schemaVersion` 2, solver 3, kurallar 3)
- **Test eden:** product-lead (insan oyuncu değil): her bölümün JSON'u, resmî `npm run levels:solve` çıktısı (kanonik
  çözüm, K-50 ölçütleri, beceri botu vekili ε 0,12) ve `docs/LEVEL_REPORT.md` üzerinden "kâğıt üstünde oynama"
- **Platform / giriş:** mobil dikey, dokunmatik sürükleme (değerlendirme UX_FLOWS / JUICE akışına göre)
- **Oturum tipi:** hedefli test — "neden daha zevkli değil?" (proje sahibi isteği, 2026-11-08)
- **Doğrulama komutu:** `npm run levels:solve` → 10/10 çözüldü, 0 hata, 2 uyarı (`puzzle_greedy_easy` 5 ve 7), 31,7 sn

## Test odağı

Proje sahibinin isteği aynen: "bu stüdyoyu kullanarak 10 bölümü baştan inceleyip bölümlerin tasarımını iyileştirir
misin; daha zevkli tasarımlar üret; üstünde uğraşılabilecek ama zorluğu abartı olmayan; daha iyi görselli bir oyun
mekaniği; daha çok bloğun olduğu bir mekanik; daha farklı şekillerde ve özelliklerde."
Ölçülen sorular: (1) ilk 10 saniyede ne anlaşılıyor, (2) kaç gerçek karar var, (3) "aha" var mı, (4) tekrarlı hamle,
(5) blok sayısı ve çeşitliliği, (6) zorluk hissi ve eğlence (1–5).

## İlk izlenim (ilk 10 saniye, Bölüm 1)

- **Hedef anlaşılıyor mu?** Evet. Panorama + şantiye planı + "bloğu kaldır, duvarı aş, bırak" tek elle okunur.
- **Kontrol anlaşılıyor mu?** Evet (öğretici adım 1 eldiven yolu kanonik hamle 1).
- **Duygu:** "Anladım" → 30 saniye sonra "hep aynı" (bkz. bulgu P1). Bölüm 1 altı hamlede biter; hiçbir hamle düşünmeyi
  istemez (`ahaMin` 0, `greedyWin` 1,00).

## Bölüm bölüm bulgular

Karar = kanonik çözümde en iyi seçeneği 1'den fazla olan ya da yanlış seçeneği olan hamle sayısı (K-50 `choices@k` /
`bestChoices@k`); "zorluk" ve "eğlence" 1–5 product-lead tahminidir (insan testi değil, bkz. "Doğrulanmayanlar").

| # | Blok (şekiller) | min / kazı | İlk 10 sn | Gerçek karar | Aha | Tekrar | Zorluk | Eğlence | Somut sorun |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 6 (O4×2, D2_90×4) | 6 / 0 | kaldır–taşı–indir net | 1 (ilk W ya da Y) | yok | 6 yerleşimin 4'ü aynı yatay domino | 1 | 2 | Plan 4 tek renkli satır; her domino her satıra uyar, sıra önemsiz |
| 2 | 6 (C3×4, D2_90×2) | 6 / 0 | `C3` çifti güzel | 0 (`choices@0` 1) | küçük (çift kilitlenmesi) | düşük | 1 | 2,5 | Açılışta tek oynanabilir hamle; şekil dersi var, karar yok |
| 3 | 7 (O4, D2_90×4, D2_0×2) | 8 / 1 | kazı okunur | 1 | yok | yüksek (yatay domino) | 1,5 | 2 | Tek kazı, sonra 7 yerleşim art arda akar |
| 4 | 8 (**D2_90×8**) | 9 / 1 | geçit net | 1 (ray) | yok | **çok yüksek: 8 blok aynı şekil** | 1,5 | 2 | Bütün bloklar aynı yatay domino; tek fark renk |
| 5 | 8 (D2_90×6, D2_0×2) | 11 / 3 | bekletme görünmez | 2 | var ama gereksiz (açgözlü 1 fazla hamleyle kazanır) | yüksek | 2,5 | 2,5 | `puzzle_greedy_easy`: aha hamle değil yalnız pay belirliyor |
| 6 | 7 (D2_90×5, C3×2) | 9 / 2 | yüksek duvar net | 1 | yok | yüksek | 2 | 2,5 | Her blok vinç alanına kalkar → hareket uzun, düşünce aynı |
| 7 | 7 (D2_90×4, D2_0×2, O4) | 11 / 4 | takas fikri görünmez | 2 | var, ödülsüz (`greedyWin` 1,00) | orta | 2,5 | 3 | En zekice bölüm ama açgözlü oyun da kazanır; oyuncu fikri fark etmez |
| 8 | 7 + Ağır Yük Q9 | 10 / 3 | yük görsel olarak yeni | 1 | yok | orta | 2 | 3 | Yük tek kayışla açılır; Çekiç tanıtımı yük kadar ilginç |
| 9 | 7 (D2_90×6, O4) | 12 / 5 | dar geçit + tıkaç | 2 | var (2 hazırlık) | yüksek | 2,5 | 2,5 | `parkSlack` 0,4: 4 boş hücrede 5 kazı → "kaydır, kaydır" el işi |
| 10 | 7 (D2_90×6, O4) | 13 / 6 | 5 kaydırmadan önce hiçbir yerleşim yok | 0 (13 hamlenin 13'ü zorunlu, `bestChoices` hep 1) | var (1) ama tek yol | çok yüksek (6 kazı art arda, `maxDigRun` 6) | 4 | 2 | Final ödülsüz başlıyor (`firstNeedDepth` 5); tek doğru dizi → ezber; orta bot 0,41 |

### Nicel tablo (10 bölüm toplamı, `levels/*.json`)

| Ölçüt | Bugün | Ne anlatıyor |
|---|---|---|
| Malzeme bloğu | 70 (bölüm başına 6–8) | Bir bölüm 6–13 hamlede biter; "uğraşılacak" kütle yok |
| Yatay domino (`D2_90`) payı | 49 / 70 = %70 | Görsel ve karar tekdüzeliği |
| Şekil türü (bölüm başına) | 1–3 (D2, O4, C3, Q9) | K-44 Hikaye 1 izni yalnız B1, D2, O4, C3 |
| Tek renkli plan satırı | 77 / 80 = %96 | Doğru renkteki her yatay domino her satıra uyar → şekil kararı yok |
| Saha kullanımı | 9/10 bölümde 20 hücre (6×8 = 48 olanak) | Ekranın yarısı boş; "dolu tahta" hissi yok |
| `greedyWin` | 1–9: 1,00 · 10: 0,00 | Eğri ikili: dokuz "düşünmeden kazan" + bir "tek yolu bul" |
| Blok özelliği (bayrak) | 0 | Hiçbir blok başka davranmıyor; görsel çeşitlilik yalnız renk |

## Oyun akışı

### İyi çalışanlar
- İmza hareket (yukarı–aşağı) okunur ve doyurucu; YAO 0,86–1,00.
- Sabit saha (D-099) bilgi gizlemiyor; panorama sonraki katı gösteriyor (adalet ilkesi sağlam).
- `C3` çifti (Bölüm 2, 6) tek gerçek "şekil anı"; oyuncuya "bu ikisi birbirine kilitlenir" dedirtiyor.
- Bütün bölümler çıkmazsız (`deadRate` 0, `complete` evet) ve solver kanıtlı.

### Acı noktaları
- **P1 — Az blok, kısa bölüm (Önem: Yüksek).** 6–8 blok, 6–13 hamle; bölüm "ısınmadan" bitiyor.
- **P2 — Şekil kararı yok (Yüksek).** Tek renkli 2 hücrelik satırlar + yatay domino → her blok yalnız renkle eşleşir.
- **P3 — Aynı hamle kalıbı (Yüksek).** Her bölüm "üstteki yatay dominoyu kenara al, alttakini taşı"; Bölüm 4'te 8/8 aynı şekil.
- **P4 — Zorluk eğrisi ikili (Orta).** 1–9 açgözlü oyunla kazanılıyor, 10 tek doğru diziyle; arada "biraz düşün" bölümü yok.
- **P5 — Final ödülsüz açılıyor (Orta).** Bölüm 10'da ilk yerleşimden önce 5 kaydırma (`firstNeedDepth` 5).
- **P6 — Görsel tekdüzelik (Orta).** Blokların hiçbiri farklı davranmıyor; tek görsel değişken renk.
- **P7 — Saha küçük (Düşük).** 4×5/5×4 saha, telefonda 2 sütunluk şantiyeyle birlikte ekranın alt yarısını boş bırakıyor.

### Kafa karışıklığı noktaları
- Bölüm 5 ve 7'deki "bekletme" ve "takas" fikri oyuncuya görünmüyor; çünkü yanlış oynayan da kazanıyor (ödül/ceza yok).
- Bölüm 9 dar geçidin önündeki tıkaç kazısı küçük sahada "neden kımıldamıyor" sarsıntısı üretiyor (K-09 (a)).

### Keyif anları
- `C3` çiftinin kilitlenmesi (Bölüm 2), Ağır Yük'ün görsel ağırlığı (Bölüm 8), dilim bitince katın kasabaya kayması.

## Hatalar (oynanışı bozan kusurlar)

| # | Tanım | Önem | Tekrarlanır |
|---|---|---|---|
| H1 | **L-11 `untileable` yanlış alarmı (D3a doğrulayıcı).** `tileLevel` (src/core/level/logic.ts) her adımda yalnız **en alçak sütunu** (eşitlikte en soldakini) örter. Çıkıntılı şekillerde (L4_180, J4_180, C3_180, T4) en alçak sütunun hücresini örten blok önce öbür sütunun dolmasını ister (K-34); arama bu sırayı denemediği için çözülebilir planı `dead` sayar. Kanıt: taslak `["WW","WY","WY","GG","YG","YG"]` / `["GY","GY","GG","YW","YW","WW"]` (J4_180 W + D2_0 Y sağ sütunda) → `untileable`; aynı plan sütunları aynalanınca geçerli ve solver çözüyor. Çalışma zamanındaki `tileRemaining` (core/deadlock.ts) aynı yöntemi kullanıyorsa D3a **yanlış Söküm** tetikleyebilir. | Yüksek (yeni şekillerle her bölümü etkiler) | Evet |

Yönlendirme: code-lead (REVIEW_LOG kaydı). Düzeltme önerisi: dallanmayı "en alçak sütun" yerine "alt hücresi bir sütunun
yüksekliğine oturan her blok/konum" üzerinden yap (bellek anahtarı aynı kalır; arama tam olur), ya da en alçak sütunu
örtemeyen durumda öbür sütunlara yerleşimi de dene.

## Bulguların yönlendirilmesi (Phase 3)

| Kova | Bulgu | Gidiş |
|---|---|---|
| Tasarım değişikliği | P1, P2, P3, P6 | Bölümler v3: yeni şekiller (GDD ÖNERİ K-56), 5 blok özelliği (K-57…K-61, OBSTACLES Y9–Y13), 10 bölüm planı (LEVELS §8) |
| Denge ayarı | P4, P5 | v3 zorluk eğrisi ve hamle bütçesi (LEVELS §8.5–§8.6, GDD ÖNERİ K-62): final `firstNeedDepth` ≤ 2, `minMoves` ≤ 20, `ahaMin` ≤ 2 |
| Hata | H1 | code-lead (D3a tamlığı) |
| Cila | P7, keyif anları | design-lead: palet katmanı "pop", makas kesme, +2 uçuşu (JUICE önerisi LEVELS §8.9) |

## Neden "daha zevkli" değil — teşhis (MDA)

1. **Mekanik:** tek eylem (taşı) + tek eşleşme ölçütü (renk). Şekil ve konum kararı veri tarafından siliniyor
   (tek renkli satırlar, %70 yatay domino).
2. **Dinamik:** karar yoğunluğu düşük; 1–9'da en iyi hamle bariz, 10'da tek yol. "Ustalık" eğrisi (SDT yetkinlik) yok:
   oyuncu ilerledikçe öğrendiği bir şeyi kullanmıyor, çünkü öğrendiği şey (kazı) her bölümde aynı.
3. **Estetik:** blok kütlesi küçük, davranış çeşitliliği sıfır; "uğraşı" (puzzle grind) ve "keşif" (yeni blok türü)
   duyguları beslenmiyor. Royal Match/Block Blast dersi: bölüm başına 1 yeni oyuncak, 20+ nesne, her 3–5 bölümde bir
   görsel yenilik.

## Genel değerlendirme

- **Tekrar oynar mı?** Belki (kısa ve temiz, ama 4. bölümden sonra merak düşer).
- **Zorluk:** 1–9 çok kolay, 10 sert ve dar. **Tempo:** çok hızlı/kısa. **Bölüm uzunluğu:** daha uzun istenir (45–75 sn hedefin alt ucu).

## Bu oturumdan ilk 3 öncelik

1. Blok kütlesini artır ve sıkıştır (Palet özelliği; 8 → 16 blok, ekran taşmadan).
2. Şekil kararını geri getir (karışık renkli satırlar, L/J/T/I3 dikey şekiller, iki renkli blok).
3. Eğriyi yumuşat: her bölümde 1 küçük aha, finalde 2; açgözlü oyun 6. bölümden itibaren bütçeyi aşsın, ama tek yol olmasın.

## v3 taslaklarının erken kanıtı (bu pakette ölçüldü)

- **Bölüm 1 v3** (`levels:solve --dir`, taslak): 8 blok (D2_0×4 + D2_90×4), min 8, YAO 1,00, `trapCount` 0, `choices@0` 18
  (best 4), `branch3` 0,50, `greedyWin` 1,00, beceri botu orta 0,99. Durum sayısı **767 033** (5×4 sahada 8 blok): ölçek
  sorunu somut (LEVELS §8.10 U-v3-2).
- **Bölüm 2 v3** (L4/J4; K-44 kilidini aşmak için deneme kimliği 12, Hikaye 2 ile koşuldu): 8 blok, min 8, YAO 1,00,
  `trapCount` 0, 76 593 durum. İlk taslak (J4_180 sol sütunda) H1 hatasına takıldı.
- **Plan düzeyi tuzak denetimi** (product-lead karalama aracı, scratchpad; resmî değil): 10 v3 planının hepsinde bütün
  alttan-üste doğru yerleşim sıralarında ✓-tuzağı 0 (LEVELS §8.10 tablosu). Erişim, palet, sargı ve bonus bu denetime
  girmez; resmî kanıt U-v3 araçlarıyla verilir.

## Doğrulanmayanlar

- İnsan oyuncu testi yapılmadı; zorluk/eğlence puanları tasarımcı tahminidir.
- v3 bölüm 3–10'un saha yerleşimi (gri kutu) ve solver ölçütleri yok: yeni özellikler (palet, iki renk, sargı, bonus)
  çekirdekte ve solver'da yok; ölçüt hedefleri tasarım bandıdır.
- Unity tarafı ve sanat kaplamaları değerlendirilmedi (design-lead / code-lead).
