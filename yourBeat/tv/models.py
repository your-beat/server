from django.db import models

class TV(models.Model):
    id=models.AutoField(primary_key=True)
    status=models.BooleanField(default=False)
    channel=models.IntegerField(default=0)
    volume=models.IntegerField(default=0)

class TVLog(models.Model):
    id=models.ForeignKey(TV,on_delete=models.CASCADE)
    whenOn=models.DateTimeField(auto_now_add=False,auto_now=False,blank=True,null=True)
    whenOff=models.DateTimeField(auto_now_add=False,auto_now=False,blank=True,null=True)
    duration=models.IntegerField(default=0)