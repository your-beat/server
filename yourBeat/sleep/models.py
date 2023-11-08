from django.db import models

class motionSensor(models.Model):
    id=models.AutoField(primary_key=True)
    location=models.CharField(max_length=10,default="Unknown")
    whenOn=models.DateTimeField(auto_now_add=False,auto_now=False,blank=True,null=True)
