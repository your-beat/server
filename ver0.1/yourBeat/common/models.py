#common/models.py
from django.db import models
from django.contrib.auth.models import User

class IoT(models.Model):
    user_id= models.ForeignKey(User, on_delete=models.CASCADE)
    tv_id = models.CharField(max_length=100, null=True, blank=True)
    presence_sensor_id = models.CharField(max_length=100, null=True, blank=True)
    door_sensor_id = models.CharField(max_length=100, null=True, blank=True)
    smart_plug_id = models.CharField(max_length=100, null=True, blank=True)
    smart_station_id = models.CharField(max_length=100, null=True, blank=True)

class Device(models.Model):
    pass
# 외출모드 시 전원 끌 디바이스 목록