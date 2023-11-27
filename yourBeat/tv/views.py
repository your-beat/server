from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
import json
from .models import TvWatchingRecord
from django.utils.dateparse import parse_datetime

@csrf_exempt  # 실제 운영 환경에서는 CSRF 보호를 고려해야 합니다.
def update_tv_status(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)  # request로부터 JSON 데이터를 파싱

            # 데이터 검증 및 처리
            user_id = data.get("user_id")  
            tv_status = data.get("tv_status")  # 'on' or 'off'
            timestamp = parse_datetime(data.get("timestamp"))  

            # TV 상태 업데이트 로직
            if tv_status == "on":
                # TV가 켜질 때의 기록 생성
                TvWatchingRecord.objects.create(user_id=user_id, tv_on=timestamp)
            elif tv_status == "off":
                # TV가 꺼질 때의 기록 업데이트
                last_record = TvWatchingRecord.objects.filter(user_id=user_id, tv_off__isnull=True).last()
                if last_record:
                    last_record.tv_off = timestamp
                    last_record.save()

            return JsonResponse({"message": "TV status updated successfully"})
        except (json.JSONDecodeError, KeyError):
            # 잘못된 JSON 형식 또는 필요한 키가 누락된 경우
            return HttpResponseBadRequest("Invalid JSON data")
    else:
        return HttpResponseBadRequest("Invalid request method")
