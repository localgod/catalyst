 #!/usr/bin/env bash

docker pull plantuml/plantuml-server:jetty-v1.2023.12
sudo apt-get -q -y update
sudo apt-get -q -y install graphviz
npm install --location=global npm@latest typescript@latest markdownlint-cli@latest

basepath=https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/

urls=(
    "${basepath}C4_Component.puml"
    "${basepath}C4_Container.puml"
    "${basepath}C4_Context.puml"
    "${basepath}C4.puml"
)

for url in "${urls[@]}"; do
    filename=$(basename "$url")
    if [ ! -f "$filename" ]; then
        wget -q "$url"
    fi
done

