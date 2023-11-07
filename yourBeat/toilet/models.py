from django.db import models

class lampSensor(models.Model):
    id=models.AutoField(primary_key=True)
    whenOn=models.DateTimeField(auto_now_add=False,auto_now=False,blank=True,null=True)


class motionSensor(models.Model):
    id=models.AutoField(primary_key=True)
    whenOn=models.DateTimeField(auto_now_add=False,auto_now=False,blank=True,null=True)

class toiletLog(models.Model):
    id=models.AutoField(primary_key=True)
    addedBy=models.CharField(max_length=10,default="Unknown")
    whenUse=models.DateTimeField(auto_now_add=False,auto_now=False,blank=True,null=True)