# urls.py

from django.contrib import admin
from django.urls import path,include
from tv import views as tv_views
from toilet import views as toilet_views
from outgoing import views as outgoing_views


urlpatterns = [
    path('api/tv-status/', tv_views.update_tv_status, name='update_tv_status'),
    path('api/toilet-usage/', toilet_views.update_toilet_usage, name='update_toilet_usage'),
    path('api/update-user-status/', outgoing_views.update_user_status, name='update_user_status'),
    path('api/check-user-safety/', outgoing_views.check_user_safety, name='check_user_safety'),
]
