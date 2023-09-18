#include "sio_client.h"

#include <functional>
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <string>

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
    string roomId = "room3";

    socket::ptr current_socket;
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

        message::list dataList = edata.get_messages();
        message::ptr roomid = dataList.at(0);
        std::cout << "roomid:" << roomid->get_string() << std::endl;
        message::ptr data = dataList.at(1);
        std::cout << "data type:" << data->get_map()["type"]->get_string() << std::endl;

        message::list messageList;
        messageList.push(string_message::create("room1"));
        messageList.push(string_message::create("{\"message\":\"hello world message\"}"));
        current_socket->emit("message", messageList);
        _lock.unlock();

    }));
    current_socket->emit("join", roomId);


    getchar();
	return 0;
}

