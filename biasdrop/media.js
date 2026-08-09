/* BiasDrop media catalog - free Pexels photos + free-to-use videos.
   Attribution via alt/title on every photo (photographer + Pexels source URL).
   Pexels License: free for commercial/personal use. Videos labeled free stock on YouTube. */
window.BiasDropMedia = (function () {
  "use strict";

  function pexelsPhoto(id, photographer, photographerUrl, pageUrl, desc, w) {
    const width = w || 900;
    return {
      id,
      photographer,
      photographerUrl: photographerUrl || "https://www.pexels.com/",
      url: pageUrl,
      desc,
      src: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`,
      srcSm: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=480`,
    };
  }

  function attrs(photo, context) {
    const credit = `Photo by ${photo.photographer} on Pexels`;
    const base = photo.desc || "Free stock photo";
    const ctx = context ? `${context}. ` : "";
    return {
      src: photo.src,
      srcset: `${photo.srcSm} 480w, ${photo.src} 900w`,
      alt: `${ctx}${base}. ${credit}. Source: ${photo.url}`,
      title: `${credit} · ${photo.url}`,
      credit,
      photographer: photo.photographer,
      photographerUrl: photo.photographerUrl,
      pageUrl: photo.url,
    };
  }

  /* ---- curated photos ---- */
  const photos = {
    seoulNeon: pexelsPhoto(
      28529892,
      "Paul Bill",
      "https://www.pexels.com/@hoffman11",
      "https://www.pexels.com/photo/vibrant-neon-sign-in-seoul-at-night-28529892/",
      "Glowing neon sign in Seoul at night"
    ),
    seoulStreet: pexelsPhoto(
      2128042,
      "Ethan Brooke",
      "https://www.pexels.com/@ethan-brooke-1123775",
      "https://www.pexels.com/photo/assorted-color-signages-2128042/",
      "Bustling Seoul street with neon signs and nightlife"
    ),
    seoulCity: pexelsPhoto(
      21348105,
      "Elina Volkova",
      "https://www.pexels.com/@miami302",
      "https://www.pexels.com/photo/seoul-21348105/",
      "Seoul city night view"
    ),
    concertFan: pexelsPhoto(
      17146421,
      "Riccardo Vespa",
      "https://www.pexels.com/@rickyvespa",
      "https://www.pexels.com/photo/woman-taking-pictures-at-concert-17146421/",
      "Fan photographing a live concert"
    ),
    concertSinger: pexelsPhoto(
      23879815,
      "Orhan Pergel",
      "https://www.pexels.com/@orhan-pergel-2148355500",
      "https://www.pexels.com/photo/a-singer-standing-among-the-crowd-23879815/",
      "Singer performing among a live crowd"
    ),
    concertHands: pexelsPhoto(
      16844747,
      "Caleb Oquendo",
      "https://www.pexels.com/@caleboquendo",
      "https://www.pexels.com/photo/man-with-arm-raised-on-concert-16844747/",
      "Audience member with arm raised under concert lights"
    ),
    concertCrowd: pexelsPhoto(
      34622947,
      "Caleb Oquendo",
      "https://www.pexels.com/@caleboquendo",
      "https://www.pexels.com/photo/energetic-concert-audience-with-raised-hands-34622947/",
      "Energetic concert audience with raised hands"
    ),
    stageMic: pexelsPhoto(
      12267669,
      "Vadim Koza",
      "https://www.pexels.com/@vadim-koza",
      "https://www.pexels.com/photo/photo-of-a-standing-microphone-in-the-stream-of-light-12267669/",
      "Stage microphone under purple lighting"
    ),
    stageSinger: pexelsPhoto(
      1625355,
      "Anderson Guerra",
      "https://www.pexels.com/@andersonguerra",
      "https://www.pexels.com/photo/man-singing-in-front-microphne-1625355/",
      "Musician singing live with purple stage lights"
    ),
    stageWoman: pexelsPhoto(
      7938157,
      "Caleb Oquendo",
      "https://www.pexels.com/@caleboquendo",
      "https://www.pexels.com/photo/a-woman-singing-on-the-stage-7938157/",
      "Woman singing on stage with vibrant lighting"
    ),
    neonLove: pexelsPhoto(
      17325434,
      "Andrea De Santis",
      "https://www.pexels.com/@thelazyartist",
      "https://www.pexels.com/photo/love-neon-light-17325434/",
      "Pink neon LOVE light sign"
    ),
    plushShelf: pexelsPhoto(
      33608926,
      "William Xin",
      "https://www.pexels.com/@william-xin-2153784791",
      "https://www.pexels.com/photo/adorable-teddy-bears-and-plush-33608926/",
      "Adorable teddy bears and plush toys on display"
    ),
    plushStore: pexelsPhoto(
      17995331,
      "Huu Huynh",
      "https://www.pexels.com/@huu-huynh-273087690",
      "https://www.pexels.com/photo/teddy-toys-on-shelves-in-store-17995331/",
      "Teddy toys on store shelves"
    ),
    plushPink: pexelsPhoto(
      4887244,
      "Kaboompics.com",
      "https://www.pexels.com/@karola-g",
      "https://www.pexels.com/photo/a-pink-teddy-bear-inside-a-bag-4887244/",
      "Pink teddy bear peeking from a purple bag"
    ),
    plushBlanket: pexelsPhoto(
      4887104,
      "Kaboompics.com",
      "https://www.pexels.com/@karola-g",
      "https://www.pexels.com/photo/pink-bear-plush-toy-on-pink-textile-4887104/",
      "Pink plush bear on soft pink textile"
    ),
    vinylWall: pexelsPhoto(
      27573377,
      "Hannah Johnson",
      "https://www.pexels.com/@hannah-johnson-2149094039",
      "https://www.pexels.com/photo/wall-of-vinyl-records-27573377/",
      "Wall of vinyl records"
    ),
    vinylStack: pexelsPhoto(
      5118442,
      "Tima Miroshnichenko",
      "https://www.pexels.com/@tima-miroshnichenko",
      "https://www.pexels.com/photo/close-up-photo-of-stacked-vinyl-records-5118442/",
      "Close-up of stacked vinyl records"
    ),
    cdsBox: pexelsPhoto(
      23834128,
      "Lisa from Pexels",
      "https://www.pexels.com/@fotios-photos",
      "https://www.pexels.com/photo/close-up-of-boxes-with-cds-23834128/",
      "Close-up of boxes filled with CDs"
    ),
    beautyLip: pexelsPhoto(
      7256145,
      "DS stories",
      "https://www.pexels.com/@ds-stories",
      "https://www.pexels.com/photo/lipsticks-on-pink-surface-7256145/",
      "Lipsticks arranged on a soft pink surface"
    ),
    beautyFlat: pexelsPhoto(
      4938510,
      "Kaboompics.com",
      "https://www.pexels.com/@karola-g",
      "https://www.pexels.com/photo/overhead-shot-of-beauty-products-near-a-plant-4938510/",
      "Overhead beauty products and lipsticks flat lay"
    ),
    beautyKit: pexelsPhoto(
      5632335,
      "Kaboompics.com",
      "https://www.pexels.com/@karola-g",
      "https://www.pexels.com/photo/flat-lay-of-beauty-products-5632335/",
      "Flat lay of beauty products"
    ),
    gadgetsPink: pexelsPhoto(
      28993111,
      "Matheus Bertelli",
      "https://www.pexels.com/@bertellifotografia",
      "https://www.pexels.com/photo/colorful-gaming-setup-with-pink-28993111/",
      "Colorful pink gaming and gadget setup"
    ),
    gadgetsTablet: pexelsPhoto(
      10357007,
      "Melike B",
      "https://www.pexels.com/@melike-b-2148509775",
      "https://www.pexels.com/photo/laptop-and-ipad-10357007/",
      "Laptop and tablet gadgets on a desk"
    ),
    polaroidPink: pexelsPhoto(
      31487533,
      "Zehra K.",
      "https://www.pexels.com/@zehra-k-2149148842",
      "https://www.pexels.com/photo/pink-polaroid-snap-touch-camera-31487533/",
      "Pink Polaroid-style camera"
    ),
    cardsCase: pexelsPhoto(
      8811594,
      "Erik Mclean",
      "https://www.pexels.com/@introspectivedsgn",
      "https://www.pexels.com/photo/close-up-photo-of-toy-collection-8811594/",
      "Collectible trading cards in protective cases"
    ),
    cardsHand: pexelsPhoto(
      7809125,
      "Erik Mclean",
      "https://www.pexels.com/@introspectivedsgn",
      "https://www.pexels.com/photo/close-up-of-hand-holding-playing-cards-7809125/",
      "Hand holding collectible cards in sleeves"
    ),
    fashionWoman: pexelsPhoto(
      33847264,
      "Sandi Yudha",
      "https://www.pexels.com/@sandiyp",
      "https://www.pexels.com/photo/stylish-woman-in-leather-jacket-seated-on-stool-33847264/",
      "Stylish woman in black leather jacket (stock portrait, not a named idol)"
    ),
    fashionWoman2: pexelsPhoto(
      17402944,
      "Adhen Wijaya Kusuma",
      "https://www.pexels.com/@adhen-wijaya-kusuma-229756871",
      "https://www.pexels.com/photo/woman-in-black-clothing-against-illuminated-night-city-17402944/",
      "Stylish woman on an illuminated city street at night"
    ),
    fashionWoman3: pexelsPhoto(
      16769471,
      "Muneeb Babar",
      "https://www.pexels.com/@muneeb-babar-1300535",
      "https://www.pexels.com/photo/woman-in-coat-standing-with-cellphone-on-stairs-16769471/",
      "Fashionable woman with phone on city stairs at night"
    ),
    fashionWoman4: pexelsPhoto(
      9579016,
      "Geoyul Park",
      "https://www.pexels.com/@geoyul",
      "https://www.pexels.com/photo/a-woman-in-white-long-sleeve-shirt-9579016/",
      "Fashionable woman posing in a park"
    ),
    fashionMan: pexelsPhoto(
      15369550,
      "Valentin Angel Fernandez",
      "https://www.pexels.com/@vafphotos",
      "https://www.pexels.com/photo/close-up-shot-of-a-man-15369550/",
      "Dramatic portrait of a man (stock, not a named idol)"
    ),
    fashionMan2: pexelsPhoto(
      17894651,
      "Toàn Văn",
      "https://www.pexels.com/@toan-van-1745332",
      "https://www.pexels.com/photo/man-wearing-jean-jacket-standing-on-street-17894651/",
      "Young man in denim jacket on a city street"
    ),
    fashionMan3: pexelsPhoto(
      17070263,
      "Bùi Hoàng Long",
      "https://www.pexels.com/@dxaxoxfz",
      "https://www.pexels.com/photo/young-man-with-a-concentrated-facial-expression-17070263/",
      "Close-up portrait of a man wearing glasses"
    ),
    dancer: pexelsPhoto(
      12442276,
      "Ernest Ghazaryan",
      "https://www.pexels.com/@ernest",
      "https://www.pexels.com/photo/group-of-dancers-holding-hands-12442276/",
      "Contemporary dancers performing on stage"
    ),
    boomboxPink: pexelsPhoto(
      31112195,
      "Jean Carlos",
      "https://www.pexels.com/@jean-carlos-1353551256",
      "https://www.pexels.com/photo/stylish-urban-fashion-with-retro-boombox-31112195/",
      "People in pink suits holding a retro boombox"
    ),
    headphones: pexelsPhoto(
      31098572,
      "Hai Nam Nguyen",
      "https://www.pexels.com/@hai-nam-nguyen-2079322455",
      "https://www.pexels.com/photo/woman-enjoying-music-with-headphones-outdoors-31098572/",
      "Woman enjoying music with headphones outdoors"
    ),
  };

  /* Pexels free stock videos (muted hero / ambient) */
  const videos = {
    festivalCrowd: {
      src: "https://videos.pexels.com/video-files/3941289/3941289-hd_1280_720_30fps.mp4",
      poster: photos.concertCrowd.src,
      photographer: "Tom Fisk",
      url: "https://www.pexels.com/video/light-city-landscape-people-3941289/",
      desc: "Music festival crowd free stock video by Tom Fisk on Pexels",
    },
    neonDance: {
      src: "https://videos.pexels.com/video-files/7326295/7326295-hd_1280_720_25fps.mp4",
      poster: photos.dancer.src,
      photographer: "MART PRODUCTION",
      url: "https://www.pexels.com/video/three-women-dancing-7326295/",
      desc: "Three women dancing (group choreography practice vibe) by MART PRODUCTION on Pexels",
    },
    cityNight: {
      src: "https://videos.pexels.com/video-files/11336556/11336556-hd_1280_720_30fps.mp4",
      poster: photos.seoulNeon.src,
      photographer: "Glenn Langhorst",
      url: "https://www.pexels.com/video/illuminated-city-at-night-11336556/",
      desc: "Illuminated city at night free stock video by Glenn Langhorst on Pexels",
    },
    concertClip: {
      src: "https://videos.pexels.com/video-files/9481021/9481021-hd_1280_720_24fps.mp4",
      poster: photos.concertFan.src,
      photographer: "K",
      url: "https://www.pexels.com/video/people-dancing-and-having-fun-9481021/",
      desc: "People dancing and having fun at a show by K on Pexels",
    },
  };

  /* Free-to-use YouTube stock (channels label as free stock / no copyright) */
  const youtube = [
    {
      id: "F24jncUsbeo",
      title: "Concert Teen Crowd #14 - Free Stock Footage",
      channel: "Frontman Media",
      note: "Labeled free stock footage on YouTube",
      use: "hero-adjacent / vibe reel",
    },
    {
      id: "YI9i5RUNdzo",
      title: "Concert Crowd #03 - Free Stock Footage",
      channel: "Frontman Media",
      note: "Labeled free stock footage on YouTube",
      use: "fan pulse",
    },
    {
      id: "RBsojSrqVzg",
      title: "People at a Concert - Stock video free of use",
      channel: "Stock Footage",
      note: "Labeled free of use on YouTube",
      use: "vibe section",
    },
    {
      id: "PyJNoQ4vxtM",
      title: "People Having Fun At A Concert | Free Stock Footage - No Copyright",
      channel: "Royalty Free Content",
      note: "Labeled free stock / no copyright on YouTube",
      use: "vibe section",
    },
  ];

  function allCredits() {
    const map = new Map();
    Object.values(photos).forEach((p) => {
      map.set(p.id, {
        type: "photo",
        photographer: p.photographer,
        photographerUrl: p.photographerUrl,
        url: p.url,
        desc: p.desc,
      });
    });
    Object.values(videos).forEach((v) => {
      map.set(v.url, {
        type: "video",
        photographer: v.photographer,
        photographerUrl: v.url,
        url: v.url,
        desc: v.desc,
      });
    });
    youtube.forEach((y) => {
      map.set(y.id, {
        type: "youtube",
        photographer: y.channel,
        photographerUrl: `https://www.youtube.com/watch?v=${y.id}`,
        url: `https://www.youtube.com/watch?v=${y.id}`,
        desc: `${y.title} (${y.note})`,
      });
    });
    return Array.from(map.values());
  }

  return { photos, videos, youtube, attrs, allCredits };
})();
