#outgoing/views.py
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import OutingStatus
from django.utils import timezone
from datetime import datetime, timedelta
from common.models import IoT
import json
import requests



@csrf_exempt
def smartapp_confirmation(request):
    # request.body를 json으로 파싱
    data = json.loads(request.body)

    confirmation_url = data.get('confirmationUrl')

    if confirmation_url:
        # SmartThings의 confirmationUrl로 GET 요청을 보냅니다.
        response = requests.get(confirmation_url)
        
        if response.status_code == 200:
            return HttpResponse('Confirmation successful', status=200)
        else:
            return HttpResponse(f'Confirmation failed. confirmation_url:{confirmation_url}', status=400)

    return HttpResponse(f'No confirmation URL provided. confirmation_url:{confirmation_url}', status=400)

# 웹훅을 사용하여 문열림 이벤트가 발생함을 감지하고, 문열림이 감지되었다면 handle_door_sensor()를 호출
@csrf_exempt
def observe_door_sensor(request):
    data=json.loads(request.body)
    if data['components']['main']['contactSensor']['contact']['value'] == 'opened':
        handle_door_sensor(data)
        return JsonResponse({'status': 'success', 'message': 'Door sensor data processed'})
    else:
        return JsonResponse({'status': 'error', 'message': 'Door sensor data not processed'})


# 웹훅을 사용하여 모션 이벤트가 발생함을 감지하고, 모션 이벤트가 감지되었다면 handle_presence_sensor()를 호출
@csrf_exempt
def observe_presence_sensor(request):
    data=json.loads(request.body)
    if data['components']['main']['presenseSensor']['presence']['value'] == 'present':
        handle_presence_sensor(data)
        return JsonResponse({'status': 'success', 'message': 'Presence sensor data processed'})
    else:
        return JsonResponse({'status': 'error', 'message': 'Presence sensor data not processed'})

def handle_door_sensor(data):
    """
        문열림 이벤트가 발생할 시 호출됨
        1. 문열림 센서 데이터를 받아와, 사용자 상태 중 마지막 문열림 시간을 업데이트
    """
    door_sensor_id = data['ownerId']  
    #contact_value = data['components']['main']['contactSensor']['contact']['value']  # contact_value: opened, closed
    outing_status = OutingStatus.objects.get(user_id=(IoT.objects.get(door_sensor_id=door_sensor_id)).user_id) # 센서id를 통해 유저를 찾음.
    outing_status.last_door_open_time = datetime.now() # 문열림 센서가 작동한, 현재 시간을 업데이트
    outing_status.save()

def handle_presence_sensor(data):
    """
        모션 이벤트가 발생할 시 호출됨
        1. 모션 센서 데이터를 받아와, 사용자 상태 중 마지막 모션 시간을 업데이트
    """
    presence_sensor_id = data['ownerId']
    outing_status = OutingStatus.objects.get(user_id=(IoT.objects.get(presence_sensor_id=presence_sensor_id)).user_id) # 센서id를 통해 유저를 찾음.
    outing_status.last_motion_time = datetime.now() # 모션 센서가 작동한, 현재 시간을 업데이트
    

# 문열림 이벤트가 발생한지 10분 이후 호출됨. 문열림 이벤트 발생 이후에 10분 동안 모션 감지가 없었다면 외출모드 활성화-> 모든 디바이스 전원 끔
def check_outing_mode(request):
    data=json.loads(request.body)
    # 이하 코드 작성 필요
    return JsonResponse({'status': 'success', 'message': 'Outing mode checked'})