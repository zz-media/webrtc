cmake_minimum_required (VERSION 3.8)
project(socketio-client-r)

include_directories(E:/clib/boost_1_79_0)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/lib/websocketpp)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/lib/rapidjson/include)

aux_source_directory(${CMAKE_CURRENT_SOURCE_DIR}/src SRC_LIST)

add_executable (socketio-client-r ${SRC_LIST})




