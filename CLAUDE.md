# Natural Clinic — Agent Dashboard — Tasarım & Kapsam Dosyası

> Bu dosya bir kod dosyası değildir. Agent görünümünün **ne göstereceğini**, **nasıl göstereceğini** ve **hangi görsel dile sahip olacağını** tarif eder. Kodlama VSCode'da ayrıca yapılacaktır. Bu doküman, Claude Code dahil herhangi bir kodlama ajanının veya geliştiricinin referans alacağı tek doğruluk kaynağıdır (single source of truth).

---

## 1. PROJE BAĞLAMI

Natural Clinic, İstanbul merkezli bir sağlık turizmi firmasıdır. Telefonla satış yapan danışmanlara **Agent** denir. Her Agent bir **Team Leader**'a, Team Leader'lar bir **Region Manager**'a bağlıdır.

Şirket şu anda Zoho CRM + Zoho Analytics kullanıyor; veriler zaten orada mevcut ama Agent ve Team Leader'lar Zoho Analytics arayüzünü anlamıyor/benimsemiyor. Bu proje, aynı verileri **onların diline uygun, sade, şık, premium hissi veren** bir web arayüzünde sunmak için var.

**Bu doküman yalnızca Agent görünümünü kapsar.** Sıradaki roller (Team Leader, Region Manager, Admin) ayrı dosyalarda, ayrı planlama turlarıyla ele alınacak.

**İlerleyen fazlarda** (bu fazda değil) yapay zeka entegrasyonu yapılacak — sistem veriyi otomatik yorumlayıp Agent'a/TL'ye metinsel öneriler sunacak. Şimdilik kapsam dışı.

---

## 2. TASARIM FELSEFESİ

Agent bu ekranı **günde onlarca kez** açacak. Bu yüzden:

- Zoho Analytics gibi "tablo yığını" değil, **"bugün ne durumdayım / ne yapmalıyım"** hissi veren bir ekran.
- Az sayıda ama doğru grafik; büyük, okunaklı rakamlar.
- **Premium SaaS ürünü** hissi: bol negatif alan (whitespace), yumuşak büyük radius'lu kartlar, yumuşak/renkli gölgeler, sakin bir zemin üzerine 1-2 canlı vurgu rengi, ince ama belirgin mikro-animasyonlar.
- Referans olarak paylaşılan ekran görüntüleri (proje yönetim paneli, satış paneli, fintech paneli) birebir kopyalanmayacak — sadece şu ortak dili işaret ediyorlar: sakin nötr zemin + canlı renkli rozet/kartlar + yuvarlak hatlar + büyük net tipografi + "vs. geçen dönem" küçük değişim etiketleri. Bu dili kendi kimliğimizle (sağlık + çağrı merkezi + Türkçe arayüz) yeniden üretiyoruz.

---

## 3. TASARIM SİSTEMİ (DESIGN TOKENS)

### 3.1 Renk Paleti — açık/koyu tema ikisi de zorunlu, toggle ile geçiş

**Marka vurgu renkleri (her iki temada da aynı mantık, tonlar temaya göre ayarlanır):**

| Rol | Açık Tema | Koyu Tema | Kullanım |
|---|---|---|---|
| Brand Primary (Jade/Teal) | `#0EA98B` | `#15D6AE` | Ana marka rengi, pozitif durum, aktif sekme |
| Brand Secondary (Amber) | `#F5A623` | `#FFB648` | Enerji/uyarı vurgusu, hedef göstergeleri |
| Accent Indigo | `#4F63E8` | `#6C7CFF` | Arama/iletişim verileri |
| Accent Violet | `#7C5CFC` | `#9B7BFF` | Funnel/dönüşüm verileri |

**Semantik durum renkleri (şartnamedeki anlamlarla birebir — bunlar sabittir, değişmez):**

| Durum | Açık Tema | Koyu Tema |
|---|---|---|
| 🟢 Başarılı / Hedefte | `#1FAA6B` | `#34D399` |
| 🟡 Takip edilmeli | `#F0B429` | `#FBBF24` |
| 🟠 Riskli | `#F2994A` | `#FB923C` |
| 🔴 Kritik | `#EB5757` | `#F87171` |
| ⚪ Veri yok / Pasif | `#A0A6BF` | `#6B7290` |

**Açık Tema — nötr zemin:**
- Background: `#F7F8FB` (soğuk, hafif mavimsi kırık beyaz — steril beyaz değil)
- Surface / kart: `#FFFFFF`
- Kart üzeri hover/elevated: `#FFFFFF` + gölge artışı
- Border: `#E7E9F2`
- Text primary: `#12172B`
- Text secondary: `#6B7290`
- Text muted: `#9AA1C0`

**Koyu Tema — nötr zemin:**
- Background: `#0D111C` (lacivert-siyah, saf siyah değil)
- Surface / kart: `#161B2C`
- Kart üzeri elevated: `#1D2338`
- Border: `rgba(255,255,255,0.08)`
- Text primary: `#F4F6FB`
- Text secondary: `#8B93B8`
- Text muted: `#5C6690`

> **Tema geçişi:** Abrupt değil — `background-color`, `color`, `border-color` gibi özelliklerde ~250-300ms `ease` transition. Kullanıcı tercihi tarayıcı hafızasında değil, uygulama state'inde tutulur (artifact/tarayıcı ortamında localStorage kullanılamaz — gerçek üründe backend/kullanıcı profili tercihe göre saklanmalı).

### 3.2 Tipografi

- **Display / başlıklar:** `Space Grotesk` (600-700 ağırlık) — geometrik, karakterli, "dashboard" hissi veren ama şablon değil bir seçim.
- **Gövde metni:** `Inter` (400-500 ağırlık) — okunaklı, nötr, Türkçe karakter desteği iyi.
- **Veri/rakamlar (KPI değerleri, tablo sayıları):** `JetBrains Mono` (500-600 ağırlık) — sayılara "hassas ölçüm" hissi verir, çağrı merkezi/data-dense ekranlarda ayırt edici bir seçim.

Tip ölçeği (öneri):
- KPI büyük değer: 26-32px (mono)
- Panel başlığı: 14-15px (display, 600)
- Gövde/etiket: 12-13px (body)
- Mikro etiket/caption: 10.5-11px (body/mono)

### 3.3 Şekil dili

- Kart radius: **20-24px** (premium/yumuşak his — küçük radius'lar "kurumsal/soğuk" hissi verir, burada istemiyoruz)
- Buton/badge radius: 10-12px (dikdörtgen butonlar), tam pill (999px) sadece durum rozetlerinde
- Gölge: yumuşak, geniş yayılımlı, düşük opasiteli — `0 12px 32px rgba(marka-rengi, 0.10-0.16)` gibi; sert/keskin gölge yok
- Kart border: çok ince (`1px`), yüksek kontrastlı değil — asıl ayrım gölge ve zemin farkıyla yapılır

### 3.4 Hareket / Animasyon Kuralları

Premium his büyük ölçüde **hareketten** gelir — ama abartıya kaçmadan:

1. **Sekme geçişi:** Crossfade + hafif dikey kayma (8-12px), 180-220ms, `ease-out`.
2. **Sayfa/kart yüklenmesi:** Kartlar tek tek değil, **staggered** (birbirini 40-60ms arayla takip eden) fade+rise animasyonla belirir.
3. **KPI rakamları:** Sayfa açıldığında 0'dan gerçek değere **count-up** animasyonu (400-700ms, ease-out). Her sekmeye her girişte değil — ilk yüklemede ve veri değiştiğinde.
4. **Grafikler:** Çizgi/bar grafikler soldan sağa veya alttan yukarı çizilerek belirir (~600-800ms). Gauge/radial göstergeler 0'dan gerçek değere yay çizerek dolar.
5. **Hover:** Kartlarda hafif yükselme (scale 1.01-1.02 + gölge artışı), 150ms — abartılı değil, "dokunulabilir" hissi için yeterli.
6. **Tema toggle:** Anlık değil, yumuşak crossfade (bkz. 3.1).
7. **`prefers-reduced-motion` mutlaka desteklenmeli** — bu tercihi işaretleyen kullanıcılarda tüm giriş/count-up animasyonları anında/sıfır süreye düşer.

> Kural: **Tek yerde cesur ol.** Ana sayfadaki (Bugünüm) günlük funnel şeridi veya hedef gauge'ı "imza an" olabilir — daha zengin bir giriş animasyonu hak eder. Diğer her yer sakin ve disiplinli kalmalı. Her köşede parlayan/dönen efekt = ucuz/yapay zeka hissi.

### 3.5 İkonografi

`lucide-react` seti öneriliyor — ince çizgili (stroke-based), tutarlı köşe yarıçapı olan ikonlar premium/sakin bir his verir. Dolgulu (filled) emoji tarzı ikonlardan kaçının.

---

## 4. AGENT GÖRÜNÜMÜ — BİLGİ MİMARİSİ

### 4.1 Üst Yapı

- Sol üstte marka rozeti (kısaltma + isim)
- Orta/üstte 4 sekmelik yatay menü (aşağıda)
- Sağ üstte: tema toggle (güneş/ay ikonu) + Agent profil çipi (avatar, isim, rol rozeti "Senior/Junior", takım adı)
- Menünün hemen altında ince, canlı bir ayraç/görsel imza öğesi (bkz. Bölüm 6 — "İmza Öğe")

### 4.2 Sekmeler

1. **Bugünüm** — ana sayfa, günlük özet
2. **Aramalarım** — arama/ulaşım detayları
3. **Funnel & Fırsatlarım** — dönüşüm hunisi + aksiyon gerektiren lead'ler
4. **Hedef & Kazancım** — hedef, deal, ödeme, sıralama

Sadece **tarih aralığı** filtresi genel bir üst filtre olarak düşünülebilir (Bugün / Son 7 gün / Son 30 gün / Özel). Agent zaten yalnızca kendi verisini gördüğü için "agent seç" gibi filtrelere gerek yok.

---

### 4.3 Sekme: BUGÜNÜM

**Amaç:** Agent ekranı açtığı anda "bugün nasıl gidiyorum, ne yapmam lazım" sorusuna 3 saniyede cevap bulmalı.

**Üst KPI kartları (6-8 adet, ızgara düzeni):**

| KPI | Açıklama / Kaynak |
|---|---|
| Bugünkü Yeni Lead | Bugün oluşturulan lead sayısı |
| Bugünkü Toplam Arama | Bugün yapılan toplam çağrı |
| Ulaşılan / Ulaşım Oranı | Cevaplanan arama sayısı + oranı |
| Henüz Aranmayan Lead | Bugüne kadar hiç aranmamış, agent'a atanmış lead |
| 15 dk SLA İçinde Aranan | "İlk arama" 15 dakika eşiğine göre uyum oranı (bkz. not) |
| Bugünkü Contact | Bugün Contact'a dönüşen lead sayısı |
| Bugünkü Offer Created | Bugün oluşturulan offer sayısı |
| Bugünkü Deal | Bugün oluşan deal sayısı |

> **SLA notu:** "İlk arama" eşiği **15 dakika** olarak sabitlenmiştir (şartnamedeki 5 dakika standardı bu proje için 15 dakikaya güncellenmiştir). Kart formatı: `x/y` (kaç lead 15dk içinde arandı / toplam yeni lead) + altında % uyum.

**Orta bölüm:**
- **Günlük funnel şeridi** — yatay, 4 aşamalı basit gösterim: Lead → Contact → Offer → Deal, her aşamada büyük rakam + ok. (Bu, Fırsatlarım sekmesindeki büyük/detaylı funnel'ın günlük/mini versiyonudur.)
- **"Bugün yapman gerekenler" aksiyon listesi** — kart/liste formatında, tablo değil. Örnek satırlar: "5 lead henüz aranmadı", "2 offer paylaşılmayı bekliyor", "1 deal için ödeme henüz alınmadı". Her satır renkli durum noktası (🟢🟡🟠🔴) + tıklanınca ilgili detaya gider (ok ikonu ile ima edilir).

**Alt bölüm:**
- **"Takım ortalamana göre durumun"** — Ulaşım Oranı ve SLA Uyumlu Rate için "Sen" vs "Takım Ortalaması" yatay çubuk karşılaştırması. Fark puanı (+/-) renkli olarak gösterilir (pozitif fark yeşil, negatif kırmızı).

---

### 4.4 Sekme: ARAMALARIM

**Amaç:** Agent'ın gün içindeki arama/ulaşım detayına inmesi.

- **Saatlik arama grafiği** (sütun grafik) — günün saatlerine göre (09-18 gibi mesai saatleri) arama yoğunluğu.
- **Bekleme süresi dağılımı** — segmentler: `0-10 dk`, `10-30 dk`, `30dk-2sa`, `2-24sa`, `>24sa`. Yatay bar-liste olarak (her segment ayrı renkte, segment ne kadar kritikse o kadar sıcak renk — yeşilden kırmızıya).
- **SLA Uyumlu Rate** ve **Connection Rate** — iki ayrı **radial gauge** (yarım/tam daire ilerleme göstergesi), hedefe göre renk (yeşil/sarı/turuncu/kırmızı).
- **Callback Listesi** — basit, taranabilir bir liste: kişi adı, telefon, planlanan tarih. Tablo değil, kart-liste (bu ekranda zaten yeterince tablo var; burası nefes alanı olsun).
- **Filtre:** Tarih aralığı (bu sekmede aynı üst filtreyi kullanır).

---

### 4.5 Sekme: FUNNEL & FIRSATLARIM

**Amaç:** Agent'ın elindeki tüm fırsatların (lead'den ödemeye) nerede tıkandığını görmesi + üzerinde hâlâ aksiyon bekleyen kayıtlara ulaşması.

- **Genel funnel** (tüm zamanlar) — Lead → Contact → Offer Created → Offer Shared → Offer Accepted → Deal → Ödeme Alınan. Her aşama azalan genişlikte yatay bar; her barın yanında bir önceki aşamaya göre dönüşüm %'si.
- **3 dönüşüm oranı KPI kartı** — Lead→Contact, Contact→Offer, Offer→Deal. Her biri kendi vurgu rengiyle.
- **Sales Opportunity statü dağılımı** — **donut/pasta grafik değil**, yatay bar-liste tercih edildi çünkü statü sayısı çok (10 civarı) ve biri diğerlerine göre çok baskın olabiliyor — pasta grafikte bu okunmaz hale gelir. Bar-liste her statü için hem adet hem (varsa) tutarı yan yana gösterir.
- **Aksiyon gerektiren lead'ler tablosu** — kolonlar: Öncelik (renkli rozet: Çok Kritik/Kritik/Yüksek/Orta/Normal), Lead adı + telefon, Ülke/Dil, Kaynak, Son arama, Deneme sayısı, Sonuç, Due date, İşlem butonu (örn. "Hemen ara", "Offer paylaş"). Aranabilir/filtrelenebilir olmalı.

---

### 4.6 Sekme: HEDEF & KAZANCIM

**Amaç:** Agent'ın parasal performansını ve takımdaki konumunu görmesi — motivasyon/prim odaklı ekran.

- **Aylık hedef gerçekleşme** — büyük radial gauge (yüzde) + altında "gerçekleşen / hedef · tahmini ay sonu" satırı (mono font, € formatında).
- **Aylık satış trendi** — çizgi grafik, son 6 ay, iki çizgi: gerçekleşen (canlı renk, kalın) vs hedef (kesikli, nötr gri).
- **3 KPI kartı** — Mevcut Deal Amount, Mevcut Paid Amount, Mevcut Refund (Refund kritik/kırmızı vurgulu, diğerleri pozitif tonlarda).
- **Payment durum dağılımı** — Confirmed / Waiting / Rejected, yatay bar-liste (donut değil, yine tutarlılık için — az kategori olsa da tüm uygulamada tek bir "dağılım gösterme dili" kullanmak daha temiz).
- **Rank kartı** — büyük "#N / toplam agent" gösterimi + Genel Başarı puanı + takım adı. Agent yalnızca kendi sırasını görür, tüm listeyi görmez (bu bilgi Team Leader ekranında herkese açık olacak).

---

## 5. VERİ MODELİ NOTLARI (ileride backend bağlanınca)

Bu doküman mock veri aşaması için yazıldı ama gerçek veriye geçişte şu alanların Zoho CRM/Analytics tarafında karşılığı netleştirilmeli (bkz. ana şartname dosyasındaki Ek B — Açık Sorular):

- "Ulaşıldı" tanımı hangi çağrı sonuç kodlarıyla belirlenecek (answered dışında connected/interested kodları)
- 15 dakikalık SLA hesaplaması: Lead `Created Time` ile ilk çağrı zaman damgası arasındaki fark
- Due Date alanı Lead ve/veya Deal modülünde mi
- Sales Opportunity statüleri ana şartnamedeki Bölüm 5 modül statüleriyle birebir eşleşmeli (New Sales Opportunity, Consultation In Progress/Completed, Approval Process, Not Approved, Offer Created/Shared/Accepted, Willing to Close, Senior Sales Recycle, Sales Order Failed, Returning Contact)

Mock veri üretirken kullanılan referans profil: **Callum Ashford** (Senior, Aamir Ali Team, İstanbul, başlangıç 10 Kas 2025) — Zoho Analytics ekran görüntülerindeki gerçek oranlara paralel üretilmiştir (Connection Rate ~%43, SLA Uyumlu Rate ~%86,5, Genel Başarı 72,88 puan, takımda 4. sıra).

---

## 6. İMZA ÖĞE (SIGNATURE ELEMENT)

Üst menünün hemen altında, ince bir **nabız/EKG çizgisi** — sürekli akan, yumuşak bir animasyonla soldan sağa "atan" bir çizgi motifi. Gerekçe: hem "canlı" kelimesinin iki anlamına (canlı renk + canlı/nabız) hem de kliniğin sağlık kimliğine gönderme yapıyor. Bu, sayfanın geri kalanının sakin kalmasını meşrulaştıran tek "cesur" detay olmalı — başka hiçbir yerde bu tarz dekoratif hareket tekrarlanmamalı.

---

## 7. ERİŞİLEBİLİRLİK VE KALİTE TABANI

- Mobilde (dar ekran) KPI ızgarası 2 sütuna, grafik panelleri tek sütuna düşmeli.
- Klavye ile gezinilebilir olmalı, focus durumu görünür olmalı (outline kaldırılmamalı, tema rengine uyarlanmalı).
- `prefers-reduced-motion` desteklenmeli (bkz. 3.4).
- Boş/veri yok durumları sessizce boş bırakılmamalı — "Bugün için henüz veri yok" gibi durumun kendi diliyle konuşan, yönlendirici bir boş durum metni olmalı.
- Açık ve koyu temada da metin/zemin kontrastı en az AA seviyesinde olmalı.

---

## 8. TEKNİK YIĞIN

- **Framework: Next.js (App Router)** — proje bu framework üzerine kurulacak (kesinleşti)
- Grafikler: `recharts` (bar/line/radial için yeterli ve hafif)
- İkon: `lucide-react`
- Animasyon: `framer-motion` (sayfa/kart giriş animasyonları ve stagger için)
- Fontlar: Google Fonts üzerinden `Space Grotesk`, `Inter`, `JetBrains Mono` (Next.js'in `next/font` mekanizmasıyla optimize edilerek yüklenmeli)
- Tema (açık/koyu) state'i: şimdilik client-side (React context/state) yeterli; ileride kullanıcı bazlı kalıcı tercih backend'e taşınabilir

---

## 9. SONRAKİ ADIMLAR

Bu doküman yalnızca **Agent** görünümünü kapsar. Sıradaki adımlar (ayrı planlama turları ve ayrı dosyalarla):

1. Team Leader görünümü — kapsam kararları zaten alındı (5 sekme: Takım Özeti, Agent Karşılaştırması, Saatlik Aktivite, Funnel & Backlog, Aksiyon Merkezi; agent karşılaştırması Best 5/Worst 5 + detay tablo; saatlik aktivite ısı haritası ile) — bu roller için de ayrı bir `CLAUDE-team-leader.md` benzeri doküman hazırlanabilir.
2. Region Manager görünümü
3. Admin / Satış Operasyonları görünümü
4. (İleri faz) Yapay zeka entegrasyonu — veri yorumlama katmanı

---

## 10. CLAUDE CODE ÇALIŞMA KURALLARI

Bu bölüm, bu projede kod yazacak herhangi bir Claude Code oturumu için bağlayıcıdır.

1. **Kod Değişikliği Prensibi:** Bir dosyayı asla tamamen silip baştan yazma. Sadece değişmesi gereken satırları bul ve orayı düzenle.
2. **Düşünme Süreci:** Kodu yazmadan önce "şöyle bir yol izleyeceğim, şu dosyaları değiştireceğim" diye özet geç. Onay verilmeden koda başlama.
3. **Okuma Zorunluluğu:** Bir dosyada değişiklik yapmadan önce mutlaka dosyanın en güncel halini oku. Ezberden kod yazma.
4. **Hata Yönetimi:** Try-catch bloklarını asla boş bırakma. Konsola detaylı hata logları bas.
5. **Modülerlik:** Kodu tek bir devasa dosyaya yığma. Parçalara böl (DRY prensibi).
