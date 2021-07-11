FROM ubuntu:bionic
RUN apt-get update && apt install -y wget \
  python3 \
  python3-pip \
  locales \
  curl \
  gnupg2 \
  lsb-release

# INSTALL ROS2 ELOQUENT
RUN locale-gen en_US en_US.UTF-8
RUN update-locale LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
ENV LANG=en_US.UTF-8
RUN curl -s https://raw.githubusercontent.com/ros/rosdistro/master/ros.asc | apt-key add -
RUN sh -c 'echo "deb [arch=$(dpkg --print-architecture)] http://packages.ros.org/ros2/ubuntu $(lsb_release -cs) main" > /etc/apt/sources.list.d/ros2-latest.list'
RUN apt update && DEBIAN_FRONTEND=noninteractive apt install -y ros-eloquent-ros-base
                                                                #ros-eloquent-desktop

# wget --no-check-certificate https://github.com/nlohmann/json/blob/develop/single_include/nlohmann/json.hpp

#VY SOURCE ubuntu:bionic
