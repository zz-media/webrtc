#pragma once

#include "api/peer_connection_interface.h"

class Conductor {

public:


    Conductor();
public:
    ~Conductor();
    bool InitializePeerConnection();

protected:
    //rtc::scoped_refptr<webrtc::PeerConnectionInterface> peer_connection_;
    rtc::scoped_refptr<webrtc::PeerConnectionFactoryInterface> peer_connection_factory_;

};