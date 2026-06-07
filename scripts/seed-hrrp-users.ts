import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Mapping from users.md institution names to actual DB institution IDs
const INSTITUTION_MAP: Record<string, string> = {
  // Exact/primary matches
  'WIZARA YA AFYA': 'cmd06nn7u0003e67wa4hiyie7',
  'WIZARA YA BIASHARA NA MAENDELEO YA VIWANDA': 'cmd06xe3b000ke6bqxuwovzub',
  'WIZARA YA KILIMO UMWAGILIAJI MALIASILI NA MIFUGO': 'cmd06xe34000he6bqfdqiw9ll',
  'WIZARA YA ELIMU NA MAFUNZO YA AMALI': 'cmd06nn7r0002e67w8df8thtn',
  'TUME YA UTUMISHI SERIKALINI': 'cmd059ion0000e6d85kexfukl',
  'OFISI YA RAIS - KATIBA SHERIA UTUMISHI NA UTAWALA BORA': 'cmd06xe3i000ne6bq2q3y9g2z',
  'OFISI YA RAIS, FEDHA NA MIPANGO': 'cmd06nn7n0001e67w2h5rf86x',
  'WIZARA YA MAENDELEO YA JAMII,JINSIA,WAZEE NA WATOTO': 'cmd06xe270003e6bq0wm0v3c7',
  'OFISI YA RAIS, TAWALA ZA MIKOA, SERIKALI ZA MITAA NA IDARA MAALUMU ZA SMZ': 'cmd06xe3g000me6bqh9gabe3e',
  'WIZARA YA HABARI, VIJANA, UTAMADUNI NA MICHEZO': 'cmd06xe3l000oe6bq5drrocqt',
  'OFISI YA MAKAMO WA KWANZA WA RAISI': 'cmd06xe39000je6bqeouszvrd',
  'OFISI YA RAIS - IKULU': 'cmd06xe43000we6bqegt3ofa0',
  'WIZARA YA UTALII NA MAMBO YA KALE': 'cmd06xe40000ve6bqrip9e4m6',
  'OFISI YA MKAGUZI MKUU WA NDANI WA SERIKALI': 'cmd06xe2e0006e6bqvjfhq32c',
  'KAMISHENI YA KUKABILIANA NA MAAFA ZANZIBAR': 'cmd06xe2y000ee6bqel875c2s',
  'Tume ya Ushindani Halali wa Biashara': 'cmdd32c25c06bcef1153da0',
  'Wakala wa Barabara': 'cmd2376970b68ca8887a4fa',
  'AFISI YA MKURUGENZI WA MASHTAKA': 'cmd06xe4b0010e6bqt54zkblq',
  'Bodi ya Huduma za Maktaba': 'cmdb58cb33c0f5031c1db39',
  'WAKALA WA MAJENGO ZANZIBAR': 'cmd06xe30000fe6bqe6ljiz1v',
  'OFISI YA MAKAMO WA PILI WA RAISI': 'cmd06xe3p000qe6bqwqcuyke1',
  'OFISI YA MUFTI MKUU WA ZANZIBAR': 'cmd06xe3t000se6bqknluakbq',
  'Ofisi ya Msajili wa Hazina': 'cmd06xe1x0000e6bqalx28nja',
  'WIZARA YA UJENZI MAWASILIANO NA UCHUKUZI': 'cmd06xe37000ie6bq43r62ea6',
  'Mamlaka ya Uwezeshaji Wananchi Kiuchumi (ZEA)': 'cmd4c5ec2ff8bee042f8320',
  'Chuo cha Kiislamu': 'cmdd75324353437b4a24d98',
  'Baraza la Mji Wete': 'cmde5b940e9d54567bfc3a4',
  'Baraza la Mji Mkoani': 'cmd77f48672584df7bbec35',
  'Ofisi ya Mkuu wa Mkoa wa Kusini Pemba': 'cmd91d823ed52820fc6020f',
  'Halmashauri ya Wilaya ya Micheweni': 'cmdf0c43f7013ab7f2a66fb',
  'Baraza la Mji Chake Chake': 'cmd02cee2d68e90a9e93d12',
  'Ofisi ya Mhasibu Mkuu wa Serikali': 'cmd06xe2j0008e6bqqpmbs9bv',
  'AFISI YA RAISI KAZI, UCHUMI NA UWEKEZAJI': 'cmd06xe2o000ae6bquqbkbg4z',
  'Mamlaka ya Serikali Mtandao (eGAZ)': 'cmd240bed02bab1eccc8039',
  'MAMLAKA YA KUZUIA RUSHWA NA UHUJUMU WA UCHUMI ZANZIBAR': 'cmd06xe3w000te6bqc44b0xpr',
  'Wakala wa Vipimo Zanzibar': 'cmd06xe250002e6bqp8aabk92',
  'Ofisi ya Mkuu wa Mkoa wa Kaskazini Pemba': 'cmd5f2656be26e643588334',
  'Wakala wa Matrekta': 'cmd4a32f22d9f78e3dec338',
  'WIZARA YA MAJI NISHATI NA MADINI': 'cmd06xe4g0012e6bqou5f9gur',
  'WIZARA YA UCHUMI WA BULUU NA UVUVI': 'cmd06xe3r000re6bqum8g62id',
  'WIZARA YA ARDHI NA MAENDELEO YA MAKAAZI ZANZIBAR': 'cmd06xe3y000ue6bqzqkztrsa',

  // Variants from users.md that need mapping
  'WIZAREA YA BIASHARA NA MAENDELEO YA VIWANDA': 'cmd06xe3b000ke6bqxuwovzub', // typo in users.md
  'wizara ya fedha': 'cmd06nn7n0001e67w2h5rf86x', // = OFISI YA RAIS, FEDHA NA MIPANGO
  'WIZARA YA ELIMU': 'cmd06nn7r0002e67w8df8thtn', // = WIZARA YA ELIMU NA MAFUNZO YA AMALI
  'OR-KATIBA,SHERIA,UTUMISHI NA UTAWALA BORA-PEMBA.': 'cmd06xe3i000ne6bq2q3y9g2z', // PEMBA branch
  'OFISI YA RAIS,TAWALA ZA MIKOA,SERIKALI ZA MITAA NA IDARA MAALUM ZA SMZ PEMBA': 'cmd06xe3g000me6bqh9gabe3e', // PEMBA branch
  'WIZARA YA KILIMO UMWAGILIAJI MALIASILI NA MIFUGO PEMBA': 'cmd06xe34000he6bqfdqiw9ll', // PEMBA branch
  'WIZARA YA KAZI NA UWEKEZAJI PEMBA': 'cmd06xe2o000ae6bquqbkbg4z', // = AFISI YA RAISI KAZI, UCHUMI NA UWEKEZAJI
  'WIZARA YA KAZI NA UWEKEZAJI': 'cmd06xe2o000ae6bquqbkbg4z', // same
  'WIZARA YA VIJANA AJIRA NA UWEZESHAJI': 'cmd06xe3l000oe6bq5drrocqt', // = WIZARA YA HABARI, VIJANA...
  'WIZARA YA HABARI SANAA UTAMADUNI NA MICHEZO': 'cmd06xe3l000oe6bq5drrocqt', // = WIZARA YA HABARI, VIJANA...
  'WIZARA YA UTALII NA MAMBO YA KALE-PEMBA': 'cmd06xe40000ve6bqrip9e4m6', // PEMBA branch
  'KAMISHENI YA KUKABILIANA NA MAAFA PEMBA': 'cmd06xe2y000ee6bqel875c2s', // PEMBA branch
  'Kamisheni ya Kukabiliana na Maafa': 'cmd06xe2y000ee6bqel875c2s',
  'TUME YA USHINDANI HALALI WA BIASHARA PEMBA': 'cmdd32c25c06bcef1153da0', // PEMBA branch
  'TUME YA USHINDANI HALALI WA BIASHARA -PEMBA': 'cmdd32c25c06bcef1153da0',
  'AFISI YA MKURUGENZI WA MASHTAKA PEMBA': 'cmd06xe4b0010e6bqt54zkblq', // PEMBA branch
  'BODI YA HUDUMA ZA MAKTABA-PEMBA': 'cmdb58cb33c0f5031c1db39', // PEMBA branch
  'Hodi ya Huduma za Maktaba Pemba': 'cmdb58cb33c0f5031c1db39',
  'WAKALA WA MAJENGO PEMBA': 'cmd06xe30000fe6bqe6ljiz1v', // PEMBA branch
  'OFISI YA MAKAMU WA PILI WA RAIS PEMBA': 'cmd06xe3p000qe6bqwqcuyke1', // PEMBA branch
  'OFISI YA MUFTI MKUU PEMBA': 'cmd06xe3t000se6bqknluakbq', // PEMBA branch
  'OFISI YA MSAJILI WA HAZINA PEMBA': 'cmd06xe1x0000e6bqalx28nja', // PEMBA branch
  'WIZARA YA UJENZI NA UCHUKUZI OFISI KUU PEMBA': 'cmd06xe37000ie6bq43r62ea6', // PEMBA branch
  'WAKALA WA UWEZESHAJI WANANCHI KIUCHUMI ZANZIBR': 'cmd4c5ec2ff8bee042f8320', // typo
  'CHUO CHA KIISLAMU PEMBA': 'cmdd75324353437b4a24d98', // PEMBA branch
  'Chuo cha Kiislamu Pemba': 'cmdd75324353437b4a24d98',
  'BARAZA LA MJI WETE': 'cmde5b940e9d54567bfc3a4',
  'Baraza la mji mkoani': 'cmd77f48672584df7bbec35',
  'Ofisi ya Mkuu wa Mkoa Kusini Pemba': 'cmd91d823ed52820fc6020f',
  'mkoa wa kusini pemba': 'cmd91d823ed52820fc6020f',
  'HALMASHAURI WILAYA YA MICHEWENI': 'cmdf0c43f7013ab7f2a66fb',
  'BARAZA LA MANISPAA CHAKE CHAKE PEMBA': 'cmd02cee2d68e90a9e93d12',
  'Afisi ya Mdhibiti Na Mkaguzi Mkuu wa Hesabu za Serikali': 'cmd06xe2j0008e6bqqpmbs9bv', // closest match
  'ofisi ya rais ikulu': 'cmd06xe43000we6bqegt3ofa0',
  'afisi ya rais ikulu': 'cmd06xe43000we6bqegt3ofa0',
  'Mamlaka ya Serikali Mtandao': 'cmd240bed02bab1eccc8039',
  'MAMLAKA YA KUZUIA RUSHWA': 'cmd06xe3w000te6bqc44b0xpr',
  'OFISI YA MUFTI MKUU WA ZANZIBAR': 'cmd06xe3t000se6bqknluakbq',
  'Afisi ya Mkuu wa Mkoa wa Kaskazini Pemba': 'cmd5f2656be26e643588334',
  'WAKALA WA SERIKALI WA HUDUMA ZA MATREKTA NA ZANA ZA KILIMO': 'cmd4a32f22d9f78e3dec338',
  'Ofisi ya Mkuu wa Wilaya Chake Chake': 'cmd02cee2d68e90a9e93d12',
  'OFISI YA MAKAMU WA KWANZA RAIS': 'cmd06xe39000je6bqeouszvrd', // typo: missing "O WA"
};

// Helper: normalize institution name for fuzzy matching
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[-\s,.]/g, '').replace(/[()]/g, '').trim();
}

// Build precomputed lookup from normalized names
function buildLookup(): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const [dbName, dbId] of Object.entries(INSTITUTION_MAP)) {
    lookup.set(normalizeName(dbName), dbId);
  }
  return lookup;
}

const NORMALIZED_LOOKUP = buildLookup();

function findInstitutionId(rawName: string): string | null {
  const n = normalizeName(rawName);
  // Direct normalized lookup
  if (NORMALIZED_LOOKUP.has(n)) return NORMALIZED_LOOKUP.get(n)!;

  // Partial match: try to find an institution whose normalized name
  // is contained in or contains the query
  for (const [normName, dbId] of NORMALIZED_LOOKUP) {
    if (normName.includes(n) || n.includes(normName)) {
      return dbId;
    }
  }

  return null;
}

interface UserEntry {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  institution: string;
}

function parseUsersMd(): UserEntry[] {
  // Data parsed from users.md
  const rows: [string, string, string, string, string, string][] = [
    ['FATMA MOHAMED ALI', 'FATMA', 'fatma.ali2@tradesmz.go.tz', '0774591268', 'biashara@2026', 'WIZAREA YA BIASHARA NA MAENDELEO YA VIWANDA'],
    ['Lutfia Salum Ali', 'lutfia', 'lutfia.ali2@mohz.go.tz', '0779475037', 'Lutfia@1234', 'WIZARA YA AFYA'],
    ['Samira Dino Haji', 'Dino', 'samira.haji@kilimoznz.go.tz', '0773927701', 'Dino@1997', 'WIZARA YA KILIMO UMWAGILIAJI MALIASILI NA MIFUGO'],
    ['MGENI JUMA SALIM', 'MGENISALIM', 'mgeni.salim@utumishismz.go.tz', '0773685355', 'Utumishi@123', 'OR-KATIBA,SHERIA,UTUMISHI NA UTAWALA BORA-PEMBA.'],
    ['salim ali bakar', 'Salim', 'salim.bakar@mofzanzibar.go.tz', '0777687494', 'Salim@102030', 'wizara ya fedha'],
    ['omar abdalla kassim', 'omar', 'pba.office@moez.go.tz', '0778866648', 'TumeWEMA&2', 'WIZARA YA ELIMU'],
    ['OMAR ISSA MOHAMED', 'OMARISSA', 'omar.mohd@mohz.go.tz', '0773003554', 'Omarafya@198027', 'WIZARA YA AFYA'],
    ['Fatma Abdalla Ali', 'fatma', 'fatma.ali@jamiismz.go.tz', '0777830450', 'Abdalla@123', 'WIZARA YA MAENDELEO YA JAMII'],
    ['Mwanakombo Mwalim Moh\'d', 'Mwana', 'mwanakombo.mohd@tamisemim.go.tz', '0772914194', 'Tawala@123', 'OFISI YA RAIS,TAWALA ZA MIKOA,SERIKALI ZA MITAA NA IDARA MAALUM ZA SMZ PEMBA'],
    ['Fatma Nassor Salim', 'fatmasalim', 'fatmasalim@kilimoznz.go.tz', '0776807731', 'salim@2015', 'WIZARA YA KILIMO UMWAGILIAJI MALIASILI NA MIFUGO PEMBA'],
    ['chumu abdi hamza', 'chumu', 'chumu.hamza@wkuzanzibar.go.tz', '0776469363', 'Aziza@12345', 'WIZARA YA KAZI NA UWEKEZAJI PEMBA'],
    ['Bimkubwa Ali Mohamed', 'bimkubwamohamed', 'bimkubwa.mohamed@zanajira.go.tz', '0772663450', 'Tus@2025', 'TUME YA UTUMISHI SERIKALINI'],
    ['Mohammed Juma Rashid', 'Mohammed', 'mohammed.juma@vijanasmz.go.tz', '0777048963', 'Vijana@2026', 'WIZARA YA VIJANA AJIRA NA UWEZESHAJI'],
    ['Khamis Masoud Khamis', 'Khamis', 'khamis.masoud@habarismz.go.tz', '0773240579', 'Utumishi@83', 'WIZARA YA HABARI SANAA UTAMADUNI NA MICHEZO'],
    ['SADA ALI HAMAD', 'SADA', 'sada.hamad@omkr.go.tz', '0777642750', 'Omkr@2026', 'OFISI YA MAKAMU WA KWANZA RAIS'],
    ['juma mohd iddi', 'salum', 'salum.abeid@ikuluzanzibar.go.tz', '0772684126', 'Ikulu@26', 'afisi ya rais ikulu'],
    ['OMAR ISSA MOHAMED', 'OMARMOHD', 'chro@mohz.go.tz', '0773003554', 'Staff@2024', 'WIZARA YA AFYA'],
    ['Asma Khamis Ali', 'Asma', 'asma.khamis@utaliismz.go.tz', '0629719210', 'Asma@2026', 'WIZARA YA UTALII NA MAMBO YA KALE-PEMBA'],
    ['Huda Haji Muhine', 'Huda', 'huda.muhine@oiagsmz.go.tz', '0777429836', 'Huda@1234', 'OFISI YA MKAGUZI MKUU WA NDANI WA SERIKALI'],
    ['Bikombo Hadid Rashid', 'Bikombo', 'bikombo.hadid@maafaznz.go.tz', '0776369986', 'Hapatoshi@77', 'KAMISHENI YA KUKABILIANA NA MAAFA PEMBA'],
    ['ZAINAB JUMA KOMBO', 'ZAINAB', 'zainab.kombo@zfcc.go.tz', '0778950454', 'zfcc@123', 'TUME YA USHINDANI HALALI WA BIASHARA PEMBA'],
    ['Maryam Abdalla Mohamed', 'Maryam', 'maryam.abdalla@zanroads.go.tz', '0773090963', 'Maryam@1234', 'WAKALA WA BARABARA'],
    ['Rashid Ali Mussa', 'rashid', 'rashid.mussa@dppznz.go.tz', '0777418060', 'Rashid@12345', 'AFISI YA MKURUGENZI WA MASHTAKA PEMBA'],
    ['Mussa Hamad Abdullah', 'mussa', 'mussa.abdullah@zls.go.tz', '0774135528', 'Abdullah@1776@#', 'BODI YA HUDUMA ZA MAKTABA-PEMBA'],
    ['THANI SULEIMAN SHAAME', 'SHAAME', 'thani.shaame@maafaznz.go.tz', '0657868425', 'pemba@2025', 'KAMISHENI YA KUKABILIANA NA MAAFA PEMBA'],
    ['Said Khamis Abdalla', 'SaidAbdalla', 'said.abdalla@zba.go.tz', '0773046504', 'Said@2026', 'WAKALA WA MAJENGO PEMBA'],
    ['Hussein Mussa Juma', 'Hussein', 'hussein.juma@ompr.go.tz', '0773293907', 'Hussein#2080', 'OFISI YA MAKAMU WA PILI WA RAIS PEMBA'],
    ['Mussa Seif Mussa', 'mussamussa', 'mussa.mussa@muftizanzibar.go.tz', '0777488760', 'Pemba@2026', 'OFISI YA MUFTI MKUU PEMBA'],
    ['Suleiman Salim Abdalla', 'Suleiman', 'suleiman.abdalla@trosmz.go.tz', '0777240148', 'SULE@448', 'OFISI YA MSAJILI WA HAZINA PEMBA'],
    ['maryam Juma Ali', 'maryamali', 'Maryam.ali@moic.go.tz', '0776875069', 'Ujenzi@2025', 'WIZARA YA UJENZI NA UCHUKUZI OFISI KUU PEMBA'],
    ['Muhamad Juma Ali', 'muhamadali', 'muhamad.ali@zeeasmz.go.tz', '0778912061', 'Gombani@2026', 'WAKALA WA UWEZESHAJI WANANCHI KIUCHUMI ZANZIBR'],
    ['CHUMU MNDIMA MWINYI', 'chumumndima', 'chumu.mndima@moez.go.tz', '0711569430', 'Cck@2026', 'CHUO CHA KIISLAMU PEMBA'],
    ['Mariam Omar Yahya', 'Mariam', 'Mariam.yahya@blmwsmz.go.tz', '0773026090', 'mam@12345', 'BARAZA LA MJI WETE'],
    ['asha abdulla ali', 'Ashaali', 'asha.ali@blmmpsmz.go.tz', '0772615778', 'Asha-123', 'Baraza la mji mkoani'],
    ['Fatma SalimAli', 'Fatmamatta', 'fatma.matta@kusinipembasmz.go.tz', '0779759322', 'Fatma@1977', 'Ofisi ya Mkuu wa Mkoa Kusini Pemba'],
    ['SALAMA KOMBO FUNDI', 'SALAMA', 'salama.fundi@2michewenidcsmz.go.tz', '0628535826', 'Salama@100', 'HALMASHAURI WILAYA YA MICHEWENI'],
    ['arisaly32@gmail.com', 'Arisaly', 'arisaly32@gmail.go.tz', '0671476742', 'Utumishimkoa1.', 'Ofisi ya mkuu wa mkoa kusini pemba'],
    ['ABDALLA SAID KHATIBU', 'ABDALLA', 'abdalla.khatibu@chakemcsmz.go.tz', '0776377048', 'Abdalla@2026', 'BARAZA LA MANISPAA CHAKE CHAKE PEMBA'],
    ['Salim seif Habib', 'salimhabib', 'salum.habib@ocagz.go.tz', '0777554058', 'Test@123', 'Afisi ya Mdhibiti Na Mkaguzi Mkuu wa Hesabu za Serikali'],
    ['Hamad Omar Rashid', 'HamadOR155506', 'hamad.rashid@tradesmz.go.tz', '0773932776', 'biashara@2026', 'WIZARA YA BIASHARA NA MAENDELEO YA VIWANDA'],
    ['Said Saleh Mohammed', 'saidsaleh', 'said.mohd@wkuzanzibar.go.tz', '0777455026', 'Wku@6585', 'WIZARA YA KAZI NA UWEKEZAJI'],
    ['Ali Juma Ali', 'aliali1', 'ali.ali@egaz.go.tz', '0776641375', 'Pemba@26', 'Mamlaka ya Serikali Mtandao'],
    ['Mohamed Mzee Mohamed', 'mohamedmohamed', 'mohamed.mzee@zanroads.go.tz', '0778991775', 'Mzee@1234', 'WAKALA WA BARABARA'],
    ['Mustafa Hassan Issa', 'mustafaissa', 'mustafa.issa@zaeca.go.tz', '0777794116', 'Mwanakele.2', 'MAMLAKA YA KUZUIA RUSHWA'],
    ['SAADA ALI MOHAMMED', 'saada', 'saada.mohammed@zfcc.go.tz', '0673677579', 'mratibzfcc@2016', 'TUME YA USHINDANI HALALI WA BIASHARA -PEMBA'],
    ['Ali Abdalla Khamis', 'Ali', 'ali.khamis@oiagsmz.go.tz', '0776040904', 'Khamis@123', 'OFISI YA MKAGUZI MKUU WA NDANI WA SERIKALI'],
    ['SAID AHMAD MOHAMMED', 'Said20_27', 'said@muftizanzibar.go.tz', '0776694248', 'Said@2027', 'OFISI YA MUFTI MKUU WA ZANZIBAR'],
    ['Salum Hamid Mzee', 'Salumhamid', 'salim.mzee@zbs.go.tz', '0777148412', 'Binhamed@2025', 'Taasisi ya Viwango Zanzibar'],
    ['Ahmed Amour khamis', 'ahmed', 'ahmed.khamis@zls.go.tz', '0773669200', 'chake@2026', 'Hodi ya Huduma za Maktaba Pemba'],
    ['Juma Sabour Khamis', 'Sabour', 'juma.khamis@zacsmz.go.tz', '0772116697', 'Sabour@2gmail.com', 'Zanzibar Aids Commission -pemba'],
    ['ALI KHATIB BAKAR', 'ALIKHATIB', 'ali.bakar@kaskpembasmz.go.tz', '0774041056', 'Ras@2026', 'Afisi ya Mkuu wa Mkoa wa Kaskazini Pemba'],
    ['MOHAMMED ALI MAALIM', 'mohammedali', 'mohammed.maalim@bpra.go.tz', '0773139006', 'Bpra@2026', 'WAKALA WA USAJILI BIASHARA NA MALI ZANZIBAR'],
    ['Amour Juma Mohammed', 'Amourjuma', 'amour.mohammed@matrektasmz.go.tz', '0777454937', 'Amour@2025', 'WAKALA WA SERIKALI WA HUDUMA ZA MATREKTA NA ZANA ZA KILIMO'],
    ['Khamis Arazak Khamis', 'KhamisArazak', 'Khamis.Khamis@maafaznz.go.tz', '0777472984', 'Zdmc@Pemba2025', 'Kamisheni ya Kukabiliana na Maafa'],
    ['Aziza Iddi Khatib', 'azizaidd', 'aziza.khatib@wakf.go.tz', '0777762742', 'mfano pemba2026', 'kamisheni ya wakfu pemba'],
    ['Shaib Moh\'d Mbarouk', 'Shaib', 'shaib.mbarouk@picsmz.go.tz', '0772109975', 'shaimouk67$', 'Chuo cha Kiislamu Pemba'],
    ['amour hamada saleh', 'amour', 'amou.saleh@tamisemim.go.tz', '0773366674', 'Amour@1234', 'mkoa wa kusini pemba'],
    ['Amria Masoud Said', 'amriasaid', 'amria.said@mkoawakusinipembasmz.go.tz', '0773358669', 'Amria@2025', 'Ofisi ya Mkuu wa Wilaya Chake Chake'],
  ];

  return rows.map(([name, username, email, phone, password, institution]) => ({
    name,
    username,
    email,
    phone,
    password,
    institution,
  }));
}

async function main() {
  console.log('=== SEEDING HRRP USERS FROM users.md ===\n');

  // Fetch existing DB usernames to avoid duplicates
  const existingUsers = await db.user.findMany({
    select: { username: true, role: true },
  });
  const existingUsernames = new Set(existingUsers.map((u) => u.username.toLowerCase()));
  const existingHROUsernames = new Set(
    existingUsers.filter((u) => u.role === 'HRO').map((u) => u.username.toLowerCase())
  );

  console.log(`Existing users in DB: ${existingUsers.length}`);
  console.log(`Existing HRO users: ${existingHROUsernames.size}`);
  console.log(`Existing HRRP users: ${existingUsers.filter((u) => u.role === 'HRRP').length}\n`);

  // Fetch institutions to verify IDs
  const allInstitutions = await db.institution.findMany({ select: { id: true, name: true } });
  const dbInstitutionIds = new Set(allInstitutions.map((i) => i.id));
  const dbInstitutionNames = new Map(allInstitutions.map((i) => [i.name.toLowerCase(), i.id]));

  const users = parseUsersMd();
  const salt = await bcrypt.genSalt(10);

  let created = 0;
  let skippedExisting = 0;
  let skippedHRO = 0;
  let skippedNoInstitution = 0;
  let errors = 0;

  for (const user of users) {
    const usernameLower = user.username.toLowerCase();

    // Skip if username already exists in DB (regardless of role)
    if (existingUsernames.has(usernameLower)) {
      const existingRole = existingUsers.find((u) => u.username.toLowerCase() === usernameLower)?.role;
      if (existingRole === 'HRO') {
        console.log(`  ⏭ SKIP (HRO in DB): ${user.name} (${user.username})`);
        skippedHRO++;
      } else {
        console.log(`  ⏭ SKIP (existing in DB): ${user.name} (${user.username}) - role: ${existingRole}`);
      }
      skippedExisting++;
      continue;
    }

    // Find institution ID
    let institutionId = findInstitutionId(user.institution);
    if (!institutionId) {
      // Try direct name lookup in the DB
      const instNameLower = user.institution.toLowerCase();
      for (const [dbName, dbId] of dbInstitutionNames) {
        if (dbName.includes(instNameLower) || instNameLower.includes(dbName)) {
          institutionId = dbId;
          break;
        }
      }
    }

    if (!institutionId || !dbInstitutionIds.has(institutionId)) {
      console.log(`  ⚠ SKIP (no institution match): ${user.name} (${user.username}) - "${user.institution}"`);
      skippedNoInstitution++;
      continue;
    }

    try {
      await db.user.create({
        data: {
          id: uuidv4(),
          name: user.name,
          username: user.username,
          password: await bcrypt.hash(user.password, salt),
          role: 'HRRP',
          active: true,
          institutionId: institutionId,
          email: user.email,
          phoneNumber: user.phone,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`  ✓ CREATED: ${user.name} (${user.username}) -> HRRP`);
      created++;
    } catch (err: any) {
      console.log(`  ✗ ERROR: ${user.name} (${user.username}): ${err.message}`);
      errors++;
    }
  }

  console.log('\n========================================');
  console.log('=== SEEDING SUMMARY ===');
  console.log(`Total users in file:     ${users.length}`);
  console.log(`Created as HRRP:         ${created}`);
  console.log(`Skipped (HRO in DB):     ${skippedHRO}`);
  console.log(`Skipped (other existing): ${skippedExisting - skippedHRO}`);
  console.log(`Skipped (no institution): ${skippedNoInstitution}`);
  console.log(`Errors:                  ${errors}`);
  console.log('========================================\n');

  // Print details for skipped users
  if (skippedNoInstitution > 0) {
    console.log('\nUsers skipped due to no institution mapping:');
    for (const user of users) {
      const instMatch = findInstitutionId(user.institution);
      const instNameLower = user.institution.toLowerCase();
      let found = false;
      if (!instMatch) {
        for (const [dbName] of dbInstitutionNames) {
          if (dbName.includes(instNameLower) || instNameLower.includes(dbName)) {
            found = true;
            break;
          }
        }
      }
      if (!instMatch && !found) {
        console.log(`  - ${user.name} (${user.username}): "${user.institution}"`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
