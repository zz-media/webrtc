#include <iostream>

#include "conductor.h"

#include "api/create_peerconnection_factory.h"
#include "api/audio_codecs/audio_decoder_factory.h"
#include "api/audio_codecs/audio_encoder_factory.h"
#include "api/audio_codecs/builtin_audio_decoder_factory.h"
#include "api/audio_codecs/builtin_audio_encoder_factory.h"
#include "api/video_codecs/builtin_video_decoder_factory.h"
#include "api/video_codecs/builtin_video_encoder_factory.h"
#include "api/video_codecs/video_decoder_factory.h"
#include "api/video_codecs/video_encoder_factory.h"


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


	return false;
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


}
