#!/bin/bash

PM2_PROCESS_NAME="chat"

cd /home/ec2-user/chat

if sudo pm2 list | grep -q "$PM2_PROCESS_NAME"; then
  sudo pm2 restart "$PM2_PROCESS_NAME" --update-env
else
  sudo pm2 start dist/main/index.js --name="$PM2_PROCESS_NAME" 
  sudo pm2 save
fi