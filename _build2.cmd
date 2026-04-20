@echo off
set PATH=D:\;D:\Git\cmd;%PATH%
cd /d C:\Users\gpasd\Documents\GitHub\dopatask-os-deploy
call node_modules\.bin\next.cmd build > _build2.out.log 2>&1
echo EXIT=%ERRORLEVEL% >> _build2.out.log
