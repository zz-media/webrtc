#pragma once

#include "api/peer_connection_interface.h"
#include "sio_socket.h"
//DataChannelObserver https://blog.csdn.net/doitsjz/article/details/51926583
class Conductor : public webrtc::PeerConnectionObserver, public webrtc::CreateSessionDescriptionObserver, public webrtc::DataChannelObserver{

public:


    Conductor();
public:
    ~Conductor();
    bool InitializePeerConnection();
    bool CreatePeerConnection();
    void AddTracks();
    void createDataChannel();
    void DeletePeerConnection();

    void initSocketio(std::shared_ptr<sio::socket> current_socket, std::string roomId);
    void createOffer();
    void getAnswer(const std::string& sdp);
    void getCandidate(const std::string& sdp, int sdp_mline_index, const std::string& sdp_mid);

    // PeerConnectionObserver implementation.
    void OnSignalingChange(webrtc::PeerConnectionInterface::SignalingState new_state) override { std::cout << "OnSignalingChange:" << new_state << std::endl; }
    void OnAddTrack(rtc::scoped_refptr<webrtc::RtpReceiverInterface> receiver,const std::vector<rtc::scoped_refptr<webrtc::MediaStreamInterface>>& streams) override;
    void OnRemoveTrack(rtc::scoped_refptr<webrtc::RtpReceiverInterface> receiver) override;
    void OnDataChannel(rtc::scoped_refptr<webrtc::DataChannelInterface> channel) override;
    void OnRenegotiationNeeded() override {}
    void OnIceConnectionChange(webrtc::PeerConnectionInterface::IceConnectionState new_state) override {}
    void OnIceGatheringChange(webrtc::PeerConnectionInterface::IceGatheringState new_state) override {}
    void OnIceCandidate(const webrtc::IceCandidateInterface* candidate) override;
    void OnIceConnectionReceivingChange(bool receiving) override {}

    // CreateSessionDescriptionObserver implementation.
    void OnSuccess(webrtc::SessionDescriptionInterface* desc) override;
    void OnFailure(webrtc::RTCError error) override;

    //DataChannelObserver implementation
    void OnMessage(const webrtc::DataBuffer& buffer) override;
    void OnStateChange() override;

protected:
    std::shared_ptr<sio::socket> current_socket_;
    std::string roomId_;
    rtc::scoped_refptr<webrtc::PeerConnectionFactoryInterface> peer_connection_factory_;
    rtc::scoped_refptr<webrtc::PeerConnectionInterface> peer_connection_;
    rtc::scoped_refptr<webrtc::DataChannelInterface> data_channel_;

};