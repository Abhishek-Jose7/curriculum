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
