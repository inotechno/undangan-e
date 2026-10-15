import { invitationConfigSchema, type InvitationConfig, type SectionId, type ThemeTokens } from "./types";
import { FONT_PAIRS, type FontPairId } from "./theme";

export interface TemplateDefinition {
  slug: string;
  name: string;
  category: string;
  description: string;
  signature: string;
  layout: "full_bleed" | "curtain" | "frame_device" | "slider" | "paper";
  previewImage: string;
  defaultTheme: Partial<ThemeTokens>;
  fontPair: FontPairId;
  defaultSections: Partial<Record<SectionId, boolean>>;
  /** Konfigurasi cover default (opsional). */
  defaultCover?: InvitationConfig["cover"];
  demo: InvitationConfig;
}

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const BASE_SECTIONS: Partial<Record<SectionId, boolean>> = {
  cover: true,
  couple: true,
  countdown: true,
  event_info: true,
  schedule_maps: true,
  story: true,
  gallery: true,
  gift: true,
  rsvp: true,
  guestbook: true,
  wishes_list: true,
  qr_pass: true,
  closing: true,
  music_player: true,
};

/** Trek demo bebas-royalti untuk preview template (bukan bagian konfigurasi user). */
const DEMO_MUSIC_TRACK = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

function demoConfig(input: {
  type?: InvitationConfig["event"]["type"];
  couple?: {
    brideName: string;
    groomName: string;
    brideParents?: string;
    groomParents?: string;
    hashtag?: string;
  };
  celebrant?: { name: string; age?: number };
  host?: { name: string; role?: string };
  date: string;
  photo: string;
  story: InvitationConfig["story"];
  gallery: InvitationConfig["gallery"];
  schedules: InvitationConfig["event"]["schedules"];
  seoTitle: string;
  seoDescription: string;
  gift?: boolean;
  giftAccounts?: InvitationConfig["gift"]["accounts"];
}): InvitationConfig {
  const firstName = (full: string) => full.replace(/\s.*/, "");
  return invitationConfigSchema.parse({
    seo: { title: input.seoTitle, description: input.seoDescription, coverImage: input.photo },
    event: {
      type: input.type ?? "pernikahan",
      date: input.date,
      photo: input.photo,
      couple: input.couple
        ? {
            brideName: input.couple.brideName,
            groomName: input.couple.groomName,
            brideParents: input.couple.brideParents,
            groomParents: input.couple.groomParents,
            hashtag: input.couple.hashtag,
          }
        : undefined,
      celebrant: input.celebrant,
      host: input.host,
      schedules: input.schedules,
    },
    story: input.story,
    gallery: input.gallery,
    gift: {
      enabled: input.gift ?? true,
      instructions:
        "Tanpa memberi hadiah? Doa restu Anda adalah hadiah terindah. Jika ingin memberi tanda kasih, dapat ditransfer ke:",
      accounts:
        input.giftAccounts ??
        (input.couple
          ? [
              { bank: "BCA", number: "1234567890", holder: firstName(input.couple.brideName) },
              { bank: "Dana", number: "081234567890", holder: firstName(input.couple.groomName) },
            ]
          : []),
    },
    music: { enabled: true, autoplayAfterOpen: true, track: DEMO_MUSIC_TRACK },
    sections: BASE_SECTIONS,
  });
}

export const TEMPLATE_REGISTRY: Record<string, TemplateDefinition> = {
  "siraman-floral": {
    slug: "siraman-floral",
    name: "Siraman Floral",
    category: "Pernikahan",
    description:
      "Kelopak bunga jatuh, ornamen floral, dan palet blush lembut untuk pernikahan romantis.",
    signature: "Kelopak jatuh, ornamen floral SVG, palet blush",
    layout: "curtain",
    previewImage: "/templates/siraman-floral.png",
    fontPair: "serif",
    defaultTheme: {
      palette: {
        bg: "#FFF7F5",
        surface: "#FFFFFF",
        text: "#4A3A3C",
        accent: "#D98A96",
        accentSoft: "#F9E4E7",
      },
      fonts: FONT_PAIRS.serif,
      radius: 20,
      decorations: "floral",
      motion: "soft",
      particles: "petals",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      couple: {
        brideName: "Dinda Ayu Lestari",
        groomName: "Raka Pratama",
        brideParents: "Putri dari Bapak H. Surya & Ibu Hj. Melati",
        groomParents: "Putra dari Bapak H. Bambang & Ibu Hj. Ratna",
        hashtag: "#DindaRaka2026",
      },
      date: "2026-12-12T08:00:00+07:00",
      photo: img("photo-1519741497674-611481863552"),
      seoTitle: "Undangan Pernikahan Dinda & Raka - 12 Desember 2026",
      seoDescription:
        "Undangan pernikahan Dinda Ayu Lestari & Raka Pratama, Sabtu 12 Desember 2026 di Bandung. Saksikan rangkaian acara dan kirimkan doa restu.",
      schedules: [
        {
          title: "Akad Nikah",
          start: "2026-12-12T08:00:00+07:00",
          end: "2026-12-12T10:00:00+07:00",
          venue: "Masjid Al-Ikhlas",
          address: "Jl. Cihampelas No. 12, Bandung",
          mapUrl: "https://maps.google.com/?q=Masjid+Al-Ikhlas+Bandung",
        },
        {
          title: "Resepsi",
          start: "2026-12-12T11:00:00+07:00",
          end: "2026-12-12T14:00:00+07:00",
          venue: "Grand Ballroom Sasana Budaya",
          address: "Jl. Citra Indah No. 8, Bandung",
          mapUrl: "https://maps.google.com/?q=Sasana+Budaya+Bandung",
        },
      ],
      story: [
        {
          year: "2019",
          title: "Pertama Bertemu",
          text: "Berawal dari satu kelompok diskusi di kampus, obrolan sederhana berubah menjadi kebiasaan yang tak pernah absen.",
          image: img("photo-1522673607200-164d1b6ce486", 800),
        },
        {
          year: "2023",
          title: "Lamaran",
          text: "Di bawah hujan bulan Desember, sebuah pertanyaan sederhana dijawab dengan satu kata: iya.",
          image: img("photo-1465495976277-4387d4b0b4c6", 800),
        },
        {
          year: "2026",
          title: "Hari Bahagia",
          text: "Kami menikah bersama doa orang tua, sahabat, dan Anda yang berkenan hadir.",
          image: img("photo-1511285560929-80b456fea0bc", 800),
        },
      ],
      gallery: [
        { image: img("photo-1519225421980-715cb0215aed", 900), caption: "Sesi prewedding" },
        { image: img("photo-1487530811176-3780de880c2d", 900), caption: "Garden party" },
        { image: img("photo-1478146896981-b80fe463b330", 900), caption: "Senja berdua" },
        { image: img("photo-1464366400600-7168b8af9bc3", 900), caption: "Outdoor session" },
      ],
    }),
  },
  "modern-minimal": {
    slug: "modern-minimal",
    name: "Modern Minimal",
    category: "Pernikahan",
    description:
      "Tipografi besar, whitespace lega, dan nuansa monokrom untuk pasangan yang modern.",
    signature: "Tipografi besar, whitespace, monokrom + aksen",
    layout: "full_bleed",
    previewImage: "/templates/modern-minimal.png",
    fontPair: "jakarta",
    defaultTheme: {
      palette: {
        bg: "#FAFAF9",
        surface: "#FFFFFF",
        text: "#1C1917",
        accent: "#111827",
        accentSoft: "#EDEDED",
      },
      fonts: FONT_PAIRS.jakarta,
      radius: 4,
      decorations: "none",
      motion: "elegant",
      particles: "none",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      couple: {
        brideName: "Ayu Kartika",
        groomName: "Pratama Wijaya",
        brideParents: "Putri dari Bapak Darmawan & Ibu Sri",
        groomParents: "Putra dari Bapak Halomoan & Ibu Endang",
        hashtag: "#Ayupratama",
      },
      date: "2026-11-08T09:00:00+07:00",
      photo: img("photo-1511285560929-80b456fea0bc"),
      seoTitle: "Undangan Pernikahan Ayu & Pratama - 8 November 2026",
      seoDescription:
        "Undangan pernikahan Ayu Kartika & Pratama Wijaya, Minggu 8 November 2026 di Jakarta. Desain minimal, informasi lengkap.",
      schedules: [
        {
          title: "Akad Nikah",
          start: "2026-11-08T09:00:00+07:00",
          venue: "Kantor Urusan Agama Jakarta Selatan",
          address: "Jl. Warung Buncit Raya, Jakarta",
          mapUrl: "https://maps.google.com/?q=KUA+Jakarta+Selatan",
        },
        {
          title: "Resepsi",
          start: "2026-11-08T18:30:00+07:00",
          venue: "The Glass House",
          address: "Jl. Ampera Raya, Jakarta",
          mapUrl: "https://maps.google.com/?q=The+Glass+House+Jakarta",
        },
      ],
      story: [
        {
          year: "2021",
          title: "Bertemu",
          text: "Satu proyek kerja, dua gelas kopi, dan percakapan yang tak pernah selesai.",
          image: img("photo-1522673607200-164d1b6ce486", 800),
        },
        {
          year: "2025",
          title: "Satu Pertanyaan",
          text: "Di apartemen yang sama-sama kami bangun, kami memutuskan membangun segalanya bersama.",
          image: img("photo-1487530811176-3780de880c2d", 800),
        },
      ],
      gallery: [
        { image: img("photo-1519225421980-715cb0215aed", 900), caption: "Studio" },
        { image: img("photo-1478146896981-b80fe463b330", 900), caption: "City walk" },
        { image: img("photo-1465495976277-4387d4b0b4c6", 900), caption: "Weekend" },
      ],
    }),
  },
  "royal-gold": {
    slug: "royal-gold",
    name: "Royal Gold",
    category: "Pernikahan",
    description:
      "Emas doff, bingkai ornamen, dan reveal lambat untuk kesan megah yang kalem.",
    signature: "Emas-doff, frame ornament, reveal lambat",
    layout: "full_bleed",
    previewImage: "/templates/royal-gold.png",
    fontPair: "serif",
    defaultTheme: {
      palette: {
        bg: "#FBF8F1",
        surface: "#FFFFFF",
        text: "#3A2E1E",
        accent: "#A67C2E",
        accentSoft: "#F3E9D6",
      },
      fonts: FONT_PAIRS.serif,
      radius: 8,
      decorations: "ornament",
      motion: "elegant",
      particles: "sparkles",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      couple: {
        brideName: "Nadia Zahra",
        groomName: "Farhan Abdillah",
        brideParents: "Putri dari Bapak Ahmad & Ibu Fatimah",
        groomParents: "Putra dari Bapak Yusuf & Ibu Aminah",
        hashtag: "#NadiaFarhan",
      },
      date: "2026-12-05T09:00:00+07:00",
      photo: img("photo-1519225421980-715cb0215aed"),
      seoTitle: "Undangan Pernikahan Nadia & Farhan - 5 Desember 2026",
      seoDescription:
        "Undangan pernikahan Nadia Zahra & Farhan Abdillah, Sabtu 5 Desember 2026 di Surabaya, dengan nuansa royal gold elegan.",
      schedules: [
        {
          title: "Akad Nikah",
          start: "2026-12-05T09:00:00+07:00",
          venue: "Masjid Nasional Al-Akbar",
          address: "Jl. Nginden Intan Barat, Surabaya",
          mapUrl: "https://maps.google.com/?q=Masjid+Al+Akbar+Surabaya",
        },
        {
          title: "Resepsi",
          start: "2026-12-05T18:00:00+07:00",
          venue: "Hotel Majapahit Ballroom",
          address: "Jl. Tunjungan, Surabaya",
          mapUrl: "https://maps.google.com/?q=Hotel+Majapahit+Surabaya",
        },
      ],
      story: [
        {
          year: "2018",
          title: "Sahabat Lama",
          text: "Berteman sejak SMA, jalur hidup kami kembali beririsan setelah sepuluh tahun.",
          image: img("photo-1522673607200-164d1b6ce486", 800),
        },
        {
          year: "2026",
          title: "Menikah",
          text: "Dengan restu keluarga besar, kami memulai babak baru.",
          image: img("photo-1519741497674-611481863552", 800),
        },
      ],
      gallery: [
        { image: img("photo-1519741497674-611481863552", 900), caption: "Akad" },
        { image: img("photo-1465495976277-4387d4b0b4c6", 900), caption: "Resepsi" },
        { image: img("photo-1487530811176-3780de880c2d", 900), caption: "Keluarga" },
      ],
    }),
  },
  "rustic-outdoor": {
    slug: "rustic-outdoor",
    name: "Rustic Outdoor",
    category: "Pernikahan",
    description:
      "Foto alam, tekstur kertas hangat, dan parallax lembut untuk pernikahan outdoor.",
    signature: "Foto alam, tekstur kertas, parallax",
    layout: "full_bleed",
    previewImage: "/templates/rustic-outdoor.png",
    fontPair: "serif",
    defaultTheme: {
      palette: {
        bg: "#F7F3EC",
        surface: "#FFFDF8",
        text: "#3B3A33",
        accent: "#6B7A4F",
        accentSoft: "#E7EADB",
      },
      fonts: FONT_PAIRS.serif,
      radius: 6,
      decorations: "floral",
      motion: "soft",
      particles: "bokeh",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      couple: {
        brideName: "Salsabila Putri",
        groomName: "Bima Aditya",
        brideParents: "Putri dari Bapak Rudi & Ibu Yanti",
        groomParents: "Putra dari Bapak Hendra & Ibu Lina",
        hashtag: "#SalsaBima",
      },
      date: "2027-09-26T10:00:00+07:00",
      photo: img("photo-1464366400600-7168b8af9bc3"),
      seoTitle: "Undangan Pernikahan Salsabila & Bima - 26 September 2027",
      seoDescription:
        "Undangan pernikahan outdoor Salsabila Putri & Bima Aditya, Minggu 26 September 2027 di Lembang, Bandung.",
      schedules: [
        {
          title: "Akad Nikah",
          start: "2027-09-26T09:00:00+07:00",
          venue: "Kebun Teh Lembang",
          address: "Jl. Raya Lembang, Bandung",
          mapUrl: "https://maps.google.com/?q=Lembang+Bandung",
        },
        {
          title: "Resepsi Outdoor",
          start: "2027-09-26T15:00:00+07:00",
          venue: "Rustic Garden Venue",
          address: "Jl. Kolonel Masturi, Bandung",
          mapUrl: "https://maps.google.com/?q=Kolonel+Masturi+Bandung",
        },
      ],
      story: [
        {
          year: "2020",
          title: "Trekking Pertama",
          text: "Satu pendakian singkat yang berubah jadi kebiasaan akhir pekan.",
          image: img("photo-1487530811176-3780de880c2d", 800),
        },
        {
          year: "2026",
          title: "Janji di Alam",
          text: "Kami memilih menikah di tempat pertama kali belajar berjalan berdua.",
          image: img("photo-1464366400600-7168b8af9bc3", 800),
        },
      ],
      gallery: [
        { image: img("photo-1464366400600-7168b8af9bc3", 900), caption: "Venue" },
        { image: img("photo-1487530811176-3780de880c2d", 900), caption: "Senja" },
        { image: img("photo-1478146896981-b80fe463b330", 900), caption: "Berdua" },
      ],
    }),
  },
  "islamic-geometric": {
    slug: "islamic-geometric",
    name: "Islamic Geometric",
    category: "Pernikahan",
    description:
      "Pola geometri islami, kaligrafi pembuka, dan bingkai perangkat yang khas.",
    signature: "Pola geometri islami, kaligrafi pembuka",
    layout: "frame_device",
    previewImage: "/templates/islamic-geometric.png",
    fontPair: "serif",
    defaultTheme: {
      palette: {
        bg: "#F6FAF9",
        surface: "#FFFFFF",
        text: "#22312F",
        accent: "#0E7C6B",
        accentSoft: "#DDF0EC",
      },
      fonts: FONT_PAIRS.serif,
      radius: 12,
      decorations: "geometric",
      motion: "elegant",
      particles: "sparkles",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      couple: {
        brideName: "Fatimah Azzahra",
        groomName: "Umar Hanif",
        brideParents: "Putri dari Bapak Abdul & Ibu Khadijah",
        groomParents: "Putra dari Bapak Ismail & Ibu Hajar",
        hashtag: "#FatimahUmar",
      },
      date: "2026-10-18T08:00:00+07:00",
      photo: img("photo-1584551246679-0daf3d275d0f"),
      seoTitle: "Undangan Pernikahan Fatimah & Umar - 18 Oktober 2026",
      seoDescription:
        "Undangan pernikahan Fatimah Azzahra & Umar Hanif, Minggu 18 Oktober 2026 di Yogyakarta, dengan nuansa geometri islami.",
      schedules: [
        {
          title: "Akad Nikah",
          start: "2026-10-18T08:00:00+07:00",
          venue: "Masjid Gede Kauman",
          address: "Alun-Alun Utara, Yogyakarta",
          mapUrl: "https://maps.google.com/?q=Masjid+Kauman+Yogyakarta",
        },
        {
          title: "Walimah",
          start: "2026-10-18T11:00:00+07:00",
          venue: "Gedung Serbaguna DIY",
          address: "Jl. Malioboro, Yogyakarta",
          mapUrl: "https://maps.google.com/?q=Malioboro+Yogyakarta",
        },
      ],
      story: [
        {
          year: "2022",
          title: "Pengajian Kampus",
          text: "Berawal dari satu halaqah, kami belajar saling menguatkan.",
          image: img("photo-1522673607200-164d1b6ce486", 800),
        },
        {
          year: "2026",
          title: "Sakinah",
          text: "Semoga rumah kami menjadi tempat tenang bagi keduanya.",
          image: img("photo-1584551246679-0daf3d275d0f", 800),
        },
      ],
      gallery: [
        { image: img("photo-1584551246679-0daf3d275d0f", 900), caption: "Prewedding" },
        { image: img("photo-1465495976277-4387d4b0b4c6", 900), caption: "Keluarga" },
        { image: img("photo-1519225421980-715cb0215aed", 900), caption: "Resepsi" },
      ],
    }),
  },
  "pastel-garden": {
    slug: "pastel-garden",
    name: "Pastel Garden",
    category: "Pernikahan",
    description:
      "Taman pastel, kupu-kupu animasi, dan gorden pembuka yang manis untuk pernikahan.",
    signature: "Taman pastel, kupu animasi",
    layout: "curtain",
    previewImage: "/templates/pastel-garden.png",
    fontPair: "montserrat",
    defaultTheme: {
      palette: {
        bg: "#F4FAF5",
        surface: "#FFFFFF",
        text: "#44514A",
        accent: "#7FA98B",
        accentSoft: "#E6F2E9",
      },
      fonts: FONT_PAIRS.montserrat,
      radius: 24,
      decorations: "floral",
      motion: "playful",
      particles: "butterflies",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      couple: {
        brideName: "Kirana Maharani",
        groomName: "Galih Saputra",
        brideParents: "Putri dari Bapak Budi & Ibu Ratna",
        groomParents: "Putra dari Bapak Surya & Ibu Marni",
        hashtag: "#KiranaGalih",
      },
      date: "2027-08-30T09:00:00+07:00",
      photo: img("photo-1526047932273-341f2a7631f9"),
      seoTitle: "Undangan Pernikahan Kirana & Galih - 30 Agustus 2027",
      seoDescription:
        "Undangan pernikahan Kirana Maharani & Galih Saputra, Senin 30 Agustus 2027 di Semarang, nuansa taman pastel.",
      schedules: [
        {
          title: "Akad Nikah",
          start: "2027-08-30T08:00:00+07:00",
          venue: "Masjid Agung Semarang",
          address: "Jl. Imam Bonjol, Semarang",
          mapUrl: "https://maps.google.com/?q=Masjid+Agung+Semarang",
        },
        {
          title: "Resepsi",
          start: "2027-08-30T11:00:00+07:00",
          venue: "Garden Pavilion Semarang",
          address: "Jl. Pemuda, Semarang",
          mapUrl: "https://maps.google.com/?q=Semarang",
        },
      ],
      story: [
        {
          year: "2021",
          title: "Ketemu di Taman",
          text: "Ketika sama-sama melihara tanaman dan sering bertukar bibit.",
          image: img("photo-1478146896981-b80fe463b330", 800),
        },
        {
          year: "2026",
          title: "Berkebun Berdua",
          text: "Kini kami menanam taman yang sama di rumah baru kami.",
          image: img("photo-1526047932273-341f2a7631f9", 800),
        },
      ],
      gallery: [
        { image: img("photo-1526047932273-341f2a7631f9", 900), caption: "Taman" },
        { image: img("photo-1478146896981-b80fe463b330", 900), caption: "Bunga" },
        { image: img("photo-1511285560929-80b456fea0bc", 900), caption: "Berdua" },
      ],
    }),
  },
  "rose-quartz": {
    slug: "rose-quartz",
    name: "Rose Quartz",
    category: "Tunangan",
    description:
      "Nuansa merah muda lembut, kelopak mawar jatuh, dan gorden pembuka untuk hari pertunangan.",
    signature: "Kelopak mawar jatuh, palet blush, gorden pembuka",
    layout: "curtain",
    previewImage: "/templates/rose-quartz.png",
    fontPair: "serif",
    defaultTheme: {
      palette: {
        bg: "#FFF5F7",
        surface: "#FFFFFF",
        text: "#5C3A45",
        accent: "#D4788C",
        accentSoft: "#FBE3E9",
      },
      fonts: FONT_PAIRS.serif,
      radius: 18,
      decorations: "floral",
      motion: "soft",
      particles: "petals",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      type: "tunangan",
      couple: {
        brideName: "Anindya Sari Rahman",
        groomName: "Reza Alfarizi",
        brideParents: "Putri dari Bapak Hendra & Ibu Mira",
        groomParents: "Putra dari Bapak Yoga & Ibu Sinta",
        hashtag: "#AninReza",
      },
      date: "2026-11-14T10:00:00+07:00",
      photo: img("photo-1522673607200-164d1b6ce486"),
      seoTitle: "Undangan Tunangan Anindya & Reza - 14 November 2026",
      seoDescription:
        "Undangan pertunangan Anindya Sari Rahman & Reza Alfarizi, Sabtu 14 November 2026 di Jakarta.",
      schedules: [
        {
          title: "Akad Pertunangan",
          start: "2026-11-14T10:00:00+07:00",
          end: "2026-11-14T12:00:00+07:00",
          venue: "Kediaman Keluarga Besar",
          address: "Jl. Kemang Raya No. 8, Jakarta Selatan",
          mapUrl: "https://maps.google.com/?q=Kemang+Jakarta",
        },
      ],
      story: [
        {
          year: "2022",
          title: "Berkenalan",
          text: "Satu proyek bersama di kantor berubah menjadi obrolan larut malam.",
          image: img("photo-1519741497674-611481863552", 800),
        },
        {
          year: "2026",
          title: "Lamaran",
          text: "Dengan restu kedua keluarga, kami mengikat niat baik dalam adat sederhana.",
          image: img("photo-1465495976277-4387d4b0b4c6", 800),
        },
      ],
      gallery: [
        { image: img("photo-1519741497674-611481863552", 900), caption: "Sesi pertunangan" },
        { image: img("photo-1478146896981-b80fe463b330", 900), caption: "Berdua" },
        { image: img("photo-1465495976277-4387d4b0b4c6", 900), caption: "Keluarga" },
      ],
    }),
  },
  "midnight-velvet": {
    slug: "midnight-velvet",
    name: "Midnight Velvet",
    category: "Tunangan",
    description:
      "Tema malam biru tua dengan taburan bintang keemasan untuk kesan mewah dan intim.",
    signature: "Langit malam, sparkle emas, palet gelap",
    layout: "full_bleed",
    previewImage: "/templates/midnight-velvet.png",
    fontPair: "serif",
    defaultTheme: {
      palette: {
        bg: "#0F172A",
        surface: "#1E293B",
        text: "#E2E8F0",
        accent: "#D4AF37",
        accentSoft: "#334155",
      },
      fonts: FONT_PAIRS.serif,
      radius: 10,
      decorations: "ornament",
      motion: "elegant",
      particles: "sparkles",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      type: "tunangan",
      couple: {
        brideName: "Nabila Putri Ayu",
        groomName: "Dimas Arya Prayoga",
        brideParents: "Putri dari Bapak Rizal & Ibu Amanda",
        groomParents: "Putra dari Bapak Fajar & Ibu Winda",
        hashtag: "#NabilaDimas",
      },
      date: "2027-02-20T19:00:00+07:00",
      photo: img("photo-1519225421980-715cb0215aed"),
      seoTitle: "Undangan Tunangan Nabila & Dimas - 20 Februari 2027",
      seoDescription:
        "Malam pertunangan Nabila Putri Ayu & Dimas Arya Prayoga, Sabtu 20 Februari 2027 di Bandung.",
      schedules: [
        {
          title: "Malam Resepsi Tunangan",
          start: "2027-02-20T19:00:00+07:00",
          end: "2027-02-20T22:00:00+07:00",
          venue: "The Langham Ballroom",
          address: "Jl. Asia Afrika No. 8, Bandung",
          mapUrl: "https://maps.google.com/?q=The+Langham+Bandung",
        },
      ],
      story: [
        {
          year: "2021",
          title: "Sahabat Sekampus",
          text: "Berawal dari organisasi yang sama, persahabatan tumbuh perlahan menjadi lebih.",
          image: img("photo-1522673607200-164d1b6ce486", 800),
        },
        {
          year: "2026",
          title: "Bintang yang Sama",
          text: "Di malam yang tenang, sebuah pertanyaan dijawab dengan senyum dan 'iya'.",
          image: img("photo-1519225421980-715cb0215aed", 800),
        },
      ],
      gallery: [
        { image: img("photo-1519225421980-715cb0215aed", 900), caption: "Malam keakraban" },
        { image: img("photo-1511795409834-ef04bbd61622", 900), caption: "Perayaan" },
        { image: img("photo-1478146896981-b80fe463b330", 900), caption: "Senja berdua" },
      ],
    }),
  },
  "candy-confetti": {
    slug: "candy-confetti",
    name: "Candy Confetti",
    category: "Ulang Tahun",
    description:
      "Confetti jatuh warna-warni, balon, dan tipografi ceria untuk pesta ulang tahun meriah.",
    signature: "Confetti jatuh, balon, palet permen",
    layout: "full_bleed",
    previewImage: "/templates/candy-confetti.png",
    fontPair: "montserrat",
    defaultTheme: {
      palette: {
        bg: "#FFF8F1",
        surface: "#FFFFFF",
        text: "#4A2E1C",
        accent: "#F97316",
        accentSoft: "#FFE8D1",
      },
      fonts: FONT_PAIRS.montserrat,
      radius: 20,
      decorations: "none",
      motion: "playful",
      particles: "confetti",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      type: "ulang-tahun",
      celebrant: { name: "Kiara Azzahra", age: 7 },
      host: { name: "Bapak Doni & Ibu Ratri", role: "Orang tua Kiara" },
      date: "2026-12-20T15:00:00+07:00",
      photo: img("photo-1530103862676-de8c9debad1d"),
      seoTitle: "Pesta Ulang Tahun Kiara Azzahra ke-7",
      seoDescription:
        "Undangan ulang tahun Kiara Azzahra yang ke-7, Sabtu 20 Desember 2026 di Bogor. Ayo hadir dan beri kejutan!",
      schedules: [
        {
          title: "Pesta Ulang Tahun",
          start: "2026-12-20T15:00:00+07:00",
          end: "2026-12-20T18:00:00+07:00",
          venue: "Taman Bermain Ceria",
          address: "Jl. Pajajaran No. 21, Bogor",
          mapUrl: "https://maps.google.com/?q=Pajajaran+Bogor",
        },
      ],
      story: [
        {
          year: "2019",
          title: "Lahir di Pagi Hari",
          text: "Tujuh tahun lalu, keluarga kami bertambah seorang putri mungil yang riang.",
          image: img("photo-1555252333-9f8e92e65df9", 800),
        },
        {
          year: "2026",
          title: "Tumbuh Ceria",
          text: "Kini Kiara tawa dan ceria — mari rayakan hari spesialnya bersama!",
          image: img("photo-1530103862676-de8c9debad1d", 800),
        },
      ],
      gallery: [
        { image: img("photo-1530103862676-de8c9debad1d", 900), caption: "Balon & konfeti" },
        { image: img("photo-1464349095431-e9a21285b5f3", 900), caption: "Kue ulang tahun" },
        { image: img("photo-1527529482837-4698179dc6ce", 900), caption: "Pesta" },
      ],
      giftAccounts: [
        { bank: "Dana", number: "081234567890", holder: "Ratri Sari" },
      ],
    }),
  },
  "little-star": {
    slug: "little-star",
    name: "Little Star",
    category: "Aqiqah",
    description:
      "Nuansa biru lembut dengan cahaya bokeh hangat untuk merayakan kelahiran putra-putri.",
    signature: "Bokeh lembut, palet baby blue, gorden manis",
    layout: "curtain",
    previewImage: "/templates/little-star.png",
    fontPair: "serif",
    defaultTheme: {
      palette: {
        bg: "#F7FBFF",
        surface: "#FFFFFF",
        text: "#3D4A5C",
        accent: "#6BA3C7",
        accentSoft: "#E3F0F8",
      },
      fonts: FONT_PAIRS.serif,
      radius: 20,
      decorations: "ornament",
      motion: "soft",
      particles: "bokeh",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      type: "aqiqah",
      celebrant: { name: "Zahra Humaira" },
      host: { name: "Bapak Ahmad Fauzi & Ibu Sarah", role: "Orang tua Zahra" },
      date: "2026-11-01T09:00:00+07:00",
      photo: img("photo-1555252333-9f8e92e65df9"),
      seoTitle: "Aqiqah Zahra Humaira - 1 November 2026",
      seoDescription:
        "Undangan aqiqah putri kami, Zahra Humaira, Minggu 1 November 2026 di Yogyakarta.",
      schedules: [
        {
          title: "Tasyakuran Aqiqah",
          start: "2026-11-01T09:00:00+07:00",
          end: "2026-11-01T12:00:00+07:00",
          venue: "Kediaman Keluarga",
          address: "Jl. Kaliurang KM 5, Yogyakarta",
          mapUrl: "https://maps.google.com/?q=Kaliurang+Yogyakarta",
        },
      ],
      story: [
        {
          year: "2026",
          title: "Lahir 12 Oktober",
          text: "Dengan syukur yang tak terhingga, kami menyambut kelahiran putri pertama kami.",
          image: img("photo-1555252333-9f8e92e65df9", 800),
        },
      ],
      gallery: [
        { image: img("photo-1555252333-9f8e92e65df9", 900), caption: "Si kecil" },
        { image: img("photo-1476703993599-0035a21b17a9", 900), caption: "Keluarga" },
      ],
      giftAccounts: [{ bank: "BCA", number: "9876543210", holder: "Sarah Fauzia" }],
    }),
  },
  "blue-whale": {
    slug: "blue-whale",
    name: "Blue Whale",
    category: "Khitanan",
    description:
      "Tema biru laut dengan gelembung naik dan kesan ceria untuk hari khitanan putra.",
    signature: "Gelembung naik, biru laut, tipografi ceria",
    layout: "full_bleed",
    previewImage: "/templates/blue-whale.png",
    fontPair: "montserrat",
    defaultTheme: {
      palette: {
        bg: "#F0F9FF",
        surface: "#FFFFFF",
        text: "#1E3A5F",
        accent: "#0EA5E9",
        accentSoft: "#DFF3FC",
      },
      fonts: FONT_PAIRS.montserrat,
      radius: 16,
      decorations: "geometric",
      motion: "playful",
      particles: "bubbles",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      type: "khitanan",
      celebrant: { name: "Arkan Maulana Yusuf", age: 9 },
      host: { name: "Bapak Irfan & Ibu Laila", role: "Orang tua Arkan" },
      date: "2026-12-06T10:00:00+07:00",
      photo: img("photo-1513151233558-d860c5398176"),
      seoTitle: "Khitanan Arkan Maulana - 6 Desember 2026",
      seoDescription:
        "Undangan khitanan Arkan Maulana Yusuf, Minggu 6 Desember 2026 di Surabaya.",
      schedules: [
        {
          title: "Acara Khitanan",
          start: "2026-12-06T10:00:00+07:00",
          end: "2026-12-06T14:00:00+07:00",
          venue: "Gedung Serbaguna Suroboyo",
          address: "Jl. Rungkut Asri Tengah, Surabaya",
          mapUrl: "https://maps.google.com/?q=Rungkut+Surabaya",
        },
      ],
      story: [
        {
          year: "2017",
          title: "Lahiran di Surabaya",
          text: "Arkan tumbuh jadi anak penasaran yang selalu ingin tahu banyak hal.",
          image: img("photo-1476703993599-0035a21b17a9", 800),
        },
        {
          year: "2026",
          title: "Siap Jadi Big Boy",
          text: "Di usianya yang ke-9, Arkan siap menjalani hari spesialnya. Doakan lancar!",
          image: img("photo-1513151233558-d860c5398176", 800),
        },
      ],
      gallery: [
        { image: img("photo-1513151233558-d860c5398176", 900), caption: "Warna-warni" },
        { image: img("photo-1527529482837-4698179dc6ce", 900), caption: "Kemeriahan" },
      ],
      giftAccounts: [{ bank: "Mandiri", number: "1357924680", holder: "Laila Fitri" }],
    }),
  },
  "tech-flow": {
    slug: "tech-flow",
    name: "Tech Flow",
    category: "Seminar",
    description:
      "Tema gelap futuristik dengan pola grid mengalir dan aksen sian untuk seminar & talkshow.",
    signature: "Grid mengalir, aksen sian, futuristik",
    layout: "full_bleed",
    previewImage: "/templates/tech-flow.png",
    fontPair: "jakarta",
    defaultTheme: {
      palette: {
        bg: "#0B1220",
        surface: "#151E32",
        text: "#E5EAF5",
        accent: "#22D3EE",
        accentSoft: "#1E293B",
      },
      fonts: FONT_PAIRS.jakarta,
      radius: 8,
      decorations: "geometric",
      motion: "elegant",
      particles: "grid",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      type: "seminar",
      host: { name: "Ir. Rendra Kusuma", role: "Tech Lead & AI Practitioner" },
      date: "2027-03-14T09:00:00+07:00",
      photo: img("photo-1540575467063-178a50c2df87"),
      seoTitle: "Seminar AI untuk Indonesia - 14 Maret 2027",
      seoDescription:
        "Seminar & talkshow 'AI untuk Indonesia' bersama Ir. Rendra Kusuma, Minggu 14 Maret 2027 di Jakarta.",
      schedules: [
        {
          title: "Seminar Utama",
          start: "2027-03-14T09:00:00+07:00",
          end: "2027-03-14T12:00:00+07:00",
          venue: "Balai Kartini Grand Ballroom",
          address: "Jl. Gelora Pintu 1 Senayan, Jakarta",
          mapUrl: "https://maps.google.com/?q=Balai+Kartini+Jakarta",
        },
        {
          title: "Talkshow & Networking",
          start: "2027-03-14T13:00:00+07:00",
          end: "2027-03-14T16:00:00+07:00",
          venue: "Auditorium BTNH",
          address: "Jl. LS. Fatmawati, Jakarta",
          mapUrl: "https://maps.google.com/?q=BTNH+Jakarta",
        },
      ],
      story: [
        {
          year: "09.00",
          title: "Registrasi & Pembukaan",
          text: "Coffee break dan registrasi peserta dibuka satu jam sebelum seminar dimulai.",
          image: img("photo-1540575467063-178a50c2df87", 800),
        },
        {
          year: "10.00",
          title: "Keynote: AI untuk Indonesia",
          text: "Sesi utama tentang penerapan AI yang relevan dengan konteks lokal dan UMKM.",
          image: img("photo-1511795409834-ef04bbd61622", 800),
        },
        {
          year: "13.00",
          title: "Talkshow & Networking",
          text: "Sesi tanya jawab, panel, dan kesempatan berjejaring dengan praktisi.",
          image: img("photo-1527529482837-4698179dc6ce", 800),
        },
      ],
      gallery: [
        { image: img("photo-1540575467063-178a50c2df87", 900), caption: "Suasana seminar" },
        { image: img("photo-1511795409834-ef04bbd61622", 900), caption: "Keynote" },
        { image: img("photo-1527529482837-4698179dc6ce", 900), caption: "Networking" },
      ],
      gift: false,
    }),
  },

  /* ── Premium paper-style templates ─────────────────────── */

  "royal-maroon": {
    slug: "royal-maroon",
    name: "Royal Maroon",
    category: "Premium",
    description:
      "Kertas kaya maroon dengan bunga kertas emas, foto berbingkai lingkaran, dan font calligraphy — kesan mewah & sakral.",
    signature: "Maroon pekat, paper-flower, ring emas, calligraphy",
    layout: "paper",
    previewImage: "/templates/royal-maroon.png",
    fontPair: "script",
    defaultTheme: {
      palette: {
        bg: "#5C0E0E",
        surface: "#FFF8F0",
        text: "#3D1A1A",
        accent: "#8B1A1A",
        accentSoft: "#F5E6D3",
      },
      fonts: { ...FONT_PAIRS.script, body: FONT_PAIRS.serif.body },
      radius: 12,
      decorations: "floral",
      motion: "elegant",
      particles: "sparkles",
    },
    defaultCover: {
      style: "framed",
      frameShape: "circle",
      nameOrientation: "vertical",
      guestPreText: "Kepada Yth. Bapak/Ibu/Saudara/i",
      openingText:
        "Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu dan Saudara/i untuk menghadiri acara kami.",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      type: "pernikahan",
      couple: {
        brideName: "Larasati Ayu Kirana",
        groomName: "Rendra Wicaksono",
        brideParents: "Putri dari Bapak H. Surya Darma & Ibu Hj. Melati",
        groomParents: "Putra dari Bapak Drs. Bambang Sutrisno & Ibu Dra. Ratna",
        hashtag: "#LarasRendra2026",
      },
      date: "2026-12-05T09:00:00+07:00",
      photo: img("photo-1511895426328-dc8714191300"),
      seoTitle: "Undangan Pernikahan Laras & Rendra - 5 Desember 2026",
      seoDescription:
        "Undangan pernikahan Larasati Ayu Kirana & Rendra Wicaksono, Sabtu 5 Desember 2026 di Serang, Banten.",
      schedules: [
        {
          title: "Akad Nikah",
          start: "2026-12-05T08:00:00+07:00",
          end: "2026-12-05T10:00:00+07:00",
          venue: "Masjid Raya Banten",
          address: "Jl. Maulana Yusuf, Serang, Banten",
          mapUrl: "https://maps.google.com/?q=Masjid+Raya+Banten",
        },
        {
          title: "Resepsi",
          start: "2026-12-05T11:00:00+07:00",
          end: "2026-12-05T14:00:00+07:00",
          venue: "Grand Ballroom Serang",
          address: "Jl. Khsatria, Serang, Banten",
          mapUrl: "https://maps.google.com/?q=Serang+Banten",
        },
      ],
      story: [
        {
          year: "2019",
          title: "Pertama Bertemu",
          text: "Berawal dari satu acara keluarga, obrolan sederhana berubah menjadi kebiasaan yang tak pernah absen.",
          image: img("photo-1519741497674-611481863552", 800),
        },
        {
          year: "2024",
          title: "Lamaran",
          text: "Di bawah restu keluarga besar, sebuah pertanyaan sederhana dijawab dengan satu kata: iya.",
          image: img("photo-1464366400600-7168b8af9bc3", 800),
        },
        {
          year: "2026",
          title: "Hari Bahagia",
          text: "Kami menikah bersama doa orang tua, sahabat, dan Anda yang berkenan hadir.",
          image: img("photo-1519741497674-611481863552", 800),
        },
      ],
      gallery: [
        { image: img("photo-1511895426328-dc8714191300", 900), caption: "Keluarga" },
        { image: img("photo-1519741497674-611481863552", 900), caption: "Bersama" },
        { image: img("photo-1464366400600-7168b8af9bc3", 900), caption: "Bahagia" },
      ],
    }),
  },
  "emerald-royal": {
    slug: "emerald-royal",
    name: "Emerald Royal",
    category: "Premium",
    description:
      "Kertas krem dengan aksen zamrud emas, ornamen geometri Islam, dan foto berbingkai arch — cocok untuk acara islami.",
    signature: "Zamrud emas, arch frame, ornamen geometric",
    layout: "paper",
    previewImage: "/templates/emerald-royal.png",
    fontPair: "script",
    defaultTheme: {
      palette: {
        bg: "#0E4D3C",
        surface: "#FEFCF5",
        text: "#1A3A30",
        accent: "#0E7C6B",
        accentSoft: "#E8F5EE",
      },
      fonts: { ...FONT_PAIRS.script, body: FONT_PAIRS.serif.body },
      radius: 10,
      decorations: "geometric",
      motion: "elegant",
      particles: "sparkles",
    },
    defaultCover: {
      style: "framed",
      frameShape: "arch",
      nameOrientation: "vertical",
      guestPreText: "Kepada Yth. Bapak/Ibu/Saudara/i",
      openingText:
        "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu untuk menghadiri acara.",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      type: "pernikahan",
      couple: {
        brideName: "Aisyah Nur Haliza",
        groomName: "Muhammad Faisal Rahman",
        brideParents: "Bapak H. Ahmad Fauzi & Ibu Hj. Siti Marlina",
        groomParents: "Bapak H. Rahman Hakim & Ibu Hj. Nurhayati",
        hashtag: "#AisyahFaisal",
      },
      date: "2027-06-12T08:00:00+07:00",
      photo: img("photo-1519741497674-611481863552"),
      seoTitle: "Pernikahan Aisyah & Faisal",
      seoDescription:
        "Undangan pernikahan Aisyah Nur Haliza & Muhammad Faisal Rahman, Sabtu 12 Juni 2027.",
      schedules: [
        {
          title: "Akad Nikah",
          start: "2027-06-12T08:00:00+07:00",
          end: "2027-06-12T10:00:00+07:00",
          venue: "Masjid Raya Baiturrahman",
          address: "Jl. Merdeka, Bandung",
          mapUrl: "https://maps.google.com/?q=Masjid+Raya+Bandung",
        },
        {
          title: "Resepsi",
          start: "2027-06-12T11:00:00+07:00",
          end: "2027-06-12T14:00:00+07:00",
          venue: "Grand Ballroom Hotel Savoy Homann",
          address: "Jl. Asia Afrika No. 8, Bandung",
          mapUrl: "https://maps.google.com/?q=Hotel+Savoy+Homann+Bandung",
        },
      ],
      story: [
        {
          year: "2019",
          title: "Pertama Bertemu",
          text: "Kami bertemu di kajian mingguan dan mulai saling mengenal.",
          image: img("photo-1522673607200-164d1b6ce486", 800),
        },
        {
          year: "2023",
          title: "Lamaran",
          text: "Dengan restu kedua keluarga, kami mengikat janji lamaran.",
          image: img("photo-1529636798458-92182e662485", 800),
        },
        {
          year: "2027",
          title: "Akad Nikah",
          text: "Insya Allah kami akan melangsungkan akad nikah di masjid raya.",
          image: img("photo-1511285560929-80b456fea0bc", 800),
        },
      ],
      gallery: [
        { image: img("photo-1519741497674-611481863552", 900), caption: "Engagement" },
        { image: img("photo-1522673607200-164d1b6ce486", 900), caption: "Pre-wedding" },
        { image: img("photo-1529636798458-92182e662485", 900), caption: "Bahagia" },
        { image: img("photo-1511285560929-80b456fea0bc", 900), caption: "Bersama" },
      ],
    }),
  },
  "midnight-gold": {
    slug: "midnight-gold",
    name: "Midnight Gold",
    category: "Premium",
    description:
      "Kertas ivory di atas background midnight navy, aksen emas mewah, dan photo frame elegant — kesan royal modern.",
    signature: "Midnight navy, ivory paper, gold accent",
    layout: "paper",
    previewImage: "/templates/midnight-gold.png",
    fontPair: "script",
    defaultTheme: {
      palette: {
        bg: "#0C1A2E",
        surface: "#FDF8EF",
        text: "#1C2B3D",
        accent: "#B8860B",
        accentSoft: "#F5EDDA",
      },
      fonts: { ...FONT_PAIRS.script, body: FONT_PAIRS.serif.body },
      radius: 8,
      decorations: "ornament",
      motion: "elegant",
      particles: "sparkles",
    },
    defaultCover: {
      style: "framed",
      frameShape: "rounded",
      nameOrientation: "horizontal",
      guestPreText: "Kepada Yth.",
      openingText:
        "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.",
    },
    defaultSections: BASE_SECTIONS,
    demo: demoConfig({
      type: "tunangan",
      couple: {
        brideName: "Kirana Dewi Anggraini",
        groomName: "Raka Aditya Pratama",
        brideParents: "Bapak Ir. Budi Santoso & Ibu Dra. Endang Wulandari",
        groomParents: "Bapak Drs. Agus Prasetyo & Ibu Rina Kartika",
        hashtag: "#KiranaRaka",
      },
      date: "2027-02-14T10:00:00+07:00",
      photo: img("photo-1529636798458-92182e662485"),
      seoTitle: "Tunangan Kirana & Raka",
      seoDescription:
        "Undangan Tunangan Kirana Dewi Anggraini & Raka Aditya Pratama, Minggu 14 Februari 2027.",
      schedules: [
        {
          title: "Akad Tunangan",
          start: "2027-02-14T10:00:00+07:00",
          end: "2027-02-14T13:00:00+07:00",
          venue: "The Ritz-Carlton Ballroom",
          address: "Jl. Prof. DR. Satrio, Jakarta Selatan",
          mapUrl: "https://maps.google.com/?q=The+Ritz-Carlton+Jakarta",
        },
      ],
      story: [
        {
          year: "2021",
          title: "Bertemu di Kampus",
          text: "Kami bertemu dalam sebuah organisasi mahasiswa dan mulai dekat.",
          image: img("photo-1522673607200-164d1b6ce486", 800),
        },
        {
          year: "2025",
          title: "Melamar",
          text: "Dengan restu orang tua, Raka melamar Kirana dalam suasana intimate.",
          image: img("photo-1511285560929-80b456fea0bc", 800),
        },
      ],
      gallery: [
        { image: img("photo-1529636798458-92182e662485", 900), caption: "Bersama" },
        { image: img("photo-1522673607200-164d1b6ce486", 900), caption: "Kencan" },
        { image: img("photo-1511285560929-80b456fea0bc", 900), caption: "Lamaran" },
      ],
      giftAccounts: [{ bank: "BCA", number: "1234567890", holder: "Kirana Dewi" }],
    }),
  },
};

export const TEMPLATE_SLUGS = Object.keys(TEMPLATE_REGISTRY);

export function getTemplate(slug: string): TemplateDefinition | undefined {
  return TEMPLATE_REGISTRY[slug];
}
