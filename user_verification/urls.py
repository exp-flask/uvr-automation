from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('run_reports', views.run_reports, name='run_reports'),
    path('get_download_status/<int:year>/<str:month>', views.get_download_status, name='get_download_status'),
    path('get_processed_files/<int:year>/<str:month>', views.get_processed_user_verification_files, name='get_processed_files')
]