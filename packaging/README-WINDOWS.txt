========================================
  VibeApp for Windows - How to Run
========================================

Thank you for using VibeApp! Running it is simple.


STEP 1 - Start the app
----------------------
Double-click "VibeApp.exe".

A small black window will open. This is normal - it is the engine
that powers the app. Leave it open while you use VibeApp.

(The first time you run it, Windows SmartScreen may show a blue
"Windows protected your PC" message because the app is not signed.
Click "More info" and then "Run anyway" to continue.)


STEP 2 - Use the app
--------------------
Your web browser will open automatically and show VibeApp.

If it does not open on its own, open your browser and type this
address into the address bar:

    http://127.0.0.1:8000

(If that address does not work, look in the black window - it prints
the exact address to use.)


STEP 3 - Stop the app
---------------------
When you are finished, simply close the black window. That shuts
the app down. You can re-open it any time by double-clicking
"VibeApp.exe" again.


That's it - no installation, no setup, nothing else to download.


----------------------------------------
  Optional: Turn on AI insights
----------------------------------------
AI-powered insights are turned off by default. To enable them:

1. Get an API key from https://console.anthropic.com
2. Rename ".env.example" to ".env"
3. Open ".env" in Notepad and fill in your key:
       ANTHROPIC_API_KEY=sk-ant-...
       LLM_ENABLED=true
4. Save the file and restart VibeApp.exe


----------------------------------------
  Where is my data stored?
----------------------------------------
Your data lives in a private folder on your computer:
    C:\Users\<you>\AppData\Local\VibeApp

Deleting that folder resets the app to a fresh start.
