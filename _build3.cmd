@echo off
set "PATH=D:\;D:\Git\cmd;%PATH%"
cd /d C:\Users\gpasd\Documents\GitHub\dopatask-os-deploy
D:\node.exe node_modules\next\dist\bin\next build > _build3.out.log 2>&1
echo EXIT=%ERRORLEVEL% >> _build3.out.log
