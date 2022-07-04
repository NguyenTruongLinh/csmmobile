# HOW TO BUILD

## Setup react native development environment

- Please follow guidelines from react native homepage: <https://reactnative.dev/docs/environment-setup>
  - Nodejs: https://nodejs.org/en/
  - Python 2.7: https://www.python.org/downloads/release/python-272/
  - Java 8 (for android development)
    - Windows: https://www.oracle.com/java/technologies/javase/javase-jdk8-downloads.html
    - How to install old version of JDK on MACOS:
    ```bash
    brew tap adoptopenjdk/openjdk
    brew cask install adoptopenjdk8
    ```
- For iOS: install XCode (version >= 12)
- For Android: Android Studio

  - Android SDK Platform 29
  - Set variable environment ANDROID_HOME to path\to\android\sdk
  - Add platform tools to PATH: path\to\android\sdk\platform-tools
  - Enable Hyper-V in Windows features if you want to run Android simulator

- This project do not use EXPO

## Install node modules and get them patched

- Install git: <https://git-scm.com/>
- Run `npm i` to setup node_modules
- Patcher is already auto run by Post install command, no need to run it manually.
  ( - Please )

## Start debugging

- iOS (need MACOS and XCode >= 12): use XCode
- Android (need Android Studio and SDK installed): `npm run android`

## Build release package:

- iOS: use XCode
- Android: run `npm run build-android-release`. For uploading to PlayStore please use command `npm run bundle-android`

# TIPS:

## If android device disconnected with packager (randomly), reconnect with command: `adb reverse tcp:8081 tcp:8081`, and restart packager if needed

## Android: How to add new certificate to key files

- Download new certificate file (\*.der) from google console (certificate named with 'upload' is used for release)
- Use keytool.exe (android studio) to add certificate into key (.jks) file:
  `keytool.exe -importcert -file upload_cert.der -keystore <keystorefile>`
- It will ask: > Certificate already exists in keystore under alias . Do you still want to add it? [no]:
- Type `y` to accept

## Android: How to resign an signed apk:

- Use 7zip to open apk file and remove folder META-INF, or rename file extension to .zip and extract then remove META-INF and zip again
- Realign zip file with command:

```cmd
\<path_to>\androidsdk\build-tools\<build_tool_version>\zipalign -f 4 <input.apk> <output.apk>
```

- Sign it with new keyfile using command:

```cmd
\<path_to>\androidsdk\build-tools\<build_tool_version>\apksigner sign --ks <keyfile.jks> <input.apk>
```

# CODING CONVENTIONS:

## Component class structure:

Please follow below order when coding a new component class:

- constructor
- react life cycle: componentDidMount, componentWillUnmount, componentDidUpdate, getDerivedStateFromProps, ...
- events handlers (ex: onShowPopup, onGotoVideo, onButtonClick, ...)
- utilities methods
- render methods
- main render

## Importing structure

Please follow below order when importing libraries in a file:

- react, react-natives
- 3rd party libs
- custom components
- utils
- styles
- constant
