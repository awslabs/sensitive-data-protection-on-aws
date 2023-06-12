# Appendix - Built-in data identifiers

此解决方案使用机器学习和模式匹配技术来检测敏感数据。方案内置200多个通用和基于国家分类的数据类型。

!!! Info "更多信息"
    有一些内置数据标识符（人名和地址）是基于 AI模型定义的，有一些是基于 Regex/关键字进行定义的。

## 通用的数据标识符
| 数据标识符    | 描述                                         |
|--------------|-----------------------------------------------------|
| PERSON_NAME  | 人名（英语/拉丁语特定）                                 |
| EMAIL        | 电子邮件地址                                          |
| DATE         | 一般格式的日期                                          |
| PHONE_NUMBER | 电话号码（主要是美国）                                  |
| BANK_ACCOUNT | 银行卡（主要是美国和加拿大特定）                          |
| CREDIT_CARD  | 信用卡号码（主要是美国/通用格式）                        |
| IP_ADDRESS   | IP地址                                             |
| MAC_ADDRESS  | Mac地址                                            |


## 按国家分类的数据标识符
(以下按国家英文字母排序)

| 国家 | 数据标识符 | 描述 |
| --- | --- | --- |
| 阿根廷 | ARGENTINA_TAX_IDENTIFICATION_NUMBER | 阿根廷税务识别号，也称为CUIT或CUIL |
| 澳大利亚 | AUSTRALIA_BUSINESS_NUMBER | 澳大利亚商业号（ABN）。澳大利亚商业登记处（ABR）颁发的唯一标识符，用于识别企业向政府和社区报告。 |
| 澳大利亚 | AUSTRALIA_COMPANY_NUMBER | 澳大利亚公司号（ACN）。澳大利亚证券和投资委员会颁发的唯一标识符。 |
| 澳大利亚 | AUSTRALIA_DRIVING_LICENSE | 驾驶执照号码（澳大利亚特定） |
| 澳大利亚 | AUSTRALIA_MEDICARE_NUMBER | 澳大利亚医疗保险号码。澳大利亚卫生保险委员会颁发的个人标识符。 |
| 澳大利亚 | AUSTRALIA_PASSPORT_NUMBER | 护照号码（澳大利亚特定） |
| 澳大利亚 | AUSTRALIA_TAX_FILE_NUMBER | 澳大利亚税务文件号码（TFN）。澳大利亚税务局（ATO）向纳税人（个人、公司等）颁发，用于税务交易。 |
| 奥地利 | AUSTRIA_DRIVING_LICENSE | 驾驶执照号码（奥地利特定） |
| 奥地利 | AUSTRIA_PASSPORT_NUMBER | 护照号码（奥地利特定） |
| 奥地利 | AUSTRIA_SSN | 奥地利社会保障号码（奥地利公民） |
| 奥地利 | AUSTRIA_TAX_IDENTIFICATION_NUMBER | 税务识别号码（奥地利特定） |
| 奥地利 | AUSTRIA_VALUE_ADDED_TAX | 增值税（奥地利特定） |
| 比利时 | BELGIUM_DRIVING_LICENSE | 驾驶执照号码（比利时特定） |
| 比利时 | BELGIUM_NATIONAL_IDENTIFICATION_NUMBER | 比利时国民号码（BNN） |
| 比利时 | BELGIUM_PASSPORT_NUMBER | 护照号码（比利时特定） |
| 比利时 | BELGIUM_TAX_IDENTIFICATION_NUMBER | 税务识别号码（比利时特定） |
| 比利时 | BELGIUM_VALUE_ADDED_TAX | 增值税（比利时特定） |
| 波斯尼亚 | BOSNIA_UNIQUE_MASTER_CITIZEN_NUMBER | 波斯尼亚-黑塞哥维那公民的唯一主公民号码（JMBG） |
| 巴西 | BRAZIL_BANK_ACCOUNT | 银行账号（巴西特定） |
| 巴西 | BRAZIL_NATIONAL_IDENTIFICATION_NUMBER | 国家识别号码（巴西特定） |
| 巴西 | BRAZIL_NATIONAL_REGISTRY_OF_LEGAL_ENTITIES_NUMBER | 颁发给公司的标识号码（巴西特定），也称为CNPJ |
| 巴西 | BRAZIL_NATURAL_PERSON_REGISTRY_NUMBER | 颁发给个人的标识号码（巴西特定） |
| 保加利亚 | BULGARIA_DRIVING_LICENSE | 驾驶执照号码（保加利亚特定） |
| 保加利亚 | BULGARIA_UNIFORM_CIVIL_NUMBER | 统一民事号码（EGN），用作国家识别号码 |
| 保加利亚 | BULGARIA_VALUE_ADDED_TAX | 增值税（保加利亚特定） |
| 加拿大 | CANADA_DRIVING_LICENSE | 驾照号码（加拿大特有） |
| 加拿大 | CANADA_GOVERNMENT_IDENTIFICATION_CARD_NUMBER | 国家标识号码（加拿大特有） |
| 加拿大 | CANADA_PASSPORT_NUMBER | 护照号码（加拿大特有） |
| 加拿大 | CANADA_PERMANENT_RESIDENCE_NUMBER | 永久居民卡号码 |
| 加拿大 | CANADA_PERSONAL_HEALTH_NUMBER | 医保号码（PHN号码） |
| 加拿大 | CANADA_SOCIAL_INSURANCE_NUMBER | 加拿大社会保险号码（SIN） |
| 智利 | CHILE_DRIVING_LICENSE | 驾照号码（智利特有） |
| 智利 | CHILE_NATIONAL_IDENTIFICATION_NUMBER | 智利身份证号码，也称为RUT或RUN |
| 中国和地区 | CHINA_IDENTIFICATION | 身份证号码（中国特有） |
| 中国和地区 | CHINA_PHONE_NUMBER | 手机或固定电话号码（中国特有） |
| 中国和地区 | CHINA_PASSPORT_NUMBER | 护照号码（中国特有） |
| 中国和地区 | CHINA_LICENSE_PLATE_NUMBER | 车牌号码（中国特有） |
| 中国和地区 | CHINA_MAINLAND_TRAVEL_PERMIT_ID_TAIWAN | 台湾居民赴大陆通行证号码 |
| 中国和地区 | CHINA_MAINLAND_TRAVEL_PERMIT_ID_HONG_KONG_MACAU | 香港和澳门居民赴大陆通行证号码 |
| 中国和地区 | HONG_KONG_IDENTITY_CARD | 香港身份证号码 |
| 中国和地区 | MACAU_RESIDENT_IDENTITY_CARD | 澳门身份证号码 |
| 中国和地区 | TAIWAN_NATIONAL_IDENTIFICATION_NUMBER | 台湾身份证号码 |
| 中国和地区 | TAIWAN_PASSPORT_NUMBER | 台湾护照号码 |
| 中国和地区 | CHINA_CHINESE_NAME | 用于识别中文姓名的基于AI的标识符（内置） |
| 中国和地区 | CHINA_ADDRESS | 用于识别中文地址的基于AI的标识符（内置） |
| 中国和地区 | CHINA_NATIONALITY | 用于识别中国国籍的基于正则表达式的标识符（内置） |
| 中国和地区 | CHINA_BANK_CARD | 用于识别中国银行卡号码的基于正则表达式的标识符（内置） |
| 中国和地区 | CHINA_MARITAL_STATUS | 用于识别婚姻状态的基于正则表达式的标识符（内置） |
| 中国和地区 | CHINA_POLITICAL_PARTY | 用于识别中国政治党派的基于正则表达式的标识符（内置） |
| 中国和地区 | CHINA_PROVINCE | 用于识别中国省份的基于正则表达式的标识符（内置） |
| 中国和地区 | CHINA_GENDER | 用于识别性别的基于正则表达式的标识符（内置） |
| 中国和地区 | CHINA_ID_TYPE | 用于识别证件类型的基于正则表达式的标识符（内置） |
| 哥伦比亚 | COLOMBIA_PERSONAL_IDENTIFICATION_NUMBER | 哥伦比亚人出生时分配的唯一标识符 |
| 哥伦比亚 | COLOMBIA_TAX_IDENTIFICATION_NUMBER | 税务身份证号码（哥伦比亚特有） |
| 克罗地亚 | CROATIA_DRIVING_LICENSE | 驾照号码（克罗地亚特有） |
|克罗地亚 | CROATIA_IDENTITY_NUMBER | 国家标识号码（克罗地亚特有） |
| 克罗地亚 | CROATIA_PASSPORT_NUMBER | 护照号码（克罗地亚特有） |
| 克罗地亚 | CROATIA_PERSONAL_IDENTIFICATION_NUMBER | 个人标识号码（OIB） |
| 塞浦路斯 | CYPRUS_DRIVING_LICENSE | 驾照号码（塞浦路斯特有） |
| 塞浦路斯 | CYPRUS_NATIONAL_IDENTIFICATION_NUMBER | 塞浦路斯身份证 |
| 塞浦路斯 | CYPRUS_PASSPORT_NUMBER | 护照号码（塞浦路斯特有） |
| 塞浦路斯 | CYPRUS_TAX_IDENTIFICATION_NUMBER | 税务身份证号码（塞浦路斯特有） |
| 塞浦路斯 | CYPRUS_VALUE_ADDED_TAX | 增值税（塞浦路斯特有） |
| 捷克 | CZECHIA_DRIVING_LICENSE | 驾照号码（捷克特有） |
| 捷克 | CZECHIA_PERSONAL_IDENTIFICATION_NUMBER | 个人标识号码（捷克特有） |
| 捷克 | CZECHIA_VALUE_ADDED_TAX | 增值税（捷克特有） |
| 丹麦 | DENMARK_DRIVING_LICENSE | 驾照号码（丹麦特有） |
| 丹麦 | DENMARK_PERSONAL_IDENTIFICATION_NUMBER | 个人标识号码（丹麦特有） |
| 丹麦 | DENMARK_TAX_IDENTIFICATION_NUMBER | 税务身份证号码（丹麦特有） |
| 丹麦 | DENMARK_VALUE_ADDED_TAX | 增值税（丹麦特有） |
| 爱沙尼亚 | ESTONIA_DRIVING_LICENSE | 驾照号码（爱沙尼亚特有） |
| 爱沙尼亚 | ESTONIA_PASSPORT_NUMBER | 护照号码（爱沙尼亚特有） |
| 爱沙尼亚 | ESTONIA_PERSONAL_IDENTIFICATION_CODE | 个人标识号码（爱沙尼亚特有） |
| 爱沙尼亚 | ESTONIA_VALUE_ADDED_TAX | 增值税（爱沙尼亚特有） |
| 芬兰 | FINLAND_DRIVING_LICENSE | 驾照号码（芬兰特有） |
| 芬兰 | FINLAND_HEALTH_INSURANCE_NUMBER | 医疗保险号码（芬兰特有） |
| 芬兰 | FINLAND_NATIONAL_IDENTIFICATION_NUMBER | 国家标识号码（芬兰特有） |
| 芬兰 | FINLAND_PASSPORT_NUMBER | 护照号码（芬兰特有） |
| 芬兰 | FINLAND_VALUE_ADDED_TAX | 增值税（芬兰特有） |
| 法国 | FRANCE_BANK_ACCOUNT | 银行账号（法国特有） |
| 法国 | FRANCE_DRIVING_LICENSE | 驾照号码（法国特有） |
| 法国 | FRANCE_HEALTH_INSURANCE_NUMBER | 法国医疗保险号码 |
| 法国 | FRANCE_INSEE_CODE | 法国社会保障号码或国民身份证号码 |
| 法国 | FRANCE_NATIONAL_IDENTIFICATION_NUMBER | 法国国家标识号码（CNI） |
| 法国 | FRANCE_PASSPORT_NUMBER | 护照号码（法国特有） |
| 法国 | FRANCE_TAX_IDENTIFICATION_NUMBER | 税务身份证号码（法国特有） |
| 法国 | FRANCE_VALUE_ADDED_TAX | 增值税（法国特有）
| 德国    | GERMANY_BANK_ACCOUNT                    | 德国银行账号                                     |
| 德国    | GERMANY_DRIVING_LICENSE                 | 德国驾照号码                                     |
| 德国    | GERMANY_PASSPORT_NUMBER                 | 德国护照号码                                     |
| 德国    | GERMANY_PERSONAL_IDENTIFICATION_NUMBER  | 德国个人身份证号码                                 |
| 德国    | GERMANY_TAX_IDENTIFICATION_NUMBER       | 德国税务登记号码                                   |
| 德国    | GERMANY_VALUE_ADDED_TAX                 | 德国增值税                                       |
| 希腊    | GREECE_DRIVING_LICENSE                  | 希腊驾照号码                                     |
| 希腊    | GREECE_PASSPORT_NUMBER                  | 希腊护照号码                                     |
| 希腊    | GREECE_SSN                             | 希腊社会保障号码                                   |
| 希腊    | GREECE_TAX_IDENTIFICATION_NUMBER        | 希腊税务登记号码                                   |
| 希腊    | GREECE_VALUE_ADDED_TAX                  | 希腊增值税                                       |
| 匈牙利  | HUNGARY_DRIVING_LICENSE                 | 匈牙利驾照号码                                   |
| 匈牙利  | HUNGARY_PASSPORT_NUMBER                 | 匈牙利护照号码                                   |
| 匈牙利  | HUNGARY_SSN                            | 匈牙利社会保障号码                                 |
| 匈牙利  | HUNGARY_TAX_IDENTIFICATION_NUMBER       | 匈牙利税务登记号码                                 |
| 匈牙利  | HUNGARY_VALUE_ADDED_TAX                 | 匈牙利增值税                                     |
| 冰岛    | ICELAND_NATIONAL_IDENTIFICATION_NUMBER  | 冰岛国民身份证号码                                 |
| 冰岛    | ICELAND_PASSPORT_NUMBER                 | 冰岛护照号码                                     |
| 冰岛    | ICELAND_VALUE_ADDED_TAX                 | 冰岛增值税                                       |
| 印度    | INDIA_AADHAAR_NUMBER                    | 印度Aadhaar身份证号码                             |
| 印度    | INDIA_PERMANENT_ACCOUNT_NUMBER          | 印度永久账号号码                                   |
| 印度尼西亚 | INDONESIA_IDENTITY_CARD_NUMBER          | 印度尼西亚国民身份证号码                           |
| 爱尔兰  | IRELAND_DRIVING_LICENSE                 | 爱尔兰驾照号码                                   |
| 爱尔兰  | IRELAND_PASSPORT_NUMBER                 | 爱尔兰护照号码                                   |
| 爱尔兰  | IRELAND_PERSONAL_PUBLIC_SERVICE_NUMBER  | 爱尔兰个人公共服务号码                             |
| 爱尔兰  | IRELAND_TAX_IDENTIFICATION_NUMBER       | 爱尔兰税务登记号码                                 |
| 爱尔兰  | IRELAND_VALUE_ADDED_TAX                 | 爱尔兰增值税                                     |
| 以色列  | ISRAEL_IDENTIFICATION_NUMBER            | 以色列国民身份证号码                               |
| 意大利  | ITALY_BANK_ACCOUNT                      | 意大利银行账号                                   |
| 意大利  | ITALY_DRIVING_LICENSE                   | 意大利驾照号码                                   |
| 意大利  | ITALY_FISCAL_CODE                       | 意大利税务登记号码                                 |
| 意大利  | ITALY_PASSPORT_NUMBER                   | 意大利护照号码                                   |
| 意大利  | ITALY_VALUE_ADDED_TAX                   | 意大利增值税                                     |
|   日本   |     JAPAN_BANK_ACCOUNT     |                 银行账号（日本特有）                 |
|   日本   |    JAPAN_DRIVING_LICENSE    |              驾驶执照号码（日本特有）              |
|   日本   |       JAPAN_MY_NUMBER       |              身份识别号码（日本特有）              |
|   日本   |   JAPAN_PASSPORT_NUMBER    |              护照号码（日本特有）              |
|   韩国   |   KOREA_PASSPORT_NUMBER    |              护照号码（韩国特有）              |
|   韩国   | KOREA_RESIDENCE_REGISTRATION_NUMBER_FOR_CITIZENS | 居民登记号码（韩国特有） |
|   韩国   | KOREA_RESIDENCE_REGISTRATION_NUMBER_FOR_FOREIGNERS | 外国人登记号码（韩国特有） |
|  科索沃  | KOSOVO_UNIQUE_MASTER_CITIZEN_NUMBER | 唯一公民号码（科索沃特有） |
|   拉脱维亚   |      LATVIA_DRIVING_LICENSE      |           驾驶执照号码（拉脱维亚特有）           |
|   拉脱维亚   |     LATVIA_PASSPORT_NUMBER      |              护照号码（拉脱维亚特有）              |
|   拉脱维亚   | LATVIA_PERSONAL_IDENTIFICATION_NUMBER | 个人识别号码（拉脱维亚特有） |
|   拉脱维亚   |         LATVIA_VALUE_ADDED_TAX          |            增值税（拉脱维亚特有）            |
| 列支敦士登 | LIECHTENSTEIN_NATIONAL_IDENTIFICATION_NUMBER |   国家识别号码（列支敦士登特有）   |
| 列支敦士登 |       LIECHTENSTEIN_PASSPORT_NUMBER       |          护照号码（列支敦士登特有）          |
| 列支敦士登 |     LIECHTENSTEIN_TAX_IDENTIFICATION_NUMBER      |         税务识别号码（列支敦士登特有）         |
|   立陶宛   |      LITHUANIA_DRIVING_LICENSE       |           驾驶执照号码（立陶宛特有）           |
|   立陶宛   | LITHUANIA_PERSONAL_IDENTIFICATION_NUMBER | 个人识别号码（立陶宛特有） |
|   立陶宛   |    LITHUANIA_TAX_IDENTIFICATION_NUMBER     |        税务识别号码（立陶宛特有）        |
|   立陶宛   |         LITHUANIA_VALUE_ADDED_TAX         |            增值税（立陶宛特有）            |
| 卢森堡 |      LUXEMBOURG_DRIVING_LICENSE       |           驾驶执照号码（卢森堡特有）           |
| 卢森堡 | LUXEMBOURG_NATIONAL_INDIVIDUAL_NUMBER |   国家识别号码（卢森堡特有）   |
| 卢森堡 |       LUXEMBOURG_PASSPORT_NUMBER       |          护照号码（卢森堡特有）          |
| 卢森堡 |     LUXEMBOURG_TAX_IDENTIFICATION_NUMBER      |         税务识别号码（卢森堡特有）         |
| 卢森堡 |         LUXEMBOURG_VALUE_ADDED_TAX         |            增值税（卢森堡特有）            |
| 马其顿 | MONTENEGRO_UNIQUE_MASTER_CITIZEN_NUMBER |        唯一公民号码（马其顿特有）        |
|   马来西亚   |         MALAYSIA_MYKAD_NUMBER          |            国家识别号码（马来西亚特有）            |
|   马来西亚   |         MALAYSIA_PASSPORT_NUMBER        |                护照号码（马来西亚特有）                |
|   马耳他   |         MALTA_DRIVING_LICENSE          |            驾驶执照号码（马耳他特有）            |
|   马耳他   | MALTA_NATIONAL_IDENTIFICATION_NUMBER |   国家识别号码（马耳他特有）   |
|   马耳他   |       MALTA_TAX_IDENTIFICATION_NUMBER        |          税务识别号码（马耳他特有）          |
|   马耳他   |         MALTA_VALUE_ADDED_TAX         |            增值税（马耳他特有）            |
|   墨西哥   |            MEXICO_CLABE_NUMBER            |        墨西哥 CLABE 银行号码        |
|   墨西哥   |           MEXICO_DRIVING_LICENSE           |           驾驶执照号码（墨西哥特有）           |
|   墨西哥   |           MEXICO_PASSPORT_NUMBER           |              护照号码（墨西哥特有）              |
|   墨西哥   |        MEXICO_TAX_IDENTIFICATION_NUMBER        |         税务识别号码（墨西哥特有）         |
|   墨西哥   | MEXICO_UNIQUE_POPULATION_REGISTRY_CODE | Clave Única de Registro de Población (CURP) 墨西哥特有的唯一身份识别码 |
|  黑山共和国   | MONTENEGRO_UNIQUE_MASTER_CITIZEN_NUMBER | 唯一公民号码（黑山特有） |
| 荷兰         | NETHERLANDS_BANK_ACCOUNT                 | 荷兰特有的银行账号                                       |
| 荷兰         | NETHERLANDS_CITIZEN_SERVICE_NUMBER       | 荷兰公民号码（BSN，burgerservicenummer）                  |
| 荷兰         | NETHERLANDS_DRIVING_LICENSE              | 荷兰特有的驾驶执照号码                                   |
| 荷兰         | NETHERLANDS_PASSPORT_NUMBER              | 荷兰特有的护照号码                                       |
| 荷兰         | NETHERLANDS_TAX_IDENTIFICATION_NUMBER    | 荷兰特有的税务识别号                                     |
| 荷兰         | NETHERLANDS_VALUE_ADDED_TAX              | 荷兰特有的增值税                                         |
| 新西兰       | NEW_ZEALAND_DRIVING_LICENSE              | 新西兰特有的驾驶执照号码                                 |
| 新西兰       | NEW_ZEALAND_NATIONAL_HEALTH_INDEX_NUMBER | 新西兰健康保险号码                                        |
| 新西兰       | NEW_ZEALAND_TAX_IDENTIFICATION_NUMBER    | 新西兰税务识别号码，也称内陆税收号码                      |
| 挪威         | NORWAY_BIRTH_NUMBER                      | 挪威国民身份号码                                          |
| 挪威         | NORWAY_DRIVING_LICENSE                   | 挪威特有的驾驶执照号码                                   |
| 挪威         | NORWAY_HEALTH_INSURANCE_NUMBER           | 挪威健康保险号码                                          |
| 挪威         | NORWAY_NATIONAL_IDENTIFICATION_NUMBER    | 挪威特有的国家标识号码                                    |
| 挪威         | NORWAY_VALUE_ADDED_TAX                   | 挪威特有的增值税                                         |
| 菲律宾       | PHILIPPINES_DRIVING_LICENSE              | 菲律宾特有的驾驶执照号码                                 |
| 菲律宾       | PHILIPPINES_PASSPORT_NUMBER              | 菲律宾特有的护照号码                                     |
| 波兰         | POLAND_DRIVING_LICENSE                   | 波兰特有的驾驶执照号码                                   |
| 波兰         | POLAND_IDENTIFICATION_NUMBER             | 波兰标识号                                                 |
| 波兰         | POLAND_PASSPORT_NUMBER                   | 波兰特有的护照号码                                       |
| 波兰         | POLAND_REGON_NUMBER                      | 波兰统计标识号码，也称为REGON标识号                      |
| 波兰         | POLAND_SSN                               | 波兰居民社会保障号码                                       |
| 波兰         | POLAND_TAX_IDENTIFICATION_NUMBER         | 波兰特有的税务识别号                                     |
| 波兰         | POLAND_VALUE_ADDED_TAX                   | 波兰特有的增值税                                         |
| 葡萄牙       | PORTUGAL_DRIVING_LICENSE                 | 葡萄牙特有的驾驶执照号码                                 |
| 葡萄牙       | PORTUGAL_NATIONAL_IDENTIFICATION_NUMBER  | 葡萄牙特有的国家标识号码                                  |
| 葡萄牙       | PORTUGAL_PASSPORT_NUMBER                 | 葡萄牙特有的护照号码                                     |
| 葡萄牙       | PORTUGAL_TAX_IDENTIFICATION_NUMBER       | 葡萄牙特有的税务识别号                                   |
| 葡萄牙       | PORTUGAL_VALUE_ADDED_TAX                 | 葡萄牙特有的增值税                                       |
| 罗马尼亚 | ROMANIA_DRIVING_LICENSE                 | 驾驶执照号码（罗马尼亚特有）                     |
| 罗马尼亚 | ROMANIA_NUMERICAL_PERSONAL_CODE          | 个人身份证明号码（罗马尼亚特有）               |
| 罗马尼亚 | ROMANIA_PASSPORT_NUMBER                  | 护照号码（罗马尼亚特有）                         |
| 罗马尼亚 | ROMANIA_VALUE_ADDED_TAX                  | 增值税（罗马尼亚特有）                         |
| 塞尔维亚 | SERBIA_UNIQUE_MASTER_CITIZEN_NUMBER      | 唯一公民身份证号码（塞尔维亚特有）             |
| 塞尔维亚 | SERBIA_VALUE_ADDED_TAX                   | 增值税（塞尔维亚特有）                         |
| 塞尔维亚 | VOJVODINA_UNIQUE_MASTER_CITIZEN_NUMBER   | Voyvodina地区唯一公民身份证号码（塞尔维亚特有）|
| 新加坡   | SINGAPORE_DRIVING_LICENSE                | 驾驶执照号码（新加坡特有）                      |
| 新加坡   | SINGAPORE_NATIONAL_REGISTRY_IDENTIFICATION_NUMBER | 新加坡国家注册身份证号码 |
| 新加坡   | SINGAPORE_PASSPORT_NUMBER                | 护照号码（新加坡特有）                          |
| 新加坡   | SINGAPORE_UNIQUE_ENTITY_NUMBER           | 唯一实体号码（新加坡特有）                      |
| 斯洛伐克 | SLOVAKIA_DRIVING_LICENSE                 | 驾驶执照号码（斯洛伐克特有）                    |
| 斯洛伐克 | SLOVAKIA_NATIONAL_IDENTIFICATION_NUMBER  | 国民身份证明号码（斯洛伐克特有）              |
| 斯洛伐克 | SLOVAKIA_PASSPORT_NUMBER                 | 护照号码（斯洛伐克特有）                        |
| 斯洛伐克 | SLOVAKIA_VALUE_ADDED_TAX                 | 增值税（斯洛伐克特有）                        |
| 斯洛文尼亚 | SLOVENIA_DRIVING_LICENSE                | 驾驶执照号码（斯洛文尼亚特有）                 |
| 斯洛文尼亚 | SLOVENIA_PASSPORT_NUMBER                | 护照号码（斯洛文尼亚特有）                     |
| 斯洛文尼亚 | SLOVENIA_TAX_IDENTIFICATION_NUMBER      | 税务识别号码（斯洛文尼亚特有）                 |
| 斯洛文尼亚 | SLOVENIA_UNIQUE_MASTER_CITIZEN_NUMBER   | 斯洛文尼亚公民唯一主身份证号码（JMBG）         |
| 斯洛文尼亚 | SLOVENIA_VALUE_ADDED_TAX                | 增值税（斯洛文尼亚特有）                      |
| 南非     | SOUTH_AFRICA_PERSONAL_IDENTIFICATION_NUMBER | 个人身份证明号码（南非特有）               |
| 西班牙   | SPAIN_DNI                               | 西班牙国民身份证                                  |
| 西班牙   | SPAIN_DRIVING_LICENSE                   | 驾驶执照号码（西班牙特有）                      |
| 西班牙   | SPAIN_PASSPORT_NUMBER                   | 护照号码（西班牙特有）                          |
| 西班牙   | SPAIN_SSN                               | 社会保障号码（西班牙特有）                      |
|西班牙   | SPAIN_TAX_IDENTIFICATION_NUMBER         | 税务识别号码（西班牙特有）                      |
| 西班牙   | SPAIN_VALUE_ADDED_TAX                   | 增值税（西班牙特有）                            |
| 斯里兰卡 | SRI_LANKA_NATIONAL_IDENTIFICATION_NUMBER | 国民身份证明号码（斯里兰卡特有）                |
| 瑞典     | SWEDEN_DRIVING_LICENSE                  | 驾驶执照号码（瑞典特有）                        |
| 瑞典     | SWEDEN_PASSPORT_NUMBER                   | 护照号码（瑞典特有）                            |
| 瑞典     | SWEDEN_PERSONAL_IDENTIFICATION_NUMBER    | 国民身份证明号码（瑞典特有）                    |
| 瑞典     | SWEDEN_TAX_IDENTIFICATION_NUMBER         | 瑞典税务识别号码                |
| 瑞典     | SWEDEN_VALUE_ADDED_TAX                  | 增值税（瑞典特有）                              |
| 瑞士     | SWITZERLAND_AHV                         | 瑞士公民社会保障号码（AHV）                     |
| 瑞士     | SWITZERLAND_HEALTH_INSURANCE_NUMBER      | 瑞士医疗保险号码                                 |
| 瑞士     | SWITZERLAND_PASSPORT_NUMBER              | 护照号码（瑞士特有）                            |
| 瑞士     | SWITZERLAND_VALUE_ADDED_TAX              | 增值税（瑞士特有）                              |
| 泰国           | THAILAND_PASSPORT_NUMBER                   | 护照号码（泰国特有）                                                                             |
| 泰国           | THAILAND_PERSONAL_IDENTIFICATION_NUMBER    | 个人识别号码（泰国特有）                                                                         |
| 土耳其         | TURKEY_NATIONAL_IDENTIFICATION_NUMBER      | 国家识别号码（土耳其特有）                                                                       |
| 土耳其         | TURKEY_PASSPORT_NUMBER                     | 护照号码（土耳其特有）                                                                           |
| 土耳其         | TURKEY_VALUE_ADDED_TAX                     | 增值税（土耳其特有）                                                                             |
| 英国           | UK_BANK_ACCOUNT                            | 银行帐号号码（英国特有）                                                                         |
| 英国           | UK_BANK_SORT_CODE                          | 银行分类码是一个6位数字，用于标识银行（英国特有）                                               |
| 英国           | UK_DRIVING_LICENSE                         | 驾驶证号码（英国特有）                                                                           |
| 英国           | UK_ELECTORAL_ROLL_NUMBER                    | 选民登记卷号码                                                                                   |
| 英国           | UK_NATIONAL_HEALTH_SERVICE_NUMBER          | 全国医疗服务号码                                                                                 |
| 英国           | UK_NATIONAL_INSURANCE_NUMBER                | 国民保险号码（英国特有）                                                                         |
| 英国           | UK_PASSPORT_NUMBER                         | 护照号码（英国特有）                                                                             |
| 英国           | UK_PHONE_NUMBER                            | 电话号码（英国特有）                                                                             |
| 英国           | UK_UNIQUE_TAXPAYER_REFERENCE_NUMBER        | 唯一纳税人编号（英国特有）                                                                       |
| 英国           | UK_VALUE_ADDED_TAX                         | 增值税（英国特有）                                                                               |
| 乌克兰         | UKRAINE_INDIVIDUAL_IDENTIFICATION_NUMBER        | 独特的标识符（乌克兰特有）                             |
| 乌克兰         | UKRAINE_PASSPORT_NUMBER_DOMESTIC                | 国内护照号码（乌克兰特有）                             |
| 乌克兰         | UKRAINE_PASSPORT_NUMBER_INTERNATIONAL           | 国际护照号码（乌克兰特有）                             |
| 阿联酋         | UNITED_ARAB_EMIRATES_PERSONAL_NUMBER            | 个人识别号码（阿联酋特有）                             |
| 美国           | USA_SSN                                        | 社会安全号码（美国特有）                               |
| 美国           | USA_ATIN                                       | 领养纳税人识别号（美国特有）                           |
| 美国           | USA_ITIN                                       | 个人纳税人识别号（美国特有）                           |
| 美国           | USA_PTIN                                       | 准备人纳税人识别号（美国特有）                         |
| 美国           | USA_PASSPORT_NUMBER                            | 护照号码（美国特有）                                   |
| 美国           | USA_DRIVING_LICENSE                           | 驾驶执照卡ID（美国特有）                              |
| 美国           | USA_DEA_NUMBER                                 | 分配给医疗保健提供者的DEA号码（DEA注册号码）（美国特有）|
| 美国           | USA_HCPCS_CODE                                 | 美国医保公共程序编码系统（HCPCS）代码                   |
| 美国           | USA_NATIONAL_PROVIDER_IDENTIFIER               | 保险覆盖的医疗保健提供者的唯一识别号                   |
| 美国           | USA_NATIONAL_DRUG_CODE                         | 美国人类药品的通用产品标识符                          |
| 美国           | USA_HEALTH_INSURANCE_CLAIM_NUMBER              | 医疗保健提供者提交的医疗保险理赔的标识符               |
| 美国           | USA_MEDICARE_BENEFICIARY_IDENTIFIER            | 医疗保险受益人的身份识别号                             |
| 美国           | USA_CPT_CODE                                   | 当前操作术语                                          |
| 委内瑞拉       | VENEZUELA_DRIVING_LICENSE                      | 驾驶执照号码（委内瑞拉特有）                           |
| 委内瑞拉       | VENEZUELA_NATIONAL_IDENTIFICATION_NUMBER       | 国家识别号码（委内瑞拉特有）                           |
| 委内瑞拉       | VENEZUELA_VALUE_ADDED_TAX                      | 增值税（委内瑞拉特有）                                 |