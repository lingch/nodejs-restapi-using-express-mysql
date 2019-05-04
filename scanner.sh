#!/bin/sh

scannerID = $1
code = $2
upstreamHost = 
upstreamPort = 18081
echo "$1 input $2"

curl -X POST --cacert ca.pem --cert scanner$1.pem http://$upstreamHost:$upstreamPort/scanner/event  -H "Content-Type: text/plain" -d "$code"
