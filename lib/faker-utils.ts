import { StartApplicationRequest, Question, AnswerValue, CoverageType } from "./types"

// Valid NAICS codes for sample data generation
const VALID_NAICS_CODES = [
  "541211", // Offices of Certified Public Accountants
  "541219", // Other Accounting Services
  "541511", // Custom Computer Programming Services
  "541512", // Computer Systems Design Services
  "541513", // Computer Facilities Management Services
  "541519", // Other Computer Related Services
  "541611", // Administrative Management and General Management Consulting Services
  "541612", // Human Resources Consulting Services
  "541613", // Marketing Consulting Services
  "541614", // Process, Physical Distribution, and Logistics Consulting Services
  "541618", // Other Management Consulting Services
  "541690", // Other Scientific and Technical Consulting Services
  "541720", // Research and Development in the Social Sciences and Humanities
  "541930", // Translation and Interpretation Services
  "561110", // Office Administrative Services
  "561311", // Employment Placement Agencies
  "561312", // Executive Search Services
  "561320", // Temporary Help Services
  "561330", // Professional Employer Organizations
  "611420", // Computer Training
  "611430", // Professional and Management Development Training
  "621111", // Offices of Physicians (except Mental Health Specialists)
  "621112", // Offices of Physicians, Mental Health Specialists
  "621210", // Offices of Dentists
  "621310", // Offices of Chiropractors
  "621320", // Offices of Optometrists
  "621330", // Offices of Mental Health Practitioners (except Physicians)
  "621340", // Offices of Physical, Occupational and Speech Therapists, and Audiologists
  "621391", // Offices of Podiatrists
  "621399", // Offices of All Other Miscellaneous Health Practitioners
  "621410", // Family Planning Centers
  "621420", // Outpatient Mental Health and Substance Abuse Centers
  "621491", // HMO Medical Centers
  "621492", // Kidney Dialysis Centers
  "621493", // Freestanding Ambulatory Surgical and Emergency Centers
  "621498", // All Other Outpatient Care Centers
  "621511", // Medical Laboratories
  "621512", // Diagnostic Imaging Centers
  "621610", // Home Health Care Services
  "621910", // Ambulance Services
  "621991", // Blood and Organ Banks
  "621999", // All Other Miscellaneous Ambulatory Health Care Services
  "622110", // General Medical and Surgical Hospitals
  "622210", // Psychiatric and Substance Abuse Hospitals
  "622310", // Specialty (except Psychiatric and Substance Abuse) Hospitals
  "623110", // Nursing Care Facilities (Skilled Nursing Facilities)
  "623210", // Residential Intellectual and Developmental Disability Facilities
  "623220", // Residential Mental Health and Substance Abuse Facilities
  "623311", // Continuing Care Retirement Communities
  "623312", // Assisted Living Facilities for the Elderly
  "623990", // Other Residential Care Facilities
  "624110", // Child and Youth Services
  "624120", // Services for the Elderly and Persons with Disabilities
  "624190", // Other Individual and Family Services
  "624210", // Community Food Services
  "624221", // Temporary Shelters
  "624229", // Other Community Housing Services
  "624230", // Emergency and Other Relief Services
  "624310", // Vocational Rehabilitation Services
  "624410", // Child Day Care Services
  "711110", // Theater Companies and Dinner Theaters
  "711120", // Dance Companies
  "711130", // Musical Groups and Artists
  "711190", // Other Performing Arts Companies
  "711211", // Sports Teams and Clubs
  "711212", // Race Tracks
  "711219", // Other Spectator Sports
  "711310", // Promoters of Performing Arts, Sports, and Similar Events with Facilities
  "711320", // Promoters of Performing Arts, Sports, and Similar Events without Facilities
  "711410", // Agents and Managers for Artists, Athletes, Entertainers, and Other Public Figures
  "711510", // Independent Artists, Writers, and Performers
  "712110", // Museums
  "712120", // Historical Sites
  "712130", // Zoos and Botanical Gardens
  "712190", // Nature Parks and Other Similar Institutions
  "713110", // Amusement and Theme Parks
  "713120", // Amusement Arcades
  "713210", // Casinos (except Casino Hotels)
  "713290", // Other Gambling Industries
  "713910", // Golf Courses and Country Clubs
  "713920", // Skiing Facilities
  "713930", // Marinas
  "713940", // Fitness and Recreational Sports Centers
  "713950", // Bowling Centers
  "713990", // All Other Amusement and Recreation Industries
  "721110", // Hotels (except Casino Hotels) and Motels
  "721120", // Casino Hotels
  "721191", // Bed-and-Breakfast Inns
  "721199", // All Other Traveler Accommodation
  "721211", // RV (Recreational Vehicle) Parks and Campgrounds
  "721214", // Recreational and Vacation Camps (except Campgrounds)
  "722310", // Food Service Contractors
  "722320", // Caterers
  "722330", // Mobile Food Services
  "722410", // Drinking Places (Alcoholic Beverages)
  "722511", // Full-Service Restaurants
  "722513", // Limited-Service Restaurants
  "722514", // Cafeterias, Grill Buffets, and Buffets
  "722515", // Snack and Nonalcoholic Beverage Bars
  "811111", // General Automotive Repair
  "811112", // Automotive Exhaust System Repair
  "811113", // Automotive Transmission Repair
  "811118", // Other Automotive Mechanical and Electrical Repair and Maintenance
  "811121", // Automotive Body, Paint, and Interior Repair and Maintenance
  "811122", // Automotive Glass Replacement Shops
  "811191", // Automotive Oil Change and Lubrication Shops
  "811192", // Car Washes
  "811198", // All Other Automotive Repair and Maintenance
  "811211", // Consumer Electronics Repair and Maintenance
  "811212", // Computer and Office Machine Repair and Maintenance
  "811213", // Communication Equipment Repair and Maintenance
  "811219", // Other Electronic and Precision Equipment Repair and Maintenance
  "811310", // Commercial and Industrial Machinery and Equipment (except Automotive and Electronic) Repair and Maintenance
  "811411", // Home and Garden Equipment Repair and Maintenance
  "811412", // Appliance Repair and Maintenance
  "811420", // Reupholstery and Furniture Repair
  "811430", // Footwear and Leather Goods Repair
  "811490", // Other Personal and Household Goods Repair and Maintenance
  "812111", // Barber Shops
  "812112", // Beauty Salons
  "812113", // Nail Salons
  "812191", // Diet and Weight Reducing Centers
  "812199", // Other Personal Care Services
  "812210", // Funeral Homes and Funeral Services
  "812220", // Cemeteries and Crematories
  "812310", // Coin-Operated Laundries and Drycleaners
  "812320", // Drycleaning and Laundry Services (except Coin-Operated)
  "812331", // Linen Supply
  "812332", // Industrial Launderers
  "812910", // Pet Care (except Veterinary) Services
  "812921", // Photofinishing Laboratories (except One-Hour)
  "812922", // One-Hour Photofinishing
  "812930", // Parking Lots and Garages
  "812990", // All Other Personal Services
  "813110", // Religious Organizations
  "813211", // Grantmaking Foundations
  "813212", // Voluntary Health Organizations
  "813219", // Other Grantmaking and Giving Services
  "813311", // Human Rights Organizations
  "813312", // Environment, Conservation and Wildlife Organizations
  "813319", // Other Social Advocacy Organizations
  "813410", // Civic and Social Organizations
  "813910", // Business Associations
  "813920", // Professional Organizations
  "813930", // Labor Unions and Similar Labor Organizations
  "813940", // Political Organizations
  "813990", // Other Similar Organizations (except Business, Professional, Labor, and Political Organizations)
  "814110", // Private Households
]

// Helper function to get a random valid NAICS code
function getRandomNaicsCode(): string {
  return VALID_NAICS_CODES[Math.floor(Math.random() * VALID_NAICS_CODES.length)]
}

// Lazy load faker to avoid server-side bundling issues
async function getFaker() {
  if (typeof window === "undefined") {
    throw new Error("Faker can only be used on the client side")
  }
  const { faker } = await import("@faker-js/faker")
  return faker
}

/**
 * Generates fake data for the StartApplicationForm
 */
export async function generateStartApplicationData(): Promise<Partial<StartApplicationRequest>> {
  const faker = await getFaker()
  const coverages: CoverageType[] = [faker.helpers.arrayElement<CoverageType>(["do", "epli", "fid", "crm", "mpl", "gl", "ah", "ae", "isogl"])]
  
  return {
    app_source: "counterpart",
    application_version: faker.helpers.arrayElement<"1000" | "23">(["1000", "23"]),
    legal_name: faker.company.name(),
    dba_name: faker.helpers.arrayElement([true, false]) ? faker.company.name() : null,
    website: `https://${faker.internet.domainName()}`,
    industry: getRandomNaicsCode(), // Valid NAICS code
    address_1: faker.location.streetAddress(),
    address_2: faker.helpers.arrayElement([true, false]) ? faker.location.secondaryAddress() : null,
    address_city: faker.location.city(),
    address_state: faker.location.state(),
    address_zipcode: faker.location.zipCode(),
    broker_first_name: faker.person.firstName(),
    broker_last_name: faker.person.lastName(),
    broker_email: faker.internet.email(),
    brokerage_office_city: faker.location.city(),
    brokerage_office_state: faker.location.state(),
    coverages,
  }
}

/**
 * Generates fake HR contact information
 */
export async function generateHrContactData() {
  const faker = await getFaker()
  return {
    name: `${faker.person.firstName()} ${faker.person.lastName()}`,
    email: faker.internet.email(),
    title: faker.person.jobTitle(),
    phone: faker.phone.number(),
  }
}

/**
 * Generates fake answer value based on question type
 */
export async function generateAnswerForQuestion(question: Question): Promise<AnswerValue | undefined> {
  const faker = await getFaker()
  if (!question.required && Math.random() < 0.3) {
    // 30% chance to skip optional questions
    return undefined
  }

  switch (question.type) {
    case "text":
      // Try to generate contextually appropriate text based on question key/title
      const key = question.key.toLowerCase()
      const title = question.title.toLowerCase()
      
      if (key.includes("email") || title.includes("email")) {
        return faker.internet.email()
      }
      if (key.includes("phone") || title.includes("phone")) {
        return faker.phone.number()
      }
      if (key.includes("website") || title.includes("website") || title.includes("url")) {
        return `https://${faker.internet.domainName()}`
      }
      if (key.includes("name") || title.includes("name")) {
        return faker.person.fullName()
      }
      if (key.includes("address") || title.includes("address")) {
        return faker.location.streetAddress()
      }
      if (key.includes("city") || title.includes("city")) {
        return faker.location.city()
      }
      if (key.includes("state") || title.includes("state")) {
        return faker.location.state()
      }
      if (key.includes("zip") || title.includes("zip") || key.includes("postal")) {
        return faker.location.zipCode()
      }
      if (key.includes("industry") || title.includes("industry")) {
        return getRandomNaicsCode() // Valid NAICS code
      }
      if (key.includes("revenue") || title.includes("revenue") || key.includes("income")) {
        return faker.finance.amount({ min: 100000, max: 10000000, dec: 0 })
      }
      if (key.includes("employee") || title.includes("employee")) {
        return faker.string.numeric({ length: { min: 1, max: 4 } })
      }
      // Default text
      return faker.lorem.sentence({ min: 3, max: 8 })

    case "number":
      // Try to generate contextually appropriate numbers
      const numKey = question.key.toLowerCase()
      const numTitle = question.title.toLowerCase()
      
      if (numKey.includes("revenue") || numTitle.includes("revenue") || numKey.includes("income")) {
        return Number(faker.finance.amount({ min: 100000, max: 10000000, dec: 0 }))
      }
      if (numKey.includes("employee") || numTitle.includes("employee")) {
        return Number(faker.string.numeric({ length: { min: 1, max: 4 } }))
      }
      if (numKey.includes("year") || numTitle.includes("year")) {
        return faker.date.past().getFullYear()
      }
      // Default number
      return faker.number.int({ min: 1, max: 10000 })

    case "currency":
      // Generate currency values (stored as numbers)
      const currencyKey = question.key.toLowerCase()
      const currencyTitle = question.title.toLowerCase()
      
      if (currencyKey.includes("revenue") || currencyTitle.includes("revenue") || currencyKey.includes("income") || currencyKey.includes("sales")) {
        return Number(faker.finance.amount({ min: 100000, max: 10000000, dec: 2 }))
      }
      if (currencyKey.includes("limit") || currencyTitle.includes("limit") || currencyKey.includes("coverage")) {
        return Number(faker.finance.amount({ min: 1000000, max: 50000000, dec: 2 }))
      }
      if (currencyKey.includes("premium") || currencyTitle.includes("premium")) {
        return Number(faker.finance.amount({ min: 1000, max: 100000, dec: 2 }))
      }
      // Default currency value
      return Number(faker.finance.amount({ min: 100, max: 1000000, dec: 2 }))

    case "percentage":
      // Generate percentage values (stored as numbers, typically 0-100)
      const percentageKey = question.key.toLowerCase()
      const percentageTitle = question.title.toLowerCase()
      
      if (percentageKey.includes("discount") || percentageTitle.includes("discount")) {
        return Number(faker.number.float({ min: 0, max: 50, fractionDigits: 2 }))
      }
      if (percentageKey.includes("growth") || percentageTitle.includes("growth") || percentageKey.includes("increase")) {
        return Number(faker.number.float({ min: 0, max: 100, fractionDigits: 2 }))
      }
      if (percentageKey.includes("ownership") || percentageTitle.includes("ownership") || percentageKey.includes("stake")) {
        return Number(faker.number.float({ min: 0, max: 100, fractionDigits: 2 }))
      }
      if (percentageKey.includes("margin") || percentageTitle.includes("margin") || percentageKey.includes("profit")) {
        return Number(faker.number.float({ min: 5, max: 50, fractionDigits: 2 }))
      }
      // Default percentage value (0-100)
      return Number(faker.number.float({ min: 0, max: 100, fractionDigits: 2 }))

    case "boolean":
      // For boolean questions, use default Yes/No options if options_serializer is empty
      const booleanOptions = 
        (!question.options_serializer || question.options_serializer.length === 0)
          ? [
              { id: "Yes", text: "Yes", disabled_expression: null },
              { id: "No", text: "No", disabled_expression: null },
            ]
          : question.options_serializer || []
      
      if (booleanOptions.length > 0) {
        return faker.helpers.arrayElement(booleanOptions).id
      }
      return undefined

    case "radio":
    case "select":
      if (question.options_serializer && question.options_serializer.length > 0) {
        return faker.helpers.arrayElement(question.options_serializer).id
      }
      return undefined

    case "checkbox":
      if (question.options_serializer && question.options_serializer.length > 0) {
        // Select 1-3 random options
        const count = faker.number.int({ min: 1, max: Math.min(3, question.options_serializer.length) })
        return faker.helpers.arrayElements(question.options_serializer, { min: 1, max: count }).map(opt => opt.id)
      }
      return []

    case "date":
      // Generate a date in the past (for things like incorporation date, etc.)
      return faker.date.past({ years: 10 }).toISOString().split("T")[0]

    case "file":
      // For file uploads, we can't generate actual files, so return undefined
      // Users will need to manually upload files
      return undefined

    default:
      return undefined
  }
}

/**
 * Generates fake answers for all questions
 */
export async function generateAnswersForQuestions(questions: Question[]): Promise<Record<string, AnswerValue>> {
  const answers: Record<string, AnswerValue> = {}
  
  // Process questions in order to handle dependencies
  const processedKeys = new Set<string>()
  
  for (const question of questions) {
    // Skip if already processed
    if (processedKeys.has(question.key)) {
      continue
    }
    
    // Check dependencies - if dependent question hasn't been answered, skip
    if (question.dependant_on && !processedKeys.has(question.dependant_on)) {
      continue
    }
    
    const answer = await generateAnswerForQuestion(question)
    if (answer !== undefined) {
      answers[question.key] = answer
      processedKeys.add(question.key)
    }
  }
  
  return answers
}

/**
 * Generates fake coverage recommendations with reasons
 */
export async function generateCoverageRecommendations(): Promise<Array<{ coverage: CoverageType; reason: string }>> {
  const faker = await getFaker()
  
  const coverageReasons: Record<CoverageType, string[]> = {
    do: [
      "Based on your company size and industry, Directors & Officers coverage is essential to protect your leadership team from personal liability claims.",
      "Your company's growth trajectory and board structure indicate a strong need for D&O protection against shareholder lawsuits.",
      "Given your industry's regulatory environment, D&O insurance will safeguard your executives from litigation risks.",
    ],
    epli: [
      "With your employee count and industry profile, Employment Practices Liability Insurance is crucial to protect against discrimination and harassment claims.",
      "Your company's hiring practices and workforce diversity make EPLI coverage a smart investment to mitigate employment-related risks.",
      "Based on industry trends, EPLI coverage will help protect your business from costly employment disputes and wrongful termination claims.",
    ],
    fid: [
      "Your company's retirement plan and employee benefits structure requires Fiduciary coverage to protect against ERISA violations.",
      "Given your fiduciary responsibilities with employee benefit plans, this coverage is essential to protect your company and plan administrators.",
      "Fiduciary liability insurance is recommended to safeguard against claims related to mismanagement of employee benefit plans.",
    ],
    crm: [
      "Your business operations and financial handling make Crime coverage important to protect against employee theft and fraud.",
      "Based on your company's cash flow and transaction volume, Crime insurance will protect against internal and external criminal acts.",
      "Crime coverage is recommended to safeguard your business from embezzlement, forgery, and other criminal activities.",
    ],
    mpl: [
      "Your professional services and client relationships make Miscellaneous Professional Liability essential for protecting against errors and omissions.",
      "Given the nature of your business, MPL coverage will protect against claims of professional negligence and service failures.",
      "Based on your industry, MPL insurance is crucial to cover professional liability risks not covered by other policies.",
    ],
    gl: [
      "General Liability coverage is fundamental for your business to protect against third-party bodily injury and property damage claims.",
      "Your business operations and customer interactions make GL coverage essential for comprehensive risk protection.",
      "General Liability insurance is recommended as a baseline coverage to protect your business from common liability exposures.",
    ],
    ah: [
      "Your healthcare-related services require Allied Healthcare coverage to protect against professional liability specific to medical practices.",
      "Given your involvement in healthcare services, AH coverage will protect against medical malpractice and professional liability claims.",
      "Allied Healthcare coverage is essential for your business to protect against healthcare-specific professional risks.",
    ],
    ae: [
      "Your design and construction services make Architects & Engineers coverage critical for protecting against design errors and professional negligence.",
      "Based on your professional services, AE coverage will safeguard against claims related to design defects and construction failures.",
      "Architects & Engineers coverage is recommended to protect your firm from professional liability in design and construction projects.",
    ],
    isogl: [
      "ISO General Liability coverage provides standardized protection that may be required by clients or partners in your industry.",
      "Your business relationships and contracts may benefit from ISO GL coverage for enhanced compatibility and broader acceptance.",
      "ISO GL coverage offers standardized terms that can provide better alignment with industry expectations and client requirements.",
    ],
  }
  
  // Generate 2-4 random recommendations
  const numRecommendations = faker.number.int({ min: 2, max: 4 })
  const allCoverages: CoverageType[] = ["do", "epli", "fid", "crm", "mpl", "gl", "ah", "ae", "isogl"]
  const selectedCoverages = faker.helpers.arrayElements(allCoverages, { min: numRecommendations, max: numRecommendations })
  
  return selectedCoverages.map(coverage => ({
    coverage,
    reason: faker.helpers.arrayElement(coverageReasons[coverage]),
  }))
}
