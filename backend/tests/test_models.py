import pytest

from apps.curriculum.models import Course


@pytest.mark.django_db
def test_course_total_marks():
    course = Course(internal_marks=40, external_marks=60)
    assert course.total_marks == 100
