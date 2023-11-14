 #!/usr/bin/env bash

docker pull plantuml/plantuml-server:jetty-v1.2023.12
sudo apt-get -y update
sudo apt-get -y install graphviz
npm install --location=global npm@latest typescript@latest markdownlint-cli@latest
wget https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml
