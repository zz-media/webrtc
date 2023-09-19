cmake_minimum_required (VERSION 3.8)
project(webrtc-client)

add_definitions(-DWEBRTC_WIN)
#WIN32 NDEBUG _WINDOWS WEBRTC_WIN CMAKE_INTDIR="Release" NOMINMAX WIN32_LEAN_AND_MEAN _CRT_SECURE_NO_WARNINGS _CONSOLE
add_definitions(-DWIN32)
add_definitions(-DNDEBUG)
add_definitions(-DNOMINMAX)
add_definitions(-DWIN32_LEAN_AND_MEAN)
add_definitions(-D_CRT_SECURE_NO_WARNINGS)
add_definitions(-D_CONSOLE)


include_directories(E:/clib/boost_1_79_0)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/lib/websocketpp)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/lib/rapidjson/include)

include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include/webrtc/include)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include/webrtc/include/third_party/abseil-cpp)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include/webrtc/include/third_party/jsoncpp/source/include)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include/webrtc/include/third_party/libyuv)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include/webrtc/include/third_party/libyuv/include)

aux_source_directory(${CMAKE_CURRENT_SOURCE_DIR}/src SRC_LIST)

link_directories("E:/clib/webrtc/lib64")
add_executable (webrtc-client ${SRC_LIST})
# winmm LNK2019	无法解析的外部符号 __imp_timeGetTime，函数 "__int64 __cdecl rtc::SystemTimeNanos(void)" (?SystemTimeNanos@rtc@@YA_JXZ) 中引用了该符号
# json.obj json_reader.obj json_value.obj json_writer.obj
target_link_libraries(webrtc-client webrtc ws2_32 winmm secur32 iphlpapi crypt32 dmoguids wmcodecdspuuid wmcodecdspuuid amstrmid msdmo d3d11 dxgi)

#cmake 检测到“RuntimeLibrary”的不匹配项: 值“MT_StaticRelease”不匹配值“MD_DynamicRelease”
#https://blog.csdn.net/10km/article/details/51735432
if(MSVC)     
    # Use the static C library for all build types
    foreach(var 
        CMAKE_C_FLAGS CMAKE_C_FLAGS_DEBUG CMAKE_C_FLAGS_RELEASE
        CMAKE_C_FLAGS_MINSIZEREL CMAKE_C_FLAGS_RELWITHDEBINFO
        CMAKE_CXX_FLAGS CMAKE_CXX_FLAGS_DEBUG CMAKE_CXX_FLAGS_RELEASE
        CMAKE_CXX_FLAGS_MINSIZEREL CMAKE_CXX_FLAGS_RELWITHDEBINFO
      )
      if(${var} MATCHES "/MD")
        string(REGEX REPLACE "/MD" "/MT" ${var} "${${var}}")
      endif()
    endforeach()    
endif(MSVC)






