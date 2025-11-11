"""
Data Loader Module
Handles loading and initial validation of transaction data
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Tuple, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataLoader:
    """Load and validate transaction data"""
    
    def __init__(self, data_path: str):
        self.data_path = Path(data_path)
        self.df = None
        
    def load_data(self) -> pd.DataFrame:
        """Load transaction data from CSV"""
        try:
            logger.info(f"Loading data from {self.data_path}")
            self.df = pd.read_csv(self.data_path)
            logger.info(f"Data loaded successfully: {self.df.shape[0]} rows, {self.df.shape[1]} columns")
            return self.df
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise
    
    def validate_schema(self, required_columns: list) -> bool:
        """Validate that required columns exist"""
        missing_cols = set(required_columns) - set(self.df.columns)
        if missing_cols:
            logger.error(f"Missing required columns: {missing_cols}")
            return False
        logger.info("Schema validation passed")
        return True
    
    def get_data_info(self) -> dict:
        """Get basic information about the dataset"""
        if self.df is None:
            raise ValueError("Data not loaded. Call load_data() first.")
        
        return {
            'shape': self.df.shape,
            'columns': list(self.df.columns),
            'dtypes': self.df.dtypes.to_dict(),
            'missing_values': self.df.isnull().sum().to_dict(),
            'memory_usage_mb': self.df.memory_usage(deep=True).sum() / 1024**2
        }
