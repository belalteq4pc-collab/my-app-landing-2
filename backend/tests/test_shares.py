import os
import re
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://lang-arabic-22.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
USER = f"TEST_user_{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


SAMPLE_PLACE = {
    "name": "TEST_Mosque",
    "category": "mosque",
    "lat": 24.7136,
    "lng": 46.6753,
    "radius_m": 150,
    "notes": "near home",
}


# Create share
def test_create_share_ok(s):
    payload = {"user_id": USER, "title": "TEST_pack", "places": [SAMPLE_PLACE]}
    r = s.post(f"{API}/shares", json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    # short hex id, length 10
    assert "id" in d and re.fullmatch(r"[0-9a-f]{10}", d["id"]), d["id"]
    assert "_id" not in d
    assert d["view_count"] == 0
    assert len(d["places"]) == 1
    p = d["places"][0]
    # snapshot preserves fields
    for k in ("name", "category", "lat", "lng", "radius_m", "notes"):
        assert p[k] == SAMPLE_PLACE[k]
    pytest.share_id = d["id"]


def test_create_share_empty_places_400(s):
    r = s.post(f"{API}/shares", json={"user_id": USER, "places": []})
    assert r.status_code == 400


def test_create_share_too_many_places_400(s):
    many = [SAMPLE_PLACE] * 51
    r = s.post(f"{API}/shares", json={"user_id": USER, "places": many})
    assert r.status_code == 400


# Get share + view count increments
def test_get_share_increments_view_count(s):
    r1 = s.get(f"{API}/shares/{pytest.share_id}")
    assert r1.status_code == 200
    d1 = r1.json()
    assert "_id" not in d1
    assert d1["id"] == pytest.share_id
    vc1 = d1["view_count"]

    r2 = s.get(f"{API}/shares/{pytest.share_id}")
    assert r2.status_code == 200
    vc2 = r2.json()["view_count"]
    assert vc2 == vc1 + 1


def test_get_share_404(s):
    r = s.get(f"{API}/shares/deadbeef99")
    assert r.status_code == 404


def test_existing_share_ab176dbf5b(s):
    r = s.get(f"{API}/shares/ab176dbf5b")
    # Should exist per other_misc_info; if not present, skip
    if r.status_code == 404:
        pytest.skip("preseeded share not present")
    assert r.status_code == 200
    d = r.json()
    assert d["id"] == "ab176dbf5b"
    assert isinstance(d["places"], list) and len(d["places"]) >= 1
    assert "_id" not in d
