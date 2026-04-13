import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { X, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import flagsCompleteData from "@/lib/flags_complete.json";

interface FlagEntry {
  name: string;
  imageUrl: string | null;
  description: string | null;
  continent: string | null;
  countryCode: string;
  isNational: boolean;
}

// Mapping of country names to ISO 3166-1 alpha-2 codes
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  "Italy": "IT", "France": "FR", "Spain": "ES", "Germany": "DE", "United Kingdom": "GB",
  "Portugal": "PT", "Netherlands": "NL", "Belgium": "BE", "Switzerland": "CH", "Austria": "AT",
  "Sweden": "SE", "Norway": "NO", "Denmark": "DK", "Finland": "FI", "Poland": "PL",
  "Czech Republic": "CZ", "Czechia": "CZ", "Hungary": "HU", "Romania": "RO", "Greece": "GR", "Ireland": "IE",
  "Iceland": "IS", "Luxembourg": "LU", "Malta": "MT", "Cyprus": "CY", "Slovenia": "SI",
  "Andorra": "AD", "Liechtenstein": "LI", "Monaco": "MC", "San Marino": "SM", "Vatican City": "VA",
  "Croatia": "HR", "Bosnia and Herzegovina": "BA", "Serbia": "RS", "Montenegro": "ME",
  "North Macedonia": "MK", "Bulgaria": "BG", "Albania": "AL", "Kosovo": "XK", "Slovakia": "SK",
  "Lithuania": "LT", "Latvia": "LV", "Estonia": "EE", "Belarus": "BY", "Ukraine": "UA",
  "Moldova": "MD", "Georgia": "GE", "Armenia": "AM", "Azerbaijan": "AZ", "Kazakhstan": "KZ", "Russia": "RU",
  "Uzbekistan": "UZ", "Turkmenistan": "TM", "Tajikistan": "TJ", "Kyrgyzstan": "KG",
  "Japan": "JP", "China": "CN", "India": "IN", "Pakistan": "PK", "Bangladesh": "BD",
  "Sri Lanka": "LK", "Nepal": "NP", "Bhutan": "BT", "Thailand": "TH", "Vietnam": "VN",
  "Cambodia": "KH", "Laos": "LA", "Myanmar": "MM", "Malaysia": "MY", "Singapore": "SG",
  "Indonesia": "ID", "Philippines": "PH", "South Korea": "KR", "North Korea": "KP",
  "Mongolia": "MN", "Taiwan": "TW", "Hong Kong": "HK", "Macau": "MO", "Iran": "IR",
  "Iraq": "IQ", "Syria": "SY", "Lebanon": "LB", "Israel": "IL", "Palestine": "PS",
  "Jordan": "JO", "Saudi Arabia": "SA", "Yemen": "YE", "Oman": "OM",
  "United Arab Emirates": "AE", "Qatar": "QA", "Bahrain": "BH", "Kuwait": "KW",
  "Turkey": "TR", "Afghanistan": "AF", "Brunei": "BN", "Timor-Leste": "TL",
  "East Timor": "TL", "Maldives": "MV", "United States": "US", "USA": "US",
  "Canada": "CA", "Mexico": "MX", "Brazil": "BR", "Argentina": "AR", "Chile": "CL",
  "Colombia": "CO", "Peru": "PE", "Venezuela": "VE", "Ecuador": "EC", "Bolivia": "BO",
  "Paraguay": "PY", "Uruguay": "UY", "Suriname": "SR", "Guyana": "GY", "Panama": "PA",
  "Costa Rica": "CR", "Guatemala": "GT", "Honduras": "HN", "El Salvador": "SV",
  "Nicaragua": "NI", "Belize": "BZ", "Jamaica": "JM", "Trinidad and Tobago": "TT",
  "Bahamas": "BS", "Barbados": "BB", "Saint Lucia": "LC", "Grenada": "GD",
  "Antigua and Barbuda": "AG", "Dominica": "DM", "Dominican Republic": "DO",
  "Saint Kitts and Nevis": "KN", "Saint Vincent and the Grenadines": "VC",
  "Haiti": "HT", "Cuba": "CU", "Puerto Rico": "PR", "South Africa": "ZA",
  "Egypt": "EG", "Nigeria": "NG", "Ethiopia": "ET", "Kenya": "KE", "Uganda": "UG",
  "Tanzania": "TZ", "Rwanda": "RW", "Burundi": "BI", "Zimbabwe": "ZW", "Zambia": "ZM",
  "Botswana": "BW", "Namibia": "NA", "Angola": "AO", "Mozambique": "MZ", "Malawi": "MW",
  "Madagascar": "MG", "Mauritius": "MU", "Seychelles": "SC", "Ghana": "GH",
  "Ivory Coast": "CI", "Côte d'Ivoire": "CI", "Senegal": "SN", "Mali": "ML",
  "Morocco": "MA", "Mauritania": "MR", "Tunisia": "TN", "Algeria": "DZ", "Libya": "LY", "Sudan": "SD",
  "South Sudan": "SS", "Cameroon": "CM", "Gabon": "GA", "Congo": "CG",
  "Democratic Republic of the Congo": "CD", "DRC": "CD", "Central African Republic": "CF",
  "Benin": "BJ", "Togo": "TG", "Liberia": "LR", "Sierra Leone": "SL", "Guinea": "GN",
  "Guinea-Bissau": "GW", "Gambia": "GM", "Burkina Faso": "BF", "Niger": "NE",
  "Chad": "TD", "Djibouti": "DJ", "Somalia": "SO", "Eritrea": "ER", "Eswatini": "SZ",
  "Swaziland": "SZ", "Lesotho": "LS", "Cape Verde": "CV", "Comoros": "KM",
  "Equatorial Guinea": "GQ", "São Tomé and Príncipe": "ST", "Australia": "AU",
  "New Zealand": "NZ", "Fiji": "FJ", "Papua New Guinea": "PG", "Solomon Islands": "SB",
  "Vanuatu": "VU", "Samoa": "WS", "Kiribati": "KI", "Micronesia": "FM", "Palau": "PW",
  "Marshall Islands": "MH", "Nauru": "NR", "Tuvalu": "TV", "Tonga": "TO",
  "French Polynesia": "PF", "Wallis and Futuna": "WF",
  "Federated States of Micronesia": "FM",
  "French collectivities in Melanesia": "FR", "French collectivities in Polynesia": "FR",
  "United Kingdom in Polynesia": "GB",
  "United States in Micronesia": "US", "United States in Polynesia": "US",
  "Republic of the Congo": "CG",
};

// Flatten the nested flags structure at runtime
function flattenFlags(data: typeof flagsCompleteData): FlagEntry[] {
  const flattened: FlagEntry[] = [];

  Object.entries(data.continents).forEach(([continentName, continent]) => {
    Object.entries(continent).forEach(([countryName, countryData]) => {
      // Handle cultural flags array at continent level
      if (countryName === "cultural" && Array.isArray(countryData)) {
        (countryData as any[]).forEach((flag: any) => {
          flattened.push({
            name: flag.name.trim(),
            imageUrl: flag.link_flag || null,
            description: flag.description || null,
            continent: continentName,
            countryCode: "CULTURAL",
            isNational: false,
          });
        });
        return;
      }

      const countryCode = COUNTRY_NAME_TO_CODE[countryName] || countryName;

      // Add national flag
      const national = (countryData as any).national;
      if (national) {
        flattened.push({
          name: national.name.trim(),
          imageUrl: national.link_flag || null,
          description: national.description || null,
          continent: continentName,
          countryCode,
          isNational: true,
        });
      }

      // Add subdivisions
      const subdivisions = (countryData as any).subdivisions;
      if (subdivisions && Array.isArray(subdivisions)) {
        subdivisions.forEach((subdivision: any) => {
          flattened.push({
            name: subdivision.name.trim(),
            imageUrl: subdivision.link_flag || null,
            description: subdivision.description || null,
            continent: continentName,
            countryCode,
            isNational: false,
          });
        });
      }
    });
  });

  // Add LGBT flags
  const lgbtFlags = (data as any).lgbtFlags;
  if (lgbtFlags) {
    Object.values(lgbtFlags).forEach((flag: any) => {
      flattened.push({
        name: flag.name.trim(),
        imageUrl: flag.link_flag || null,
        description: flag.description || null,
        continent: null,
        countryCode: "XX",
        isNational: false,
      });
    });
  }

  return flattened;
}

const allFlags = flattenFlags(flagsCompleteData);

// Derived from JSON — keeps continents/countries in sync with the data file
const CONTINENT_KEYS: string[] = Object.keys(flagsCompleteData.continents);

const COUNTRIES_BY_CONTINENT: Record<string, string[]> = {};
Object.entries(flagsCompleteData.continents).forEach(([continent, countries]) => {
  COUNTRIES_BY_CONTINENT[continent] = Object.keys(countries as object)
    .filter((k) => k !== "cultural")
    .sort();
});

function formatContinent(c: string): string {
  return c.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// Keywords for searching flags (enables searching by broader terms)
const FLAG_KEYWORDS: Record<string, string[]> = {
  "Aromantic Flag": ["aromantic", "aromantico", "aro"],
  "Asexual Flag": ["asexual", "asessuale", "ace", "aces"],
  "Bear Brotherhood Flag": ["bear", "orso", "brotherhood", "fraternità"],
  "Bisexual Flag": ["bisexual", "bisessuale", "bi"],
  "Gay Pride Flag": ["gay", "pride", "orgoglio", "lgbt", "lgbtq"],
  "Intersex Flag": ["intersex", "intersessuale"],
  "Lesbian Flag": ["lesbian", "lesbica", "wlw"],
  "Nonbinary Flag": ["nonbinary", "non-binary", "non binario", "nb", "enby"],
  "Pansexual Flag": ["pansexual", "pansessuale", "pan"],
  "Transgender Flag": ["transgender", "trans", "transgender", "mtf", "ftm"],
};

// Italian translations of flag names
const FLAG_NAME_ITALIAN: Record<string, string> = {
  "Aromantic Flag": "Bandiera Aromantica",
  "Asexual Flag": "Bandiera Asessuale",
  "Bear Brotherhood Flag": "Bandiera Bear Brotherhood",
  "Bisexual Flag": "Bandiera Bisessuale",
  "Gay Pride Flag": "Bandiera Pride Gay",
  "Intersex Flag": "Bandiera Intersessuale",
  "Lesbian Flag": "Bandiera Lesbica",
  "Nonbinary Flag": "Bandiera Non Binaria",
  "Pansexual Flag": "Bandiera Pansessuale",
  "Transgender Flag": "Bandiera Transgender",
  "Italy": "Italia", "France": "Francia", "Spain": "Spagna", "Germany": "Germania", "United Kingdom": "Regno Unito",
  "England": "Inghilterra", "Scotland": "Scozia", "Wales": "Galles", "Northern Ireland": "Irlanda del Nord",
  "Portugal": "Portogallo", "Netherlands": "Paesi Bassi", "Belgium": "Belgio", "Switzerland": "Svizzera", "Austria": "Austria",
  "Sweden": "Svezia", "Norway": "Norvegia", "Denmark": "Danimarca", "Finland": "Finlandia", "Poland": "Polonia",
  "Czech Republic": "Repubblica Ceca", "Czechia": "Cechia", "Hungary": "Ungheria", "Romania": "Romania", "Greece": "Grecia",
  "Ireland": "Irlanda", "Iceland": "Islanda", "Luxembourg": "Lussemburgo", "Malta": "Malta", "Cyprus": "Cipro",
  "Slovenia": "Slovenia", "Croatia": "Croazia", "Bosnia and Herzegovina": "Bosnia ed Erzegovina", "Serbia": "Serbia",
  "Montenegro": "Montenegro", "North Macedonia": "Macedonia del Nord", "Bulgaria": "Bulgaria", "Albania": "Albania",
  "Kosovo": "Kosovo", "Slovakia": "Slovacchia", "Lithuania": "Lituania", "Latvia": "Lettonia", "Estonia": "Estonia",
  "Belarus": "Bielorussia", "Ukraine": "Ucraina", "Moldova": "Moldavia", "Georgia": "Georgia", "Armenia": "Armenia",
  "Azerbaijan": "Azerbaigian", "Kazakhstan": "Kazakistan", "Uzbekistan": "Uzbekistan", "Turkmenistan": "Turkmenistan",
  "Tajikistan": "Tagikistan", "Kyrgyzstan": "Kirghizistan",
  "Japan": "Giappone", "China": "Cina", "India": "India", "Pakistan": "Pakistan", "Bangladesh": "Bangladesh",
  "Sri Lanka": "Sri Lanka", "Nepal": "Nepal", "Bhutan": "Bhutan", "Thailand": "Tailandia", "Vietnam": "Vietnam",
  "Cambodia": "Cambogia", "Laos": "Laos", "Myanmar": "Myanmar", "Malaysia": "Malesia", "Singapore": "Singapore",
  "Indonesia": "Indonesia", "Philippines": "Filippine", "South Korea": "Corea del Sud", "North Korea": "Corea del Nord",
  "Mongolia": "Mongolia", "Taiwan": "Taiwan", "Hong Kong": "Hong Kong", "Macau": "Macao", "Iran": "Iran", "Iraq": "Iraq",
  "Syria": "Siria", "Lebanon": "Libano", "Israel": "Israele", "Palestine": "Palestina", "Jordan": "Giordania",
  "Saudi Arabia": "Arabia Saudita", "Yemen": "Yemen", "Oman": "Oman", "United Arab Emirates": "Emirati Arabi Uniti",
  "Qatar": "Qatar", "Bahrain": "Bahrein", "Kuwait": "Kuwait", "Turkey": "Turchia", "Afghanistan": "Afghanistan",
  "Brunei": "Brunei", "Timor-Leste": "Timor Est", "East Timor": "Timor Est", "Maldives": "Maldive",
  "United States": "Stati Uniti", "USA": "USA", "Canada": "Canada", "Mexico": "Messico", "Brazil": "Brasile",
  "Argentina": "Argentina", "Chile": "Cile", "Colombia": "Colombia", "Peru": "Perù", "Venezuela": "Venezuela",
  "Ecuador": "Ecuador", "Bolivia": "Bolivia", "Paraguay": "Paraguay", "Uruguay": "Uruguay", "Suriname": "Suriname",
  "Guyana": "Guyana", "Panama": "Panama", "Costa Rica": "Costa Rica", "Guatemala": "Guatemala", "Honduras": "Honduras",
  "El Salvador": "El Salvador", "Nicaragua": "Nicaragua", "Belize": "Belize", "Jamaica": "Giamaica",
  "Trinidad and Tobago": "Trinidad e Tobago", "Bahamas": "Bahamas", "Barbados": "Barbados", "Saint Lucia": "Santa Lucia",
  "Grenada": "Grenada", "Antigua and Barbuda": "Antigua e Barbuda", "Dominica": "Dominica",
  "Dominican Republic": "Repubblica Dominicana", "Haiti": "Haiti", "Cuba": "Cuba", "Puerto Rico": "Porto Rico",
  "South Africa": "Sudafrica", "Egypt": "Egitto", "Nigeria": "Nigeria", "Ethiopia": "Etiopia", "Kenya": "Kenya",
  "Uganda": "Uganda", "Tanzania": "Tanzania", "Rwanda": "Ruanda", "Burundi": "Burundi", "Zimbabwe": "Zimbabwe",
  "Zambia": "Zambia", "Botswana": "Botswana", "Namibia": "Namibia", "Angola": "Angola", "Mozambique": "Mozambico",
  "Malawi": "Malawi", "Madagascar": "Madagascar", "Mauritius": "Mauritius", "Seychelles": "Seychelles", "Ghana": "Ghana",
  "Ivory Coast": "Costa d'Avorio", "Côte d'Ivoire": "Costa d'Avorio", "Senegal": "Senegal", "Mali": "Mali",
  "Mauritania": "Mauritania", "Tunisia": "Tunisia", "Algeria": "Algeria", "Libya": "Libia", "Sudan": "Sudan",
  "South Sudan": "Sud Sudan", "Cameroon": "Camerun", "Gabon": "Gabon", "Congo": "Congo", "Democratic Republic of the Congo": "Repubblica Democratica del Congo",
  "DRC": "RDC", "Central African Republic": "Repubblica Centrafricana", "Benin": "Benin", "Togo": "Togo",
  "Liberia": "Liberia", "Sierra Leone": "Sierra Leone", "Guinea": "Guinea", "Guinea-Bissau": "Guinea-Bissau",
  "Gambia": "Gambia", "Burkina Faso": "Burkina Faso", "Niger": "Niger", "Chad": "Ciad", "Djibouti": "Gibuti",
  "Somalia": "Somalia", "Eritrea": "Eritrea", "Eswatini": "Eswatini", "Swaziland": "Swaziland", "Lesotho": "Lesotho",
  "Cape Verde": "Capo Verde", "Comoros": "Comore", "Equatorial Guinea": "Guinea Equatoriale",
  "São Tomé and Príncipe": "São Tomé e Príncipe",
  "Australia": "Australia", "New Zealand": "Nuova Zelanda", "Fiji": "Figi", "Papua New Guinea": "Papua Nuova Guinea",
  "Solomon Islands": "Isole Salomone", "Vanuatu": "Vanuatu", "Samoa": "Samoa", "Kiribati": "Kiribati",
  "Micronesia": "Micronesia", "Palau": "Palau", "Marshall Islands": "Isole Marshall", "Nauru": "Nauru", "Tuvalu": "Tuvalu",
  // Oceania territories
  "French Polynesia": "Polinesia Francese", "New Caledonia": "Nuova Caledonia",
  "Wallis and Futuna": "Wallis e Futuna", "American Samoa": "Samoa Americane",
  // Italian regions
  "the Aosta Valley": "Valle d'Aosta", "Apulia": "Puglia", "Lombardy": "Lombardia",
  "Piedmont": "Piemonte", "Sardinia": "Sardegna", "Sicily": "Sicilia", "Tuscany": "Toscana",
  "Trentino-Alto Adige-Sudtirol": "Trentino-Alto Adige",
  // Czech regions
  "Bohemia": "Boemia", "Prague": "Praga",
  "Central Bohemian Region": "Regione della Boemia Centrale",
  "South Bohemian Region": "Regione della Boemia Meridionale",
  "Plzeň Region": "Regione di Plzeň", "Karlovy Vary Region": "Regione di Karlovy Vary",
  "Ústí nad Labem Region": "Regione di Ústí nad Labem", "Liberec Region": "Regione di Liberec",
  "Hradec Králové Region": "Regione di Hradec Králové", "Pardubice Region": "Regione di Pardubice",
  "Vysočina Region": "Regione di Vysočina", "South Moravian Region": "Regione della Moravia Meridionale",
  "Olomouc Region": "Regione di Olomouc", "Zlín Region": "Regione di Zlín",
  "Moravian-Silesian Region": "Regione Moravo-Slesiana",
  // French regions & territories
  "Brittany": "Bretagna", "Normandy": "Normandia", "Corsica": "Corsica",
  "Provence-Alpes-Côte d'Azur": "Provenza-Alpi-Costa Azzurra",
  "Bourgogne-Franche-Comté": "Borgogna-Franco Contea",
  "French Guiana": "Guyana Francese", "Guadeloupe": "Guadalupa",
  "Martinique": "Martinica", "Réunion": "La Riunione", "Mayotte": "Mayotte",
  "Saint Pierre and Miquelon": "Saint-Pierre e Miquelon",
  // Spanish regions
  "Andalusia": "Andalusia", "Aragon": "Aragona", "Asturias": "Asturie",
  "the Balearic Islands": "Isole Baleari", "the Basque Country": "Paesi Baschi",
  "Cantabria": "Cantabria", "the Canary Islands": "Isole Canarie",
  "Castilla–La Mancha": "Castiglia-La Mancia", "Castile and León": "Castiglia e León",
  "Catalonia": "Catalogna", "Extremadura": "Estremadura", "Galicia": "Galizia",
  "La Rioja": "La Rioja", "the Community of Madrid": "Comunità di Madrid",
  "the Region of Murcia": "Regione di Murcia", "Navarre": "Navarra",
  "the Valencian Community": "Comunità Valenciana",
  // German states
  "Bavaria": "Baviera", "Berlin": "Berlino", "Brandenburg": "Brandeburgo",
  "Bremen": "Brema", "Hamburg": "Amburgo", "Hesse": "Assia",
  "Lower Saxony": "Bassa Sassonia",
  "Mecklenburg-Western Pomerania": "Meclemburgo-Pomerania Occidentale",
  "North Rhine-Westphalia": "Renania Settentrionale-Westfalia",
  "Rhineland-Palatinate": "Renania-Palatinato", "Saxony": "Sassonia",
  "Saxony-Anhalt": "Sassonia-Anhalt", "Thuringia": "Turingia",
  // UK territories
  "Falkland Islands": "Isole Falkland", "Gibraltar": "Gibilterra",
  "Cayman Islands": "Isole Cayman", "British Virgin Islands": "Isole Vergini Britanniche",
  "the Isle of Man": "Isola di Man", "Anguilla": "Anguilla",
  "Bermuda": "Bermuda", "British Antarctic Territory": "Territorio Antartico Britannico",
  "Montserrat": "Montserrat", "Turks and Caicos Islands": "Isole Turks e Caicos",
  // Cultural flags — Italy & surroundings
  "Italians": "Italiani", "Venice": "Venezia", "Rome": "Roma",
  "Genova": "Genova", "Emilia": "Emilia", "Romagna": "Romagna",
  "Friulians": "Friulani", "Sicilians": "Siciliani", "Salentini": "Salentini",
  "Triestini": "Triestini", "Ladinia": "Ladinia", "Venezia Giulia": "Venezia Giulia",
  "South Tyrol": "Alto Adige", "Elba": "Elba",
  // Cultural flags — Europe
  "Flemings": "Fiamminghi", "Cornwall": "Cornovaglia",
  "Occitania": "Occitania", "Alsace": "Alsazia", "Auvergne": "Alvernia",
  "Lorraine": "Lorena", "Provence": "Provenza", "Savoie": "Savoia",
  "Burgundy": "Borgogna", "Basques": "Baschi",
  "Catalans": "Catalani", "Galicians": "Galiziani",
  "Bohemians": "Boemi", "Moravians": "Moravi",
  "Czechs": "Cechi", "Slovaks": "Slovacchi",
  "Hungarians (Magyars)": "Ungheresi (Magiari)", "Romanians": "Romeni",
  "Flemish": "Fiamminghi",
  "Romani people": "Popolo Rom", "Sami people": "Popolo Sami",
  "Basque": "Basco", "Walloons": "Valloni", "Frisians": "Frisoni",
  "Frisia": "Frisia", "Sorbs": "Sorbi", "Karelians": "Careliani",
  "Scots": "Scozzesi", "Irish": "Irlandesi",
  "Sicilian": "Siciliano", "Sardinian": "Sardo",
  // Cultural flags — Middle East & Central Asia
  "Kurdistan": "Kurdistan", "Kurds": "Curdi", "Persians": "Persiani",
  "Uyghurs": "Uiguri", "Tibet": "Tibet", "Tibetans": "Tibetani",
  "Armenians": "Armeni", "Assyrians": "Assiri",
  "Druze": "Drusi", "Maronites": "Maroniti", "Yazidis": "Yazidi",
  "Berbers": "Berberi", "Tuareg people": "Tuareg",
  // Cultural flags — Americas
  "Native Americans": "Nativi Americani", "Mapuches": "Mapuche",
  "Mayas": "Maya", "Mayans": "Maya", "Aztecs": "Aztechi",
  "Guaraní": "Guaraní", "Aymara": "Aymara",
  "Inuit": "Inuit", "Quebec": "Québec",
  "Texas": "Texas", "Alaska": "Alaska",
  // Cultural flags — Africa
  "Yoruba people": "Popolo Yoruba", "Igbo people": "Popolo Igbo",
  "Zulu": "Zulu", "Ashanti": "Ashanti",
  "Pan-African flag": "Bandiera Panafricana",
  // Pan flags
  "Pan-Arab flag": "Bandiera Panaraba", "Pan-Celtic flag": "Bandiera Panceltica",
  "Pan-Hispanic flag": "Bandiera Panispanica", "Pan-Slavic flag": "Bandiera Panslava",
  "Pan-Turkic flag": "Bandiera Panturca",
};

const GET_USERS = gql`
  query GetUsersForPicker {
    users {
      id
      displayName
    }
  }
`;

const GET_MY_FLAGS = gql`
  query GetMyFlagNames {
    myFlags {
      name
      countryCode
      subdivisionCode
    }
  }
`;

const ADD_FLAG = gql`
  mutation AddFlag(
    $name: String!
    $countryCode: String
    $subdivisionCode: String
    $imageUrl: String
    $acquiredAt: Int!
    $isPublic: Boolean
    $description: String
    $continent: String
    $addedByUserId: ID
    $togetherWithUserIds: [ID!]
  ) {
    addFlag(
      name: $name
      countryCode: $countryCode
      subdivisionCode: $subdivisionCode
      imageUrl: $imageUrl
      acquiredAt: $acquiredAt
      isPublic: $isPublic
      description: $description
      continent: $continent
      addedByUserId: $addedByUserId
      togetherWithUserIds: $togetherWithUserIds
    ) {
      id
      name
      imageUrl
      acquiredAt
      isPublic
      addedBy {
        id
        displayName
      }
      togetherWith {
        id
        displayName
      }
    }
  }
`;

interface Props {
  onClose: () => void;
}

export function AddFlagModal({ onClose }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FlagEntry | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualContinent, setManualContinent] = useState("");
  const [manualCountry, setManualCountry] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isPublic, setIsPublic] = useState(true);
  const [addedByUserId, setAddedByUserId] = useState<string>("");
  const [togetherWithUserIds, setTogetherWithUserIds] = useState<string[]>([]);
  const [togetherWithSearch, setTogetherWithSearch] = useState("");
  const [showTogetherWithDropdown, setShowTogetherWithDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const togetherWithRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const { data: usersData } = useQuery(GET_USERS);
  const { data: myFlagsData } = useQuery(GET_MY_FLAGS);

  const [addFlag, { loading }] = useMutation(ADD_FLAG, {
    onCompleted: () => onClose(),
    onError: (e) => setError(e.message),
  });

  const suggestions = query.length >= 2
    ? allFlags
        .filter((f) => {
          const lowerQuery = query.toLowerCase();
          const englishMatch = f.name.toLowerCase().includes(lowerQuery);
          const italianName = FLAG_NAME_ITALIAN[f.name];
          const italianMatch = italianName && italianName.toLowerCase().includes(lowerQuery);
          const keywordsMatch = FLAG_KEYWORDS[f.name]?.some((kw) => kw.includes(lowerQuery) || lowerQuery.includes(kw));
          return englishMatch || italianMatch || keywordsMatch;
        })
        .slice(0, 8)
    : [];

  const handleSelect = (flag: FlagEntry) => {
    setSelected(flag);
    setQuery(flag.name);
    setShowSuggestions(false);
    // Auto-focus on date field after selection
    setTimeout(() => dateInputRef.current?.focus(), 0);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelected(null);
    setIsManualMode(false);
    setShowSuggestions(true);
  };

  const handleEnterManualMode = () => {
    setSelected(null);
    setShowSuggestions(false);
    setIsManualMode(true);
    setManualContinent("");
    setManualCountry("");
  };

  const handleExitManualMode = () => {
    setIsManualMode(false);
    setManualContinent("");
    setManualCountry("");
  };

  const manualEntry: FlagEntry | null =
    isManualMode && query.trim() && manualContinent && manualCountry
      ? {
          name: query.trim(),
          imageUrl: null,
          description: null,
          continent: manualContinent,
          countryCode: COUNTRY_NAME_TO_CODE[manualCountry] ?? manualCountry.slice(0, 3).toUpperCase(),
          isNational: false,
        }
      : null;

  const effectiveSelected = selected ?? manualEntry;

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        togetherWithRef.current &&
        !togetherWithRef.current.contains(e.target as Node)
      ) {
        setShowTogetherWithDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const userFlags = myFlagsData?.myFlags ?? [];
  const userFlagKeys = new Set(
    userFlags.map((f: { countryCode: string; subdivisionCode?: string }) =>
      `${f.countryCode}|${f.subdivisionCode ?? ""}`
    )
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveSelected || !date) return;

    const countryCode = effectiveSelected.countryCode;
    // If it's a national flag, no subdivision code; otherwise use the flag name
    const subdivisionCode = effectiveSelected.isNational ? null : effectiveSelected.name;

    // Check if user already has this exact country/subdivision combination
    const flagKey = `${countryCode}|${subdivisionCode ?? ""}`;
    if (userFlagKeys.has(flagKey)) {
      setError("Hai già questa bandiera nella tua collezione");
      return;
    }

    setError(null);
    const targetUserId = isAdmin && addedByUserId ? addedByUserId : undefined;
    // Refetch profile only when adding for yourself (not on behalf of another user)
    const isAddingForSelf = !targetUserId;
    addFlag({
      variables: {
        name: effectiveSelected.name,
        imageUrl: effectiveSelected.imageUrl ?? undefined,
        acquiredAt: Math.floor(new Date(date).getTime() / 1000),
        isPublic,
        countryCode,
        subdivisionCode,
        description: effectiveSelected.description ?? undefined,
        continent: effectiveSelected.continent ?? undefined,
        addedByUserId: targetUserId,
        togetherWithUserIds: togetherWithUserIds.length > 0 ? togetherWithUserIds : undefined,
      },
      refetchQueries: [
        "GetMyFlags",
        "TopMembers",
        "LastFlag",
        "MostWantedFlag",
        "FlagsGeo",
        ...(isAddingForSelf ? ["MyProfile"] : []),
        ...(isPublic ? ["GetFlags"] : []),
      ],
    });
  };

  const previewUrl = effectiveSelected?.imageUrl ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-md dark:border dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h2 className="text-lg font-semibold">Aggiungi bandiera</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">

          {/* Flag name typeahead */}
          <div className="space-y-1">
            <Label>Nome *</Label>
            <div className="relative">
              <Input
                ref={inputRef}
                placeholder="Cerca una bandiera..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                autoComplete="off"
              />
              {!isManualMode && showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 top-full mt-1 w-full bg-background border rounded-md shadow-md max-h-52 overflow-y-auto"
                >
                  {suggestions.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                      onMouseDown={() => handleSelect(f)}
                    >
                      {f.imageUrl ? (
                        <img
                          src={f.imageUrl}
                          alt=""
                          className="w-7 h-5 object-cover rounded-sm shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-7 h-5 bg-muted rounded-sm shrink-0" />
                      )}
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!isManualMode && suggestions.length === 0 && query.trim().length >= 2 && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                onClick={handleEnterManualMode}
              >
                Bandiera non trovata? Aggiungi manualmente
              </button>
            )}
          </div>

          {/* Manual mode: continent + country */}
          {isManualMode && (
            <div className="space-y-3 rounded-md border border-dashed p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inserimento manuale</span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  onClick={handleExitManualMode}
                >
                  Torna alla ricerca
                </button>
              </div>
              <div className="space-y-1">
                <Label>Continente *</Label>
                <select
                  value={manualContinent}
                  onChange={(e) => { setManualContinent(e.target.value); setManualCountry(""); }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                >
                  <option value="">Seleziona continente...</option>
                  {CONTINENT_KEYS.map((c) => (
                    <option key={c} value={c}>{formatContinent(c)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Paese *</Label>
                <select
                  value={manualCountry}
                  onChange={(e) => setManualCountry(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={!manualContinent}
                  required
                >
                  <option value="">Seleziona paese...</option>
                  {(COUNTRIES_BY_CONTINENT[manualContinent] ?? []).map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Flag preview */}
          {!isManualMode && <div className="flex justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={effectiveSelected?.name}
                className="h-20 max-w-[180px] object-contain rounded border"
              />
            ) : (
              <div className="h-20 w-[180px] rounded border bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  {effectiveSelected ? effectiveSelected.name : "Anteprima bandiera"}
                </span>
              </div>
            )}
          </div>}

          {/* Date */}
          <div className="space-y-1">
            <Label>Data acquisizione *</Label>
            <Input
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>

          {/* Admin: user picker */}
          {isAdmin && usersData?.users?.length > 0 && (
            <div className="space-y-1">
              <Label>Aggiunta da</Label>
              <select
                value={addedByUserId}
                onChange={(e) => setAddedByUserId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">— me stesso —</option>
                {usersData.users.map((u: { id: string; displayName: string }) => (
                  <option key={u.id} value={u.id}>{u.displayName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Together with: user picker (optional) */}
          <div className="space-y-2">
            <Label>Insieme a <span className="text-muted-foreground">(opzionale)</span></Label>
            <div className="space-y-2">
              {/* Selected users as badges */}
              {togetherWithUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {togetherWithUserIds.map((userId) => {
                    const selectedUser = usersData?.users?.find((u: { id: string; displayName: string }) => u.id === userId);
                    return (
                      <Badge key={userId} variant="secondary" className="gap-1">
                        {selectedUser?.displayName}
                        <button
                          type="button"
                          onClick={() => setTogetherWithUserIds(togetherWithUserIds.filter((id) => id !== userId))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X size={14} />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Combobox dropdown */}
              <div ref={togetherWithRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowTogetherWithDropdown(!showTogetherWithDropdown)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-ring hover:bg-accent/50 transition-colors"
                >
                  <input
                    type="text"
                    placeholder="Cerca un membro..."
                    value={togetherWithSearch}
                    onChange={(e) => setTogetherWithSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  />
                  <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                </button>

                {showTogetherWithDropdown && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-background border rounded-md shadow-md max-h-64 overflow-y-auto">
                    {usersData?.users ? (
                      usersData.users
                        .filter((u: { id: string; displayName: string }) => u.id !== user?.id)
                        .filter((u: { id: string; displayName: string }) =>
                          u.displayName.toLowerCase().includes(togetherWithSearch.toLowerCase())
                        )
                        .map((u: { id: string; displayName: string }) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              if (togetherWithUserIds.includes(u.id)) {
                                setTogetherWithUserIds(togetherWithUserIds.filter((id) => id !== u.id));
                              } else {
                                setTogetherWithUserIds([...togetherWithUserIds, u.id]);
                              }
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                          >
                            {togetherWithUserIds.includes(u.id) && <Check size={16} className="text-primary shrink-0" />}
                            {!togetherWithUserIds.includes(u.id) && <div className="w-4 shrink-0" />}
                            <span>{u.displayName}</span>
                          </button>
                        ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-muted-foreground">Caricamento utenti...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Public / Secret toggle */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
                isPublic ? "bg-primary" : "bg-muted-foreground/40"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  isPublic ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm">
              {isPublic ? (
                <span className="font-medium">{t("addFlagModal.visibleToAll")}</span>
              ) : (
                <span className="text-muted-foreground">{t("addFlagModal.onlyYou")}</span>
              )}
            </span>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading || !effectiveSelected || !date}>
              Aggiungi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
