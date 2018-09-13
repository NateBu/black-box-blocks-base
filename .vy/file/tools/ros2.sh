apt-get install -y curl
curl http://repo.ros2.org/repos.key | apt-key add -
sh -c 'echo "deb [arch=amd64,arm64] http://repo.ros2.org/ubuntu/main xenial main" > /etc/apt/sources.list.d/ros2-latest.list'
apt-get update
apt-get install -y `apt list "ros-ardent-*" 2> /dev/null | grep "/" | awk -F/ '{print $1}' | grep -v -e ros-ardent-ros1-bridge -e ros-ardent-turtlebot2- | tr "\n" " "`
# ENV ROS2_INSTALL /opt/ros/ardent
mv /opt/ros/ardent/* ./install