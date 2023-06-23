 #!/usr/bin/env bash

docker pull plantuml/plantuml-server:jetty-v1.2023.1
sudo apt-get -y update
sudo apt-get -y install graphviz
npm install --location=global npm@latest typescript@latest markdownlint-cli@latest
