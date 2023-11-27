# outgoing/models.py
from django.db import models
from django.contrib.auth.models import User

class UserStatus(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    is_away = models.BooleanField(default=False)
    last_left_time = models.DateTimeField(null=True, blank=True)
    last_checked_time = models.DateTimeField(null=True, blank=True)  # 사용자 신변 확인을 위한 시간 필드 추가

class Device(models.Model):
    name = models.CharField(max_length=100)
    is_on = models.BooleanField(default=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
