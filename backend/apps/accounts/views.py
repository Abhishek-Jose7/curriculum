from rest_framework import filters, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminOrHOD
from apps.accounts.serializers import MeSerializer, UserSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("department").order_by("last_name", "first_name")
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrHOD]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering_fields = ["last_name", "role", "department"]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)
