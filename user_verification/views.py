import os
import re
import sys
import shutil
import subprocess

from zipfile import ZipFile
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, Http404
from django.template import loader
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie 
def index(request):
    context = {}
    return render(request, 'user_verification/index.html', context)


def run_reports(request):
    file_dict = request.FILES
    context = {
        'rgnAllFileUploaded': False,
        'ogmFileUploaded': False,
        'userRoleFileUploaded': False,
        'podFileUploaded': False,
        'ttaFileUploaded': False,
        'danyaUserFileUploaded': False,
        'lewinFileUploaded': False,
        'monitoringFileUploaded': False,
        'rgn1FileUploaded': False,
        'rgn2FileUploaded': False,
        'rgn3FileUploaded': False,
        'rgn4FileUploaded': False,
        'rgn5FileUploaded': False,
        'rgn6FileUploaded': False,
        'rgn7FileUploaded': False,
        'rgn8FileUploaded': False,
        'rgn9FileUploaded': False,
        'rgn10FileUploaded': False,
        'rgn11FileUploaded': False,
        'rgn12FileUploaded': False
    }
    uvr_filepath = os.path.join('media', 'user_verification_files')
    if os.path.isdir(uvr_filepath):
        shutil.rmtree(uvr_filepath)
        os.makedirs(uvr_filepath)
    else:
        os.makedirs(uvr_filepath)

    for file in file_dict.values():
        if file.name.endswith('.zip'):
            with ZipFile(file) as myzip:
                for zipinfo in myzip.infolist():
                    zipinfo.filename = os.path.basename(zipinfo.filename)
                    [context, is_valid_file] = check_upload(context, zipinfo.filename)
                    if is_valid_file:
                        myzip.extract(zipinfo, uvr_filepath)
        else:
            [context, is_valid_file] = check_upload(context, file.name)
            if is_valid_file:
                with open(os.path.join(uvr_filepath, os.path.basename(file.name)), 'wb+') as destination:
                    for chunk in file.chunks():
                        destination.write(chunk)
    if all(context.values()):
        month = request.POST['month']
        year = request.POST['year']
        python_executable = sys.executable
        if 'uwsgi' in sys.executable:
            with open('hses_automation_app_uwsgi.ini', 'r') as conf:
                for line in conf.readlines():
                    if 'home' in line:
                        python_executable = line.replace('home', '').replace('=', '').strip()
        log = subprocess.check_output([python_executable, os.path.join('scripts', 'auto_user_verif.py'), uvr_filepath, month, year])
        print('User Verification Log:')
        print(log.decode('utf-8'))
        shutil.make_archive(os.path.join('media', 'downloadable_resources', f'{month}_{year}_UVR_Output'), 'zip', os.path.join(uvr_filepath, 'processed_files'))
    return JsonResponse(context)


def get_download_status(request, year, month):
    json = {}
    try:
        with open(os.path.join('media', 'downloadable_resources', f'{month}_{year}_UVR_Output.zip'), 'rb') as uv_files:
            json['download_available'] = True
    except FileNotFoundError:
        json['download_available'] = False
    return JsonResponse(json)


def get_processed_user_verification_files(request, year, month):
    try:
        with open(os.path.join('media', 'downloadable_resources', f'{month}_{year}_UVR_Output.zip'), 'rb') as uv_files:
            response = HttpResponse(uv_files, headers={
                'Content-Type': 'application/zip',
                'Content-Disposition': f'attachment; filename="{month}_{year}_UVR_Output.zip"'
            })
    except FileNotFoundError:
        raise Http404(f'{month} {year} user verification reports not found. Make sure reports were run for the corresponding month.')
    return response


# Helper functions
def check_upload(context, filename):
    is_uvr_file = True
    if re.search('RgnAll HSES Accounts.*\.xlsx', filename):
        context['rgnAllFileUploaded'] = True
    elif re.search('Rgn0 OGM Accounts.*\.xlsx', filename):
        context['ogmFileUploaded'] = True
    elif re.search('UserRoleListingReport.*\.xlsx', filename):
        context['userRoleFileUploaded'] = True
    elif re.search('Rgn0 HSES POD Accounts[^a-zA-Z]*\.xlsx', filename):
        context['podFileUploaded'] = True
    elif re.search('Rgn0 HSES T&TA Accounts[^a-zA-Z]*\.xlsx', filename):
        context['ttaFileUploaded'] = True
    elif re.search('Danya User HSES Accounts.*\.xlsx', filename):
        context['danyaUserFileUploaded'] = True
    elif re.search('Lewin Accounts.*\.xlsx', filename):
        context['lewinFileUploaded'] = True
    elif re.search('Monitoring_Network_Users.*\.xlsx', filename):
        context['monitoringFileUploaded'] = True
    elif re.search('Rgn01 HSES Accounts[^a-zA-Z]*\.xlsx', filename):
        context['rgn1FileUploaded'] = True
    elif re.search('Rgn02 HSES Accounts[^a-zA-Z]*\.xlsx', filename):
        context['rgn2FileUploaded'] = True
    elif re.search('Rgn03 HSES Accounts[^a-zA-Z]*\.xlsx', filename):
        context['rgn3FileUploaded'] = True
    elif re.search('Rgn04 HSES Accounts[^a-zA-Z]*\.xlsx', filename):
        context['rgn4FileUploaded'] = True
    elif re.search('Rgn05 HSES Accounts[^a-zA-Z]*\.xlsx', filename):
        context['rgn5FileUploaded'] = True
    elif re.search('Rgn06 HSES Accounts[^a-zA-Z]*\.xlsx', filename):
        context['rgn6FileUploaded'] = True
    elif re.search('Rgn07 HSES Accounts[^a-zA-Z]*\.xlsx', filename):
        context['rgn7FileUploaded'] = True
    elif re.search('Rgn08 HSES Accounts[^a-zA-Z]*\.xlsx', filename):
        context['rgn8FileUploaded'] = True
    elif re.search('Rgn09 HSES Accounts[^a-zA-Z]*\.xlsx', filename):
        context['rgn9FileUploaded'] = True
    elif re.search('Rgn10 HSES Accounts[^a-zA-Z]*\.xlsx', filename):
        context['rgn10FileUploaded'] = True
    elif re.search('Rgn11 HSES Accounts[^a-zA-Z]*\.xlsx', filename):
        context['rgn11FileUploaded'] = True
    elif re.search('Rgn12 HSES Accounts[^a-zA-Z]*\.xlsx', filename):
        context['rgn12FileUploaded'] = True
    else:
        is_uvr_file = False
    return [context, is_uvr_file]