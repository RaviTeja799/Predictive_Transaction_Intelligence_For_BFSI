"""
Unit Tests for Preprocessing Module
"""

import pytest
import pandas as pd
import numpy as np
from src.preprocessing import DataLoader, DataCleaner, FeatureEngineer


class TestDataCleaner:
    """Test DataCleaner class"""
    
    def test_handle_missing_values(self):
        """Test missing value handling"""
        df = pd.DataFrame({
            'A': [1, 2, np.nan, 4],
            'B': [5, np.nan, 7, 8]
        })
        
        cleaner = DataCleaner(df)
        result = cleaner.handle_missing_values({'A': 'mean', 'B': 'median'})
        
        assert result['A'].isnull().sum() == 0
        assert result['B'].isnull().sum() == 0
    
    def test_remove_duplicates(self):
        """Test duplicate removal"""
        df = pd.DataFrame({
            'A': [1, 2, 2, 3],
            'B': [4, 5, 5, 6]
        })
        
        cleaner = DataCleaner(df)
        result = cleaner.remove_duplicates()
        
        assert len(result) == 3


class TestFeatureEngineer:
    """Test FeatureEngineer class"""
    
    def test_create_temporal_features(self):
        """Test temporal feature creation"""
        df = pd.DataFrame({
            'timestamp': pd.date_range('2024-01-01', periods=5, freq='H')
        })
        
        engineer = FeatureEngineer(df)
        result = engineer.create_temporal_features()
        
        assert 'hour' in result.columns
        assert 'day_of_week' in result.columns
        assert 'is_weekend' in result.columns
    
    def test_create_amount_features(self):
        """Test amount feature creation"""
        df = pd.DataFrame({
            'transaction_amount': [100, 200, 300, 400, 500]
        })
        
        engineer = FeatureEngineer(df)
        result = engineer.create_amount_features()
        
        assert 'amount_log' in result.columns
        assert 'is_high_value' in result.columns
