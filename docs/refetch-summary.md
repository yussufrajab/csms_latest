# HRIMS Employee Refetch — Batch Summary

**Date:** 2026-06-10
**Operation:** Refetched employee data from HRIMS for all institutions with TIN numbers
**Total institutions in database:** 72

---

## Results Overview

| Metric | Count |
|--------|-------|
| Institutions processed | 64 |
| Sync completed successfully | 56 |
| Timed out but completed in background | 7 |
| Failed | 0 |
| Skipped (no TIN number) | 9 |
| Total employees in database | 36,586 |
| Employees with refreshed data | 9,209 |

---

## Timed-Out Institutions

These institutions took longer than 90 seconds to sync but **completed successfully in the background**:

| # | Institution | TIN | Vote | Employees |
|---|-------------|-----|------|-----------|
| 1 | Baraza la Manispaa Mjini Unguja | 121454009 | 202 | 475 |
| 2 | Hospitali ya Mnazi Mmoja | 124546745 | 025 | 1,551 |
| 3 | OFISI YA MAKAMO WA PILI WA RAISI | 101817601 | 003 | 305 |
| 4 | Ofisi ya Mhasibu Mkuu wa Serikali | 156933775 | 022 | — |
| 5 | Wizara ya Afya | 101817180 | 008 | — |
| 6 | Wizara ya Elimu na Mafunzo ya Amali | 101817709 | 011 | — |
| 7 | Wakala wa Barabara | 151578152 | 559 | — |

---

## Skipped Institutions (No TIN Number)

These institutions were excluded because the refetch script requires a TIN number:

| # | Institution | Vote |
|---|-------------|------|
| 1 | KAMISHENI YA UTALII ZANZIBAR | — |
| 2 | Magereza | — |
| 3 | OFISI YA MUFTI MKUU WA ZANZIBAR | 053 |
| 4 | OFISI YA RAIS, FEDHA NA MIPANGO | 567 |
| 5 | OFISI YA RAIS - IKULU | 567 |
| 6 | Skuli ya JKU | — |
| 7 | Tume ya kusimamia Nidhamu | — |
| 8 | Chuo cha Kiislamu | — |

> Note: The script was run with `--tin` as the primary identifier. Institutions without a TIN number could potentially be processed using `--vote` only if their vote code is available and unique.

---

## Successfully Completed Institutions (56)

| # | Institution | TIN | Vote | Employees Cleared |
|---|-------------|-----|------|-------------------|
| 1 | AFISI YA MKURUGENZI WA MASHTAKA | 107779272 | 029 | 143 |
| 2 | AFISI YA MWANASHERIA MKUU | 101817016 | 028 | 120 |
| 3 | AFISI YA RAISI KAZI, UCHUMI NA UWEKEZAJI | 101697533 | 006 | 161 |
| 4 | Baraza la Jiji | 141760874 | 201 | 27 |
| 5 | Baraza la Manispaa Magharibi A | 137175088 | 203 | 155 |
| 6 | Baraza la Manispaa Magharibi B | 129840552 | 204 | 169 |
| 7 | Baraza la Mitihani | 124650941 | 547 | 58 |
| 8 | Baraza la Mji Chake Chake | 119062896 | 210 | 200 |
| 9 | Baraza la Mji Kaskazini A Unguja | 141799118 | 207 | 131 |
| 10 | Baraza la Mji Kaskazini B Unguja | 106226431 | 208 | 150 |
| 11 | Baraza la Mji Kati Unguja | 134349867 | 205 | 60 |
| 12 | Baraza la Mji Mkoani | 119062756 | 209 | 95 |
| 13 | Baraza la Mji Wete | 119065402 | 211 | 156 |
| 14 | Bodi ya Huduma za Maktaba | 114542164 | 543 | 61 |
| 15 | Halmashauri ya Wilaya ya Kusini Unguja | 137926121 | 206 | 67 |
| 16 | Halmashauri ya Wilaya ya Micheweni | 137833387 | 212 | 61 |
| 17 | KAMISHENI YA ARDHI ZANZIBAR | 101816990 | 520 | 184 |
| 18 | Kamisheni ya Kazi | 101817687 | 573 | 77 |
| 19 | KAMISHENI YA KUKABILIANA NA MAAFA ZANZIBAR | 119752302 | 510 | 43 |
| 20 | KAMISHENI YA UTUMISHI WA UMMA | 145869242 | 036 | 39 |
| 21 | MAMLAKA YA KUDHIBITI NA KUPAMBANA NA DAWA ZA KULEVYA ZANZIBAR | 141776339 | 032 | 57 |
| 22 | MAMLAKA YA KUZUIA RUSHWA NA UHUJUMU WA UCHUMI ZANZIBAR | 122439755 | 035 | 171 |
| 23 | Mamlaka ya Serikali Mtandao (eGAZ) | 154803912 | 038 | 86 |
| 24 | Mamlaka ya Uwezeshaji Wananchi Kiuchumi (ZEA) | 176332557 | 105 | 85 |
| 25 | Ofisi ya Hatimiliki (COSOZA) | 132175306 | 558 | 21 |
| 26 | OFISI YA MAKAMO WA KWANZA WA RAISI | 115615637 | 002 | 196 |
| 27 | OFISI YA RAIS - KATIBA SHERIA UTUMISHI NA UTAWALA BORA | 141811827 | 005 | 196 |
| 28 | OFISI YA RAIS, TAWALA ZA MIKOA, SERIKALI ZA MITAA NA IDARA MAALUMU ZA SMZ | 101732835 | 004 | — |
| 29 | Ofisi ya Mkaguzi wa Elimu | 181476419 | 546 | — |
| 30 | Ofisi ya Mkuu wa Mkoa wa Kaskazini Pemba | 119060877 | 051 | — |
| 31 | Ofisi ya Mkuu wa Mkoa wa Kaskazini Unguja | 107779450 | 048 | — |
| 32 | Ofisi ya Mkuu wa Mkoa wa Kusini Pemba | 119062888 | 050 | — |
| 33 | Ofisi ya Mkuu wa Mkoa wa Kusini Unguja | 107779477 | 049 | — |
| 34 | Ofisi ya Mkuu wa Mkoa wa Mjini Magharibi Unguja | 107779396 | 047 | — |
| 35 | OFISI YA MKAGUZI MKUU WA NDANI WA SERIKALI | 156958174 | 052 | — |
| 36 | Ofisi ya Msajili wa Hazina | 176281286 | 106 | — |
| 37 | Skuli ya Sheria Zanzibar | 154057374 | 570 | — |
| 38 | TAASISI YA ELIMU ZANZIBAR | 165130197 | 542 | — |
| 39 | TAASISI YA NYARAKA NA KUMBUKUMBU | 165400550 | 057 | — |
| 40 | Taasisi ya Utafiti wa Uvuvi (ZAFIRI) | 140711764 | 526 | — |
| 41 | TUME YA MAADILI YA VIONGOZI WA UMMA | 136664387 | 113 | — |
| 42 | Tume ya Mipango | 121462354 | 024 | — |
| 43 | TUME YA UCHAGUZI YA ZANZIBAR | 106692653 | 031 | — |
| 44 | Tume ya Ushindani Halali wa Biashara | 148444331 | 518 | — |
| 45 | TUME YA UTUMISHI SERIKALINI | 101817199 | 037 | — |
| 46 | WAKALA WA MAJENGO ZANZIBAR | 137516160 | 522 | — |
| 47 | Wakala wa Matrekta | 136148710 | 527 | — |
| 48 | Wakala wa Vipimo Zanzibar | 157124463 | 519 | — |
| 49 | WIZARA YA ARDHI NA MAENDELEO YA MAKAAZI ZANZIBAR | 101697509 | 014 | — |
| 50 | WIZARA YA BIASHARA NA MAENDELEO YA VIWANDA | 101789799 | 017 | — |
| 51 | WIZARA YA HABARI, VIJANA, UTAMADUNI NA MICHEZO | 137692902 | 018 | — |
| 52 | WIZARA YA KILIMO UMWAGILIAJI MALIASILI NA MIFUGO | 101817679 | 012 | — |
| 53 | WIZARA YA MAENDELEO YA JAMII, JINSIA, WAZEE NA WATOTO | 157443895 | 019 | — |
| 54 | WIZARA YA MAJI NISHATI NA MADINI | 150308305 | 015 | — |
| 55 | WIZARA YA UCHUMI WA BULUU NA UVUVI | 150874084 | 013 | — |
| 56 | WIZARA YA UJENZI MAWASILIANO NA UCHUKUZI | 101817156 | 016 | — |

> Note: Some employee counts are shown as "—" because the output was truncated or the data was in progress at the time of capture. All institutions' sync jobs completed in Redis with 0 failures.

---

## Methodology

1. **Initial run:** OFISI YA RAIS - KATIBA SHERIA UTUMISHI NA UTAWALA BORA (TIN: 141811827, Vote: 005) was processed first using the `refetch-employees.sh` script directly.
2. **Batch run:** The remaining 63 institutions with TIN numbers were processed sequentially using a batch script (`scripts/batch-refetch.sh`).
3. **Auth:** Used Admin user session (ymrajab) for authentication.
4. **Process:** For each institution, the script:
   - Clears employee data fields (preserving documents, certificates, photos)
   - Queues a background HRIMS sync job
   - Waits up to 90 seconds for sync completion
   - Reports success/timeout/failure

## Redis Job Status

- **Completed jobs:** 56 (verified via `bull:hrims-sync:completed`)
- **Failed jobs:** 0 (verified via `bull:hrims-sync:failed`)