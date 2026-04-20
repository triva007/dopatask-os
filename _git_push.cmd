@echo off
set "PATH=D:\;D:\Git\cmd;%PATH%"
cd /d C:\Users\gpasd\Documents\GitHub\dopatask-os-deploy
D:\Git\cmd\git.exe add -A > _git_push.out.log 2>&1
D:\Git\cmd\git.exe commit -m "Refonte UI /taches: stats avec accent-bars, filtres unifies h-9, bouton priorite arrondi (light + dark)" >> _git_push.out.log 2>&1
D:\Git\cmd\git.exe push origin main >> _git_push.out.log 2>&1
echo EXIT=%ERRORLEVEL% >> _git_push.out.log
