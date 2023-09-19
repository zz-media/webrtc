#include "MyScreenCapture.h"
#include "rtc_base/thread.h"
#include <modules/desktop_capture/desktop_capture_options.h>
#include <third_party/libyuv/include/libyuv.h>
#include "rtc_base/logging.h"

MyScreenCapture::MyScreenCapture() {

}

void MyScreenCapture::startCapturer() {
    auto options = webrtc::DesktopCaptureOptions::CreateDefault();
    options.set_allow_directx_capturer(true);
    //options.set_use_update_notifications(true);
    options.set_disable_effects(false);
    //options.set_detect_updated_region(true);
    //捕获桌面
    capturer_ = webrtc::DesktopCapturer::CreateScreenCapturer(options);
    //捕获窗口
    //capturer_ = webrtc::CroppingWindowCapturer::CreateWindowCapturer(options);
    //webrtc::DesktopRegion dregion;

    webrtc::DesktopCapturer::SourceList sources;
    capturer_->GetSourceList(&sources);
    if (sources.size() <= 0) {
        return;
    }


    capturer_->SelectSource(sources[0].id);
    capturer_->Start(this);
    CaptureFrame();
}

webrtc::MediaSourceInterface::SourceState MyScreenCapture::state() const {
    return webrtc::MediaSourceInterface::kLive;
}

bool MyScreenCapture::remote() const {
    return true;
}

bool MyScreenCapture::is_screencast() const {
    return true;
}

absl::optional<bool> MyScreenCapture::needs_denoising() const {
    return false;
}

void MyScreenCapture::OnCaptureResult(webrtc::DesktopCapturer::Result result,
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
    //                      height-200, libyuv::kRotate0, libyuv::FOURCC_ARGB);  //视频数据导入

    libyuv::ConvertToI420(frame->data(), 0, i420_buffer_->MutableDataY(),
        i420_buffer_->StrideY(), i420_buffer_->MutableDataU(),
        i420_buffer_->StrideU(), i420_buffer_->MutableDataV(),
        i420_buffer_->StrideV(), 0, 0, width, height, width,
        height, libyuv::kRotate0, libyuv::FOURCC_ARGB);  //视频数据导入

    OnFrame(webrtc::VideoFrame(i420_buffer_, 0, 0, webrtc::kVideoRotation_0));
}

void MyScreenCapture::OnMessage(rtc::Message* msg) {
    if (msg->message_id == 0)
        CaptureFrame();
}

void MyScreenCapture::CaptureFrame() {
    capturer_->CaptureFrame();

    rtc::Location loc(__FUNCTION__, __FILE__);
    rtc::Thread::Current()->PostDelayed(loc, 33, this, 0);
}