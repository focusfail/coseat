from django.db import models
from django.contrib import admin

# Create your models here.
class Airplane(models.Model):
    name = models.CharField(max_length=100)
    manufacturer = models.CharField(max_length=50)
    image_path = models.CharField(max_length=100)
    airplane_id = models.IntegerField(unique=True)
    model_year = models.IntegerField()
    def __str__(self):
        return self.name

admin.site.register(Airplane)