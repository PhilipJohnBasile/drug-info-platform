import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchPage from '../SearchPage'
import { drugAPI } from '@/lib/api'

// Mock the API
jest.mock('@/lib/api', () => ({
  drugAPI: {
    searchDrugs: jest.fn(),
  },
}))

const mockedDrugAPI = drugAPI as jest.Mocked<typeof drugAPI>

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders search form correctly', () => {
    render(<SearchPage />)
    
    expect(screen.getByText('Search Drug Information')).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search by drug name/i)).toBeInTheDocument()
  })

  it('displays initial search prompt', () => {
    render(<SearchPage />)
    
    expect(screen.getByText('Search for drug information')).toBeInTheDocument()
    expect(screen.getByText('Enter a drug name, generic name, or condition to find detailed information')).toBeInTheDocument()
  })

  it('performs search when user types and waits', async () => {
    const mockResults = [
      {
        id: '1',
        name: 'Lisinopril',
        slug: 'lisinopril',
        aiEnhancedTitle: 'Lisinopril - ACE Inhibitor',
        aiEnhancedDescription: 'Used to treat high blood pressure',
        genericName: 'lisinopril',
        brandNames: ['Prinivil', 'Zestril'],
        manufacturer: 'Test Pharma',
        published: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        faqs: []
      }
    ]

    mockedDrugAPI.searchDrugs.mockResolvedValue(mockResults)

    render(<SearchPage />)
    
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'lisinopril')
    
    // Wait for debounced search
    await waitFor(() => {
      expect(mockedDrugAPI.searchDrugs).toHaveBeenCalledWith('lisinopril', {
        manufacturer: '',
        route: '',
        hasWarning: false
      })
    }, { timeout: 1000 })

    await waitFor(() => {
      expect(screen.getByText('Found 1 result for "lisinopril"')).toBeInTheDocument()
      expect(screen.getByText('Lisinopril - ACE Inhibitor')).toBeInTheDocument()
    })
  })

  it('displays no results message when search returns empty', async () => {
    mockedDrugAPI.searchDrugs.mockResolvedValue([])

    render(<SearchPage />)
    
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'nonexistentdrug')
    
    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument()
      expect(screen.getByText('Try searching with different terms or check your spelling')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('shows loading state during search', async () => {
    // Create a promise that doesn't resolve immediately
    let resolveSearch: (value: any) => void
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve
    })
    
    mockedDrugAPI.searchDrugs.mockReturnValue(searchPromise)

    render(<SearchPage />)
    
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'test')
    
    // Should show loading skeleton cards
    await waitFor(() => {
      expect(screen.getAllByText('').length).toBeGreaterThan(0) // Skeleton cards are rendered
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    }, { timeout: 1000 })

    // Resolve the search
    resolveSearch!([])
    
    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })
  })

  it('handles search errors gracefully', async () => {
    mockedDrugAPI.searchDrugs.mockRejectedValue(new Error('API Error'))

    render(<SearchPage />)
    
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'error')
    
    await waitFor(() => {
      // Should show no results instead of crashing
      expect(screen.getByText('No results found') || screen.getByText('Search for drug information')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('opens and uses advanced filters', async () => {
    render(<SearchPage />)
    
    // Open advanced filters
    const filtersButton = screen.getByText('Advanced Filters')
    await userEvent.click(filtersButton)
    
    // Check if filter options are visible
    expect(screen.getByLabelText('Manufacturer')).toBeInTheDocument()
    expect(screen.getByLabelText('Administration Route')).toBeInTheDocument()
    expect(screen.getByLabelText('Has boxed warning')).toBeInTheDocument()
    
    // Set filter values
    const manufacturerInput = screen.getByLabelText('Manufacturer')
    const routeSelect = screen.getByLabelText('Administration Route')
    const warningCheckbox = screen.getByLabelText('Has boxed warning')
    
    await userEvent.type(manufacturerInput, 'Pfizer')
    await userEvent.selectOptions(routeSelect, 'oral')
    await userEvent.click(warningCheckbox)
    
    // Perform search with filters
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'test drug')
    
    await waitFor(() => {
      expect(mockedDrugAPI.searchDrugs).toHaveBeenCalledWith('test drug', {
        manufacturer: 'Pfizer',
        route: 'oral',
        hasWarning: true
      })
    }, { timeout: 1000 })
  })

  it('displays drug results with proper information', async () => {
    const mockResults = [
      {
        id: '1',
        name: 'Aspirin',
        slug: 'aspirin',
        aiEnhancedTitle: 'Aspirin - Pain Relief Medication',
        aiEnhancedDescription: 'Aspirin is used for pain relief and inflammation.',
        genericName: 'acetylsalicylic acid',
        brandNames: ['Bayer', 'Excedrin'],
        manufacturer: 'Bayer AG',
        published: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        faqs: []
      }
    ]

    mockedDrugAPI.searchDrugs.mockResolvedValue(mockResults)

    render(<SearchPage />)
    
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'aspirin')
    
    await waitFor(() => {
      // Check drug information is displayed
      expect(screen.getByText('Aspirin - Pain Relief Medication')).toBeInTheDocument()
      expect(screen.getByText('Generic: acetylsalicylic acid')).toBeInTheDocument()
      expect(screen.getByText('Aspirin is used for pain relief and inflammation.')).toBeInTheDocument()
      
      // Check brand names and manufacturer badges
      expect(screen.getByText('Bayer')).toBeInTheDocument()
      expect(screen.getByText('Excedrin')).toBeInTheDocument()
      expect(screen.getByText('Bayer AG')).toBeInTheDocument()
    })
  })

  it('navigates to drug detail page when result is clicked', async () => {
    const mockResults = [
      {
        id: '1',
        name: 'Ibuprofen',
        slug: 'ibuprofen',
        aiEnhancedTitle: 'Ibuprofen - Anti-inflammatory',
        aiEnhancedDescription: 'Pain and inflammation relief.',
        published: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        faqs: []
      }
    ]

    mockedDrugAPI.searchDrugs.mockResolvedValue(mockResults)

    render(<SearchPage />)
    
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'ibuprofen')
    
    await waitFor(() => {
      const drugLink = screen.getByRole('link', { name: /ibuprofen - anti-inflammatory/i })
      expect(drugLink).toHaveAttribute('href', '/drugs/ibuprofen')
    })
  })

  it('clears results when search is empty', async () => {
    const mockResults = [
      {
        id: '1',
        name: 'Test Drug',
        slug: 'test-drug',
        aiEnhancedTitle: 'Test Drug',
        published: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        faqs: []
      }
    ]

    mockedDrugAPI.searchDrugs.mockResolvedValue(mockResults)

    render(<SearchPage />)
    
    const searchInput = screen.getByRole('searchbox')
    
    // First search
    await userEvent.type(searchInput, 'test')
    
    await waitFor(() => {
      expect(screen.getByText('Test Drug')).toBeInTheDocument()
    })
    
    // Clear search
    await userEvent.clear(searchInput)
    
    await waitFor(() => {
      expect(screen.queryByText('Test Drug')).not.toBeInTheDocument()
      expect(screen.getByText('Search for drug information')).toBeInTheDocument()
    })
  })

  it('handles keyboard navigation properly', async () => {
    render(<SearchPage />)
    
    const searchInput = screen.getByRole('searchbox')
    
    // Test Enter key
    await userEvent.type(searchInput, 'test{enter}')
    
    await waitFor(() => {
      expect(mockedDrugAPI.searchDrugs).toHaveBeenCalled()
    })
  })

  it('displays correct result count', async () => {
    const mockResults = Array.from({ length: 3 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Drug ${i + 1}`,
      slug: `drug-${i + 1}`,
      aiEnhancedTitle: `Drug ${i + 1} - Title`,
      published: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      faqs: []
    }))

    mockedDrugAPI.searchDrugs.mockResolvedValue(mockResults)

    render(<SearchPage />)
    
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'drug')
    
    await waitFor(() => {
      expect(screen.getByText('Found 3 results for "drug"')).toBeInTheDocument()
    })
  })
})