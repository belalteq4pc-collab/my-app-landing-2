import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://lang-arabic-22.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
USER = f"TEST_user_{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ---- Root ----
def test_root_ok(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---- Places CRUD ----
def test_create_place(s):
    payload = {"user_id": USER, "name": "TEST_Mosque", "category": "mosque",
               "lat": 24.7136, "lng": 46.6753, "radius_m": 150, "enabled": True, "notes": "n"}
    r = s.post(f"{API}/places", json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["name"] == "TEST_Mosque" and d["category"] == "mosque"
    assert "id" in d and "_id" not in d
    pytest.place_id = d["id"]


def test_invalid_category(s):
    r = s.post(f"{API}/places", json={"user_id": USER, "name": "X", "category": "bogus",
                                       "lat": 1, "lng": 1, "radius_m": 100})
    assert r.status_code == 422


def test_invalid_radius(s):
    r = s.post(f"{API}/places", json={"user_id": USER, "name": "X", "category": "other",
                                       "lat": 1, "lng": 1, "radius_m": 5})
    assert r.status_code == 422
    r = s.post(f"{API}/places", json={"user_id": USER, "name": "X", "category": "other",
                                       "lat": 1, "lng": 1, "radius_m": 5000})
    assert r.status_code == 422


def test_list_places(s):
    r = s.get(f"{API}/places", params={"user_id": USER})
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list) and len(items) >= 1
    assert all("_id" not in i for i in items)
    assert all(i["user_id"] == USER for i in items)


def test_get_place(s):
    r = s.get(f"{API}/places/{pytest.place_id}")
    assert r.status_code == 200
    assert r.json()["id"] == pytest.place_id


def test_get_place_404(s):
    r = s.get(f"{API}/places/nonexistent-xyz")
    assert r.status_code == 404


def test_update_place(s):
    r = s.put(f"{API}/places/{pytest.place_id}", json={"name": "TEST_Updated", "radius_m": 200})
    assert r.status_code == 200
    d = r.json()
    assert d["name"] == "TEST_Updated" and d["radius_m"] == 200
    # verify persisted
    g = s.get(f"{API}/places/{pytest.place_id}").json()
    assert g["name"] == "TEST_Updated"


# ---- Visits ----
def test_create_visit_enter(s):
    r = s.post(f"{API}/visits", json={"user_id": USER, "place_id": pytest.place_id,
                                       "place_name": "TEST_Updated", "category": "mosque", "event": "enter"})
    assert r.status_code == 200
    assert "_id" not in r.json()


def test_create_visit_exit(s):
    r = s.post(f"{API}/visits", json={"user_id": USER, "place_id": pytest.place_id,
                                       "place_name": "TEST_Updated", "category": "mosque", "event": "exit"})
    assert r.status_code == 200


def test_list_visits_sorted(s):
    r = s.get(f"{API}/visits", params={"user_id": USER})
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 2
    # sorted desc by timestamp
    ts = [i["timestamp"] for i in items]
    assert ts == sorted(ts, reverse=True)


# ---- Stats ----
def test_stats(s):
    r = s.get(f"{API}/stats", params={"user_id": USER})
    assert r.status_code == 200
    d = r.json()
    assert d["places_count"] >= 1
    assert d["enters"] >= 1
    assert d["exits"] >= 1
    assert isinstance(d["top_places"], list)
    assert len(d["top_places"]) >= 1
    assert d["top_places"][0]["name"] == "TEST_Updated"


# ---- Delete place cascades visits ----
def test_delete_place_cascades(s):
    r = s.delete(f"{API}/places/{pytest.place_id}")
    assert r.status_code == 200
    # place gone
    assert s.get(f"{API}/places/{pytest.place_id}").status_code == 404
    # visits for this place gone
    v = s.get(f"{API}/visits", params={"user_id": USER}).json()
    assert all(x["place_id"] != pytest.place_id for x in v)


def test_delete_place_404(s):
    r = s.delete(f"{API}/places/nonexistent")
    assert r.status_code == 404


# ---- Clear visits ----
def test_clear_visits(s):
    # create one
    pl = s.post(f"{API}/places", json={"user_id": USER, "name": "TEST_p2", "category": "home",
                                         "lat": 1, "lng": 1, "radius_m": 50}).json()
    s.post(f"{API}/visits", json={"user_id": USER, "place_id": pl["id"],
                                    "place_name": "TEST_p2", "category": "home", "event": "enter"})
    r = s.delete(f"{API}/visits", params={"user_id": USER})
    assert r.status_code == 200
    assert s.get(f"{API}/visits", params={"user_id": USER}).json() == []
    # cleanup
    s.delete(f"{API}/places/{pl['id']}")
