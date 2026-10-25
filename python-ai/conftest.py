"""Pytest configuration for Python AI service tests."""

import sys
from pathlib import Path

# Add parent directory to Python path so 'app' module can be imported
sys.path.insert(0, str(Path(__file__).parent))
