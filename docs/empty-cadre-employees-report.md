# Empty Cadre Employees Report

**Date:** June 10, 2026
**Total Employees in Database:** 36,877
**Employees with Empty Cadre:** 1,152 (3.1%)
**Institutions Affected:** 52

## Root Cause

The `cadre` field is constructed from HRIMS employment history data:

```typescript
const cadre = currentEmployment
  ? [currentEmployment.titlePrefixName, currentEmployment.titleName, currentEmployment.gradeName]
      .filter(part => part && part.trim())
      .join(' ')
  : null;
```

Employees with empty cadre have **no current employment history** in HRIMS, or their employment records have empty `titlePrefixName`, `titleName`, and `gradeName` fields. The institution-level HRIMS refetch (RequestId 204/205) confirmed this — when fetching all 6,737 employees for WIZARA YA AFYA, only ~8 of the 447 empty-cadre employees had cadre data available from HRIMS. The remaining employees genuinely have no employment history data in the HRIMS system.

## Field Completeness

| Field | Missing | % Missing |
|-------|---------|-----------|
| cadre | 1,152 | 100.0% |
| department | 187 | 16.2% |
| currentWorkplace | 68 | 5.9% |
| appointmentType | 68 | 5.9% |
| ministry | 68 | 5.9% |
| payrollNumber | 1 | 0.1% |
| salaryScale | 1 | 0.1% |
| employmentDate | 0 | 0.0% |

Most employees with empty cadre still have valid payroll numbers, employment dates, and status. Only 68 also lack workplace/ministry/appointment data (concentrated in specific institutions).

## Institutions Affected

| Institution | Vote | TIN | Empty Cadre |
|-------------|------|-----|-------------|
| WIZARA YA AFYA | 008 | 101817180 | 449 |
| WIZARA YA ELIMU NA MAFUNZO YA AMALI | 011 | 101817709 | 332 |
| Baraza la Manispaa Magharibi B | 204 | 129840552 | 73 |
| WIZARA YA KILIMO UMWAGILIAJI MALIASILI NA MIFUGO | 012 | 101817679 | 42 |
| Ofisi ya Mkuu wa Mkoa wa Kaskazini Unguja | 048 | 107779450 | 27 |
| Baraza la Mji Kati Unguja | 205 | 134349867 | 20 |
| Baraza la Mji Kaskazini A Unguja | 207 | 141799118 | 19 |
| WIZARA YA UJENZI MAWASILIANO NA UCHUKUZI | 016 | 101817156 | 19 |
| Chuo cha Kiislamu | — | 104563732 | 19 |
| Taasisi ya Utafiti wa Uvuvi (ZAFIRI) | 526 | 140711764 | 12 |
| WAKALA WA MAJENGO ZANZIBAR | 522 | 137516160 | 10 |
| AFISI YA MWANASHERIA MKUU | 028 | 101817016 | 9 |
| Hospitali ya Mnazi Mmoja | 025 | 124546745 | 9 |
| Mamlaka ya Uwezeshaji Wananchi Kiuchumi (ZEA) | 105 | 176332557 | 9 |
| Ofisi ya Mhasibu Mkuu wa Serikali | 022 | 156933775 | 9 |
| WIZARA YA BIASHARA NA MAENDELEO YA VIWANDA | 017 | 101789799 | 7 |
| WIZARA YA ARDHI NA MAENDELEO YA MAKAAZI ZANZIBAR | 014 | 101697509 | 7 |
| Bodi ya Huduma za Maktaba | 543 | 114542164 | 6 |
| TUME YA MAADILI YA VIONGOZI WA UMMA | 113 | 136664387 | 6 |
| OFISI YA RAIS - KATIBA SHERIA UTUMISHI NA UTAWALA BORA | 005 | 141811827 | 6 |
| KAMISHENI YA ARDHI ZANZIBAR | 520 | 101816990 | 5 |
| Baraza la Manispaa Mjini Unguja | 202 | 121454009 | 4 |
| AFISI YA RAISI KAZI, UCHUMI NA UWEKEZAJI | 006 | 101697533 | 4 |
| WIZARA YA UCHUMI WA BULUU NA UVUVI | 013 | 150874084 | 4 |
| WIZARA YA MAJI NISHATI NA MADINI | 015 | 150308305 | 4 |
| WIZARA YA UTALII NA MAMBO YA KALE | 010 | 104480454 | 3 |
| AFISI YA MKURUGENZI WA MASHTAKA | 029 | 107779272 | 3 |
| MAMLAKA YA KUZUIA RUSHWA NA UHUJUMU WA UCHUMI ZANZIBAR | 035 | 122439755 | 2 |
| Mamlaka ya Serikali Mtandao (eGAZ) | 038 | 154803912 | 2 |
| Baraza la Mitihani | 547 | 124650941 | 2 |
| OFISI YA MAKAMO WA KWANZA WA RAISI | 002 | 115615637 | 2 |
| OFISI YA RAIS, FEDHA NA MIPANGO | 567 | — | 2 |
| Ofisi ya Mkuu wa Mkoa wa Mjini Magharibi Unguja | 047 | 107779396 | 2 |
| Ofisi ya Mkuu wa Mkoa wa Kusini Unguja | 049 | 107779477 | 2 |
| Tume ya Ushindani Halali wa Biashara | 518 | 148444331 | 2 |
| Wakala wa Barabara | 559 | 151578152 | 2 |
| Tume ya Mipango | 024 | 121462354 | 2 |
| Ofisi ya Hatimiliki (COSOZA) | 558 | 132175306 | 1 |
| Halmashauri ya Wilaya ya Kusini Unguja | 206 | 137926121 | 1 |
| Ofisi ya Mkuu wa Mkoa wa Kusini Pemba | 050 | 119062888 | 1 |
| KAMISHENI YA KUKABILIANA NA MAAFA ZANZIBAR | 510 | 119752302 | 1 |
| Ofisi ya Msajili wa Hazina | 106 | 176281286 | 1 |
| Skuli ya Sheria Zanzibar | 570 | 154057374 | 1 |
| Baraza la Jiji | 201 | 141760874 | 1 |
| Baraza la Manispaa Magharibi A | 203 | 137175088 | 1 |
| OFISI YA RAIS, TAWALA ZA MIKOA, SERIKALI ZA MITAA NA IDARA MAALUMU ZA SMZ | 004 | 101732835 | 1 |
| Baraza la Mji Kaskazini B Unguja | 208 | 106226431 | 1 |
| Wakala wa Matrekta | 527 | 136148710 | 1 |
| OFISI YA MKAGUZI MKUU WA NDANI WA SERIKALI | 052 | 156958174 | 1 |
| OFISI YA MUFTI MKUU WA ZANZIBAR | 053 | — | 1 |
| TUME YA UTUMISHI SERIKALINI | 037 | 101817199 | 1 |
| WIZARA YA HABARI, VIJANA, UTAMADUNI NA MICHEZO | 018 | 137692902 | 1 |

## Top 5 Institutions Account For

- **WIZARA YA AFYA**: 449 (39.0%)
- **WIZARA YA ELIMU NA MAFUNZO YA AMALI**: 332 (28.8%)
- **Baraza la Manispaa Magharibi B**: 73 (6.3%)
- **WIZARA YA KILIMO**: 42 (3.6%)
- **Ofisi ya Mkuu wa Mkoa wa Kaskazini Unguja**: 27 (2.3%)

Top 5 institutions account for **923 (80.1%)** of all empty-cadre employees.

## HRIMS Refetch Attempt

An institution-level HRIMS refetch was performed on WIZARA YA AFYA (the largest affected institution with 449 empty cadre employees). The API returned data for 6,355 employees across 68 pages. Results:

- **490** empty-cadre employees were upserted
- Only **~8** employees had their cadre actually populated (e.g., "Fundi Sanifu Madawa Daraja la III", "Tabibu Daraja la III", "Afisa Ustawi wa Jamii Daraja la II")
- The remaining **~482** had `employmentHistories` that were null/empty in HRIMS, so their cadre remained empty
- **5,865** employees that already had cadre were skipped

This confirms that the **HRIMS system itself lacks employment history data** for the majority of these employees. The data gap exists in the source system.

## Recommendations

1. **Contact HRIMS team** — The 1,152 employees genuinely lack employment history data in the HRIMS source system. The HRIMS team needs to populate `titlePrefixName`, `titleName`, and `gradeName` for these employees' current employment records.

2. **Manual entry** — For critical employees, cadre data can be entered manually through the admin dashboard at `/dashboard/profile`.

3. **Chuo cha Kiislamu** — This institution has no vote number (only TIN: 104563732). The HRIMS refetch script can handle TIN-based lookups (RequestId 205) but was not run in this session.

4. **Two institutions without vote number or TIN** — OFISI YA RAIS, FEDHA NA MIPANGO (vote 567, no TIN) and OFISI YA MUFTI MKUU WA ZANZIBAR (vote 053, no TIN) each have 1-2 affected employees but do have vote numbers, so they can be refetched normally.

## Full Employee Listing by Institution

The complete list of 1,152 employees with empty cadre, grouped by institution. Each table shows employee name, ZAN ID, payroll number, status, workplace, and department.

A downloadable CSV is also available at: `docs/empty-cadre-employees.csv`

### WIZARA YA AFYA
**Vote:** 008 | **TIN:** 101817180 | **Empty Cadre Count:** 449

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abdalla Hamad Abdalla | 030294596 | 587651 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 2 | Abdalla Mkubwa Zubeir | 680080042 | 687725 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 3 | Abdalla Yussuf Moh'd | 520039753 | 111855 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 4 | Abdi Abass Khamis | 300080322 | 248274 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 5 | Abdi Abuu Hamad | 040281975 | 563350 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 6 | Abdilahi Suleiman Ali | 0610224371 | 677698 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 7 | Abdillah Ahmed Saleh Issa | 61020162 | 387430 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 8 | Abdulamin Moh'd Juma | 570033163 | 330340 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 9 | Abdulhamid Hassan Ali Mussa | 997012191 | 887613 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 10 | Abdulhamid Kiongwe Vuai | 643058857 | 788244 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 11 | Abdul-Hamid Suleiman Mahazi | 620338187 | 787426 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 12 | Abdulkarim Omar Salum | 996145686 | 988335 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 13 | ABDULLAH HUSSEIN SUWED | 520162833 | 284964 | Confirmed | Wakala wa Chakula, Dawa na Vipodozi | ZFDA OFISI YA PEMBA |
| 14 | Abdull-karimu Khamis Nasibu | 740031836 | 567782 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 15 | Abdul-Majid Said Bakar | 610282801 | 190199 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 16 | Abdul-Rahim Kheir Makame | 680062873 | 888245 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 17 | Abdulrahman Ali Abdalla | 090168000 | 660168 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 18 | Abdulrazak Rashid Mussa | 690059964 | 187648 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 19 | Abdulsamadu Omar Juma | 670099805 | 688268 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 20 | Abubakar Ali Ramadhan | 610034875 | 673290 | On Probation | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 21 | Abubakar Hassan Mrisho | 580249790 | 963265 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 22 | Abubakar Issa Khamis | 100228348 | 875771 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 23 | Abuubakar Othman Kombo Fumu | 610108178 | 787378 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 24 | Adila Haroub Addi Seif | 997335070 | 587610 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 25 | Ahlam Mohamed Hussein Mbarouk | 653041142 | 287421 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 26 | Ahmada Mussa Awesu Suleiman | 620324300 | 987558 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 27 | Ahmada Sahaib Said | 620232090 | 187275 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 28 | Ahmed Ali Omar | 100030019 | 732361 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 29 | Ahmed Masoud Hassan | 030302099 | 688438 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 30 | Ahmed Mohamed Abdulla Mohamed | 620121837 | 887516 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 31 | Aiman Bakari Idrisa Suleiman | 610247901 | 387609 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 32 | Aisha Abdull Mohammed | 994262476 | 287324 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 33 | Aisha Ahmed Chwaya | 610254231 | 287276 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 34 | Aisha Ali Said | 917261924 | 187712 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 35 | Aisha Hemed Maka | 863072778 | 187720 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 36 | Aisha Ibrahim Ussi Makame | 994164096 | 787353 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 37 | Aisha Machano Khamis Mbarouk | 996127695 | 487375 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 38 | Aisha Masoud Khatib | 994352497 | 488371 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 39 | Aisha Mohamed Ali Juma | 610236842 | 687369 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 40 | Aisha Mzee Khamis | 710055002 | 788228 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 41 | Aisha Omar Abdulla | 709004048 | 787718 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 42 | Aisha Saleh Abdulla Rajab | 010343258 | 687425 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 43 | Aisha Ussi Simai | 010283091 | 454618 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 44 | Akiba Mahmoud Ahmada | 260150282 | 749518 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 45 | Akram Yahya Mwadini | 610297333 | 688324 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 46 | Ali Abdalla Mohamed | 0080055127 | 577315 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 47 | Ali Amour Ali | 270055801 | 511178 | Confirmed | Wizara ya Afya | — |
| 48 | Ali Khatib Faki | 010231900 | 558312 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 49 | Ali Pembe Pembe | 640074449 | 388419 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 50 | Ali Sadi Khamis | 680057613 | 787653 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 51 | Ali Salim Suleiman | 670077182 | 287754 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 52 | Ali Salum Abdalla | 620246262 | 588372 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 53 | Ali Waziri Beda | 996131662 | 997244 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 54 | Alli Waziri Mohamed | 643054260 | 488444 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 55 | Ally Abdullah Ally | 520139446 | 559941 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 56 | Ally Salim Salim | 994807371 | 688413 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 57 | Aluwiya Said Khalid | 610323584 | 888212 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 58 | Alye Mahamoud ali | 060362290 | 262951 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 59 | Ameir Tajo Ally | 610058257 | 860323 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 60 | Amina Mohammed Nassor | 9961282182 | 888359 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 61 | Amina Said Bakar | 060356851 | 460377 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 62 | Amira Mohammed Juma Omar | 995051340 | 287608 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 63 | Amour Ali Ussi | 620116826 | 173407 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 64 | Amour Haji Amour | 240156130 | 811950 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 65 | Amran Issa Makame | 690058840 | 988246 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 66 | Arif Ali Omar | 610137493 | 568057 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 67 | Asha Abdalla Ali Juma | 996787841 | 987460 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 68 | Asha Jecha Haji | 610276475 | 997235 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 69 | Asha Khamis Mussa | 728020888 | 887702 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 70 | Asha Omar Hamad | 0000000001 | 213995 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 71 | Ashura Faraj Ali | 320097548 | 428106 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 72 | Asia Amour Suleiman | 653104972 | 997207 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 73 | Asiya Juma Mussa | 995166073 | 873316 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 74 | Askia Ali Omar | 100016624 | 106039 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 75 | Assya Shariff Ali Kombo | 620388373 | 787337 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 76 | Asya Hassan Mcha | 620291330 | 997245 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 77 | Ate Haji Hamad | 709029001 | 988213 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 78 | Athumani Haji Hamadi | 885090921 | 987282 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 79 | Ayoub Othman Hamad | 280206121 | 361575 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 80 | AZIZA SALIM RASHID | 620397294 | 962925 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 81 | Azizi Othman Othman | 680063492 | 690195 | Confirmed | Wizara ya Afya | — |
| 82 | Aznat Makame Chumu | 970557135 | 383745 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 83 | Bakari Khamis Bakari | 520138225 | 258067 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 84 | Batuli Stanley Dandaro | 100094299 | 734419 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 85 | Bigori Shirazi Hassan | 300080157 | 209920 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 86 | Bikombo Khamis Said | 270056022 | 715951 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 87 | Bunaitha Haji Kassim | 660019895 | 188247 | Confirmed | Wakala wa Chakula, Dawa na Vipodozi | ZFDA OFISI YA PEMBA |
| 88 | Dafroza Faustin Ndaki | 616029046 | 997227 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 89 | Dhamha Abdalla Rashid Mdowe | 620008556 | 587521 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 90 | Eidah Hasnu Habib Ally | 620202376 | 887362 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 91 | Fahad Zahor Muhammed | 620243049 | 287770 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 92 | Fahmi Said Bakar | 690061969 | 562808 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 93 | Faika Abdulla Bakar Fumu | 623087722 | 787515 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 94 | Farida Ame Mohamed Juma | 620320351 | 887338 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 95 | Farida Said Abdalla | 060139650 | 149529 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 96 | Farid Said Mohammed | 670070389 | 287795 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 97 | Fat-Hiya Hussein Sufian | 610070022 | 287284 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 98 | Fat-Hiya Mohammed Khamis | 610283886 | 188214 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 99 | Fati-Hia Sadik Ibrahim | 620238122 | 887776 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 100 | Fatma Abrahman Omar | 610185218 | 387285 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 101 | Fatma Ali Ameir | 640036999 | 997233 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 102 | Fatma Ali Mussa | 670110074 | 387706 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 103 | Fatma Amour Khamis | 620287744 | 997232 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 104 | Fatma Haji Omar | 510069393 | 114658 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 105 | Fatma Hamad Issa | 680024873 | 966287 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 106 | Fatma Hamad Mussa | 917144104 | 288215 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 107 | Fatma Hassan Ali | 505028747 | 587708 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 108 | Fatma Juma Said | 709028508 | 887710 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 109 | Fatma Mohamed Mwinyi Mrujae | 610253395 | 787531 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 110 | Fatma Mohammed Abass | 680061490 | 387633 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 111 | Fatma Nassor Said | 520116926 | 460117 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 112 | Fatma Salim Hamad | 917439305 | 287705 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 113 | Fatma Talib Seif | 090195187 | 759498 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 114 | Fatma Ussi Juma | 090173477 | 668171 | Confirmed | Wizara ya Afya | — |
| 115 | Fatuma Mussa Silima | 650083376 | 997236 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 116 | Fauzia Jumaane Suleiman | 270146071 | 787783 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 117 | Feisal Said Mohamed Abdulla | 885010067 | 387600 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 118 | Firdaus Haji Faki | 620291178 | 788300 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 119 | Hafidh Abdalla Hamad | 690054723 | 788439 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 120 | Hafidh Khator Hamad | 455012874 | 987639 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 121 | Hafsa Ali Hamad Ali | 620315324 | 387366 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 122 | Haimat Vuai Lada | 996339777 | 388395 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 123 | Haitham Abdalla Nassor | 060295567 | 887654 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 124 | Haji Machano Musa | 610275092 | 687644 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 125 | Haji Salum Haji Makame | 620182784 | 387560 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 126 | Hajra Seif Ali | 643097778 | 587619 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 127 | Halima Adnan Ali | 100006090 | 387788 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 128 | Halima MohD Khamis | 640086680 | 988254 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 129 | Halima Rashid Kombo | 970040275 | 247915 | Confirmed | Wakala wa Chakula, Dawa na Vipodozi | ZFDA OFISI YA PEMBA |
| 130 | Hamad Ali Kadiria | 620015734 | 387771 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 131 | Hamida Juma Haji Kombo | 610047541 | 187526 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 132 | Hamide Seif Amour | 917326651 | 887695 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 133 | Hamza Abeid Saleh | 650073221 | 997222 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 134 | Hanimu Mohamed Maalim | 653085887 | 888342 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 135 | Haroub Suleiman Abdalla | 060301945 | 887727 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 136 | Hashim Sheha Hamza Makame | 650040481 | 687490 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 137 | Hasina Abrahman Said | 620291356 | 987744 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 138 | Hasina Mansour Ally Abdallah | 885072794 | 387390 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 139 | Hasnuu Makame Daud | 620391395 | 887743 | Confirmed | Wizara ya Afya | — |
| 140 | Hassan Mohamed Shamis | 630043886 | 288378 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 141 | Hassan Mwinyiusi Abdalla | 100190687 | 860194 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 142 | Hassan Omar Hussein | 700051678 | 188255 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 143 | Hassan Said Bakar | 996710017 | 290191 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 144 | Hassan Vuai Hassan | 580011935 | 211889 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 145 | Haulat Omar Mbarouk | 917374766 | 187689 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 146 | Haullat Rashid Ahmed | 704032246 | 287640 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 147 | Hidaya Abdalla Rashid Abdalla | 620298489 | 887598 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 148 | Hija Hamid Yussuf | 520134357 | 966416 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 149 | Hilali Ally Juma | 670093278 | 887792 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 150 | Husna Hussein Njuma | 997083216 | 997210 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 151 | Husna Mahfoudh MohD | 481160040 | 388216 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 152 | Hussein Faki Amour | 610262698 | 888229 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 153 | Hussein Kassim Haji | 10324169 | 588420 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 154 | Huzayma Machano Khamis Khamis | 881372938 | 787597 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 155 | Ibrahim Khamis Khamis | 610124086 | 590186 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 156 | Ibrahim Mabrouk Seif | 010237647 | 849032 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 157 | Ibrahim Ramadhan Omar Juma | 995159704 | 687596 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 158 | Ibtisam Omar Ame | 620186487 | 388321 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 159 | Idrisa Mohamed Swaleh | 670061138 | 288256 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 160 | Idrissa Hassan Silima | 680071480 | 488217 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 161 | Ikhlam Salum Juma | 994385721 | 488266 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 162 | Ilham Kassim Mohamed | 997030472 | 787264 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 163 | Imani Hamis Lussuna | 610238239 | 787272 | Confirmed | Wizara ya Afya | — |
| 164 | Iman Samuel Eliyas | 854071941 | 188230 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 165 | Iptisam Salmin Salmin | 996545465 | 888301 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 166 | Issa Omar Ali | 970114793 | 787678 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 167 | Issa Seif Issa Haji | 660023261 | 787361 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 168 | Issa Simai Haji | 680033943 | 875796 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 169 | Izdihaar Seif Sleyum | 010288818 | 261760 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 170 | Jokha Abdulkarim Mohamed | 610233920 | 888423 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 171 | Juhudi Makame Ame | 650072628 | 288248 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 172 | Juma Said Omar | 505041294 | 387763 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 173 | Juma Simba Mcha | 020257138 | 997225 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 174 | Juwairiya Badru Kombo | 620276339 | 388338 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 175 | Kamal Zamal Salum | 653037836 | 188311 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 176 | Kauthar Hadhir Mohamed Ali | 610185085 | 587595 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 177 | Kauthar Hamza Hassan Juma | 610162345 | 687547 | On Probation | — | — |
| 178 | Kauthar Hemed Juma | 610266155 | 988319 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 179 | Kawthar Khalid Mohamed Mrisho | 620377926 | 687514 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 180 | Kazija Mohd Haji Hija | 623024122 | 787507 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 181 | Khadija Ali Ali | 640091442 | 290150 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 182 | Khadija Ali Suleiman | 917252005 | 288231 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 183 | Khadija Hamad Shame | 481415998 | 388257 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 184 | Khadija Hamid Makame | 610165542 | 588397 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 185 | Khadija Hamza Haji | 620377434 | 997211 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 186 | Khadija khamis Abdalla | 010348871 | 588429 | Confirmed | Wizara ya Afya | Idara ya Mipango Sera |
| 187 | Khadija Makame Hassan | 616043532 | 997234 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 188 | Khadija Mkadam Kombo | 290136511 | 146086 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 189 | Khadija Mohamed Mustafa | 643060404 | 788382 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 190 | Khadija Omar Ali Juma | 610037506 | 787450 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 191 | Khadija Rijaali Rijaal | 620313270 | 997243 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 192 | Khadija Salum Salum | 653005783 | 188417 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 193 | Khafidh Hamad Abdalla | 610253405 | 488258 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 194 | Khaira Juma Mbwana | 620293125 | 188296 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 195 | Khairat Ali Ali | 670097298 | 997247 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 196 | Khairat Muhammed Ali | 917170834 | 588259 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 197 | Khairat Salim Bakar | 643035938 | 588218 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 198 | Khairun Maulidi Haji | 610179303 | 388379 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 199 | Khalid Ahmed Said Yussuf | 620313584 | 387593 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 200 | Khalid Mohamed Mwinyi | 010253377 | 863086 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 201 | Khamis Ali Daud | 310056445 | 527840 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 202 | Khamis Ali Rashid | 300206467 | 860259 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 203 | Khamis Faki Vuai | 610233674 | 997219 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 204 | Khamis Hamad Suleiman | 580056673 | 554368 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Uendeshaji na Utumishi |
| 205 | Khamis Khatib Khatib | 080183503 | 488428 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 206 | Khamis Mbarouk Faki Mgeni | 643085338 | 287592 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 207 | Khamis Suleiman Khamis Mohamed | 620388425 | 687271 | Confirmed | Wizara ya Afya | — |
| 208 | Khamis Zubeir Khamis | 610256835 | 387260 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 209 | Khatib Maktuba Abdalla | 680016267 | 487772 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 210 | Khatim Nassor Rashid Kombo | 620202240 | 887492 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 211 | Kulthum Ali Abdull | 060061324 | 612386 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 212 | Kulthum Rashid Hamad | 951012268 | 387755 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 213 | Kurthum Massoud Rashid | 502010866 | 388249 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 214 | Lailat Saleh Rajab Bakar | 610248928 | 687344 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 215 | Latifa Ussi Pandu | 994310172 | 988392 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 216 | Luqman Ali Othman | 995034252 | 188393 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 217 | Lutfia Mohd Amour | 670116740 | 487667 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 218 | Majida Suleiman Salim | 996106270 | 788414 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 219 | Majid Saleh Salim | 060236285 | 348656 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 220 | Makame Faki Jasho | 600015615 | 351506 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 221 | Makame Simai Khatib | 995384542 | 997223 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 222 | Mariam Mwinyi Seti | 610322321 | 997240 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 223 | Mariam Mzee Tiptip | 670116902 | 997214 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 224 | Maryam Abdi Salum | 280061450 | 646139 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 225 | Maryam Hamad Othman | 710063540 | 487764 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 226 | Maryam Said Hamdan | 070286241 | 888334 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 227 | Marym Ali Muhammed | 0995883800 | 877318 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 228 | Masoud Ramadhan Ahmada | 520098129 | 578677 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 229 | Maulid Kassim Hamad | 690006704 | 988440 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 230 | Mauwa Juma Nassor Juma | 610312519 | 587449 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 231 | Mbwana Rashid Kombo | 854020167 | 188441 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 232 | Mgeni Ali Kassim | 520231607 | 560191 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 233 | Mgeni Sharif Saleh | 704003443 | 488233 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 234 | Mgeni Suleiman Haroun Salim | 620004976 | 287479 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 235 | Mikidadi Omar Hussein | 680078681 | 888220 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 236 | Mohamed Said Mohamed ali | 270303999 | 860218 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 237 | Mohammed Said Mohd | 680071464 | 487715 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 238 | Moh'd Ali Haji | 0290103399 | 843046 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 239 | Moh'd Balozi Aboud | 610261480 | 661772 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 240 | MohD Faki Hamadi | 710065681 | 588234 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 241 | Moh'd Maiko Paulo | 280149433 | 848288 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 242 | Moh'd Omar Moh'd | 520064935 | 624633 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 243 | Mohd Salim Said | 700049987 | 587724 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 244 | Moza Abdalla Ali | 260064907 | 949211 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 245 | Moza Ali Hemed | 040323785 | 775876 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 246 | Moza Issa Khamis | 994063860 | 488299 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 247 | Moza Suleiman Bakari Faki | 620054434 | 387455 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 248 | Mtumwa Hamadi Ali Kombo | 220137838 | 687433 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 249 | Mudathir Khamis Ali | 885093677 | 997248 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 250 | MUDRIK ABDULLA MUSSA | 090097784 | 997276 | Confirmed | Wizara ya Afya | Idara ya Mipango Sera |
| 251 | Muhamadi Abdulla Ame | 0320073810 | 177790 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 252 | Mulhat Rashid Sinani | 917052794 | 787661 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 253 | Mulkhat Khamis Omar | 994486972 | 997206 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 254 | Munawara Abdull-Aziz Salim Mohamed | 610199561 | 887565 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 255 | Munawar Rashid Abdulla | 580332551 | 688340 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 256 | Mundhir Ali Mbaraka | 620368403 | 788317 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 257 | Munira Ali Omar | 970525580 | 287616 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 258 | Munira Ali Omar | 996947826 | 688308 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 259 | Munira Kassim Mohd | 970241268 | 687669 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 260 | Mussa Khamis Msheba | 620179649 | 388387 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 261 | Mussa Mohamed Omar | 260219480 | 587781 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 262 | Mustafa Omar Ali | 706010546 | 587643 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 263 | Muzdalifat Khamis Dadi | 885017918 | 188352 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 264 | Muzdat Haji Makame | 481209768 | 987711 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 265 | Mwajine Chum Shaali | 510082509 | 755188 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 266 | Mwanaharusi Ibrahim Tabu | 630037081 | 997238 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 267 | Mwanahawa Ali Juma | 610310096 | 488322 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 268 | Mwanahawa Haji Ame Haji | 070203846 | 187615 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 269 | Mwanahawa Shaaban Kandoro | 994830151 | 388313 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 270 | Mwanaidi Yussuf Sijamini Mkombe | 620385972 | 787564 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 271 | Mwanajuma Mussa Vuai | 0520106266 | 677827 | Confirmed | Chuo cha Utawala wa Umma IPA | — |
| 272 | Mwema Hussein Suwedi Hussein | 280097044 | 228112 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 273 | Nabil Nassor Abdallah | 620155393 | 388354 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 274 | Nadhira Issa Haji Issa | 620167505 | 387358 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 275 | Nadrat Miraji Suleiman | 520111345 | 362547 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 276 | Nahiya Mohd Ali Seif | 690016613 | 687400 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 277 | Nahla Mussa Mvita Juma | 620331902 | 787589 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 278 | Naifa Juma Mohamed Alawy | 610120215 | 787523 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 279 | Naifat Said Yussuf Mohamed | 863050928 | 587505 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 280 | Naishat Ali Ali Ame | 520242070 | 987444 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 281 | Nasra Ali Sued | 690035896 | 988343 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 282 | Nasra Bakar Khalfan | 670092138 | 687790 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 283 | Nasra Hamza Khamis | 995161738 | 997220 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 284 | Nassir Faki Juma | 670069738 | 787775 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 285 | Nassir Khamis Ali | 610061350 | 888375 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 286 | Nassor Ali Bakar | 610154917 | 488388 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 287 | Nassoro Hamad Suleiman Khamis | 60342485 | 987493 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 288 | Nassor Salim Abdalla | 505078386 | 587740 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 289 | Nassor Seif Mohamed | 6220275479 | 887298 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 290 | Nassra Ali Ali | 610310151 | 788366 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 291 | Nassra Juma Makame | 680034232 | 387796 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 292 | Nassra Rashid Nassor Rashid | 620226088 | 387439 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 293 | Natash Mbarouk Seif | 955818547 | 688373 | Confirmed | Wizara ya Afya | — |
| 294 | Natash Mbarouk Seif | 620290494 | 888350 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 295 | Nayla Ali Hifadhi Ali | 620354406 | 487334 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 296 | Nunuu Ismail Kanduru | 030067936 | 611665 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 297 | Nuwaira Abuu MohD | 670102756 | 688235 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 298 | Omar Abdalla Juma Faki | 550062974 | 287543 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 299 | Omar Faki Omar Said | 680074629 | 487561 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 300 | Omar Khatib Haji | 260192891 | 314019 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 301 | Omar Mussa Othman | 680081085 | 987769 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 302 | Omar Pandu Haji | 080186072 | 787791 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 303 | Omar Salum Amour Hamad | 62030181 | 687474 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 304 | Omar Zahariyu Juma | 540263536 | 997251 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 305 | Othman Omar Juma | 230036590 | 700236 | On Probation | — | — |
| 306 | Patima Vuaa Pakacha Makame | 650078585 | 587587 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 307 | Radhia Abdalla Mkanga | 610049530 | 567774 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 308 | Rahima Khatib Ali | 630079140 | 997231 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 309 | Rahma Ali Juma | 620291275 | 588380 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 310 | Rahma Hassan Abdalla | 970191561 | 988221 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 311 | Rahma Muhammed Makame | 610275403 | 988302 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 312 | Rahma Said Ali | 863099743 | 187664 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 313 | Raifa Ame Abdallah | 620335401 | 888367 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 314 | Ramadhan Ali Hassan | 620282477 | 588291 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 315 | Ramadhan Machai Makame | 660033772 | 588364 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 316 | Ramadhan Rashid Ali | 854021462 | 997252 | Confirmed | Wizara ya Afya | — |
| 317 | Ramadhan Suleiman Abdalla Ame | 992005651 | 687555 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 318 | Rashid Said Muhamad | 917183682 | 787629 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 319 | Rauhia Nassor Suleiman Hemed | 610098026 | 487586 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 320 | Rehema Faki Khalfan Haji | 680057105 | 587562 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 321 | Ridhwan Ali MohD | 707007248 | 788260 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 322 | Riziki Mbarouk Ally | 700001521 | 987793 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 323 | Riziki Mwinyi Ali | 610207747 | 987785 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 324 | Rukaiya Ameir Othman Hamad | 610260188 | 687328 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 325 | Rukaiya Kombo Mohd | 970410732 | 387682 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 326 | Rukia Kheir Ame Kundi | 710032508 | 287584 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 327 | Rukia Omar Khamis Machano | 620295583 | 487423 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 328 | Rukia Shaaban Mandoa | 630018293 | 997241 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 329 | Saada Juma Vuai | 996234194 | 488403 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 330 | Sabahi Othman Juma | 965011278 | 188222 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 331 | Sabra Abeid Ali | 670100754 | 490217 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 332 | Sabra Hassan Nema | 301079621 | 188288 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 333 | Sabra Salim Rashid | 300259494 | 754929 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 334 | Sabra Wadi Khamis Wadi | 495019666 | 187583 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 335 | Sabri Mbaki Kona | 610114957 | 888383 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 336 | Sabrina Hashim Salim | 481598787 | 987671 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 337 | Sabrina Seif Issa | 653092008 | 997254 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 338 | Sabrina Zubeir Mzee Mwinyi | 620305635 | 987582 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 339 | Sada Bakari Bakari | 995145531 | 588323 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 340 | Safia Suleiman Saleh | 520041965 | 314246 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 341 | Sahia Seif Alawy | 670103676 | 487634 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 342 | Said Ali Hamad Omar | 709029607 | 887402 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 343 | Said Bhai Bhai | 630046973 | 388410 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 344 | Said Khamis Hassan | 310085883 | 108056 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 345 | Said Moh'd Salim | 080001322 | 916836 | Confirmed | Mamlaka ya Mji Mkongwe | — |
| 346 | Said Suleiman Marshed | 917346405 | 997256 | Confirmed | Wizara ya Afya | — |
| 347 | Salha Ali Khamis | 481245797 | 487626 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 348 | Salha Juma Saleh | 917276731 | 487675 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 349 | Salha Mtumweni Juma | 610285587 | 687255 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 350 | Salim Abdalla Ali | 505010041 | 888261 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 351 | Salima Mwinyi Udi | 580295157 | 777852 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 352 | Salim Khamis Salim | 10296246 | 287308 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 353 | Salkha Haji Twaha | 700050104 | 788236 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 354 | Salma Abdu Shomar | 994481673 | 488347 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 355 | Salma Abrahman Massoud | 0678037830 | 888237 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 356 | Salma Ali Bausi | 863072061 | 988262 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 357 | Salma Mwalim Omar | 620098809 | 288426 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 358 | Salmini Abdallah Saidi | 620322803 | 688251 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 359 | Salum Talib Msellem | 730033356 | 887735 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 360 | Samha Haji Ali | 580269372 | 687888 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 361 | Samha Mbwana Kombo | 690033344 | 388443 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 362 | Samia Ali Makame | 996121160 | 390176 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 363 | Samira Ahmed Ally | 690004841 | 788269 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 364 | Samira Said Mohamed | 928073453 | 788293 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 365 | Sara Issa Salum | 620374347 | 187697 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 366 | Seif Salim Ali Suleiman | 520100354 | 687530 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 367 | Shaame Haji Shaame | 270278273 | 687782 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 368 | Shadya Khatib Makame Hassan | 620324287 | 887427 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 369 | Shaib Zaid Hussein Zaid | 915002091 | 487578 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 370 | Sharifa Hamza Kombo | 620351539 | 997213 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 371 | Sharifa Juma Faki | 690058028 | 188263 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 372 | Sharifa Maulid Haji | 881476961 | 997229 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 373 | Sharifa Omary Ally | 653058476 | 588389 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 374 | Shufaa Abdulmalik Haji Jecha | 610114423 | 387577 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 375 | Shufaa Khamis Masoud | 10350724 | 687311 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 376 | Shufaa Shehe Amir | 680074441 | 988238 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 377 | Sihaba Ali Masoud | 640088983 | 997224 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 378 | Sijuwi Omar Khamis | 580020733 | 210819 | Confirmed | Wizara ya Afya | — |
| 379 | Sofia Hassan mrisho | 320108730 | 966238 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 380 | Subira Daudi Daudi | 630028429 | 288401 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 381 | Subira Kheri Haji | 070229000 | 162553 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 382 | Subira Mohamed Hassan | 620271897 | 588348 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 383 | Subira Yussuf Mnemo | 580020131 | 854995 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 384 | Suhaila Rashid Khamis | 520283358 | 955116 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 385 | Suleima Juma Haji  Juma | 650074028 | 187575 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 386 | Suleiman Gharib Bakar | 620155610 | 288223 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 387 | Suleiman Issa Ali | 690070974 | 687685 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 388 | Suleiman Said Mohd | 090233155 | 287787 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 389 | Sumaiya Hassan Faki Abdalla | 670107395 | 587384 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 390 | Sumaiya Muhamed Said | 466017042 | 388224 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 391 | Sumayyah Kombo Mohammed | 610126075 | 862949 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 392 | Tahiya Ahmed Mohd | 917434744 | 787701 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 393 | Tahreen Soud Salum Mbarouk | 620118103 | 887508 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 394 | Talib Yussuf Mussa | 7070053001 | 188239 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 395 | Tauhida Hija Fadhil | 995123660 | 690187 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 396 | Thabit Ubwa Abdalla | 917016560 | 487253 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 397 | Thamra Abdalla Khalid | 610147564 | 997237 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 398 | Theresia Joseph Mkenda | 505059317 | 887719 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 399 | Thuwaiba Kheiri Khamis | 610317938 | 988376 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 400 | Thwalhat Abdullah Said | 902041484 | 387252 | On Probation | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 401 | Tumu Nyange Nyange | 070003923 | 488339 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 402 | Um-Khayra Hamoud Rashid | 203009716 | 997218 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 403 | Ummul-Kulthum Suleiman Hamad Omar | 670106624 | 687409 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 404 | Umukuruthum Suleiman Khamis | 710039657 | 790188 | Confirmed | Wizara ya Afya | — |
| 405 | Umulkuthum Said Suleiman Said | 610006205 | 587538 | Confirmed | Wizara ya Afya | — |
| 406 | Vuai Daud Juma | 260160133 | 610790 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 407 | Wahida Ahmada Mzee | 100006456 | 449912 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 408 | Wahida Ibrahim Mohd Shoka | 710039563 | 387422 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 409 | Wahida Moh'd Jecha | 550006624 | 512336 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 410 | Wanu Bakari Khamis | 060119117 | 512563 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 411 | Warda Ali Farhan | 610149773 | 288394 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 412 | Warida Abdu Said | 620237312 | 997228 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 413 | Wasila Abdalla Khamis Ali | 270292053 | 287551 | Confirmed | Wizara ya Afya | Idara ya Mipango Sera |
| 414 | Yahya Bakar Khamis | 481305873 | 487797 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 415 | Yahya Hamad Sheha | 620273750 | 788252 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 416 | Yahya Mansour Said | 885049728 | 688365 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 417 | Yakoub Ali Suleiman Vuai | 994034571 | 787572 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 418 | Yasri MohD Haji | 040350419 | 588267 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 419 | Yunus Amin Ahmed | 620384793 | 388362 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 420 | Yunus Issa Suleiman | 670043231 | 488225 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 421 | Yunuss Ali Suleiman | 885036778 | 288264 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 422 | Yusra Juma Juma | 996256918 | 997217 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 423 | Yusra Salim Adballa | 970621566 | 187704 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 424 | Yusra Yahya Nassor | 863078165 | 588437 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 425 | Yussuf Abdalla Mjaka | 670075180 | 787734 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 426 | Yussuf Ali Juma | 670052000 | 888253 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 427 | Yussuf Fadhil Omar | 917266865 | 588226 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 428 | Yussuf Juma Massoud | 670004696 | 388265 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 429 | Yussuf Makame Mshamba | 620169206 | 488363 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 430 | Yussuf Mohd Mbarouk Mohd | 995431233 | 187412 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 431 | Yussuf Omar Abrahman | 620074304 | 590194 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 432 | Zaina Ali Abdalla | 680079077 | 988270 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 433 | Zainab Omar Haji | 650073632 | 488396 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 434 | Zainabu Moh'd Omar | 640053691 | 488290 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 435 | Zaina Ridhwan Abdalla | 970163482 | 688227 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 436 | Zawadi Faki Mohammed Faki | 333003686 | 187404 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 437 | Zawadi Jaffar Ali | 040244167 | 373425 | Confirmed | Wakala wa Chakula, Dawa na Vipodozi | Huduma za Wakala |
| 438 | ZUHURA ASSAA SHAVUAI | 670094143 | 588445 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 439 | Zuhura Farouk Juma Ali | 610247927 | 187567 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 440 | Zuhura Haji Makame | 240056641 | 334415 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 441 | Zuhura MohD Said | 481048044 | 488241 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 442 | Zuhura Said Rashid Abdalla | 643102417 | 387325 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 443 | Zulekha Idrissa Rajab | 902016544 | 488274 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 444 | Zulekha Khamis Faki | 620157120 | 688357 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 445 | Zulfa Khamis Juma | 610002502 | 387317 | Confirmed | Wizara ya Afya | Idara ya Tiba |
| 446 | Zuweina Ali Ramadhan | 610128899 | 488355 | Confirmed | Wizara ya Afya | Idara ya Uendeshaji na Utumishi |
| 447 | Zuwena Mbarouk Hamad | 505028777 | 588242 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 448 | Zuwena Nassor Abdi | 728026747 | 187729 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 449 | Zuwena Suleiman Salim | 965014157 | 688243 | Confirmed | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |

### WIZARA YA ELIMU NA MAFUNZO YA AMALI
**Vote:** 011 | **TIN:** 101817709 | **Empty Cadre Count:** 332

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abass Ali Machano | 250079190 | 376358 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 2 | Abass Juma Suleiman | 0020152660 | 136188 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 3 | Abdalla Hamad Ali | 080139384 | 823225 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 4 | Abdalla Said Moh'd | 020206051 | 173918 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 5 | Abdalla Sharif Omar | 300252798 | 761181 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 6 | Abdillah Khamis Abdalla | 040315098 | 473637 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 7 | ABDI OMAR ALI | 931010435 | 682840 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 8 | Abdulla Hamad Abdulla | 090028807 | 718649 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 9 | Abrahmani Bakari Haji | 650074057 | 381914 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 10 | Abuurashid Juma Khamis | 700046654 | 481948 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 11 | Afife Bakar Hamad | 020171018 | 521262 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 12 | AISHA KOMBO BAKAR | 690017258 | 282748 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 13 | Aisha Mmanga Mjaka | 020175290 | 557746 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 14 | Ali Hamad Ali | 300206098 | 721264 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 15 | Ali Hamad Haji | 260165756 | 235127 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 16 | Ali Issa Bakar | 020198558 | 524795 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 17 | Ali Kombo Omar | 300244784 | 980923 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 18 | Ali Makame Chande | 709009084 | 881927 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 19 | Ali Mikidadi Hamad | 240174736 | 468591 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 20 | Ali Moh'd Ali | 670066955 | 276519 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 21 | Ali Salim Suleiman | 310014179 | 632774 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 22 | Amina Abdi Ali | 040319623 | 868595 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 23 | Amina Ali Moh'd | 290015892 | 225197 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 24 | Amina Amour Hamad | 040340474 | 981052 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 25 | Amina Hamad Juma | 481046710 | 975245 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 26 | AMINA HASSAN MAKAME | 640010609 | 956345 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 27 | Amina Juma Omar | 620130326 | 367431 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 28 | AMINA MBWANA HASSAN | 290180439 | 582759 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 29 | Amina Moh'd Omar | 040289614 | 876857 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 30 | Amina Mtumwa Said | 520133990 | 581535 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 31 | Amina Ramadhan Juma | 210190014 | 425799 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 32 | Amina Rashid Ali | 220182149 | 463609 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 33 | Amina Sheha Bakar | 520005006 | 552067 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 34 | AMINA YUSSUF ALI | 917003482 | 582750 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 35 | Amour Haji Mohamed | 060370615 | 468137 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 36 | Asaa Moh'd Dadi | 010039661 | 680912 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 37 | Asaa Shazume Sheha | 290184640 | 829196 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 38 | Asha Bedran Nassor | 030299326 | 688519 | Confirmed | Shirika la Huduma za Maktaba | Idara ya Huduma za Maktaba |
| 39 | Asha Khamis Ali | 590030852 | 360270 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 40 | Asha Khamis Mussa | 270204320 | 376390 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 41 | Asha Moh'd Issa | 670000058 | 376285 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 42 | Asha Omar Suleiman | 590047852 | 948078 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 43 | Asha Sharif Juma | 300206629 | 467432 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 44 | Ashura Abdalla Issa | 060308939 | 288523 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 45 | Ashura Awamu Zubeir | 100230550 | 368663 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 46 | Ashura Khatib Khamis | 060347435 | 376803 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 47 | Asia Salim Amour | 670090084 | 588526 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 48 | Asila Bakar Khalfan | 080239624 | 582807 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 49 | Azida Abdalla Said | 050042164 | 476278 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 50 | BAHATI MABROUK KHERI | 320195792 | 279808 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 51 | Bahati Rashid Mohammed | 220181219 | 668600 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 52 | Bakar Ali Rashid | 690026603 | 874004 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 53 | Bakar Masoud Bakar | 080240754 | 976841 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 54 | Bijuma Ali Moh'd | 320011441 | 781018 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 55 | Bikombo Moh'd Ali | 060307682 | 881019 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 56 | Bimkubwa Haji Kassim | 220222028 | 418565 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 57 | Bimkubwa Hassan Said | 030297654 | 879862 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 58 | Bimkubwa Rashid Juma | 060303497 | 862235 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 59 | Dina Shaib Kheri | 060236968 | 826296 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 60 | Fadhila Hamad Suleiman | 280001847 | 460514 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 61 | Fadhila Said Hamad | 030291522 | 973706 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 62 | Faida Said Mwalimu | 060323749 | 281021 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 63 | Faki Omar Juma | 310011998 | 733228 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 64 | Faki Shehe Ali | 690017766 | 276851 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 65 | FALIZA BAKAR HAMAD | 310010431 | 393676 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 66 | Farashuu Abdalla Khamis | 310037589 | 419529 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 67 | Farida Moh'd Rashid | 670044847 | 374024 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 68 | Fatma Ali Mwadini | 709013705 | 388565 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 69 | Fatma Haji Mjaka | 260210753 | 425514 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 70 | Fatma Khamis Hassan | 863062924 | 689094 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 71 | Fatma Khamis Kombo | 060208916 | 233086 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 72 | Fatma Mabruki Khamis | 040358640 | 188571 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 73 | Fatma Moh'd Ali | 060338161 | 972856 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 74 | Fatma Moh'd Juma | 320205310 | 825891 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Uendeshaji na Utumishi |
| 75 | Fatma Moh'd Suleiman | 510061104 | 748035 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 76 | Fatma Nassor Hamad | 580045394 | 227270 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Mafunzo ya Ualimu |
| 77 | Fatma Omar Hamad | 060315780 | 268605 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 78 | Fatma Rashid Moh'd | 210196191 | 725817 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Mafunzo ya Ualimu |
| 79 | Fatma Yussuf Issa | 210201853 | 825201 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 80 | Fatuma Ali Mohamed | 320016637 | 473815 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 81 | Fatuma Ali Salim | 060276300 | 561325 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 82 | Habiba Saleh Rashid | 704003002 | 479689 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 83 | Habiba Yussuf Alawi | 020158996 | 418832 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 84 | Hadia Ali Suleiman | 010044261 | 476261 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 85 | Hadia Khalid Shehe | 100069208 | 148005 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 86 | Hafidh Shaame Haji | 030400142 | 774077 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 87 | Haitham Hassan Omar | 670002131 | 567466 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 88 | HAJI JUMA HAJI | 960002224 | 480935 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 89 | Haji Mani Vuai | 100228678 | 963743 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 90 | HALID MAKAME MACHANO | 505066667 | 682873 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 91 | Halima Said Hamad | 917028292 | 688624 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 92 | Halima Suleiman Nassor | 020009270 | 632790 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 93 | Hamad Hassan Hamad | 690004090 | 776807 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 94 | Hamad Juma Hamad | 590040868 | 335144 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 95 | Hamad Juma Suleiman | 917255234 | 680775 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 96 | Hamad Khamis Hamad | 280195052 | 232916 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 97 | Hamad Mahunzi Juma | 620061612 | 776434 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 98 | Hamad Omar Hamad | 230021518 | 151715 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 99 | HAMAD SAID SALUM | 670048485 | 582775 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 100 | Hamad Salum Hamad | 968001804 | 788633 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 101 | Hamida Moh'd Said | 270215625 | 832784 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 102 | Hanifa Dhamir Simai | 320087503 | 776386 | On Probation | — | — |
| 103 | Haroun Said Bakar | 970417918 | 268905 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 104 | Hasina Omar Salim | 030316384 | 975967 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 105 | Hasina Salim Mussa | 270200038 | 732929 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 106 | Hasina Yussuf Juma | 690062481 | 172840 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 107 | Hassan Ali Abdalla | 030094055 | 950815 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Uendeshaji na Utumishi |
| 108 | Hassan Ali Bakar | 050048720 | 975772 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 109 | Hassan Mahmoud Muhidin | 090138577 | 463211 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 110 | Hassan Said Hassan | 060235734 | 832621 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 111 | Hassan Seif Masahare | 260193740 | 724804 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 112 | Haula Othman Ngwali | 996192936 | 689118 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 113 | Hawa Moh'd Juma | 040286967 | 763214 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 114 | Hidaya Hamdu Lila | 996015581 | 889833 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | — |
| 115 | Hidaya Moh'd Ali | 0320134010 | 635025 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 116 | Hidaya Omar Moh'd | 060250793 | 818569 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 117 | Hussein Ali Chande | 090032105 | 236212 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 118 | Ibrahim Ali Khatib | 690067059 | 376439 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 119 | Iddi Kombo Hassan | 040344070 | 974062 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 120 | Isha Hamada Ali | 994510966 | 588664 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 121 | Issa Hassan Maalim | 550044556 | 436303 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 122 | Jamila Moh'd Khamis | 300020434 | 851681 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 123 | Juma Bakar Mataka | 530045289 | 926994 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 124 | Juma Khamis Juma | 290012983 | 232787 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 125 | Juwairia Omar Mussa | 510076526 | 820536 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 126 | KAME ALI OMAR | 530053594 | 425849 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 127 | Khadija Hussein Faki | 300137774 | 368411 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 128 | Khadija Khamis Said | 995363433 | 588697 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 129 | Khadija Moh'd Abdalla | 917247856 | 788699 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 130 | Khadija Omar Faki | 010074066 | 875941 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 131 | KHADIJA RASHID MOHAMED | 854274855 | 731099 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 132 | Khadija Shamte Omar | 310028817 | 833715 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 133 | Khadija Tahir Ali | 670004175 | 563748 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 134 | Khairat Juma Abdalla | 709041204 | 473548 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 135 | Khairat Kassim Shaaban | 481087630 | 573710 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 136 | Khairat Moh'd Omar | 970035456 | 988708 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 137 | Khairat Yahya Nassor | 670072734 | 281921 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 138 | Khalfan Nassor Kassim | 620397278 | 174071 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 139 | Khalid Mkubwa Ali | 080165826 | 127156 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 140 | Khamis Amour Khamis | 260201573 | 130193 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Mafunzo ya Ualimu |
| 141 | Khamis Hamad Khamis | 040357678 | 276876 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 142 | Khamis Omar Kibano | 510039378 | 454480 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 143 | Khamis Rashid Haji | 924007170 | 882859 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 144 | Khamis Salum Amour | 280228527 | 967461 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 145 | Khatib Mshindo Bakar | 530048648 | 321244 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 146 | Kheri Ame Kheri | 020302164 | 373969 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 147 | Kidhea Masoud Abdalla | 090017214 | 219779 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 148 | Kombo Bakar Kombo | 690010840 | 575136 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 149 | Lailat Sijamini Posho | 633061974 | 789832 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | — |
| 150 | Latifa Omar Mussa | 0020178918 | 333062 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 151 | Mafunda Hamad Salim | 590030441 | 660265 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 152 | Maimuna Abdalla Moh'd | 210203994 | 132712 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 153 | Maimuna Ali Hamad | 670105034 | 783043 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 154 | Maimuna Salim Seif | 620389387 | 889728 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 155 | Makame Hamad Makame | 300201242 | 235702 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 156 | Mariam Omar Haji | 423005006 | 373977 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 157 | Maryam Abdalla Hamad | 690045051 | 488736 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 158 | MARYAM ALI ABDALLA | 580069103 | 479720 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 159 | Maryam Khamis Amour | 433013210 | 581924 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 160 | Maryam Khamis Fereji | 520215278 | 669224 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 161 | Maryam Said Omar | 863067370 | 779561 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 162 | Maryam Salim Juma | 280198178 | 424478 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 163 | Maryam Salum Juma | 290012831 | 332796 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 164 | Maryam Shaaban Mtwana | 090011289 | 776791 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 165 | Massoud Hamad Omar | 540056367 | 432918 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 166 | Mati Hamad Ali | 280205465 | 873632 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 167 | Maua Hashim Ali | 080149947 | 376900 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 168 | Maua Rashid Shaame | 854159041 | 382740 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 169 | Mbarouk Hamad Mbarouk | 090026698 | 366379 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 170 | Mbaruok Hamad Mbaruok | 710062044 | 282837 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 171 | Mgeni Said Suleiman | 270201394 | 760914 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 172 | Mgeni Salim Ali | 080138367 | 461073 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 173 | Mgeni Salim Juma | 670053124 | 176534 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 174 | Moh'd Abdalla Moh'd | 530084604 | 426016 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 175 | Moh'd Ali Othman | 040349596 | 973933 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 176 | Moh'd Ayoub Suleiman | 590066093 | 819362 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 177 | Moh'd Mbarouk Ali | 710063320 | 381144 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 178 | Moh'd Ramadhan Soud | 600036722 | 233223 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 179 | Moh'd Sadi Juma | 690049107 | 380942 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 180 | Moza Juma Jamal | 690062957 | 782769 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 181 | Mshangi Masoud Ali | 020208189 | 768626 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 182 | Mshauri Abdalla Khamis | 220113074 | 617392 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Uendeshaji na Utumishi |
| 183 | Mtumwa Hamad Ali | 510068648 | 448057 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 184 | Mtumwa Hamza Khamis | 270242469 | 962252 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 185 | Mtumwa Khamis Salum | 0090012280 | 526609 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 186 | Mtumwa Said Suleiman | 060273747 | 435331 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 187 | Mtumwa Shaaban Khamis | 280226392 | 580806 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 188 | Muhamad Haji Khamis | 290009563 | 154429 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 189 | Muhammad Khamis Mbarouk | 060238287 | 951585 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 190 | Mussa Hamza Omar | 060296267 | 373952 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 191 | Mussa Moh'd Abass | 010079702 | 550658 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 192 | Mwajuma Khamis Kombo | 030109568 | 936973 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 193 | Mwajuma Mwalim Tosha | 854016741 | 382619 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 194 | Mwalimu Bakar Ali | 917029314 | 788796 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 195 | MWAMIZE IDDI HAMAD | 690017973 | 282756 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 196 | Mwanaate Shaame Hamad | 300206344 | 472843 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 197 | Mwanajuma Ali Saleh | 972007494 | 188799 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 198 | Mwantanga Rashad Mohamed | 994636873 | 976882 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 199 | Mwatima Ali Mrisho | 620391382 | 476123 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 200 | Mweupe Othman Ali | 710029939 | 173950 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 201 | Najma Moh'd Bakar | 481536580 | 976469 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 202 | NAJMA OTHMAN HAJI | 690021763 | 982754 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 203 | Najma Yussuf Hamad | 040349978 | 573954 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 204 | Nasra Baraka Saleh | 885037672 | 583139 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 205 | Nassor Abdalla Salim | 230169191 | 832638 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 206 | Nassor Ali Moh'd | 060280247 | 736217 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 207 | Nassor Ali Omar | 080130576 | 159184 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 208 | Nassor Moh'd Nassor | 220178983 | 973966 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 209 | Nayeshe Saleh Mbwana | 530054498 | 621303 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 210 | Ngwali Ali Haji | 010068274 | 957717 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 211 | Nunuu Abdalla Suleiman | 580041617 | 857749 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 212 | Omar Abrahman Salim | 08011362 | 575963 | On Probation | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 213 | Omar Ramadhan Abdalla | 210197189 | 732815 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 214 | Omar Silime Khamis | 550066729 | 889185 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 215 | Othman Abrahman Said | 230200052 | 576481 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 216 | Othman Amour Mselem | 680045870 | 876540 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 217 | Othman Moh'd Othman | 670031265 | 579738 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 218 | Rahma Abdalla Makame | 670089705 | 880817 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 219 | Rahma Ali Hassan | 210061307 | 881838 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 220 | Rahma Mwinyi Juma | 580031494 | 524040 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 221 | Raiyani Zubeir Khamis | 917391257 | 880711 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 222 | Rajab Ali Omar | 580028553 | 936243 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 223 | Rashid Masoud Rashid | 090023035 | 163639 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 224 | Raya Abdalla Mbarouk | 917083624 | 372834 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 225 | Raya Masoud Said | 260238142 | 520874 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 226 | Raya Ramadhan Suleiman | 060361972 | 581040 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 227 | Rehema Khamis Massoud | 510055943 | 548082 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 228 | Rehema Suleiman Omar | 1240186946 | 879838 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 229 | RIZIKI ALI KHAMIS | 670008797 | 679747 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 230 | Rukia Abdalla Ali | 060228705 | 975197 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 231 | Rukia Abdi Juma | 640103512 | 481931 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 232 | Rukia Ahmed Salum | 0020128586 | 532976 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 233 | Rukia Haji Mjaka | 931009826 | 382757 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 234 | RUKIA MBWANA HASSAN | 671013732 | 782752 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 235 | Rukia Shaame Faki | 0060233596 | 626553 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 236 | Ruwaida Salum Nassor | 710055549 | 880825 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 237 | Saada Hamad Kombo | 200072036 | 821832 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu Mbadala na Watu Wazima |
| 238 | Saada Uleid Juma | 580023888 | 624041 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 239 | Sabiha Suleiman Abed | 090014208 | 663610 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 240 | Sabrina Ali Khamis | 670039001 | 973999 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 241 | Sabrina Kasim Shaali | 289015422 | 180827 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 242 | Sada Haji Omar | 010066667 | 379590 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 243 | Sada Issa Ali | 090029536 | 963613 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 244 | Sada Salim Ali | 670104253 | 988887 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 245 | Sadra Iddi Haji | 670105898 | 288889 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 246 | Safia Hemed Ali | 690048504 | 580830 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 247 | Safia Suleiman Faki | 320192249 | 721304 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 248 | Saida Hamad Ali | 030302743 | 376796 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 249 | Said Ali Said | 030099652 | 646277 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 250 | Said Hamad Ali | 020196941 | 267463 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 251 | Said Khamis Nassor | 994175530 | 483081 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 252 | Said Omar Ali | 270201026 | 125099 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 253 | Said Sleiman Usi | 520273779 | 276551 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 254 | Salama Abdalla Salum | 728026562 | 879757 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 255 | Salama Khamis Juma | 250210063 | 132842 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 256 | Salim Juma Mussa | 670041213 | 957709 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Ofisi Kuu Pemba |
| 257 | Salim Khamis Haji | 060250492 | 525831 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Uendeshaji na Utumishi |
| 258 | Salma Khatib Ibrahim | 240189242 | 957700 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 259 | Salma Mkubwa Haji | 090237654 | 767468 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 260 | Salma Moh'd Khatib | 220217075 | 720495 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 261 | Salma Rajab Haji | 100031544 | 681933 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 262 | Salma Saleh Ahmed | 0300225297 | 517512 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 263 | Salma Siasa Khamis | 505037591 | 188928 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 264 | Salum Hamad Omar | 020180531 | 368266 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 265 | Salum Mgeni Mohammed | 670004308 | 975983 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 266 | Samira Ali Hamad | 690009040 | 868132 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 267 | Sanani Hamoud Sanani | 040303912 | 876840 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 268 | Sanura Is-haka Mzee | 520065237 | 246208 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 269 | Sanura Mgeni Shaali | 690066333 | 574042 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 270 | Saumu Hamadi Ali | 610204061 | 388938 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 271 | Saumu Hussein Rashid | 600037532 | 533429 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 272 | Saumu Makame Khamis | 550045256 | 973658 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 273 | Saumu Omar Ali | 300220030 | 925673 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 274 | Saumu Ussi Kassim | 060295813 | 488939 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 275 | Seif Ali Saleh | 290176542 | 557738 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 276 | Seif Hamad Moh'd | 709013324 | 975391 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 277 | Seif Khalfan Aziz | 230167584 | 332633 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 278 | Shadya Rashid Said | 690003109 | 368655 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 279 | Shara Said Juma | 060216454 | 446218 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 280 | SHARIFA Moh'd NASSOR | 280239644 | 179767 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 281 | Shekha Abdi Suleiman | 730033301 | 563667 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 282 | Shufaa Massoud Ali | 481573158 | 688957 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 283 | Shuweina Massoud Ali | 670096747 | 773526 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 284 | Shuwekha Salim Omar | 290179464 | 168920 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 285 | Siti Hamad Hassan | 30021174 | 921752 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 286 | SITI SAID HAMAD | 690042210 | 682751 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 287 | Sleyyum Amour Sleyyum | 020207227 | 468656 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 288 | Subeha Abdulla Said | 060251451 | 626091 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 289 | Subira Ali Juma | 600011022 | 174711 | On Probation | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 290 | Suhaila Sultani Suleiman | 010061439 | 873705 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 291 | Suleiman Hamad Khalfani | 060370916 | 180932 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 292 | Suleiman Juma Mwadini | 060316529 | 373474 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 293 | Suleiman Juma Seif | 0590029544 | 432634 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 294 | Suleiman Khatib Kombo | 540048272 | 425247 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 295 | Suleiman Saleh Ali | 540050329 | 626812 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 296 | Tahria Hamza Suleiman | 060292739 | 167519 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 297 | Tamima Moh'd Said | 0220222468 | 726027 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 298 | Tatu Hilali Nassor | 060334358 | 461357 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 299 | Thabit Moh'd Kheir | 290206250 | 825915 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 300 | Thureya Omar Hamadi | 620368678 | 682962 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 301 | Thuwaiba Khatib Faki | 709013041 | 880858 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 302 | Time Hemed Abdallah | 100037375 | 863612 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 303 | Time Khamis Masoud | 040281755 | 874053 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 304 | Ummil-Khair Abdalla Moh'd | 670086838 | 380861 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 305 | Ummukulthum Khamis Jabu | 481551811 | 189235 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 306 | Ussi Ayoub Moh'd | 590064677 | 926020 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 307 | Ussi Salim Ali | 090063602 | 725833 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 308 | WARDA SULEIMAN BAKARI | 510067210 | 379777 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 309 | Wardat Abdulla Nassor | 670101975 | 388995 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 310 | Wastara Juma Hamad | 220190198 | 561358 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 311 | Yussra Maulid Ali | 481299051 | 473523 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 312 | Yussra Mustafa Hassan | 060167000 | 673525 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 313 | Zainab Adam Khamis | 863007711 | 189243 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 314 | Zainab Amour Khamis | 020200408 | 775227 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 315 | Zainab Hamad Juma | 481084862 | 580911 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 316 | Zainab Makame Ali | 060252711 | 533104 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 317 | ZAINAB MBWANA HASSAN | 917202443 | 882753 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 318 | Zainab Saleh Abdul-Rahman | 670070910 | 689012 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 319 | Zalfa Said Khamis | 690026221 | 575233 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 320 | Zanaria Amour Khalid | 481046780 | 475298 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 321 | Zawadi Juma Moh'd | 0530086020 | 319471 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 322 | Zawadi Juma Omar | 060314682 | 662306 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 323 | Zeyana Mussa Alawy | 270264556 | 754078 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 324 | Ziada Abeid Ayoub | 530079554 | 175927 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 325 | ZIADA YUSSUF SEIF | 030292277 | 279613 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 326 | Zuhura Gharib Moh'd | 020007906 | 825834 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 327 | Zuhura Salim Mohamed | 060365112 | 568665 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 328 | Zuhura Zahor Massoud | 280235103 | 773550 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |
| 329 | Zuleikha Issa Khamis | 060201346 | 660873 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 330 | Zulekha Amour Salim | 0300025552 | 432901 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 331 | Zuwena Juma Simba | 530046769 | 236245 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Maandalizi na Msingi |
| 332 | Zuwena Mustafa Ahmad | 620020729 | 676563 | Confirmed | Wizara ya Elimu na Mafunzo ya Amali | Elimu ya Sekondari |

### Baraza la Manispaa Magharibi B
**Vote:** 204 | **TIN:** 129840552 | **Empty Cadre Count:** 73

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | ABDALLA RAMADHAN ABDALLA | 620168014 | 998025 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 2 | Abdillahi Abdulrahim Msham | 520126330 | 974395 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 3 | Aisha Abdalla Mzee | 320084704 | 364734 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 4 | Ali Juma Khamis | 270049381 | 820171 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 5 | Ame Pandu Haji | 100147472 | 964772 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 6 | AMINA IDAROUS  FAINA | 320133488 | 998023 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 7 | AMINA KHAMIS  OMAR | 270155015 | 998018 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 8 | Amina Shaka Khatib | 300111536 | 764787 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 9 | Asma Omar Jecha | 010249927 | 268379 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 10 | Azida Waziri Ameir | 040042145 | 865176 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 11 | Aziza Mwadini Ame | 270067369 | 964797 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 12 | Bakar Ali Saleh | 600002826 | 864803 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 13 | Daud Juma Khamis | 110955240 | 764810 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 14 | Farashuu Mussa Abdalla | 260193385 | 178779 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 15 | Farouk Omar Khamis | 620372549 | 974410 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 16 | Fatma Ali Khatib | 210108727 | 213816 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 17 | Fatma Hamid Ahmed | 020099442 | 160325 | Confirmed | Shirika la Umeme | — |
| 18 | Fatma Hassan Iddi | 060058700 | 164862 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 19 | Fatma Said Masoud | 060100856 | 964878 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 20 | Fatma Salahi Juma | 210108769 | 464881 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 21 | HAJI MSURI MUHIDIN | 040118372 | 998017 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 22 | Hamdu Hassan Makame | 090135354 | 364897 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 23 | HASSAN ALI NASSOR | 5802550558 | 998027 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 24 | Hisham Juma Abdalla | 30000125 | 964886 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 25 | Ibrahim Khamis Ibrahim | 020071794 | 866812 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 26 | Jamila Machano Khamis | 620130907 | 474860 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 27 | Jina Hassan Kondo | 290104471 | 364856 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 28 | Khadija Khamis Silima | 070192065 | 464265 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Mapato, Uchumi na Wajasiriamali |
| 29 | Khadija Ramadhan Abdulla | 010249451 | 764268 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 30 | Khamis Amour Suleiman | 010263480 | 474496 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 31 | Khamis Juma Khamis | 270124028 | 165015 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 32 | KHAMIS MADARAKA KASITU | 620093927 | 998026 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 33 | Khatib Omar Khamis | 070135413 | 464249 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 34 | Louce James Thomas | 220110819 | 165194 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 35 | Lutfia Ahmed Sultan | 300112870 | 449264 | Confirmed | Baraza la Manispaa Magharibi B | Kitengo cha Manunuzi na Ugavi |
| 36 | Machano Choum Khamis | 260109707 | 365196 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 37 | Male Ali Issa | 520122912 | 550593 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 38 | Mariam Ramadhan Iddi | 230067765 | 664226 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 39 | Mashavu Bakar Suleiman | 060079752 | 264230 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 40 | Mbarouk Nassour Khamis | 690027507 | 676052 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 41 | Mcha Abdalla Mussa | 220135991 | 156098 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya huduma za jamii,Mipango Miji, Usafi na Usimamizi wa Taka |
| 42 | Mngwali Mohamed Machano | 260101699 | 165267 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 43 | MOHAMED BAJAR JABU | 300114047 | 998016 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 44 | Mohammed Nassir Mohammed | 610100581 | 574472 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 45 | Mtumwa Hamad Shamis | 280116156 | 434643 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Mapato, Uchumi na Wajasiriamali |
| 46 | Munira Issa Vuai | 610094653 | 964212 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 47 | Munira Suleiman Othman | 020059482 | 364215 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 48 | Mwadini Hassan Ali | 750016388 | 264222 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 49 | Mwanaidi Kulamja Kitwana | 060013091 | 265227 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 50 | Mwanaisha Ali Haji | 300081857 | 365228 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 51 | Mwanaisha Said Abdalla | 070191323 | 664826 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 52 | MWANAKHAMIS MSELEM RAMADHAN | 290110629 | 998024 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 53 | Mwita Hassan Mwita | 290109803 | 865249 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 54 | Najati Haji Juma | 210103793 | 565254 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 55 | Nasra Moh'd Said | 580287062 | 664842 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 56 | Nassra Abdalla Juma | 020103190 | 834874 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 57 | NUSAIBAT HAFIDH AHMED | 994820161 | 998021 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 58 | Pili Moh'd Ali | 100015694 | 665271 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 59 | Sabra Issa Machano | 280069937 | 847112 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 60 | SAFIA  YAHYA  HUSSEIN | 090073166 | 998022 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 61 | Said Abdalla Ame | 040277965 | 165064 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 62 | Said Kassim Haji | 230091836 | 265292 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 63 | Sakina Salum Mikidadi | 020109963 | 865298 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 64 | SALEH JUMA KINANA | 580318085 | 998019 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 65 | SALMA JUMANNE  NYAMDUNDA | 230099274 | 998020 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 66 | Saum Simai Omar | 240074373 | 968458 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 67 | Shaaban Mgeni Mohamed | 520178735 | 872693 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 68 | Silima Ussi Haji | 040221472 | 627899 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 69 | Somali Ali Simai | 030080375 | 974451 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 70 | Subira Ramsa Mbarouk | 060128575 | 865305 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 71 | Ussi Abdalla Ali | 070090859 | 365155 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |
| 72 | Zawadi Hafidh Suleiman | 580304677 | 872596 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Mapato, Uchumi na Wajasiriamali |
| 73 | Zawadi Hamim Massoud | 080006741 | 656750 | Confirmed | Baraza la Manispaa Magharibi B | Idara ya Rasilimali Watu, Utawala na Mipango |

### WIZARA YA KILIMO UMWAGILIAJI MALIASILI NA MIFUGO
**Vote:** 012 | **TIN:** 101817679 | **Empty Cadre Count:** 42

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abassi Hafuru abdurahmani | 020265320 | 567822 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 2 | Abdalla Ali Hassan | 040091288 | 535210 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara Ya Kilimo Na Uhakika Wa Chakula |
| 3 | Abdalla Gharib Moh'd | 040223474 | 446631 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara Ya Kilimo Na Uhakika Wa Chakula |
| 4 | Abdi Ali Mattar | 060028167 | 846651 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara Ya Kilimo Na Uhakika Wa Chakula |
| 5 | Abdillah Juma Khamis | 650050497 | 968296 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara Ya Kilimo Na Uhakika Wa Chakula |
| 6 | Abdulhalim Yusuph Mohamed | 481229142 | 290702 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Maendeleo ya Mifugo |
| 7 | Abdulkarim Ali Mussa | 668002361 | 767824 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 8 | Abuu Said Moh'd | 550029322 | 607056 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 9 | Ali Abdalla Himid | 020230397 | 258091 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 10 | Ame Ali Makame | 290093548 | 929367 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara Ya Kilimo Na Uhakika Wa Chakula |
| 11 | Ame Machano Bakari | 040017329 | 746489 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara Ya Kilimo Na Uhakika Wa Chakula |
| 12 | Amina Moh'd Mahmoud | 20091415 | 603540 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Maendeleo ya Mifugo |
| 13 | Asya Yussuf Khamis | 520238921 | 947170 | Confirmed | Wakala wa Uwezeshaji Wananchi Kiuchumi | Idara ya Rasilimaliwatu |
| 14 | Duchi Subira Mussa | 070301317 | 658127 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 15 | Fatma Gharib Ali | 030044380 | 229028 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 16 | Issa Makungu Hamdan | 090223958 | 958113 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 17 | Khamis Suleiman Khamis | 640048114 | 872611 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara Ya Kilimo Na Uhakika Wa Chakula |
| 18 | Khatib Hassan Mbarak | 260180359 | 934145 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 19 | Kombo Muhamed Sleman | 060030120 | 650286 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara Ya Kilimo Na Uhakika Wa Chakula |
| 20 | Mkanga Mwaniwa Mkanga | 260179371 | 334131 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 21 | Mlenge Haji Mlenge | 100120372 | 134146 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 22 | Moh'd Abdalla Anas | 620015695 | 358108 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 23 | Mossi Salum Mohamed | 100087202 | 504130 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara Ya Kilimo Na Uhakika Wa Chakula |
| 24 | Mtumwa Burhan Maabad | 610113765 | 666632 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Uendeshaji na Utumishi |
| 25 | Mtumwa Pongwa Jaffar | 520284744 | 967883 | Confirmed | Mamlaka ya Usafiri Barabarani | — |
| 26 | Mussa Amour Suleiman | 230068795 | 650448 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 27 | Muzamil Shehe Khamis | 540264964 | 772546 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara Ya Kilimo Na Uhakika Wa Chakula |
| 28 | Mwanaali Mzee Waziri | 210162282 | 404884 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara Ya Kilimo Na Uhakika Wa Chakula |
| 29 | Mwanaidi Zani Mwinyi | 080045043 | 703736 | On Probation | — | — |
| 30 | Mwanaisha Hamad Suleiman | 230049923 | 303587 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 31 | Mwanajuma Manuari Yanga | 270168011 | 646430 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara Ya Kilimo Na Uhakika Wa Chakula |
| 32 | Mwanakheir Malik Juma | 260063375 | 129027 | On Probation | — | — |
| 33 | Nachum Khatib Hassan | 020241595 | 958138 | On Probation | — | — |
| 34 | Nahija Abdalla Daima | 030108732 | 931975 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 35 | Omar Khamis Juma | 220178543 | 205335 | On Probation | — | — |
| 36 | Pandu Haji Gora | 090123197 | 153887 | On Probation | — | — |
| 37 | Rahma Subira Khatib | 510025711 | 546519 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara Ya Kilimo Na Uhakika Wa Chakula |
| 38 | Rukia Amour Ally | 520190843 | 358140 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 39 | Said Moh'd Mkanga | 030084405 | 934153 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 40 | Seif Ali Maalim | 280226619 | 705834 | On Probation | — | — |
| 41 | Suleiman Haji Suleiman | 520020463 | 734484 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 42 | Zuwena Muhamad Ndende | 332008866 | 783457 | Confirmed | MFUKO WA HUDUMA ZA AFYA ZANZIBAR | — |

### Ofisi ya Mkuu wa Mkoa wa Kaskazini Unguja
**Vote:** 048 | **TIN:** 107779450 | **Empty Cadre Count:** 27

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abdulghafur Khalfan Marzuk | 250006759 | 264709 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 2 | Abdulrahman Mussa Abdalla | 610289620 | 967575 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 3 | Abeid Makame Juma | 060031037 | 364718 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 4 | Ali Abeid Ameir | 310140061 | 258197 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 5 | Ali Makame Foum | 040187314 | 349247 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 6 | Ayoub Mohammed Mahmoud | 270268225 | 732491 | On Probation | — | — |
| 7 | Cassian Galous Nyimbo | 100054899 | 243032 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 8 | Hassan Juma Hassan | 040226325 | 712273 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 9 | Hassan Khamis Hassan | 060001960 | 412270 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 10 | Hemed Ali Bakari | 550022529 | 458199 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 11 | Hussein Juma Khamis | 100149584 | 749234 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 12 | Issa Hassan Khamis | 270288755 | 960438 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 13 | Issa Moh'd Hassan | 640019954 | 264863 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 14 | Juma Machano Juma | 060015271 | 412295 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 15 | Khadija Iddi Shamte | 050003244 | 523393 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 16 | Machano Abdalla Ame | 060034001 | 565076 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 17 | Mariyam Sharif Haji | 060035264 | 265219 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 18 | Mora Ali Khamis | 540199673 | 778954 | Confirmed | Mkoa wa Kaskazini Unguja | — |
| 19 | Muhammed Yunus Juma | 060049656 | 665206 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 20 | Mukrim Rashid Mussa | 010289880 | 467181 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 21 | Nachum Kombo Mwadini | 030019098 | 358198 | Confirmed | Wilaya ya Kaskazini A | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 22 | Omar Abdulrahman Mfaume | 100142163 | 765264 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 23 | Patima Juma Haji | 020250898 | 472576 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 24 | Pili Haji Mkanga | 040222486 | 713812 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 25 | Rabia Kassim Juma | 640018982 | 460441 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 26 | Suleiman Mbaraka Suleiman | 100145548 | 965306 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 27 | Tunu Ali Mussa | 050006645 | 713618 | Confirmed | Mkoa wa Kaskazini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |

### Baraza la Mji Kati Unguja
**Vote:** 205 | **TIN:** 134349867 | **Empty Cadre Count:** 20

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abdulrahman Omar Abdalla | 530025445 | 997938 | Confirmed | Baraza la Mji Kati | — |
| 2 | Ahmed Abdalla Abdalla | 030151989 | 167057 | Confirmed | Baraza la Mji Kati | IDARA YA RASILIMALI WATU MIPANGO NA UTAWALA |
| 3 | Aisha Mohamed Omar | 620334727 | 774499 | Confirmed | Baraza la Mji Kati | IDARA YA RASILIMALI WATU MIPANGO NA UTAWALA |
| 4 | Ali  Hassan Mambo | 80107286 | 997947 | Confirmed | Baraza la Mji Kati | — |
| 5 | Amina Endrew Clement | 030095661 | 997946 | Confirmed | Baraza la Mji Kati | — |
| 6 | Catherin Petter Nao | 060104009 | 997941 | Confirmed | Baraza la Mji Kati | — |
| 7 | Fatma Ali Said | 520090613 | 272963 | Confirmed | Baraza la Mji Kati | — |
| 8 | Ghania  Ali  Makame | 540031955 | 997945 | Confirmed | Baraza la Mji Kati | — |
| 9 | Haji Mzee Ali | 510027361 | 997952 | Confirmed | Baraza la Mji Kati | — |
| 10 | Hamida  Bahati Giri | 240166874 | 997944 | Confirmed | Baraza la Mji Kati | — |
| 11 | Hidaya  Said Hamad | 280175302 | 997943 | Confirmed | Baraza la Mji Kati | — |
| 12 | Juma  Kumba Juma | 550015947 | 997940 | Confirmed | Baraza la Mji Kati | — |
| 13 | Mashaka Thnei Salum | 070174304 | 267058 | Confirmed | Baraza la Mji Kati | IDARA YA RASILIMALI WATU MIPANGO NA UTAWALA |
| 14 | Mwanaisha Ali Said | 520029239 | 857822 | Confirmed | Baraza la Mji Kati | — |
| 15 | Riziki  Mohamed Abdalla | 200061553 | 997950 | Confirmed | Baraza la Mji Kati | — |
| 16 | Said  Hassan  Shaaban | 260191683 | 997949 | Confirmed | Baraza la Mji Kati | — |
| 17 | Said  Mtaji Askari | 060190484 | 997942 | Confirmed | Baraza la Mji Kati | — |
| 18 | Seif Hamad Seif | 260171894 | 997939 | Confirmed | Baraza la Mji Kati | — |
| 19 | Tendani Mkanga Miraji | 220162382 | 997951 | Confirmed | Baraza la Mji Kati | — |
| 20 | Ussi Ali Mtumwa | 030151138 | 997948 | Confirmed | Baraza la Mji Kati | — |

### Baraza la Mji Kaskazini A Unguja
**Vote:** 207 | **TIN:** 141799118 | **Empty Cadre Count:** 19

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Adam Abdalla Makame | 030101382 | 952005 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 2 | ALI CHUM HAJI | 0500022735 | 998030 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 3 | CHEMBE KHAMIS  SHEHA | 210032008 | 998033 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 4 | FAKI ZUBEIR HAJI | 260260758 | 998029 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 5 | HAWA UBWA MCHEZO | 020263470 | 998039 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 6 | Iddi Ali Haji | 260032553 | 174777 | Confirmed | Mfuko wa Hifadhi ya Jamii | — |
| 7 | JABU HAMDU MAKAME | 020261504 | 998036 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 8 | KHAMIS HAJI  ALI | 040243881 | 998032 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 9 | KHAMIS KOMBO KHAMIS | 300031687 | 998040 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 10 | Khamis Mohamed Muhamadi | 240104395 | 346274 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 11 | KHAMIS VUAI LILA | 260040033 | 998034 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 12 | KOMBO SHEHA  HAJI | 240027876 | 998035 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 13 | MAIMUNA KASSIM YUSSUF | 650090538 | 998037 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 14 | MAKME MACHANO FOUM | 260012036 | 998031 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 15 | Miza Juma Sharif | 260031303 | 374762 | Confirmed | Kamisheni ya Utalii | — |
| 16 | Mselem Haroub Hussein | 020014537 | 449297 | Confirmed | Kamisheni ya Utalii | — |
| 17 | NYANGE KHEIR ALI | 02035905 | 998028 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |
| 18 | Seif Makame Juma | 240100401 | 467157 | Confirmed | MFUKO WA HUDUMA ZA AFYA ZANZIBAR | — |
| 19 | SULEIMAN JUMA KIMEA | 270110830 | 998041 | Confirmed | Baraza la Manispaa Kaskazini A | Rasilimali Watu Mipango na Utawala |

### Chuo cha Kiislamu
**Vote:** — | **TIN:** 104563732 | **Empty Cadre Count:** 19

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Ali Haji Mbarouk | 700039528 | 166944 | Confirmed | Chuo cha Kiislam | — |
| 2 | Ali Issa Suleiman | 260201007 | 150662 | Confirmed | Chuo cha Kiislam | — |
| 3 | Ali Mohamed Shamis | 040078920 | 950701 | Confirmed | Chuo cha Kiislam | — |
| 4 | Ali Mussa Kombo | 280063892 | 861093 | Confirmed | Chuo cha Kiislam | — |
| 5 | Amran Said Suleiman | 080012193 | 126865 | Confirmed | Chuo cha Kiislam | IDARA YA UTAWALA, MIPANGO NA FEDHA |
| 6 | Bakar Omar Nassor | 290119477 | 433541 | Confirmed | Chuo cha Kiislam | — |
| 7 | Fatma Saleh Abubakar | 0300046148 | 728944 | Confirmed | Chuo cha Kiislam | — |
| 8 | Hemed Shaaban Moh'd | 090233896 | 159298 | Confirmed | Chuo cha Kiislam | — |
| 9 | Juma Seif Juma | 270219263 | 176453 | Confirmed | Chuo cha Kiislam | IDARA YA UTAWALA, MIPANGO NA FEDHA |
| 10 | Khadija Khamis Abdulhamid | 100068809 | 336919 | Confirmed | Chuo cha Kiislam | — |
| 11 | Makame Haji Said | 550046231 | 514118 | Confirmed | Chuo cha Kiislam | — |
| 12 | Mbarouk Juma Mbarouk | 530062910 | 127131 | Confirmed | Chuo cha Kiislam | — |
| 13 | Moh'd Issa Haji | 060003603 | 745938 | Confirmed | Chuo cha Kiislam | — |
| 14 | Mwantatu Juma Khamis | 030065028 | 997160 | Confirmed | Chuo cha Kiislam | — |
| 15 | Omar Juma Ameir | 260225780 | 535868 | Confirmed | Chuo cha Kiislam | — |
| 16 | Rabia Bakar Ali | 620022190 | 288823 | Confirmed | Chuo cha Kiislam | — |
| 17 | Sharuq Abdulshakur Ali | 620015585 | 581584 | Confirmed | Chuo cha Kiislam | — |
| 18 | Viwe Ali Khamis | 590045766 | 774036 | Confirmed | Chuo cha Kiislam | — |
| 19 | Vuai Ali Msaada | 070163339 | 218782 | Confirmed | Chuo cha Kiislam | — |

### WIZARA YA UJENZI MAWASILIANO NA UCHUKUZI
**Vote:** 016 | **TIN:** 101817156 | **Empty Cadre Count:** 19

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abdalla Ramadhan Khamis | 670055948 | 960454 | Confirmed | Taasisi ya Viwango Zanzibar | — |
| 2 | Abubakar Salum Omar | 070034981 | 756808 | Confirmed | Baraza la Wawakilishi | — |
| 3 | Amani Hamduni Zubeir | 520103331 | 682402 | Confirmed | Wakala wa Mkonga wa Mawasiliano | — |
| 4 | Edith Emmanuael Clemence | 300121979 | 207733 | On Probation | — | — |
| 5 | Fadhil Juma Ali | 230120417 | 403230 | On Probation | — | — |
| 6 | Haji Makame Mtwana | 210025024 | 248452 | On Probation | — | — |
| 7 | Haji Moh'd Makame | 320150232 | 407808 | On Probation | — | — |
| 8 | Hamad Said Mussa | 060363819 | 566980 | On Probation | — | — |
| 9 | John Bulahya Kadalla | 280083364 | 103390 | Confirmed | Mamlaka ya Usafiri Barabarani | — |
| 10 | Khadija Idrissa Abeid | 230058352 | 847567 | Confirmed | Mamlaka ya Usafiri Barabarani | — |
| 11 | Khalid Mbarak Ahmada | 520285949 | 560807 | On Probation | — | — |
| 12 | Khatib Moh'd Khatib | 270048995 | 100003 | On Probation | — | — |
| 13 | Majaaliwa Abdalla Rashid | 300110904 | 278382 | On Probation | — | — |
| 14 | Makame Nachia Makame | 090075320 | 102807 | On Probation | — | — |
| 15 | Mulhat Abdulwahid Abdulla | 580294457 | — | On Probation | Wizara ya Ujenzi, Mawasiliano na Uchukuzi | — |
| 16 | Muna Mohamed Khamis | 270086212 | 654474 | On Probation | — | — |
| 17 | Shaaban Hassan Haji | 40097912 | 510246 | On Probation | — | — |
| 18 | Wahida Chum Ramadhan | 620289241 | 876710 | On Probation | — | — |
| 19 | Zaid Ramadhan Taufik | 100023307 | 303343 | On Probation | — | — |

### Taasisi ya Utafiti wa Uvuvi (ZAFIRI)
**Vote:** 526 | **TIN:** 140711764 | **Empty Cadre Count:** 12

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abdalla Ali Moh'd | 230156218 | 246954 | Confirmed | Taasisi ya Utafiti wa Kilimo | RASILIMALI WATU UTAWALA NA MIPANGO |
| 2 | Abdalla Bakar Kambi | 310047281 | 833675 | Confirmed | Taasisi ya Utafiti wa Kilimo | RASILIMALI WATU UTAWALA NA MIPANGO |
| 3 | Ame Makame Haji | 270280951 | 255620 | On Probation | — | — |
| 4 | Ezekel Jeremia Mayenze | 280148571 | 146572 | Confirmed | Taasisi ya Utafiti wa Kilimo | RASILIMALI WATU UTAWALA NA MIPANGO |
| 5 | Mrisho Jecha Masiku | 580004184 | 646422 | Confirmed | Taasisi ya Utafiti wa Kilimo | RASILIMALI WATU UTAWALA NA MIPANGO |
| 6 | Nassor Hakim Shaaban | 610265170 | 482458 | On Probation | — | — |
| 7 | Othman Muhina Ramadhan | 610251319 | 882461 | On Probation | — | — |
| 8 | Saleh Said Mubarak | 240148032 | 613536 | Confirmed | Baraza la Wawakilishi | — |
| 9 | Selina Gerphas Bundala | 210125115 | 967850 | Confirmed | Taasisi ya Utafiti wa Kilimo | RASILIMALI WATU UTAWALA NA MIPANGO |
| 10 | Semeni Abass Juma | 270147276 | 646893 | Confirmed | Taasisi ya Utafiti wa Kilimo | RASILIMALI WATU UTAWALA NA MIPANGO |
| 11 | Tatu Haji Jecha | 550005092 | 246427 | Confirmed | Taasisi ya Utafiti wa Kilimo | RASILIMALI WATU UTAWALA NA MIPANGO |
| 12 | Yunus Hafidh Abdalla | 530030935 | 458052 | Confirmed | Taasisi ya Utafiti wa Kilimo | RASILIMALI WATU UTAWALA NA MIPANGO |

### WAKALA WA MAJENGO ZANZIBAR
**Vote:** 522 | **TIN:** 137516160 | **Empty Cadre Count:** 10

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abdalla Ali Mwinyigogo | 020012810 | 209718 | Confirmed | Wakala wa Majengo | IDARA YA UJENZI NA USIMAMIZI WA MAJENGO |
| 2 | Fadhil Juma Makame | 030149450 | 760493 | Confirmed | Wakala wa Majengo | IDARA YA UTAWALA MIPANGO NA RASILIMALI WATU |
| 3 | Fatuma Juma Ally | 653006878 | 380561 | Confirmed | Wakala wa Majengo | IDARA YA UJENZI NA USIMAMIZI WA MAJENGO |
| 4 | Hoshil Harishchandra Labhulal | 010315206 | 766990 | Confirmed | Wakala wa Majengo | IDARA YA UJENZI NA USIMAMIZI WA MAJENGO |
| 5 | Jamal Hamad Khamis | 994240447 | 680564 | Confirmed | Wakala wa Majengo | IDARA YA UJENZI NA USIMAMIZI WA MAJENGO |
| 6 | Khadija Salum Juma | 610105544 | 667597 | Confirmed | Wakala wa Majengo | IDARA YA UTAWALA MIPANGO NA RASILIMALI WATU |
| 7 | Machano Ali Mussa | 590037451 | 916041 | Confirmed | Shirika la Nyumba | — |
| 8 | Makame Juma Khamis | 010262081 | 867606 | Confirmed | Wakala wa Majengo | IDARA YA UTAWALA MIPANGO NA RASILIMALI WATU |
| 9 | Mohamed Khamis Mohamed | 010309980 | 960495 | Confirmed | Wakala wa Majengo | IDARA YA UTAWALA MIPANGO NA RASILIMALI WATU |
| 10 | Nairat Hemed Khalfan | 670058543 | 783351 | Confirmed | Wakala wa Majengo | IDARA YA UJENZI NA USIMAMIZI WA MAJENGO |

### AFISI YA MWANASHERIA MKUU
**Vote:** 028 | **TIN:** 101817016 | **Empty Cadre Count:** 9

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Aziza Ameir Mshenga | 010346345 | 266783 | Confirmed | MFUKO WA HUDUMA ZA AFYA ZANZIBAR | — |
| 2 | Fadhil Khamis Yussuf | 040183462 | 117047 | On Probation | — | — |
| 3 | Hamisa Mmanga Makame | 280134561 | 813562 | Confirmed | Ofisi ya Mwanasheria Mkuu | IDARA YA HUDUMA ZA USHAURI NA USIMAMIZI WA MIKATABA NA UHUSIANO |
| 4 | Mwamvua Adibu Juma | 300092194 | 350615 | Confirmed | Kampuni ya Mwani Zanzibar | — |
| 5 | Omar Salim Ali | 270141319 | 854508 | Confirmed | Chuo cha Utawala wa Umma IPA | — |
| 6 | Safia Moh'd Said | 040163233 | 707405 | Confirmed | Shirika la Bandari | — |
| 7 | Salim Mohammed Abdalla | 210093065 | 558256 | Confirmed | Ofisi ya Mwanasheria Mkuu | IDARA YA UANDISHI WA SHERIA NA SERA ZA KISHERIA |
| 8 | Sarah Abdalla Khatau | 994265577 | 968182 | Confirmed | Ofisi ya Mwanasheria Mkuu | IDARA YA USIMAMIZI WA KESI NA MASHAURI YA MADAI |
| 9 | Uwesu Mohamed Uwesu | 080048525 | 567555 | Confirmed | Shirika la Umeme | — |

### Hospitali ya Mnazi Mmoja
**Vote:** 025 | **TIN:** 124546745 | **Empty Cadre Count:** 9

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Asia Abeid Daftari | 320112669 | 910493 | On Probation | Wizara ya Afya | — |
| 2 | FAT-HIYA IS-HAKA HAJI | 520203095 | 277742 | Confirmed | Hospitali ya Mnazi Mmoja | Idara ya Rasilimali Watu na Utawala |
| 3 | Jemima Celestine Coelho | 010258903 | 450632 | On Probation | — | — |
| 4 | Said Mohammed Mfaume | 030065905 | 412327 | On Probation | — | — |
| 5 | Salma Ali Mzee | 270058147 | 810427 | On Probation | Wizara ya Afya | — |
| 6 | Shaaban Issa Moh'd | 240123507 | 412595 | On Probation | Wizara ya Afya | — |
| 7 | Shufaa Said Ali | 070027392 | 210608 | On Probation | Wizara ya Afya | Idara ya Kinga na Elimu ya Afya |
| 8 | Wanje Haji Gora | 030018767 | 155166 | Confirmed | Mahkama Kuu | IDARA YA UENDESHAJI NA RASILIMALI WATU |
| 9 | Zuhura Suleiman Said | 070035306 | 757456 | On Probation | — | — |

### Mamlaka ya Uwezeshaji Wananchi Kiuchumi (ZEA)
**Vote:** 105 | **TIN:** 176332557 | **Empty Cadre Count:** 9

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Dadi Khamis Shaame | 260110620 | 628157 | Confirmed | Wakala wa Uwezeshaji Wananchi Kiuchumi | Idara ya Rasilimaliwatu |
| 2 | Hairu Ali Mosi | 060244008 | 853860 | On Probation | — | — |
| 3 | Maulid Mwalim Ali | 210191073 | 958187 | Confirmed | Wakala wa Uwezeshaji Wananchi Kiuchumi | Ofisi Kuu Pemba |
| 4 | Mtumwa Machano Khamis | 300152649 | 610344 | Confirmed | Wakala wa Uwezeshaji Wananchi Kiuchumi | Idara ya Rasilimaliwatu |
| 5 | Mustafa Fadhil Omar | 520125287 | 463763 | Confirmed | Wakala wa Usajili wa Biashara na Mali | — |
| 6 | Nassor Khamis Juma | 090154427 | 563756 | On Probation | — | — |
| 7 | Sinthia Mohamed Habib | NULL | 958868 | Confirmed | Wakala wa Uwezeshaji Wananchi Kiuchumi | Idara ya Rasilimaliwatu |
| 8 | Yusfa Hemed Mkumbaru | 610121135 | 274559 | Confirmed | Wakala wa Uwezeshaji Wananchi Kiuchumi | Idara ya Rasilimaliwatu |
| 9 | Zainab Jabir Daud | 090204160 | 965793 | Confirmed | Wakala wa Uwezeshaji Wananchi Kiuchumi | Idara ya Rasilimaliwatu |

### Ofisi ya Mhasibu Mkuu wa Serikali
**Vote:** 022 | **TIN:** 156933775 | **Empty Cadre Count:** 9

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Ahmed Juma Ahmad | 060161525 | 449086 | On Probation | — | — |
| 2 | Fatma Abdalla Hassan | 030069006 | 308836 | On Probation | — | — |
| 3 | Kassim Haji Mrisho | 090082074 | 603549 | Confirmed | Wakala wa Uwezeshaji Wananchi Kiuchumi | Idara ya Rasilimaliwatu |
| 4 | Khamis Abdalla Khamis | 060109716 | 433663 | Confirmed | Wakala wa Uwezeshaji Wananchi Kiuchumi | Idara ya Rasilimaliwatu |
| 5 | Maryam Mohamed Khamis | 060069461 | 997147 | Confirmed | Ofisi ya Mhasibu Mkuu | — |
| 6 | Riziki Faki Hamad | 030121427 | 631972 | Confirmed | Shirika la Umeme | — |
| 7 | Sabah Abdul Salum | 240133720 | 449078 | On Probation | — | — |
| 8 | Shadida Maliki Khatib | 540197176 | 960421 | Confirmed | Taasisi ya Viwango Zanzibar | — |
| 9 | Sudi Salim Said | 100212530 | 948483 | Confirmed | Taasisi ya Viwango Zanzibar | — |

### WIZARA YA ARDHI NA MAENDELEO YA MAKAAZI ZANZIBAR
**Vote:** 014 | **TIN:** 101697509 | **Empty Cadre Count:** 7

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Ibrahim Haji Abeid | 210038460 | 555559 | On Probation | — | — |
| 2 | Juma Mkubwa Abdalla | 090012646 | 214707 | On Probation | — | — |
| 3 | Kimbu Ukuti Ussi | 100092271 | 410901 | On Probation | — | — |
| 4 | Mwanamkuu Ali Makame | 030128592 | 120262 | Confirmed | Mamlaka ya Viwanja vya Ndege | — |
| 5 | Salha Ali Moh'd | 070047275 | 437932 | Confirmed | Shirika la Nyumba | — |
| 6 | Wasila Amour Mwita | 620020512 | 277994 | Confirmed | Shirika la Nyumba | — |
| 7 | Yussuf Ali Khatib | 090131431 | 867599 | On Probation | — | — |

### WIZARA YA BIASHARA NA MAENDELEO YA VIWANDA
**Vote:** 017 | **TIN:** 101789799 | **Empty Cadre Count:** 7

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abass Juma Fakih | 270066559 | 878971 | Confirmed | Shirika la Bandari | — |
| 2 | Abdulrahman Mwinyi Pembe | 090217878 | 958584 | Confirmed | Shirika la Bima | — |
| 3 | Ali Khamis Ali | 590041665 | 958357 | Confirmed | Kampuni ya Mwani Zanzibar | — |
| 4 | Ali Nondo Ame | 270026159 | 152152 | Confirmed | Wakala wa Mkonga wa Mawasiliano | — |
| 5 | Khadija Haroun Bakar | 080009511 | 356772 | Confirmed | Kampuni ya Mwani Zanzibar | — |
| 6 | Mohamed Aboud Abdulrahman | 520194261 | 462653 | On Probation | — | — |
| 7 | Zainab Ali Abdalla | 520119398 | 161687 | Confirmed | Kampuni ya Mwani Zanzibar | — |

### Bodi ya Huduma za Maktaba
**Vote:** 543 | **TIN:** 114542164 | **Empty Cadre Count:** 6

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Ali Moh'd Nassor | 020204729 | 163696 | Confirmed | Shirika la Huduma za Maktaba | Idara ya Huduma za Maktaba |
| 2 | Dhabya Hemed Nassor | 680060431 | 859709 | Confirmed | Shirika la Huduma za Maktaba | Idara ya Huduma za Maktaba |
| 3 | Sada Rashid Massoud | 60299558 | 859700 | Confirmed | Shirika la Huduma za Maktaba | Idara ya Huduma za Maktaba |
| 4 | Saida Salim Moh'd | 260109228 | 345975 | Confirmed | Shirika la Huduma za Maktaba | Idara ya Rasilimali Watu, Utawala na Mipango |
| 5 | Sauda Juma Ali | 70204300 | 963695 | Confirmed | Shirika la Huduma za Maktaba | Idara ya Huduma za Maktaba |
| 6 | Thuwaiba Juma Omar | 670027857 | 988984 | Confirmed | Shirika la Huduma za Maktaba | Idara ya Huduma za Maktaba |

### OFISI YA RAIS - KATIBA SHERIA UTUMISHI NA UTAWALA BORA
**Vote:** 005 | **TIN:** 141811827 | **Empty Cadre Count:** 6

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Ali Muhidini Awesu | 520270488 | 967989 | Confirmed | Chuo cha Utawala wa Umma IPA | — |
| 2 | Fatma Mzee Saadalla | 520030482 | 557681 | On Probation | — | — |
| 3 | Hashim Moh'd Saleh | 020155867 | 858194 | On Probation | — | — |
| 4 | Maryam Rajab Taufik | 030063288 | 308285 | On Probation | — | — |
| 5 | NUSURA KHAMIS ZULI | 10361294 | 997078 | Confirmed | Ofisi ya Rais, Katiba, Sheria, Utumishi na Utawala Bora | — |
| 6 | Time Asaa Khamis | 260140344 | 688049 | Confirmed | MFUKO WA HUDUMA ZA AFYA ZANZIBAR | — |

### TUME YA MAADILI YA VIONGOZI WA UMMA
**Vote:** 113 | **TIN:** 136664387 | **Empty Cadre Count:** 6

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abdallah Mohammed Mbarouk | 280018614 | 720673 | Confirmed | Tume ya Maadili ya Viongozi | IDARA YA MIPANGO, UTAWALA NA RASILIMALI WATU |
| 2 | Asma Hamid Jidawy | 270270660 | 649217 | Confirmed | Tume ya Maadili ya Viongozi | IDARA YA MIPANGO, UTAWALA NA RASILIMALI WATU |
| 3 | Ayoub Ali Yussuf | 670044973 | 260456 | Confirmed | Tume ya Maadili ya Viongozi | IDARA YA MIPANGO, UTAWALA NA RASILIMALI WATU |
| 4 | Haji Salim Khamis | 080006136 | 301212 | Confirmed | Tume ya Maadili ya Viongozi | IDARA YA MIPANGO, UTAWALA NA RASILIMALI WATU |
| 5 | Omar Makungu Omar | 210094053 | 351555 | Confirmed | Tume ya Maadili ya Viongozi | IDARA YA MAADILI YA VIONGOZI |
| 6 | Pili Shaaban Khamis | 230137828 | 557705 | Confirmed | Tume ya Maadili ya Viongozi | IDARA YA MIPANGO, UTAWALA NA RASILIMALI WATU |

### KAMISHENI YA ARDHI ZANZIBAR
**Vote:** 520 | **TIN:** 101816990 | **Empty Cadre Count:** 5

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Ali Rashid Ali | 580073278 | 734508 | Confirmed | Kamisheni ya Ardhi | IDARA YA RASILIMALI WATU NA MIPANGO |
| 2 | Haji Shaame Khamis | 020302892 | 857976 | Confirmed | Kamisheni ya Ardhi | AFISI YA MRAJISI WA ARDHI |
| 3 | Juma Ameir Mgeni | 080041162 | 217997 | Confirmed | Kamisheni ya Ardhi | IDARA YA UPIMAJI NA RAMANI |
| 4 | Khamis Juma Khamis | 250031643 | 951252 | Confirmed | Kamisheni ya Ardhi | — |
| 5 | Mwalimu Mwinyichum Mwalimu | 230046810 | 635325 | On Probation | — | — |

### AFISI YA RAISI KAZI, UCHUMI NA UWEKEZAJI
**Vote:** 006 | **TIN:** 101697533 | **Empty Cadre Count:** 4

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Ayman Abdulla Omar | 680023490 | 877018 | Confirmed | Shirika la Nyumba Zanzibar | — |
| 2 | Azhad Ali Suleiman | 240080589 | 355516 | On Probation | — | — |
| 3 | Ibrahim Salim Rashid | 550072265 | 856711 | Confirmed | Shirika la Biashara la Taifa | — |
| 4 | Salma Khamis Suleiman | 520109586 | 967631 | On Probation | — | — |

### Baraza la Manispaa Mjini Unguja
**Vote:** 202 | **TIN:** 121454009 | **Empty Cadre Count:** 4

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abdallah Amour Ally | 090209149 | 856388 | Confirmed | Baraza la Manispaa Magharibi B | — |
| 2 | Haji Issa Haji | 100000816 | 667994 | On Probation | — | — |
| 3 | Khamis Machano Khamis | 520202094 | 274697 | On Probation | — | — |
| 4 | Salum Haji Abdalla | 080055896 | 356278 | Confirmed | Baraza la Wawakilishi | — |

### WIZARA YA MAJI NISHATI NA MADINI
**Vote:** 015 | **TIN:** 150308305 | **Empty Cadre Count:** 4

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Jamila Khamis Amour | 270291269 | 367837 | Confirmed | Wakala wa Majengo | IDARA YA UTAWALA MIPANGO NA RASILIMALI WATU |
| 2 | Juma Khamis Ame | 240036331 | 347173 | Confirmed | Wizara ya Kilimo, Umwagiliaji Maliasili na Mifugo | Idara ya Umwagiliaji maji |
| 3 | Moh'd Suleiman Moh'd | 230021563 | 116367 | Confirmed | Chuo cha Utawala wa Umma IPA | IDARA YA RASILIMALI WATU MIPANGO NA UTAWALA |
| 4 | Zakia Juma Azzan | 0320039241 | 455639 | On Probation | — | — |

### WIZARA YA UCHUMI WA BULUU NA UVUVI
**Vote:** 013 | **TIN:** 150874084 | **Empty Cadre Count:** 4

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Haji Khatib Haji | 030020115 | 653997 | Confirmed | MFUKO WA HUDUMA ZA AFYA ZANZIBAR | — |
| 2 | Issa Ali Issa | 540042496 | 504706 | On Probation | — | — |
| 3 | Shaaban Hassan Ramadhan | 0290083370 | 847267 | On Probation | — | — |
| 4 | Suleiman Juma Khamis | 310011639 | 252372 | On Probation | — | — |

### AFISI YA MKURUGENZI WA MASHTAKA
**Vote:** 029 | **TIN:** 107779272 | **Empty Cadre Count:** 3

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Asma Juma Khamis | 270050327 | 762972 | Confirmed | Ofisi ya Mkurugenzi wa Mashtaka | IDARA YA MAKOSA YANAYOVUKA MIPAKA NA UHUJUMU WA UCHUMI |
| 2 | Ghania Mohammed Ali | 520148299 | 159735 | Confirmed | Ofisi ya Mkurugenzi wa Mashtaka | IDARA YA MAKOSA DHIDI YA BINADAMU NA USALAMA BARABARANI BARABARANII |
| 3 | Raghida Said Abdalla | 300054550 | 559730 | Confirmed | Ofisi ya Mkurugenzi wa Mashtaka | IDARA YA MAKOSA DHIDI YA BINADAMU NA USALAMA BARABARANI BARABARANII |

### WIZARA YA UTALII NA MAMBO YA KALE
**Vote:** 010 | **TIN:** 104480454 | **Empty Cadre Count:** 3

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abdul-aziz Mtumwa Khatib | 620226936 | 376641 | Confirmed | Kamisheni ya Utalii | — |
| 2 | Hakim Ali Foum | 520283293 | 557162 | Confirmed | Kamisheni ya Utalii | — |
| 3 | Salama Ahmada Hija | 060113098 | 821808 | On Probation | — | — |

### Baraza la Mitihani
**Vote:** 547 | **TIN:** 124650941 | **Empty Cadre Count:** 2

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Mwinyi Moh'd Issa | 060112110 | 157629 | On Probation | — | — |
| 2 | Sahal Abdulwahab Alawi | 520027619 | 717514 | Confirmed | Kampuni ya Mwani Zanzibar | Idara ya Rasilimaliwatu |

### MAMLAKA YA KUZUIA RUSHWA NA UHUJUMU WA UCHUMI ZANZIBAR
**Vote:** 035 | **TIN:** 122439755 | **Empty Cadre Count:** 2

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Khadija Salmin Amour | 100006692 | 157831 | On Probation | — | — |
| 2 | Mohammed Omar Mohammed | 270052060 | 283485 | Confirmed | Mamlaka ya Kuzuia Rushwa na Uhujumu wa Uchumi | IDARA YA KINGA DHIDI YA RUSHWA |

### Mamlaka ya Serikali Mtandao (eGAZ)
**Vote:** 038 | **TIN:** 154803912 | **Empty Cadre Count:** 2

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Fatma Masrur Saad | 520045370 | 308658 | Confirmed | Mamlaka ya Serikali Mtandao | IDARA YA USIMAMIZI WA HUDUMA ZA TEHAMA |
| 2 | Mussa Ramadhan Mwadin | 090206612 | 262821 | Confirmed | Mamlaka ya Serikali Mtandao | IDARA YA USIMAMIZI WA MIUNDOMBINU NA MIFUMO |

### OFISI YA MAKAMO WA KWANZA WA RAISI
**Vote:** 002 | **TIN:** 115615637 | **Empty Cadre Count:** 2

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Foum Shaaban Foum | 550092795 | 765759 | On Probation | — | — |
| 2 | Ibrahim Khamis Mwinyi | 070201349 | 662200 | Confirmed | MFUKO WA HUDUMA ZA AFYA ZANZIBAR | — |

### OFISI YA RAIS, FEDHA NA MIPANGO
**Vote:** 567 | **TIN:** — | **Empty Cadre Count:** 2

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | HIDAYA YUSSUF SALIM | 260243386 | 570812 | Confirmed | Wilaya ya Chakechake | — |
| 2 | KHAMIS MOHAMMED  KHAMIS | 530087021 | 719000 | Confirmed | Wilaya ya Chakechake | — |

### Ofisi ya Mkuu wa Mkoa wa Kusini Unguja
**Vote:** 049 | **TIN:** 107779477 | **Empty Cadre Count:** 2

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Mabula Machalila Nalimi | 300114144 | 957969 | Confirmed | Mkoa wa Kusini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |
| 2 | Mwamshindo Njaa Mzee | 270073588 | 613285 | Confirmed | Mkoa wa Kusini Unguja | IDARA YA UTAWALA RASILIMALI WATU NA MIPANGO |

### Ofisi ya Mkuu wa Mkoa wa Mjini Magharibi Unguja
**Vote:** 047 | **TIN:** 107779396 | **Empty Cadre Count:** 2

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Amrani Kombo Yussuf | 010324910 | 267999 | On Probation | — | — |
| 2 | Hamid Seif Said | 633049404 | 578400 | On Probation | — | — |

### Tume ya Mipango
**Vote:** 024 | **TIN:** 121462354 | **Empty Cadre Count:** 2

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Duchi Ame Silima | 100118814 | 930240 | On Probation | — | — |
| 2 | Issa Mohammed Kassim | 670088173 | 260334 | On Probation | — | — |

### Tume ya Ushindani Halali wa Biashara
**Vote:** 518 | **TIN:** 148444331 | **Empty Cadre Count:** 2

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Latifa Khamis Mzee | 310086981 | 503961 | On Probation | — | — |
| 2 | Saleh Rashid Salum | 230055773 | 656134 | Confirmed | Kamisheni ya Utalii | — |

### Wakala wa Barabara
**Vote:** 559 | **TIN:** 151578152 | **Empty Cadre Count:** 2

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abdul-aziz Salum Ali | 270091906 | 207717 | Confirmed | Wakala wa Barabara | Zana na Mitambo |
| 2 | Sheha Kondo Mwadini | 030156243 | 906135 | Confirmed | Mamlaka ya Usafiri Barabarani | — |

### Baraza la Jiji
**Vote:** 201 | **TIN:** 141760874 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Amina Issa Salum | 240060541 | 128200 | On Probation | — | — |

### Baraza la Manispaa Magharibi A
**Vote:** 203 | **TIN:** 137175088 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Haji Vuai Ali | 040186818 | 907723 | Confirmed | Ofisi ya Mtakwimu Mkuu wa Serikali | Utawala na Mipango |

### Baraza la Mji Kaskazini B Unguja
**Vote:** 208 | **TIN:** 106226431 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Abrahman Ali Mukhtar | 060094067 | 355095 | Confirmed | Kamisheni ya Wakfu na Mali ya Amana | IDARA YA UTAWALA,RASILIMALI WATU NA MIPANGO |

### Halmashauri ya Wilaya ya Kusini Unguja
**Vote:** 206 | **TIN:** 137926121 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Wahida Moh'd Omar | 220062987 | 649282 | Confirmed | Kampuni ya Mwani Zanzibar | — |

### KAMISHENI YA KUKABILIANA NA MAAFA ZANZIBAR
**Vote:** 510 | **TIN:** 119752302 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Makame Ame Simai | 200032908 | 357817 | On Probation | — | — |

### OFISI YA MKAGUZI MKUU WA NDANI WA SERIKALI
**Vote:** 052 | **TIN:** 156958174 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Halima Hussein Khamis | 080047223 | 846976 | On Probation | — | — |

### OFISI YA MUFTI MKUU WA ZANZIBAR
**Vote:** 053 | **TIN:** — | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Yahya Rajab Bakari | 220054669 | 810232 | On Probation | — | — |

### OFISI YA RAIS, TAWALA ZA MIKOA, SERIKALI ZA MITAA NA IDARA MAALUMU ZA SMZ
**Vote:** 004 | **TIN:** 101732835 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Thabit Othman Abdalla | 270213733 | 148354 | Confirmed | Ofisi ya Rais, Tawala za Mikoa, Serikali za Mitaa na Idara Maalum za SMZ | Ofisi Kuu Pemba |

### Ofisi ya Hatimiliki (COSOZA)
**Vote:** 558 | **TIN:** 132175306 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Haji Sungura Makame | 520152746 | 262740 | Confirmed | Ofisi ya Msajili wa Haki Milliki | Rasilimali watu, mipango na Utawala |

### Ofisi ya Mkuu wa Mkoa wa Kusini Pemba
**Vote:** 050 | **TIN:** 119062888 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Mussa Alawi Moh'd | 010074354 | 257654 | Confirmed | Ofisi ya Mtakwimu Mkuu wa Serikali | — |

### Ofisi ya Msajili wa Hazina
**Vote:** 106 | **TIN:** 176281286 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Mtumwa Ali Khamis | 540003372 | 348989 | Confirmed | Ofisi ya Msajili wa Hazina | OFISI YA MSAJILI WA HAZINA - PEMBA |

### Skuli ya Sheria Zanzibar
**Vote:** 570 | **TIN:** 154057374 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Yussuf Omar Mohammed | 300092563 | 110129 | Confirmed | Skuli ya Sheria | Utawala |

### TUME YA UTUMISHI SERIKALINI
**Vote:** 037 | **TIN:** 101817199 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Aisha Abrahman Suleiman | 010295795 | 974370 | On Probation | — | — |

### WIZARA YA HABARI, VIJANA, UTAMADUNI NA MICHEZO
**Vote:** 018 | **TIN:** 137692902 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Salum Ubwa Nassor | 090035522 | 678191 | On Probation | — | — |

### Wakala wa Matrekta
**Vote:** 527 | **TIN:** 136148710 | **Empty Cadre Count:** 1

| # | Name | ZAN ID | Payroll | Status | Workplace | Department |
|---|------|--------|---------|--------|-----------|------------|
| 1 | Hassan Silima Ali | 260006118 | 158066 | On Probation | — | — |
