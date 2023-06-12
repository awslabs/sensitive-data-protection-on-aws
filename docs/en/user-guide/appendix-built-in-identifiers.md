# Appendix - Built-in data identifiers

The solution uses machine learning and pattern matching to detect sensitive data. These are 200+ built-in data identifiers for general and country-specific data types. 

!!! Info "For more information"
    In this solution, some built-in data identifiers, such as person names and addresses, are defined based on AI, while others are defined based on Regex/keywords.

## General data identifiers

| Data identifier    | Description                                         |
|--------------|-----------------------------------------------------|
| PERSON_NAME  | Person name (English/Latin specific)                |
| EMAIL        | The email address                                   |
| DATE         | The date in general format                           |
| PHONE_NUMBER | The phone number (mainly US)                         |
| BANK_ACCOUNT | The bank card (mainly US and Canada specific)        |
| CREDIT_CARD  | The credit card number (mainly US/universal format)  |
| IP_ADDRESS   | The IP address                                      |
| MAC_ADDRESS  | The Mac address                                     |

## Country-specific data identifiers

| Country | Data identifier | Description |
| --- | --- | ----- |
| Argentina | ARGENTINA_TAX_IDENTIFICATION_NUMBER | Argentina Tax Identification Number, also known as CUIT or CUIL |
| Australia | AUSTRALIA_BUSINESS_NUMBER | Australia Business Number (ABN). A unique identifier issued by the Australian Business Register (ABR) to identify businesses to the government and community. |
| Australia | AUSTRALIA_COMPANY_NUMBER | Australia Company Number (ACN). Unique identifier issued by the Australian Securities and Investments Commission. |
| Australia | AUSTRALIA_DRIVING_LICENSE | The driver license number (Australia specific) |
| Australia | AUSTRALIA_MEDICARE_NUMBER | Australian Medicare Number. Personal identifier issued by the Australian Health Insurance Commission. |
| Australia | AUSTRALIA_PASSPORT_NUMBER | The passport number (Australia specific) |
| Australia | AUSTRALIA_TAX_FILE_NUMBER | Australia Tax File Number (TFN). Issued by the Australian Taxation Office (ATO) to taxpayers (individual, company, etc) for tax dealings. |
| Austria | AUSTRIA_DRIVING_LICENSE | The driver license number (Austria specific) |
| Austria | AUSTRIA_PASSPORT_NUMBER | The passport number (Austria specific) |
| Austria | AUSTRIA_SSN | The social security number (for Austria persons) |
| Austria | AUSTRIA_TAX_IDENTIFICATION_NUMBER | Tax identification number (Austria specific) |
| Austria | AUSTRIA_VALUE_ADDED_TAX | Value-Added Tax (Austria specific) |
| Belgium | BELGIUM_DRIVING_LICENSE | The driver license number (Belgium specific) |
| Belgium | BELGIUM_NATIONAL_IDENTIFICATION_NUMBER | The Belgian National Number (BNN) |
| Belgium | BELGIUM_PASSPORT_NUMBER | The passport number (Belgium specific) |
| Belgium | BELGIUM_TAX_IDENTIFICATION_NUMBER | Tax identification number (Belgium specific) |
| Belgium | BELGIUM_VALUE_ADDED_TAX | Value-Added Tax (Belgium specific) |
| Bosnia | BOSNIA_UNIQUE_MASTER_CITIZEN_NUMBER | Unique master citizen number (JMBG) for Bosnia-Herzegovina citizens |
| Brazil | BRAZIL_BANK_ACCOUNT | The bank account number (Brazil specific) |
| Brazil | BRAZIL_NATIONAL_IDENTIFICATION_NUMBER | The national identifier (Brazil specific) |
| Brazil | BRAZIL_NATIONAL_REGISTRY_OF_LEGAL_ENTITIES_NUMBER | The identification number issued to companies (Brazil specific), also known as the CNPJ |
| Brazil | BRAZIL_NATURAL_PERSON_REGISTRY_NUMBER | The identification number issued to person (Brazil specific) |
| Bulgaria | BULGARIA_DRIVING_LICENSE | The driver license number (Bulgaria specific) |
| Bulgaria | BULGARIA_UNIFORM_CIVIL_NUMBER | Unified Civil Number (EGN) that serves as a national identification number |
| Bulgaria | BULGARIA_VALUE_ADDED_TAX | Value-Added Tax (Bulgaria specific) |
| Canada | CANADA_DRIVING_LICENSE | The driver license number (Canada specific) |
| Canada | CANADA_GOVERNMENT_IDENTIFICATION_CARD_NUMBER | The national identifier (Canada specific) |
| Canada | CANADA_PASSPORT_NUMBER | The passport number (Canada specific) |
| Canada | CANADA_PERMANENT_RESIDENCE_NUMBER | Permanent residence number (PR Card number) |
| Canada | CANADA_PERSONAL_HEALTH_NUMBER | The unique identifier for healthcare (PHN number) |
| Canada | CANADA_SOCIAL_INSURANCE_NUMBER | The social insurance number (SIN) in Canada |
| Chile | CHILE_DRIVING_LICENSE | The driver license number (Chile specific) |
| Chile | CHILE_NATIONAL_IDENTIFICATION_NUMBER | The Chile national identifier, also known as RUT or RUN |
| China and territories | CHINA_IDENTIFICATION | The identification card id (China specific) |
| China and territories | CHINA_PHONE_NUMBER | The mobile or landland phone number (China specific) |
| China and territories | CHINA_PASSPORT_NUMBER | The passport number (China specific) |
| China and territories | CHINA_LICENSE_PLATE_NUMBER | The car license plate number (China specific) |
| China and territories | CHINA_MAINLAND_TRAVEL_PERMIT_ID_TAIWAN | A China mainland travel permit id number for Taiwan residents |
| China and territories | CHINA_MAINLAND_TRAVEL_PERMIT_ID_HONG_KONG_MACAU | A China mainland travel permit id number for Hong Kong and Macau residents |
| China and territories | HONG_KONG_IDENTITY_CARD | The Hong Kong Identification card id |
| China and territories | MACAU_RESIDENT_IDENTITY_CARD | The Macau Identification card id |
| China and territories | TAIWAN_NATIONAL_IDENTIFICATION_NUMBER | The Taiwan Identification card id |
| China and territories | TAIWAN_PASSPORT_NUMBER | The Taiwan passport number |
| China and territories| CHINA_CHINESE_NAME | AI-based identifier for detecting Chinese name. (Built-in) |
| China and territories | CHINA_ADDRESS | AI-based identifier for detecting Chinese address. (Built-in) |
| China and territories | CHINA_NATIONALITY | Regex-based identifier for detecting Chinese nationality (Built-in) |
| China and territories | CHINA_BANK_CARD | Regex-based identifier for detecting Chinese bank card Id (Built-in) |
| China and territories | CHINA_MARITAL_STATUS | Regex-based identifier for detecting Marital status (Built-in) |
| China and territories | CHINA_POLITICAL_PARTY | Regex-based identifier for detecting Chinese Political party (Built-in) |
| China and territories | CHINA_PROVINCE | Regex-based identifier for detecting China province (Built-in) |
| China and territories | CHINA_GENDER | Regex-based identifier for detecting Gender (Built-in) |
| China and territories | CHINA_ID_TYPE | Regex-based identifier for detecting for Id Card type (Built-in) |
| Colombia | COLOMBIA_PERSONAL_IDENTIFICATION_NUMBER | Unique identifier assigned to Colombians at birth |
| Colombia | COLOMBIA_TAX_IDENTIFICATION_NUMBER | Tax identification number (Colombia specific) |
| Croatia | CROATIA_DRIVING_LICENSE | The driver license number (Croatia specific) |
| Croatia | CROATIA_IDENTITY_NUMBER | The national identifier (Croatia specific) |
| Croatia | CROATIA_PASSPORT_NUMBER | The passport number (Croatia specific) |
| Croatia | CROATIA_PERSONAL_IDENTIFICATION_NUMBER | The personal identifier number (OIB) |
| Cyprus | CYPRUS_DRIVING_LICENSE | The driver license number (Cyprus specific) |
| Cyprus | CYPRUS_NATIONAL_IDENTIFICATION_NUMBER | The Cypriot identity card |
| Cyprus | CYPRUS_PASSPORT_NUMBER | The passport number (Cyprus specific) |
| Cyprus | CYPRUS_TAX_IDENTIFICATION_NUMBER | Tax identification number (Cyprus specific) |
| Cyprus | CYPRUS_VALUE_ADDED_TAX | Value-Added Tax (Cyprus specific) |
| Czechia | CZECHIA_DRIVING_LICENSE | The driver license number (Czechia specific) |
| Czechia | CZECHIA_PERSONAL_IDENTIFICATION_NUMBER | The personal identifier number (Czechia specific) |
| Czechia | CZECHIA_VALUE_ADDED_TAX | Value-Added Tax (Czechia specific) |
| Denmark | DENMARK_DRIVING_LICENSE | The driver license number (Denmark specific) |
| Denmark | DENMARK_PERSONAL_IDENTIFICATION_NUMBER | The personal identifier number (Denmark specific) |
| Denmark | DENMARK_TAX_IDENTIFICATION_NUMBER | Tax identification number (Denmark specific) |
| Denmark | DENMARK_VALUE_ADDED_TAX | Value-Added Tax (Denmark specific) |
| Estonia | ESTONIA_DRIVING_LICENSE | The driver license number (Estonia specific) |
| Estonia | ESTONIA_PASSPORT_NUMBER | The passport number (Estonia specific) |
| Estonia | ESTONIA_PERSONAL_IDENTIFICATION_CODE | The personal identifier number (Estonia specific) |
| Estonia | ESTONIA_VALUE_ADDED_TAX | Value-Added Tax (Estonia specific) |
| Finland | FINLAND_DRIVING_LICENSE | The driver license number (Finland specific) |
| Finland | FINLAND_HEALTH_INSURANCE_NUMBER | The health insurance number (Finland specific) |
| Finland | FINLAND_NATIONAL_IDENTIFICATION_NUMBER | The national identifier number (Finland specific) |
| Finland | FINLAND_PASSPORT_NUMBER | The passport number (Finland specific) |
| Finland | FINLAND_VALUE_ADDED_TAX | Value-Added Tax (Finland specific) |
| France | FRANCE_BANK_ACCOUNT | The bank account number (France specific) |
| France | FRANCE_DRIVING_LICENSE | The driver license number (France specific) |
| France | FRANCE_HEALTH_INSURANCE_NUMBER | France health insurance number |
| France | FRANCE_INSEE_CODE | France social security, SSN, or NIR number |
| France | FRANCE_NATIONAL_IDENTIFICATION_NUMBER | France national identifier number (CNI) |
| France | FRANCE_PASSPORT_NUMBER | The passport number (France specific) |
| France | FRANCE_TAX_IDENTIFICATION_NUMBER | Tax identification number (France specific) |
| France | FRANCE_VALUE_ADDED_TAX | Value-Added Tax (France specific) |
| Germany | GERMANY_BANK_ACCOUNT                       | The bank account number (Germany specific)                 |
| Germany | GERMANY_DRIVING_LICENSE                    | The driver license number (Germany specific)               |
| Germany | GERMANY_PASSPORT_NUMBER                    | The passport number (Germany specific)                      |
| Germany | GERMANY_PERSONAL_IDENTIFICATION_NUMBER     | The personal identifier number (Germany specific)           |
| Germany | GERMANY_TAX_IDENTIFICATION_NUMBER          | Tax identification number (Germany specific)                |
| Germany | GERMANY_VALUE_ADDED_TAX                    | Value-Added Tax (Germany specific)                          |
| Greece  | GREECE_DRIVING_LICENSE                     | The driver license number (Greece specific)                 |
| Greece  | GREECE_PASSPORT_NUMBER                     | The passport number (Greece specific)                       |
| Greece  | GREECE_SSN                                | The social security number (for Greece persons)             |
| Greece  | GREECE_TAX_IDENTIFICATION_NUMBER           | Tax identification number (Greece specific)                 |
| Greece  | GREECE_VALUE_ADDED_TAX                     | Value-Added Tax (Greece specific)                           |
| Hungary | HUNGARY_DRIVING_LICENSE                    | The driver license number (Hungary specific)                |
| Hungary | HUNGARY_PASSPORT_NUMBER                    | The passport number (Hungary specific)                      |
| Hungary | HUNGARY_SSN                               | The social security number (for Hungary persons)            |
| Hungary | HUNGARY_TAX_IDENTIFICATION_NUMBER          | Tax identification number (Hungary specific)                |
| Hungary | HUNGARY_VALUE_ADDED_TAX                    | Value-Added Tax (Hungary specific)                          |
| Iceland | ICELAND_NATIONAL_IDENTIFICATION_NUMBER     | The national identifier (Iceland specific)                  |
| Iceland | ICELAND_PASSPORT_NUMBER                    | The passport number (Iceland specific)                      |
| Iceland | ICELAND_VALUE_ADDED_TAX                    | Value-Added Tax (Iceland specific)                          |
| India   | INDIA_AADHAAR_NUMBER                       | Aadhaar identification number issued by the UIDAI           |
| India   | INDIA_PERMANENT_ACCOUNT_NUMBER             | India Permanent Account Number (PAN)                        |
| Indonesia | INDONESIA_IDENTITY_CARD_NUMBER             | The national identifier (Indonesia specific)                |
| Ireland | IRELAND_DRIVING_LICENSE                    | The driver license number (Ireland specific)                |
| Ireland | IRELAND_PASSPORT_NUMBER                    | The passport number (Ireland specific)                      |
| Ireland | IRELAND_PERSONAL_PUBLIC_SERVICE_NUMBER     | Ireland personal public service number (PPS)                |
| Ireland | IRELAND_TAX_IDENTIFICATION_NUMBER          | Tax identification number (Ireland specific)                |
| Ireland | IRELAND_VALUE_ADDED_TAX                    | Value-Added Tax (Ireland specific)                          |
| Israel  | ISRAEL_IDENTIFICATION_NUMBER               | The national identifier (Israel specific)                   |
| Italy   | ITALY_BANK_ACCOUNT                         | The bank account number (Italy specific)                    |
| Italy   | ITALY_DRIVING_LICENSE                      | The driver license number (Italy specific)                  |
| Italy   | ITALY_FISCAL_CODE                          | The identifier number, also known as Italian Codice Fiscale |
| Italy   | ITALY_PASSPORT_NUMBER                      | The passport number (Italy specific)                        |
| Italy   | ITALY_VALUE_ADDED_TAX                      | Value-Added Tax (Italy specific)                            |
| Japan        | JAPAN_BANK_ACCOUNT                         | The bank account number (Japan specific)                     |
| Japan        | JAPAN_DRIVING_LICENSE                      | The driver license number (Japan specific)                   |
| Japan        | JAPAN_MY_NUMBER                            | The identifier number (Japan specific)                       |
| Japan        | JAPAN_PASSPORT_NUMBER                      | The passport number (Japan specific)                         |
| Korea        | KOREA_PASSPORT_NUMBER                      | The passport number (Korea specific)                         |
| Korea        | KOREA_RESIDENCE_REGISTRATION_NUMBER_FOR_CITIZENS | Korea residence registrant number for citizens      |
| Korea        | KOREA_RESIDENCE_REGISTRATION_NUMBER_FOR_FOREIGNERS | Korea residence registrant number for foreigners    |
| Kosovo       | KOSOVO_UNIQUE_MASTER_CITIZEN_NUMBER        | The unique citizen number (Kosovo specific)                  |
| Latvia       | LATVIA_DRIVING_LICENSE                     | The driver license number (Latvia specific)                  |
| Latvia       | LATVIA_PASSPORT_NUMBER                     | The passport number (Latvia specific)                        |
| Latvia       | LATVIA_PERSONAL_IDENTIFICATION_NUMBER      | The personal identifier number (Latvia specific)             |
| Latvia       | LATVIA_VALUE_ADDED_TAX                     | Value-Added Tax (Latvia specific)                            |
| Liechtenstein | LIECHTENSTEIN_NATIONAL_IDENTIFICATION_NUMBER | The national identifier (Liechtenstein specific)             |
| Liechtenstein | LIECHTENSTEIN_PASSPORT_NUMBER               | The passport number (Liechtenstein specific)                 |
| Liechtenstein | LIECHTENSTEIN_TAX_IDENTIFICATION_NUMBER     | Tax identification number (Liechtenstein specific)           |
| Lithuania    | LITHUANIA_DRIVING_LICENSE                  | The driver license number (Lithuania specific)               |
| Lithuania    | LITHUANIA_PERSONAL_IDENTIFICATION_NUMBER   | The personal identifier number (Lithuania specific)          |
| Lithuania    | LITHUANIA_TAX_IDENTIFICATION_NUMBER        | Tax identification number (Lithuania specific)               |
| Lithuania    | LITHUANIA_VALUE_ADDED_TAX                  | Value-Added Tax (Lithuania specific)                          |
| Luxembourg   | LUXEMBOURG_DRIVING_LICENSE                 | The driver license number (Luxembourg specific)              |
| Luxembourg   | LUXEMBOURG_NATIONAL_INDIVIDUAL_NUMBER       | The national identifier (Luxembourg specific)                |
| Luxembourg   | LUXEMBOURG_PASSPORT_NUMBER                 | The passport number (Luxembourg specific)                    |
| Luxembourg   | LUXEMBOURG_TAX_IDENTIFICATION_NUMBER       | Tax identification number (Luxembourg specific)              |
| Luxembourg   | LUXEMBOURG_VALUE_ADDED_TAX                 | Value-Added Tax (Luxembourg specific)                         |
| Macedonia    | MACEDONIA_UNIQUE_MASTER_CITIZEN_NUMBER     | The unique citizen number (Macedonia specific)               |
| Malaysia     | MALAYSIA_MYKAD_NUMBER                      | The national identifier (Malaysia specific)                  |
| Malaysia     | MALAYSIA_PASSPORT_NUMBER                   | The passport number (Malaysia specific)                      |
| Malta        | MALTA_DRIVING_LICENSE                      | The driver license number (Malta specific)                   |
| Malta        | MALTA_NATIONAL_IDENTIFICATION_NUMBER       | The national identifier (Malta specific)                     |
| Malta        | MALTA_TAX_IDENTIFICATION_NUMBER            | Tax identification number (Malta specific)                   |
| Malta        | MALTA_VALUE_ADDED_TAX                      | Value-Added Tax (Malta specific)                              |
| Mexico       | MEXICO_CLABE_NUMBER                        | Mexico CLABE (Clave Bancaria Estandarizada) bank number       |
| Mexico       | MEXICO_DRIVING_LICENSE                     | The driver license number (Mexico specific)                  |
| Mexico       | MEXICO_PASSPORT_NUMBER                     | The passport number (Mexico specific)                        |
| Mexico       | MEXICO_TAX_IDENTIFICATION_NUMBER           | Tax identification number (Mexico specific)                  |
| Mexico       | MEXICO_UNIQUE_POPULATION_REGISTRY_CODE     | The Clave Única de Registro de Población (CURP) unique identity code for Mexico |
| Montenegro   | MONTENEGRO_UNIQUE_MASTER_CITIZEN_NUMBER    | The unique citizen number (Montenegro specific)              |
| Netherlands  | NETHERLANDS_BANK_ACCOUNT                 | The bank account number (Netherlands specific)               |
| Netherlands  | NETHERLANDS_CITIZEN_SERVICE_NUMBER       | Netherlands citizen number (BSN, burgerservicenummer)         |
| Netherlands  | NETHERLANDS_DRIVING_LICENSE              | The driver license number (Netherlands specific)             |
| Netherlands  | NETHERLANDS_PASSPORT_NUMBER              | The passport number (Netherlands specific)                    |
| Netherlands  | NETHERLANDS_TAX_IDENTIFICATION_NUMBER    | Tax identification number (Netherlands specific)              |
| Netherlands  | NETHERLANDS_VALUE_ADDED_TAX              | Value-Added Tax (Netherlands specific)                         |
| New Zealand  | NEW_ZEALAND_DRIVING_LICENSE              | The driver license number (New Zealand specific)              |
| New Zealand  | NEW_ZEALAND_NATIONAL_HEALTH_INDEX_NUMBER | New Zealand health insurance number                           |
| New Zealand  | NEW_ZEALAND_TAX_IDENTIFICATION_NUMBER    | Tax identification number, also known as inland revenue number|
| Norway       | NORWAY_BIRTH_NUMBER                      | Norwegian national identity number                            |
| Norway       | NORWAY_DRIVING_LICENSE                   | The driver license number (Norway specific)                    |
| Norway       | NORWAY_HEALTH_INSURANCE_NUMBER           | Norway health insurance number                                |
| Norway       | NORWAY_NATIONAL_IDENTIFICATION_NUMBER    | The national identifier number (Norway specific)               |
| Norway       | NORWAY_VALUE_ADDED_TAX                   | Value-Added Tax (Norway specific)                              |
| Philippines  | PHILIPPINES_DRIVING_LICENSE              | The driver license number (Philippines specific)              |
| Philippines  | PHILIPPINES_PASSPORT_NUMBER              | The passport number (Philippines specific)                     |
| Poland       | POLAND_DRIVING_LICENSE                   | The driver license number (Poland specific)                    |
| Poland       | POLAND_IDENTIFICATION_NUMBER             | The Poland identifier                                         |
| Poland       | POLAND_PASSPORT_NUMBER                   | The passport number (Poland specific)                           |
| Poland       | POLAND_REGON_NUMBER                      | The REGON identifier number, also known as the Statistical ID   |
| Poland       | POLAND_SSN                               | The social security number (for Poland persons)                |
| Poland       | POLAND_TAX_IDENTIFICATION_NUMBER         | Tax identification number (Poland specific)                     |
| Poland       | POLAND_VALUE_ADDED_TAX                   | Value-Added Tax (Poland specific)                               |
| Portugal     | PORTUGAL_DRIVING_LICENSE                 | The driver license number (Portugal specific)                  |
| Portugal     | PORTUGAL_NATIONAL_IDENTIFICATION_NUMBER  | The national identifier number (Portugal specific)             |
| Portugal     | PORTUGAL_PASSPORT_NUMBER                 | The passport number (Portugal specific)                         |
| Portugal     | PORTUGAL_TAX_IDENTIFICATION_NUMBER       | Tax identification number (Portugal specific)                   |
| Portugal     | PORTUGAL_VALUE_ADDED_TAX                 | Value-Added Tax (Portugal specific)                             |
| Romania   | ROMANIA_DRIVING_LICENSE                  | The driver license number (Romania specific)              |
| Romania   | ROMANIA_NUMERICAL_PERSONAL_CODE           | The personal identifier number (Romania specific)         |
| Romania   | ROMANIA_PASSPORT_NUMBER                   | The passport number (Romania specific)                     |
| Romania   | ROMANIA_VALUE_ADDED_TAX                   | Value-Added Tax (Romania specific)                         |
| Serbia    | SERBIA_UNIQUE_MASTER_CITIZEN_NUMBER       | The unique citizen number (Serbia specific)                |
| Serbia    | SERBIA_VALUE_ADDED_TAX                    | Value-Added Tax (Serbia specific)                          |
| Serbia    | VOJVODINA_UNIQUE_MASTER_CITIZEN_NUMBER    | The unique citizen number for Vojvodina (Serbia specific)  |
| Singapore | SINGAPORE_DRIVING_LICENSE                 | The driver license number (Singapore specific)            |
| Singapore | SINGAPORE_NATIONAL_REGISTRY_IDENTIFICATION_NUMBER | The national registration identity card for Singapore |
| Singapore | SINGAPORE_PASSPORT_NUMBER                 | The passport number (Singapore specific)                   |
| Singapore | SINGAPORE_UNIQUE_ENTITY_NUMBER            | The unique entity number (Singapore specific)             |
| Slovakia  | SLOVAKIA_DRIVING_LICENSE                  | The driver license number (Slovakia specific)              |
| Slovakia  | SLOVAKIA_NATIONAL_IDENTIFICATION_NUMBER   | The national identifier number (Slovakia specific)         |
| Slovakia  | SLOVAKIA_PASSPORT_NUMBER                  | The passport number (Slovakia specific)                    |
| Slovakia  | SLOVAKIA_VALUE_ADDED_TAX                  | Value-Added Tax (Slovakia specific)                        |
| Slovenia  | SLOVENIA_DRIVING_LICENSE                  | The driver license number (Slovenia specific)              |
| Slovenia  | SLOVENIA_PASSPORT_NUMBER                  | The passport number (Slovenia specific)                    |
| Slovenia  | SLOVENIA_TAX_IDENTIFICATION_NUMBER        | Tax identification number (Slovenia specific)              |
| Slovenia  | SLOVENIA_UNIQUE_MASTER_CITIZEN_NUMBER     | Unique master citizen number (JMBG) for Slovenia citizens  |
| Slovenia  | SLOVENIA_VALUE_ADDED_TAX                  | Value-Added Tax (Slovenia specific)                        |
| South Africa | SOUTH_AFRICA_PERSONAL_IDENTIFICATION_NUMBER | The personal identifier number (South Africa specific) |
| Spain     | SPAIN_DNI                                | The national identity card (Documento Nacional de Identidad) of Spain |
| Spain     | SPAIN_DRIVING_LICENSE                    | The driver license number (Spain specific)                |
| Spain     | SPAIN_PASSPORT_NUMBER                    | The passport number (Spain specific)                       |
| Spain     | SPAIN_SSN                                | The social security number (for Spain persons)            |
| Spain     | SPAIN_TAX_IDENTIFICATION_NUMBER          | Tax identification number (Spain specific)                |
| Spain     | SPAIN_VALUE_ADDED_TAX                    | Value-Added Tax (Spain specific)                           |
| Sri Lanka | SRI_LANKA_NATIONAL_IDENTIFICATION_NUMBER | The national identifier (Sri Lanka specific)               |
| Sweden    | SWEDEN_DRIVING_LICENSE                   | The driver license number (Sweden specific)               |
| Sweden    | SWEDEN_PASSPORT_NUMBER                    | The passport number (Sweden specific)                      |
| Sweden    | SWEDEN_PERSONAL_IDENTIFICATION_NUMBER     | The national identifier number (Sweden specific)           |
| Sweden    | SWEDEN_TAX_IDENTIFICATION_NUMBER          | Sweden Tax Identification Number (personnummer)            |
| Sweden    | SWEDEN_VALUE_ADDED_TAX                   | Value-Added Tax (Sweden specific)                          |
| Switzerland | SWITZERLAND_AHV                         | The social security number for Swiss persons (AHV)         |
| Switzerland | SWITZERLAND_HEALTH_INSURANCE_NUMBER      | Swiss health insurance number                             |
| Switzerland | SWITZERLAND_PASSPORT_NUMBER              | The passport number (Switzerland specific)                 |
| Switzerland | SWITZERLAND_VALUE_ADDED_TAX              | Value-Added Tax (Switzerland specific)                     |
| Thailand       | THAILAND_PASSPORT_NUMBER                   | The passport number (Thailand specific)                                                           |
| Thailand       | THAILAND_PERSONAL_IDENTIFICATION_NUMBER    | The personal identifier number (Thailand specific)                                                |
| Turkey         | TURKEY_NATIONAL_IDENTIFICATION_NUMBER      | The national identifier number (Turkey specific)                                                  |
| Turkey         | TURKEY_PASSPORT_NUMBER                     | The passport number (Turkey specific)                                                             |
| Turkey         | TURKEY_VALUE_ADDED_TAX                     | Value-Added Tax (Turkey specific)                                                                 |
| United Kingdom | UK_BANK_ACCOUNT                            | The bank account number (UK specific)                                                             |
| United Kingdom | UK_BANK_SORT_CODE                          | A sort code is a 6 digit number that identifies bank. (UK specific)                                |
| United Kingdom | UK_DRIVING_LICENSE                         | The driver license number (UK specific)                                                           |
| United Kingdom | UK_ELECTORAL_ROLL_NUMBER                    | The electroral register roll number                                                               |
| United Kingdom | UK_NATIONAL_HEALTH_SERVICE_NUMBER          | The national health service number                                                               |
| United Kingdom | UK_NATIONAL_INSURANCE_NUMBER                | The national insurance number (UK specific)                                                       |
| United Kingdom | UK_PASSPORT_NUMBER                         | The passport number (UK specific)                                                                 |
| United Kingdom | UK_PHONE_NUMBER                            | The phone number (UK specific)                                                                    |
| United Kingdom | UK_UNIQUE_TAXPAYER_REFERENCE_NUMBER        | The unique tax payer number (UK specific)                                                         |
| United Kingdom | UK_VALUE_ADDED_TAX                         | Value-Added Tax (UK specific)                                                                     |
| Ukraine                       | UKRAINE_INDIVIDUAL_IDENTIFICATION_NUMBER        | The unique identifier (Ukraine specific)                                                                         |
| Ukraine                       | UKRAINE_PASSPORT_NUMBER_DOMESTIC                | The domestic passport number (Ukraine specific)                                                                  |
| Ukraine                       | UKRAINE_PASSPORT_NUMBER_INTERNATIONAL           | The international passport number (Ukraine specific)                                                             |
| United Arab Emirates (UAE)    | UNITED_ARAB_EMIRATES_PERSONAL_NUMBER            | The personal identifier number (UAE specific)                                                                    |
| United States of America (USA)| USA_SSN                                        | The social security number (USA specific)                                                                        |
| United States of America (USA)| USA_ATIN                                       | The Adoption Taxpayer Identification Number (USA specific)                                                      |
| United States of America (USA)| USA_ITIN                                       | The Individual Taxpayer Identification Number (USA specific)                                                    |
| United States of America (USA)| USA_PTIN                                       | The Preparer Tax Identification Number (USA specific)                                                            |
| United States of America (USA)| USA_PASSPORT_NUMBER                            | The passport number (USA specific)                                                                               |
| United States of America (USA)| USA_DRIVING_LICENSE                           | The driver license card ID (USA specific)                                                                        |
| United States of America (USA)| USA_DEA_NUMBER                                 | The DEA number (DEA Registration Number) assigned to a healthcare provider (USA specific)                       |
| United States of America (USA)| USA_HCPCS_CODE                                 | The Healthcare Common Procedure Coding System (HCPCS) Codes (USA specific)                                       |
| United States of America (USA)| USA_NATIONAL_PROVIDER_IDENTIFIER               | The NPI is a unique identification number for covered healthcare providers (USA specific)                        |
| United States of America (USA)| USA_NATIONAL_DRUG_CODE                         | The universal product identifier for human drugs in the United States (USA specific)                             |
| United States of America (USA)| USA_HEALTH_INSURANCE_CLAIM_NUMBER              | The identifier assigned to a health insurance claim submitted by a healthcare provider (USA specific)            |
| United States of America (USA)| USA_MEDICARE_BENEFICIARY_IDENTIFIER            | The Medicare beneficiary's identification number (USA specific)                                                 |
| United States of America (USA)| USA_CPT_CODE                                   | The Current Procedural Terminology (USA specific)                                                                |
| Venezuela                     | VENEZUELA_DRIVING_LICENSE                      | The driver license number (Venezuela specific)                                                                   |
| Venezuela                     | VENEZUELA_NATIONAL_IDENTIFICATION_NUMBER       | The national identifier number (Venezuela specific)                                                             |
| Venezuela                     | VENEZUELA_VALUE_ADDED_TAX                      | Value-Added Tax (Venezuela specific)                                                                             |