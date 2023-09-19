#include "MyCapturer.h"
#include "rtc_base/thread.h"
#include <modules/desktop_capture/desktop_capture_options.h>
#include <third_party/libyuv/include/libyuv.h>
#include "rtc_base/logging.h"

MyCapturer::MyCapturer() {

}

//EnumChildWindows回调函数，hwnd为指定的父窗口  
BOOL CALLBACK EnumChildWindowsProc(HWND hWnd, LPARAM lParam)
{
    char WindowTitle[100] = { 0 };
    ::GetWindowTextA(hWnd, WindowTitle, 100);
    //printf("%s\n", WindowTitle);

    return true;
}

static HWND ghWnd = 0;
bool bFD = false;
//EnumWindows回调函数，hwnd为发现的顶层窗口  
BOOL CALLBACK EnumWindowsProc(HWND hWnd, LPARAM lParam)
{
    if (GetParent(hWnd) == NULL && IsWindowVisible(hWnd))  //判断是否顶层窗口并且可见  
    {
        char WindowTitle[100] = { 0 };
        ::GetWindowTextA(hWnd, WindowTitle, 100);
        //printf("%s\n", WindowTitle);
        RTC_LOG(LS_WARNING) << "xxxxxxxxxxxxxxxxxxxxxxx,Windows Title:" << WindowTitle;

        char szWndClass[128] = "\0";
        HWND hwnd = ::GetFocus();
        ::GetClassNameA(hWnd, szWndClass, 127);
        RTC_LOG(LS_WARNING) << "xxxxxxxxxxxxxxxxxxxxxxx,Windows type:" << szWndClass;
        if (!strcmp(WindowTitle, "WebRTC") && !bFD)
            //if (!strncmp(WindowTitle, "GitHub",6) && !bFD)
            //if (!strcmp(WindowTitle, "闹钟和时钟") && !bFD)
        {
            bFD = true;
            RTC_LOG(LS_WARNING) << "qqqqqqqqqqqqqqqqqqqqqqqxxxxxxxxxxxxxxxxxxxxxxx,Windows Title:" << WindowTitle;
            ghWnd = hWnd;

            char szWndClass[128] = "\0";
            HWND hwnd = ::GetFocus();
            ::GetClassNameA(ghWnd, szWndClass, 127);
            RTC_LOG(LS_WARNING) << "qqqqqqqqqqqqqqqqqqqqqqqxxxxxxxxxxxxxxxxxxxxxxx,Windows type:" << szWndClass;
        }
        EnumChildWindows(hWnd, EnumChildWindowsProc, NULL); //获取父窗口的所有子窗口  
    }

    return true;
}

void MyCapturer::startCapturer() {
    auto options = webrtc::DesktopCaptureOptions::CreateDefault();
    options.set_allow_directx_capturer(true);
    //options.set_use_update_notifications(true);
    options.set_disable_effects(false);
    //options.set_detect_updated_region(true);
    //capturer_ = webrtc::DesktopCapturer::CreateScreenCapturer(options);

    capturer_ = webrtc::CroppingWindowCapturer::CreateWindowCapturer(options);
    //webrtc::DesktopRegion dregion;

    webrtc::DesktopCapturer::SourceList sources;
    capturer_->GetSourceList(&sources);
    if (sources.size() <= 0) {
        return;
    }

    for (int i = 0; i < sources.size(); i++)
    {
        //RTC_LOG(LS_WARNING) << "xxxxxxxxxxxxxxxxxxxxxxx,Windows Title:" << sources[i].title;
        //::MessageBoxA(NULL, sources[i].title.c_str(), "show",0);
    }

    HWND hd = GetDesktopWindow();

    //得到屏幕上第一个子窗口  
    hd = GetWindow(hd, GW_CHILD);
    char s[200] = { 0 };

    EnumWindows(EnumWindowsProc, NULL);

    //循环得到所有的子窗口  
    //while (hd != NULL)
    //{
    //    memset(s, 0, 200);
    //    GetWindowTextA(hd, s, 200);
    //    /*if (strstr(s,"QQ2012"))
    //    {
    //        cout<<s<<endl;
    //        SetWindowText(hd,"My Windows");
    //    }*/
    //    RTC_LOG(LS_WARNING) << "xxxxxxxxxxxxxxxxxxxxxxx,Windows Title:" << s;

    //    hd = GetNextWindow(hd, GW_HWNDNEXT);
    //}

   //webrtc::DesktopSize ds;
   //ds.set(100, 100);
   //webrtc::DesktopRect drect = webrtc::DesktopRect::MakeSize(ds);
   //dregion.SetRect(drect);
   //webrtc::WindowId wid = (webrtc::WindowId)GetDesktopWindow();
    webrtc::WindowId wid = (webrtc::WindowId)ghWnd;
    if (sources.size() > 2)
    {
        // capturer_->SelectSource(-1);  //将桌面采集挂起  zhengqf

        capturer_->SelectSource(wid);
        //capturer_->SetExcludedWindow(sources[sources.size() - 1].id);
        //capturer_->SelectSource(sources[sources.size() - 1].id);

    }
    else
        capturer_->SelectSource(wid);




    capturer_->Start(this);
    CaptureFrame();
}

webrtc::MediaSourceInterface::SourceState MyCapturer::state() const {
    return webrtc::MediaSourceInterface::kLive;
}

bool MyCapturer::remote() const {
    return true;
}

bool MyCapturer::is_screencast() const {
    return true;
}

absl::optional<bool> MyCapturer::needs_denoising() const {
    return false;
}

void MyCapturer::OnCaptureResult(webrtc::DesktopCapturer::Result result,
    std::unique_ptr<webrtc::DesktopFrame> frame) {
    //RTC_LOG(WARNING) << "z------------++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++";
    if (result != webrtc::DesktopCapturer::Result::SUCCESS)
        return;

    int width = frame->size().width();
    int height = frame->size().height();

    if (!i420_buffer_.get() ||
        i420_buffer_->width() * i420_buffer_->height() < width * height) {
        //i420_buffer_ = webrtc::I420Buffer::Create(width-200, height-200);
        i420_buffer_ = webrtc::I420Buffer::Create(width, height);
    }
    //libyuv::ConvertToI420(frame->data(), 0, i420_buffer_->MutableDataY(),
    //                      i420_buffer_->StrideY(), i420_buffer_->MutableDataU(),
    //                      i420_buffer_->StrideU(), i420_buffer_->MutableDataV(),
    //                      i420_buffer_->StrideV(), 200, 100, width, height, width-100,
    //                      height-200, libyuv::kRotate0, libyuv::FOURCC_ARGB);  //视频数据导入  zhengqf

    libyuv::ConvertToI420(frame->data(), 0, i420_buffer_->MutableDataY(),
        i420_buffer_->StrideY(), i420_buffer_->MutableDataU(),
        i420_buffer_->StrideU(), i420_buffer_->MutableDataV(),
        i420_buffer_->StrideV(), 0, 0, width, height, width,
        height, libyuv::kRotate0, libyuv::FOURCC_ARGB);  //视频数据导入  zhengqf

    OnFrame(webrtc::VideoFrame(i420_buffer_, 0, 0, webrtc::kVideoRotation_0));
}

void MyCapturer::OnMessage(rtc::Message* msg) {
    if (msg->message_id == 0)
        CaptureFrame();
}

void MyCapturer::CaptureFrame() {
    capturer_->CaptureFrame();

    rtc::Location loc(__FUNCTION__, __FILE__);
    rtc::Thread::Current()->PostDelayed(loc, 33, this, 0);
}