from django.db import models
from django.contrib.auth.models import User

class TvWatchingRecord(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    tv_on = models.DateTimeField()
    tv_off = models.DateTimeField(null=True, blank=True)
    motion_detected = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user_id}'s TV watching record"