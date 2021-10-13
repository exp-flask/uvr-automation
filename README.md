# Production deployment instructions
Create AWS EC2 instance with Ubuntu AMI (NOT Amazon Linux)

We will setup and use uWSGI and NGINX on our production server

## SSH into EC2 instance and run the following commands

1. `sudo apt-get update -y && sudo apt-get upgrade -y`
1. `sudo apt-get install git python3-venv build-essential python3-dev gcc python3-pip nginx -y`
1. `sudo python3 -m pip install --upgrade pip`
1. `sudo python3 -m pip install uwsgi`
1. `git clone https://github.com/exp-flask/uvr-automation.git`

1. `mkdir .venv`
1. `python3 -m venv .venv/djangoenv`
1. `source ~/.venv/djangoenv/bin/activate`

1. `cd uvr-automation/`
1. `pip install -r requirements.txt`
1. `vi hses_automation_app/settings.py`

    Edit the ALLOWED_HOSTS field in settings.py to include your EC2 instance

1. `sudo vi /etc/nginx/sites-available/hses_automation_app_nginx.conf`

    Add the following to this file:
    ```
    # the upstream component nginx needs to connect to
    upstream django {
        server unix:///home/ubuntu/uvr-automation/hses_automation_app.sock; # for a file socket
        # server 127.0.0.1:8001; # for a web port socket (we'll use this first)
    }

    # configuration of the server
    server {
        # the port your site will be served on
        listen      80;
        # the domain name it will serve for
        server_name ec2-107-23-254-180.compute-1.amazonaws.com; # substitute your machine's IP address or FQDN
        charset     utf-8;

        # max upload size
        client_max_body_size 75M;   # adjust to taste

        # Django media
        location /media  {
            alias /home/ubuntu/uvr-automation/media;  # your Django project's media files - amend as required
        }

        location /static {
            alias /home/ubuntu/uvr-automation/staticfiles; # your Django project's static files - amend as required
        }

        # Finally, send all non-media requests to the Django server.
        location / {
            uwsgi_pass  django;
            include     /home/ubuntu/uvr-automation/uwsgi_params; # the uwsgi_params file you installed
        }
    }
    ```
    Update the server_name field to your EC2 address, and ensure filepaths are correct throughout file
1. `sudo ln -s /etc/nginx/sites-available/hses_automation_app_nginx.conf /etc/nginx/sites-enabled/`
1. `sudo /etc/init.d/nginx start`

1. `sudo mkdir -p /etc/uwsgi/vassals`
1. `sudo ln -s /home/ubuntu/uvr-automation/hses_automation_app_uwsgi.ini /etc/uwsgi/vassals/`

1. `sudo vi /etc/systemd/system/uwsgi.service`

    Add the following to this file:
    ```
    [Unit]
    Description=uWSGI Emperor service for django automation app
    After=network.target
    [Service]
    User=ubuntu
    ExecStart=/usr/local/bin/uwsgi --emperor /etc/uwsgi/vassals
    Restart=always
    KillSignal=SIGQUIT
    Type=notify
    NotifyAccess=all

    [Install]
    WantedBy=multi-user.target
    ```
1. `sudo systemctl enable uwsgi`
1. `sudo systemctl start uwsgi`

## nginx and uwsgi files already included in the repo
- uwsgi_params
    - if this did not exist, you could get it here --> `wget https://raw.githubusercontent.com/nginx/nginx/master/conf/uwsgi_params`
- hses_automation_app_uwsgi.ini

    - if this did not exist, you would need to create it similarly to this template:
    ```
    [uwsgi]

    # Django-related settings
    # the base directory (full path)
    chdir           = /home/ubuntu/uvr-automation
    # Django's wsgi file
    module          = hses_automation_app.wsgi
    # the virtualenv (full path)
    home            = /home/ubuntu/uvr-automation/.venv/djangoenv

    # process-related settings
    # master
    master          = true
    # maximum number of worker processes
    processes       = 10
    # the socket (use the full path to be safe
    socket          = /home/ubuntu/uvr-automation/hses_automation_app.sock
    # ... with appropriate permissions - may be needed
    chmod-socket    = 666
    # clear environment on exit
    vacuum          = true
    # daemonize uwsgi and write messages into give log
    daemonize       = /home/ubuntu/uwsgi-emperor.log
    ```
