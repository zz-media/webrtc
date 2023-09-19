#pragma once

#include "api/peer_connection_interface.h"
#include "sio_socket.h"

class Conductor : public webrtc::PeerConnectionObserver, public webrtc::CreateSessionDescriptionObserver {

public:


    Conductor();
public:
    ~Conductor();
    bool InitializePeerConnection();
    bool CreatePeerConnection(bool dtls);
    void AddTracks();

    void initSocketio(std::shared_ptr<sio::socket> current_socket);
    void createOffer();
    void getAnswer(const std::string& sdp);
    void getCandidate(const std::string& sdp, int sdp_mline_index, const std::string& sdp_mid);

    // PeerConnectionObserver implementation.
    void OnSignalingChange(
        webrtc::PeerConnectionInterface::SignalingState new_state) override {}
    void OnAddTrack(
        rtc::scoped_refptr<webrtc::RtpReceiverInterface> receiver,
        const std::vector<rtc::scoped_refptr<webrtc::MediaStreamInterface>>&
        streams) override;
    void OnRemoveTrack(
        rtc::scoped_refptr<webrtc::RtpReceiverInterface> receiver) override;
    void OnDataChannel(
        rtc::scoped_refptr<webrtc::DataChannelInterface> channel) override {}
    void OnRenegotiationNeeded() override {}
    void OnIceConnectionChange(
        webrtc::PeerConnectionInterface::IceConnectionState new_state) override {}
    void OnIceGatheringChange(
        webrtc::PeerConnectionInterface::IceGatheringState new_state) override {}
    void OnIceCandidate(const webrtc::IceCandidateInterface* candidate) override;
    void OnIceConnectionReceivingChange(bool receiving) override {}

    // CreateSessionDescriptionObserver implementation.
    void OnSuccess(webrtc::SessionDescriptionInterface* desc) override;
    void OnFailure(webrtc::RTCError error) override;

protected:
    std::shared_ptr<sio::socket> current_socket_;
    rtc::scoped_refptr<webrtc::PeerConnectionFactoryInterface> peer_connection_factory_;
    rtc::scoped_refptr<webrtc::PeerConnectionInterface> peer_connection_;

};