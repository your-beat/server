from django.db import models
from django.contrib.auth.models import User

class ToiletUsage(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    area_times = models.JSONField(default=dict)  # ex: {"toilet": 5, "shower": 10}
    accident_detected = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user}'s bathroom usage record"
