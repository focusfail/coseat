from dashboard.models import Airplane
from rest_framework import serializers

class AirplaneSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Airplane
        fields = ["name", "manufacturer", "image_path", "airplane_id", "model_year"]