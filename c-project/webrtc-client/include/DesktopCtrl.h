#include "rapidjson/document.h"
//�ĳɵ���ģʽ��ʼ�������

void dealDsektopCtrlMessage(char* data) {
    rapidjson::Document doc;
    doc.Parse(data);
    if (!doc.HasMember("event") || !doc["event"].IsString()) {
        return;
    }
    std::string event = doc["event"].GetString();
    if (event == "mouseSlide") {
        // ��ȡ��ǰ���λ��
        POINT currentPos;
        GetCursorPos(&currentPos);
        // �����ƶ�һ������
        currentPos.x += 1;
        // �����µ����λ��
        SetCursorPos(currentPos.x, currentPos.y);
    }else if (event == "mousemove") {
        int intX = doc["x"].GetInt();
        int intY = doc["y"].GetInt();
        std::cout << "event��" << event << ",x:" << intX << ",y:" << intY << std::endl;
        SetCursorPos(intX, intY);
    }
    else if (event == "leftMouseDown") {
        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
    }
    else if (event == "leftMouseUp") {
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    }
    else if (event == "rightMouseDown") {
        mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
    }
    else if (event == "rightMouseUp") {
        mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
    }
    else if (event == "middleMouseDown") {
        mouse_event(MOUSEEVENTF_MIDDLEDOWN, 0, 0, 0, 0);
    }
    else if (event == "middleMouseUp") {
        mouse_event(MOUSEEVENTF_MIDDLEUP, 0, 0, 0, 0);
    }
    else if (event == "mousewheel") {
        int x = doc["y"].GetInt();
        mouse_event(MOUSEEVENTF_WHEEL, 0, 0, x, 0);
    }
    else if (event == "keyDown") {
        int keyCode = doc["keyCode"].GetInt();
        keybd_event(keyCode, 0, 0, 0);
    }
    else if (event == "keyUp") {
        int keyCode = doc["keyCode"].GetInt();
        keybd_event(keyCode, 0, KEYEVENTF_KEYUP, 0);
    }
}