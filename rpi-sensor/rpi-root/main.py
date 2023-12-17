
import time
import board
import bitbangio
import adafruit_bno055
import os
import wifi
import socketpool
import json

time.sleep(3)

print("Connecting to WiFi")

wifi.radio.connect(os.getenv('CIRCUITPY_WIFI_SSID'), os.getenv('CIRCUITPY_WIFI_PASSWORD'))

pool = socketpool.SocketPool(wifi.radio)

def try_socket_forever():
    while True:
        try:
            socket_new = pool.socket()
            socket_new.connect((os.getenv('SERVER_HOSTNAME'), 3000))
            return socket_new
        except OSError:
            print("socket connect retrying")
            time.sleep(1)

sock = try_socket_forever()




i2c = bitbangio.I2C(board.GP1, board.GP0, frequency=5000, timeout=100000)
sensor = adafruit_bno055.BNO055_I2C(i2c)

data = {}

while True:
    try:
        data["quaternion"] = sensor.quaternion
        data["linear_acceleration"] = sensor.linear_acceleration
        data["calibration_status"] = sensor.calibration_status
        data["time"] = time.monotonic_ns()
    except Exception as e:
        print("err")
    
    try:
        sock.sendall(json.dumps(data) + "\n")
    except OSError:
        sock = try_socket_forever()
        sock.sendall(json.dumps(data) + "\n")
