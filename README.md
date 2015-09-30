The files folder contains
zipped elastic search instance
this should be a folder called elasticsearch-1.7.2
launch: enter bin file then ./elasticsearch
had to override JAVA_HOME in elasticsearch.in.sh that is called by above


demo yaml config
yaml config sets CORS, sets data, and logs to folders under bin

the search.html will run against the server, try searching for jquery

This is based on the packtpub video


https://www.packtpub.com/packtlib/video/video/9781783284153


----------
LOCAL addresses:

Marvel plugin
http://localhost:9200/_plugin/marvel/sense/index.html

See postman files for demonstration calls

info on searchbox/elasticsearch on heroku:
https://devcenter.heroku.com/articles/searchbox
indices are created thru the addon in the heroku dashboard they cannot
be created via CURL
