#include <windows.h>

extern "C" __declspec(dllexport) int add(int a, int b) {
    return a + b;
};

extern "C" __declspec(dllexport) int mouseMove(int x, int y) {
    SetCursorPos(x, y);
    return 0;
}

extern "C" __declspec(dllexport) int leftClick() {
    mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    return 0;
}

extern "C" __declspec(dllexport) int rightClick() {
    mouse_event(MOUSEEVENTF_RIGHTDOWN | MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
    return 0;
}


extern "C" __declspec(dllexport) int dbClick() {
    mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    return 0;
}

extern "C" __declspec(dllexport) int dragMove(float x, float y) {
    mouse_event(MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE, x * 65536, y * 65536, 0, 0);
    return 0;
}
// leftdown 和leftup 配置做拖拽用的
extern "C" __declspec(dllexport) int leftDown() {
    mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
    return 0;
}

extern "C" __declspec(dllexport) int leftUp() {
    mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    return 0;
}

extern "C" __declspec(dllexport) void mouseWheel(int x)
{
    mouse_event(MOUSEEVENTF_WHEEL, 0, 0, x, 0);
}

extern "C" __declspec(dllexport) void keybord(int argv)
{

    keybd_event(argv, 0, 0, 0);
    keybd_event(argv, 0, KEYEVENTF_KEYUP, 0);

}