import pandas as pd
from tqdm import tqdm

def load_m5_series(item_id: str, store_id: str = "CA_1"):
    sales = pd.read_csv("data/m5/sales_train_validation.csv")
    calendar = pd.read_csv("data/m5/calendar.csv")
    prices = pd.read_csv("data/m5/sell_prices.csv")

    # Filter item
    item_row = sales[sales['item_id'] == item_id]
    if item_row.empty:
        raise ValueError(f"Item {item_id} not found")

    # Get sales for specific store
    store_col = f"{store_id}_d"
    if store_col not in item_row.columns:
        store_col = item_row.columns[6:]  # fallback

    series = item_row.iloc[0, 6:].reset_index(drop=True)
    dates = calendar['date'][:len(series)]

    df = pd.DataFrame({
        'ds': pd.to_datetime(dates),
        'y': series.values.astype(float)
    })
    df = df[df['y'] > 0]  # Remove zero-sales periods
    return df