# urls.py

from django.contrib import admin
from django.urls import path,include
from tv import views as tv_views
from toilet import views as toilet_views
from outgoing import views as outgoing_views


urlpatterns = [
    path('api/tv_status/', tv_views.update_tv_status, name='update_tv_status'),
    path('api/toilet_usage/', toilet_views.update_toilet_usage, name='update_toilet_usage'),
    #path('api/outdoor_door_sensor/', outgoing_views.observe_door_sensor, name='observe_door_sensor'),
    path('api/outdoor_presence_sensor', outgoing_views.observe_presence_sensor, name='observe_presence_sensor'),
    path('api/outdoor_door_sensor/', outgoing_views.smartapp_confirmation, name='smartapp_confirmation'),
]
