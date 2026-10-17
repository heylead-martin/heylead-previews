// URA Master Plan 2019 planning areas, downloaded 12 October 2026.
// Source: https://data.gov.sg/datasets/d_4765db0e87b9c86336792efe8a1f7a66/view
// Singapore Open Data Licence: https://data.gov.sg/open-data-licence
export const regions = {
  "Central": [
    "Bishan",
    "Bukit Merah",
    "Bukit Timah",
    "Downtown Core",
    "Geylang",
    "Kallang",
    "Marina East",
    "Marina South",
    "Marine Parade",
    "Museum",
    "Newton",
    "Novena",
    "Orchard",
    "Outram",
    "Queenstown",
    "River Valley",
    "Rochor",
    "Singapore River",
    "Southern Islands",
    "Straits View",
    "Tanglin",
    "Toa Payoh"
  ],
  "East": [
    "Bedok",
    "Changi",
    "Changi Bay",
    "Pasir Ris",
    "Paya Lebar",
    "Tampines"
  ],
  "North": [
    "Central Water Catchment",
    "Lim Chu Kang",
    "Mandai",
    "Sembawang",
    "Simpang",
    "Sungei Kadut",
    "Woodlands",
    "Yishun"
  ],
  "North-East": [
    "Ang Mo Kio",
    "Hougang",
    "North-Eastern Islands",
    "Punggol",
    "Seletar",
    "Sengkang",
    "Serangoon"
  ],
  "West": [
    "Boon Lay",
    "Bukit Batok",
    "Bukit Panjang",
    "Choa Chu Kang",
    "Clementi",
    "Jurong East",
    "Jurong West",
    "Pioneer",
    "Tengah",
    "Tuas",
    "Western Islands",
    "Western Water Catchment"
  ]
};
export const areaSlug = name => name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
export const planningAreas = Object.entries(regions).flatMap(([region,names]) => names.map(name=>({name,region,slug:areaSlug(name)})));
export const findArea = value => planningAreas.find(area=>area.slug===areaSlug(String(value||'')));
export const locationNames = new Set(['Islandwide',...Object.keys(regions),...planningAreas.map(a=>a.name)]);
export function coverageMatch(names=[], selected) {
  const area=findArea(selected);
  if(!area)return null;
  if(names.includes(area.name))return {rank:0,kind:'town',label:`Serves ${area.name}`};
  if(names.includes(area.region))return {rank:1,kind:'region',label:`Serves ${area.region} region`};
  if(names.includes('Islandwide'))return {rank:2,kind:'islandwide',label:'Islandwide'};
  if(!names.length)return {rank:3,kind:'unstated',label:'Areas not stated'};
  return null;
}
