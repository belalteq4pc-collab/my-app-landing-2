"""Tests for new `action` field on places and share snapshots."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://lang-arabic-22.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
USER = f"TEST_action_{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def created(s):
    """Create one place and yield id, cleanup after."""
    payload = {"user_id": USER, "name": "TEST_action_place", "category": "library",
               "lat": 24.7136, "lng": 46.6753, "radius_m": 120}
    r = s.post(f"{API}/places", json=payload)
    assert r.status_code == 200, r.text
    pid = r.json()["id"]
    yield pid
    s.delete(f"{API}/places/{pid}")


# Default action should be "silent" when omitted
def test_default_action_is_silent(s, created):
    r = s.get(f"{API}/places/{created}")
    assert r.status_code == 200
    assert r.json().get("action") == "silent"


# Creating with explicit action="ring" persists
def test_create_with_action_ring(s):
    payload = {"user_id": USER, "name": "TEST_ring_place", "category": "work",
               "lat": 24.7, "lng": 46.6, "radius_m": 100, "action": "ring"}
    r = s.post(f"{API}/places", json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["action"] == "ring"
    pid = d["id"]
    # Verify persisted
    g = s.get(f"{API}/places/{pid}").json()
    assert g["action"] == "ring"
    s.delete(f"{API}/places/{pid}")


# Invalid action value returns 422
def test_invalid_action_value(s):
    r = s.post(f"{API}/places", json={"user_id": USER, "name": "TEST_loud", "category": "other",
                                       "lat": 1, "lng": 1, "radius_m": 100, "action": "loud"})
    assert r.status_code == 422


# PUT can update action independently
def test_update_action_independently(s, created):
    # Toggle to ring
    r = s.put(f"{API}/places/{created}", json={"action": "ring"})
    assert r.status_code == 200, r.text
    assert r.json()["action"] == "ring"
    # Verify GET
    assert s.get(f"{API}/places/{created}").json()["action"] == "ring"

    # Toggle back to silent
    r = s.put(f"{API}/places/{created}", json={"action": "silent"})
    assert r.status_code == 200
    assert r.json()["action"] == "silent"
    assert s.get(f"{API}/places/{created}").json()["action"] == "silent"


# PUT with invalid action returns 422
def test_put_invalid_action(s, created):
    r = s.put(f"{API}/places/{created}", json={"action": "vibrate"})
    assert r.status_code == 422


# Updating other fields does NOT clobber action (because previous test left it silent)
def test_update_other_field_preserves_action(s, created):
    # Set to ring first
    s.put(f"{API}/places/{created}", json={"action": "ring"})
    # Update unrelated field
    r = s.put(f"{API}/places/{created}", json={"name": "TEST_renamed"})
    assert r.status_code == 200
    assert r.json()["action"] == "ring"
    assert r.json()["name"] == "TEST_renamed"


# Share snapshot includes action field
def test_share_includes_action(s):
    places = [
        {"name": "TEST_silent_share", "category": "mosque", "lat": 24.7, "lng": 46.6,
         "radius_m": 100, "notes": "n", "action": "silent"},
        {"name": "TEST_ring_share", "category": "home", "lat": 24.8, "lng": 46.7,
         "radius_m": 80, "notes": "", "action": "ring"},
    ]
    r = s.post(f"{API}/shares", json={"user_id": USER, "title": "TEST_pack", "places": places})
    assert r.status_code == 200, r.text
    sid = r.json()["id"]
    # Fetch back
    g = s.get(f"{API}/shares/{sid}")
    assert g.status_code == 200
    items = g.json()["places"]
    assert len(items) == 2
    actions = {p["name"]: p["action"] for p in items}
    assert actions["TEST_silent_share"] == "silent"
    assert actions["TEST_ring_share"] == "ring"


# Share snapshot defaults action when omitted
def test_share_default_action(s):
    r = s.post(f"{API}/shares", json={"user_id": USER, "title": "TEST_default",
                                       "places": [{"name": "TEST_no_action", "category": "other",
                                                   "lat": 1, "lng": 1, "radius_m": 100}]})
    assert r.status_code == 200, r.text
    sid = r.json()["id"]
    g = s.get(f"{API}/shares/{sid}").json()
    assert g["places"][0]["action"] == "silent"


# Share snapshot rejects invalid action
def test_share_invalid_action(s):
    r = s.post(f"{API}/shares", json={"user_id": USER, "title": "TEST_bad",
                                       "places": [{"name": "X", "category": "other",
                                                   "lat": 1, "lng": 1, "radius_m": 100,
                                                   "action": "buzz"}]})
    assert r.status_code == 422
