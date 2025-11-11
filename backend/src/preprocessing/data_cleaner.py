"""
Data Cleaner Module
Handles missing values, duplicates, and data quality issues
"""

import pandas as pd
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataCleaner:
    """Clean and prepare transaction data"""
    
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        
    def handle_missing_values(self, strategy: dict = None) -> pd.DataFrame:
        """
        Handle missing values based on strategy
        strategy: dict mapping column names to strategies ('drop', 'mean', 'median', 'mode', 'fill_value')
        """
        if strategy is None:
            strategy = {}
        
        missing_before = self.df.isnull().sum().sum()
        logger.info(f"Missing values before cleaning: {missing_before}")
        
        for col in self.df.columns:
            if self.df[col].isnull().sum() > 0:
                if col in strategy:
                    if strategy[col] == 'drop':
                        self.df = self.df.dropna(subset=[col])
                    elif strategy[col] == 'mean':
                        self.df[col].fillna(self.df[col].mean(), inplace=True)
                    elif strategy[col] == 'median':
                        self.df[col].fillna(self.df[col].median(), inplace=True)
                    elif strategy[col] == 'mode':
                        self.df[col].fillna(self.df[col].mode()[0], inplace=True)
                    elif isinstance(strategy[col], (int, float, str)):
                        self.df[col].fillna(strategy[col], inplace=True)
        
        missing_after = self.df.isnull().sum().sum()
        logger.info(f"Missing values after cleaning: {missing_after}")
        
        return self.df
    
    def remove_duplicates(self, subset: list = None) -> pd.DataFrame:
        """Remove duplicate rows"""
        duplicates_before = self.df.duplicated(subset=subset).sum()
        logger.info(f"Duplicate rows before removal: {duplicates_before}")
        
        self.df = self.df.drop_duplicates(subset=subset, keep='first')
        
        duplicates_after = self.df.duplicated(subset=subset).sum()
        logger.info(f"Duplicate rows after removal: {duplicates_after}")
        
        return self.df
    
    def handle_outliers(self, columns: list, method: str = 'iqr', threshold: float = 1.5) -> pd.DataFrame:
        """
        Handle outliers using IQR or Z-score method
        method: 'iqr' or 'zscore'
        """
        for col in columns:
            if method == 'iqr':
                Q1 = self.df[col].quantile(0.25)
                Q3 = self.df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - threshold * IQR
                upper_bound = Q3 + threshold * IQR
                
                outliers = ((self.df[col] < lower_bound) | (self.df[col] > upper_bound)).sum()
                logger.info(f"{col}: {outliers} outliers detected using IQR method")
                
                # Cap outliers instead of removing
                self.df[col] = self.df[col].clip(lower=lower_bound, upper=upper_bound)
        
        return self.df
    
    def convert_dtypes(self, dtype_mapping: dict) -> pd.DataFrame:
        """Convert column data types"""
        for col, dtype in dtype_mapping.items():
            if col in self.df.columns:
                try:
                    self.df[col] = self.df[col].astype(dtype)
                    logger.info(f"Converted {col} to {dtype}")
                except Exception as e:
                    logger.error(f"Error converting {col} to {dtype}: {str(e)}")
        
        return self.df
    
    def get_cleaned_data(self) -> pd.DataFrame:
        """Return cleaned dataframe"""
        return self.df
