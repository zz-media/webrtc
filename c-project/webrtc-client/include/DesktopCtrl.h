#include "rapidjson/document.h"
//改成单例模式初始化传宽高

void dealDsektopCtrlMessage(char* data) {
    rapidjson::Document doc;
    doc.Parse(data);
    if (!doc.HasMember("event") || !doc["event"].IsString()) {
        return;
    }
    std::string event = doc["event"].GetString();
    if (event == "mousemove") {
        std::string x = doc["x"].GetString();
        std::string y = doc["y"].GetString();
        float floatX = std::stof(x);
        float floatY = std::stof(y);
        int intX, intY;
        if (floatX < 1 && floatY < 1) {
            intX = 1920 * floatX;
            intY = 1080 * floatY;
        }
        else {
            intX = 1 * floatX;
            intY = 1 * floatY;
        }

        if (intX < 0) {
            intX = 0;
        }
        else if (intX > 1920) {
            intX = 1920;
        }
        if (intY < 0) {
            intY = 0;
        }
        else if (intY > 1080) {
            intY = 1080;
        }
        std::cout << "event：" << event << ",x:" << intX << ",y:" << intY << std::endl;
        SetCursorPos(intX, intY);
    }
    else if (event == "click") {
        mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    }
    else if (event == "click") {
        mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    }
    else if (event == "keyTap") {
        int keyCode = doc["keyCode"].GetInt();
        keybd_event(keyCode, 0, 0, 0);
        keybd_event(keyCode, 0, KEYEVENTF_KEYUP, 0);
    }
}