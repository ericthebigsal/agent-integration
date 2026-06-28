import os
import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from backend.main import app

# Load .env so os.getenv() sees the same vars as pydantic-settings (needed for
# skipif decorators and for building correct auth headers in live tests).
load_dotenv()


@pytest.fixture
def client():
    return TestClient(app)
