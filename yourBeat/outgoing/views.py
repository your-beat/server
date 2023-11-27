#outgoing/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import UserStatus, Device
from django.utils import timezone
import datetime

# UserStatus.action="presence"일 때
# 문열림 센서가 작동한 뒤, 단위시간(10분) 동안 집에서 모션 센서가 작동하지 않으면 호출 (사용자가 집에서 나갔다고 판단) -> 'action': 'leave'로 호출
# UserStatus.action="leave"일 때
# 문열림 센서가 작동한 뒤, 단위시간(10분) 안에 집에서 모션 센서가 작동하면 호출 (사용자가 집에 들어왔다고 판단) -> 'action': 'presence'로 호출
@csrf_exempt
def update_user_status(request):
    if request.method == "POST":
        user_id = request.POST.get('user_id')
        action = request.POST.get('action')  # "leave" 또는 "presence"
        
        try:
            user = UserStatus.objects.get(id=user_id)
        except UserStatus.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'User not found'}, status=404)

        if action == "leave":
            user.is_away = True
            user.last_left_time = timezone.now()
            user.save()

            # 모든 디바이스의 전원을 끔
            Device.objects.filter(user=user).update(is_on=False)
            return JsonResponse({'status': 'success', 'message': 'User has left, all devices turned off'})

        elif action == "presence":
            user.is_away = False
            user.save()
            return JsonResponse({'status': 'success', 'message': 'User has returned'})

    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)

@csrf_exempt
def check_user_safety(request):
    if request.method == "POST":
        user_id = request.POST.get('user_id')
        
        try:
            user = UserStatus.objects.get(id=user_id)
        except UserStatus.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'User not found'}, status=404)

        current_time = timezone.now()
        if user.is_away and (current_time - user.last_left_time).total_seconds() > 8 * 3600:  # 8시간 이상으로 임의로 설정해둠
            # 여기서 사용자의 스마트폰으로 안전 여부 확인 알림을 보내는 로직을 구현해야됨
            # 예시: send_safety_check_notification(user)
            user.last_checked_time = current_time
            user.save()
            return JsonResponse({'status': 'success', 'message': 'Safety check notification sent to user'})
        else:
            return JsonResponse({'status': 'success', 'message': 'User is not away or checked recently'})

    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)

