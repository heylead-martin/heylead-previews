/* BiasDrop encyclopedia data - artists, albums, songs, concerts, FAQs.
   External links point to official / widely used public pages. Content is a fan guide demo. */
window.BiasDropData = (function () {
  "use strict";

  const artists = [
    {
      id: "stray-kids",
      name: "Stray Kids",
      fandom: "STAY",
      agency: "JYP Entertainment",
      debut: "2018-03-25",
      members: ["Bang Chan", "Lee Know", "Changbin", "Hyunjin", "Han", "Felix", "Seungmin", "I.N"],
      gen: "4th",
      type: "group",
      color: "#8B5CF6",
      photoKey: "concertHands",
      bio: {
        en: "Self-producing 4th-gen powerhouse known for high-energy stages, dual-unit tracks, and a fiercely loyal STAY fandom. From survival show roots to global dome tours, SKZ write, produce, and own their chaos.",
        bg: "Self-producing сила от 4-то поколение - мощни сцени, dual-unit парчета и верен STAY fandom. От survival show до световни dome турове - SKZ пишат, продуцират и притежават хаоса си.",
      },
      links: {
        official: "https://straykids.jype.com/",
        weverse: "https://weverse.io/straykids/feed",
        spotify: "https://open.spotify.com/artist/2dIgFjalVxs4ThymZ67YCE",
        youtube: "https://www.youtube.com/@StrayKids",
        instagram: "https://www.instagram.com/realstraykids/",
        twitter: "https://x.com/Stray_Kids",
        wikipedia: "https://en.wikipedia.org/wiki/Stray_Kids",
        apple: "https://music.apple.com/us/artist/stray-kids/1359981020",
      },
      discography: [
        { title: "ODDINARY", year: 2022, type: "Mini", highlight: "MANIAC", spotify: "https://open.spotify.com/album/0tGloMjtafoyePcF8Gzq2f" },
        { title: "MAXIDENT", year: 2022, type: "Mini", highlight: "CASE 143", spotify: "https://open.spotify.com/album/7bKIm8PUlR1Iu7iJfE9ZUU" },
        { title: "★★★★★ (5-STAR)", year: 2023, type: "Studio", highlight: "S-Class", spotify: "https://open.spotify.com/album/5gCcb5fsSb6w5K8SyJrgtB" },
        { title: "ROCK-STAR", year: 2023, type: "Mini", highlight: "LALALALA", spotify: "https://open.spotify.com/album/5eyZZoQEFQWRHkV2xgAeBw" },
        { title: "ATE", year: 2024, type: "Mini", highlight: "Chk Chk Boom", spotify: "https://open.spotify.com/search/Stray%20Kids%20ATE" },
        { title: "HOP", year: 2024, type: "Special", highlight: "Walkin On Water", spotify: "https://open.spotify.com/search/Stray%20Kids%20HOP" },
      ],
      songs: [
        { title: "God's Menu", year: 2020, album: "GO LIVE", spotify: "https://open.spotify.com/track/4PMsZ5dllofrOHpT2Bh4bu", yt: "https://www.youtube.com/watch?v=TQTlCHxyuu8" },
        { title: "MANIAC", year: 2022, album: "ODDINARY", spotify: "https://open.spotify.com/track/3eydmh0xG3VNH0xejzjT2v", yt: "https://www.youtube.com/watch?v=OvioeS1ZZ7o" },
        { title: "S-Class", year: 2023, album: "5-STAR", spotify: "https://open.spotify.com/search/Stray%20Kids%20S-Class", yt: "https://www.youtube.com/watch?v=jYSlpC6Ud2A" },
        { title: "Chk Chk Boom", year: 2024, album: "ATE", spotify: "https://open.spotify.com/search/Stray%20Kids%20Chk%20Chk%20Boom", yt: "https://www.youtube.com/results?search_query=Stray+Kids+Chk+Chk+Boom+official" },
        { title: "LALALALA", year: 2023, album: "ROCK-STAR", spotify: "https://open.spotify.com/search/Stray%20Kids%20LALALALA", yt: "https://www.youtube.com/results?search_query=Stray+Kids+LALALALA+MV" },
      ],
      lightstick: "Official Light Stick Ver.2 (SKZOO era)",
    },
    {
      id: "bts",
      name: "BTS",
      fandom: "ARMY",
      agency: "HYBE / Big Hit Music",
      debut: "2013-06-13",
      members: ["RM", "Jin", "SUGA", "j-hope", "Jimin", "V", "Jungkook"],
      gen: "3rd",
      type: "group",
      color: "#7C3AED",
      photoKey: "fashionMan",
      bio: {
        en: "Global ambassadors of K-pop. From underground hip-hop roots to record-shattering Billboard runs, stadium tours, and solo eras - BTS rewrote what a boy group can do worldwide.",
        bg: "Глобални посланици на K-pop. От underground hip-hop корени до рекорди в Billboard, stadium турове и solo ери - BTS пренаписаха какво може една boy group по света.",
      },
      links: {
        official: "https://ibighit.com/bts/",
        weverse: "https://weverse.io/bts/feed",
        spotify: "https://open.spotify.com/artist/3Nrfpe0tUJi4K4DXYWgMUX",
        youtube: "https://www.youtube.com/@BTS",
        instagram: "https://www.instagram.com/bts.bighitofficial/",
        twitter: "https://x.com/BTS_twt",
        wikipedia: "https://en.wikipedia.org/wiki/BTS",
        apple: "https://music.apple.com/us/artist/bts/883131348",
      },
      discography: [
        { title: "Map of the Soul: 7", year: 2020, type: "Studio", highlight: "ON", spotify: "https://open.spotify.com/album/5W1XY5ucNATjTULERvXx9j" },
        { title: "BE", year: 2020, type: "Studio", highlight: "Life Goes On", spotify: "https://open.spotify.com/album/2qehskW9lYGWfYb0xPZkrS" },
        { title: "Proof", year: 2022, type: "Anthology", highlight: "Yet To Come", spotify: "https://open.spotify.com/album/6al2VdKbb6FIz9d7lU7WRB" },
        { title: "GOLDEN (Jungkook)", year: 2023, type: "Solo", highlight: "Seven", spotify: "https://open.spotify.com/album/5pSk3c3wVwnb2arb6ohCPU" },
      ],
      songs: [
        { title: "Dynamite", year: 2020, album: "Single", spotify: "https://open.spotify.com/track/5QDLhrAOJJdNAmCTJ8xMyW", yt: "https://www.youtube.com/watch?v=gdZLi9oWNZg" },
        { title: "Butter", year: 2021, album: "Single", spotify: "https://open.spotify.com/track/1mWdTewIgB3gtBM3TOSFhB", yt: "https://www.youtube.com/watch?v=WMweEpGlu_U" },
        { title: "Spring Day", year: 2017, album: "You Never Walk Alone", spotify: "https://open.spotify.com/track/5KimW5L27GL6NaDJirAhnd", yt: "https://www.youtube.com/watch?v=xEeFrLSkMm8" },
        { title: "Blood Sweat & Tears", year: 2016, album: "Wings", spotify: "https://open.spotify.com/search/BTS%20Blood%20Sweat%20Tears", yt: "https://www.youtube.com/watch?v=hmE9f-TEutc" },
        { title: "Seven (Jungkook)", year: 2023, album: "GOLDEN", spotify: "https://open.spotify.com/track/7x9aauaA9cu6tyfpHnqDLo", yt: "https://www.youtube.com/watch?v=QU9c0053UAU" },
      ],
      lightstick: "Official Light Stick Army Bomb Ver.4 / Keyring Ver.4",
    },
    {
      id: "blackpink",
      name: "BLACKPINK",
      fandom: "BLINK",
      agency: "YG Entertainment",
      debut: "2016-08-08",
      members: ["Jisoo", "Jennie", "Rosé", "Lisa"],
      gen: "3rd",
      type: "group",
      color: "#F472B6",
      photoKey: "fashionWoman4",
      bio: {
        en: "The biggest girl group on the planet by many metrics - Coachella headliners, fashion-house muses, and solo stars who still make the ground shake when the four reunite.",
        bg: "Най-голямата girl group на планетата по много метрики - хедлайнери на Coachella, музи на модни къщи и solo звезди, които пак разтърсват земята, когато четирите са заедно.",
      },
      links: {
        official: "https://www.ygfamily.com/artist/main.asp?LANGDIV=E&ATYPE=2&ARTIDX=70",
        weverse: "https://weverse.io/blackpink/feed",
        spotify: "https://open.spotify.com/artist/41MozSoPIsD1dJM0CLPjZF",
        youtube: "https://www.youtube.com/@BLACKPINK",
        instagram: "https://www.instagram.com/blackpinkofficial/",
        twitter: "https://x.com/BLACKPINK",
        wikipedia: "https://en.wikipedia.org/wiki/Blackpink",
        apple: "https://music.apple.com/us/artist/blackpink/1146855862",
      },
      discography: [
        { title: "THE ALBUM", year: 2020, type: "Studio", highlight: "How You Like That", spotify: "https://open.spotify.com/album/71O60S5gIJSIAhdnrDIh3N" },
        { title: "BORN PINK", year: 2022, type: "Studio", highlight: "Pink Venom", spotify: "https://open.spotify.com/album/0Lbm3RpP6XZR8pV0aNPWVs" },
        { title: "rosie (Rosé)", year: 2024, type: "Solo", highlight: "APT.", spotify: "https://open.spotify.com/search/Ros%C3%A9%20APT" },
      ],
      songs: [
        { title: "DDU-DU DDU-DU", year: 2018, album: "Square Up", spotify: "https://open.spotify.com/track/4ZxOuNHhpyOj4wv10jLLpi", yt: "https://www.youtube.com/watch?v=IHNzOHi8sJs" },
        { title: "How You Like That", year: 2020, album: "THE ALBUM", spotify: "https://open.spotify.com/track/4SDgTLDYrJ2Ur7uBmcLlcz", yt: "https://www.youtube.com/watch?v=ioNng23DkIM" },
        { title: "Pink Venom", year: 2022, album: "BORN PINK", spotify: "https://open.spotify.com/track/0Q5VnK2DYzRyfqQRJuUtvi", yt: "https://www.youtube.com/watch?v=gQlMMD8auMs" },
        { title: "Shut Down", year: 2022, album: "BORN PINK", spotify: "https://open.spotify.com/search/BLACKPINK%20Shut%20Down", yt: "https://www.youtube.com/watch?v=POe9SOEKotk" },
        { title: "APT. (Rosé & Bruno Mars)", year: 2024, album: "rosie", spotify: "https://open.spotify.com/search/APT%20Ros%C3%A9", yt: "https://www.youtube.com/results?search_query=APT+Rose+Bruno+Mars" },
      ],
      lightstick: "Official Light Stick Ver.2",
    },
    {
      id: "aespa",
      name: "aespa",
      fandom: "MYs",
      agency: "SM Entertainment",
      debut: "2020-11-17",
      members: ["Karina", "Giselle", "Winter", "Ningning"],
      gen: "4th",
      type: "group",
      color: "#22D3EE",
      photoKey: "fashionWoman",
      bio: {
        en: "SM's metaverse girl group - avatar lore, festival-sized hooks, and record digital sales. Supernova-era aespa is peak 4th-gen girl group energy.",
        bg: "Metaverse girl group на SM - avatar lore, festival-ready хитове и рекордни digital sales. Supernova-ерата на aespa е peak 4-то поколение.",
      },
      links: {
        official: "https://www.smentertainment.com/artist/aespa",
        weverse: "https://weverse.io/aespa/feed",
        spotify: "https://open.spotify.com/artist/6YVMFz59CuY7ngCxTxjpxE",
        youtube: "https://www.youtube.com/@aespa",
        instagram: "https://www.instagram.com/aespa_official/",
        twitter: "https://x.com/aespa_official",
        wikipedia: "https://en.wikipedia.org/wiki/Aespa",
        apple: "https://music.apple.com/us/artist/aespa/1540443179",
      },
      discography: [
        { title: "Savage", year: 2021, type: "Mini", highlight: "Savage", spotify: "https://open.spotify.com/album/1UMmYyV8XEZBKJZQ0jS8nH" },
        { title: "Girls", year: 2022, type: "Mini", highlight: "Girls", spotify: "https://open.spotify.com/search/aespa%20Girls%20album" },
        { title: "MY WORLD", year: 2023, type: "Mini", highlight: "Spicy", spotify: "https://open.spotify.com/search/aespa%20MY%20WORLD" },
        { title: "Armageddon", year: 2024, type: "Studio", highlight: "Supernova", spotify: "https://open.spotify.com/search/aespa%20Armageddon" },
        { title: "Whiplash", year: 2024, type: "Mini", highlight: "Whiplash", spotify: "https://open.spotify.com/search/aespa%20Whiplash" },
      ],
      songs: [
        { title: "Next Level", year: 2021, album: "Single", spotify: "https://open.spotify.com/track/2xmrKJxcY0jWRr51WncETb", yt: "https://www.youtube.com/watch?v=4TWR90KJl84" },
        { title: "Savage", year: 2021, album: "Savage", spotify: "https://open.spotify.com/search/aespa%20Savage", yt: "https://www.youtube.com/watch?v=WPdWvnAAurg" },
        { title: "Spicy", year: 2023, album: "MY WORLD", spotify: "https://open.spotify.com/search/aespa%20Spicy", yt: "https://www.youtube.com/watch?v=Os_heh8vPfs" },
        { title: "Supernova", year: 2024, album: "Armageddon", spotify: "https://open.spotify.com/search/aespa%20Supernova", yt: "https://www.youtube.com/results?search_query=aespa+Supernova+MV" },
        { title: "Whiplash", year: 2024, album: "Whiplash", spotify: "https://open.spotify.com/search/aespa%20Whiplash%20song", yt: "https://www.youtube.com/results?search_query=aespa+Whiplash+MV" },
      ],
      lightstick: "Official Light Stick + Mini Light Keyring Ver.2",
    },
    {
      id: "ive",
      name: "IVE",
      fandom: "DIVE",
      agency: "Starship Entertainment",
      debut: "2021-12-01",
      members: ["Gaeul", "Yujin", "Rei", "Wonyoung", "Liz", "Leeseo"],
      gen: "4th",
      type: "group",
      color: "#FB7185",
      photoKey: "fashionWoman2",
      bio: {
        en: "Elegant-concept 4th-gen queens with chart domination (ELEVEN, LOVE DIVE, I AM). Fashion, variety, and main-character energy - DIVE never clocks out.",
        bg: "Elegant concept кралици от 4-то поколение с chart domination (ELEVEN, LOVE DIVE, I AM). Мода, variety и main-character енергия - DIVE не спира.",
      },
      links: {
        official: "https://www.starship-ent.com/profile/ive",
        weverse: "https://weverse.io/ive/feed",
        spotify: "https://open.spotify.com/artist/6RHTUrRF63xao58xh9FXYJ",
        youtube: "https://www.youtube.com/@IVEstarship",
        instagram: "https://www.instagram.com/ivestarship/",
        twitter: "https://x.com/IVEstarship",
        wikipedia: "https://en.wikipedia.org/wiki/Ive_(group)",
        apple: "https://music.apple.com/us/artist/ive/1592603517",
      },
      discography: [
        { title: "ELEVEN", year: 2021, type: "Single", highlight: "ELEVEN", spotify: "https://open.spotify.com/search/IVE%20ELEVEN" },
        { title: "LOVE DIVE", year: 2022, type: "Single", highlight: "LOVE DIVE", spotify: "https://open.spotify.com/search/IVE%20LOVE%20DIVE" },
        { title: "I've IVE", year: 2023, type: "Studio", highlight: "I AM", spotify: "https://open.spotify.com/search/IVE%20I%20AM" },
        { title: "IVE SWITCH", year: 2024, type: "Mini", highlight: "HEYA", spotify: "https://open.spotify.com/search/IVE%20SWITCH" },
      ],
      songs: [
        { title: "ELEVEN", year: 2021, album: "ELEVEN", spotify: "https://open.spotify.com/search/IVE%20ELEVEN%20track", yt: "https://www.youtube.com/watch?v=112gV6oexcs" },
        { title: "LOVE DIVE", year: 2022, album: "LOVE DIVE", spotify: "https://open.spotify.com/search/IVE%20LOVE%20DIVE%20track", yt: "https://www.youtube.com/watch?v=Y8JFxS1HlDo" },
        { title: "After LIKE", year: 2022, album: "After LIKE", spotify: "https://open.spotify.com/search/IVE%20After%20LIKE", yt: "https://www.youtube.com/watch?v=F0B7HDiY-10" },
        { title: "I AM", year: 2023, album: "I've IVE", spotify: "https://open.spotify.com/search/IVE%20I%20AM", yt: "https://www.youtube.com/watch?v=6ZUIwj3FgUY" },
        { title: "HEYA", year: 2024, album: "IVE SWITCH", spotify: "https://open.spotify.com/search/IVE%20HEYA", yt: "https://www.youtube.com/results?search_query=IVE+HEYA+MV" },
      ],
      lightstick: "Official Light Stick + MINIVE merch line",
    },
    {
      id: "txt",
      name: "TXT",
      fandom: "MOA",
      agency: "HYBE / Big Hit Music",
      debut: "2019-03-04",
      members: ["Yeonjun", "Soobin", "Beomgyu", "Taehyun", "Huening Kai"],
      gen: "4th",
      type: "group",
      color: "#38BDF8",
      photoKey: "fashionMan3",
      bio: {
        en: "TOMORROW X TOGETHER - cinematic lore, fashion-forward stages, and emotional title tracks. MOA follow every chapter of their growing universe.",
        bg: "TOMORROW X TOGETHER - cinematic lore, fashion-forward сцени и емоционални title tracks. MOA следват всяка глава от растящата им вселена.",
      },
      links: {
        official: "https://ibighit.com/txt/",
        weverse: "https://weverse.io/txt/feed",
        spotify: "https://open.spotify.com/artist/0ghlgldX5Dd6720Q3qFyQB",
        youtube: "https://www.youtube.com/@TXT_bighit",
        instagram: "https://www.instagram.com/txt_bighit/",
        twitter: "https://x.com/TXT_bighit",
        wikipedia: "https://en.wikipedia.org/wiki/Tomorrow_X_Together",
        apple: "https://music.apple.com/us/artist/tomorrow-x-together/1451822345",
      },
      discography: [
        { title: "The Dream Chapter: MAGIC", year: 2019, type: "Studio", highlight: "9 and Three Quarters", spotify: "https://open.spotify.com/search/TXT%20MAGIC" },
        { title: "The Chaos Chapter: FREEZE", year: 2021, type: "Studio", highlight: "0X1=LOVESONG", spotify: "https://open.spotify.com/search/TXT%20FREEZE" },
        { title: "The Name Chapter: TEMPTATION", year: 2023, type: "Mini", highlight: "Sugar Rush Ride", spotify: "https://open.spotify.com/search/TXT%20TEMPTATION" },
        { title: "minisode 3: TOMORROW", year: 2024, type: "Mini", highlight: "Deja Vu", spotify: "https://open.spotify.com/search/TXT%20minisode%203" },
      ],
      songs: [
        { title: "Crown", year: 2019, album: "The Dream Chapter: STAR", spotify: "https://open.spotify.com/search/TXT%20Crown", yt: "https://www.youtube.com/watch?v=WdinMrYQ0RU" },
        { title: "0X1=LOVESONG", year: 2021, album: "FREEZE", spotify: "https://open.spotify.com/search/TXT%200X1", yt: "https://www.youtube.com/watch?v=AG-erEMhumc" },
        { title: "Sugar Rush Ride", year: 2023, album: "TEMPTATION", spotify: "https://open.spotify.com/search/TXT%20Sugar%20Rush%20Ride", yt: "https://www.youtube.com/watch?v=POe9SOEKotk" },
        { title: "Deja Vu", year: 2024, album: "minisode 3", spotify: "https://open.spotify.com/search/TXT%20Deja%20Vu", yt: "https://www.youtube.com/results?search_query=TXT+Deja+Vu+MV" },
      ],
      lightstick: "Official Light Stick Ver.2 (MOA Bong)",
    },
    {
      id: "enhypen",
      name: "ENHYPEN",
      fandom: "ENGENE",
      agency: "HYBE / BELIFT LAB",
      debut: "2020-11-30",
      members: ["Heeseung", "Jay", "Jake", "Sunghoon", "Sunoo", "Jungwon", "Ni-ki"],
      gen: "4th",
      type: "group",
      color: "#A78BFA",
      photoKey: "stageSinger",
      bio: {
        en: "Born from I-LAND. Vampire lore, razor-sharp choreography, and stadium ambitions. ENGENE keeps every comeback charting worldwide.",
        bg: "Родени от I-LAND. Vampire lore, остра хореография и stadium амбиции. ENGENE държи всеки comeback в световните chart-ове.",
      },
      links: {
        official: "https://beliftlab.com/artist/profile/enhypen",
        weverse: "https://weverse.io/enhypen/feed",
        spotify: "https://open.spotify.com/artist/5t5FqBwTcgKTaWmfEbwQY9",
        youtube: "https://www.youtube.com/@ENHYPEN",
        instagram: "https://www.instagram.com/enhypen/",
        twitter: "https://x.com/ENHYPEN",
        wikipedia: "https://en.wikipedia.org/wiki/Enhypen",
        apple: "https://music.apple.com/us/artist/enhypen/1543605837",
      },
      discography: [
        { title: "BORDER : DAY ONE", year: 2020, type: "Mini", highlight: "Given-Taken", spotify: "https://open.spotify.com/search/ENHYPEN%20DAY%20ONE" },
        { title: "DIMENSION : DILEMMA", year: 2021, type: "Studio", highlight: "Tamed-Dashed", spotify: "https://open.spotify.com/search/ENHYPEN%20DILEMMA" },
        { title: "ORANGE BLOOD", year: 2023, type: "Mini", highlight: "Sweet Venom", spotify: "https://open.spotify.com/search/ENHYPEN%20ORANGE%20BLOOD" },
        { title: "ROMANCE : UNTOLD", year: 2024, type: "Studio", highlight: "XO (Only If You Say Yes)", spotify: "https://open.spotify.com/search/ENHYPEN%20ROMANCE%20UNTOLD" },
      ],
      songs: [
        { title: "Given-Taken", year: 2020, album: "BORDER : DAY ONE", spotify: "https://open.spotify.com/search/ENHYPEN%20Given-Taken", yt: "https://www.youtube.com/watch?v=jDW4ADBCTT8" },
        { title: "Fever", year: 2021, album: "BORDER : CARNIVAL", spotify: "https://open.spotify.com/search/ENHYPEN%20Fever", yt: "https://www.youtube.com/results?search_query=ENHYPEN+Fever+MV" },
        { title: "Bite Me", year: 2023, album: "DARK BLOOD", spotify: "https://open.spotify.com/search/ENHYPEN%20Bite%20Me", yt: "https://www.youtube.com/results?search_query=ENHYPEN+Bite+Me+MV" },
        { title: "Sweet Venom", year: 2023, album: "ORANGE BLOOD", spotify: "https://open.spotify.com/search/ENHYPEN%20Sweet%20Venom", yt: "https://www.youtube.com/results?search_query=ENHYPEN+Sweet+Venom" },
      ],
      lightstick: "Official Light Stick (ENGENE Bong)",
    },
    {
      id: "ateez",
      name: "ATEEZ",
      fandom: "ATINY",
      agency: "KQ Entertainment",
      debut: "2018-10-24",
      members: ["Hongjoong", "Seonghwa", "Yunho", "Yeosang", "San", "Mingi", "Wooyoung", "Jongho"],
      gen: "4th",
      type: "group",
      color: "#F97316",
      photoKey: "stageSinger",
      bio: {
        en: "Performance kings with pirate lore, Coachella stages, and one of the most devoted fandoms in 4th gen. ATEEZ turn every arena into a full-contact concert.",
        bg: "Крале на performance с pirate lore, сцени на Coachella и един от най-преданите fandom-и в 4-то поколение. ATEEZ превръщат всяка арена в full-contact концерт.",
      },
      links: {
        official: "https://www.kqent.com/artist/ateez",
        weverse: "https://weverse.io/ateez/feed",
        spotify: "https://open.spotify.com/artist/68KmkHeZ5Q4v9M1HczP8HR",
        youtube: "https://www.youtube.com/@ATEEZofficial",
        instagram: "https://www.instagram.com/ateez_official_/",
        twitter: "https://x.com/ATEEZofficial",
        wikipedia: "https://en.wikipedia.org/wiki/Ateez",
        apple: "https://music.apple.com/us/artist/ateez/1439281960",
      },
      discography: [
        { title: "TREASURE EP.FIN: All to Action", year: 2019, type: "Studio", highlight: "Wonderland", spotify: "https://open.spotify.com/search/ATEEZ%20Wonderland" },
        { title: "ZERO : FEVER Part.1", year: 2020, type: "Mini", highlight: "INCEPTION", spotify: "https://open.spotify.com/search/ATEEZ%20INCEPTION" },
        { title: "THE WORLD EP.FIN : WILL", year: 2023, type: "Studio", highlight: "Crazy Form", spotify: "https://open.spotify.com/search/ATEEZ%20WILL" },
        { title: "GOLDEN HOUR : Part.1", year: 2024, type: "Mini", highlight: "Work", spotify: "https://open.spotify.com/search/ATEEZ%20GOLDEN%20HOUR" },
      ],
      songs: [
        { title: "Wonderland", year: 2019, album: "All to Action", spotify: "https://open.spotify.com/search/ATEEZ%20Wonderland%20track", yt: "https://www.youtube.com/watch?v=nMAVDFskS9E" },
        { title: "Answer", year: 2020, album: "Answer", spotify: "https://open.spotify.com/search/ATEEZ%20Answer", yt: "https://www.youtube.com/watch?v=UOxkGD8qRB4" },
        { title: "Guerrilla", year: 2022, album: "THE WORLD EP.1", spotify: "https://open.spotify.com/search/ATEEZ%20Guerrilla", yt: "https://www.youtube.com/results?search_query=ATEEZ+Guerrilla+MV" },
        { title: "Crazy Form", year: 2023, album: "WILL", spotify: "https://open.spotify.com/search/ATEEZ%20Crazy%20Form", yt: "https://www.youtube.com/results?search_query=ATEEZ+Crazy+Form" },
      ],
      lightstick: "Official Lightiny Ver.2",
    },
    {
      id: "seventeen",
      name: "SEVENTEEN",
      fandom: "CARAT",
      agency: "HYBE / Pledis Entertainment",
      debut: "2015-05-26",
      members: ["S.Coups", "Jeonghan", "Joshua", "Jun", "Hoshi", "Wonwoo", "Woozi", "DK", "Mingyu", "The8", "Seungkwan", "Vernon", "Dino"],
      gen: "3rd",
      type: "group",
      color: "#FBBF24",
      photoKey: "concertCrowd",
      bio: {
        en: "Thirteen members, three units, endless self-production. SEVENTEEN's synchronized stages and CARAT ocean of light sticks are legendary worldwide.",
        bg: "Тринайсет члена, три unit-а, безкрайно self-production. Синхронизираните сцени на SEVENTEEN и CARAT океанът от light sticks са легендарни.",
      },
      links: {
        official: "https://www.pledis.co.kr/html/artist/seventeen",
        weverse: "https://weverse.io/seventeen/feed",
        spotify: "https://open.spotify.com/artist/7nqOGRxlXj7N2JYbgNEjYH",
        youtube: "https://www.youtube.com/@pledis17",
        instagram: "https://www.instagram.com/saythename_17/",
        twitter: "https://x.com/pledis_17",
        wikipedia: "https://en.wikipedia.org/wiki/Seventeen_(South_Korean_band)",
        apple: "https://music.apple.com/us/artist/seventeen/1008410184",
      },
      discography: [
        { title: "You Make My Day", year: 2018, type: "Mini", highlight: "Oh My!", spotify: "https://open.spotify.com/search/SEVENTEEN%20You%20Make%20My%20Day" },
        { title: "Face the Sun", year: 2022, type: "Studio", highlight: "HOT", spotify: "https://open.spotify.com/search/SEVENTEEN%20Face%20the%20Sun" },
        { title: "FML", year: 2023, type: "Mini", highlight: "Super", spotify: "https://open.spotify.com/search/SEVENTEEN%20FML" },
        { title: "17 IS RIGHT HERE", year: 2024, type: "Best", highlight: "MAESTRO", spotify: "https://open.spotify.com/search/SEVENTEEN%20MAESTRO" },
      ],
      songs: [
        { title: "Don't Wanna Cry", year: 2017, album: "Al1", spotify: "https://open.spotify.com/search/SEVENTEEN%20Don%27t%20Wanna%20Cry", yt: "https://www.youtube.com/watch?v=zEkg4GBQumc" },
        { title: "HOT", year: 2022, album: "Face the Sun", spotify: "https://open.spotify.com/search/SEVENTEEN%20HOT", yt: "https://www.youtube.com/watch?v=gRnuFC4Ualw" },
        { title: "Super", year: 2023, album: "FML", spotify: "https://open.spotify.com/search/SEVENTEEN%20Super", yt: "https://www.youtube.com/results?search_query=SEVENTEEN+Super+MV" },
        { title: "MAESTRO", year: 2024, album: "17 IS RIGHT HERE", spotify: "https://open.spotify.com/search/SEVENTEEN%20MAESTRO", yt: "https://www.youtube.com/results?search_query=SEVENTEEN+MAESTRO" },
      ],
      lightstick: "Carat Bong Ver.3",
    },
    {
      id: "twice",
      name: "TWICE",
      fandom: "ONCE",
      agency: "JYP Entertainment",
      debut: "2015-10-20",
      members: ["Nayeon", "Jeongyeon", "Momo", "Sana", "Jihyo", "Mina", "Dahyun", "Chaeyoung", "Tzuyu"],
      gen: "3rd",
      type: "group",
      color: "#F9A8D4",
      photoKey: "boomboxPink",
      bio: {
        en: "Feel-special queens of catchy hooks and multicolour eras. TWICE built a decade of anthems and still sell out world tours for ONCE everywhere.",
        bg: "Feel-special кралици на catchy хитове и цветни ери. TWICE имат десетилетие антеми и все още разпродават световни турове за ONCE.",
      },
      links: {
        official: "https://twice.jype.com/",
        weverse: "https://weverse.io/twice/feed",
        spotify: "https://open.spotify.com/artist/7n2Ycct7Beij7DjAQdnM97",
        youtube: "https://www.youtube.com/@TWICE",
        instagram: "https://www.instagram.com/twicetagram/",
        twitter: "https://x.com/JYPETWICE",
        wikipedia: "https://en.wikipedia.org/wiki/Twice",
        apple: "https://music.apple.com/us/artist/twice/1033581567",
      },
      discography: [
        { title: "Twicetagram", year: 2017, type: "Studio", highlight: "Likey", spotify: "https://open.spotify.com/search/TWICE%20Twicetagram" },
        { title: "Eyes wide open", year: 2020, type: "Studio", highlight: "I CAN'T STOP ME", spotify: "https://open.spotify.com/search/TWICE%20I%20CAN%27T%20STOP%20ME" },
        { title: "READY TO BE", year: 2023, type: "Mini", highlight: "Set Me Free", spotify: "https://open.spotify.com/search/TWICE%20READY%20TO%20BE" },
        { title: "With YOU-th", year: 2024, type: "Mini", highlight: "ONE SPARK", spotify: "https://open.spotify.com/search/TWICE%20With%20YOU-th" },
      ],
      songs: [
        { title: "Cheer Up", year: 2016, album: "PAGE TWO", spotify: "https://open.spotify.com/search/TWICE%20Cheer%20Up", yt: "https://www.youtube.com/watch?v=c7rCyll5AeY" },
        { title: "TT", year: 2016, album: "TWICEcoaster", spotify: "https://open.spotify.com/search/TWICE%20TT", yt: "https://www.youtube.com/watch?v=ePpPVE-GGJw" },
        { title: "Fancy", year: 2019, album: "Fancy You", spotify: "https://open.spotify.com/search/TWICE%20Fancy", yt: "https://www.youtube.com/watch?v=kOHB85vDuow" },
        { title: "The Feels", year: 2021, album: "Single", spotify: "https://open.spotify.com/search/TWICE%20The%20Feels", yt: "https://www.youtube.com/watch?v=f5NUgcx_Ig8" },
      ],
      lightstick: "Candy Bong Z / Infinity",
    },
  ];

  /* Global concerts - illustrative 2025-2026 fan-guide entries with real ticket marketplaces / official refs */
  const concerts = [
    { id: "c1", artistId: "seventeen", title: "SEVENTEEN World Tour [NEW_] — US", date: "2026-10-11", endDate: "2026-10-30", city: "Tacoma / multi-city", country: "USA", venue: "Tacoma Dome → Capital One Arena", region: "north-america", status: "onsale", tickets: "https://www.ticketmaster.com/search?q=SEVENTEEN", source: "https://bmostadium.com/news/seventeen-announce-world-tour-new_-in-u-s/", note: "US leg: Tacoma, LA, Austin, Sunrise, Washington DC" },
    { id: "c2", artistId: "seventeen", title: "SEVENTEEN World Tour [NEW_] — Los Angeles", date: "2026-10-16", city: "Los Angeles", country: "USA", venue: "BMO Stadium", region: "north-america", status: "onsale", tickets: "https://www.ticketmaster.com/search?q=SEVENTEEN+BMO", source: "https://bmostadium.com/news/seventeen-announce-world-tour-new_-in-u-s/" },
    { id: "c3", artistId: "stray-kids", title: "Stray Kids World Tour 'Run It' (global cycle)", date: "2026-04-09", city: "Goyang", country: "South Korea", venue: "TBA / multi-city world tour", region: "asia", status: "announced", tickets: "https://www.ticketmaster.com/search?q=Stray+Kids", source: "https://kpop.fandom.com/wiki/Stray_Kids_World_Tour_%27Run_It%27", note: "70+ dates reported across Asia, NA, SA, AU, EU — verify city-by-city on official channels" },
    { id: "c4", artistId: "stray-kids", title: "Stray Kids — North America leg", date: "2026-07-01", city: "Multi-city", country: "USA / Canada", venue: "Arenas TBA", region: "north-america", status: "tba", tickets: "https://www.ticketmaster.com/search?q=Stray+Kids", source: "https://straykids.jype.com/" },
    { id: "c5", artistId: "bts", title: "BTS 2026 World Tour (reunion cycle)", date: "2026-04-01", city: "TBA", country: "Global", venue: "Stadiums TBA", region: "global", status: "tba", tickets: "https://www.ticketmaster.com/search?q=BTS", source: "https://ibighit.com/bts/", note: "Post-military reunion tour window widely reported — check Weverse & HYBE for official dates" },
    { id: "c6", artistId: "ateez", title: "ATEEZ World Tour dates", date: "2026-03-15", city: "Multi-city", country: "Global", venue: "Arenas", region: "global", status: "tba", tickets: "https://www.ticketmaster.com/search?q=ATEEZ", source: "https://www.kqent.com/artist/ateez" },
    { id: "c7", artistId: "twice", title: "TWICE World Tour", date: "2026-02-01", city: "Multi-city", country: "Global", venue: "Arenas / stadiums", region: "global", status: "tba", tickets: "https://www.ticketmaster.com/search?q=TWICE", source: "https://twice.jype.com/" },
    { id: "c8", artistId: "aespa", title: "aespa Live Tour / festivals", date: "2026-05-20", city: "Multi-city", country: "Global", venue: "TBA", region: "global", status: "tba", tickets: "https://www.ticketmaster.com/search?q=aespa", source: "https://www.smentertainment.com/artist/aespa" },
    { id: "c9", artistId: "enhypen", title: "ENHYPEN World Tour", date: "2026-06-10", city: "Multi-city", country: "Global", venue: "Arenas", region: "global", status: "tba", tickets: "https://www.ticketmaster.com/search?q=ENHYPEN", source: "https://weverse.io/enhypen/feed" },
    { id: "c10", artistId: "txt", title: "TXT World Tour", date: "2026-08-01", city: "Multi-city", country: "Global", venue: "Arenas", region: "global", status: "tba", tickets: "https://www.ticketmaster.com/search?q=TXT+TOMORROW", source: "https://ibighit.com/txt/" },
    { id: "c11", artistId: "ive", title: "IVE Concert / Fancon cycle", date: "2026-06-01", city: "Seoul + Asia", country: "South Korea", venue: "TBA", region: "asia", status: "tba", tickets: "https://www.ticketmaster.com/search?q=IVE", source: "https://weverse.io/ive/feed" },
    { id: "c12", artistId: "blackpink", title: "BLACKPINK / solo stages & festivals", date: "2026-07-15", city: "Multi-city", country: "Global", venue: "Festivals / solo tours", region: "global", status: "tba", tickets: "https://www.ticketmaster.com/search?q=BLACKPINK", source: "https://www.ygfamily.com/" },
    { id: "c13", artistId: "stray-kids", title: "KPOPWORLD Festival (multi-act)", date: "2026-10-28", endDate: "2026-10-31", city: "San Antonio", country: "USA", venue: "Alamodome", region: "north-america", status: "announced", tickets: "https://www.alamodome.com/events/detail/kpopworld-festival-2026", source: "https://www.alamodome.com/events/detail/kpopworld-festival-2026", note: "Multi-artist festival — lineup via official event page" },
    { id: "c14", artistId: "seventeen", title: "SEVENTEEN — Austin", date: "2026-10-21", city: "Austin", country: "USA", venue: "Moody Center", region: "north-america", status: "onsale", tickets: "https://www.ticketmaster.com/search?q=SEVENTEEN+Austin", source: "https://bmostadium.com/news/seventeen-announce-world-tour-new_-in-u-s/" },
    { id: "c15", artistId: "ateez", title: "ATEEZ Europe dates (check official)", date: "2026-01-15", city: "Amsterdam", country: "Netherlands", venue: "TBA", region: "europe", status: "tba", tickets: "https://www.ticketmaster.nl/", source: "https://www.kqent.com/artist/ateez" },
  ];

  const faqs = [
    {
      id: "what-is-bias",
      cat: "fandom",
      q: { en: "What is a bias?", bg: "Какво е bias?" },
      a: {
        en: "Your bias is the member you connect with most — your ult bias is the one above all. Having a bias does not mean you cannot love the whole group (that's bias wrecking territory).",
        bg: "Bias е членът, с когото се свързваш най-силно — ult bias е №1. Да имаш bias не значи, че не обичаш цялата група (това вече е bias wrecking).",
      },
    },
    {
      id: "photocards",
      cat: "collect",
      q: { en: "How do photocards work?", bg: "Как работят photocard-ите?" },
      a: {
        en: "Random photocards (PCs) ship inside albums and some merch. Rarer 'inclusions' drive collecting and trading. Always sleeve PCs (penny sleeve + top loader) and buy from reputable sellers.",
        bg: "Random photocard-и (PC) идват в албуми и част от merch-а. По-редките inclusions движат collecting и trading. Винаги слагай sleeve (penny sleeve + top loader) и купувай от надеждни продавачи.",
      },
    },
    {
      id: "lightstick",
      cat: "concert",
      q: { en: "Do I need an official light stick at concerts?", bg: "Трябва ли ми официален light stick на концерт?" },
      a: {
        en: "Venues often allow official sticks and sometimes generic ones. Bluetooth-synced official sticks create the sea of colour for your fandom. Check each venue's policy before you fly.",
        bg: "Залите често допускат официални sticks и понякога generic. Bluetooth-синхронизираните официални sticks правят морето от цвят. Провери политиката на залата преди полет.",
      },
    },
    {
      id: "charts",
      cat: "music",
      q: { en: "Why do fans stream and buy multiple album versions?", bg: "Защо феновете стриймват и купуват много версии на албум?" },
      a: {
        en: "Physical sales and streams feed Hanteo, Circle, Billboard, and Spotify charts. Multiple versions = more PCs + stronger charting. Always support through official stores when you can.",
        bg: "Физическите продажби и стриймовете влизат в Hanteo, Circle, Billboard и Spotify. Повече версии = повече PC + по-силен charting. Подкрепяй през официални магазини, когато можеш.",
      },
    },
    {
      id: "weverse",
      cat: "fandom",
      q: { en: "What is Weverse?", bg: "Какво е Weverse?" },
      a: {
        en: "Weverse is the official fan community + shop platform used by many HYBE and partner artists for lives, posts, memberships, and merch.",
        bg: "Weverse е официалната fan community + shop платформа за много HYBE и partner артисти - live-ове, постове, memberships и merch.",
      },
    },
    {
      id: "tickets",
      cat: "concert",
      q: { en: "How do I get concert tickets fairly?", bg: "Как да взема билети честно?" },
      a: {
        en: "Use official sellers (Ticketmaster, Interpark, Yes24, Weverse tickets where offered). Register early, enable sale alerts, avoid scalpers. Fan-club pre-sales often need membership.",
        bg: "Ползвай официални продавачи (Ticketmaster, Interpark, Yes24, Weverse tickets). Регистрирай се рано, включи известия, избягвай скалпъри. Fan-club pre-sale често иска membership.",
      },
    },
    {
      id: "solo-vs-group",
      cat: "music",
      q: { en: "Solo releases vs group eras?", bg: "Solo издания срещу group ери?" },
      a: {
        en: "Many idols release solo music between group comebacks. Solos expand the artistry; group eras reunite the full stage chemistry. Super fans usually stream both.",
        bg: "Много идоли пускат solo между group comeback-и. Solo разширява артистичността; group ерите връщат пълната stage chemistry. Супер феновете обикновено стриймват и двете.",
      },
    },
    {
      id: "safe-trade",
      cat: "collect",
      q: { en: "How to trade photocards safely?", bg: "Как безопасно да разменям photocard-и?" },
      a: {
        en: "Use tracked shipping, clear photos of both sides + imperfections, GOAT/proof formats in trusted communities, and never send first to brand-new accounts without refs.",
        bg: "Проследяема пратка, ясни снимки от двете страни + дефекти, proof формати в доверени общности и никога не пращай първи към нови акаунти без референции.",
      },
    },
    {
      id: "biasdrop",
      cat: "site",
      q: { en: "Is BiasDrop an official store?", bg: "BiasDrop официален магазин ли е?" },
      a: {
        en: "No. BiasDrop is a HeyLead preview / fan-culture demo. Merch items are illustrative. Buy real MD from Weverse Shop, official agency shops, or licensed retailers like KPOP USA.",
        bg: "Не. BiasDrop е HeyLead preview / fan-culture демо. Merch артикулите са илюстративни. Купувай реален MD от Weverse Shop, официални agency shops или лицензирани магазини като KPOP USA.",
      },
    },
    {
      id: "languages",
      cat: "site",
      q: { en: "Which languages does the site support?", bg: "Кои езици поддържа сайтът?" },
      a: {
        en: "Bulgarian is the primary language. English (UK) is available via the footer language pills. Preference is saved in your browser.",
        bg: "Българският е основният език. English (UK) е наличен през езиковите pills в footer-а. Предпочитанието се пази в браузъра.",
      },
    },
  ];

  const resources = [
    { id: "weverse", name: "Weverse", url: "https://weverse.io/", desc: { en: "Official fan platform & shop", bg: "Официална fan платформа и shop" } },
    { id: "weverse-shop", name: "Weverse Shop", url: "https://shop.weverse.io/en/home", desc: { en: "Official merch & albums", bg: "Официален merch и албуми" } },
    { id: "kpopusa", name: "KPOP USA", url: "https://kpopusaonline.com/", desc: { en: "US licensed retailer", bg: "Лицензиран US retailer" } },
    { id: "spotify-kpop", name: "Spotify K-Pop Hub", url: "https://open.spotify.com/genre/0JQ5DAqbMKFEC4WFtoNRpw", desc: { en: "Playlists & charts", bg: "Плейлисти и chart-ове" } },
    { id: "melon", name: "Melon", url: "https://www.melon.com/", desc: { en: "Korean charts & music", bg: "Корейски chart-ове и музика" } },
    { id: "hanteo", name: "Hanteo Chart", url: "https://www.hanteochart.com/", desc: { en: "Physical sales charts", bg: "Chart-ове за физически продажби" } },
    { id: "circle", name: "Circle Chart", url: "https://circlechart.kr/", desc: { en: "Official KR music charts", bg: "Официални KR музикални chart-ове" } },
    { id: "soompi", name: "Soompi", url: "https://www.soompi.com/", desc: { en: "News & features", bg: "Новини и материали" } },
    { id: "allkpop", name: "allkpop", url: "https://www.allkpop.com/", desc: { en: "K-pop news", bg: "K-pop новини" } },
    { id: "ticketmaster", name: "Ticketmaster", url: "https://www.ticketmaster.com/", desc: { en: "Concert tickets (many markets)", bg: "Концертни билети (много пазари)" } },
    { id: "interpark", name: "Interpark Global", url: "https://www.globalinterpark.com/", desc: { en: "KR tickets for international fans", bg: "KR билети за международни фенове" } },
    { id: "kpopwiki", name: "Kpop Wiki", url: "https://kpop.fandom.com/", desc: { en: "Community encyclopedia", bg: "Community енциклопедия" } },
  ];

  function getArtist(id) {
    return artists.find((a) => a.id === id) || null;
  }

  function getConcertsByArtist(artistId) {
    return concerts
      .filter((c) => c.artistId === artistId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function getAllAlbums() {
    const list = [];
    artists.forEach((a) => {
      (a.discography || []).forEach((d) => {
        list.push({ ...d, artistId: a.id, artistName: a.name, color: a.color });
      });
    });
    return list.sort((a, b) => b.year - a.year || a.artistName.localeCompare(b.artistName));
  }

  function getAllSongs() {
    const list = [];
    artists.forEach((a) => {
      (a.songs || []).forEach((s) => {
        list.push({ ...s, artistId: a.id, artistName: a.name, color: a.color });
      });
    });
    return list.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  }

  function bio(artist, lang) {
    if (!artist || !artist.bio) return "";
    return artist.bio[lang] || artist.bio.en || "";
  }

  function faqText(item, field, lang) {
    return (item[field] && (item[field][lang] || item[field].en)) || "";
  }

  return {
    artists,
    concerts,
    faqs,
    resources,
    getArtist,
    getConcertsByArtist,
    getAllAlbums,
    getAllSongs,
    bio,
    faqText,
  };
})();
