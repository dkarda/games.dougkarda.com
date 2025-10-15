const imgBaseUrlBaseball =
  import.meta.env.VITE_IMG_BASE_URL + "sports/logos/baseball/";
const imgBaseUrlHockey =
  import.meta.env.VITE_IMG_BASE_URL + "sports/logos/hockey/";
const imgBaseUrlRockAlbums =
  import.meta.env.VITE_IMG_BASE_URL + "music/albums/";
const imgBaseUrlHalloween =
  import.meta.env.VITE_IMG_BASE_URL + "halloween/";

export const cardImageBackBaseball = imgBaseUrlBaseball + "baseball.webp";
export const cardImageBackHockey = imgBaseUrlHockey + "nhl-shield.svg";
export const cardImageBackRockAlbums = imgBaseUrlRockAlbums + "album-plain.webp";
export const cardImageBackHalloween = imgBaseUrlHalloween + "halloween-generic-pattern-orange.webp";

export const cardImagesALEast = [
  { src: imgBaseUrlBaseball + "bluejays.svg", matched: false },
  { src: imgBaseUrlBaseball + "orioles.svg", matched: false },
  { src: imgBaseUrlBaseball + "rays.svg", matched: false },
  { src: imgBaseUrlBaseball + "redsox.svg", matched: false },
  { src: imgBaseUrlBaseball + "yankees.svg", matched: false },
];
export const cardImagesALCentral = [
  { src: imgBaseUrlBaseball + "guardians.svg", matched: false },
  { src: imgBaseUrlBaseball + "royals.svg", matched: false },
  { src: imgBaseUrlBaseball + "tigers.svg", matched: false },
  { src: imgBaseUrlBaseball + "twins.svg", matched: false },
  { src: imgBaseUrlBaseball + "whitesox.svg", matched: false },
];
export const cardImagesALWest = [
  { src: imgBaseUrlBaseball + "angels.svg", matched: false },
  { src: imgBaseUrlBaseball + "astros.svg", matched: false },
  { src: imgBaseUrlBaseball + "athletics.svg", matched: false },
  { src: imgBaseUrlBaseball + "mariners.svg", matched: false },
  { src: imgBaseUrlBaseball + "rangers.svg", matched: false },
];
export const cardImagesNLEast = [
  { src: imgBaseUrlBaseball + "braves.svg", matched: false },
  { src: imgBaseUrlBaseball + "marlins.svg", matched: false },
  { src: imgBaseUrlBaseball + "mets.svg", matched: false },
  { src: imgBaseUrlBaseball + "nationals.svg", matched: false },
  { src: imgBaseUrlBaseball + "phillies.svg", matched: false },
];
export const cardImagesNLCentral = [
  { src: imgBaseUrlBaseball + "brewers.svg", matched: false },
  { src: imgBaseUrlBaseball + "cardinals.svg", matched: false },
  { src: imgBaseUrlBaseball + "cubs.svg", matched: false },
  { src: imgBaseUrlBaseball + "pirates.svg", matched: false },
  { src: imgBaseUrlBaseball + "reds.svg", matched: false },
];
export const cardImagesNLWest = [
  { src: imgBaseUrlBaseball + "diamondbacks.svg", matched: false },
  { src: imgBaseUrlBaseball + "dodgers.svg", matched: false },
  { src: imgBaseUrlBaseball + "giants.svg", matched: false },
  { src: imgBaseUrlBaseball + "padres.svg", matched: false },
  { src: imgBaseUrlBaseball + "rockies.svg", matched: false },
];
export const cardImagesHockey = [
  { src: imgBaseUrlHockey + "rangers.svg", matched: false },
  { src: imgBaseUrlHockey + "redwings.svg", matched: false },
  { src: imgBaseUrlHockey + "blackhawks.svg", matched: false },
  { src: imgBaseUrlHockey + "mapleleafs.svg", matched: false },
  { src: imgBaseUrlHockey + "bruins.svg", matched: false },
  { src: imgBaseUrlHockey + "canadiens.svg", matched: false },
  { src: imgBaseUrlHockey + "bluejackets.svg", matched: false },
  { src: imgBaseUrlHockey + "stars.svg", matched: false },
  { src: imgBaseUrlHockey + "lightning.svg", matched: false },
  { src: imgBaseUrlHockey + "sharks.svg", matched: false },
  { src: imgBaseUrlHockey + "goldenknights.svg", matched: false },
  { src: imgBaseUrlHockey + "oilers.svg", matched: false },
];
export const cardImagesRockAlbums = [
  { src: imgBaseUrlRockAlbums + "aerosmith-toysintheattic.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "allmanbrothersband-eatapeach.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "eagles-hotelcalifornia.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "jimihendrix-areyouexperienced.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "led-zeppelin-iv.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "lynyrdskynyrd-pronouncedlehnerdskinnerd.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "patbenatar-getnervous.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "pinkfloyd-darksideofthemoon.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "queen-anightattheopera.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "rollingstones-letitbleed.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "rush-moving-pictures.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "styx-piecesofeight.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "thedoors-thedoors.webp", matched: false },
  { src: imgBaseUrlRockAlbums + "thewho-whosnext.webp", matched: false },
];
export const cardImagesHalloween = [
  { src: imgBaseUrlHalloween + "bat.webp", matched: false },
  { src: imgBaseUrlHalloween + "blackcat.webp", matched: false },
  { src: imgBaseUrlHalloween + "cauldron.webp", matched: false },
  { src: imgBaseUrlHalloween + "ghost.webp", matched: false },
  { src: imgBaseUrlHalloween + "pumpkin.webp", matched: false },
  { src: imgBaseUrlHalloween + "skeleton.webp", matched: false },
  { src: imgBaseUrlHalloween + "spider.webp", matched: false },
  { src: imgBaseUrlHalloween + "spiderweb.webp", matched: false },
  { src: imgBaseUrlHalloween + "tombstone.webp", matched: false },
  { src: imgBaseUrlHalloween + "witch.webp", matched: false },
];
