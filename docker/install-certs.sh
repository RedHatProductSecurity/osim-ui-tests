#!/bin/sh

if [[ -z "${1}" ]]; then
    echo -e "\e[1;33mWARNING: RH_CERT_URL environment variable not set, internal RH resources won't be accessible\e[0m"
else
    curl "${1}/certs/Current-IT-Root-CAs.pem" -o /etc/pki/ca-trust/source/anchors/Current-IT-Root-CAs.pem
    mkdir -p /etc/ipa
    curl "${1}/chains/ipa-ca-chain-2015.crt" -o /etc/ipa/ipa.crt
    update-ca-trust
fi
