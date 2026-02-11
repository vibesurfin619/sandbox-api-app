# Appetite Guides

This folder should contain PDF appetite guides that users can download.

## Current Guides

### Management Liability Appetite Guide 2024
- **Filename**: `Management-Liability-Appetite-Guide-2024.pdf`
- **Location**: `/public/` folder
- **Coverage**: D&O, EPLI, Fiduciary, Crime

### Architects and Engineers Agentic Underwriting
- **Filename**: `Architects-and-Engineers-Agentic-Underwriting.pdf`
- **Location**: `/public/` folder
- **Coverage**: Professional Liability for A&E firms

### Allied Health Agentic Underwriting
- **Filename**: `Allied-Health-Agentic-Underwriting.pdf`
- **Location**: `/public/` folder
- **Coverage**: Healthcare and Medical Malpractice

### Miscellaneous Professional Liability & General Liability
- **Filename**: `Miscellaneous-Professional-Liability-and-General-Liability-Appetite-Guide.pdf`
- **Location**: `/public/` folder
- **Coverage**: Professional Liability, General Liability across multiple industries

## Adding New Guides

To add new appetite guides:

1. Place the PDF file in the `/public/` folder
2. Update the modal in `/app/page.tsx` to include the new guide
3. Follow the existing pattern for displaying guide information and download buttons

## File Naming Convention

Use descriptive names with year:
- `[Coverage-Type]-Appetite-Guide-[Year].pdf`

Examples:
- `Management-Liability-Appetite-Guide-2024.pdf`
- `Cyber-Appetite-Guide-2024.pdf`
- `Property-Appetite-Guide-2024.pdf`
