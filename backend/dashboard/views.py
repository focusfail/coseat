from django.shortcuts import render
from dashboard.models import Airplane
from rest_framework import permissions, viewsets
from frontend.serializers import AirplaneSerializer

class AirplaneViewSet(viewsets.ModelViewSet):
    queryset = Airplane.objects.all().order_by("-model_year")
    serializer_class = AirplaneSerializer

# Create your views here.
