import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NDAForm } from '@/components/NDAForm'
import { NDAFormData } from '@/utils/nda'

describe('NDAForm Component', () => {
  const mockData: NDAFormData = {
    purpose: 'Test purpose',
    effectiveDate: '2026-04-29',
    mndaTerm: '1year',
    confidentialityTerm: '1year',
    governingLaw: 'California',
    jurisdiction: 'San Francisco, CA',
    party1Name: 'John Doe',
    party1Title: 'CEO',
    party1Company: 'Acme Corp',
    party1Address: '123 Main St',
    party1Email: 'john@acme.com',
    party1Date: '2026-04-29',
    party2Name: 'Jane Smith',
    party2Title: 'COO',
    party2Company: 'Tech Inc',
    party2Address: '456 Oak Ave',
    party2Email: 'jane@tech.com',
    party2Date: '2026-04-29',
  }

  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the form title', () => {
    render(<NDAForm data={mockData} onChange={mockOnChange} />)
    expect(screen.getByText('Mutual NDA Creator')).toBeInTheDocument()
  })

  it('should render all form section headers', () => {
    render(<NDAForm data={mockData} onChange={mockOnChange} />)
    expect(screen.getByText('Purpose')).toBeInTheDocument()
    expect(screen.getByText('Effective Date')).toBeInTheDocument()
    expect(screen.getByText('MNDA Term')).toBeInTheDocument()
    expect(screen.getByText('Term of Confidentiality')).toBeInTheDocument()
    expect(screen.getByText('Governing Law')).toBeInTheDocument()
    expect(screen.getByText('Jurisdiction')).toBeInTheDocument()
    expect(screen.getByText('Party 1')).toBeInTheDocument()
    expect(screen.getByText('Party 2')).toBeInTheDocument()
  })

  it('should display form data in input fields', () => {
    render(<NDAForm data={mockData} onChange={mockOnChange} />)
    const purposeInput = screen.getByDisplayValue(mockData.purpose)
    expect(purposeInput).toBeInTheDocument()
  })

  it('should call onChange when purpose textarea is changed', () => {
    render(<NDAForm data={mockData} onChange={mockOnChange} />)
    const purposeInput = screen.getByPlaceholderText('How Confidential Information may be used')
    fireEvent.change(purposeInput, { target: { value: 'New purpose' } })
    expect(mockOnChange).toHaveBeenCalled()
  })

  it('should call onChange when a text input is changed', () => {
    render(<NDAForm data={mockData} onChange={mockOnChange} />)
    const governingLawInput = screen.getByDisplayValue('California')
    fireEvent.change(governingLawInput, { target: { value: 'New York' } })
    expect(mockOnChange).toHaveBeenCalled()
  })

  it('should display Party 1 data correctly', () => {
    render(<NDAForm data={mockData} onChange={mockOnChange} />)
    expect(screen.getByDisplayValue(mockData.party1Name)).toBeInTheDocument()
    expect(screen.getByDisplayValue(mockData.party1Company)).toBeInTheDocument()
  })

  it('should display Party 2 data correctly', () => {
    render(<NDAForm data={mockData} onChange={mockOnChange} />)
    expect(screen.getByDisplayValue(mockData.party2Name)).toBeInTheDocument()
    expect(screen.getByDisplayValue(mockData.party2Company)).toBeInTheDocument()
  })

  it('should have radio buttons for MNDA term options', () => {
    render(<NDAForm data={mockData} onChange={mockOnChange} />)
    const radioButtons = screen.getAllByRole('radio', { name: /year|Continues/ })
    expect(radioButtons.length).toBeGreaterThan(0)
  })

  it('should have radio buttons for confidentiality term options', () => {
    render(<NDAForm data={mockData} onChange={mockOnChange} />)
    const options = screen.getAllByText(/year|perpetuity/)
    expect(options.length).toBeGreaterThan(0)
  })

  it('should have dark text color on inputs for readability', () => {
    const { container } = render(<NDAForm data={mockData} onChange={mockOnChange} />)
    const inputs = container.querySelectorAll('input[type="text"], textarea')
    inputs.forEach((input) => {
      expect(input.className).toContain('text-gray-900')
    })
  })
})
