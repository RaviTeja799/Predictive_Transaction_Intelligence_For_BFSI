# Data Directory

## Structure
```
data/
├── raw/                    # Original, immutable data
│   └── transactions_clean.csv
├── processed/              # Cleaned and transformed data
│   ├── train.csv
│   ├── test.csv
│   └── validation.csv
└── external/               # External data sources (optional)
```

## Data Description

### Raw Data
- **transactions_clean.csv**: Original transaction dataset with fraud labels

### Processed Data
- **train.csv**: Training dataset (70% of data)
- **test.csv**: Test dataset (15% of data)
- **validation.csv**: Validation dataset (15% of data)

## Data Schema
- transaction_id: Unique identifier
- customer_id: Customer identifier
- timestamp: Transaction timestamp
- amount: Transaction amount
- channel: Transaction channel (online, mobile, atm, branch)
- kyc_verified: KYC verification status
- account_age_days: Account age in days
- is_fraud: Target variable (0=legitimate, 1=fraud)
- Additional features from preprocessing

## Data Privacy
⚠️ All data files are gitignored for security. Never commit raw data to version control.
