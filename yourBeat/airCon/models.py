from django.db import models

class airCon:
    id=models.AutoField(primary_key=True)
    status=models.BooleanField(default=False)
    currentTemperature=models.IntegerField(default=0)
    targetTemperature=models.IntegerField(default=0)
    fanSpeed=models.IntegerField(default=0)
    mode=models.CharField(max_length=10,default="Cool")


# 사용자가 에어컨을 On 시킬때, 온도를 바꿀때마다 기록을 하되, 최근(ex 1분) 로그 중 가장 최근의 로그만 남도록 트리거 설계 필요
class airConLog:
    id=models.ForeignKey(airCon,on_delete=models.CASCADE)
    currentTLog=models.IntegerField(default=0)
    targetTLog=models.IntegerField(default=0)
    fanSpeedLog=models.IntegerField(default=0)
    modeLog=models.CharField(max_length=10,default="Cool")
    whenOn=models.DateTimeField(auto_now_add=False,auto_now=False,blank=True,null=True)
    
    
