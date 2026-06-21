#!/usr/bin/env bash
# Source Android SDK environment for Expo / React Native builds.
export ANDROID_HOME="${ANDROID_HOME:-/root/Android/sdk}"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/emulator"
