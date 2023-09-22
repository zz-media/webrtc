#include <iostream>

#include "conductor.h"
#include "MyCapturer.h"
#include "MyScreenCapture.h"
//#include "DesktopCtrlDataChannelObserver.h"

#include "api/create_peerconnection_factory.h"
#include "api/audio_codecs/audio_decoder_factory.h"
#include "api/audio_codecs/audio_encoder_factory.h"
#include "api/audio_codecs/builtin_audio_decoder_factory.h"
#include "api/audio_codecs/builtin_audio_encoder_factory.h"
#include "api/video_codecs/builtin_video_decoder_factory.h"
#include "api/video_codecs/builtin_video_encoder_factory.h"
#include "api/video_codecs/video_decoder_factory.h"
#include "api/video_codecs/video_encoder_factory.h"

#include "sio_socket.h"
#include "rtc_base/strings/json.h"

#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"


class DummySetSessionDescriptionObserver : public webrtc::SetSessionDescriptionObserver {
public:
    static DummySetSessionDescriptionObserver* Create() {
        return new rtc::RefCountedObject<DummySetSessionDescriptionObserver>();
    }
    virtual void OnSuccess() { 
        RTC_LOG(INFO) << __FUNCTION__; 
    }
    virtual void OnFailure(webrtc::RTCError error) {
        RTC_LOG(INFO) << __FUNCTION__ << " " << ToString(error.type()) << ": " << error.message();
    }
};

Conductor::Conductor(){

}

Conductor::~Conductor() {

}

bool Conductor::InitializePeerConnection() {
	std::cout << "InitializePeerConnection" << std::endl;
    //RTC_DCHECK(!peer_connection_factory_);
    //RTC_DCHECK(!peer_connection_);

    peer_connection_factory_ = webrtc::CreatePeerConnectionFactory(
        nullptr /* network_thread */, nullptr /* worker_thread */,
        nullptr /* signaling_thread */, nullptr /* default_adm */,
        webrtc::CreateBuiltinAudioEncoderFactory(),
        webrtc::CreateBuiltinAudioDecoderFactory(),
        webrtc::CreateBuiltinVideoEncoderFactory(),
        webrtc::CreateBuiltinVideoDecoderFactory(), nullptr /* audio_mixer */,
        nullptr /* audio_processing */);
    if (!peer_connection_factory_) {
        std::cout << "Failed to initialize PeerConnectionFactory" << std::endl;
        //DeletePeerConnection();
        return false;
    }
    if (!CreatePeerConnection(/*dtls=*/true)) {
        //main_wnd_->MessageBox("Error", "CreatePeerConnection failed", true);
        std::cout << "CreatePeerConnection failed" << std::endl;
        //DeletePeerConnection();
    }


    AddTracks();

    //std::string lable = "sendDataChannel";
    //rtc::scoped_refptr<DesktopCtrlDataChannelObserver> observer = new rtc::RefCountedObject<DesktopCtrlDataChannelObserver>();
    //DesktopCtrlDataChannelObserver* observer = new DesktopCtrlDataChannelObserver();
    //observer->SetDataChannel(data_channel);

    webrtc::DataChannelInit dataChannelInit;
    data_channel_ = peer_connection_->CreateDataChannel("sendDataChannel", &dataChannelInit);
    data_channel_->RegisterObserver(this);

    return peer_connection_ != nullptr;
}
bool Conductor::CreatePeerConnection(bool dtls) {

    webrtc::PeerConnectionInterface::RTCConfiguration config;
    config.sdp_semantics = webrtc::SdpSemantics::kUnifiedPlan;
    config.enable_dtls_srtp = dtls;
    webrtc::PeerConnectionInterface::IceServer server;


    webrtc::PeerConnectionInterface::IceServer server2;
    //turnserver
    server2.uri = "stun:stun.l.google.com:19302";

    server.uri = "turn:rtctest.zdomain.top:3478";
    server.username = "admin";
    server.password = "123456";

    config.servers.push_back(server2);
    //config.servers.push_back(server);

    peer_connection_ = peer_connection_factory_->CreatePeerConnection(config, nullptr, nullptr, this);
    return peer_connection_ != nullptr;
}
void Conductor::AddTracks() {  //音视频操控
    if (!peer_connection_->GetSenders().empty()) {
        std::cout << "AddTracks:Already added tracks" << std::endl;
        return;  // Already added tracks.
    }
    const char kAudioLabel[] = "audio_label";
    const char kVideoLabel[] = "video_label";
    const char kStreamId[] = "stream_id";

    rtc::scoped_refptr<webrtc::AudioTrackInterface> audio_track(
        peer_connection_factory_->CreateAudioTrack(
            kAudioLabel, peer_connection_factory_->CreateAudioSource(
                cricket::AudioOptions())));
    auto result_or_error = peer_connection_->AddTrack(audio_track, { kStreamId });
    if (!result_or_error.ok()) {
        RTC_LOG(LS_ERROR) << "Failed to add audio track to PeerConnection: "
            << result_or_error.error().message();
    }

    //audio_track->set_enabled(false);
    //rtc::scoped_refptr<CapturerTrackSource> video_device = CapturerTrackSource::Create();
    rtc::scoped_refptr<MyScreenCapture> video_device = new rtc::RefCountedObject<MyScreenCapture>();
    if (video_device) {
        video_device->startCapturer();
        rtc::scoped_refptr<webrtc::VideoTrackInterface> video_track_(
            peer_connection_factory_->CreateVideoTrack(kVideoLabel, video_device));
        //main_wnd_->StartLocalRenderer(video_track_);
        result_or_error = peer_connection_->AddTrack(video_track_, { kStreamId });//video_track_->set_enabled(false);//开关视频
        if (!result_or_error.ok()) {
            RTC_LOG(LS_ERROR) << "Failed to add video track to PeerConnection: " << result_or_error.error().message();
        }
    }
    else {
        RTC_LOG(LS_ERROR) << "OpenVideoCaptureDevice failed";
    }

    //main_wnd_->SwitchToStreamingUI();
}

void Conductor::initSocketio(std::shared_ptr<sio::socket> current_socket) {
    //RTC_LOG(INFO) << "initSocketio";
    std::cout << "initSocketio" << std::endl;
    current_socket_ = current_socket;

    //sio::string roomId = "room1";
    //current_socket_->emit("join", roomId);
}

void Conductor::createOffer() {
    std::cout << "void Conductor::createOffer" << std::endl;
    peer_connection_->CreateOffer(this, webrtc::PeerConnectionInterface::RTCOfferAnswerOptions());
    std::cout << "void Conductor::createOffer success" << std::endl;
}

void Conductor::getAnswer(const std::string& sdp) {

    std::unique_ptr<webrtc::SessionDescriptionInterface> session_description = webrtc::CreateSessionDescription(webrtc::SdpType::kAnswer, sdp);
    peer_connection_->SetRemoteDescription(DummySetSessionDescriptionObserver::Create(), session_description.release());
    std::cout << "set answer sdp" << std::endl;

    //sio::message::list messageList;
    //messageList.push(sio::string_message::create("room1"));
    //messageList.push(sio::string_message::create("{\"message\":\"hello world message ananan x\"}"));
    //current_socket_->emit("message", messageList);
}

void Conductor::getCandidate(const std::string& sdp, int sdp_mline_index, const std::string& sdp_mid) {
    webrtc::SdpParseError error;
    std::unique_ptr<webrtc::IceCandidateInterface> candidate(webrtc::CreateIceCandidate(sdp_mid, sdp_mline_index, sdp, &error));
    if (!candidate.get()) {
        RTC_LOG(WARNING) << "Can't parse received candidate message. " << "SdpParseError was: " << error.description;
        return;
    }
    if (!peer_connection_->AddIceCandidate(candidate.get())) {
        RTC_LOG(WARNING) << "Failed to apply the received candidate";
        return;
    }
    RTC_LOG(INFO) << " Received candidate :";

    //sio::message::list messageList;
    //messageList.push(sio::string_message::create("room1"));
    //messageList.push(sio::string_message::create("{\"message\":\"hello world message cacaca x\"}"));
    //current_socket_->emit("message", messageList);
}

// PeerConnectionObserver implementation.
void Conductor::OnAddTrack(
    rtc::scoped_refptr<webrtc::RtpReceiverInterface> receiver,
    const std::vector<rtc::scoped_refptr<webrtc::MediaStreamInterface>>&
    streams) {
    //RTC_LOG(INFO) << __FUNCTION__ << " " << receiver->id();
    std::cout << "OnAddTrack" << std::endl;

}

void Conductor::OnRemoveTrack(
    rtc::scoped_refptr<webrtc::RtpReceiverInterface> receiver) {
    //RTC_LOG(INFO) << __FUNCTION__ << " " << receiver->id();
    std::cout << "OnRemoveTrack" << std::endl;

}
void Conductor::OnIceCandidate(const webrtc::IceCandidateInterface* candidate) {
    int sdp_mline_index = candidate->sdp_mline_index();
    std::string sdp_mid = candidate->sdp_mid();
    std::string sdp;
    candidate->ToString(&sdp);

    //sio::message::list messageList;
    //messageList.push(sio::string_message::create("room1"));
    //Json::StyledWriter writer;
    //Json::Value data;
    //data["type"] = "candidate";
    //data["label"] = sdp_mline_index;
    //data["candidate"] = sdp;
    //data["sdp_mid"] = sdp_mid;

    //std::string dataStr = writer.write(data);
    //messageList.push(sio::string_message::create(dataStr));
    //current_socket_->emit("message", messageList);

    sio::message::list messageList;
    messageList.push(sio::string_message::create("roomc"));
    // 创建一个空的 JSON 文档
    rapidjson::Document jsonDoc;
    rapidjson::Document::AllocatorType& allocator = jsonDoc.GetAllocator();
    // 添加数据到 JSON 文档
    jsonDoc.SetObject();
    jsonDoc.AddMember("type", "candidate", allocator);
    jsonDoc.AddMember("label", sdp_mline_index, allocator);
    jsonDoc.AddMember("candidate", rapidjson::StringRef(sdp.c_str(), sdp.length()), allocator);
    jsonDoc.AddMember("sdp_mid", rapidjson::StringRef(sdp_mid.c_str(), sdp_mid.length()), allocator);

    rapidjson::StringBuffer buffer;
    rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
    jsonDoc.Accept(writer);
    std::string jsonString = buffer.GetString();
    std::cout << "candidate JSON: " << jsonString << std::endl;
    messageList.push(sio::string_message::create(jsonString));
    current_socket_->emit("message", messageList);
}

// PeerConnectionClientObserver implementation.

//offer OnSuccess
void Conductor::OnSuccess(webrtc::SessionDescriptionInterface* desc) {
    std::cout << "offer OnSuccess" << std::endl;
    peer_connection_->SetLocalDescription(DummySetSessionDescriptionObserver::Create(), desc);
    std::string sdp;
    desc->ToString(&sdp);
    std::cout << "sdp:----------------------------" << std::endl;
    std::cout << sdp << std::endl;
    std::cout << "webrtc::SdpTypeToString(desc->GetType()):----------------------------" << std::endl;
    std::cout << webrtc::SdpTypeToString(desc->GetType()) << std::endl;
    std::cout << "----------------------------" << std::endl;

    sio::message::list messageList;
    messageList.push(sio::string_message::create("roomc"));

    // 创建一个空的 JSON 文档
    rapidjson::Document jsonDoc;
    rapidjson::Document::AllocatorType& allocator = jsonDoc.GetAllocator();
    // 添加数据到 JSON 文档
    jsonDoc.SetObject();
    jsonDoc.AddMember("type", rapidjson::StringRef(webrtc::SdpTypeToString(desc->GetType())), allocator);
    jsonDoc.AddMember("sdp", rapidjson::StringRef(sdp.c_str(), sdp.length()), allocator);
    rapidjson::StringBuffer buffer;
    rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
    jsonDoc.Accept(writer);
    std::string jsonString = buffer.GetString();
    //std::cout << "Generated JSON: " << jsonString << std::endl;
    messageList.push(sio::string_message::create(jsonString));
    current_socket_->emit("message", messageList);

    //Json::StyledWriter writer;
    //Json::Value data;
    //data["type"] = webrtc::SdpTypeToString(desc->GetType());
    //data["sdp"] = sdp;
    //std::string dataStr = writer.write(data);
    //messageList.push(sio::string_message::create(dataStr));
    //current_socket_->emit("message", messageList);
}

void Conductor::OnFailure(webrtc::RTCError error) {
    std::cout << "offer OnFailure" << ToString(error.type()) << ": " << error.message();
}

void Conductor::OnMessage(const webrtc::DataBuffer& buffer) {
    // 处理接收到的数据
    printf("OnMessage %s\n",buffer.data.data());
    // 获取数据缓冲区的指针和实际长度
    const void* dataPtr = buffer.data.data();
    size_t dataSize = buffer.size();
    // 创建一个新的 char 数组，并复制数据
    char* data = new char[dataSize + 1]; // +1 用于 null 终止符
    std::memcpy(data, dataPtr, dataSize);

    // 添加 null 终止符
    data[dataSize] = '\0';
    printf("data=%s\n", data);

    rapidjson::Document doc;
    doc.Parse(data);
    
    if (doc.HasMember("event") && doc["event"].IsString()) {
        std::string event = doc["event"].GetString();
        if (event == "mousemove") {
            std::string x = doc["x"].GetString();
            std::string y = doc["y"].GetString();
            float floatX = std::stof(x);
            float floatY = std::stof(y);
            int intX = 1920 * floatX;
            int intY = 1080 * floatY;
            if (intX < 0) {
                intX = 0;
            }else if (intX > 1920) {
                intX = 1920;
            }
            if (intY < 0) {
                intY = 0;
            }else if(intY > 1080){
                intY = 1080;
            }
            std::cout << "event：" << event << ",x:" << intX << ",y:" << intY << std::endl;
            SetCursorPos(intX, intY);
        }else if(event == "click"){
            mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
        }else if(event == "click"){
            mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
        }else if (event == "keyTap") {
            int keyCode = doc["keyCode"].GetInt();
            keybd_event(keyCode, 0, 0, 0);
            keybd_event(keyCode, 0, KEYEVENTF_KEYUP, 0);
        }

    }
}

void Conductor::OnStateChange() {
    printf("OnStateChange\n");
    webrtc::DataChannelInterface::DataState state = data_channel_->state();

    switch (state) {
    case webrtc::DataChannelInterface::kOpen:
        std::cout << "DataChannel is now open." << std::endl;
        data_channel_->Send(webrtc::DataBuffer("hello datachannel"));
        break;
    case webrtc::DataChannelInterface::kConnecting:
        std::cout << "DataChannel is connecting." << std::endl;
        break;
    case webrtc::DataChannelInterface::kClosing:
        std::cout << "DataChannel is closing." << std::endl;
        break;
    case webrtc::DataChannelInterface::kClosed:
        std::cout << "DataChannel is closed." << std::endl;
        break;
    }
}