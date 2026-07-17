import os
import sqlite3
from pathlib import Path

from config import DATABASE_PATH, INSTANCE_DIR

SCHEMA_PATH = Path(__file__).with_name("schema.sql")
SAMPLE_DATA_PATH = Path(__file__).with_name("sample_data.sql")


def get_connection():
    """Return a SQLite connection using the configured database path."""
    os.makedirs(INSTANCE_DIR, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    """Initialize the SQLite database and create all tables."""
    if not SCHEMA_PATH.exists():
        raise FileNotFoundError(f"Schema file not found: {SCHEMA_PATH}")

    with get_connection() as conn:
        schema_sql = SCHEMA_PATH.read_text()
        conn.executescript(schema_sql)

    print(f"Initialized database: {DATABASE_PATH}")


def load_sample_data():
    """Insert sample rows into the database for development and testing."""
    if not SAMPLE_DATA_PATH.exists():
        raise FileNotFoundError(f"Sample data file not found: {SAMPLE_DATA_PATH}")

    with get_connection() as conn:
        sample_sql = SAMPLE_DATA_PATH.read_text()
        conn.executescript(sample_sql)

    print("Inserted sample data into database.")


def main():
    init_db()
    load_sample_data()


if __name__ == "__main__":
    main()
