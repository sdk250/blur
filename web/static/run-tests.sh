#!/bin/sh
# 前端纯逻辑测试
cd "$(dirname "$0")" && exec node --test test/*.test.js
