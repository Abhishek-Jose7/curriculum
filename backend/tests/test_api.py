import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.accounts.models import Role


@pytest.mark.django_db
def test_me_requires_authentication():
    response = APIClient().get("/api/auth/me/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_me_returns_role():
    User = get_user_model()
    user = User.objects.create_user(username="hod", password="test", role=Role.HOD)
    client = APIClient()
    client.force_authenticate(user)
    response = client.get("/api/auth/me/")
    assert response.status_code == 200
    assert response.data["role"] == Role.HOD


@pytest.mark.django_db
def test_courses_endpoint_requires_authentication():
    response = APIClient().get("/api/courses/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_token_rotation_and_blacklist():
    User = get_user_model()
    user = User.objects.create_user(username="testuser", password="testpassword", role=Role.FACULTY)
    client = APIClient()
    
    # Get tokens
    login_response = client.post("/api/auth/token/", {"username": "testuser", "password": "testpassword"}, format="json")
    assert login_response.status_code == 200
    assert "access" in login_response.data
    assert "refresh" in login_response.data
    
    first_refresh = login_response.data["refresh"]
    
    # Refresh tokens (should rotate refresh token)
    refresh_response = client.post("/api/auth/token/refresh/", {"refresh": first_refresh}, format="json")
    assert refresh_response.status_code == 200
    assert "access" in refresh_response.data
    assert "refresh" in refresh_response.data
    
    second_refresh = refresh_response.data["refresh"]
    assert second_refresh != first_refresh
    
    # Try using the old refresh token again - should fail as it should be blacklisted/rotated
    reuse_response = client.post("/api/auth/token/refresh/", {"refresh": first_refresh}, format="json")
    assert reuse_response.status_code == 401

