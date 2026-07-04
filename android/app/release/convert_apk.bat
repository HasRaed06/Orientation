java -jar bundletool-all-1.18.3.jar build-apks --bundle=app-release.aab --output=universal.apks --mode=universal
ren universal.apks universal.zip
tar -xf universal.zip