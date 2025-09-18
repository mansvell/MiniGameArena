# use an officiel python runtime as the base image
FROM python:3.12-rc-bookworm

#set the working directory in the container to /app
WORKDIR /app

# copy the current directory contents into the container at /app
COPY . /app

#install the required packages
RUN pip install --no-cache-dir -r requirements.txt

#set the environnment variable for Flask
ENV FLASK_APP=app.py

#run the command to start the Flask application
CMD ["flask", "run", "--host=0.0.0.0"]