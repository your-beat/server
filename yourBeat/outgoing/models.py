from django.db import models

class frontDoor(models.Model):
    id=models.AutoField(primary_key=True)
    status=models.BooleanField(default=False)

class frontDoorLog(models.Model):
    id=models.ForeignKey(frontDoor,on_delete=models.CASCADE)
    whenOn=models.DateTimeField(auto_now_add=False,auto_now=False,blank=True,null=True)

# 외출 상태를 판단할 센서의 종류를 결정해야할 필요가 있음.