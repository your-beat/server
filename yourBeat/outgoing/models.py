# outgoing/models.py
from django.db import models
from django.contrib.auth.models import User

class OutingStatus(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    last_motion_time = models.DateTimeField(null=True, blank=True) # 마지막으로 모션 센서가 작동한 시각 -> 외출모드 활성화를 위해 필요
    last_door_open_time = models.DateTimeField(null=True, blank=True) # 마지막으로 외출한 시각. 1. NULL이면 재실중을 의미 2. 값이 있으면 외출중을 의미
    
