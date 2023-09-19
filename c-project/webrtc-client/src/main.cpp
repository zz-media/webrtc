#include "sio_client.h"

#include <functional>
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <string>

#include <rtc_base/win32_socket_init.h>
#include <rtc_base/win32_socket_server.h>

#include "conductor.h"


using namespace sio;

std::mutex _lock;
std::condition_variable_any _cond;
bool connect_finish = false;

class connection_listener
{
    sio::client &handler;

public:
    
    connection_listener(sio::client& h):
    handler(h)
    {
    }
    void on_connected()
    {
        _lock.lock();
        _cond.notify_all();
        connect_finish = true;
        _lock.unlock();
    }
    void on_close(client::close_reason const& reason)
    {
        std::cout<<"sio closed "<<std::endl;
        exit(0);
    }
    void on_fail()
    {
        std::cout<<"sio failed "<<std::endl;
        exit(0);
    }
};

int main(int argc, const char* args[])
{

    rtc::WinsockInitializer winsock_init;
    rtc::Win32SocketServer w32_ss;
    rtc::Win32Thread w32_thread(&w32_ss);
    rtc::ThreadManager::Instance()->SetCurrentThread(&w32_thread);

    //Conductor conductor;//rtc::RefCountInterface
    rtc::scoped_refptr<Conductor> conductor(new rtc::RefCountedObject<Conductor>());
    conductor->InitializePeerConnection();

    string roomId = "room1";

    
    sio::client sioClient;
    connection_listener connectionListener(sioClient);
    
    sioClient.set_open_listener(std::bind(&connection_listener::on_connected, &connectionListener));
    sioClient.set_close_listener(std::bind(&connection_listener::on_close, &connectionListener,std::placeholders::_1));
    sioClient.set_fail_listener(std::bind(&connection_listener::on_fail, &connectionListener));
    sioClient.connect("http://127.0.0.1:80");
    _lock.lock();
    if(!connect_finish)
    {
        _cond.wait(_lock);
    }
    _lock.unlock();
    std::shared_ptr<sio::socket> current_socket;
	current_socket = sioClient.socket();

	current_socket->on("joined", sio::socket::event_listener_aux([&](string const& name, message::ptr const& data, bool isAck,message::ptr &ack_resp){
        _lock.lock();
        std::cout << "joined" << std::endl;
        _lock.unlock();
        //current_socket->off("login");
    }));
    current_socket->on("otherjoin", sio::socket::event_listener_aux([&](string const& name, message::ptr const& data, bool isAck, message::ptr& ack_resp) {
        _lock.lock();
        std::cout << "otherjoin" << std::endl;

        _lock.unlock();

     }));
    current_socket->on("bye", sio::socket::event_listener_aux([&](string const& name, message::ptr const& data, bool isAck, message::ptr& ack_resp) {
        _lock.lock();
        std::cout << "bye" << std::endl;

        _lock.unlock();

    }));
    current_socket->on("message", sio::socket::event_listener([&](event& edata) {
        _lock.lock();

        sio::message::list dataList = edata.get_messages();
        sio::message::ptr roomid = dataList.at(0);
        std::cout << "roomid:" << roomid->get_string() << std::endl;
        sio::message::ptr data = dataList.at(1);

        std::string type = data->get_map()["type"]->get_string();
        std::cout << "data type:" << type << std::endl;
        if (type == "need_offer") {
            std::cout << "need_offer match" << type << std::endl;
            conductor->createOffer();
        }
        else if (type == "answer") {
            std::cout << "get answer" << type << std::endl;
            std::string sdp = data->get_map()["sdp"]->get_string();
            std::cout << sdp << std::endl;
            conductor->getAnswer(sdp);

        }
        else if (type == "candidate") {
            std::string sdp = data->get_map()["candidate"]->get_string();
            int sdp_mline_index = data->get_map()["label"]->get_int();
            std::string sdp_mid = data->get_map()["id"]->get_string();
            conductor->getCandidate(sdp, sdp_mline_index, sdp_mid);
        }
        _lock.unlock();

    }));


    conductor->initSocketio(current_socket);
    current_socket->emit("join", roomId);
    // Main loop.
    MSG msg;
    BOOL gm;
    ::DispatchMessage(&msg);
    while ((gm = ::GetMessage(&msg, NULL, 0, 0)) != 0 && gm != -1) {
        ::DispatchMessage(&msg);
        //if (!wnd.PreTranslateMessage(&msg)) {
        ////    //::TranslateMessage(&msg);
        //    ::DispatchMessage(&msg);
        //}
    }

	return 0;
}

