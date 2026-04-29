import { generateNDADocument, validateFormData, NDAFormData } from '@/utils/nda'

describe('NDA Utility Functions', () => {
  const validFormData: NDAFormData = {
    purpose: 'Evaluating a potential partnership',
    effectiveDate: '2026-04-29',
    mndaTerm: '1year',
    confidentialityTerm: '1year',
    governingLaw: 'California',
    jurisdiction: 'San Francisco, CA',
    party1Name: 'John Doe',
    party1Title: 'CEO',
    party1Company: 'Acme Corp',
    party1Address: '123 Main St, San Francisco, CA 94105',
    party1Email: 'john@acme.com',
    party1Date: '2026-04-29',
    party2Name: 'Jane Smith',
    party2Title: 'COO',
    party2Company: 'Tech Inc',
    party2Address: '456 Oak Ave, San Francisco, CA 94105',
    party2Email: 'jane@tech.com',
    party2Date: '2026-04-29',
  }

  describe('validateFormData', () => {
    it('should return no errors for valid form data', () => {
      const errors = validateFormData(validFormData)
      expect(errors).toHaveLength(0)
    })

    it('should return error for missing purpose', () => {
      const data = { ...validFormData, purpose: '' }
      const errors = validateFormData(data)
      expect(errors).toContain('Purpose is required')
    })

    it('should return error for missing effective date', () => {
      const data = { ...validFormData, effectiveDate: '' }
      const errors = validateFormData(data)
      expect(errors).toContain('Effective Date is required')
    })

    it('should return error for missing governing law', () => {
      const data = { ...validFormData, governingLaw: '' }
      const errors = validateFormData(data)
      expect(errors).toContain('Governing Law is required')
    })

    it('should return error for missing jurisdiction', () => {
      const data = { ...validFormData, jurisdiction: '' }
      const errors = validateFormData(data)
      expect(errors).toContain('Jurisdiction is required')
    })

    it('should return error for missing party 1 name', () => {
      const data = { ...validFormData, party1Name: '' }
      const errors = validateFormData(data)
      expect(errors).toContain('Party 1 Name is required')
    })

    it('should return error for missing party 2 name', () => {
      const data = { ...validFormData, party2Name: '' }
      const errors = validateFormData(data)
      expect(errors).toContain('Party 2 Name is required')
    })

    it('should return multiple errors for multiple missing fields', () => {
      const data = { ...validFormData, purpose: '', governingLaw: '', party1Name: '' }
      const errors = validateFormData(data)
      expect(errors.length).toBeGreaterThan(1)
      expect(errors).toContain('Purpose is required')
      expect(errors).toContain('Governing Law is required')
      expect(errors).toContain('Party 1 Name is required')
    })
  })

  describe('generateNDADocument', () => {
    it('should generate document with all required fields', () => {
      const doc = generateNDADocument(validFormData)
      expect(doc).toContain('Mutual Non-Disclosure Agreement')
      expect(doc).toContain(validFormData.purpose)
      expect(doc).toContain(validFormData.effectiveDate)
    })

    it('should include party 1 information', () => {
      const doc = generateNDADocument(validFormData)
      expect(doc).toContain(validFormData.party1Name)
      expect(doc).toContain(validFormData.party1Company)
      expect(doc).toContain(validFormData.party1Email)
    })

    it('should include party 2 information', () => {
      const doc = generateNDADocument(validFormData)
      expect(doc).toContain(validFormData.party2Name)
      expect(doc).toContain(validFormData.party2Company)
      expect(doc).toContain(validFormData.party2Email)
    })

    it('should include governing law and jurisdiction', () => {
      const doc = generateNDADocument(validFormData)
      expect(doc).toContain(validFormData.governingLaw)
      expect(doc).toContain(validFormData.jurisdiction)
    })

    it('should include 1 year MNDA term when selected', () => {
      const doc = generateNDADocument(validFormData)
      expect(doc).toContain('Expires 1 year(s) from Effective Date.')
    })

    it('should include continues indefinitely MNDA term when selected', () => {
      const data = { ...validFormData, mndaTerm: 'continues' }
      const doc = generateNDADocument(data)
      expect(doc).toContain('Continues until terminated')
    })

    it('should include 1 year confidentiality term when selected', () => {
      const doc = generateNDADocument(validFormData)
      expect(doc).toContain('1 year(s) from Effective Date')
    })

    it('should include perpetual confidentiality term when selected', () => {
      const data = { ...validFormData, confidentialityTerm: 'perpetual' }
      const doc = generateNDADocument(data)
      expect(doc).toContain('In perpetuity')
    })

    it('should include standard terms section', () => {
      const doc = generateNDADocument(validFormData)
      expect(doc).toContain('Use and Protection of Confidential Information')
      expect(doc).toContain('Exceptions')
      expect(doc).toContain('Term and Termination')
    })

    it('should replace all purpose placeholders', () => {
      const doc = generateNDADocument(validFormData)
      expect(doc).not.toContain('{{PURPOSE}}')
    })

    it('should replace all date placeholders', () => {
      const doc = generateNDADocument(validFormData)
      expect(doc).not.toContain('{{EFFECTIVE_DATE}}')
    })

    it('should replace all governing law placeholders', () => {
      const doc = generateNDADocument(validFormData)
      expect(doc).not.toContain('{{GOVERNING_LAW}}')
    })

    it('should replace all jurisdiction placeholders', () => {
      const doc = generateNDADocument(validFormData)
      expect(doc).not.toContain('{{JURISDICTION}}')
    })
  })
})
