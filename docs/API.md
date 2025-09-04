# API Reference Guide

## Authentication

All API requests require authentication using Bearer tokens:

```http
Authorization: Bearer your_api_key_here
```

## Base URL

- **Development**: `http://localhost:4000/api`
- **Production**: `https://api.drug-info-platform.com/api`

## Response Format

All endpoints return JSON in this format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Responses

```json
{
  "success": false,
  "error": "Resource not found",
  "statusCode": 404,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Endpoints

### Drug Management

#### Search Drugs
```http
GET /api/drugs/search
```

**Query Parameters:**
- `q` (string): Search query
- `limit` (number): Results per page (default: 20, max: 100)
- `manufacturer` (string): Filter by manufacturer
- `route` (string): Filter by administration route

**Response:**
```json
{
  "success": true,
  "data": {
    "drugs": [
      {
        "id": "uuid",
        "name": "Lisinopril",
        "slug": "lisinopril",
        "genericName": "lisinopril",
        "manufacturer": "Pfizer",
        "aiEnhancedTitle": "Lisinopril - ACE Inhibitor",
        "aiEnhancedDescription": "Used for blood pressure..."
      }
    ],
    "total": 150,
    "query": "lisinopril",
    "limit": 20
  }
}
```

#### Get Drug Details
```http
GET /api/drugs/:slug
```

**Response:**
```json
{
  "success": true,
  "data": {
    "drug": {
      "id": "uuid",
      "name": "Lisinopril",
      "slug": "lisinopril",
      "genericName": "lisinopril",
      "brandNames": ["Prinivil", "Zestril"],
      "manufacturer": "Pfizer",
      "indications": "Treatment of hypertension...",
      "contraindications": "Hypersensitivity to ACE inhibitors...",
      "warnings": "May cause dizziness...",
      "dosageInfo": "Initial: 10mg once daily...",
      "adverseReactions": "Common: dry cough, dizziness...",
      "aiEnhancedTitle": "Lisinopril - ACE Inhibitor",
      "aiEnhancedDescription": "Detailed description...",
      "seoMetaTitle": "Lisinopril Uses, Dosage & Side Effects",
      "seoMetaDescription": "Learn about Lisinopril...",
      "published": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "faqs": []
    }
  }
}
```

### AI Content Generation

#### Enhance Drug Content
```http
POST /api/ai/enhance-drug
```

**Request Body:**
```json
{
  "drugName": "Lisinopril",
  "genericName": "lisinopril",
  "fdaData": {
    "indications": "Hypertension treatment",
    "dosage": "5-40mg daily"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "aiEnhancedTitle": "Lisinopril - ACE Inhibitor for Blood Pressure",
    "aiEnhancedDescription": "Comprehensive description...",
    "seoMetaTitle": "Lisinopril: Uses, Dosage & Side Effects Guide",
    "seoMetaDescription": "Learn about Lisinopril, an ACE inhibitor..."
  }
}
```

## Rate Limits

| Endpoint Category | Rate Limit |
|------------------|------------|
| Drug Search | 500 requests/hour |
| Drug Details | 1000 requests/hour |
| AI Generation | 100 requests/hour |
| General API | 2000 requests/hour |

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server issue |
| 503 | Service Unavailable - AI provider down |