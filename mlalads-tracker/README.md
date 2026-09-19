# Ludhiana MLALADS Tracker • MLAs, Contractors & Public Projects

A recreation and adaptation of the [EmpoweredIndian Track Area](https://empoweredindian.in/mplads/track-area) platform, specifically populated with **real scraped live public works data from Ludhiana, Punjab**.

This web application maintains an active database of **MLAs (Members of Legislative Assembly)** and **Contractors/Vendors**, tracking:
- How many projects each MLA and Contractor has done (completed vs in-progress).
- Exact dates projects were given/awarded and dates completed.
- Full voucher payment installments, disbursement dates, and executing agencies.
- Search and filtering across all **14 Assembly Constituencies of Ludhiana**.

---

## Live Scraped Dataset Highlights (Ludhiana)

- **Total Projects**: 246 actual public infrastructure projects across Ludhiana's urban wards and rural blocks.
  - **Completed Works**: 59 projects with verified payment vouchers and contractor disbursements.
  - **In Progress / Recommended**: 187 projects with estimated costs and sanction dates.
- **Total Sanctioned Budget**: ₹9,54,09,163 (~₹9.54 Crores).
- **Total Disbursed Payments**: ₹2,82,97,412 (~₹2.83 Crores).
- **Contractors & Vendors Documented**: 65 active executing firms (e.g., *Mittal Pavers*, *Dashmesh Tiles*, *JBBL Solar*, *Shri Balaji Cement Store*, *Garden Gym*, *Rana Electrical Works*, *Ubhi Steel Work*, *Sharika Enterprises*, etc.).
- **Assembly Constituencies & MLAs Mapped**:
  1. **Ludhiana East** - MLA Daljit Singh Grewal (AAP)
  2. **Ludhiana South** - MLA Rajinder Pal Kaur Chhina (AAP)
  3. **Ludhiana Central** - MLA Ashok Prashar Pappi (AAP)
  4. **Ludhiana West** - MLA Gurpreet Bassi Gogi (AAP)
  5. **Ludhiana North** - MLA Madan Lal Bagga (AAP)
  6. **Atam Nagar** - MLA Kulwant Singh Sidhu (AAP)
  7. **Gill** - MLA Jiwan Singh Sangowal (AAP)
  8. **Payal** - MLA Manwinder Singh Giaspura (AAP)
  9. **Dakha** - MLA Manpreet Singh Ayali (SAD)
  10. **Raikot** - MLA Hakam Singh Thekedar (AAP)
  11. **Jagraon** - MLA Sarvjit Kaur Manuke (AAP)
  12. **Samrala** - MLA Jagtar Singh Diyalpura (AAP)
  13. **Khanna** - MLA Tarunpreet Singh Sond (AAP)
  14. **Sahnewal** - MLA Hardeep Singh Mundian (AAP)
  - Parliamentary MP: Amrinder Singh Raja Warring (INC)

---

## Core Features

1. **Track Area (`/`)**:
   - Recreates the EmpoweredIndian `/mplads/track-area` workflow.
   - Constituency dropdown with real project counts for each of Ludhiana's 14 assembly segments.
   - Status Tabs: Completed Works, In Progress / Recommended, All Works.
   - Filters: Search keyword, Category, Awarded Year, Contractor, Cost Slider (up to ₹5 Cr).
   - Project Card with category tag, INR formatted cost, awarded/completion dates, and MLA/Contractor tags.
   - **Payment Installment Modal**: EmpoweredIndian-style timeline modal showing voucher dates, installment amounts, vendor names, and release statuses.

2. **MLAs Database (`/mlas`)**:
   - Directory of all 14 MLAs representing Ludhiana.
   - Tracks project count, completed vs ongoing, total budget allocated, expenditure, and utilization %.
   - Lists primary contractors engaged by each MLA.
   - Clickable MLA profile modal with complete project history.

3. **Contractors Database (`/contractors`)**:
   - Directory of all 65 contractors and vendors active in Ludhiana.
   - Tracks how many projects each contractor has done, total revenue received, and average contract size.
   - Shows which MLAs and constituencies they execute works for.
   - Clickable Contractor profile modal with portfolio of projects.

4. **Interactive Data Management**:
   - "Add Record" modal to log new projects, contractors, or MLAs.
   - Edits are automatically saved to browser storage.
   - "Export" button to download filtered projects as CSV.

5. **REST API Routes**:
   - `GET /api/projects`: Filtered, searched, and paginated projects.
   - `GET /api/mlas`: All 14 MLAs with aggregated statistics.
   - `GET /api/contractors`: All 65 contractors with project counts.
   - `GET /api/stats`: Metadata and summary metrics.

---

## Deploying to Vercel

This project is built with **Next.js 14 (App Router)** and is 100% ready for Vercel deployment:

### Option 1: Deploy from GitHub
1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. In the configuration screen:
   - **Root Directory**: Click "Edit" and select `mlalads-tracker`.
   - **Framework Preset**: Next.js (detected automatically).
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `.next` (default).
5. Click **"Deploy"**.

### Option 2: Deploy using Vercel CLI
```bash
cd mlalads-tracker
npx vercel
```

---

## Local Development

```bash
# Navigate to project directory
cd mlalads-tracker

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

---

## Re-scraping / Updating Data
To re-run the scraper or pull updated records:
```bash
python3 scripts/scrape_ludhiana_data.py
```
