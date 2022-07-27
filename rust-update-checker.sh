#! /usr/bin/bash
version_file="/var/www/pterodactyl/rust_version"
panel_root="/var/www/pterodactyl"

latest_version=$(curl -s https://assets.umod.org/games/rust.json | jq -r '.latest_release_version')

if [ -s $version_file ]
then
 file_version=$(cat $version_file)
 if [ $latest_version = $file_version ]
 then
  echo "No updates required. ($latest_version = $file_version)"
 else
  echo "Updating... ($file_version -> $latest_version)"
  php $panel_root/artisan p:server:rust-force-wipe
  yes | php $panel_root/artisan p:server:bulk-power restart 1> /dev/null
  echo 'Restarted all severs to apply updates!'
 fi
else
 echo "no version, putting in version: $latest_version"
 echo "$latest_version" > "$version_file"
fi
