
import time
import board
import bitbangio
import adafruit_bno055
import os
import wifi
import socketpool
import json
from struct import *

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




i2c = bitbangio.I2C(board.GP1, board.GP0, frequency=400000, timeout=100000)
sensor = adafruit_bno055.BNO055_I2C(i2c)

data = []

td = None

t_all = 0

while True:
    t1 = time.monotonic_ns()
    
    if td is not None:
        t_all += td

    try:
        data.append([sensor.quaternion, sensor.linear_acceleration, sensor.calibration_status, time.monotonic_ns()])
    except Exception as e:
        print("err")
    
    if t_all > 100000000:
        senddata = b""
        for x in data:
            senddata += pack("dddddddbbbbQ", *(x[0] + x[1] + x[2] + (x[3],)))
        try:
            sock.sendall(senddata + "\n")
        except OSError:
            sock = try_socket_forever()
            sock.sendall(senddata + "\n")
        print(len(data))
        data = []
        t_all = 0
    
    t2 = time.monotonic_ns()
    td = t2 - t1
