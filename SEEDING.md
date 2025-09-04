# Database Seeding Guide

This guide explains how to seed the Drug Information Platform database with sample FDA drug data and AI-enhanced content.

## Overview

The seeding process:
1. Loads FDA label JSON files from `/data/fda-labels/`
2. Processes each drug through the AI enhancement pipeline
3. Stores the enhanced data in PostgreSQL
4. Generates 6+ demo drug pages ready for viewing

## Sample Drugs Included

The platform includes these sample drugs with full FDA label data:

1. **Lisinopril** (ACE Inhibitor) - Hypertension & Heart Failure
2. **Metformin** (Antidiabetic) - Type 2 Diabetes  
3. **Atorvastatin (Lipitor)** (Statin) - Cholesterol Management
4. **Omeprazole (Prilosec)** (PPI) - GERD & Ulcers
5. **Sertraline (Zoloft)** (SSRI) - Depression & Anxiety
6. **Amlodipine (Norvasc)** (Calcium Channel Blocker) - Hypertension

Each drug includes:
- Complete FDA label information
- AI-enhanced patient-friendly descriptions
- SEO-optimized titles and meta descriptions
- Auto-generated FAQs (5 per drug)
- Structured data for search engines

## Prerequisites

Before seeding, ensure:

1. **Services are running:**
   ```bash
   docker-compose up -d postgres redis backend
   ```

2. **Database is migrated:**
   ```bash
   cd backend
   npm run prisma:migrate
   ```

3. **Environment variables are set:**
   - `HUGGINGFACE_API_KEY` (required for AI enhancement)
   - `DATABASE_URL` (should point to your PostgreSQL instance)
   - `REDIS_URL` (for caching AI responses)

## Seeding Methods

### Method 1: Docker Compose (Recommended)

```bash
# From project root
docker-compose exec backend npm run seed
```

### Method 2: Local Development

```bash
# From backend directory
cd backend
npm install
npm run seed
```

### Method 3: Direct TypeScript Execution

```bash
# From backend directory
npm run seed:dev
```

## Seeding Process

The seeding script performs these steps:

1. **Initialization**: Connects to database and AI services
2. **Data Clearing**: Removes existing drug data (development only)
3. **FDA Label Processing**: Parses JSON files from `/data/fda-labels/`
4. **AI Enhancement**: Generates patient-friendly content for each drug
5. **Database Storage**: Creates drug records with enhanced content
6. **FAQ Generation**: Creates 5 FAQs per drug using AI
7. **Summary Generation**: Reports success statistics

## Expected Output

```
🌱 Starting database seeding...
Clearing existing drug data...
Found 6 FDA label files
Processing drug 1/6: lisinopril.json
  Processing: Lisinopril
  Creating drug record...
  Enhancing with AI...
  Creating 5 FAQs...
  ✓ Completed: Lisinopril
Processing drug 2/6: metformin.json
  Processing: Metformin Hydrochloride
  Creating drug record...
  Enhancing with AI...
  Creating 5 FAQs...
  ✓ Completed: Metformin Hydrochloride
...

📊 Seeding Summary:
   Total drugs: 6
   Published drugs: 6
   Total FAQs: 30
   Average FAQs per drug: 5.0

🏥 Created Drug Pages:
   1. Lisinopril - ACE Inhibitor for Blood Pressure (/lisinopril) - 5 FAQs
   2. Metformin - Diabetes Medication for Blood Sugar (/metformin-hydrochloride) - 5 FAQs
   3. Lipitor - Cholesterol-Lowering Statin Medication (/lipitor) - 5 FAQs
   4. Prilosec - Proton Pump Inhibitor for Heartburn (/prilosec) - 5 FAQs
   5. Zoloft - SSRI Antidepressant Medication (/zoloft) - 5 FAQs
   6. Norvasc - Blood Pressure Medication (/norvasc) - 5 FAQs

🌐 Demo URLs:
   Frontend: http://localhost:3000
   Search: http://localhost:3000/search
   Drug: http://localhost:3000/drugs/lisinopril
   Drug: http://localhost:3000/drugs/metformin-hydrochloride
   Drug: http://localhost:3000/drugs/lipitor

✅ Database seeding completed successfully!
```

## AI Enhancement Features

Each drug is enhanced with:

### SEO-Optimized Titles
- Character limit: 60 characters maximum  
- Format: "Drug Name - Purpose/Condition"
- Example: "Lisinopril - ACE Inhibitor for Blood Pressure"

### Meta Descriptions  
- Character limit: 155 characters maximum
- Patient-focused language
- Includes key benefits and conditions treated

### Patient-Friendly Descriptions
- Simplified medical language
- Focus on what patients need to know
- Explain mechanism of action in plain English
- Mention common uses and benefits

### Auto-Generated FAQs
Five questions per drug covering:
1. What is this medication used for?
2. How does this medication work?
3. What are common side effects?
4. Who should not take this medication?
5. How should this medication be taken?

## Verification

After seeding, verify success:

### 1. Check Database
```bash
# View drug count
docker-compose exec backend npx prisma studio
```

### 2. Test API Endpoints
```bash
# List all drugs
curl http://localhost:4000/drugs

# Get specific drug
curl http://localhost:4000/drugs/slug/lisinopril
```

### 3. View Frontend Pages
- Homepage: http://localhost:3000
- Search: http://localhost:3000/search  
- Drug pages: http://localhost:3000/drugs/[slug]

## Troubleshooting

### Common Issues

#### 1. AI API Key Not Set
```
Error: HuggingFace API key not found
```
**Solution:** Set `HUGGINGFACE_API_KEY` in `.env`

#### 2. Database Connection Failed
```
Error: Can't connect to database
```
**Solution:** Ensure PostgreSQL is running: `docker-compose up -d postgres`

#### 3. Redis Connection Failed
```
Warning: Redis connection failed, using memory cache
```
**Solution:** Ensure Redis is running: `docker-compose up -d redis`

#### 4. FDA Label Files Not Found
```
Error: FDA labels directory not found
```
**Solution:** Ensure `/data/fda-labels/` directory exists with JSON files

#### 5. TypeScript Errors
```
Error: Cannot find module
```
**Solution:** Install dependencies: `npm install`

### Reset and Re-seed

```bash
# Clear database and re-seed
cd backend
npm run prisma:migrate:reset
npm run seed
```

### Partial Seeding

To add individual drugs, place FDA label JSON files in `/data/fda-labels/` and re-run:
```bash
npm run seed
```

The script will process any new files not already in the database.

## Adding Custom Drugs

### 1. Create FDA Label JSON

Create a new JSON file in `/data/fda-labels/your-drug.json`:

```json
{
  "meta": { "last_updated": "2024-01-15" },
  "results": [{
    "brand_name": ["Your Drug Brand"],
    "generic_name": ["your-generic-name"],
    "manufacturer_name": ["Your Manufacturer"],
    "indications_and_usage": ["Your drug is indicated for..."],
    "dosage_and_administration": ["The recommended dose is..."],
    "contraindications": ["This drug should not be used by..."],
    "warnings": ["Important warnings..."],
    "adverse_reactions": ["Common side effects include..."]
  }]
}
```

### 2. Run Seeding

```bash
npm run seed
```

The script will automatically detect and process the new drug.

## Performance Notes

- **Seeding time**: ~2-3 minutes for 6 drugs
- **AI processing**: ~15-30 seconds per drug  
- **Database operations**: ~1-2 seconds per drug
- **Total API calls**: ~10 per drug (title, description, 5 FAQs)

## Production Considerations

For production deployments:

1. **API Rate Limits**: The script respects HuggingFace rate limits
2. **Error Recovery**: Failed drugs are skipped, successful ones continue
3. **Caching**: AI responses are cached in Redis to avoid re-processing
4. **Batch Processing**: Consider processing drugs in smaller batches
5. **Monitoring**: Check logs for any failed enhancements

## Next Steps

After successful seeding:

1. **Test drug pages** in browser
2. **Verify SEO metadata** in page source
3. **Check search functionality**
4. **Review AI-generated content** for accuracy
5. **Set up monitoring** for production deployment

The seeded data provides a complete demonstration of the platform's capabilities with real pharmaceutical data and AI-enhanced user experiences.