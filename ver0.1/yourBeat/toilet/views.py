from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import ToiletUsage
import json

@csrf_exempt  
def update_toilet_usage(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data['user_id']
            start_time = data['start_time']
            end_time = data.get('end_time', None)
            area_times = data.get('area_times', {})
            accident_detected = data.get('accident_detected', False)

            usage_record, created = ToiletUsage.objects.get_or_create(
                user_id=user_id, 
                start_time=start_time, 
                defaults={'end_time': end_time, 'area_times': area_times, 'accident_detected': accident_detected}
            )

            if not created:
                usage_record.end_time = end_time
                usage_record.area_times.update(area_times)
                usage_record.accident_detected = accident_detected
                usage_record.save()

            return JsonResponse({'status': 'success', 'message': 'Bathroom usage updated'})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)
