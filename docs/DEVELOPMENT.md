# Development Guide

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git
- VS Code (recommended) with extensions:
  - TypeScript
  - Prettier
  - ESLint
  - Prisma

### Initial Setup

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd drug-info-platform

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies  
cd ../frontend && npm install

# Return to root
cd ..
```

2. **Environment configuration**
```bash
cp .env.example .env
# Edit .env with your values
```

3. **Start development environment**
```bash
# Start supporting services (DB, Redis)
docker-compose up -d postgres redis

# Start backend in development mode
cd backend && npm run start:dev

# Start frontend in development mode (new terminal)
cd frontend && npm run dev
```

## Development Workflow

### Code Organization

```
drug-info-platform/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── drugs/          # Drug management module
│   │   ├── ai-service/     # AI content generation
│   │   ├── mcp/            # Model Context Protocol
│   │   ├── health/         # Health checks
│   │   └── common/         # Shared utilities
│   ├── prisma/             # Database schema & migrations
│   └── test/               # E2E tests
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities & API clients
│   │   └── types/        # TypeScript interfaces
│   └── e2e/              # Playwright tests
└── docs/                 # Documentation
```

### Development Commands

#### Backend Development
```bash
cd backend

# Development server with hot reload
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # Integration tests

# Database commands
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run migrations
npm run prisma:studio     # Database GUI
npm run seed             # Seed development data

# Code quality
npm run lint             # ESLint
npm run format           # Prettier
```

#### Frontend Development
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build
npm run start

# Run tests
npm run test             # Unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run e2e             # End-to-end tests

# Code quality
npm run lint
npm run type-check
```

## Architecture Patterns

### Backend (NestJS)

#### Module Structure
```typescript
// drugs/drugs.module.ts
@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [DrugsController],
  providers: [DrugsService],
  exports: [DrugsService],
})
export class DrugsModule {}
```

#### Service Pattern
```typescript
// drugs/drugs.service.ts
@Injectable()
export class DrugsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async findBySlug(slug: string): Promise<Drug | null> {
    const cached = await this.cacheService.get(`drug:${slug}`);
    if (cached) return cached;

    const drug = await this.prisma.drug.findUnique({
      where: { slug },
      include: { faqs: true },
    });

    if (drug) {
      await this.cacheService.set(`drug:${slug}`, drug, 3600);
    }

    return drug;
  }
}
```

#### API Response Pattern
```typescript
// common/dto/api-response.dto.ts
export class ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;

  constructor(data?: T, message?: string) {
    this.success = !!data;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }
}
```

### Frontend (Next.js)

#### Page Structure (App Router)
```typescript
// app/drugs/[slug]/page.tsx
interface PageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | undefined };
}

export default async function DrugPage({ params }: PageProps) {
  const drug = await getDrug(params.slug);
  
  if (!drug) {
    notFound();
  }

  return <DrugDetailPage drug={drug} />;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const drug = await getDrug(params.slug);
  return generateDrugSEO(drug);
}
```

#### Component Patterns
```typescript
// components/SearchPage.tsx
'use client';

interface SearchPageProps {
  initialQuery?: string;
}

export default function SearchPage({ initialQuery }: SearchPageProps) {
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await drugAPI.searchDrugs(searchQuery);
        setResults(response.drugs);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    handleSearch(query);
  }, [query, handleSearch]);

  return (
    <div>
      <SearchInput value={query} onChange={setQuery} />
      <SearchResults results={results} loading={loading} query={query} />
    </div>
  );
}
```

## Testing Strategy

### Backend Testing

#### Unit Tests
```typescript
// drugs/drugs.service.spec.ts
describe('DrugsService', () => {
  let service: DrugsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrugsService,
        {
          provide: PrismaService,
          useValue: {
            drug: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DrugsService>(DrugsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should find drug by slug', async () => {
    const mockDrug = { id: '1', name: 'Test Drug', slug: 'test-drug' };
    jest.spyOn(prisma.drug, 'findUnique').mockResolvedValue(mockDrug);

    const result = await service.findBySlug('test-drug');

    expect(result).toEqual(mockDrug);
    expect(prisma.drug.findUnique).toHaveBeenCalledWith({
      where: { slug: 'test-drug' },
      include: { faqs: true },
    });
  });
});
```

#### Integration Tests
```typescript
// drugs/drugs.controller.integration.spec.ts
describe('DrugsController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();
  });

  it('/drugs/:slug (GET)', async () => {
    // Create test drug
    const testDrug = await prisma.drug.create({
      data: {
        name: 'Test Drug',
        slug: 'test-drug',
        published: true,
      },
    });

    return request(app.getHttpServer())
      .get(`/drugs/${testDrug.slug}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.drug.name).toBe('Test Drug');
      });
  });
});
```

### Frontend Testing

#### Component Tests
```typescript
// components/__tests__/SearchPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchPage from '../SearchPage';
import { drugAPI } from '@/lib/api';

jest.mock('@/lib/api');
const mockedDrugAPI = drugAPI as jest.Mocked<typeof drugAPI>;

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('performs search when user types', async () => {
    const mockResults = [
      { id: '1', name: 'Lisinopril', slug: 'lisinopril' },
    ];
    mockedDrugAPI.searchDrugs.mockResolvedValue(mockResults);

    render(<SearchPage />);
    
    const searchInput = screen.getByRole('searchbox');
    await userEvent.type(searchInput, 'lisinopril');
    
    await waitFor(() => {
      expect(mockedDrugAPI.searchDrugs).toHaveBeenCalledWith('lisinopril');
      expect(screen.getByText('Lisinopril')).toBeInTheDocument();
    });
  });
});
```

#### E2E Tests
```typescript
// e2e/drug-search.spec.ts
import { test, expect } from '@playwright/test';

test('drug search flow', async ({ page }) => {
  await page.goto('/');
  
  // Navigate to search
  await page.click('a[href="/search"]');
  await expect(page).toHaveURL('/search');
  
  // Perform search
  const searchInput = page.locator('input[type="search"]');
  await searchInput.fill('lisinopril');
  
  // Wait for results
  await page.waitForSelector('[data-testid="search-results"]');
  
  // Click on first result
  await page.click('[data-testid="drug-result"]:first-child');
  
  // Verify drug detail page
  await expect(page.locator('h1')).toContainText('Lisinopril');
});
```

## Database Management

### Prisma Schema Development
```prisma
// prisma/schema.prisma
model Drug {
  id                     String   @id @default(uuid())
  name                   String
  slug                   String   @unique
  genericName            String?
  brandNames             String[]
  manufacturer           String?
  published              Boolean  @default(false)
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  
  // AI Enhanced Content
  aiEnhancedTitle        String?
  aiEnhancedDescription  String?
  seoMetaTitle          String?
  seoMetaDescription    String?
  
  // Relationships
  faqs                  FAQ[]
  
  @@map("drugs")
}
```

### Migration Workflow
```bash
# Create migration
npx prisma migrate dev --name add_ai_content_fields

# Apply to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## Performance Optimization

### Backend Optimization
- Database query optimization with indexes
- Redis caching for frequently accessed data
- Connection pooling
- Background job processing
- API response compression

### Frontend Optimization
- Next.js automatic code splitting
- Image optimization
- Static site generation where possible
- Service worker for caching
- Bundle analysis and tree shaking

## Debugging

### Backend Debugging
```bash
# Debug mode with inspect
npm run start:debug

# VS Code launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Debug NestJS",
  "port": 9229,
  "restart": true
}
```

### Frontend Debugging
- React Developer Tools
- Next.js built-in debugging
- Network tab for API calls
- Performance profiling

## Contributing Guidelines

1. Follow TypeScript strict mode
2. Write tests for new features
3. Use conventional commit messages
4. Run linter and formatter before committing
5. Update documentation for API changes
6. Ensure all tests pass in CI/CD