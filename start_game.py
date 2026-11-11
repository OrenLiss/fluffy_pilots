import http.server
import socketserver
import webbrowser
import threading
import os
import sys

# Порт, на котором будет работать игра
PORT = 8000

# Принудительно переходим в папку, где лежит этот скрипт
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    # Отключаем лишние логи в консоли, чтобы не пугать пользователя
    def log_message(self, format, *args):
        pass

def start_server():
    handler = QuietHandler
    # Разрешаем переиспользовать порт, если он не закрылся с прошлого раза
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Сервер запущен на http://localhost:{PORT}")
        print("НЕ ЗАКРЫВАЙ ЭТО ОКНО, ПОКА ИГРАЕШЬ!")
        print("Чтобы остановить игру, просто закрой это окно.")
        httpd.serve_forever()

if __name__ == "__main__":
    # Запускаем сервер в отдельном потоке, чтобы он не блокировал открытие браузера
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Ждем мгновение, чтобы сервер успел запуститься
    import time
    time.sleep(0.5)
    
    # Открываем браузер
    print("Открываем браузер...")
    webbrowser.open(f"http://localhost:{PORT}")
    
    # Держим основной поток запущенным, чтобы окно не закрывалось
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nИгра остановлена.")
        sys.exit(0)