"""
Utility Helper Functions
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_config(config_path: str) -> dict:
    """Load configuration from JSON file"""
    with open(config_path, 'r') as f:
        config = json.load(f)
    return config


def save_config(config: dict, config_path: str):
    """Save configuration to JSON file"""
    Path(config_path).parent.mkdir(parents=True, exist_ok=True)
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=4)


def split_data(df: pd.DataFrame, train_size: float = 0.7, val_size: float = 0.15, 
               test_size: float = 0.15, random_state: int = 42) -> tuple:
    """
    Split data into train, validation, and test sets
    """
    from sklearn.model_selection import train_test_split
    
    # First split: train and temp (val + test)
    train_df, temp_df = train_test_split(
        df, 
        train_size=train_size, 
        random_state=random_state,
        stratify=df['is_fraud'] if 'is_fraud' in df.columns else None
    )
    
    # Second split: val and test
    val_ratio = val_size / (val_size + test_size)
    val_df, test_df = train_test_split(
        temp_df,
        train_size=val_ratio,
        random_state=random_state,
        stratify=temp_df['is_fraud'] if 'is_fraud' in temp_df.columns else None
    )
    
    logger.info(f"Data split: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")
    
    return train_df, val_df, test_df


def calculate_class_weights(y: pd.Series) -> dict:
    """Calculate class weights for imbalanced datasets"""
    from sklearn.utils.class_weight import compute_class_weight
    
    classes = np.unique(y)
    weights = compute_class_weight('balanced', classes=classes, y=y)
    
    return dict(zip(classes, weights))


def format_currency(amount: float) -> str:
    """Format amount as currency"""
    return f"${amount:,.2f}"


def format_percentage(value: float) -> str:
    """Format value as percentage"""
    return f"{value * 100:.2f}%"
