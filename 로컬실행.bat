@echo off
chcp 65001 >nul
rem cnation 붕어빵 타이쿤 - 컴퓨터에서 실행하기
rem 더블클릭하면 이 폴더로 작은 웹 서버를 띄우고 브라우저로 게임을 엽니다.
rem (index.html을 바로 열면 브라우저가 글씨체와 음악을 막아서 화면이 다르게 보입니다)
cd /d "%~dp0"
set "PORT=8000"

set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY where python >nul 2>nul && set "PY=python"
if not defined PY goto nopy

echo.
echo  cnation 붕어빵 타이쿤 을 실행합니다.
echo  브라우저 주소: http://localhost:%PORT%/
echo.
echo  게임을 끝내려면 이 창을 닫으세요.
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul & start "" http://localhost:%PORT%/"
%PY% -m http.server %PORT%
echo.
echo  서버가 멈췄습니다. 8000번 포트를 다른 프로그램이 쓰고 있을 수 있어요.
pause
goto :eof

:nopy
echo.
echo  파이썬(Python)이 설치되어 있지 않아 실행할 수 없어요.
echo  https://www.python.org/downloads/ 에서 설치한 뒤 다시 실행해 주세요.
echo  (설치할 때 "Add python.exe to PATH" 를 꼭 체크하세요)
echo.
pause
